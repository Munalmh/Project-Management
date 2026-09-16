import { db } from './db'

export async function getReportData(userId: string, role: string) {
  const isAdmin = role === 'admin'
  const projectWhere = isAdmin ? {} : { members: { some: { userId } } }

  const projects = await db.project.findMany({
    where: projectWhere,
    include: {
      statuses: true,
      tickets: {
        include: {
          status: true,
          timesheetEntries: { select: { hours: true } },
        },
      },
    },
  })

  const now = new Date()

  const projectStats = projects.map((project) => {
    const total = project.tickets.length
    const completed = project.tickets.filter((t) => t.status?.isCompleted).length
    const overdue = project.tickets.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && !t.status?.isCompleted
    ).length
    const hoursLogged = project.tickets.reduce(
      (sum, t) => sum + t.timesheetEntries.reduce((s, e) => s + e.hours, 0),
      0
    )
    return {
      id: project.id,
      name: project.name,
      color: project.color,
      totalTickets: total,
      completedTickets: completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      overdueTickets: overdue,
      hoursLogged: Math.round(hoursLogged * 100) / 100,
    }
  })

  // Per-user breakdown, scoped to tickets within the visible projects above.
  const projectIds = projects.map((p) => p.id)
  const ticketWhere = projectIds.length > 0 ? { projectId: { in: projectIds } } : { id: 'none' }

  const [assignments, timesheetEntries] = await Promise.all([
    db.ticketAssignee.findMany({
      where: { ticket: ticketWhere },
      include: {
        user: { select: { id: true, name: true } },
        ticket: { select: { status: { select: { isCompleted: true } } } },
      },
    }),
    db.timesheetEntry.findMany({
      where: { ticket: ticketWhere },
      include: { user: { select: { id: true, name: true } } },
    }),
  ])

  const userMap = new Map<
    string,
    { id: string; name: string; ticketsAssigned: number; ticketsCompleted: number; hoursLogged: number }
  >()

  for (const a of assignments) {
    const entry = userMap.get(a.user.id) ?? {
      id: a.user.id,
      name: a.user.name,
      ticketsAssigned: 0,
      ticketsCompleted: 0,
      hoursLogged: 0,
    }
    entry.ticketsAssigned += 1
    if (a.ticket.status?.isCompleted) entry.ticketsCompleted += 1
    userMap.set(a.user.id, entry)
  }

  for (const e of timesheetEntries) {
    const entry = userMap.get(e.user.id) ?? {
      id: e.user.id,
      name: e.user.name,
      ticketsAssigned: 0,
      ticketsCompleted: 0,
      hoursLogged: 0,
    }
    entry.hoursLogged += e.hours
    userMap.set(e.user.id, entry)
  }

  const userStats = Array.from(userMap.values())
    .map((u) => ({ ...u, hoursLogged: Math.round(u.hoursLogged * 100) / 100 }))
    .sort((a, b) => b.hoursLogged - a.hoursLogged)

  // Also compute the current user's own overdue count, since userMap doesn't track that.
  const myOverdueTickets = projects.reduce((sum, project) => {
    return (
      sum +
      project.tickets.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) < now &&
          !t.status?.isCompleted &&
          assignments.some((a) => a.ticketId === t.id && a.user.id === userId)
      ).length
    )
  }, 0)

  const myRaw = userMap.get(userId)
  const myStats = {
    ticketsAssigned: myRaw?.ticketsAssigned ?? 0,
    ticketsCompleted: myRaw?.ticketsCompleted ?? 0,
    completionRate:
      myRaw && myRaw.ticketsAssigned > 0
        ? Math.round((myRaw.ticketsCompleted / myRaw.ticketsAssigned) * 100)
        : 0,
    overdueTickets: myOverdueTickets,
    hoursLogged: myRaw ? Math.round(myRaw.hoursLogged * 100) / 100 : 0,
  }

  const totals = {
    totalTickets: projectStats.reduce((s, p) => s + p.totalTickets, 0),
    completedTickets: projectStats.reduce((s, p) => s + p.completedTickets, 0),
    overdueTickets: projectStats.reduce((s, p) => s + p.overdueTickets, 0),
    hoursLogged: Math.round(projectStats.reduce((s, p) => s + p.hoursLogged, 0) * 100) / 100,
  }

  return { projects: projectStats, users: userStats, myStats, totals }
}
