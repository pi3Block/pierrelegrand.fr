/**
 * uiStore - Store global pour la gestion des modals et overlays.
 * Architecture extensible pour futurs modals (images, info, etc.)
 */

import { create } from 'zustand'

/**
 * Position d'origine pour l'animation portail.
 */
interface OriginPosition {
  x: number
  y: number
}

/**
 * État du modal vidéo YouTube.
 */
interface VideoModalState {
  isOpen: boolean
  videoId: string | null
  originPosition: OriginPosition | null
}

/**
 * Interface du store UI global.
 * Extensible pour ajouter d'autres modals (imageModal, infoModal, etc.)
 */
interface UIState {
  // Modal Vidéo
  videoModal: VideoModalState

  // Vidéo 3D en lecture (dans le monde)
  isVideo3DPlaying: boolean

  // Actions Modal Vidéo
  openVideoModal: (videoId: string, origin: OriginPosition) => void
  closeVideoModal: () => void

  // Actions Vidéo 3D
  setVideo3DPlaying: (playing: boolean) => void
}

/**
 * Store UI global - Zustand.
 * Gère tous les modals et overlays de l'application.
 */
export const useUIStore = create<UIState>((set) => ({
  // État initial du modal vidéo
  videoModal: {
    isOpen: false,
    videoId: null,
    originPosition: null,
  },

  // Vidéo 3D en lecture
  isVideo3DPlaying: false,

  // Ouvrir le modal vidéo avec effet portail
  openVideoModal: (videoId, origin) =>
    set({
      videoModal: {
        isOpen: true,
        videoId,
        originPosition: origin,
      },
    }),

  // Fermer le modal vidéo
  closeVideoModal: () =>
    set({
      videoModal: {
        isOpen: false,
        videoId: null,
        originPosition: null,
      },
    }),

  // Définir si une vidéo 3D est en lecture
  setVideo3DPlaying: (playing) => set({ isVideo3DPlaying: playing }),
}))

