/**
 * PierreExperience - Scène principale du portfolio bureau 3D.
 *
 * Caractéristiques:
 * - Navigation OrbitControls (pas de personnage)
 * - Post-processing: OutlinePass pour le survol, SMAA
 * - Transitions caméra GSAP vers les zones interactives
 * - Bandeau de navigation supérieur
 * - CSS3DRenderer pour les iframes (comme Joan)
 */

import { Suspense, useRef, useState, useCallback, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, Preload } from '@react-three/drei'
import { EffectComposer, Outline, SMAA } from '@react-three/postprocessing'
import * as THREE from 'three'
import gsap from 'gsap'
import { usePierreStore, type PierreStage } from './stores/pierreStore'
import { PierreWorld } from './PierreWorld'
import { PierreBanner } from './ui/PierreBanner'
import { useGameStore } from '@stores/gameStore'
import { useCSS3DScreens } from './hooks/useCSS3DScreens'

/**
 * Composant qui force le cleanup du WebGL renderer au démontage.
 * Cela évite les "Context Lost" lors des transitions entre Canvas.
 */
function WebGLCleanup() {
  const { gl, scene } = useThree()

  useEffect(() => {
    return () => {
      // Dispose de toutes les textures, géométries et matériaux de la scène
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose()
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose())
          } else {
            object.material?.dispose()
          }
        }
      })

      // Force le dispose du renderer
      gl.dispose()
      gl.forceContextLoss()
    }
  }, [gl, scene])

  return null
}

// Configuration de la caméra et des positions
const CAMERA_CONFIG = {
  fov: 20,
  near: 0.1,
  far: 1000,
  initialPosition: new THREE.Vector3(-23, 17, 23),
  initialTarget: new THREE.Vector3(0, 2.5, 0),
}

// Configuration des OrbitControls
const ORBIT_CONFIG = {
  enableDamping: true,
  dampingFactor: 0.05,
  rotateSpeed: 0.4,
  zoomSpeed: 1,
  minDistance: 2,
  maxDistance: 35,
  minPolarAngle: Math.PI / 6,
  maxPolarAngle: Math.PI / 2,
  minAzimuthAngle: -Math.PI / 2,
  maxAzimuthAngle: Math.PI * 2,
}

// Positions des zones interactives (caméra) - extraites de Joan's constants.js
const STAGE_POSITIONS: Record<
  PierreStage,
  {
    position: THREE.Vector3
    target: THREE.Vector3
  }
> = {
  default: {
    position: new THREE.Vector3(-23, 17, 23),
    target: new THREE.Vector3(0, 2.5, 0),
  },
  arcadeMachine: {
    position: new THREE.Vector3(-4.5, 5.5, 2.3009), // Plus loin pour moins de zoom
    target: new THREE.Vector3(3.25776, 2.74209, 2.3009),
  },
  leftMonitor: {
    position: new THREE.Vector3(1.06738, 2.60725, -1.6),
    target: new THREE.Vector3(1.06738, 2.50725, -4.23009),
  },
  rightMonitor: {
    position: new THREE.Vector3(2.13997, 2.60716, -1.53751),
    target: new THREE.Vector3(2.47898, 2.50716, -4.14566),
  },
  whiteboard: {
    position: new THREE.Vector3(-3.3927, 5.18774, 4.61366),
    target: new THREE.Vector3(-3.3927, 3.18774, -4.61366),
  },
  rubikGroup: {
    // Position de caméra pour bien voir le cube (approche simplifiée vs Joan qui déplace le cube)
    position: new THREE.Vector3(-2.5, 2.5, -2),
    target: new THREE.Vector3(-0.67868, 1.499, -3.92849),
  },
  hubPortal: {
    position: new THREE.Vector3(-23, 17, 23),
    target: new THREE.Vector3(0, 2.5, 0),
  },
  hub: {
    position: new THREE.Vector3(-23, 17, 23),
    target: new THREE.Vector3(0, 2.5, 0),
  },
}

