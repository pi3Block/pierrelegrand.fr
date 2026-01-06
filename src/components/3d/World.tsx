import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { useGameStore, Biome, Level } from '@stores/gameStore'
import { RoughPlane } from './RoughPlane'
import { Slopes } from './Slopes'
import { Steps } from './Steps'
import { RigidObjects } from './RigidObjects'
import { FloatingPlatform } from './FloatingPlatform'
import { BrickWall } from './BrickWall'

// Couleurs par biome
const BIOME_COLORS: Record<Biome, { primary: string; secondary: string; ground: string }> = {
  lab: { primary: '#6366f1', secondary: '#818cf8', ground: '#1e1b4b' },
  temple: { primary: '#22c55e', secondary: '#4ade80', ground: '#14532d' },
  bank: { primary: '#f59e0b', secondary: '#fbbf24', ground: '#451a03' },
}

export function World() {
  const currentBiome = useGameStore((s) => s.currentBiome)
  const colors = BIOME_COLORS[currentBiome]

  return (
    <group>
      {/* Sol principal */}
      <Ground color={colors.ground} />

      {/* === Éléments du projet ecctrl === */}
      {/* Terrain accidenté */}
      <RoughPlane />

      {/* Rampes/Pentes */}
      <Slopes />

      {/* Petites marches */}
      <Steps />

      {/* Objets physiques interactifs */}
      <RigidObjects />

      {/* Plateformes flottantes */}
      <FloatingPlatform />

      {/* === Éléments originaux === */}
      {/* Plateformes de base */}
      <Platform position={[5, 0.5, 0]} size={[3, 1, 3]} color={colors.primary} />
      <Platform position={[-5, 1, 3]} size={[4, 0.5, 4]} color={colors.secondary} />
      <Platform position={[0, 2, -8]} size={[6, 0.5, 3]} color={colors.primary} />

      {/* Escalier personnalisé */}
      <Stairs position={[8, 0, -5]} color={colors.secondary} />

      {/* Rampe personnalisée */}
      <Ramp position={[-8, 0, -5]} color={colors.primary} />

      {/* Murs de délimitation */}
      <Walls />

      {/* Murs de briques destructibles */}
      <BrickWall position={[-10, 0, 5]} rows={4} cols={6} />
      <BrickWall position={[10, 0, -5]} rotation={[0, Math.PI / 2, 0]} rows={3} cols={8} />
      <BrickWall position={[0, 0, 10]} rows={5} cols={10} brickMass={0.2} />

      {/* Objets décoratifs */}
      <Decorations biome={currentBiome} />

      {/* Portails vers autres biomes */}
      <BiomePortals currentBiome={currentBiome} />

      {/* Portail vers niveau 2 */}
      <LevelPortal position={[0, 1, -18]} targetLevel={2} />
    </group>
  )
}

// Sol avec physics
function Ground({ color }: { color: string }) {
  return (
    <RigidBody type="fixed" friction={1}>
      <mesh receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[50, 1, 50]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  )
}

// Plateforme générique
interface PlatformProps {
  position: [number, number, number]
  size: [number, number, number]
  color: string
}

function Platform({ position, size, color }: PlatformProps) {
  return (
    <RigidBody type="fixed" position={position} friction={1}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  )
}

// Escalier
function Stairs({ position, color }: { position: [number, number, number]; color: string }) {
  const steps = 5
  const stepHeight = 0.3
  const stepDepth = 0.5
  const stepWidth = 2

  return (
    <group position={position}>
      {Array.from({ length: steps }).map((_, i) => (
        <RigidBody key={i} type="fixed" position={[0, i * stepHeight, -i * stepDepth]} friction={1}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[stepWidth, stepHeight, stepDepth]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </RigidBody>
      ))}
    </group>
  )
}

// Rampe
function Ramp({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <RigidBody type="fixed" position={position} rotation={[0.3, 0, 0]} friction={0.5}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3, 0.2, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  )
}

// Murs invisibles de délimitation
function Walls() {
  const wallHeight = 10
  const arenaSize = 24

  return (
    <>
      {/* Nord */}
      <RigidBody type="fixed" position={[0, wallHeight / 2, -arenaSize]}>
        <CuboidCollider args={[arenaSize, wallHeight / 2, 0.5]} />
      </RigidBody>
      {/* Sud */}
      <RigidBody type="fixed" position={[0, wallHeight / 2, arenaSize]}>
        <CuboidCollider args={[arenaSize, wallHeight / 2, 0.5]} />
      </RigidBody>
      {/* Est */}
      <RigidBody type="fixed" position={[arenaSize, wallHeight / 2, 0]}>
        <CuboidCollider args={[0.5, wallHeight / 2, arenaSize]} />
      </RigidBody>
      {/* Ouest */}
      <RigidBody type="fixed" position={[-arenaSize, wallHeight / 2, 0]}>
        <CuboidCollider args={[0.5, wallHeight / 2, arenaSize]} />
      </RigidBody>
    </>
  )
}

