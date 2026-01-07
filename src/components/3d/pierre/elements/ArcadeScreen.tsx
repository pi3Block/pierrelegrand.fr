/**
 * ArcadeScreen - Machine arcade.
 *
 * L'iframe est géré par CSS3DRenderer dans PierreExperience.
 * Ce composant gère uniquement le modèle 3D et le mesh transparent pour le raycasting.
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { usePierreStore, type PierreStage } from '../stores/pierreStore'
import { useBakedMaterials } from '../contexts/BakedMaterialContext'

// Configuration - dimensions pour le mesh de raycasting
const ARCADE_SCREEN_SIZE = { width: 1006.986, height: 1210.118 }
const ARCADE_POSITION = new THREE.Vector3(3.24776, 2.7421, 2.3009)
const ARCADE_SCALE = new THREE.Vector3(0.00102, 0.00102, 0.00102)
const ARCADE_ROTATION_X = -Math.PI / 7
const ARCADE_ROTATION_Y = -Math.PI / 2

// Calculer le quaternion en appliquant rotateY puis rotateX comme Joan
// rotateY puis rotateX = q_y * q_x (l'ordre de multiplication est inversé dans Three.js)
const q_y = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ARCADE_ROTATION_Y)
const q_x = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), ARCADE_ROTATION_X)
const ARCADE_QUATERNION = q_y.multiply(q_x)

interface ArcadeScreenProps {
  onHover: (objects: THREE.Object3D[]) => void
  onSelect: (stage: PierreStage) => void
}

/**
 * Composant ArcadeScreen - modèle 3D uniquement.
 * L'iframe est rendu par CSS3DRenderer.
 */
export function ArcadeScreen({ onHover, onSelect }: ArcadeScreenProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [isActive, setIsActive] = useState(false)

  const currentStage = usePierreStore((s) => s.currentStage)

  // Charger le modèle de la machine arcade
  const { scene } = useGLTF('/pierre/assets/models/arcadeMachine.glb')

  // Récupérer le matériau baked
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

  // Nommer la scène pour le raycasting
  scene.name = 'arcadeMachine'

  // Activer selon le stage
  useEffect(() => {
    setIsActive(currentStage === 'arcadeMachine')
  }, [currentStage])

  // Communication avec l'iframe via postMessage (iframe géré par CSS3DRenderer)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isActive) {
        const iframe = document.getElementById('css3d-iframe-arcadeMachine') as HTMLIFrameElement
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'keyDownParent', key: e.key }, '*')
        }
      }
    },
    [isActive]
  )

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (isActive) {
        const iframe = document.getElementById('css3d-iframe-arcadeMachine') as HTMLIFrameElement
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'keyUpParent', key: e.key }, '*')
        }
      }
    },
    [isActive]
  )

  // Event listeners
  useEffect(() => {
    if (!isActive) return

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isActive, handleKeyDown, handleKeyUp])

  return (
    <group
      ref={groupRef}
      name="arcadeMachine"
      onPointerOver={() => groupRef.current && onHover([groupRef.current])}
      onPointerOut={() => onHover([])}
      onClick={() => !isActive && onSelect('arcadeMachine')}
    >
      {/* Modèle de la machine */}
      <primitive object={scene} />

      {/* Mesh transparent pour le raycasting - utilise quaternion comme Joan */}
      <mesh
        position={ARCADE_POSITION.toArray()}
        scale={ARCADE_SCALE.toArray()}
        quaternion={ARCADE_QUATERNION}
        name="arcadeMachineScreen"
      >
        <planeGeometry args={[ARCADE_SCREEN_SIZE.width, ARCADE_SCREEN_SIZE.height]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// Preload
useGLTF.preload('/pierre/assets/models/arcadeMachine.glb')

export default ArcadeScreen
