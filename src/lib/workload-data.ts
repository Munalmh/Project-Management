import { db } from './db'

export interface WorkloadTicket {
  id: string
  title: string
  projectName: string
  projectColor: string
  statusName: string
  isCompleted: boolean
  priorityName: string | null
  dueDate: string | null
}

export interface WorkloadUser {
  id: string
  name: string
  totalAssigned: number
  openCount: number
  overdueCount: number
  openTickets: WorkloadTicket[]
}

export async function getWorkloadData(userId: string, role: string): Promise<WorkloadUser[]> {
  const isAdmin = role === 'admin'
  const projectWhere = isAdmin ? {} : { members: { some: { userId } } }

  const projects = await db.project.findMany({
    where: projectWhere,
    select: { id: true },
  })
  const projectIds = projects.map((p) => p.id)

  const assignments = await db.ticketAssignee.findMany({
    where: { ticket: { projectId: projectIds.length > 0 ? { in: projectIds } : 'none' } },
    include: {
      user: { select: { id: true, name: true } },
      ticket: {
        select: {
          id: true,
          title: true,
          dueDate: true,
          status: { select: { name: true, isCompleted: true } },
          priority: { select: { name: true } },
          project: { select: { name: true, color: true } },
        },
      },
    },
  })

  const now = new Date()
  const userMap = new Map<string, WorkloadUser>()

  for (const a of assignments) {
    const entry = userMap.get(a.user.id) ?? {
      id: a.user.id,
      name: a.user.name,
      totalAssigned: 0,
      openCount: 0,
      overdueCount: 0,
      openTickets: [],
    }

    entry.totalAssigned += 1
    const isCompleted = a.ticket.status?.isCompleted ?? false
    if (!isCompleted) {
      entry.openCount += 1
      const isOverdue = a.ticket.dueDate ? new Date(a.ticket.dueDate) < now : false
      if (isOverdue) entry.overdueCount += 1
      entry.openTickets.push({
        id: a.ticket.id,
        title: a.ticket.title,
        projectName: a.ticket.project.name,
        projectColor: a.ticket.project.color,
        statusName: a.ticket.status?.name ?? 'Unknown',
        isCompleted,
        priorityName: a.ticket.priority?.name ?? null,
        dueDate: a.ticket.dueDate ? a.ticket.dueDate.toISOString().slice(0, 10) : null,
      })
    }

    userMap.set(a.user.id, entry)
  }

  // Sort each person's open tickets by due date (soonest/overdue first, undated last)
  for (const u of userMap.values()) {
    u.openTickets.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.localeCompare(b.dueDate)
    })
  }

  return Array.from(userMap.values()).sort((a, b) => b.openCount - a.openCount)
}
