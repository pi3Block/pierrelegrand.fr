/**
 * GalleryRoom - Galerie 3D procédurale.
 *
 * Construit la galerie entièrement en code React/Three.js :
 * - Sol et plafond (plans)
 * - 4 murs avec découpe pour la porte
 * - Piédestaux au centre
 *
 * Toutes les positions sont définies dans galleryConfig.ts
 */

import { RigidBody } from '@react-three/rapier'
import { GALLERY_CONFIG } from '../galleryConfig'

/**
 * Spots encastrés visuels au plafond.
 */
function CeilingSpots() {
  const { room } = GALLERY_CONFIG
  const spotPositions: [number, number, number][] = [
    [-3, room.height - 0.01, 2.5],
    [-3, room.height - 0.01, 0],
    [-3, room.height - 0.01, -2.5],
    [3, room.height - 0.01, 2.5],
    [3, room.height - 0.01, 0],
    [3, room.height - 0.01, -2.5],
    [0, room.height - 0.01, -2],
  ]

  return (
    <group name="ceiling-spots">
      {spotPositions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Anneau du spot */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.12, 16]} />
            <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Ampoule LED */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <circleGeometry args={[0.07, 16]} />
            <meshBasicMaterial color="#fffbe6" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/**
 * Composant principal de la galerie procédurale.
 */
export function GalleryRoom() {
  const { room, colors } = GALLERY_CONFIG

  return (
    <group name="procedural-gallery">
      {/* Sol */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[room.width, room.depth]} />
          <meshStandardMaterial color={colors.floor} roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Plafond */}
      <mesh
        position={[0, room.height, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[room.width, room.depth]} />
        <meshStandardMaterial color={colors.ceiling} roughness={0.9} />
      </mesh>

      {/* Murs */}
      <Walls />

      {/* Piédestaux */}
      <Pedestals />

      {/* Spots encastrés visuels */}
      <CeilingSpots />

      {/* Éclairage */}
      <GalleryLighting />
    </group>
  )
}

/**
 * Les 4 murs de la galerie.
 * Le mur sud (Z+) a une découpe pour la porte.
 */
function Walls() {
  const { room, colors } = GALLERY_CONFIG
  const halfWidth = room.width / 2
  const halfDepth = room.depth / 2
  const halfHeight = room.height / 2

  return (
    <group name="walls">
      {/* Mur Nord (Z-) - mur du fond, plein */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, halfHeight, -halfDepth]} receiveShadow castShadow>
          <boxGeometry args={[room.width, room.height, room.wallThickness]} />
          <meshStandardMaterial color={colors.walls} />
        </mesh>
      </RigidBody>

      {/* Mur Sud (Z+) - avec découpe pour la porte */}
      <SouthWallWithDoor />

      {/* Mur Ouest (X-) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          position={[-halfWidth, halfHeight, 0]}
          rotation={[0, Math.PI / 2, 0]}
          receiveShadow
          castShadow
        >
          <boxGeometry args={[room.depth, room.height, room.wallThickness]} />
          <meshStandardMaterial color={colors.walls} />
        </mesh>
      </RigidBody>

      {/* Mur Est (X+) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          position={[halfWidth, halfHeight, 0]}
          rotation={[0, Math.PI / 2, 0]}
          receiveShadow
          castShadow
        >
          <boxGeometry args={[room.depth, room.height, room.wallThickness]} />
          <meshStandardMaterial color={colors.walls} />
        </mesh>
      </RigidBody>
    </group>
  )
}

/**
 * Mur sud avec découpe pour la porte.
 * Composé de 3 sections : gauche de la porte, au-dessus de la porte, droite de la porte.
 */
function SouthWallWithDoor() {
  const { room, door, colors } = GALLERY_CONFIG
  const halfWidth = room.width / 2
  const halfDepth = room.depth / 2
  const halfHeight = room.height / 2

  // Position X de la porte (centre de la porte)
  const doorCenterX = door.position[0]
  const doorHalfWidth = door.width / 2

  // Section gauche du mur (de -halfWidth à doorCenterX - doorHalfWidth)
  const leftSectionWidth = (doorCenterX - doorHalfWidth) + halfWidth
  const leftSectionX = -halfWidth + leftSectionWidth / 2

  // Section droite du mur (de doorCenterX + doorHalfWidth à halfWidth)
  const rightSectionWidth = halfWidth - (doorCenterX + doorHalfWidth)
  const rightSectionX = halfWidth - rightSectionWidth / 2

  // Section au-dessus de la porte
  const topSectionHeight = room.height - door.height
  const topSectionY = door.height + topSectionHeight / 2

  return (
    <group name="south-wall">
      {/* Section gauche */}
      {leftSectionWidth > 0 && (
        <RigidBody type="fixed" colliders="cuboid">
          <mesh
            position={[leftSectionX, halfHeight, halfDepth]}
            receiveShadow
            castShadow
          >
            <boxGeometry args={[leftSectionWidth, room.height, room.wallThickness]} />
            <meshStandardMaterial color={colors.walls} />
          </mesh>
        </RigidBody>
      )}

      {/* Section droite */}
      {rightSectionWidth > 0 && (
        <RigidBody type="fixed" colliders="cuboid">
          <mesh
            position={[rightSectionX, halfHeight, halfDepth]}
            receiveShadow
            castShadow
          >
            <boxGeometry args={[rightSectionWidth, room.height, room.wallThickness]} />
            <meshStandardMaterial color={colors.walls} />
          </mesh>
        </RigidBody>
      )}

      {/* Section au-dessus de la porte */}
      {topSectionHeight > 0 && (
        <RigidBody type="fixed" colliders="cuboid">
          <mesh
            position={[doorCenterX, topSectionY, halfDepth]}
            receiveShadow
            castShadow
          >
            <boxGeometry args={[door.width, topSectionHeight, room.wallThickness]} />
            <meshStandardMaterial color={colors.walls} />
          </mesh>
        </RigidBody>
      )}
    </group>
  )
}

/**
 * Piédestaux au centre de la galerie.
 */
function Pedestals() {
  const { pedestals, colors } = GALLERY_CONFIG

  return (
    <group name="pedestals">
      {pedestals.map((pedestal) => (
        <RigidBody key={pedestal.id} type="fixed" colliders="cuboid">
          <mesh
            position={pedestal.position}
            receiveShadow
            castShadow
          >
            <boxGeometry args={pedestal.size} />
            <meshStandardMaterial color={colors.pedestals} />
          </mesh>
        </RigidBody>
      ))}
    </group>
  )
}

/**
 * Éclairage de la galerie - Style musée moderne.
 * Utilise des pointLights proches des tableaux pour un éclairage ciblé.
 */
function GalleryLighting() {
  const { room } = GALLERY_CONFIG

  return (
    <>
      {/* Lumière ambiante modérée */}
      <ambientLight intensity={0.4} color="#ffffff" />

      {/* Lumière hémisphérique douce */}
      <hemisphereLight
        args={['#ffffff', '#888888', 0.3]}
        position={[0, room.height, 0]}
      />

      {/* Lumière directionnelle douce */}
      <directionalLight
        position={[2, room.height + 2, 2]}
        intensity={0.3}
        color="#ffffff"
      />

      {/* === Spots pour le mur Ouest (X-) === */}
      <pointLight position={[-4, 3, 2.5]} intensity={1.2} color="#fff8e7" distance={5} decay={2} />
      <pointLight position={[-4, 3, 0]} intensity={1.2} color="#fff8e7" distance={5} decay={2} />
      <pointLight position={[-4, 3, -2.5]} intensity={1.2} color="#fff8e7" distance={5} decay={2} />

      {/* === Spots pour le mur Est (X+) === */}
      <pointLight position={[4, 3, 2.5]} intensity={1.2} color="#fff8e7" distance={5} decay={2} />
      <pointLight position={[4, 3, 0]} intensity={1.2} color="#fff8e7" distance={5} decay={2} />
      <pointLight position={[4, 3, -2.5]} intensity={1.2} color="#fff8e7" distance={5} decay={2} />

      {/* === Spot pour le mur Nord (Z-) === */}
      <pointLight position={[0, 3, -3]} intensity={1.5} color="#fff8e7" distance={6} decay={2} />

      {/* === Éclairage général du plafond === */}
      <pointLight position={[0, room.height - 0.5, 0]} intensity={0.5} color="#ffffff" distance={10} decay={2} />
    </>
  )
}

export default GalleryRoom
