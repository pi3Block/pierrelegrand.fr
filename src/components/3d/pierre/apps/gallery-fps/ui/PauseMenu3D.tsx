/**
 * PauseMenu3D - Menu pause affiche en 3D dans la RenderTexture.
 *
 * S'affiche quand l'utilisateur appuie sur ESC (pointer lock libere).
 * Permet de reprendre ou quitter la galerie.
 */

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { FONTS } from '@config/assetPaths'

interface PauseMenu3DProps {
  visible: boolean
  onResume?: () => void
  onExit?: () => void
}

/**
 * Menu pause 3D positionne devant la camera.
 * Note: onResume et onExit sont passes pour reference future
 * mais le comportement actuel est gere via pointer lock (clic = reprendre)
 * et keydown (Backspace = quitter) dans GalleryFPSScene.
 */
export function PauseMenu3D({ visible }: PauseMenu3DProps) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!groupRef.current || !visible) return

    // Positionner devant la camera
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyQuaternion(camera.quaternion)
    groupRef.current.position.copy(camera.position).add(direction.multiplyScalar(2))
    groupRef.current.quaternion.copy(camera.quaternion)
  })

  if (!visible) return null

  return (
    <group ref={groupRef}>
      {/* Fond semi-transparent */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2.5, 1.8]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.9} />
      </mesh>

      {/* Titre */}
      <Text
        position={[0, 0.55, 0]}
        fontSize={0.18}
        color="#4ecdc4"
        anchorX="center"
        anchorY="middle"
        font={FONTS.ROBOTO_LIGHT}
      >
        PAUSE
      </Text>

      {/* Separateur */}
      <mesh position={[0, 0.35, 0]}>
        <planeGeometry args={[1.5, 0.003]} />
        <meshBasicMaterial color="#4ecdc4" />
      </mesh>

      {/* Instructions */}
      <Text
        position={[0, 0.1, 0]}
        fontSize={0.08}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font={FONTS.ROBOTO_LIGHT}
        textAlign="center"
      >
        {`Controles:\n\nWASD / Fleches: Se deplacer\nSouris: Regarder\nE: Interagir avec un tableau\nESC: Pause`}
      </Text>

      {/* Bouton Reprendre */}
      <group position={[0, -0.45, 0]}>
        <mesh>
          <planeGeometry args={[0.8, 0.2]} />
          <meshBasicMaterial color="#4ecdc4" />
        </mesh>
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.08}
          color="#000000"
          anchorX="center"
          anchorY="middle"
          font={FONTS.ROBOTO_LIGHT}
        >
          Cliquez pour reprendre
        </Text>
      </group>

      {/* Note de sortie */}
      <Text
        position={[0, -0.7, 0]}
        fontSize={0.05}
        color="#888888"
        anchorX="center"
        anchorY="middle"
        font={FONTS.ROBOTO_LIGHT}
      >
        Appuyez sur Backspace pour quitter la galerie
      </Text>
    </group>
  )
}

export default PauseMenu3D
