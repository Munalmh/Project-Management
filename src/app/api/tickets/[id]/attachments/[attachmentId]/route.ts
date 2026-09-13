import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { del } from '@vercel/blob'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { attachmentId } = await params
    const user = session.user as { id: string; role: string }

    const attachment = await db.attachment.findUnique({ where: { id: attachmentId } })
    if (!attachment) return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })

    // Only the uploader or an admin can remove an attachment.
    if (attachment.uploadedById !== user.id && user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        await del(attachment.url)
    } catch (err) {
        console.error('Failed to delete blob (continuing to remove DB record):', err)
    }

    await db.attachment.delete({ where: { id: attachmentId } })

    return NextResponse.json({ success: true })
}