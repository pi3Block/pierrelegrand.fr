/**
 * WorkerChunk - Chunk généré par Web Worker
 * Reçoit les buffers pré-calculés et les transforme en géométrie Three.js
 */

import { useRef, useMemo, useEffect, useState } from 'react'
import * as THREE from 'three'
import { RigidBody } from '@react-three/rapier'
import { getWorkerPool } from '@/workers'
import type { ChunkGenerationResult, ChunkGenerationParams } from '@/workers'
import { CHUNK_CONFIG, LOD_LEVELS, NOISE_CONFIG } from '@/config/proceduralConfig'
import type { ChunkData } from '@stores/chunkStore'

interface WorkerChunkProps {
  data: ChunkData
  seed: number
  showWireframe?: boolean
  onLoaded?: () => void
}

/**
 * Chunk avec géométrie générée par Web Worker
 */
export function WorkerChunk({
  data,
  seed,
  showWireframe = false,
  onLoaded,
}: WorkerChunkProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
  const [loading, setLoading] = useState(true)

  const lodConfig = LOD_LEVELS[data.lod] ?? LOD_LEVELS[0]
  const resolution = lodConfig?.resolution ?? 32

  // Générer le chunk via worker
  useEffect(() => {
    let cancelled = false

    const generateAsync = async () => {
      const pool = getWorkerPool()

      const params: ChunkGenerationParams = {
        chunkX: data.x,
        chunkZ: data.z,
        worldX: data.worldX,
        worldZ: data.worldZ,
        size: CHUNK_CONFIG.size,
        resolution,
        heightScale: CHUNK_CONFIG.heightScale,
        seed,
        noiseConfig: {
          octaves: NOISE_CONFIG.octaves,
          persistence: NOISE_CONFIG.persistence,
          lacunarity: NOISE_CONFIG.lacunarity,
          scale: NOISE_CONFIG.scale,
        },
      }

      // Priorité basée sur la distance (LOD bas = haute priorité)
      const priority = 4 - data.lod

      try {
        const result = await pool.generateChunk(params, priority)

        if (cancelled) return

        // Créer la géométrie à partir des buffers
        const geo = createGeometryFromBuffers(result)
        setGeometry(geo)
        setLoading(false)
        onLoaded?.()
      } catch (error) {
        if (!cancelled) {
          console.error(`[WorkerChunk] Failed to generate chunk ${data.id}:`, error)
          setLoading(false)
        }
      }
    }

    generateAsync()

    return () => {
      cancelled = true
    }
  }, [data.id, data.x, data.z, data.worldX, data.worldZ, data.lod, seed, resolution, onLoaded])

  // Cleanup géométrie
  useEffect(() => {
    return () => {
      geometry?.dispose()
    }
  }, [geometry])

  // Matériau
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#4a7c59',
      roughness: 0.8,
      metalness: 0.1,
      wireframe: showWireframe,
      flatShading: data.lod > 1,
    })
  }, [showWireframe, data.lod])

  useEffect(() => {
    return () => {
      material.dispose()
    }
  }, [material])

  if (loading || !geometry) {
    return <ChunkPlaceholder data={data} />
  }

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
 * Version sans physics pour chunks distants
 */
export function WorkerChunkSimple({
  data,
  seed,
  showWireframe = false,
  onLoaded,
}: WorkerChunkProps) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
  const [loading, setLoading] = useState(true)

  const lodConfig = LOD_LEVELS[data.lod] ?? LOD_LEVELS[0]
  const resolution = lodConfig?.resolution ?? 16

  useEffect(() => {
    let cancelled = false

    const generateAsync = async () => {
      const pool = getWorkerPool()

      const params: ChunkGenerationParams = {
        chunkX: data.x,
        chunkZ: data.z,
        worldX: data.worldX,
        worldZ: data.worldZ,
        size: CHUNK_CONFIG.size,
        resolution,
        heightScale: CHUNK_CONFIG.heightScale * 0.5, // Réduction pour LOD
        seed,
        noiseConfig: {
          octaves: Math.max(1, NOISE_CONFIG.octaves - data.lod),
          persistence: NOISE_CONFIG.persistence,
          lacunarity: NOISE_CONFIG.lacunarity,
          scale: NOISE_CONFIG.scale,
        },
      }

      const priority = -data.lod // Basse priorité pour chunks distants

      try {
        const result = await pool.generateChunk(params, priority)

        if (cancelled) return

        const geo = createGeometryFromBuffers(result)
        setGeometry(geo)
        setLoading(false)
        onLoaded?.()
      } catch (error) {
        if (!cancelled) {
          console.error(`[WorkerChunkSimple] Failed to generate chunk ${data.id}:`, error)
          setLoading(false)
        }
      }
    }

    generateAsync()

    return () => {
      cancelled = true
    }
  }, [data.id, data.x, data.z, data.worldX, data.worldZ, data.lod, seed, resolution, onLoaded])

  useEffect(() => {
    return () => {
      geometry?.dispose()
    }
  }, [geometry])

  const material = useMemo(() => {
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
      material.dispose()
    }
  }, [material])

  if (loading || !geometry) {
    return <ChunkPlaceholder data={data} />
  }

  return (
    <mesh
      position={[data.worldX + CHUNK_CONFIG.size / 2, 0, data.worldZ + CHUNK_CONFIG.size / 2]}
      geometry={geometry}
      material={material}
      receiveShadow
    />
  )
}

/**
 * Placeholder affiché pendant le chargement du chunk
 */
function ChunkPlaceholder({ data }: { data: ChunkData }) {
  return (
    <mesh
      position={[data.worldX + CHUNK_CONFIG.size / 2, 0, data.worldZ + CHUNK_CONFIG.size / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[CHUNK_CONFIG.size, CHUNK_CONFIG.size]} />
      <meshBasicMaterial color="#333333" transparent opacity={0.3} />
    </mesh>
  )
}

/**
 * Créer une BufferGeometry à partir des buffers du worker
 */
function createGeometryFromBuffers(result: ChunkGenerationResult): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()

  // Attribuer les buffers (utilise les références directes, pas de copie)
  geometry.setAttribute('position', new THREE.BufferAttribute(result.positions, 3))
  geometry.setAttribute('normal', new THREE.BufferAttribute(result.normals, 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(result.uvs, 2))
  geometry.setIndex(new THREE.BufferAttribute(result.indices, 1))

  // Calculer les bounding volumes
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()

  return geometry
}
