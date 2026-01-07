/**
 * MonitorScreen - Moniteur.
 *
 * L'iframe est géré par CSS3DRenderer dans PierreExperience.
 * Ce composant gère uniquement le modèle 3D et le mesh transparent pour le raycasting.
 *
 * Composant réutilisable pour les deux moniteurs:
 * - Gauche: "About Me" (Joan-OS)
 * - Droite: "Projects" (Art Gallery)
 */

import { useRef, useState, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { usePierreStore, type PierreStage } from '../stores/pierreStore'
import { useBakedMaterials } from '../contexts/BakedMaterialContext'

// Configuration des moniteurs
const MONITOR_CONFIG = {
  left: {
    model: '/pierre/assets/models/leftMonitor.glb',
    position: new THREE.Vector3(1.06738, 2.50725, -4.23009),
    scale: new THREE.Vector3(0.00102, 0.00102, 1),
    rotation: [0, 0, 0] as [number, number, number],
    stage: 'leftMonitor' as PierreStage,
  },
  right: {
    model: '/pierre/assets/models/rightMonitor.glb',
    position: new THREE.Vector3(2.47898, 2.50716, -4.14566),
    scale: new THREE.Vector3(0.00102, 0.00102, 1),
    rotation: [0, (-7.406 * Math.PI) / 180, 0] as [number, number, number],
    stage: 'rightMonitor' as PierreStage,
  },
}

const SCREEN_SIZE = { width: 1370.178, height: 764.798 }

interface MonitorScreenProps {
  type: 'left' | 'right'
  onHover: (objects: THREE.Object3D[]) => void
  onSelect: (stage: PierreStage) => void
}

/**
 * Composant MonitorScreen - modèle 3D uniquement.
 * L'iframe est rendu par CSS3DRenderer.
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

      {/* Mesh transparent pour le raycasting */}
      <mesh
        position={config.position.toArray()}
        scale={config.scale.toArray()}
        rotation={config.rotation}
        name={`${type}MonitorScreen`}
      >
        <planeGeometry args={[SCREEN_SIZE.width, SCREEN_SIZE.height]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// Preload des modèles
useGLTF.preload(MONITOR_CONFIG.left.model)
useGLTF.preload(MONITOR_CONFIG.right.model)

export default MonitorScreen

