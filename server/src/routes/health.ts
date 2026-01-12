import { Router } from 'express'
import { pool } from '../db/mysql.js'

const healthRouter = Router()

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  memory: NodeJS.MemoryUsage
  database: string
}

healthRouter.get('/', async (_req, res) => {
  const checks: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'unknown',
  }

  // Test database connection
  try {
    const start = Date.now()
    await pool.execute('SELECT 1')
    const latency = Date.now() - start
    checks.database = `ok (${latency}ms)`
  } catch (error) {
    checks.status = 'degraded'
    checks.database = 'error'
    console.error('Health check - DB error:', error)
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503
  res.status(statusCode).json(checks)
})

// Simple ping endpoint
healthRouter.get('/ping', (_req, res) => {
  res.send('pong')
})

export { healthRouter }
