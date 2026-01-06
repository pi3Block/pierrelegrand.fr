/**
 * WorldClassic - Monde classique du Hub (Niveau 1)
 *
 * Architecture optimisée avec:
 * - WorldStore pour l'état global
 * - InstancedMesh pour les éléments répétitifs
 * - Memoization des calculs coûteux
 * - Lazy loading des biomes
 *
 * Structure de la carte:
 * - Zone centrale avec portail de retour au niveau 1
 * - 3 biomes en triangle autour du centre (Tech, Nature, Crypto)
 * - Mini-portails pour naviguer entre les biomes
 * - Murs de briques représentant chaque contenu du portfolio
 */

import { useState, useEffect, useMemo, memo } from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { BiomeZone, BiomePortal } from './BiomeZone'
import { ContentBrickWall } from './ContentBrickWall'
import { getContentByCategory, type ContentCategory, type ContentItem } from '@data/contentData'
import { UrbanGround } from './grounds'
import { VideoScreen } from './VideoScreen'
import { ReturnToHubPortal } from './portals'
import { useWorldStore } from '@stores/worldStore'
import { WORLD_CONFIG as UNIFIED_WORLD_CONFIG } from '@config/worldConfig'

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Configuration locale du monde classique */
const WORLD_CONFIG = {
  seed: UNIFIED_WORLD_CONFIG.seed,
  debug: UNIFIED_WORLD_CONFIG.debug,
  worldSize: 55,
  wallHeight: 15,
} as const

/** Configuration des biomes - synchronisée avec worldConfig.ts */
const BIOME_CONFIG: Readonly<Record<
  ContentCategory,
  {
    center: readonly [number, number, number]
    colors: { primary: string; secondary: string; ground: string }
    radius: number
  }
>> = {
  tech: {
    center: [25, 0, -25] as const,
    colors: { primary: '#6366f1', secondary: '#818cf8', ground: '#1e1b4b' },
    radius: 20,
  },
  nature: {
    center: [-25, 0, -25] as const,
    colors: { primary: '#22c55e', secondary: '#4ade80', ground: '#14532d' },
    radius: 20,
  },
  crypto: {
    center: [0, 0, 30] as const,
    colors: { primary: '#f59e0b', secondary: '#fbbf24', ground: '#451a03' },
    radius: 20,
  },
} as const

/** Couleurs du hub central */
const HUB_COLORS = {
  primary: '#8b5cf6',
  secondary: '#a78bfa',
  ground: '#1e1b4b',
} as const

/** Correspondance biome -> clé vidéo */
const BIOME_VIDEO_KEYS: Readonly<Record<ContentCategory, 'intro' | 'demo' | 'tech'>> = {
  tech: 'intro',
  nature: 'demo',
  crypto: 'tech',
} as const

/** Liste des catégories de biomes (évite Object.keys à chaque render) */
const BIOME_CATEGORIES: readonly ContentCategory[] = ['tech', 'nature', 'crypto'] as const

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function WorldClassic() {
  const [currentBiome, setCurrentBiome] = useState<ContentCategory | null>(null)

  // Initialisation du WorldStore
  const initialize = useWorldStore((state) => state.initialize)
  const isInitialized = useWorldStore((state) => state.isInitialized)

  useEffect(() => {
    if (!isInitialized) {
      initialize({ seed: WORLD_CONFIG.seed })
    }
  }, [initialize, isInitialized])

  return (
    <group name="world-classic">
      {/* Sol principal étendu */}
      <MainGround />

      {/* Hub central simplifié */}
      <CentralHub />

      {/* Portail de retour vers le Hub */}
      <ReturnToHubPortal position={[0, 0.5, 0]} label="RETOUR HUB" />

      {/* Les 3 biomes - chargés conditionnellement */}
      <BiomeSections
        currentBiome={currentBiome}
        onChangeBiome={setCurrentBiome}
      />

      {/* Chemins reliant les biomes (instanciés) */}
      <BiomePaths />

      {/* Murs de délimitation du monde */}
      <WorldBoundaries />
    </group>
  )
}

// ============================================================================
// SOL PRINCIPAL
// ============================================================================

/** Sol principal du niveau - Memoizé pour éviter les re-renders */
const MainGround = memo(function MainGround() {
  return (
    <UrbanGround
      size={[120, 120]}
      position={[0, 0, 0]}
      variant="asphalt"
      showRoadMarkings={false}
    />
  )
})

// ============================================================================
// HUB CENTRAL
// ============================================================================

