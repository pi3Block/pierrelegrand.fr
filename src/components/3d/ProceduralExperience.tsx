/**
 * ProceduralExperience - Expérience 3D avec monde procédural
 *
 * Nouvelle scène principale intégrant :
 * - Terrain procédural avec chunks et Web Workers
 * - Système de biomes avec transitions shader
 * - Végétation distribuée par Poisson Disc
 * - LOD et optimisations de performance
 */

import { Environment, KeyboardControls, Sky, Stars } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Suspense, useState } from 'react'
import { useGameStore } from '@stores/gameStore'
import { DebugPanel } from '@components/ui/DebugOverlay'
import { Player } from './Player'
import { ProceduralWorld } from './ProceduralWorld'
import { ShootingSystem } from './ShootingSystem'

// Keyboard mapping pour Ecctrl
const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
]

// Configuration du monde procédural
const WORLD_SEED = 42
const USE_CHUNKS = false // Désactiver les chunks pour commencer (performance)

interface ProceduralExperienceProps {
  debug?: boolean
  seed?: number
  useChunks?: boolean
}

export function ProceduralExperience({
  debug: debugProp,
  seed = WORLD_SEED,
  useChunks = USE_CHUNKS,
}: ProceduralExperienceProps) {
  const hasDebug = useGameStore((s) => s.hasFeature('debug_mode'))
  const debug = debugProp ?? hasDebug
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night'>('sunset')

  return (
    <KeyboardControls map={keyboardMap}>
      {/* Lighting selon l'heure */}
      <SceneLighting timeOfDay={timeOfDay} />

      {/* Environnement */}
      <SceneEnvironment timeOfDay={timeOfDay} />

      {/* Physics World */}
      <Physics gravity={[0, -20, 0]} debug={debug}>
        <Suspense fallback={<LoadingFallback />}>
          {/* Player */}
          <Player position={[0, 3, 8]} />

          {/* Monde procédural */}
          <ProceduralWorld
            debug={debug}
            seed={seed}
            useChunks={useChunks}
          />

          {/* Système de tir */}
          <ShootingSystem />
        </Suspense>
      </Physics>

      {/* UI de contrôle du temps (debug) */}
      {debug && (
        <TimeOfDayControls
          current={timeOfDay}
          onChange={setTimeOfDay}
        />
      )}

      {/* Debug Panel */}
      {debug && <DebugPanel />}
    </KeyboardControls>
  )
}

/**
 * Éclairage de la scène selon l'heure
 */
function SceneLighting({ timeOfDay }: { timeOfDay: 'day' | 'sunset' | 'night' }) {
  const configs = {
    day: {
      ambient: 0.6,
      directional: 1.8,
      directionalPos: [30, 50, 20] as [number, number, number],
      directionalColor: '#ffffff',
      pointColor: '#87ceeb',
    },
    sunset: {
      ambient: 0.4,
      directional: 1.2,
      directionalPos: [50, 15, 30] as [number, number, number],
      directionalColor: '#ff7b54',
      pointColor: '#ffa07a',
    },
    night: {
      ambient: 0.15,
      directional: 0.3,
      directionalPos: [10, 30, 10] as [number, number, number],
      directionalColor: '#6b7db3',
      pointColor: '#4b5563',
    },
  }

  const config = configs[timeOfDay]

  return (
    <>
      {/* Lumière ambiante */}
      <ambientLight intensity={config.ambient} />

      {/* Soleil/Lune */}
      <directionalLight
        position={config.directionalPos}
        intensity={config.directional}
        color={config.directionalColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={150}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0001}
      />

      {/* Lumière d'ambiance colorée */}
      <pointLight
        position={[-20, 15, -20]}
        intensity={0.3}
        color={config.pointColor}
        distance={50}
      />

      {/* Lumière de fill */}
      <hemisphereLight
        color={timeOfDay === 'night' ? '#1e3a5f' : '#87ceeb'}
        groundColor={timeOfDay === 'night' ? '#0f172a' : '#3d5a3d'}
        intensity={timeOfDay === 'night' ? 0.2 : 0.4}
      />
    </>
  )
}

/**
 * Environnement de la scène (ciel, étoiles, fog)
 */
function SceneEnvironment({ timeOfDay }: { timeOfDay: 'day' | 'sunset' | 'night' }) {
  return (
    <>
      {/* Ciel */}
      {timeOfDay !== 'night' && (
        <Sky
          distance={450000}
          sunPosition={
            timeOfDay === 'day'
              ? [100, 50, 100]
              : [200, 5, 100]
          }
          inclination={timeOfDay === 'day' ? 0.6 : 0.505}
          azimuth={0.25}
          turbidity={timeOfDay === 'sunset' ? 10 : 2}
          rayleigh={timeOfDay === 'sunset' ? 3 : 1}
        />
      )}

      {/* Étoiles la nuit */}
      {timeOfDay === 'night' && (
        <>
          <Stars
            radius={200}
            depth={100}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={0.5}
          />
          <color attach="background" args={['#0a0a1a']} />
        </>
      )}

      {/* HDRI pour les reflets */}
      <Environment
        preset={timeOfDay === 'night' ? 'night' : timeOfDay === 'sunset' ? 'sunset' : 'park'}
        background={false}
      />

      {/* Fog */}
      <fog
        attach="fog"
        args={[
          timeOfDay === 'night' ? '#0a0a1a' : timeOfDay === 'sunset' ? '#ff9966' : '#e0e7ff',
          50,
          200,
        ]}
      />
    </>
  )
}

/**
 * Fallback de chargement
 */
function LoadingFallback() {
  return (
    <mesh position={[0, 1, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#6366f1" wireframe />
    </mesh>
  )
}

/**
 * Contrôles de l'heure (debug)
 */
function TimeOfDayControls({
  current,
  onChange,
}: {
  current: 'day' | 'sunset' | 'night'
  onChange: (time: 'day' | 'sunset' | 'night') => void
}) {
  // Les contrôles HTML sont gérés via drei Html ou un overlay externe
  // Ici on utilise des objets 3D cliquables

  const times: Array<'day' | 'sunset' | 'night'> = ['day', 'sunset', 'night']
  const colors = {
    day: '#fbbf24',
    sunset: '#f97316',
    night: '#6366f1',
  }

  return (
    <group position={[0, 15, -40]}>
      {times.map((time, i) => (
        <mesh
          key={time}
          position={[(i - 1) * 3, 0, 0]}
          onClick={() => onChange(time)}
        >
          <sphereGeometry args={[current === time ? 1.2 : 0.8, 16, 16]} />
          <meshStandardMaterial
            color={colors[time]}
            emissive={colors[time]}
            emissiveIntensity={current === time ? 0.8 : 0.3}
          />
        </mesh>
      ))}
    </group>
  )
}

export default ProceduralExperience
