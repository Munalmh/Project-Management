'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Clock, Plus, X, Loader2 } from 'lucide-react'

interface TimesheetEntry {
  id: string
  date: string
  hours: number
  note: string | null
  userId: string
  user: { id: string; name: string }
}

export function TicketTimesheet({ ticketId }: { ticketId: string }) {
  const { data: session } = useSession()
  const currentUser = session?.user as { id: string; role: string } | undefined

  const [entries, setEntries] = useState<TimesheetEntry[]>([])
  const [summary, setSummary] = useState({ dailyTotal: 0, weeklyTotal: 0 })
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    hours: '',
    note: '',
  })

  async function loadEntries() {
    try {
      const [res, summaryRes] = await Promise.all([
        fetch(`/api/tickets/${ticketId}/timesheet`),
        fetch(`/api/timesheet/summary`)
      ])
      if (res.ok) setEntries(await res.json())
      if (summaryRes.ok) setSummary(await summaryRes.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const hours = Number(form.hours)
    if (!hours || hours <= 0 || hours > 24) {
      toast.error('Enter hours between 0 and 24')
      return
    }

    setAdding(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/timesheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: form.date, hours, note: form.note }),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to log time')
      }
      const entry = await res.json()
      setEntries((prev) => [entry, ...prev])
      setForm((f) => ({ ...f, hours: '', note: '' }))
      
      // Update summary manually to reflect immediately
      if (form.date === format(new Date(), 'yyyy-MM-dd')) {
        setSummary(s => ({ dailyTotal: s.dailyTotal + hours, weeklyTotal: s.weeklyTotal + hours }))
      } else {
        setSummary(s => ({ ...s, weeklyTotal: s.weeklyTotal + hours })) // assuming it's this week
      }
      
      toast.success('Time logged successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to log time')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(entryId: string) {
    setBusyId(entryId)
    const entryToRemove = entries.find(e => e.id === entryId)
    const previous = entries
    setEntries((prev) => prev.filter((e) => e.id !== entryId))
    try {
      const res = await fetch(`/api/tickets/${ticketId}/timesheet/${entryId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      
      // Update summary manually
      if (entryToRemove) {
        if (entryToRemove.date.startsWith(format(new Date(), 'yyyy-MM-dd'))) {
          setSummary(s => ({ dailyTotal: Math.max(0, s.dailyTotal - entryToRemove.hours), weeklyTotal: Math.max(0, s.weeklyTotal - entryToRemove.hours) }))
        } else {
          setSummary(s => ({ ...s, weeklyTotal: Math.max(0, s.weeklyTotal - entryToRemove.hours) }))
        }
      }
    } catch {
      setEntries(previous)
      toast.error('Failed to remove entry')
    } finally {
      setBusyId(null)
    }
  }

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            Timesheet {entries.length > 0 && `(${totalHours}h logged)`}
          </h4>
          <span className="text-xs text-muted-foreground flex gap-3">
            <span>Today: {summary.dailyTotal}h / 24h</span>
            <span>This Week: {summary.weeklyTotal}h</span>
          </span>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading timesheet...</p>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry) => {
            const canRemove = currentUser && (entry.userId === currentUser.id || currentUser.role === 'admin')
            return (
              <div
                key={entry.id}
                className="flex items-center gap-2 group rounded-md px-1.5 py-1 hover:bg-muted/50 text-sm"
              >
                <span className="text-muted-foreground w-20 shrink-0">
                  {format(parseISO(entry.date), 'MMM d')}
                </span>
                <span className="font-medium w-12 shrink-0">{entry.hours}h</span>
                <span className="text-muted-foreground truncate flex-1 min-w-0">
                  {entry.user.name}{entry.note ? ` — ${entry.note}` : ''}
                </span>
                {canRemove && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    disabled={busyId === entry.id}
                    onClick={() => handleRemove(entry.id)}
                  >
                    {busyId === entry.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            )
          })}
          {entries.length === 0 && (
            <p className="text-xs text-muted-foreground">No time logged yet.</p>
          )}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <Input
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          className="h-8 text-sm w-[130px]"
          disabled={adding}
        />
        <Input
          type="number"
          step="0.25"
          min="0"
          max="24"
          placeholder="Hours"
          value={form.hours}
          onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
          className="h-8 text-sm w-20"
          disabled={adding}
        />
        <Input
          placeholder="Note (optional)"
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          className="h-8 text-sm flex-1"
          disabled={adding}
        />
        <Button type="submit" size="sm" variant="outline" disabled={adding || !form.hours}>
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        </Button>
      </form>
    </div>
  )
}
