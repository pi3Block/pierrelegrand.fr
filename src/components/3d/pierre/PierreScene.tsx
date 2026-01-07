/**
 * PierreScene - Scène Pierre sans Canvas (pour intégration dans Canvas unique).
 *
 * Cette version de la scène Pierre est conçue pour être utilisée à l'intérieur
 * d'un Canvas partagé avec les autres niveaux. Elle gère:
 * - OrbitControls (activés uniquement quand level === 5)
 * - Post-processing (Outline, SMAA)
 * - Transitions caméra GSAP
 * - CSS3DRenderer pour les iframes (géré via portal DOM)
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { EffectComposer, Outline, SMAA } from '@react-three/postprocessing'
import * as THREE from 'three'
import gsap from 'gsap'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { usePierreStore, type PierreStage } from './stores/pierreStore'
import { PierreWorld } from './PierreWorld'
import { SCREEN_CONFIGS, type ScreenId } from './hooks/useCSS3DScreens'

// Configuration de la caméra et des positions
const CAMERA_CONFIG = {
  fov: 20,
  position: new THREE.Vector3(-23, 17, 23),
  target: new THREE.Vector3(0, 2.5, 0),
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

// Positions des zones interactives (caméra)
const STAGE_POSITIONS: Record<PierreStage, { position: THREE.Vector3; target: THREE.Vector3 }> = {
  default: {
    position: new THREE.Vector3(-23, 17, 23),
    target: new THREE.Vector3(0, 2.5, 0),
  },
  arcadeMachine: {
    position: new THREE.Vector3(-4.5, 5.5, 2.3009),
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

// Store global pour exposer flyToStage depuis le bandeau
let globalFlyToStage: ((stage: PierreStage) => void) | null = null

export function getGlobalFlyToStage() {
  return globalFlyToStage
}

interface CSS3DScreen {
  renderer: CSS3DRenderer
  scene: THREE.Scene
  iframe: HTMLIFrameElement
  container: HTMLDivElement
}

/**
 * Hook pour gérer les CSS3D screens depuis l'intérieur du Canvas.
 * Utilise la caméra du Canvas via useThree().
 *
 * Comme Joan, on utilise un container séparé par écran pour éviter
 * les problèmes de synchronisation CSS3D/WebGL.
 *
 * IMPORTANT: Les CSS3DRenderers doivent être créés APRÈS que le FOV
 * de la caméra soit configuré à 20°, sinon la perspective sera fausse.
 */
