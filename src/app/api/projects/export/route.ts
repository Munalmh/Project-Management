import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { workbookResponse } from '@/lib/excel'
import { buildProjectTemplate, buildProjectExport } from '@/lib/project-excel'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as { id: string; role: string }

  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode') === 'data' ? 'data' : 'template'

  if (mode === 'template') {
    const workbook = await buildProjectTemplate()
    return workbookResponse(workbook, 'projects-import-template.xlsx')
  }

  const projects = await db.project.findMany({
    where: user.role === 'admin' ? {} : { members: { some: { userId: user.id } } },
    orderBy: { name: 'asc' },
  })

  const workbook = await buildProjectExport(projects)
  return workbookResponse(workbook, 'projects-export.xlsx')
}
