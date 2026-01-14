/**
 * WallText - Texte mural affiché à côté des tableaux.
 *
 * Affiche le titre, la description et les liens du projet
 * directement sur le mur, comme dans une vraie galerie.
 */

import { Text } from '@react-three/drei'
import { GALLERY_CONFIG } from '../galleryConfig'
import { FONTS } from '@config/assetPaths'

/**
 * Configuration d'un texte mural.
 */
interface WallTextConfig {
  id: string
  title: string
  subtitle?: string
  description: string
  links?: {
    demo?: string
    source?: string
  }
  position: [number, number, number]
  rotation: [number, number, number]
}

/**
 * Données des textes muraux - correspond aux tableaux.
 */
const WALL_TEXTS: WallTextConfig[] = [
  // Mur Ouest - Tableau 1
  {
    id: 'portfolio-text',
    title: 'PIERRE LEGRAND\'S PORTFOLIO',
    subtitle: 'React Three Fiber • Three.js • GLSL',
    description: 'Developed a personal website inspired by my desktop setup using Blender, Three.js, GLSL, and JavaScript, creating an interactive experience that reflects my personal style and showcases my technical skills in 3D design and web development.',
    links: { demo: 'https://pierrelegrand.fr' },
    position: [-5.85, 2, 1], // À droite du premier tableau
    rotation: [0, Math.PI / 2, 0],
  },
  // Mur Est - Tableau principal (grand)
  {
    id: 'foudafrique-text',
    title: 'FOUDAFRIQUE',
    subtitle: 'E-commerce • React • Node.js',
    description: 'Site e-commerce de produits africains avec système de paiement intégré, gestion des stocks et interface d\'administration.',
    links: { demo: 'https://foudafrique.fr' },
    position: [5.85, 2, 1],
    rotation: [0, -Math.PI / 2, 0],
  },
]

/**
 * Props pour un bloc de texte mural.
 */
interface WallTextBlockProps {
  config: WallTextConfig
  onLinkClick?: (url: string) => void
}

/**
 * Bloc de texte mural individuel.
 */
function WallTextBlock({ config }: WallTextBlockProps) {
  const textWidth = 2.5

  return (
    <group position={config.position} rotation={config.rotation}>
      {/* Titre principal */}
      <Text
        position={[0, 0.4, 0.01]}
        fontSize={0.12}
        color="#1a1a1a"
        anchorX="left"
        anchorY="top"
        font={FONTS.ROBOTO_BLACK}
        maxWidth={textWidth}
      >
        {config.title}
      </Text>

      {/* Sous-titre (technologies) */}
      {config.subtitle && (
        <Text
          position={[0, 0.22, 0.01]}
          fontSize={0.06}
          color="#666666"
          anchorX="left"
          anchorY="top"
          font={FONTS.ROBOTO_LIGHT}
          maxWidth={textWidth}
        >
          {config.subtitle}
        </Text>
      )}

      {/* Description */}
      <Text
        position={[0, 0.08, 0.01]}
        fontSize={0.045}
        color="#333333"
        anchorX="left"
        anchorY="top"
        font={FONTS.ROBOTO_LIGHT}
        maxWidth={textWidth}
        lineHeight={1.4}
      >
        {config.description}
      </Text>

      {/* Liens */}
      {config.links && (
        <group position={[0, -0.35, 0.01]}>
          {config.links.demo && (
            <Text
              position={[0, 0, 0]}
              fontSize={0.05}
              color="#0066cc"
              anchorX="left"
              anchorY="middle"
              font={FONTS.ROBOTO_BLACK}
            >
              LIVE DEMO
            </Text>
          )}
          {config.links.source && (
            <Text
              position={[config.links.demo ? 0.6 : 0, 0, 0]}
              fontSize={0.05}
              color="#0066cc"
              anchorX="left"
              anchorY="middle"
              font={FONTS.ROBOTO_BLACK}
            >
              SOURCE CODE
            </Text>
          )}
        </group>
      )}
    </group>
  )
}

/**
 * Navigation PREV/NEXT affichée sur le mur.
 */
function NavigationText() {
  const { room } = GALLERY_CONFIG

  return (
    <>
      {/* PREV - Mur gauche */}
      <Text
        position={[-room.width / 2 + 0.5, 1, 0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.15}
        color="#888888"
        anchorX="center"
        anchorY="middle"
        font={FONTS.ROBOTO_LIGHT}
      >
        PREV
      </Text>

      {/* NEXT - Mur droit */}
      <Text
        position={[room.width / 2 - 0.5, 1, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        fontSize={0.15}
        color="#888888"
        anchorX="center"
        anchorY="middle"
        font={FONTS.ROBOTO_LIGHT}
      >
        NEXT
      </Text>
    </>
  )
}

/**
 * Composant principal des textes muraux.
 * Désactivé pour une galerie plus épurée.
 */
export function WallText() {
  // Retourne un groupe vide - textes désactivés
  return <group name="wall-texts" />
}

export default WallText
