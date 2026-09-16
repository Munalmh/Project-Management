import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { entryId } = await params
  const user = session.user as { id: string; role: string }

  const entry = await db.timesheetEntry.findUnique({ where: { id: entryId } })
  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

  // Only the person who logged the time, or an admin, can remove it.
  if (entry.userId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.timesheetEntry.delete({ where: { id: entryId } })

  return NextResponse.json({ success: true })
}
