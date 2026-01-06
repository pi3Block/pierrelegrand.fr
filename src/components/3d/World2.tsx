import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { useGameStore } from '@stores/gameStore'
import { BrickWall } from './BrickWall'

// Couleurs niveau 2 - thème différent (rouge/orange)
const LEVEL2_COLORS = {
  primary: '#ef4444',
  secondary: '#f97316',
  ground: '#1c1917',
}

export function World2() {
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel)

  return (
    <group>
      {/* Sol principal */}
      <Ground color={LEVEL2_COLORS.ground} />

      {/* Plateformes en hauteur */}
      <Platform position={[0, 1, 0]} size={[8, 0.5, 8]} color={LEVEL2_COLORS.primary} />
      <Platform position={[10, 2, 0]} size={[4, 0.5, 4]} color={LEVEL2_COLORS.secondary} />
      <Platform position={[-10, 3, 0]} size={[4, 0.5, 4]} color={LEVEL2_COLORS.primary} />
      <Platform position={[0, 4, -10]} size={[6, 0.5, 6]} color={LEVEL2_COLORS.secondary} />
      <Platform position={[0, 5, 10]} size={[5, 0.5, 5]} color={LEVEL2_COLORS.primary} />

      {/* Tour de plateformes en spirale */}
      <Platform position={[5, 1.5, 5]} size={[2, 0.3, 2]} color={LEVEL2_COLORS.secondary} />
      <Platform position={[7, 2.5, 7]} size={[2, 0.3, 2]} color={LEVEL2_COLORS.primary} />
      <Platform position={[9, 3.5, 5]} size={[2, 0.3, 2]} color={LEVEL2_COLORS.secondary} />
      <Platform position={[7, 4.5, 3]} size={[2, 0.3, 2]} color={LEVEL2_COLORS.primary} />
      <Platform position={[5, 5.5, 5]} size={[3, 0.3, 3]} color={LEVEL2_COLORS.secondary} />

      {/* Murs de briques - configuration différente */}
      <BrickWall position={[-5, 0, -5]} rows={6} cols={8} color="#b91c1c" brickMass={0.15} />
      <BrickWall position={[5, 0, -8]} rotation={[0, Math.PI / 4, 0]} rows={4} cols={10} color="#c2410c" />
      <BrickWall position={[-8, 0, 8]} rows={5} cols={5} color="#dc2626" brickMass={0.1} />

      {/* Obstacles - colonnes */}
      <Column position={[3, 0, -3]} height={4} color={LEVEL2_COLORS.primary} />
      <Column position={[-3, 0, -3]} height={3} color={LEVEL2_COLORS.secondary} />
      <Column position={[3, 0, 3]} height={2} color={LEVEL2_COLORS.primary} />
      <Column position={[-3, 0, 3]} height={5} color={LEVEL2_COLORS.secondary} />

      {/* Rampes */}
      <Ramp position={[12, 0, -5]} rotation={[0, -Math.PI / 2, 0]} color={LEVEL2_COLORS.primary} />
      <Ramp position={[-12, 0, 5]} rotation={[0, Math.PI / 2, 0]} color={LEVEL2_COLORS.secondary} />

      {/* Murs de délimitation */}
      <Walls />

      {/* Portail retour niveau 1 */}
      <LevelPortal
        position={[0, 1, -15]}
        targetLevel={1}
        color="#3b82f6"
        onClick={() => setCurrentLevel(1)}
      />

      {/* Décorations niveau 2 */}
      <Decorations2 />
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

// Colonne
function Column({ position, height, color }: { position: [number, number, number]; height: number; color: string }) {
  return (
    <RigidBody type="fixed" position={[position[0], position[1] + height / 2, position[2]]} friction={1}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, height, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  )
}

// Rampe
function Ramp({
  position,
  rotation,
  color,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  color: string
}) {
  return (
    <RigidBody type="fixed" position={position} rotation={[0.3, rotation[1], 0]} friction={0.5}>
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

// Portail de niveau
interface LevelPortalProps {
  position: [number, number, number]
  targetLevel: number
  color: string
  onClick: () => void
}

function LevelPortal({ position, color, onClick }: LevelPortalProps) {
  const colorSecondary = color === '#3b82f6' ? '#93c5fd' : '#fca5a5'

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
      <RigidBody type="fixed" position={[0, 1.5, 0]} sensor onIntersectionEnter={onClick}>
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

// Décorations niveau 2
function Decorations2() {
  return (
    <>
      {/* Sphères flottantes */}
      <mesh position={[6, 3, 6]} castShadow>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-6, 4, -6]} castShadow>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 6, 0]} castShadow>
        <octahedronGeometry args={[0.8]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} emissive="#fbbf24" emissiveIntensity={0.2} />
      </mesh>
    </>
  )
}
