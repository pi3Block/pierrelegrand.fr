/**
 * ReturnToHubPortal - Portail standardisé pour retourner au Hub central.
 * Style unifié avec les portails du Hub.
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '@stores/gameStore'

interface ReturnToHubPortalProps {
  position?: [number, number, number]
  label?: string
}

const PORTAL_COLOR = '#8b5cf6' // Violet - couleur du hub
const PORTAL_COLOR_SECONDARY = '#a78bfa'

/**
 * Portail de retour vers le Hub (Level 0)
 * Style identique aux portails du Hub central
 */
export function ReturnToHubPortal({
  position = [0, 0, 0],
  label = 'RETOUR HUB',
}: ReturnToHubPortalProps) {
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel)
  const portalRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  // Animation de pulsation (identique au Hub)
  useFrame((state) => {
    const time = state.clock.elapsedTime

    if (portalRef.current) {
      const material = portalRef.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 0.5 + Math.sin(time * 2) * 0.25
    }

    if (glowRef.current) {
      const material = glowRef.current.material as THREE.MeshStandardMaterial
      material.opacity = 0.45 + Math.sin(time * 3) * 0.15
    }
  })

  // Téléportation vers le Hub
  const handleEnter = () => {
    setTimeout(() => setCurrentLevel(0), 0)
  }

  return (
    <group position={position}>
      {/* Plateforme de base - même style que Hub */}
      <RigidBody type="fixed" position={[0, 0.1, 0]} friction={1}>
        <mesh receiveShadow>
          <cylinderGeometry args={[2.5, 3, 0.2, 32]} />
          <meshStandardMaterial
            color={PORTAL_COLOR}
            metalness={0.4}
            roughness={0.6}
          />
        </mesh>
      </RigidBody>

      {/* Zone de trigger (invisible) */}
      <RigidBody type="fixed" position={[0, 2, 0]} sensor onIntersectionEnter={handleEnter}>
        <CuboidCollider args={[1.5, 2, 1.5]} />
      </RigidBody>

      {/* Cadre du portail - torus vertical */}
      <mesh ref={portalRef} position={[0, 2.5, 0]}>
        <torusGeometry args={[2, 0.15, 16, 48]} />
        <meshStandardMaterial
          color={PORTAL_COLOR}
          emissive={PORTAL_COLOR}
          emissiveIntensity={0.6}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* Effet intérieur du portail */}
      <mesh ref={glowRef} position={[0, 2.5, 0]}>
        <circleGeometry args={[1.85, 48]} />
        <meshStandardMaterial
          color={PORTAL_COLOR_SECONDARY}
          transparent
          opacity={0.5}
          emissive={PORTAL_COLOR}
          emissiveIntensity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Piliers latéraux */}
      {[-2.2, 2.2].map((x, i) => (
        <mesh key={i} position={[x, 2.5, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.18, 5, 8]} />
          <meshStandardMaterial
            color={PORTAL_COLOR}
            metalness={0.4}
            roughness={0.6}
          />
        </mesh>
      ))}

      {/* Barre supérieure */}
      <mesh position={[0, 5.1, 0]} castShadow>
        <boxGeometry args={[4.8, 0.3, 0.3]} />
        <meshStandardMaterial
          color={PORTAL_COLOR}
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>

      {/* Panneau de nom - fond */}
      <mesh position={[0, 5.8, 0]}>
        <boxGeometry args={[4, 0.8, 0.1]} />
        <meshStandardMaterial
          color="#1f2937"
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Bordure lumineuse du panneau */}
      <mesh position={[0, 5.8, 0.06]}>
        <boxGeometry args={[4.1, 0.9, 0.02]} />
        <meshStandardMaterial
          color={PORTAL_COLOR}
          emissive={PORTAL_COLOR}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Nom du portail */}
      <Text
        position={[0, 5.8, 0.12]}
        fontSize={0.4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {label}
      </Text>

      {/* Description */}
      <Text
        position={[0, 5.2, 0.12]}
        fontSize={0.2}
        color={PORTAL_COLOR_SECONDARY}
        anchorX="center"
        anchorY="middle"
      >
        Hub Central
      </Text>

      {/* Indicateur "Entrez" - sur la plateforme */}
      <Text
        position={[0, 0.25, 1.5]}
        fontSize={0.25}
        color={PORTAL_COLOR_SECONDARY}
        anchorX="center"
        anchorY="bottom"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        ◄ ENTREZ ►
      </Text>

      {/* Lumière du portail */}
      <pointLight
        position={[0, 2.5, 1]}
        intensity={0.8}
        color={PORTAL_COLOR}
        distance={10}
      />
    </group>
  )
}

export default ReturnToHubPortal

