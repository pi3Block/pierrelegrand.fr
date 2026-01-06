/**
 * Système de blending entre biomes
 * Calcule les transitions douces entre différentes zones
 */

import * as THREE from 'three'
import type { BiomeType } from '@/config/proceduralConfig'

export interface BiomeDefinition {
  type: BiomeType
  center: THREE.Vector3
  radius: number
  transitionWidth?: number // Largeur de la zone de transition (default: 20% du rayon)
}

export interface BiomeInfluence {
  type: BiomeType
  weight: number
}

/**
 * Calcule l'influence de chaque biome à une position donnée
 * Retourne un tableau trié par influence décroissante
 */
export function calculateBiomeInfluences(
  position: THREE.Vector3,
  biomes: BiomeDefinition[]
): BiomeInfluence[] {
  const influences: BiomeInfluence[] = []

  for (const biome of biomes) {
    const distance = position.distanceTo(biome.center)
    const transitionWidth = biome.transitionWidth ?? biome.radius * 0.2

    const innerRadius = biome.radius - transitionWidth
    const outerRadius = biome.radius + transitionWidth

    let weight: number
    if (distance <= innerRadius) {
      weight = 1.0
    } else if (distance >= outerRadius) {
      weight = 0.0
    } else {
      // Smoothstep pour transition douce
      const t = (distance - innerRadius) / (outerRadius - innerRadius)
      weight = 1.0 - smoothstep(t)
    }

    if (weight > 0.001) {
      influences.push({ type: biome.type, weight })
    }
  }

  // Trier par poids décroissant
  influences.sort((a, b) => b.weight - a.weight)

  // Normaliser les poids pour que leur somme = 1
  const totalWeight = influences.reduce((sum, inf) => sum + inf.weight, 0)
  if (totalWeight > 0) {
    for (const inf of influences) {
      inf.weight /= totalWeight
    }
  }

  return influences
}

/**
 * Smoothstep standard (t entre 0 et 1)
 */
function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

/**
 * Smootherstep (Ken Perlin) - transition encore plus douce
 */
export function smootherstep(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x * x * x * (x * (x * 6 - 15) + 10)
}

/**
 * Retourne le biome dominant à une position
 */
export function getDominantBiome(
  position: THREE.Vector3,
  biomes: BiomeDefinition[]
): BiomeType | null {
  const influences = calculateBiomeInfluences(position, biomes)
  return influences[0]?.type ?? null
}

/**
 * Vérifie si une position est dans une zone de transition
 */
export function isInTransitionZone(
  position: THREE.Vector3,
  biomes: BiomeDefinition[],
  threshold: number = 0.1
): boolean {
  const influences = calculateBiomeInfluences(position, biomes)

  // Si au moins 2 biomes ont une influence significative
  if (influences.length >= 2) {
    const second = influences[1]
    return second !== undefined && second.weight > threshold
  }

  return false
}

/**
 * Interpole une couleur entre plusieurs biomes selon leurs influences
 */
export function blendBiomeColors(
  influences: BiomeInfluence[],
  colorMap: Record<BiomeType, THREE.Color>
): THREE.Color {
  const result = new THREE.Color(0, 0, 0)

  for (const inf of influences) {
    const color = colorMap[inf.type]
    if (color) {
      result.r += color.r * inf.weight
      result.g += color.g * inf.weight
      result.b += color.b * inf.weight
    }
  }

  return result
}

/**
 * Interpole une valeur numérique entre plusieurs biomes
 */
export function blendBiomeValues(
  influences: BiomeInfluence[],
  valueMap: Record<BiomeType, number>
): number {
  let result = 0

  for (const inf of influences) {
    const value = valueMap[inf.type]
    if (value !== undefined) {
      result += value * inf.weight
    }
  }

  return result
}

/**
 * Crée une fonction de sampling de hauteur avec blending entre biomes
 */
export function createBlendedHeightSampler(
  biomes: BiomeDefinition[],
  heightSamplers: Record<BiomeType, (x: number, z: number) => number>
): (x: number, z: number) => number {
  return (x: number, z: number): number => {
    const pos = new THREE.Vector3(x, 0, z)
    const influences = calculateBiomeInfluences(pos, biomes)

    let height = 0
    for (const inf of influences) {
      const sampler = heightSamplers[inf.type]
      if (sampler) {
        height += sampler(x, z) * inf.weight
      }
    }

    return height
  }
}

/**
 * Calcule le facteur de densité de végétation selon la distance au bord du biome
 * Réduit la densité près des bords pour une transition plus naturelle
 */
export function getVegetationDensityFactor(
  position: THREE.Vector3,
  biome: BiomeDefinition
): number {
  const distance = position.distanceTo(biome.center)
  const normalizedDist = distance / biome.radius

  // Densité maximale au centre, diminue vers les bords
  if (normalizedDist <= 0.6) return 1.0
  if (normalizedDist >= 1.0) return 0.0

  // Transition douce entre 60% et 100% du rayon
  const t = (normalizedDist - 0.6) / 0.4
  return 1.0 - smoothstep(t)
}

/**
 * Génère des points de placement avec densité variable selon le biome
 */
export function generateBiomeAwarePlacements(
  biome: BiomeDefinition,
  basePositions: THREE.Vector2[],
  minDensityFactor: number = 0.3
): THREE.Vector2[] {
  return basePositions.filter(pos => {
    const pos3d = new THREE.Vector3(
      pos.x + biome.center.x,
      0,
      pos.y + biome.center.z
    )
    const densityFactor = getVegetationDensityFactor(pos3d, biome)

    // Garder le point selon la densité (avec minimum garanti)
    return Math.random() < Math.max(densityFactor, minDensityFactor)
  })
}
