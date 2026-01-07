/**
 * Hooks React pour la generation de structures
 */

import { useMemo } from 'react'
import { StructureFactory, getStructureFactory } from '../StructureFactory'
import type { StructureGeneratorConfig, GeneratedStructure, StructureStyle } from '../types'

/**
 * Hook pour obtenir une instance de la factory de structures
 */
export function useStructureFactory(seed?: number): StructureFactory {
  return useMemo(() => getStructureFactory(seed), [seed])
}

/**
 * Hook pour generer une structure unique
 */
export function useGeneratedStructure(config: StructureGeneratorConfig): GeneratedStructure {
  const factory = useStructureFactory(config.seed)

  return useMemo(
    () => factory.generateStructure(config),
    [
      factory,
      config.seed,
      config.floors,
      config.width,
      config.depth,
      config.complexity,
      config.style,
      config.materialMix.wood,
      config.materialMix.stone,
      config.materialMix.glass,
    ]
  )
}

/**
 * Hook pour generer une structure a partir d'un preset de style
 */
export function useStyledStructure(style: StructureStyle, seed: number): GeneratedStructure {
  const factory = useStructureFactory(seed)

  return useMemo(() => factory.generateFromStyle(style, seed), [factory, style, seed])
}

/**
 * Hook pour generer plusieurs structures
 */
export function useStructureBatch(
  baseConfig: Omit<StructureGeneratorConfig, 'seed'>,
  count: number,
  baseSeed: number = 42
): GeneratedStructure[] {
  const factory = useStructureFactory(baseSeed)

  return useMemo(
    () => factory.generateBatch(baseConfig, count, baseSeed),
    [
      factory,
      count,
      baseSeed,
      baseConfig.floors,
      baseConfig.width,
      baseConfig.depth,
      baseConfig.complexity,
      baseConfig.style,
    ]
  )
}

/**
 * Hook pour le placement aleatoire de structures
 */
export function useRandomStructurePlacement(
  structures: GeneratedStructure[],
  areaSize: number,
  minDistance: number,
  seed: number
): Array<{
  structure: GeneratedStructure
  position: [number, number, number]
  rotation: number
}> {
  return useMemo(() => {
    // Placement base sur une grille simple pour eviter les chevauchements
    const placements: Array<{
      structure: GeneratedStructure
      position: [number, number, number]
      rotation: number
    }> = []

    let rng = seed
    const random = () => {
      rng = Math.sin(rng * 9999) * 10000
      return rng - Math.floor(rng)
    }

    const gridSize = Math.ceil(Math.sqrt(structures.length))
    const cellSize = areaSize / gridSize

    structures.forEach((structure, i) => {
      const gridX = i % gridSize
      const gridZ = Math.floor(i / gridSize)

      const baseX = (gridX - gridSize / 2) * cellSize
      const baseZ = (gridZ - gridSize / 2) * cellSize

      // Ajouter un peu d'aleatoire dans la cellule
      const offsetX = (random() - 0.5) * (cellSize - minDistance)
      const offsetZ = (random() - 0.5) * (cellSize - minDistance)

      placements.push({
        structure,
        position: [baseX + offsetX, 0, baseZ + offsetZ],
        rotation: random() * Math.PI * 2,
      })
    })

    return placements
  }, [structures, areaSize, minDistance, seed])
}
