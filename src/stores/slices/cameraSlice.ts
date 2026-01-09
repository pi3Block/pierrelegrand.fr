/**
 * cameraSlice - Slice Zustand pour la gestion caméra.
 *
 * Architecture R3F v1.1.0 - Phase 1
 *
 * Gère les positions, transitions et états de la caméra.
 * Séparé du store principal pour une meilleure modularité.
 */

import type { StateCreator } from 'zustand'

/**
 * Positions caméra prédéfinies pour chaque zone.
 */
export interface CameraPosition {
  position: [number, number, number]
  target: [number, number, number]
  fov?: number
}

/**
 * Configuration de transition caméra.
 */
export interface CameraTransition {
  duration: number
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
}

/**
 * État du slice caméra.
 */
export interface CameraSlice {
  // État caméra
  cameraPosition: CameraPosition
  isTransitioning: boolean
  transitionProgress: number

  // Positions prédéfinies
  cameraPresets: Record<string, CameraPosition>

  // Configuration
  defaultTransition: CameraTransition

  // Actions
  setCameraPosition: (position: CameraPosition) => void
  transitionTo: (presetKey: string, transition?: Partial<CameraTransition>) => void
  setTransitionProgress: (progress: number) => void
  setIsTransitioning: (transitioning: boolean) => void
  registerPreset: (key: string, position: CameraPosition) => void
}

/**
 * Position caméra par défaut (vue d'ensemble).
 */
const DEFAULT_POSITION: CameraPosition = {
  position: [0, 2, 5],
  target: [0, 0, 0],
  fov: 50,
}

/**
 * Transition par défaut.
 */
const DEFAULT_TRANSITION: CameraTransition = {
  duration: 1.5,
  easing: 'easeInOut',
}

/**
 * Créateur du slice caméra.
 * Compatible avec le pattern slice de Zustand.
 */
export const createCameraSlice: StateCreator<CameraSlice> = (set, get) => ({
  // État initial
  cameraPosition: DEFAULT_POSITION,
  isTransitioning: false,
  transitionProgress: 0,
  cameraPresets: {
    default: DEFAULT_POSITION,
  },
  defaultTransition: DEFAULT_TRANSITION,

  // Actions
  setCameraPosition: (position) => set({ cameraPosition: position }),

  transitionTo: (presetKey, transition) => {
    const { cameraPresets, defaultTransition } = get()
    const preset = cameraPresets[presetKey]

    if (!preset) {
      console.warn(`[CameraSlice] Preset "${presetKey}" not found`)
      return
    }

    // Merge avec la transition par défaut
    const finalTransition = { ...defaultTransition, ...transition }

    set({
      cameraPosition: preset,
      isTransitioning: true,
      transitionProgress: 0,
    })

    // Note: La transition réelle est gérée par CameraSystem
    // qui observe isTransitioning et applique l'animation
    console.debug(`[CameraSlice] Transitioning to "${presetKey}"`, finalTransition)
  },

  setTransitionProgress: (progress) => set({ transitionProgress: progress }),

  setIsTransitioning: (transitioning) =>
    set({
      isTransitioning: transitioning,
      transitionProgress: transitioning ? 0 : 1,
    }),

  registerPreset: (key, position) =>
    set((state) => ({
      cameraPresets: { ...state.cameraPresets, [key]: position },
    })),
})

/**
 * Sélecteurs pour le slice caméra.
 */
export const cameraSelectors = {
  position: (state: CameraSlice) => state.cameraPosition.position,
  target: (state: CameraSlice) => state.cameraPosition.target,
  fov: (state: CameraSlice) => state.cameraPosition.fov ?? 50,
  isTransitioning: (state: CameraSlice) => state.isTransitioning,
  progress: (state: CameraSlice) => state.transitionProgress,
}
