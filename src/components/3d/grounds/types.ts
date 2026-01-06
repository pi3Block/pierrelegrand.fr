/**
 * Types et interfaces pour les systèmes de sol 3D
 * Architecture enterprise-grade avec typage strict
 */
import * as THREE from 'three'

// ============================================================================
// Types de base
// ============================================================================

/** Tuple pour les dimensions 2D */
export type Size2D = [width: number, depth: number]

/** Tuple pour les positions 3D */
export type Position3D = [x: number, y: number, z: number]

/** Tuple pour les rotations 3D (Euler angles) */
export type Rotation3D = [x: number, y: number, z: number]

/** Tuple pour le blur des reflections */
export type BlurTuple = [x: number, y: number]

// ============================================================================
// Configuration des thèmes de couleur
// ============================================================================

/** Palette de couleurs pour un thème */
export interface ColorPalette {
  readonly base: THREE.Color
  readonly accent: THREE.Color
  readonly dark: THREE.Color
}

/** Thème de couleur arcade/synthwave */
export interface ArcadeColorTheme {
  readonly gridColor: THREE.Color
  readonly glowColor: THREE.Color
  readonly bgColor: THREE.Color
  readonly horizonColor: THREE.Color
}

/** Configuration de variante pour sol urbain */
export interface UrbanVariantConfig {
  readonly color: string
  readonly roughness: number
  readonly metalness: number
  readonly mirror: number
  readonly blur: BlurTuple
}

// ============================================================================
// Props des composants Ground
// ============================================================================

/** Props de base communes à tous les sols */
export interface BaseGroundProps {
  /** Taille du sol [largeur, profondeur] */
  size?: Size2D
  /** Position du sol */
  position?: Position3D
}

/** Props spécifiques au sol arcade */
export interface ArcadeGroundProps extends BaseGroundProps {
  /** Thème de couleur: 'synthwave', 'tron', 'vaporwave', 'disco' */
  variant?: ArcadeVariant
  /** Vitesse d'animation (0 = statique) */
  speed?: number
}

/** Props spécifiques au sol nature */
export interface NatureGroundProps extends BaseGroundProps {
  /** Type de terrain: 'grass', 'dirt', 'forest' */
  variant?: NatureVariant
}

/** Props spécifiques au sol urbain */
export interface UrbanGroundProps extends BaseGroundProps {
  /** Type de surface: 'asphalt', 'concrete', 'wet' */
  variant?: UrbanVariant
  /** Afficher les marquages routiers */
  showRoadMarkings?: boolean
}

// ============================================================================
// Variantes
// ============================================================================

export type ArcadeVariant = 'synthwave' | 'tron' | 'vaporwave' | 'disco'
export type NatureVariant = 'grass' | 'dirt' | 'forest'
export type UrbanVariant = 'asphalt' | 'concrete' | 'wet'

// ============================================================================
// Uniforms pour les shaders
// ============================================================================

/** Type d'uniforms générique compatible avec THREE.ShaderMaterial */
export type ShaderUniforms = Record<string, { value: unknown }>

/** Structure des uniforms arcade (pour documentation) */
export type ArcadeShaderUniformKeys = 'uTime' | 'uSpeed' | 'uGridColor' | 'uGlowColor' | 'uBgColor' | 'uHorizonColor'

/** Structure des uniforms nature (pour documentation) */
export type NatureShaderUniformKeys = 'uTime' | 'uColorBase' | 'uColorAccent' | 'uColorDark'

// ============================================================================
// Configuration des particules
// ============================================================================

export interface ParticleConfig {
  count: number
  spreadX: number
  spreadY: number
  spreadZ: number
  minHeight: number
  maxHeight: number
  velocityRange: number
  verticalVelocity: number
}

// ============================================================================
// Configuration des piliers
// ============================================================================

export interface PillarConfig {
  position: Position3D
  rotation: Rotation3D
}

// ============================================================================
// Éléments de marquage routier
// ============================================================================

export interface RoadMarkingElement {
  id: string
  position: Position3D
  rotation: Rotation3D
  size: Size2D
  color: string
}
