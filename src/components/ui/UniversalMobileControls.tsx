/**
 * UniversalMobileControls - Contrôles tactiles universels pour tous les mondes.
 *
 * Composant HTML overlay qui affiche:
 * - Joystick virtuel gauche pour le déplacement
 * - Bouton de saut (optionnel)
 * - Bouton de sprint (optionnel)
 *
 * Utilisé pour les niveaux 0-4 avec personnage Ecctrl.
 */

import { useRef, useCallback, useState, useEffect } from 'react'
import { useMobileInputStore } from '@stores/mobileInputStore'
import { useResponsive } from '@hooks/useResponsive'
import { isFeatureEnabled } from '@config/featureFlags'

// Configuration du joystick
const JOYSTICK_SIZE = 130
const JOYSTICK_KNOB_SIZE = 55
const JOYSTICK_MAX_DISTANCE = 45

// Configuration des boutons
const BUTTON_SIZE = 60

interface UniversalMobileControlsProps {
  /** Affiche le bouton de saut */
  showJump?: boolean
  /** Affiche le bouton de sprint */
  showSprint?: boolean
  /** Affiche le bouton de tir */
  showShoot?: boolean
  /** Callback personnalisé pour le saut */
  onJump?: () => void
  /** Callback personnalisé pour le tir */
  onShoot?: () => void
}

/**
 * Hook pour gérer le joystick virtuel.
 */
function useJoystick() {
  const [isActive, setIsActive] = useState(false)
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const touchIdRef = useRef<number | null>(null)
  const centerRef = useRef({ x: 0, y: 0 })

  const setJoystickInput = useMobileInputStore((s) => s.setJoystickInput)
  const setJoystickActive = useMobileInputStore((s) => s.setJoystickActive)

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
    setJoystickActive(true)
  }, [setJoystickActive])

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

      // Normaliser pour le mouvement (-1 à 1)
      const normalizedX = knobX / JOYSTICK_MAX_DISTANCE
      const normalizedY = -knobY / JOYSTICK_MAX_DISTANCE // Inverser Y (positif = avant)

      setJoystickInput({ x: normalizedX, y: normalizedY })
    },
    [setJoystickInput]
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touch = Array.from(e.changedTouches).find(
        (t) => t.identifier === touchIdRef.current
      )
      if (!touch) return

      touchIdRef.current = null
      setIsActive(false)
      setJoystickActive(false)
      setKnobPosition({ x: 0, y: 0 })
      setJoystickInput({ x: 0, y: 0 })
    },
    [setJoystickInput, setJoystickActive]
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
 * Contrôles mobiles universels - Joystick + Boutons d'action.
 */
export function UniversalMobileControls({
  showJump = true,
  showSprint = true,
  showShoot = true,
  onJump,
  onShoot,
}: UniversalMobileControlsProps) {
  const { isTouchDevice } = useResponsive()
  const joystick = useJoystick()

  const setMobile = useMobileInputStore((s) => s.setMobile)
  const setJumpPressed = useMobileInputStore((s) => s.setJumpPressed)
  const setSprintPressed = useMobileInputStore((s) => s.setSprintPressed)
  const setShootPressed = useMobileInputStore((s) => s.setShootPressed)

  // Détection mobile au montage
  useEffect(() => {
    setMobile(isTouchDevice)
  }, [isTouchDevice, setMobile])

  // Ne pas afficher si pas mobile ou feature flag désactivé
  if (!isTouchDevice || !isFeatureEnabled('useMobileControls')) {
    return null
  }

  const handleJumpStart = (e: React.TouchEvent) => {
    e.preventDefault()
    setJumpPressed(true)
    onJump?.()
  }

  const handleJumpEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    setJumpPressed(false)
  }

  const handleSprintStart = (e: React.TouchEvent) => {
    e.preventDefault()
    setSprintPressed(true)
  }

  const handleSprintEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    setSprintPressed(false)
  }

  const handleShootStart = (e: React.TouchEvent) => {
    e.preventDefault()
    setShootPressed(true)
    onShoot?.()
  }

  const handleShootEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    setShootPressed(false)
  }

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
        // Safe area pour iPhone notch
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
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
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          border: '3px solid rgba(99, 102, 241, 0.4)',
          pointerEvents: 'auto',
          touchAction: 'none',
          boxShadow: joystick.isActive
            ? '0 0 20px rgba(99, 102, 241, 0.5)'
            : 'none',
          transition: 'box-shadow 0.2s ease',
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
              ? 'rgba(99, 102, 241, 0.9)'
              : 'rgba(99, 102, 241, 0.6)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            transform: `translate(-50%, -50%) translate(${joystick.knobPosition.x}px, ${joystick.knobPosition.y}px)`,
            transition: joystick.isActive ? 'none' : 'transform 0.15s ease-out',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
          }}
        />

        {/* Indicateurs directionnels */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: '8px solid rgba(255, 255, 255, 0.3)',
          }}
        />
      </div>

      {/* Boutons d'action côté droit - disposition en 2 colonnes */}
      <div
        style={{
          position: 'absolute',
          right: 20,
          bottom: 30,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: 12,
        }}
      >
        {/* Bouton de tir (haut gauche) - gros bouton orange */}
        {showShoot && (
          <button
            onTouchStart={handleShootStart}
            onTouchEnd={handleShootEnd}
            style={{
              width: BUTTON_SIZE + 10,
              height: BUTTON_SIZE + 10,
              borderRadius: '50%',
              backgroundColor: 'rgba(249, 115, 22, 0.8)',
              border: '3px solid rgba(255, 255, 255, 0.4)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 'bold',
              pointerEvents: 'auto',
              touchAction: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(249, 115, 22, 0.5)',
              gridColumn: '1',
              gridRow: '1',
            }}
          >
            SHOOT
          </button>
        )}

        {/* Bouton de saut (haut droite) - bleu */}
        {showJump && (
          <button
            onTouchStart={handleJumpStart}
            onTouchEnd={handleJumpEnd}
            style={{
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
              borderRadius: '50%',
              backgroundColor: 'rgba(99, 102, 241, 0.8)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 'bold',
              pointerEvents: 'auto',
              touchAction: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
              gridColumn: '2',
              gridRow: '1',
              alignSelf: 'center',
              justifySelf: 'center',
            }}
          >
            JUMP
          </button>
        )}

        {/* Bouton de sprint (bas, centré sur 2 colonnes) - rouge */}
        {showSprint && (
          <button
            onTouchStart={handleSprintStart}
            onTouchEnd={handleSprintEnd}
            style={{
              width: BUTTON_SIZE + 20,
              height: BUTTON_SIZE - 10,
              borderRadius: 30,
              backgroundColor: 'rgba(239, 68, 68, 0.8)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 'bold',
              pointerEvents: 'auto',
              touchAction: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
              gridColumn: '1 / 3',
              gridRow: '2',
              justifySelf: 'center',
            }}
          >
            SPRINT
          </button>
        )}
      </div>
    </div>
  )
}

export default UniversalMobileControls
