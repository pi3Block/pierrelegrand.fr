/**
 * pingpongStore - Store Zustand pour le mini-jeu Ping-Pong.
 *
 * Gère l'état du jeu : score, audio, input mobile.
 */

import { create } from 'zustand'

interface PingPongState {
  // Game state
  isPlaying: boolean
  isPaused: boolean
  score: number
  highScore: number

  // Audio
  isMuted: boolean
  lastHitForce: number

  // Mobile
  isMobile: boolean
  paddleInput: { x: number; y: number }

  // Actions
  setIsPlaying: (playing: boolean) => void
  setIsPaused: (paused: boolean) => void
  incrementScore: () => void
  resetScore: () => void
  setLastHitForce: (force: number) => void
  setIsMuted: (muted: boolean) => void
  setIsMobile: (mobile: boolean) => void
  setPaddleInput: (input: { x: number; y: number }) => void
  reset: () => void
}

// Load high score from localStorage
const getStoredHighScore = (): number => {
  if (typeof window === 'undefined') return 0
  const stored = localStorage.getItem('pingpongHighScore')
  return stored ? parseInt(stored, 10) : 0
}

export const usePingPongStore = create<PingPongState>((set, get) => ({
  // Initial state
  isPlaying: false,
  isPaused: false,
  score: 0,
  highScore: getStoredHighScore(),
  isMuted: false,
  lastHitForce: 0,
  isMobile: false,
  paddleInput: { x: 0, y: 0 },

  // Actions
  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setIsPaused: (paused) => set({ isPaused: paused }),

  incrementScore: () => {
    const { score, highScore } = get()
    const newScore = score + 1
    const newHighScore = Math.max(newScore, highScore)

    // Persist high score
    if (newHighScore > highScore) {
      localStorage.setItem('pingpongHighScore', newHighScore.toString())
    }

    set({ score: newScore, highScore: newHighScore })
  },

  resetScore: () => set({ score: 0 }),

  setLastHitForce: (force) => set({ lastHitForce: force }),

  setIsMuted: (muted) => set({ isMuted: muted }),

  setIsMobile: (mobile) => set({ isMobile: mobile }),

  setPaddleInput: (input) => set({ paddleInput: input }),

  reset: () =>
    set({
      isPlaying: false,
      isPaused: false,
      score: 0,
      lastHitForce: 0,
      paddleInput: { x: 0, y: 0 },
    }),
}))

/**
 * Selectors
 */
export const pingpongSelectors = {
  canPlay: (state: PingPongState) => state.isPlaying && !state.isPaused,
}
