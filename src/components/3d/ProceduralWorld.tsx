/**
 * ProceduralWorld - Monde procédural avec génération de chunks
 *
 * Intègre tous les systèmes de génération procédurale :
 * - ChunkManager avec Web Workers
 * - Biomes avec transitions shader
 * - Végétation via Poisson Disc Sampling
 * - Système LOD avancé
 * - Architecture Enterprise avec WorldStore, Factories, HeightmapService
 */

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { ChunkManager } from './chunks'
import { BiomeTransitionGround } from './terrain'
import { BiomeVegetation } from './vegetation'
import { BiomeZone, BiomePortal } from './BiomeZone'
import { WaterFeatures as WaterFeaturesFromFactory } from './water'
import { ReturnToHubPortal } from './portals'
import { useWorldStore } from '@stores/worldStore'
import { WORLD_CONFIG as UNIFIED_WORLD_CONFIG } from '@config/worldConfig'
import type { BiomeType } from '@/config/proceduralConfig'
import type { ContentCategory } from '@data/contentData'

// Configuration du monde procédural (local - utilisé comme fallback/override)
const WORLD_CONFIG = {
  seed: UNIFIED_WORLD_CONFIG.seed,
  useWorkers: true,
  debug: UNIFIED_WORLD_CONFIG.debug,
  // Biomes
  biomeRadius: 22,
  transitionWidth: 12, // Augmenté pour couvrir plus de zone entre biomes
  hubColor: '#374151',
}

// Configuration des biomes (doit matcher worldConfig.ts)
const BIOME_CONFIG: Record<
  ContentCategory,
  {
    center: [number, number, number]
    colors: { primary: string; secondary: string; ground: string }
  }
> = {
  tech: {
    center: [30, 0, -30],
    colors: { primary: '#6366f1', secondary: '#818cf8', ground: '#1e1b4b' },
  },
  nature: {
    center: [-30, 0, -30],
    colors: { primary: '#22c55e', secondary: '#4ade80', ground: '#14532d' },
  },
  crypto: {
    center: [0, 0, 40],
    colors: { primary: '#f59e0b', secondary: '#fbbf24', ground: '#451a03' },
  },
}

// Couleur du hub central
const HUB_COLORS = {
  primary: '#8b5cf6',
  secondary: '#a78bfa',
  ground: '#1e1b4b',
}

interface ProceduralWorldProps {
  debug?: boolean
  useChunks?: boolean
  seed?: number
}

/**
 * Composant principal du monde procédural
 */
export function ProceduralWorld({
  debug = WORLD_CONFIG.debug,
  useChunks = true,
  seed = WORLD_CONFIG.seed,
}: ProceduralWorldProps) {
  const playerPositionRef = useRef(new THREE.Vector3(0, 5, 0))
  const [currentBiome, setCurrentBiome] = useState<ContentCategory | null>(null)

  // Initialiser le WorldStore
  const initialize = useWorldStore((state) => state.initialize)
  const isInitialized = useWorldStore((state) => state.isInitialized)

  useEffect(() => {
    if (!isInitialized) {
      initialize({ seed })
      console.log('[ProceduralWorld] WorldStore initialized')
    }
  }, [initialize, isInitialized, seed])

  return (
    <group name="procedural-world">
      {/* Sol de base avec shader de transitions */}
      <BaseGround />

      {/* Hub central simplifié */}
      <CentralHub />

      {/* Portail de retour vers le Hub principal */}
      <ReturnToHubPortal position={[0, 0.5, 0]} label="RETOUR HUB" />

      {/* Les 3 biomes avec leurs décorations et transitions */}
      {(Object.keys(BIOME_CONFIG) as ContentCategory[]).map((category) => {
        const config = BIOME_CONFIG[category]
        return (
          <BiomeSection
            key={category}
            category={category}
            center={config.center}
            colors={config.colors}
            radius={WORLD_CONFIG.biomeRadius}
            seed={seed}
            isActive={currentBiome === category}
          />
        )
      })}

      {/* Portails de navigation entre biomes */}
      <BiomeNavigationPortals
        currentBiome={currentBiome}
        onChangeBiome={setCurrentBiome}
      />

      {/* Système de chunks procéduraux (optionnel) */}
      {useChunks && (
        <ChunkManager
          playerPosition={playerPositionRef.current}
          seed={seed}
          debug={debug}
          useWorkers={WORLD_CONFIG.useWorkers}
          enablePhysics={true}
        />
      )}

      {/* Tracker de position du joueur */}
      <PlayerPositionTracker positionRef={playerPositionRef} />

      {/* Système d'eau - utilise WaterFactory pour positionnement terrain-aware */}
      <WaterFeaturesFromFactory />

      {/* Limites du monde */}
      <WorldBoundaries size={80} />

      {/* Debug helpers */}
      {debug && <DebugHelpers />}
    </group>
  )
}

/**
 * Sol de base avec transitions shader entre biomes
 * Position Y plus basse pour éviter le z-fighting avec les terrains
 */
