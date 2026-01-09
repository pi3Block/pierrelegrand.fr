/**
 * World4AngryBirds - Niveau style Angry Birds
 * Environnement cartoon avec structures destructibles
 * Utilise le systeme de tir TPS existant
 */

import { useState, useCallback, useRef } from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import { AngryBirdsSky, CloudSystem, CartoonSun } from './sky/AngryBirdsSky'
import { InstancedAngryBirdsDecorations } from './instanced/InstancedAngryBirdsDecorations'
import { ReturnToHubPortal } from './portals'
import {
  // Structures originales
  TowerStructure,
  HouseStructure,
  BridgeStructure,
  PyramidStructure,
  WallStructure,
  DestructibleBatch,
  // Nouveaux templates complexes
  TallTower,
  Castle,
  Fortress,
  Scaffold,
  LShape,
  UShape,
  // Factory procedurale
  GeneratedStructure,
  useStyledStructure,
} from './destruction'

// Couleur du sol style Angry Birds
const GROUND_COLOR = '#7CB342'

/**
 * Monde Angry Birds principal
 * Accessible depuis le niveau 3 (ProceduralWorld) via portail
 */
export function World4AngryBirds() {
  // State pour forcer le remontage des structures (reset)
  const [resetKey, setResetKey] = useState(0)

  // Handler de reset
  const handleReset = useCallback(() => {
    setResetKey((k) => k + 1)
  }, [])

  // Structures generees proceduralement
  const proceduralTower = useStyledStructure('tower', 12345)
  const proceduralFortress = useStyledStructure('fortress', 54321)

  return (
    <group>
      {/* ========== CIEL ========== */}
      <AngryBirdsSky />
      <CloudSystem count={10} minHeight={25} maxHeight={40} spread={100} />
      <CartoonSun position={[60, 50, -80]} size={10} />

      {/* ========== SOL ========== */}
      <Ground color={GROUND_COLOR} />

      {/* ========== DALLE DE RESET (à droite du portail de sortie) ========== */}
      <ResetPlate position={[5, 0, -35]} onPress={handleReset} />

      {/* ========== STRUCTURES DESTRUCTIBLES ========== */}
      {/* key force le remontage complet lors du reset */}
      <DestructibleBatch key={`structures-${resetKey}`}>
        {/* ===== NOUVEAUX TEMPLATES COMPLEXES ===== */}

        {/* Zone centrale: Structures principales */}
        <TallTower position={[0, 0, -8]} floors={4} variant="standard" />
        <Castle position={[-12, 0, -5]} rotation={0.3} scale={0.9} />
        <Fortress position={[12, 0, -5]} rotation={-0.2} />

        {/* Zone gauche: Structures en bois */}
        <Scaffold position={[-18, 0, 5]} levels={3} rotation={0.1} />
        <LShape position={[-8, 0, 12]} floors={2} rotation={Math.PI / 4} />

        {/* Zone droite: Structures mixtes */}
        <UShape position={[8, 0, 12]} floors={2} rotation={-0.3} />
        <TallTower position={[18, 0, 8]} floors={3} variant="narrow" />

        {/* ===== STRUCTURES ORIGINALES (conservees) ===== */}

        {/* Structures simples dispersees */}
        <TowerStructure position={[20, 0, -15]} rotation={0.2} scale={0.8} />
        <HouseStructure position={[-20, 0, -12]} rotation={0.1} />
        <BridgeStructure position={[0, 0, -20]} rotation={0} />
        <PyramidStructure position={[25, 0, 0]} scale={1.1} />
        <WallStructure position={[-25, 0, 5]} rotation={Math.PI / 6} />

        {/* ===== STRUCTURES PROCEDURALES ===== */}
        <GeneratedStructure
          definition={proceduralTower.definition}
          position={[-5, 0, 20]}
          rotation={0.5}
        />
        <GeneratedStructure
          definition={proceduralFortress.definition}
          position={[5, 0, 20]}
          rotation={-0.3}
          scale={0.85}
        />
      </DestructibleBatch>

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

/**
 * Dalle poussoir pour reinitialiser les structures
 * Detecte le joueur via sensor Rapier
 */
function ResetPlate({
  position,
  onPress,
}: {
  position: [number, number, number]
  onPress: () => void
}) {
  const [isPressed, setIsPressed] = useState(false)
  const cooldownRef = useRef(false)

  const handleEnter = useCallback(() => {
    if (cooldownRef.current) return

    cooldownRef.current = true
    setIsPressed(true)
    onPress()

    // Cooldown 2s pour eviter spam
    setTimeout(() => {
      cooldownRef.current = false
      setIsPressed(false)
    }, 2000)
  }, [onPress])

  return (
    <group position={position}>
      {/* Sensor invisible pour detecter le joueur */}
      <RigidBody type="fixed" sensor onIntersectionEnter={handleEnter}>
        <CuboidCollider args={[1.5, 0.3, 1.5]} />
      </RigidBody>

      {/* Visuel de la dalle */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} />
        <meshStandardMaterial
          color={isPressed ? '#4CAF50' : '#F44336'}
          emissive={isPressed ? '#4CAF50' : '#F44336'}
          emissiveIntensity={isPressed ? 0.5 : 0.3}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Bordure */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.08, 8, 32]} />
        <meshStandardMaterial color="#333333" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Icone reset (fleche circulaire) */}
      <Text
        position={[0, 0.12, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.6}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
      >
        ↻
      </Text>

      {/* Label flottant */}
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.3}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        RESET
      </Text>
    </group>
  )
}
