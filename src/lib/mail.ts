import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

interface SendMailOptions {
  to: string | string[]
  subject: string
  html: string
}

export async function sendMail({ to, subject, html }: SendMailOptions) {
  return transporter.sendMail({
    // Gmail always overwrites this with your authenticated account's address
    // regardless of what's put here — the display name still shows, though.
    from: `ProjectHub <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  })
}
