// @ts-nocheck
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Breakout Game - Jeu de casse-briques classique.
 * Adapté de https://gist.github.com/straker/98a2aed6a7686d26c04810f08bfaf66b
 */

import type { GameCallbacks } from './SnakeGame'

interface Brick {
  x: number
  y: number
  color: string
  colorCode: string
  width: number
  height: number
}

interface Ball {
  x: number
  y: number
  width: number
  height: number
  speed: number
  dx: number
  dy: number
}

interface Paddle {
  x: number
  y: number
  width: number
  height: number
  dx: number
}

export class BreakoutGame {
  private canvas: HTMLCanvasElement
  private context: CanvasRenderingContext2D
  private currentScoreElement: HTMLElement | null
  private maxScoreElement: HTMLElement | null
  private currentScore: number = 0
  private loopInterval: number = 16 // ~60 FPS
  private loopId: ReturnType<typeof setInterval> | null = null
  private brickGap: number = 2
  private brickWidth: number = 48
  private brickHeight: number = 24
  private limitScore: number = 448
  private bricks: Brick[] = []
  private paddle: Paddle
  private ball: Ball
  private isKeyLeftPressing: boolean = false
  private isKeyRightPressing: boolean = false
  private callbacks: GameCallbacks

  private colorMap: Record<string, string> = {
    R: '#a40600',
    O: '#c88000',
    G: '#007f23',
    Y: '#c7c519',
  }

  private level: string[][] = [
    [],
    [],
    [],
    ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
    ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
    ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
    ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
    ['G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G'],
    ['G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G'],
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
  ]

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

    this.paddle = {
      x: this.canvas.width / 2 - this.brickWidth / 2,
      y: 600,
      width: this.brickWidth,
      height: this.brickHeight,
      dx: 0,
    }

    this.ball = {
      x: 50,
      y: 300,
      width: 16,
      height: 16,
      speed: 4, // Vitesse initiale augmentée (était 2)
      dx: 0,
      dy: 0,
    }

