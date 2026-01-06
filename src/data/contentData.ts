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
  textureUrl?: string
  color: string
}

export const CONTENT_DATA: ContentItem[] = [
  // BIOME TECH
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
    textureUrl: '/images/pages/Flutter-SDK.png',
    color: '#6366f1',
  },
  {
    id: 'glossaire-dev',
    title: 'Glossaire Dev',
    slug: 'glossaire-developpeur',
    type: 'page',
    category: 'tech',
    description: 'Vocabulaire des développeurs web',
    tags: ['glossaire', 'développement', 'web'],
    textureUrl: '/images/pages/FullStackWebApps.png',
    color: '#818cf8',
  },
  {
    id: 'mes-references',
    title: 'Mes Références',
    slug: 'mes-references',
    type: 'page',
    category: 'tech',
    description: 'Parcours professionnel et compétences techniques',
    tags: ['portfolio', 'références', 'expérience'],
    textureUrl: '/images/pages/logo_infotel.png',
    color: '#4f46e5',
  },
  {
    id: 'projet-en-cours',
    title: 'Projets en Cours',
    slug: 'projet-en-cours',
    type: 'page',
    category: 'tech',
    description: 'Les projets actuels',
    tags: ['projets', 'actuel'],
    textureUrl: '/images/pages/DesktopApps.png',
    color: '#a5b4fc',
  },
  {
    id: 'category-flutter',
    title: 'Flutter',
    slug: 'flutter',
    type: 'category',
    category: 'tech',
    description: 'Kit de développement Google multi-plateforme',
    tags: ['flutter', 'mobile', 'développement'],
    textureUrl: '/images/posts/Google-flutter-logo-1.svg',
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
    textureUrl: '/images/pages/Mobile-Apps.png',
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
    textureUrl: '/images/pages/StaticSiteSeo.png',
    color: '#4f46e5',
  },
  // BIOME NATURE
  {
    id: 'hypnose-management',
    title: 'Hypnose Humaniste',
    slug: 'hypnose-humaniste-management',
    type: 'post',
    category: 'nature',
    description: "L'hypnose humaniste dans le management",
    date: '2024-07-03',
    author: 'Pierre Legrand',
    tags: ['hypnose', 'management', 'bien-être'],
    textureUrl: '/images/posts/feature1.jpg',
    color: '#22c55e',
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
    textureUrl: '/images/posts/les-trois-vagues-de-volontaires.jpg',
    color: '#4ade80',
  },
  {
    id: 'accueil',
    title: 'Bienvenue',
    slug: 'accueil',
    type: 'page',
    category: 'nature',
    description: 'Ingénierie numérique, management commercial & communication humaniste',
    tags: ['accueil', 'présentation'],
    textureUrl: '/images/L.png',
    color: '#16a34a',
  },
  {
    id: 'contact',
    title: 'Contact',
    slug: 'contact',
    type: 'page',
    category: 'nature',
    description: 'Services proposés et informations de contact',
    tags: ['contact', 'services'],
    textureUrl: '/images/pages/fav-logo-LP.png',
    color: '#86efac',
  },
  {
    id: 'category-bien-etre',
    title: 'Bien-être',
    slug: 'entreprise-et-bien-etre',
    type: 'category',
    category: 'nature',
    description: 'Entreprise et bien-être au travail',
    tags: ['bien-être', 'entreprise'],
    textureUrl: '/images/posts/feature3.jpg',
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
    textureUrl: '/images/posts/feature4.jpg',
    color: '#4ade80',
  },
  // BIOME CRYPTO
  {
    id: 'nft-flutter',
    title: 'NFT avec Flutter',
    slug: 'construire-nft-avec-flutter',
    type: 'post',
    category: 'crypto',
    description: 'Construire sa collection NFT avec Flutter',
    date: '2022-03-23',
    author: 'Pierre Legrand',
    tags: ['nft', 'flutter', 'blockchain', 'crypto'],
    textureUrl: '/images/posts/Logo.png',
    color: '#f59e0b',
  },
  {
    id: 'freelance-ia',
    title: 'Freelance & IA',
    slug: 'optimiser-activite-freelance-ia',
    type: 'post',
    category: 'crypto',
    description: "Optimiser son activité de Freelance avec l'IA",
    date: '2024-06-13',
    author: 'Pierre Legrand',
    tags: ['freelance', 'ia', 'automatisation'],
    textureUrl: '/images/posts/Capture-decran-2024-06-13-143345.png',
    color: '#fbbf24',
  },
  {
    id: 'crypto-cheatsheet',
    title: 'Expert Crypto',
    slug: 'expert-crypto-feuille-de-triche',
    type: 'page',
    category: 'crypto',
    description: 'Guide de référence crypto',
    date: '2022-02-09',
    tags: ['crypto', 'mining', 'blockchain'],
    textureUrl: '/images/pages/Web3EthereumApp.png',
    color: '#d97706',
  },
  {
    id: 'vocabulaire-crypto',
    title: 'Vocabulaire Crypto',
    slug: 'vocabulaire-crypto-blockchain',
    type: 'page',
    category: 'crypto',
    description: 'Lexique des termes crypto et blockchain',
    tags: ['crypto', 'vocabulaire', 'blockchain'],
    textureUrl: '/images/pages/smart-contracts.png',
    color: '#fcd34d',
  },
  {
    id: 'category-freelance',
    title: 'Freelance',
    slug: 'freelance',
    type: 'category',
    category: 'crypto',
    description: 'Ressources pour freelances',
    tags: ['freelance', 'indépendant'],
    textureUrl: '/images/posts/Capture-decran-2024-06-13-144218.png',
    color: '#f59e0b',
  },
]

