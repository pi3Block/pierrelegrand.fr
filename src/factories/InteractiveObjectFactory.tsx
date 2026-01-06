/**
 * InteractiveObjectFactory - Factory pour créer des objets 3D interactifs.
 * Architecture extensible pour ajouter facilement de nouveaux types d'objets.
 */

import { VideoScreen } from '@components/3d/VideoScreen'
import { VIDEOS } from '@config/videos'

/**
 * Types d'objets interactifs supportés.
 */
export type InteractiveObjectType = 'video' | 'info' | 'portal' | 'collectible'

/**
 * Configuration de base pour tous les objets interactifs.
 */
interface BaseInteractiveConfig {
  /** Type d'objet interactif */
  type: InteractiveObjectType
  /** Position dans le monde 3D */
  position: [number, number, number]
  /** Rotation en radians [x, y, z] */
  rotation?: [number, number, number]
  /** Échelle de l'objet */
  scale?: number
  /** Couleur du glow/émissif */
  glowColor?: string
}

/**
 * Configuration spécifique pour les écrans vidéo.
 */
interface VideoObjectConfig extends BaseInteractiveConfig {
  type: 'video'
  /** Clé de la vidéo dans le catalogue */
  videoKey: keyof typeof VIDEOS
  /** Taille de l'écran [largeur, hauteur] */
  size?: [number, number]
  /** Afficher le titre */
  showTitle?: boolean
}

/**
 * Configuration pour les panneaux d'information (à implémenter).
 */
interface InfoObjectConfig extends BaseInteractiveConfig {
  type: 'info'
  /** Titre du panneau */
  title: string
  /** Contenu textuel */
  content: string
}

/**
 * Configuration pour les portails de biome (à implémenter).
 */
interface PortalObjectConfig extends BaseInteractiveConfig {
  type: 'portal'
  /** Biome de destination */
  targetBiome: string
}

/**
 * Configuration pour les objets collectibles (à implémenter).
 */
interface CollectibleObjectConfig extends BaseInteractiveConfig {
  type: 'collectible'
  /** ID de l'objet collectible */
  collectibleId: string
  /** Récompense associée */
  reward?: string
}

/**
 * Union de toutes les configurations possibles.
 */
export type InteractiveObjectConfig =
  | VideoObjectConfig
  | InfoObjectConfig
  | PortalObjectConfig
  | CollectibleObjectConfig

/**
 * Crée un objet 3D interactif selon sa configuration.
 * 
 * @param config - Configuration de l'objet à créer
 * @returns Composant React correspondant ou null si type non supporté
 * 
 * @example
 * const objects: InteractiveObjectConfig[] = [
 *   { type: 'video', videoKey: 'intro', position: [0, 2, -5] },
 *   { type: 'info', title: 'Bienvenue', content: '...', position: [5, 1, 0] },
 * ]
 * 
 * {objects.map((config, i) => (
 *   <InteractiveObject key={i} config={config} />
 * ))}
 */
export function createInteractiveObject(config: InteractiveObjectConfig): JSX.Element | null {
  switch (config.type) {
    case 'video':
      return (
        <VideoScreen
          key={`video-${config.videoKey}-${config.position.join('-')}`}
          videoKey={config.videoKey}
          position={config.position}
          rotation={config.rotation}
          size={config.size}
          glowColor={config.glowColor}
          showTitle={config.showTitle}
        />
      )

    case 'info':
      // TODO: Implémenter InfoPanel
      console.warn('InteractiveObjectFactory: type "info" non implémenté')
      return null

    case 'portal':
      // TODO: Implémenter PortalObject
      console.warn('InteractiveObjectFactory: type "portal" non implémenté')
      return null

    case 'collectible':
      // TODO: Implémenter CollectibleObject
      console.warn('InteractiveObjectFactory: type "collectible" non implémenté')
      return null

    default:
      console.warn(`InteractiveObjectFactory: type inconnu`)
      return null
  }
}

/**
 * Composant wrapper pour utiliser la factory de manière déclarative.
 */
interface InteractiveObjectProps {
  config: InteractiveObjectConfig
}

export function InteractiveObject({ config }: InteractiveObjectProps): JSX.Element | null {
  return createInteractiveObject(config)
}

/**
 * Génère plusieurs objets interactifs à partir d'un tableau de configurations.
 * 
 * @param configs - Tableau de configurations
 * @returns Fragment React avec tous les objets
 */
export function createInteractiveObjects(configs: InteractiveObjectConfig[]): JSX.Element {
  return (
    <>
      {configs.map((config, index) => (
        <InteractiveObject key={`interactive-${index}`} config={config} />
      ))}
    </>
  )
}

