/**
 * ArcadeMachine - Composant React pour l'arcade machine.
 *
 * Intègre les jeux Snake, Tetris et Breakout.
 * Adapté du projet joan-arcade-machine pour fonctionner en React.
 * Inclut des contrôles gestuels (swipe) pour mobile.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { SnakeGame } from './SnakeGame'
import { TetrisGame } from './TetrisGame'
import { BreakoutGame } from './BreakoutGame'
import { SwipeControls } from './SwipeControls'
import {
  submitScore,
  getAllLeaderboards,
  type GameType as ApiGameType,
  type LeaderboardEntry,
  type AllLeaderboardsResponse,
} from '@api/scores'
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

  // Pseudo state
  const [pseudo, setPseudo] = useState<string>(() =>
    localStorage.getItem('arcadePseudo') || ''
  )
  const [showPseudoInput, setShowPseudoInput] = useState(false)
  const [pseudoError, setPseudoError] = useState<string | null>(null)

  // Leaderboard state
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboardData, setLeaderboardData] = useState<AllLeaderboardsResponse | null>(null)
  const [leaderboardTab, setLeaderboardTab] = useState<ApiGameType>('snake')
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)

  // Refs pour les canvas
  const snakeCanvasRef = useRef<HTMLCanvasElement>(null)
  const tetrisCanvasRef = useRef<HTMLCanvasElement>(null)
  const breakoutCanvasRef = useRef<HTMLCanvasElement>(null)
  const scoreRef = useRef<HTMLDivElement>(null)
  const maxScoreRef = useRef<HTMLDivElement>(null)

  // Instance du jeu actif
  const gameInstanceRef = useRef<SnakeGame | TetrisGame | BreakoutGame | null>(null)

  // Handle score submission
  const handleGameOver = useCallback(
    async (finalScore: number, game: ApiGameType) => {
      const currentPseudo = localStorage.getItem('arcadePseudo')
      if (!currentPseudo || finalScore <= 0) return

      try {
        await submitScore(game, currentPseudo, finalScore)
      } catch (error) {
        console.error('Score submission failed:', error)
      }
    },
    []
  )

  // Callbacks pour les jeux (sons/effets)
  const createGameCallbacks = useCallback(
    (game: ApiGameType) => ({
      onHit: () => {
        // TODO: Jouer un son de hit
      },
      onDie: () => {
        // TODO: Jouer un son de mort
      },
      onSelect: () => {
        // TODO: Jouer un son de sélection
      },
      onGameOver: (finalScore: number) => handleGameOver(finalScore, game),
    }),
    [handleGameOver]
  )

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
              createGameCallbacks('snake')
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
              createGameCallbacks('tetris')
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
              createGameCallbacks('breakout')
            )
          }
          break
      }

      gameInstanceRef.current?.start()
    }, 50)
  }, [createGameCallbacks])

  // Retour au menu
  const backToMenu = useCallback(() => {
    gameInstanceRef.current?.destroy()
    gameInstanceRef.current = null
    setCurrentGame(null)
  }, [])

  // Load leaderboard
  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true)
    try {
      const data = await getAllLeaderboards()
      setLeaderboardData(data)
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    } finally {
      setLeaderboardLoading(false)
    }
  }, [])

  const handleShowLeaderboard = useCallback(() => {
    setShowLeaderboard(true)
    loadLeaderboard()
  }, [loadLeaderboard])

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

      // Navigation dans le menu (games + leaderboard)
      const menuLength = GAMES.length + 1 // +1 for leaderboard
      switch (e.key) {
        case 'ArrowUp':
          setSelectedIndex((prev) => (prev === 0 ? menuLength - 1 : prev - 1))
          break
        case 'ArrowDown':
          setSelectedIndex((prev) => (prev === menuLength - 1 ? 0 : prev + 1))
          break
        case ' ':
        case 'Enter':
          if (selectedIndex < GAMES.length) {
            GAMES[selectedIndex] && startGame(GAMES[selectedIndex].id)
          } else {
            handleShowLeaderboard()
          }
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
  }, [currentGame, selectedIndex, startGame, backToMenu, handleShowLeaderboard])

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
    } else if (showLeaderboard) {
      setShowLeaderboard(false)
    } else if (showPseudoInput) {
      setShowPseudoInput(false)
      setPseudoError(null)
    } else {
      // Simuler Escape pour sortir de l'arcade
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        bubbles: true,
        cancelable: true,
      })
      window.dispatchEvent(event)
    }
  }, [currentGame, showLeaderboard, showPseudoInput, backToMenu])

  // Navigation menu par swipe (pour mobile)
  const handleMenuNavigate = useCallback((direction: 'up' | 'down') => {
    const menuLength = GAMES.length + 1
    setSelectedIndex((prev) => {
      if (direction === 'up') {
        return prev === 0 ? menuLength - 1 : prev - 1
      } else {
        return prev === menuLength - 1 ? 0 : prev + 1
      }
    })
  }, [])

  // Sélection menu par tap (pour mobile)
  const handleMenuSelect = useCallback(() => {
    if (selectedIndex < GAMES.length) {
      GAMES[selectedIndex] && startGame(GAMES[selectedIndex].id)
    } else {
      handleShowLeaderboard()
    }
  }, [selectedIndex, startGame, handleShowLeaderboard])

  // Pseudo validation and save
  const handlePseudoSubmit = useCallback(() => {
    const trimmedPseudo = pseudo.trim()
    if (trimmedPseudo.length < 3) {
      setPseudoError('Min 3 caractères')
      return
    }
    if (trimmedPseudo.length > 12) {
      setPseudoError('Max 12 caractères')
      return
    }
    if (!/^[A-Za-z0-9]+$/.test(trimmedPseudo)) {
      setPseudoError('Lettres et chiffres uniquement')
      return
    }
    localStorage.setItem('arcadePseudo', trimmedPseudo)
    setPseudo(trimmedPseudo)
    setShowPseudoInput(false)
    setPseudoError(null)
  }, [pseudo])

  // Rendu du modal pseudo
  if (showPseudoInput) {
    return (
      <div className={styles.container}>
        <div className={styles.menuContainer}>
          <div className={styles.title}>ENTER PSEUDO</div>

          <div className={styles.pseudoInputContainer}>
            <input
              type="text"
              className={styles.pseudoInput}
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePseudoSubmit()
                if (e.key === 'Escape') {
                  setShowPseudoInput(false)
                  setPseudoError(null)
                }
              }}
              maxLength={12}
              placeholder="AAA"
              autoFocus
            />
            {pseudoError && <div className={styles.pseudoError}>{pseudoError}</div>}
            <div className={styles.pseudoHint}>3-12 characters (A-Z, 0-9)</div>
            <button className={styles.pseudoSubmitButton} onClick={handlePseudoSubmit}>
              CONFIRM
            </button>
          </div>

          <SwipeControls
            currentGame={currentGame}
            gameInstanceRef={gameInstanceRef}
            onBack={handleBack}
            onMenuNavigate={handleMenuNavigate}
            onMenuSelect={handleMenuSelect}
          />
        </div>
      </div>
    )
  }

  // Rendu du leaderboard
  if (showLeaderboard) {
    const currentLeaderboard: LeaderboardEntry[] = leaderboardData?.[leaderboardTab] || []

    return (
      <div className={styles.container}>
        <div className={styles.menuContainer}>
          <div className={styles.title}>LEADERBOARD</div>

          <div className={styles.leaderboardTabs}>
            {(['snake', 'tetris', 'breakout'] as const).map((game) => (
              <button
                key={game}
                className={`${styles.leaderboardTab} ${leaderboardTab === game ? styles.leaderboardTabActive : ''}`}
                onClick={() => setLeaderboardTab(game)}
              >
                {game.toUpperCase()}
              </button>
            ))}
          </div>

          <div className={styles.leaderboardTable}>
            {leaderboardLoading ? (
              <div className={styles.leaderboardLoading}>LOADING...</div>
            ) : currentLeaderboard.length === 0 ? (
              <div className={styles.leaderboardEmpty}>NO SCORES YET</div>
            ) : (
              currentLeaderboard.map((entry) => (
                <div key={`${entry.rank}-${entry.pseudo}`} className={styles.leaderboardRow}>
                  <span className={styles.leaderboardRank}>#{entry.rank}</span>
                  <span className={styles.leaderboardPseudo}>{entry.pseudo}</span>
                  <span className={styles.leaderboardScore}>{entry.score}</span>
                </div>
              ))
            )}
          </div>

          <button
            className={styles.leaderboardBackButton}
            onClick={() => setShowLeaderboard(false)}
          >
            BACK
          </button>

          <SwipeControls
            currentGame={currentGame}
            gameInstanceRef={gameInstanceRef}
            onBack={handleBack}
            onMenuNavigate={handleMenuNavigate}
            onMenuSelect={handleMenuSelect}
          />
        </div>
      </div>
    )
  }

  // Rendu du menu
  if (!currentGame) {
    return (
      <div className={styles.container}>
        <div className={styles.menuContainer}>
          <div className={styles.title}>ARCADE VIDEOGAMES</div>

          {/* Pseudo display/edit */}
          <div className={styles.pseudoDisplay}>
            <span className={styles.pseudoLabel}>PLAYER:</span>
            <button
              className={styles.pseudoButton}
              onClick={() => setShowPseudoInput(true)}
            >
              {pseudo || 'SET PSEUDO'}
            </button>
          </div>

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
              <li
                className={styles.gameOption}
                onClick={handleShowLeaderboard}
              >
                {selectedIndex === GAMES.length ? '> LEADERBOARD <' : 'LEADERBOARD'}
              </li>
            </ul>
          </div>

          {/* Séparateur et bouton Hub */}
          <div className={styles.separator} />
          <button className={styles.hubButton} onClick={onNavigateToHub}>
            3D WORLDS
          </button>

          <div className={styles.instructions}>USE ARROW KEYS AND SPACEBAR</div>

          {/* Contrôles gestuels pour mobile */}
          <SwipeControls
            currentGame={currentGame}
            gameInstanceRef={gameInstanceRef}
            onBack={handleBack}
            onMenuNavigate={handleMenuNavigate}
            onMenuSelect={handleMenuSelect}
          />
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

        {/* Contrôles gestuels pour mobile */}
        <SwipeControls
          currentGame={currentGame}
          gameInstanceRef={gameInstanceRef}
          onBack={handleBack}
          onMenuNavigate={handleMenuNavigate}
          onMenuSelect={handleMenuSelect}
        />
      </div>
    </div>
  )
}

export default ArcadeMachine
