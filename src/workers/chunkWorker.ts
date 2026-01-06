/**
 * Web Worker pour la génération de chunks terrain
 * Exécute la génération de heightmap et géométrie hors du thread principal
 */

import * as Comlink from 'comlink'
import { createNoise2D } from 'simplex-noise'

// Types pour les données transférables
export interface ChunkGenerationParams {
  chunkX: number
  chunkZ: number
  worldX: number
  worldZ: number
  size: number
  resolution: number
  heightScale: number
  seed: number
  noiseConfig: {
    octaves: number
    persistence: number
    lacunarity: number
    scale: number
  }
}

export interface ChunkGenerationResult {
  chunkX: number
  chunkZ: number
  positions: Float32Array
  normals: Float32Array
  uvs: Float32Array
  indices: Uint32Array
  heightmap: Float32Array
}

// Générateur de bruit seeded
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = Math.sin(s * 9999) * 10000
    return s - Math.floor(s)
  }
}

// Créer un générateur de bruit avec seed
function createSeededNoise2D(seed: number) {
  const random = seededRandom(seed)
  return createNoise2D(random)
}

// Génération de bruit fractal multi-octaves
function fractalNoise2D(
  noise2D: (x: number, y: number) => number,
  x: number,
  y: number,
  octaves: number,
  persistence: number,
  lacunarity: number,
  scale: number
): number {
  let value = 0
  let amplitude = 1
  let frequency = scale
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    value += noise2D(x * frequency, y * frequency) * amplitude
    maxValue += amplitude
    amplitude *= persistence
    frequency *= lacunarity
  }

  return value / maxValue
}

// Génération principale du chunk
function generateChunk(params: ChunkGenerationParams): ChunkGenerationResult {
  const {
    chunkX,
    chunkZ,
    worldX,
    worldZ,
    size,
    resolution,
    heightScale,
    seed,
    noiseConfig,
  } = params

  const { octaves, persistence, lacunarity, scale } = noiseConfig

  // Créer le générateur de bruit seeded
  const noise2D = createSeededNoise2D(seed + chunkX * 1000 + chunkZ)

  // Calculer les dimensions
  const verticesPerRow = resolution + 1
  const totalVertices = verticesPerRow * verticesPerRow
  const totalTriangles = resolution * resolution * 2

  // Allouer les buffers
  const positions = new Float32Array(totalVertices * 3)
  const normals = new Float32Array(totalVertices * 3)
  const uvs = new Float32Array(totalVertices * 2)
  const indices = new Uint32Array(totalTriangles * 3)
  const heightmap = new Float32Array(totalVertices)

  const stepSize = size / resolution
  const halfSize = size / 2

  // Générer les vertices et heightmap
  for (let z = 0; z <= resolution; z++) {
    for (let x = 0; x <= resolution; x++) {
      const idx = z * verticesPerRow + x
      const idx3 = idx * 3
      const idx2 = idx * 2

      // Position locale dans le chunk
      const localX = x * stepSize - halfSize
      const localZ = z * stepSize - halfSize

      // Position mondiale pour le bruit
      const worldPosX = worldX + localX + halfSize
      const worldPosZ = worldZ + localZ + halfSize

      // Générer la hauteur avec bruit fractal
      let height = fractalNoise2D(
        noise2D,
        worldPosX,
        worldPosZ,
        octaves,
        persistence,
        lacunarity,
        scale
      )

      // Normaliser de [-1, 1] à [0, 1]
      height = (height + 1) / 2

      // Stocker le heightmap
      heightmap[idx] = height

      // Position du vertex
      positions[idx3] = localX
      positions[idx3 + 1] = height * heightScale
      positions[idx3 + 2] = localZ

      // UVs
      uvs[idx2] = x / resolution
      uvs[idx2 + 1] = z / resolution
    }
  }

  // Calculer les normales par différences finies
  for (let z = 0; z <= resolution; z++) {
    for (let x = 0; x <= resolution; x++) {
      const idx = z * verticesPerRow + x
      const idx3 = idx * 3

      // Indices voisins (avec clamping aux bords)
      const xm = Math.max(0, x - 1)
      const xp = Math.min(resolution, x + 1)
      const zm = Math.max(0, z - 1)
      const zp = Math.min(resolution, z + 1)

      // Hauteurs voisines
      const hL = positions[(z * verticesPerRow + xm) * 3 + 1] ?? 0
      const hR = positions[(z * verticesPerRow + xp) * 3 + 1] ?? 0
      const hD = positions[(zm * verticesPerRow + x) * 3 + 1] ?? 0
      const hU = positions[(zp * verticesPerRow + x) * 3 + 1] ?? 0

      // Calculer la normale
      const nx = hL - hR
      const ny = 2 * stepSize
      const nz = hD - hU

      // Normaliser
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
      normals[idx3] = nx / len
      normals[idx3 + 1] = ny / len
      normals[idx3 + 2] = nz / len
    }
  }

  // Générer les indices (triangles)
  let indexOffset = 0
  for (let z = 0; z < resolution; z++) {
    for (let x = 0; x < resolution; x++) {
      const topLeft = z * verticesPerRow + x
      const topRight = topLeft + 1
      const bottomLeft = (z + 1) * verticesPerRow + x
      const bottomRight = bottomLeft + 1

      // Premier triangle
      indices[indexOffset++] = topLeft
      indices[indexOffset++] = bottomLeft
      indices[indexOffset++] = topRight

      // Second triangle
      indices[indexOffset++] = topRight
      indices[indexOffset++] = bottomLeft
      indices[indexOffset++] = bottomRight
    }
  }

  return {
    chunkX,
    chunkZ,
    positions,
    normals,
    uvs,
    indices,
    heightmap,
  }
}

// Interface exposée au thread principal via Comlink
const workerAPI = {
  generateChunk,

  // Génération par lots pour meilleure performance
  generateChunks(paramsList: ChunkGenerationParams[]): ChunkGenerationResult[] {
    return paramsList.map(params => generateChunk(params))
  },

  // Test de connexion
  ping(): string {
    return 'pong'
  },
}

export type ChunkWorkerAPI = typeof workerAPI

Comlink.expose(workerAPI)