function BaseGround() {
  return (
    <group name="base-ground">
      {/* Sol principal gris du hub - couvre tout le monde visible */}
      <RigidBody type="fixed" friction={1}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial
            color={WORLD_CONFIG.hubColor}
            roughness={0.9}
          />
        </mesh>
      </RigidBody>

      {/* Transitions shader pour chaque biome - couvrent les zones autour des biomes */}
      {(Object.keys(BIOME_CONFIG) as ContentCategory[]).map((category) => {
        const config = BIOME_CONFIG[category]
        return (
          <BiomeTransitionGround
            key={`transition-${category}`}
            biome={category as BiomeType}
            center={config.center}
            radius={WORLD_CONFIG.biomeRadius}
            transitionWidth={WORLD_CONFIG.transitionWidth}
            hubColor={WORLD_CONFIG.hubColor}
          />
        )
      })}
    </group>
  )
}

/**
 * Hub central avec plateforme surélevée (le portail de retour est ajouté séparément)
 */
function CentralHub() {
  return (
    <group position={[0, 0, 0]} name="central-hub">
      {/* Plateforme centrale */}
      <RigidBody type="fixed" friction={1}>
        <mesh receiveShadow position={[0, 0.25, 0]}>
          <cylinderGeometry args={[10, 12, 0.5, 32]} />
          <meshStandardMaterial
            color={HUB_COLORS.ground}
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>
      </RigidBody>

      {/* Anneau lumineux */}
      <mesh position={[0, 0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[11, 0.15, 16, 64]} />
        <meshStandardMaterial
          color={HUB_COLORS.primary}
          emissive={HUB_COLORS.primary}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Indicateurs directionnels vers les biomes */}
      <DirectionalIndicators />

      {/* Colonne centrale lumineuse */}
      <CentralPillar />

      {/* Lumière d'ambiance */}
      <pointLight
        position={[0, 8, 0]}
        intensity={1}
        color={HUB_COLORS.secondary}
        distance={30}
      />
    </group>
  )
}

/**
 * Pilier central lumineux
 */
function CentralPillar() {
  const pillarRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (pillarRef.current) {
      const material = pillarRef.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.2
    }
  })

  return (
    <group>
      {/* Base du pilier */}
      <mesh position={[0, 0.5, 0]} receiveShadow>
        <cylinderGeometry args={[1.5, 2, 0.5, 8]} />
        <meshStandardMaterial color="#1f2937" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Pilier lumineux */}
      <mesh ref={pillarRef} position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.8, 5, 8]} />
        <meshStandardMaterial
          color={HUB_COLORS.primary}
          emissive={HUB_COLORS.primary}
          emissiveIntensity={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Orbe au sommet */}
      <mesh position={[0, 6, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial
          color={HUB_COLORS.secondary}
          emissive={HUB_COLORS.secondary}
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  )
}

/**
 * Indicateurs directionnels vers les biomes
 */
