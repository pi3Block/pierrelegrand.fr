// @ts-nocheck
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Tetris Game - Jeu Tetris classique.
 * Adapté de https://gist.github.com/straker/3c98304f8a6a9174efd8292800891ea1
 */

import type { GameCallbacks } from './SnakeGame'

type TetrominoName = 'I' | 'J' | 'L' | 'O' | 'S' | 'Z' | 'T'

interface Tetromino {
  name: TetrominoName
  matrix: number[][]
  row: number
  col: number
}

export class TetrisGame {
  private canvas: HTMLCanvasElement
  private context: CanvasRenderingContext2D
  private currentScoreElement: HTMLElement | null
  private maxScoreElement: HTMLElement | null
  private currentScore: number = 0
  private loopInterval: number = 100 // Tetris n'a pas besoin de plus
  private loopId: ReturnType<typeof setInterval> | null = null
  private grid: number = 32
  private tetrominoSequence: TetrominoName[] = []
  private playfield: (TetrominoName | 0)[][] = []
  private tetromino: Tetromino | null = null
  private count: number = 0
  private callbacks: GameCallbacks

  private tetrominos: Record<TetrominoName, number[][]> = {
    I: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    J: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    O: [
      [1, 1],
      [1, 1],
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
  }

  private colors: Record<TetrominoName, string> = {
    I: '#00ffff',
    O: '#ffff00',
    T: '#800080',
    S: '#00ff00',
    Z: '#ff0000',
    J: '#0000ff',
    L: '#ff7f00',
  }

  constructor(
    canvas: HTMLCanvasElement,
    scoreElement: HTMLElement | null,
    maxScoreElement: HTMLElement | null,
    callbacks: GameCallbacks = {}
  ) {
    this.canvas = canvas
    this.context = canvas.getContext('2d')!
    this.currentScoreElement = scoreElement
    this.maxScoreElement = maxScoreElement
    this.callbacks = callbacks

    this.clearPlayfield()
    this.tetromino = this.getNextTetromino()
    this.updateScore()
  }

  private updateScore(): void {
    let maxScore = parseInt(localStorage.getItem('maxTetrisScore') || '0')
    if (this.currentScore > maxScore) {
      maxScore = this.currentScore
      localStorage.setItem('maxTetrisScore', this.currentScore.toString())
    }
    if (this.currentScoreElement) {
      this.currentScoreElement.textContent = 'CURRENT SCORE: ' + this.currentScore
    }
    if (this.maxScoreElement) {
      this.maxScoreElement.textContent = 'MAX SCORE: ' + maxScore
    }
  }

  start(): void {
    this.loopId = setInterval(this.loop, this.loopInterval)
  }

  private loop = (): void => {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw playfield
    for (let row = 0; row < 20; row++) {
      const pRow = this.playfield[row]
      if (!pRow) continue
      for (let col = 0; col < 10; col++) {
        const cell = pRow[col]
        if (cell) {
          this.context.fillStyle = this.colors[cell]
          this.context.fillRect(col * this.grid, row * this.grid, this.grid - 1, this.grid - 1)
        }
      }
    }

    if (this.tetromino) {
      if (++this.count > 35) {
        this.tetromino.row++
        this.count = 0

        if (!this.isValidMove(this.tetromino.matrix, this.tetromino.row, this.tetromino.col)) {
          this.tetromino.row--
          this.placeTetromino()
        }
      }

      this.context.fillStyle = this.colors[this.tetromino.name]

      for (let row = 0; row < this.tetromino.matrix.length; row++) {
        const mRow = this.tetromino.matrix[row]
        if (!mRow) continue
        for (let col = 0; col < mRow.length; col++) {
          if (mRow[col]) {
            this.context.fillRect(
              (this.tetromino.col + col) * this.grid,
              (this.tetromino.row + row) * this.grid,
              this.grid - 1,
              this.grid - 1
            )
          }
        }
      }
    }
  }

  private generateSequence(): void {
    const sequence: TetrominoName[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z']
    while (sequence.length) {
      const rand = this.getRandomInt(0, sequence.length - 1)
      const name = sequence.splice(rand, 1)[0]
      if (name) this.tetrominoSequence.push(name)
    }
  }

  private getNextTetromino(): Tetromino {
    if (this.tetrominoSequence.length === 0) {
      this.generateSequence()
    }

    const name = this.tetrominoSequence.pop()!
    const matrix = this.tetrominos[name].map((row) => [...row])
    const col = Math.floor(this.playfield[0]!.length / 2) - Math.ceil(matrix[0]!.length / 2)
    const row = name === 'I' ? -1 : -2

    return { name, matrix, row, col }
  }

  private rotate(matrix: number[][]): number[][] {
    const N = matrix.length - 1
    return matrix.map((row, i) => row.map((_, j) => matrix[N - j]![i]!))
  }

  private isValidMove(matrix: number[][], cellRow: number, cellCol: number): boolean {
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (
          matrix[row][col] &&
          (cellCol + col < 0 ||
            cellCol + col >= this.playfield[0].length ||
            cellRow + row >= this.playfield.length ||
            this.playfield[cellRow + row]?.[cellCol + col])
        ) {
          return false
        }
      }
    }
    return true
  }

