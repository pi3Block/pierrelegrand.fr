/**
 * ArtGallery - Galerie d'art virtuelle pour le moniteur droit.
 * Inspiré du projet joan-art-gallery de jrefusta.
 *
 * Affiche les projets de Pierre dans un format galerie d'art avec
 * navigation entre les œuvres et informations détaillées.
 */

import { useCallback, useEffect, useState } from 'react'
import styles from './ArtGallery.module.css'

interface ArtGalleryProps {
  /** Callback pour naviguer vers le Hub 3D */
  onNavigateToHub?: () => void
}

interface Artwork {
  id: string
  title: string
  artist: string
  description: string
  icon: string
  tags: string[]
  links?: {
    demo?: string
    source?: string
  }
}

// Collection d'œuvres (projets de Pierre)
const ARTWORKS: Artwork[] = [
  {
    id: 'portfolio-3d',
    title: '3D Portfolio',
    artist: 'Pierre Legrand',
    description: 'An immersive 3D portfolio featuring multiple biomes, physics-based interactions, and a character controller for exploration.',
    icon: '🎮',
    tags: ['React', 'R3F', 'Rapier', 'Zustand'],
    links: {
      demo: 'https://pierrelegrand.fr',
    },
  },
  {
    id: 'procedural-world',
    title: 'Procedural World',
    artist: 'Pierre Legrand',
    description: 'A procedurally generated terrain system with heightmaps, biome transitions, water systems, and instanced decorations.',
    icon: '🌍',
    tags: ['Three.js', 'GLSL', 'Noise', 'LOD'],
  },
  {
    id: 'angry-birds',
    title: 'Angry Birds 3D',
    artist: 'Pierre Legrand',
    description: 'A physics-based destruction game inspired by Angry Birds, built with Rapier physics and GSAP animations.',
    icon: '🐦',
    tags: ['Rapier', 'GSAP', 'Physics', 'R3F'],
  },
  {
    id: 'arcade-games',
    title: 'Arcade Collection',
    artist: 'Pierre Legrand',
    description: 'Classic arcade games (Snake, Tetris, Breakout) reimplemented in TypeScript with canvas rendering.',
    icon: '🕹️',
    tags: ['Canvas', 'TypeScript', 'Games'],
  },
  {
    id: 'joan-os',
    title: 'Desktop Experience',
    artist: 'Pierre Legrand',
    description: 'A Windows-inspired desktop interface built in React, featuring draggable windows and interactive applications.',
    icon: '🖥️',
    tags: ['React', 'CSS', 'UI/UX'],
  },
  {
    id: 'art-gallery',
    title: 'Virtual Gallery',
    artist: 'Pierre Legrand',
    description: 'This very art gallery you are viewing! A virtual museum experience to showcase projects.',
    icon: '🖼️',
    tags: ['React', 'Design', 'Interactive'],
  },
]

export function ArtGallery({ onNavigateToHub }: ArtGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const currentArtwork = ARTWORKS[currentIndex]

  // Navigation
  const goToNext = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev + 1) % ARTWORKS.length)
    setTimeout(() => setIsTransitioning(false), 500)
  }, [isTransitioning])

  const goToPrev = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev - 1 + ARTWORKS.length) % ARTWORKS.length)
    setTimeout(() => setIsTransitioning(false), 500)
  }, [isTransitioning])

  const goToIndex = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 500)
  }, [isTransitioning, currentIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrev()
          break
        case 'ArrowRight':
          goToNext()
          break
        case 'Escape':
          onNavigateToHub?.()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrev, onNavigateToHub])

  if (!currentArtwork) return null

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🏛️</span>
          <span className={styles.logoText}>Gallery</span>
        </div>
        <div className={styles.navButtons}>
          <button
            className={styles.navButton}
            onClick={goToPrev}
            disabled={isTransitioning}
            aria-label="Previous artwork"
          >
            ←
          </button>
          <button
            className={styles.navButton}
            onClick={goToNext}
            disabled={isTransitioning}
            aria-label="Next artwork"
          >
            →
          </button>
        </div>
      </header>

      {/* Main Gallery Area */}
      <main className={styles.gallery}>
        {/* Spotlight effect */}
        <div className={styles.spotlight} />

        {/* Artwork Frame */}
        <div className={styles.artworkFrame} key={currentArtwork.id}>
          <div className={styles.frameOuter}>
            <div className={styles.frameInner}>
              <div className={styles.artworkContainer}>
                <div className={styles.artworkPlaceholder}>
                  {currentArtwork.icon}
                </div>
              </div>
            </div>
          </div>

          {/* Placard */}
          <div className={styles.placard}>
            <h3 className={styles.placardTitle}>{currentArtwork.title}</h3>
            <p className={styles.placardArtist}>{currentArtwork.artist}</p>
          </div>
        </div>

        {/* Info Panel */}
        <aside className={styles.infoPanel}>
          <h4 className={styles.infoPanelTitle}>About this work</h4>
          <p className={styles.infoPanelDescription}>
            {currentArtwork.description}
          </p>
          <div className={styles.infoPanelTags}>
            {currentArtwork.tags.map((tag) => (
              <span key={tag} className={styles.infoPanelTag}>
                {tag}
              </span>
            ))}
          </div>
          {currentArtwork.links && (
            <div className={styles.infoPanelLinks}>
              {currentArtwork.links.demo && (
                <button
                  className={styles.infoPanelLink}
                  onClick={() => window.open(currentArtwork.links?.demo, '_blank')}
                >
                  Live Demo
                </button>
              )}
              {currentArtwork.links.source && (
                <button
                  className={styles.infoPanelLink}
                  onClick={() => window.open(currentArtwork.links?.source, '_blank')}
                >
                  Source
                </button>
              )}
            </div>
          )}
        </aside>
      </main>

      {/* Indicators */}
      <div className={styles.indicators}>
        {ARTWORKS.map((artwork, index) => (
          <button
            key={artwork.id}
            className={`${styles.indicator} ${index === currentIndex ? styles.indicatorActive : ''}`}
            onClick={() => goToIndex(index)}
            aria-label={`Go to ${artwork.title}`}
          />
        ))}
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerNav}>
          <span>{currentIndex + 1} / {ARTWORKS.length}</span>
        </div>
        <div className={styles.footerHint}>
          <span className={styles.footerKey}>←</span>
          <span className={styles.footerKey}>→</span>
          <span>Navigate</span>
        </div>
        {onNavigateToHub && (
          <button
            className={styles.infoPanelLink}
            onClick={onNavigateToHub}
            style={{ padding: '4px 12px' }}
          >
            Exit Gallery
          </button>
        )}
      </footer>
    </div>
  )
}

export default ArtGallery
