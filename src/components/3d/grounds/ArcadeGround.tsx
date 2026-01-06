/**
 * Sol de type arcade/disco années 80
 * Grille néon synthwave avec animation et effets lumineux
 * Style Tron / Outrun / Synthwave
 *
 * Architecture enterprise-grade avec factories et types centralisés
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'

import type { ArcadeGroundProps, ParticleConfig, PillarConfig } from './types'
import {
  createArcadeShaderUniforms,
  createParticleData,
  createPillarConfigs,
  getArcadeColorTheme,
  updateParticlePositions,
  updateShaderTime,
} from './factories'
import { arcadeFragmentShader, arcadeVertexShader } from './shaders'

// ============================================================================
// Composant: Particules flottantes style arcade
// ============================================================================

interface ArcadeParticlesProps {
  color: THREE.Color
  count?: number
}

function ArcadeParticles({ color, count = 50 }: ArcadeParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, velocities, config } = useMemo(
    () => createParticleData({ count }),
    [count]
  )

  // Stocker la config dans un ref pour éviter les recréations
  const configRef = useRef<ParticleConfig>(config)
  configRef.current = config

  useFrame(() => {
    if (!pointsRef.current) return

    const positionAttr = pointsRef.current.geometry.attributes.position
    if (!positionAttr) return

    const positionArray = positionAttr.array as Float32Array
    updateParticlePositions(positionArray, velocities, count, configRef.current)
    positionAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

// ============================================================================
// Composant: Piliers lumineux décoratifs
// ============================================================================

interface NeonPillarsProps {
  color: THREE.Color
  count?: number
  radius?: number
}

function NeonPillars({ color, count = 8, radius = 20 }: NeonPillarsProps) {
  const pillars = useMemo<PillarConfig[]>(
    () => createPillarConfigs(count, radius),
    [count, radius]
  )

  return (
    <group>
      {pillars.map((pillar, i) => (
        <group key={i} position={pillar.position}>
          <mesh>
            <boxGeometry args={[0.1, 5, 0.1]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.5}
            />
          </mesh>
          <pointLight color={color} intensity={0.5} distance={8} />
        </group>
      ))}
    </group>
  )
}

// ============================================================================
// Composant Principal: ArcadeGround
// ============================================================================

export function ArcadeGround({
  size = [50, 50],
  position = [0, 0, 0],
  variant = 'synthwave',
  speed = 1.0,
}: ArcadeGroundProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const theme = getArcadeColorTheme(variant)

  // Uniforms pour le shader
  const uniforms = useMemo(
    () => createArcadeShaderUniforms(theme, speed),
    [theme, speed]
  )

  // Animation
  useFrame((state) => {
    updateShaderTime(meshRef.current, state.clock.elapsedTime)
  })

  return (
    <RigidBody type="fixed" friction={0.6}>
      <group position={position}>
        {/* Sol principal avec shader */}
        <mesh ref={meshRef} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[size[0], size[1], 1, 1]} />
          <shaderMaterial
            vertexShader={arcadeVertexShader}
            fragmentShader={arcadeFragmentShader}
            uniforms={uniforms}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Particules flottantes */}
        <ArcadeParticles color={theme.glowColor} count={30} />

        {/* Piliers néon décoratifs */}
        <NeonPillars color={theme.gridColor} count={8} radius={22} />

        {/* Lumière d'ambiance */}
        <pointLight
          position={[0, 10, 0]}
          color={theme.glowColor}
          intensity={0.3}
          distance={50}
        />
      </group>
    </RigidBody>
  )
}
