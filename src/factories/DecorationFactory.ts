/**
 * DecorationFactory - Factory pour placement de décorations height-aware
 *
 * Génère des positions de décorations qui respectent la hauteur du terrain.
 * Utilise le HeightmapService pour positionner les objets SUR le terrain.
 */

import * as THREE from 'three'
import { poissonDiscSamplingCircular } from '@utils/procedural'
import { getHeightmapService } from '@services/HeightmapService'

// ============================================================================
// TYPES
// ============================================================================

export type DecorationType =
  | 'tree'
  | 'rock'
  | 'mushroom'
  | 'crystal'
  | 'bush'
  | 'flower'
  | 'grass'
  | 'coin'
  | 'tech_structure'
  | 'generic'

export interface DecorationPlacement {
  /** Position 3D avec Y = hauteur terrain + offset */
  position: THREE.Vector3
  /** Rotation Y aléatoire */
  rotationY: number
  /** Échelle uniforme */
  scale: number
  /** Type de décoration */
  type: DecorationType
  /** Normale du terrain à cette position (pour alignement) */
  normal?: THREE.Vector3
  /** ID unique */
  id: string
}

export interface DecorationConfig {
  /** Type de décoration */
  type: DecorationType
  /** Nombre maximum d'instances */
  maxCount: number
  /** Distance minimale entre instances (pour Poisson disc) */
  minDistance: number
  /** Rayon de distribution (ratio du rayon du biome) */
  radiusRatio: number
  /** Offset Y au-dessus du terrain */
  heightOffset: number
  /** Échelle min */
  scaleMin: number
  /** Échelle max */
  scaleMax: number
  /** Aligner sur la normale du terrain */
  alignToNormal: boolean
  /** Zones à éviter (ex: eau) */
  avoidZones?: AvoidZone[]
}

export interface AvoidZone {
  center: THREE.Vector2
  radius: number
}

export interface DecorationFactoryConfig {
  /** Centre du biome dans l'espace monde */
  worldCenter: THREE.Vector3
  /** Rayon du biome */
  biomeRadius: number
  /** ID du biome */
  biomeId: string
  /** Seed pour la génération aléatoire */
  seed: number
  /** Types de décorations à générer */
  decorations: DecorationConfig[]
}

export interface DecorationBatch {
  type: DecorationType
  placements: DecorationPlacement[]
}

// ============================================================================
// PRESETS DE DÉCORATIONS
// ============================================================================

export const DECORATION_PRESETS: Record<string, DecorationConfig[]> = {
  nature: [
    {
      type: 'tree',
      maxCount: 15,
      minDistance: 4,
      radiusRatio: 0.7,
      heightOffset: 0,
      scaleMin: 0.8,
      scaleMax: 1.2,
      alignToNormal: false,
    },
    {
      type: 'rock',
      maxCount: 10,
      minDistance: 5,
      radiusRatio: 0.8,
      heightOffset: 0,
      scaleMin: 0.5,
      scaleMax: 1.3,
      alignToNormal: true,
    },
    {
      type: 'mushroom',
      maxCount: 20,
      minDistance: 2.5,
      radiusRatio: 0.6,
      heightOffset: 0,
      scaleMin: 0.4,
      scaleMax: 1.0,
      alignToNormal: false,
    },
    {
      type: 'bush',
      maxCount: 12,
      minDistance: 3,
      radiusRatio: 0.75,
      heightOffset: 0,
      scaleMin: 0.6,
      scaleMax: 1.1,
      alignToNormal: false,
    },
  ],
  tech: [
    {
      type: 'crystal',
      maxCount: 8,
      minDistance: 6,
      radiusRatio: 0.6,
      heightOffset: 0,
      scaleMin: 0.7,
      scaleMax: 1.5,
      alignToNormal: false,
    },
    {
      type: 'rock',
      maxCount: 6,
      minDistance: 7,
      radiusRatio: 0.7,
      heightOffset: 0,
      scaleMin: 0.6,
      scaleMax: 1.2,
      alignToNormal: true,
    },
    {
      type: 'tech_structure',
      maxCount: 4,
      minDistance: 8,
      radiusRatio: 0.5,
      heightOffset: 0.1,
      scaleMin: 0.8,
      scaleMax: 1.0,
      alignToNormal: false,
    },
  ],
  crypto: [
    {
      type: 'crystal',
      maxCount: 12,
      minDistance: 4,
      radiusRatio: 0.7,
      heightOffset: 0,
      scaleMin: 0.6,
      scaleMax: 1.3,
      alignToNormal: false,
    },
    {
      type: 'rock',
      maxCount: 8,
      minDistance: 5,
      radiusRatio: 0.75,
      heightOffset: 0,
      scaleMin: 0.5,
      scaleMax: 1.1,
      alignToNormal: true,
    },
    {
      type: 'coin',
      maxCount: 15,
      minDistance: 3,
      radiusRatio: 0.6,
      heightOffset: 0.5,
      scaleMin: 0.8,
      scaleMax: 1.2,
      alignToNormal: false,
    },
  ],
}

// ============================================================================
// DECORATION FACTORY
// ============================================================================

export class DecorationFactory {
  private seed: number
  private rng: () => number

  constructor(seed: number = 42) {
    this.seed = seed
    this.rng = this.createSeededRandom(seed)
  }

  /**
   * Génère tous les placements de décorations pour un biome
   */
  generateBiomeDecorations(config: DecorationFactoryConfig): DecorationBatch[] {
    const batches: DecorationBatch[] = []
    const heightService = getHeightmapService()

    for (const decoConfig of config.decorations) {
      // Réinitialiser le RNG pour chaque type avec un offset
      this.rng = this.createSeededRandom(config.seed + this.hashString(decoConfig.type))

      const placements = this.generatePlacements(
        decoConfig,
        config.worldCenter,
        config.biomeRadius,
        config.biomeId,
        heightService
      )

      batches.push({
        type: decoConfig.type,
        placements,
      })
    }

    return batches
  }

