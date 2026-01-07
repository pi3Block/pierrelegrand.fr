/**
 * Sol de type nature (terre, herbe)
 * Utilise un shader procédural pour créer un effet de terrain naturel
 * avec variation de couleurs et de relief visuel
 *
 * Architecture enterprise-grade avec factories et types centralisés
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'

import type { NatureGroundProps } from './types'
import {
  createNatureShaderUniforms,
  getNatureColorPalette,
  updateShaderTime,
} from './factories'
import { natureFragmentShader, natureVertexShader } from './shaders'

// ============================================================================
// Composant Principal: NatureGround
// ============================================================================

export function NatureGround({
  size = [50, 50],
  position = [0, -0.5, 0],
  variant = 'grass',
}: NatureGroundProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const palette = getNatureColorPalette(variant)

  // Uniforms pour le shader
  const uniforms = useMemo(
    () => createNatureShaderUniforms(palette),
    [palette]
  )

  // Animation subtile
  useFrame((state) => {
    updateShaderTime(meshRef.current, state.clock.elapsedTime)
  })

  return (
    <RigidBody type="fixed" friction={1.2}>
      <mesh
        ref={meshRef}
        receiveShadow
        position={position}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[size[0], size[1], 128, 128]} />
        <shaderMaterial
          vertexShader={natureVertexShader}
          fragmentShader={natureFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
    </RigidBody>
  )
}



