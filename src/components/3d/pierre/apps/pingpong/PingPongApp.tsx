/**
 * PingPongApp - Conteneur principal du jeu Ping-Pong.
 *
 * Wraps la scène avec le monde physique Rapier.
 * Rendu seulement quand le mode pingpong est actif.
 */

import { Suspense, useEffect } from 'react'
import { Physics } from '@react-three/rapier'
import { PingPongScene } from './PingPongScene'
import { usePingPongStore } from './stores/pingpongStore'

interface PingPongAppProps {
  isActive: boolean
}

export function PingPongApp({ isActive }: PingPongAppProps) {
  const setIsMobile = usePingPongStore((s) => s.setIsMobile)
  const reset = usePingPongStore((s) => s.reset)

  // Détecter mobile
  useEffect(() => {
    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0
    setIsMobile(isTouchDevice)
  }, [setIsMobile])

  // Reset quand on quitte le jeu
  useEffect(() => {
    if (!isActive) {
      reset()
    }
  }, [isActive, reset])

  // Ne pas rendre si pas actif
  if (!isActive) return null

  return (
    <Suspense fallback={null}>
      <Physics gravity={[0, -40, 0]} timeStep="vary">
        <PingPongScene isActive={isActive} />
      </Physics>
    </Suspense>
  )
}

export default PingPongApp
