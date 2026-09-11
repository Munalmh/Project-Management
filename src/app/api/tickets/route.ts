import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const ticketSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  projectId: z.string().min(1),
  statusId: z.string().min(1),
  priorityId: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
})

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const search = searchParams.get('search')

  const user = session.user as { id: string; role: string }

  const where: Record<string, unknown> = {}
  if (projectId) where.projectId = projectId
  if (status) where.statusId = status
  if (priority) where.priorityId = priority
  if (search) where.title = { contains: search }

  if (user.role !== 'admin') {
    where.OR = [
      { project: { members: { some: { userId: user.id } } } },
      { assignees: { some: { userId: user.id } } },
      { createdById: user.id },
    ]
  }

  const tickets = await db.ticket.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, prefix: true, color: true } },
      status: true,
      priority: true,
      assignees: { include: { user: { select: { id: true, name: true } } } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(tickets)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = ticketSchema.parse(body)
    const userId = (session.user as { id: string }).id

    const ticket = await db.ticket.create({
      data: {
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        statusId: data.statusId,
        priorityId: data.priorityId,
        createdById: userId,
        startDate: data.startDate || null,
        dueDate: data.dueDate || null,
        assignees: data.assigneeIds
          ? { create: data.assigneeIds.map((uid: string) => ({ userId: uid })) }
          : undefined,
      },
      include: {
        project: { select: { name: true, prefix: true, color: true } },
        status: true,
        priority: true,
        assignees: { include: { user: { select: { id: true, name: true } } } },
        createdBy: { select: { name: true } },
      },
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}