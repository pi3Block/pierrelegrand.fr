/**
 * PingPongPaddle - Raquette de ping-pong cliquable sur le bureau.
 *
 * - Position initiale sur le meuble (à côté du Rubik's Cube)
 * - Se cache quand le jeu est actif (la raquette du jeu prend le relais)
 * - Transition caméra via onSelect('pingpong')
 */

import { useRef, useCallback } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { usePierreStore, type PierreStage } from '../stores/pierreStore'

// Configuration - Position originale sur le meuble (à côté du Rubik's Cube)
// Rubik est à (-0.67868, 1.499, -3.92849), on place la raquette à droite du cube
const PADDLE_ORIGINAL_POSITION = new THREE.Vector3(-1.2, 1.51, -3.92)
const PADDLE_ORIGINAL_SCALE = 0.15
// Rotation pour que la raquette soit posée à plat sur le meuble, manche vers l'avant
const PADDLE_ORIGINAL_ROTATION = new THREE.Euler(0, 0.5, 0)

interface PingPongPaddleProps {
  onHover: (objects: THREE.Object3D[]) => void
  onSelect: (stage: PierreStage) => void
}

/**
 * Composant raquette de ping-pong cliquable.
 * Se cache quand le jeu est actif.
 */
export function PingPongPaddle({ onHover, onSelect }: PingPongPaddleProps) {
  const groupRef = useRef<THREE.Group>(null)
  const isAnimating = useRef(false)

  // Store
  const currentStage = usePierreStore((s) => s.currentStage)
  const isPingPongMode = currentStage === 'pingpong'
  const isRubikMode = currentStage === 'rubikGroup'
  const isInDefaultView = currentStage === 'default'

  // Cacher la raquette décorative en mode pingpong ou rubik
  const shouldHide = isPingPongMode || isRubikMode

  /**
   * Gestion du clic - lance le jeu ping-pong.
   */
  const handleClick = useCallback(
    (e?: ThreeEvent<MouseEvent>) => {
      e?.stopPropagation()
      if (shouldHide || isAnimating.current) return

      onSelect('pingpong')
    },
    [shouldHide, onSelect]
  )

  /**
   * Gestion du hover.
   */
  const handlePointerOver = useCallback(() => {
    if (!shouldHide && isInDefaultView && groupRef.current) {
      onHover([groupRef.current])
    }
  }, [shouldHide, isInDefaultView, onHover])

  const handlePointerOut = useCallback(() => {
    if (!shouldHide && isInDefaultView) {
      onHover([])
    }
  }, [shouldHide, isInDefaultView, onHover])

  // Cacher la raquette quand en mode jeu (pingpong ou rubik)
  if (shouldHide) {
    return null
  }

  return (
    <group
      ref={groupRef}
      name="pingpongPaddle"
      position={PADDLE_ORIGINAL_POSITION.toArray()}
      scale={PADDLE_ORIGINAL_SCALE}
      rotation={[PADDLE_ORIGINAL_ROTATION.x, PADDLE_ORIGINAL_ROTATION.y, PADDLE_ORIGINAL_ROTATION.z]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Raquette (cylindre aplati) */}
      <mesh userData={{ interactive: true }} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.2, 32]} />
        <meshStandardMaterial color="#005b91" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Caoutchouc rouge sur le dessus */}
      <mesh position={[0, 0.11, 0]} userData={{ interactive: true }}>
        <cylinderGeometry args={[1.4, 1.4, 0.02, 32]} />
        <meshStandardMaterial color="#cc0000" roughness={0.7} />
      </mesh>

      {/* Caoutchouc noir sur le dessous */}
      <mesh position={[0, -0.11, 0]} rotation={[Math.PI, 0, 0]} userData={{ interactive: true }}>
        <cylinderGeometry args={[1.4, 1.4, 0.02, 32]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
      </mesh>

      {/* Manche */}
      <mesh position={[0, 0, 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 1.5, 16]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
    </group>
  )
}

export default PingPongPaddle
