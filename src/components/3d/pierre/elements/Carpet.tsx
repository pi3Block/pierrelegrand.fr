/**
 * Carpet - Tapis avec effet "poil" via shell texturing.
 *
 * Utilise une technique de rendu multi-couches pour simuler
 * un tapis à poils longs. Configuration identique à Joan's portfolio.
 */

import { useRef, useMemo } from 'react'
import * as React from 'react'
import * as THREE from 'three'

// @ts-ignore - GLSL importé via vite-plugin-glsl
import vertexShader from '@/shaders/pierre/shellTexturingCarpet/vertex.glsl'
// @ts-ignore - GLSL importé via vite-plugin-glsl
import fragmentShader from '@/shaders/pierre/shellTexturingCarpet/fragment.glsl'

// Configuration identique à Joan's portfolio
const CARPET_POSITION: [number, number, number] = [-2.61408, 0.377, -0.904327]
const CARPET_SCALE: [number, number, number] = [0.0355, 0.0355, 0.0355]
const CARPET_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0]

const SHELL_CONFIG = {
  shellCount: 32,
  shellLength: 0.16,
  density: 250,
  thickness: 5,
  // Couleur beige/gris du tapis original
  color: new THREE.Color(0.7529412, 0.5424671, 0.4392157).convertSRGBToLinear(),
}

/**
 * Composant Carpet avec effet shell texturing.
 */
export function Carpet() {
  const groupRef = useRef<THREE.Group>(null)

  // Créer les couches de shell (comme Joan: PlaneGeometry 100x100 avec offset Y)
  const shells = useMemo(() => {
    const layers: React.ReactElement[] = []

    for (let i = 0; i < SHELL_CONFIG.shellCount; i++) {
      // Créer un matériau unique pour chaque couche
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uShellCount: { value: SHELL_CONFIG.shellCount },
          uShellIndex: { value: i },
          uShellLength: { value: SHELL_CONFIG.shellLength },
          uDensity: { value: SHELL_CONFIG.density },
          uThickness: { value: SHELL_CONFIG.thickness },
          uColor: { value: SHELL_CONFIG.color },
        },
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
      })

      // Position Y de chaque couche (comme Joan: -10 + i * 0.1)
      const yOffset = -10 + i * 0.1

      layers.push(
        <mesh
          key={i}
          material={material}
          position={[0, yOffset, 0]}
          rotation={CARPET_ROTATION}
        >
          <planeGeometry args={[100, 100]} />
        </mesh>
      )
    }

    return layers
  }, [])

  return (
    <group
      ref={groupRef}
      name="carpet"
      position={CARPET_POSITION}
      scale={CARPET_SCALE}
    >
      {shells}
    </group>
  )
}

export default Carpet

