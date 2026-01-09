/**
 * assetPaths.ts - Configuration centralisée des chemins d'assets.
 *
 * Ce fichier centralise tous les chemins vers les ressources du dossier public/
 * pour faciliter la maintenance et les futures réorganisations.
 */

// =============================================================================
// LIBRAIRIES PARTAGÉES
// =============================================================================

export const LIBS = {
  BASIS: '/shared/libs/basis/',
  DRACO: '/shared/libs/draco/',
  DRACO_GLTF: '/shared/libs/draco/gltf/',
} as const

// =============================================================================
// POLICES
// =============================================================================

export const FONTS = {
  ARCADE: '/shared/fonts/ARCADE.TTF',
  INTER_REGULAR: '/shared/fonts/Inter-Regular.ttf',
  ROBOTO_BLACK: '/shared/fonts/Roboto-Black.ttf',
  ROBOTO_LIGHT: '/shared/fonts/Roboto-Light.ttf',
  ROBOTO_BLACK_JSON: '/shared/fonts/Roboto%20Black.json',
  ROBOTO_LIGHT_JSON: '/shared/fonts/Roboto%20Light.json',
  SST_LIGHT: '/shared/fonts/SSTLight.TTF',
  SST_REGULAR: '/shared/fonts/SSTRg.TTF',
} as const

// =============================================================================
// SCÈNE HUB (World)
// =============================================================================

export const HUB = {
  MODELS: {
    CHARACTER: '/scenes/hub/models/character.glb',
    FLOATING_CHARACTER: '/scenes/hub/models/Floating Character.glb',
    ROUGH_PLANE: '/scenes/hub/models/roughPlane.glb',
    SLOPES: '/scenes/hub/models/slopes.glb',
  },
  TEXTURES: {
    GRADIENT_3: '/scenes/hub/textures/3.jpg',
    GRADIENT_5: '/scenes/hub/textures/5.jpg',
  },
} as const

// =============================================================================
// SCÈNE PIERRE (Bureau 3D)
// =============================================================================

export const PIERRE = {
  MODELS: {
    ROOM1: '/scenes/pierre/models/room.glb',
    ROOM2: '/scenes/pierre/models/room2.glb',
    ROOM3: '/scenes/pierre/models/room3.glb',
    LEFT_MONITOR: '/scenes/pierre/models/leftMonitor.glb',
    RIGHT_MONITOR: '/scenes/pierre/models/rightMonitor.glb',
    ARCADE_MACHINE: '/scenes/pierre/models/arcadeMachine.glb',
    TOP_CHAIR: '/scenes/pierre/models/topChair.glb',
    WHITEBOARD: '/scenes/pierre/models/whiteboard.glb',
    RUBIK: '/scenes/pierre/models/Rubik.glb',
    LINKEDIN: '/scenes/pierre/models/linkedin.glb',
    GITHUB: '/scenes/pierre/models/github.glb',
    ITCHIO: '/scenes/pierre/models/itchio.glb',
  },
  TEXTURES: {
    BAKED1: '/scenes/pierre/textures/baked1.ktx2',
    BAKED2: '/scenes/pierre/textures/baked2.ktx2',
    BAKED3: '/scenes/pierre/textures/baked3.ktx2',
    PERLIN: '/scenes/pierre/textures/perlin.png',
    SKY: '/scenes/pierre/textures/skyTexture.ktx2',
    TEXTURE_PAINT: '/scenes/pierre/textures/texture_paint.png',
  },
  SOUNDS: {
    // Rubik's Cube
    RUBIK_1: '/scenes/pierre/sounds/rubik_1.mp3',
    RUBIK_2: '/scenes/pierre/sounds/rubik_2.mp3',
    RUBIK_3: '/scenes/pierre/sounds/rubik_3.mp3',
    // Victoire
    CONFETTI: '/scenes/pierre/sounds/confetti.mp3',
    TROPHY: '/scenes/pierre/sounds/trophy.mp3',
    TROPHY_PLATINUM: '/scenes/pierre/sounds/trophy_platinum.mp3',
    PARTYBLOWER: '/scenes/pierre/sounds/partyblower.mp3',
    // Tableau blanc
    MARKER_OPEN: '/scenes/pierre/sounds/marker-open.mp3',
    ERASER: '/scenes/pierre/sounds/eraser.mp3',
    // Transitions
    WHOOSH: '/scenes/pierre/sounds/whoosh.mp3',
    WHOOSH_: '/scenes/pierre/sounds/whoosh_.mp3',
    WHOOSH__: '/scenes/pierre/sounds/whoosh__.mp3',
    WHOOSH___: '/scenes/pierre/sounds/whoosh___.mp3',
    DOOR: '/scenes/pierre/sounds/door.mp3',
    // Interface
    SELECT1: '/scenes/pierre/sounds/select1.ogg',
    SELECT2: '/scenes/pierre/sounds/select2.ogg',
    MOUSECLICK: '/scenes/pierre/sounds/mouseclick.ogg',
    MOUSERELEASE: '/scenes/pierre/sounds/mouserelease.ogg',
    // Arcade
    HIT: '/scenes/pierre/sounds/hit.ogg',
    TETRIS: '/scenes/pierre/sounds/tetris.ogg',
    DIE: '/scenes/pierre/sounds/die.ogg',
    START: '/scenes/pierre/sounds/start.mp3',
    // Footsteps
    FOOTSTEP_01: '/scenes/pierre/sounds/footstep01.ogg',
    FOOTSTEP_02: '/scenes/pierre/sounds/footstep02.ogg',
    FOOTSTEP_03: '/scenes/pierre/sounds/footstep03.ogg',
    // Divers
    FLORAL: '/scenes/pierre/sounds/floral.mp3',
    VASE_BREAK: '/scenes/pierre/sounds/vase_break.mp3',
  },
  DATA: {
    CUBE_INFO: '/scenes/pierre/data/cubeInfo.json',
  },
  SVG: {
    ARROW_BACK: '/scenes/pierre/svg/arrow-back.svg',
    AUDIO_HIGH: '/scenes/pierre/svg/audio-volume-high.svg',
    AUDIO_MUTED: '/scenes/pierre/svg/audio-volume-muted.svg',
    MARKER_BLACK: '/scenes/pierre/svg/black-marker.svg',
    MARKER_BLUE: '/scenes/pierre/svg/blue-marker.svg',
    MARKER_GREEN: '/scenes/pierre/svg/green-marker.svg',
    MARKER_RED: '/scenes/pierre/svg/red-marker.svg',
    ERASER: '/scenes/pierre/svg/eraser.svg',
  },
  ENV_MAPS: {
    PX: '/scenes/pierre/environmentMaps/px.jpg',
    NX: '/scenes/pierre/environmentMaps/nx.jpg',
    PY: '/scenes/pierre/environmentMaps/py.jpg',
    NY: '/scenes/pierre/environmentMaps/ny.jpg',
    PZ: '/scenes/pierre/environmentMaps/pz.jpg',
    NZ: '/scenes/pierre/environmentMaps/nz.jpg',
  },
} as const

