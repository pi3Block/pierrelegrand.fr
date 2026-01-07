/**
 * StructureFactory - Generation procedurale de structures style Angry Birds
 *
 * Genere des batiments aleatoires mais structurellement plausibles bases sur:
 * - Nombre d'etages (1-4)
 * - Configuration largeur/profondeur
 * - Distribution des materiaux (bois/pierre/verre)
 * - Niveau de complexite
 * - Seed aleatoire pour reproductibilite
 */

import type {
  StructureGeneratorConfig,
  StructureDefinition,
  BlockDefinition,
  GeneratedStructure,
  MaterialMix,
  StructureStyle,
  FloorConfig,
  PatternType,
} from './types'
import type { MaterialType } from './DestructibleStructure'
import { generatePattern } from './patterns'

// ============================================================================
// GENERATEUR ALEATOIRE AVEC SEED
// ============================================================================

function createSeededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = Math.sin(s * 9999) * 10000
    return s - Math.floor(s)
  }
}

// ============================================================================
// SELECTION DE MATERIAUX
// ============================================================================

/**
 * Selectionne un materiau base sur les ratios de mix et une valeur aleatoire
 */
function selectMaterial(mix: MaterialMix, rng: () => number): MaterialType {
  const total = mix.wood + mix.stone + mix.glass
  const normalized = {
    wood: mix.wood / total,
    stone: mix.stone / total,
    glass: mix.glass / total,
  }

  const roll = rng()
  if (roll < normalized.stone) return 'stone'
  if (roll < normalized.stone + normalized.wood) return 'wood'
  return 'glass'
}

/**
 * Obtient un materiau approprie pour l'etage (pierre en bas, materiaux legers en haut)
 */
function getFloorMaterial(
  floorIndex: number,
  totalFloors: number,
  mix: MaterialMix,
  rng: () => number
): MaterialType {
  const heightRatio = floorIndex / Math.max(1, totalFloors - 1)

  // Biais vers la pierre pour les etages inferieurs
  if (heightRatio < 0.3) {
    const adjustedMix: MaterialMix = {
      stone: mix.stone * 2,
      wood: mix.wood,
      glass: mix.glass * 0.3,
    }
    return selectMaterial(adjustedMix, rng)
  }

  // Biais vers les materiaux legers pour les etages superieurs
  if (heightRatio > 0.7) {
    const adjustedMix: MaterialMix = {
      stone: mix.stone * 0.3,
      wood: mix.wood * 1.5,
      glass: mix.glass * 2,
    }
    return selectMaterial(adjustedMix, rng)
  }

  return selectMaterial(mix, rng)
}

// ============================================================================
// PRESETS DE STYLES
// ============================================================================

const STYLE_CONFIGS: Record<StructureStyle, Partial<StructureGeneratorConfig>> = {
  tower: {
    floors: 3,
    width: 2,
    depth: 2,
    taperRatio: 0.9,
    materialMix: { wood: 0.5, stone: 0.3, glass: 0.2 },
  },
  house: {
    floors: 2,
    width: 4,
    depth: 3,
    taperRatio: 1.0,
    materialMix: { wood: 0.6, stone: 0.3, glass: 0.1 },
  },
  castle: {
    floors: 3,
    width: 5,
    depth: 4,
    taperRatio: 0.95,
    materialMix: { wood: 0.2, stone: 0.7, glass: 0.1 },
  },
  fortress: {
    floors: 2,
    width: 6,
    depth: 4,
    taperRatio: 1.0,
    materialMix: { wood: 0.1, stone: 0.85, glass: 0.05 },
  },
  scaffold: {
    floors: 4,
    width: 3,
    depth: 2,
    taperRatio: 1.0,
    materialMix: { wood: 0.9, stone: 0.05, glass: 0.05 },
  },
  l_shape: {
    floors: 2,
    width: 4,
    depth: 4,
    taperRatio: 1.0,
    materialMix: { wood: 0.5, stone: 0.4, glass: 0.1 },
  },
  u_shape: {
    floors: 2,
    width: 5,
    depth: 3,
    taperRatio: 1.0,
    materialMix: { wood: 0.4, stone: 0.4, glass: 0.2 },
  },
  pyramid: {
    floors: 4,
    width: 4,
    depth: 4,
    taperRatio: 0.7,
    materialMix: { wood: 0.3, stone: 0.6, glass: 0.1 },
  },
  random: {
    materialMix: { wood: 0.4, stone: 0.4, glass: 0.2 },
  },
}