function useCSS3DInCanvas(currentStage: PierreStage, cameraReady: boolean) {
  const { camera, size, gl } = useThree()
  const screensRef = useRef<Map<ScreenId, CSS3DScreen>>(new Map())
  const containersRef = useRef<HTMLDivElement[]>([])
  const isInitializedRef = useRef(false)

  // Créer les containers DOM et les screens seulement quand la caméra est prête (FOV = 20)
  useEffect(() => {
    // Attendre que la caméra soit configurée avec le bon FOV
    if (!cameraReady) {
      console.log('[CSS3D] Waiting for camera to be ready...')
      return
    }

    // Attendre que size soit valide (pas 0x0)
    if (size.width === 0 || size.height === 0) {
      console.log('[CSS3D] Waiting for valid size...', size.width, 'x', size.height)
      return
    }

    if (isInitializedRef.current) return
    isInitializedRef.current = true

    // Vérifier le FOV de la caméra
    const cam = camera as THREE.PerspectiveCamera
    console.log('[CSS3D] Camera ready with FOV:', cam.fov)

    // IMPORTANT: Utiliser size de R3F car c'est ce que R3F utilise pour l'aspect ratio de la caméra
    // Le CSS3DRenderer doit avoir les mêmes dimensions que la caméra pour que les projections correspondent
    const canvasWidth = size.width
    const canvasHeight = size.height

    console.log('[CSS3D] Using R3F size:', size.width, 'x', size.height)
    console.log('[CSS3D] window.inner:', window.innerWidth, 'x', window.innerHeight)
    console.log('[CSS3D] Camera aspect:', cam.aspect, 'expected:', size.width / size.height)

    const screens = screensRef.current
    const containers = containersRef.current

    // Créer un container ET un renderer séparé pour chaque écran (comme Joan)
    Object.entries(SCREEN_CONFIGS).forEach(([key, config]) => {
      const screenId = key as ScreenId

      // Container séparé pour chaque écran (exactement comme Joan)
      // IMPORTANT: Chez Joan, les containers sont positionnés à top:0 left:0
      // car le canvas WebGL est aussi à position:fixed top:0 left:0
      // Le CSS3DRenderer calcule sa perspective depuis le centre de son container,
      // donc le container DOIT avoir les mêmes dimensions et position que le canvas.
      const container = document.createElement('div')
      container.id = `css3d-container-${screenId}`
      container.style.position = 'fixed'
      container.style.top = '0'
      container.style.left = '0'
      container.style.width = `${canvasWidth}px`
      container.style.height = `${canvasHeight}px`
      container.style.pointerEvents = 'none'
      container.style.overflow = 'hidden'
      document.body.appendChild(container)
      containers.push(container)

      // Container div pour l'iframe (dimensions identiques à Joan)
      const iframeContainer = document.createElement('div')
      iframeContainer.style.width = `${config.width}px`
      iframeContainer.style.height = `${config.height}px`

      // Iframe
      const iframe = document.createElement('iframe')
      iframe.src = config.iframeSrc
      iframe.style.width = `${config.width}px`
      iframe.style.height = `${config.height}px`
      iframe.style.padding = config.padding
      iframe.style.boxSizing = 'border-box'
      iframe.style.background = 'black'
      iframe.style.border = 'none'
      iframe.style.display = 'block'
      iframe.id = `css3d-iframe-${screenId}`
      iframeContainer.appendChild(iframe)

      // CSS3DObject - utiliser quaternion pour correspondre exactement au mesh WebGL
      const css3dObject = new CSS3DObject(iframeContainer)
      css3dObject.position.copy(config.position)
      css3dObject.scale.copy(config.scale)

      // Calculer le quaternion de la même façon que dans ArcadeScreen.tsx
      // rotateY puis rotateX = q_y * q_x
      const q_y = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), config.rotationY)
      const q_x = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), config.rotationX)
      const finalQuaternion = q_y.clone().multiply(q_x)
      css3dObject.quaternion.copy(finalQuaternion)

      console.log(`[CSS3D] ${screenId} quaternion:`, finalQuaternion.toArray().map((v) => v.toFixed(4)))

      // Scène CSS3D
      const cssScene = new THREE.Scene()
      cssScene.add(css3dObject)

      // CSS3DRenderer - DIMENSIONS EXACTES du canvas WebGL
      const cssRenderer = new CSS3DRenderer()
      cssRenderer.setSize(canvasWidth, canvasHeight)
      cssRenderer.domElement.style.position = 'absolute'
      cssRenderer.domElement.style.top = '0'
      cssRenderer.domElement.style.left = '0'
      cssRenderer.domElement.style.pointerEvents = 'none'
      cssRenderer.domElement.id = `css3d-renderer-${screenId}`

      container.appendChild(cssRenderer.domElement)

      screens.set(screenId, {
        renderer: cssRenderer,
        scene: cssScene,
        iframe,
        container: iframeContainer,
      })

      console.log(`[CSS3D] Screen ${screenId} created at position:`, config.position.toArray())
    })

    // Cleanup
    return () => {
      screens.forEach(({ renderer, scene, iframe, container: iframeContainer }) => {
        iframe.src = 'about:blank'
        iframe.remove()
        scene.clear()
        iframeContainer.remove()
        renderer.domElement.remove()
      })
      screens.clear()

      containers.forEach((container) => container.remove())
      containersRef.current = []
      isInitializedRef.current = false
    }
  }, [gl.domElement, cameraReady, camera, size.width, size.height])

  // Animation loop - sync avec la caméra R3F
  const lastLogTimeRef = useRef(0)

  useFrame(() => {
    // S'assurer que la matrice de la caméra est à jour
    camera.updateMatrixWorld()

    screensRef.current.forEach(({ renderer, scene }) => {
      renderer.render(scene, camera)
    })

    // Log détaillé toutes les 2 secondes pour debug
    const now = Date.now()
    if (now - lastLogTimeRef.current > 2000) {
      lastLogTimeRef.current = now
      const cam = camera as THREE.PerspectiveCamera

      console.group('[CSS3D Debug]')
      console.log('Camera FOV:', cam.fov)
      console.log('Camera aspect:', cam.aspect, 'expected:', window.innerWidth / window.innerHeight)
      console.log('Camera projectionMatrix[5]:', cam.projectionMatrix.elements[5].toFixed(4))
      console.log('Camera Position:', camera.position.toArray().map((v) => v.toFixed(3)))
      console.log('Camera Rotation:', camera.rotation.toArray().map((v) => typeof v === 'number' ? v.toFixed(3) : v))

      // Log les CSS3DObjects
      screensRef.current.forEach(({ scene }, screenId) => {
        const css3dObject = scene.children[0]
        if (css3dObject) {
          console.log(`--- ${screenId} ---`)
          console.log('  CSS3D Position:', css3dObject.position.toArray().map((v) => v.toFixed(3)))
          console.log('  CSS3D Quaternion:', css3dObject.quaternion.toArray().map((v) => v.toFixed(4)))

          // Projeter la position 3D en coordonnées écran (méthode WebGL standard)
          const screenPos = css3dObject.position.clone().project(cam)
          // Utiliser size de R3F car c'est ce que le CSS3DRenderer utilise maintenant
          const halfWidth = size.width / 2
          const halfHeight = size.height / 2
          const screenX = screenPos.x * halfWidth + halfWidth
          const screenY = -screenPos.y * halfHeight + halfHeight
          console.log('  Expected Screen Pos:', screenX.toFixed(0), screenY.toFixed(0))

          // Vérifier si le DOM element existe et sa position
          const domElement = (css3dObject as any).element as HTMLElement
          if (domElement) {
            const rect = domElement.getBoundingClientRect()
            console.log('  DOM BoundingRect:', `x=${rect.x.toFixed(0)}, y=${rect.y.toFixed(0)}, w=${rect.width.toFixed(0)}, h=${rect.height.toFixed(0)}`)
          }
        }
      })

      // Log le style du container CSS3D renderer
      containersRef.current.forEach((container, i) => {
        console.log(`Container ${i}: top=${container.style.top}, left=${container.style.left}`)
      })

      // Log la perspective CSS du renderer
      screensRef.current.forEach(({ renderer }, screenId) => {
        const style = renderer.domElement.style
        console.log(`Renderer ${screenId} perspective:`, style.perspective, 'transform:', style.transform?.slice(0, 50))

        // Regarder le cameraElement interne
        const cameraEl = renderer.domElement.querySelector('[style*="perspective"]') || renderer.domElement.firstChild
        if (cameraEl instanceof HTMLElement) {
          console.log(`  cameraElement transform:`, cameraEl.style.transform?.slice(0, 80))
        }
      })

      console.groupEnd()
    }
  })

  // Resize handler - mettre à jour dimensions avec size de R3F
  useEffect(() => {
    // Utiliser size de R3F car c'est cohérent avec l'aspect ratio de la caméra
    const width = size.width
    const height = size.height

    console.log('[CSS3D] Resize to:', width, 'x', height)

    // Mettre à jour les containers - position reste à 0,0 (fixed)
    containersRef.current.forEach((container) => {
      container.style.width = `${width}px`
      container.style.height = `${height}px`
    })

    // Mettre à jour les renderers
    screensRef.current.forEach(({ renderer }) => {
      renderer.setSize(width, height)
    })
  }, [size.width, size.height])

  // Activer/désactiver les pointer events selon le stage actif
  useEffect(() => {
    screensRef.current.forEach(({ renderer }, screenId) => {
      const isActive = currentStage === screenId
      renderer.domElement.style.pointerEvents = isActive ? 'auto' : 'none'
    })
  }, [currentStage])
}

