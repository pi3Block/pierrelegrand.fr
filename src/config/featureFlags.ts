/**
 * Feature Flags - Architecture R3F v1.1.0
 *
 * Permet le rollout progressif des optimisations.
 * Modifier ces flags pour activer/désactiver les fonctionnalités.
 */

export interface FeatureFlags {
  // Flag principal - Active toutes les optimisations R3F
  useR3FOptimizations: boolean

  // Flags granulaires (actifs seulement si useR3FOptimizations = true)
  useCameraControls: boolean      // Phase 1: CameraControls de drei
  useEventSystem: boolean         // Phase 2: InteractiveMesh + BVH
  useLODSystem: boolean           // Phase 3: Detailed + LOD
  usePostProcessing: boolean      // Phase 4: EffectComposer
  useSuspenseStrategy: boolean    // Phase 5: Suspense grouping
  usePerformanceMonitor: boolean  // Phase 6: Perf + PerformanceMonitor
}

/**
 * Configuration par défaut des feature flags.
 *
 * Phase 0: Tous désactivés (rollback safe)
 * Phase 1+: Activer progressivement selon le plan
 */
const defaultFlags: FeatureFlags = {
  // Master switch - Mettre à true pour activer les optimisations
  useR3FOptimizations: true,

  // Optimisations individuelles
  useCameraControls: true,      // Phase 1 - Premier à activer
  useEventSystem: true,         // Phase 2 - Impact majeur (-40% CPU)
  useLODSystem: true,           // Phase 3 - LOD automatique
  usePostProcessing: true,      // Phase 4 - Outline natif
  useSuspenseStrategy: true,    // Phase 5 - Chargement optimisé
  usePerformanceMonitor: false, // Phase 6 - Debug only
}

/**
 * Récupère les feature flags depuis localStorage ou utilise les valeurs par défaut.
 */
function getStoredFlags(): Partial<FeatureFlags> {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem('r3f-feature-flags')
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

/**
 * Feature flags actifs (merged avec localStorage pour override en dev).
 */
export const featureFlags: FeatureFlags = {
  ...defaultFlags,
  ...getStoredFlags(),
}

/**
 * Vérifie si une fonctionnalité est activée.
 * Respecte le master switch useR3FOptimizations.
 */
export function isFeatureEnabled(flag: keyof Omit<FeatureFlags, 'useR3FOptimizations'>): boolean {
  if (!featureFlags.useR3FOptimizations) return false
  return featureFlags[flag]
}

/**
 * Active/désactive un feature flag (dev only).
 * Persiste dans localStorage pour les tests.
 */
export function setFeatureFlag(flag: keyof FeatureFlags, value: boolean): void {
  if (import.meta.env.PROD) {
    console.warn('[FeatureFlags] Cannot modify flags in production')
    return
  }

  const stored = getStoredFlags()
  stored[flag] = value
  localStorage.setItem('r3f-feature-flags', JSON.stringify(stored))

  // Force refresh pour appliquer le changement
  console.info(`[FeatureFlags] ${flag} = ${value}. Refresh to apply.`)
}

/**
 * Reset tous les feature flags aux valeurs par défaut.
 */
export function resetFeatureFlags(): void {
  localStorage.removeItem('r3f-feature-flags')
  console.info('[FeatureFlags] Reset to defaults. Refresh to apply.')
}

/**
 * Log l'état actuel des feature flags (dev only).
 */
export function logFeatureFlags(): void {
  if (import.meta.env.DEV) {
    console.group('[FeatureFlags] Current state')
    console.table(featureFlags)
    console.groupEnd()
  }
}

// Log automatique en dev
if (import.meta.env.DEV) {
  logFeatureFlags()
}
