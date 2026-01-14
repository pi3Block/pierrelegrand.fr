/**
 * SwipeControls - Contrôles gestuels pour l'arcade machine.
 * Remplace les boutons D-pad par des gestes de swipe.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SnakeGame } from './SnakeGame'
import type { TetrisGame } from './TetrisGame'
import type { BreakoutGame } from './BreakoutGame'

type GameType = 'snake' | 'tetris' | 'breakout' | null
type SwipeDirection = 'up' | 'down' | 'left' | 'right'

// Détection mobile
const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)

interface TouchState {
  startX: number
  startY: number
  startTime: number
  lastX: number
  lastY: number
  identifier: number
}

interface SwipeControlsProps {
  currentGame: GameType
  gameInstanceRef: React.RefObject<SnakeGame | TetrisGame | BreakoutGame | null>
  onBack: () => void
  onMenuNavigate?: (direction: 'up' | 'down') => void
  onMenuSelect?: () => void
}

// Constantes
const SWIPE_THRESHOLD = 30 // Distance minimale pour un swipe
const TAP_THRESHOLD = 10 // Mouvement max pour un tap
const LONG_PRESS_DURATION = 500 // ms pour long press = back

export function SwipeControls({
  currentGame,
  gameInstanceRef,
  onBack,
  onMenuNavigate,
  onMenuSelect,
}: SwipeControlsProps) {
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStateRef = useRef<TouchState | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Pour Breakout: tracking continu horizontal
  const breakoutModeRef = useRef({
    isDragging: false,
    lastX: 0,
  })

  useEffect(() => {
    setIsMobile(isTouchDevice())
  }, [])

  // Déterminer la direction du swipe
  const detectSwipeDirection = useCallback(
    (deltaX: number, deltaY: number, distance: number): SwipeDirection | null => {
      if (distance < SWIPE_THRESHOLD) return null

      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (absX > absY) {
        return deltaX > 0 ? 'right' : 'left'
      } else {
        return deltaY > 0 ? 'down' : 'up'
      }
    },
    []
  )

  // Traiter le swipe selon le jeu
  const processSwipe = useCallback(
    (direction: SwipeDirection) => {
      // Navigation menu
      if (!currentGame) {
        if (direction === 'up' || direction === 'down') {
          onMenuNavigate?.(direction)
        }
        return
      }

      const game = gameInstanceRef.current

      switch (currentGame) {
        case 'snake':
          if (game && 'handleSwipe' in game) {
            ;(game as SnakeGame).handleSwipe(direction)
          }
          break

        case 'tetris':
          if (game && 'handleSwipe' in game) {
            ;(game as TetrisGame).handleSwipe(direction)
          }
          break

        case 'breakout':
          // Pour Breakout, seuls les swipes horizontaux sont gérés ici
          // Le drag continu est géré dans handleTouchMove
          if (direction === 'left' || direction === 'right') {
            if (game && 'handleSwipe' in game) {
              ;(game as BreakoutGame).handleSwipe(direction)
            }
          }
          break
      }
    },
    [currentGame, gameInstanceRef, onMenuNavigate]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()

      const touch = e.touches[0]
      if (!touch) return

      touchStateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        lastX: touch.clientX,
        lastY: touch.clientY,
        identifier: touch.identifier,
      }

      // Démarrer timer long press
      longPressTimerRef.current = setTimeout(() => {
        onBack()
        touchStateRef.current = null
      }, LONG_PRESS_DURATION)

      // Breakout: mode drag continu
      if (currentGame === 'breakout') {
        breakoutModeRef.current.isDragging = true
        breakoutModeRef.current.lastX = touch.clientX
      }
    },
    [currentGame, onBack]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()

      const touch = Array.from(e.touches).find(
        (t) => t.identifier === touchStateRef.current?.identifier
      )
      if (!touch || !touchStateRef.current) return

      const { startX, startY } = touchStateRef.current
      const deltaX = touch.clientX - startX
      const deltaY = touch.clientY - startY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // Annuler long press si mouvement significatif
      if (distance > TAP_THRESHOLD && longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }

      touchStateRef.current.lastX = touch.clientX
      touchStateRef.current.lastY = touch.clientY

      // BREAKOUT: tracking horizontal continu
      if (currentGame === 'breakout' && breakoutModeRef.current.isDragging) {
        const moveDelta = touch.clientX - breakoutModeRef.current.lastX
        breakoutModeRef.current.lastX = touch.clientX

        const game = gameInstanceRef.current as BreakoutGame
        if (game && 'handleTouchMove' in game) {
          game.handleTouchMove(moveDelta)
        }
      }
    },
    [currentGame, gameInstanceRef]
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()

      // Nettoyer timer long press
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }

      if (!touchStateRef.current) return

      const { startX, startY, lastX, lastY } = touchStateRef.current
      const deltaX = lastX - startX
      const deltaY = lastY - startY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const duration = Date.now() - touchStateRef.current.startTime

      // Tap pour sélection menu
      if (distance < TAP_THRESHOLD && duration < 300) {
        if (!currentGame) {
          onMenuSelect?.()
        }
        touchStateRef.current = null
        return
      }

      // Traiter le swipe
      const direction = detectSwipeDirection(deltaX, deltaY, distance)
      if (direction) {
        processSwipe(direction)
      }

      // Breakout: arrêter le paddle
      if (currentGame === 'breakout') {
        breakoutModeRef.current.isDragging = false
        const game = gameInstanceRef.current as BreakoutGame
        if (game && 'handleTouchEnd' in game) {
          game.handleTouchEnd()
        }
      }

      touchStateRef.current = null
    },
    [currentGame, detectSwipeDirection, processSwipe, onMenuSelect, gameInstanceRef]
  )

  if (!isMobile) return null

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        zIndex: 100,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Bouton BACK discret en haut à gauche */}
      <button
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          padding: '8px 16px',
          fontSize: 14,
          fontFamily: 'ArcadeFont, monospace',
          color: 'rgba(0, 255, 0, 0.6)',
          background: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(0, 255, 0, 0.3)',
          borderRadius: 4,
          zIndex: 101,
          touchAction: 'none',
        }}
        onTouchStart={(e) => {
          e.stopPropagation()
          onBack()
        }}
      >
        BACK
      </button>
    </div>
  )
}

export default SwipeControls
