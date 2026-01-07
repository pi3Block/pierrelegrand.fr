/**
 * CoffeeSteam - Vapeur de café animée avec shader.
 * 
 * Un plan avec un shader qui simule de la vapeur
 * s'élevant d'une tasse de café.
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

// Shaders (importés comme chaînes grâce à vite-plugin-glsl)
// @ts-ignore - GLSL importé via vite-plugin-glsl
import vertexShader from '@/shaders/pierre/coffeeSteam/vertex.glsl'
// @ts-ignore - GLSL importé via vite-plugin-glsl  
import fragmentShader from '@/shaders/pierre/coffeeSteam/fragment.glsl'

// Configuration (depuis constants.js original)
const COFFEE_POSITION: [number, number, number] = [0.230979, 2.3, -3.64951]
const STEAM_SIZE = { width: 0.15, height: 0.6 }
const STEAM_SEGMENTS = { width: 16, height: 64 }

/**
 * Composant de vapeur de café.
 */
export function CoffeeSteam() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  // Charger la texture de bruit Perlin
  const perlinTexture = useTexture('/pierre/assets/textures/perlin.png')

  // Configurer la texture
  useMemo(() => {
    perlinTexture.wrapS = THREE.RepeatWrapping
    perlinTexture.wrapT = THREE.RepeatWrapping
  }, [perlinTexture])

  // Uniforms du shader
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPerlinTexture: { value: perlinTexture },
  }), [perlinTexture])

  // Animation du temps
  useFrame((state) => {
    if (materialRef.current && materialRef.current.uniforms.uTime) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh position={COFFEE_POSITION} name="coffee-steam">
      <planeGeometry 
        args={[
          STEAM_SIZE.width, 
          STEAM_SIZE.height, 
          STEAM_SEGMENTS.width, 
          STEAM_SEGMENTS.height
        ]} 
      />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export default CoffeeSteam

