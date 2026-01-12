/**
 * ArcadeMachine - Composant React pour l'arcade machine.
 *
 * Intègre les jeux Snake, Tetris et Breakout.
 * Adapté du projet joan-arcade-machine pour fonctionner en React.
 * Inclut des contrôles tactiles pour mobile.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { SnakeGame } from './SnakeGame'
import { TetrisGame } from './TetrisGame'
import { BreakoutGame } from './BreakoutGame'
import styles from './ArcadeMachine.module.css'

type GameType = 'snake' | 'tetris' | 'breakout' | null

// Détection mobile
const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)

interface ArcadeMachineProps {
  /** Callback pour naviguer vers le Hub 3D */
  onNavigateToHub?: () => void
}

const GAMES = [
  { id: 'snake' as const, label: 'SNAKE' },
  { id: 'tetris' as const, label: 'TETRIS' },
  { id: 'breakout' as const, label: 'BREAK OUT' },
]

/**
 * Simule un événement clavier
 */
function simulateKeyEvent(key: string, type: 'keydown' | 'keyup' = 'keydown') {
  const event = new KeyboardEvent(type, {
    key,
    code: key === ' ' ? 'Space' : `Arrow${key.replace('Arrow', '')}`,
    bubbles: true,
    cancelable: true,
  })
  window.dispatchEvent(event)
}

/**
 * Styles inline pour les contrôles tactiles
 * Positionnés en bas du conteneur de jeu (pas fixed/absolute par rapport au viewport)
 */
const touchControlStyles = {
  container: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 120,
    padding: '15px 20px',
    boxSizing: 'border-box' as const,
    marginTop: 'auto',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderTop: '2px solid rgba(0, 255, 0, 0.5)',
  },
  dpad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 48px)',
    gridTemplateRows: 'repeat(3, 48px)',
    gap: 3,
  },
  dpadButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 255, 0, 0.5)',
    border: '3px solid rgba(0, 255, 0, 0.8)',
    color: '#00ff00',
    fontSize: 20,
    fontWeight: 'bold' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'none' as const,
    userSelect: 'none' as const,
    WebkitUserSelect: 'none' as const,
    cursor: 'pointer',
  },
  dpadButtonActive: {
    backgroundColor: 'rgba(0, 255, 0, 0.7)',
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 100, 100, 0.5)',
    border: '3px solid rgba(255, 100, 100, 0.8)',
    color: '#ff6464',
    fontSize: 12,
    fontWeight: 'bold' as const,
    fontFamily: 'ArcadeFont, monospace',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'none' as const,
    userSelect: 'none' as const,
    WebkitUserSelect: 'none' as const,
    cursor: 'pointer',
  },
  backButton: {
    backgroundColor: 'rgba(100, 100, 255, 0.5)',
    border: '3px solid rgba(100, 100, 255, 0.8)',
    color: '#6464ff',
  },
}

/**
 * Contrôles tactiles pour l'arcade (D-pad + boutons)
 */
interface TouchControlsProps {
  currentGame: GameType
  onBack: () => void
}

