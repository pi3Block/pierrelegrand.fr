/**
 * Structure de données pour le contenu du portfolio
 * Chaque entrée représente un mur de briques dans le monde 3D
 */

export type ContentCategory = 'tech' | 'nature' | 'crypto'
export type ContentType = 'post' | 'page' | 'category'

export interface ContentItem {
  id: string
  title: string
  slug: string
  type: ContentType
  category: ContentCategory
  description: string
  date?: string
  author?: string
  tags?: string[]
  // URL de texture générée ou image associée
  textureUrl?: string
  // Couleur de fallback pour le mur
  color: string
}

/**
 * Mapping des contenus vers les biomes:
 * - TECH (Indigo): Tutoriels, Flutter, SDK, Développement
 * - NATURE (Vert): Bien-être, Hypnose, Lecture, Humanisme
 * - CRYPTO (Orange): Blockchain, NFT, Crypto, Finance
 */

export const CONTENT_DATA: ContentItem[] = [
  // ============================================
  // BIOME TECH (Indigo) - Développement & Tutoriels
  // ============================================
  {
    id: 'tuto-flutter-strapi',
    title: 'CMS Flutter & Strapi',
    slug: 'tuto-cms-flutter-strapi',
    type: 'post',
    category: 'tech',
    description: 'Créer une application CRUD avec Flutter et Strapi',
    date: '2022-03-04',
    author: 'Pierre Legrand',
    tags: ['flutter', 'strapi', 'cms', 'tutoriel'],
    color: '#6366f1', // Indigo
  },
  {
    id: 'glossaire-dev',
    title: 'Glossaire Dev',
    slug: 'glossaire-developpeur',
    type: 'page',
    category: 'tech',
    description: 'Vocabulaire des développeurs web - Flutter, Node.js, npm',
    tags: ['glossaire', 'développement', 'web'],
    color: '#818cf8', // Indigo clair
  },
  {
    id: 'mes-references',
    title: 'Mes Références',
    slug: 'mes-references',
    type: 'page',
    category: 'tech',
    description: 'Parcours professionnel et compétences techniques',
    tags: ['portfolio', 'références', 'expérience'],
    color: '#4f46e5', // Indigo foncé
  },
  {
    id: 'projet-en-cours',
    title: 'Projets en Cours',
    slug: 'projet-en-cours',
    type: 'page',
    category: 'tech',
    description: 'Les projets actuels - Crypto, Développement, Finance',
    tags: ['projets', 'actuel'],
    color: '#a5b4fc', // Indigo très clair
  },
  {
    id: 'category-flutter',
    title: 'Flutter',
    slug: 'flutter',
    type: 'category',
    category: 'tech',
    description: 'Kit de développement Google multi-plateforme',
    tags: ['flutter', 'mobile', 'développement'],
    color: '#6366f1',
  },
  {
    id: 'category-sdk',
    title: 'SDK',
    slug: 'sdk',
    type: 'category',
    category: 'tech',
    description: 'Kits de développement logiciel',
    tags: ['sdk', 'développement'],
    color: '#818cf8',
  },
  {
    id: 'category-tutoriel',
    title: 'Tutoriels',
    slug: 'tutoriel',
    type: 'category',
    category: 'tech',
    description: 'Guides et formations pratiques',
    tags: ['tutoriel', 'formation'],
    color: '#4f46e5',
  },

  // ============================================
  // BIOME NATURE (Vert) - Bien-être & Humanisme
  // ============================================
  {
    id: 'hypnose-management',
    title: 'Hypnose Humaniste',
    slug: 'hypnose-humaniste-management',
    type: 'post',
    category: 'nature',
    description: "L'hypnose humaniste dans le management et le développement commercial",
    date: '2024-07-03',
    author: 'Pierre Legrand',
    tags: ['hypnose', 'management', 'bien-être'],
    color: '#22c55e', // Vert
  },
  {
    id: 'vagues-volontaires',
    title: '3 Vagues de Volontaires',
    slug: 'les-3-vagues-de-volontaires',
    type: 'post',
    category: 'nature',
    description: 'Les 3 vagues de volontaires et la nouvelle Terre',
    date: '2024-07-03',
    author: 'Pierre Legrand',
    tags: ['spiritualité', 'conscience', 'lecture'],
    color: '#4ade80', // Vert clair
  },
  {
    id: 'accueil',
    title: 'Bienvenue',
    slug: 'accueil',
    type: 'page',
    category: 'nature',
    description: 'Ingénierie numérique, management commercial & communication humaniste',
    tags: ['accueil', 'présentation'],
    color: '#16a34a', // Vert foncé
  },
  {
    id: 'contact',
    title: 'Contact',
    slug: 'contact',
    type: 'page',
    category: 'nature',
    description: 'Services proposés et informations de contact',
    tags: ['contact', 'services'],
    color: '#86efac', // Vert très clair
  },
  {
    id: 'category-bien-etre',
    title: 'Bien-être',
    slug: 'entreprise-et-bien-etre',
    type: 'category',
    category: 'nature',
    description: 'Entreprise et bien-être au travail',
    tags: ['bien-être', 'entreprise'],
    color: '#22c55e',
  },
  {
    id: 'category-lecture',
    title: 'Lecture',
    slug: 'lecture',
    type: 'category',
    category: 'nature',
    description: 'Ressources de lecture recommandées',
    tags: ['lecture', 'livres'],
    color: '#4ade80',
  },

  // ============================================
  // BIOME CRYPTO (Orange) - Blockchain & Finance
  // ============================================
  {
    id: 'nft-flutter',
    title: 'NFT avec Flutter',
    slug: 'construire-nft-avec-flutter',
    type: 'post',
    category: 'crypto',
    description: 'Construire sa collection NFT avec Flutter, OpenSea et Polygon',
    date: '2022-03-23',
    author: 'Pierre Legrand',
    tags: ['nft', 'flutter', 'blockchain', 'crypto'],
    color: '#f59e0b', // Orange
  },
  {
    id: 'freelance-ia',
    title: 'Freelance & IA',
    slug: 'optimiser-activite-freelance-ia',
    type: 'post',
    category: 'crypto',
    description: "Optimiser son activité de Freelance avec l'Intelligence artificielle",
    date: '2024-06-13',
    author: 'Pierre Legrand',
    tags: ['freelance', 'ia', 'automatisation'],
    color: '#fbbf24', // Orange clair
  },
  {
    id: 'crypto-cheatsheet',
    title: 'Expert Crypto',
    slug: 'expert-crypto-feuille-de-triche',
    type: 'page',
    category: 'crypto',
    description: 'Guide de référence crypto - TON, Mining, GPU',
    date: '2022-02-09',
    tags: ['crypto', 'mining', 'blockchain'],
    color: '#d97706', // Orange foncé
  },
  {
    id: 'vocabulaire-crypto',
    title: 'Vocabulaire Crypto',
    slug: 'vocabulaire-crypto-blockchain',
    type: 'page',
    category: 'crypto',
    description: 'Lexique des termes crypto et blockchain',
    tags: ['crypto', 'vocabulaire', 'blockchain'],
    color: '#fcd34d', // Orange très clair
  },
  {
    id: 'category-freelance',
    title: 'Freelance',
    slug: 'freelance',
    type: 'category',
    category: 'crypto',
    description: 'Ressources pour freelances',
    tags: ['freelance', 'indépendant'],
    color: '#f59e0b',
  },
]

