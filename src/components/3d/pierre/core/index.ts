/**
 * Barrel export pour les composants core Pierre.
 *
 * Architecture R3F v1.1.0
 */

// Phase 1: Camera System
export {
  CameraSystem,
  useCameraTransition,
  getGlobalFlyToStageR3F,
  STAGE_PRESETS,
  MOBILE_PRESETS,
} from './CameraSystem'
export type { CameraPreset } from './CameraSystem'

// Phase 2: Event System
export { InteractiveMesh } from './InteractiveMesh'
export type { InteractiveMeshProps } from './InteractiveMesh'

export {
  InteractionProvider,
  useInteractionContext,
  useHoveredObjects,
} from './InteractionContext'

export { BvhProvider } from './BvhProvider'

// Phase 3: LOD System
export { LODMesh, LOD_PRESETS } from './LODMesh'
export type { LODMeshProps, LODLevel } from './LODMesh'

export { useLOD, useAdaptiveLOD } from './useLOD'
export type { UseLODOptions, UseLODResult } from './useLOD'

// Phase 4: Post-processing System
export { PostProcessingSystem, POST_PROCESSING_PRESETS } from './PostProcessingSystem'
export type { PostProcessingConfig, PostProcessingSystemProps } from './PostProcessingSystem'

// Phase 5: Suspense Strategy
export { SuspenseGroup, SUSPENSE_GROUPS } from './SuspenseGroup'
export type { SuspenseGroupProps, LoadingPriority } from './SuspenseGroup'

// Phase 6: Performance Monitor
export { PerformanceMonitor, usePerformanceMetrics } from './PerformanceMonitor'
export type { PerformanceMonitorConfig, PerformanceMonitorProps } from './PerformanceMonitor'
