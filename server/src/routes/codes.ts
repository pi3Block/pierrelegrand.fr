import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db/mysql.js'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'

const codesRouter = Router()

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

codesRouter.post('/validate', async (req, res) => {
  // Validate input
  const result = codeSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ valid: false, error: result.error.errors[0]?.message || 'Données invalides' })
    return
  }

  const { code } = result.data
  const codeUpper = code.toUpperCase()

  try {
    const [rows] = await pool.execute<CodeRow[]>(
      `SELECT id, privilege_level, features
       FROM codes
       WHERE code_key = ?
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (max_uses IS NULL OR use_count < max_uses)`,
      [codeUpper]
    )

    if (rows.length === 0) {
      res.status(404).json({ valid: false, error: 'Code invalide ou expiré' })
      return
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
        req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
        (req.headers['user-agent'] || '').substring(0, 512),
      ]
    )

    // Parse features
    let features: string[] = []
    try {
      features = codeData.features ? JSON.parse(codeData.features) : []
    } catch {
      features = []
    }

    res.json({
      valid: true,
      level: codeData.privilege_level,
      features,
    })
  } catch (error) {
    console.error('Database error:', error)
    res.status(500).json({ valid: false, error: 'Erreur serveur' })
  }
})

// Admin endpoint to list codes
codesRouter.get('/list', async (_req, res) => {
  try {
    const [rows] = await pool.execute<CodeRow[]>(
      `SELECT id, code_key, privilege_level, features, created_at, expires_at, max_uses, use_count
       FROM codes
       ORDER BY created_at DESC`
    )
    res.json({ codes: rows })
  } catch (error) {
    console.error('Database error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export { codesRouter }
