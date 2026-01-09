/**
 * interactionSlice - Slice Zustand pour la gestion des interactions.
 *
 * Architecture R3F v1.1.0 - Phase 3
 *
 * Gère les états hover/selection avec debouncing pour éviter
 * les updates trop fréquentes et réduire la charge CPU.
 */

import type { StateCreator } from 'zustand'
import * as THREE from 'three'

/**
 * Type de curseur CSS.
 */
export type CursorStyle = 'default' | 'pointer' | 'grab' | 'grabbing' | 'wait'

/**
 * État du slice interaction.
 */
export interface InteractionSlice {
  // État hover
  hoveredObjects: THREE.Object3D[]
  hoveredMeshes: THREE.Mesh[]

  // État sélection
  selectedObject: THREE.Object3D | null

  // Curseur
  cursorStyle: CursorStyle

  // Actions
  setHovered: (objects: THREE.Object3D[]) => void
  setSelected: (object: THREE.Object3D | null) => void
  clearHover: () => void
  clearSelection: () => void
  clearAll: () => void
  setCursor: (style: CursorStyle) => void
}

/**
 * Extrait tous les Mesh d'une liste d'Object3D.
 * Nécessaire pour OutlinePass qui requiert des Mesh, pas des Group.
 */
function collectMeshes(objects: THREE.Object3D[]): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = []
  objects.forEach((obj) => {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        meshes.push(child as THREE.Mesh)
      }
    })
  })
  return meshes
}

/**
 * Compare deux arrays d'Object3D par référence.
 */
function arraysEqual(a: THREE.Object3D[], b: THREE.Object3D[]): boolean {
  if (a.length !== b.length) return false
  return a.every((obj, i) => obj === b[i])
}

// Timer pour le debounce
let hoverDebounceTimer: ReturnType<typeof setTimeout> | null = null
const HOVER_DEBOUNCE_MS = 16 // ~60fps max

/**
 * Créateur du slice interaction.
 * Compatible avec le pattern slice de Zustand.
 */
export const createInteractionSlice: StateCreator<InteractionSlice> = (set, get) => ({
  // État initial
  hoveredObjects: [],
  hoveredMeshes: [],
  selectedObject: null,
  cursorStyle: 'default',

  // Actions
  setHovered: (objects) => {
    // Skip si identique (comparaison par référence)
    const current = get().hoveredObjects
    if (arraysEqual(objects, current)) {
      return
    }

    // Annuler le timer précédent
    if (hoverDebounceTimer) {
      clearTimeout(hoverDebounceTimer)
    }

    // Debounce pour éviter les updates trop fréquentes
    hoverDebounceTimer = setTimeout(() => {
      const meshes = collectMeshes(objects)
      set({
        hoveredObjects: objects,
        hoveredMeshes: meshes,
        cursorStyle: objects.length > 0 ? 'pointer' : 'default',
      })

      // Mettre à jour le curseur CSS
      document.body.style.cursor = objects.length > 0 ? 'pointer' : 'default'
    }, HOVER_DEBOUNCE_MS)
  },

  setSelected: (object) => {
    set({
      selectedObject: object,
      cursorStyle: object ? 'grab' : get().hoveredObjects.length > 0 ? 'pointer' : 'default',
    })
  },

  clearHover: () => {
    // Annuler le timer debounce
    if (hoverDebounceTimer) {
      clearTimeout(hoverDebounceTimer)
      hoverDebounceTimer = null
    }

    // Clear immédiat (pas de délai perçu)
    set({
      hoveredObjects: [],
      hoveredMeshes: [],
      cursorStyle: get().selectedObject ? 'grab' : 'default',
    })

    document.body.style.cursor = 'default'
  },

  clearSelection: () => {
    set({
      selectedObject: null,
      cursorStyle: get().hoveredObjects.length > 0 ? 'pointer' : 'default',
    })
  },

  clearAll: () => {
    // Annuler le timer debounce
    if (hoverDebounceTimer) {
      clearTimeout(hoverDebounceTimer)
      hoverDebounceTimer = null
    }

    set({
      hoveredObjects: [],
      hoveredMeshes: [],
      selectedObject: null,
      cursorStyle: 'default',
    })

    document.body.style.cursor = 'default'
  },

  setCursor: (style) => {
    set({ cursorStyle: style })
    document.body.style.cursor = style
  },
})

/**
 * Sélecteurs pour le slice interaction.
 */
export const interactionSelectors = {
  hoveredObjects: (state: InteractionSlice) => state.hoveredObjects,
  hoveredMeshes: (state: InteractionSlice) => state.hoveredMeshes,
  selectedObject: (state: InteractionSlice) => state.selectedObject,
  cursorStyle: (state: InteractionSlice) => state.cursorStyle,
  isHovered: (state: InteractionSlice) => state.hoveredObjects.length > 0,
  isSelected: (state: InteractionSlice) => state.selectedObject !== null,
}
