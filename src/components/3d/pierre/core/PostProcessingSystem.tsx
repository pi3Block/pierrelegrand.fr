/**
 * PostProcessingSystem - Système de post-processing optimisé.
 *
 * Architecture R3F v1.1.0 - Phase 4
 *
 * Centralise et optimise les effets de post-processing:
 * - Outline natif (via sélection dynamique)
 * - SMAA anti-aliasing
 * - DepthOfField optionnel
 * - Bloom optionnel
 *
 * Utilise le feature flag `usePostProcessing` pour activation.
 */

import { type ReactNode, useMemo } from 'react'
import {
  EffectComposer,
  Outline,
  SMAA,
  DepthOfField,
  Bloom,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { isFeatureEnabled } from '@config/featureFlags'
import { useHoveredObjects } from './InteractionContext'
import { usePierreStore } from '../stores/pierreStore'

/**
 * Configuration du post-processing.
 */
export interface PostProcessingConfig {
  /** Active l'outline sur les objets survolés */
  outline?: {
    enabled: boolean
    color?: number
    edgeStrength?: number
    xRay?: boolean
  }
  /** Anti-aliasing SMAA */
  smaa?: {
    enabled: boolean
  }
  /** Depth of Field (profondeur de champ) */
  depthOfField?: {
    enabled: boolean
    focusDistance?: number
    focalLength?: number
    bokehScale?: number
  }
  /** Bloom (effet de lueur) */
  bloom?: {
    enabled: boolean
    intensity?: number
    luminanceThreshold?: number
    luminanceSmoothing?: number
  }
  /** Vignette (assombrissement des bords) */
  vignette?: {
    enabled: boolean
    offset?: number
    darkness?: number
  }
}

/**
 * Configuration par défaut pour la scène Pierre.
 */
const DEFAULT_CONFIG: PostProcessingConfig = {
  outline: {
    enabled: true,
    color: 0xffffff,
    edgeStrength: 10,
    xRay: true,
  },
  smaa: {
    enabled: true,
  },
  depthOfField: {
    enabled: false,
    focusDistance: 0.01,
    focalLength: 0.02,
    bokehScale: 2,
  },
  bloom: {
    enabled: false,
    intensity: 0.5,
    luminanceThreshold: 0.9,
    luminanceSmoothing: 0.025,
  },
  vignette: {
    enabled: false,
    offset: 0.3,
    darkness: 0.5,
  },
}

/**
 * Props du PostProcessingSystem.
 */
export interface PostProcessingSystemProps {
  /** Configuration personnalisée */
  config?: Partial<PostProcessingConfig>
  /** Objets à outline (si non fourni, utilise le contexte) */
  selection?: THREE.Object3D[]
  /** Enfants (optionnel, pour wrapper) */
  children?: ReactNode
}

/**
 * PostProcessingSystem - Composant principal de post-processing.
 *
 * Usage simple:
 * ```tsx
 * <PostProcessingSystem />
 * ```
 *
 * Usage avec configuration:
 * ```tsx
 * <PostProcessingSystem
 *   config={{
 *     outline: { enabled: true, color: 0x00ff00 },
 *     bloom: { enabled: true, intensity: 0.8 },
 *   }}
 * />
 * ```
 */
export function PostProcessingSystem({
  config: userConfig,
  selection: externalSelection,
  children,
}: PostProcessingSystemProps) {
  // Vérifier le feature flag
  const usePostProcessing = isFeatureEnabled('usePostProcessing')

  // Store Pierre pour savoir si on est en zone interactive
  const currentStage = usePierreStore((s) => s.currentStage)
  const isInInteractiveZone = currentStage !== 'default'

  // Objets survolés depuis le contexte
  let contextHoveredObjects: THREE.Object3D[] = []
  try {
    contextHoveredObjects = useHoveredObjects()
  } catch {
    // Le contexte n'est pas disponible, utiliser un tableau vide
  }

  // Merge config avec défauts
  const config = useMemo(
    () => ({
      outline: { ...DEFAULT_CONFIG.outline, ...userConfig?.outline },
      smaa: { ...DEFAULT_CONFIG.smaa, ...userConfig?.smaa },
      depthOfField: { ...DEFAULT_CONFIG.depthOfField, ...userConfig?.depthOfField },
      bloom: { ...DEFAULT_CONFIG.bloom, ...userConfig?.bloom },
      vignette: { ...DEFAULT_CONFIG.vignette, ...userConfig?.vignette },
    }),
    [userConfig]
  )

  // Sélection pour outline
  const selection = useMemo(() => {
    // En zone interactive, pas d'outline
    if (isInInteractiveZone) return []
    // Utiliser la sélection externe si fournie
    if (externalSelection && externalSelection.length > 0) return externalSelection
    // Sinon utiliser le contexte
    return contextHoveredObjects
  }, [isInInteractiveZone, externalSelection, contextHoveredObjects])

  // Si post-processing désactivé, juste rendre les enfants
  if (!usePostProcessing) {
    return <>{children}</>
  }

  // Note: On garde l'EffectComposer actif même en zone interactive
  // L'outline sera juste vide (selection = []) pour éviter les artefacts
  // Désactiver complètement l'EffectComposer causerait des problèmes de rendu

  // Construire la liste des effets actifs
  const effects: React.ReactElement[] = []

  // Outline pour les objets survolés
  if (config.outline?.enabled) {
    effects.push(
      <Outline
        key="outline"
        selection={selection}
        visibleEdgeColor={config.outline.color}
        hiddenEdgeColor={config.outline.color}
        edgeStrength={config.outline.edgeStrength}
        blendFunction={BlendFunction.SCREEN}
        xRay={config.outline.xRay}
      />
    )
  }

  // Bloom effect
  if (config.bloom?.enabled) {
    effects.push(
      <Bloom
        key="bloom"
        intensity={config.bloom.intensity}
        luminanceThreshold={config.bloom.luminanceThreshold}
        luminanceSmoothing={config.bloom.luminanceSmoothing}
      />
    )
  }

  // Depth of Field
  if (config.depthOfField?.enabled) {
    effects.push(
      <DepthOfField
        key="dof"
        focusDistance={config.depthOfField.focusDistance}
        focalLength={config.depthOfField.focalLength}
        bokehScale={config.depthOfField.bokehScale}
      />
    )
  }

  // Vignette
  if (config.vignette?.enabled) {
    effects.push(
      <Vignette
        key="vignette"
        offset={config.vignette.offset}
        darkness={config.vignette.darkness}
      />
    )
  }

  // Anti-aliasing SMAA (toujours en dernier)
  if (config.smaa?.enabled) {
    effects.push(<SMAA key="smaa" />)
  }

  return (
    <>
      {children}
      <EffectComposer autoClear={false}>
        {effects}
      </EffectComposer>
    </>
  )
}

/**
 * Presets de configuration post-processing.
 */
export const POST_PROCESSING_PRESETS = {
  /** Configuration minimale (outline + SMAA) */
  minimal: {
    outline: { enabled: true },
    smaa: { enabled: true },
  } as PostProcessingConfig,

  /** Configuration cinématique */
  cinematic: {
    outline: { enabled: false },
    smaa: { enabled: true },
    depthOfField: { enabled: true, focusDistance: 0.02, bokehScale: 3 },
    vignette: { enabled: true, darkness: 0.4 },
  } as PostProcessingConfig,

  /** Configuration stylisée */
  stylized: {
    outline: { enabled: true, edgeStrength: 15 },
    smaa: { enabled: true },
    bloom: { enabled: true, intensity: 0.3 },
  } as PostProcessingConfig,

  /** Configuration haute performance (minimal) */
  performance: {
    outline: { enabled: true, edgeStrength: 5 },
    smaa: { enabled: false },
  } as PostProcessingConfig,
} as const

export default PostProcessingSystem
