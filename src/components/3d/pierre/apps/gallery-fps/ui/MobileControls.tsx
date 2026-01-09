/**
 * MobileControls - Controles tactiles pour la galerie FPS sur mobile.
 *
 * Composant HTML overlay (hors RenderTexture) qui gere:
 * - Joystick virtuel gauche pour le deplacement
 * - Zone tactile droite pour la rotation camera
 * - Bouton d'action pour interagir avec les tableaux
 */

import { useRef, useCallback, useState } from 'react'
import { useGalleryFPSStore } from '../stores/galleryFPSStore'

interface MobileControlsProps {
  visible: boolean
  onMove: (x: number, y: number) => void
  onRotate: (deltaX: number, deltaY: number) => void
  onAction: () => void
}

// Configuration du joystick
const JOYSTICK_SIZE = 120
const JOYSTICK_KNOB_SIZE = 50
const JOYSTICK_MAX_DISTANCE = 40

/**
 * Hook pour gerer le joystick virtuel.
 */
function useJoystick(onMove: (x: number, y: number) => void) {
  const [isActive, setIsActive] = useState(false)
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const touchIdRef = useRef<number | null>(null)
  const centerRef = useRef({ x: 0, y: 0 })

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return

    const touch = e.touches[0]
    if (!touch || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }

    touchIdRef.current = touch.identifier
    setIsActive(true)
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchIdRef.current === null) return

      const touch = Array.from(e.touches).find(
        (t) => t.identifier === touchIdRef.current
      )
      if (!touch) return

      const deltaX = touch.clientX - centerRef.current.x
      const deltaY = touch.clientY - centerRef.current.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // Limiter la distance
      const clampedDistance = Math.min(distance, JOYSTICK_MAX_DISTANCE)
      const angle = Math.atan2(deltaY, deltaX)

      const knobX = Math.cos(angle) * clampedDistance
      const knobY = Math.sin(angle) * clampedDistance

      setKnobPosition({ x: knobX, y: knobY })

      // Normaliser pour le mouvement (-1 a 1)
      const normalizedX = knobX / JOYSTICK_MAX_DISTANCE
      const normalizedY = -knobY / JOYSTICK_MAX_DISTANCE // Inverser Y

      onMove(normalizedX, normalizedY)
    },
    [onMove]
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touch = Array.from(e.changedTouches).find(
        (t) => t.identifier === touchIdRef.current
      )
      if (!touch) return

      touchIdRef.current = null
      setIsActive(false)
      setKnobPosition({ x: 0, y: 0 })
      onMove(0, 0)
    },
    [onMove]
  )

  return {
    containerRef,
    isActive,
    knobPosition,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}

/**
 * Hook pour la zone de rotation camera.
 */
function useRotationZone(onRotate: (deltaX: number, deltaY: number) => void) {
  const touchIdRef = useRef<number | null>(null)
  const lastPositionRef = useRef({ x: 0, y: 0 })

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return

    const touch = e.touches[0]
    if (!touch) return

    touchIdRef.current = touch.identifier
    lastPositionRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchIdRef.current === null) return

      const touch = Array.from(e.touches).find(
        (t) => t.identifier === touchIdRef.current
      )
      if (!touch) return

      const deltaX = touch.clientX - lastPositionRef.current.x
      const deltaY = touch.clientY - lastPositionRef.current.y

      lastPositionRef.current = { x: touch.clientX, y: touch.clientY }

      // Sensibilite ajustee pour mobile
      onRotate(deltaX * 0.003, deltaY * 0.003)
    },
    [onRotate]
  )

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === touchIdRef.current
    )
    if (!touch) return

    touchIdRef.current = null
  }, [])

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}

/**
 * Controles mobiles - Joystick + Zone rotation + Bouton action.
 */
export function MobileControls({
  visible,
  onMove,
  onRotate,
  onAction,
}: MobileControlsProps) {
  const joystick = useJoystick(onMove)
  const rotationZone = useRotationZone(onRotate)
  const currentPainting = useGalleryFPSStore((s) => s.currentPainting)

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {/* Joystick gauche */}
      <div
        ref={joystick.containerRef}
        {...joystick.handlers}
        style={{
          position: 'absolute',
          left: 30,
          bottom: 30,
          width: JOYSTICK_SIZE,
          height: JOYSTICK_SIZE,
          borderRadius: '50%',
          backgroundColor: 'rgba(78, 205, 196, 0.2)',
          border: '2px solid rgba(78, 205, 196, 0.5)',
          pointerEvents: 'auto',
          touchAction: 'none',
        }}
      >
        {/* Knob du joystick */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: JOYSTICK_KNOB_SIZE,
            height: JOYSTICK_KNOB_SIZE,
            borderRadius: '50%',
            backgroundColor: joystick.isActive
              ? 'rgba(78, 205, 196, 0.8)'
              : 'rgba(78, 205, 196, 0.5)',
            transform: `translate(-50%, -50%) translate(${joystick.knobPosition.x}px, ${joystick.knobPosition.y}px)`,
            transition: joystick.isActive ? 'none' : 'transform 0.1s ease-out',
          }}
        />
      </div>

      {/* Zone de rotation droite */}
      <div
        {...rotationZone.handlers}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '50%',
          height: '100%',
          pointerEvents: 'auto',
          touchAction: 'none',
        }}
      />

      {/* Bouton action (visible quand on regarde un tableau) */}
      {currentPainting && (
        <button
          onTouchStart={(e) => {
            e.preventDefault()
            onAction()
          }}
          style={{
            position: 'absolute',
            right: 30,
            bottom: 30,
            width: 70,
            height: 70,
            borderRadius: '50%',
            backgroundColor: 'rgba(78, 205, 196, 0.8)',
            border: 'none',
            color: '#000',
            fontSize: 24,
            fontWeight: 'bold',
            pointerEvents: 'auto',
            touchAction: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          E
        </button>
      )}

      {/* Indicateur de controles */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: 12,
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        Joystick: Deplacer | Zone droite: Regarder
      </div>
    </div>
  )
}

export default MobileControls