// ============================================================================
// SELECTION DE PATTERNS
// ============================================================================

const COMPLEXITY_PATTERNS: Record<string, PatternType[]> = {
  simple: ['frame', 'stack'],
  medium: ['frame', 'stack', 'hollow', 'solid'],
  complex: ['frame', 'stack', 'hollow', 'diagonal', 'triangle', 'solid'],
}

function selectPattern(complexity: string, rng: () => number): PatternType {
  const patterns = COMPLEXITY_PATTERNS[complexity] || COMPLEXITY_PATTERNS.simple
  if (!patterns || patterns.length === 0) {
    return 'frame'
  }
  return patterns[Math.floor(rng() * patterns.length)] as PatternType
}

// ============================================================================
// GENERATION D'ETAGES
// ============================================================================

function generateFloorConfig(
  index: number,
  config: StructureGeneratorConfig,
  rng: () => number
): FloorConfig {
  // STABILITE: Les etages du bas sont PLUS LARGES que ceux du haut
  // taperRatio < 1 signifie que les etages superieurs sont plus petits
  const taperRatio = config.taperRatio ?? 0.85
  // Inverser l'index pour que la base soit plus large
  const invertedIndex = config.floors - 1 - index
  const taperFactor = Math.pow(taperRatio, invertedIndex)
  const floorHeight = config.floorHeight ?? 1.2

  const structureMaterial = getFloorMaterial(index, config.floors, config.materialMix, rng)

  return {
    index,
    height: floorHeight,
    // La base est 1.0, les etages superieurs se retrecissent
    width: config.width * taperFactor,
    depth: config.depth * taperFactor,
    structureMaterial,
    leftPattern: selectPattern(config.complexity, rng),
    rightPattern: selectPattern(config.complexity, rng),
    frontPattern: selectPattern(config.complexity, rng),
    backPattern: rng() > 0.5 ? selectPattern(config.complexity, rng) : undefined,
    hasFloorPlatform: index > 0,
    hasCeiling: index === config.floors - 1,
    decorations: rng() > 0.6 ? ['glass'] : undefined,
  }
}

