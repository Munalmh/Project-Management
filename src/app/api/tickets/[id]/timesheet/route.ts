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
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const hours = Number(body.hours)
    if (!hours || hours <= 0) {
      return NextResponse.json({ error: 'Hours must be greater than 0' }, { status: 400 })
    }
    if (hours > 24) {
      return NextResponse.json({ error: 'Cannot log more than 24 hours at once' }, { status: 400 })
    }

    const dateStr = typeof body.date === 'string' ? body.date : null
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json({ error: 'A valid date is required (YYYY-MM-DD)' }, { status: 400 })
    }

    const ticket = await db.ticket.findUnique({ where: { id } })
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    const user = session.user as { id: string }
    const entryDate = new Date(dateStr)

    // Validate daily total across all tickets for this user
    const existingEntries = await db.timesheetEntry.findMany({
      where: {
        userId: user.id,
        date: entryDate,
      },
    })
    
    const dailyTotal = existingEntries.reduce((sum, e) => sum + e.hours, 0)
    if (dailyTotal + hours > 24) {
      return NextResponse.json({ 
        error: `Daily total cannot exceed 24 hours. You already logged ${dailyTotal}h on ${dateStr}.` 
      }, { status: 400 })
    }

    const entry = await db.timesheetEntry.create({
      data: {
        ticketId: id,
        userId: user.id,
        date: entryDate,
        hours,
        note: typeof body.note === 'string' ? body.note.trim() || null : null,
      },
      include: { user: { select: { id: true, name: true } } },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error: any) {
    console.error('TIMESHEET API ERROR:', error)
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 })
  }
}

