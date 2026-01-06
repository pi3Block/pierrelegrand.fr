/**
 * Factories pour la création d'éléments 3D des sols
 * Architecture enterprise-grade avec pattern Factory
 */
import * as THREE from 'three'
import type {
  ArcadeColorTheme,
  ArcadeVariant,
  ColorPalette,
  NatureVariant,
  ParticleConfig,
  PillarConfig,
  Position3D,
  RoadMarkingElement,
  Rotation3D,
  ShaderUniforms,
  Size2D,
  UrbanVariant,
  UrbanVariantConfig,
} from './types'

// ============================================================================
// Registres de configuration (Single Source of Truth)
// ============================================================================

/** Registre des thèmes de couleur arcade */
const ARCADE_COLOR_THEMES: Record<ArcadeVariant, ArcadeColorTheme> = {
  synthwave: {
    gridColor: new THREE.Color('#ff00ff'),
    glowColor: new THREE.Color('#00ffff'),
    bgColor: new THREE.Color('#0a0015'),
    horizonColor: new THREE.Color('#ff6b00'),
  },
  tron: {
    gridColor: new THREE.Color('#00d4ff'),
    glowColor: new THREE.Color('#ffffff'),
    bgColor: new THREE.Color('#000810'),
    horizonColor: new THREE.Color('#00d4ff'),
  },
  vaporwave: {
    gridColor: new THREE.Color('#ff71ce'),
    glowColor: new THREE.Color('#01cdfe'),
    bgColor: new THREE.Color('#1a0a2e'),
    horizonColor: new THREE.Color('#b967ff'),
  },
  disco: {
    gridColor: new THREE.Color('#ffff00'),
    glowColor: new THREE.Color('#ff00ff'),
    bgColor: new THREE.Color('#1a0a0a'),
    horizonColor: new THREE.Color('#00ff00'),
  },
}

/** Registre des palettes de couleur nature */
const NATURE_COLOR_PALETTES: Record<NatureVariant, ColorPalette> = {
  grass: {
    base: new THREE.Color('#2d5a27'),
    accent: new THREE.Color('#4a7c43'),
    dark: new THREE.Color('#1a3518'),
  },
  dirt: {
    base: new THREE.Color('#6b4423'),
    accent: new THREE.Color('#8b6914'),
    dark: new THREE.Color('#3d2817'),
  },
  forest: {
    base: new THREE.Color('#1e4620'),
    accent: new THREE.Color('#2d6a4f'),
    dark: new THREE.Color('#0d1f0f'),
  },
}

/** Registre des configurations urbaines */
const URBAN_VARIANT_CONFIGS: Record<UrbanVariant, UrbanVariantConfig> = {
  asphalt: {
    color: '#1a1a1a',
    roughness: 0.85,
    metalness: 0.1,
    mirror: 0.15,
    blur: [400, 100],
  },
  concrete: {
    color: '#3a3a3a',
    roughness: 0.95,
    metalness: 0.05,
    mirror: 0.08,
    blur: [500, 200],
  },
  wet: {
    color: '#0f0f0f',
    roughness: 0.3,
    metalness: 0.2,
    mirror: 0.6,
    blur: [200, 50],
  },
}

// ============================================================================
// Factory: Thèmes et Palettes
// ============================================================================

/**
 * Factory pour obtenir un thème de couleur arcade
 */
export function getArcadeColorTheme(variant: ArcadeVariant): ArcadeColorTheme {
  return ARCADE_COLOR_THEMES[variant]
}

/**
 * Factory pour obtenir une palette de couleur nature
 */
export function getNatureColorPalette(variant: NatureVariant): ColorPalette {
  return NATURE_COLOR_PALETTES[variant]
}

/**
 * Factory pour obtenir une configuration urbaine
 */
export function getUrbanVariantConfig(variant: UrbanVariant): UrbanVariantConfig {
  return URBAN_VARIANT_CONFIGS[variant]
}

// ============================================================================
// Factory: Shader Uniforms
// ============================================================================

/**
 * Factory pour créer les uniforms du shader arcade
 */
export function createArcadeShaderUniforms(
  theme: ArcadeColorTheme,
  speed: number
): ShaderUniforms {
  return {
    uTime: { value: 0 },
    uSpeed: { value: speed },
    uGridColor: { value: theme.gridColor },
    uGlowColor: { value: theme.glowColor },
    uBgColor: { value: theme.bgColor },
    uHorizonColor: { value: theme.horizonColor },
  }
}

/**
 * Factory pour créer les uniforms du shader nature
 */
export function createNatureShaderUniforms(palette: ColorPalette): ShaderUniforms {
  return {
    uColorBase: { value: palette.base },
    uColorAccent: { value: palette.accent },
    uColorDark: { value: palette.dark },
    uTime: { value: 0 },
  }
}

// ============================================================================
// Factory: Particules
// ============================================================================

