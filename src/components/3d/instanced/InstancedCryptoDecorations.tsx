/**
 * Décorations instanciées pour le biome Crypto
 * Cristaux, pièces flottantes, blocs de données
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { poissonDiscSamplingCircular } from '@utils/procedural'

interface InstancedCryptoDecorationsProps {
  radius: number
  colors: { primary: string; secondary: string }
  seed?: number
}

export function InstancedCryptoDecorations({
  radius,
  colors,
  seed = 42,
}: InstancedCryptoDecorationsProps) {
  const positions = useMemo(() => {
    const crystalPositions = poissonDiscSamplingCircular(0, 0, radius * 0.7, 4, seed)
    const coinPositions = poissonDiscSamplingCircular(0, 0, radius * 0.6, 5, seed + 100)
    const dataBlockPositions = poissonDiscSamplingCircular(0, 0, radius * 0.5, 6, seed + 200)

    return {
      crystals: crystalPositions.slice(0, 12),
      coins: coinPositions.slice(0, 8),
      dataBlocks: dataBlockPositions.slice(0, 6),
    }
  }, [radius, seed])

  return (
    <>
      <InstancedCrystals
        positions={positions.crystals}
        primaryColor={colors.primary}
        secondaryColor={colors.secondary}
        seed={seed}
      />
      <InstancedCoins
        positions={positions.coins}
        color={colors.primary}
        seed={seed + 50}
      />
      <InstancedDataBlocks
        positions={positions.dataBlocks}
        color={colors.secondary}
        seed={seed + 150}
      />
      <HolographicChart
        position={[-radius * 0.4, 1, -radius * 0.3]}
        color={colors.secondary}
      />
    </>
  )
}

/**
 * Cristaux géants instanciés avec rotation
 */
interface InstancedCrystalsProps {
  positions: THREE.Vector2[]
  primaryColor: string
  secondaryColor: string
  seed: number
}

function InstancedCrystals({ positions, primaryColor, secondaryColor, seed }: InstancedCrystalsProps) {
  const mainCrystalRef = useRef<THREE.InstancedMesh>(null)
  const smallCrystal1Ref = useRef<THREE.InstancedMesh>(null)
  const smallCrystal2Ref = useRef<THREE.InstancedMesh>(null)
  const smallCrystal3Ref = useRef<THREE.InstancedMesh>(null)

  const count = positions.length

  const variations = useMemo(() => {
    const rng = createSeededRandom(seed)
    return positions.map(() => ({
      height: 1.5 + rng() * 2,
      rotationSpeed: 0.1 + rng() * 0.2,
      rotationOffset: rng() * Math.PI * 2,
      useSecondaryColor: rng() > 0.6,
    }))
  }, [positions, seed])

  const mainMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: primaryColor,
      emissive: primaryColor,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.9,
    }),
    [primaryColor]
  )

  const secondaryMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: secondaryColor,
      emissive: secondaryColor,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.8,
    }),
    [secondaryColor]
  )

  const mainGeometry = useMemo(() => new THREE.ConeGeometry(1, 1, 6), [])
  const smallGeometry = useMemo(() => new THREE.ConeGeometry(0.3, 1, 4), [])

  // Animation de rotation
  useFrame((state) => {
    if (!mainCrystalRef.current) return

    const time = state.clock.elapsedTime
    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    positions.forEach((pos, i) => {
      const v = variations[i]
      if (!v) return
      const rotation = time * v.rotationSpeed + v.rotationOffset

      // Cristal principal
      position.set(pos.x, v.height / 2, pos.y)
      quaternion.setFromEuler(new THREE.Euler(0, rotation, 0))
      scale.set(v.height * 0.25, v.height, v.height * 0.25)
      matrix.compose(position, quaternion, scale)
      mainCrystalRef.current!.setMatrixAt(i, matrix)

      // Petits cristaux autour
      for (let j = 0; j < 3; j++) {
        const angle = (j * Math.PI * 2) / 3 + rotation
        const smallX = pos.x + Math.cos(angle) * 0.4
        const smallZ = pos.y + Math.sin(angle) * 0.4

        position.set(smallX, v.height * 0.2, smallZ)
        quaternion.setFromEuler(new THREE.Euler(0.3, angle, 0))
        scale.set(v.height * 0.1, v.height * 0.4, v.height * 0.1)
        matrix.compose(position, quaternion, scale)

        if (j === 0) smallCrystal1Ref.current?.setMatrixAt(i, matrix)
        if (j === 1) smallCrystal2Ref.current?.setMatrixAt(i, matrix)
        if (j === 2) smallCrystal3Ref.current?.setMatrixAt(i, matrix)
      }
    })

    mainCrystalRef.current.instanceMatrix.needsUpdate = true
    smallCrystal1Ref.current!.instanceMatrix.needsUpdate = true
    smallCrystal2Ref.current!.instanceMatrix.needsUpdate = true
    smallCrystal3Ref.current!.instanceMatrix.needsUpdate = true
  })

  if (count === 0) return null

  return (
    <>
      <instancedMesh
        ref={mainCrystalRef}
        args={[mainGeometry, mainMaterial, count]}
        castShadow
      />
      <instancedMesh
        ref={smallCrystal1Ref}
        args={[smallGeometry, secondaryMaterial, count]}
        castShadow
      />
      <instancedMesh
        ref={smallCrystal2Ref}
        args={[smallGeometry, secondaryMaterial, count]}
        castShadow
      />
      <instancedMesh
        ref={smallCrystal3Ref}
        args={[smallGeometry, secondaryMaterial, count]}
        castShadow
      />
    </>
  )
}

