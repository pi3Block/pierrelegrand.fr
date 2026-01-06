/**
 * Système de placement de végétation procédurale
 * Utilise Poisson Disc Sampling avec prise en compte des biomes et LOD
 */

import { useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { poissonDiscSamplingCircular, poissonDiscSamplingWithDensity } from '@utils/procedural'
import type { BiomeType } from '@/config/proceduralConfig'

// Configuration par type de végétation
interface VegetationConfig {
  minDistance: number
  scale: [number, number] // [min, max]
  yOffset: number
  color: string
  lodDistance: number // Distance au-delà de laquelle ne pas afficher
}

const VEGETATION_CONFIGS: Record<string, VegetationConfig> = {
  tree: {
    minDistance: 4,
    scale: [0.8, 1.5],
    yOffset: 0,
    color: '#2d5016',
    lodDistance: 100,
  },
  bush: {
    minDistance: 2,
    scale: [0.4, 0.8],
    yOffset: 0,
    color: '#3a6b22',
    lodDistance: 60,
  },
  rock: {
    minDistance: 3,
    scale: [0.3, 1.0],
    yOffset: -0.2,
    color: '#6b7280',
    lodDistance: 80,
  },
  flower: {
    minDistance: 1,
    scale: [0.1, 0.3],
    yOffset: 0,
    color: '#f472b6',
    lodDistance: 30,
  },
  grass: {
    minDistance: 0.5,
    scale: [0.2, 0.5],
    yOffset: 0,
    color: '#22c55e',
    lodDistance: 40,
  },
}

// Types de végétation par biome
const BIOME_VEGETATION: Record<BiomeType, string[]> = {
  nature: ['tree', 'bush', 'rock', 'flower', 'grass'],
  tech: ['rock'],
  crypto: ['rock', 'bush'],
}

interface VegetationInstance {
  position: THREE.Vector3
  scale: number
  rotation: number
  type: string
}

interface VegetationLayerProps {
  type: string
  instances: VegetationInstance[]
  config: VegetationConfig
}

/**
 * Couche de végétation instanciée
 */
function VegetationLayer({ type, instances, config }: VegetationLayerProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { camera } = useThree()
  const visibleCountRef = useRef(instances.length)

  // Mettre à jour les matrices d'instance
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    instances.forEach((instance, i) => {
      position.copy(instance.position)
      quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), instance.rotation)
      scale.setScalar(instance.scale)

      matrix.compose(position, quaternion, scale)
      mesh.setMatrixAt(i, matrix)
    })

    mesh.instanceMatrix.needsUpdate = true
    mesh.count = instances.length
  }, [instances])

  // LOD: cacher les instances distantes
  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const cameraPos = camera.position
    let visibleCount = 0
    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()

    instances.forEach((instance, i) => {
      const dist = cameraPos.distanceTo(instance.position)

      if (dist <= config.lodDistance) {
        mesh.getMatrixAt(i, matrix)
        position.setFromMatrixPosition(matrix)

        // L'instance est visible
        visibleCount++
      }
    })

    // Mettre à jour le count visible
    if (visibleCount !== visibleCountRef.current) {
      visibleCountRef.current = visibleCount
      // Note: InstancedMesh ne supporte pas le culling par instance natif
      // Pour un vrai LOD par instance, il faudrait utiliser des chunks séparés
    }
  })

  // Géométrie selon le type
  const geometry = useMemo(() => {
    switch (type) {
      case 'tree':
        return new THREE.ConeGeometry(0.5, 2, 8)
      case 'bush':
        return new THREE.SphereGeometry(0.5, 8, 6)
      case 'rock':
        return new THREE.DodecahedronGeometry(0.5, 0)
      case 'flower':
        return new THREE.ConeGeometry(0.2, 0.4, 6)
      case 'grass':
        return new THREE.PlaneGeometry(0.3, 0.5)
      default:
        return new THREE.BoxGeometry(0.5, 0.5, 0.5)
    }
  }, [type])

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.8,
      metalness: 0.1,
    })
  }, [config.color])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  if (instances.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, instances.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  )
}

interface BiomeVegetationProps {
  biome: BiomeType
  center: [number, number, number]
  radius: number
  seed?: number
  density?: number // 0-1, multiplicateur de densité
  getHeight?: (x: number, z: number) => number
}

