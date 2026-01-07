/**
 * Carpet - Tapis avec effet "poil" via shell texturing.
 *
 * Utilise une technique de rendu multi-couches pour simuler
 * un tapis à poils longs.
 *
 * OPTIMISÉ: 12 couches au lieu de 32, géométrie 60x60 au lieu de 100x100
 */

import { useRef, useMemo } from 'react'
import * as React from 'react'
import * as THREE from 'three'

// @ts-ignore - GLSL importé via vite-plugin-glsl
import vertexShader from '@/shaders/pierre/shellTexturingCarpet/vertex.glsl'
// @ts-ignore - GLSL importé via vite-plugin-glsl
import fragmentShader from '@/shaders/pierre/shellTexturingCarpet/fragment.glsl'

// Configuration
const CARPET_POSITION: [number, number, number] = [-2.61408, 0.377, -0.904327]
const CARPET_SCALE: [number, number, number] = [0.0355, 0.0355, 0.0355]
const CARPET_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0]

// OPTIMISÉ: Moins de couches et géométrie plus petite
const SHELL_CONFIG = {
  shellCount: 12, // Réduit de 32 → 12 (suffisant pour l'effet visuel)
  shellLength: 0.16,
  density: 250,
  thickness: 5,
  planeSize: 60, // Réduit de 100 → 60 (adapté à la taille réelle du tapis)
  color: new THREE.Color(0.7529412, 0.5424671, 0.4392157).convertSRGBToLinear(),
}

// Géométrie partagée entre toutes les couches (évite de recréer 12 fois)
const sharedGeometry = new THREE.PlaneGeometry(SHELL_CONFIG.planeSize, SHELL_CONFIG.planeSize)

/**
 * Composant Carpet avec effet shell texturing optimisé.
 */
export function Carpet() {
  const groupRef = useRef<THREE.Group>(null)

  // Créer les couches de shell avec géométrie partagée
  const shells = useMemo(() => {
    const layers: React.ReactElement[] = []

    for (let i = 0; i < SHELL_CONFIG.shellCount; i++) {
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

      // Espacement ajusté pour moins de couches
      const yOffset = -10 + i * (3.2 / SHELL_CONFIG.shellCount)

      layers.push(
        <mesh
          key={i}
          geometry={sharedGeometry}
          material={material}
          position={[0, yOffset, 0]}
          rotation={CARPET_ROTATION}
        />
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

