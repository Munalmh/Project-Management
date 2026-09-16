import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const items = await db.checklistItem.findMany({
    where: { ticketId: id },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json(items)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const content = (body.content as string)?.trim()
  if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

  const ticket = await db.ticket.findUnique({ where: { id } })
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  const lastItem = await db.checklistItem.findFirst({
    where: { ticketId: id },
    orderBy: { sortOrder: 'desc' },
  })

  const item = await db.checklistItem.create({
    data: {
      ticketId: id,
      content,
      sortOrder: (lastItem?.sortOrder ?? -1) + 1,
    },
  })

  return NextResponse.json(item, { status: 201 })
}
