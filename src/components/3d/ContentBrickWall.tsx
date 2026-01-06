import { RigidBody } from '@react-three/rapier'
import { useTexture, Text, Html } from '@react-three/drei'
import { useMemo, useState, useRef } from 'react'
import * as THREE from 'three'
import type { ContentItem } from '@data/contentData'

interface ContentBrickWallProps {
  content: ContentItem
  position?: [number, number, number]
  rotation?: [number, number, number]
  rows?: number
  cols?: number
  brickWidth?: number
  brickHeight?: number
  brickDepth?: number
  gap?: number
  brickMass?: number
}

/**
 * Mur de briques interactif représentant un contenu du portfolio.
 * Affiche le titre et la description sur une plaque au-dessus du mur.
 * Chaque brique est destructible et utilise la couleur du contenu.
 */
export function ContentBrickWall({
  content,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  rows = 5,
  cols = 8,
  brickWidth = 0.6,
  brickHeight = 0.3,
  brickDepth = 0.25,
  gap = 0.02,
  brickMass = 0.25,
}: ContentBrickWallProps) {
  const [isHovered, setIsHovered] = useState(false)
  const groupRef = useRef<THREE.Group>(null)

  // Dimensions totales du mur
  const wallWidth = cols * (brickWidth + gap) - gap
  const wallHeight = rows * (brickHeight + gap) - gap

  // Générer les briques avec leurs positions
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
        const x = col * (brickWidth + gap) + brickWidth / 2 - wallWidth / 2 + rowOffset
        const y = row * (brickHeight + gap) + brickHeight / 2
        const z = 0

        // Calculer les UVs pour le mapping de texture
        const uvOffsetX = (col * (brickWidth + gap) + rowOffset) / wallWidth
        const uvOffsetY = (row * (brickHeight + gap)) / wallHeight
        const uvScaleX = brickWidth / wallWidth
        const uvScaleY = brickHeight / wallHeight

        result.push({
          key: `brick-${content.id}-${row}-${col}`,
          position: [x, y, z],
          uvOffset: [uvOffsetX, uvOffsetY],
          uvScale: [uvScaleX, uvScaleY],
        })
      }
    }

    return result
  }, [rows, cols, brickWidth, brickHeight, gap, wallWidth, wallHeight, content.id])

  // Couleur légèrement variée pour chaque brique pour plus de réalisme
  const getVariedColor = (baseColor: string, index: number) => {
    const color = new THREE.Color(baseColor)
    const variation = (Math.sin(index * 0.7) * 0.05 + Math.cos(index * 1.3) * 0.05)
    color.offsetHSL(0, 0, variation)
    return color
  }

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Plaque de titre au-dessus du mur */}
      <TitlePlate
        title={content.title}
        description={content.description}
        type={content.type}
        color={content.color}
        wallWidth={wallWidth}
        wallHeight={wallHeight}
        isHovered={isHovered}
      />

      {/* Indicateur de type de contenu */}
      <TypeIndicator
        type={content.type}
        color={content.color}
        position={[-wallWidth / 2 - 0.5, wallHeight / 2, 0]}
      />

      {/* Zone de hover invisible */}
      <mesh
        position={[0, wallHeight / 2, 0]}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        visible={false}
      >
        <boxGeometry args={[wallWidth + 1, wallHeight + 2, 1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Les briques */}
      {bricks.map((brick, index) => (
        <ContentBrick
          key={brick.key}
          position={brick.position}
          size={[brickWidth, brickHeight, brickDepth]}
          uvOffset={brick.uvOffset}
          uvScale={brick.uvScale}
          color={getVariedColor(content.color, index)}
          textureUrl={content.textureUrl}
          mass={brickMass}
        />
      ))}

      {/* Base/socle du mur */}
      <RigidBody type="fixed" position={[0, -0.1, 0]} friction={1}>
        <mesh receiveShadow>
          <boxGeometry args={[wallWidth + 0.4, 0.2, brickDepth + 0.2]} />
          <meshStandardMaterial color="#374151" metalness={0.3} roughness={0.8} />
        </mesh>
      </RigidBody>
    </group>
  )
}

