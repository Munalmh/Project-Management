import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { workbookResponse } from '@/lib/excel'
import { buildTicketTemplate, buildTicketExport } from '@/lib/ticket-excel'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as { id: string; role: string }
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode') === 'data' ? 'data' : 'template'

  const projectWhere = user.role === 'admin' ? {} : { members: { some: { userId: user.id } } }

  const projects = await db.project.findMany({
    where: projectWhere,
    include: { statuses: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { name: 'asc' },
  })

  if (mode === 'template') {
    const [priorities, users] = await Promise.all([
      db.ticketPriority.findMany({ orderBy: { level: 'asc' } }),
      db.user.findMany({ orderBy: { name: 'asc' } }),
    ])

    const workbook = await buildTicketTemplate({
      projects: projects.map((p) => ({ name: p.name, statuses: p.statuses.map((s) => s.name) })),
      priorities: priorities.map((p) => p.name),
      userEmails: users.map((u) => u.email),
    })

    return workbookResponse(workbook, 'tickets-import-template.xlsx')
  }

  // mode === 'data'
  const projectId = searchParams.get('projectId')
  const statusId = searchParams.get('status')
  const priorityId = searchParams.get('priority')
  const search = searchParams.get('search')

  const projectIds = projects.map((p) => p.id)

  // If a specific project was requested, make sure it's one the user can actually see —
  // otherwise silently fall back to "all visible projects" rather than leaking data.
  const scopedProjectIds =
    projectId && projectIds.includes(projectId) ? [projectId] : projectIds

  const where: Record<string, unknown> = {
    projectId: scopedProjectIds.length > 0 ? { in: scopedProjectIds } : 'none',
  }
  if (statusId) where.statusId = statusId
  if (priorityId) where.priorityId = priorityId
  if (search) where.title = { contains: search }

  const tickets = await db.ticket.findMany({
    where,
    include: {
      project: { select: { name: true } },
      status: true,
      priority: true,
      assignees: { include: { user: { select: { email: true } } } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const filename =
    projectId && scopedProjectIds.length === 1
      ? `tickets-export-${projects.find((p) => p.id === projectId)?.prefix ?? 'project'}.xlsx`
      : 'tickets-export.xlsx'

  const workbook = await buildTicketExport(tickets)
  return workbookResponse(workbook, filename)
}
