/**
 * Skybox - Ciel stylisé avec shader personnalisé.
 * 
 * Affiche un plan avec une texture de ciel qui s'adapte
 * à la position de la caméra.
 */

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { PIERRE } from '@config/assetPaths'

// Shaders (importés comme chaînes grâce à vite-plugin-glsl)
// @ts-ignore - GLSL importé via vite-plugin-glsl
import vertexShader from '@/shaders/pierre/sky/vertex.glsl'
// @ts-ignore - GLSL importé via vite-plugin-glsl
import fragmentShader from '@/shaders/pierre/sky/fragment.glsl'

// Configuration
const SKY_POSITION: [number, number, number] = [7, 0, 0]
const SKY_SIZE = { width: 320, height: 200 }

/**
 * Composant Skybox avec shader personnalisé.
 */
export function Skybox() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { camera } = useThree()

  // Charger la texture du ciel
  // Note: On utilise une texture PNG de fallback si KTX2 n'est pas disponible
  const skyTexture = useTexture(PIERRE.TEXTURES.PERLIN)
  
  // Configurer la texture
  useMemo(() => {
    skyTexture.wrapS = THREE.MirroredRepeatWrapping
    skyTexture.wrapT = THREE.MirroredRepeatWrapping
    skyTexture.colorSpace = THREE.SRGBColorSpace
  }, [skyTexture])

  // Vertices pour calculer les limites
  const vertices = useMemo(() => [
    new THREE.Vector3(4.275921, 5.3, 0.8),
    new THREE.Vector3(4.275921, 1.8, -2.1),
  ], [])

  // Uniforms du shader
  const uniforms = useMemo(() => ({
    uSkyTexture: { value: skyTexture },
    uMinY: { value: 0 },
    uMaxY: { value: 10 },
    uMinZ: { value: -10 },
    uMaxZ: { value: 10 },
  }), [skyTexture])

  /**
   * Calcule l'intersection entre une ligne et un plan.
   */
  const intersectLinePlane = (
    p1: THREE.Vector3, 
    p2: THREE.Vector3, 
    planeNormal: THREE.Vector3, 
    planeConstant: number
  ): THREE.Vector2 => {
    const direction = new THREE.Vector3().subVectors(p2, p1)
    const t = -(planeNormal.dot(p1) + planeConstant) / planeNormal.dot(direction)
    const intersection = new THREE.Vector3().copy(p1).add(direction.multiplyScalar(t))
    return new THREE.Vector2(intersection.y, intersection.z)
  }

  // Mise à jour des uniforms en fonction de la caméra
  useFrame(() => {
    if (materialRef.current && materialRef.current.uniforms) {
      const planeNormal = new THREE.Vector3(-1, 0, 0)
      const planeConstant = 7

      const v0 = vertices[0]
      const v1 = vertices[1]
      if (!v0 || !v1) return

      const limit0 = intersectLinePlane(camera.position, v0, planeNormal, planeConstant)
      const limit1 = intersectLinePlane(camera.position, v1, planeNormal, planeConstant)

      if (materialRef.current.uniforms.uMinY) {
        materialRef.current.uniforms.uMinY.value = limit1.x
      }
      if (materialRef.current.uniforms.uMaxY) {
        materialRef.current.uniforms.uMaxY.value = limit0.x
      }
      if (materialRef.current.uniforms.uMinZ) {
        materialRef.current.uniforms.uMinZ.value = limit1.y
      }
      if (materialRef.current.uniforms.uMaxZ) {
        materialRef.current.uniforms.uMaxZ.value = limit0.y
      }
    }
  })

  return (
    <mesh position={SKY_POSITION} rotation={[0, -Math.PI / 2, 0]}>
      <planeGeometry args={[SKY_SIZE.width, SKY_SIZE.height]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export default Skybox

