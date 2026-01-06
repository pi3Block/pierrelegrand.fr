/**
 * Sol de type urbain (asphalte, béton, route)
 * Utilise MeshReflectorMaterial de drei pour des reflets réalistes
 * et un shader pour les détails de l'asphalte
 *
 * Architecture enterprise-grade avec factories et types centralisés
 */
import { useRef, useMemo } from 'react'
import { MeshReflectorMaterial } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'

import type { RoadMarkingElement, Size2D, UrbanGroundProps } from './types'
import { createRoadMarkings, getUrbanVariantConfig } from './factories'
import { asphaltDetailFragmentShader, asphaltDetailVertexShader } from './shaders'

// ============================================================================
// Composant: Marquages routiers (lignes, passages piétons)
// ============================================================================

interface RoadMarkingsProps {
  size: Size2D
}

function RoadMarkings({ size }: RoadMarkingsProps) {
  const markings = useMemo<RoadMarkingElement[]>(
    () => createRoadMarkings(size),
    [size]
  )

  return (
    <group>
      {markings.map((marking) => (
        <mesh
          key={marking.id}
          position={marking.position}
          rotation={marking.rotation}
        >
          <boxGeometry args={[marking.size[0], marking.size[1], 0.01]} />
          <meshStandardMaterial color={marking.color} roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

// ============================================================================
// Composant: Détails de texture procédurale pour l'asphalte
// ============================================================================

interface AsphaltDetailsProps {
  size: Size2D
}

function AsphaltDetails({ size }: AsphaltDetailsProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  // Shader pour les détails de l'asphalte (fissures, taches)
  const detailShader = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: asphaltDetailVertexShader,
      fragmentShader: asphaltDetailFragmentShader,
    }),
    []
  )

  return (
    <mesh
      ref={meshRef}
      position={[0, 0.02, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[size[0], size[1]]} />
      <shaderMaterial
        uniforms={detailShader.uniforms}
        vertexShader={detailShader.vertexShader}
        fragmentShader={detailShader.fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.MultiplyBlending}
      />
    </mesh>
  )
}

// ============================================================================
// Composant Principal: UrbanGround
// ============================================================================

export function UrbanGround({
  size = [50, 50],
  position = [0, 0, 0],
  variant = 'asphalt',
  showRoadMarkings = true,
}: UrbanGroundProps) {
  const config = getUrbanVariantConfig(variant)

  return (
    <RigidBody type="fixed" friction={0.8}>
      <group position={position}>
        {/* Sol principal avec reflets */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[size[0], size[1]]} />
          <MeshReflectorMaterial
            color={config.color}
            roughness={config.roughness}
            metalness={config.metalness}
            mirror={config.mirror}
            blur={config.blur}
            mixBlur={1}
            mixStrength={0.5}
            resolution={512}
            depthScale={1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1}
          />
        </mesh>

        {/* Détails de texture */}
        <AsphaltDetails size={size} />

        {/* Marquages routiers optionnels */}
        {showRoadMarkings && <RoadMarkings size={size} />}
      </group>
    </RigidBody>
  )
}
