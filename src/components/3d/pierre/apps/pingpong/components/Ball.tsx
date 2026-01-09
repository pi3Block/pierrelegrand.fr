/**
 * Ball - Balle dynamique avec logique de reset.
 *
 * Pattern copié de docs/pingpong-exemple/src/App.js
 * - Corps dynamique avec CCD
 * - Rebond parfait (restitution = 1)
 * - Reset quand touche les limites
 */

import { useRef, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import { RigidBody, BallCollider, CuboidCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { useTexture } from '@react-three/drei'
import { usePingPongStore } from '../stores/pingpongStore'

interface BallProps {
  position?: [number, number, number]
}

export function Ball({ position = [0, 5, 0] }: BallProps) {
  const apiRef = useRef<RapierRigidBody>(null)
  const { viewport } = useThree()
  const resetScore = usePingPongStore((s) => s.resetScore)
  const texture = useTexture('/assets/pingpong/crossp.jpg')

  /**
   * Reset de la balle quand elle touche les limites.
   */
  const onCollisionEnter = useCallback(() => {
    resetScore()
    apiRef.current?.setTranslation({ x: 0, y: 5, z: 0 }, true)
    apiRef.current?.setLinvel({ x: 0, y: 5, z: 0 }, true)
  }, [resetScore])

  return (
    <group position={position}>
      {/* Balle dynamique */}
      <RigidBody
        ref={apiRef}
        ccd
        angularDamping={0.8}
        restitution={1}
        canSleep={false}
        colliders={false}
        enabledTranslations={[true, true, false]} // Verrouille l'axe Z
      >
        <BallCollider args={[0.5]} />
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.5, 64, 64]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      </RigidBody>

      {/* Limite basse - reset quand touchée */}
      <RigidBody
        type="fixed"
        colliders={false}
        position={[0, -viewport.height * 2, 0]}
        restitution={2.1}
        onCollisionEnter={onCollisionEnter}
      >
        <CuboidCollider args={[1000, 2, 1000]} />
      </RigidBody>

      {/* Limite haute - reset quand touchée */}
      <RigidBody
        type="fixed"
        colliders={false}
        position={[0, viewport.height * 4, 0]}
        restitution={2.1}
        onCollisionEnter={onCollisionEnter}
      >
        <CuboidCollider args={[1000, 2, 1000]} />
      </RigidBody>
    </group>
  )
}

export default Ball
