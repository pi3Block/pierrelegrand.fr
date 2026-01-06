/**
 * Système LOD (Level of Detail) avancé
 * Gère le morphing entre niveaux de détail et le frustum culling
 */

import { useRef, useMemo, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { LOD_LEVELS } from '@/config/proceduralConfig'

interface LODLevel {
  distance: number
  component: React.ReactNode
}

interface LODObjectProps {
  levels: LODLevel[]
  position?: [number, number, number]
  frustumCulled?: boolean
}

/**
 * Composant LOD générique
 * Affiche différents composants selon la distance à la caméra
 */
export function LODObject({
  levels,
  position = [0, 0, 0],
  frustumCulled = true,
}: LODObjectProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const currentLevelRef = useRef(0)

  // Position du groupe
  const posVec = useMemo(() => new THREE.Vector3(...position), [position])

  // Calculer le niveau LOD actuel
  useFrame(() => {
    if (!groupRef.current) return

    const distance = camera.position.distanceTo(posVec)

    // Trouver le niveau approprié
    let newLevel = 0
    for (let i = levels.length - 1; i >= 0; i--) {
      const level = levels[i]
      if (level && distance >= level.distance) {
        newLevel = i
        break
      }
    }

    // Mettre à jour si changé
    if (newLevel !== currentLevelRef.current) {
      currentLevelRef.current = newLevel

      // Afficher/cacher les niveaux
      groupRef.current.children.forEach((child, index) => {
        child.visible = index === newLevel
      })
    }
  })

  // Sortier les niveaux par distance
  const sortedLevels = useMemo(() => {
    return [...levels].sort((a, b) => a.distance - b.distance)
  }, [levels])

  return (
    <group ref={groupRef} position={position} frustumCulled={frustumCulled}>
      {sortedLevels.map((level, index) => (
        <group key={index} visible={index === 0}>
          {level.component}
        </group>
      ))}
    </group>
  )
}

/**
 * Hook pour obtenir le niveau LOD basé sur la distance
 */
export function useLODLevel(position: THREE.Vector3 | [number, number, number]): number {
  const { camera } = useThree()
  const levelRef = useRef(0)

  const posVec = useMemo(() => {
    if (Array.isArray(position)) {
      return new THREE.Vector3(...position)
    }
    return position
  }, [position])

  useFrame(() => {
    const distance = camera.position.distanceTo(posVec)

    // Trouver le niveau approprié
    for (let i = LOD_LEVELS.length - 1; i >= 0; i--) {
      const level = LOD_LEVELS[i]
      if (level && distance >= level.distance) {
        levelRef.current = i
        return
      }
    }
    levelRef.current = 0
  })

  return levelRef.current
}

/**
 * Hook pour le frustum culling manuel
 * Retourne true si l'objet est visible dans le frustum de la caméra
 */
export function useFrustumCulling(
  position: THREE.Vector3 | [number, number, number],
  boundingRadius: number
): boolean {
  const { camera } = useThree()
  const visibleRef = useRef(true)
  const frustum = useMemo(() => new THREE.Frustum(), [])
  const projScreenMatrix = useMemo(() => new THREE.Matrix4(), [])
  const boundingSphere = useMemo(() => new THREE.Sphere(), [])

  const posVec = useMemo(() => {
    if (Array.isArray(position)) {
      return new THREE.Vector3(...position)
    }
    return position
  }, [position])

  useFrame(() => {
    // Mettre à jour la matrice de projection
    projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
    frustum.setFromProjectionMatrix(projScreenMatrix)

    // Tester l'intersection avec le bounding sphere
    boundingSphere.set(posVec, boundingRadius)
    visibleRef.current = frustum.intersectsSphere(boundingSphere)
  })

  return visibleRef.current
}

/**
 * Gestionnaire de LOD pour les chunks
 * Optimise le rendu en gérant automatiquement les niveaux de détail
 */
interface ChunkLODManagerProps {
  chunks: Array<{
    id: string
    position: [number, number, number]
    component: React.ReactNode
  }>
  lodDistances?: number[]
}

export function ChunkLODManager({
  chunks,
  lodDistances = LOD_LEVELS.map(l => l.distance),
}: ChunkLODManagerProps) {
  const { camera } = useThree()
  const visibilityRef = useRef<Map<string, boolean>>(new Map())

  // Mettre à jour la visibilité des chunks
  const updateVisibility = useCallback(() => {
    chunks.forEach(chunk => {
      const posVec = new THREE.Vector3(...chunk.position)
      const distance = camera.position.distanceTo(posVec)

      // Chunk visible si dans la distance max
      const maxDistance = lodDistances[lodDistances.length - 1] ?? 200
      visibilityRef.current.set(chunk.id, distance <= maxDistance * 1.5)
    })
  }, [chunks, lodDistances, camera])

  useFrame(() => {
    updateVisibility()
  })

  return (
    <group name="chunk-lod-manager">
      {chunks.map(chunk => {
        const visible = visibilityRef.current.get(chunk.id) ?? true
        return visible ? (
          <group key={chunk.id} position={chunk.position}>
            {chunk.component}
          </group>
        ) : null
      })}
    </group>
  )
}

/**
 * Calcule la résolution appropriée pour un LOD donné
 */
export function getLODResolution(lod: number): number {
  const level = LOD_LEVELS[lod]
  return level?.resolution ?? 8
}

/**
 * Calcule si les décorations doivent être affichées pour un LOD donné
 */
export function shouldShowDecorations(lod: number): boolean {
  const level = LOD_LEVELS[lod]
  return level?.decorations ?? false
}

/**
 * Interpole la géométrie entre deux niveaux LOD (morphing)
 * Utilisé pour éviter les "pops" visuels lors des transitions
 */
export function morphGeometryLOD(
  highResPositions: Float32Array,
  lowResPositions: Float32Array,
  factor: number // 0 = high res, 1 = low res
): Float32Array {
  // Note: Cette fonction nécessite que les géométries aient le même nombre de vertices
  // Pour une implémentation plus robuste, il faudrait mapper les vertices entre niveaux

  const result = new Float32Array(highResPositions.length)

  for (let i = 0; i < highResPositions.length; i++) {
    const high = highResPositions[i] ?? 0
    const low = lowResPositions[i] ?? 0
    result[i] = high + (low - high) * factor
  }

  return result
}