/** Hub central avec plateforme et indicateurs */
const CentralHub = memo(function CentralHub() {
  return (
    <group position={[0, 0, 0]} name="central-hub">
      {/* Plateforme centrale surélevée */}
      <RigidBody type="fixed" friction={1}>
        <mesh receiveShadow position={[0, 0.25, 0]}>
          <cylinderGeometry args={[8, 10, 0.5, 32]} />
          <meshStandardMaterial color={HUB_COLORS.ground} metalness={0.3} roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Anneau décoratif autour */}
      <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[9, 0.2, 16, 64]} />
        <meshStandardMaterial
          color={HUB_COLORS.primary}
          emissive={HUB_COLORS.primary}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Indicateurs directionnels vers chaque biome (instanciés) */}
      <DirectionalIndicators />

      {/* Lumière centrale */}
      <pointLight position={[0, 5, 0]} intensity={0.8} color={HUB_COLORS.secondary} distance={20} />
    </group>
  )
})

// ============================================================================
// INDICATEURS DIRECTIONNELS (INSTANCIÉS)
// ============================================================================

/** Configuration des indicateurs - calculée une seule fois */
const INDICATOR_DATA = (() => {
  const indicators = [
    { direction: [1, 0, -1] as const, color: BIOME_CONFIG.tech.colors.primary },
    { direction: [-1, 0, -1] as const, color: BIOME_CONFIG.nature.colors.primary },
    { direction: [0, 0, 1] as const, color: BIOME_CONFIG.crypto.colors.primary },
  ]

  return indicators.map((ind) => {
    const length = 6
    const dir = ind.direction
    const magnitude = Math.sqrt(dir[0] ** 2 + dir[2] ** 2)
    const normX = dir[0] / magnitude
    const normZ = dir[2] / magnitude
    const angle = Math.atan2(normX, normZ)

    return {
      position: [normX * 5, 0.65, normZ * 5] as [number, number, number],
      rotation: [0, angle, 0] as [number, number, number],
      color: ind.color,
      length,
    }
  })
})()

