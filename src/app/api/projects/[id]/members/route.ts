import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const members = await db.projectMember.findMany({
    where: { projectId: id },
    include: { user: { select: { id: true, name: true, email: true, role: true, avatar: true } } },
    orderBy: { joinedAt: 'asc' },
  })
  return NextResponse.json(members)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { userId, role } = await req.json()

  try {
    const member = await db.projectMember.create({
      data: { projectId: id, userId, role: role || 'member' },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    })
    return NextResponse.json(member, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'User is already a member or not found' }, { status: 409 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { userId } = await req.json()
  await db.projectMember.delete({ where: { projectId_userId: { projectId: id, userId } } })
  return NextResponse.json({ success: true })
}