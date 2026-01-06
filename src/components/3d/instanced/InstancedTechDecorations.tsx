/**
 * Décorations instanciées pour le biome Tech
 * Serveurs, circuits, hologrammes
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { poissonDiscSamplingCircular } from '@utils/procedural'

interface InstancedTechDecorationsProps {
  radius: number
  colors: { primary: string; secondary: string }
  seed?: number
}

export function InstancedTechDecorations({
  radius,
  colors,
  seed = 42,
}: InstancedTechDecorationsProps) {
  const positions = useMemo(() => {
    const serverPositions = poissonDiscSamplingCircular(0, 0, radius * 0.6, 5, seed)
    const circuitPositions = poissonDiscSamplingCircular(0, 0, radius * 0.7, 3, seed + 100)

    return {
      servers: serverPositions.slice(0, 6),
      circuits: circuitPositions.slice(0, 8),
    }
  }, [radius, seed])

  return (
    <>
      <InstancedServers
        positions={positions.servers}
        primaryColor={colors.primary}
        secondaryColor={colors.secondary}
        seed={seed}
      />
      <CircuitRing
        radius={5}
        color={colors.primary}
      />
      <InstancedHologramRings
        positions={positions.circuits}
        color={colors.secondary}
        seed={seed + 50}
      />
      <CentralOctahedron color={colors.secondary} />
    </>
  )
}

/**
 * Serveurs flottants instanciés
 */
interface InstancedServersProps {
  positions: THREE.Vector2[]
  primaryColor: string
  secondaryColor: string
  seed: number
}

function InstancedServers({ positions, primaryColor, seed }: InstancedServersProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const count = positions.length

  const variations = useMemo(() => {
    const rng = createSeededRandom(seed)
    return positions.map(() => ({
      baseHeight: 2 + rng() * 2,
      bobSpeed: 0.3 + rng() * 0.3,
      bobOffset: rng() * Math.PI * 2,
      scale: 0.8 + rng() * 0.4,
      useSecondaryColor: rng() > 0.5,
    }))
  }, [positions, seed])

  const primaryMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.7,
      roughness: 0.3,
    }),
    [primaryColor]
  )

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1.5, 0.5), [])

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

      // Flottement vertical
      const bobY = Math.sin(time * v.bobSpeed + v.bobOffset) * 0.3
      position.set(pos.x, v.baseHeight + bobY, pos.y)

      quaternion.identity()
      scale.set(v.scale, v.scale, v.scale)
      matrix.compose(position, quaternion, scale)
      meshRef.current!.setMatrixAt(i, matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  if (count === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, primaryMaterial, count]}
      castShadow
    />
  )
}

/**
 * Anneaux holographiques instanciés
 */
interface InstancedHologramRingsProps {
  positions: THREE.Vector2[]
  color: string
  seed: number
}

function InstancedHologramRings({ positions, color, seed }: InstancedHologramRingsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const count = positions.length

  const variations = useMemo(() => {
    const rng = createSeededRandom(seed)
    return positions.map(() => ({
      height: 1 + rng() * 2,
      rotationSpeedX: 0.3 + rng() * 0.4,
      rotationSpeedY: 0.2 + rng() * 0.3,
      scale: 0.6 + rng() * 0.6,
      rotationOffset: rng() * Math.PI * 2,
    }))
  }, [positions, seed])

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.7,
    }),
    [color]
  )

  const geometry = useMemo(() => new THREE.TorusGeometry(0.8, 0.05, 16, 32), [])

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

      position.set(pos.x, v.height, pos.y)
      quaternion.setFromEuler(new THREE.Euler(
        time * v.rotationSpeedX + v.rotationOffset,
        time * v.rotationSpeedY,
        0
      ))
      scale.set(v.scale, v.scale, v.scale)
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
    />
  )
}

/**
 * Circuit en anneau rotatif (non instancié car unique)
 */
function CircuitRing({ radius, color }: { radius: number; color: string }) {
  const groupRef = useRef<THREE.Group>(null)

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.5,
    }),
    [color]
  )

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

  return (
    <group ref={groupRef} position={[0, 0.05, 0]}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i * Math.PI) / 3) * radius,
            0,
            Math.sin((i * Math.PI) / 3) * radius,
          ]}
        >
          <boxGeometry args={[0.1, 0.02, 3]} />
          <primitive object={material} attach="material" />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Octaèdre central rotatif (non instancié car unique)
 */
function CentralOctahedron({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.8,
      wireframe: true,
    }),
    [color]
  )

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]}>
      <octahedronGeometry args={[0.5]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

function createSeededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = Math.sin(s * 9999) * 10000
    return s - Math.floor(s)
  }
}
