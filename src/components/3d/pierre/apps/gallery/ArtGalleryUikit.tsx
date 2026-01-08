/**
 * ArtGalleryUikit - Galerie d'art virtuelle avec @pmndrs/uikit.
 *
 * Version native 3D de ArtGallery utilisant uikit au lieu de Html de drei.
 * Rendu directement en Three.js pour une meilleure intégration visuelle.
 */

import { useCallback, useState } from 'react'
import { Container, Text, DefaultProperties } from '@react-three/uikit'
import {
  Gamepad2,
  Globe,
  Bird,
  Joystick,
  Monitor,
  Image,
  ChevronLeft,
  ChevronRight,
  Landmark,
  LogOut,
} from '@react-three/uikit-lucide'

type IconComponent = typeof Gamepad2

interface ArtGalleryUikitProps {
  /** Callback pour naviguer vers le Hub 3D */
  onNavigateToHub?: () => void
}

interface Artwork {
  id: string
  title: string
  artist: string
  description: string
  Icon: IconComponent
  tags: string[]
}

// Collection d'œuvres (projets de Pierre)
const ARTWORKS: Artwork[] = [
  {
    id: 'portfolio-3d',
    title: '3D Portfolio',
    artist: 'Pierre Legrand',
    description: 'An immersive 3D portfolio featuring multiple biomes, physics-based interactions, and a character controller for exploration.',
    Icon: Gamepad2,
    tags: ['React', 'R3F', 'Rapier', 'Zustand'],
  },
  {
    id: 'procedural-world',
    title: 'Procedural World',
    artist: 'Pierre Legrand',
    description: 'A procedurally generated terrain system with heightmaps, biome transitions, water systems, and instanced decorations.',
    Icon: Globe,
    tags: ['Three.js', 'GLSL', 'Noise', 'LOD'],
  },
  {
    id: 'angry-birds',
    title: 'Angry Birds 3D',
    artist: 'Pierre Legrand',
    description: 'A physics-based destruction game inspired by Angry Birds, built with Rapier physics and GSAP animations.',
    Icon: Bird,
    tags: ['Rapier', 'GSAP', 'Physics', 'R3F'],
  },
  {
    id: 'arcade-games',
    title: 'Arcade Collection',
    artist: 'Pierre Legrand',
    description: 'Classic arcade games (Snake, Tetris, Breakout) reimplemented in TypeScript with canvas rendering.',
    Icon: Joystick,
    tags: ['Canvas', 'TypeScript', 'Games'],
  },
  {
    id: 'joan-os',
    title: 'Desktop Experience',
    artist: 'Pierre Legrand',
    description: 'A Windows-inspired desktop interface built with uikit, featuring draggable windows and interactive applications.',
    Icon: Monitor,
    tags: ['uikit', 'R3F', 'UI/UX'],
  },
  {
    id: 'art-gallery',
    title: 'Virtual Gallery',
    artist: 'Pierre Legrand',
    description: 'This very art gallery you are viewing! A virtual museum experience to showcase projects.',
    Icon: Image,
    tags: ['uikit', 'Design', 'Interactive'],
  },
]

// Couleurs du thème
const COLORS = {
  background: '#0d0d0d',
  surface: '#1a1a1a',
  surfaceLight: '#2d2d2d',
  primary: '#0078d4',
  text: '#ffffff',
  textMuted: '#888888',
  border: 'rgba(255,255,255,0.1)',
  frame: '#3d3d3d',
  frameInner: '#2a2a2a',
}

