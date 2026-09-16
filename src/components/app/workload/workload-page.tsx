'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Users, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface WorkloadTicket {
  id: string
  title: string
  projectName: string
  projectColor: string
  statusName: string
  priorityName: string | null
  dueDate: string | null
}

interface WorkloadUser {
  id: string
  name: string
  totalAssigned: number
  openCount: number
  overdueCount: number
  openTickets: WorkloadTicket[]
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function WorkloadPage() {
  const [users, setUsers] = useState<WorkloadUser[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/workload')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  const maxOpen = users && users.length > 0 ? Math.max(...users.map((u) => u.openCount), 1) : 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workload</h1>
        <p className="text-muted-foreground">
          Who's carrying what, across the projects you can see.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !users || users.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No one has any tickets assigned yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id}>
              <Collapsible open={openId === u.id} onOpenChange={(o) => setOpenId(o ? u.id : null)}>
                <CollapsibleTrigger className="w-full text-left">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {initials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <p className="font-medium truncate">{u.name}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            {u.overdueCount > 0 && (
                              <Badge variant="destructive" className="gap-1 font-normal">
                                <AlertTriangle className="h-3 w-3" />
                                {u.overdueCount} overdue
                              </Badge>
                            )}
                            <Badge variant="outline" className="font-normal">
                              {u.openCount} open
                            </Badge>
                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openId === u.id ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min(100, (u.openCount / maxOpen) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 pl-[68px] space-y-1.5">
                    {u.openTickets.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No open tickets — all caught up.</p>
                    ) : (
                      u.openTickets.map((t) => (
                        <div key={t.id} className="flex items-center gap-2 text-sm py-1 border-b last:border-0">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: t.projectColor }}
                          />
                          <span className="font-medium truncate flex-1 min-w-0">{t.title}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{t.projectName}</span>
                          <Badge variant="outline" className="text-xs font-normal shrink-0">{t.statusName}</Badge>
                          {t.dueDate && (
                            <span className="text-xs text-muted-foreground shrink-0">{t.dueDate}</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
