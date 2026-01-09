/**
 * CameraSystem - Système de caméra R3F natif.
 *
 * Architecture R3F v1.1.0 - Phase 1
 *
 * Remplace l'implémentation GSAP par CameraControls de drei.
 * Avantages:
 * - Transitions fluides avec courbes de Bézier
 * - Meilleure intégration R3F (pas de manipulation directe)
 * - Support touch natif
 * - API déclarative
 */

import { useRef, useCallback, useMemo } from 'react'
import { CameraControls } from '@react-three/drei'
import type CameraControlsImpl from 'camera-controls'
import * as THREE from 'three'
import { usePierreStore, type PierreStage } from '../stores/pierreStore'

/**
 * Configuration d'une position caméra.
 */
export interface CameraPreset {
  position: [number, number, number]
  target: [number, number, number]
  fov?: number
}

/**
 * Props du CameraSystem.
 */
interface CameraSystemProps {
  /** Configuration initiale */
  initialPreset?: CameraPreset
  /** Désactive les contrôles utilisateur */
  locked?: boolean
  /** Callback quand une transition se termine */
  onTransitionComplete?: (stage: PierreStage) => void
}

/**
 * Positions des zones interactives.
 */
const STAGE_PRESETS: Record<PierreStage, CameraPreset> = {
  default: {
    position: [-23, 17, 23],
    target: [0, 2.5, 0],
    fov: 20,
  },
  arcadeMachine: {
    position: [-4.5, 5.5, 2.3009],
    target: [3.25776, 2.74209, 2.3009],
  },
  leftMonitor: {
    position: [1.06738, 2.60725, -1.6],
    target: [1.06738, 2.50725, -4.23009],
  },
  rightMonitor: {
    position: [2.13997, 2.60716, -1.53751],
    target: [2.47898, 2.50716, -4.14566],
  },
  whiteboard: {
    position: [-3.3927, 5.18774, 4.61366],
    target: [-3.3927, 3.18774, -4.61366],
  },
  rubikGroup: {
    position: [-23, 17, 23],
    target: [-16, 12.5, 16],
  },
  hubPortal: {
    position: [-23, 17, 23],
    target: [0, 2.5, 0],
  },
  hub: {
    position: [-23, 17, 23],
    target: [0, 2.5, 0],
  },
}

/**
 * Positions ajustées pour mobile.
 */
const MOBILE_PRESETS: Partial<Record<PierreStage, CameraPreset>> = {
  leftMonitor: {
    position: [1.06738, 2.60725, 2.5],
    target: [1.06738, 2.50725, -4.23009],
  },
  rightMonitor: {
    position: [2.13997, 2.60716, 2.6],
    target: [2.47898, 2.50716, -4.14566],
  },
}

/**
 * Configuration des limites OrbitControls.
 */
const CONTROLS_CONFIG = {
  minDistance: 2,
  maxDistance: 35,
  minPolarAngle: Math.PI / 6,
  maxPolarAngle: Math.PI / 2,
  minAzimuthAngle: -Math.PI / 2,
  maxAzimuthAngle: Math.PI / 30,
  smoothTime: 0.25,
  draggingSmoothTime: 0.1,
}

/**
 * Détecte si on est sur mobile.
 */
function useIsMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 768
}

/**
 * Retourne le preset approprié (mobile ou desktop).
 */
function getPreset(stage: PierreStage, isMobile: boolean): CameraPreset {
  if (isMobile && MOBILE_PRESETS[stage]) {
    return MOBILE_PRESETS[stage]!
  }
  return STAGE_PRESETS[stage]
}

// Store global pour exposer flyToStage depuis le bandeau (compatibilité)
let globalFlyToStageR3F: ((stage: PierreStage) => void) | null = null

export function getGlobalFlyToStageR3F() {
  return globalFlyToStageR3F
}

/**
 * CameraSystem - Composant principal.
 *
 * Utilise CameraControls de drei pour les transitions fluides.
 * Compatible avec le store pierreStore existant.
 */
