/**
 * Door - Porte de sortie de la galerie FPS.
 *
 * Charge le modele door.glb et le place a l'entree de la galerie.
 */

import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'

// Chemin vers le modele
const DOOR_MODEL_PATH = '/assets/models/door.glb'

interface DoorProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}

/**
 * Door - Porte de la galerie.
 */
export function Door({
  position = [0, 0, 6],
  rotation = [0, 0, 0],
  scale = 1
}: DoorProps) {
  const { scene } = useGLTF(DOOR_MODEL_PATH)

  // Cloner la scene
  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
    return clone
  }, [scene])

  return (
    <group name="door" position={position} rotation={rotation}>
      <RigidBody type="fixed" colliders="cuboid">
        <primitive object={clonedScene} scale={scale} />
      </RigidBody>
    </group>
  )
}

// Preload du modele
useGLTF.preload(DOOR_MODEL_PATH)

export default Door
