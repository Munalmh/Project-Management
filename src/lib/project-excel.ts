import ExcelJS from 'exceljs'
import { styleHeaderRow, autoSizeColumns, normalizeDate } from './excel'

export const PROJECT_HEADERS = [
  'Name',
  'Description',
  'Prefix',
  'Color (hex)',
  'Start Date (YYYY-MM-DD)',
  'End Date (YYYY-MM-DD)',
  'Status',
]

const SUGGESTED_STATUSES = ['active', 'on-hold', 'completed', 'archived']

function addInstructionsSheet(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('Instructions')
  sheet.addRow(['How to use this template'])
  sheet.getRow(1).font = { bold: true, size: 14 }
  const lines = [
    '',
    '1. Fill in one row per project on the "Projects" sheet. Do not change the header row.',
    '2. Name is required. Everything else is optional.',
    '3. Prefix is the short code used in ticket IDs (e.g. "API" for tickets like API-1234). If left blank, one will be generated from the project name.',
    '4. Color should be a hex code like #6366f1. If left blank, a default color is used.',
    '5. Dates must be in YYYY-MM-DD format, e.g. 2026-09-30.',
    `6. Status is free text — common values are: ${SUGGESTED_STATUSES.join(', ')}. Leave blank to default to "active".`,
    '7. New projects are created with 3 default ticket statuses (To Do, In Progress, Done) — you can customize those afterward in the app.',
    '8. Save the file and upload it back through the Import button. You\'ll see a preview before anything is created.',
  ]
  lines.forEach((l) => sheet.addRow([l]))
  sheet.getColumn(1).width = 100
}

export async function buildProjectTemplate() {
  const workbook = new ExcelJS.Workbook()
  addInstructionsSheet(workbook)
  const sheet = workbook.addWorksheet('Projects')
  sheet.addRow(PROJECT_HEADERS)
  styleHeaderRow(sheet)
  sheet.columns.forEach((col, i) => {
    col.width = i === 1 ? 40 : 20
  })

  for (let r = 2; r <= 500; r++) {
    sheet.getCell(`G${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${SUGGESTED_STATUSES.join(',')}"`],
      showErrorMessage: true,
      errorStyle: 'error',
      error: 'Please pick a status from the dropdown, or leave blank for "active".',
    }
    // Force date columns to Text so Excel never silently reinterprets a typed date
    // based on the user's locale.
    sheet.getCell(`E${r}`).numFmt = '@'
    sheet.getCell(`F${r}`).numFmt = '@'

    // Validate the typed text actually looks like YYYY-MM-DD (or is left blank).
    // Checked by hand (not DATEVALUE) so it behaves identically regardless of
    // the machine's regional date settings.
    const dateCheck = (cellRef: string) =>
      `OR(${cellRef}="",AND(LEN(${cellRef})=10,MID(${cellRef},5,1)="-",MID(${cellRef},8,1)="-",` +
      `ISNUMBER(VALUE(LEFT(${cellRef},4))),ISNUMBER(VALUE(MID(${cellRef},6,2))),ISNUMBER(VALUE(RIGHT(${cellRef},2))),` +
      `VALUE(MID(${cellRef},6,2))>=1,VALUE(MID(${cellRef},6,2))<=12,VALUE(RIGHT(${cellRef},2))>=1,VALUE(RIGHT(${cellRef},2))<=31))`

    sheet.getCell(`E${r}`).dataValidation = {
      type: 'custom',
      allowBlank: true,
      formulae: [dateCheck(`E${r}`)],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: 'Invalid date',
      error: 'Start Date must be in YYYY-MM-DD format (e.g. 2026-09-30), or left blank.',
    }
    sheet.getCell(`F${r}`).dataValidation = {
      type: 'custom',
      allowBlank: true,
      formulae: [dateCheck(`F${r}`)],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: 'Invalid date',
      error: 'End Date must be in YYYY-MM-DD format (e.g. 2026-09-30), or left blank.',
    }
  }

  return workbook
}

interface ProjectExportRow {
  name: string
  description: string | null
  prefix: string
  color: string
  startDate: Date | null
  endDate: Date | null
  status: string
}

export async function buildProjectExport(projects: ProjectExportRow[]) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Projects')
  sheet.addRow(PROJECT_HEADERS)
  styleHeaderRow(sheet)

  for (const p of projects) {
    sheet.addRow([
      p.name,
      p.description ?? '',
      p.prefix,
      p.color,
      p.startDate ? p.startDate.toISOString().slice(0, 10) : '',
      p.endDate ? p.endDate.toISOString().slice(0, 10) : '',
      p.status,
    ])
  }

  autoSizeColumns(sheet)
  return workbook
}

export interface ParsedProjectRow {
  rowNumber: number
  raw: {
    name: string
    description: string
    prefix: string
    color: string
    startDate: string
    endDate: string
    status: string
  }
}

export function parseProjectRow(rowNumber: number, values: string[]): ParsedProjectRow {
  return {
    rowNumber,
    raw: {
      name: values[0] ?? '',
      description: values[1] ?? '',
      prefix: values[2] ?? '',
      color: values[3] ?? '',
      startDate: values[4] ?? '',
      endDate: values[5] ?? '',
      status: values[6] ?? '',
    },
  }
}

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export interface ResolvedProjectRow {
  name: string
  description: string | null
  prefix: string
  color: string
  startDate: string | null
  endDate: string | null
  status: string
}

export function resolveProjectRow(raw: ParsedProjectRow['raw']): { errors: string[]; data?: ResolvedProjectRow } {
  const errors: string[] = []

  if (!raw.name.trim()) errors.push('Name is required')

  let color = '#6366f1'
  if (raw.color.trim()) {
    if (!HEX_RE.test(raw.color.trim())) errors.push('Color must be a hex code like #6366f1')
    else color = raw.color.trim()
  }

  const startResult = normalizeDate(raw.startDate)
  if (startResult.error) errors.push(`Start Date ${startResult.error}`)
  const startDate = startResult.value

  const endResult = normalizeDate(raw.endDate)
  if (endResult.error) errors.push(`End Date ${endResult.error}`)
  const endDate = endResult.value

  if (errors.length > 0) return { errors }

  const prefix = raw.prefix.trim()
    ? raw.prefix.trim().toUpperCase().slice(0, 8)
    : raw.name.trim().replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'PROJ'

  return {
    errors: [],
    data: {
      name: raw.name.trim(),
      description: raw.description.trim() || null,
      prefix,
      color,
      startDate,
      endDate,
      status: raw.status.trim() || 'active',
    },
  }
}
