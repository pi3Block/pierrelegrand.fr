/**
 * PierreBanner - Bandeau de navigation supérieur.
 *
 * Style identique au portfolio Joan : fond bleu foncé, texte doré.
 */

import { usePierreStore, type PierreStage } from '../stores/pierreStore'
import styles from './PierreBanner.module.css'

// Configuration des sections de navigation (style Joan)
const NAV_ITEMS: { id: PierreStage; label: string }[] = [
  { id: 'leftMonitor', label: 'ABOUT ME' },
  { id: 'rightMonitor', label: 'PROJECTS' },
  { id: 'arcadeMachine', label: 'ARCADE MACHINE' },
  { id: 'whiteboard', label: 'WHITEBOARD' },
  { id: 'rubikGroup', label: "RUBIK'S CUBE" },
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
  const isFocused = currentStage !== 'default'

  const handleNavClick = (id: PierreStage) => {
    onNavigate(id)
  }

  return (
    <header className={`${styles.banner} ${isFocused ? styles.collapsed : ''}`}>
      {/* Bouton retour (visible uniquement en mode focus) */}
      {isFocused && onBackToDefault && (
        <button
          className={styles.backButton}
          onClick={onBackToDefault}
        >
          ← BACK
        </button>
      )}

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
        3D WORLDS
      </button>
    </header>
  )
}

export default PierreBanner