interface PierreSceneProps {
  /** Si true, setup la caméra pour la vue Pierre */
  setupCamera?: boolean
}

/**
 * Scène Pierre - À utiliser à l'intérieur d'un Canvas partagé.
 */
export function PierreScene({ setupCamera = true }: PierreSceneProps) {
  const controlsRef = useRef<any>(null)
  const [hoveredObjects, setHoveredObjects] = useState<THREE.Object3D[]>([])
  const cameraReadyRef = useRef(false)
  const [, forceUpdate] = useState(0)

  const currentStage = usePierreStore((s) => s.currentStage)
  const setCurrentStage = usePierreStore((s) => s.setCurrentStage)
  const isCameraMoving = usePierreStore((s) => s.isCameraMoving)
  const setIsCameraMoving = usePierreStore((s) => s.setIsCameraMoving)

  const { camera } = useThree()

  // Setup caméra au montage (une seule fois) - AVANT les CSS3D screens
  useEffect(() => {
    if (setupCamera && !cameraReadyRef.current) {
      camera.position.copy(CAMERA_CONFIG.position)
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = CAMERA_CONFIG.fov
        camera.updateProjectionMatrix()
        console.log('[PierreScene] Camera configured with FOV:', camera.fov)
      }
      // Signaler que la caméra est prête
      cameraReadyRef.current = true
      // Force un re-render pour que useCSS3DInCanvas puisse démarrer
      forceUpdate((n) => n + 1)
    }

    // Reset au démontage
    return () => {
      cameraReadyRef.current = false
      setCurrentStage('default')
      setIsCameraMoving(false)
    }
  }, [camera, setupCamera, setCurrentStage, setIsCameraMoving])

  // CSS3D Screens - gérés depuis l'intérieur du Canvas (APRÈS setup caméra)
  useCSS3DInCanvas(currentStage, cameraReadyRef.current)

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

  /**
   * Transition de la caméra vers une zone spécifique.
   */
  const flyToStage = useCallback(
    (stage: PierreStage) => {
      if (isCameraMoving) return

      const stageConfig = STAGE_POSITIONS[stage]
      if (!stageConfig) return

      setIsCameraMoving(true)

      // Désactiver les contrôles pendant la transition
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

      // Animation du target
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
      {/* Éclairage spécifique Pierre */}
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
        target={CAMERA_CONFIG.target}
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

      {/* Bouton retour */}
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

export default PierreScene
