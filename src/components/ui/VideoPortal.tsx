/**
 * VideoPortal - Modal vidéo YouTube avec effet portail.
 * Animation depuis la position d'origine (objet 3D cliqué) vers le centre de l'écran.
 */

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useUIStore } from '@stores/uiStore'

/**
 * Variants Framer Motion pour l'animation portail.
 * L'animation part de la position d'origine et s'étend vers le centre.
 */
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const portalVariants: Variants = {
  hidden: (origin: { x: number; y: number } | null) => ({
    x: origin?.x ?? '50%',
    y: origin?.y ?? '50%',
    scale: 0,
    opacity: 0,
    translateX: '-50%',
    translateY: '-50%',
  }),
  visible: {
    x: '50%',
    y: '50%',
    scale: 1,
    opacity: 1,
    translateX: '-50%',
    translateY: '-50%',
    transition: {
      type: 'spring' as const,
      damping: 25,
      stiffness: 200,
      mass: 0.8,
    },
  },
  exit: (origin: { x: number; y: number } | null) => ({
    x: origin?.x ?? '50%',
    y: origin?.y ?? '50%',
    scale: 0,
    opacity: 0,
    translateX: '-50%',
    translateY: '-50%',
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  }),
}

/**
 * Composant VideoPortal - Affiche une vidéo YouTube dans un modal avec effet portail.
 * Se ferme avec : bouton X, touche Echap, clic sur le backdrop.
 */
export function VideoPortal() {
  const { videoModal, closeVideoModal } = useUIStore()
  const { isOpen, videoId, originPosition } = videoModal

  // Fermer avec Echap
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeVideoModal()
      }
    },
    [isOpen, closeVideoModal]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Empêcher le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && videoId && (
        <>
          {/* Backdrop avec blur */}
          <motion.div
            className="video-portal-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeVideoModal}
          />

          {/* Container vidéo avec effet portail */}
          <motion.div
            className="video-portal-container"
            custom={originPosition}
            variants={portalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Bouton fermer */}
            <button
              className="video-portal-close"
              onClick={closeVideoModal}
              aria-label="Fermer la vidéo"
            >
              ✕
            </button>

            {/* Lecteur YouTube - iframe direct pour éviter problèmes de types */}
            <div className="video-portal-player">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                width="100%"
                height="100%"
                title="Vidéo YouTube"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