    this.updateScore()
  }

  private createLevel(levelData: string[][]): void {
    for (let row = 0; row < levelData.length; row++) {
      for (let col = 0; col < levelData[row].length; col++) {
        const colorCode = levelData[row][col]
        this.bricks.push({
          x: (this.brickWidth + this.brickGap) * col,
          y: (this.brickHeight + this.brickGap) * row,
          color: this.colorMap[colorCode],
          colorCode: colorCode,
          width: this.brickWidth,
          height: this.brickHeight,
        })
      }
    }
  }

  private collides(
    obj1: { x: number; y: number; width: number; height: number },
    obj2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    )
  }

  private loop = (): void => {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Move paddle
    this.paddle.x += this.paddle.dx
    if (this.paddle.x < 0) {
      this.paddle.x = 0
    } else if (this.paddle.x + this.brickWidth > this.canvas.width) {
      this.paddle.x = this.canvas.width - this.brickWidth
    }

    // Move ball
    this.ball.x += this.ball.dx
    this.ball.y += this.ball.dy

    // Ball wall collision
    if (this.ball.x < 0) {
      this.callbacks.onHit?.()
      this.ball.x = 0
      this.ball.dx *= -1
    } else if (this.ball.x + this.ball.width > this.canvas.width) {
      this.callbacks.onHit?.()
      this.ball.x = this.canvas.width - this.ball.width
      this.ball.dx *= -1
    }

    if (this.ball.y < 0) {
      this.ball.y = 0
      this.ball.dy *= -1
    }

    // Ball falls below screen
    if (this.ball.y > this.canvas.height) {
      this.ball.x = 50
      this.ball.y = 300
      this.ball.dx = 0
      this.ball.dy = 0
      this.callbacks.onDie?.()
      this.resetLevel()
    }

    this.checkBallPaddleCollision()

    // Brick collision
    for (let i = 0; i < this.bricks.length; i++) {
      const brick = this.bricks[i]
      if (this.collides(this.ball, brick)) {
        this.callbacks.onHit?.()

        switch (brick.colorCode) {
          case 'Y':
            this.currentScore += 1
            break
          case 'G':
            this.currentScore += 3
            break
          case 'O':
            this.currentScore += 5
            break
          case 'R':
            this.currentScore += 7
            break
        }

        // Accélération progressive : +0.1 à chaque brique cassée (max 8)
        const speedIncrease = 0.1
        const maxSpeed = 8
        const currentSpeedMagnitude = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy)
        if (currentSpeedMagnitude < maxSpeed) {
          const factor = (currentSpeedMagnitude + speedIncrease) / currentSpeedMagnitude
          this.ball.dx *= factor
          this.ball.dy *= factor
        }

        this.updateScore()
        this.bricks.splice(i, 1)

        if (
          this.ball.y + this.ball.height - this.ball.speed <= brick.y ||
          this.ball.y >= brick.y + brick.height - this.ball.speed
        ) {
          this.ball.dy *= -1
        } else {
          this.ball.dx *= -1
        }
        break
      }
    }

    // Draw ball
    if (this.ball.dx || this.ball.dy) {
      this.context.fillStyle = '#a9a8a9'
      this.context.fillRect(this.ball.x, this.ball.y, this.ball.width, this.ball.height)
    }

    // Draw bricks
    this.bricks.forEach((brick) => {
      this.context.fillStyle = brick.color
      this.context.fillRect(brick.x, brick.y, brick.width, brick.height)
    })

    // Draw paddle
    this.context.fillStyle = '#005b91'
    this.context.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height)
  }

  handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowLeft') {
      this.isKeyLeftPressing = true
      this.paddle.dx = -3
    } else if (e.key === 'ArrowRight') {
      this.isKeyRightPressing = true
      this.paddle.dx = 3
    }
  }

  handleKeyUp = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowLeft') {
      this.isKeyLeftPressing = false
      if (!this.isKeyRightPressing) {
        this.paddle.dx = 0
      }
    } else if (e.key === 'ArrowRight') {
      this.isKeyRightPressing = false
      if (!this.isKeyLeftPressing) {
        this.paddle.dx = 0
      }
    }
  }

  private checkBallPaddleCollision(): void {
    const outsideLeft = {
      x: this.paddle.x + this.paddle.width / 2 - 24,
      y: this.paddle.y,
      width: 8,
      height: 32,
    }
    const outsideRight = {
      x: this.paddle.x + this.paddle.width / 2 + 24,
      y: this.paddle.y,
      width: 8,
      height: 32,
    }
    const innerLeft = {
      x: this.paddle.x + this.paddle.width / 2 - 12,
      y: this.paddle.y,
      width: 8,
      height: 32,
    }
    const innerRight = {
      x: this.paddle.x + this.paddle.width / 2 + 12,
      y: this.paddle.y,
      width: 8,
      height: 32,
    }
    const innerCenter = {
      x: this.paddle.x + this.paddle.width / 2,
      y: this.paddle.y,
      width: 16,
      height: 32,
    }

    if (this.collides(this.ball, innerCenter)) {
      this.callbacks.onHit?.()
      this.ball.dx = this.ball.dx < 0 ? -1 : 1
      this.ball.dy = this.ball.dy < 0 ? 2 : -2
      this.ball.y = this.paddle.y - this.ball.height
    } else if (this.collides(this.ball, innerRight) || this.collides(this.ball, innerLeft)) {
      this.callbacks.onHit?.()
      this.ball.dx = this.ball.dx < 0 ? -2 : 2
      this.ball.dy = this.ball.dy < 0 ? 2 : -2
      this.ball.y = this.paddle.y - this.ball.height
    } else if (this.collides(this.ball, outsideRight) || this.collides(this.ball, outsideLeft)) {
      this.callbacks.onHit?.()
      this.ball.dx = this.ball.dx < 0 ? -2 : 2
      this.ball.dy = this.ball.dy < 0 ? 1 : -1
      this.ball.y = this.paddle.y - this.ball.height
    }
  }

  private resetLevel(): void {
    this.currentScore = 0
    this.ball.speed = 4 // Reset vitesse initiale
    this.updateScore()
    this.bricks = []
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.createLevel(this.level)
    this.paddle.x = this.canvas.width / 2 - this.brickWidth / 2
    this.paddle.y = 600
    this.ball.dx = 4 // Vitesse initiale augmentée
    this.ball.dy = 4
  }

  private updateScore(): void {
    let maxScore = parseInt(localStorage.getItem('maxBreakOutScore') || '0')
    if (this.currentScore > maxScore) {
      maxScore = this.currentScore
      localStorage.setItem('maxBreakOutScore', this.currentScore.toString())
    }
    if (this.currentScoreElement) {
      this.currentScoreElement.textContent = 'CURRENT SCORE: ' + this.currentScore
    }
    if (this.maxScoreElement) {
      this.maxScoreElement.textContent = 'MAX SCORE: ' + maxScore
    }
    if (this.currentScore >= this.limitScore) {
      this.resetLevel()
    }
  }

  destroy(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (this.loopId) {
      clearInterval(this.loopId)
    }
  }

  start(): void {
    this.createLevel(this.level)
    this.ball.dx = 4 // Vitesse initiale augmentée
    this.ball.dy = 4
    this.loopId = setInterval(this.loop, this.loopInterval)
  }
}
