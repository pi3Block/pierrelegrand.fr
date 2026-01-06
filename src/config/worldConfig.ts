/**
 * Configuration unifiée du monde procédural
 * Source unique de vérité pour tous les paramètres du monde
 */

import type { BiomeType } from './proceduralConfig'

// ============================================================================
// TYPES
// ============================================================================

export type Position3D = [number, number, number]

export type WaterYMode = 'terrainLowest' | 'terrainCenter' | 'absolute'

export interface LayerConfig {
  baseY: number
  enabled: boolean
}

export interface BiomeColors {
  primary: string
  secondary: string
  ground: string
  accent?: string
}

export interface BiomeTerrainConfig {
  heightScale: number
  octaves: number
  persistence: number
  scale: number
  falloffType: 'circular' | 'square' | 'none'
  falloffStrength: number
}

export interface BiomeVegetationConfig {
  types: string[]
  density: number
  minDistance: number
  maxObjects: number
  heightOffset: number
}

export interface WaterColorConfig {
  shallowColor: string
  deepColor: string
  foamColor: string
  opacity: number
  waveHeight: number
  waveSpeed: number
}

export interface WaterFeatureConfig {
  id: string
  type: 'lake' | 'moat' | 'fountain' | 'river' | 'pond'
  position: Position3D
  yMode: WaterYMode
  offset: number
  radius?: number
  innerRadius?: number
  outerRadius?: number
  height?: number
  colors: WaterColorConfig
  enabled: boolean
}

export interface BiomeConfig {
  id: string
  type: BiomeType
  center: Position3D
  radius: number
  colors: BiomeColors
  terrain: BiomeTerrainConfig
  vegetation: BiomeVegetationConfig
  waterFeatures: string[] // IDs des water features associées
}

export interface HubConfig {
  center: Position3D
  radius: number
  platformHeight: number
  colors: BiomeColors
}

export interface WorldLayers {
  terrain: LayerConfig
  water: LayerConfig & { offsetAboveTerrain: number }
  groundDecorations: LayerConfig & { offsetY: number }
  vegetation: LayerConfig & { offsetY: number }
  structures: LayerConfig & { offsetY: number }
}

export interface WorldConfig {
  seed: number
  debug: boolean
  layers: WorldLayers
  hub: HubConfig
  biomes: BiomeConfig[]
  waterFeatures: WaterFeatureConfig[]
}

// ============================================================================
// PRESETS - Configurations par défaut par type de biome
// ============================================================================

export const BIOME_PRESETS: Record<BiomeType, Omit<BiomeConfig, 'id' | 'center'>> = {
  nature: {
    type: 'nature',
    radius: 22,
    colors: {
      primary: '#22c55e',
      secondary: '#4ade80',
      ground: '#14532d',
      accent: '#86efac',
    },
    terrain: {
      heightScale: 6,
      octaves: 6,
      persistence: 0.5,
      scale: 0.03,
      falloffType: 'circular',
      falloffStrength: 2,
    },
    vegetation: {
      types: ['tree', 'bush', 'rock', 'flower', 'grass', 'mushroom'],
      density: 0.8,
      minDistance: 2,
      maxObjects: 60,
      heightOffset: 0,
    },
    waterFeatures: [],
  },
  tech: {
    type: 'tech',
    radius: 22,
    colors: {
      primary: '#6366f1',
      secondary: '#818cf8',
      ground: '#1e1b4b',
      accent: '#a5b4fc',
    },
    terrain: {
      heightScale: 3,
      octaves: 2,
      persistence: 0.3,
      scale: 0.01,
      falloffType: 'circular',
      falloffStrength: 3,
    },
    vegetation: {
      types: ['rock', 'crystal'],
      density: 0.4,
      minDistance: 4,
      maxObjects: 25,
      heightOffset: 0,
    },
    waterFeatures: [],
  },
  crypto: {
    type: 'crypto',
    radius: 22,
    colors: {
      primary: '#f59e0b',
      secondary: '#fbbf24',
      ground: '#451a03',
      accent: '#fcd34d',
    },
    terrain: {
      heightScale: 5,
      octaves: 3,
      persistence: 0.4,
      scale: 0.02,
      falloffType: 'circular',
      falloffStrength: 2.5,
    },
    vegetation: {
      types: ['crystal', 'rock', 'coin'],
      density: 0.5,
      minDistance: 3,
      maxObjects: 35,
      heightOffset: 0,
    },
    waterFeatures: [],
  },
}