// Store global pour exposer flyToStage en dehors du Canvas
let globalFlyToStage: ((stage: PierreStage) => void) | null = null

/**
 * Composant principal de la scène Pierre.
 * Inclut le Canvas 3D, le bandeau de navigation HTML, et les CSS3DRenderer pour les iframes.
 */
export default function PierreExperience() {
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel)
  const [, setFlyToStageReady] = useState(false)
  const css3dContainerRef = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<THREE.Camera | null>(null)
  const currentStage = usePierreStore((s) => s.currentStage)

  // CSS3D Screens pour les iframes (comme Joan)
  useCSS3DScreens({
    containerRef: css3dContainerRef,
    cameraRef: cameraRef,
    currentStage,
  })

  // Navigation depuis le bandeau
  const handleNavigate = useCallback((stage: PierreStage) => {
    if (globalFlyToStage) {
      globalFlyToStage(stage)
    }
  }, [])

  // Retour au Hub (Level 0)
  const handleBackToHub = useCallback(() => {
    setCurrentLevel(0)
  }, [setCurrentLevel])

  // Attendre que flyToStage soit prêt
  useEffect(() => {
    const checkReady = setInterval(() => {
      if (globalFlyToStage) {
        setFlyToStageReady(true)
        clearInterval(checkReady)
      }
    }, 100)
    return () => clearInterval(checkReady)
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Bandeau de navigation (HTML, en dehors du Canvas) */}
      <PierreBanner onNavigate={handleNavigate} onBackToHub={handleBackToHub} />

      {/* Container pour les CSS3DRenderers (en dessous) */}
      <div
        ref={css3dContainerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          background: '#072446',
        }}
      />

      {/* Canvas 3D (au-dessus avec transparence pour voir les CSS3D à travers les zones transparentes) */}
      <Canvas
        camera={{
          fov: CAMERA_CONFIG.fov,
          near: CAMERA_CONFIG.near,
          far: CAMERA_CONFIG.far,
          position: CAMERA_CONFIG.initialPosition.toArray(),
        }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: true,
          premultipliedAlpha: false,
        }}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        onCreated={({ camera, gl }) => {
          cameraRef.current = camera
          gl.setClearColor(0x072446, 1)
        }}
      >
        {/* Cleanup WebGL au démontage pour éviter Context Lost */}
        <WebGLCleanup />
        <Suspense fallback={<LoadingFallback />}>
          <PierreScene />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  )
}

/**
 * Scène principale avec tous les éléments 3D.
 */
