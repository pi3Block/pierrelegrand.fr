/**
 * PaintingInfo3D - Affiche les informations du tableau regarde en 3D.
 *
 * Utilise drei Text pour afficher titre et description dans la RenderTexture.
 * Se positionne en bas de l'ecran, suivant la camera.
 */

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useGalleryFPSStore } from '../stores/galleryFPSStore'

/**
 * Panneau d'information 3D pour le tableau regarde.
 */
export function PaintingInfo3D() {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)

  const currentPainting = useGalleryFPSStore((s) => s.currentPainting)
  const isLocked = useGalleryFPSStore((s) => s.isLocked)

  const visible = isLocked && currentPainting !== null

  useFrame(() => {
    if (!groupRef.current || !visible) return

    // Positionner en bas de l'ecran, devant la camera
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyQuaternion(camera.quaternion)

    // Position: devant la camera, legerement en bas
    const basePos = camera.position.clone().add(direction.multiplyScalar(1.5))

    // Decalage vers le bas dans l'espace camera
    const downOffset = new THREE.Vector3(0, -0.4, 0)
    downOffset.applyQuaternion(camera.quaternion)
    basePos.add(downOffset)

    groupRef.current.position.copy(basePos)
    groupRef.current.quaternion.copy(camera.quaternion)
  })

  if (!visible || !currentPainting) return null

  return (
    <group ref={groupRef}>
      {/* Fond semi-transparent */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.5, 0.35]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.8} />
      </mesh>

      {/* Titre */}
      <Text
        position={[0, 0.08, 0]}
        fontSize={0.06}
        color="#4ecdc4"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Roboto-Light.ttf"
        maxWidth={1.4}
      >
        {currentPainting.title}
      </Text>

      {/* Description */}
      <Text
        position={[0, -0.05, 0]}
        fontSize={0.035}
        color="#cccccc"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Roboto-Light.ttf"
        maxWidth={1.4}
      >
        {currentPainting.description}
      </Text>

      {/* Indication liens */}
      {currentPainting.links && (currentPainting.links.demo || currentPainting.links.source) && (
        <Text
          position={[0, -0.12, 0]}
          fontSize={0.025}
          color="#888888"
          anchorX="center"
          anchorY="middle"
          font="/fonts/Roboto-Light.ttf"
        >
          E: Ouvrir le lien
        </Text>
      )}
    </group>
  )
}

export default PaintingInfo3D
