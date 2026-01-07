/**
 * Module de destruction - Composants pour structures destructibles style Angry Birds
 */

// Composants de base
export {
  DestructibleBlock,
  DestructibleBatch,
  WoodPlank,
  WoodBeam,
  GlassBlock,
  StoneBlock,
  StonePillar,
  type MaterialType,
} from './DestructibleStructure'

// Presets originaux (compatibilite retroactive)
export {
  TowerStructure,
  HouseStructure,
  BridgeStructure,
  PyramidStructure,
  WallStructure,
  CompositeStructure,
} from './StructurePresets'

// Nouvelle bibliotheque de templates
export { TallTower, Castle, Fortress, Scaffold, LShape, UShape } from './templates'

// Factory procedurale
export { StructureFactory, getStructureFactory, resetStructureFactory } from './StructureFactory'

// Composant de rendu de structures generees
export { GeneratedStructure } from './GeneratedStructure'

// Hooks React
export {
  useStructureFactory,
  useGeneratedStructure,
  useStyledStructure,
  useStructureBatch,
  useRandomStructurePlacement,
} from './hooks/useStructureFactory'

// Types
export type {
  BlockDefinition,
  StructureDefinition,
  PatternType,
  PatternConfig,
  FloorConfig,
  MaterialMix,
  StructureGeneratorConfig,
  StructureStyle,
  GeneratedStructure as GeneratedStructureType,
} from './types'
