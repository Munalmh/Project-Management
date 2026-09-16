import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { itemId } = await params
  const body = await req.json()

  const data: { isDone?: boolean; content?: string } = {}
  if (typeof body.isDone === 'boolean') data.isDone = body.isDone
  if (typeof body.content === 'string' && body.content.trim()) data.content = body.content.trim()

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  try {
    const item = await db.checklistItem.update({ where: { id: itemId }, data })
    return NextResponse.json(item)
  } catch {
    return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { itemId } = await params

  try {
    await db.checklistItem.delete({ where: { id: itemId } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 })
  }
}
