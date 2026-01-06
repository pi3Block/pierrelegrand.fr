/**
 * Hub - Hub central de téléportation avec 4 portails vers les différents mondes.
 * Point de départ du jeu (Level 0).
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore, type Level } from '@stores/gameStore'

// Configuration des portails
const PORTAL_CONFIG: {
  position: [number, number, number]
  rotation: number
  level: Level
  name: string
  color: string
  colorSecondary: string
  description: string
}[] = [
  {
    position: [0, 0, -15],
    rotation: 0,
    level: 1,
    name: 'CLASSIC',
    color: '#3b82f6',
    colorSecondary: '#93c5fd',
    description: 'Monde Classique',
  },
  {
    position: [0, 0, 15],
    rotation: Math.PI,
    level: 2,
    name: 'PLAYGROUND',
    color: '#ef4444',
    colorSecondary: '#fca5a5',
    description: 'Terrain de Jeu',
  },
  {
    position: [15, 0, 0],
    rotation: -Math.PI / 2,
    level: 3,
    name: 'PROCEDURAL',
    color: '#8b5cf6',
    colorSecondary: '#a78bfa',
    description: 'Monde Procédural',
  },
  {
    position: [-15, 0, 0],
    rotation: Math.PI / 2,
    level: 4,
    name: 'ANGRY BIRDS',
    color: '#4CAF50',
    colorSecondary: '#81C784',
    description: 'Zone de Destruction',
  },
]

// Couleurs du Hub
const HUB_COLORS = {
  primary: '#1e1b4b',
  secondary: '#312e81',
  accent: '#6366f1',
  glow: '#818cf8',
}

/**
 * Composant principal du Hub
 */
export function Hub() {
  return (
    <group name="hub-level-0">
      {/* Sol principal du hub */}
      <HubGround />

      {/* Plateforme centrale */}
      <CentralPlatform />

      {/* Les 4 portails */}
      {PORTAL_CONFIG.map((config, index) => (
        <WorldPortal key={index} {...config} />
      ))}

      {/* Chemins vers les portails */}
      <HubPaths />

      {/* Éclairage ambiant */}
      <HubLighting />

      {/* Limites invisibles */}
      <HubBoundaries />
    </group>
  )
}

/**
 * Sol principal du Hub
 * Position à 0 pour être au même niveau que les plateformes
 */
function HubGround() {
  return (
    <RigidBody type="fixed" friction={1} position={[0, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial
          color={HUB_COLORS.primary}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
    </RigidBody>
  )
}

/**
 * Plateforme centrale surélevée
 */
function CentralPlatform() {
  const pillarRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (pillarRef.current) {
      const material = pillarRef.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.2
    }
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Plateforme de spawn - légèrement surélevée au-dessus du sol */}
      <RigidBody type="fixed" friction={1} position={[0, 0.15, 0]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[8, 10, 0.3, 32]} />
          <meshStandardMaterial
            color={HUB_COLORS.secondary}
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>
      </RigidBody>

      {/* Anneau lumineux autour de la plateforme */}
      <mesh position={[0, 0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[9, 0.15, 16, 64]} />
        <meshStandardMaterial
          color={HUB_COLORS.accent}
          emissive={HUB_COLORS.accent}
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Pilier central lumineux */}
      <mesh ref={pillarRef} position={[0, 4, 0]} castShadow>
        <cylinderGeometry args={[0.6, 1, 7, 8]} />
        <meshStandardMaterial
          color={HUB_COLORS.accent}
          emissive={HUB_COLORS.accent}
          emissiveIntensity={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Orbe au sommet */}
      <mesh position={[0, 8, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color={HUB_COLORS.glow}
          emissive={HUB_COLORS.glow}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Texte de bienvenue */}
      <Text
        position={[0, 10, 0]}
        fontSize={0.8}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.04}
        outlineColor="#000000"
      >
        HUB CENTRAL
      </Text>

      <Text
        position={[0, 9.2, 0]}
        fontSize={0.35}
        color={HUB_COLORS.glow}
        anchorX="center"
        anchorY="bottom"
      >
        Choisissez votre destination
      </Text>
    </group>
  )
}

/**
 * Portail vers un monde spécifique
 */
interface WorldPortalProps {
  position: [number, number, number]
  rotation: number
  level: Level
  name: string
  color: string
  colorSecondary: string
  description: string
}

