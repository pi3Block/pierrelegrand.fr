/**
 * ArcadeScreen - Machine arcade avec iframe et effet CRT.
 *
 * Fonctionnalités:
 * - iframe intégré pour le jeu arcade (toujours visible quand actif)
 * - Communication avec l'iframe via postMessage
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import { usePierreStore, type PierreStage } from '../stores/pierreStore'
import { useBakedMaterials } from '../contexts/BakedMaterialContext'

// Configuration
const ARCADE_SCREEN_SIZE = { width: 1006.986, height: 1210.118 }
const ARCADE_POSITION = new THREE.Vector3(3.24776, 2.7421, 2.3009)
const ARCADE_SCALE = new THREE.Vector3(0.00102, 0.00102, 0.00102)
const ARCADE_ROTATION_X = -Math.PI / 7
const ARCADE_ROTATION_Y = -Math.PI / 2

// Créer un Euler avec l'ordre YXZ pour correspondre à Joan's rotateY puis rotateX
const ARCADE_EULER = new THREE.Euler(ARCADE_ROTATION_X, ARCADE_ROTATION_Y, 0, 'YXZ')

// URL de l'arcade
const ARCADE_IFRAME_SRC = 'https://joan-arcade-machine.vercel.app'

interface ArcadeScreenProps {
  onHover: (objects: THREE.Object3D[]) => void
  onSelect: (stage: PierreStage) => void
}

/**
 * Composant ArcadeScreen avec iframe.
 */
export function ArcadeScreen({ onHover, onSelect }: ArcadeScreenProps) {
  const groupRef = useRef<THREE.Group>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [isActive, setIsActive] = useState(false)

  const currentStage = usePierreStore((s) => s.currentStage)

  // Charger le modèle de la machine arcade
  const { scene } = useGLTF('/pierre/assets/models/arcadeMachine.glb')

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

  // Nommer la scène pour le raycasting
  scene.name = 'arcadeMachine'

  // Activer selon le stage
  useEffect(() => {
    setIsActive(currentStage === 'arcadeMachine')
  }, [currentStage])

  // Communication avec l'iframe
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isActive && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: 'keyDownParent', key: e.key }, '*')
      }
    },
    [isActive]
  )

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (isActive && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: 'keyUpParent', key: e.key }, '*')
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

      {/* Écran noir par défaut (visible quand inactif) */}
      {!isActive && (
        <mesh position={ARCADE_POSITION.toArray()} scale={ARCADE_SCALE.toArray()} rotation={ARCADE_EULER}>
          <planeGeometry args={[ARCADE_SCREEN_SIZE.width, ARCADE_SCREEN_SIZE.height]} />
          <meshBasicMaterial color="black" />
        </mesh>
      )}

      {/* iframe (visible seulement quand actif) */}
      {isActive && (
        <Html
          position={ARCADE_POSITION.toArray()}
          scale={[ARCADE_SCALE.x * 1000, ARCADE_SCALE.y * 1000, 1]}
          rotation={ARCADE_EULER}
          transform
          zIndexRange={[0, 0]}
        >
          <div
            style={{
              width: `${ARCADE_SCREEN_SIZE.width}px`,
              height: `${ARCADE_SCREEN_SIZE.height}px`,
              overflow: 'hidden',
            }}
          >
            <iframe
              ref={iframeRef}
              src={ARCADE_IFRAME_SRC}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: 'black',
                padding: '16px',
                boxSizing: 'border-box',
              }}
              title="Arcade Game"
            />
          </div>
        </Html>
      )}
    </group>
  )
}

// Preload
useGLTF.preload('/pierre/assets/models/arcadeMachine.glb')

export default ArcadeScreen
