/**
 * galleryFPSStore - Store Zustand pour la galerie FPS immersive.
 *
 * Gère l'état de la navigation FPS, les interactions avec les tableaux,
 * le menu pause et les contrôles mobile.
 */

import { create } from 'zustand'

/**
 * Information sur un tableau regardé par le joueur.
 */
export interface PaintingInfo {
  id: string
  title: string
  description: string
  links?: {
    demo?: string
    source?: string
  }
}

/**
 * État de la galerie FPS.
 */
interface GalleryFPSState {
  // Navigation
  isLocked: boolean // Pointer lock actif
  isPaused: boolean // Menu pause affiché
  isEntered: boolean // Le joueur est entré dans la galerie (a cliqué)

  // Joueur
  isMoving: boolean // Le joueur se déplace
  isGrounded: boolean // Le joueur est au sol

  // Interactions
  currentPainting: PaintingInfo | null // Tableau actuellement regardé
  viewedPaintings: Set<string> // IDs des tableaux vus

  // Mobile
  isMobile: boolean // Détection mobile
  joystickInput: { x: number; y: number } // Input du joystick virtuel
  touchRotation: { x: number; y: number } // Rotation via touch

  // Actions
  setIsLocked: (locked: boolean) => void
  setIsPaused: (paused: boolean) => void
  setIsEntered: (entered: boolean) => void
  setIsMoving: (moving: boolean) => void
  setIsGrounded: (grounded: boolean) => void
  setCurrentPainting: (painting: PaintingInfo | null) => void
  markPaintingViewed: (id: string) => void
  setIsMobile: (mobile: boolean) => void
  setJoystickInput: (input: { x: number; y: number }) => void
  setTouchRotation: (rotation: { x: number; y: number }) => void
  togglePause: () => void
  enter: () => void
  exit: () => void
  reset: () => void
}

/**
 * Store GalleryFPS - Zustand.
 */
export const useGalleryFPSStore = create<GalleryFPSState>((set, get) => ({
  // État initial
  isLocked: false,
  isPaused: false,
  isEntered: false,
  isMoving: false,
  isGrounded: true,
  currentPainting: null,
  viewedPaintings: new Set<string>(),
  isMobile: false,
  joystickInput: { x: 0, y: 0 },
  touchRotation: { x: 0, y: 0 },

  // Actions
  setIsLocked: (locked) => set({ isLocked: locked }),

  setIsPaused: (paused) => set({ isPaused: paused }),

  setIsEntered: (entered) => set({ isEntered: entered }),

  setIsMoving: (moving) => set({ isMoving: moving }),

  setIsGrounded: (grounded) => set({ isGrounded: grounded }),

  setCurrentPainting: (painting) => set({ currentPainting: painting }),

  markPaintingViewed: (id) =>
    set((state) => {
      const newSet = new Set(state.viewedPaintings)
      newSet.add(id)
      return { viewedPaintings: newSet }
    }),

  setIsMobile: (mobile) => set({ isMobile: mobile }),

  setJoystickInput: (input) => set({ joystickInput: input }),

  setTouchRotation: (rotation) => set({ touchRotation: rotation }),

  togglePause: () => {
    const { isPaused, isEntered } = get()
    if (isEntered) {
      set({ isPaused: !isPaused })
    }
  },

  enter: () =>
    set({
      isEntered: true,
      isPaused: false,
    }),

  exit: () =>
    set({
      isEntered: false,
      isLocked: false,
      isPaused: false,
      currentPainting: null,
    }),

  reset: () =>
    set({
      isLocked: false,
      isPaused: false,
      isEntered: false,
      isMoving: false,
      isGrounded: true,
      currentPainting: null,
      viewedPaintings: new Set<string>(),
      joystickInput: { x: 0, y: 0 },
      touchRotation: { x: 0, y: 0 },
    }),
}))

/**
 * Sélecteurs utilitaires.
 */
export const galleryFPSSelectors = {
  canMove: (state: GalleryFPSState) =>
    state.isEntered && !state.isPaused && state.isLocked,
  allPaintingsViewed: (state: GalleryFPSState, totalPaintings: number) =>
    state.viewedPaintings.size >= totalPaintings,
}
