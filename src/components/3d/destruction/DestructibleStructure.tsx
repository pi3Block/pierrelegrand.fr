/**
 * DestructibleStructure - Blocs destructibles avec physique Rapier
 * Supporte 3 types de materiaux: wood, glass, stone
 * Chaque materiau a des proprietes physiques differentes
 */

import { useMemo } from 'react'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'

/** Types de materiaux disponibles */
export type MaterialType = 'wood' | 'glass' | 'stone'

/** Configuration physique par materiau - OPTIMISE POUR STABILITE */
const MATERIAL_CONFIG: Record<MaterialType, {
  mass: number
  friction: number
  restitution: number
  linearDamping: number
  angularDamping: number
  color: string
  emissive?: string
  emissiveIntensity?: number
  roughness: number
  metalness: number
  transparent?: boolean
  opacity?: number
}> = {
  wood: {
    mass: 0.3, // Plus lourd pour stabilite
    friction: 0.9, // Plus de friction
    restitution: 0.1, // Moins de rebond
    linearDamping: 0.8, // Plus de damping
    angularDamping: 0.8,
    color: '#8B5A2B',
    emissive: '#5D4037',
    emissiveIntensity: 0.05,
    roughness: 0.85,
    metalness: 0.05,
  },
  glass: {
    mass: 0.2,
    friction: 0.6,
    restitution: 0.05,
    linearDamping: 0.7,
    angularDamping: 0.7,
    color: '#87CEEB',
    emissive: '#87CEEB',
    emissiveIntensity: 0.2,
    roughness: 0.1,
    metalness: 0.3,
    transparent: true,
    opacity: 0.6,
  },
  stone: {
    mass: 1.5, // Beaucoup plus lourd
    friction: 0.95, // Maximum friction
    restitution: 0.02,
    linearDamping: 0.9,
    angularDamping: 0.9,
    color: '#808080',
    roughness: 0.95,
    metalness: 0.1,
  },
}

// Placeholder pour compatibilité - ne fait rien car le batching ne fonctionne pas bien avec React
export function DestructibleBatch({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

interface DestructibleBlockProps {
  position: [number, number, number]
  size?: [number, number, number]
  material: MaterialType
  rotation?: [number, number, number]
  colorVariation?: number
  isFoundation?: boolean // Si true, le bloc est fixe et ne bouge pas
}

/**
 * Bloc destructible individuel
 * Utilise RigidBody dynamique pour la physique
 */
export function DestructibleBlock({
  position,
  size = [0.8, 0.4, 0.3],
  material,
  rotation = [0, 0, 0],
  colorVariation = 0,
  isFoundation = false,
}: DestructibleBlockProps) {
  const config = MATERIAL_CONFIG[material]

  // Variation de couleur pour plus de realisme
  const variedColor = useMemo(() => {
    const color = new THREE.Color(config.color)
    color.offsetHSL(0, 0, colorVariation * 0.1)
    return color
  }, [config.color, colorVariation])

  return (
    <RigidBody
      type={isFoundation ? 'fixed' : 'dynamic'}
      position={position}
      rotation={rotation}
      mass={config.mass}
      friction={config.friction}
      restitution={config.restitution}
      linearDamping={config.linearDamping}
      angularDamping={config.angularDamping}
      colliders="cuboid"
      canSleep={true}
      ccd={true}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={variedColor}
          emissive={config.emissive}
          emissiveIntensity={config.emissiveIntensity ?? 0}
          roughness={config.roughness}
          metalness={config.metalness}
          transparent={config.transparent ?? false}
          opacity={config.opacity ?? 1}
          flatShading={material === 'stone'}
        />
      </mesh>
    </RigidBody>
  )
}

/**
 * Planche de bois (longue et fine)
 */
export function WoodPlank({
  position,
  rotation = [0, 0, 0],
  length = 1.5,
  colorVariation = 0,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  length?: number
  colorVariation?: number
}) {
  return (
    <DestructibleBlock
      position={position}
      rotation={rotation}
      size={[length, 0.15, 0.15]}
      material="wood"
      colorVariation={colorVariation}
    />
  )
}

/**
 * Bloc de verre (carre, fragile)
 */
export function GlassBlock({
  position,
  rotation = [0, 0, 0],
  size = 0.5,
  colorVariation = 0,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  size?: number
  colorVariation?: number
}) {
  return (
    <DestructibleBlock
      position={position}
      rotation={rotation}
      size={[size, size, size * 0.3]}
      material="glass"
      colorVariation={colorVariation}
    />
  )
}

/**
 * Bloc de pierre (lourd, resistant)
 */
export function StoneBlock({
  position,
  rotation = [0, 0, 0],
  size = [0.6, 0.6, 0.4],
  colorVariation = 0,
  isFoundation = false,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  size?: [number, number, number]
  colorVariation?: number
  isFoundation?: boolean
}) {
  return (
    <DestructibleBlock
      position={position}
      rotation={rotation}
      size={size}
      material="stone"
      colorVariation={colorVariation}
      isFoundation={isFoundation}
    />
  )
}

/**
 * Poutre de bois verticale
 */
export function WoodBeam({
  position,
  height = 2,
  colorVariation = 0,
}: {
  position: [number, number, number]
  height?: number
  colorVariation?: number
}) {
  return (
    <DestructibleBlock
      position={position}
      size={[0.2, height, 0.2]}
      material="wood"
      colorVariation={colorVariation}
    />
  )
}

/**
 * Pilier de pierre
 */
export function StonePillar({
  position,
  height = 1.5,
  colorVariation = 0,
}: {
  position: [number, number, number]
  height?: number
  colorVariation?: number
}) {
  return (
    <DestructibleBlock
      position={position}
      size={[0.4, height, 0.4]}
      material="stone"
      colorVariation={colorVariation}
    />
  )
}