  private placeTetromino(): void {
    if (!this.tetromino) return

    for (let row = 0; row < this.tetromino.matrix.length; row++) {
      for (let col = 0; col < this.tetromino.matrix[row].length; col++) {
        if (this.tetromino.matrix[row][col]) {
          if (this.tetromino.row + row < 0) {
            this.callbacks.onDie?.()
            this.showGameOver()
            return
          }
          this.playfield[this.tetromino.row + row][this.tetromino.col + col] = this.tetromino.name
        }
      }
    }

    let numClears = 0
    for (let row = this.playfield.length - 1; row >= 0; ) {
      if (this.playfield[row].every((cell) => !!cell)) {
        ++numClears
        for (let r = row; r >= 0; r--) {
          for (let c = 0; c < this.playfield[r].length; c++) {
            this.playfield[r][c] = this.playfield[r - 1]?.[c] || 0
          }
        }
      } else {
        row--
      }
    }

    if (numClears > 0) {
      this.callbacks.onHit?.()
    } else {
      this.callbacks.onSelect?.()
    }

    // Score based on lines cleared
    if (numClears === 0) {
      this.currentScore += 10
    } else if (numClears === 1) {
      this.currentScore += 100
    } else if (numClears === 2) {
      this.currentScore += 300
    } else if (numClears === 3) {
      this.currentScore += 500
    } else if (numClears === 4) {
      this.currentScore += 800
    }

    this.updateScore()
    this.tetromino = this.getNextTetromino()
  }

  private showGameOver(): void {
    this.gameOver = true
    this.currentScore = 0
    this.updateScore()
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.clearPlayfield()
    this.tetromino = this.getNextTetromino()
  }

  private clearPlayfield(): void {
    for (let row = -2; row < 20; row++) {
      this.playfield[row] = []
      for (let col = 0; col < 10; col++) {
        this.playfield[row][col] = 0
      }
    }
  }

  destroy(): void {
    this.showGameOver()
    if (this.loopId) {
      clearInterval(this.loopId)
    }
  }

  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.tetromino) return

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const col = e.key === 'ArrowLeft' ? this.tetromino.col - 1 : this.tetromino.col + 1
      if (this.isValidMove(this.tetromino.matrix, this.tetromino.row, col)) {
        this.tetromino.col = col
      }
    }

    if (e.key === 'ArrowUp') {
      const matrix = this.rotate(this.tetromino.matrix)
      if (this.isValidMove(matrix, this.tetromino.row, this.tetromino.col)) {
        this.tetromino.matrix = matrix
      }
    }

    if (e.key === 'ArrowDown') {
      const row = this.tetromino.row + 1
      if (!this.isValidMove(this.tetromino.matrix, row, this.tetromino.col)) {
        this.tetromino.row = row - 1
        this.placeTetromino()
        return
      }
      this.tetromino.row = row
    }
  }
}
