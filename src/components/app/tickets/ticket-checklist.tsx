'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckSquare, Plus, X, Loader2 } from 'lucide-react'

interface ChecklistItem {
  id: string
  content: string
  isDone: boolean
  sortOrder: number
}

export function TicketChecklist({ ticketId }: { ticketId: string }) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState('')
  const [adding, setAdding] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function loadItems() {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/checklist`)
      if (res.ok) setItems(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const content = newItem.trim()
    if (!content) return

    setAdding(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error('Failed to add item')
      const item = await res.json()
      setItems((prev) => [...prev, item])
      setNewItem('')
    } catch {
      toast.error('Failed to add checklist item')
    } finally {
      setAdding(false)
    }
  }

  async function handleToggle(item: ChecklistItem) {
    setBusyId(item.id)
    const previous = items
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isDone: !i.isDone } : i))
    )
    try {
      const res = await fetch(`/api/tickets/${ticketId}/checklist/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDone: !item.isDone }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setItems(previous)
      toast.error('Failed to update item')
    } finally {
      setBusyId(null)
    }
  }

  async function handleRemove(itemId: string) {
    setBusyId(itemId)
    const previous = items
    setItems((prev) => prev.filter((i) => i.id !== itemId))
    try {
      const res = await fetch(`/api/tickets/${ticketId}/checklist/${itemId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
    } catch {
      setItems(previous)
      toast.error('Failed to remove item')
    } finally {
      setBusyId(null)
    }
  }

  const doneCount = items.filter((i) => i.isDone).length
  const percent = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <CheckSquare className="h-4 w-4" />
          Checklist {items.length > 0 && `(${doneCount}/${items.length})`}
        </h4>
      </div>

      {items.length > 0 && (
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading checklist...</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 group rounded-md px-1.5 py-1 hover:bg-muted/50"
            >
              <Checkbox
                checked={item.isDone}
                disabled={busyId === item.id}
                onCheckedChange={() => handleToggle(item)}
              />
              <span
                className={`text-sm flex-1 min-w-0 truncate ${
                  item.isDone ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {item.content}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                disabled={busyId === item.id}
                onClick={() => handleRemove(item.id)}
              >
                {busyId === item.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add a checklist item..."
          className="h-8 text-sm"
          disabled={adding}
        />
        <Button type="submit" size="sm" variant="outline" disabled={adding || !newItem.trim()}>
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        </Button>
      </form>
    </div>
  )
}
