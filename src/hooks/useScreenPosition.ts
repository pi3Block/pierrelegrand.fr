/**
 * Hook useScreenPosition - Convertit une position 3D en coordonnées écran.
 * Utile pour les animations portail depuis un objet 3D vers l'UI.
 */

import { useThree } from '@react-three/fiber'
import { useCallback, useMemo } from 'react'
import * as THREE from 'three'

interface ScreenPosition {
  x: number
  y: number
}

/**
 * Retourne une fonction pour convertir une position 3D en position écran (pixels).
 * 
 * @example
 * const getScreenPosition = useScreenPosition()
 * const screenPos = getScreenPosition(meshRef.current)
 */
export function useScreenPosition() {
  const { camera, size } = useThree()
  const tempVector = useMemo(() => new THREE.Vector3(), [])

  /**
   * Convertit la position monde d'un Object3D en coordonnées écran.
   * @param object - L'objet 3D dont on veut la position écran
   * @returns Position en pixels {x, y} depuis le coin supérieur gauche
   */
  const getScreenPosition = useCallback(
    (object: THREE.Object3D): ScreenPosition => {
      // Récupérer la position monde de l'objet
      object.getWorldPosition(tempVector)

      // Projeter sur l'écran (coordonnées normalisées -1 à 1)
      tempVector.project(camera)

      // Convertir en pixels
      const x = (tempVector.x * 0.5 + 0.5) * size.width
      const y = (-tempVector.y * 0.5 + 0.5) * size.height

      return { x, y }
    },
    [camera, size, tempVector]
  )

  return getScreenPosition
}

/**
 * Convertit des coordonnées 3D directement en position écran.
 * Version sans ref, prend un Vector3 ou un tuple.
 */
export function useWorldToScreen() {
  const { camera, size } = useThree()
  const tempVector = useMemo(() => new THREE.Vector3(), [])

  const worldToScreen = useCallback(
    (position: THREE.Vector3 | [number, number, number]): ScreenPosition => {
      if (Array.isArray(position)) {
        tempVector.set(position[0], position[1], position[2])
      } else {
        tempVector.copy(position)
      }

      // Projeter sur l'écran
      tempVector.project(camera)

      // Convertir en pixels
      const x = (tempVector.x * 0.5 + 0.5) * size.width
      const y = (-tempVector.y * 0.5 + 0.5) * size.height

      return { x, y }
    },
    [camera, size, tempVector]
  )

  return worldToScreen
}

