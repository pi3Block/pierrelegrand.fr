import { Environment, Grid, KeyboardControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Suspense } from 'react'
import { useGameStore } from '@stores/gameStore'
import { DebugPanel } from '@components/ui/DebugOverlay'
import { Player } from './Player'
import { World } from './World'
import { World2 } from './World2'
import { ShootingSystem } from './ShootingSystem'

// Ajout de la touche action1 pour le tir via Ecctrl

// Keyboard mapping pour Ecctrl
const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
]

export function Experience() {
  const hasDebug = useGameStore((s) => s.hasFeature('debug_mode'))
  const currentLevel = useGameStore((s) => s.currentLevel)

  return (
    <KeyboardControls map={keyboardMap}>
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

      {/* Environment */}
      <Environment preset="night" />

      {/* Ground Grid (visual only) */}
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

      {/* Physics World */}
      <Physics gravity={[0, -20, 0]} debug={hasDebug}>
        <Suspense fallback={null}>
          {/* Player with Ecctrl */}
          <Player position={[0, 3, 0]} />

          {/* World (platforms, decorations, portals) */}
          {currentLevel === 1 ? <World /> : <World2 />}

          {/* Shooting System - Clic gauche ou touche F pour tirer */}
          <ShootingSystem />
        </Suspense>
      </Physics>

      {/* Debug Panel (inside Canvas) */}
      {hasDebug && <DebugPanel />}
    </KeyboardControls>
  )
}