export const WATER_COLOR_PRESETS: Record<string, WaterColorConfig> = {
  hub: {
    shallowColor: '#7c3aed',
    deepColor: '#4c1d95',
    foamColor: '#c4b5fd',
    opacity: 0.85,
    waveHeight: 0.15,
    waveSpeed: 1.0,
  },
  nature: {
    shallowColor: '#34d399',
    deepColor: '#065f46',
    foamColor: '#a7f3d0',
    opacity: 0.85,
    waveHeight: 0.2,
    waveSpeed: 0.8,
  },
  tech: {
    shallowColor: '#60a5fa',
    deepColor: '#1e3a8a',
    foamColor: '#bfdbfe',
    opacity: 0.8,
    waveHeight: 0.1,
    waveSpeed: 1.2,
  },
  crypto: {
    shallowColor: '#fbbf24',
    deepColor: '#92400e',
    foamColor: '#fef3c7',
    opacity: 0.85,
    waveHeight: 0.15,
    waveSpeed: 1.0,
  },
  neutral: {
    shallowColor: '#64748b',
    deepColor: '#1e293b',
    foamColor: '#94a3b8',
    opacity: 0.75,
    waveHeight: 0.12,
    waveSpeed: 0.9,
  },
}

// ============================================================================
// CONFIGURATION PRINCIPALE DU MONDE
// ============================================================================

