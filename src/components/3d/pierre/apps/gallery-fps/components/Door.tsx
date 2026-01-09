/**
 * Door - Porte de sortie de la galerie FPS.
 *
 * Utilise la configuration centralisée de galleryConfig.ts pour le positionnement.
 * Peut charger un modèle GLB ou afficher une porte procédurale simple.
 */

import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { GALLERY_CONFIG } from '../galleryConfig'
import { GALLERY_FPS } from '@config/assetPaths'

// Chemin vers le modele (optionnel)
const DOOR_MODEL_PATH = GALLERY_FPS.MODELS.DOOR

// Flag pour utiliser le modèle GLB ou une porte procédurale
const USE_GLB_MODEL = false

interface DoorProps {
  /** Override position from config */
  position?: [number, number, number]
  /** Override rotation from config */
  rotation?: [number, number, number]
  /** Scale du modèle */
  scale?: number
}

/**
 * Door - Porte de la galerie.
 * Position par défaut depuis galleryConfig.ts
 */
export function Door({
  position,
  rotation,
  scale = 1
}: DoorProps) {
  const config = GALLERY_CONFIG.door

  // Utiliser la config si pas d'override
  const finalPosition = position ?? config.position
  const finalRotation = rotation ?? config.rotation

  if (USE_GLB_MODEL) {
    return (
      <DoorGLB
        position={finalPosition}
        rotation={finalRotation}
        scale={scale}
      />
    )
  }

  return (
    <DoorProcedural
      position={finalPosition}
      rotation={finalRotation}
      width={config.width}
      height={config.height}
    />
  )
}

/**
 * Porte procédurale simple (cadre + porte).
 */
function DoorProcedural({
  position,
  rotation,
  width,
  height
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  width: number
  height: number
}) {
  const frameThickness = 0.1
  const doorDepth = 0.08

  return (
    <group name="door-procedural" position={position} rotation={rotation}>
      {/* Cadre de porte (pas de collision, juste visuel) */}
      {/* Montant gauche */}
      <mesh position={[-width / 2 - frameThickness / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[frameThickness, height, frameThickness * 2]} />
        <meshStandardMaterial color="#5c4033" />
      </mesh>

      {/* Montant droit */}
      <mesh position={[width / 2 + frameThickness / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[frameThickness, height, frameThickness * 2]} />
        <meshStandardMaterial color="#5c4033" />
      </mesh>

      {/* Linteau (haut) */}
      <mesh position={[0, height + frameThickness / 2, 0]} castShadow>
        <boxGeometry args={[width + frameThickness * 2, frameThickness, frameThickness * 2]} />
        <meshStandardMaterial color="#5c4033" />
      </mesh>

      {/* Panneau de porte (légèrement enfoncé) */}
      <mesh position={[0, height / 2, -doorDepth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width - 0.05, height - 0.05, doorDepth]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Poignée */}
      <mesh position={[width / 2 - 0.15, height / 2, doorDepth / 2 + 0.02]} castShadow>
        <boxGeometry args={[0.08, 0.04, 0.06]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}

/**
 * Porte depuis modèle GLB.
 */
function DoorGLB({
  position,
  rotation,
  scale
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
}) {
  const { scene } = useGLTF(DOOR_MODEL_PATH)

  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
    return clone
  }, [scene])

  return (
    <group name="door-glb" position={position} rotation={rotation}>
      <RigidBody type="fixed" colliders="cuboid">
        <primitive object={clonedScene} scale={scale} />
      </RigidBody>
    </group>
  )
}

// Preload du modele (seulement si utilisé)
if (USE_GLB_MODEL) {
  useGLTF.preload(DOOR_MODEL_PATH)
}

export default Door