function generateFloorBlocks(
  floorConfig: FloorConfig,
  baseY: number,
  rng: () => number
): BlockDefinition[] {
  const blocks: BlockDefinition[] = []
  const { width, depth, height, structureMaterial } = floorConfig

  // Generer les piliers aux coins
  const pillarPositions: [number, number][] = [
    [-width / 2, -depth / 2],
    [width / 2, -depth / 2],
    [-width / 2, depth / 2],
    [width / 2, depth / 2],
  ]

  for (const [x, z] of pillarPositions) {
    blocks.push({
      position: [x, baseY + height / 2, z],
      size: [0.3, height, 0.3],
      material: structureMaterial,
      colorVariation: rng() - 0.5,
    })
  }

  // Generer le pattern du mur avant
  if (floorConfig.frontPattern) {
    const patternBlocks = generatePattern(
      {
        type: floorConfig.frontPattern,
        width: width - 0.6,
        height: height,
        material: structureMaterial,
      },
      rng
    )

    // Transformer vers la position du mur avant
    for (const block of patternBlocks) {
      blocks.push({
        ...block,
        position: [block.position[0], block.position[1] + baseY, -depth / 2],
      })
    }
  }

  // Generer le pattern du mur arriere
  if (floorConfig.backPattern) {
    const patternBlocks = generatePattern(
      {
        type: floorConfig.backPattern,
        width: width - 0.6,
        height: height,
        material: structureMaterial,
      },
      rng
    )

    for (const block of patternBlocks) {
      blocks.push({
        ...block,
        position: [block.position[0], block.position[1] + baseY, depth / 2],
      })
    }
  }

  // Generer le pattern du mur gauche
  if (floorConfig.leftPattern) {
    const patternBlocks = generatePattern(
      {
        type: floorConfig.leftPattern,
        width: depth - 0.6,
        height: height,
        material: structureMaterial,
      },
      rng
    )

    for (const block of patternBlocks) {
      blocks.push({
        ...block,
        position: [-width / 2, block.position[1] + baseY, block.position[0]],
        rotation: [0, Math.PI / 2, block.rotation?.[2] ?? 0],
      })
    }
  }

  // Generer le pattern du mur droit
  if (floorConfig.rightPattern) {
    const patternBlocks = generatePattern(
      {
        type: floorConfig.rightPattern,
        width: depth - 0.6,
        height: height,
        material: structureMaterial,
      },
      rng
    )

    for (const block of patternBlocks) {
      blocks.push({
        ...block,
        position: [width / 2, block.position[1] + baseY, block.position[0]],
        rotation: [0, Math.PI / 2, block.rotation?.[2] ?? 0],
      })
    }
  }

  // Generer la plateforme de sol
  if (floorConfig.hasFloorPlatform) {
    const platformMaterial = rng() > 0.5 ? 'wood' : structureMaterial

    // Planches de sol traversantes
    const numPlanks = Math.ceil(depth / 0.4)
    for (let i = 0; i < numPlanks; i++) {
      const z = -depth / 2 + 0.2 + i * (depth / numPlanks)
      blocks.push({
        position: [0, baseY, z],
        size: [width, 0.15, 0.35],
        material: platformMaterial,
        colorVariation: rng() - 0.5,
      })
    }
  }

  // Generer le plafond/toit
  if (floorConfig.hasCeiling) {
    const roofY = baseY + height

    // Toit plat simple avec planches
    const numPlanks = Math.ceil(depth / 0.4)
    for (let i = 0; i < numPlanks; i++) {
      const z = -depth / 2 + 0.2 + i * (depth / numPlanks)
      blocks.push({
        position: [0, roofY, z],
        size: [width + 0.3, 0.15, 0.35],
        material: 'wood',
        colorVariation: rng() - 0.5,
      })
    }

    // Chapeau de toit
    blocks.push({
      position: [0, roofY + 0.2, 0],
      size: [width * 0.5, 0.25, depth * 0.5],
      material: 'stone',
      colorVariation: rng() - 0.5,
    })
  }

  // Ajouter des decorations (blocs de verre)
  if (floorConfig.decorations?.includes('glass')) {
    // Ajouter un bloc de verre au centre de l'etage
    if (rng() > 0.4) {
      blocks.push({
        position: [0, baseY + height * 0.4, 0],
        size: [0.5, 0.5, 0.15],
        material: 'glass',
        colorVariation: rng() - 0.5,
      })
    }
  }

  return blocks
}

// ============================================================================
// CLASSE FACTORY PRINCIPALE
// ============================================================================

export class StructureFactory {
  private rng: () => number

  constructor(seed: number = 42) {
    this.rng = createSeededRandom(seed)
  }

