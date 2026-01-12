import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pierre_legrand',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
}

export const pool = mysql.createPool(dbConfig)

// Test connection on startup
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection()
    console.log('✅ MySQL connected')
    connection.release()
    return true
  } catch (error) {
    console.error('❌ MySQL connection failed:', error)
    return false
  }
}

// Initialize tables if they don't exist
export async function initDatabase(): Promise<void> {
  const createCodesTable = `
    CREATE TABLE IF NOT EXISTS codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code_key VARCHAR(64) NOT NULL UNIQUE,
      privilege_level TINYINT NOT NULL DEFAULT 1,
      features JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NULL,
      max_uses INT NULL,
      use_count INT DEFAULT 0,
      INDEX idx_code_key (code_key)
    )
  `

  const createLogsTable = `
    CREATE TABLE IF NOT EXISTS access_logs (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      code_id INT,
      ip_address VARCHAR(45),
      user_agent VARCHAR(512),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (code_id) REFERENCES codes(id) ON DELETE SET NULL
    )
  `

  // Default codes for development
  const insertDefaultCodes = `
    INSERT IGNORE INTO codes (code_key, privilege_level, features) VALUES
    ('DEBUG2024', 3, '["debug_mode"]'),
    ('VIP2024', 2, '["vip_zone", "discount"]'),
    ('GOLD2024', 2, '["vip_zone"]')
  `

  // Whiteboard collaborative tables
  const createWhiteboardStateTable = `
    CREATE TABLE IF NOT EXISTS whiteboard_state (
      id INT PRIMARY KEY DEFAULT 1,
      image_data MEDIUMBLOB NOT NULL,
      image_hash CHAR(32) NOT NULL,
      version INT UNSIGNED NOT NULL DEFAULT 1,
      last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

  const createWhiteboardStrokesTable = `
    CREATE TABLE IF NOT EXISTS whiteboard_strokes (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      session_id CHAR(36) NOT NULL,
      stroke_data JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_session (session_id),
      INDEX idx_created (created_at)
    )
  `

  const createWhiteboardAuditTable = `
    CREATE TABLE IF NOT EXISTS whiteboard_audit_log (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      action ENUM('draw', 'reset', 'load') NOT NULL,
      ip_address VARCHAR(45),
      user_agent VARCHAR(256),
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_action_date (action, created_at)
    )
  `

  try {
    await pool.execute(createCodesTable)
    await pool.execute(createLogsTable)
    await pool.execute(insertDefaultCodes)
    await pool.execute(createWhiteboardStateTable)
    await pool.execute(createWhiteboardStrokesTable)
    await pool.execute(createWhiteboardAuditTable)
    console.log('✅ Database tables initialized')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
  }
}