function TouchControls({ currentGame, onBack }: TouchControlsProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(isTouchDevice())
  }, [])

  if (!isMobile) return null

  // Pour Breakout, on utilise touchstart/touchend pour maintenir la direction
  const handleTouchStart = (key: string) => (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    simulateKeyEvent(key, 'keydown')
  }

  const handleTouchEnd = (key: string) => (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    simulateKeyEvent(key, 'keyup')
  }

  // Pour les jeux qui n'ont pas besoin de maintenir (Snake, Tetris menu)
  const handleTap = (key: string) => (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    simulateKeyEvent(key, 'keydown')
  }

  // Détermine si on a besoin du D-pad complet ou juste gauche/droite
  const needsFullDpad = currentGame === 'snake' || currentGame === null
  const needsUpDown = currentGame === 'tetris' || currentGame === null

  return (
    <div style={touchControlStyles.container}>
      {/* D-pad gauche */}
      <div style={touchControlStyles.dpad}>
        {/* Ligne 1 : Haut */}
        <div /> {/* vide */}
        {needsUpDown || needsFullDpad ? (
          <button
            style={touchControlStyles.dpadButton}
            onTouchStart={handleTap('ArrowUp')}
          >
            ▲
          </button>
        ) : (
          <div />
        )}
        <div /> {/* vide */}

        {/* Ligne 2 : Gauche, Centre, Droite */}
        <button
          style={touchControlStyles.dpadButton}
          onTouchStart={handleTouchStart('ArrowLeft')}
          onTouchEnd={handleTouchEnd('ArrowLeft')}
        >
          ◄
        </button>
        <div /> {/* centre vide */}
        <button
          style={touchControlStyles.dpadButton}
          onTouchStart={handleTouchStart('ArrowRight')}
          onTouchEnd={handleTouchEnd('ArrowRight')}
        >
          ►
        </button>

        {/* Ligne 3 : Bas */}
        <div /> {/* vide */}
        {needsUpDown || needsFullDpad ? (
          <button
            style={touchControlStyles.dpadButton}
            onTouchStart={handleTap('ArrowDown')}
          >
            ▼
          </button>
        ) : (
          <div />
        )}
        <div /> {/* vide */}
      </div>

      {/* Boutons action droite */}
      <div style={touchControlStyles.actionButtons}>
        <button
          style={{ ...touchControlStyles.actionButton, ...touchControlStyles.backButton }}
          onTouchStart={(e) => {
            e.preventDefault()
            onBack()
          }}
        >
          BACK
        </button>
        {currentGame === null && (
          <button
            style={touchControlStyles.actionButton}
            onTouchStart={handleTap(' ')}
          >
            START
          </button>
        )}
      </div>
    </div>
  )
}

