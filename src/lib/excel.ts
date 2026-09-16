import ExcelJS from 'exceljs'

/** Style a worksheet's header row (row 1) consistently across templates/exports. */
export function styleHeaderRow(sheet: ExcelJS.Worksheet) {
  const header = sheet.getRow(1)
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  header.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF6366F1' },
  }
  header.alignment = { vertical: 'middle' }
  header.height = 20
}

/** Auto-size columns roughly based on header + a sample of content. */
export function autoSizeColumns(sheet: ExcelJS.Worksheet, minWidth = 12, maxWidth = 40) {
  sheet.columns.forEach((col) => {
    let maxLen = minWidth
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0
      if (len > maxLen) maxLen = len
    })
    col.width = Math.min(maxLen + 2, maxWidth)
  })
}

/** Serialize a workbook to a downloadable NextResponse. */
export async function workbookResponse(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer()
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

/** Read an uploaded .xlsx file (from a multipart/form-data request) into a workbook. */
export async function readUploadedWorkbook(file: File): Promise<ExcelJS.Workbook> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  // Cast needed because exceljs's bundled @types/node identity can differ from the
  // project's, producing two structurally-identical but nominally distinct Buffer types.
  await workbook.xlsx.load(Buffer.from(arrayBuffer) as unknown as Parameters<typeof workbook.xlsx.load>[0])
  return workbook
}

/** Read all data rows (skipping the header) of a sheet as arrays of cell text values. */
export function readRows(sheet: ExcelJS.Worksheet, columnCount: number): string[][] {
  const rows: string[][] = []
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // header
    const values: string[] = []
    for (let c = 1; c <= columnCount; c++) {
      const cell = row.getCell(c)
      let v = cell.value
      if (v && typeof v === 'object' && 'text' in v) v = (v as { text: string }).text
      if (v instanceof Date) {
        values.push(v.toISOString().slice(0, 10))
      } else {
        values.push(v == null ? '' : String(v).trim())
      }
    }
    // Skip fully-empty rows
    if (values.some((v) => v !== '')) rows.push(values)
  })
  return rows
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Normalize a date cell value to a strict "YYYY-MM-DD" string, or null if it's empty.
 * Only accepts unambiguous formats (ISO order: year-month-day) — deliberately does NOT
 * try to guess locale-ambiguous formats like "09/13/2026", since silently misreading a
 * date is worse than rejecting it with a clear error.
 */
export function normalizeDate(raw: string): { value: string | null; error: string | null } {
  const trimmed = raw.trim()
  if (!trimmed) return { value: null, error: null }
  if (DATE_RE.test(trimmed)) return { value: trimmed, error: null }
  // Allow the same year-month-day order with slashes, e.g. "2026/09/30"
  const slashMatch = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})$/)
  if (slashMatch) return { value: `${slashMatch[1]}-${slashMatch[2]}-${slashMatch[3]}`, error: null }
  return { value: null, error: `must be in YYYY-MM-DD format (got "${raw}")` }
}
