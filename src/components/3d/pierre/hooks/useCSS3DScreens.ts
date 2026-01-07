/**
 * Hook pour gérer les CSS3DRenderer pour les écrans iframe.
 *
 * Comme Joan, on utilise CSS3DRenderer pour avoir un rendu pixel-perfect
 * des iframes dans la scène 3D. Ce hook crée et gère les renderers.
 */

import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'

// Configuration des écrans
export const SCREEN_CONFIGS = {
  arcadeMachine: {
    iframeSrc: '/arcade.html',
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
} as const

export type ScreenId = keyof typeof SCREEN_CONFIGS

interface CSS3DScreen {
  renderer: CSS3DRenderer
  scene: THREE.Scene
  iframe: HTMLIFrameElement
  container: HTMLDivElement
}

interface UseCSS3DScreensOptions {
  containerRef: React.RefObject<HTMLDivElement | null>
  cameraRef: React.RefObject<THREE.Camera | null>
  currentStage: string
}

/**
 * Hook qui crée et gère les CSS3DRenderers pour tous les écrans.
 */
export function useCSS3DScreens({ containerRef, cameraRef, currentStage }: UseCSS3DScreensOptions) {
  const screensRef = useRef<Map<ScreenId, CSS3DScreen>>(new Map())
  const animationIdRef = useRef<number | null>(null)

  // Créer les screens au montage
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const screens = screensRef.current

    // Créer un renderer pour chaque écran
    Object.entries(SCREEN_CONFIGS).forEach(([key, config]) => {
      const screenId = key as ScreenId

      // Container div pour l'iframe
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
      iframe.id = `css3d-iframe-${screenId}`
      iframeContainer.appendChild(iframe)

      // CSS3DObject
      const css3dObject = new CSS3DObject(iframeContainer)
      css3dObject.position.copy(config.position)
      css3dObject.scale.copy(config.scale)
      // Assigner les rotations directement (comme Joan pour les moniteurs)
      // Pour l'arcade, on utilise rotateY puis rotateX
      if (screenId === 'arcadeMachine') {
        css3dObject.rotateY(config.rotationY)
        css3dObject.rotateX(config.rotationX)
      } else {
        // Pour les moniteurs, Joan utilise rotation.y directement
        css3dObject.rotation.y = config.rotationY
        css3dObject.rotation.x = config.rotationX
      }

      // Scène CSS3D
      const cssScene = new THREE.Scene()
      cssScene.add(css3dObject)

      // CSS3DRenderer - utiliser window.innerWidth/Height comme Joan
      const cssRenderer = new CSS3DRenderer()
      cssRenderer.setSize(window.innerWidth, window.innerHeight)
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
    })

    // Cleanup complet pour éviter les fuites mémoire et context lost WebGL
    return () => {
      // Arrêter l'animation loop en premier
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
        animationIdRef.current = null
      }

      screens.forEach(({ renderer, scene, iframe, container }) => {
        // Supprimer l'iframe src pour arrêter le chargement
        iframe.src = 'about:blank'
        iframe.remove()

        // Nettoyer la scène CSS3D
        scene.clear()

        // Supprimer le container
        container.remove()

        // Supprimer le DOM element du renderer
        renderer.domElement.remove()
      })
      screens.clear()
    }
  }, [containerRef])

  // Mettre à jour la taille des renderers au resize
  useEffect(() => {
    const handleResize = () => {
      screensRef.current.forEach(({ renderer }) => {
        renderer.setSize(window.innerWidth, window.innerHeight)
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Fonction de rendu à appeler depuis useFrame pour synchronisation parfaite
  const renderCSS3D = useCallback(() => {
    if (cameraRef.current) {
      screensRef.current.forEach(({ renderer, scene }) => {
        renderer.render(scene, cameraRef.current!)
      })
    }
  }, [cameraRef])

  // Exposer la fonction de rendu globalement pour l'appeler depuis useFrame
  useEffect(() => {
    ;(window as any).__css3dRender = renderCSS3D
    return () => {
      delete (window as any).__css3dRender
    }
  }, [renderCSS3D])

  // Activer/désactiver les pointer events selon le stage actif
  useEffect(() => {
    screensRef.current.forEach(({ renderer }, screenId) => {
      const isActive = currentStage === screenId
      renderer.domElement.style.pointerEvents = isActive ? 'auto' : 'none'
    })
  }, [currentStage])

  // Récupérer l'iframe d'un écran
  const getIframe = useCallback((screenId: ScreenId): HTMLIFrameElement | null => {
    return screensRef.current.get(screenId)?.iframe || null
  }, [])

  return { getIframe }
}
