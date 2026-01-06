/**
 * Configuration pour la génération procédurale
 */

export const CHUNK_CONFIG = {
  size: 32,              // 32×32 unités par chunk
  resolution: 64,        // 64×64 vertices (LOD max)
  viewDistance: 3,       // Chunks visibles: 7×7 grille
  unloadDistance: 5,     // Distance de déchargement
  totalChunks: 16,       // Grille 4×4 pour map 128×128
  heightScale: 10,       // Amplitude max du relief
} as const

export const LOD_LEVELS = [
  { distance: 0,   resolution: 64, decorations: true },   // LOD 0 - Proche
  { distance: 50,  resolution: 32, decorations: true },   // LOD 1 - Moyen
  { distance: 100, resolution: 16, decorations: false },  // LOD 2 - Loin
  { distance: 200, resolution: 8,  decorations: false },  // LOD 3 - Très loin
] as const

export const NOISE_CONFIG = {
  octaves: 4,
  persistence: 0.5,    // Réduction amplitude par octave
  lacunarity: 2.0,     // Augmentation fréquence par octave
  scale: 0.02,         // Échelle globale du bruit
} as const

export type BiomeType = 'tech' | 'nature' | 'crypto'

export const BIOME_TERRAIN_CONFIG: Record<BiomeType, {
  octaves: number
  persistence: number
  scale: number
  heightMultiplier: number
}> = {
  tech: {
    octaves: 2,
    persistence: 0.3,
    scale: 0.01,
    heightMultiplier: 0.5,  // Terrain plus plat, géométrique
  },
  nature: {
    octaves: 6,
    persistence: 0.5,
    scale: 0.03,
    heightMultiplier: 1.5,  // Terrain vallonné, organique
  },
  crypto: {
    octaves: 3,
    persistence: 0.4,
    scale: 0.02,
    heightMultiplier: 1.0,  // Terrain modéré avec pics
  },
}

export const DECORATION_DENSITY: Record<BiomeType, {
  minDistance: number
  maxObjects: number
}> = {
  tech: {
    minDistance: 4,
    maxObjects: 20,
  },
  nature: {
    minDistance: 2,
    maxObjects: 50,
  },
  crypto: {
    minDistance: 3,
    maxObjects: 30,
  },
}
