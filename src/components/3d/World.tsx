import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { useMemo, useState } from 'react'
import { BiomeZone, BiomePortal } from './BiomeZone'
import { ContentBrickWall } from './ContentBrickWall'
import { getContentByCategory, type ContentCategory, type ContentItem } from '@data/contentData'
import { UrbanGround } from './grounds'
import { VideoScreen } from './VideoScreen'
import { ReturnToHubPortal } from './portals'

/**
 * World2 - Niveau 2 avec système de biomes
 *
 * Architecture de la carte:
 * - Zone centrale avec portail de retour au niveau 1
 * - 3 biomes en triangle autour du centre:
 *   - TECH (Nord-Est): Indigo, tutoriels et développement
 *   - NATURE (Nord-Ouest): Vert, bien-être et humanisme
 *   - CRYPTO (Sud): Orange, blockchain et finance
 * - Mini-portails pour naviguer entre les biomes
 * - Murs de briques représentant chaque contenu du portfolio
 */

// Configuration des biomes pour World2
const BIOME_CONFIG: Record<
  ContentCategory,
  {
    center: [number, number, number]
    colors: { primary: string; secondary: string; ground: string }
    radius: number
  }
> = {
  tech: {
    center: [25, 0, -25],
    colors: { primary: '#6366f1', secondary: '#818cf8', ground: '#1e1b4b' },
    radius: 20,
  },
  nature: {
    center: [-25, 0, -25],
    colors: { primary: '#22c55e', secondary: '#4ade80', ground: '#14532d' },
    radius: 20,
  },
  crypto: {
    center: [0, 0, 30],
    colors: { primary: '#f59e0b', secondary: '#fbbf24', ground: '#451a03' },
    radius: 20,
  },
}

// Couleur du hub central
const HUB_COLORS = {
  primary: '#8b5cf6',
  secondary: '#a78bfa',
  ground: '#1e1b4b',
}

export function World() {
  const [currentBiome, setCurrentBiome] = useState<ContentCategory | null>(null)

  return (
    <group>
      {/* Sol principal étendu */}
      <MainGround />

      {/* Hub central simplifié */}
      <CentralHub />

      {/* Portail de retour vers le Hub */}
      <ReturnToHubPortal position={[0, 0.5, 0]} label="RETOUR HUB" />

      {/* Les 3 biomes */}
      {(Object.keys(BIOME_CONFIG) as ContentCategory[]).map((category) => (
        <BiomeSection
          key={category}
          category={category}
          config={BIOME_CONFIG[category]}
          isActive={currentBiome === category}
        />
      ))}

      {/* Portails de navigation entre biomes */}
      <BiomeNavigationPortals
        currentBiome={currentBiome}
        onChangeBiome={setCurrentBiome}
      />

      {/* Chemins reliant les biomes */}
      <BiomePaths />

      {/* Murs de délimitation du monde */}
      <WorldBoundaries />
    </group>
  )
}

/**
 * Sol principal du niveau - Asphalte urbain avec reflets
 * Utilise le composant UrbanGround avec style "asphalt"
 */
function MainGround() {
  return (
    <UrbanGround
      size={[120, 120]}
      position={[0, 0, 0]}
      variant="asphalt"
      showRoadMarkings={false}
    />
  )
}

/**
 * Hub central simplifié (le portail de retour est ajouté séparément)
 */
function CentralHub() {
  return (
    <group position={[0, 0, 0]}>
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

      {/* Indicateurs directionnels vers chaque biome */}
      <DirectionalIndicators />

      {/* Lumière centrale */}
      <pointLight position={[0, 5, 0]} intensity={0.8} color={HUB_COLORS.secondary} distance={20} />
    </group>
  )
}

