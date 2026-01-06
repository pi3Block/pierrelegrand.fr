/**
 * Module d'export centralisé pour les composants de sol 3D
 * Architecture enterprise-grade
 *
 * Sols rectangulaires (pour zones étendues) :
 * - NatureGround : Terrain naturel (herbe, terre, forêt)
 * - UrbanGround : Sol urbain (asphalte, béton, route mouillée)
 * - ArcadeGround : Sol rétro années 80 (synthwave, tron, vaporwave, disco)
 *
 * Sols circulaires (pour les biomes) :
 * - CircularNatureGround : Terrain naturel circulaire
 * - CircularArcadeGround : Grille néon circulaire
 * - CircularCryptoGround : Sol doré blockchain
 */

// Sols rectangulaires
export { NatureGround } from './NatureGround'
export { UrbanGround } from './UrbanGround'
export { ArcadeGround } from './ArcadeGround'

// Sols circulaires pour les biomes
export { CircularNatureGround, CircularArcadeGround, CircularCryptoGround } from './CircularGrounds'

// Types
export type {
  ArcadeColorTheme,
  ArcadeGroundProps,
  ArcadeShaderUniformKeys,
  ArcadeVariant,
  BaseGroundProps,
  BlurTuple,
  ColorPalette,
  NatureGroundProps,
  NatureShaderUniformKeys,
  NatureVariant,
  ParticleConfig,
  PillarConfig,
  Position3D,
  RoadMarkingElement,
  Rotation3D,
  ShaderUniforms,
  Size2D,
  UrbanGroundProps,
  UrbanVariant,
  UrbanVariantConfig,
} from './types'

// Factories
export {
  createArcadeShaderUniforms,
  createNatureShaderUniforms,
  createParticleData,
  createPillarConfigs,
  createRoadMarkings,
  getArcadeColorTheme,
  getNatureColorPalette,
  getUrbanVariantConfig,
  updateParticlePositions,
  updateShaderTime,
} from './factories'

// Shaders (pour usage avancé)
export {
  arcadeFragmentShader,
  arcadeVertexShader,
  asphaltDetailFragmentShader,
  asphaltDetailVertexShader,
  natureFragmentShader,
  natureVertexShader,
} from './shaders'
