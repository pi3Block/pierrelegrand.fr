/**
 * WaterFactory - Factory pour positionnement d'eau terrain-aware
 *
 * Calcule la hauteur Y de l'eau en fonction du terrain.
 * Supporte plusieurs modes: terrainLowest, terrainCenter, absolute
 */

import * as THREE from 'three'
import { getHeightmapService } from '@services/HeightmapService'
import type {
  WaterFeatureConfig,
  WaterColorConfig,
  Position3D,
} from '@config/worldConfig'
import { WATER_COLOR_PRESETS, WORLD_CONFIG } from '@config/worldConfig'

// ============================================================================
// TYPES
// ============================================================================

export interface WaterPlacement {
  /** ID du water feature */
  id: string
  /** Type de water feature */
  type: WaterFeatureConfig['type']
  /** Position 3D calculée avec Y correct */
  position: THREE.Vector3
  /** Rayon (pour lake, pond, fountain) */
  radius?: number
  /** Rayon intérieur (pour moat) */
  innerRadius?: number
  /** Rayon extérieur (pour moat) */
  outerRadius?: number
  /** Hauteur du jet (pour fountain) */
  height?: number
  /** Configuration des couleurs */
  colors: WaterColorConfig
  /** Enabled state */
  enabled: boolean
}

export interface WaterCalculationResult {
  /** Hauteur Y calculée */
  y: number
  /** Point le plus bas trouvé dans la zone */
  lowestPoint?: number
  /** Point le plus haut trouvé dans la zone */
  highestPoint?: number
  /** Hauteur moyenne */
  averageHeight?: number
}

// ============================================================================
// WATER FACTORY
// ============================================================================

export class WaterFactory {
  /**
   * Calcule la hauteur Y pour un water feature selon son mode
   */
  calculateWaterY(config: WaterFeatureConfig, biomeId?: string): WaterCalculationResult {
    const heightService = getHeightmapService()
    const [x, , z] = config.position

    switch (config.yMode) {
      case 'terrainLowest': {
        // Trouve le point le plus bas dans la zone du water feature
        const radius = config.radius ?? config.outerRadius ?? 5
        const lowestPoint = heightService.findLowestPoint(x, z, radius, biomeId)
        return {
          y: lowestPoint + config.offset,
          lowestPoint,
        }
      }

      case 'terrainCenter': {
        // Utilise la hauteur du terrain au centre
        const centerHeight = heightService.queryHeight(x, z, biomeId)
        return {
          y: centerHeight + config.offset,
        }
      }

      case 'absolute':
      default: {
        // Position Y absolue
        return {
          y: config.offset,
        }
      }
    }
  }

  /**
   * Génère un placement complet pour un water feature
   */
  generatePlacement(config: WaterFeatureConfig, biomeId?: string): WaterPlacement {
    const { y } = this.calculateWaterY(config, biomeId)

    return {
      id: config.id,
      type: config.type,
      position: new THREE.Vector3(config.position[0], y, config.position[2]),
      radius: config.radius,
      innerRadius: config.innerRadius,
      outerRadius: config.outerRadius,
      height: config.height,
      colors: config.colors,
      enabled: config.enabled,
    }
  }

  /**
   * Génère tous les placements pour les water features d'un biome
   */
  generateBiomeWaterPlacements(biomeId: string): WaterPlacement[] {
    const placements: WaterPlacement[] = []

    // Trouver les water features associées au biome
    const biome = WORLD_CONFIG.biomes.find((b) => b.id === biomeId)
    if (!biome) return placements

    for (const featureId of biome.waterFeatures) {
      const config = WORLD_CONFIG.waterFeatures.find((w) => w.id === featureId)
      if (config && config.enabled) {
        placements.push(this.generatePlacement(config, biomeId))
      }
    }

    return placements
  }

  /**
   * Génère tous les placements pour tous les water features du monde
   */
  generateAllWaterPlacements(): WaterPlacement[] {
    const placements: WaterPlacement[] = []

    for (const config of WORLD_CONFIG.waterFeatures) {
      if (!config.enabled) continue

      // Détecter le biome basé sur la position
      const heightService = getHeightmapService()
      const biome = heightService.detectBiome(config.position[0], config.position[2])

      placements.push(this.generatePlacement(config, biome?.id))
    }

    return placements
  }

  /**
   * Recalcule la hauteur Y d'un placement existant
   * (utile après mise à jour de la heightmap)
   */
  recalculatePlacementY(placement: WaterPlacement, config: WaterFeatureConfig, biomeId?: string): WaterPlacement {
    const { y } = this.calculateWaterY(config, biomeId)
    return {
      ...placement,
      position: new THREE.Vector3(placement.position.x, y, placement.position.z),
    }
  }

