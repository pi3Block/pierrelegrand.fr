/**
 * MonitorScreen - Moniteur avec iframe intégré.
 *
 * Composant réutilisable pour les deux moniteurs:
 * - Gauche: "About Me" (Joan-OS)
 * - Droite: "Projects" (Art Gallery)
 */

import { useRef, useState, useEffect } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import { usePierreStore, type PierreStage } from '../stores/pierreStore'
import { useBakedMaterials } from '../contexts/BakedMaterialContext'

// Configuration des moniteurs
const MONITOR_CONFIG = {
  left: {
    model: '/pierre/assets/models/leftMonitor.glb',
    iframeSrc: 'https://joan-os.vercel.app',
    position: new THREE.Vector3(1.06738, 2.50725, -4.23009),
    scale: new THREE.Vector3(0.00102, 0.00102, 1),
    rotation: [0, 0, 0] as [number, number, number],
    stage: 'leftMonitor' as PierreStage,
    title: 'About Me',
  },
  right: {
    model: '/pierre/assets/models/rightMonitor.glb',
    iframeSrc: 'https://joan-art-gallery.vercel.app',
    position: new THREE.Vector3(2.47898, 2.50716, -4.14566),
    scale: new THREE.Vector3(0.00102, 0.00102, 1),
    rotation: [0, (-7.406 * Math.PI) / 180, 0] as [number, number, number],
    stage: 'rightMonitor' as PierreStage,
    title: 'Projects',
  },
}

const SCREEN_SIZE = { width: 1370.178, height: 764.798 }

interface MonitorScreenProps {
  type: 'left' | 'right'
  onHover: (objects: THREE.Object3D[]) => void
  onSelect: (stage: PierreStage) => void
}

/**
 * Composant MonitorScreen réutilisable.
 */
export function MonitorScreen({ type, onHover, onSelect }: MonitorScreenProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [isActive, setIsActive] = useState(false)

  const config = MONITOR_CONFIG[type]
  const currentStage = usePierreStore((s) => s.currentStage)

  // Charger le modèle du moniteur
  const { scene } = useGLTF(config.model)

  // Récupérer le matériau baked (material2 comme dans Joan's version)
  const { material2 } = useBakedMaterials()

  // Appliquer le matériau baked au modèle du moniteur
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
  scene.name = `${type}Monitor`

  // Activer selon le stage
  useEffect(() => {
    setIsActive(currentStage === config.stage)
  }, [currentStage, config.stage])

  return (
    <group
      ref={groupRef}
      name={`${type}Monitor`}
      onPointerOver={() => groupRef.current && onHover([groupRef.current])}
      onPointerOut={() => onHover([])}
      onClick={() => !isActive && onSelect(config.stage)}
    >
      {/* Modèle du moniteur */}
      <primitive object={scene} />

      {/* Écran noir par défaut (toujours visible) */}
      {!isActive && (
        <mesh
          position={config.position.toArray()}
          scale={config.scale.toArray()}
          rotation={config.rotation}
        >
          <planeGeometry args={[SCREEN_SIZE.width, SCREEN_SIZE.height]} />
          <meshBasicMaterial color="black" />
        </mesh>
      )}

      {/* iframe (visible seulement quand actif) */}
      {isActive && (
        <Html
          position={config.position.toArray()}
          scale={[config.scale.x * 1000, config.scale.y * 1000, 1]}
          rotation={config.rotation}
          transform
          zIndexRange={[0, 0]}
        >
          <div
            style={{
              width: `${SCREEN_SIZE.width}px`,
              height: `${SCREEN_SIZE.height}px`,
              overflow: 'hidden',
            }}
          >
            <iframe
              src={config.iframeSrc}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: 'black',
                padding: '8px',
                boxSizing: 'border-box',
              }}
              title={config.title}
            />
          </div>
        </Html>
      )}
    </group>
  )
}

// Preload des modèles
useGLTF.preload(MONITOR_CONFIG.left.model)
useGLTF.preload(MONITOR_CONFIG.right.model)

export default MonitorScreen

