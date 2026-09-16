import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readUploadedWorkbook, readRows } from '@/lib/excel'
import { parseProjectRow, resolveProjectRow, PROJECT_HEADERS } from '@/lib/project-excel'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  let workbook
  try {
    workbook = await readUploadedWorkbook(file)
  } catch {
    return NextResponse.json({ error: 'Could not read that file. Make sure it is a valid .xlsx file.' }, { status: 400 })
  }

  const sheet = workbook.getWorksheet('Projects') ?? workbook.worksheets[0]
  if (!sheet) {
    return NextResponse.json({ error: 'No "Projects" sheet found in the uploaded file.' }, { status: 400 })
  }

  const rawRows = readRows(sheet, PROJECT_HEADERS.length)
  if (rawRows.length === 0) {
    return NextResponse.json({ error: 'No data rows found in the sheet.' }, { status: 400 })
  }
  if (rawRows.length > 500) {
    return NextResponse.json({ error: 'Please import 500 rows or fewer at a time.' }, { status: 400 })
  }

  const results = rawRows.map((values, i) => {
    const parsed = parseProjectRow(i + 2, values)
    const resolved = resolveProjectRow(parsed.raw)
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
