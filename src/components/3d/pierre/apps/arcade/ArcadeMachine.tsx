/**
 * ArcadeMachine - Composant React pour l'arcade machine.
 *
 * Intègre les jeux Snake, Tetris et Breakout.
 * Adapté du projet joan-arcade-machine pour fonctionner en React.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { SnakeGame } from './SnakeGame'
import { TetrisGame } from './TetrisGame'
import { BreakoutGame } from './BreakoutGame'
import styles from './ArcadeMachine.module.css'

type GameType = 'snake' | 'tetris' | 'breakout' | null

interface ArcadeMachineProps {
  /** Callback pour naviguer vers le Hub 3D */
  onNavigateToHub?: () => void
}

const GAMES = [
  { id: 'snake' as const, label: 'SNAKE' },
  { id: 'tetris' as const, label: 'TETRIS' },
  { id: 'breakout' as const, label: 'BREAK OUT' },
]

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
      </div>
    </div>
  )
}

export default ArcadeMachine
