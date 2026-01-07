/**
 * CSS3DContext - Gestion des CSS3DRenderer pour les iframes 3D.
 *
 * Comme Joan, on utilise des CSS3DRenderer séparés pour chaque écran
 * afin d'avoir un rendu pixel-perfect des iframes dans la scène 3D.
 */

import { createContext, useContext, useRef, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import * as THREE from 'three'

interface CSS3DScreen {
  id: string
  iframeSrc: string
  position: THREE.Vector3
  scale: THREE.Vector3
  rotation: THREE.Euler
  width: number
  height: number
  padding?: string
}

interface CSS3DContextValue {
  registerScreen: (screen: CSS3DScreen) => void
  unregisterScreen: (id: string) => void
  getIframeElement: (id: string) => HTMLIFrameElement | null
}

const CSS3DContext = createContext<CSS3DContextValue | null>(null)

export function useCSS3D() {
  const ctx = useContext(CSS3DContext)
  if (!ctx) {
    throw new Error('useCSS3D must be used within CSS3DProvider')
  }
  return ctx
}

interface CSS3DProviderProps {
  children: ReactNode
}

/**
 * Provider qui gère les CSS3DRenderer pour tous les écrans.
 * Doit être utilisé à l'extérieur du Canvas R3F car il crée ses propres DOM elements.
 */
export function CSS3DProvider({ children }: CSS3DProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const renderersRef = useRef<Map<string, { renderer: CSS3DRenderer; scene: THREE.Scene; iframe: HTMLIFrameElement }>>(new Map())
  const screensRef = useRef<Map<string, CSS3DScreen>>(new Map())
  const [, forceUpdate] = useState(0)

  const registerScreen = useCallback((screen: CSS3DScreen) => {
    screensRef.current.set(screen.id, screen)
    forceUpdate((n) => n + 1)
  }, [])

  const unregisterScreen = useCallback((id: string) => {
    const entry = renderersRef.current.get(id)
    if (entry) {
      entry.renderer.domElement.remove()
      renderersRef.current.delete(id)
    }
    screensRef.current.delete(id)
  }, [])

  const getIframeElement = useCallback((id: string) => {
    return renderersRef.current.get(id)?.iframe || null
  }, [])

  return (
    <CSS3DContext.Provider value={{ registerScreen, unregisterScreen, getIframeElement }}>
      <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {/* Les CSS3DRenderer DOM elements seront ajoutés ici */}
      </div>
      {children}
    </CSS3DContext.Provider>
  )
}

/**
 * Composant interne qui gère un CSS3DRenderer pour un écran.
 * À utiliser dans le Canvas R3F.
 */
interface CSS3DIframeProps {
  id: string
  iframeSrc: string
  position: [number, number, number]
  scale: [number, number, number]
  rotation: THREE.Euler | [number, number, number]
  width: number
  height: number
  padding?: string
  containerRef: React.RefObject<HTMLDivElement>
  isActive?: boolean
}

export function CSS3DIframe({
  id,
  iframeSrc,
  position,
  scale,
  rotation,
  width,
  height,
  padding = '0px',
  containerRef,
  isActive = false,
}: CSS3DIframeProps) {
  const { camera, size } = useThree()
  const rendererRef = useRef<CSS3DRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const css3dObjectRef = useRef<CSS3DObject | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  // Créer le renderer et l'iframe au montage
  useEffect(() => {
    if (!containerRef.current) return

    // Créer la scène CSS3D
    const cssScene = new THREE.Scene()
    sceneRef.current = cssScene

    // Créer le container et l'iframe
    const container = document.createElement('div')
    container.style.width = `${width}px`
    container.style.height = `${height}px`

    const iframe = document.createElement('iframe')
    iframe.src = iframeSrc
    iframe.style.width = `${width}px`
    iframe.style.height = `${height}px`
    iframe.style.padding = padding
    iframe.style.boxSizing = 'border-box'
    iframe.style.background = 'black'
    iframe.style.border = 'none'
    iframe.id = `css3d-iframe-${id}`
    container.appendChild(iframe)
    iframeRef.current = iframe

    // Créer le CSS3DObject
    const css3dObject = new CSS3DObject(container)
    css3dObject.position.set(position[0], position[1], position[2])
    css3dObject.scale.set(scale[0], scale[1], scale[2])

    if (rotation instanceof THREE.Euler) {
      css3dObject.rotation.copy(rotation)
    } else {
      css3dObject.rotation.set(rotation[0], rotation[1], rotation[2])
    }

    css3dObjectRef.current = css3dObject
    cssScene.add(css3dObject)

    // Créer le CSS3DRenderer
    const cssRenderer = new CSS3DRenderer()
    cssRenderer.setSize(size.width, size.height)
    cssRenderer.domElement.style.position = 'absolute'
    cssRenderer.domElement.style.top = '0'
    cssRenderer.domElement.style.left = '0'
    cssRenderer.domElement.style.pointerEvents = 'none'
    rendererRef.current = cssRenderer

    containerRef.current.appendChild(cssRenderer.domElement)

    return () => {
      cssRenderer.domElement.remove()
      rendererRef.current = null
      sceneRef.current = null
    }
  }, [id, iframeSrc, width, height, padding, position, scale, rotation, containerRef])

  // Mettre à jour la taille du renderer
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setSize(size.width, size.height)
    }
  }, [size.width, size.height])

  // Mettre à jour pointerEvents selon isActive
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.domElement.style.pointerEvents = isActive ? 'auto' : 'none'
    }
  }, [isActive])

  // Rendre la scène CSS3D à chaque frame
  useFrame(() => {
    if (rendererRef.current && sceneRef.current) {
      rendererRef.current.render(sceneRef.current, camera)
    }
  })

  // Retourner un mesh transparent pour le raycasting
  return (
    <mesh
      position={position}
      scale={scale}
      rotation={rotation instanceof THREE.Euler ? rotation : new THREE.Euler(...rotation)}
      name={`${id}Screen`}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  )
}

export default CSS3DProvider
