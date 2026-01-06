/**
 * Composant Chunk individuel
 * Représente une section du terrain avec sa géométrie et ses décorations
 */

import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { RigidBody } from '@react-three/rapier'
import { CHUNK_CONFIG, LOD_LEVELS } from '@/config/proceduralConfig'
import { createFractalNoise2D, generateHeightmapWithFalloff } from '@utils/procedural'
import type { ChunkData } from '@stores/chunkStore'

interface ChunkProps {
  data: ChunkData
  seed: number
  showWireframe?: boolean
  onLoaded?: () => void
}

/**
 * Composant de chunk terrain
 * Génère une géométrie plane avec displacement basé sur le bruit
 */
export function Chunk({ data, seed, showWireframe = false, onLoaded }: ChunkProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  // Appeler onLoaded au montage
  useEffect(() => {
    onLoaded?.()
  }, [onLoaded])

  // Configuration LOD
  const lodConfig = LOD_LEVELS[data.lod] ?? LOD_LEVELS[0]
  if (!lodConfig) return null
  const resolution = lodConfig.resolution

  // Générer la géométrie avec heightmap
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      CHUNK_CONFIG.size,
      CHUNK_CONFIG.size,
      resolution,
      resolution
    )

    // Rotation pour être horizontal
    geo.rotateX(-Math.PI / 2)

    // Générer le heightmap
    const heightmap = generateHeightmapWithFalloff(
      resolution + 1,
      resolution + 1,
      {
        seed: seed + data.x * 1000 + data.z,
        octaves: 4,
        persistence: 0.5,
        lacunarity: 2.0,
        scale: 0.05,
      },
      2 // falloff strength
    )

    // Appliquer le heightmap aux vertices
    const positions = geo.attributes.position
    if (positions) {
      for (let i = 0; i < positions.count; i++) {
        const x = Math.floor((i % (resolution + 1)))
        const z = Math.floor(i / (resolution + 1))
        const heightIndex = z * (resolution + 1) + x
        const height = heightmap[heightIndex] ?? 0
        positions.setY(i, height * CHUNK_CONFIG.heightScale)
      }
      positions.needsUpdate = true
    }

    // Recalculer les normales
    geo.computeVertexNormals()

    return geo
  }, [data.x, data.z, data.lod, seed, resolution])

  // Matériau avec coloration par hauteur
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#4a7c59',
      roughness: 0.8,
      metalness: 0.1,
      wireframe: showWireframe,
      flatShading: data.lod > 1, // Flat shading pour LOD bas
    })
  }, [showWireframe, data.lod])

  // Nettoyage
  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  return (
    <group position={[data.worldX + CHUNK_CONFIG.size / 2, 0, data.worldZ + CHUNK_CONFIG.size / 2]}>
      <RigidBody type="fixed" colliders="trimesh">
        <mesh
          ref={meshRef}
          geometry={geometry}
          material={material}
          receiveShadow
          castShadow
        />
      </RigidBody>

      {/* Debug: afficher les bordures du chunk */}
      {showWireframe && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(CHUNK_CONFIG.size, 0.1, CHUNK_CONFIG.size)]} />
          <lineBasicMaterial color="#ff0000" />
        </lineSegments>
      )}
    </group>
  )
}

/**
 * Composant de chunk simple (sans physics)
 * Pour les chunks distants où la collision n'est pas nécessaire
 */
export function ChunkSimple({ data, seed, showWireframe = false, onLoaded }: ChunkProps) {
  // Appeler onLoaded au montage
  useEffect(() => {
    onLoaded?.()
  }, [onLoaded])

  const lodConfig = LOD_LEVELS[data.lod] ?? LOD_LEVELS[0]
  if (!lodConfig) return null
  const resolution = lodConfig.resolution

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      CHUNK_CONFIG.size,
      CHUNK_CONFIG.size,
      resolution,
      resolution
    )
    geo.rotateX(-Math.PI / 2)

    const noise = createFractalNoise2D({
      seed: seed + data.x * 1000 + data.z,
      octaves: Math.max(1, 4 - data.lod), // Moins d'octaves pour LOD élevé
      persistence: 0.5,
      scale: 0.05,
    })

    const positions = geo.attributes.position
    if (positions) {
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i) + data.worldX + CHUNK_CONFIG.size / 2
        const z = positions.getZ(i) + data.worldZ + CHUNK_CONFIG.size / 2
        const height = (noise(x, z) + 1) / 2
        positions.setY(i, height * CHUNK_CONFIG.heightScale * 0.5) // Réduction pour LOD
      }
      positions.needsUpdate = true
    }

    geo.computeVertexNormals()
    return geo
  }, [data.x, data.z, data.worldX, data.worldZ, data.lod, seed, resolution])

  const material = useMemo(() => {
    // Couleur basée sur la distance (plus gris au loin)
    const grayFactor = data.lod * 0.1
    const color = new THREE.Color('#4a7c59').lerp(new THREE.Color('#888888'), grayFactor)

    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
      metalness: 0,
      wireframe: showWireframe,
      flatShading: true,
    })
  }, [showWireframe, data.lod])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  return (
    <mesh
      position={[data.worldX + CHUNK_CONFIG.size / 2, 0, data.worldZ + CHUNK_CONFIG.size / 2]}
      geometry={geometry}
      material={material}
      receiveShadow
    />
  )
}
