'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { CheckCircle2, Ticket, AlertTriangle, Clock, UserCircle2, FileSpreadsheet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ProjectStat {
  id: string
  name: string
  color: string
  totalTickets: number
  completedTickets: number
  completionRate: number
  overdueTickets: number
  hoursLogged: number
}

interface UserStat {
  id: string
  name: string
  ticketsAssigned: number
  ticketsCompleted: number
  hoursLogged: number
}

interface ReportData {
  projects: ProjectStat[]
  users: UserStat[]
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
}

export function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reports')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const overallCompletion =
    data && data.totals.totalTickets > 0
      ? Math.round((data.totals.completedTickets / data.totals.totalTickets) * 100)
      : 0

  const statCards = data
    ? [
        { label: 'Total Tickets', value: data.totals.totalTickets, icon: Ticket, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950' },
        { label: 'Completion Rate', value: `${overallCompletion}%`, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-950' },
        { label: 'Overdue Tickets', value: data.totals.overdueTickets, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-950' },
        { label: 'Hours Logged', value: data.totals.hoursLogged, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-950' },
      ]
    : []

  const myStatCards = data
    ? [
        { label: 'My Assigned Tickets', value: data.myStats.ticketsAssigned, icon: Ticket, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950' },
        { label: 'My Completion Rate', value: `${data.myStats.completionRate}%`, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-950' },
        { label: 'My Overdue Tickets', value: data.myStats.overdueTickets, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-950' },
        { label: 'My Hours Logged', value: data.myStats.hoursLogged, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-950' },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Progress and KPI overview across your projects.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/api/reports/export">
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />
            Export to Excel
          </a>
        </Button>
      </div>

      {/* My Stats */}
      <div>
        <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3 text-muted-foreground">
          <UserCircle2 className="h-4 w-4" />
          My Progress
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-12" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            : myStatCards.map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground">All Projects</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-12" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          : statCards.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completion Rate by Project</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : data && data.projects.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.projects}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--popover))',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Completion']}
                  />
                  <Bar dataKey="completionRate" name="Completion %" radius={[4, 4, 0, 0]}>
                    {data.projects.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                No project data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hours Logged by Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : data && data.users.some((u) => u.hoursLogged > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.users.filter((u) => u.hoursLogged > 0)}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--popover))',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                    formatter={(value: number) => [`${value}h`, 'Logged']}
                  />
                  <Bar dataKey="hoursLogged" name="Hours" radius={[4, 4, 0, 0]} fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                No time logged yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-Project Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : data && data.projects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Project</th>
                    <th className="py-2 pr-4 font-medium">Tickets</th>
                    <th className="py-2 pr-4 font-medium">Completed</th>
                    <th className="py-2 pr-4 font-medium">Completion</th>
                    <th className="py-2 pr-4 font-medium">Overdue</th>
                    <th className="py-2 pr-4 font-medium">Hours Logged</th>
                  </tr>
                </thead>
                <tbody>
                  {data.projects.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-4 font-medium">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                          {p.name}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">{p.totalTickets}</td>
                      <td className="py-2.5 pr-4">{p.completedTickets}</td>
                      <td className="py-2.5 pr-4">{p.completionRate}%</td>
                      <td className="py-2.5 pr-4">
                        {p.overdueTickets > 0 ? (
                          <Badge variant="destructive" className="font-normal">{p.overdueTickets}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">{p.hoursLogged}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No projects yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