  /**
   * Genere une structure avec la configuration donnee
   */
  generateStructure(config: StructureGeneratorConfig): GeneratedStructure {
    // Reinitialiser le RNG pour des resultats coherents
    this.rng = createSeededRandom(config.seed)

    // Fusionner les valeurs par defaut du style avec la config fournie
    const styleDefaults = config.style ? STYLE_CONFIGS[config.style] : {}
    const finalConfig: StructureGeneratorConfig = {
      ...styleDefaults,
      ...config,
      materialMix: {
        ...styleDefaults.materialMix,
        ...config.materialMix,
      },
    }

    // Limiter les etages a 1-4
    finalConfig.floors = Math.max(1, Math.min(4, finalConfig.floors))

    const blocks: BlockDefinition[] = []
    const floorHeight = finalConfig.floorHeight ?? 1.2

    // FONDATION SOLIDE EN PIERRE - Toujours ajouter une base stable FIXE
    const baseWidth = finalConfig.width * 1.2 // Base 20% plus large
    const baseDepth = finalConfig.depth * 1.2

    // Bloc de fondation massif - FIXE au sol
    blocks.push({
      position: [0, 0.15, 0],
      size: [baseWidth, 0.3, baseDepth],
      material: 'stone',
      colorVariation: this.rng() - 0.5,
      isFoundation: true, // Ne bouge jamais
    })

    // Piliers de fondation aux coins - FIXES au sol
    const foundationPillarPositions: [number, number][] = [
      [-baseWidth / 2 + 0.2, -baseDepth / 2 + 0.2],
      [baseWidth / 2 - 0.2, -baseDepth / 2 + 0.2],
      [-baseWidth / 2 + 0.2, baseDepth / 2 - 0.2],
      [baseWidth / 2 - 0.2, baseDepth / 2 - 0.2],
    ]

    for (const [x, z] of foundationPillarPositions) {
      blocks.push({
        position: [x, 0.5, z],
        size: [0.4, 0.7, 0.4],
        material: 'stone',
        colorVariation: this.rng() - 0.5,
        isFoundation: true, // Ne bouge jamais
      })
    }

    let currentY = 0.85 // Commencer au-dessus de la fondation

    // Generer chaque etage
    for (let i = 0; i < finalConfig.floors; i++) {
      const floorConfig = generateFloorConfig(i, finalConfig, this.rng)
      const floorBlocks = generateFloorBlocks(floorConfig, currentY, this.rng)
      blocks.push(...floorBlocks)
      currentY += floorHeight
    }

    // Calculer la bounding box
    let maxX = 0,
      maxY = 0,
      maxZ = 0
    for (const block of blocks) {
      maxX = Math.max(maxX, Math.abs(block.position[0]) + block.size[0] / 2)
      maxY = Math.max(maxY, block.position[1] + block.size[1] / 2)
      maxZ = Math.max(maxZ, Math.abs(block.position[2]) + block.size[2] / 2)
    }

    const definition: StructureDefinition = {
      id: `generated-${config.seed}-${Date.now()}`,
      name: `${finalConfig.style || 'Custom'} Structure`,
      blocks,
      boundingBox: [maxX * 2, maxY, maxZ * 2],
    }

    // Calculer la masse estimee
    let totalMass = 0
    const MASS_TABLE: Record<MaterialType, number> = { wood: 0.15, glass: 0.1, stone: 0.8 }
    for (const block of blocks) {
      const volume = block.size[0] * block.size[1] * block.size[2]
      totalMass += volume * MASS_TABLE[block.material]
    }

    return {
      definition,
      metadata: {
        seed: config.seed,
        style: finalConfig.style || 'random',
        blockCount: blocks.length,
        estimatedMass: totalMass,
      },
    }
  }

  /**
   * Genere plusieurs structures avec des seeds differentes
   */
  generateBatch(
    baseConfig: Omit<StructureGeneratorConfig, 'seed'>,
    count: number,
    baseSeed: number = 42
  ): GeneratedStructure[] {
    return Array.from({ length: count }, (_, i) =>
      this.generateStructure({
        ...baseConfig,
        seed: baseSeed + i * 1000,
      })
    )
  }

  /**
   * Genere une structure a partir d'un preset de style
   */
  generateFromStyle(style: StructureStyle, seed: number): GeneratedStructure {
    const styleConfig = STYLE_CONFIGS[style]
    return this.generateStructure({
      floors: 2,
      width: 3,
      depth: 2,
      complexity: 'medium',
      seed,
      materialMix: { wood: 0.4, stone: 0.4, glass: 0.2 },
      ...styleConfig,
      style,
    })
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let factoryInstance: StructureFactory | null = null

export function getStructureFactory(seed?: number): StructureFactory {
  if (!factoryInstance) {
    factoryInstance = new StructureFactory(seed ?? 42)
  }
  return factoryInstance
}

export function resetStructureFactory(): void {
  factoryInstance = null
}
