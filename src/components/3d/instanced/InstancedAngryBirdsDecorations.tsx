/**
 * InstancedAngryBirdsDecorations - Decorations low poly style Angry Birds
 * Arbres cartoon, rochers, touffes d'herbe
 * Utilise InstancedMesh pour les performances
 */

import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'

interface InstancedAngryBirdsDecorationsProps {
  /** Rayon de la zone de placement */
  radius?: number
  /** Seed pour le placement aleatoire */
  seed?: number
  /** Fonction pour obtenir la hauteur du terrain */
  getTerrainHeight?: (x: number, z: number) => number
  /** Centre de la zone */
  center?: [number, number, number]
}

/**
 * Generateur pseudo-aleatoire avec seed
 */
function createSeededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = Math.sin(s * 9999) * 10000
    return s - Math.floor(s)
  }
}

/**
 * Echantillonnage Poisson disc simplifie
 */
function poissonDiscSampling(
  centerX: number,
  centerZ: number,
  radius: number,
  minDistance: number,
  seed: number,
  maxPoints: number = 50
): Array<{ x: number; z: number }> {
  const rng = createSeededRandom(seed)
  const points: Array<{ x: number; z: number }> = []
  const attempts = 30

  // Point initial
  const startAngle = rng() * Math.PI * 2
  const startR = rng() * radius * 0.5
  const firstPoint = {
    x: centerX + Math.cos(startAngle) * startR,
    z: centerZ + Math.sin(startAngle) * startR,
  }
  points.push(firstPoint)

  const active = [firstPoint]

  while (active.length > 0 && points.length < maxPoints) {
    const idx = Math.floor(rng() * active.length)
    const point = active[idx]
    if (!point) break

    let found = false
    for (let i = 0; i < attempts; i++) {
      const angle = rng() * Math.PI * 2
      const dist = minDistance + rng() * minDistance
      const newX = point.x + Math.cos(angle) * dist
      const newZ = point.z + Math.sin(angle) * dist

      // Verifier dans le rayon
      const distToCenter = Math.sqrt(
        Math.pow(newX - centerX, 2) + Math.pow(newZ - centerZ, 2)
      )
      if (distToCenter > radius) continue

      // Verifier distance minimum
      let tooClose = false
      for (const p of points) {
        const d = Math.sqrt(Math.pow(p.x - newX, 2) + Math.pow(p.z - newZ, 2))
        if (d < minDistance) {
          tooClose = true
          break
        }
      }

      if (!tooClose) {
        const newPoint = { x: newX, z: newZ }
        points.push(newPoint)
        active.push(newPoint)
        found = true
        break
      }
    }

    if (!found) {
      active.splice(idx, 1)
    }
  }

  return points
}

/**
 * Composant principal regroupant toutes les decorations
 */
export function InstancedAngryBirdsDecorations({
  radius = 35,
  seed = 12345,
  getTerrainHeight = () => 0,
  center = [0, 0, 0],
}: InstancedAngryBirdsDecorationsProps) {
  // Generer les positions
  const positions = useMemo(() => ({
    trees: poissonDiscSampling(center[0], center[2], radius * 0.85, 6, seed, 20),
    rocks: poissonDiscSampling(center[0], center[2], radius * 0.9, 5, seed + 100, 15),
    grass: poissonDiscSampling(center[0], center[2], radius * 0.8, 2, seed + 200, 40),
  }), [center, radius, seed])

  return (
    <>
      <InstancedCartoonTrees
        positions={positions.trees}
        getTerrainHeight={getTerrainHeight}
        seed={seed}
      />
      <InstancedCartoonRocks
        positions={positions.rocks}
        getTerrainHeight={getTerrainHeight}
        seed={seed + 50}
      />
      <InstancedGrassTufts
        positions={positions.grass}
        getTerrainHeight={getTerrainHeight}
        seed={seed + 150}
      />
    </>
  )
}

/**
 * Arbres cartoon instancies
 * Style low poly: tronc cylindrique + feuillage conique
 */
interface TreesProps {
  positions: Array<{ x: number; z: number }>
  getTerrainHeight: (x: number, z: number) => number
  seed: number
}

