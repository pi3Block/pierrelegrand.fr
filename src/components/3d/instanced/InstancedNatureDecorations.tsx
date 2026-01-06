/**
 * Décorations instanciées pour le biome Nature
 * Utilise InstancedMesh pour un seul draw call par type d'objet
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { poissonDiscSamplingCircular } from '@utils/procedural'

interface InstancedNatureDecorationsProps {
  radius: number
  colors: { primary: string; secondary: string }
  seed?: number
}

/**
 * Composant principal regroupant toutes les décorations Nature
 */
export function InstancedNatureDecorations({
  radius,
  colors,
  seed = 42,
}: InstancedNatureDecorationsProps) {
  // Générer les positions une seule fois
  const positions = useMemo(() => {
    const treePositions = poissonDiscSamplingCircular(0, 0, radius * 0.7, 4, seed)
    const rockPositions = poissonDiscSamplingCircular(0, 0, radius * 0.8, 5, seed + 100)
    const mushroomPositions = poissonDiscSamplingCircular(0, 0, radius * 0.6, 2.5, seed + 200)

    return {
      trees: treePositions.slice(0, 15),       // Max 15 arbres
      rocks: rockPositions.slice(0, 10),       // Max 10 rochers
      mushrooms: mushroomPositions.slice(0, 20), // Max 20 champignons
    }
  }, [radius, seed])

  return (
    <>
      <InstancedTrees
        positions={positions.trees}
        primaryColor={colors.primary}
        secondaryColor={colors.secondary}
        seed={seed}
      />
      <InstancedRocks
        positions={positions.rocks}
        mossColor={colors.secondary}
        seed={seed + 50}
      />
      <InstancedMushrooms
        positions={positions.mushrooms}
        glowColor={colors.secondary}
        seed={seed + 150}
      />
      <InstancedFireflies
        center={[0, 2, 0]}
        color={colors.secondary}
        count={12}
        radius={radius * 0.5}
      />
    </>
  )
}

/**
 * Arbres stylisés instanciés
 * Chaque arbre = 1 tronc (cylindre) + 3 feuillages (sphères)
 */
interface InstancedTreesProps {
  positions: THREE.Vector2[]
  primaryColor: string
  secondaryColor: string
  seed: number
}

