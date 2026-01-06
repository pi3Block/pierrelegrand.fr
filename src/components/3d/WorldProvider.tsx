/**
 * WorldProvider - Context wrapper pour le monde procédural
 *
 * Initialise le WorldStore et fournit les services aux composants enfants.
 * Doit envelopper tous les composants qui utilisent le système de heightmap.
 */

import { useEffect, type ReactNode } from 'react'
import { useWorldStore } from '@stores/worldStore'
import type { WorldConfig } from '@config/worldConfig'

interface WorldProviderProps {
  /** Configuration personnalisée du monde (optionnel) */
  config?: Partial<WorldConfig>
  /** Composants enfants */
  children: ReactNode
}

/**
 * Provider qui initialise le système de monde procédural
 *
 * Usage:
 * ```tsx
 * <WorldProvider>
 *   <Canvas>
 *     <ProceduralWorld />
 *   </Canvas>
 * </WorldProvider>
 * ```
 */
export function WorldProvider({ config, children }: WorldProviderProps) {
  const initialize = useWorldStore((state) => state.initialize)
  const reset = useWorldStore((state) => state.reset)
  const isInitialized = useWorldStore((state) => state.isInitialized)

  // Initialiser le store au montage
  useEffect(() => {
    if (!isInitialized) {
      initialize(config)
    }

    // Cleanup au démontage
    return () => {
      // Ne pas reset si on navigue ailleurs
      // reset()
    }
  }, [initialize, config, isInitialized])

  // Réinitialiser si la config change
  useEffect(() => {
    if (isInitialized && config) {
      reset()
      initialize(config)
    }
  }, [config, reset, initialize, isInitialized])

  return <>{children}</>
}

/**
 * Hook pour réinitialiser le monde
 */
export function useResetWorld() {
  const reset = useWorldStore((state) => state.reset)
  const initialize = useWorldStore((state) => state.initialize)

  return (config?: Partial<WorldConfig>) => {
    reset()
    initialize(config)
  }
}

/**
 * HOC pour s'assurer que le WorldStore est initialisé
 */
export function withWorldProvider<P extends object>(
  Component: React.ComponentType<P>,
  config?: Partial<WorldConfig>
) {
  return function WrappedComponent(props: P) {
    return (
      <WorldProvider config={config}>
        <Component {...props} />
      </WorldProvider>
    )
  }
}

export default WorldProvider
