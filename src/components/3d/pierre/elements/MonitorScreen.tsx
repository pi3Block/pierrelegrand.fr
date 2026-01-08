/**
 * MonitorScreen - Moniteur avec écran interactif.
 *
 * Composant réutilisable pour les deux moniteurs:
 * - Gauche: PierreOS (simulation Windows)
 * - Droite: Art Gallery (galerie 3D) - À implémenter
 */

import { useRef, useEffect } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import { usePierreStore, type PierreStage } from '../stores/pierreStore'
import { useBakedMaterials } from '../contexts/BakedMaterialContext'
import { PierreOS } from '../apps/os'
import { ArtGallery } from '../apps/gallery'
import { useGameStore } from '@stores/gameStore'

// Configuration des moniteurs (depuis constants.js de Joan)
// Taille écran: 1370.178 x 764.798
// Échelle CSS: 0.00102 -> distanceFactor = 400 * 0.00102 = 0.408
const MONITOR_SCREEN_WIDTH = 1370.178
const MONITOR_SCREEN_HEIGHT = 764.798
const DISTANCE_FACTOR = 0.408

const MONITOR_CONFIG = {
  left: {
    model: '/pierre/assets/models/leftMonitor.glb',
    // Position CSS de l'écran (depuis constants.js)
    screenPosition: [1.06738, 2.50725, -4.23009] as [number, number, number],
    screenSize: { width: MONITOR_SCREEN_WIDTH, height: MONITOR_SCREEN_HEIGHT },
    // Pas de rotation pour le moniteur gauche
    screenRotation: [0, 0, 0] as [number, number, number],
    stage: 'leftMonitor' as PierreStage,
    distanceFactor: DISTANCE_FACTOR,
  },
  right: {
    model: '/pierre/assets/models/rightMonitor.glb',
    // Position CSS de l'écran (depuis constants.js)
    screenPosition: [2.47898, 2.50716, -4.14566] as [number, number, number],
    screenSize: { width: MONITOR_SCREEN_WIDTH, height: MONITOR_SCREEN_HEIGHT },
    // Rotation Y: -7.406° (depuis constants.js)
    screenRotation: [0, (-7.406 * Math.PI) / 180, 0] as [number, number, number],
    stage: 'rightMonitor' as PierreStage,
    distanceFactor: DISTANCE_FACTOR,
  },
}

interface MonitorScreenProps {
  type: 'left' | 'right'
  onHover: (objects: THREE.Object3D[]) => void
  onSelect: (stage: PierreStage) => void
}

/**
 * Composant MonitorScreen - modèle 3D avec écran interactif.
 */
export function MonitorScreen({ type, onHover, onSelect }: MonitorScreenProps) {
  const groupRef = useRef<THREE.Group>(null)
  const config = MONITOR_CONFIG[type]
  const currentStage = usePierreStore((s) => s.currentStage)
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel)
  const isActive = currentStage === config.stage

  // Callback pour naviguer vers le Hub (level 0)
  const handleNavigateToHub = () => setCurrentLevel(0)

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

  // Rendu du contenu de l'écran selon le type
  const renderScreenContent = () => {
    if (type === 'left') {
      return <PierreOS onNavigateToHub={handleNavigateToHub} />
    }
    // Moniteur droit: Art Gallery
    return <ArtGallery onNavigateToHub={handleNavigateToHub} />
  }

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

      {/* Écran interactif via Html */}
      <Html
        transform
        position={config.screenPosition}
        rotation={config.screenRotation}
        distanceFactor={config.distanceFactor}
        style={{
          width: `${config.screenSize.width}px`,
          height: `${config.screenSize.height}px`,
          overflow: 'hidden',
          pointerEvents: isActive ? 'auto' : 'none',
        }}
      >
        {renderScreenContent()}
      </Html>
    </group>
  )
}

// Preload des modèles
useGLTF.preload(MONITOR_CONFIG.left.model)
useGLTF.preload(MONITOR_CONFIG.right.model)

export default MonitorScreen

