/**
 * GalleryFPSOverlay - Overlay HTML pour la galerie FPS.
 *
 * Ce composant est place au niveau de App.tsx (hors du Canvas)
 * pour:
 * - Capturer les evenements touch sur mobile (joystick)
 * - Afficher un overlay cliquable pour reprendre le jeu sur desktop (pointer lock)
 */

import { useCallback } from 'react'
import { usePierreStore } from '../../../stores/pierreStore'
import { useGalleryFPSStore } from '../stores/galleryFPSStore'
import { useResponsive } from '@hooks/useResponsive'
import { MobileControls } from './MobileControls'

/**
 * Overlay de la galerie FPS.
 */
export function GalleryFPSOverlay() {
  const { isTouchDevice } = useResponsive()
  const currentStage = usePierreStore((s) => s.currentStage)
  const isLocked = useGalleryFPSStore((s) => s.isLocked)
  const setJoystickInput = useGalleryFPSStore((s) => s.setJoystickInput)
  const setTouchRotation = useGalleryFPSStore((s) => s.setTouchRotation)
  const currentPainting = useGalleryFPSStore((s) => s.currentPainting)

  const isGalleryActive = currentStage === 'rightMonitor'

  // Mobile: afficher les controles tactiles quand actif
  const showMobileControls = isGalleryActive && isTouchDevice && isLocked

  // Desktop: afficher l'overlay de reprise quand en pause (actif mais pas locked)
  const showResumeOverlay = isGalleryActive && !isTouchDevice && !isLocked

  // Handler pour reprendre le jeu (demande pointer lock)
  const handleResume = useCallback(() => {
    document.body.requestPointerLock()
  }, [])

  // Handler pour le joystick
  const handleMove = useCallback(
    (x: number, y: number) => {
      setJoystickInput({ x, y })
    },
    [setJoystickInput]
  )

  // Handler pour la rotation tactile
  const handleRotate = useCallback(
    (deltaX: number, deltaY: number) => {
      setTouchRotation({ x: deltaX, y: deltaY })
    },
    [setTouchRotation]
  )

  // Handler pour l'action (ouvrir le lien du tableau)
  const handleAction = useCallback(() => {
    if (currentPainting?.links?.demo) {
      window.open(currentPainting.links.demo, '_blank')
    } else if (currentPainting?.links?.source) {
      window.open(currentPainting.links.source, '_blank')
    }
  }, [currentPainting])

  return (
    <>
      {/* Overlay de reprise sur desktop - capture le clic pour pointer lock */}
      {showResumeOverlay && (
        <div
          onClick={handleResume}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            cursor: 'pointer',
            zIndex: 999,
            // Transparent - le menu 3D est visible derriere
            backgroundColor: 'transparent',
          }}
        />
      )}

      {/* Controles mobiles */}
      <MobileControls
        visible={showMobileControls}
        onMove={handleMove}
        onRotate={handleRotate}
        onAction={handleAction}
      />
    </>
  )
}

export default GalleryFPSOverlay
