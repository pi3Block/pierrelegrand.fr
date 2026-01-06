/**
 * Décorations instanciées pour le biome Nature
 * Utilise InstancedMesh pour un seul draw call par type d'objet
 * Positionne les objets SUR le terrain via HeightmapService
 */

import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { poissonDiscSamplingCircular } from '@utils/procedural'
import { useWorldStore } from '@stores/worldStore'

interface InstancedNatureDecorationsProps {
  radius: number
  colors: { primary: string; secondary: string }
  seed?: number
  /** Centre du biome en coordonnées monde */
  worldCenter?: [number, number, number]
  /** ID du biome pour les requêtes de hauteur */
  biomeId?: string
  /** Offset Y du terrain (pour aligner les décorations) */
  terrainOffset?: number
}

/**
 * Position avec hauteur terrain
 */
interface PositionWithHeight {
  localPos: THREE.Vector2
  worldY: number
}

/**
 * Composant principal regroupant toutes les décorations Nature
 */
export function InstancedNatureDecorations({
  radius,
  colors,
  seed = 42,
  worldCenter = [0, 0, 0],
  biomeId = 'nature',
  terrainOffset = 0.1,
}: InstancedNatureDecorationsProps) {
  // État pour stocker les positions finales (ne change plus après initialisation)
  const [finalPositions, setFinalPositions] = useState<{
    trees: PositionWithHeight[]
    rocks: PositionWithHeight[]
    mushrooms: PositionWithHeight[]
  } | null>(null)
  const [avgHeight, setAvgHeight] = useState(terrainOffset + 2)

  // Ref pour éviter les recalculs
  const hasInitializedRef = useRef(false)

  // Requête de hauteur depuis le WorldStore (stable reference)
  const queryHeight = useWorldStore((state) => state.queryHeight)
  const isInitialized = useWorldStore((state) => state.isInitialized)
  const biomeStates = useWorldStore((state) => state.biomeStates)

  // Vérifier si la heightmap du biome est enregistrée
  const biomeState = biomeStates.get(biomeId)
  const hasHeightmap = biomeState?.hasHeightmap ?? false

  // Générer les positions 2D une seule fois (stable)
  const positions2D = useMemo(() => ({
    trees: poissonDiscSamplingCircular(0, 0, radius * 0.7, 4, seed),
    rocks: poissonDiscSamplingCircular(0, 0, radius * 0.8, 5, seed + 100),
    mushrooms: poissonDiscSamplingCircular(0, 0, radius * 0.6, 2.5, seed + 200),
  }), [radius, seed])

  // Calculer les hauteurs une seule fois quand la heightmap est prête
  useEffect(() => {
    // Ne calculer qu'une fois, quand le système est prêt
    if (hasInitializedRef.current) return
    if (!isInitialized || !hasHeightmap) return

    hasInitializedRef.current = true

    // Fonction pour convertir 2D en 3D avec hauteur terrain
    const to3DWithHeight = (pos2D: THREE.Vector2[], maxCount: number): PositionWithHeight[] => {
      return pos2D.slice(0, maxCount).map(pos => {
        const worldX = worldCenter[0] + pos.x
        const worldZ = worldCenter[2] + pos.y
        const terrainHeight = queryHeight(worldX, worldZ, biomeId) + terrainOffset

        return {
          localPos: pos,
          worldY: terrainHeight,
        }
      })
    }

    setFinalPositions({
      trees: to3DWithHeight(positions2D.trees, 15),
      rocks: to3DWithHeight(positions2D.rocks, 10),
      mushrooms: to3DWithHeight(positions2D.mushrooms, 20),
    })

    // Calculer la hauteur moyenne pour les fireflies
    const centerHeight = queryHeight(worldCenter[0], worldCenter[2], biomeId)
    setAvgHeight(centerHeight + terrainOffset + 2)

  }, [isInitialized, hasHeightmap, positions2D, worldCenter, biomeId, queryHeight, terrainOffset])

  // Positions temporaires avant l'initialisation complète
  const tempPositions = useMemo(() => {
    const to3DWithDefaultHeight = (pos2D: THREE.Vector2[], maxCount: number): PositionWithHeight[] => {
      return pos2D.slice(0, maxCount).map(pos => ({
        localPos: pos,
        worldY: terrainOffset,
      }))
    }

    return {
      trees: to3DWithDefaultHeight(positions2D.trees, 15),
      rocks: to3DWithDefaultHeight(positions2D.rocks, 10),
      mushrooms: to3DWithDefaultHeight(positions2D.mushrooms, 20),
    }
  }, [positions2D, terrainOffset])

  // Utiliser les positions finales si disponibles, sinon les temporaires
  const positions = finalPositions ?? tempPositions

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
        center={[0, avgHeight, 0]}
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
  positions: PositionWithHeight[]
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

    positions.forEach((posData, i) => {
      const v = variations[i]
      if (!v) return
      const trunkHeight = v.height * 0.6

      // Utiliser la position locale + hauteur terrain
      const baseX = posData.localPos.x
      const baseZ = posData.localPos.y
      const baseY = posData.worldY // Hauteur du terrain

      // Tronc
      position.set(baseX, baseY + trunkHeight / 2, baseZ)
      quaternion.setFromEuler(new THREE.Euler(0, v.rotationY, 0))
      scale.set(v.scale, trunkHeight, v.scale)
      matrix.compose(position, quaternion, scale)
      trunkRef.current!.setMatrixAt(i, matrix)

      // Feuillage principal (haut)
      const foliageY = baseY + v.height * 0.7
      position.set(baseX, foliageY, baseZ)
      scale.set(v.height * 0.35, v.height * 0.35, v.height * 0.35)
      matrix.compose(position, quaternion, scale)
      foliage1Ref.current!.setMatrixAt(i, matrix)

      // Feuillage secondaire (droite)
      position.set(baseX + v.height * 0.2, baseY + v.height * 0.6, baseZ)
      scale.set(v.height * 0.25, v.height * 0.25, v.height * 0.25)
      matrix.compose(position, quaternion, scale)
      foliage2Ref.current!.setMatrixAt(i, matrix)

      // Feuillage tertiaire (gauche)
      position.set(baseX - v.height * 0.15, baseY + v.height * 0.55, baseZ + v.height * 0.1)
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
        frustumCulled={false}
      />
      <instancedMesh
        ref={foliage1Ref}
        args={[foliageGeometry, foliageMaterial1, count]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={foliage2Ref}
        args={[foliageGeometry, foliageMaterial2, count]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={foliage3Ref}
        args={[foliageGeometry, foliageMaterial1, count]}
        castShadow
        frustumCulled={false}
      />
    </>
  )
}

/**
 * Rochers moussus instanciés
 */
interface InstancedRocksProps {
  positions: PositionWithHeight[]
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

    positions.forEach((posData, i) => {
      const v = variations[i]
      if (!v) return

      // Utiliser la position locale + hauteur terrain
      const baseX = posData.localPos.x
      const baseZ = posData.localPos.y
      const baseY = posData.worldY // Hauteur du terrain

      // Rocher
      position.set(baseX, baseY + v.scale * 0.4, baseZ)
      quaternion.setFromEuler(new THREE.Euler(v.rotationX, v.rotationY, 0))
      scale.set(v.scale, v.scale, v.scale)
      matrix.compose(position, quaternion, scale)
      rockRef.current!.setMatrixAt(i, matrix)

      // Mousse sur le dessus
      position.set(baseX, baseY + v.scale * 0.8, baseZ)
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
  positions: PositionWithHeight[]
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

    positions.forEach((posData, i) => {
      const v = variations[i]
      if (!v) return

      // Utiliser la position locale + hauteur terrain
      const baseX = posData.localPos.x
      const baseZ = posData.localPos.y
      const baseY = posData.worldY // Hauteur du terrain

      // Pied
      position.set(baseX, baseY + v.scale * 0.15, baseZ)
      quaternion.setFromEuler(new THREE.Euler(0, v.rotationY, 0))
      scale.set(v.scale, v.scale, v.scale)
      matrix.compose(position, quaternion, scale)
      stemRef.current!.setMatrixAt(i, matrix)

      // Chapeau
      position.set(baseX, baseY + v.scale * 0.35, baseZ)
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
