/**
 * InteractiveMesh - Composant wrapper pour éléments interactifs.
 *
 * Architecture R3F v1.1.0 - Phase 2
 *
 * Centralise la logique d'interaction:
 * - Hover avec outline automatique
 * - Click pour navigation caméra
 * - Désactivation automatique hors vue default
 * - Compatible avec le système BVH pour raycasting optimisé
 */

import { useRef, useCallback, forwardRef, type ReactNode } from 'react'
import { type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { usePierreStore, type PierreStage } from '../stores/pierreStore'
import { useInteractionContext } from './InteractionContext'

/**
 * Props pour InteractiveMesh.
 */
export interface InteractiveMeshProps {
  /** Contenu 3D à rendre */
  children: ReactNode
  /** Stage de navigation au clic (optionnel si onClick fourni) */
  stage?: PierreStage
  /** Callback personnalisé au clic */
  onClick?: (event: ThreeEvent<MouseEvent>) => void
  /** Callback personnalisé au hover */
  onHover?: (hovered: boolean) => void
  /** Désactive l'interaction */
  disabled?: boolean
  /** Nom du groupe pour debug */
  name?: string
  /** Empêche la propagation des events */
  stopPropagation?: boolean
}

/**
 * InteractiveMesh - Wrapper pour éléments interactifs.
 *
 * Usage:
 * ```tsx
 * <InteractiveMesh stage="arcadeMachine" name="arcade">
 *   <primitive object={arcadeModel.scene} />
 * </InteractiveMesh>
 * ```
 */
export const InteractiveMesh = forwardRef<THREE.Group, InteractiveMeshProps>(
  function InteractiveMesh(
    {
      children,
      stage,
      onClick,
      onHover,
      disabled = false,
      name,
      stopPropagation = true,
    },
    forwardedRef
  ) {
    const internalRef = useRef<THREE.Group>(null)
    const groupRef = (forwardedRef as React.RefObject<THREE.Group>) || internalRef

    // Store Pierre
    const currentStage = usePierreStore((s) => s.currentStage)
    const isInDefaultView = currentStage === 'default'

    // Contexte d'interaction (outline, navigation)
    const { setHoveredObjects, flyToStage } = useInteractionContext()

    // L'interaction est active seulement en vue default et si non désactivé
    const isInteractive = isInDefaultView && !disabled

    /**
     * Collecte tous les meshes du groupe pour l'outline.
     */
    const collectMeshes = useCallback((group: THREE.Group): THREE.Object3D[] => {
      const meshes: THREE.Object3D[] = []
      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          meshes.push(child)
        }
      })
      return meshes
    }, [])

    /**
     * Gère l'entrée du pointeur.
     */
    const handlePointerEnter = useCallback(
      (event: ThreeEvent<PointerEvent>) => {
        if (!isInteractive || !groupRef.current) return

        if (stopPropagation) {
          event.stopPropagation()
        }

        // Outline automatique
        const meshes = collectMeshes(groupRef.current)
        setHoveredObjects(meshes)

        // Callback personnalisé
        onHover?.(true)

        // Cursor pointer
        document.body.style.cursor = 'pointer'
      },
      [isInteractive, groupRef, stopPropagation, collectMeshes, setHoveredObjects, onHover]
    )

    /**
     * Gère la sortie du pointeur.
     */
    const handlePointerLeave = useCallback(
      (event: ThreeEvent<PointerEvent>) => {
        if (!isInteractive) return

        if (stopPropagation) {
          event.stopPropagation()
        }

        // Retirer l'outline
        setHoveredObjects([])

        // Callback personnalisé
        onHover?.(false)

        // Reset cursor
        document.body.style.cursor = 'auto'
      },
      [isInteractive, stopPropagation, setHoveredObjects, onHover]
    )

    /**
     * Gère le clic.
     */
    const handleClick = useCallback(
      (event: ThreeEvent<MouseEvent>) => {
        if (!isInteractive) return

        if (stopPropagation) {
          event.stopPropagation()
        }

        // Retirer l'outline immédiatement
        setHoveredObjects([])
        document.body.style.cursor = 'auto'

        // Callback personnalisé prioritaire
        if (onClick) {
          onClick(event)
          return
        }

        // Navigation vers le stage
        if (stage) {
          flyToStage(stage)
        }
      },
      [isInteractive, stopPropagation, setHoveredObjects, onClick, stage, flyToStage]
    )

    return (
      <group
        ref={groupRef}
        name={name}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      >
        {children}
      </group>
    )
  }
)

export default InteractiveMesh
