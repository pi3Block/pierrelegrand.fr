/**
 * Configuration centralisée des vidéos YouTube.
 * Ajouter ici toutes les vidéos disponibles dans le monde 3D.
 */

export interface VideoConfig {
  /** ID YouTube de la vidéo */
  id: string
  /** Titre affiché */
  title: string
  /** Description optionnelle */
  description?: string
}

/**
 * Catalogue des vidéos disponibles.
 * Utiliser les clés pour référencer les vidéos dans les composants 3D.
 * 
 * @example
 * <VideoScreen videoKey="intro" position={[0, 2, -5]} />
 */
export const VIDEOS: Record<string, VideoConfig> = {
  // Biome TECH - Vidéo principale
  intro: {
    id: 'AbV-Q6tz4B8',
    title: '🖥️ Zone Tech',
    description: 'Projets et technologies',
  },
  // Biome NATURE - Vidéo bien-être
  demo: {
    id: 'jNQXAC9IVRw',
    title: '🌿 Zone Nature',
    description: 'Bien-être et développement personnel',
  },
  // Biome CRYPTO - Vidéo blockchain
  tech: {
    id: '9bZkp7q19f0',
    title: '₿ Zone Crypto',
    description: 'Blockchain et cryptomonnaies',
  },
  // Extra
  coaching: {
    id: 'kJQP7kiw5Fk',
    title: 'Coaching',
    description: 'Services de coaching',
  },
} as const

/**
 * Récupère une configuration vidéo par sa clé.
 * @param key - Clé de la vidéo dans le catalogue
 * @returns Configuration vidéo ou undefined
 */
export function getVideoConfig(key: string): VideoConfig | undefined {
  return VIDEOS[key]
}

/**
 * Récupère l'URL embed YouTube pour une vidéo.
 * @param videoId - ID YouTube de la vidéo
 * @returns URL embed complète
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
}

