/**
 * Utilitaires de génération de bruit procédural
 * Wrapper autour de simplex-noise avec support multi-octaves
 */

import { createNoise2D, createNoise3D } from 'simplex-noise'
import type { NoiseFunction2D, NoiseFunction3D } from 'simplex-noise'

export interface NoiseConfig {
  seed?: number
  octaves?: number
  persistence?: number
  lacunarity?: number
  scale?: number
}

const DEFAULT_CONFIG: Required<NoiseConfig> = {
  seed: 12345,
  octaves: 4,
  persistence: 0.5,
  lacunarity: 2.0,
  scale: 0.02,
}

/**
 * Crée un générateur de pseudo-random basé sur une seed
 */
function createSeededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = Math.sin(s * 9999) * 10000
    return s - Math.floor(s)
  }
}

/**
 * Génère du bruit 2D multi-octaves (Fractional Brownian Motion)
 */
export function createFractalNoise2D(config: NoiseConfig = {}): (x: number, y: number) => number {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const random = createSeededRandom(cfg.seed)
  const noise2D: NoiseFunction2D = createNoise2D(random)

  return (x: number, y: number): number => {
    let value = 0
    let amplitude = 1
    let frequency = cfg.scale
    let maxValue = 0

    for (let o = 0; o < cfg.octaves; o++) {
      value += noise2D(x * frequency, y * frequency) * amplitude
      maxValue += amplitude
      amplitude *= cfg.persistence
      frequency *= cfg.lacunarity
    }

    // Normaliser entre -1 et 1
    return value / maxValue
  }
}

/**
 * Génère du bruit 3D multi-octaves (pour caves, nuages, etc.)
 */
export function createFractalNoise3D(config: NoiseConfig = {}): (x: number, y: number, z: number) => number {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const random = createSeededRandom(cfg.seed)
  const noise3D: NoiseFunction3D = createNoise3D(random)

  return (x: number, y: number, z: number): number => {
    let value = 0
    let amplitude = 1
    let frequency = cfg.scale
    let maxValue = 0

    for (let o = 0; o < cfg.octaves; o++) {
      value += noise3D(x * frequency, y * frequency, z * frequency) * amplitude
      maxValue += amplitude
      amplitude *= cfg.persistence
      frequency *= cfg.lacunarity
    }

    return value / maxValue
  }
}

/**
 * Génère un bruit de type "ridge" (crêtes de montagnes)
 */
export function createRidgeNoise2D(config: NoiseConfig = {}): (x: number, y: number) => number {
  const fractalNoise = createFractalNoise2D(config)

  return (x: number, y: number): number => {
    const value = fractalNoise(x, y)
    // Inverser et absolue pour créer des crêtes
    return 1 - Math.abs(value)
  }
}

/**
 * Génère un bruit "domain warping" (distorsion du domaine)
 * Crée des patterns plus organiques et intéressants
 */
export function createWarpedNoise2D(config: NoiseConfig = {}): (x: number, y: number) => number {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const random = createSeededRandom(cfg.seed)
  const noise2D: NoiseFunction2D = createNoise2D(random)
  const warpNoise: NoiseFunction2D = createNoise2D(() => random() * 0.5)

  return (x: number, y: number): number => {
    const warpStrength = 4
    const warpX = warpNoise(x * cfg.scale * 0.5, y * cfg.scale * 0.5) * warpStrength
    const warpY = warpNoise(x * cfg.scale * 0.5 + 100, y * cfg.scale * 0.5 + 100) * warpStrength

    return noise2D((x + warpX) * cfg.scale, (y + warpY) * cfg.scale)
  }
}

/**
 * Génère une heightmap sous forme de Float32Array
 */
export function generateHeightmap(
  width: number,
  height: number,
  config: NoiseConfig = {}
): Float32Array {
  const noise = createFractalNoise2D(config)
  const data = new Float32Array(width * height)

  for (let z = 0; z < height; z++) {
    for (let x = 0; x < width; x++) {
      // Normaliser entre 0 et 1
      data[z * width + x] = (noise(x, z) + 1) / 2
    }
  }

  return data
}

/**
 * Génère une heightmap avec bords atténués (pour chunks isolés)
 */
export function generateHeightmapWithFalloff(
  width: number,
  height: number,
  config: NoiseConfig = {},
  falloffStrength: number = 1
): Float32Array {
  const noise = createFractalNoise2D(config)
  const data = new Float32Array(width * height)

  const centerX = width / 2
  const centerZ = height / 2
  // maxDist peut être utilisé pour normaliser la distance si nécessaire
  // const maxDist = Math.sqrt(centerX * centerX + centerZ * centerZ)

  for (let z = 0; z < height; z++) {
    for (let x = 0; x < width; x++) {
      const noiseValue = (noise(x, z) + 1) / 2

      // Calculer le falloff (atténuation vers les bords)
      const dx = (x - centerX) / centerX
      const dz = (z - centerZ) / centerZ
      const dist = Math.sqrt(dx * dx + dz * dz)
      const falloff = Math.max(0, 1 - Math.pow(dist, falloffStrength))

      data[z * width + x] = noiseValue * falloff
    }
  }

  return data
}
