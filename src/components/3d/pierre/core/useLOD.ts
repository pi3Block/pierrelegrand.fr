/**
 * useLOD - Hook pour gestion du Level of Detail.
 *
 * Architecture R3F v1.1.0 - Phase 3
 *
 * Fournit des utilitaires pour:
 * - Calculer le niveau LOD selon la distance
 * - Générer des versions simplifiées de géométries
 * - Adapter la qualité selon les performances
 */

import { useRef, useMemo, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { isFeatureEnabled } from '@config/featureFlags'

/**
 * Configuration du hook useLOD.
 */
export interface UseLODOptions {
  /** Distances des niveaux LOD */
  distances: number[]
  /** Position de référence pour le calcul de distance */
  position?: THREE.Vector3 | [number, number, number]
  /** Fréquence de mise à jour (frames) - défaut: 10 */
  updateInterval?: number
}

/**
 * Résultat du hook useLOD.
 */
export interface UseLODResult {
  /** Niveau LOD actuel (0 = haute qualité) */
  currentLevel: number
  /** Distance actuelle à la caméra */
  distance: number
  /** Ref à attacher à l'objet pour calcul auto de position */
  ref: React.RefObject<THREE.Object3D | null>
  /** Force la mise à jour du niveau LOD */
  update: () => void
}

/**
 * useLOD - Hook pour calcul manuel du niveau LOD.
 *
 * Utile quand on veut contrôler manuellement ce qui est rendu
 * selon la distance, sans utiliser le composant Detailed.
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { currentLevel, ref } = useLOD({
 *     distances: [0, 10, 25],
 *   })
 *
 *   return (
 *     <group ref={ref}>
 *       {currentLevel === 0 && <HighDetail />}
 *       {currentLevel === 1 && <MediumDetail />}
 *       {currentLevel === 2 && <LowDetail />}
 *     </group>
 *   )
 * }
 * ```
 */
export function useLOD(options: UseLODOptions): UseLODResult {
  const { distances, position, updateInterval = 10 } = options

  const ref = useRef<THREE.Object3D>(null)
  const stateRef = useRef({
    currentLevel: 0,
    distance: 0,
    frameCount: 0,
  })

  const { camera } = useThree()
  // Stocker camera dans une ref pour éviter de l'avoir dans les deps des callbacks
  const cameraRef = useRef(camera)
  cameraRef.current = camera

  // Position de référence (vecteur THREE.js)
  const refPosition = useMemo(() => {
    if (!position) return null
    if (position instanceof THREE.Vector3) return position
    return new THREE.Vector3(...position)
  }, [position])

  /**
   * Calcule le niveau LOD selon la distance.
   */
  const calculateLevel = useCallback(
    (dist: number): number => {
      for (let i = distances.length - 1; i >= 0; i--) {
        if (dist >= distances[i]!) {
          return i
        }
      }
      return 0
    },
    [distances]
  )

  /**
   * Met à jour la distance et le niveau.
   * IMPORTANT: Utilise cameraRef pour éviter les re-renders.
   */
  const update = useCallback(() => {
    // Déterminer la position à utiliser
    let targetPosition: THREE.Vector3

    if (ref.current) {
      // Utiliser la position world de l'objet
      targetPosition = new THREE.Vector3()
      ref.current.getWorldPosition(targetPosition)
    } else if (refPosition) {
      targetPosition = refPosition
    } else {
      return
    }

    // Calculer la distance - utiliser cameraRef.current
    const dist = cameraRef.current.position.distanceTo(targetPosition)
    stateRef.current.distance = dist
    stateRef.current.currentLevel = calculateLevel(dist)
  }, [refPosition, calculateLevel]) // Supprimé camera des deps

  // Mise à jour périodique (pas chaque frame pour économiser le CPU)
  useFrame(() => {
    // Si LOD désactivé, toujours niveau 0
    if (!isFeatureEnabled('useLODSystem')) {
      stateRef.current.currentLevel = 0
      return
    }

    stateRef.current.frameCount++
    if (stateRef.current.frameCount >= updateInterval) {
      stateRef.current.frameCount = 0
      update()
    }
  })

  return {
    get currentLevel() {
      return stateRef.current.currentLevel
    },
    get distance() {
      return stateRef.current.distance
    },
    ref,
    update,
  }
}

/**
 * useAdaptiveLOD - Hook qui adapte automatiquement les distances LOD
 * selon les performances.
 *
 * Si les FPS sont bas, les distances sont réduites pour forcer
 * les niveaux de détail bas plus tôt.
 */
export function useAdaptiveLOD(baseDistances: number[]): number[] {
  const { gl } = useThree()
  // Stocker gl dans une ref pour éviter de l'avoir dans les deps
  const glRef = useRef(gl)
  glRef.current = gl

  // Facteur d'adaptation basé sur les performances
  // TODO: Intégrer avec PerformanceMonitor dans Phase 6
  // Note: pixelRatio est stable, donc on peut calculer une seule fois
  const adaptiveFactor = useMemo(() => {
    // Pour l'instant, utiliser un facteur fixe
    // Sera amélioré avec le PerformanceMonitor
    const pixelRatio = glRef.current.getPixelRatio()
    return pixelRatio >= 2 ? 1.0 : 0.8
  }, []) // Supprimé gl des deps - utilise glRef

  return useMemo(
    () => baseDistances.map((d) => d * adaptiveFactor),
    [baseDistances, adaptiveFactor]
  )
}

export default useLOD
