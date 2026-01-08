/**
 * PierreWorld - Conteneur principal des éléments du bureau 3D.
 *
 * Gère le chargement et l'affichage de tous les éléments:
 * - BakedRoom (pièce avec textures baked)
 * - Éléments interactifs (Rubik, Whiteboard, Arcade, Monitors)
 * - Effets visuels (Skybox, CoffeeSteam, Carpet, Confetti)
 *
 * Quand le Rubik's Cube est actif, tous les autres éléments sont cachés
 * (shrinkScene comme dans le portfolio Joan).
 */

import { Suspense, useRef, useEffect } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { BakedMaterialProvider } from './contexts/BakedMaterialContext'
import { BakedRoom } from './elements/BakedRoom'
import { Skybox } from './elements/Skybox'
import { CoffeeSteam } from './elements/CoffeeSteam'
import { Carpet } from './elements/Carpet'
import { RubiksCube } from './elements/RubiksCube'
import { Whiteboard } from './elements/Whiteboard'
import { ArcadeScreen } from './elements/ArcadeScreen'
import { MonitorScreenUikit } from './elements/MonitorScreenUikit'
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
  const currentStage = usePierreStore((s) => s.currentStage)

  // Ref pour le groupe de la scène (tout sauf le Rubik)
  const sceneGroupRef = useRef<THREE.Group>(null)
  // Track si la scène est actuellement shrink
  const isSceneShrunk = useRef(false)

  /**
   * shrinkScene/expandScene - Cache ou affiche la scène quand on joue au Rubik.
   * Le hide est retardé pour laisser le cube arriver au centre (1s d'animation).
   */
  useEffect(() => {
    if (!sceneGroupRef.current) return

    const isRubikMode = currentStage === 'rubikGroup'

    if (isRubikMode && !isSceneShrunk.current) {
      // Attendre que l'animation du cube soit terminée (1s) avant de cacher la scène
      isSceneShrunk.current = true
      const timeout = setTimeout(() => {
        if (sceneGroupRef.current) {
          sceneGroupRef.current.visible = false
        }
      }, 1000)
      return () => clearTimeout(timeout)
    } else if (!isRubikMode && isSceneShrunk.current) {
      // Réafficher la scène instantanément AVANT le retour du cube
      isSceneShrunk.current = false
      sceneGroupRef.current.visible = true
    }
  }, [currentStage])

  return (
    <BakedMaterialProvider>
      <group name="pierre-world">
        {/* Groupe de la scène (tout sauf le Rubik) - sera caché en mode Rubik */}
        <group ref={sceneGroupRef} name="scene-group">
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

          {/* Tableau blanc de dessin */}
          <Suspense fallback={null}>
            <Whiteboard onHover={onHover} onSelect={onSelect} />
          </Suspense>

          {/* Machine arcade avec jeu */}
          <Suspense fallback={null}>
            <ArcadeScreen onHover={onHover} onSelect={onSelect} />
          </Suspense>

          {/* Moniteur gauche - JoanOS (uikit) */}
          <Suspense fallback={null}>
            <MonitorScreenUikit
              type="left"
              onHover={onHover}
              onSelect={onSelect}
            />
          </Suspense>

          {/* Moniteur droit - Art Gallery (uikit) */}
          <Suspense fallback={null}>
            <MonitorScreenUikit
              type="right"
              onHover={onHover}
              onSelect={onSelect}
            />
          </Suspense>
        </group>

        {/* Fond bleu pour le mode Rubik (centré sur la position du cube) */}
        {currentStage === 'rubikGroup' && (
          <mesh position={[-16, 12.5, 16]} renderOrder={-1}>
            <sphereGeometry args={[30, 32, 32]} />
            <meshBasicMaterial color={0x072446} side={THREE.BackSide} />
          </mesh>
        )}

        {/* Rubik's Cube interactif - EN DEHORS du groupe scène pour rester visible */}
        <Suspense fallback={null}>
          <RubiksCube onHover={onHover} onSelect={onSelect} />
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

