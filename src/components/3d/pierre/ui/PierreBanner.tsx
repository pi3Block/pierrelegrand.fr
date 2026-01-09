/**
 * PierreBanner - Bandeau de navigation supérieur.
 *
 * Style identique au portfolio Joan : fond bleu foncé, texte doré.
 */

import { useState, useEffect } from 'react'
import { usePierreStore, type PierreStage } from '../stores/pierreStore'
import styles from './PierreBanner.module.css'

/**
 * Hook pour détecter si on est en mode portrait sur mobile.
 */
function useIsPortraitMobile() {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false)

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 768
      const isPortrait = window.innerHeight > window.innerWidth
      setIsPortraitMobile(isMobile && isPortrait)
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  return isPortraitMobile
}

// Emoji dé à 6 faces pour le bouton
const SHUFFLE_ICON = '🎲'

// Configuration des sections de navigation (style Joan)
const NAV_ITEMS: { id: PierreStage; label: string }[] = [
  { id: 'leftMonitor', label: 'À PROPOS' },
  { id: 'rightMonitor', label: 'GALERIE' },
  { id: 'arcadeMachine', label: 'ARCADE MACHINE' },
  { id: 'whiteboard', label: 'TABLEAU BLANC' },
  { id: 'rubikGroup', label: "RUBIK'S CUBE" },
  { id: 'pingpong', label: 'PING-PONG' },
]

interface PierreBannerProps {
  onNavigate: (stage: PierreStage) => void
  onBackToHub: () => void
  onBackToDefault?: () => void
}

/**
 * Composant bandeau de navigation.
 */
export function PierreBanner({ onNavigate, onBackToHub, onBackToDefault }: PierreBannerProps) {
  const currentStage = usePierreStore((s) => s.currentStage)
  const isRubikShuffling = usePierreStore((s) => s.isRubikShuffling)
  const shuffleRubik = usePierreStore((s) => s.shuffleRubik)
  const isPortraitMobile = useIsPortraitMobile()

  const isFocused = currentStage !== 'default'
  const isRubikMode = currentStage === 'rubikGroup'
  const isOnMonitor = currentStage === 'leftMonitor' || currentStage === 'rightMonitor'

  // Afficher le message "tournez votre téléphone" si on est sur un moniteur en mode portrait
  const showRotateMessage = isOnMonitor && isPortraitMobile

  const handleNavClick = (id: PierreStage) => {
    onNavigate(id)
  }

  return (
    <>
      {/* Message "Tournez votre téléphone" (visible sur moniteur en mode portrait) */}
      {showRotateMessage && (
        <div className={styles.rotateOverlay}>
          <div className={styles.rotateContent}>
            <div className={styles.rotateIcon}>📱</div>
            <p className={styles.rotateText}>
              Tournez votre téléphone en mode paysage pour une meilleure expérience
            </p>
          </div>
        </div>
      )}

      {/* Bouton retour flottant (visible uniquement en mode focus) */}
      {isFocused && onBackToDefault && (
        <button
          className={styles.floatingBackButton}
          onClick={onBackToDefault}
        >
          ← BACK
        </button>
      )}

      {/* Bouton Mélanger (visible uniquement en mode Rubik) */}
      {isRubikMode && (
        <button
          className={`${styles.floatingShuffleButton} ${isRubikShuffling ? styles.disabled : ''}`}
          onClick={shuffleRubik}
          disabled={isRubikShuffling}
        >
          {SHUFFLE_ICON} MÉLANGER
        </button>
      )}

      <header className={`${styles.banner} ${isFocused ? styles.collapsed : ''}`}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`${styles.bannerLink} ${currentStage === item.id ? styles.active : ''}`}
            onClick={() => handleNavClick(item.id)}
          >
            {item.label}
          </button>
        ))}

        {/* Séparateur visuel */}
        <span className={styles.separator}>|</span>

        {/* Lien vers le Hub 3D */}
        <button
          className={styles.hubLink}
          onClick={onBackToHub}
          title="Explorer les mondes 3D"
        >
          HUB 3D
        </button>
      </header>
    </>
  )
}

export default PierreBanner