interface TitlePlateProps {
  title: string
  description: string
  type: string
  color: string
  wallWidth: number
  wallHeight: number
  isHovered: boolean
}

function TitlePlate({ title, description, type, color, wallWidth, wallHeight, isHovered }: TitlePlateProps) {
  const plateHeight = 0.6
  const plateY = wallHeight + plateHeight / 2 + 0.2

  // Icône selon le type
  const typeIcon = type === 'post' ? '📄' : type === 'page' ? '📑' : '📁'

  return (
    <group position={[0, plateY, 0.15]}>
      {/* Plaque de fond */}
      <mesh castShadow>
        <boxGeometry args={[wallWidth, plateHeight, 0.1]} />
        <meshStandardMaterial
          color="#1f2937"
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>

      {/* Bordure colorée */}
      <mesh position={[0, -plateHeight / 2 + 0.02, 0.06]}>
        <boxGeometry args={[wallWidth, 0.04, 0.02]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 0.8 : 0.3}
        />
      </mesh>

      {/* Titre en 3D */}
      <Text
        position={[0, 0.1, 0.06]}
        fontSize={0.18}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={wallWidth - 0.4}
      >
        {typeIcon} {title}
      </Text>

      {/* Description au survol */}
      {isHovered && (
        <Html
          position={[0, -0.5, 0]}
          center
          distanceFactor={8}
          style={{
            backgroundColor: 'rgba(0,0,0,0.85)',
            padding: '8px 12px',
            borderRadius: '4px',
            border: `2px solid ${color}`,
            maxWidth: '200px',
            pointerEvents: 'none',
          }}
        >
          <div style={{ color: 'white', fontSize: '12px', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px', color }}>{title}</div>
            <div style={{ opacity: 0.8 }}>{description}</div>
          </div>
        </Html>
      )}
    </group>
  )
}

interface TypeIndicatorProps {
  type: string
  color: string
  position: [number, number, number]
}

function TypeIndicator({ type, color, position }: TypeIndicatorProps) {
  // Géométrie différente selon le type
  const geometry = useMemo(() => {
    switch (type) {
      case 'post':
        return <octahedronGeometry args={[0.15]} />
      case 'page':
        return <boxGeometry args={[0.2, 0.2, 0.2]} />
      case 'category':
        return <sphereGeometry args={[0.15, 16, 16]} />
      default:
        return <sphereGeometry args={[0.15, 16, 16]} />
    }
  }, [type])

  return (
    <mesh position={position} castShadow>
      {geometry}
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        metalness={0.6}
        roughness={0.3}
      />
    </mesh>
  )
}

interface ContentBrickProps {
  position: [number, number, number]
  size: [number, number, number]
  uvOffset: [number, number]
  uvScale: [number, number]
  color: THREE.Color
  textureUrl?: string
  mass: number
}

function ContentBrick({ position, size, uvOffset, uvScale, color, textureUrl, mass }: ContentBrickProps) {
  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(size[0], size[1], size[2])

    // Modifier les UVs pour le mapping de texture
    const uvAttribute = geo.getAttribute('uv')
    const uvArray = uvAttribute.array as Float32Array

    for (let i = 0; i < uvArray.length; i += 2) {
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
          <TexturedBrickMaterial textureUrl={textureUrl} />
        ) : (
          <meshStandardMaterial color={color} roughness={0.85} metalness={0.1} />
        )}
      </mesh>
    </RigidBody>
  )
}

function TexturedBrickMaterial({ textureUrl }: { textureUrl: string }) {
  const texture = useTexture(textureUrl)

  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping

  return <meshStandardMaterial map={texture} roughness={0.8} />
}
