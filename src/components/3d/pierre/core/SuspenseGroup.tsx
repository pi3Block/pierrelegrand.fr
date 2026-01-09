/**
 * SuspenseGroup - Composant pour grouper les Suspense par priorité.
 *
 * Architecture R3F v1.1.0 - Phase 5
 *
 * Permet de grouper les composants par niveau de priorité de chargement:
 * - Critical: Chargé en premier (pièce, éléments principaux)
 * - Secondary: Chargé ensuite (éléments interactifs)
 * - Deferred: Chargé en dernier (effets, décorations)
 *
 * Avantages:
 * - Meilleur contrôle du chargement progressif
 * - Réduction du temps de first paint
 * - UX améliorée avec fallbacks appropriés
 */

import { Suspense, type ReactNode } from 'react'
import { Html } from '@react-three/drei'
import { isFeatureEnabled } from '@config/featureFlags'

/**
 * Niveaux de priorité de chargement.
 */
export type LoadingPriority = 'critical' | 'secondary' | 'deferred'

/**
 * Props du SuspenseGroup.
 */
export interface SuspenseGroupProps {
  /** Contenu à charger */
  children: ReactNode
  /** Niveau de priorité */
  priority?: LoadingPriority
  /** Fallback personnalisé (optionnel) */
  fallback?: ReactNode
  /** Nom du groupe pour debug */
  name?: string
}

/**
 * Fallback par défaut pour chaque niveau de priorité.
 */
function DefaultFallback({ priority, name }: { priority: LoadingPriority; name?: string }) {
  // Critical: afficher un placeholder visible
  if (priority === 'critical') {
    return (
      <Html center>
        <div
          style={{
            color: 'white',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {name ? `Chargement de ${name}...` : 'Chargement...'}
        </div>
      </Html>
    )
  }

  // Secondary et Deferred: pas de placeholder visible
  return null
}

/**
 * SuspenseGroup - Wrapper Suspense avec priorité.
 *
 * Usage:
 * ```tsx
 * // Chargement critique (premier à charger)
 * <SuspenseGroup priority="critical" name="pièce">
 *   <BakedRoom />
 * </SuspenseGroup>
 *
 * // Chargement secondaire
 * <SuspenseGroup priority="secondary">
 *   <MonitorScreen />
 * </SuspenseGroup>
 *
 * // Chargement différé (dernier à charger)
 * <SuspenseGroup priority="deferred">
 *   <Confetti />
 * </SuspenseGroup>
 * ```
 */
export function SuspenseGroup({
  children,
  priority = 'secondary',
  fallback,
  name,
}: SuspenseGroupProps) {
  // Vérifier le feature flag
  const useSuspenseStrategy = isFeatureEnabled('useSuspenseStrategy')

  // Si le flag est désactivé, utiliser un Suspense simple
  if (!useSuspenseStrategy) {
    return <Suspense fallback={fallback ?? null}>{children}</Suspense>
  }

  // Fallback à utiliser
  const actualFallback = fallback ?? <DefaultFallback priority={priority} name={name} />

  return <Suspense fallback={actualFallback}>{children}</Suspense>
}

/**
 * Presets de groupes Suspense pour la scène Pierre.
 */
export const SUSPENSE_GROUPS = {
  /**
   * Groupe critique - Chargé en premier.
   * Inclut: pièce principale, éclairage, éléments essentiels.
   */
  Critical: ({ children, name }: { children: ReactNode; name?: string }) => (
    <SuspenseGroup priority="critical" name={name}>
      {children}
    </SuspenseGroup>
  ),

  /**
   * Groupe secondaire - Chargé après le critique.
   * Inclut: éléments interactifs, écrans, jeux.
   */
  Secondary: ({ children, name }: { children: ReactNode; name?: string }) => (
    <SuspenseGroup priority="secondary" name={name}>
      {children}
    </SuspenseGroup>
  ),

  /**
   * Groupe différé - Chargé en dernier.
   * Inclut: effets visuels, confetti, particules.
   */
  Deferred: ({ children, name }: { children: ReactNode; name?: string }) => (
    <SuspenseGroup priority="deferred" name={name}>
      {children}
    </SuspenseGroup>
  ),
} as const

export default SuspenseGroup
