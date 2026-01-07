/**
 * BakedMaterialContext - Contexte pour partager les matériaux baked.
 *
 * Permet aux composants enfants (ArcadeScreen, TopChair, etc.)
 * d'accéder aux matériaux baked chargés par BakedRoom.
 */

import { createContext, useContext, useMemo, useEffect } from 'react'
import { useKTX2 } from '@react-three/drei'
import * as THREE from 'three'

// Textures baked en KTX2
const TEXTURES = {
  baked1: '/pierre/assets/textures/baked1.ktx2',
  baked2: '/pierre/assets/textures/baked2.ktx2',
  baked3: '/pierre/assets/textures/baked3.ktx2',
}

// Chemin vers le transcoder Basis
const BASIS_PATH = '/pierre/basis/'

interface BakedMaterialContextValue {
  material1: THREE.MeshBasicMaterial | null
  material2: THREE.MeshBasicMaterial | null
  material3: THREE.MeshBasicMaterial | null
}

const BakedMaterialContext = createContext<BakedMaterialContextValue>({
  material1: null,
  material2: null,
  material3: null,
})

/**
 * Hook pour accéder aux matériaux baked.
 */
export function useBakedMaterials() {
  return useContext(BakedMaterialContext)
}

/**
 * Provider pour les matériaux baked.
 */
export function BakedMaterialProvider({ children }: { children: React.ReactNode }) {
  // Chargement des textures KTX2
  const texture1 = useKTX2(TEXTURES.baked1, BASIS_PATH)
  const texture2 = useKTX2(TEXTURES.baked2, BASIS_PATH)
  const texture3 = useKTX2(TEXTURES.baked3, BASIS_PATH)

  // Configuration des textures
  useEffect(() => {
    ;[texture1, texture2, texture3].forEach((tex) => {
      if (tex) {
        tex.flipY = false
        tex.colorSpace = THREE.SRGBColorSpace
      }
    })
  }, [texture1, texture2, texture3])

  // Création des matériaux
  const material1 = useMemo(
    () =>
      texture1
        ? new THREE.MeshBasicMaterial({ map: texture1 })
        : null,
    [texture1]
  )

  const material2 = useMemo(
    () =>
      texture2
        ? new THREE.MeshBasicMaterial({ map: texture2 })
        : null,
    [texture2]
  )

  const material3 = useMemo(
    () =>
      texture3
        ? new THREE.MeshBasicMaterial({ map: texture3 })
        : null,
    [texture3]
  )

  const value = useMemo(
    () => ({ material1, material2, material3 }),
    [material1, material2, material3]
  )

  return (
    <BakedMaterialContext.Provider value={value}>
      {children}
    </BakedMaterialContext.Provider>
  )
}

export default BakedMaterialContext