/** Configuration par défaut des particules */
const DEFAULT_PARTICLE_CONFIG: ParticleConfig = {
  count: 50,
  spreadX: 40,
  spreadY: 5,
  spreadZ: 40,
  minHeight: 0.5,
  maxHeight: 6,
  velocityRange: 0.02,
  verticalVelocity: 0.01,
}

/**
 * Factory pour générer les données de particules
 */
export function createParticleData(config: Partial<ParticleConfig> = {}) {
  const cfg = { ...DEFAULT_PARTICLE_CONFIG, ...config }
  const positions = new Float32Array(cfg.count * 3)
  const velocities = new Float32Array(cfg.count * 3)

  for (let i = 0; i < cfg.count; i++) {
    const i3 = i * 3

    // Positions initiales
    positions[i3] = (Math.random() - 0.5) * cfg.spreadX
    positions[i3 + 1] = Math.random() * cfg.spreadY + cfg.minHeight
    positions[i3 + 2] = (Math.random() - 0.5) * cfg.spreadZ

    // Vélocités
    velocities[i3] = (Math.random() - 0.5) * cfg.velocityRange
    velocities[i3 + 1] = Math.random() * cfg.verticalVelocity + cfg.verticalVelocity / 2
    velocities[i3 + 2] = (Math.random() - 0.5) * cfg.velocityRange
  }

  return { positions, velocities, config: cfg }
}

/**
 * Met à jour les positions des particules (appelé à chaque frame)
 */
export function updateParticlePositions(
  positionArray: Float32Array,
  velocities: Float32Array,
  count: number,
  config: ParticleConfig
): void {
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const i3_1 = i3 + 1
    const i3_2 = i3 + 2

    // Mise à jour des positions avec vérification des bornes
    const velX = velocities[i3] ?? 0
    const velY = velocities[i3_1] ?? 0
    const velZ = velocities[i3_2] ?? 0

    positionArray[i3] = (positionArray[i3] ?? 0) + velX
    positionArray[i3_1] = (positionArray[i3_1] ?? 0) + velY
    positionArray[i3_2] = (positionArray[i3_2] ?? 0) + velZ

    // Reset si trop haut
    const currentY = positionArray[i3_1] ?? 0
    if (currentY > config.maxHeight) {
      positionArray[i3_1] = config.minHeight
      positionArray[i3] = (Math.random() - 0.5) * config.spreadX
      positionArray[i3_2] = (Math.random() - 0.5) * config.spreadZ
    }
  }
}

// ============================================================================
// Factory: Piliers Néon
// ============================================================================

/**
 * Factory pour générer les configurations de piliers
 */
export function createPillarConfigs(count: number, radius: number): PillarConfig[] {
  const configs: PillarConfig[] = []

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    configs.push({
      position: [Math.cos(angle) * radius, 2.5, Math.sin(angle) * radius] as Position3D,
      rotation: [0, -angle, 0] as Rotation3D,
    })
  }

  return configs
}

// ============================================================================
// Factory: Marquages Routiers
// ============================================================================

/** Couleur standard des marquages */
const MARKING_COLOR = '#f5f5f5'

/**
 * Factory pour générer les éléments de marquage routier
 */
export function createRoadMarkings(size: Size2D): RoadMarkingElement[] {
  const [width, depth] = size
  const markings: RoadMarkingElement[] = []
  let idCounter = 0

  // Ligne centrale discontinue
  for (let z = -depth / 2 + 2; z < depth / 2 - 2; z += 4) {
    markings.push({
      id: `center-${idCounter++}`,
      position: [0, 0.01, z],
      rotation: [-Math.PI / 2, 0, 0],
      size: [0.15, 2],
      color: MARKING_COLOR,
    })
  }

  // Lignes de bordure
  const borderOffset = width / 2 - 3
  for (const side of [-1, 1]) {
    markings.push({
      id: `border-${idCounter++}`,
      position: [side * borderOffset, 0.01, 0],
      rotation: [-Math.PI / 2, 0, 0],
      size: [0.2, depth - 4],
      color: MARKING_COLOR,
    })
  }

  // Passage piéton
  for (let x = -2; x <= 2; x += 0.8) {
    markings.push({
      id: `crosswalk-${idCounter++}`,
      position: [x, 0.01, -depth / 4],
      rotation: [-Math.PI / 2, 0, 0],
      size: [0.5, 3],
      color: MARKING_COLOR,
    })
  }

  return markings
}

// ============================================================================
// Utilitaires de mise à jour de shader
// ============================================================================

/**
 * Met à jour le temps d'un shader material de manière type-safe
 */
export function updateShaderTime(
  mesh: THREE.Mesh | null,
  elapsedTime: number
): void {
  if (!mesh) return

  const material = mesh.material
  if (material instanceof THREE.ShaderMaterial && material.uniforms.uTime) {
    material.uniforms.uTime.value = elapsedTime
  }
}
