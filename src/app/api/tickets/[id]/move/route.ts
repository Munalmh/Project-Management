import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { statusId } = await req.json()

  const ticket = await db.ticket.update({
    where: { id },
    data: { statusId },
    include: {
      status: true,
      priority: true,
      assignees: { include: { user: { select: { id: true, name: true } } } },
    },
  })

  return NextResponse.json(ticket)
}