function PierreScene() {
  const controlsRef = useRef<any>(null)
  const [hoveredObjects, setHoveredObjects] = useState<THREE.Object3D[]>([])

  /**
   * Collecte tous les meshes d'un groupe pour l'OutlinePass.
   */
  const collectMeshes = useCallback((objects: THREE.Object3D[]): THREE.Object3D[] => {
    const meshes: THREE.Object3D[] = []
    objects.forEach((obj) => {
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          meshes.push(child)
        }
      })
    })
    return meshes
  }, [])

  /**
   * Gère le hover sur les éléments interactifs.
   */
  const handleHover = useCallback(
    (objects: THREE.Object3D[]) => {
      if (objects.length === 0) {
        setHoveredObjects([])
      } else {
        const meshes = collectMeshes(objects)
        setHoveredObjects(meshes)
      }
    },
    [collectMeshes]
  )

  // Store Pierre pour l'état de la scène
  const currentStage = usePierreStore((s) => s.currentStage)
  const setCurrentStage = usePierreStore((s) => s.setCurrentStage)
  const isCameraMoving = usePierreStore((s) => s.isCameraMoving)
  const setIsCameraMoving = usePierreStore((s) => s.setIsCameraMoving)

  const { camera } = useThree()

  /**
   * Transition de la caméra vers une zone spécifique.
   */
  const flyToStage = useCallback(
    (stage: PierreStage) => {
      if (isCameraMoving) return

      const stageConfig = STAGE_POSITIONS[stage]
      if (!stageConfig) return

      setIsCameraMoving(true)

      // Désactiver les contrôles pendant la transition (comme Joan)
      if (controlsRef.current) {
        controlsRef.current.enableDamping = false
        controlsRef.current.enabled = false
      }

      // Animation de la position
      gsap.to(camera.position, {
        x: stageConfig.position.x,
        y: stageConfig.position.y,
        z: stageConfig.position.z,
        duration: 1,
        ease: 'sine.out',
      })

      // Animation du target (OrbitControls)
      if (controlsRef.current) {
        gsap.to(controlsRef.current.target, {
          x: stageConfig.target.x,
          y: stageConfig.target.y,
          z: stageConfig.target.z,
          duration: 1,
          ease: 'sine.out',
          onComplete: () => {
            setCurrentStage(stage)
            setIsCameraMoving(false)

            // Réactiver les contrôles seulement si on revient à default
            if (stage === 'default' && controlsRef.current) {
              controlsRef.current.enableDamping = true
              controlsRef.current.enabled = true
            }
          },
        })
      }
    },
    [camera, isCameraMoving, setCurrentStage, setIsCameraMoving]
  )

  // Exposer flyToStage globalement pour le bandeau
  useEffect(() => {
    globalFlyToStage = flyToStage
    return () => {
      globalFlyToStage = null
    }
  }, [flyToStage])

  /**
   * Retour à la vue par défaut.
   */
  const backToDefault = useCallback(() => {
    flyToStage('default')
  }, [flyToStage])

  // Mettre à jour les contrôles et synchroniser le rendu CSS3D à chaque frame
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update()
    }
    // Synchroniser le rendu CSS3D avec le frame loop WebGL
    const css3dRender = (window as any).__css3dRender
    if (css3dRender) {
      css3dRender()
    }
  })

  return (
    <>
      {/* Éclairage */}
      <ambientLight intensity={1} />
      <directionalLight position={[40, 40, 40]} intensity={1} castShadow />

      {/* OrbitControls */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping={ORBIT_CONFIG.enableDamping}
        dampingFactor={ORBIT_CONFIG.dampingFactor}
        rotateSpeed={ORBIT_CONFIG.rotateSpeed}
        zoomSpeed={ORBIT_CONFIG.zoomSpeed}
        minDistance={ORBIT_CONFIG.minDistance}
        maxDistance={ORBIT_CONFIG.maxDistance}
        minPolarAngle={ORBIT_CONFIG.minPolarAngle}
        maxPolarAngle={ORBIT_CONFIG.maxPolarAngle}
        minAzimuthAngle={ORBIT_CONFIG.minAzimuthAngle}
        maxAzimuthAngle={ORBIT_CONFIG.maxAzimuthAngle}
        target={CAMERA_CONFIG.initialTarget}
      />

      {/* Post-processing */}
      <EffectComposer>
        <Outline
          selection={hoveredObjects}
          visibleEdgeColor={0xffffff}
          hiddenEdgeColor={0x888888}
          edgeStrength={4}
          pulseSpeed={0.5}
          blur
        />
        <SMAA />
      </EffectComposer>

      {/* Monde Pierre */}
      <PierreWorld onHover={handleHover} onSelect={flyToStage} />

      {/* Bouton retour (en bas à gauche, style Joan) */}
      {currentStage !== 'default' && (
        <Html fullscreen>
          <button
            onClick={backToDefault}
            style={{
              position: 'fixed',
              bottom: '30px',
              left: '30px',
              padding: '12px 24px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              zIndex: 100,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            }}
          >
            ← Back
          </button>
        </Html>
      )}
    </>
  )
}

/**
 * Fallback de chargement.
 */
function LoadingFallback() {
  return (
    <Html center>
      <div
        style={{
          color: 'white',
          fontSize: '24px',
          fontFamily: 'monospace',
        }}
      >
        Chargement...
      </div>
    </Html>
  )
}