/**
 * Génère la végétation pour un biome complet
 */
export function BiomeVegetation({
  biome,
  center,
  radius,
  seed = 12345,
  density = 1,
  getHeight = () => 0,
}: BiomeVegetationProps) {
  const vegetationTypes = BIOME_VEGETATION[biome] ?? []

  // Générer les instances pour chaque type de végétation
  const instancesByType = useMemo(() => {
    const result: Record<string, VegetationInstance[]> = {}

    vegetationTypes.forEach((type, typeIndex) => {
      const config = VEGETATION_CONFIGS[type]
      if (!config) return

      // Ajuster la distance min selon la densité
      const adjustedMinDist = config.minDistance / Math.sqrt(density)

      // Générer les points avec Poisson Disc
      const points = poissonDiscSamplingCircular(
        center[0],
        center[2],
        radius * 0.9, // Légèrement plus petit que le biome
        adjustedMinDist,
        seed + typeIndex * 1000
      )

      // Créer les instances avec variations
      const random = createSeededRandom(seed + typeIndex * 2000)

      result[type] = points.map(p => ({
        position: new THREE.Vector3(
          p.x,
          getHeight(p.x, p.y) + config.yOffset,
          p.y
        ),
        scale: config.scale[0] + random() * (config.scale[1] - config.scale[0]),
        rotation: random() * Math.PI * 2,
        type,
      }))
    })

    return result
  }, [biome, center, radius, seed, density, getHeight, vegetationTypes])

  return (
    <group name={`vegetation-${biome}`}>
      {vegetationTypes.map(type => {
        const config = VEGETATION_CONFIGS[type]
        const instances = instancesByType[type]

        if (!config || !instances) return null

        return (
          <VegetationLayer
            key={type}
            type={type}
            instances={instances}
            config={config}
          />
        )
      })}
    </group>
  )
}

/**
 * Système de végétation pour un chunk de terrain
 */
interface ChunkVegetationProps {
  chunkX: number
  chunkZ: number
  size: number
  biome: BiomeType
  seed?: number
  getHeight?: (x: number, z: number) => number
}

export function ChunkVegetation({
  chunkX,
  chunkZ,
  size,
  biome,
  seed = 12345,
  getHeight = () => 0,
}: ChunkVegetationProps) {
  const vegetationTypes = BIOME_VEGETATION[biome] ?? []
  const worldX = chunkX * size
  const worldZ = chunkZ * size

  const instancesByType = useMemo(() => {
    const result: Record<string, VegetationInstance[]> = {}

    vegetationTypes.forEach((type, typeIndex) => {
      const config = VEGETATION_CONFIGS[type]
      if (!config) return

      // Générer les points avec Poisson Disc
      const points = poissonDiscSamplingWithDensity(
        {
          width: size,
          height: size,
          minDistance: config.minDistance,
          seed: seed + chunkX * 1000 + chunkZ + typeIndex * 10000,
        },
        // Densité uniforme pour un chunk
        () => 1
      )

      const random = createSeededRandom(seed + chunkX * 2000 + chunkZ + typeIndex * 20000)

      result[type] = points.map(p => {
        const worldPosX = worldX + p.x
        const worldPosZ = worldZ + p.y

        return {
          position: new THREE.Vector3(
            worldPosX,
            getHeight(worldPosX, worldPosZ) + config.yOffset,
            worldPosZ
          ),
          scale: config.scale[0] + random() * (config.scale[1] - config.scale[0]),
          rotation: random() * Math.PI * 2,
          type,
        }
      })
    })

    return result
  }, [chunkX, chunkZ, size, biome, seed, getHeight, vegetationTypes, worldX, worldZ])

  return (
    <group name={`chunk-vegetation-${chunkX}-${chunkZ}`}>
      {vegetationTypes.map(type => {
        const config = VEGETATION_CONFIGS[type]
        const instances = instancesByType[type]

        if (!config || !instances) return null

        return (
          <VegetationLayer
            key={type}
            type={type}
            instances={instances}
            config={config}
          />
        )
      })}
    </group>
  )
}

// Helper: générateur pseudo-aléatoire seeded
function createSeededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = Math.sin(s * 9999) * 10000
    return s - Math.floor(s)
  }
}
