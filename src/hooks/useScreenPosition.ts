/**
 * Hook useScreenPosition - Convertit une position 3D en coordonnées écran.
 * Utile pour les animations portail depuis un objet 3D vers l'UI.
 */

import { useThree } from '@react-three/fiber'
import { useCallback, useMemo, useRef } from 'react'
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
  // Stocker camera et size dans des refs pour éviter les re-renders
  const cameraRef = useRef(camera)
  const sizeRef = useRef(size)
  cameraRef.current = camera
  sizeRef.current = size

  const tempVector = useMemo(() => new THREE.Vector3(), [])

  /**
   * Convertit la position monde d'un Object3D en coordonnées écran.
   * @param object - L'objet 3D dont on veut la position écran
   * @returns Position en pixels {x, y} depuis le coin supérieur gauche
   * IMPORTANT: Utilise des refs pour éviter les re-renders causés par camera/size.
   */
  const getScreenPosition = useCallback(
    (object: THREE.Object3D): ScreenPosition => {
      // Récupérer la position monde de l'objet
      object.getWorldPosition(tempVector)

      // Projeter sur l'écran (coordonnées normalisées -1 à 1)
      tempVector.project(cameraRef.current)

      // Convertir en pixels - utiliser sizeRef.current
      const x = (tempVector.x * 0.5 + 0.5) * sizeRef.current.width
      const y = (-tempVector.y * 0.5 + 0.5) * sizeRef.current.height

      return { x, y }
    },
    [tempVector] // Supprimé camera et size des deps
  )

  return getScreenPosition
}

/**
 * Convertit des coordonnées 3D directement en position écran.
 * Version sans ref, prend un Vector3 ou un tuple.
 */
export function useWorldToScreen() {
  const { camera, size } = useThree()
  // Stocker camera et size dans des refs pour éviter les re-renders
  const cameraRef = useRef(camera)
  const sizeRef = useRef(size)
  cameraRef.current = camera
  sizeRef.current = size

  const tempVector = useMemo(() => new THREE.Vector3(), [])

  const worldToScreen = useCallback(
    (position: THREE.Vector3 | [number, number, number]): ScreenPosition => {
      if (Array.isArray(position)) {
        tempVector.set(position[0], position[1], position[2])
      } else {
        tempVector.copy(position)
      }

      // Projeter sur l'écran - utiliser cameraRef.current
      tempVector.project(cameraRef.current)

      // Convertir en pixels - utiliser sizeRef.current
      const x = (tempVector.x * 0.5 + 0.5) * sizeRef.current.width
      const y = (-tempVector.y * 0.5 + 0.5) * sizeRef.current.height

      return { x, y }
    },
    [tempVector] // Supprimé camera et size des deps
  )

  return worldToScreen
}

