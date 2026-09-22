// Entry point for cPanel's "Setup Node.js App" (Phusion Passenger).
// Next.js's own built-in server (`next start`) doesn't plug directly into
// Passenger's expectations, so this small wrapper is needed instead.
// Set this as the "Application startup file" in cPanel.

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(process.env.PORT || 3000, (err) => {
    if (err) throw err
    console.log('> Ready on port ' + (process.env.PORT || 3000))
  })
})
