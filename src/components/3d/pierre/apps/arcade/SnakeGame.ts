/**
 * Snake Game - Jeu du serpent classique.
 * Adapté de https://gist.github.com/straker/ff00b4b49669ad3dec890306d348adc4
 */

export interface GameCallbacks {
  onHit?: () => void
  onDie?: () => void
  onSelect?: () => void
  onGameOver?: (finalScore: number) => void
}

export class SnakeGame {
  private canvas: HTMLCanvasElement
  private context: CanvasRenderingContext2D
  private currentScoreElement: HTMLElement | null
  private maxScoreElement: HTMLElement | null
  private currentScore = 0
  private keyDownAllowed = true
  private keysPressedQueue: KeyboardEvent[] = []
  private grid = 32
  private numCellsW: number
  private numCellsH: number
  private snake: {
    x: number
    y: number
    dx: number
    dy: number
    cells: Array<{ x: number; y: number }>
    maxCells: number
  }
  private apple: { x: number; y: number }
  private loopInterval = 50
  private loopId: ReturnType<typeof setInterval> | null = null
  private callbacks: GameCallbacks

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

    this.numCellsW = Math.floor(this.canvas.width / this.grid)
    this.numCellsH = Math.floor(this.canvas.height / this.grid)

    this.snake = {
      x: 160,
      y: 160,
      dx: this.grid,
      dy: 0,
      cells: [],
      maxCells: 4,
    }

    this.apple = {
      x: 320,
      y: 320,
    }

    this.updateScore()
  }

  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min
  }

  private loop = (): void => {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.snake.x += this.snake.dx
    this.snake.y += this.snake.dy

    if (this.snake.x < 0) {
      this.snake.x = this.canvas.width - this.grid
    } else if (this.snake.x >= this.canvas.width) {
      this.snake.x = 0
    }

    if (this.snake.y < 0) {
      this.snake.y = this.canvas.height - this.grid
    } else if (this.snake.y >= this.canvas.height) {
      this.snake.y = 0
    }

    this.snake.cells.unshift({ x: this.snake.x, y: this.snake.y })

    if (this.snake.cells.length > this.snake.maxCells) {
      this.snake.cells.pop()
    }

    this.context.fillStyle = '#ff0000'
    this.context.beginPath()
    this.context.arc(
      this.apple.x + this.grid / 2,
      this.apple.y + this.grid / 2,
      12,
      0,
      2 * Math.PI
    )
    this.context.fill()

    this.context.fillStyle = '#35de00'
    for (let index = 0; index < this.snake.cells.length; index++) {
      const cell = this.snake.cells[index]
      if (!cell) continue

      this.context.fillRect(cell.x, cell.y, this.grid - 1, this.grid - 1)

      if (cell.x === this.apple.x && cell.y === this.apple.y) {
        this.callbacks.onHit?.()
        this.snake.maxCells++
        this.apple.x = this.getRandomInt(0, this.numCellsW) * this.grid
        this.apple.y = this.getRandomInt(0, this.numCellsH) * this.grid
        this.currentScore += 10
        this.updateScore()
      }

      for (let i = index + 1; i < this.snake.cells.length; i++) {
        const otherCell = this.snake.cells[i]
        if (otherCell && cell.x === otherCell.x && cell.y === otherCell.y) {
          this.callbacks.onDie?.()
          // Submit score before resetting
          if (this.currentScore > 0) {
            this.callbacks.onGameOver?.(this.currentScore)
          }
          this.currentScore = 0
          this.updateScore()
          this.snake.x = 160
          this.snake.y = 160
          this.snake.cells = []
          this.snake.maxCells = 4
          this.snake.dx = this.grid
          this.snake.dy = 0
          this.apple.x = this.getRandomInt(0, this.numCellsW) * this.grid
          this.apple.y = this.getRandomInt(0, this.numCellsH) * this.grid
        }
      }
    }
  }

  private updateScore(): void {
    let maxScore = parseInt(localStorage.getItem('maxSnakeScore') || '0')
    if (this.currentScore > maxScore) {
      maxScore = this.currentScore
      localStorage.setItem('maxSnakeScore', this.currentScore.toString())
    }
    if (this.currentScoreElement) {
      this.currentScoreElement.textContent = 'CURRENT SCORE: ' + this.currentScore
    }
    if (this.maxScoreElement) {
      this.maxScoreElement.textContent = 'MAX SCORE: ' + maxScore
    }
  }

  handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.keyDownAllowed) {
      this.keysPressedQueue.push(e)
      return
    }
    this.processKeyEvent(e)
    this.keyDownAllowed = false
    setTimeout(() => {
      this.keyDownAllowed = true
      while (this.keysPressedQueue.length > 0) {
        const keyEvent = this.keysPressedQueue.shift()
        if (keyEvent) this.processKeyEvent(keyEvent)
      }
    }, this.loopInterval)
  }

  private processKeyEvent(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft' && this.snake.dx === 0) {
      this.snake.dx = -this.grid
      this.snake.dy = 0
    } else if (e.key === 'ArrowUp' && this.snake.dy === 0) {
      this.snake.dy = -this.grid
      this.snake.dx = 0
    } else if (e.key === 'ArrowRight' && this.snake.dx === 0) {
      this.snake.dx = this.grid
      this.snake.dy = 0
    } else if (e.key === 'ArrowDown' && this.snake.dy === 0) {
      this.snake.dy = this.grid
      this.snake.dx = 0
    }
  }

  start(): void {
    this.loopId = setInterval(this.loop, this.loopInterval)
  }

  destroy(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (this.loopId) {
      clearInterval(this.loopId)
    }
  }
}
