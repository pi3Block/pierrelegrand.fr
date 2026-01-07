/**
 * PierreLoading - Overlay de chargement pour PierreExperience.
 * 
 * Affiche une animation de chargement avec le logo.
 */

import { useState, useEffect } from 'react'
import styles from './PierreLoading.module.css'

interface PierreLoadingProps {
  progress: number // 0 à 100
  isComplete: boolean
  onComplete: () => void
}

/**
 * Composant loading overlay.
 */
export function PierreLoading({ progress, isComplete, onComplete }: PierreLoadingProps) {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    if (isComplete) {
      // Attendre un peu avant de commencer le fade out
      const timer = setTimeout(() => {
        setFadeOut(true)
        // Puis appeler onComplete après l'animation
        setTimeout(onComplete, 800)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [isComplete, onComplete])

  return (
    <div className={`${styles.overlay} ${fadeOut ? styles.fadeOut : ''}`}>
      <div className={styles.content}>
        {/* Logo animé */}
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎨</span>
          <span className={styles.logoText}>Pierre Legrand</span>
        </div>

        {/* Barre de progression */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={styles.progressText}>{Math.round(progress)}%</span>
        </div>

        {/* Animation des points */}
        <div className={styles.dots}>
          <span className={styles.dot}></span>
          <span className={styles.dot}></span>
          <span className={styles.dot}></span>
        </div>

        <p className={styles.hint}>
          {progress < 50
            ? 'Chargement des modèles 3D...'
            : progress < 80
            ? 'Préparation des textures...'
            : progress < 100
            ? 'Initialisation de la scène...'
            : 'Prêt !'}
        </p>
      </div>
    </div>
  )
}

export default PierreLoading

