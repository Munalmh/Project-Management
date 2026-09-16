import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getReportData } from '@/lib/report-data'
import { workbookResponse } from '@/lib/excel'
import { buildReportExport } from '@/lib/report-excel'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as { id: string; role: string; name?: string }
  const data = await getReportData(user.id, user.role)

  const workbook = await buildReportExport({
    ...data,
    generatedFor: user.name ?? 'Unknown user',
  })

  return workbookResponse(workbook, 'progress-report.xlsx')
}
