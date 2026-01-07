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
}

/**
 * Composant bandeau de navigation.
 */
export function PierreBanner({ onNavigate, onBackToHub }: PierreBannerProps) {
  const currentStage = usePierreStore((s) => s.currentStage)

  const handleNavClick = (id: PierreStage) => {
    onNavigate(id)
  }

  return (
    <header className={styles.banner}>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`${styles.bannerLink} ${currentStage === item.id ? styles.active : ''}`}
          onClick={() => handleNavClick(item.id)}
        >
          {item.label}
        </button>
      ))}
    </header>
  )
}

export default PierreBanner