export function CameraSystem({
  initialPreset,
  locked = false,
  onTransitionComplete,
}: CameraSystemProps) {
  const controlsRef = useRef<CameraControlsImpl | null>(null)
  const isInitializedRef = useRef(false)
  // Stocker initialPreset dans une ref pour éviter de le mettre dans les deps du callback
  const initialPresetRef = useRef(initialPreset)
  const isMobile = useIsMobile()

  // Store Pierre
  const currentStage = usePierreStore((s) => s.currentStage)
  const setCurrentStage = usePierreStore((s) => s.setCurrentStage)
  const isCameraMoving = usePierreStore((s) => s.isCameraMoving)
  const setIsCameraMoving = usePierreStore((s) => s.setIsCameraMoving)

  // Contrôles désactivés en zone interactive
  const controlsEnabled = currentStage === 'default' && !locked && !isCameraMoving

  /**
   * Transition vers un stage.
   */
  const flyToStage = useCallback(
    async (stage: PierreStage) => {
      console.log('[CameraSystem] 🚀 flyToStage', { stage })

      if (!controlsRef.current || isCameraMoving) {
        console.log('[CameraSystem] ⚠️ BLOCKED', { hasControls: !!controlsRef.current, isCameraMoving })
        return
      }

      const preset = getPreset(stage, isMobile)

      setIsCameraMoving(true)
      setCurrentStage(stage)

      // Désactiver le damping pendant la transition
      controlsRef.current.smoothTime = 0

      // Transition avec CameraControls
      await controlsRef.current.setLookAt(
        preset.position[0],
        preset.position[1],
        preset.position[2],
        preset.target[0],
        preset.target[1],
        preset.target[2],
        true
      )

      // Réactiver le damping
      controlsRef.current.smoothTime = CONTROLS_CONFIG.smoothTime

      console.log('[CameraSystem] ✅ flyToStage DONE', { stage })

      setIsCameraMoving(false)
      onTransitionComplete?.(stage)
    },
    [isMobile, isCameraMoving, setCurrentStage, setIsCameraMoving, onTransitionComplete]
  )

  /**
   * Callback ref pour initialiser CameraControls au montage.
   * Pattern R3F: pas de useEffect, on utilise le callback ref.
   * IMPORTANT: Pas de dépendances R3F (camera) pour éviter les re-renders.
   * On accède à la camera via controls.camera.
   */
  const handleControlsRef = useCallback(
    (controls: CameraControlsImpl | null) => {
      controlsRef.current = controls

      if (!controls) {
        // Unmount - cleanup
        globalFlyToStageR3F = null
        return
      }

      // Exposer flyToStage globalement
      globalFlyToStageR3F = flyToStage

      // Initialiser une seule fois
      if (isInitializedRef.current) return
      isInitializedRef.current = true

      // Utiliser initialPresetRef pour éviter la dépendance
      const preset = initialPresetRef.current ?? STAGE_PRESETS.default

      console.log('[CameraSystem] 🎬 INIT (once)', { position: preset.position, target: preset.target })

      // Position initiale immédiate
      controls.setLookAt(
        preset.position[0],
        preset.position[1],
        preset.position[2],
        preset.target[0],
        preset.target[1],
        preset.target[2],
        false
      )

      // FOV si spécifié - accéder à la camera via controls.camera (pas useThree)
      if (preset.fov) {
        const cam = controls.camera
        if (cam instanceof THREE.PerspectiveCamera) {
          cam.fov = preset.fov
          cam.updateProjectionMatrix()
        }
      }
    },
    [flyToStage] // Supprimé initialPreset et camera des deps
  )

  // Props mémorisées pour CameraControls
  const controlsProps = useMemo(
    () => ({
      minDistance: CONTROLS_CONFIG.minDistance,
      maxDistance: CONTROLS_CONFIG.maxDistance,
      minPolarAngle: CONTROLS_CONFIG.minPolarAngle,
      maxPolarAngle: CONTROLS_CONFIG.maxPolarAngle,
      minAzimuthAngle: CONTROLS_CONFIG.minAzimuthAngle,
      maxAzimuthAngle: CONTROLS_CONFIG.maxAzimuthAngle,
      smoothTime: CONTROLS_CONFIG.smoothTime,
      draggingSmoothTime: CONTROLS_CONFIG.draggingSmoothTime,
    }),
    []
  )

  return (
    <CameraControls
      ref={handleControlsRef}
      makeDefault
      enabled={controlsEnabled}
      {...controlsProps}
    />
  )
}

/**
 * Hook pour accéder à flyToStage depuis n'importe où.
 */
export function useCameraTransition() {
  return {
    flyToStage: globalFlyToStageR3F,
    isAvailable: globalFlyToStageR3F !== null,
  }
}

/**
 * Exporte les presets pour usage externe.
 */
export { STAGE_PRESETS, MOBILE_PRESETS }

export default CameraSystem
