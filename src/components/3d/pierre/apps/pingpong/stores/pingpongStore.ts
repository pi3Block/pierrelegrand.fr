/**
 * pingpongStore - Store Zustand pour le mini-jeu Ping-Pong.
 *
 * Gère l'état du jeu : score, audio, input mobile, combo, difficulté.
 */

import { create } from 'zustand'

interface PingPongState {
  // Game state
  isPlaying: boolean
  isPaused: boolean
  score: number
  highScore: number

  // Combo system
  combo: number
  maxCombo: number
  lastHitTime: number
  comboTimeWindow: number // ms pour maintenir le combo

  // Difficulty
  difficultyLevel: number
  gravity: number

  // Audio
  isMuted: boolean
  lastHitForce: number

  // Mobile
  isMobile: boolean
  paddleInput: { x: number; y: number }
  gyroRotation: { alpha: number; beta: number; gamma: number }
  isGyroEnabled: boolean

  // Actions
  setIsPlaying: (playing: boolean) => void
  setIsPaused: (paused: boolean) => void
  incrementScore: () => void
  resetScore: () => void
  setLastHitForce: (force: number) => void
  setIsMuted: (muted: boolean) => void
  setIsMobile: (mobile: boolean) => void
  setPaddleInput: (input: { x: number; y: number }) => void
  setGyroRotation: (rotation: { alpha: number; beta: number; gamma: number }) => void
  setIsGyroEnabled: (enabled: boolean) => void
  registerHit: () => void // Gère combo + score + difficulté
  reset: () => void
}

// Load high score from localStorage
const getStoredHighScore = (): number => {
  if (typeof window === 'undefined') return 0
  const stored = localStorage.getItem('pingpongHighScore')
  return stored ? parseInt(stored, 10) : 0
}

// Configuration des paliers de difficulté
const DIFFICULTY_CONFIG = {
  baseGravity: -40,
  gravityIncrement: -5, // Augmente la gravité tous les X points
  scorePerLevel: 5, // Palier de score pour augmenter la difficulté
  maxGravity: -80, // Gravité maximale
}

// Configuration du combo
const COMBO_CONFIG = {
  timeWindow: 2000, // 2 secondes pour maintenir le combo
  bonusMultiplier: 0.5, // Bonus de 50% du combo en points
}

export const usePingPongStore = create<PingPongState>((set, get) => ({
  // Initial state
  isPlaying: false,
  isPaused: false,
  score: 0,
  highScore: getStoredHighScore(),

  // Combo
  combo: 0,
  maxCombo: 0,
  lastHitTime: 0,
  comboTimeWindow: COMBO_CONFIG.timeWindow,

  // Difficulty
  difficultyLevel: 1,
  gravity: DIFFICULTY_CONFIG.baseGravity,

  // Audio
  isMuted: false,
  lastHitForce: 0,

  // Mobile
  isMobile: false,
  paddleInput: { x: 0, y: 0 },
  gyroRotation: { alpha: 0, beta: 0, gamma: 0 },
  isGyroEnabled: false,

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

  resetScore: () =>
    set({
      score: 0,
      combo: 0,
      difficultyLevel: 1,
      gravity: DIFFICULTY_CONFIG.baseGravity,
    }),

  setLastHitForce: (force) => set({ lastHitForce: force }),

  setIsMuted: (muted) => set({ isMuted: muted }),

  setIsMobile: (mobile) => set({ isMobile: mobile }),

  setPaddleInput: (input) => set({ paddleInput: input }),

  setGyroRotation: (rotation) => set({ gyroRotation: rotation }),

  setIsGyroEnabled: (enabled) => set({ isGyroEnabled: enabled }),

  /**
   * Gère un hit valide : combo, score avec bonus, difficulté progressive
   */
  registerHit: () => {
    const { score, highScore, combo, maxCombo, lastHitTime, comboTimeWindow } =
      get()
    const now = Date.now()

    // Vérifier si le combo est maintenu
    const timeSinceLastHit = now - lastHitTime
    const isComboMaintained = timeSinceLastHit < comboTimeWindow

    // Calculer le nouveau combo
    const newCombo = isComboMaintained ? combo + 1 : 1
    const newMaxCombo = Math.max(newCombo, maxCombo)

    // Calculer le score avec bonus combo
    const comboBonus = Math.floor(newCombo * COMBO_CONFIG.bonusMultiplier)
    const pointsEarned = 1 + comboBonus
    const newScore = score + pointsEarned
    const newHighScore = Math.max(newScore, highScore)

    // Persist high score
    if (newHighScore > highScore) {
      localStorage.setItem('pingpongHighScore', newHighScore.toString())
    }

    // Calculer la nouvelle difficulté
    const newDifficultyLevel =
      Math.floor(newScore / DIFFICULTY_CONFIG.scorePerLevel) + 1
    const gravityIncrease =
      (newDifficultyLevel - 1) * DIFFICULTY_CONFIG.gravityIncrement
    const newGravity = Math.max(
      DIFFICULTY_CONFIG.baseGravity + gravityIncrease,
      DIFFICULTY_CONFIG.maxGravity
    )

    set({
      score: newScore,
      highScore: newHighScore,
      combo: newCombo,
      maxCombo: newMaxCombo,
      lastHitTime: now,
      difficultyLevel: newDifficultyLevel,
      gravity: newGravity,
    })
  },

  reset: () =>
    set({
      isPlaying: false,
      isPaused: false,
      score: 0,
      combo: 0,
      maxCombo: 0,
      lastHitTime: 0,
      difficultyLevel: 1,
      gravity: DIFFICULTY_CONFIG.baseGravity,
      lastHitForce: 0,
      paddleInput: { x: 0, y: 0 },
      gyroRotation: { alpha: 0, beta: 0, gamma: 0 },
    }),
}))

/**
 * Selectors
 */
export const pingpongSelectors = {
  canPlay: (state: PingPongState) => state.isPlaying && !state.isPaused,
}
