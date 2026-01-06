import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { ContentCategory } from '@data/contentData'
import {
  CircularNatureGround,
  CircularArcadeGround,
  CircularCryptoGround,
} from './grounds'
import {
  InstancedNatureDecorations,
  InstancedCryptoDecorations,
  InstancedTechDecorations,
} from './instanced'
import { BiomeTransitionGround, CircularProceduralTerrain } from './terrain'
import type { BiomeType } from '@/config/proceduralConfig'

interface BiomeZoneProps {
  category: ContentCategory
  /** ID unique du biome pour le système de heightmap */
  biomeId?: string
  center: [number, number, number]
  colors: { primary: string; secondary: string; ground: string }
  radius?: number
  /** Utiliser les décorations instanciées (meilleure performance) */
  useInstanced?: boolean
  /** Seed pour la génération procédurale */
  seed?: number
  /** Activer les transitions de biome avec shader */
  useTransitions?: boolean
  /** Largeur de la zone de transition */
  transitionWidth?: number
  /** Activer le terrain 3D avec relief */
  use3DTerrain?: boolean
  /** Échelle de hauteur pour le terrain 3D */
  heightScale?: number
}

/**
 * Zone de biome avec sol stylisé et décorations thématiques
 * Chaque biome a son propre type de sol avec shader personnalisé
 *
 * Mode instancié (useInstanced=true):
 * - Utilise InstancedMesh pour un seul draw call par type d'objet
 * - Placement via Poisson Disc Sampling
 * - Animations groupées optimisées
 *
 * Mode classique (useInstanced=false):
 * - Objets individuels positionnés manuellement
 * - Plus de contrôle mais moins performant
 */
export function BiomeZone({
  category,
  biomeId,
  center,
  colors,
  radius = 18,
  useInstanced = true,
  seed = 42,
  useTransitions = false,
  transitionWidth = 4,
  use3DTerrain = true,
  heightScale = 4,
}: BiomeZoneProps) {
  // ID du biome pour le système de heightmap (fallback sur category)
  const effectiveBiomeId = biomeId ?? category

  // Seed unique par biome basé sur la catégorie
  const biomeSeed = useMemo(() => {
    const categorySeeds: Record<ContentCategory, number> = {
      tech: seed,
      nature: seed + 1000,
      crypto: seed + 2000,
    }
    return categorySeeds[category]
  }, [category, seed])

  // Mapper ContentCategory vers BiomeType
  const biomeType: BiomeType = category

  return (
    <group position={center}>
      {/* Terrain 3D avec relief (optionnel) */}
      {use3DTerrain && (
        <CircularProceduralTerrain
          radius={radius}
          resolution={64}
          seed={biomeSeed}
          biome={biomeType}
          biomeId={effectiveBiomeId}
          heightScale={heightScale}
          position={[0, 0.1, 0]}
          worldCenter={center}
        />
      )}

      {/* Sol du biome - style unique selon la catégorie (sous le terrain 3D) */}
      {!use3DTerrain && (
        useTransitions ? (
          <BiomeTransitionGround
            biome={category}
            center={[0, 0, 0]}
            radius={radius}
            transitionWidth={transitionWidth}
          />
        ) : (
          <EnhancedBiomeGround category={category} radius={radius} />
        )
      )}

      {/* Décorations spécifiques au biome */}
      {useInstanced ? (
        <InstancedBiomeDecorations
          category={category}
          biomeId={effectiveBiomeId}
          worldCenter={center}
          colors={colors}
          radius={radius}
          seed={biomeSeed}
        />
      ) : (
        <BiomeDecorations category={category} colors={colors} radius={radius} />
      )}

      {/* Piliers de délimitation */}
      <BiomePillars color={colors.primary} radius={radius} />

      {/* Lumière ambiante du biome */}
      <pointLight
        position={[0, 8, 0]}
        intensity={0.5}
        color={colors.secondary}
        distance={radius * 2}
      />
    </group>
  )
}

/**
 * Sol amélioré selon le type de biome
 * - tech: Grille néon style Tron
 * - nature: Herbe/forêt procédurale
 * - crypto: Sol doré blockchain
 */
function EnhancedBiomeGround({ category, radius }: { category: ContentCategory; radius: number }) {
  switch (category) {
    case 'tech':
      return <CircularArcadeGround radius={radius} variant="tron" speed={0.8} />
    case 'nature':
      return <CircularNatureGround radius={radius} variant="forest" />
    case 'crypto':
      return <CircularCryptoGround radius={radius} />
    default:
      return <CircularNatureGround radius={radius} variant="grass" />
  }
}

