/**
 * World4AngryBirds - Niveau style Angry Birds
 * Environnement cartoon avec structures destructibles
 * Utilise le systeme de tir TPS existant
 */

import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import { AngryBirdsSky, CloudSystem, CartoonSun } from './sky/AngryBirdsSky'
import { InstancedAngryBirdsDecorations } from './instanced/InstancedAngryBirdsDecorations'
import { ReturnToHubPortal } from './portals'
import {
  TowerStructure,
  HouseStructure,
  BridgeStructure,
  PyramidStructure,
  WallStructure,
} from './destruction'

// Couleur du sol style Angry Birds
const GROUND_COLOR = '#7CB342'

/**
 * Monde Angry Birds principal
 * Accessible depuis le niveau 3 (ProceduralWorld) via portail
 */
export function World4AngryBirds() {
  return (
    <group>
      {/* ========== CIEL ========== */}
      <AngryBirdsSky />
      <CloudSystem count={10} minHeight={25} maxHeight={40} spread={100} />
      <CartoonSun position={[60, 50, -80]} size={10} />

      {/* ========== SOL ========== */}
      <Ground color={GROUND_COLOR} />

      {/* ========== STRUCTURES DESTRUCTIBLES ========== */}

      {/* Zone 1: Tours */}
      <TowerStructure position={[8, 0, -5]} rotation={0.2} />
      <TowerStructure position={[12, 0, 2]} rotation={-0.3} scale={1.2} />
      <TowerStructure position={[-10, 0, -8]} rotation={0.5} scale={0.9} />

      {/* Zone 2: Maisons */}
      <HouseStructure position={[-8, 0, 5]} rotation={0.1} />
      <HouseStructure position={[5, 0, 10]} rotation={-0.4} scale={1.1} />

      {/* Zone 3: Ponts */}
      <BridgeStructure position={[0, 0, -12]} rotation={0} />
      <BridgeStructure position={[-15, 0, 0]} rotation={Math.PI / 2} scale={0.8} />

      {/* Zone 4: Pyramides */}
      <PyramidStructure position={[15, 0, -10]} />
      <PyramidStructure position={[-12, 0, 12]} scale={1.3} />

      {/* Zone 5: Murs */}
      <WallStructure position={[0, 0, 8]} />
      <WallStructure position={[18, 0, 5]} rotation={Math.PI / 4} />

      {/* ========== DECORATIONS ========== */}
      <InstancedAngryBirdsDecorations
        radius={45}
        seed={98765}
        getTerrainHeight={() => 0}
        center={[0, 0, 0]}
      />

      {/* ========== ECLAIRAGE ADDITIONNEL ========== */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[30, 50, 20]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={150}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <pointLight position={[-20, 15, -20]} intensity={0.3} color="#FFE082" />

      {/* ========== PORTAIL RETOUR VERS HUB ========== */}
      <ReturnToHubPortal position={[0, 0, -35]} label="RETOUR HUB" />

      {/* ========== LIMITES DU MONDE ========== */}
      <WorldBoundaries size={55} />

      {/* ========== PANNEAU D'INSTRUCTIONS ========== */}
      <InstructionSign position={[0, 2, 22]} />
    </group>
  )
}

/**
 * Limites invisibles du monde
 */
function WorldBoundaries({ size }: { size: number }) {
  const wallHeight = 20
  const wallThickness = 1

  return (
    <>
      {/* Mur Nord */}
      <RigidBody type="fixed" position={[0, wallHeight / 2, -size]}>
        <CuboidCollider args={[size, wallHeight, wallThickness]} />
      </RigidBody>
      {/* Mur Sud */}
      <RigidBody type="fixed" position={[0, wallHeight / 2, size]}>
        <CuboidCollider args={[size, wallHeight, wallThickness]} />
      </RigidBody>
      {/* Mur Est */}
      <RigidBody type="fixed" position={[size, wallHeight / 2, 0]}>
        <CuboidCollider args={[wallThickness, wallHeight, size]} />
      </RigidBody>
      {/* Mur Ouest */}
      <RigidBody type="fixed" position={[-size, wallHeight / 2, 0]}>
        <CuboidCollider args={[wallThickness, wallHeight, size]} />
      </RigidBody>
      {/* Sol de securite (si le joueur tombe) */}
      <RigidBody type="fixed" position={[0, -5, 0]}>
        <CuboidCollider args={[size * 2, 1, size * 2]} />
      </RigidBody>
    </>
  )
}

/**
 * Panneau d'instructions
 */
function InstructionSign({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Poteau */}
      <mesh position={[0, -1, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 2, 8]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>

      {/* Panneau */}
      <mesh castShadow>
        <boxGeometry args={[4, 1.5, 0.1]} />
        <meshStandardMaterial color="#FFF8E1" />
      </mesh>

      {/* Texte */}
      <Text
        position={[0, 0.3, 0.06]}
        fontSize={0.25}
        color="#333333"
        anchorX="center"
        anchorY="middle"
        maxWidth={3.5}
      >
        DESTRUCTION ZONE
      </Text>
      <Text
        position={[0, -0.1, 0.06]}
        fontSize={0.15}
        color="#666666"
        anchorX="center"
        anchorY="middle"
        maxWidth={3.5}
      >
        Clic gauche ou F pour tirer
      </Text>
      <Text
        position={[0, -0.35, 0.06]}
        fontSize={0.12}
        color="#888888"
        anchorX="center"
        anchorY="middle"
        maxWidth={3.5}
      >
        WASD pour se deplacer
      </Text>
    </group>
  )
}

/**
 * Sol simple avec physics (identique a World2)
 */
function Ground({ color }: { color: string }) {
  return (
    <RigidBody type="fixed" friction={1}>
      <mesh receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[100, 1, 100]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  )
}
