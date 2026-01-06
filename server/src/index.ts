import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { logger } from 'hono/logger'
import { codesRouter } from './routes/codes.js'
import { healthRouter } from './routes/health.js'

const app = new Hono()

// Logging
app.use('*', logger())

// Security headers
app.use('*', secureHeaders())

// CORS
app.use(
  '/api/*',
  cors({
    origin: ['https://pierrelegrand.fr', 'http://localhost:5173'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400,
  })
)

// Rate limiting simple (en mémoire)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

app.use('/api/*', async (c, next) => {
  const ip = c.req.header('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const limit = 20

  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
  } else if (record.count >= limit) {
    return c.json({ error: 'Trop de requêtes. Réessayez plus tard.' }, 429)
  } else {
    record.count++
  }

  await next()
})

// Routes
app.route('/api/codes', codesRouter)
app.route('/api/health', healthRouter)

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

const port = parseInt(process.env.PORT || '3000', 10)

console.log(`🚀 Server starting on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
