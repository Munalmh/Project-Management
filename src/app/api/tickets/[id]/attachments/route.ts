import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { put } from '@vercel/blob'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB, safely under serverless body limits

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const attachments = await db.attachment.findMany({
        where: { ticketId: id },
        include: { uploadedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(attachments)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const user = session.user as { id: string }

    const ticket = await db.ticket.findUnique({ where: { id } })
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
            { error: 'File is too large. Max size is 4MB.' },
            { status: 400 }
        )
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const blob = await put(`tickets/${id}/${Date.now()}-${file.name}`, buffer, {
            access: 'public',
            contentType: file.type || 'application/octet-stream',
        })

        const attachment = await db.attachment.create({
            data: {
                ticketId: id,
                fileName: file.name,
                fileType: file.type || 'application/octet-stream',
                fileSize: file.size,
                url: blob.url,
                uploadedById: user.id,
            },
            include: { uploadedBy: { select: { id: true, name: true } } },
        })

        return NextResponse.json(attachment, { status: 201 })
    } catch (err) {
        console.error('Attachment upload failed:', err)
        return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
    }
}