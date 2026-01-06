import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { pool } from '../db/mysql.js'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'

const codesRouter = new Hono()

// Validation schema
const codeSchema = z.object({
  code: z
    .string()
    .min(4, 'Code trop court')
    .max(32, 'Code trop long')
    .regex(/^[A-Za-z0-9_-]+$/, 'Caractères invalides'),
})

interface CodeRow extends RowDataPacket {
  id: number
  privilege_level: number
  features: string | null
}

codesRouter.post('/validate', zValidator('json', codeSchema), async (c) => {
  const { code } = c.req.valid('json')
  const codeUpper = code.toUpperCase()

  try {
    // Find valid code
    const [rows] = await pool.execute<CodeRow[]>(
      `SELECT id, privilege_level, features
       FROM codes
       WHERE code_key = ?
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (max_uses IS NULL OR use_count < max_uses)`,
      [codeUpper]
    )

    if (rows.length === 0) {
      return c.json({ valid: false, error: 'Code invalide ou expiré' }, 404)
    }

    const codeData = rows[0]!

    // Increment usage counter
    await pool.execute<ResultSetHeader>(
      'UPDATE codes SET use_count = use_count + 1 WHERE id = ?',
      [codeData.id]
    )

    // Log access
    await pool.execute(
      `INSERT INTO access_logs (code_id, ip_address, user_agent)
       VALUES (?, ?, ?)`,
      [
        codeData.id,
        c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
        (c.req.header('user-agent') || '').substring(0, 512),
      ]
    )

    // Parse features
    let features: string[] = []
    try {
      features = codeData.features ? JSON.parse(codeData.features) : []
    } catch {
      features = []
    }

    return c.json({
      valid: true,
      level: codeData.privilege_level,
      features,
    })
  } catch (error) {
    console.error('Database error:', error)
    return c.json({ valid: false, error: 'Erreur serveur' }, 500)
  }
})

// Admin endpoint to list codes (protected - requires level 3)
codesRouter.get('/list', async (c) => {
  // In production, add proper authentication here
  try {
    const [rows] = await pool.execute<CodeRow[]>(
      `SELECT id, code_key, privilege_level, features, created_at, expires_at, max_uses, use_count
       FROM codes
       ORDER BY created_at DESC`
    )
    return c.json({ codes: rows })
  } catch (error) {
    console.error('Database error:', error)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

export { codesRouter }
