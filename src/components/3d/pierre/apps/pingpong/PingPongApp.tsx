/**
 * PingPongApp - Conteneur principal du jeu Ping-Pong.
 *
 * Wraps la scène avec le monde physique Rapier.
 * Gravité dynamique basée sur le niveau de difficulté.
 * Rendu seulement quand le mode pingpong est actif.
 */

import { Suspense, useEffect, useMemo } from 'react'
import { Physics } from '@react-three/rapier'
import { Html } from '@react-three/drei'
import { PingPongScene } from './PingPongScene'
import { PingPongMobileControls } from './components'
import { usePingPongStore } from './stores/pingpongStore'

interface PingPongAppProps {
  isActive: boolean
}

export function PingPongApp({ isActive }: PingPongAppProps) {
  const setIsMobile = usePingPongStore((s) => s.setIsMobile)
  const reset = usePingPongStore((s) => s.reset)
  const isMobile = usePingPongStore((s) => s.isMobile)
  const gravity = usePingPongStore((s) => s.gravity)

  // Vecteur gravité dynamique basé sur le niveau
  const gravityVector = useMemo(
    (): [number, number, number] => [0, gravity, 0],
    [gravity]
  )

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
      <Physics gravity={gravityVector} timeStep="vary">
        <PingPongScene isActive={isActive} />

        {/* Contrôles mobiles (HTML overlay via drei Html) */}
        {isMobile && (
          <Html fullscreen zIndexRange={[1000, 1001]}>
            <PingPongMobileControls visible={isActive && isMobile} />
          </Html>
        )}
      </Physics>
    </Suspense>
  )
}

export default PingPongApp
