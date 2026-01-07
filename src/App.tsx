import { Suspense, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import { Preload } from '@react-three/drei'
import { Experience } from '@components/3d/Experience'
import { LoadingScreen } from '@components/ui/LoadingScreen'
import { CheatCodeTerminal } from '@components/ui/CheatCodeTerminal'
import { DebugOverlay } from '@components/ui/DebugOverlay'
import { BiomeIndicator } from '@components/ui/BiomeIndicator'
import { Crosshair } from '@components/ui/Crosshair'
import { useGameStore } from '@stores/gameStore'
import { useUIStore } from '@stores/uiStore'
import { useCheatCode } from '@hooks/useCheatCode'
import { usePointerLock } from '@hooks/usePointerLock'

// Lazy load PierreExperience (a son propre Canvas)
const PierreExperience = lazy(() => import('@components/3d/pierre/PierreExperience'))

export default function App() {
  const unlockedFeatures = useGameStore((s) => s.unlockedFeatures)
  const currentLevel = useGameStore((s) => s.currentLevel)
  const isVideo3DPlaying = useUIStore((s) => s.isVideo3DPlaying)
  const { isOpen, setIsOpen, isLoading, error, success, submitCode } = useCheatCode()
  const { isLocked, requestLock } = usePointerLock()

  const showDebug = unlockedFeatures.includes('debug_mode')

  // Ne pas afficher l'overlay si une vidéo 3D est en lecture
  const showPointerLockOverlay = !isLocked && !isVideo3DPlaying

  // PierreExperience (Level 5) a son propre Canvas avec OrbitControls
  const isPierreLevel = currentLevel === 5

  return (
    <>
      {/* 3D Canvas - conditionnel selon le niveau */}
      <div className="canvas-container">
        {isPierreLevel ? (
          // PierreExperience a son propre Canvas (OrbitControls, pas de pointer lock)
          <Suspense fallback={<div className="loading-fallback">Chargement...</div>}>
            <PierreExperience />
          </Suspense>
        ) : (
          // Canvas principal pour les autres niveaux (FPS avec pointer lock)
          <Canvas
            camera={{ position: [0, 2, 10], fov: 60 }}
            gl={{ antialias: true, alpha: false }}
            dpr={[1, 2]}
          >
            <Suspense fallback={null}>
              <Experience />
              <Preload all />
            </Suspense>
          </Canvas>
        )}
      </div>

      {/* Loading Screen */}
      <LoadingScreen />

      {/* Crosshair - Visible uniquement quand pointer locké (pas sur Pierre) */}
      {isLocked && !isPierreLevel && <Crosshair />}

      {/* Overlay "Cliquez pour jouer" - masqué si vidéo 3D en lecture ou sur Pierre */}
      {showPointerLockOverlay && !isPierreLevel && (
        <div className="pointer-lock-overlay" onClick={requestLock}>
          <div className="pointer-lock-message">
            <h2>Cliquez pour jouer</h2>
            <p>Echap ou Entrée pour libérer le curseur</p>
          </div>
        </div>
      )}

      {/* UI Overlay - masqué sur Pierre (a sa propre UI) */}
      {!isPierreLevel && (
        <div className="ui-overlay">
          <BiomeIndicator />

          {showDebug && <DebugOverlay />}

          {isLocked && (
            <div className="hint-text">
              Appuyez sur ` pour ouvrir le terminal
            </div>
          )}
        </div>
      )}

      {/* Cheat Code Terminal */}
      <CheatCodeTerminal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={submitCode}
        isLoading={isLoading}
        error={error}
        success={success}
      />

    </>
  )
}