function InstancedTrees({ positions, primaryColor, secondaryColor, seed }: InstancedTreesProps) {
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const foliage1Ref = useRef<THREE.InstancedMesh>(null)
  const foliage2Ref = useRef<THREE.InstancedMesh>(null)
  const foliage3Ref = useRef<THREE.InstancedMesh>(null)

  const count = positions.length

  // Pré-calculer les variations de taille
  const variations = useMemo(() => {
    const rng = createSeededRandom(seed)
    return positions.map(() => ({
      height: 2.5 + rng() * 2,
      scale: 0.8 + rng() * 0.4,
      rotationY: rng() * Math.PI * 2,
      colorVariant: rng() > 0.5,
    }))
  }, [positions, seed])

  // Matériaux
  const trunkMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#5d4037', roughness: 0.9 }),
    []
  )
  const foliageMaterial1 = useMemo(
    () => new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.8 }),
    [primaryColor]
  )
  const foliageMaterial2 = useMemo(
    () => new THREE.MeshStandardMaterial({ color: secondaryColor, roughness: 0.8 }),
    [secondaryColor]
  )

  // Géométries partagées
  const trunkGeometry = useMemo(() => new THREE.CylinderGeometry(0.15, 0.25, 1, 8), [])
  const foliageGeometry = useMemo(() => new THREE.SphereGeometry(1, 8, 8), [])

  useEffect(() => {
    if (!trunkRef.current || !foliage1Ref.current || !foliage2Ref.current || !foliage3Ref.current) return

    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    positions.forEach((pos, i) => {
      const v = variations[i]
      if (!v) return
      const trunkHeight = v.height * 0.6

      // Tronc
      position.set(pos.x, trunkHeight / 2, pos.y)
      quaternion.setFromEuler(new THREE.Euler(0, v.rotationY, 0))
      scale.set(v.scale, trunkHeight, v.scale)
      matrix.compose(position, quaternion, scale)
      trunkRef.current!.setMatrixAt(i, matrix)

      // Feuillage principal (haut)
      const foliageY = v.height * 0.7
      position.set(pos.x, foliageY, pos.y)
      scale.set(v.height * 0.35, v.height * 0.35, v.height * 0.35)
      matrix.compose(position, quaternion, scale)
      foliage1Ref.current!.setMatrixAt(i, matrix)

      // Feuillage secondaire (droite)
      position.set(pos.x + v.height * 0.2, v.height * 0.6, pos.y)
      scale.set(v.height * 0.25, v.height * 0.25, v.height * 0.25)
      matrix.compose(position, quaternion, scale)
      foliage2Ref.current!.setMatrixAt(i, matrix)

      // Feuillage tertiaire (gauche)
      position.set(pos.x - v.height * 0.15, v.height * 0.55, pos.y + v.height * 0.1)
      scale.set(v.height * 0.2, v.height * 0.2, v.height * 0.2)
      matrix.compose(position, quaternion, scale)
      foliage3Ref.current!.setMatrixAt(i, matrix)
    })

    trunkRef.current.instanceMatrix.needsUpdate = true
    foliage1Ref.current.instanceMatrix.needsUpdate = true
    foliage2Ref.current.instanceMatrix.needsUpdate = true
    foliage3Ref.current.instanceMatrix.needsUpdate = true
  }, [positions, variations])

  if (count === 0) return null

  return (
    <>
      <instancedMesh
        ref={trunkRef}
        args={[trunkGeometry, trunkMaterial, count]}
        castShadow
      />
      <instancedMesh
        ref={foliage1Ref}
        args={[foliageGeometry, foliageMaterial1, count]}
        castShadow
      />
      <instancedMesh
        ref={foliage2Ref}
        args={[foliageGeometry, foliageMaterial2, count]}
        castShadow
      />
      <instancedMesh
        ref={foliage3Ref}
        args={[foliageGeometry, foliageMaterial1, count]}
        castShadow
      />
    </>
  )
}

/**
 * Rochers moussus instanciés
 */
interface InstancedRocksProps {
  positions: THREE.Vector2[]
  mossColor: string
  seed: number
}

function InstancedRocks({ positions, mossColor, seed }: InstancedRocksProps) {
  const rockRef = useRef<THREE.InstancedMesh>(null)
  const mossRef = useRef<THREE.InstancedMesh>(null)

  const count = positions.length

  const variations = useMemo(() => {
    const rng = createSeededRandom(seed)
    return positions.map(() => ({
      scale: 0.5 + rng() * 0.8,
      rotationY: rng() * Math.PI * 2,
      rotationX: (rng() - 0.5) * 0.3,
    }))
  }, [positions, seed])

  const rockMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#6b7280', roughness: 0.95 }),
    []
  )
  const mossMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: mossColor, roughness: 0.9 }),
    [mossColor]
  )

  const rockGeometry = useMemo(() => new THREE.DodecahedronGeometry(0.8, 0), [])
  const mossGeometry = useMemo(() => new THREE.SphereGeometry(0.5, 8, 8), [])

  useEffect(() => {
    if (!rockRef.current || !mossRef.current) return

    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    positions.forEach((pos, i) => {
      const v = variations[i]
      if (!v) return

      // Rocher
      position.set(pos.x, v.scale * 0.4, pos.y)
      quaternion.setFromEuler(new THREE.Euler(v.rotationX, v.rotationY, 0))
      scale.set(v.scale, v.scale, v.scale)
      matrix.compose(position, quaternion, scale)
      rockRef.current!.setMatrixAt(i, matrix)

      // Mousse sur le dessus
      position.set(pos.x, v.scale * 0.8, pos.y)
      scale.set(v.scale * 0.6, v.scale * 0.4, v.scale * 0.6)
      matrix.compose(position, quaternion, scale)
      mossRef.current!.setMatrixAt(i, matrix)
    })

    rockRef.current.instanceMatrix.needsUpdate = true
    mossRef.current.instanceMatrix.needsUpdate = true
  }, [positions, variations])

  if (count === 0) return null

  return (
    <>
      <instancedMesh
        ref={rockRef}
        args={[rockGeometry, rockMaterial, count]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={mossRef}
        args={[mossGeometry, mossMaterial, count]}
      />
    </>
  )
}

