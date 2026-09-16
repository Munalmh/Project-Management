import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const entries = await db.timesheetEntry.findMany({
    where: { ticketId: id },
    orderBy: { date: 'desc' },
    include: { user: { select: { id: true, name: true } } },
  })

  return NextResponse.json(entries)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const hours = Number(body.hours)
  if (!hours || hours <= 0 || hours > 24) {
    return NextResponse.json({ error: 'Hours must be between 0 and 24' }, { status: 400 })
  }
  const dateStr = typeof body.date === 'string' ? body.date : null
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: 'A valid date is required' }, { status: 400 })
  }

  const ticket = await db.ticket.findUnique({ where: { id } })
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  const user = session.user as { id: string }

  const entry = await db.timesheetEntry.create({
    data: {
      ticketId: id,
      userId: user.id,
      date: new Date(dateStr),
      hours,
      note: typeof body.note === 'string' ? body.note.trim() || null : null,
    },
    include: { user: { select: { id: true, name: true } } },
  })

  return NextResponse.json(entry, { status: 201 })
}
