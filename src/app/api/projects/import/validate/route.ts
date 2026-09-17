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

  let sheet = workbook.getWorksheet('Projects')
  
  if (!sheet) {
    for (const ws of workbook.worksheets) {
      const headerRow = ws.getRow(1).values as any[]
      const actualHeaders = (Array.isArray(headerRow) ? headerRow.slice(1) : []).map(h => {
        let v = h
        if (v && typeof v === 'object' && 'text' in v) v = v.text
        return String(v || '').trim()
      })
      if (actualHeaders[0] === PROJECT_HEADERS[0] && actualHeaders[1] === PROJECT_HEADERS[1]) {
        sheet = ws
        break
      }
    }
  }

  if (!sheet) {
    sheet = workbook.worksheets[0]
  }

  if (!sheet) {
    return NextResponse.json({ error: 'No data sheet found in the uploaded file.' }, { status: 400 })
  }

  const headerRow = sheet.getRow(1).values as any[]
  const actualHeaders = (Array.isArray(headerRow) ? headerRow.slice(1) : []).map(h => {
    let v = h
    if (v && typeof v === 'object' && 'text' in v) v = v.text
    return String(v || '').trim()
  })

  if (actualHeaders[0] !== PROJECT_HEADERS[0] || actualHeaders[1] !== PROJECT_HEADERS[1]) {
    return NextResponse.json({ 
      error: 'Invalid template format. Are you sure you uploaded a Projects template? Please use the "Template" button to get the correct format.' 
    }, { status: 400 })
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