/**
 * Décorations instanciées selon le biome
 * Utilise InstancedMesh pour des performances optimales
 * Passe le biomeId et worldCenter pour le positionnement height-aware
 */
interface InstancedBiomeDecorationsProps {
  category: ContentCategory
  biomeId: string
  worldCenter: [number, number, number]
  colors: { primary: string; secondary: string }
  radius: number
  seed: number
}

function InstancedBiomeDecorations({
  category,
  biomeId,
  worldCenter,
  colors,
  radius,
  seed,
}: InstancedBiomeDecorationsProps) {
  switch (category) {
    case 'tech':
      return <InstancedTechDecorations radius={radius} colors={colors} seed={seed} />
    case 'nature':
      return (
        <InstancedNatureDecorations
          radius={radius}
          colors={colors}
          seed={seed}
          worldCenter={worldCenter}
          biomeId={biomeId}
        />
      )
    case 'crypto':
      return <InstancedCryptoDecorations radius={radius} colors={colors} seed={seed} />
    default:
      return null
  }
}

interface BiomeDecorationsProps {
  category: ContentCategory
  colors: { primary: string; secondary: string }
  radius: number
}

function BiomeDecorations({ category, colors, radius }: BiomeDecorationsProps) {
  switch (category) {
    case 'tech':
      return <TechDecorations colors={colors} radius={radius} />
    case 'nature':
      return <NatureDecorations colors={colors} radius={radius} />
    case 'crypto':
      return <CryptoDecorations colors={colors} radius={radius} />
    default:
      return null
  }
}

/**
 * Décorations du biome Tech - Serveurs, écrans, circuits
 */
function TechDecorations({ colors, radius }: { colors: { primary: string; secondary: string }; radius: number }) {
  const circuitRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (circuitRef.current) {
      circuitRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

  return (
    <>
      {/* Serveurs flottants */}
      <FloatingServer position={[radius * 0.5, 2, 0]} color={colors.primary} />
      <FloatingServer position={[-radius * 0.5, 3, radius * 0.3]} color={colors.secondary} />

      {/* Circuit au sol */}
      <group ref={circuitRef} position={[0, 0.05, 0]}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} position={[Math.cos((i * Math.PI) / 3) * 5, 0, Math.sin((i * Math.PI) / 3) * 5]}>
            <boxGeometry args={[0.1, 0.02, 3]} />
            <meshStandardMaterial
              color={colors.primary}
              emissive={colors.primary}
              emissiveIntensity={0.5}
            />
          </mesh>
        ))}
        {/* Noeud central */}
        <mesh position={[0, 0.1, 0]}>
          <octahedronGeometry args={[0.5]} />
          <meshStandardMaterial
            color={colors.secondary}
            emissive={colors.secondary}
            emissiveIntensity={0.8}
            wireframe
          />
        </mesh>
      </group>

      {/* Hologrammes */}
      <HologramRing position={[radius * 0.3, 1, -radius * 0.4]} color={colors.secondary} />
    </>
  )
}

function FloatingServer({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.3
    }
  })

  return (
    <mesh ref={ref} position={position} castShadow>
      <boxGeometry args={[1, 1.5, 0.5]} />
      <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
    </mesh>
  )
}

