/**
 * InteractionContext - Contexte pour le système d'interaction.
 *
 * Architecture R3F v1.1.0 - Phase 2
 *
 * Centralise:
 * - État des objets survolés (pour outline)
 * - Fonction de navigation caméra
 * - État global d'interaction
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import * as THREE from 'three'
import { type PierreStage } from '../stores/pierreStore'
import { getGlobalFlyToStage } from '../PierreScene'

/**
 * Type du contexte d'interaction.
 */
interface InteractionContextType {
  /** Objets actuellement survolés (pour outline) */
  hoveredObjects: THREE.Object3D[]
  /** Met à jour les objets survolés */
  setHoveredObjects: (objects: THREE.Object3D[]) => void
  /** Navigue vers un stage */
  flyToStage: (stage: PierreStage) => void
  /** Vérifie si un objet est survolé */
  isHovered: (object: THREE.Object3D) => boolean
}

/**
 * Contexte par défaut.
 */
const InteractionContext = createContext<InteractionContextType | null>(null)

/**
 * Props du provider.
 */
interface InteractionProviderProps {
  children: ReactNode
}

/**
 * Provider pour le système d'interaction.
 *
 * Doit envelopper les composants qui utilisent InteractiveMesh.
 */
export function InteractionProvider({ children }: InteractionProviderProps) {
  const [hoveredObjects, setHoveredObjectsState] = useState<THREE.Object3D[]>([])

  /**
   * Met à jour les objets survolés.
   */
  const setHoveredObjects = useCallback((objects: THREE.Object3D[]) => {
    setHoveredObjectsState(objects)
  }, [])

  /**
   * Navigue vers un stage.
   */
  const flyToStage = useCallback((stage: PierreStage) => {
    const fly = getGlobalFlyToStage()
    if (fly) {
      fly(stage)
    } else {
      console.warn('[InteractionContext] flyToStage not available')
    }
  }, [])

  /**
   * Vérifie si un objet est survolé.
   */
  const isHovered = useCallback(
    (object: THREE.Object3D) => hoveredObjects.includes(object),
    [hoveredObjects]
  )

  const value = useMemo(
    () => ({
      hoveredObjects,
      setHoveredObjects,
      flyToStage,
      isHovered,
    }),
    [hoveredObjects, setHoveredObjects, flyToStage, isHovered]
  )

  return (
    <InteractionContext.Provider value={value}>
      {children}
    </InteractionContext.Provider>
  )
}

/**
 * Hook pour accéder au contexte d'interaction.
 */
export function useInteractionContext(): InteractionContextType {
  const context = useContext(InteractionContext)

  if (!context) {
    throw new Error(
      'useInteractionContext must be used within an InteractionProvider'
    )
  }

  return context
}

/**
 * Hook pour accéder aux objets survolés (read-only).
 * Optimisé pour éviter les re-renders inutiles.
 */
export function useHoveredObjects(): THREE.Object3D[] {
  const { hoveredObjects } = useInteractionContext()
  return hoveredObjects
}

export default InteractionProvider
