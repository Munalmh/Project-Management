'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2, Shield, Users, Mail, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface TeamUser {
  id: string; name: string; email: string; role: string; avatar?: string; createdAt: string
  _count: { createdTickets: number; assignedTickets: number }
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const roleColors: Record<string, string> = { admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', manager: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', member: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' }

export function TeamPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<TeamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<TeamUser | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const isAdmin = (session?.user as { role: string } | undefined)?.role === 'admin'

  async function loadUsers() {
    const res = await fetch('/api/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  /* eslint-disable */
  useEffect(() => { setLoading(true); loadUsers() }, [])
  /* eslint-enable */

  function openCreate() {
    setEditingUser(null)
    setForm({ name: '', email: '', password: '', role: 'member' })
    setDialogOpen(true)
  }

  function openEdit(user: TeamUser) {
    setEditingUser(user)
    setForm({ name: user.name, email: user.email, password: '', role: user.role })
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editingUser) {
        const body: Record<string, string> = { name: form.name, email: form.email, role: form.role }
        if (form.password) body.password = form.password
        const res = await fetch(`/api/users/${editingUser.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (res.ok) { toast.success('User updated'); setDialogOpen(false); loadUsers() }
        else { const d = await res.json(); toast.error(d.error) }
      } else {
        const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        if (res.ok) { toast.success('User created'); setDialogOpen(false); loadUsers() }
        else { const d = await res.json(); toast.error(d.error) }
      }
    } catch { toast.error('Operation failed') }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/users/${deleteId}`, { method: 'DELETE' })
      if (res.ok) { toast.success('User deleted'); setDeleteId(null); loadUsers() }
      else toast.error('Failed to delete user')
    } catch { toast.error('Failed to delete user') }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">Team Members</h1>
        <Badge variant="secondary">{users.length}</Badge>
        <div className="flex-1" />
        {isAdmin && <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" /> Add Member</Button>}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(user => {
            const totalTickets = user._count.createdTickets + user._count.assignedTickets
            return (
              <Card key={user.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{user.email}</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(user)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(user.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge className={roleColors[user.role] || roleColors.member}>{user.role}</Badge>
                    <span className="text-xs text-muted-foreground">Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t">
                    <div className="text-center">
                      <p className="text-lg font-semibold">{user._count.assignedTickets}</p>
                      <p className="text-[11px] text-muted-foreground">Assigned</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold">{user._count.createdTickets}</p>
                      <p className="text-[11px] text-muted-foreground">Created</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit Member' : 'Add Member'}</DialogTitle>
            <DialogDescription>{editingUser ? 'Update team member details.' : 'Add a new team member to the organization.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@company.com" />
            </div>
            <div className="space-y-2">
              <Label>{editingUser ? 'New Password (leave blank to keep)' : 'Password *'}</Label>
              <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={editingUser ? 'Leave blank to keep current' : 'Min 6 characters'} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.email || (!editingUser && !form.password)}>
              {saving ? 'Saving...' : editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Member</DialogTitle><DialogDescription>Are you sure? This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