/**
 * Filtre le contenu par catégorie/biome
 */
export function getContentByCategory(category: ContentCategory): ContentItem[] {
  return CONTENT_DATA.filter((item) => item.category === category)
}

/**
 * Filtre le contenu par type
 */
export function getContentByType(type: ContentType): ContentItem[] {
  return CONTENT_DATA.filter((item) => item.type === type)
}

/**
 * Récupère un contenu par son ID
 */
export function getContentById(id: string): ContentItem | undefined {
  return CONTENT_DATA.find((item) => item.id === id)
}

/**
 * Configuration des positions des murs par biome dans World2
 * Chaque biome a une zone dédiée sur la carte
 */
export interface WallPlacement {
  contentId: string
  position: [number, number, number]
  rotation?: [number, number, number]
  rows: number
  cols: number
}

/**
 * Configuration de la carte du niveau 2
 * La carte est divisée en 3 zones triangulaires depuis le centre
 */
export const BIOME_ZONES = {
  // Zone TECH - Nord-Est (Z négatif, X positif)
  tech: {
    center: [15, 0, -15] as [number, number, number],
    color: { primary: '#6366f1', secondary: '#818cf8', ground: '#1e1b4b' },
    portalPosition: [20, 1, -20] as [number, number, number],
  },
  // Zone NATURE - Nord-Ouest (Z négatif, X négatif)
  nature: {
    center: [-15, 0, -15] as [number, number, number],
    color: { primary: '#22c55e', secondary: '#4ade80', ground: '#14532d' },
    portalPosition: [-20, 1, -20] as [number, number, number],
  },
  // Zone CRYPTO - Sud (Z positif)
  crypto: {
    center: [0, 0, 20] as [number, number, number],
    color: { primary: '#f59e0b', secondary: '#fbbf24', ground: '#451a03' },
    portalPosition: [0, 1, 25] as [number, number, number],
  },
}

/**
 * Génère les placements de murs pour un biome donné
 */
export function generateWallPlacements(category: ContentCategory): WallPlacement[] {
  const contents = getContentByCategory(category)
  const zone = BIOME_ZONES[category]
  const placements: WallPlacement[] = []

  // Disposition en arc de cercle autour du centre du biome
  const radius = 8
  const angleStep = Math.PI / (contents.length + 1)
  const startAngle = category === 'crypto' ? -Math.PI / 2 : Math.PI / 4

  contents.forEach((content, index) => {
    const angle = startAngle + angleStep * (index + 1)
    const x = zone.center[0] + Math.cos(angle) * radius
    const z = zone.center[2] + Math.sin(angle) * radius

    // Rotation pour faire face au centre
    const rotationY = Math.atan2(zone.center[0] - x, zone.center[2] - z)

    // Taille variable selon le type de contenu
    const rows = content.type === 'post' ? 5 : content.type === 'page' ? 4 : 3
    const cols = content.type === 'post' ? 8 : content.type === 'page' ? 6 : 5

    placements.push({
      contentId: content.id,
      position: [x, 0, z],
      rotation: [0, rotationY, 0],
      rows,
      cols,
    })
  })

  return placements
}
