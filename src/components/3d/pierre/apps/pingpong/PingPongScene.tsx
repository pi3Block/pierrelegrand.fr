/**
 * PingPongScene - Scène complète du jeu Ping-Pong.
 *
 * Le jeu se joue devant la caméra (2D-like) avec le bureau en arrière-plan.
 * Pas de fond sphérique - on garde le bureau visible.
 */

import { useEffect, useRef } from 'react'
import { Paddle, Ball } from './components'
import { usePingPongStore } from './stores/pingpongStore'

interface PingPongSceneProps {
  isActive: boolean
}

export function PingPongScene({ isActive }: PingPongSceneProps) {
  const isPlaying = usePingPongStore((s) => s.isPlaying)
  const setIsPlaying = usePingPongStore((s) => s.setIsPlaying)
  const lastHitForce = usePingPongStore((s) => s.lastHitForce)
  const isMuted = usePingPongStore((s) => s.isMuted)

  // Audio ref
  const pingRef = useRef<HTMLAudioElement | null>(null)

  // Initialiser audio
  useEffect(() => {
    pingRef.current = new Audio('/assets/pingpong/ping.mp3')
    return () => {
      pingRef.current = null
    }
  }, [])

  // Jouer le son sur impact
  useEffect(() => {
    if (lastHitForce > 0 && !isMuted && pingRef.current) {
      pingRef.current.currentTime = 0
      pingRef.current.volume = Math.min(lastHitForce / 20, 1)
      pingRef.current.play().catch(() => {
        // Ignore autoplay errors
      })
    }
  }, [lastHitForce, isMuted])

  // Démarrer le jeu quand actif
  useEffect(() => {
    if (isActive && !isPlaying) {
      // Petit délai pour laisser la transition caméra se terminer
      const timeout = setTimeout(() => {
        setIsPlaying(true)
      }, 1200)
      return () => clearTimeout(timeout)
    } else if (!isActive && isPlaying) {
      setIsPlaying(false)
    }
  }, [isActive, isPlaying, setIsPlaying])

  // Position du jeu devant la caméra
  // La caméra est à (-23, 17, 23) regardant vers (0, 2.5, 0)
  // On place le jeu entre la caméra et le bureau
  const gamePosition: [number, number, number] = [-8, 8, 8]

  return (
    <group position={gamePosition}>
      {/* Éclairage additionnel pour le jeu */}
      <pointLight position={[0, 5, 5]} intensity={1} />

      {/* Éléments de jeu */}
      {isPlaying && <Ball position={[0, 5, 0]} />}
      <Paddle />
    </group>
  )
}

export default PingPongScene