function WorldPortal({
  position,
  rotation,
  level,
  name,
  color,
  colorSecondary,
  description,
}: WorldPortalProps) {
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel)
  const portalRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  // Animation de pulsation
  useFrame((state) => {
    const time = state.clock.elapsedTime
    
    if (portalRef.current) {
      const material = portalRef.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 0.5 + Math.sin(time * 2 + level) * 0.25
    }
    
    if (glowRef.current) {
      const material = glowRef.current.material as THREE.MeshStandardMaterial
      material.opacity = 0.45 + Math.sin(time * 3 + level) * 0.15
    }
  })

  // Téléportation vers le niveau
  const handleEnter = () => {
    setTimeout(() => setCurrentLevel(level), 0)
  }

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Plateforme de base du portail - au niveau du sol */}
      <RigidBody type="fixed" position={[0, 0.1, 0]} friction={1}>
        <mesh receiveShadow>
          <cylinderGeometry args={[3, 3.5, 0.2, 32]} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.6} />
        </mesh>
      </RigidBody>

      {/* Zone de trigger (invisible) */}
      <RigidBody type="fixed" position={[0, 2, 0]} sensor onIntersectionEnter={handleEnter}>
        <CuboidCollider args={[1.5, 2, 1.5]} />
      </RigidBody>

      {/* Cadre du portail - torus vertical (face au joueur) */}
      <mesh ref={portalRef} position={[0, 2.5, 0]}>
        <torusGeometry args={[2, 0.15, 16, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* Effet intérieur du portail */}
      <mesh ref={glowRef} position={[0, 2.5, 0]}>
        <circleGeometry args={[1.85, 48]} />
        <meshStandardMaterial
          color={colorSecondary}
          transparent
          opacity={0.5}
          emissive={color}
          emissiveIntensity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Piliers latéraux */}
      {[-2.2, 2.2].map((x, i) => (
        <mesh key={i} position={[x, 2.5, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.18, 5, 8]} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.6} />
        </mesh>
      ))}

      {/* Barre supérieure */}
      <mesh position={[0, 5.1, 0]} castShadow>
        <boxGeometry args={[4.8, 0.3, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Panneau de nom - fond */}
      <mesh position={[0, 5.8, 0]}>
        <boxGeometry args={[4, 0.8, 0.1]} />
        <meshStandardMaterial
          color="#1f2937"
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Bordure lumineuse du panneau */}
      <mesh position={[0, 5.8, 0.06]}>
        <boxGeometry args={[4.1, 0.9, 0.02]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Nom du portail */}
      <Text
        position={[0, 5.8, 0.12]}
        fontSize={0.4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {name}
      </Text>

      {/* Description sous le nom */}
      <Text
        position={[0, 5.2, 0.12]}
        fontSize={0.2}
        color={colorSecondary}
        anchorX="center"
        anchorY="middle"
      >
        {description}
      </Text>

      {/* Indicateur "Entrez" - sur la plateforme, face au joueur qui arrive */}
      <Text
        position={[0, 0.35, 1.5]}
        fontSize={0.25}
        color={colorSecondary}
        anchorX="center"
        anchorY="bottom"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        ◄ ENTREZ ►
      </Text>

      {/* Lumière du portail */}
      <pointLight position={[0, 2.5, 1]} intensity={0.8} color={color} distance={10} />
    </group>
  )
}

/**
 * Chemins lumineux vers les portails
 */
function HubPaths() {
  return (
    <group>
      {PORTAL_CONFIG.map((config, index) => {
        const [px, , pz] = config.position
        const length = Math.sqrt(px * px + pz * pz) - 12
        const angle = Math.atan2(px, pz)

        return (
          <group key={index} position={[0, 0.02, 0]} rotation={[0, angle, 0]}>
            {/* Chemin principal - juste au-dessus du sol */}
            <mesh position={[0, 0, length / 2 + 5]}>
              <boxGeometry args={[1.5, 0.04, length]} />
              <meshStandardMaterial
                color={config.color}
                emissive={config.color}
                emissiveIntensity={0.3}
                transparent
                opacity={0.7}
              />
            </mesh>

            {/* Flèche directionnelle */}
            <mesh position={[0, 0.02, length + 4]} rotation={[-Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.8, 1.5, 3]} />
              <meshStandardMaterial
                color={config.color}
                emissive={config.color}
                emissiveIntensity={0.5}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/**
 * Éclairage du Hub
 */
function HubLighting() {
  return (
    <>
      {/* Lumière centrale */}
      <pointLight position={[0, 12, 0]} intensity={1.5} color={HUB_COLORS.glow} distance={50} />

      {/* Lumières directionnelles vers chaque portail */}
      {PORTAL_CONFIG.map((config, index) => (
        <pointLight
          key={index}
          position={[config.position[0] * 0.5, 5, config.position[2] * 0.5]}
          intensity={0.4}
          color={config.color}
          distance={20}
        />
      ))}

      {/* Lumière ambiante */}
      <ambientLight intensity={0.3} />
    </>
  )
}

/**
 * Limites invisibles du Hub
 */
function HubBoundaries() {
  const size = 35
  const wallHeight = 15

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

export default Hub

