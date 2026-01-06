/**
 * HeightmapService - Service de requête de hauteur terrain
 *
 * Fournit des méthodes optimisées pour interroger la hauteur du terrain
 * à n'importe quelle position (x, z) avec interpolation bilinéaire.
 */

import * as THREE from 'three'
import { createFractalNoise2D } from '@utils/procedural'
import type { BiomeConfig, BiomeTerrainConfig, Position3D } from '@config/worldConfig'

// ============================================================================
// TYPES
// ============================================================================

export interface HeightmapData {
  /** Données de hauteur normalisées (0-1) */
  data: Float32Array
  /** Largeur en pixels */
  width: number
  /** Hauteur en pixels */
  height: number
  /** Limites du monde couvertes */
  worldBounds: {
    minX: number
    maxX: number
    minZ: number
    maxZ: number
  }
  /** Échelle de hauteur appliquée */
  heightScale: number
  /** ID du biome associé */
  biomeId: string
  /** Centre du biome */
  center: Position3D
  /** Rayon du biome */
  radius: number
}

export interface HeightQueryResult {
  height: number
  normal?: THREE.Vector3
  biomeId?: string
}

// ============================================================================
// HEIGHTMAP SERVICE
// ============================================================================

export class HeightmapService {
  private heightmaps: Map<string, HeightmapData> = new Map()
  private noiseGenerators: Map<string, (x: number, z: number) => number> = new Map()
  private biomeConfigs: Map<string, BiomeConfig> = new Map()
  private seed: number

  constructor(seed: number = 42) {
    this.seed = seed
  }

  /**
   * Enregistre un biome et crée son générateur de bruit
   */
  registerBiome(biome: BiomeConfig): void {
    this.biomeConfigs.set(biome.id, biome)

    // Créer un seed unique par biome
    const biomeSeed = this.seed + this.hashString(biome.id)

    // Créer le générateur de bruit pour ce biome
    const noiseGen = createFractalNoise2D({
      seed: biomeSeed,
      octaves: biome.terrain.octaves,
      persistence: biome.terrain.persistence,
      scale: biome.terrain.scale,
    })

    this.noiseGenerators.set(biome.id, noiseGen)
  }

  /**
   * Enregistre une heightmap pré-générée
   */
  registerHeightmap(id: string, data: HeightmapData): void {
    this.heightmaps.set(id, data)
  }

  /**
   * Désenregistre une heightmap
   */
  unregisterHeightmap(id: string): void {
    this.heightmaps.delete(id)
  }

  /**
   * Requête de hauteur à une position donnée
   * Utilise l'interpolation bilinéaire si une heightmap est disponible,
   * sinon génère la hauteur via le bruit procédural
   */
  queryHeight(worldX: number, worldZ: number, biomeId?: string): number {
    // Si un biome spécifique est demandé
    if (biomeId) {
      const heightmap = this.heightmaps.get(biomeId)
      if (heightmap) {
        return this.sampleHeightmap(heightmap, worldX, worldZ)
      }

      // Fallback: générer via bruit
      return this.generateHeight(worldX, worldZ, biomeId)
    }

    // Déterminer le biome automatiquement
    const detectedBiome = this.detectBiome(worldX, worldZ)
    if (detectedBiome) {
      return this.queryHeight(worldX, worldZ, detectedBiome.id)
    }

    // Pas de biome détecté - retourner 0
    return 0
  }

  /**
   * Requête de hauteur avec normale pour aligner les objets
   */
  queryHeightWithNormal(worldX: number, worldZ: number, biomeId?: string): HeightQueryResult {
    const delta = 0.5 // Distance pour calculer la normale

    const h = this.queryHeight(worldX, worldZ, biomeId)
    const hX = this.queryHeight(worldX + delta, worldZ, biomeId)
    const hZ = this.queryHeight(worldX, worldZ + delta, biomeId)

    // Calculer la normale via les différences finies
    const normal = new THREE.Vector3(
      h - hX,
      delta,
      h - hZ
    ).normalize()

    return {
      height: h,
      normal,
      biomeId: biomeId ?? this.detectBiome(worldX, worldZ)?.id,
    }
  }

