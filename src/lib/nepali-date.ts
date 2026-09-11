import NepaliDate from 'nepali-datetime'

/**
 * Formats a BS Date string (YYYY-MM-DD) to a human readable format (e.g., Bhadra 25, 2083)
 */
export function formatBs(dateStr: string | null | undefined, formatStr: string = 'MMMM D, YYYY'): string {
  if (!dateStr) return ''
  try {
    const nd = new NepaliDate(dateStr)
    return nd.format(formatStr)
  } catch (e) {
    return dateStr
  }
}

/**
 * Converts an AD Date to BS and formats it (e.g. for createdAt timestamps)
 */
export function formatAdToBs(adDate: Date | string | null | undefined, formatStr: string = 'MMMM D, YYYY'): string {
  if (!adDate) return ''
  try {
    const dateObj = typeof adDate === 'string' ? new Date(adDate) : adDate
    const nd = new NepaliDate(dateObj)
    return nd.format(formatStr)
  } catch (e) {
    return String(adDate)
  }
}

/**
 * Gets today's BS date string in YYYY-MM-DD format
 */
export function getTodayBs(): string {
  return new NepaliDate().format('YYYY-MM-DD')
}
