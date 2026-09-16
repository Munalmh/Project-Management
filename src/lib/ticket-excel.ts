import ExcelJS from 'exceljs'
import { styleHeaderRow, autoSizeColumns, normalizeDate } from './excel'
import { db } from './db'

export const TICKET_HEADERS = [
  'Project',
  'Title',
  'Description',
  'Status',
  'Priority',
  'Assignee Emails',
  'Start Date (YYYY-MM-DD)',
  'Due Date (YYYY-MM-DD)',
]

interface ReferenceData {
  projects: { name: string; statuses: string[] }[]
  priorities: string[]
  userEmails: string[]
}

function addReferenceSheet(workbook: ExcelJS.Workbook, ref: ReferenceData) {
  const sheet = workbook.addWorksheet('Reference (do not edit)')
  sheet.addRow(['Project', 'Valid Statuses for that Project'])
  ref.projects.forEach((p) => {
    sheet.addRow([p.name, p.statuses.join(', ')])
  })
  sheet.addRow([])
  sheet.addRow(['Valid Priorities', ref.priorities.join(', ')])
  sheet.addRow([])
  sheet.addRow(['Valid User Emails (for Assignee Emails column)'])
  ref.userEmails.forEach((e) => sheet.addRow([e]))
  styleHeaderRow(sheet)
  autoSizeColumns(sheet, 15, 50)
  return sheet
}

function addInstructionsSheet(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('Instructions')
  sheet.addRow(['How to use this template'])
  sheet.getRow(1).font = { bold: true, size: 14 }
  const lines = [
    '',
    '1. Fill in one row per ticket on the "Tickets" sheet. Do not change the header row.',
    '2. Project and Title are required. Everything else is optional.',
    '3. Project must exactly match a project name from the "Reference" sheet.',
    '4. Status must exactly match one of the valid statuses listed for that project on the "Reference" sheet. Leave blank to use the project\'s default status.',
    '5. Priority must exactly match one of the valid priorities listed on the "Reference" sheet, or leave blank.',
    '6. Assignee Emails: one or more emails from the "Reference" sheet, separated by commas.',
    '7. Dates must be in YYYY-MM-DD format, e.g. 2026-09-30.',
    '8. Save the file and upload it back through the Import button. You\'ll see a preview before anything is created.',
  ]
  lines.forEach((l) => sheet.addRow([l]))
  sheet.getColumn(1).width = 100
}

export async function buildTicketTemplate(ref: ReferenceData) {
  const workbook = new ExcelJS.Workbook()
  addInstructionsSheet(workbook)
  const sheet = workbook.addWorksheet('Tickets')
  sheet.addRow(TICKET_HEADERS)
  styleHeaderRow(sheet)
  sheet.columns.forEach((col, i) => {
    col.width = i === 2 ? 40 : 22
  })

  // Dropdown validation for Project (col A) and Priority (col E), for the next 500 rows.
  const projectListRange = `'Reference (do not edit)'!$A$2:$A$${ref.projects.length + 1}`
  for (let r = 2; r <= 500; r++) {
    sheet.getCell(`A${r}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [projectListRange],
      showErrorMessage: true,
      errorStyle: 'error',
      error: 'Please pick a project from the Reference sheet.',
    }
    if (ref.priorities.length > 0) {
      sheet.getCell(`E${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${ref.priorities.join(',')}"`],
        showErrorMessage: true,
        errorStyle: 'error',
        error: 'Please pick a priority from the dropdown, or leave blank.',
      }
    }
    // Force date columns to Text so Excel never silently reinterprets a typed date
    // based on the user's locale — what you type is exactly what gets imported.
    sheet.getCell(`G${r}`).numFmt = '@'
    sheet.getCell(`H${r}`).numFmt = '@'

    // Validate the typed text actually looks like YYYY-MM-DD (or is left blank),
    // without relying on DATEVALUE — which parses text using Excel's locale
    // settings and would accept/reject different things on different machines.
    // Checking the pieces by hand keeps this identical everywhere.
    const dateCheck = (cellRef: string) =>
      `OR(${cellRef}="",AND(LEN(${cellRef})=10,MID(${cellRef},5,1)="-",MID(${cellRef},8,1)="-",` +
      `ISNUMBER(VALUE(LEFT(${cellRef},4))),ISNUMBER(VALUE(MID(${cellRef},6,2))),ISNUMBER(VALUE(RIGHT(${cellRef},2))),` +
      `VALUE(MID(${cellRef},6,2))>=1,VALUE(MID(${cellRef},6,2))<=12,VALUE(RIGHT(${cellRef},2))>=1,VALUE(RIGHT(${cellRef},2))<=31))`

    sheet.getCell(`G${r}`).dataValidation = {
      type: 'custom',
      allowBlank: true,
      formulae: [dateCheck(`G${r}`)],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: 'Invalid date',
      error: 'Start Date must be in YYYY-MM-DD format (e.g. 2026-09-30), or left blank.',
    }
    sheet.getCell(`H${r}`).dataValidation = {
      type: 'custom',
      allowBlank: true,
      formulae: [dateCheck(`H${r}`)],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: 'Invalid date',
      error: 'Due Date must be in YYYY-MM-DD format (e.g. 2026-09-30), or left blank.',
    }
  }

  addReferenceSheet(workbook, ref)
  return workbook
}

interface TicketExportRow {
  project: { name: string }
  title: string
  description: string | null
  status: { name: string }
  priority: { name: string } | null
  assignees: { user: { email: string } }[]
  startDate: Date | null
  dueDate: Date | null
}

