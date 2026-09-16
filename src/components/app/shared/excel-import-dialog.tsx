'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Upload, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface RawRow {
  rowNumber: number
  raw: Record<string, string>
  valid: boolean
  errors: string[]
}

interface ValidateResponse {
  totalRows: number
  validCount: number
  invalidCount: number
  rows: RawRow[]
}

interface CommitResponse {
  created: number
  failed: { rowNumber: number; error: string }[]
}

interface ExcelImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  validateUrl: string
  commitUrl: string
  /** Field key from `raw` to show as the row's main label (e.g. "title" or "name"). */
  labelField: string
  /** Field key from `raw` to show as a secondary/subtitle column (optional). */
  subField?: string
  onImported?: () => void
}

export function ExcelImportDialog({
  open,
  onOpenChange,
  title,
  validateUrl,
  commitUrl,
  labelField,
  subField,
  onImported,
}: ExcelImportDialogProps) {
  const [step, setStep] = useState<'pick' | 'preview' | 'result'>('pick')
  const [busy, setBusy] = useState(false)
  const [validation, setValidation] = useState<ValidateResponse | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [result, setResult] = useState<CommitResponse | null>(null)

  function reset() {
    setStep('pick')
    setValidation(null)
    setSelected(new Set())
    setResult(null)
  }

  function handleClose(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  async function handleFile(file: File) {
    setBusy(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(validateUrl, { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to read file')
      setValidation(json)
      setSelected(new Set(json.rows.filter((r: RawRow) => r.valid).map((r: RawRow) => r.rowNumber)))
      setStep('preview')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to read file')
    } finally {
      setBusy(false)
    }
  }

  async function handleImport() {
    if (!validation) return
    const rowsToImport = validation.rows.filter((r) => r.valid && selected.has(r.rowNumber))
    if (rowsToImport.length === 0) {
      toast.error('Select at least one valid row to import')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(commitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: rowsToImport.map((r) => ({ rowNumber: r.rowNumber, raw: r.raw })) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Import failed')
      setResult(json)
      setStep('result')
      if (json.created > 0) onImported?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  function toggleRow(rowNumber: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(rowNumber)) next.delete(rowNumber)
      else next.add(rowNumber)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {step === 'pick' && 'Upload a filled-in .xlsx file to import.'}
            {step === 'preview' && 'Review the rows below, then confirm the import.'}
            {step === 'result' && 'Import complete.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'pick' && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed rounded-lg">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Select an .xlsx file to upload</p>
            <Button asChild disabled={busy} variant="outline">
              <label className="cursor-pointer">
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Choose File
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(file)
                    e.target.value = ''
                  }}
                />
              </label>
            </Button>
          </div>
        )}

        {step === 'preview' && validation && (
          <div className="flex-1 overflow-hidden flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                {validation.validCount} valid
              </Badge>
              {validation.invalidCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  <XCircle className="h-3.5 w-3.5 text-red-600" />
                  {validation.invalidCount} with errors
                </Badge>
              )}
            </div>
            <div className="flex-1 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="w-12">Row</TableHead>
                    <TableHead>{labelField}</TableHead>
                    {subField && <TableHead>{subField}</TableHead>}
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validation.rows.map((row) => (
                    <TableRow key={row.rowNumber} className={!row.valid ? 'opacity-60' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(row.rowNumber)}
                          disabled={!row.valid}
                          onCheckedChange={() => toggleRow(row.rowNumber)}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.rowNumber}</TableCell>
                      <TableCell className="font-medium">{row.raw[labelField] || '—'}</TableCell>
                      {subField && <TableCell>{row.raw[subField] || '—'}</TableCell>}
                      <TableCell>
                        {row.valid ? (
                          <span className="text-green-600 text-xs">Ready</span>
                        ) : (
                          <span className="text-red-600 text-xs">{row.errors.join('; ')}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
            <p className="font-medium">{result.created} row{result.created === 1 ? '' : 's'} imported successfully</p>
            {result.failed.length > 0 && (
              <div className="text-sm text-red-600 mt-3 text-left border rounded-md p-3 max-h-40 overflow-y-auto">
                {result.failed.map((f) => (
                  <div key={f.rowNumber}>Row {f.rowNumber}: {f.error}</div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => reset()} disabled={busy}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={busy || selected.size === 0}>
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Import {selected.size} row{selected.size === 1 ? '' : 's'}
              </Button>
            </>
          )}
          {step === 'result' && (
            <Button onClick={() => handleClose(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
