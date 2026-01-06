/**
 * Algorithme de Poisson Disc Sampling
 * Génère des points distribués de manière uniforme mais aléatoire
 * Idéal pour placer arbres, rochers, etc. sans chevauchement
 */

import * as THREE from 'three'

export interface PoissonConfig {
  width: number
  height: number
  minDistance: number
  maxAttempts?: number
  seed?: number
}

interface Point {
  x: number
  y: number
}

/**
 * Générateur pseudo-aléatoire avec seed
 */
function createSeededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = Math.sin(s * 9999) * 10000
    return s - Math.floor(s)
  }
}

/**
 * Génère des points via Poisson Disc Sampling
 * Retourne un tableau de Vector2
 */
export function poissonDiscSampling(config: PoissonConfig): THREE.Vector2[] {
  const { width, height, minDistance, maxAttempts = 30, seed = 12345 } = config
  const random = createSeededRandom(seed)

  const cellSize = minDistance / Math.sqrt(2)
  const gridWidth = Math.ceil(width / cellSize)
  const gridHeight = Math.ceil(height / cellSize)

  // Grille pour lookup spatial rapide
  const grid: (Point | null)[][] = Array(gridWidth)
    .fill(null)
    .map(() => Array(gridHeight).fill(null))

  const points: Point[] = []
  const activeList: Point[] = []

  // Point initial au centre
  const firstPoint: Point = {
    x: width / 2 + (random() - 0.5) * width * 0.5,
    y: height / 2 + (random() - 0.5) * height * 0.5,
  }

  points.push(firstPoint)
  activeList.push(firstPoint)

  const gx = Math.floor(firstPoint.x / cellSize)
  const gy = Math.floor(firstPoint.y / cellSize)
  if (gx >= 0 && gx < gridWidth && gy >= 0 && gy < gridHeight) {
    const row = grid[gx]
    if (row) row[gy] = firstPoint
  }

  while (activeList.length > 0) {
    const randomIndex = Math.floor(random() * activeList.length)
    const point = activeList[randomIndex]
    if (!point) break
    let found = false

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const angle = random() * Math.PI * 2
      const distance = minDistance + random() * minDistance

      const newPoint: Point = {
        x: point.x + Math.cos(angle) * distance,
        y: point.y + Math.sin(angle) * distance,
      }

      if (isValidPoint(newPoint, grid, width, height, cellSize, minDistance, gridWidth, gridHeight)) {
        points.push(newPoint)
        activeList.push(newPoint)

        const ngx = Math.floor(newPoint.x / cellSize)
        const ngy = Math.floor(newPoint.y / cellSize)
        if (ngx >= 0 && ngx < gridWidth && ngy >= 0 && ngy < gridHeight) {
          const row = grid[ngx]
          if (row) row[ngy] = newPoint
        }

        found = true
        break
      }
    }

    if (!found) {
      activeList.splice(randomIndex, 1)
    }
  }

  // Convertir en Vector2
  return points.map(p => new THREE.Vector2(p.x, p.y))
}

/**
 * Vérifie si un point est valide (dans les limites et pas trop proche des autres)
 */
function isValidPoint(
  point: Point,
  grid: (Point | null)[][],
  width: number,
  height: number,
  cellSize: number,
  minDistance: number,
  gridWidth: number,
  gridHeight: number
): boolean {
  // Vérifier les limites
  if (point.x < 0 || point.x >= width || point.y < 0 || point.y >= height) {
    return false
  }

  const gx = Math.floor(point.x / cellSize)
  const gy = Math.floor(point.y / cellSize)

  // Vérifier les cellules voisines (rayon de 2 cellules)
  const searchRadius = 2
  for (let dx = -searchRadius; dx <= searchRadius; dx++) {
    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      const nx = gx + dx
      const ny = gy + dy

      if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
        const row = grid[nx]
        const neighbor = row?.[ny]
        if (neighbor) {
          const distSq = (point.x - neighbor.x) ** 2 + (point.y - neighbor.y) ** 2
          if (distSq < minDistance * minDistance) {
            return false
          }
        }
      }
    }
  }

  return true
}

/**
 * Génère des points dans un cercle (pour biomes circulaires)
 */
export function poissonDiscSamplingCircular(
  centerX: number,
  centerY: number,
  radius: number,
  minDistance: number,
  seed: number = 12345,
  maxAttempts: number = 30
): THREE.Vector2[] {
  // Générer dans un carré puis filtrer
  const allPoints = poissonDiscSampling({
    width: radius * 2,
    height: radius * 2,
    minDistance,
    maxAttempts,
    seed,
  })

  // Filtrer pour ne garder que les points dans le cercle
  // et décaler vers le centre
  return allPoints
    .filter(p => {
      const dx = p.x - radius
      const dy = p.y - radius
      return dx * dx + dy * dy <= radius * radius * 0.85 // 85% du rayon pour marge
    })
    .map(p => new THREE.Vector2(
      p.x - radius + centerX,
      p.y - radius + centerY
    ))
}

/**
 * Génère des points avec densité variable basée sur une fonction
 */
export function poissonDiscSamplingWithDensity(
  config: PoissonConfig,
  densityFn: (x: number, y: number) => number // 0 = pas de points, 1 = densité max
): THREE.Vector2[] {
  const allPoints = poissonDiscSampling(config)
  const random = createSeededRandom((config.seed || 12345) + 1000)

  return allPoints.filter(p => {
    const density = densityFn(p.x, p.y)
    return random() < density
  })
}

/**
 * Génère des positions 3D à partir de points 2D et d'une heightmap
 */
export function elevatePoints(
  points: THREE.Vector2[],
  getHeight: (x: number, z: number) => number,
  offsetY: number = 0
): THREE.Vector3[] {
  return points.map(p => new THREE.Vector3(
    p.x,
    getHeight(p.x, p.y) + offsetY,
    p.y
  ))
}