export const WORLD_CONFIG: WorldConfig = {
  seed: 42,
  debug: false,

  layers: {
    terrain: { baseY: 0, enabled: true },
    water: { baseY: 0, enabled: true, offsetAboveTerrain: 0.1 },
    groundDecorations: { baseY: 0, enabled: true, offsetY: 0.05 },
    vegetation: { baseY: 0, enabled: true, offsetY: 0 },
    structures: { baseY: 0, enabled: true, offsetY: 0 },
  },

  hub: {
    center: [0, 0, 0],
    radius: 15,
    platformHeight: 0.5,
    colors: {
      primary: '#8b5cf6',
      secondary: '#a78bfa',
      ground: '#1e1b4b',
    },
  },

  biomes: [
    {
      id: 'nature',
      ...BIOME_PRESETS.nature,
      center: [-30, 0, -30],
      waterFeatures: ['nature-lake-main', 'nature-lake-small'],
    },
    {
      id: 'tech',
      ...BIOME_PRESETS.tech,
      center: [30, 0, -30],
      waterFeatures: ['tech-pool'],
    },
    {
      id: 'crypto',
      ...BIOME_PRESETS.crypto,
      center: [0, 0, 40],
      waterFeatures: ['crypto-lake-main', 'crypto-lake-small'],
    },
  ],

  waterFeatures: [
    // Hub central
    {
      id: 'hub-moat',
      type: 'moat',
      position: [0, 0, 0],
      yMode: 'absolute',
      offset: 0.1,
      innerRadius: 13,
      outerRadius: 17,
      colors: WATER_COLOR_PRESETS.hub,
      enabled: true,
    },
    {
      id: 'hub-fountain',
      type: 'fountain',
      position: [6, 0, -6],
      yMode: 'absolute',
      offset: 0.6,
      radius: 2.5,
      height: 4,
      colors: WATER_COLOR_PRESETS.hub,
      enabled: true,
    },

    // Nature biome
    {
      id: 'nature-lake-main',
      type: 'lake',
      position: [-45, 0, -45],
      yMode: 'terrainLowest',
      offset: 0.15,
      radius: 8,
      colors: WATER_COLOR_PRESETS.nature,
      enabled: true,
    },
    {
      id: 'nature-lake-small',
      type: 'pond',
      position: [-20, 0, -50],
      yMode: 'terrainLowest',
      offset: 0.12,
      radius: 5,
      colors: WATER_COLOR_PRESETS.nature,
      enabled: true,
    },

    // Tech biome
    {
      id: 'tech-pool',
      type: 'lake',
      position: [50, 0, -45],
      yMode: 'terrainLowest',
      offset: 0.12,
      radius: 6,
      colors: WATER_COLOR_PRESETS.tech,
      enabled: true,
    },

    // Crypto biome
    {
      id: 'crypto-lake-main',
      type: 'lake',
      position: [15, 0, 55],
      yMode: 'terrainLowest',
      offset: 0.15,
      radius: 7,
      colors: WATER_COLOR_PRESETS.crypto,
      enabled: true,
    },
    {
      id: 'crypto-lake-small',
      type: 'pond',
      position: [-15, 0, 60],
      yMode: 'terrainLowest',
      offset: 0.12,
      radius: 5,
      colors: WATER_COLOR_PRESETS.crypto,
      enabled: true,
    },

    // Points d'eau décoratifs entre biomes
    {
      id: 'neutral-pond-north',
      type: 'pond',
      position: [0, 0, -55],
      yMode: 'terrainLowest',
      offset: 0.1,
      radius: 4,
      colors: WATER_COLOR_PRESETS.neutral,
      enabled: true,
    },
    {
      id: 'neutral-pond-east',
      type: 'pond',
      position: [35, 0, 20],
      yMode: 'terrainLowest',
      offset: 0.1,
      radius: 4,
      colors: {
        ...WATER_COLOR_PRESETS.tech,
        shallowColor: '#818cf8',
      },
      enabled: true,
    },
    {
      id: 'neutral-pond-west',
      type: 'pond',
      position: [-25, 0, 25],
      yMode: 'terrainLowest',
      offset: 0.1,
      radius: 3.5,
      colors: {
        ...WATER_COLOR_PRESETS.nature,
        shallowColor: '#86efac',
      },
      enabled: true,
    },
  ],
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Récupère la configuration d'un biome par son ID
 */
export function getBiomeConfig(biomeId: string): BiomeConfig | undefined {
  return WORLD_CONFIG.biomes.find(b => b.id === biomeId)
}

/**
 * Récupère la configuration d'un water feature par son ID
 */
export function getWaterFeatureConfig(featureId: string): WaterFeatureConfig | undefined {
  return WORLD_CONFIG.waterFeatures.find(w => w.id === featureId)
}

/**
 * Récupère les water features d'un biome
 */
export function getBiomeWaterFeatures(biomeId: string): WaterFeatureConfig[] {
  const biome = getBiomeConfig(biomeId)
  if (!biome) return []
  return biome.waterFeatures
    .map(id => getWaterFeatureConfig(id))
    .filter((w): w is WaterFeatureConfig => w !== undefined)
}

/**
 * Crée une configuration de biome à partir d'un preset avec overrides
 */
export function createBiomeConfig(
  id: string,
  type: BiomeType,
  center: Position3D,
  overrides?: Partial<Omit<BiomeConfig, 'id' | 'center' | 'type'>>
): BiomeConfig {
  const preset = BIOME_PRESETS[type]
  return {
    id,
    type,
    center,
    ...preset,
    ...overrides,
    colors: { ...preset.colors, ...overrides?.colors },
    terrain: { ...preset.terrain, ...overrides?.terrain },
    vegetation: { ...preset.vegetation, ...overrides?.vegetation },
  }
}
