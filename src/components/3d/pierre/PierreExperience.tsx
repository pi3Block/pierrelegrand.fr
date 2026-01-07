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
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import * as THREE from 'three'
import gsap from 'gsap'
import { usePierreStore, type PierreStage } from './stores/pierreStore'
import { PierreWorld } from './PierreWorld'
import { PierreBanner } from './ui/PierreBanner'
import { useGameStore } from '@stores/gameStore'

// Configuration des écrans iframe
const SCREEN_CONFIGS = {
  arcadeMachine: {
    iframeSrc: 'https://joan-arcade-machine.vercel.app',
    width: 1006.986,
    height: 1210.118,
    position: new THREE.Vector3(3.24776, 2.7421, 2.3009),
    scale: new THREE.Vector3(0.00102, 0.00102, 0.00102),
    rotationY: -Math.PI / 2,
    rotationX: -Math.PI / 7,
    padding: '16px',
  },
  leftMonitor: {
    iframeSrc: 'https://joan-os.vercel.app',
    width: 1370.178,
    height: 764.798,
    position: new THREE.Vector3(1.06738, 2.50725, -4.23009),
    scale: new THREE.Vector3(0.00102, 0.00102, 1),
    rotationY: 0,
    rotationX: 0,
    padding: '8px',
  },
  rightMonitor: {
    iframeSrc: 'https://joan-art-gallery.vercel.app',
    width: 1370.178,
    height: 764.798,
    position: new THREE.Vector3(2.47898, 2.50716, -4.14566),
    scale: new THREE.Vector3(0.00102, 0.00102, 1),
    rotationY: (-7.406 * Math.PI) / 180,
    rotationX: 0,
    padding: '8px',
  },
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

// Types pour les CSS3D renderers
interface CSS3DScreenRenderer {
  renderer: CSS3DRenderer
  scene: THREE.Scene
  iframe: HTMLIFrameElement
}

/**
 * Composant principal de la scène Pierre.
 * Inclut le Canvas 3D, le bandeau de navigation HTML, et les CSS3DRenderer pour les iframes.
 */
export default function PierreExperience() {
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel)
  const [flyToStageReady, setFlyToStageReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const css3dContainerRef = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const css3dRenderersRef = useRef<Map<string, CSS3DScreenRenderer>>(new Map())
  const currentStage = usePierreStore((s) => s.currentStage)

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

  // Créer les CSS3DRenderers pour chaque écran
  useEffect(() => {
    if (!css3dContainerRef.current) return

    const renderers = css3dRenderersRef.current

    // Créer un renderer pour chaque écran
    Object.entries(SCREEN_CONFIGS).forEach(([key, config]) => {
      // Container et iframe
      const container = document.createElement('div')
      container.style.width = `${config.width}px`
      container.style.height = `${config.height}px`

      const iframe = document.createElement('iframe')
      iframe.src = config.iframeSrc
      iframe.style.width = `${config.width}px`
      iframe.style.height = `${config.height}px`
      iframe.style.padding = config.padding
      iframe.style.boxSizing = 'border-box'
      iframe.style.background = 'black'
      iframe.style.border = 'none'
      iframe.id = `css3d-iframe-${key}`
      container.appendChild(iframe)

      // CSS3DObject
      const css3dObject = new CSS3DObject(container)
      css3dObject.position.copy(config.position)
      css3dObject.scale.copy(config.scale)
      css3dObject.rotateY(config.rotationY)
      css3dObject.rotateX(config.rotationX)

      // Scène CSS3D
      const cssScene = new THREE.Scene()
      cssScene.add(css3dObject)

      // CSS3DRenderer
      const cssRenderer = new CSS3DRenderer()
      cssRenderer.setSize(window.innerWidth, window.innerHeight)
      cssRenderer.domElement.style.position = 'absolute'
      cssRenderer.domElement.style.top = '0'
      cssRenderer.domElement.style.left = '0'
      cssRenderer.domElement.style.pointerEvents = 'none'
      cssRenderer.domElement.id = `css3d-renderer-${key}`

      css3dContainerRef.current!.appendChild(cssRenderer.domElement)

      renderers.set(key, { renderer: cssRenderer, scene: cssScene, iframe })
    })

    // Cleanup
    return () => {
      renderers.forEach(({ renderer }) => {
        renderer.domElement.remove()
      })
      renderers.clear()
    }
  }, [])

  // Mettre à jour la taille des renderers
  useEffect(() => {
    const handleResize = () => {
      css3dRenderersRef.current.forEach(({ renderer }) => {
        renderer.setSize(window.innerWidth, window.innerHeight)
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Animation frame pour rendre les CSS3D
  useEffect(() => {
    let animationId: number

    const animate = () => {
      if (cameraRef.current) {
        css3dRenderersRef.current.forEach(({ renderer, scene }) => {
          renderer.render(scene, cameraRef.current!)
        })
      }
      animationId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationId)
  }, [])

  // Activer/désactiver les pointer events selon le stage actif
  useEffect(() => {
    css3dRenderersRef.current.forEach(({ renderer }, key) => {
      const isActive = currentStage === key
      renderer.domElement.style.pointerEvents = isActive ? 'auto' : 'none'
    })
  }, [currentStage])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Bandeau de navigation (HTML, en dehors du Canvas) */}
      <PierreBanner onNavigate={handleNavigate} onBackToHub={handleBackToHub} />

      {/* Container pour les CSS3DRenderers (derrière le Canvas WebGL) */}
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
        }}
      />

      {/* Canvas 3D */}
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
          alpha: true, // Important pour voir les CSS3D en dessous
        }}
        style={{ position: 'relative', zIndex: 1, background: 'transparent' }}
        onCreated={({ camera, scene }) => {
          cameraRef.current = camera as THREE.PerspectiveCamera
          // Ne pas définir de background pour permettre la transparence
          scene.background = null
        }}
      >
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

  // Mettre à jour les contrôles à chaque frame
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update()
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
