import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Biome = 'lab' | 'temple' | 'bank'
export type Level = 1 | 2

/**
 * Position 3D du personnage pour le système de tir TPS.
 * Contient x, y, z en coordonnées monde.
 */
export interface CharacterPosition {
  x: number
  y: number
  z: number
}

interface GameState {
  // Navigation
  currentBiome: Biome
  currentLevel: Level
  isTransitioning: boolean

  // Privileges
  privilegeLevel: number
  unlockedFeatures: string[]

  // Character (position pour le tir TPS)
  characterPosition: CharacterPosition

  // Actions
  setCurrentBiome: (biome: Biome) => void
  setCurrentLevel: (level: Level) => void
  setTransitioning: (transitioning: boolean) => void
  unlockFeatures: (level: number, features: string[]) => void
  hasFeature: (feature: string) => boolean
  setCharacterPosition: (position: CharacterPosition) => void
  reset: () => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentBiome: 'lab',
      currentLevel: 1,
      isTransitioning: false,
      privilegeLevel: 0,
      unlockedFeatures: [],
      characterPosition: { x: 0, y: 0, z: 0 },

      // Actions
      setCurrentBiome: (biome) => set({ currentBiome: biome }),

      setCurrentLevel: (level) => set({ currentLevel: level }),

      setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),

      unlockFeatures: (level, features) =>
        set((state) => ({
          privilegeLevel: Math.max(state.privilegeLevel, level),
          unlockedFeatures: [...new Set([...state.unlockedFeatures, ...features])],
        })),

      hasFeature: (feature) => get().unlockedFeatures.includes(feature),

      setCharacterPosition: (position) => set({ characterPosition: position }),

      reset: () =>
        set({
          privilegeLevel: 0,
          unlockedFeatures: [],
        }),
    }),
    {
      name: 'pierre-legrand-game',
      // Ne pas persister characterPosition (donnée runtime uniquement)
      partialize: (state) => ({
        privilegeLevel: state.privilegeLevel,
        unlockedFeatures: state.unlockedFeatures,
      }),
    }
  )
)
