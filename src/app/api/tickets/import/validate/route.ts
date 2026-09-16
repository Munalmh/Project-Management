import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readUploadedWorkbook, readRows } from '@/lib/excel'
import { parseTicketRow, resolveTicketRow, buildTicketResolveContext, TICKET_HEADERS } from '@/lib/ticket-excel'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as { id: string; role: string }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  let workbook
  try {
    workbook = await readUploadedWorkbook(file)
  } catch {
    return NextResponse.json({ error: 'Could not read that file. Make sure it is a valid .xlsx file.' }, { status: 400 })
  }

  const sheet = workbook.getWorksheet('Tickets') ?? workbook.worksheets[0]
  if (!sheet) {
    return NextResponse.json({ error: 'No "Tickets" sheet found in the uploaded file.' }, { status: 400 })
  }

  const rawRows = readRows(sheet, TICKET_HEADERS.length)
  if (rawRows.length === 0) {
    return NextResponse.json({ error: 'No data rows found in the sheet.' }, { status: 400 })
  }
  if (rawRows.length > 1000) {
    return NextResponse.json({ error: 'Please import 1000 rows or fewer at a time.' }, { status: 400 })
  }

  const ctx = await buildTicketResolveContext(user.id, user.role)

  const results = rawRows.map((values, i) => {
    const parsed = parseTicketRow(i + 2, values) // +2: header is row 1, data starts row 2
    const resolved = resolveTicketRow(parsed.raw, ctx)
    return {
      rowNumber: parsed.rowNumber,
      raw: parsed.raw,
      valid: resolved.errors.length === 0,
      errors: resolved.errors,
    }
  })

  const validCount = results.filter((r) => r.valid).length

  return NextResponse.json({
    totalRows: results.length,
    validCount,
    invalidCount: results.length - validCount,
    rows: results,
  })
}
