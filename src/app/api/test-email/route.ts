// TEMPORARY — delete this file once you've confirmed email sending works.
// Visit /api/test-email in your browser (while logged in doesn't matter, this
// route has no auth check since it's just for local testing).
import { NextResponse } from 'next/server'
import { sendMail } from '@/lib/mail'

export async function GET() {
  try {
    await sendMail({
      to: 'mahatodevmunal@gmail.com', // change to whichever address you're testing
      subject: 'ProjectHub SMTP test',
      html: '<p>If you got this, your SMTP setup works! 🎉</p>',
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Test email failed:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
