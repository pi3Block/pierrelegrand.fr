/**
 * EventGate - Contexte pour désactiver les événements globalement.
 *
 * Architecture R3F v1.1.0 - Phase 2
 *
 * Avantages:
 * - Désactive tous les événements enfants quand on est en mode focus
 * - Évite les raycasts inutiles quand on interagit avec un élément spécifique
 * - Réduit la charge CPU en zone interactive
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { usePierreStore } from '../stores/pierreStore'

/**
 * Type du contexte EventGate.
 */
interface EventGateContextValue {
  /** Indique si les événements sont activés */
  eventsEnabled: boolean
}

/**
 * Contexte EventGate avec valeur par défaut.
 */
const EventGateContext = createContext<EventGateContextValue>({
  eventsEnabled: true,
})

/**
 * Hook pour accéder au contexte EventGate.
 */
export function useEventGate(): EventGateContextValue {
  return useContext(EventGateContext)
}

/**
 * Props du provider EventGate.
 */
interface EventGateProviderProps {
  children: ReactNode
}

/**
 * EventGateProvider - Fournit le contexte de gestion des événements.
 *
 * Désactive automatiquement les événements quand on n'est pas en vue default.
 *
 * Usage:
 * ```tsx
 * <EventGateProvider>
 *   <InteractiveMesh name="arcade">
 *     <primitive object={arcadeModel} />
 *   </InteractiveMesh>
 * </EventGateProvider>
 * ```
 */
export function EventGateProvider({ children }: EventGateProviderProps) {
  const currentStage = usePierreStore((s) => s.currentStage)

  const value = useMemo(
    () => ({
      // Événements actifs seulement en mode default
      eventsEnabled: currentStage === 'default',
    }),
    [currentStage]
  )

  return (
    <EventGateContext.Provider value={value}>
      {children}
    </EventGateContext.Provider>
  )
}

export default EventGateProvider
