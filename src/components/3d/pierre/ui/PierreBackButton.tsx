/**
 * PierreBackButton - Bouton de retour depuis une zone interactive.
 * 
 * Affiché quand l'utilisateur est dans une zone (arcade, whiteboard, etc.)
 * pour revenir à la vue par défaut.
 */

import { usePierreStore, type PierreStage } from '../stores/pierreStore'
import styles from './PierreBackButton.module.css'

interface PierreBackButtonProps {
  onBack: () => void
}

/**
 * Composant bouton de retour.
 */
export function PierreBackButton({ onBack }: PierreBackButtonProps) {
  const currentStage = usePierreStore((s) => s.currentStage)

  // Ne pas afficher si on est à la vue par défaut
  if (currentStage === 'default' || currentStage === null) {
    return null
  }

  // Labels pour chaque stage
  const stageLabels: Record<PierreStage, string> = {
    default: '',
    arcadeMachine: 'Machine Arcade',
    rubikGroup: "Rubik's Cube",
    whiteboard: 'Tableau Blanc',
    leftMonitor: 'À Propos',
    rightMonitor: 'Projets',
    hubPortal: 'Portail Hub',
    hub: '',
  }

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={onBack}>
        <span className={styles.arrow}>←</span>
        <span className={styles.text}>
          Retour {stageLabels[currentStage] && `(${stageLabels[currentStage]})`}
        </span>
      </button>
      
      {/* Instructions pour la zone courante */}
      {currentStage === 'rubikGroup' && (
        <div className={styles.hint}>
          💡 Cliquez et glissez pour tourner les faces
        </div>
      )}
      {currentStage === 'whiteboard' && (
        <div className={styles.hint}>
          💡 Utilisez les marqueurs pour dessiner
        </div>
      )}
      {currentStage === 'arcadeMachine' && (
        <div className={styles.hint}>
          💡 Utilisez les touches fléchées pour jouer
        </div>
      )}
    </div>
  )
}

export default PierreBackButton

