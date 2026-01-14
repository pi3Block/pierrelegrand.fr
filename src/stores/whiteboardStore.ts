import { create } from 'zustand'
import {
  getWhiteboardState,
  submitStroke,
  pollWhiteboardUpdates,
  initWhiteboard,
  getCurrentSessionId,
  type StrokeData,
  type ServerStroke,
} from '@api/whiteboard'

interface WhiteboardState {
  // State
  isLoading: boolean
  isConnected: boolean
  version: number
  serverStrokes: ServerStroke[]
  pendingStroke: StrokeData | null
  error: string | null

  // Drawing tools
  currentTool: 'pen' | 'eraser'
  currentColor: string
  currentWidth: number

  // Polling control
  isPolling: boolean

  // Actions
  addStroke: (stroke: StrokeData) => void
  setTool: (tool: 'pen' | 'eraser') => void
  setColor: (color: string) => void
  setWidth: (width: number) => void
  loadState: () => Promise<void>
  addNewStrokes: (strokes: ServerStroke[]) => void
  startPolling: () => void
  stopPolling: () => void
  reset: () => void
}

// Polling backoff configuration
const POLL_BASE_DELAY_MS = 1000
const POLL_MAX_DELAY_MS = 60000
const POLL_MAX_ERRORS = 10

export const useWhiteboardStore = create<WhiteboardState>((set, get) => ({
  // Initial state
  isLoading: true,
  isConnected: false,
  version: 0,
  serverStrokes: [],
  pendingStroke: null,
  error: null,
  currentTool: 'pen',
  currentColor: '#000000',
  currentWidth: 3,
  isPolling: false,

  addStroke: async (stroke) => {
    set({ pendingStroke: stroke })

    const response = await submitStroke(stroke)

    if (!response.success) {
      set({
        pendingStroke: null,
        error: response.error || 'Erreur lors de l\'envoi',
      })

      // Clear error after 3s
      setTimeout(() => set({ error: null }), 3000)
      return
    }

    // Success - update version, clear pending
    set((state) => ({
      version: response.version || state.version + 1,
      pendingStroke: null,
      error: null,
    }))
  },

  setTool: (tool) => {
    set({ currentTool: tool })
  },

  setColor: (color) => {
    set({
      currentColor: color,
      currentTool: 'pen',
    })
  },

  setWidth: (width) => {
    set({ currentWidth: Math.max(1, Math.min(50, width)) })
  },

  loadState: async () => {
    set({ isLoading: true, error: null })

    // Initialize whiteboard if needed
    const initResponse = await initWhiteboard()
    if (!initResponse.success && initResponse.error) {
      set({ isLoading: false, error: initResponse.error })
      return
    }

    const response = await getWhiteboardState()

    // No changes (304)
    if (response === null) {
      set({ isLoading: false })
      return
    }

    if (response.error) {
      set({ isLoading: false, error: response.error })
      return
    }

    set({
      version: response.version,
      serverStrokes: response.strokes,
      isLoading: false,
      isConnected: true,
      error: null,
    })

    // Emit event for canvas to redraw all strokes
    window.dispatchEvent(
      new CustomEvent('whiteboard:load', {
        detail: { strokes: response.strokes },
      })
    )
  },

  addNewStrokes: (strokes) => {
    // Filter out strokes from current session (already drawn locally)
    const currentSession = getCurrentSessionId()
    const newStrokes = strokes.filter(s => s.sessionId !== currentSession)

    if (newStrokes.length === 0) return

    set((state) => ({
      serverStrokes: [...state.serverStrokes, ...newStrokes],
    }))

    // Emit event for canvas to draw new strokes
    window.dispatchEvent(
      new CustomEvent('whiteboard:newStrokes', {
        detail: { strokes: newStrokes },
      })
    )
  },

  startPolling: () => {
    const { isPolling } = get()
    if (isPolling) return

    set({ isPolling: true })

    let errorCount = 0

    const poll = async () => {
      const { isPolling: stillPolling, version } = get()
      if (!stillPolling) return

      const response = await pollWhiteboardUpdates(version, 30000)

      // Handle errors with exponential backoff
      if (response.error) {
        errorCount++

        // Stop polling after too many consecutive errors
        if (errorCount >= POLL_MAX_ERRORS) {
          set({ isPolling: false, error: 'Connexion au serveur perdue' })
          return
        }

        // Exponential backoff: 1s, 2s, 4s, 8s... up to 60s
        const backoffDelay = Math.min(
          POLL_BASE_DELAY_MS * Math.pow(2, errorCount - 1),
          POLL_MAX_DELAY_MS
        )

        const { isPolling: continuePolling } = get()
        if (continuePolling) {
          setTimeout(poll, backoffDelay)
        }
        return
      }

      // Success - reset error count
      errorCount = 0

      if (response.hasUpdate && response.newStrokes) {
        // Update version and add new strokes
        set({ version: response.version })
        get().addNewStrokes(response.newStrokes)
      }

      // Continue polling if still active
      const { isPolling: continuePolling } = get()
      if (continuePolling) {
        // Small delay before next poll cycle
        setTimeout(poll, 100)
      }
    }

    poll()
  },

  stopPolling: () => {
    set({ isPolling: false })
  },

  reset: () => {
    set({
      serverStrokes: [],
      pendingStroke: null,
      error: null,
      version: 0,
    })
  },
}))