// Décorations par biome
function Decorations({ biome }: { biome: Biome }) {
  switch (biome) {
    case 'lab':
      return (
        <>
          {/* Serveurs / Écrans */}
          <FloatingBox position={[3, 2, 5]} color="#6366f1" />
          <FloatingBox position={[-4, 3, -3]} color="#818cf8" />
        </>
      )
    case 'temple':
      return (
        <>
          {/* Arbres / Sphères zen */}
          <FloatingSphere position={[4, 1.5, 6]} color="#22c55e" />
          <FloatingSphere position={[-3, 2, -4]} color="#4ade80" />
        </>
      )
    case 'bank':
      return (
        <>
          {/* Coffres / Crypto */}
          <FloatingOctahedron position={[5, 2, 4]} color="#f59e0b" />
          <FloatingOctahedron position={[-5, 3, -5]} color="#fbbf24" />
        </>
      )
  }
}

// Objets décoratifs flottants
function FloatingBox({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial color={color} wireframe />
    </mesh>
  )
}

function FloatingSphere({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function FloatingOctahedron({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position} castShadow>
      <octahedronGeometry args={[0.6]} />
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
    </mesh>
  )
}

// Portails vers autres biomes
function BiomePortals({ currentBiome }: { currentBiome: Biome }) {
  const setCurrentBiome = useGameStore((s) => s.setCurrentBiome)
  const biomes: Biome[] = ['lab', 'temple', 'bank']
  const otherBiomes = biomes.filter((b) => b !== currentBiome)

  const portalPositions: [number, number, number][] = [
    [15, 1, 15],
    [-15, 1, 15],
  ]

  return (
    <>
      {otherBiomes.map((biome, index) => (
        <Portal
          key={biome}
          position={portalPositions[index]!}
          biome={biome}
          onClick={() => setCurrentBiome(biome)}
        />
      ))}
    </>
  )
}

interface PortalProps {
  position: [number, number, number]
  biome: Biome
  onClick: () => void
}

function Portal({ position, biome, onClick }: PortalProps) {
  const colors = BIOME_COLORS[biome]

  return (
    <group position={position}>
      {/* Zone de trigger (invisible) */}
      <RigidBody type="fixed" sensor onIntersectionEnter={onClick}>
        <CuboidCollider args={[1.5, 2, 1.5]} />
      </RigidBody>

      {/* Visuel du portail */}
      <mesh>
        <torusGeometry args={[1.5, 0.1, 16, 32]} />
        <meshStandardMaterial color={colors.primary} emissive={colors.primary} emissiveIntensity={0.5} />
      </mesh>

      {/* Effet intérieur */}
      <mesh>
        <circleGeometry args={[1.4, 32]} />
        <meshStandardMaterial
          color={colors.secondary}
          transparent
          opacity={0.5}
          emissive={colors.secondary}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  )
}

// Portail vers autre niveau
interface LevelPortalProps {
  position: [number, number, number]
  targetLevel: Level
}

function LevelPortal({ position, targetLevel }: LevelPortalProps) {
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel)
  const color = targetLevel === 2 ? '#ef4444' : '#3b82f6'
  const colorSecondary = targetLevel === 2 ? '#fca5a5' : '#93c5fd'

  return (
    <group position={position}>
      {/* Plateforme de sol pour éviter les chutes */}
      <RigidBody type="fixed" position={[0, -0.25, 0]} friction={1}>
        <mesh receiveShadow>
          <cylinderGeometry args={[3, 3, 0.5, 32]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Zone de trigger (invisible) - centrée sur le portail */}
      <RigidBody type="fixed" position={[0, 1.5, 0]} sensor onIntersectionEnter={() => setCurrentLevel(targetLevel)}>
        <CuboidCollider args={[1, 1.5, 0.5]} />
      </RigidBody>

      {/* Cadre du portail - torus vertical (cercle) */}
      <mesh position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.8, 0.12, 16, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Effet intérieur du portail - disque vertical */}
      <mesh position={[0, 1.5, 0]}>
        <circleGeometry args={[1.65, 48]} />
        <meshStandardMaterial
          color={colorSecondary}
          transparent
          opacity={0.5}
          emissive={color}
          emissiveIntensity={0.4}
          side={2}
        />
      </mesh>

      {/* Piliers latéraux */}
      <mesh position={[-2, 1.5, 0]} castShadow>
        <boxGeometry args={[0.3, 3.5, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[2, 1.5, 0]} castShadow>
        <boxGeometry args={[0.3, 3.5, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Barre supérieure */}
      <mesh position={[0, 3.3, 0]} castShadow>
        <boxGeometry args={[4.3, 0.3, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.6} />
      </mesh>
    </group>
  )
}
