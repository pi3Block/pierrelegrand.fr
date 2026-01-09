/**
 * GalleryFPSApp - Galerie FPS immersive utilisant RenderTexture de drei.
 *
 * Rend une scène 3D complète dans une texture appliquée sur l'écran du moniteur.
 * Solution native drei - un seul contexte WebGL, performances optimales.
 *
 * @see https://drei.docs.pmnd.rs/portals/render-texture
 */

import { Suspense, useEffect } from 'react'
import { RenderTexture, PerspectiveCamera } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { GalleryFPSScene } from './GalleryFPSScene'
import { usePierreStore } from '../../stores/pierreStore'
import { useGalleryFPSStore } from './stores/galleryFPSStore'

// Dimensions du moniteur en unités Three.js
const MONITOR_SIZE_X = 1.4
const MONITOR_SIZE_Y = 0.78

// Résolution de la RenderTexture (16:9)
const TEXTURE_WIDTH = 1024
const TEXTURE_HEIGHT = 576

interface GalleryFPSAppProps {
  onNavigateToHub: () => void
  responsiveConfig: {
    pixelSize: number
    uiScale: number
    windowWidth: number
    windowHeight: number
  }
}

/**
 * Composant principal de la galerie FPS avec RenderTexture.
 *
 * La RenderTexture rend une scène 3D complète (avec sa propre caméra)
 * dans une texture qui est appliquée sur le mesh de l'écran.
 */
export function GalleryFPSApp({ onNavigateToHub: _onNavigateToHub, responsiveConfig: _responsiveConfig }: GalleryFPSAppProps) {
  void _onNavigateToHub
  void _responsiveConfig

  const currentStage = usePierreStore((s) => s.currentStage)
  const setCurrentStage = usePierreStore((s) => s.setCurrentStage)
  const isActive = currentStage === 'rightMonitor'

  // Detection mobile depuis le store
  const isMobile = useGalleryFPSStore((s) => s.isMobile)
  const setIsMobile = useGalleryFPSStore((s) => s.setIsMobile)

  // Detecter si on est sur un appareil tactile
  useEffect(() => {
    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0
    setIsMobile(isTouchDevice)
  }, [setIsMobile])

  // Callback pour quitter la galerie et retourner au mode default
  const handleExit = () => {
    setCurrentStage('default')
  }

  return (
    <mesh>
      <planeGeometry args={[MONITOR_SIZE_X, MONITOR_SIZE_Y]} />
      <meshBasicMaterial toneMapped={false}>
        <RenderTexture
          attach="map"
          width={TEXTURE_WIDTH}
          height={TEXTURE_HEIGHT}
          // Rendre uniquement quand le moniteur est actif ou visible
          // DEBUG: Toujours rendre pour tester
          frames={Infinity}
        >
          {/* Caméra interne à la RenderTexture */}
          <PerspectiveCamera
            makeDefault
            fov={60}
            near={0.1}
            far={100}
            position={[0, 1.6, 3]}
          />

          {/* Couleur de fond */}
          <color attach="background" args={['#1a1a2e']} />

          {/* Scène de la galerie */}
          <Suspense fallback={<GalleryLoadingScene />}>
            <Physics gravity={[0, -20, 0]} timeStep="vary" paused={!isActive}>
              <GalleryFPSScene isActive={isActive} onExit={handleExit} isMobile={isMobile} />
            </Physics>
          </Suspense>
        </RenderTexture>
      </meshBasicMaterial>
    </mesh>
  )
}

/**
 * Scène de chargement simple (pendant le Suspense).
 */
function GalleryLoadingScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      {/* Cube animé de chargement */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#4ecdc4" />
      </mesh>
      {/* Texte "Loading" via un plan avec texture */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[2, 0.5]} />
        <meshBasicMaterial color="#1a1a2e" transparent opacity={0} />
      </mesh>
    </>
  )
}

export default GalleryFPSApp
