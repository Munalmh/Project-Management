import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const commentSchema = z.object({ content: z.string().min(1, 'Comment cannot be empty') })

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const userId = (session.user as { id: string }).id

  try {
    const body = await req.json()
    const data = commentSchema.parse(body)

    const comment = await db.ticketComment.create({
      data: { ticketId: id, userId, content: data.content },
      include: { user: { select: { id: true, name: true } } },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}