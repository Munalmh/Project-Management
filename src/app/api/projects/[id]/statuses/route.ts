import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const statusSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  sortOrder: z.number().optional(),
  isCompleted: z.boolean().optional(),
})

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const statuses = await db.ticketStatus.findMany({
    where: { projectId: id },
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { tickets: true } } },
  })
  return NextResponse.json(statuses)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const body = await req.json()
    const data = statusSchema.parse(body)
    const status = await db.ticketStatus.create({
      data: { projectId: id, ...data },
      include: { _count: { select: { tickets: true } } },
    })
    return NextResponse.json(status, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create status' }, { status: 500 })
  }
}