'use client'

import { useMemo } from 'react'
import { differenceInCalendarDays, addDays, format, startOfWeek } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

interface GanttTicket {
  id: string
  title: string
  startDate: string | null
  dueDate: string | null
  status: { name: string; color: string }
}

interface ProjectGanttChartProps {
  tickets: GanttTicket[]
  onTicketClick?: (ticketId: string) => void
}

interface PlottedTicket extends GanttTicket {
  start: Date
  end: Date
  isMilestone: boolean // only one of start/due was set
}

const ROW_HEIGHT = 36
const LEFT_COL_WIDTH = 220

export function ProjectGanttChart({ tickets, onTicketClick }: ProjectGanttChartProps) {
  const { plotted, skippedCount, rangeStart, totalDays, weekMarks, today } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const plotted: PlottedTicket[] = []
    let skippedCount = 0

    for (const t of tickets) {
      if (!t.startDate && !t.dueDate) {
        skippedCount += 1
        continue
      }
      const start = t.startDate ? new Date(t.startDate) : new Date(t.dueDate as string)
      const end = t.dueDate ? new Date(t.dueDate) : new Date(t.startDate as string)
      const isMilestone = !t.startDate || !t.dueDate
      // Guard against a due date before its own start date (bad data) by swapping.
      plotted.push({
        ...t,
        start: start <= end ? start : end,
        end: start <= end ? end : start,
        isMilestone,
      })
    }

    if (plotted.length === 0) {
      return { plotted, skippedCount, rangeStart: today, totalDays: 1, weekMarks: [], today }
    }

    let minDate = plotted[0].start
    let maxDate = plotted[0].end
    for (const p of plotted) {
      if (p.start < minDate) minDate = p.start
      if (p.end > maxDate) maxDate = p.end
    }
    // Pad range by a couple days on each side, and always include today.
    if (today < minDate) minDate = today
    if (today > maxDate) maxDate = today
    const rangeStart = startOfWeek(addDays(minDate, -2))
    const rangeEnd = addDays(maxDate, 3)
    const totalDays = Math.max(differenceInCalendarDays(rangeEnd, rangeStart), 7)

    const weekMarks: Date[] = []
    for (let d = rangeStart; d <= rangeEnd; d = addDays(d, 7)) {
      weekMarks.push(d)
    }

    // Sort rows by start date so the chart reads top-to-bottom chronologically.
    plotted.sort((a, b) => a.start.getTime() - b.start.getTime())

    return { plotted, skippedCount, rangeStart, totalDays, weekMarks, today }
  }, [tickets])

  function pct(date: Date) {
    return (differenceInCalendarDays(date, rangeStart) / totalDays) * 100
  }

  if (plotted.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
          <Calendar className="h-10 w-10" />
          <p>No tickets have a start or due date yet</p>
          <p className="text-sm">Add dates to tickets to see them on the timeline.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div style={{ minWidth: LEFT_COL_WIDTH + weekMarks.length * 90 }}>
            {/* Header: week labels */}
            <div className="flex border-b sticky top-0 bg-card z-10">
              <div style={{ width: LEFT_COL_WIDTH }} className="shrink-0 px-3 py-2 text-xs font-medium text-muted-foreground border-r">
                Ticket
              </div>
              <div className="relative flex-1" style={{ height: 32 }}>
                {weekMarks.map((d, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full border-l text-[11px] text-muted-foreground pl-1.5 pt-2"
                    style={{ left: `${pct(d)}%` }}
                  >
                    {format(d, 'MMM d')}
                  </div>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div className="relative">
              {/* Today marker, spans all rows — positioned within a wrapper that starts
                  exactly where the timeline area starts, so its own percentage math lines
                  up with each row's timeline (percentages can't be multiplied in CSS calc). */}
              {today >= rangeStart && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-10"
                  style={{ left: LEFT_COL_WIDTH, right: 0 }}
                >
                  <div
                    className="absolute top-0 bottom-0 w-px bg-red-500"
                    style={{ left: `${pct(today)}%` }}
                  />
                </div>
              )}

              {plotted.map((t) => {
                const left = pct(t.start)
                const width = Math.max(pct(t.end) - pct(t.start), t.isMilestone ? 0 : 1.5)
                return (
                  <div
                    key={t.id}
                    className="flex border-b last:border-0 hover:bg-muted/40"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <div
                      style={{ width: LEFT_COL_WIDTH }}
                      className="shrink-0 px-3 flex items-center text-sm truncate border-r"
                      title={t.title}
                    >
                      {t.title}
                    </div>
                    <div className="relative flex-1">
                      {weekMarks.map((d, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 border-l border-dashed border-border/50"
                          style={{ left: `${pct(d)}%` }}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => onTicketClick?.(t.id)}
                        className="absolute rounded-md flex items-center transition-opacity hover:opacity-80"
                        style={{
                          left: `${left}%`,
                          width: t.isMilestone ? 0 : `${width}%`,
                          top: 7,
                          height: ROW_HEIGHT - 14,
                          backgroundColor: t.isMilestone ? 'transparent' : t.status.color,
                        }}
                      >
                        {t.isMilestone && (
                          <span
                            className="h-3 w-3 rotate-45 shrink-0"
                            style={{ backgroundColor: t.status.color }}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
      {skippedCount > 0 && (
        <div className="px-4 pb-3 text-xs text-muted-foreground">
          {skippedCount} ticket{skippedCount === 1 ? '' : 's'} without a start or due date not shown.
        </div>
      )}
    </Card>
  )
}
