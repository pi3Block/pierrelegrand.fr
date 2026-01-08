/**
 * pierreStore - Store Zustand pour la scène Pierre (bureau 3D).
 * 
 * Gère l'état de la navigation entre les zones interactives,
 * les transitions caméra et l'état des éléments interactifs.
 */

import { create } from 'zustand'

/**
 * Zones interactives de la scène Pierre.
 */
export type PierreStage =
  | 'default'        // Vue d'ensemble
  | 'arcadeMachine'  // Machine arcade
  | 'leftMonitor'    // Moniteur gauche (About Me)
  | 'rightMonitor'   // Moniteur droit (Projects)
  | 'whiteboard'     // Tableau blanc
  | 'rubikGroup'     // Rubik's Cube (mode jeu, cube au centre)
  | 'hubPortal'      // Portail vers le Hub
  | 'hub'            // Retour au Hub 3D principal

/**
 * État de la scène Pierre.
 */
interface PierreState {
  // Navigation
  currentStage: PierreStage
  previousStage: PierreStage | null
  isCameraMoving: boolean
  
  // OrbitControls
  controlsEnabled: boolean
  
  // Audio
  isMuted: boolean
  
  // Rubik's Cube
  rubikSolved: boolean
  
  // Actions
  setCurrentStage: (stage: PierreStage) => void
  setIsCameraMoving: (moving: boolean) => void
  setControlsEnabled: (enabled: boolean) => void
  setMuted: (muted: boolean) => void
  setRubikSolved: (solved: boolean) => void
  goBack: () => void
  reset: () => void
}

/**
 * Store Pierre - Zustand.
 */
export const usePierreStore = create<PierreState>((set, get) => ({
  // État initial
  currentStage: 'default',
  previousStage: null,
  isCameraMoving: false,
  controlsEnabled: true,
  isMuted: false,
  rubikSolved: false,

  // Actions
  setCurrentStage: (stage) => 
    set((state) => ({
      previousStage: state.currentStage,
      currentStage: stage,
      // Désactiver les contrôles quand on est dans une zone spécifique
      controlsEnabled: stage === 'default',
    })),

  setIsCameraMoving: (moving) => 
    set({ isCameraMoving: moving }),

  setControlsEnabled: (enabled) => 
    set({ controlsEnabled: enabled }),

  setMuted: (muted) => 
    set({ isMuted: muted }),

  setRubikSolved: (solved) => 
    set({ rubikSolved: solved }),

  goBack: () => {
    const { previousStage } = get()
    if (previousStage) {
      set({
        currentStage: previousStage,
        previousStage: null,
        controlsEnabled: previousStage === 'default',
      })
    } else {
      set({
        currentStage: 'default',
        controlsEnabled: true,
      })
    }
  },

  reset: () => 
    set({
      currentStage: 'default',
      previousStage: null,
      isCameraMoving: false,
      controlsEnabled: true,
      isMuted: false,
      rubikSolved: false,
    }),
}))

/**
 * Sélecteurs utilitaires.
 */
export const pierreSelectors = {
  isInInteractiveZone: (state: PierreState) => state.currentStage !== 'default',
  canNavigate: (state: PierreState) => !state.isCameraMoving,
}

