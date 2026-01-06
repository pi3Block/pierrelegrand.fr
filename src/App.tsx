import { Suspense } from 'react'
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

export default function App() {
  const unlockedFeatures = useGameStore((s) => s.unlockedFeatures)
  const isVideo3DPlaying = useUIStore((s) => s.isVideo3DPlaying)
  const { isOpen, setIsOpen, isLoading, error, success, submitCode } = useCheatCode()
  const { isLocked, requestLock } = usePointerLock()

  const showDebug = unlockedFeatures.includes('debug_mode')
  
  // Ne pas afficher l'overlay si une vidéo 3D est en lecture
  const showPointerLockOverlay = !isLocked && !isVideo3DPlaying

  return (
    <>
      {/* 3D Canvas */}
      <div className="canvas-container">
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
      </div>

      {/* Loading Screen */}
      <LoadingScreen />

      {/* Crosshair - Visible uniquement quand pointer locké */}
      {isLocked && <Crosshair />}

      {/* Overlay "Cliquez pour jouer" - masqué si vidéo 3D en lecture */}
      {showPointerLockOverlay && (
        <div className="pointer-lock-overlay" onClick={requestLock}>
          <div className="pointer-lock-message">
            <h2>Cliquez pour jouer</h2>
            <p>Echap ou Entrée pour libérer le curseur</p>
          </div>
        </div>
      )}

      {/* UI Overlay */}
      <div className="ui-overlay">
        <BiomeIndicator />

        {showDebug && <DebugOverlay />}

        {isLocked && (
          <div className="hint-text">
            Appuyez sur ` pour ouvrir le terminal
          </div>
        )}
      </div>

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
