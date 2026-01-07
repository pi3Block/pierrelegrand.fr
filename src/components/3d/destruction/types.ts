/**
 * Types pour le systeme de structures destructibles style Angry Birds
 */

import type { MaterialType } from './DestructibleStructure'

// ============================================================================
// BLOCK DEFINITIONS
// ============================================================================

/** Un bloc individuel dans une structure */
export interface BlockDefinition {
  /** Position relative a l'origine de la structure */
  position: [number, number, number]
  /** Dimensions du bloc [largeur, hauteur, profondeur] */
  size: [number, number, number]
  /** Type de materiau */
  material: MaterialType
  /** Rotation optionnelle en radians [x, y, z] */
  rotation?: [number, number, number]
  /** Variation de couleur (-0.5 a 0.5) */
  colorVariation?: number
  /** Si true, le bloc est fixe au sol et ne peut pas etre deplace */
  isFoundation?: boolean
}

/** Definition complete d'une structure (tableau de blocs) */
export interface StructureDefinition {
  /** Identifiant unique */
  id: string
  /** Nom d'affichage */
  name: string
  /** Tous les blocs de la structure */
  blocks: BlockDefinition[]
  /** Bounding box pour collision/placement [largeur, hauteur, profondeur] */
  boundingBox: [number, number, number]
  /** Difficulte recommandee */
  difficulty?: 'easy' | 'medium' | 'hard'
}

// ============================================================================
// BUILDING PATTERNS
// ============================================================================

/** Types de patterns de construction */
export type PatternType =
  | 'frame' // Piliers + poutres horizontales avec ouvertures
  | 'stack' // Blocs empiles avec decalage
  | 'triangle' // Pattern triangulaire/toit
  | 'diagonal' // Supports diagonaux
  | 'solid' // Mur plein de blocs
  | 'hollow' // Cadre avec centre vide

/** Configuration pour un pattern de construction */
export interface PatternConfig {
  type: PatternType
  width: number
  height: number
  material: MaterialType
  /** Pour stack pattern - decaler chaque rangee */
  staggered?: boolean
  /** Pour frame pattern - ratio d'ouverture (0-1) */
  openingRatio?: number
}

// ============================================================================
// FLOOR DEFINITIONS
// ============================================================================

/** Configuration pour un etage */
export interface FloorConfig {
  /** Index de l'etage (0 = rez-de-chaussee) */
  index: number
  /** Hauteur de cet etage */
  height: number
  /** Largeur de cet etage */
  width: number
  /** Profondeur de cet etage */
  depth: number
  /** Materiau principal pour les elements structurels */
  structureMaterial: MaterialType
  /** Pattern pour le mur gauche */
  leftPattern?: PatternType
  /** Pattern pour le mur droit */
  rightPattern?: PatternType
  /** Pattern pour le mur avant */
  frontPattern?: PatternType
  /** Pattern pour le mur arriere */
  backPattern?: PatternType
  /** Inclure une plateforme de sol */
  hasFloorPlatform: boolean
  /** Inclure un plafond/toit */
  hasCeiling: boolean
  /** Elements decoratifs (blocs de verre, etc.) */
  decorations?: MaterialType[]
}

// ============================================================================
// STRUCTURE GENERATION CONFIG
// ============================================================================

/** Distribution des materiaux */
export interface MaterialMix {
  wood: number // 0-1
  stone: number // 0-1
  glass: number // 0-1
}

/** Configuration principale pour la generation procedurale */
export interface StructureGeneratorConfig {
  /** Nombre d'etages (1-4) */
  floors: number
  /** Largeur de base en unites */
  width: number
  /** Profondeur de base en unites */
  depth: number
  /** Niveau de complexite */
  complexity: 'simple' | 'medium' | 'complex'
  /** Seed aleatoire pour reproductibilite */
  seed: number
  /** Distribution des materiaux */
  materialMix: MaterialMix
  /** Preset de style de structure */
  style?: StructureStyle
  /** Hauteur d'etage */
  floorHeight?: number
  /** Ratio de retrecissement (combien chaque etage se retrecit) */
  taperRatio?: number
}

/** Styles de structures predefinis */
export type StructureStyle =
  | 'tower' // Haute et etroite
  | 'house' // Large avec toit
  | 'castle' // Tours aux coins
  | 'fortress' // Robuste, beaucoup de pierre
  | 'scaffold' // Structure ouverte
  | 'l_shape' // Empreinte en L
  | 'u_shape' // Empreinte en U
  | 'pyramid' // Profil triangulaire
  | 'random' // Entierement procedural

// ============================================================================
// FACTORY OUTPUT
// ============================================================================

/** Resultat de la generation de structure */
export interface GeneratedStructure {
  /** La definition de structure */
  definition: StructureDefinition
  /** Metadonnees sur la generation */
  metadata: {
    seed: number
    style: StructureStyle
    blockCount: number
    estimatedMass: number
  }
}
