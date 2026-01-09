/**
 * ArcadeScreen - Machine arcade.
 *
 * L'arcade est intégrée directement via Html de drei (pas d'iframe).
 */

import { useRef, useEffect } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import { usePierreStore, type PierreStage } from '../stores/pierreStore'
import { useBakedMaterials } from '../contexts/BakedMaterialContext'
import { ArcadeMachine } from '../apps/arcade'
import { useGameStore } from '@stores/gameStore'
import { PIERRE } from '@config/assetPaths'

// Configuration (depuis constants.js de Joan)
const ARCADE_SCREEN_SIZE = { width: 1006.986, height: 1210.118 }
const ARCADE_POSITION: [number, number, number] = [3.24776, 2.7421, 2.3009]

// Rotations appliquées dans l'ordre Y puis X (comme Joan)
const ROTATION_Y = -Math.PI / 2
const ROTATION_X = -Math.PI / 7

interface ArcadeScreenProps {
  onHover: (objects: THREE.Object3D[]) => void
  onSelect: (stage: PierreStage) => void
}

/**
 * Composant ArcadeScreen - modèle 3D + arcade intégrée via Html.
 */
export function ArcadeScreen({ onHover, onSelect }: ArcadeScreenProps) {
  const groupRef = useRef<THREE.Group>(null)
  const currentStage = usePierreStore((s) => s.currentStage)
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel)
  const isActive = currentStage === 'arcadeMachine'

  // Cacher complètement en mode Rubik (la scène entière est cachée)
  const isHidden = currentStage === 'rubikGroup'

  // Cacher l'UI HTML en mode pingpong (le bureau reste visible mais l'écran arcade doit disparaître)
  const hideHtmlContent = currentStage === 'pingpong'

  // Callback pour naviguer vers le Hub (level 0)
  const handleNavigateToHub = () => setCurrentLevel(0)

  // Charger le modèle de la machine arcade
  const { scene } = useGLTF(PIERRE.MODELS.ARCADE_MACHINE)

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

  scene.name = 'arcadeMachine'

  // Ne pas rendre en mode Rubik
  if (isHidden) return null

  // Désactiver le hover quand on n'est pas en vue default
  const isInDefaultView = currentStage === 'default'

  return (
    <group
      ref={groupRef}
      name="arcadeMachine"
      onPointerOver={() => isInDefaultView && groupRef.current && onHover([groupRef.current])}
      onPointerOut={() => isInDefaultView && onHover([])}
      onClick={() => isInDefaultView && !isActive && onSelect('arcadeMachine')}
    >
      {/* Modèle de la machine */}
      <primitive object={scene} />

      {/*
        Arcade intégrée via Html.

        Formule drei: factor = 1 / (distanceFactor / 400)
        Pour que 1px HTML ≈ 0.00102 unité 3D (comme Joan):
        distanceFactor = 400 * 0.00102 ≈ 0.408
      */}
      {!hideHtmlContent && (
        <Html
          transform
          position={ARCADE_POSITION}
          rotation={[ROTATION_X, ROTATION_Y, 0, 'YXZ']}
          distanceFactor={0.408}
          style={{
            width: `${ARCADE_SCREEN_SIZE.width}px`,
            height: `${ARCADE_SCREEN_SIZE.height}px`,
            overflow: 'hidden',
            pointerEvents: isActive ? 'auto' : 'none',
          }}
        >
          <ArcadeMachine onNavigateToHub={handleNavigateToHub} />
        </Html>
      )}
    </group>
  )
}

// Preload
useGLTF.preload(PIERRE.MODELS.ARCADE_MACHINE)

export default ArcadeScreen
