/**
 * MonitorScreenUikit - Moniteur avec écran interactif via @pmndrs/uikit.
 *
 * Version utilisant uikit pour un rendu 3D natif au lieu de Html de drei.
 * Meilleure intégration visuelle et pas de problèmes d'alignement DOM/3D.
 */

import { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { Root } from '@react-three/uikit'
import * as THREE from 'three'
import { usePierreStore, type PierreStage } from '../stores/pierreStore'
import { useBakedMaterials } from '../contexts/BakedMaterialContext'
import { JoanOSUikit } from '../apps/os'
import { ArtGalleryUikit } from '../apps/gallery'
import { useGameStore } from '@stores/gameStore'

// Configuration des moniteurs (depuis constants.js de Joan)
// Taille écran en unités Three.js: calculée depuis les pixels
// Original: 1370.178 x 764.798 px avec scale 0.00102
// Donc: 1370.178 * 0.00102 ≈ 1.4 unités, 764.798 * 0.00102 ≈ 0.78 unités
const MONITOR_SIZE_X = 1.4  // Largeur en unités Three.js
const MONITOR_SIZE_Y = 0.78 // Hauteur en unités Three.js
const PIXEL_SIZE = 0.00102  // 1px = 0.00102 unités 3D (comme Joan)

const MONITOR_CONFIG = {
  left: {
    model: '/pierre/assets/models/leftMonitor.glb',
    // Position de l'écran (depuis constants.js)
    screenPosition: [1.06738, 2.50725, -4.23009] as [number, number, number],
    // Pas de rotation pour le moniteur gauche
    screenRotation: [0, 0, 0] as [number, number, number],
    stage: 'leftMonitor' as PierreStage,
  },
  right: {
    model: '/pierre/assets/models/rightMonitor.glb',
    // Position de l'écran (depuis constants.js)
    screenPosition: [2.47898, 2.50716, -4.14566] as [number, number, number],
    // Rotation Y: -7.406° (depuis constants.js)
    screenRotation: [0, (-7.406 * Math.PI) / 180, 0] as [number, number, number],
    stage: 'rightMonitor' as PierreStage,
  },
}

interface MonitorScreenUikitProps {
  type: 'left' | 'right'
  onHover: (objects: THREE.Object3D[]) => void
  onSelect: (stage: PierreStage) => void
}

/**
 * Composant MonitorScreenUikit - modèle 3D avec écran uikit natif.
 */
export function MonitorScreenUikit({ type, onHover, onSelect }: MonitorScreenUikitProps) {
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

      {/* Écran interactif via uikit Root */}
      <group
        position={config.screenPosition}
        rotation={config.screenRotation}
      >
        <Root
          sizeX={MONITOR_SIZE_X}
          sizeY={MONITOR_SIZE_Y}
          pixelSize={PIXEL_SIZE}
          flexDirection="column"
        >
          {type === 'left' ? (
            <JoanOSUikit onNavigateToHub={handleNavigateToHub} />
          ) : (
            <ArtGalleryUikit onNavigateToHub={handleNavigateToHub} />
          )}
        </Root>
      </group>
    </group>
  )
}

// Preload des modèles
useGLTF.preload(MONITOR_CONFIG.left.model)
useGLTF.preload(MONITOR_CONFIG.right.model)

export default MonitorScreenUikit
