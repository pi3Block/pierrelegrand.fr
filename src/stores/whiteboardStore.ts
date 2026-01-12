import { create } from 'zustand'
import {
  getWhiteboardState,
  submitStrokes,
  pollWhiteboardUpdates,
  initWhiteboard,
  type Stroke,
} from '@api/whiteboard'

interface WhiteboardState {
  // State
  isLoading: boolean
  isConnected: boolean
  version: number
  imageHash: string | null
  localStrokes: Stroke[]
  pendingStrokes: Stroke[]
  error: string | null

  // Drawing tools
  currentTool: 'marker' | 'eraser'
  currentColor: string

  // Polling control
  isPolling: boolean
  pollAbortController: AbortController | null

  // Sync debounce
  syncTimeoutId: ReturnType<typeof setTimeout> | null

  // Actions
  addStroke: (stroke: Stroke) => void
  setTool: (tool: 'marker' | 'eraser', color?: string) => void
  setColor: (color: string) => void
  loadState: () => Promise<void>
  syncStrokes: () => Promise<void>
  startPolling: () => void
  stopPolling: () => void
  reset: () => void
}

// Debounce delay for syncing strokes
const SYNC_DEBOUNCE_MS = 150

export const useWhiteboardStore = create<WhiteboardState>((set, get) => ({
  // Initial state
  isLoading: true,
  isConnected: false,
  version: 0,
  imageHash: null,
  localStrokes: [],
  pendingStrokes: [],
  error: null,
  currentTool: 'marker',
  currentColor: '#000000',
  isPolling: false,
  pollAbortController: null,
  syncTimeoutId: null,

  addStroke: (stroke) => {
    set((state) => ({
      localStrokes: [...state.localStrokes, stroke],
    }))

    // Debounce sync
    const { syncTimeoutId } = get()
    if (syncTimeoutId) {
      clearTimeout(syncTimeoutId)
    }

    const newTimeoutId = setTimeout(() => {
      get().syncStrokes()
    }, SYNC_DEBOUNCE_MS)

    set({ syncTimeoutId: newTimeoutId })
  },

  setTool: (tool, color) => {
    set({
      currentTool: tool,
      currentColor: tool === 'eraser' ? '#FFFFFF' : (color || get().currentColor),
    })
  },

  setColor: (color) => {
    set({
      currentColor: color,
      currentTool: 'marker',
    })
  },

  loadState: async () => {
    set({ isLoading: true, error: null })

    // Initialize whiteboard if needed
    await initWhiteboard()

    const { imageHash } = get()
    const response = await getWhiteboardState(imageHash || undefined)

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
      imageHash: response.imageData ? hashString(response.imageData) : null,
      isLoading: false,
      isConnected: true,
      error: null,
    })

    // Emit event for canvas update
    window.dispatchEvent(
      new CustomEvent('whiteboard:update', {
        detail: { imageData: response.imageData },
      })
    )
  },

  syncStrokes: async () => {
    const { localStrokes, version, pendingStrokes } = get()

    // Nothing to sync
    if (localStrokes.length === 0) {
      return
    }

    // Already syncing
    if (pendingStrokes.length > 0) {
      return
    }

    const strokesToSync = [...localStrokes]
    set({ localStrokes: [], pendingStrokes: strokesToSync })

    const response = await submitStrokes(strokesToSync, version)

    if (response.action === 'reload') {
      // Version conflict - reload state
      set({ pendingStrokes: [] })
      await get().loadState()
      return
    }

    if (response.retryAfter) {
      // Rate limited - re-add strokes and wait
      set((state) => ({
        localStrokes: [...strokesToSync, ...state.localStrokes],
        pendingStrokes: [],
        error: response.error || 'Rate limit atteint',
      }))

      // Clear error after delay
      setTimeout(() => {
        set({ error: null })
      }, response.retryAfter * 1000)
      return
    }

    if (!response.success) {
      // Generic error - re-add strokes for retry
      set((state) => ({
        localStrokes: [...strokesToSync, ...state.localStrokes],
        pendingStrokes: [],
        error: response.error || 'Erreur de sync',
      }))
      return
    }

    // Success
    set({
      version: response.newVersion || version + 1,
      imageHash: response.newHash || null,
      pendingStrokes: [],
      error: null,
    })
  },

  startPolling: () => {
    const { isPolling } = get()
    if (isPolling) return

    set({ isPolling: true })

    const poll = async () => {
      const { isPolling: stillPolling, version } = get()
      if (!stillPolling) return

      const response = await pollWhiteboardUpdates(version, 30000)

      if (response.hasUpdate) {
        // Fetch the new state
        await get().loadState()
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
    const { syncTimeoutId } = get()
    if (syncTimeoutId) {
      clearTimeout(syncTimeoutId)
    }
    set({ isPolling: false, syncTimeoutId: null })
  },

  reset: () => {
    const { syncTimeoutId } = get()
    if (syncTimeoutId) {
      clearTimeout(syncTimeoutId)
    }
    set({
      localStrokes: [],
      pendingStrokes: [],
      error: null,
      syncTimeoutId: null,
    })
  },
}))

// Simple hash function for comparing image data
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(16)
}
