/**
 * PierreWorld - Conteneur principal des éléments du bureau 3D.
 * 
 * Gère le chargement et l'affichage de tous les éléments:
 * - BakedRoom (pièce avec textures baked)
 * - Éléments interactifs (Rubik, Whiteboard, Arcade, Monitors)
 * - Effets visuels (Skybox, CoffeeSteam, Carpet, Confetti)
 * - HubPortal (portail vers le Hub)
 */

import { Suspense } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { BakedMaterialProvider } from './contexts/BakedMaterialContext'
import { BakedRoom } from './elements/BakedRoom'
import { HubPortal } from './elements/HubPortal'
import { Skybox } from './elements/Skybox'
import { CoffeeSteam } from './elements/CoffeeSteam'
import { Carpet } from './elements/Carpet'
import { RubiksCube } from './elements/RubiksCube'
import { Whiteboard } from './elements/Whiteboard'
import { ArcadeScreen } from './elements/ArcadeScreen'
import { MonitorScreen } from './elements/MonitorScreen'
import { Confetti } from './elements/Confetti'
import { TopChair } from './elements/TopChair'
import { type PierreStage, usePierreStore } from './stores/pierreStore'

interface PierreWorldProps {
  /** Callback quand un objet est survolé (pour OutlinePass) */
  onHover: (objects: THREE.Object3D[]) => void
  /** Callback quand une zone est sélectionnée */
  onSelect: (stage: PierreStage) => void
}

/**
 * Monde Pierre - Bureau 3D interactif.
 */
export function PierreWorld({ onHover, onSelect }: PierreWorldProps) {
  const rubikSolved = usePierreStore((s) => s.rubikSolved)

  return (
    <BakedMaterialProvider>
      <group name="pierre-world">
        {/* Pièce avec textures baked */}
        <Suspense fallback={<LoadingPlaceholder text="Chargement de la pièce..." />}>
          <BakedRoom onHover={onHover} onSelect={onSelect} />
        </Suspense>

        {/* Ciel stylisé */}
        <Suspense fallback={null}>
          <Skybox />
        </Suspense>

        {/* Vapeur de café */}
        <Suspense fallback={null}>
          <CoffeeSteam />
        </Suspense>

        {/* Tapis avec effet poil (optimisé: 12 couches au lieu de 32) */}
        <Suspense fallback={null}>
          <Carpet />
        </Suspense>

        {/* Chaise de bureau animée */}
        <Suspense fallback={null}>
          <TopChair />
        </Suspense>

        {/* Rubik's Cube interactif */}
        <Suspense fallback={null}>
          <RubiksCube onHover={onHover} onSelect={onSelect} />
        </Suspense>

        {/* Tableau blanc de dessin */}
        <Suspense fallback={null}>
          <Whiteboard onHover={onHover} onSelect={onSelect} />
        </Suspense>

        {/* Machine arcade avec jeu */}
        <Suspense fallback={null}>
          <ArcadeScreen onHover={onHover} onSelect={onSelect} />
        </Suspense>

        {/* Moniteur gauche - About Me */}
        <Suspense fallback={null}>
          <MonitorScreen
            type="left"
            onHover={onHover}
            onSelect={onSelect}
          />
        </Suspense>

        {/* Moniteur droit - Projets */}
        <Suspense fallback={null}>
          <MonitorScreen
            type="right"
            onHover={onHover}
            onSelect={onSelect}
          />
        </Suspense>

        {/* Portail vers le Hub 3D */}
        <Suspense fallback={null}>
          <HubPortal onHover={onHover} onSelect={onSelect} />
        </Suspense>

        {/* Confetti quand le Rubik's cube est résolu */}
        {rubikSolved && (
          <Suspense fallback={null}>
            <Confetti />
          </Suspense>
        )}
      </group>
    </BakedMaterialProvider>
  )
}

/**
 * Placeholder de chargement.
 */
function LoadingPlaceholder({ text }: { text: string }) {
  return (
    <Html center>
      <div style={{
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px 20px',
        borderRadius: '8px',
        fontSize: '14px',
      }}>
        {text}
      </div>
    </Html>
  )
}

export default PierreWorld