/**
 * Pièces flottantes animées
 */
interface InstancedCoinsProps {
  positions: THREE.Vector2[]
  color: string
  seed: number
}

function InstancedCoins({ positions, color, seed }: InstancedCoinsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const count = positions.length

  const variations = useMemo(() => {
    const rng = createSeededRandom(seed)
    return positions.map(() => ({
      size: 0.4 + rng() * 0.6,
      baseHeight: 2 + rng() * 2,
      rotationSpeed: 0.5 + rng() * 0.5,
      bobSpeed: 0.4 + rng() * 0.4,
      bobOffset: rng() * Math.PI * 2,
    }))
  }, [positions, seed])

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      color,
      metalness: 0.9,
      roughness: 0.1,
      emissive: color,
      emissiveIntensity: 0.2,
    }),
    [color]
  )

  const geometry = useMemo(() => new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32), [])

  useFrame((state) => {
    if (!meshRef.current) return

    const time = state.clock.elapsedTime
    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    positions.forEach((pos, i) => {
      const v = variations[i]
      if (!v) return

      // Position avec flottement
      const bobY = Math.sin(time * v.bobSpeed + v.bobOffset) * 0.3
      position.set(pos.x, v.baseHeight + bobY, pos.y)

      // Rotation continue
      quaternion.setFromEuler(new THREE.Euler(0, time * v.rotationSpeed, 0))

      scale.set(v.size, v.size, v.size)
      matrix.compose(position, quaternion, scale)
      meshRef.current!.setMatrixAt(i, matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  if (count === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow
    />
  )
}

/**
 * Blocs de données rotatifs (wireframe)
 */
interface InstancedDataBlocksProps {
  positions: THREE.Vector2[]
  color: string
  seed: number
}

function InstancedDataBlocks({ positions, color, seed }: InstancedDataBlocksProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const count = positions.length

  const variations = useMemo(() => {
    const rng = createSeededRandom(seed)
    return positions.map(() => ({
      size: 0.4 + rng() * 0.4,
      baseHeight: 0.5 + rng() * 1,
      rotationSpeedX: 0.2 + rng() * 0.3,
      rotationSpeedZ: 0.1 + rng() * 0.2,
      rotationOffset: rng() * Math.PI * 2,
    }))
  }, [positions, seed])

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      color,
      metalness: 0.6,
      roughness: 0.3,
      wireframe: true,
    }),
    [color]
  )

  const geometry = useMemo(() => new THREE.BoxGeometry(0.6, 0.6, 0.6), [])

  useFrame((state) => {
    if (!meshRef.current) return

    const time = state.clock.elapsedTime
    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    positions.forEach((pos, i) => {
      const v = variations[i]
      if (!v) return

      position.set(pos.x, v.baseHeight, pos.y)
      quaternion.setFromEuler(new THREE.Euler(
        time * v.rotationSpeedX + v.rotationOffset,
        0,
        time * v.rotationSpeedZ
      ))
      scale.set(v.size, v.size, v.size)
      matrix.compose(position, quaternion, scale)
      meshRef.current!.setMatrixAt(i, matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  if (count === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow
    />
  )
}

/**
 * Graphique holographique (non instancié car unique)
 */
function HolographicChart({
  position,
  color,
}: {
  position: [number, number, number]
  color: string
}) {
  const groupRef = useRef<THREE.Group>(null)

  const bars = useMemo(() => [0.5, 0.8, 0.6, 1.0, 0.7, 0.9, 0.75], [])

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.7,
    }),
    [color]
  )

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {bars.map((height, i) => (
        <mesh key={i} position={[(i - bars.length / 2) * 0.3, height / 2, 0]}>
          <boxGeometry args={[0.15, height, 0.05]} />
          <primitive object={material} attach="material" />
        </mesh>
      ))}
    </group>
  )
}

function createSeededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = Math.sin(s * 9999) * 10000
    return s - Math.floor(s)
  }
}