function DirectionalIndicators() {
  const indicators = [
    { direction: [1, 0, -1], color: BIOME_CONFIG.tech.colors.primary, label: 'TECH' },
    { direction: [-1, 0, -1], color: BIOME_CONFIG.nature.colors.primary, label: 'NATURE' },
    { direction: [0, 0, 1], color: BIOME_CONFIG.crypto.colors.primary, label: 'CRYPTO' },
  ]

  return (
    <>
      {indicators.map((ind, i) => {
        const length = 6
        const dir = ind.direction as [number, number, number]
        const magnitude = Math.sqrt(dir[0] ** 2 + dir[2] ** 2)
        const normX = dir[0] / magnitude
        const normZ = dir[2] / magnitude
        const angle = Math.atan2(normX, normZ)

        return (
          <group key={i} position={[normX * 5, 0.65, normZ * 5]} rotation={[0, angle, 0]}>
            {/* Flèche au sol - box plate pour éviter z-fighting */}
            <mesh>
              <boxGeometry args={[0.5, 0.02, length]} />
              <meshStandardMaterial
                color={ind.color}
                emissive={ind.color}
                emissiveIntensity={0.5}
                transparent
                opacity={0.7}
              />
            </mesh>
            {/* Pointe de flèche */}
            <mesh position={[0, 0.02, length / 2]} rotation={[-Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.4, 0.8, 3]} />
              <meshStandardMaterial color={ind.color} emissive={ind.color} emissiveIntensity={0.6} />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

/**
 * Section d'un biome avec ses murs de contenu
 */
interface BiomeSectionProps {
  category: ContentCategory
  config: {
    center: [number, number, number]
    colors: { primary: string; secondary: string; ground: string }
    radius: number
  }
  isActive: boolean
}

// Correspondance biome -> clé vidéo
const BIOME_VIDEO_KEYS: Record<ContentCategory, keyof typeof import('@config/videos').VIDEOS> = {
  tech: 'intro',
  nature: 'demo',
  crypto: 'tech',
}

function BiomeSection({ category, config }: BiomeSectionProps) {
  const contents = useMemo(() => getContentByCategory(category), [category])
  const wallPlacements = useMemo(
    () => generateWallPlacementsForBiome(contents, config.center, config.radius),
    [contents, config.center, config.radius]
  )

  // Position de l'écran vidéo au centre du biome, en hauteur
  const videoScreenPosition: [number, number, number] = [
    config.center[0],
    3.5, // Hauteur pour être bien visible
    config.center[2],
  ]

  return (
    <group>
      {/* Zone du biome avec décorations */}
      <BiomeZone
        category={category}
        center={config.center}
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
      {wallPlacements.map((placement) => (
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

      {/* Panneau d'entrée du biome */}
      <BiomeEntrySign
        category={category}
        position={[config.center[0], 0, config.center[2] + config.radius - 2]}
        color={config.colors.primary}
      />
    </group>
  )
}

/**
 * Génère les positions des murs pour un biome
 */
interface WallPlacement {
  content: ContentItem
  position: [number, number, number]
  rotation: [number, number, number]
  rows: number
  cols: number
}

function generateWallPlacementsForBiome(
  contents: ContentItem[],
  center: [number, number, number],
  radius: number
): WallPlacement[] {
  const placements: WallPlacement[] = []

  // Disposer les murs en arc de cercle autour du centre
  const innerRadius = radius * 0.5
  const angleSpan = Math.PI * 1.2 // Arc de 216 degrés
  const startAngle = -angleSpan / 2

  contents.forEach((content, index) => {
    const angle = startAngle + (angleSpan / (contents.length + 1)) * (index + 1)

    // Alterner entre deux cercles (intérieur et extérieur)
    const currentRadius = index % 2 === 0 ? innerRadius : innerRadius * 1.4

    const x = center[0] + Math.sin(angle) * currentRadius
    const z = center[2] + Math.cos(angle) * currentRadius

    // Rotation pour faire face au centre
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
  })

  return placements
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
}

/**
 * Portails de navigation entre les biomes
 */
function BiomeNavigationPortals({
  onChangeBiome,
}: {
  currentBiome: ContentCategory | null
  onChangeBiome: (biome: ContentCategory) => void
}) {
  // Positions des portails de transition (entre les biomes)
  const portalConfigs = [
    // Portail Hub -> Tech (entre centre et tech)
    {
      position: [12, 0, -12] as [number, number, number],
      targetBiome: 'tech' as ContentCategory,
      colors: BIOME_CONFIG.tech.colors,
    },
    // Portail Hub -> Nature (entre centre et nature)
    {
      position: [-12, 0, -12] as [number, number, number],
      targetBiome: 'nature' as ContentCategory,
      colors: BIOME_CONFIG.nature.colors,
    },
    // Portail Hub -> Crypto (entre centre et crypto)
    {
      position: [0, 0, 15] as [number, number, number],
      targetBiome: 'crypto' as ContentCategory,
      colors: BIOME_CONFIG.crypto.colors,
    },
    // Portails inter-biomes
    // Tech <-> Nature
    {
      position: [0, 0, -35] as [number, number, number],
      targetBiome: 'nature' as ContentCategory,
      colors: BIOME_CONFIG.nature.colors,
    },
    // Tech <-> Crypto
    {
      position: [20, 0, 5] as [number, number, number],
      targetBiome: 'crypto' as ContentCategory,
      colors: BIOME_CONFIG.crypto.colors,
    },
    // Nature <-> Crypto
    {
      position: [-20, 0, 5] as [number, number, number],
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
 * Chemins visuels reliant les biomes
 * Utilise des box très plates au lieu de planes pour éviter le z-fighting
 */
function BiomePaths() {
  const paths = [
    // Centre -> Tech
    { from: [0, 0, 0], to: [25, 0, -25], color: BIOME_CONFIG.tech.colors.primary },
    // Centre -> Nature
    { from: [0, 0, 0], to: [-25, 0, -25], color: BIOME_CONFIG.nature.colors.primary },
    // Centre -> Crypto
    { from: [0, 0, 0], to: [0, 0, 30], color: BIOME_CONFIG.crypto.colors.primary },
  ]

  return (
    <>
      {paths.map((path, i) => {
        const fromX = path.from[0] ?? 0
        const fromZ = path.from[2] ?? 0
        const toX = path.to[0] ?? 0
        const toZ = path.to[2] ?? 0
        const dx = toX - fromX
        const dz = toZ - fromZ
        const length = Math.sqrt(dx * dx + dz * dz)
        const angle = Math.atan2(dx, dz)
        const midX = (fromX + toX) / 2
        const midZ = (fromZ + toZ) / 2

        return (
          <group key={i}>
            {/* Chemin au sol - box très plate pour éviter z-fighting */}
            <mesh
              position={[midX, 0.06, midZ]}
              rotation={[0, angle, 0]}
            >
              <boxGeometry args={[2, 0.02, length]} />
              <meshStandardMaterial
                color={path.color}
                transparent
                opacity={0.5}
                emissive={path.color}
                emissiveIntensity={0.3}
              />
            </mesh>

            {/* Lignes de guidage */}
            {[...Array(Math.floor(length / 5))].map((_, j) => {
              const t = (j + 1) / (Math.floor(length / 5) + 1)
              const px = fromX + dx * t
              const pz = fromZ + dz * t

              return (
                <mesh key={j} position={[px, 0.08, pz]} rotation={[0, angle, 0]}>
                  <boxGeometry args={[1.5, 0.02, 0.3]} />
                  <meshStandardMaterial
                    color={path.color}
                    emissive={path.color}
                    emissiveIntensity={0.6}
                  />
                </mesh>
              )
            })}
          </group>
        )
      })}
    </>
  )
}

/**
 * Murs invisibles de délimitation du monde
 */
function WorldBoundaries() {
  const wallHeight = 15
  const worldSize = 55

  return (
    <>
      {/* Nord */}
      <RigidBody type="fixed" position={[0, wallHeight / 2, -worldSize]}>
        <CuboidCollider args={[worldSize, wallHeight / 2, 0.5]} />
      </RigidBody>
      {/* Sud */}
      <RigidBody type="fixed" position={[0, wallHeight / 2, worldSize]}>
        <CuboidCollider args={[worldSize, wallHeight / 2, 0.5]} />
      </RigidBody>
      {/* Est */}
      <RigidBody type="fixed" position={[worldSize, wallHeight / 2, 0]}>
        <CuboidCollider args={[0.5, wallHeight / 2, worldSize]} />
      </RigidBody>
      {/* Ouest */}
      <RigidBody type="fixed" position={[-worldSize, wallHeight / 2, 0]}>
        <CuboidCollider args={[0.5, wallHeight / 2, worldSize]} />
      </RigidBody>
    </>
  )
}

export default World
