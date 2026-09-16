import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { resolveProjectRow, type ParsedProjectRow } from '@/lib/project-excel'

interface CommitBody {
  rows: { rowNumber: number; raw: ParsedProjectRow['raw'] }[]
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const body = (await req.json()) as CommitBody
  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json({ error: 'No rows to import' }, { status: 400 })
  }
  if (body.rows.length > 500) {
    return NextResponse.json({ error: 'Please import 500 rows or fewer at a time.' }, { status: 400 })
  }

  let created = 0
  const failed: { rowNumber: number; name: string; error: string }[] = []

  for (const row of body.rows) {
    const resolved = resolveProjectRow(row.raw)
    if (!resolved.data) {
      failed.push({ rowNumber: row.rowNumber, name: row.raw.name, error: resolved.errors.join('; ') })
      continue
    }
    try {
      await db.project.create({
        data: {
          name: resolved.data.name,
          description: resolved.data.description,
          prefix: resolved.data.prefix,
          color: resolved.data.color,
          startDate: resolved.data.startDate ? new Date(resolved.data.startDate).toISOString() : null,
          endDate: resolved.data.endDate ? new Date(resolved.data.endDate).toISOString() : null,
          status: resolved.data.status,
          members: { create: { userId, role: 'manager' } },
          statuses: {
            create: [
              { name: 'To Do', color: '#3b82f6', sortOrder: 0, isCompleted: false },
              { name: 'In Progress', color: '#f59e0b', sortOrder: 1, isCompleted: false },
              { name: 'Done', color: '#22c55e', sortOrder: 2, isCompleted: true },
            ],
          },
        },
      })
      created += 1
    } catch (err) {
      console.error('Import row failed:', err)
      failed.push({ rowNumber: row.rowNumber, name: row.raw.name, error: 'Failed to create project' })
    }
  }

  return NextResponse.json({ created, failed })
}