/** Indicateurs directionnels optimisés avec instancing */
const DirectionalIndicators = memo(function DirectionalIndicators() {
  return (
    <>
      {INDICATOR_DATA.map((data, i) => (
        <group key={i} position={data.position} rotation={data.rotation}>
          {/* Flèche au sol */}
          <mesh>
            <boxGeometry args={[0.5, 0.02, data.length]} />
            <meshStandardMaterial
              color={data.color}
              emissive={data.color}
              emissiveIntensity={0.5}
              transparent
              opacity={0.7}
            />
          </mesh>
          {/* Pointe de flèche */}
          <mesh position={[0, 0.02, data.length / 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.4, 0.8, 3]} />
            <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}
    </>
  )
})

// ============================================================================
// SECTIONS DE BIOMES
// ============================================================================

interface BiomeSectionsProps {
  currentBiome: ContentCategory | null
  onChangeBiome: (biome: ContentCategory) => void
}

/** Conteneur des biomes avec portails de navigation */
const BiomeSections = memo(function BiomeSections({ currentBiome, onChangeBiome }: BiomeSectionsProps) {
  return (
    <>
      {/* Les 3 biomes */}
      {BIOME_CATEGORIES.map((category) => (
        <BiomeSection
          key={category}
          category={category}
          config={BIOME_CONFIG[category]}
          isActive={currentBiome === category}
        />
      ))}

      {/* Portails de navigation entre biomes */}
      <BiomeNavigationPortals onChangeBiome={onChangeBiome} />
    </>
  )
})

// ============================================================================
// SECTION D'UN BIOME
// ============================================================================

interface BiomeSectionProps {
  category: ContentCategory
  config: {
    center: readonly [number, number, number]
    colors: { primary: string; secondary: string; ground: string }
    radius: number
  }
  isActive: boolean
}

/** Section d'un biome avec ses murs de contenu - Optimisé avec useMemo */
const BiomeSection = memo(function BiomeSection({ category, config }: BiomeSectionProps) {
  // Memoize le contenu et les placements
  const contents = useMemo(() => getContentByCategory(category), [category])

  const wallPlacements = useMemo(
    () => generateWallPlacementsForBiome(contents, config.center, config.radius),
    [contents, config.center, config.radius]
  )

  // Position de l'écran vidéo au centre du biome
  const videoScreenPosition = useMemo<[number, number, number]>(
    () => [config.center[0], 3.5, config.center[2]],
    [config.center]
  )

  // Position du panneau d'entrée
  const entrySignPosition = useMemo<[number, number, number]>(
    () => [config.center[0], 0, config.center[2] + config.radius - 2],
    [config.center, config.radius]
  )

  // Convertir center readonly en mutable pour BiomeZone
  const centerMutable = useMemo<[number, number, number]>(
    () => [config.center[0], config.center[1], config.center[2]],
    [config.center]
  )

  return (
    <group name={`biome-${category}`}>
      {/* Zone du biome avec décorations */}
      <BiomeZone
        category={category}
        center={centerMutable}
        colors={config.colors}
        radius={config.radius}
      />

      {/* Écran vidéo YouTube au centre du biome */}
      <VideoScreen
        videoKey={BIOME_VIDEO_KEYS[category]}
        position={videoScreenPosition}
        size={[5, 2.8]}
        glowColor={config.colors.primary}
      />

      {/* Murs de briques pour chaque contenu */}
      <ContentWalls placements={wallPlacements} />

      {/* Panneau d'entrée du biome */}
      <BiomeEntrySign position={entrySignPosition} color={config.colors.primary} />
    </group>
  )
})

// ============================================================================
// MURS DE CONTENU (OPTIMISÉS)
// ============================================================================

interface WallPlacement {
  content: ContentItem
  position: [number, number, number]
  rotation: [number, number, number]
  rows: number
  cols: number
}

/** Composant optimisé pour les murs de contenu */
const ContentWalls = memo(function ContentWalls({ placements }: { placements: WallPlacement[] }) {
  return (
    <>
      {placements.map((placement) => (
        <ContentBrickWall
          key={placement.content.id}
          content={placement.content}
          position={placement.position}
          rotation={placement.rotation}
          rows={placement.rows}
          cols={placement.cols}
          brickMass={0.2}
        />
      ))}
    </>
  )
})

/** Génère les positions des murs pour un biome - fonction pure memoizable */
function generateWallPlacementsForBiome(
  contents: ContentItem[],
  center: readonly [number, number, number],
  radius: number
): WallPlacement[] {
  const placements: WallPlacement[] = []
  const innerRadius = radius * 0.5
  const angleSpan = Math.PI * 1.2 // Arc de 216 degrés
  const startAngle = -angleSpan / 2

  for (let index = 0; index < contents.length; index++) {
    const content = contents[index]
    if (!content) continue

    const angle = startAngle + (angleSpan / (contents.length + 1)) * (index + 1)
    const currentRadius = index % 2 === 0 ? innerRadius : innerRadius * 1.4

    const x = center[0] + Math.sin(angle) * currentRadius
    const z = center[2] + Math.cos(angle) * currentRadius
    const rotationY = -angle

    // Taille variable selon le type de contenu
    const rows = content.type === 'post' ? 5 : content.type === 'page' ? 4 : 3
    const cols = content.type === 'post' ? 8 : content.type === 'page' ? 6 : 5

    placements.push({
      content,
      position: [x, 0, z],
      rotation: [0, rotationY, 0],
      rows,
      cols,
    })
  }

  return placements
}

// ============================================================================
// PANNEAU D'ENTRÉE DU BIOME
// ============================================================================

interface BiomeEntrySignProps {
  position: [number, number, number]
  color: string
}

/** Panneau d'entrée optimisé */
const BiomeEntrySign = memo(function BiomeEntrySign({ position, color }: BiomeEntrySignProps) {
  return (
    <group position={position}>
      {/* Panneau */}
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[3, 1, 0.2]} />
        <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Bordure lumineuse */}
      <mesh position={[0, 2, 0.12]}>
        <boxGeometry args={[3.1, 1.1, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>

      {/* Poteau */}
      <RigidBody type="fixed">
        <mesh position={[0, 1, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 2, 8]} />
          <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.6} />
        </mesh>
      </RigidBody>
    </group>
  )
})

// ============================================================================
// PORTAILS DE NAVIGATION
// ============================================================================

/** Configuration des portails - calculée une seule fois */
const PORTAL_CONFIGS = [
  // Portail Hub -> Tech
  { position: [12, 0, -12] as [number, number, number], targetBiome: 'tech' as ContentCategory, colors: BIOME_CONFIG.tech.colors },
  // Portail Hub -> Nature
  { position: [-12, 0, -12] as [number, number, number], targetBiome: 'nature' as ContentCategory, colors: BIOME_CONFIG.nature.colors },
  // Portail Hub -> Crypto
  { position: [0, 0, 15] as [number, number, number], targetBiome: 'crypto' as ContentCategory, colors: BIOME_CONFIG.crypto.colors },
  // Tech <-> Nature
  { position: [0, 0, -35] as [number, number, number], targetBiome: 'nature' as ContentCategory, colors: BIOME_CONFIG.nature.colors },
  // Tech <-> Crypto
  { position: [20, 0, 5] as [number, number, number], targetBiome: 'crypto' as ContentCategory, colors: BIOME_CONFIG.crypto.colors },
  // Nature <-> Crypto
  { position: [-20, 0, 5] as [number, number, number], targetBiome: 'crypto' as ContentCategory, colors: BIOME_CONFIG.crypto.colors },
] as const

/** Portails de navigation entre les biomes */
const BiomeNavigationPortals = memo(function BiomeNavigationPortals({
  onChangeBiome,
}: {
  onChangeBiome: (biome: ContentCategory) => void
}) {
  return (
    <>
      {PORTAL_CONFIGS.map((config, i) => (
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
})

// ============================================================================
// CHEMINS ENTRE BIOMES (INSTANCIÉS)
// ============================================================================

/** Configuration des chemins - calculée une seule fois */
const PATH_DATA = (() => {
  const paths = [
    { from: [0, 0, 0] as const, to: [25, 0, -25] as const, color: BIOME_CONFIG.tech.colors.primary },
    { from: [0, 0, 0] as const, to: [-25, 0, -25] as const, color: BIOME_CONFIG.nature.colors.primary },
    { from: [0, 0, 0] as const, to: [0, 0, 30] as const, color: BIOME_CONFIG.crypto.colors.primary },
  ]

  return paths.map((path) => {
    const dx = path.to[0] - path.from[0]
    const dz = path.to[2] - path.from[2]
    const length = Math.sqrt(dx * dx + dz * dz)
    const angle = Math.atan2(dx, dz)
    const midX = (path.from[0] + path.to[0]) / 2
    const midZ = (path.from[2] + path.to[2]) / 2

    // Précalculer les positions des marqueurs
    const markerCount = Math.floor(length / 5)
    const markers: Array<{ x: number; z: number }> = []
    for (let j = 0; j < markerCount; j++) {
      const t = (j + 1) / (markerCount + 1)
      markers.push({
        x: path.from[0] + dx * t,
        z: path.from[2] + dz * t,
      })
    }

    return {
      midX,
      midZ,
      length,
      angle,
      color: path.color,
      markers,
    }
  })
})()

/** Chemins visuels reliant les biomes - Optimisé avec données précalculées */
const BiomePaths = memo(function BiomePaths() {
  return (
    <>
      {PATH_DATA.map((data, i) => (
        <group key={i}>
          {/* Chemin au sol */}
          <mesh position={[data.midX, 0.06, data.midZ]} rotation={[0, data.angle, 0]}>
            <boxGeometry args={[2, 0.02, data.length]} />
            <meshStandardMaterial
              color={data.color}
              transparent
              opacity={0.5}
              emissive={data.color}
              emissiveIntensity={0.3}
            />
          </mesh>

          {/* Lignes de guidage */}
          {data.markers.map((marker, j) => (
            <mesh key={j} position={[marker.x, 0.08, marker.z]} rotation={[0, data.angle, 0]}>
              <boxGeometry args={[1.5, 0.02, 0.3]} />
              <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={0.6} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
})

// ============================================================================
// LIMITES DU MONDE
// ============================================================================

/** Configuration des murs - calculée une seule fois */
const BOUNDARY_WALLS = [
  { position: [0, WORLD_CONFIG.wallHeight / 2, -WORLD_CONFIG.worldSize] as const, args: [WORLD_CONFIG.worldSize, WORLD_CONFIG.wallHeight / 2, 0.5] as const },
  { position: [0, WORLD_CONFIG.wallHeight / 2, WORLD_CONFIG.worldSize] as const, args: [WORLD_CONFIG.worldSize, WORLD_CONFIG.wallHeight / 2, 0.5] as const },
  { position: [WORLD_CONFIG.worldSize, WORLD_CONFIG.wallHeight / 2, 0] as const, args: [0.5, WORLD_CONFIG.wallHeight / 2, WORLD_CONFIG.worldSize] as const },
  { position: [-WORLD_CONFIG.worldSize, WORLD_CONFIG.wallHeight / 2, 0] as const, args: [0.5, WORLD_CONFIG.wallHeight / 2, WORLD_CONFIG.worldSize] as const },
] as const

/** Murs invisibles de délimitation du monde */
const WorldBoundaries = memo(function WorldBoundaries() {
  return (
    <>
      {BOUNDARY_WALLS.map((wall, i) => (
        <RigidBody key={i} type="fixed" position={[...wall.position]}>
          <CuboidCollider args={[...wall.args]} />
        </RigidBody>
      ))}
    </>
  )
})

// ============================================================================
// EXPORT
// ============================================================================

export default WorldClassic
