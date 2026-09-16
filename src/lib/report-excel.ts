import ExcelJS from 'exceljs'
import { styleHeaderRow, autoSizeColumns } from './excel'

interface ReportExportData {
  projects: {
    name: string
    totalTickets: number
    completedTickets: number
    completionRate: number
    overdueTickets: number
    hoursLogged: number
  }[]
  users: {
    name: string
    ticketsAssigned: number
    ticketsCompleted: number
    hoursLogged: number
  }[]
  myStats: {
    ticketsAssigned: number
    ticketsCompleted: number
    completionRate: number
    overdueTickets: number
    hoursLogged: number
  }
  totals: {
    totalTickets: number
    completedTickets: number
    overdueTickets: number
    hoursLogged: number
  }
  generatedFor: string
}

export async function buildReportExport(data: ReportExportData) {
  const workbook = new ExcelJS.Workbook()

  const summary = workbook.addWorksheet('Summary')
  summary.addRow(['Progress Report'])
  summary.getRow(1).font = { bold: true, size: 14 }
  summary.addRow([`Generated for: ${data.generatedFor}`])
  summary.addRow([`Generated on: ${new Date().toISOString().slice(0, 10)}`])
  summary.addRow([])
  summary.addRow(['Total Tickets', data.totals.totalTickets])
  summary.addRow(['Completed Tickets', data.totals.completedTickets])
  summary.addRow(['Overdue Tickets', data.totals.overdueTickets])
  summary.addRow(['Hours Logged', data.totals.hoursLogged])
  summary.addRow([])
  summary.addRow(['My Assigned Tickets', data.myStats.ticketsAssigned])
  summary.addRow(['My Completed Tickets', data.myStats.ticketsCompleted])
  summary.addRow(['My Completion Rate', `${data.myStats.completionRate}%`])
  summary.addRow(['My Overdue Tickets', data.myStats.overdueTickets])
  summary.addRow(['My Hours Logged', data.myStats.hoursLogged])
  summary.getColumn(1).width = 26
  summary.getColumn(2).width = 20

  const projectsSheet = workbook.addWorksheet('Project Breakdown')
  projectsSheet.addRow(['Project', 'Total Tickets', 'Completed', 'Completion %', 'Overdue', 'Hours Logged'])
  styleHeaderRow(projectsSheet)
  for (const p of data.projects) {
    projectsSheet.addRow([p.name, p.totalTickets, p.completedTickets, p.completionRate, p.overdueTickets, p.hoursLogged])
  }
  autoSizeColumns(projectsSheet)

  const usersSheet = workbook.addWorksheet('Team Breakdown')
  usersSheet.addRow(['Team Member', 'Tickets Assigned', 'Tickets Completed', 'Hours Logged'])
  styleHeaderRow(usersSheet)
  for (const u of data.users) {
    usersSheet.addRow([u.name, u.ticketsAssigned, u.ticketsCompleted, u.hoursLogged])
  }
  autoSizeColumns(usersSheet)

  return workbook
}
