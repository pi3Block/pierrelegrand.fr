import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { codesRouter } from './routes/codes.js'
import { healthRouter } from './routes/health.js'
import { whiteboardRouter } from './routes/whiteboard.js'
import { testConnection, initDatabase } from './db/mysql.js'

const app = express()

// Parsing JSON
app.use(express.json())

// Security headers
app.use(helmet())

// CORS
app.use(cors({
  origin: ['https://pierrelegrand.fr', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Session-Id'],
  maxAge: 86400,
}))

// Rate limiting (20 req/min per IP)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Trop de requêtes. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', limiter)

// Logging middleware
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/api/codes', codesRouter)
app.use('/api/health', healthRouter)
app.use('/api/whiteboard', whiteboardRouter)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
const port = parseInt(process.env.PORT || '3000', 10)

async function start() {
  const dbConnected = await testConnection()
  if (dbConnected) {
    await initDatabase()
  }

  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`)
  })
}

start()
