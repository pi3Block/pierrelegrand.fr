const API_URL = import.meta.env.VITE_API_URL || '/api'

// Session ID persisted for the browser session
let sessionId: string | null = null

function getSessionId(): string {
  if (!sessionId) {
    sessionId = crypto.randomUUID()
  }
  return sessionId
}

export interface Stroke {
  color: string
  lineWidth: number
  points: [number, number][]
}

export interface WhiteboardStateResponse {
  imageData: string // base64
  version: number
  lastModified: string
  error?: string
}

export interface StrokeResponse {
  success: boolean
  newVersion?: number
  newHash?: string
  error?: string
  action?: 'reload'
  serverVersion?: number
  retryAfter?: number
}

export interface PollResponse {
  hasUpdate: boolean
  version: number
  hash?: string
  error?: string
}

/**
 * Fetch current whiteboard state with ETag support
 */
export async function getWhiteboardState(currentHash?: string): Promise<WhiteboardStateResponse | null> {
  try {
    const headers: HeadersInit = {}
    if (currentHash) {
      headers['If-None-Match'] = `"${currentHash}"`
    }

    const response = await fetch(`${API_URL}/whiteboard/state`, { headers })

    // No changes
    if (response.status === 304) {
      return null
    }

    if (!response.ok) {
      const data = await response.json()
      return { imageData: '', version: 0, lastModified: '', error: data.error || 'Erreur serveur' }
    }

    return await response.json()
  } catch (error) {
    console.error('Whiteboard state error:', error)
    return { imageData: '', version: 0, lastModified: '', error: 'Erreur de connexion' }
  }
}

/**
 * Submit drawing strokes to the server
 */
export async function submitStrokes(strokes: Stroke[], clientVersion: number): Promise<StrokeResponse> {
  try {
    const response = await fetch(`${API_URL}/whiteboard/stroke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': getSessionId(),
      },
      body: JSON.stringify({ strokes, clientVersion }),
    })

    const data = await response.json()

    if (response.status === 429) {
      return { success: false, error: data.error, retryAfter: data.retryAfter || 60 }
    }

    if (response.status === 409) {
      return { success: false, error: data.error, action: 'reload', serverVersion: data.serverVersion }
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
 * Initialize whiteboard (called once on first load)
 */
export async function initWhiteboard(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/whiteboard/init`, {
      method: 'POST',
    })
    return response.ok
  } catch (error) {
    console.error('Whiteboard init error:', error)
    return false
  }
}
