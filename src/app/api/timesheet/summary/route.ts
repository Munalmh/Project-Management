import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as { id: string }

  // We want to calculate the total hours for today, and this week (Mon-Sun)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // Calculate start of week (Monday)
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  const startOfWeek = new Date(today.setDate(diff))
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 6)

  // Need to get all timesheet entries for this user in the current week
  const entries = await db.timesheetEntry.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
    },
  })

  // Re-calculate today just in case
  const actualToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  let dailyTotal = 0
  let weeklyTotal = 0

  for (const entry of entries) {
    weeklyTotal += entry.hours
    if (entry.date.getTime() === actualToday.getTime()) {
      dailyTotal += entry.hours
    }
  }

  return NextResponse.json({ dailyTotal, weeklyTotal })
}
