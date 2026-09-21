'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  FolderKanban,
  Ticket,
  Users,
  Activity,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardData {
  totalProjects: number
  totalTickets: number
  totalMembers: number
  recentTickets: RecentTicket[]
  ticketsByPriority: { name: string; count: number; color: string }[]
  ticketsByProject: { name: string; count: number; color: string }[]
}

interface RecentTicket {
  id: string
  title: string
  uuid: string
  createdAt: string
  updatedAt: string
  project: { name: string; prefix: string; color: string }
  status: { name: string; color: string }
  priority: { name: string; color: string }
  assignees: { user: { id: string; name: string } }[]
  createdBy: { name: string }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const {
    data,
    isLoading: loading,
    error,
  } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to load dashboard')
      return res.json()
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  })

  const statCards = [
    {
      label: 'Total Projects',
      value: data?.totalProjects ?? 0,
      icon: FolderKanban,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      href: '/projects'
    },
    {
      label: 'Total Tickets',
      value: data?.totalTickets ?? 0,
      icon: Ticket,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      href: '/tickets'
    },
    {
      label: 'Team Members',
      value: data?.totalMembers ?? 0,
      icon: Users,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      href: '/team'
    },
    {
      label: 'Active Projects',
      value: data?.totalProjects ?? 0,
      icon: Activity,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      href: '/projects'
    },
  ]

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        <p>{error instanceof Error ? error.message : 'Error loading dashboard'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}
        </h1>
        <p className="text-muted-foreground">
          Here is an overview of your projects and tickets.
        </p>
      </div>

      {/* Stat Cards */}
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
            <Card 
              key={stat.label} 
              className="cursor-pointer hover:shadow-md transition-shadow" 
              onClick={() => router.push(stat.href)}
            >
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

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Ticket ID</th>
                    <th className="pb-3 pr-4 font-medium">Title</th>
                    <th className="pb-3 pr-4 font-medium hidden md:table-cell">Project</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Priority</th>
                    <th className="pb-3 pr-4 font-medium hidden lg:table-cell">Assignees</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Updated</th>
                  </tr>
                </thead>
                <tbody className="max-h-96 overflow-y-auto">
                  {(data?.recentTickets ?? []).slice(0, 8).map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push('/tickets')}
                    >
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs text-muted-foreground">
                          {ticket.project.prefix}-{ticket.uuid.slice(0, 6)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-medium max-w-[200px] truncate">
                        {ticket.title}
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: ticket.project.color }}
                          />
                          <span className="text-muted-foreground truncate max-w-[120px]">
                            {ticket.project.name}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: `${ticket.status.color}20`,
                            color: ticket.status.color,
                            borderColor: `${ticket.status.color}30`,
                          }}
                        >
                          {ticket.status.name}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {ticket.priority ? (
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: `${ticket.priority.color}20`,
                              color: ticket.priority.color,
                              borderColor: `${ticket.priority.color}30`,
                            }}
                          >
                            {ticket.priority.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 hidden lg:table-cell">
                        <div className="flex -space-x-2">
                          {ticket.assignees.slice(0, 3).map((a) => (
                            <Avatar key={a.user.id} className="h-7 w-7 border-2 border-background">
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                {getInitials(a.user.name)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {ticket.assignees.length > 3 && (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium border-2 border-background">
                              +{ticket.assignees.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground text-xs hidden sm:table-cell whitespace-nowrap">
                        {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!data?.recentTickets || data.recentTickets.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  No tickets yet
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tickets by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : data?.ticketsByPriority && data.ticketsByPriority.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.ticketsByPriority}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {data.ticketsByPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--popover))',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No priority data
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tickets by Project</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : data?.ticketsByProject && data.ticketsByProject.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.ticketsByProject}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--popover))',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                  />
                  <Bar dataKey="count" name="Tickets" radius={[4, 4, 0, 0]}>
                    {data.ticketsByProject.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No project data
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}