'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { UserPlus, X, Loader2, User as UserIcon } from 'lucide-react'

interface AssigneeUser {
  id: string
  name: string
  email: string
}

interface Assignee {
  userId: string
  user: AssigneeUser
  assignedBy?: { id: string; name: string } | null
}

interface CandidateUser {
  id: string
  name: string
  email: string
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export function TicketAssignees({
  ticketId,
  initialAssignees,
}: {
  ticketId: string
  initialAssignees: Assignee[]
}) {
  const [assignees, setAssignees] = useState<Assignee[]>(initialAssignees)
  const [candidates, setCandidates] = useState<CandidateUser[]>([])
  const [open, setOpen] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    setAssignees(initialAssignees)
  }, [initialAssignees])

  async function loadCandidates() {
    try {
      const res = await fetch('/api/users')
      if (res.ok) setCandidates(await res.json())
    } catch {
      // Silently fail — the popover will just show no options
    }
  }

  async function handleAdd(userId: string) {
    setAddingId(userId)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/assignees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to assign')
      }
      const created = await res.json()
      setAssignees((prev) => [...prev, created])
      toast.success('Assigned — they\'ll get an email notification')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign')
    } finally {
      setAddingId(null)
    }
  }

  async function handleRemove(userId: string) {
    setRemovingId(userId)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/assignees`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) throw new Error('Failed to unassign')
      setAssignees((prev) => prev.filter((a) => a.userId !== userId))
    } catch {
      toast.error('Failed to unassign')
    } finally {
      setRemovingId(null)
    }
  }

  const availableCandidates = candidates.filter(
    (c) => !assignees.some((a) => a.userId === c.id)
  )

  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
      {assignees.length === 0 && (
        <span className="text-sm text-muted-foreground">Unassigned</span>
      )}
      {assignees.map((a) => (
        <div
          key={a.userId}
          className="flex items-center gap-1.5 rounded-full border pl-1 pr-2 py-0.5 group/assignee"
        >
          <div
            className="h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-medium flex items-center justify-center shrink-0"
            title={a.assignedBy ? `Assigned by ${a.assignedBy.name}` : undefined}
          >
            {getInitials(a.user.name)}
          </div>
          <span className="text-xs font-medium">{a.user.name}</span>
          <button
            type="button"
            onClick={() => handleRemove(a.userId)}
            disabled={removingId === a.userId}
            className="text-muted-foreground hover:text-destructive opacity-0 group-hover/assignee:opacity-100 transition-opacity"
          >
            {removingId === a.userId ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
          </button>
        </div>
      ))}
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (o) loadCandidates()
        }}
      >
        <PopoverTrigger asChild>
          <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full border border-dashed">
            <UserPlus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <p className="text-xs font-medium text-muted-foreground px-1 mb-1.5">Assign to</p>
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {availableCandidates.length === 0 ? (
              <p className="text-xs text-muted-foreground px-1 py-2">No one else to assign</p>
            ) : (
              availableCandidates.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={addingId === c.id}
                  onClick={() => handleAdd(c.id)}
                  className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted text-sm"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-medium flex items-center justify-center shrink-0">
                    {getInitials(c.name)}
                  </div>
                  <span className="truncate flex-1">{c.name}</span>
                  {addingId === c.id && <Loader2 className="h-3 w-3 animate-spin" />}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