// =============================================================================
// SCÈNE GALLERY FPS (Mini-jeu)
// =============================================================================

export const GALLERY_FPS = {
  MODELS: {
    SCENE: '/scenes/gallery-fps/models/scene.glb',
    DOOR: '/scenes/gallery-fps/models/door.glb',
    VASE: '/scenes/gallery-fps/models/vase.glb',
    VASE_IDLE: '/scenes/gallery-fps/models/vase_idle.glb',
  },
  TEXTURES: {
    BAKED: '/scenes/gallery-fps/textures/baked.ktx2',
    VASE: '/scenes/gallery-fps/textures/vaseTexture.ktx2',
  },
} as const

// =============================================================================
// SCÈNE PINGPONG (Mini-jeu)
// =============================================================================

export const PINGPONG = {
  MODELS: {
    PADDLE: '/scenes/pingpong/models/pingpong.glb',
  },
  TEXTURES: {
    BACKGROUND: '/scenes/pingpong/textures/bg.jpg',
    BALL: '/scenes/pingpong/textures/crossp.jpg',
  },
  SOUNDS: {
    PING: '/scenes/pingpong/sounds/ping.mp3',
  },
  DATA: {
    FONT: '/scenes/pingpong/data/firasans_regular.json',
  },
} as const

// =============================================================================
// PORTFOLIO (Contenu)
// =============================================================================

export const PORTFOLIO = {
  IMAGES: {
    PAGES: '/portfolio/images/pages',
    POSTS: '/portfolio/images/posts',
  },
  PAINTINGS: '/portfolio/paintings',
  DESCRIPTIONS: '/portfolio/descriptions',
  NOTES: '/portfolio/notes',
  TROPHIES: '/portfolio/trophies',
  TROPHY_LOGOS: '/portfolio/trophyLogos',
  UI: {
    KEY_CONTROLS: '/portfolio/ui/keyControls.png',
    PUNCH_EFFECT: '/portfolio/ui/punchEffect.png',
    L_LOGO: '/portfolio/ui/L.png',
  },
} as const

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

/**
 * Construit le chemin complet d'une image de page portfolio.
 */
export function getPageImagePath(filename: string): string {
  return `${PORTFOLIO.IMAGES.PAGES}/${filename}`
}

/**
 * Construit le chemin complet d'une image de post blog.
 */
export function getPostImagePath(filename: string): string {
  return `${PORTFOLIO.IMAGES.POSTS}/${filename}`
}

/**
 * Construit le chemin d'une peinture KTX2.
 */
export function getPaintingPath(name: string): string {
  return `${PORTFOLIO.PAINTINGS}/${name}.ktx2`
}

/**
 * Construit le chemin d'une description.
 */
export function getDescriptionPath(name: string, ext: 'ktx2' | 'png' = 'ktx2'): string {
  return `${PORTFOLIO.DESCRIPTIONS}/${name}-description.${ext}`
}

// =============================================================================
// EXPORT PAR DÉFAUT
// =============================================================================

export default {
  LIBS,
  FONTS,
  HUB,
  PIERRE,
  GALLERY_FPS,
  PINGPONG,
  PORTFOLIO,
}