export function ArtGalleryUikit({ onNavigateToHub }: ArtGalleryUikitProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const currentArtwork = ARTWORKS[currentIndex]

  // Navigation
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % ARTWORKS.length)
  }, [])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + ARTWORKS.length) % ARTWORKS.length)
  }, [])

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  if (!currentArtwork) return null

  return (
    <DefaultProperties>
      <Container
        flexDirection="column"
        backgroundColor={COLORS.background}
        width="100%"
        height="100%"
      >
        {/* Header */}
        <Container
          height={56}
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          paddingX={24}
          backgroundColor="rgba(0,0,0,0.5)"
          borderBottomWidth={1}
          borderColor={COLORS.border}
        >
          {/* Logo */}
          <Container flexDirection="row" alignItems="center" gap={12}>
            <Landmark width={24} height={24} color={COLORS.text} />
            <Text fontSize={18} color={COLORS.text} fontWeight="bold" letterSpacing={2}>
              GALLERY
            </Text>
          </Container>

          {/* Nav Buttons */}
          <Container flexDirection="row" gap={8}>
            <Container
              width={40}
              height={40}
              borderRadius={20}
              borderWidth={1}
              borderColor="rgba(255,255,255,0.2)"
              backgroundColor="rgba(255,255,255,0.05)"
              justifyContent="center"
              alignItems="center"
              hover={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              cursor="pointer"
              onClick={goToPrev}
            >
              <ChevronLeft width={16} height={16} color={COLORS.text} />
            </Container>
            <Container
              width={40}
              height={40}
              borderRadius={20}
              borderWidth={1}
              borderColor="rgba(255,255,255,0.2)"
              backgroundColor="rgba(255,255,255,0.05)"
              justifyContent="center"
              alignItems="center"
              hover={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              cursor="pointer"
              onClick={goToNext}
            >
              <ChevronRight width={16} height={16} color={COLORS.text} />
            </Container>
          </Container>
        </Container>

        {/* Main Gallery Area */}
        <Container
          flexGrow={1}
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          padding={24}
          positionType="relative"
        >
          {/* Artwork Frame */}
          <Container
            flexDirection="column"
            alignItems="center"
          >
            {/* Frame Outer */}
            <Container
              backgroundColor={COLORS.frame}
              padding={20}
              borderRadius={4}
            >
              {/* Frame Inner */}
              <Container
                backgroundColor={COLORS.frameInner}
                padding={8}
                borderWidth={2}
                borderColor="#4a4a4a"
              >
                {/* Artwork */}
                <Container
                  width={300}
                  height={200}
                  backgroundColor={COLORS.primary}
                  justifyContent="center"
                  alignItems="center"
                >
                  <currentArtwork.Icon width={64} height={64} color={COLORS.text} />
                </Container>
              </Container>
            </Container>

            {/* Placard */}
            <Container
              marginTop={20}
              backgroundColor={COLORS.surfaceLight}
              paddingX={24}
              paddingY={12}
              borderRadius={4}
              borderWidth={1}
              borderColor={COLORS.border}
              alignItems="center"
            >
              <Text fontSize={14} color={COLORS.text} fontWeight="bold">{currentArtwork.title}</Text>
              <Text fontSize={11} color={COLORS.textMuted} marginTop={4}>{currentArtwork.artist}</Text>
            </Container>
          </Container>

          {/* Info Panel */}
          <Container
            positionType="absolute"
            positionRight={24}
            positionTop={50}
            width={200}
            backgroundColor="rgba(0,0,0,0.7)"
            borderRadius={8}
            padding={16}
            borderWidth={1}
            borderColor={COLORS.border}
            flexDirection="column"
          >
            <Text fontSize={12} color={COLORS.textMuted} letterSpacing={1} marginBottom={12}>
              ABOUT THIS WORK
            </Text>
            <Text fontSize={13} color="#ccc" lineHeight={1.5} marginBottom={16}>
              {currentArtwork.description}
            </Text>

            {/* Tags */}
            <Container flexDirection="row" flexWrap="wrap" gap={6}>
              {currentArtwork.tags.map((tag) => (
                <Container
                  key={tag}
                  paddingX={10}
                  paddingY={4}
                  backgroundColor="rgba(255,255,255,0.1)"
                  borderRadius={12}
                >
                  <Text fontSize={10} color="#aaa">{tag}</Text>
                </Container>
              ))}
            </Container>
          </Container>
        </Container>

        {/* Indicators */}
        <Container
          height={40}
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          gap={8}
          backgroundColor="rgba(0,0,0,0.3)"
        >
          {ARTWORKS.map((artwork, index) => (
            <Container
              key={artwork.id}
              width={index === currentIndex ? 10 : 8}
              height={index === currentIndex ? 10 : 8}
              borderRadius={5}
              backgroundColor={index === currentIndex ? COLORS.text : 'rgba(255,255,255,0.3)'}
              hover={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
              cursor="pointer"
              onClick={() => goToIndex(index)}
            />
          ))}
        </Container>

        {/* Footer */}
        <Container
          height={44}
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          paddingX={24}
          backgroundColor="rgba(0,0,0,0.5)"
          borderTopWidth={1}
          borderColor={COLORS.border}
        >
          {/* Counter */}
          <Text fontSize={11} color={COLORS.textMuted}>
            {currentIndex + 1} / {ARTWORKS.length}
          </Text>

          {/* Navigation Hint */}
          <Container flexDirection="row" alignItems="center" gap={8}>
            <Container paddingX={8} paddingY={4} backgroundColor="rgba(255,255,255,0.1)" borderRadius={4}>
              <ChevronLeft width={10} height={10} color={COLORS.textMuted} />
            </Container>
            <Container paddingX={8} paddingY={4} backgroundColor="rgba(255,255,255,0.1)" borderRadius={4}>
              <ChevronRight width={10} height={10} color={COLORS.textMuted} />
            </Container>
            <Text fontSize={11} color={COLORS.textMuted}>Navigate</Text>
          </Container>

          {/* Exit Button */}
          {onNavigateToHub && (
            <Container
              paddingX={12}
              paddingY={6}
              backgroundColor="rgba(255,255,255,0.1)"
              borderRadius={4}
              hover={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              cursor="pointer"
              onClick={onNavigateToHub}
              flexDirection="row"
              alignItems="center"
              gap={6}
            >
              <LogOut width={11} height={11} color={COLORS.text} />
              <Text fontSize={11} color={COLORS.text}>Exit Gallery</Text>
            </Container>
          )}
        </Container>
      </Container>
    </DefaultProperties>
  )
}

export default ArtGalleryUikit
