/**
 * TopChair - Chaise de bureau avec animation de rotation.
 *
 * La chaise oscille lentement de gauche à droite.
 * Utilise le même matériau baked que le reste de la pièce.
 */

import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useBakedMaterials } from '../contexts/BakedMaterialContext'
import { PIERRE } from '@config/assetPaths'

// Position de la chaise (depuis constants.js de Joan)
const TOP_CHAIR_POSITION: [number, number, number] = [1.4027, 0.496728, -1.21048]

/**
 * Composant TopChair avec animation de rotation.
 */
export function TopChair() {
  const groupRef = useRef<THREE.Group>(null)
  const startTimeRef = useRef<number>(Date.now())

  // Charger le modèle de la chaise
  const { scene } = useGLTF(PIERRE.MODELS.TOP_CHAIR)

  // Récupérer le matériau baked (material2 comme dans Joan's version)
  const { material2 } = useBakedMaterials()

  // Appliquer le matériau baked au modèle
  useEffect(() => {
    if (material2) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = material2
        }
      })
    }
  }, [scene, material2])

  // Animation de rotation oscillante (comme Joan: sin(elapsedTime * 0.0003) * 0.5)
  useFrame(() => {
    if (groupRef.current) {
      const elapsedTime = Date.now() - startTimeRef.current
      groupRef.current.rotation.y = Math.sin(elapsedTime * 0.0003) * 0.5
    }
  })

  return (
    <group ref={groupRef} name="topChair" position={TOP_CHAIR_POSITION}>
      <primitive object={scene} />
    </group>
  )
}

// Preload
useGLTF.preload(PIERRE.MODELS.TOP_CHAIR)

export default TopChair
