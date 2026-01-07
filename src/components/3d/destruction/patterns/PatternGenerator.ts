/**
 * PatternGenerator - Cree des arrangements de blocs pour les patterns de construction
 * Chaque pattern genere des blocs relatifs a une origine locale (0,0,0)
 */

import type { BlockDefinition, PatternConfig } from '../types'

// Constantes pour les tailles de blocs typiques Angry Birds
const PLANK_HEIGHT = 0.15
const PLANK_DEPTH = 0.15
const BEAM_WIDTH = 0.2
const BLOCK_SIZE = 0.5

/**
 * Genere un pattern de cadre (piliers avec poutres horizontales)
 * Cree des ouvertures adaptees pour fenetres/portes
 */
export function generateFramePattern(
  config: PatternConfig,
  rng: () => number
): BlockDefinition[] {
  const blocks: BlockDefinition[] = []
  const { width, height, material, openingRatio = 0.6 } = config

  const pillarSpacing = width * openingRatio
  const numPillars = Math.max(2, Math.ceil(width / pillarSpacing) + 1)
  const actualSpacing = width / (numPillars - 1)

  // Generer les piliers verticaux
  for (let i = 0; i < numPillars; i++) {
    const x = -width / 2 + i * actualSpacing
    blocks.push({
      position: [x, height / 2, 0],
      size: [BEAM_WIDTH, height, BEAM_WIDTH],
      material,
      colorVariation: rng() - 0.5,
    })
  }

  // Generer les poutres horizontales en haut et en bas
  const beamLength = width + BEAM_WIDTH
  blocks.push({
    position: [0, PLANK_HEIGHT / 2, 0],
    size: [beamLength, PLANK_HEIGHT, PLANK_DEPTH],
    material,
    colorVariation: rng() - 0.5,
  })
  blocks.push({
    position: [0, height - PLANK_HEIGHT / 2, 0],
    size: [beamLength, PLANK_HEIGHT, PLANK_DEPTH],
    material,
    colorVariation: rng() - 0.5,
  })

  // Ajouter une poutre a mi-hauteur pour les cadres plus grands
  if (height > 1.5) {
    blocks.push({
      position: [0, height * 0.5, 0],
      size: [beamLength, PLANK_HEIGHT, PLANK_DEPTH],
      material,
      colorVariation: rng() - 0.5,
    })
  }

  return blocks
}

/**
 * Genere un pattern de blocs empiles (style briques)
 * Optionnellement decale pour la stabilite structurelle
 */
export function generateStackPattern(
  config: PatternConfig,
  rng: () => number
): BlockDefinition[] {
  const blocks: BlockDefinition[] = []
  const { width, height, material, staggered = true } = config

  const blockWidth = BLOCK_SIZE
  const blockHeight = BLOCK_SIZE * 0.6
  const blocksPerRow = Math.ceil(width / blockWidth)
  const numRows = Math.ceil(height / blockHeight)

  for (let row = 0; row < numRows; row++) {
    const y = row * blockHeight + blockHeight / 2
    const offset = staggered && row % 2 === 1 ? blockWidth / 2 : 0

    for (let col = 0; col < blocksPerRow; col++) {
      const x = -width / 2 + col * blockWidth + offset + blockWidth / 2

      // Sauter si hors limites a cause du decalage
      if (x < -width / 2 - 0.1 || x > width / 2 + 0.1) continue

      blocks.push({
        position: [x, y, 0],
        size: [blockWidth * 0.95, blockHeight * 0.95, BLOCK_SIZE * 0.4],
        material,
        colorVariation: rng() - 0.5,
      })
    }
  }

  return blocks
}

/**
 * Genere un pattern triangulaire/toit
 * Utile pour les sommets de structures
 */
