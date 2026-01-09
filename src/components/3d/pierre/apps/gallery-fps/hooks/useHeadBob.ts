/**
 * useHeadBob - Hook pour l'effet de balancement de tete lors de la marche.
 *
 * Cree un mouvement naturel de la camera synchronise avec les pas du joueur.
 */

import { useRef } from 'react'
import * as THREE from 'three'

interface HeadBobConfig {
  /** Amplitude verticale du balancement (default: 0.05) */
  amplitude?: number
  /** Frequence du balancement en Hz (default: 10) */
  frequency?: number
  /** Amplitude horizontale (default: amplitude / 2) */
  horizontalAmplitude?: number
}

interface HeadBobResult {
  /** Offset a appliquer a la camera */
  offset: THREE.Vector3
  /** Met a jour l'animation (a appeler dans useFrame) */
  update: (delta: number, isMoving: boolean, velocity: number) => void
  /** Reset l'animation */
  reset: () => void
}

/**
 * Hook pour l'effet head bob FPS.
 *
 * @example
 * const headBob = useHeadBob({ amplitude: 0.05, frequency: 10 })
 *
 * useFrame((_, delta) => {
 *   headBob.update(delta, isMoving, speed)
 *   camera.position.add(headBob.offset)
 * })
 */
export function useHeadBob(config: HeadBobConfig = {}): HeadBobResult {
  const {
    amplitude = 0.05,
    frequency = 10,
    horizontalAmplitude = amplitude / 2,
  } = config

  const timeRef = useRef(0)
  const offsetRef = useRef(new THREE.Vector3())
  const targetOffsetRef = useRef(new THREE.Vector3())

  const update = (delta: number, isMoving: boolean, velocity: number) => {
    if (isMoving && velocity > 0.1) {
      // Incrementer le temps base sur la vitesse
      const speedMultiplier = Math.min(velocity / 4, 1.5)
      timeRef.current += delta * frequency * speedMultiplier

      // Calculer l'offset cible
      const bobY = Math.sin(timeRef.current * 2) * amplitude
      const bobX = Math.sin(timeRef.current) * horizontalAmplitude

      targetOffsetRef.current.set(bobX, bobY, 0)
    } else {
      // Retour progressif a zero
      targetOffsetRef.current.set(0, 0, 0)
    }

    // Interpolation douce vers l'offset cible
    offsetRef.current.lerp(targetOffsetRef.current, delta * 10)
  }

  const reset = () => {
    timeRef.current = 0
    offsetRef.current.set(0, 0, 0)
    targetOffsetRef.current.set(0, 0, 0)
  }

  return {
    offset: offsetRef.current,
    update,
    reset,
  }
}

export default useHeadBob
