/**
 * Hub - Hub central de téléportation avec 5 portails disposés en cercle.
 * Point de départ du jeu (Level 0).
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider, CylinderCollider } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore, type Level } from '@stores/gameStore'
import { AngryBirdsSky, CloudSystem, CartoonSun } from './sky/AngryBirdsSky'

// Note: useRef et useFrame sont utilisés dans WorldPortal pour l'animation

// Distance des portails par rapport au centre
const PORTAL_RADIUS = 15

// Calcul des positions en cercle (5 portails, 72° d'écart)
const getPortalPosition = (index: number): [number, number, number] => {
  const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2 // Commence en haut (Nord)
  return [
    Math.cos(angle) * PORTAL_RADIUS,
    0,
    Math.sin(angle) * PORTAL_RADIUS,
  ]
}

// Rotation pour que le portail fasse face au centre
const getPortalRotation = (index: number): number => {
  const [x, , z] = getPortalPosition(index)
  // Angle pour regarder vers le centre (0,0,0)
  return Math.atan2(-x, -z)
}

// Configuration des 5 portails
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
    position: getPortalPosition(0),
    rotation: getPortalRotation(0),
    level: 1,
    name: 'CLASSIC',
    color: '#3b82f6',
    colorSecondary: '#93c5fd',
    description: 'Monde Classique',
  },
  {
    position: getPortalPosition(1),
    rotation: getPortalRotation(1),
    level: 2,
    name: 'PLAYGROUND',
    color: '#ef4444',
    colorSecondary: '#fca5a5',
    description: 'Terrain de Jeu',
  },
  {
    position: getPortalPosition(2),
    rotation: getPortalRotation(2),
    level: 3,
    name: 'PROCEDURAL',
    color: '#8b5cf6',
    colorSecondary: '#a78bfa',
    description: 'Monde Procédural',
  },
  {
    position: getPortalPosition(3),
    rotation: getPortalRotation(3),
    level: 4,
    name: 'ANGRY BIRDS',
    color: '#4CAF50',
    colorSecondary: '#81C784',
    description: 'Zone de Destruction',
  },
  {
    position: getPortalPosition(4),
    rotation: getPortalRotation(4),
    level: 5,
    name: 'BUREAU PIERRE',
    color: '#f59e0b',
    colorSecondary: '#fcd34d',
    description: 'Portfolio 3D Interactif',
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
      {/* Ciel style Angry Birds */}
      <AngryBirdsSky />
      <CloudSystem count={8} minHeight={20} maxHeight={35} spread={80} />
      <CartoonSun position={[50, 40, -60]} size={8} />

      {/* Sol principal du hub */}
      <HubGround />

      {/* Plateforme centrale décorative */}
      <CentralPlatform />

      {/* Les 5 portails en cercle */}
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
 * Utilise un CylinderCollider explicite pour un sol plat et performant.
 * Le collider auto sur circleGeometry cause des problèmes de collision avec Ecctrl.
 */
function HubGround() {
  return (
    <group>
      {/* Collider physique explicite - cylindre très plat */}
      <RigidBody type="fixed" friction={1} position={[0, -0.1, 0]} colliders={false}>
        <CylinderCollider args={[0.1, 40]} />
      </RigidBody>

      {/* Mesh visuel séparé (pas de physique) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial
          color={HUB_COLORS.primary}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
    </group>
  )
}

/**
 * Plateforme centrale décorative (point de spawn)
 * Simple plateforme sans totem central pour laisser le joueur au centre
 */
function CentralPlatform() {
  return (
    <group position={[0, 0, 0]}>
      {/* Plateforme de spawn - légèrement surélevée au-dessus du sol */}
      <RigidBody type="fixed" friction={1} position={[0, 0.15, 0]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[6, 7, 0.3, 32]} />
          <meshStandardMaterial
            color={HUB_COLORS.secondary}
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>
      </RigidBody>

      {/* Anneau lumineux autour de la plateforme */}
      <mesh position={[0, 0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[7, 0.15, 16, 64]} />
        <meshStandardMaterial
          color={HUB_COLORS.accent}
          emissive={HUB_COLORS.accent}
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Lumière centrale */}
      <pointLight position={[0, 3, 0]} intensity={1} color={HUB_COLORS.accent} distance={12} />
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
 * Utilise des planes 2D pour éviter les interférences avec le joueur
 */
function HubPaths() {
  return (
    <group>
      {PORTAL_CONFIG.map((config, index) => {
        const [px, , pz] = config.position
        const length = Math.sqrt(px * px + pz * pz) - 10
        const angle = Math.atan2(px, pz)

        return (
          <group key={index} position={[0, 0.03, 0]} rotation={[0, angle, 0]}>
            {/* Chemin principal - plane 2D horizontal */}
            <mesh
              position={[0, 0, length / 2 + 4]}
              rotation={[-Math.PI / 2, 0, 0]}
              raycast={() => null}
            >
              <planeGeometry args={[1.2, length]} />
              <meshStandardMaterial
                color={config.color}
                emissive={config.color}
                emissiveIntensity={0.4}
                transparent
                opacity={0.6}
                side={2}
              />
            </mesh>

            {/* Flèches directionnelles intégrées au sol (3 petites flèches) */}
            {[0.3, 0.5, 0.7].map((t, i) => (
              <mesh
                key={i}
                position={[0, 0.01, length * t + 4]}
                rotation={[-Math.PI / 2, 0, 0]}
                raycast={() => null}
              >
                <circleGeometry args={[0.4, 3]} />
                <meshStandardMaterial
                  color={config.color}
                  emissive={config.color}
                  emissiveIntensity={0.6 + i * 0.15}
                  transparent
                  opacity={0.5 + i * 0.15}
                />
              </mesh>
            ))}
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