  /**
   * Requête batch optimisée pour les instanced meshes
   */
  queryHeightsBatch(positions: THREE.Vector2[], biomeId?: string): Float32Array {
    const heights = new Float32Array(positions.length)

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i]
      if (pos) {
        heights[i] = this.queryHeight(pos.x, pos.y, biomeId)
      }
    }

    return heights
  }

  /**
   * Trouve le point le plus bas dans une zone circulaire
   * Utilisé pour positionner l'eau
   */
  findLowestPoint(centerX: number, centerZ: number, radius: number, biomeId?: string): number {
    let lowestY = Infinity
    const samples = Math.max(12, Math.floor(radius * 2))

    for (let angle = 0; angle < Math.PI * 2; angle += (Math.PI * 2) / samples) {
      for (let r = 0; r <= radius; r += radius / 5) {
        const x = centerX + Math.cos(angle) * r
        const z = centerZ + Math.sin(angle) * r
        const y = this.queryHeight(x, z, biomeId)
        lowestY = Math.min(lowestY, y)
      }
    }

    // Ajouter le centre
    lowestY = Math.min(lowestY, this.queryHeight(centerX, centerZ, biomeId))

    return lowestY === Infinity ? 0 : lowestY
  }

  /**
   * Trouve le point le plus haut dans une zone circulaire
   */
  findHighestPoint(centerX: number, centerZ: number, radius: number, biomeId?: string): number {
    let highestY = -Infinity
    const samples = Math.max(12, Math.floor(radius * 2))

    for (let angle = 0; angle < Math.PI * 2; angle += (Math.PI * 2) / samples) {
      for (let r = 0; r <= radius; r += radius / 5) {
        const x = centerX + Math.cos(angle) * r
        const z = centerZ + Math.sin(angle) * r
        const y = this.queryHeight(x, z, biomeId)
        highestY = Math.max(highestY, y)
      }
    }

    return highestY === -Infinity ? 0 : highestY
  }

  /**
   * Calcule la hauteur moyenne dans une zone
   */
  getAverageHeight(centerX: number, centerZ: number, radius: number, biomeId?: string): number {
    let totalY = 0
    let count = 0
    const samples = Math.max(8, Math.floor(radius))

    for (let angle = 0; angle < Math.PI * 2; angle += (Math.PI * 2) / samples) {
      for (let r = 0; r <= radius; r += radius / 4) {
        const x = centerX + Math.cos(angle) * r
        const z = centerZ + Math.sin(angle) * r
        totalY += this.queryHeight(x, z, biomeId)
        count++
      }
    }

    return count > 0 ? totalY / count : 0
  }

  /**
   * Détecte le biome à une position donnée
   */
  detectBiome(worldX: number, worldZ: number): BiomeConfig | null {
    let closestBiome: BiomeConfig | null = null
    let closestDistance = Infinity

    for (const biome of this.biomeConfigs.values()) {
      const dx = worldX - biome.center[0]
      const dz = worldZ - biome.center[2]
      const distance = Math.sqrt(dx * dx + dz * dz)

      if (distance < biome.radius && distance < closestDistance) {
        closestDistance = distance
        closestBiome = biome
      }
    }

    return closestBiome
  }

  /**
   * Récupère tous les biomes enregistrés
   */
  getBiomes(): BiomeConfig[] {
    return Array.from(this.biomeConfigs.values())
  }

  /**
   * Libère les ressources
   */
  dispose(): void {
    this.heightmaps.clear()
    this.noiseGenerators.clear()
    this.biomeConfigs.clear()
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  /**
   * Échantillonne une heightmap avec interpolation bilinéaire
   * Note: Les données heightmap contiennent déjà le falloff (valeurs normalisées 0-1)
   */
  private sampleHeightmap(heightmap: HeightmapData, worldX: number, worldZ: number): number {
    const { data, width, height, worldBounds, heightScale } = heightmap

    // Vérifier si la position est dans les limites
    if (
      worldX < worldBounds.minX ||
      worldX > worldBounds.maxX ||
      worldZ < worldBounds.minZ ||
      worldZ > worldBounds.maxZ
    ) {
      // Hors limites - utiliser le générateur de bruit
      return this.generateHeight(worldX, worldZ, heightmap.biomeId)
    }

    // Convertir les coordonnées monde en coordonnées heightmap
    const normalizedX = (worldX - worldBounds.minX) / (worldBounds.maxX - worldBounds.minX)
    const normalizedZ = (worldZ - worldBounds.minZ) / (worldBounds.maxZ - worldBounds.minZ)

    const pixelX = normalizedX * (width - 1)
    const pixelZ = normalizedZ * (height - 1)

    // Interpolation bilinéaire
    const x0 = Math.floor(pixelX)
    const x1 = Math.min(x0 + 1, width - 1)
    const z0 = Math.floor(pixelZ)
    const z1 = Math.min(z0 + 1, height - 1)

    const fx = pixelX - x0
    const fz = pixelZ - z0

    const h00 = data[z0 * width + x0] ?? 0
    const h10 = data[z0 * width + x1] ?? 0
    const h01 = data[z1 * width + x0] ?? 0
    const h11 = data[z1 * width + x1] ?? 0

    const interpolatedHeight =
      h00 * (1 - fx) * (1 - fz) +
      h10 * fx * (1 - fz) +
      h01 * (1 - fx) * fz +
      h11 * fx * fz

    // La heightmap contient déjà le falloff, donc on applique juste le heightScale
    return interpolatedHeight * heightScale
  }

  /**
   * Génère la hauteur via bruit procédural (fallback)
   */
  private generateHeight(worldX: number, worldZ: number, biomeId: string): number {
    const noiseGen = this.noiseGenerators.get(biomeId)
    const biome = this.biomeConfigs.get(biomeId)

    if (!noiseGen || !biome) {
      return 0
    }

    // Générer le bruit
    const noiseValue = (noiseGen(worldX, worldZ) + 1) / 2

    // Appliquer le falloff circulaire
    const dx = worldX - biome.center[0]
    const dz = worldZ - biome.center[2]
    const distFromCenter = Math.sqrt(dx * dx + dz * dz)
    const normalizedDist = distFromCenter / biome.radius

    let falloff = 1
    if (biome.terrain.falloffType === 'circular') {
      falloff = Math.max(0, 1 - Math.pow(normalizedDist, biome.terrain.falloffStrength))
    } else if (biome.terrain.falloffType === 'square') {
      falloff = Math.max(0, 1 - normalizedDist)
    }

    return noiseValue * biome.terrain.heightScale * falloff
  }

  /**
   * Hash simple pour générer des seeds uniques
   */
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let heightmapServiceInstance: HeightmapService | null = null

export function getHeightmapService(seed?: number): HeightmapService {
  if (!heightmapServiceInstance) {
    heightmapServiceInstance = new HeightmapService(seed ?? 42)
  }
  return heightmapServiceInstance
}

export function resetHeightmapService(): void {
  if (heightmapServiceInstance) {
    heightmapServiceInstance.dispose()
    heightmapServiceInstance = null
  }
}
