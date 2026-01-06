/**
 * ProceduralTerrain - Terrain procédural avec heightmap
 * Génère un terrain basé sur le bruit de Perlin/Simplex
 */

import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { RigidBody } from '@react-three/rapier'
import { createFractalNoise2D } from '@utils/procedural'
import type { BiomeType } from '@/config/proceduralConfig'
import { BIOME_TERRAIN_CONFIG } from '@/config/proceduralConfig'

interface ProceduralTerrainProps {
  /** Taille du terrain */
  size?: number
  /** Résolution (nombre de segments) */
  resolution?: number
  /** Seed pour la génération */
  seed?: number
  /** Type de biome pour les paramètres de terrain */
  biome?: BiomeType
  /** Échelle de hauteur */
  heightScale?: number
  /** Position dans le monde */
  position?: [number, number, number]
  /** Afficher en wireframe */
  wireframe?: boolean
  /** Activer la physique */
  enablePhysics?: boolean
  /** Schéma de couleurs */
  colorScheme?: 'height' | 'slope' | 'biome'
}

/**
 * Terrain procédural autonome
 * Peut être utilisé indépendamment du système de chunks
 */
export function ProceduralTerrain({
  size = 64,
  resolution = 128,
  seed = 12345,
  biome = 'nature',
  heightScale = 10,
  position = [0, 0, 0],
  wireframe = false,
  enablePhysics = true,
  colorScheme = 'height',
}: ProceduralTerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  // Configuration selon le biome
  const biomeConfig = BIOME_TERRAIN_CONFIG[biome]

  // Générer la géométrie avec heightmap intégré
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution)
    geo.rotateX(-Math.PI / 2)

    // Créer le générateur de bruit avec config biome
    const noise = createFractalNoise2D({
      seed,
      octaves: biomeConfig.octaves,
      persistence: biomeConfig.persistence,
      scale: biomeConfig.scale,
    })

    const positions = geo.attributes.position
    if (!positions) return geo

    const colors = new Float32Array(positions.count * 3)

    {
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const z = positions.getZ(i)

        // Générer la hauteur
        const worldX = x + position[0]
        const worldZ = z + position[2]
        const noiseValue = (noise(worldX, worldZ) + 1) / 2

        // Appliquer falloff circulaire (optionnel pour biomes)
        const distFromCenter = Math.sqrt(x * x + z * z) / (size / 2)
        const falloff = Math.max(0, 1 - Math.pow(distFromCenter, 2))
        const height = noiseValue * falloff * heightScale * biomeConfig.heightMultiplier

        positions.setY(i, height)

        // Couleur par hauteur
        const normalizedHeight = height / (heightScale * biomeConfig.heightMultiplier)
        const color = getHeightColor(normalizedHeight, colorScheme, biome)
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
      }

      positions.needsUpdate = true
    }

    // Ajouter les couleurs comme attribut
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()

    return geo
  }, [size, resolution, seed, biome, heightScale, position, colorScheme, biomeConfig])

  // Matériau avec vertex colors
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.1,
      wireframe,
      flatShading: resolution < 64,
    })
  }, [wireframe, resolution])

  // Nettoyage
  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  const content = (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
      receiveShadow
      castShadow
    />
  )

  if (enablePhysics) {
    return (
      <RigidBody type="fixed" colliders="trimesh">
        {content}
      </RigidBody>
    )
  }

  return content
}

/**
 * Calcule la couleur en fonction de la hauteur normalisée
 */
function getHeightColor(
  normalizedHeight: number,
  _scheme: 'height' | 'slope' | 'biome',
  biome: BiomeType
): THREE.Color {
  const h = Math.max(0, Math.min(1, normalizedHeight))

  // Palettes par biome
  const palettes: Record<BiomeType, THREE.Color[]> = {
    nature: [
      new THREE.Color('#c2b280'), // Sable
      new THREE.Color('#4a7c59'), // Herbe
      new THREE.Color('#2d5a27'), // Herbe foncée
      new THREE.Color('#6b7280'), // Roche
      new THREE.Color('#9ca3af'), // Roche claire
    ],
    tech: [
      new THREE.Color('#1e293b'), // Bleu foncé
      new THREE.Color('#334155'), // Slate
      new THREE.Color('#475569'), // Slate moyen
      new THREE.Color('#64748b'), // Slate clair
      new THREE.Color('#94a3b8'), // Gris bleuté
    ],
    crypto: [
      new THREE.Color('#451a03'), // Marron foncé
      new THREE.Color('#78350f'), // Ambre foncé
      new THREE.Color('#b45309'), // Orange
      new THREE.Color('#d97706'), // Ambre
      new THREE.Color('#fbbf24'), // Jaune doré
    ],
  }

  const palette = palettes[biome]

  // Interpoler entre les couleurs de la palette
  const segmentSize = 1 / (palette.length - 1)
  const segmentIndex = Math.min(Math.floor(h / segmentSize), palette.length - 2)
  const segmentT = (h - segmentIndex * segmentSize) / segmentSize

  const color1 = palette[segmentIndex]
  const color2 = palette[segmentIndex + 1]

  if (!color1 || !color2) return new THREE.Color('#888888')

  return new THREE.Color().lerpColors(color1, color2, segmentT)
}

/**
 * Composant pour terrain circulaire (pour biomes)
 */
export function CircularProceduralTerrain({
  radius = 20,
  resolution = 64,
  seed = 12345,
  biome = 'nature',
  heightScale = 5,
  position = [0, 0, 0],
}: {
  radius?: number
  resolution?: number
  seed?: number
  biome?: BiomeType
  heightScale?: number
  position?: [number, number, number]
}) {
  return (
    <ProceduralTerrain
      size={radius * 2}
      resolution={resolution}
      seed={seed}
      biome={biome}
      heightScale={heightScale}
      position={position}
      colorScheme="height"
    />
  )
}
