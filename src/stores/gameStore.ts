import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Biome = 'lab' | 'temple' | 'bank'

/**
 * Niveaux disponibles:
 * - 0: Hub (monde avec personnage)
 * - 1: WorldClassic
 * - 2: WorldPlayground
 * - 3: ProceduralWorld
 * - 4: World4 (Angry Birds)
 * - 5: PierreWorld (bureau 3D avec OrbitControls) - SCÈNE PRINCIPALE
 */
export type Level = 0 | 1 | 2 | 3 | 4 | 5

/**
 * Position 3D du personnage pour le système de tir TPS.
 * Contient x, y, z en coordonnées monde.
 */
export interface CharacterPosition {
  x: number
  y: number
  z: number
}

/**
 * État du système de charge pour le tir.
 * chargeLevel: 0 = pas de charge, 1 = charge max
 * isCharging: true si le joueur maintient le clic
 */
interface ChargeState {
  chargeLevel: number
  isCharging: boolean
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

  // Système de charge du tir
  chargeState: ChargeState

  // Actions
  setCurrentBiome: (biome: Biome) => void
  setCurrentLevel: (level: Level) => void
  setTransitioning: (transitioning: boolean) => void
  unlockFeatures: (level: number, features: string[]) => void
  hasFeature: (feature: string) => boolean
  setCharacterPosition: (position: CharacterPosition) => void
  setChargeState: (state: Partial<ChargeState>) => void
  reset: () => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentBiome: 'lab',
      currentLevel: 5, // PierreWorld (bureau 3D) par défaut
      isTransitioning: false,
      privilegeLevel: 0,
      unlockedFeatures: [],
      characterPosition: { x: 0, y: 0, z: 0 },
      chargeState: { chargeLevel: 0, isCharging: false },

      // Actions
      setCurrentBiome: (biome) => set({ currentBiome: biome }),

      setCurrentLevel: (level) => {
        // Libérer le pointer lock quand on entre dans PierreScene (Level 5)
        // car cette scène utilise OrbitControls au lieu du mode FPS
        if (level === 5 && document.pointerLockElement) {
          document.exitPointerLock()
        }
        set({ currentLevel: level })
      },

      setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),

      unlockFeatures: (level, features) =>
        set((state) => ({
          privilegeLevel: Math.max(state.privilegeLevel, level),
          unlockedFeatures: [...new Set([...state.unlockedFeatures, ...features])],
        })),

      hasFeature: (feature) => get().unlockedFeatures.includes(feature),

      setCharacterPosition: (position) => set({ characterPosition: position }),

      setChargeState: (newState) =>
        set((state) => ({
          chargeState: { ...state.chargeState, ...newState },
        })),

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
