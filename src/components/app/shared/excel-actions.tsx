'use client'

import { useState } from 'react'
import { FileDown, FileSpreadsheet, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExcelImportDialog } from './excel-import-dialog'

interface ExcelActionsProps {
  entityLabel: string
  exportUrl: string // e.g. /api/tickets/export — supports ?mode=template|data
  validateUrl: string
  commitUrl: string
  labelField: string
  subField?: string
  onImported?: () => void
  /** Extra query params appended to the "Export" (data mode) request only — e.g. current filters. */
  exportParams?: Record<string, string>
}

export function ExcelActions({
  entityLabel,
  exportUrl,
  validateUrl,
  commitUrl,
  labelField,
  subField,
  onImported,
  exportParams,
}: ExcelActionsProps) {
  const [importOpen, setImportOpen] = useState(false)

  const dataQuery = new URLSearchParams({ mode: 'data', ...exportParams }).toString()

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={`${exportUrl}?mode=template`}>
            <FileDown className="h-4 w-4 mr-1.5" />
            Template
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={`${exportUrl}?${dataQuery}`}>
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />
            Export
          </a>
        </Button>
        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4 mr-1.5" />
          Import
        </Button>
      </div>

      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title={`Import ${entityLabel}`}
        validateUrl={validateUrl}
        commitUrl={commitUrl}
        labelField={labelField}
        subField={subField}
        onImported={onImported}
      />
    </>
  )
}