export function ArcadeMachine({ onNavigateToHub }: ArcadeMachineProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [currentGame, setCurrentGame] = useState<GameType>(null)

  // Refs pour les canvas
  const snakeCanvasRef = useRef<HTMLCanvasElement>(null)
  const tetrisCanvasRef = useRef<HTMLCanvasElement>(null)
  const breakoutCanvasRef = useRef<HTMLCanvasElement>(null)
  const scoreRef = useRef<HTMLDivElement>(null)
  const maxScoreRef = useRef<HTMLDivElement>(null)

  // Instance du jeu actif
  const gameInstanceRef = useRef<SnakeGame | TetrisGame | BreakoutGame | null>(null)

  // Callbacks pour les jeux (sons/effets)
  const gameCallbacks = {
    onHit: () => {
      // TODO: Jouer un son de hit
    },
    onDie: () => {
      // TODO: Jouer un son de mort
    },
    onSelect: () => {
      // TODO: Jouer un son de sélection
    },
  }

  // Démarrer un jeu
  const startGame = useCallback((gameType: GameType) => {
    if (!gameType) return

    setCurrentGame(gameType)

    // Petit délai pour laisser le DOM se mettre à jour
    setTimeout(() => {
      let canvas: HTMLCanvasElement | null = null

      switch (gameType) {
        case 'snake':
          canvas = snakeCanvasRef.current
          if (canvas) {
            gameInstanceRef.current = new SnakeGame(
              canvas,
              scoreRef.current,
              maxScoreRef.current,
              gameCallbacks
            )
          }
          break
        case 'tetris':
          canvas = tetrisCanvasRef.current
          if (canvas) {
            gameInstanceRef.current = new TetrisGame(
              canvas,
              scoreRef.current,
              maxScoreRef.current,
              gameCallbacks
            )
          }
          break
        case 'breakout':
          canvas = breakoutCanvasRef.current
          if (canvas) {
            gameInstanceRef.current = new BreakoutGame(
              canvas,
              scoreRef.current,
              maxScoreRef.current,
              gameCallbacks
            )
          }
          break
      }

      gameInstanceRef.current?.start()
    }, 50)
  }, [])

  // Retour au menu
  const backToMenu = useCallback(() => {
    gameInstanceRef.current?.destroy()
    gameInstanceRef.current = null
    setCurrentGame(null)
    
    
  }, [])

  // Gestion du clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si on est dans un jeu
      if (currentGame) {
        // Escape pour revenir au menu
        if (e.key === 'Escape') {
          backToMenu()
          return
        }

        // Transmettre les touches au jeu actif
        if (gameInstanceRef.current) {
          if ('handleKeyDown' in gameInstanceRef.current) {
            gameInstanceRef.current.handleKeyDown(e)
          }
        }
        return
      }

      // Navigation dans le menu
      switch (e.key) {
        case 'ArrowUp':
          setSelectedIndex((prev) => (prev === 0 ? GAMES.length - 1 : prev - 1))
          break
        case 'ArrowDown':
          setSelectedIndex((prev) => (prev === GAMES.length - 1 ? 0 : prev + 1))
          break
        case ' ':
        case 'Enter':
          GAMES[selectedIndex] && startGame(GAMES[selectedIndex].id)
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Pour Breakout qui a besoin de keyup
      if (currentGame === 'breakout' && gameInstanceRef.current) {
        const game = gameInstanceRef.current as BreakoutGame
        game.handleKeyUp(e)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [currentGame, selectedIndex, startGame, backToMenu])

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      gameInstanceRef.current?.destroy()
    }
  }, [])

  // Handler pour le bouton back (menu ou retour scène Pierre)
  const handleBack = useCallback(() => {
    if (currentGame) {
      backToMenu()
    } else {
      // Simuler Escape pour sortir de l'arcade
      simulateKeyEvent('Escape', 'keydown')
    }
  }, [currentGame, backToMenu])

  // Rendu du menu
  if (!currentGame) {
    return (
      <div className={styles.container}>
        <div className={styles.menuContainer}>
          <div className={styles.title}>ARCADE VIDEOGAMES</div>

          <div className={styles.menu}>
            <ul className={styles.gameMenu}>
              {GAMES.map((game, index) => (
                <li
                  key={game.id}
                  className={styles.gameOption}
                  onClick={() => startGame(game.id)}
                >
                  {selectedIndex === index ? `> ${game.label} <` : game.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Séparateur et bouton Hub */}
          <div className={styles.separator} />
          <button className={styles.hubButton} onClick={onNavigateToHub}>
            3D WORLDS
          </button>

          <div className={styles.instructions}>USE ARROW KEYS AND SPACEBAR</div>

          {/* Contrôles tactiles pour mobile - à l'intérieur du menuContainer */}
          <TouchControls currentGame={currentGame} onBack={handleBack} />
        </div>
      </div>
    )
  }

  // Rendu du jeu actif
  return (
    <div className={styles.container}>
      <div className={styles.menuContainer}>
        {/* Canvas Snake */}
        {currentGame === 'snake' && (
          <canvas
            ref={snakeCanvasRef}
            width={704}
            height={704}
            className={styles.canvas}
          />
        )}

        {/* Canvas Tetris */}
        {currentGame === 'tetris' && (
          <canvas
            ref={tetrisCanvasRef}
            width={320}
            height={640}
            className={styles.canvas}
          />
        )}

        {/* Canvas Breakout */}
        {currentGame === 'breakout' && (
          <canvas
            ref={breakoutCanvasRef}
            width={700}
            height={700}
            className={styles.canvas}
          />
        )}

        {/* Score */}
        <div className={styles.scoreContainer}>
          <div ref={scoreRef} className={styles.currentScore} />
          <div ref={maxScoreRef} className={styles.maxScore} />
        </div>

        <div className={styles.instructions}>PRESS ESCAPE TO EXIT</div>

        {/* Contrôles tactiles pour mobile - à l'intérieur du menuContainer */}
        <TouchControls currentGame={currentGame} onBack={handleBack} />
      </div>
    </div>
  )
}

export default ArcadeMachine
