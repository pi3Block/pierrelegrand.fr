/**
 * WorldStore - Store Zustand central pour la gestion du monde procédural
 *
 * Fournit un état global pour:
 * - Configuration du monde
 * - Cache des heightmaps
 * - Requêtes de hauteur optimisées
 * - État d'initialisation des biomes
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as THREE from 'three'
import type { BiomeConfig, WorldConfig, WaterFeatureConfig } from '@config/worldConfig'
import { WORLD_CONFIG } from '@config/worldConfig'
import { getHeightmapService, resetHeightmapService, type HeightmapData, type HeightQueryResult } from '@services/HeightmapService'

// ============================================================================
// TYPES
// ============================================================================

export interface BiomeState {
  id: string
  isLoaded: boolean
  hasHeightmap: boolean
}

export interface WorldState {
  // Configuration
  config: WorldConfig
  seed: number

  // État
  isInitialized: boolean
  biomeStates: Map<string, BiomeState>

  // Actions - Initialisation
  initialize: (config?: Partial<WorldConfig>) => void
  reset: () => void

  // Actions - Biomes
  registerBiome: (biome: BiomeConfig) => void
  setBiomeLoaded: (biomeId: string, loaded: boolean) => void

  // Actions - Heightmaps
  registerHeightmap: (biomeId: string, data: HeightmapData) => void
  unregisterHeightmap: (biomeId: string) => void

  // Actions - Requêtes
  queryHeight: (x: number, z: number, biomeId?: string) => number
  queryHeightWithNormal: (x: number, z: number, biomeId?: string) => HeightQueryResult
  queryHeightsBatch: (positions: THREE.Vector2[], biomeId?: string) => Float32Array
  findLowestPoint: (centerX: number, centerZ: number, radius: number, biomeId?: string) => number
  findHighestPoint: (centerX: number, centerZ: number, radius: number, biomeId?: string) => number
  getAverageHeight: (centerX: number, centerZ: number, radius: number, biomeId?: string) => number

  // Actions - Utilitaires
  getBiomeConfig: (biomeId: string) => BiomeConfig | undefined
  getWaterFeatureConfig: (featureId: string) => WaterFeatureConfig | undefined
  getBiomeWaterFeatures: (biomeId: string) => WaterFeatureConfig[]
  detectBiome: (x: number, z: number) => BiomeConfig | null
  getAllBiomes: () => BiomeConfig[]
}

// ============================================================================
// STORE
// ============================================================================

export const useWorldStore = create<WorldState>()(
  subscribeWithSelector((set, get) => ({
    // État initial
    config: WORLD_CONFIG,
    seed: WORLD_CONFIG.seed,
    isInitialized: false,
    biomeStates: new Map(),

    // ========================================================================
    // INITIALISATION
    // ========================================================================

    initialize: (customConfig?: Partial<WorldConfig>) => {
      const state = get()
      if (state.isInitialized) {
        console.warn('[WorldStore] Already initialized, call reset() first')
        return
      }

      // Fusionner config personnalisée avec config par défaut
      const config: WorldConfig = customConfig
        ? {
            ...WORLD_CONFIG,
            ...customConfig,
            layers: { ...WORLD_CONFIG.layers, ...customConfig.layers },
            hub: { ...WORLD_CONFIG.hub, ...customConfig.hub },
            biomes: customConfig.biomes ?? WORLD_CONFIG.biomes,
            waterFeatures: customConfig.waterFeatures ?? WORLD_CONFIG.waterFeatures,
          }
        : WORLD_CONFIG

      // Initialiser le service de heightmap
      const heightService = getHeightmapService(config.seed)

      // Enregistrer tous les biomes dans le service
      const biomeStates = new Map<string, BiomeState>()
      for (const biome of config.biomes) {
        heightService.registerBiome(biome)
        biomeStates.set(biome.id, {
          id: biome.id,
          isLoaded: false,
          hasHeightmap: false,
        })
      }

      set({
        config,
        seed: config.seed,
        isInitialized: true,
        biomeStates,
      })

      console.log(`[WorldStore] Initialized with seed ${config.seed}, ${config.biomes.length} biomes`)
    },

    reset: () => {
      resetHeightmapService()
      set({
        config: WORLD_CONFIG,
        seed: WORLD_CONFIG.seed,
        isInitialized: false,
        biomeStates: new Map(),
      })
      console.log('[WorldStore] Reset complete')
    },

    // ========================================================================
    // GESTION DES BIOMES
    // ========================================================================

    registerBiome: (biome: BiomeConfig) => {
      const heightService = getHeightmapService(get().seed)
      heightService.registerBiome(biome)

      set((state) => {
        const newBiomeStates = new Map(state.biomeStates)
        newBiomeStates.set(biome.id, {
          id: biome.id,
          isLoaded: false,
          hasHeightmap: false,
        })
        return { biomeStates: newBiomeStates }
      })
    },

    setBiomeLoaded: (biomeId: string, loaded: boolean) => {
      set((state) => {
        const newBiomeStates = new Map(state.biomeStates)
        const existing = newBiomeStates.get(biomeId)
        if (existing) {
          newBiomeStates.set(biomeId, { ...existing, isLoaded: loaded })
        }
        return { biomeStates: newBiomeStates }
      })
    },

    // ========================================================================
    // GESTION DES HEIGHTMAPS
    // ========================================================================

    registerHeightmap: (biomeId: string, data: HeightmapData) => {
      const heightService = getHeightmapService(get().seed)
      heightService.registerHeightmap(biomeId, data)

      set((state) => {
        const newBiomeStates = new Map(state.biomeStates)
        const existing = newBiomeStates.get(biomeId)
        if (existing) {
          newBiomeStates.set(biomeId, { ...existing, hasHeightmap: true })
        }
        return { biomeStates: newBiomeStates }
      })

      console.log(`[WorldStore] Heightmap registered for biome: ${biomeId}`)
    },

    unregisterHeightmap: (biomeId: string) => {
      const heightService = getHeightmapService(get().seed)
      heightService.unregisterHeightmap(biomeId)

      set((state) => {
        const newBiomeStates = new Map(state.biomeStates)
        const existing = newBiomeStates.get(biomeId)
        if (existing) {
          newBiomeStates.set(biomeId, { ...existing, hasHeightmap: false })
        }
        return { biomeStates: newBiomeStates }
      })
    },

    // ========================================================================
    // REQUÊTES DE HAUTEUR
    // ========================================================================

    queryHeight: (x: number, z: number, biomeId?: string): number => {
      const heightService = getHeightmapService(get().seed)
      return heightService.queryHeight(x, z, biomeId)
    },

    queryHeightWithNormal: (x: number, z: number, biomeId?: string) => {
      const heightService = getHeightmapService(get().seed)
      return heightService.queryHeightWithNormal(x, z, biomeId)
    },

    queryHeightsBatch: (positions: THREE.Vector2[], biomeId?: string): Float32Array => {
      const heightService = getHeightmapService(get().seed)
      return heightService.queryHeightsBatch(positions, biomeId)
    },

    findLowestPoint: (centerX: number, centerZ: number, radius: number, biomeId?: string): number => {
      const heightService = getHeightmapService(get().seed)
      return heightService.findLowestPoint(centerX, centerZ, radius, biomeId)
    },

    findHighestPoint: (centerX: number, centerZ: number, radius: number, biomeId?: string): number => {
      const heightService = getHeightmapService(get().seed)
      return heightService.findHighestPoint(centerX, centerZ, radius, biomeId)
    },

    getAverageHeight: (centerX: number, centerZ: number, radius: number, biomeId?: string): number => {
      const heightService = getHeightmapService(get().seed)
      return heightService.getAverageHeight(centerX, centerZ, radius, biomeId)
    },

    // ========================================================================
    // UTILITAIRES
    // ========================================================================

    getBiomeConfig: (biomeId: string): BiomeConfig | undefined => {
      return get().config.biomes.find((b) => b.id === biomeId)
    },

    getWaterFeatureConfig: (featureId: string): WaterFeatureConfig | undefined => {
      return get().config.waterFeatures.find((w) => w.id === featureId)
    },

    getBiomeWaterFeatures: (biomeId: string): WaterFeatureConfig[] => {
      const biome = get().getBiomeConfig(biomeId)
      if (!biome) return []

      return biome.waterFeatures
        .map((id) => get().getWaterFeatureConfig(id))
        .filter((w): w is WaterFeatureConfig => w !== undefined)
    },

    detectBiome: (x: number, z: number): BiomeConfig | null => {
      const heightService = getHeightmapService(get().seed)
      return heightService.detectBiome(x, z)
    },

    getAllBiomes: (): BiomeConfig[] => {
      return get().config.biomes
    },
  }))
)

// ============================================================================
// HOOKS SÉLECTEURS OPTIMISÉS
// ============================================================================

/**
 * Hook pour accéder à la configuration du monde
 */
export const useWorldConfig = () => useWorldStore((state) => state.config)

/**
 * Hook pour accéder à l'état d'initialisation
 */
export const useWorldInitialized = () => useWorldStore((state) => state.isInitialized)

/**
 * Hook pour accéder aux biomes
 */
export const useWorldBiomes = () => useWorldStore((state) => state.config.biomes)

/**
 * Hook pour accéder aux water features
 */
export const useWorldWaterFeatures = () => useWorldStore((state) => state.config.waterFeatures)

/**
 * Hook pour accéder à la fonction queryHeight
 */
export const useQueryHeight = () => useWorldStore((state) => state.queryHeight)

/**
 * Hook pour accéder au hub config
 */
export const useHubConfig = () => useWorldStore((state) => state.config.hub)

/**
 * Hook pour accéder aux layers config
 */
export const useWorldLayers = () => useWorldStore((state) => state.config.layers)
