/**
 * LODMesh - Composant pour Level of Detail automatique.
 *
 * Architecture R3F v1.1.0 - Phase 3
 *
 * Utilise le composant Detailed de @react-three/drei pour gérer
 * automatiquement le niveau de détail selon la distance à la caméra.
 *
 * Avantages:
 * - Réduction des draw calls à distance
 * - Amélioration du GPU (-30% selon les tests)
 * - API déclarative simple
 */

import { type ReactNode, useMemo } from 'react'
import { Detailed } from '@react-three/drei'
import { isFeatureEnabled } from '@config/featureFlags'

/**
 * Configuration des niveaux de détail.
 */
export interface LODLevel {
  /** Distance à laquelle ce niveau devient actif */
  distance: number
  /** Contenu à afficher à ce niveau */
  children: ReactNode
}

/**
 * Props du LODMesh.
 */
export interface LODMeshProps {
  /** Niveaux de détail (du plus détaillé au moins détaillé) */
  levels: LODLevel[]
  /** Position du groupe LOD */
  position?: [number, number, number]
  /** Rotation du groupe LOD */
  rotation?: [number, number, number]
  /** Scale du groupe LOD */
  scale?: number | [number, number, number]
  /** Nom pour debug */
  name?: string
}

/**
 * LODMesh - Wrapper pour Level of Detail automatique.
 *
 * Usage:
 * ```tsx
 * <LODMesh
 *   levels={[
 *     { distance: 0, children: <HighDetailModel /> },
 *     { distance: 10, children: <MediumDetailModel /> },
 *     { distance: 25, children: <LowDetailModel /> },
 *   ]}
 * />
 * ```
 *
 * Le composant affichera automatiquement le niveau approprié
 * selon la distance de la caméra.
 */
export function LODMesh({
  levels,
  position,
  rotation,
  scale,
  name,
}: LODMeshProps) {
  // Vérifier le feature flag
  const useLOD = isFeatureEnabled('useLODSystem')

  // Extraire les distances pour Detailed
  const distances = useMemo(
    () => levels.map((level) => level.distance),
    [levels]
  )

  // Si LOD désactivé, afficher uniquement le premier niveau (haute qualité)
  if (!useLOD) {
    const highDetail = levels[0]
    if (!highDetail) return null

    return (
      <group name={name} position={position} rotation={rotation} scale={scale}>
        {highDetail.children}
      </group>
    )
  }

  return (
    <Detailed distances={distances}>
      {levels.map((level, index) => (
        <group
          key={index}
          name={name ? `${name}-lod-${index}` : undefined}
          position={position}
          rotation={rotation}
          scale={scale}
        >
          {level.children}
        </group>
      ))}
    </Detailed>
  )
}

/**
 * Presets de distances LOD courantes.
 */
export const LOD_PRESETS = {
  /** Pour objets petits/détaillés (icônes, boutons) */
  small: [0, 5, 15],
  /** Pour objets moyens (meubles, écrans) */
  medium: [0, 10, 25],
  /** Pour objets grands (pièces, structures) */
  large: [0, 20, 50],
  /** Pour la scène Pierre (distances adaptées) */
  pierre: [0, 15, 35],
} as const

export default LODMesh