  /**
   * Crée une configuration de water feature avec valeurs par défaut
   */
  static createWaterConfig(
    id: string,
    type: WaterFeatureConfig['type'],
    position: Position3D,
    options?: Partial<Omit<WaterFeatureConfig, 'id' | 'type' | 'position'>>
  ): WaterFeatureConfig {
    const colorPreset = options?.colors ?? { ...WATER_COLOR_PRESETS.neutral }

    return {
      id,
      type,
      position,
      yMode: options?.yMode ?? 'terrainLowest',
      offset: options?.offset ?? 0.1,
      radius: options?.radius,
      innerRadius: options?.innerRadius,
      outerRadius: options?.outerRadius,
      height: options?.height,
      colors: colorPreset,
      enabled: options?.enabled ?? true,
    }
  }

  /**
   * Vérifie si une position est sous l'eau
   */
  isUnderwater(
    worldX: number,
    worldY: number,
    worldZ: number,
    waterPlacements: WaterPlacement[]
  ): boolean {
    for (const water of waterPlacements) {
      if (!water.enabled) continue

      const dx = worldX - water.position.x
      const dz = worldZ - water.position.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      let isInWaterRadius = false

      switch (water.type) {
        case 'moat':
          isInWaterRadius = water.innerRadius !== undefined &&
            water.outerRadius !== undefined &&
            dist >= water.innerRadius &&
            dist <= water.outerRadius
          break
        case 'lake':
        case 'pond':
        case 'fountain':
          isInWaterRadius = water.radius !== undefined && dist <= water.radius
          break
        default:
          continue
      }

      if (isInWaterRadius && worldY < water.position.y) {
        return true
      }
    }

    return false
  }

  /**
   * Obtient le niveau d'eau à une position donnée
   */
  getWaterLevelAt(
    worldX: number,
    worldZ: number,
    waterPlacements: WaterPlacement[]
  ): number | null {
    for (const water of waterPlacements) {
      if (!water.enabled) continue

      const dx = worldX - water.position.x
      const dz = worldZ - water.position.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      let isInWaterRadius = false

      switch (water.type) {
        case 'moat':
          isInWaterRadius = water.innerRadius !== undefined &&
            water.outerRadius !== undefined &&
            dist >= water.innerRadius &&
            dist <= water.outerRadius
          break
        case 'lake':
        case 'pond':
        case 'fountain':
          isInWaterRadius = water.radius !== undefined && dist <= water.radius
          break
        default:
          continue
      }

      if (isInWaterRadius) {
        return water.position.y
      }
    }

    return null
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let waterFactoryInstance: WaterFactory | null = null

export function getWaterFactory(): WaterFactory {
  if (!waterFactoryInstance) {
    waterFactoryInstance = new WaterFactory()
  }
  return waterFactoryInstance
}

export function resetWaterFactory(): void {
  waterFactoryInstance = null
}

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useMemo } from 'react'
import { useWorldStore, useWorldWaterFeatures } from '@stores/worldStore'

/**
 * Hook pour obtenir tous les placements d'eau calculés
 */
export function useWaterPlacements(): WaterPlacement[] {
  const isInitialized = useWorldStore((state) => state.isInitialized)
  const waterFeatures = useWorldWaterFeatures()

  return useMemo(() => {
    if (!isInitialized) return []

    const factory = getWaterFactory()
    return factory.generateAllWaterPlacements()
  }, [isInitialized, waterFeatures])
}

/**
 * Hook pour obtenir les placements d'eau d'un biome spécifique
 */
export function useBiomeWaterPlacements(biomeId: string): WaterPlacement[] {
  const isInitialized = useWorldStore((state) => state.isInitialized)

  return useMemo(() => {
    if (!isInitialized) return []

    const factory = getWaterFactory()
    return factory.generateBiomeWaterPlacements(biomeId)
  }, [isInitialized, biomeId])
}

/**
 * Hook pour vérifier si une position est sous l'eau
 */
export function useIsUnderwater(
  position: THREE.Vector3 | null
): boolean {
  const placements = useWaterPlacements()

  return useMemo(() => {
    if (!position) return false

    const factory = getWaterFactory()
    return factory.isUnderwater(position.x, position.y, position.z, placements)
  }, [position, placements])
}

/**
 * Hook pour obtenir le niveau d'eau à une position
 */
export function useWaterLevelAt(
  worldX: number,
  worldZ: number
): number | null {
  const placements = useWaterPlacements()

  return useMemo(() => {
    const factory = getWaterFactory()
    return factory.getWaterLevelAt(worldX, worldZ, placements)
  }, [worldX, worldZ, placements])
}
