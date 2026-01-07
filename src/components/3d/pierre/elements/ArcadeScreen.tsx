/**
 * ArcadeScreen - Machine arcade.
 *
 * L'arcade est intégrée directement via Html de drei (pas d'iframe).
 */

import { useRef, useEffect, useMemo } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import { usePierreStore, type PierreStage } from '../stores/pierreStore'
import { useBakedMaterials } from '../contexts/BakedMaterialContext'
import { ArcadeMachine } from '../apps/arcade'
import { useGameStore } from '@stores/gameStore'

// Configuration (depuis constants.js de Joan)
const ARCADE_SCREEN_SIZE = { width: 1006.986, height: 1210.118 }
const ARCADE_POSITION: [number, number, number] = [3.24776, 2.7421, 2.3009]
const ARCADE_SCALE = 0.00102

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

  // Callback pour naviguer vers le Hub (level 0)
  const handleNavigateToHub = () => setCurrentLevel(0)

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

  scene.name = 'arcadeMachine'

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

      {/*
        Arcade intégrée via Html.

        Formule drei: factor = 1 / (distanceFactor / 400)
        Pour que 1px HTML ≈ 0.00102 unité 3D (comme Joan):
        distanceFactor = 400 * 0.00102 ≈ 0.408
      */}
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
    </group>
  )
}

// Preload
useGLTF.preload('/pierre/assets/models/arcadeMachine.glb')

export default ArcadeScreen
