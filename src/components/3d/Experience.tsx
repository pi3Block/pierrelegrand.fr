/**
 * Experience - Composant principal qui gère le routing entre les différents mondes.
 * Utilise lazy loading pour optimiser les performances.
 *
 * Architecture Canvas unique: Tous les niveaux (0-5) partagent le même Canvas WebGL.
 * Cela évite les problèmes de "Context Lost" lors des transitions.
 */

import { Environment, Grid, KeyboardControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Suspense, lazy, useEffect } from 'react'
import * as THREE from 'three'
import { useGameStore, type Level } from '@stores/gameStore'
import { DebugPanel } from '@components/ui/DebugOverlay'
import { Player } from './Player'
import { ShootingSystem } from './ShootingSystem'

// Lazy loading des mondes pour optimiser le chargement initial
const Hub = lazy(() => import('./Hub'))
const WorldClassic = lazy(() => import('./WorldClassic'))
const WorldPlayground = lazy(() => import('./WorldPlayground'))
const ProceduralExperience = lazy(() => import('./ProceduralExperience'))
const World4 = lazy(() => import('./World4'))
// PierreScene est maintenant intégré dans le Canvas unique (Level 5)
const PierreScene = lazy(() => import('./pierre/PierreScene'))

// Keyboard mapping pour Ecctrl
const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
]

// Configuration des positions de spawn par niveau (pour mondes avec personnage)
const SPAWN_POSITIONS: Record<Level, [number, number, number]> = {
  0: [0, 2, 8],    // Hub - devant le portail central (pas dedans!)
  1: [0, 5, 5],    // WorldClassic - classique
  2: [0, 5, 5],    // WorldPlayground - playground
  3: [0, 5, 0],    // ProceduralWorld
  4: [0, 3, 20],   // World4 - Angry Birds (zone plate centrale)
  5: [0, 0, 0],    // PierreWorld - pas de personnage (OrbitControls)
}

// FOV par défaut pour les niveaux avec personnage (0-4)
const DEFAULT_FOV = 60

/**
 * Composant qui réinitialise la caméra au FOV par défaut.
 * Nécessaire car PierreScene (Level 5) modifie le FOV à 20.
 *
 * Le key sur Physics force le remontage, donc ce composant est remonté
 * à chaque changement de niveau et remet le FOV à 60.
 */
function CameraReset({ level }: { level: Level }) {
  const { camera } = useThree()

  useEffect(() => {
    // Reset le FOV à chaque changement de niveau (level 0-4)
    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== DEFAULT_FOV) {
      camera.fov = DEFAULT_FOV
      camera.updateProjectionMatrix()
    }
  }, [camera, level])

  return null
}

/**
 * Composant principal Experience
 * Architecture Canvas unique: tous les niveaux (0-5) partagent le même Canvas.
 */
export function Experience() {
  const hasDebug = useGameStore((s) => s.hasFeature('debug_mode'))
  const currentLevel = useGameStore((s) => s.currentLevel)

  // Level 5 = PierreScene (OrbitControls, pas de physique, pas de Player)
  const isPierreLevel = currentLevel === 5

  // Le monde procédural a sa propre configuration complète
  if (currentLevel === 3) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ProceduralExperience debug={hasDebug} />
      </Suspense>
    )
  }

  // Level 5: PierreScene avec OrbitControls (pas de physique ni Player)
  if (isPierreLevel) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <PierreScene />
      </Suspense>
    )
  }

  // Levels 0-4: Mondes avec physique et Player FPS
  return (
    <KeyboardControls map={keyboardMap}>
      {/* Reset la caméra au FOV par défaut (60) après avoir quitté Pierre (FOV 20) */}
      <CameraReset level={currentLevel} />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[20, 30, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.3} color="#6366f1" />

      {/* Environment - pas pour Hub et World4 Angry Birds (ont leur propre ciel) */}
      {currentLevel !== 0 && currentLevel !== 4 && <Environment preset="night" />}

      {/* Ground Grid (visual only) - sauf pour Hub et World4 Angry Birds */}
      {currentLevel !== 0 && currentLevel !== 4 && (
        <Grid
          position={[0, 0.01, 0]}
          args={[50, 50]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#222"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#444"
          fadeDistance={50}
          fadeStrength={1}
          infiniteGrid
        />
      )}

      {/* Physics World - key force le remontage lors du changement de niveau */}
      <Physics key={`physics-level-${currentLevel}`} gravity={[0, -20, 0]} debug={hasDebug}>
        <Suspense fallback={<LoadingFallback />}>
          {/* Player with Ecctrl - position adaptée au niveau */}
          <Player position={SPAWN_POSITIONS[currentLevel]} />

          {/* World Router - charge le monde correspondant au niveau */}
          <WorldRouter level={currentLevel} />

          {/* Shooting System - Clic gauche ou touche F pour tirer */}
          <ShootingSystem />
        </Suspense>
      </Physics>

      {/* Debug Panel (inside Canvas) */}
      {hasDebug && <DebugPanel />}
    </KeyboardControls>
  )
}

/**
 * Router pour charger le bon monde selon le niveau
 */
function WorldRouter({ level }: { level: Level }) {
  switch (level) {
    case 0:
      return <Hub />
    case 1:
      return <WorldClassic />
    case 2:
      return <WorldPlayground />
    case 4:
      return <World4 />
    default:
      // Fallback vers le Hub si niveau inconnu
      return <Hub />
  }
}

/**
 * Fallback de chargement (placeholder pendant le lazy loading)
 */
function LoadingFallback() {
  return (
    <mesh position={[0, 2, 0]}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.5} />
    </mesh>
  )
}
