/**
 * PingPongMobileControls - Contrôles tactiles pour le ping-pong sur mobile.
 *
 * - Joystick virtuel pour déplacer la raquette
 * - Toggle gyroscope pour la rotation de la raquette
 * - Affichage du combo et score
 */

import { useRef, useCallback, useState, useEffect } from 'react'
import { usePingPongStore } from '../stores/pingpongStore'

// Configuration du joystick
const JOYSTICK_SIZE = 140
const JOYSTICK_KNOB_SIZE = 60
const JOYSTICK_MAX_DISTANCE = 50

interface PingPongMobileControlsProps {
  visible: boolean
}

/**
 * Hook pour gérer le joystick virtuel.
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

      // Normaliser pour le mouvement (-1 à 1)
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
 * Hook pour gérer le gyroscope.
 */
function useGyroscope(
  enabled: boolean,
  onRotation: (rotation: { alpha: number; beta: number; gamma: number }) => void
) {
  const [hasPermission, setHasPermission] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Vérifier si le gyroscope est supporté
    setIsSupported('DeviceOrientationEvent' in window)
  }, [])

  useEffect(() => {
    if (!enabled || !isSupported) return

    const handleOrientation = (event: DeviceOrientationEvent) => {
      onRotation({
        alpha: event.alpha ?? 0,
        beta: event.beta ?? 0,
        gamma: event.gamma ?? 0,
      })
    }

    window.addEventListener('deviceorientation', handleOrientation)

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [enabled, isSupported, onRotation])

  const requestPermission = useCallback(async () => {
    // iOS 13+ requiert une permission explicite
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      // @ts-expect-error - requestPermission n'existe que sur iOS
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        // @ts-expect-error - requestPermission n'existe que sur iOS
        const permission = await DeviceOrientationEvent.requestPermission()
        setHasPermission(permission === 'granted')
        return permission === 'granted'
      } catch {
        return false
      }
    }
    // Android et autres - pas de permission requise
    setHasPermission(true)
    return true
  }, [])

  return {
    isSupported,
    hasPermission,
    requestPermission,
  }
}

/**
 * Contrôles mobiles pour le ping-pong.
 */
export function PingPongMobileControls({ visible }: PingPongMobileControlsProps) {
  const setPaddleInput = usePingPongStore((s) => s.setPaddleInput)
  const setGyroRotation = usePingPongStore((s) => s.setGyroRotation)
  const isGyroEnabled = usePingPongStore((s) => s.isGyroEnabled)
  const setIsGyroEnabled = usePingPongStore((s) => s.setIsGyroEnabled)
  const combo = usePingPongStore((s) => s.combo)
  const highScore = usePingPongStore((s) => s.highScore)
  const difficultyLevel = usePingPongStore((s) => s.difficultyLevel)

  const handleMove = useCallback(
    (x: number, y: number) => {
      setPaddleInput({ x, y })
    },
    [setPaddleInput]
  )

  const handleGyroRotation = useCallback(
    (rotation: { alpha: number; beta: number; gamma: number }) => {
      setGyroRotation(rotation)
    },
    [setGyroRotation]
  )

  const joystick = useJoystick(handleMove)
  const gyro = useGyroscope(isGyroEnabled, handleGyroRotation)

  const toggleGyro = useCallback(async () => {
    if (!isGyroEnabled) {
      const granted = await gyro.requestPermission()
      if (granted) {
        setIsGyroEnabled(true)
      }
    } else {
      setIsGyroEnabled(false)
    }
  }, [isGyroEnabled, gyro, setIsGyroEnabled])

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
      {/* HUD - Score, Combo, Niveau */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        {/* Combo indicator */}
        {combo > 1 && (
          <div
            style={{
              backgroundColor: 'rgba(255, 165, 0, 0.9)',
              color: '#000',
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 18,
              fontWeight: 'bold',
              animation: 'pulse 0.3s ease-out',
            }}
          >
            COMBO x{combo}!
          </div>
        )}

        {/* Difficulty level */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: 12,
            fontSize: 12,
          }}
        >
          Niveau {difficultyLevel}
        </div>

        {/* High score */}
        <div
          style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: 12,
          }}
        >
          Record: {highScore}
        </div>
      </div>

      {/* Joystick gauche */}
      <div
        ref={joystick.containerRef}
        {...joystick.handlers}
        style={{
          position: 'absolute',
          left: 30,
          bottom: 50,
          width: JOYSTICK_SIZE,
          height: JOYSTICK_SIZE,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 100, 100, 0.2)',
          border: '3px solid rgba(255, 100, 100, 0.5)',
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
              ? 'rgba(255, 100, 100, 0.9)'
              : 'rgba(255, 100, 100, 0.6)',
            transform: `translate(-50%, -50%) translate(${joystick.knobPosition.x}px, ${joystick.knobPosition.y}px)`,
            transition: joystick.isActive ? 'none' : 'transform 0.1s ease-out',
            boxShadow: joystick.isActive
              ? '0 0 20px rgba(255, 100, 100, 0.5)'
              : 'none',
          }}
        />
      </div>

      {/* Bouton gyroscope (droite) */}
      {gyro.isSupported && (
        <button
          onTouchStart={(e) => {
            e.preventDefault()
            toggleGyro()
          }}
          style={{
            position: 'absolute',
            right: 30,
            bottom: 50,
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: isGyroEnabled
              ? 'rgba(100, 255, 100, 0.8)'
              : 'rgba(255, 255, 255, 0.3)',
            border: `3px solid ${isGyroEnabled ? 'rgba(100, 255, 100, 1)' : 'rgba(255, 255, 255, 0.5)'}`,
            color: isGyroEnabled ? '#000' : '#fff',
            fontSize: 12,
            fontWeight: 'bold',
            pointerEvents: 'auto',
            touchAction: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <span style={{ fontSize: 24 }}>📱</span>
          <span>{isGyroEnabled ? 'GYRO ON' : 'GYRO'}</span>
        </button>
      )}

      {/* Instructions */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: 11,
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        Joystick: Déplacer {gyro.isSupported && '| Gyro: Incliner pour tourner'}
      </div>

      {/* Style pour l'animation pulse */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: translateX(-50%) scale(1.2); }
            100% { transform: translateX(-50%) scale(1); }
          }
        `}
      </style>
    </div>
  )
}

export default PingPongMobileControls