export async function buildTicketExport(tickets: TicketExportRow[]) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Tickets')
  sheet.addRow(TICKET_HEADERS)
  styleHeaderRow(sheet)

  for (const t of tickets) {
    sheet.addRow([
      t.project.name,
      t.title,
      t.description ?? '',
      t.status.name,
      t.priority?.name ?? '',
      t.assignees.map((a) => a.user.email).join(', '),
      t.startDate ? t.startDate.toISOString().slice(0, 10) : '',
      t.dueDate ? t.dueDate.toISOString().slice(0, 10) : '',
    ])
  }

  autoSizeColumns(sheet)
  return workbook
}

export interface ParsedTicketRow {
  rowNumber: number
  raw: {
    project: string
    title: string
    description: string
    status: string
    priority: string
    assigneeEmails: string
    startDate: string
    dueDate: string
  }
}

export function parseTicketRow(rowNumber: number, values: string[]): ParsedTicketRow {
  return {
    rowNumber,
    raw: {
      project: values[0] ?? '',
      title: values[1] ?? '',
      description: values[2] ?? '',
      status: values[3] ?? '',
      priority: values[4] ?? '',
      assigneeEmails: values[5] ?? '',
      startDate: values[6] ?? '',
      dueDate: values[7] ?? '',
    },
  }
}

export interface TicketResolveContext {
  projectsByName: Map<string, { id: string; defaultStatusId: string | null; statusesByName: Map<string, string> }>
  prioritiesByName: Map<string, string>
  usersByEmail: Map<string, string>
}

export interface ResolvedTicketRow {
  projectId: string
  title: string
  description: string | null
  statusId: string
  priorityId: string | null
  assigneeIds: string[]
  startDate: string | null
  dueDate: string | null
}

/** Resolve + validate one raw row against the database lookups. Never trusts client-supplied IDs. */
export function resolveTicketRow(
  raw: ParsedTicketRow['raw'],
  ctx: TicketResolveContext
): { errors: string[]; data?: ResolvedTicketRow } {
  const errors: string[] = []

  if (!raw.title.trim()) errors.push('Title is required')

  const project = raw.project.trim() ? ctx.projectsByName.get(raw.project.trim().toLowerCase()) : undefined
  if (!raw.project.trim()) errors.push('Project is required')
  else if (!project) errors.push(`Project "${raw.project}" not found or not accessible`)

  let statusId: string | null = null
  if (project) {
    if (raw.status.trim()) {
      statusId = project.statusesByName.get(raw.status.trim().toLowerCase()) ?? null
      if (!statusId) errors.push(`Status "${raw.status}" is not valid for project "${raw.project}"`)
    } else {
      statusId = project.defaultStatusId
      if (!statusId) errors.push(`Project "${raw.project}" has no statuses configured`)
    }
  }

  let priorityId: string | null = null
  if (raw.priority.trim()) {
    priorityId = ctx.prioritiesByName.get(raw.priority.trim().toLowerCase()) ?? null
    if (!priorityId) errors.push(`Priority "${raw.priority}" not found`)
  }

  const assigneeIds: string[] = []
  if (raw.assigneeEmails.trim()) {
    for (const emailRaw of raw.assigneeEmails.split(',')) {
      const email = emailRaw.trim().toLowerCase()
      if (!email) continue
      const uid = ctx.usersByEmail.get(email)
      if (!uid) errors.push(`Assignee email "${email}" not found`)
      else assigneeIds.push(uid)
    }
  }

  const startResult = normalizeDate(raw.startDate)
  if (startResult.error) errors.push(`Start Date ${startResult.error}`)
  const startDate = startResult.value

  const dueResult = normalizeDate(raw.dueDate)
  if (dueResult.error) errors.push(`Due Date ${dueResult.error}`)
  const dueDate = dueResult.value

  if (errors.length > 0 || !project || !statusId) return { errors }

  return {
    errors: [],
    data: {
      projectId: project.id,
      title: raw.title.trim(),
      description: raw.description.trim() || null,
      statusId,
      priorityId,
      assigneeIds,
      startDate,
      dueDate,
    },
  }
}

/** Build the lookup context for resolving import rows, scoped to what the user can access. */
export async function buildTicketResolveContext(userId: string, role: string): Promise<TicketResolveContext> {
  const projectWhere = role === 'admin' ? {} : { members: { some: { userId } } }

  const [projects, priorities, users] = await Promise.all([
    db.project.findMany({
      where: projectWhere,
      include: { statuses: { orderBy: { sortOrder: 'asc' } } },
    }),
    db.ticketPriority.findMany(),
    db.user.findMany({ select: { id: true, email: true } }),
  ])

  const projectsByName = new Map<string, { id: string; defaultStatusId: string | null; statusesByName: Map<string, string> }>()
  for (const p of projects) {
    const statusesByName = new Map<string, string>()
    for (const s of p.statuses) statusesByName.set(s.name.toLowerCase(), s.id)
    projectsByName.set(p.name.toLowerCase(), {
      id: p.id,
      defaultStatusId: p.statuses[0]?.id ?? null,
      statusesByName,
    })
  }

  const prioritiesByName = new Map<string, string>()
  for (const p of priorities) prioritiesByName.set(p.name.toLowerCase(), p.id)

  const usersByEmail = new Map<string, string>()
  for (const u of users) usersByEmail.set(u.email.toLowerCase(), u.id)

  return { projectsByName, prioritiesByName, usersByEmail }
}
