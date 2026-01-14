const API_URL = import.meta.env.VITE_API_URL || '/api'

export type GameType = 'snake' | 'tetris' | 'breakout'

export interface LeaderboardEntry {
  rank: number
  pseudo: string
  score: number
  createdAt: string
}

export interface SubmitScoreResponse {
  success: boolean
  rank?: number | null
  isNewHighScore?: boolean
  error?: string
}

export interface LeaderboardResponse {
  game?: string
  leaderboard?: LeaderboardEntry[]
  error?: string
}

export interface AllLeaderboardsResponse {
  snake: LeaderboardEntry[]
  tetris: LeaderboardEntry[]
  breakout: LeaderboardEntry[]
  error?: string
}

/**
 * Submit a score to the leaderboard
 */
export async function submitScore(
  game: GameType,
  pseudo: string,
  score: number
): Promise<SubmitScoreResponse> {
  try {
    const response = await fetch(`${API_URL}/scores/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ game, pseudo, score }),
    })

    const data = await response.json()

    if (response.status === 429) {
      return { success: false, error: data.error || 'Trop de soumissions' }
    }

    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur serveur' }
    }

    return data
  } catch (error) {
    console.error('Score submit error:', error)
    return { success: false, error: 'Erreur de connexion' }
  }
}

/**
 * Get top 10 leaderboard for a specific game
 */
export async function getLeaderboard(game: GameType): Promise<LeaderboardResponse> {
  try {
    const response = await fetch(`${API_URL}/scores/leaderboard/${game}`)

    if (!response.ok) {
      const data = await response.json()
      return { error: data.error || 'Erreur serveur' }
    }

    return await response.json()
  } catch (error) {
    console.error('Leaderboard error:', error)
    return { error: 'Erreur de connexion' }
  }
}

/**
 * Get top 10 leaderboards for all games
 */
export async function getAllLeaderboards(): Promise<AllLeaderboardsResponse> {
  try {
    const response = await fetch(`${API_URL}/scores/leaderboard`)

    if (!response.ok) {
      const data = await response.json()
      return { snake: [], tetris: [], breakout: [], error: data.error || 'Erreur serveur' }
    }

    return await response.json()
  } catch (error) {
    console.error('All leaderboards error:', error)
    return { snake: [], tetris: [], breakout: [], error: 'Erreur de connexion' }
  }
}
