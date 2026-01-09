/**
 * PerformanceMonitor - Composant de monitoring des performances.
 *
 * Architecture R3F v1.1.0 - Phase 6
 *
 * Utilise le composant PerformanceMonitor de @react-three/drei pour
 * adapter automatiquement la qualité selon les performances.
 *
 * Fonctionnalités:
 * - Détection automatique des FPS bas
 * - Callback pour dégradation/amélioration de qualité
 * - Hook pour métriques renderer
 */

import { type ReactNode } from 'react'
import { PerformanceMonitor as DreiPerformanceMonitor } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { isFeatureEnabled } from '@config/featureFlags'

/**
 * Configuration du PerformanceMonitor.
 */
export interface PerformanceMonitorConfig {
  /** Seuil FPS minimum avant dégradation (défaut: 30) */
  minFps?: number
  /** Seuil FPS pour qualité maximale (défaut: 55) */
  maxFps?: number
  /** Nombre de frames pour le calcul de moyenne (défaut: 60) */
  iterations?: number
}

/**
 * Props du PerformanceMonitor.
 */
export interface PerformanceMonitorProps {
  /** Enfants à monitorer */
  children?: ReactNode
  /** Configuration personnalisée */
  config?: PerformanceMonitorConfig
  /** Callback quand la qualité doit être dégradée */
  onDecline?: (fps: number) => void
  /** Callback quand la qualité peut être augmentée */
  onIncline?: (fps: number) => void
  /** Callback pour chaque mesure de FPS */
  onChange?: (fps: number) => void
}

/**
 * Configuration par défaut.
 */
const DEFAULT_CONFIG: Required<PerformanceMonitorConfig> = {
  minFps: 30,
  maxFps: 55,
  iterations: 60,
}

/**
 * PerformanceMonitor - Wrapper pour adapter la qualité automatiquement.
 *
 * Usage:
 * ```tsx
 * const [dpr, setDpr] = useState(1.5)
 *
 * <Canvas dpr={dpr}>
 *   <PerformanceMonitor
 *     onDecline={() => setDpr(1)}
 *     onIncline={() => setDpr(2)}
 *   >
 *     <Scene />
 *   </PerformanceMonitor>
 * </Canvas>
 * ```
 *
 * Note: Activé uniquement si `usePerformanceMonitor` est true dans les feature flags.
 */
export function PerformanceMonitor({
  children,
  config: userConfig,
  onDecline,
  onIncline,
  onChange,
}: PerformanceMonitorProps) {
  // Vérifier le feature flag
  const isEnabled = isFeatureEnabled('usePerformanceMonitor')

  // Merge config avec défauts
  const config: Required<PerformanceMonitorConfig> = {
    ...DEFAULT_CONFIG,
    ...userConfig,
  }

  // Si désactivé, juste rendre les enfants
  if (!isEnabled) {
    return <>{children}</>
  }

  return (
    <DreiPerformanceMonitor
      ms={config.iterations}
      onDecline={(api) => {
        const fps = api.fps
        console.debug(`[PerformanceMonitor] FPS declined: ${fps.toFixed(1)}`)
        onDecline?.(fps)
      }}
      onIncline={(api) => {
        const fps = api.fps
        console.debug(`[PerformanceMonitor] FPS inclined: ${fps.toFixed(1)}`)
        onIncline?.(fps)
      }}
      onChange={(api) => {
        onChange?.(api.fps)
      }}
      bounds={(refreshRate) => [config.minFps, Math.min(config.maxFps, refreshRate)]}
    >
      {children}
    </DreiPerformanceMonitor>
  )
}

/**
 * Hook pour accéder aux métriques de performance.
 * Utile pour adapter la qualité programmatiquement.
 */
export function usePerformanceMetrics() {
  const { gl } = useThree()

  return {
    /**
     * Retourne les informations du renderer.
     */
    getRendererInfo: () => ({
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      points: gl.info.render.points,
      lines: gl.info.render.lines,
      textures: gl.info.memory.textures,
      geometries: gl.info.memory.geometries,
    }),

    /**
     * Retourne le pixel ratio actuel.
     */
    getPixelRatio: () => gl.getPixelRatio(),

    /**
     * Modifie le pixel ratio pour adapter la qualité.
     */
    setPixelRatio: (ratio: number) => {
      gl.setPixelRatio(Math.min(ratio, window.devicePixelRatio))
    },
  }
}

export default PerformanceMonitor
