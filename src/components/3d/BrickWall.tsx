import { RigidBody } from '@react-three/rapier'
import { useTexture } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

interface BrickWallProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  // Dimensions du mur
  rows?: number
  cols?: number
  // Dimensions d'une brique
  brickWidth?: number
  brickHeight?: number
  brickDepth?: number
  // Espacement entre briques (mortier)
  gap?: number
  // Texture à appliquer sur l'ensemble du mur
  textureUrl?: string
  // Couleur de fallback si pas de texture
  color?: string
  // Masse de chaque brique (plus léger = plus destructible)
  brickMass?: number
}

export function BrickWall({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  rows = 5,
  cols = 8,
  brickWidth = 0.6,
  brickHeight = 0.3,
  brickDepth = 0.25,
  gap = 0.02,
  textureUrl,
  color = '#8B4513',
  brickMass = 0.3,
}: BrickWallProps) {
  // Dimensions totales du mur
  const wallWidth = cols * (brickWidth + gap) - gap
  const wallHeight = rows * (brickHeight + gap) - gap

  // Générer les briques avec leurs positions et UVs
  const bricks = useMemo(() => {
    const result: Array<{
      key: string
      position: [number, number, number]
      uvOffset: [number, number]
      uvScale: [number, number]
    }> = []

    for (let row = 0; row < rows; row++) {
      // Décalage en quinconce pour les rangées paires
      const rowOffset = row % 2 === 0 ? 0 : (brickWidth + gap) / 2

      for (let col = 0; col < cols; col++) {
        // Position de la brique
        const x = col * (brickWidth + gap) + brickWidth / 2 - wallWidth / 2 + rowOffset
        const y = row * (brickHeight + gap) + brickHeight / 2
        const z = 0

        // Calculer les UVs pour que la texture soit continue sur tout le mur
        // Chaque brique affiche sa portion de l'image globale
        const uvOffsetX = (col * (brickWidth + gap) + rowOffset) / wallWidth
        const uvOffsetY = row * (brickHeight + gap) / wallHeight
        const uvScaleX = brickWidth / wallWidth
        const uvScaleY = brickHeight / wallHeight

        result.push({
          key: `brick-${row}-${col}`,
          position: [x, y, z],
          uvOffset: [uvOffsetX, uvOffsetY],
          uvScale: [uvScaleX, uvScaleY],
        })
      }
    }

    return result
  }, [rows, cols, brickWidth, brickHeight, gap, wallWidth, wallHeight])

  return (
    <group position={position} rotation={rotation}>
      {bricks.map((brick) => (
        <Brick
          key={brick.key}
          position={brick.position}
          size={[brickWidth, brickHeight, brickDepth]}
          uvOffset={brick.uvOffset}
          uvScale={brick.uvScale}
          textureUrl={textureUrl}
          color={color}
          mass={brickMass}
        />
      ))}
    </group>
  )
}

interface BrickProps {
  position: [number, number, number]
  size: [number, number, number]
  uvOffset: [number, number]
  uvScale: [number, number]
  textureUrl?: string
  color: string
  mass: number
}

function Brick({ position, size, uvOffset, uvScale, textureUrl, color, mass }: BrickProps) {
  // Créer une géométrie avec UVs personnalisés pour le mapping de texture
  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(size[0], size[1], size[2])

    // Modifier les UVs pour mapper la portion correcte de la texture
    const uvAttribute = geo.getAttribute('uv')
    const uvArray = uvAttribute.array as Float32Array

    // BoxGeometry a 6 faces, chaque face a 4 vertices, chaque vertex a 2 UV coords
    // On ne modifie que la face avant (indices 8-15) pour la texture principale
    for (let i = 0; i < uvArray.length; i += 2) {
      // Transformer les UVs (0-1) vers notre portion de texture
      const currentU = uvArray[i]
      const currentV = uvArray[i + 1]
      if (currentU !== undefined && currentV !== undefined) {
        uvArray[i] = uvOffset[0] + currentU * uvScale[0]
        uvArray[i + 1] = uvOffset[1] + currentV * uvScale[1]
      }
    }

    uvAttribute.needsUpdate = true
    return geo
  }, [size, uvOffset, uvScale])

  return (
    <RigidBody
      position={position}
      mass={mass}
      friction={0.8}
      restitution={0.1}
      linearDamping={0.5}
      angularDamping={0.5}
    >
      <mesh geometry={geometry} castShadow receiveShadow>
        {textureUrl ? (
          <BrickMaterial textureUrl={textureUrl} />
        ) : (
          <meshStandardMaterial color={color} roughness={0.9} />
        )}
      </mesh>
    </RigidBody>
  )
}

// Composant séparé pour le matériau avec texture (évite le hook conditionnel)
function BrickMaterial({ textureUrl }: { textureUrl: string }) {
  const texture = useTexture(textureUrl)

  // Configurer la texture pour qu'elle ne répète pas
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping

  return <meshStandardMaterial map={texture} roughness={0.8} />
}
