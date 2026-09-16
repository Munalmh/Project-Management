'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Paperclip,
  FileText,
  Image as ImageIcon,
  FileArchive,
  File as FileIcon,
  X,
  Loader2,
  Download,
  Eye,
} from 'lucide-react'

interface Attachment {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  url: string
  createdAt: string
  uploadedBy: { id: string; name: string }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function iconFor(fileType: string) {
  if (fileType.startsWith('image/')) return ImageIcon
  if (fileType.includes('zip') || fileType.includes('compressed')) return FileArchive
  if (fileType.includes('pdf') || fileType.includes('text') || fileType.includes('document')) return FileText
  return FileIcon
}

// Types the browser can render natively, either inline (images) or in its
// own viewer tab (PDFs, plain text) — anything else falls back to just
// opening the raw URL, which the browser will handle as best it can.
function isPreviewable(fileType: string) {
  return fileType.startsWith('image/') || fileType === 'application/pdf' || fileType.startsWith('text/')
}

export function TicketAttachments({ ticketId }: { ticketId: string }) {
  const { data: session } = useSession()
  const currentUser = session?.user as { id?: string; role?: string } | undefined
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<Attachment | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function loadAttachments() {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/attachments`)
      if (res.ok) setAttachments(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAttachments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId])

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // allow re-selecting the same file later

    if (file.size > 4 * 1024 * 1024) {
      toast.error('File is too large. Max size is 4MB.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Upload failed')
      }
      const newAttachment = await res.json()
      setAttachments((prev) => [newAttachment, ...prev])
      toast.success('File attached')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemove(attachmentId: string) {
    setRemovingId(attachmentId)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to remove attachment')
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
      toast.success('Attachment removed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove attachment')
    } finally {
      setRemovingId(null)
    }
  }

  function handlePreview(a: Attachment) {
    if (a.fileType.startsWith('image/')) {
      // Images get a nice in-app lightbox.
      setPreviewItem(a)
    } else {
      // PDFs and text files open in a new browser tab and render natively
      // there (no 'download' attribute, so the browser shows them instead
      // of forcing a save-to-disk prompt).
      window.open(a.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Paperclip className="h-4 w-4" />
          Attachments {attachments.length > 0 && `(${attachments.length})`}
        </h4>
        <Button
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Paperclip className="h-3.5 w-3.5 mr-1.5" />
          )}
          {uploading ? 'Uploading...' : 'Attach file'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading attachments...</p>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No files attached yet.</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((a) => {
            const Icon = iconFor(a.fileType)
            const canRemove = currentUser?.id === a.uploadedBy.id || currentUser?.role === 'admin'
            const previewable = isPreviewable(a.fileType)
            return (
              <div
                key={a.id}
                className="flex items-center gap-2.5 rounded-md border p-2 group"
              >
                <button
                  type="button"
                  onClick={() => previewable && handlePreview(a)}
                  className={`h-8 w-8 rounded overflow-hidden bg-muted flex items-center justify-center shrink-0 ${previewable ? 'cursor-pointer' : 'cursor-default'}`}
                  title={previewable ? 'Click to preview' : undefined}
                >
                  {a.fileType.startsWith('image/') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.url} alt={a.fileName} className="h-full w-full object-cover" />
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => previewable && handlePreview(a)}
                  className={`min-w-0 flex-1 text-left ${previewable ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <p className="text-sm font-medium truncate">{a.fileName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatSize(a.fileSize)} · {a.uploadedBy.name} ·{' '}
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </p>
                </button>
                {previewable && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handlePreview(a)}
                    title="Preview"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                )}
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={a.fileName}
                  className="shrink-0"
                >
                  <Button size="icon" variant="ghost" className="h-7 w-7" title="Download">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </a>
                {canRemove && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    disabled={removingId === a.id}
                    onClick={() => handleRemove(a.id)}
                    title="Remove"
                  >
                    {removingId === a.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Image lightbox */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm truncate">{previewItem?.fileName}</DialogTitle>
          </DialogHeader>
          {previewItem && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewItem.url}
              alt={previewItem.fileName}
              className="max-h-[70vh] w-full object-contain rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