export function generateTrianglePattern(
  config: PatternConfig,
  rng: () => number
): BlockDefinition[] {
  const blocks: BlockDefinition[] = []
  const { width, height, material } = config

  const numLevels = Math.ceil(height / PLANK_HEIGHT)
  const shrinkPerLevel = width / numLevels

  for (let level = 0; level < numLevels; level++) {
    const y = level * PLANK_HEIGHT + PLANK_HEIGHT / 2
    const currentWidth = width - level * shrinkPerLevel

    if (currentWidth < PLANK_HEIGHT) break

    blocks.push({
      position: [0, y, 0],
      size: [currentWidth, PLANK_HEIGHT, PLANK_DEPTH],
      material,
      colorVariation: rng() - 0.5,
    })
  }

  return blocks
}

/**
 * Genere un pattern de supports diagonaux
 * Contreventement en croix pour l'interet structurel
 */
export function generateDiagonalPattern(
  config: PatternConfig,
  rng: () => number
): BlockDefinition[] {
  const blocks: BlockDefinition[] = []
  const { width, height, material } = config

  const diagonalLength = Math.sqrt(width * width + height * height)
  const angle = Math.atan2(height, width)

  // Diagonale gauche-droite
  blocks.push({
    position: [0, height / 2, 0],
    size: [diagonalLength, PLANK_HEIGHT, PLANK_DEPTH],
    material,
    rotation: [0, 0, angle],
    colorVariation: rng() - 0.5,
  })

  // Diagonale droite-gauche (pattern X)
  blocks.push({
    position: [0, height / 2, 0],
    size: [diagonalLength, PLANK_HEIGHT, PLANK_DEPTH],
    material,
    rotation: [0, 0, -angle],
    colorVariation: rng() - 0.5,
  })

  return blocks
}

/**
 * Genere un pattern de mur plein
 * Arrangement dense de blocs
 */
export function generateSolidPattern(
  config: PatternConfig,
  rng: () => number
): BlockDefinition[] {
  const blocks: BlockDefinition[] = []
  const { width, height, material } = config

  // Utiliser des blocs plus grands pour les murs pleins
  const blockW = 0.6
  const blockH = 0.4

  const cols = Math.ceil(width / blockW)
  const rows = Math.ceil(height / blockH)

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      blocks.push({
        position: [-width / 2 + col * blockW + blockW / 2, row * blockH + blockH / 2, 0],
        size: [blockW * 0.95, blockH * 0.95, 0.35],
        material,
        colorVariation: rng() - 0.5,
      })
    }
  }

  return blocks
}

/**
 * Genere un pattern creux (cadre avec centre vide)
 * Bon pour les fenetres ou ouvertures
 */
export function generateHollowPattern(
  config: PatternConfig,
  rng: () => number
): BlockDefinition[] {
  const blocks: BlockDefinition[] = []
  const { width, height, material } = config

  const frameThickness = 0.3

  // Poutre du bas
  blocks.push({
    position: [0, frameThickness / 2, 0],
    size: [width, frameThickness, PLANK_DEPTH],
    material,
    colorVariation: rng() - 0.5,
  })

  // Poutre du haut
  blocks.push({
    position: [0, height - frameThickness / 2, 0],
    size: [width, frameThickness, PLANK_DEPTH],
    material,
    colorVariation: rng() - 0.5,
  })

  // Pilier gauche
  blocks.push({
    position: [-width / 2 + frameThickness / 2, height / 2, 0],
    size: [frameThickness, height - frameThickness * 2, BEAM_WIDTH],
    material,
    colorVariation: rng() - 0.5,
  })

  // Pilier droit
  blocks.push({
    position: [width / 2 - frameThickness / 2, height / 2, 0],
    size: [frameThickness, height - frameThickness * 2, BEAM_WIDTH],
    material,
    colorVariation: rng() - 0.5,
  })

  return blocks
}

/**
 * Dispatcher principal du generateur de patterns
 */
export function generatePattern(config: PatternConfig, rng: () => number): BlockDefinition[] {
  switch (config.type) {
    case 'frame':
      return generateFramePattern(config, rng)
    case 'stack':
      return generateStackPattern(config, rng)
    case 'triangle':
      return generateTrianglePattern(config, rng)
    case 'diagonal':
      return generateDiagonalPattern(config, rng)
    case 'solid':
      return generateSolidPattern(config, rng)
    case 'hollow':
      return generateHollowPattern(config, rng)
    default:
      return generateFramePattern(config, rng)
  }
}
