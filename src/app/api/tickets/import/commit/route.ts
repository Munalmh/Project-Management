import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { resolveTicketRow, buildTicketResolveContext, type ParsedTicketRow } from '@/lib/ticket-excel'

interface CommitBody {
  rows: { rowNumber: number; raw: ParsedTicketRow['raw'] }[]
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as { id: string; role: string }

  const body = (await req.json()) as CommitBody
  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json({ error: 'No rows to import' }, { status: 400 })
  }
  if (body.rows.length > 1000) {
    return NextResponse.json({ error: 'Please import 1000 rows or fewer at a time.' }, { status: 400 })
  }

  // Re-resolve fresh against the current database state — never trust client-supplied IDs,
  // and this guards against data changing between preview and confirm.
  const ctx = await buildTicketResolveContext(user.id, user.role)

  let created = 0
  const failed: { rowNumber: number; title: string; error: string }[] = []

  for (const row of body.rows) {
    const resolved = resolveTicketRow(row.raw, ctx)
    if (!resolved.data) {
      failed.push({ rowNumber: row.rowNumber, title: row.raw.title, error: resolved.errors.join('; ') })
      continue
    }
    try {
      await db.ticket.create({
        data: {
          title: resolved.data.title,
          description: resolved.data.description,
          projectId: resolved.data.projectId,
          statusId: resolved.data.statusId,
          priorityId: resolved.data.priorityId,
          createdById: user.id,
          startDate: resolved.data.startDate ? new Date(resolved.data.startDate).toISOString() : null,
          dueDate: resolved.data.dueDate ? new Date(resolved.data.dueDate).toISOString() : null,
          assignees: resolved.data.assigneeIds.length > 0
            ? { create: resolved.data.assigneeIds.map((uid) => ({ userId: uid, assignedById: user.id })) }
            : undefined,
        },
      })
      created += 1
    } catch (err) {
      console.error('Import row failed:', err)
      failed.push({ rowNumber: row.rowNumber, title: row.raw.title, error: 'Failed to create ticket' })
    }
  }

  return NextResponse.json({ created, failed })
}