function DirectionalIndicators() {
  const indicators = [
    { direction: [1, 0, -1], color: BIOME_CONFIG.tech.colors.primary, label: 'TECH' },
    { direction: [-1, 0, -1], color: BIOME_CONFIG.nature.colors.primary, label: 'NATURE' },
    { direction: [0, 0, 1], color: BIOME_CONFIG.crypto.colors.primary, label: 'CRYPTO' },
  ]

  return (
    <>
      {indicators.map((ind, i) => {
        const length = 8
        const dir = ind.direction as [number, number, number]
        const magnitude = Math.sqrt(dir[0] ** 2 + dir[2] ** 2)
        const normX = dir[0] / magnitude
        const normZ = dir[2] / magnitude
        const angle = Math.atan2(normX, normZ)

        return (
          <group key={i} position={[normX * 6, 0.55, normZ * 6]} rotation={[0, angle, 0]}>
            {/* Flèche au sol */}
            <mesh>
              <boxGeometry args={[0.6, 0.03, length]} />
              <meshStandardMaterial
                color={ind.color}
                emissive={ind.color}
                emissiveIntensity={0.4}
                transparent
                opacity={0.8}
              />
            </mesh>

            {/* Pointe */}
            <mesh position={[0, 0.03, length / 2]} rotation={[-Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.5, 1, 3]} />
              <meshStandardMaterial
                color={ind.color}
                emissive={ind.color}
                emissiveIntensity={0.5}
              />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

/**
 * Section d'un biome avec décorations et végétation
 */
interface BiomeSectionProps {
  category: ContentCategory
  center: [number, number, number]
  colors: { primary: string; secondary: string; ground: string }
  radius: number
  seed: number
  isActive: boolean
}

// Configuration de hauteur par biome
const BIOME_HEIGHT_CONFIG: Record<ContentCategory, number> = {
  nature: 6, // Collines plus prononcées pour Nature
  tech: 3, // Relief modéré pour Tech (style plateforme)
  crypto: 5, // Relief doré pour Crypto
}

function BiomeSection({ category, center, colors, radius, seed }: BiomeSectionProps) {
  const heightScale = BIOME_HEIGHT_CONFIG[category]

  return (
    <group name={`biome-${category}`}>
      {/* Zone du biome avec terrain 3D et décorations instanciées */}
      <BiomeZone
        category={category}
        biomeId={category}
        center={center}
        colors={colors}
        radius={radius}
        useInstanced={true}
        seed={seed}
        useTransitions={false}
        use3DTerrain={true}
        heightScale={heightScale}
      />

      {/* Végétation procédurale supplémentaire */}
      <BiomeVegetation
        biome={category as BiomeType}
        center={center}
        radius={radius * 0.8}
        seed={seed + 1000}
        density={0.6}
      />

      {/* Lumière d'ambiance du biome */}
      <pointLight
        position={[center[0], 8, center[2]]}
        intensity={0.6}
        color={colors.secondary}
        distance={radius * 1.5}
      />

      {/* Panneau d'entrée */}
      <BiomeEntrySign
        category={category}
        position={[center[0], 0, center[2] + radius - 3]}
        color={colors.primary}
      />
    </group>
  )
}

/**
 * Panneau d'entrée du biome
 */
function BiomeEntrySign({
  position,
  color,
}: {
  category: ContentCategory
  position: [number, number, number]
  color: string
}) {
  return (
    <group position={position}>
      {/* Panneau */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[4, 1.2, 0.2]} />
        <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Bordure lumineuse */}
      <mesh position={[0, 2.5, 0.12]}>
        <boxGeometry args={[4.1, 1.3, 0.02]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Texte (simulé par une box colorée) */}
      <mesh position={[0, 2.5, 0.13]}>
        <boxGeometry args={[3, 0.6, 0.01]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Poteau */}
      <RigidBody type="fixed">
        <mesh position={[0, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 2.4, 8]} />
          <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.6} />
        </mesh>
      </RigidBody>
    </group>
  )
}

/**
 * Portails de navigation entre biomes
 */
function BiomeNavigationPortals({
  onChangeBiome,
}: {
  currentBiome: ContentCategory | null
  onChangeBiome: (biome: ContentCategory) => void
}) {
  const portalConfigs = [
    // Hub -> Biomes
    {
      position: [15, 0, -15] as [number, number, number],
      targetBiome: 'tech' as ContentCategory,
      colors: BIOME_CONFIG.tech.colors,
    },
    {
      position: [-15, 0, -15] as [number, number, number],
      targetBiome: 'nature' as ContentCategory,
      colors: BIOME_CONFIG.nature.colors,
    },
    {
      position: [0, 0, 20] as [number, number, number],
      targetBiome: 'crypto' as ContentCategory,
      colors: BIOME_CONFIG.crypto.colors,
    },
  ]

  return (
    <>
      {portalConfigs.map((config, i) => (
        <BiomePortal
          key={i}
          position={config.position}
          targetBiome={config.targetBiome}
          colors={config.colors}
          onEnter={() => onChangeBiome(config.targetBiome)}
        />
      ))}
    </>
  )
}

/**
 * Tracker de position du joueur (pour le ChunkManager)
 */
function PlayerPositionTracker({
  positionRef,
}: {
  positionRef: React.MutableRefObject<THREE.Vector3>
}) {
  useFrame((state) => {
    // Récupérer la position de la caméra (approximation de la position du joueur)
    positionRef.current.copy(state.camera.position)
    positionRef.current.y = 0 // Ignorer la hauteur pour le chunk loading
  })

  return null
}

/**
 * Limites invisibles du monde
 */
function WorldBoundaries({ size }: { size: number }) {
  const wallHeight = 20

  return (
    <>
      {/* Nord */}
      <RigidBody type="fixed" position={[0, wallHeight / 2, -size]}>
        <CuboidCollider args={[size, wallHeight / 2, 0.5]} />
      </RigidBody>
      {/* Sud */}
      <RigidBody type="fixed" position={[0, wallHeight / 2, size]}>
        <CuboidCollider args={[size, wallHeight / 2, 0.5]} />
      </RigidBody>
      {/* Est */}
      <RigidBody type="fixed" position={[size, wallHeight / 2, 0]}>
        <CuboidCollider args={[0.5, wallHeight / 2, size]} />
      </RigidBody>
      {/* Ouest */}
      <RigidBody type="fixed" position={[-size, wallHeight / 2, 0]}>
        <CuboidCollider args={[0.5, wallHeight / 2, size]} />
      </RigidBody>
    </>
  )
}

/**
 * Helpers de debug
 */
function DebugHelpers() {
  return (
    <group name="debug-helpers">
      {/* Axes */}
      <axesHelper args={[10]} />

      {/* Grille */}
      <gridHelper args={[200, 50, '#333333', '#222222']} position={[0, 0.02, 0]} />

      {/* Indicateurs de biomes */}
      {(Object.keys(BIOME_CONFIG) as ContentCategory[]).map((category) => {
        const config = BIOME_CONFIG[category]
        return (
          <mesh
            key={`debug-${category}`}
            position={[config.center[0], 10, config.center[2]]}
          >
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color={config.colors.primary} wireframe />
          </mesh>
        )
      })}
    </group>
  )
}

export default ProceduralWorld
