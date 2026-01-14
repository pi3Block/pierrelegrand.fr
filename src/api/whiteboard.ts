const API_URL = import.meta.env.VITE_API_URL || '/api'

// Session ID persisted for the browser session
let sessionId: string | null = null

function getSessionId(): string {
  if (!sessionId) {
    sessionId = crypto.randomUUID()
  }
  return sessionId
}

// New stroke format for server-side storage
export interface StrokeData {
  points: { x: number; y: number }[]
  color: string
  width: number
  tool: 'pen' | 'eraser'
}

// Stroke with server metadata
export interface ServerStroke extends StrokeData {
  id: number
  sessionId: string
  createdAt: string
}

export interface WhiteboardStateResponse {
  strokes: ServerStroke[]
  version: number
  lastModified: string
  error?: string
}

export interface StrokeResponse {
  success: boolean
  strokeId?: number
  version?: number
  error?: string
}

export interface PollResponse {
  hasUpdate: boolean
  version: number
  newStrokes?: ServerStroke[]
  error?: string
}

export interface InitResponse {
  success: boolean
  version: number
  error?: string
}

/**
 * Initialize whiteboard
 */
export async function initWhiteboard(): Promise<InitResponse> {
  try {
    const response = await fetch(`${API_URL}/whiteboard/init`, {
      method: 'POST',
    })

    if (!response.ok) {
      const data = await response.json()
      return { success: false, version: 0, error: data.error || 'Erreur serveur' }
    }

    return await response.json()
  } catch (error) {
    console.error('Whiteboard init error:', error)
    return { success: false, version: 0, error: 'Erreur de connexion' }
  }
}

/**
 * Fetch current whiteboard state (all strokes since last reset)
 */
export async function getWhiteboardState(currentVersion?: number): Promise<WhiteboardStateResponse | null> {
  try {
    const headers: HeadersInit = {}
    if (currentVersion !== undefined) {
      headers['If-None-Match'] = `"v${currentVersion}"`
    }

    const response = await fetch(`${API_URL}/whiteboard/state`, { headers })

    // No changes
    if (response.status === 304) {
      return null
    }

    if (!response.ok) {
      const data = await response.json()
      return { strokes: [], version: 0, lastModified: '', error: data.error || 'Erreur serveur' }
    }

    return await response.json()
  } catch (error) {
    console.error('Whiteboard state error:', error)
    return { strokes: [], version: 0, lastModified: '', error: 'Erreur de connexion' }
  }
}

/**
 * Submit a single stroke to the server
 */
export async function submitStroke(stroke: StrokeData): Promise<StrokeResponse> {
  try {
    const response = await fetch(`${API_URL}/whiteboard/stroke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: getSessionId(),
        stroke,
      }),
    })

    const data = await response.json()

    if (response.status === 429) {
      return { success: false, error: data.error || 'Trop de requêtes' }
    }

    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur serveur' }
    }

    return data
  } catch (error) {
    console.error('Whiteboard stroke error:', error)
    return { success: false, error: 'Erreur de connexion' }
  }
}

/**
 * Long-poll for whiteboard updates
 */
export async function pollWhiteboardUpdates(clientVersion: number, timeout = 30000): Promise<PollResponse> {
  try {
    const response = await fetch(
      `${API_URL}/whiteboard/poll?version=${clientVersion}&timeout=${timeout}`
    )

    if (!response.ok) {
      const data = await response.json()
      return { hasUpdate: false, version: clientVersion, error: data.error }
    }

    return await response.json()
  } catch (error) {
    console.error('Whiteboard poll error:', error)
    return { hasUpdate: false, version: clientVersion, error: 'Erreur de connexion' }
  }
}

/**
 * Get current session ID (for filtering own strokes)
 */
export function getCurrentSessionId(): string {
  return getSessionId()
}
