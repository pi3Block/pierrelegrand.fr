/**
 * Simulation d'érosion hydraulique
 * Simule l'écoulement de l'eau et l'érosion du terrain
 * Peut être exécutée sur GPU (GPGPU) ou CPU
 */

import { useMemo, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// Shader pour la simulation d'érosion sur GPU (gardé pour usage futur GPGPU)
// @ts-ignore - Shaders réservés pour implémentation GPU future
const erosionVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

// @ts-ignore - Shaders réservés pour implémentation GPU future
const erosionFragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D heightMap;
  uniform sampler2D waterMap;
  uniform sampler2D sedimentMap;
  uniform float deltaTime;
  uniform float erosionRate;
  uniform float depositionRate;
  uniform float evaporationRate;
  uniform float rainAmount;
  uniform vec2 resolution;

  varying vec2 vUv;

  void main() {
    vec2 texelSize = 1.0 / resolution;

    float height = texture2D(heightMap, vUv).r;
    float water = texture2D(waterMap, vUv).r;
    float sediment = texture2D(sedimentMap, vUv).r;

    // Échantillonner les voisins
    float heightL = texture2D(heightMap, vUv - vec2(texelSize.x, 0.0)).r;
    float heightR = texture2D(heightMap, vUv + vec2(texelSize.x, 0.0)).r;
    float heightU = texture2D(heightMap, vUv + vec2(0.0, texelSize.y)).r;
    float heightD = texture2D(heightMap, vUv - vec2(0.0, texelSize.y)).r;

    float waterL = texture2D(waterMap, vUv - vec2(texelSize.x, 0.0)).r;
    float waterR = texture2D(waterMap, vUv + vec2(texelSize.x, 0.0)).r;
    float waterU = texture2D(waterMap, vUv + vec2(0.0, texelSize.y)).r;
    float waterD = texture2D(waterMap, vUv - vec2(0.0, texelSize.y)).r;

    // Calculer les différences de hauteur totale (terrain + eau)
    float totalHeight = height + water;
    float totalL = heightL + waterL;
    float totalR = heightR + waterR;
    float totalU = heightU + waterU;
    float totalD = heightD + waterD;

    // Calculer le flux d'eau basé sur les différences de hauteur
    float flowL = max(0.0, totalHeight - totalL);
    float flowR = max(0.0, totalHeight - totalR);
    float flowU = max(0.0, totalHeight - totalU);
    float flowD = max(0.0, totalHeight - totalD);
    float totalFlow = flowL + flowR + flowU + flowD;

    // Limiter le flux à l'eau disponible
    float flowScale = min(1.0, water / (totalFlow + 0.001));
    float waterOut = totalFlow * flowScale * deltaTime;

    // Calculer l'eau entrante des voisins
    float waterIn = 0.0;
    if (totalL > totalHeight) waterIn += (totalL - totalHeight) * flowScale;
    if (totalR > totalHeight) waterIn += (totalR - totalHeight) * flowScale;
    if (totalU > totalHeight) waterIn += (totalU - totalHeight) * flowScale;
    if (totalD > totalHeight) waterIn += (totalD - totalHeight) * flowScale;
    waterIn *= deltaTime * 0.25;

    // Nouvelle quantité d'eau
    float newWater = water + waterIn - waterOut + rainAmount * deltaTime;
    newWater = max(0.0, newWater);

    // Évaporation
    newWater *= (1.0 - evaporationRate * deltaTime);

    // Calculer la vitesse de l'eau (gradient)
    vec2 gradient = vec2(
      (heightL + waterL) - (heightR + waterR),
      (heightD + waterD) - (heightU + waterU)
    );
    float velocity = length(gradient);

    // Érosion basée sur la vitesse de l'eau
    float erosionAmount = erosionRate * velocity * water * deltaTime;
    float newHeight = height - erosionAmount;
    float newSediment = sediment + erosionAmount;

    // Déposition dans les zones calmes
    float depositionAmount = depositionRate * sediment * (1.0 - velocity) * deltaTime;
    newHeight += depositionAmount;
    newSediment -= depositionAmount;

    // Clamp les valeurs
    newHeight = max(0.0, newHeight);
    newSediment = max(0.0, newSediment);

    gl_FragColor = vec4(newHeight, newWater, newSediment, 1.0);
  }
`

export interface ErosionConfig {
  resolution: number
  iterations?: number
  erosionRate?: number
  depositionRate?: number
  evaporationRate?: number
  rainAmount?: number
  deltaTime?: number
}

/**
 * Simulation d'érosion CPU (plus lente mais compatible partout)
 */
export function simulateErosionCPU(
  heightmap: Float32Array,
  resolution: number,
  config: Partial<ErosionConfig> = {}
): Float32Array {
  const {
    iterations = 50,
    erosionRate = 0.3,
    depositionRate = 0.3,
    evaporationRate = 0.02,
    rainAmount = 0.01,
  } = config

  const result = new Float32Array(heightmap)
  const water = new Float32Array(resolution * resolution)
  const sediment = new Float32Array(resolution * resolution)

  const getIndex = (x: number, z: number): number => {
    x = Math.max(0, Math.min(resolution - 1, x))
    z = Math.max(0, Math.min(resolution - 1, z))
    return z * resolution + x
  }

  for (let iter = 0; iter < iterations; iter++) {
    // Ajouter de la pluie
    for (let i = 0; i < water.length; i++) {
      water[i] = (water[i] ?? 0) + rainAmount
    }

    // Simuler l'écoulement et l'érosion
    for (let z = 1; z < resolution - 1; z++) {
      for (let x = 1; x < resolution - 1; x++) {
        const idx = getIndex(x, z)
        const h = result[idx] ?? 0
        const w = water[idx] ?? 0

        if (w < 0.001) continue

        // Hauteurs voisines
        const neighbors = [
          { dx: -1, dz: 0 },
          { dx: 1, dz: 0 },
          { dx: 0, dz: -1 },
          { dx: 0, dz: 1 },
        ]

        let lowestNeighbor = idx
        let lowestHeight = h + w

        for (const n of neighbors) {
          const nIdx = getIndex(x + n.dx, z + n.dz)
          const nHeight = (result[nIdx] ?? 0) + (water[nIdx] ?? 0)
          if (nHeight < lowestHeight) {
            lowestHeight = nHeight
            lowestNeighbor = nIdx
          }
        }

        if (lowestNeighbor !== idx) {
          const heightDiff = (h + w) - lowestHeight
          const flowAmount = Math.min(w, heightDiff * 0.5)

          // Transfert d'eau
          water[idx] = (water[idx] ?? 0) - flowAmount
          water[lowestNeighbor] = (water[lowestNeighbor] ?? 0) + flowAmount

          // Érosion
          const erosionAmount = erosionRate * flowAmount * heightDiff
          result[idx] = (result[idx] ?? 0) - erosionAmount
          sediment[idx] = (sediment[idx] ?? 0) + erosionAmount

          // Transfert de sédiment
          const sedimentTransfer = (sediment[idx] ?? 0) * flowAmount / Math.max(0.001, w)
          sediment[idx] = (sediment[idx] ?? 0) - sedimentTransfer
          sediment[lowestNeighbor] = (sediment[lowestNeighbor] ?? 0) + sedimentTransfer
        }

        // Déposition dans les zones calmes
        const depositionAmount = depositionRate * (sediment[idx] ?? 0)
        result[idx] = (result[idx] ?? 0) + depositionAmount
        sediment[idx] = (sediment[idx] ?? 0) - depositionAmount
      }
    }

    // Évaporation
    for (let i = 0; i < water.length; i++) {
      water[i] = (water[i] ?? 0) * (1 - evaporationRate)

      // Déposer les sédiments restants
      if ((water[i] ?? 0) < 0.001) {
        result[i] = (result[i] ?? 0) + (sediment[i] ?? 0)
        sediment[i] = 0
      }
    }
  }

  return result
}

/**
 * Simulation d'érosion par particules (droplet simulation)
 * Plus réaliste et crée des ravines
 */
export function simulateDropletErosion(
  heightmap: Float32Array,
  resolution: number,
  config: {
    dropletCount?: number
    erosionRate?: number
    depositionRate?: number
    evaporationSpeed?: number
    gravity?: number
    maxLifetime?: number
    inertia?: number
    minSlope?: number
    capacity?: number
  } = {}
): Float32Array {
  const {
    dropletCount = 10000,
    erosionRate = 0.3,
    depositionRate = 0.3,
    evaporationSpeed = 0.01,
    gravity = 4,
    maxLifetime = 30,
    inertia = 0.05,
    minSlope = 0.01,
    capacity = 4,
  } = config

  const result = new Float32Array(heightmap)

  const getHeight = (x: number, z: number): number => {
    const xi = Math.floor(x)
    const zi = Math.floor(z)
    const fx = x - xi
    const fz = z - zi

    // Bilinear interpolation
    const x0 = Math.max(0, Math.min(resolution - 1, xi))
    const x1 = Math.max(0, Math.min(resolution - 1, xi + 1))
    const z0 = Math.max(0, Math.min(resolution - 1, zi))
    const z1 = Math.max(0, Math.min(resolution - 1, zi + 1))

    const h00 = result[z0 * resolution + x0] ?? 0
    const h10 = result[z0 * resolution + x1] ?? 0
    const h01 = result[z1 * resolution + x0] ?? 0
    const h11 = result[z1 * resolution + x1] ?? 0

    const h0 = h00 * (1 - fx) + h10 * fx
    const h1 = h01 * (1 - fx) + h11 * fx

    return h0 * (1 - fz) + h1 * fz
  }

  const getGradient = (x: number, z: number): { dx: number; dz: number } => {
    const xi = Math.floor(x)
    const zi = Math.floor(z)
    const fx = x - xi
    const fz = z - zi

    const x0 = Math.max(0, Math.min(resolution - 1, xi))
    const x1 = Math.max(0, Math.min(resolution - 1, xi + 1))
    const z0 = Math.max(0, Math.min(resolution - 1, zi))
    const z1 = Math.max(0, Math.min(resolution - 1, zi + 1))

    const h00 = result[z0 * resolution + x0] ?? 0
    const h10 = result[z0 * resolution + x1] ?? 0
    const h01 = result[z1 * resolution + x0] ?? 0
    const h11 = result[z1 * resolution + x1] ?? 0

    // Gradient en x et z
    const dx = (h10 - h00) * (1 - fz) + (h11 - h01) * fz
    const dz = (h01 - h00) * (1 - fx) + (h11 - h10) * fx

    return { dx, dz }
  }

  // Simuler chaque goutte
  for (let d = 0; d < dropletCount; d++) {
    // Position initiale aléatoire
    let x = Math.random() * (resolution - 2) + 1
    let z = Math.random() * (resolution - 2) + 1
    let dirX = 0
    let dirZ = 0
    let speed = 1
    let water = 1
    let sediment = 0

    for (let lifetime = 0; lifetime < maxLifetime; lifetime++) {
      const xi = Math.floor(x)
      const zi = Math.floor(z)

      if (xi < 1 || xi >= resolution - 1 || zi < 1 || zi >= resolution - 1) break

      const oldHeight = getHeight(x, z)
      const gradient = getGradient(x, z)

      // Mettre à jour la direction avec inertie
      dirX = dirX * inertia - gradient.dx * (1 - inertia)
      dirZ = dirZ * inertia - gradient.dz * (1 - inertia)

      // Normaliser
      const len = Math.sqrt(dirX * dirX + dirZ * dirZ)
      if (len > 0.0001) {
        dirX /= len
        dirZ /= len
      } else {
        // Direction aléatoire si plat
        const angle = Math.random() * Math.PI * 2
        dirX = Math.cos(angle)
        dirZ = Math.sin(angle)
      }

      // Nouvelle position
      const newX = x + dirX
      const newZ = z + dirZ

      if (newX < 1 || newX >= resolution - 1 || newZ < 1 || newZ >= resolution - 1) break

      const newHeight = getHeight(newX, newZ)
      const heightDiff = oldHeight - newHeight

      // Calculer la capacité de transport
      const slope = Math.max(minSlope, heightDiff)
      const maxSediment = Math.max(0, slope * speed * water * capacity)

      if (sediment > maxSediment) {
        // Déposer l'excès de sédiment
        const depositAmount = (sediment - maxSediment) * depositionRate
        const idx = zi * resolution + xi
        result[idx] = (result[idx] ?? 0) + depositAmount
        sediment -= depositAmount
      } else if (heightDiff > 0) {
        // Éroder
        const erodeAmount = Math.min(heightDiff, (maxSediment - sediment) * erosionRate)

        // Éroder les cellules voisines aussi pour lisser
        for (let ez = -1; ez <= 1; ez++) {
          for (let ex = -1; ex <= 1; ex++) {
            const exi = Math.max(0, Math.min(resolution - 1, xi + ex))
            const ezi = Math.max(0, Math.min(resolution - 1, zi + ez))
            const idx = ezi * resolution + exi
            const weight = ex === 0 && ez === 0 ? 0.5 : 0.5 / 8
            result[idx] = (result[idx] ?? 0) - erodeAmount * weight
          }
        }

        sediment += erodeAmount
      }

      // Mettre à jour la vitesse
      speed = Math.sqrt(Math.max(0, speed * speed + heightDiff * gravity))

      // Évaporer l'eau
      water *= (1 - evaporationSpeed)

      x = newX
      z = newZ

      if (water < 0.01) break
    }
  }

  return result
}

/**
 * Hook React pour appliquer l'érosion à une heightmap
 */
export function useErosion(
  heightmap: Float32Array | null,
  resolution: number,
  config: Partial<ErosionConfig> = {}
): Float32Array | null {
  const erodedRef = useRef<Float32Array | null>(null)

  useEffect(() => {
    if (!heightmap) {
      erodedRef.current = null
      return
    }

    // Utiliser la simulation par gouttelettes (plus réaliste)
    erodedRef.current = simulateDropletErosion(heightmap, resolution, {
      dropletCount: config.iterations ? config.iterations * 200 : 10000,
      erosionRate: config.erosionRate ?? 0.3,
      depositionRate: config.depositionRate ?? 0.3,
      evaporationSpeed: config.evaporationRate ?? 0.02,
    })
  }, [heightmap, resolution, config])

  return erodedRef.current
}

/**
 * Composant pour visualiser l'érosion en temps réel
 */
interface ErosionVisualizerProps {
  heightmap: Float32Array
  resolution: number
  size?: number
  heightScale?: number
  position?: [number, number, number]
  animate?: boolean
}

export function ErosionVisualizer({
  heightmap,
  resolution,
  size = 100,
  heightScale = 10,
  position = [0, 0, 0],
  animate = false,
}: ErosionVisualizerProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const currentHeightmapRef = useRef<Float32Array>(new Float32Array(heightmap))
  const iterationRef = useRef(0)

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, resolution - 1, resolution - 1)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [size, resolution])

  // Appliquer la heightmap initiale
  useEffect(() => {
    currentHeightmapRef.current = new Float32Array(heightmap)
    iterationRef.current = 0

    if (!meshRef.current) return

    const positions = geometry.attributes.position as THREE.BufferAttribute
    if (!positions) return

    for (let i = 0; i < positions.count; i++) {
      const height = heightmap[i] ?? 0
      positions.setY(i, height * heightScale)
    }
    positions.needsUpdate = true
    geometry.computeVertexNormals()
  }, [heightmap, geometry, heightScale])

  // Animation de l'érosion
  useFrame(() => {
    if (!animate || !meshRef.current) return
    if (iterationRef.current >= 100) return // Max 100 iterations

    // Une itération d'érosion
    currentHeightmapRef.current = simulateErosionCPU(
      currentHeightmapRef.current,
      resolution,
      { iterations: 1 }
    )
    iterationRef.current++

    // Mettre à jour la géométrie
    const positions = geometry.attributes.position as THREE.BufferAttribute
    if (!positions) return

    for (let i = 0; i < positions.count; i++) {
      const height = currentHeightmapRef.current[i] ?? 0
      positions.setY(i, height * heightScale)
    }
    positions.needsUpdate = true
    geometry.computeVertexNormals()
  })

  return (
    <mesh ref={meshRef} geometry={geometry} position={position} receiveShadow castShadow>
      <meshStandardMaterial
        color="#8b7355"
        roughness={0.9}
        metalness={0.0}
        flatShading
      />
    </mesh>
  )
}
