import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true,
      _count: { select: { createdTickets: true, assignedTickets: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const currentUser = session.user as { role: string }
  if (currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can create users' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = createUserSchema.parse(body)

    const existing = await db.user.findUnique({ where: { email: data.email } })
    if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 })

    const password = await hash(data.password, 12)
    const user = await db.user.create({
      data: { name: data.name, email: data.email, password, role: data.role || 'member' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    return NextResponse.json(user, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}