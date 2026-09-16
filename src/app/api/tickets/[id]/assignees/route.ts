import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendTicketAssignedEmail } from '@/lib/email'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const user = session.user as { id: string; name: string }
  const body = await req.json()
  const userId = body.userId as string
  if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })

  const ticket = await db.ticket.findUnique({
    where: { id },
    include: { project: { select: { name: true } } },
  })
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  const assignee = await db.user.findUnique({ where: { id: userId } })
  if (!assignee) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  try {
    const created = await db.ticketAssignee.create({
      data: { ticketId: id, userId, assignedById: user.id },
      include: { user: { select: { id: true, name: true } }, assignedBy: { select: { name: true } } },
    })

    if (userId !== user.id) {
      await sendTicketAssignedEmail({
        to: assignee.email,
        assigneeName: assignee.name,
        assignedByName: user.name,
        ticketTitle: ticket.title,
        ticketId: ticket.id,
        projectName: ticket.project.name,
        dueDate: ticket.dueDate ? ticket.dueDate.toISOString().slice(0, 10) : null,
      })
    }

    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'That person is already assigned to this ticket' }, { status: 409 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const userId = body.userId as string
  if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })

  await db.ticketAssignee.deleteMany({ where: { ticketId: id, userId } })

  return NextResponse.json({ success: true })
}
