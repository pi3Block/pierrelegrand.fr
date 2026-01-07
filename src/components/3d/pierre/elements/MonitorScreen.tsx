/**
 * MonitorScreen - Moniteur avec écran placeholder.
 *
 * Composant réutilisable pour les deux moniteurs:
 * - Gauche: "About Me"
 * - Droite: "Projects"
 *
 * Note: Les écrans affichent un placeholder noir pour l'instant.
 * Le contenu sera ajouté ultérieurement.
 */

import { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { PierreStage } from '../stores/pierreStore'
import { useBakedMaterials } from '../contexts/BakedMaterialContext'

// Configuration des moniteurs
const MONITOR_CONFIG = {
  left: {
    model: '/pierre/assets/models/leftMonitor.glb',
    position: [1.06738, 2.50725, -4.23009] as [number, number, number],
    scale: [1.4, 0.78, 1] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    stage: 'leftMonitor' as PierreStage,
  },
  right: {
    model: '/pierre/assets/models/rightMonitor.glb',
    position: [2.47898, 2.50716, -4.14566] as [number, number, number],
    scale: [1.4, 0.78, 1] as [number, number, number],
    rotation: [0, (-7.406 * Math.PI) / 180, 0] as [number, number, number],
    stage: 'rightMonitor' as PierreStage,
  },
}

interface MonitorScreenProps {
  type: 'left' | 'right'
  onHover: (objects: THREE.Object3D[]) => void
  onSelect: (stage: PierreStage) => void
}

/**
 * Composant MonitorScreen - modèle 3D avec écran noir placeholder.
 */
export function MonitorScreen({ type, onHover, onSelect }: MonitorScreenProps) {
  const groupRef = useRef<THREE.Group>(null)
  const config = MONITOR_CONFIG[type]

  // Charger le modèle du moniteur
  const { scene } = useGLTF(config.model)

  // Récupérer le matériau baked
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

  return (
    <group
      ref={groupRef}
      name={`${type}Monitor`}
      onPointerOver={() => groupRef.current && onHover([groupRef.current])}
      onPointerOut={() => onHover([])}
      onClick={() => onSelect(config.stage)}
    >
      {/* Modèle du moniteur */}
      <primitive object={scene} />

      {/* Écran noir placeholder */}
      <mesh
        position={config.position}
        scale={config.scale}
        rotation={config.rotation}
        name={`${type}MonitorScreen`}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
    </group>
  )
}

// Preload des modèles
useGLTF.preload(MONITOR_CONFIG.left.model)
useGLTF.preload(MONITOR_CONFIG.right.model)

export default MonitorScreen