/**
 * Champignons lumineux instanciés
 */
interface InstancedMushroomsProps {
  positions: THREE.Vector2[]
  glowColor: string
  seed: number
}

function InstancedMushrooms({ positions, glowColor, seed }: InstancedMushroomsProps) {
  const stemRef = useRef<THREE.InstancedMesh>(null)
  const capRef = useRef<THREE.InstancedMesh>(null)

  const count = positions.length

  const variations = useMemo(() => {
    const rng = createSeededRandom(seed)
    return positions.map(() => ({
      scale: 0.4 + rng() * 0.6,
      rotationY: rng() * Math.PI * 2,
    }))
  }, [positions, seed])

  const stemMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#e8d5b7', roughness: 0.8 }),
    []
  )
  const capMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: glowColor,
      emissive: glowColor,
      emissiveIntensity: 0.5,
    }),
    [glowColor]
  )

  const stemGeometry = useMemo(() => new THREE.CylinderGeometry(0.08, 0.12, 0.3, 8), [])
  const capGeometry = useMemo(
    () => new THREE.SphereGeometry(0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    []
  )

  useEffect(() => {
    if (!stemRef.current || !capRef.current) return

    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    positions.forEach((pos, i) => {
      const v = variations[i]
      if (!v) return

      // Pied
      position.set(pos.x, v.scale * 0.15, pos.y)
      quaternion.setFromEuler(new THREE.Euler(0, v.rotationY, 0))
      scale.set(v.scale, v.scale, v.scale)
      matrix.compose(position, quaternion, scale)
      stemRef.current!.setMatrixAt(i, matrix)

      // Chapeau
      position.set(pos.x, v.scale * 0.35, pos.y)
      matrix.compose(position, quaternion, scale)
      capRef.current!.setMatrixAt(i, matrix)
    })

    stemRef.current.instanceMatrix.needsUpdate = true
    capRef.current.instanceMatrix.needsUpdate = true
  }, [positions, variations])

  if (count === 0) return null

  return (
    <>
      <instancedMesh
        ref={stemRef}
        args={[stemGeometry, stemMaterial, count]}
        castShadow
      />
      <instancedMesh
        ref={capRef}
        args={[capGeometry, capMaterial, count]}
        castShadow
      />
    </>
  )
}

/**
 * Lucioles animées (particules flottantes)
 */
interface InstancedFirefliesProps {
  center: [number, number, number]
  color: string
  count: number
  radius: number
}

function InstancedFireflies({ center, color, count, radius }: InstancedFirefliesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const timeOffsets = useMemo(
    () => Array.from({ length: count }, (_, i) => i * 0.8),
    [count]
  )

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 2,
    }),
    [color]
  )

  const geometry = useMemo(() => new THREE.SphereGeometry(0.05, 8, 8), [])

  useFrame((state) => {
    if (!meshRef.current) return

    const time = state.clock.elapsedTime
    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const scale = new THREE.Vector3(1, 1, 1)
    const quaternion = new THREE.Quaternion()

    for (let i = 0; i < count; i++) {
      const t = timeOffsets[i] ?? 0
      const angle = (i / count) * Math.PI * 2

      position.set(
        center[0] + Math.cos(time * 0.3 + t) * radius * 0.3 + Math.cos(angle) * radius * 0.5,
        center[1] + Math.sin(time * 0.5 + t) * 0.5,
        center[2] + Math.sin(time * 0.3 + t) * radius * 0.3 + Math.sin(angle) * radius * 0.5
      )

      // Pulsation de taille
      const pulse = 0.8 + Math.sin(time * 2 + t) * 0.2
      scale.set(pulse, pulse, pulse)

      matrix.compose(position, quaternion, scale)
      meshRef.current.setMatrixAt(i, matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
    />
  )
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
