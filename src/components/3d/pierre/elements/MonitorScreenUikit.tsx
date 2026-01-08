/**
 * MonitorScreenUikit - Moniteur avec écran interactif via @pmndrs/uikit.
 *
 * Version utilisant uikit pour un rendu 3D natif au lieu de Html de drei.
 * Meilleure intégration visuelle et pas de problèmes d'alignement DOM/3D.
 * Supporte le responsive avec adaptation automatique sur mobile/tablette.
 */

import { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { Root, FontFamilyProvider } from '@react-three/uikit'
import * as THREE from 'three'
import { usePierreStore, type PierreStage } from '../stores/pierreStore'
import { useBakedMaterials } from '../contexts/BakedMaterialContext'
import { PierreOSUikit } from '../apps/os'
import { ArtGalleryUikit } from '../apps/gallery'
import { useGameStore } from '@stores/gameStore'
import { useMonitorResponsive } from '@hooks/useResponsive'

// Font Inter avec support des caractères latins étendus (accents français)
const INTER_FONT_URL = '/fonts/Inter-Regular.ttf'

// Configuration des moniteurs (depuis constants.js de Joan)
// Taille écran en unités Three.js: calculée depuis les pixels
// Original: 1370.178 x 764.798 px avec scale 0.00102
// Donc: 1370.178 * 0.00102 ≈ 1.4 unités, 764.798 * 0.00102 ≈ 0.78 unités
const MONITOR_SIZE_X = 1.4  // Largeur en unités Three.js
const MONITOR_SIZE_Y = 0.78 // Hauteur en unités Three.js

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

  // Configuration responsive pour adapter le pixelSize sur mobile
  const responsiveConfig = useMonitorResponsive()

  // Cacher complètement le moniteur quand on est en mode Rubik
  const isHidden = currentStage === 'rubikGroup'

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

  // Ne pas rendre du tout le moniteur en mode Rubik (uikit Root ignore visible=false)
  if (isHidden) return null

  // Désactiver le hover quand on n'est pas en vue default (focalisé sur un élément)
  const isInDefaultView = currentStage === 'default'

  return (
    <group
      ref={groupRef}
      name={`${type}Monitor`}
    >
      {/* Modèle du moniteur - zone cliquable pour naviguer vers le moniteur */}
      <primitive
        object={scene}
        onPointerOver={(e: any) => {
          if (isInDefaultView && groupRef.current) {
            e.stopPropagation()
            onHover([groupRef.current])
          }
        }}
        onPointerOut={(e: any) => {
          if (isInDefaultView) {
            e.stopPropagation()
            onHover([])
          }
        }}
        onClick={(e: any) => {
          if (isInDefaultView && !isActive) {
            e.stopPropagation()
            onSelect(config.stage)
          }
        }}
      />

      {/* Écran interactif via uikit Root - actif seulement quand on est focalisé sur ce moniteur */}
      <group
        position={config.screenPosition}
        rotation={config.screenRotation}
      >
        {/* Mesh invisible pour capturer le hover sur toute la surface de l'écran
            - depthWrite={false} et colorWrite={false} pour ne rien écrire au rendu
            - side={THREE.DoubleSide} pour capturer les rayons des deux côtés */}
        {isInDefaultView && (
          <mesh
            position={[0, 0, 0.005]} // Légèrement devant l'écran pour capturer les événements
            onPointerOver={(e) => {
              e.stopPropagation()
              if (groupRef.current) {
                onHover([groupRef.current])
              }
            }}
            onPointerOut={(e) => {
              e.stopPropagation()
              onHover([])
            }}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(config.stage)
            }}
          >
            <planeGeometry args={[MONITOR_SIZE_X, MONITOR_SIZE_Y]} />
            <meshBasicMaterial
              transparent
              opacity={0}
              depthWrite={false}
              depthTest={false}
            />
          </mesh>
        )}

        <FontFamilyProvider
          fontFamilies={{
            inter: {
              normal: INTER_FONT_URL,
            },
          }}
        >
          <Root
            sizeX={MONITOR_SIZE_X}
            sizeY={MONITOR_SIZE_Y}
            pixelSize={responsiveConfig.pixelSize}
            flexDirection="column"
            pointerEvents={isActive ? 'listener' : 'none'}
          >
            {type === 'left' ? (
              <PierreOSUikit onNavigateToHub={handleNavigateToHub} responsiveConfig={responsiveConfig} />
            ) : (
              <ArtGalleryUikit onNavigateToHub={handleNavigateToHub} responsiveConfig={responsiveConfig} />
            )}
          </Root>
        </FontFamilyProvider>
      </group>
    </group>
  )
}

// Preload des modèles
useGLTF.preload(MONITOR_CONFIG.left.model)
useGLTF.preload(MONITOR_CONFIG.right.model)

export default MonitorScreenUikit