export function getContentByCategory(category: ContentCategory): ContentItem[] {
  return CONTENT_DATA.filter((item) => item.category === category)
}

export function getContentByType(type: ContentType): ContentItem[] {
  return CONTENT_DATA.filter((item) => item.type === type)
}

export function getContentById(id: string): ContentItem | undefined {
  return CONTENT_DATA.find((item) => item.id === id)
}

export interface WallPlacement {
  contentId: string
  position: [number, number, number]
  rotation?: [number, number, number]
  rows: number
  cols: number
}

export const BIOME_ZONES = {
  tech: {
    center: [15, 0, -15] as [number, number, number],
    color: { primary: '#6366f1', secondary: '#818cf8', ground: '#1e1b4b' },
    portalPosition: [20, 1, -20] as [number, number, number],
  },
  nature: {
    center: [-15, 0, -15] as [number, number, number],
    color: { primary: '#22c55e', secondary: '#4ade80', ground: '#14532d' },
    portalPosition: [-20, 1, -20] as [number, number, number],
  },
  crypto: {
    center: [0, 0, 20] as [number, number, number],
    color: { primary: '#f59e0b', secondary: '#fbbf24', ground: '#451a03' },
    portalPosition: [0, 1, 25] as [number, number, number],
  },
}

export function generateWallPlacements(category: ContentCategory): WallPlacement[] {
  const contents = getContentByCategory(category)
  const zone = BIOME_ZONES[category]
  const placements: WallPlacement[] = []
  const radius = 8
  const angleStep = Math.PI / (contents.length + 1)
  const startAngle = category === 'crypto' ? -Math.PI / 2 : Math.PI / 4
  contents.forEach((content, index) => {
    const angle = startAngle + angleStep * (index + 1)
    const x = zone.center[0] + Math.cos(angle) * radius
    const z = zone.center[2] + Math.sin(angle) * radius
    const rotationY = Math.atan2(zone.center[0] - x, zone.center[2] - z)
    const rows = content.type === 'post' ? 5 : content.type === 'page' ? 4 : 3
    const cols = content.type === 'post' ? 8 : content.type === 'page' ? 6 : 5
    placements.push({ contentId: content.id, position: [x, 0, z], rotation: [0, rotationY, 0], rows, cols })
  })
  return placements
}