function InstancedCartoonTrees({ positions, getTerrainHeight, seed }: TreesProps) {
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const foliageRef = useRef<THREE.InstancedMesh>(null)

  const count = positions.length

  // Variations par arbre
  const variations = useMemo(() => {
    const rng = createSeededRandom(seed)
    return positions.map(() => ({
      height: 2 + rng() * 2.5,
      scale: 0.7 + rng() * 0.6,
      rotationY: rng() * Math.PI * 2,
      foliageColor: rng() > 0.3 ? '#4CAF50' : '#66BB6A',
    }))
  }, [positions, seed])

  // Geometries
  const trunkGeometry = useMemo(() => new THREE.CylinderGeometry(0.12, 0.2, 1, 6), [])
  const foliageGeometry = useMemo(() => new THREE.ConeGeometry(1, 2, 6), [])

  // Materiaux
  const trunkMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#5D4037', roughness: 0.9, flatShading: true }),
    []
  )
  const foliageMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#4CAF50', roughness: 0.8, flatShading: true }),
    []
  )

  useEffect(() => {
    if (!trunkRef.current || !foliageRef.current) return

    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    positions.forEach((pos, i) => {
      const v = variations[i]
      if (!v) return

      const terrainY = getTerrainHeight(pos.x, pos.z)
      const trunkHeight = v.height * 0.4

      // Tronc
      position.set(pos.x, terrainY + trunkHeight / 2, pos.z)
      quaternion.setFromEuler(new THREE.Euler(0, v.rotationY, 0))
      scale.set(v.scale, trunkHeight, v.scale)
      matrix.compose(position, quaternion, scale)
      trunkRef.current!.setMatrixAt(i, matrix)

      // Feuillage (cone)
      const foliageY = terrainY + trunkHeight + v.height * 0.4
      position.set(pos.x, foliageY, pos.z)
      scale.set(v.height * 0.4, v.height * 0.6, v.height * 0.4)
      matrix.compose(position, quaternion, scale)
      foliageRef.current!.setMatrixAt(i, matrix)
    })

    trunkRef.current.instanceMatrix.needsUpdate = true
    foliageRef.current.instanceMatrix.needsUpdate = true
  }, [positions, variations, getTerrainHeight])

  if (count === 0) return null

  return (
    <>
      <instancedMesh
        ref={trunkRef}
        args={[trunkGeometry, trunkMaterial, count]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={foliageRef}
        args={[foliageGeometry, foliageMaterial, count]}
        castShadow
        frustumCulled={false}
      />
    </>
  )
}

/**
 * Rochers cartoon instancies
 * Low poly avec faces visibles
 */
interface RocksProps {
  positions: Array<{ x: number; z: number }>
  getTerrainHeight: (x: number, z: number) => number
  seed: number
}

function InstancedCartoonRocks({ positions, getTerrainHeight, seed }: RocksProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const count = positions.length

  const variations = useMemo(() => {
    const rng = createSeededRandom(seed)
    return positions.map(() => ({
      scale: 0.4 + rng() * 0.8,
      rotationY: rng() * Math.PI * 2,
      rotationX: (rng() - 0.5) * 0.4,
    }))
  }, [positions, seed])

  // Dodecahedre pour look low poly
  const geometry = useMemo(() => new THREE.DodecahedronGeometry(0.6, 0), [])
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: '#9E9E9E',
      roughness: 0.95,
      flatShading: true,
    }),
    []
  )

  useEffect(() => {
    if (!meshRef.current) return

    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    positions.forEach((pos, i) => {
      const v = variations[i]
      if (!v) return

      const terrainY = getTerrainHeight(pos.x, pos.z)

      position.set(pos.x, terrainY + v.scale * 0.3, pos.z)
      quaternion.setFromEuler(new THREE.Euler(v.rotationX, v.rotationY, 0))
      scale.set(v.scale, v.scale, v.scale)
      matrix.compose(position, quaternion, scale)
      meshRef.current!.setMatrixAt(i, matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  }, [positions, variations, getTerrainHeight])

  if (count === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  )
}

/**
 * Touffes d'herbe instanciees
 */
interface GrassProps {
  positions: Array<{ x: number; z: number }>
  getTerrainHeight: (x: number, z: number) => number
  seed: number
}

function InstancedGrassTufts({ positions, getTerrainHeight, seed }: GrassProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const count = positions.length

  const variations = useMemo(() => {
    const rng = createSeededRandom(seed)
    return positions.map(() => ({
      scale: 0.3 + rng() * 0.4,
      rotationY: rng() * Math.PI * 2,
    }))
  }, [positions, seed])

  // Cone fin pour representer l'herbe
  const geometry = useMemo(() => new THREE.ConeGeometry(0.15, 0.5, 4), [])
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: '#8BC34A',
      roughness: 0.9,
      flatShading: true,
    }),
    []
  )

  useEffect(() => {
    if (!meshRef.current) return

    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    positions.forEach((pos, i) => {
      const v = variations[i]
      if (!v) return

      const terrainY = getTerrainHeight(pos.x, pos.z)

      position.set(pos.x, terrainY + v.scale * 0.25, pos.z)
      quaternion.setFromEuler(new THREE.Euler(0, v.rotationY, 0))
      scale.set(v.scale, v.scale, v.scale)
      matrix.compose(position, quaternion, scale)
      meshRef.current!.setMatrixAt(i, matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  }, [positions, variations, getTerrainHeight])

  if (count === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  )
}