function HologramRing({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.5
      ref.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[0.8, 0.05, 16, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
        transparent
        opacity={0.7}
      />
    </mesh>
  )
}

/**
 * Décorations du biome Nature - Arbres, plantes, rochers
 */
function NatureDecorations({ colors, radius }: { colors: { primary: string; secondary: string }; radius: number }) {
  return (
    <>
      {/* Arbres stylisés */}
      <StylizedTree position={[radius * 0.4, 0, radius * 0.2]} color={colors.primary} height={4} />
      <StylizedTree position={[-radius * 0.3, 0, -radius * 0.3]} color={colors.secondary} height={3} />
      <StylizedTree position={[radius * 0.2, 0, -radius * 0.5]} color={colors.primary} height={3.5} />

      {/* Rochers moussus */}
      <MossyRock position={[-radius * 0.5, 0, radius * 0.1]} color={colors.secondary} />
      <MossyRock position={[radius * 0.3, 0, radius * 0.4]} color={colors.primary} scale={0.7} />

      {/* Particules flottantes (lucioles) */}
      <FloatingParticles center={[0, 2, 0]} color={colors.secondary} count={8} radius={radius * 0.6} />

      {/* Champignons lumineux */}
      <GlowingMushroom position={[-radius * 0.2, 0, radius * 0.3]} color={colors.secondary} />
      <GlowingMushroom position={[radius * 0.4, 0, -radius * 0.2]} color={colors.primary} scale={0.6} />
    </>
  )
}

function StylizedTree({
  position,
  color,
  height = 3,
}: {
  position: [number, number, number]
  color: string
  height?: number
}) {
  return (
    <group position={position}>
      {/* Tronc */}
      <RigidBody type="fixed">
        <mesh position={[0, height * 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.25, height * 0.6, 8]} />
          <meshStandardMaterial color="#5d4037" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Feuillage (plusieurs sphères) */}
      <mesh position={[0, height * 0.7, 0]} castShadow>
        <sphereGeometry args={[height * 0.35, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[height * 0.2, height * 0.6, 0]} castShadow>
        <sphereGeometry args={[height * 0.25, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[-height * 0.15, height * 0.55, height * 0.1]} castShadow>
        <sphereGeometry args={[height * 0.2, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  )
}

function MossyRock({
  position,
  color,
  scale = 1,
}: {
  position: [number, number, number]
  color: string
  scale?: number
}) {
  return (
    <RigidBody type="fixed" position={position}>
      <mesh castShadow receiveShadow scale={scale}>
        <dodecahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#6b7280" roughness={0.95} />
      </mesh>
      {/* Mousse */}
      <mesh position={[0, 0.4 * scale, 0]} scale={scale}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </RigidBody>
  )
}

function FloatingParticles({
  center,
  color,
  count,
  radius,
}: {
  center: [number, number, number]
  color: string
  count: number
  radius: number
}) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh
        mesh.position.y = center[1] + Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.5
        mesh.position.x = center[0] + Math.cos(state.clock.elapsedTime * 0.3 + i * 0.8) * radius * 0.3
        mesh.position.z = center[2] + Math.sin(state.clock.elapsedTime * 0.3 + i * 0.8) * radius * 0.3
      })
    }
  })

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          position={[
            center[0] + Math.cos((i / count) * Math.PI * 2) * radius * 0.5,
            center[1],
            center[2] + Math.sin((i / count) * Math.PI * 2) * radius * 0.5,
          ]}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
        </mesh>
      ))}
    </group>
  )
}

function GlowingMushroom({
  position,
  color,
  scale = 1,
}: {
  position: [number, number, number]
  color: string
  scale?: number
}) {
  return (
    <group position={position} scale={scale}>
      {/* Pied */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.3, 8]} />
        <meshStandardMaterial color="#e8d5b7" roughness={0.8} />
      </mesh>
      {/* Chapeau */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

/**
 * Décorations du biome Crypto - Cristaux, pièces, graphiques
 */
function CryptoDecorations({ colors, radius }: { colors: { primary: string; secondary: string }; radius: number }) {
  return (
    <>
      {/* Cristaux géants */}
      <Crystal position={[radius * 0.4, 0, -radius * 0.2]} color={colors.primary} height={3} />
      <Crystal position={[-radius * 0.3, 0, radius * 0.3]} color={colors.secondary} height={2.5} />
      <Crystal position={[radius * 0.1, 0, radius * 0.5]} color={colors.primary} height={2} />

      {/* Pièces flottantes */}
      <FloatingCoin position={[0, 3, 0]} color={colors.primary} size={1.2} />
      <FloatingCoin position={[radius * 0.3, 2, radius * 0.2]} color={colors.secondary} size={0.8} />
      <FloatingCoin position={[-radius * 0.4, 2.5, -radius * 0.1]} color={colors.primary} size={0.6} />

      {/* Graphique holographique */}
      <HolographicChart position={[-radius * 0.5, 1, -radius * 0.3]} color={colors.secondary} />

      {/* Blocs de données */}
      <DataBlock position={[radius * 0.5, 0.5, radius * 0.1]} color={colors.primary} />
    </>
  )
}

function Crystal({
  position,
  color,
  height = 2,
}: {
  position: [number, number, number]
  color: string
  height?: number
}) {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.2
    }
  })

  return (
    <group ref={ref} position={position}>
      <RigidBody type="fixed">
        <mesh castShadow position={[0, height / 2, 0]}>
          <coneGeometry args={[height * 0.25, height, 6]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.3}
            metalness={0.8}
            roughness={0.2}
            transparent
            opacity={0.9}
          />
        </mesh>
      </RigidBody>
      {/* Petits cristaux autour */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[Math.cos((i * Math.PI * 2) / 3) * 0.4, height * 0.2, Math.sin((i * Math.PI * 2) / 3) * 0.4]}
          rotation={[0.3, i, 0]}
          castShadow
        >
          <coneGeometry args={[height * 0.1, height * 0.4, 4]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.4}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  )
}

