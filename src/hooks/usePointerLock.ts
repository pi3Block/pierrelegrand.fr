/**
 * Hook usePointerLock - Gestion du verrouillage de la souris
 * Verrouille le curseur dans la scène 3D pour une expérience TPS immersive.
 * Sortie avec Echap (natif) ou Entrée.
 */

import { useEffect, useState, useCallback } from 'react'

interface UsePointerLockReturn {
  /** Indique si le pointeur est actuellement verrouillé */
  isLocked: boolean
  /** Demande le verrouillage du pointeur */
  requestLock: () => void
  /** Libère le pointeur */
  exitLock: () => void
}

/**
 * Récupère le canvas de manière dynamique
 */
function getCanvas(): HTMLCanvasElement | null {
  return document.querySelector('canvas')
}

export function usePointerLock(): UsePointerLockReturn {
  const [isLocked, setIsLocked] = useState(false)

  // Gérer les changements d'état du pointer lock
  useEffect(() => {
    const handleLockChange = () => {
      const canvas = getCanvas()
      const locked = document.pointerLockElement === canvas
      setIsLocked(locked)
    }

    const handleLockError = (e: Event) => {
      console.warn('Pointer Lock: Erreur lors du verrouillage', e)
      setIsLocked(false)
    }

    document.addEventListener('pointerlockchange', handleLockChange)
    document.addEventListener('pointerlockerror', handleLockError)

    return () => {
      document.removeEventListener('pointerlockchange', handleLockChange)
      document.removeEventListener('pointerlockerror', handleLockError)
    }
  }, [])

  // Sortir du pointer lock avec Entrée
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isLocked) {
        document.exitPointerLock()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLocked])

  // Fonction pour demander le lock
  const requestLock = useCallback(() => {
    const canvas = getCanvas()
    if (canvas && !document.pointerLockElement) {
      canvas.requestPointerLock()
    }
  }, [])

  const exitLock = useCallback(() => {
    if (document.pointerLockElement) {
      document.exitPointerLock()
    }
  }, [])

  return { isLocked, requestLock, exitLock }
}