  /**
   * Génère les placements pour un type de décoration
   */
  private generatePlacements(
    config: DecorationConfig,
    worldCenter: THREE.Vector3,
    biomeRadius: number,
    biomeId: string,
    heightService: ReturnType<typeof getHeightmapService>
  ): DecorationPlacement[] {
    const placements: DecorationPlacement[] = []

    // Générer positions 2D avec Poisson disc
    const effectiveRadius = biomeRadius * config.radiusRatio
    const positions2D = poissonDiscSamplingCircular(
      0, // Centre local
      0,
      effectiveRadius,
      config.minDistance,
      this.seed + this.hashString(config.type)
    )

    // Limiter au nombre max
    const limitedPositions = positions2D.slice(0, config.maxCount)

    for (let i = 0; i < limitedPositions.length; i++) {
      const pos2D = limitedPositions[i]
      if (!pos2D) continue

      // Convertir en coordonnées monde
      const worldX = worldCenter.x + pos2D.x
      const worldZ = worldCenter.z + pos2D.y

      // Vérifier les zones à éviter
      if (config.avoidZones && this.isInAvoidZone(pos2D, config.avoidZones)) {
        continue
      }

      // Requête hauteur terrain
      let terrainHeight: number
      let normal: THREE.Vector3 | undefined

      if (config.alignToNormal) {
        const result = heightService.queryHeightWithNormal(worldX, worldZ, biomeId)
        terrainHeight = result.height
        normal = result.normal
      } else {
        terrainHeight = heightService.queryHeight(worldX, worldZ, biomeId)
      }

      // Calculer la position finale avec offset
      const finalY = terrainHeight + config.heightOffset

      // Générer variations
      const scale = config.scaleMin + this.rng() * (config.scaleMax - config.scaleMin)
      const rotationY = this.rng() * Math.PI * 2

      placements.push({
        position: new THREE.Vector3(worldX, finalY, worldZ),
        rotationY,
        scale,
        type: config.type,
        normal,
        id: `${config.type}-${biomeId}-${i}`,
      })
    }

    return placements
  }

  /**
   * Génère des décorations à partir d'un preset
   */
  generateFromPreset(
    presetName: string,
    worldCenter: THREE.Vector3,
    biomeRadius: number,
    biomeId: string,
    seed: number
  ): DecorationBatch[] {
    const preset = DECORATION_PRESETS[presetName]
    if (!preset) {
      console.warn(`[DecorationFactory] Unknown preset: ${presetName}`)
      return []
    }

    return this.generateBiomeDecorations({
      worldCenter,
      biomeRadius,
      biomeId,
      seed,
      decorations: preset,
    })
  }

  /**
   * Convertit les placements en positions Vector2 pour compatibilité
   * avec les composants existants
   */
  static toVector2Array(placements: DecorationPlacement[], worldCenter: THREE.Vector3): THREE.Vector2[] {
    return placements.map(
      (p) => new THREE.Vector2(p.position.x - worldCenter.x, p.position.z - worldCenter.z)
    )
  }

  /**
   * Vérifie si une position est dans une zone à éviter
   */
  private isInAvoidZone(position: THREE.Vector2, zones: AvoidZone[]): boolean {
    for (const zone of zones) {
      const dx = position.x - zone.center.x
      const dy = position.y - zone.center.y
      if (dx * dx + dy * dy < zone.radius * zone.radius) {
        return true
      }
    }
    return false
  }

  /**
   * Crée un générateur pseudo-aléatoire avec seed
   */
  private createSeededRandom(seed: number): () => number {
    let s = seed
    return () => {
      s = Math.sin(s * 9999) * 10000
      return s - Math.floor(s)
    }
  }

  /**
   * Hash simple pour string -> number
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
// SINGLETON & HOOKS
// ============================================================================

let decorationFactoryInstance: DecorationFactory | null = null

export function getDecorationFactory(seed?: number): DecorationFactory {
  if (!decorationFactoryInstance) {
    decorationFactoryInstance = new DecorationFactory(seed ?? 42)
  }
  return decorationFactoryInstance
}

export function resetDecorationFactory(): void {
  decorationFactoryInstance = null
}

// ============================================================================
// REACT HOOK
// ============================================================================

import { useMemo } from 'react'
import { useWorldStore } from '@stores/worldStore'

/**
 * Hook pour générer les décorations d'un biome
 */
export function useBiomeDecorations(
  biomeId: string,
  biomeType: string,
  worldCenter: [number, number, number],
  radius: number
): DecorationBatch[] {
  const seed = useWorldStore((state) => state.seed)

  return useMemo(() => {
    const factory = getDecorationFactory(seed)
    const center = new THREE.Vector3(worldCenter[0], worldCenter[1], worldCenter[2])

    return factory.generateFromPreset(biomeType, center, radius, biomeId, seed)
  }, [biomeId, biomeType, worldCenter, radius, seed])
}

/**
 * Hook pour obtenir les positions avec hauteur terrain pour un type de décoration
 */
export function useDecorationPositions(
  placements: DecorationPlacement[]
): {
  positions: THREE.Vector3[]
  rotations: number[]
  scales: number[]
  normals: (THREE.Vector3 | undefined)[]
} {
  return useMemo(() => ({
    positions: placements.map((p) => p.position),
    rotations: placements.map((p) => p.rotationY),
    scales: placements.map((p) => p.scale),
    normals: placements.map((p) => p.normal),
  }), [placements])
}
