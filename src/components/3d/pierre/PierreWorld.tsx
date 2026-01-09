/**
 * PierreWorld - Conteneur principal des éléments du bureau 3D.
 *
 * Gère le chargement et l'affichage de tous les éléments:
 * - BakedRoom (pièce avec textures baked)
 * - Éléments interactifs (Rubik, Whiteboard, Arcade, Monitors)
 * - Effets visuels (Skybox, CoffeeSteam, Carpet, Confetti)
 *
 * Modes de jeu:
 * - Rubik's Cube: Cache la scène, affiche fond bleu
 * - Ping-Pong: Garde la scène visible mais désactive les interactions
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
import { PingPongPaddle } from './elements/PingPongPaddle'
import { PingPongApp } from './apps/pingpong'
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
   * shrinkScene/expandScene - Cache ou affiche la scène quand on joue au Rubik ou Ping-Pong.
   */
  useEffect(() => {
    if (!sceneGroupRef.current) return

    const isRubikMode = currentStage === 'rubikGroup'
    const isPingPongMode = currentStage === 'pingpong'
    const shouldHideScene = isRubikMode || isPingPongMode

    if (shouldHideScene && !isSceneShrunk.current) {
      isSceneShrunk.current = true
      if (isRubikMode) {
        // Rubik: attendre que l'animation du cube soit terminée (1s) avant de cacher
        const timeout = setTimeout(() => {
          if (sceneGroupRef.current) {
            sceneGroupRef.current.visible = false
          }
        }, 1000)
        return () => clearTimeout(timeout)
      } else {
        // Ping-pong: cacher immédiatement
        sceneGroupRef.current.visible = false
      }
    } else if (!shouldHideScene && isSceneShrunk.current) {
      // Réafficher la scène instantanément AVANT le retour
      isSceneShrunk.current = false
      sceneGroupRef.current.visible = true
    }
  }, [currentStage])

  // Désactiver les interactions en mode pingpong ou rubik
  const isPingPongMode = currentStage === 'pingpong'
  const isRubikMode = currentStage === 'rubikGroup'
  const interactionsDisabled = isPingPongMode || isRubikMode

  // Callbacks noop quand les interactions sont désactivées
  const safeOnHover = interactionsDisabled ? () => {} : onHover
  const safeOnSelect = interactionsDisabled ? () => {} : onSelect

  return (
    <BakedMaterialProvider>
      <group name="pierre-world">
        {/* Groupe de la scène (tout sauf le Rubik) - sera caché en mode Rubik */}
        <group ref={sceneGroupRef} name="scene-group">
          {/* Pièce avec textures baked */}
          <Suspense fallback={<LoadingPlaceholder text="Chargement de la pièce..." />}>
            <BakedRoom onHover={safeOnHover} onSelect={safeOnSelect} />
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
            <Whiteboard onHover={safeOnHover} onSelect={safeOnSelect} />
          </Suspense>

          {/* Machine arcade avec jeu */}
          <Suspense fallback={null}>
            <ArcadeScreen onHover={safeOnHover} onSelect={safeOnSelect} />
          </Suspense>

          {/* Moniteur gauche - PierreOS (uikit) */}
          <Suspense fallback={null}>
            <MonitorScreenUikit
              type="left"
              onHover={safeOnHover}
              onSelect={safeOnSelect}
            />
          </Suspense>

          {/* Moniteur droit - Art Gallery (uikit) */}
          <Suspense fallback={null}>
            <MonitorScreenUikit
              type="right"
              onHover={safeOnHover}
              onSelect={safeOnSelect}
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

        {/* Fond pour le mode Ping-Pong */}
        {currentStage === 'pingpong' && (
          <mesh position={[-8, 8, 8]} renderOrder={-1}>
            <sphereGeometry args={[50, 32, 32]} />
            <meshBasicMaterial color={0x1a1a2e} side={THREE.BackSide} />
          </mesh>
        )}

        {/* Rubik's Cube interactif - EN DEHORS du groupe scène pour rester visible */}
        <Suspense fallback={null}>
          <RubiksCube onHover={safeOnHover} onSelect={safeOnSelect} />
        </Suspense>

{/* Raquette de Ping-Pong - EN DEHORS du groupe scène pour rester visible */}
        <Suspense fallback={null}>
          <PingPongPaddle onHover={safeOnHover} onSelect={safeOnSelect} />
        </Suspense>

        {/* Jeu Ping-Pong avec physique Rapier */}
        <PingPongApp isActive={currentStage === 'pingpong'} />

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