function FloatingCoin({
  position,
  color,
  size = 1,
}: {
  position: [number, number, number]
  color: string
  size?: number
}) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.8
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.6) * 0.3
    }
  })

  return (
    <mesh ref={ref} position={position} castShadow>
      <cylinderGeometry args={[size * 0.5, size * 0.5, size * 0.1, 32]} />
      <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} emissive={color} emissiveIntensity={0.2} />
    </mesh>
  )
}

function HolographicChart({
  position,
  color,
}: {
  position: [number, number, number]
  color: string
}) {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
    }
  })

  // Barres du graphique
  const bars = [0.5, 0.8, 0.6, 1.0, 0.7, 0.9, 0.75]

  return (
    <group ref={ref} position={position}>
      {bars.map((height, i) => (
        <mesh key={i} position={[(i - bars.length / 2) * 0.3, height / 2, 0]}>
          <boxGeometry args={[0.15, height, 0.05]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.6}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  )
}

function DataBlock({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.3
      ref.current.rotation.z = state.clock.elapsedTime * 0.2
    }
  })

  return (
    <mesh ref={ref} position={position} castShadow>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} wireframe />
    </mesh>
  )
}

/**
 * Piliers de délimitation du biome
 */
function BiomePillars({ color, radius }: { color: string; radius: number }) {
  const pillarCount = 6
  const pillarHeight = 4

  return (
    <>
      {Array.from({ length: pillarCount }).map((_, i) => {
        const angle = (i / pillarCount) * Math.PI * 2
        const x = Math.cos(angle) * (radius - 1)
        const z = Math.sin(angle) * (radius - 1)

        return (
          <RigidBody key={i} type="fixed" position={[x, pillarHeight / 2, z]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.2, 0.3, pillarHeight, 8]} />
              <meshStandardMaterial color={color} metalness={0.4} roughness={0.6} />
            </mesh>
            {/* Sommet lumineux */}
            <mesh position={[0, pillarHeight / 2 + 0.2, 0]}>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
            </mesh>
          </RigidBody>
        )
      })}
    </>
  )
}

/**
 * Portail de transition entre biomes
 */
interface BiomePortalProps {
  position: [number, number, number]
  targetBiome: ContentCategory
  colors: { primary: string; secondary: string }
  onEnter: () => void
}

export function BiomePortal({ position, colors, onEnter }: BiomePortalProps) {
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.5
    }
  })

  // Différer l'action pour éviter l'erreur Rapier "recursive use of an object"
  const handleEnter = () => {
    setTimeout(() => onEnter(), 0)
  }

  return (
    <group position={position}>
      {/* Zone de trigger */}
      <RigidBody type="fixed" sensor onIntersectionEnter={handleEnter}>
        <CuboidCollider args={[1.2, 2, 1.2]} />
      </RigidBody>

      {/* Base du portail */}
      <RigidBody type="fixed" position={[0, -0.1, 0]} friction={1}>
        <mesh receiveShadow>
          <cylinderGeometry args={[1.5, 1.5, 0.2, 32]} />
          <meshStandardMaterial color={colors.primary} metalness={0.5} roughness={0.5} />
        </mesh>
      </RigidBody>

      {/* Anneau principal - vertical face au joueur */}
      <mesh ref={ringRef} position={[0, 1.5, 0]}>
        <torusGeometry args={[1.2, 0.08, 16, 32]} />
        <meshStandardMaterial
          color={colors.primary}
          emissive={colors.primary}
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Deuxième anneau (incliné pour effet) */}
      <mesh position={[0, 1.5, 0]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[1.0, 0.05, 16, 32]} />
        <meshStandardMaterial
          color={colors.secondary}
          emissive={colors.secondary}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Effet intérieur - cercle vertical */}
      <mesh position={[0, 1.5, 0]}>
        <circleGeometry args={[0.9, 32]} />
        <meshStandardMaterial
          color={colors.secondary}
          transparent
          opacity={0.4}
          emissive={colors.secondary}
          emissiveIntensity={0.5}
          side={2}
        />
      </mesh>

      {/* Label du biome - box plate */}
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[2, 0.5, 0.02]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Piliers */}
      {[-1.3, 1.3].map((x, i) => (
        <mesh key={i} position={[x, 1.5, 0]} castShadow>
          <boxGeometry args={[0.15, 3, 0.15]} />
          <meshStandardMaterial color={colors.primary} metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}
