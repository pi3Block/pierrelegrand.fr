/**
 * Whiteboard - Tableau blanc interactif pour dessiner.
 *
 * Fonctionnalités:
 * - Dessin avec différentes couleurs (marqueurs)
 * - Gomme pour effacer
 * - Canvas 2D mappé sur une texture 3D
 * - Raycasting UV pour le positionnement précis
 * - Charge l'image texture_paint.png comme dessin initial (comme Joan)
 */

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { useGLTF, Html, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { usePierreStore, type PierreStage } from '../stores/pierreStore'

// Configuration
const WHITEBOARD_POSITION: [number, number, number] = [-3.3927, 3.18774, -4.61366]
const CANVAS_SIZE = { width: 2048, height: 1024 }
const PLANE_SIZE = { width: 2.6, height: 1.82 }

// Image initiale du whiteboard (comme Joan's portfolio)
const TEXTURE_PAINT_URL = '/pierre/assets/textures/texture_paint.png'

// Couleurs des marqueurs
const MARKER_COLORS: Record<string, { color: string; lineWidth: number }> = {
  black: { color: 'black', lineWidth: 8 },
  red: { color: 'red', lineWidth: 8 },
  green: { color: 'darkgreen', lineWidth: 8 },
  blue: { color: 'blue', lineWidth: 8 },
  eraser: { color: 'white', lineWidth: 50 },
}

interface WhiteboardProps {
  onHover: (objects: THREE.Object3D[]) => void
  onSelect: (stage: PierreStage) => void
}

/**
 * Composant Whiteboard interactif.
 */
export function Whiteboard({ onHover, onSelect }: WhiteboardProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const whiteboardModelRef = useRef<THREE.Object3D>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const textureRef = useRef<THREE.CanvasTexture | null>(null)

  const { camera, raycaster } = useThree()

  // États
  const [isActive, setIsActive] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentColor, setCurrentColor] = useState('black')
  const drawStartPos = useRef(new THREE.Vector2(-1, -1))
  const pointer = useRef(new THREE.Vector2())

  // Store
  const currentStage = usePierreStore((s) => s.currentStage)

  // Charger le modèle du tableau
  const { scene } = useGLTF('/pierre/assets/models/whiteboard.glb')

  // Nommer la scène
  scene.name = 'whiteboard'

  // Initialiser le canvas de dessin avec l'image texture_paint.png
  useEffect(() => {
    // Créer le canvas de dessin (hors DOM)
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_SIZE.width
    canvas.height = CANVAS_SIZE.height
    canvasRef.current = canvas

    const ctx = canvas.getContext('2d')
    if (ctx) {
      contextRef.current = ctx

      // Fond blanc initial
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height)

      // Configuration du dessin
      ctx.lineWidth = 8
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
    }

    // Créer la texture initiale
    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = true
    textureRef.current = texture

    // Charger l'image texture_paint.png (comme Joan)
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      if (ctx) {
        // Dessiner l'image sur le canvas
        ctx.drawImage(image, 0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height)
        // Mettre à jour la texture
        texture.needsUpdate = true
      }
    }
    image.src = TEXTURE_PAINT_URL

    return () => {
      texture.dispose()
    }
  }, [])

  // Activer selon le stage
  useEffect(() => {
    setIsActive(currentStage === 'whiteboard')
  }, [currentStage])

  // Matériau avec texture canvas
  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      map: textureRef.current,
    })
  }, [])

  // Mettre à jour la texture quand elle change
  useEffect(() => {
    if (textureRef.current) {
      material.map = textureRef.current
      material.needsUpdate = true
    }
  }, [material])

  // Fonction de dessin
  const draw = useCallback((x: number, y: number) => {
    const ctx = contextRef.current
    if (!ctx) return
    
    const config = MARKER_COLORS[currentColor] ?? { color: 'black', lineWidth: 8 }
    ctx.strokeStyle = config.color
    ctx.lineWidth = config.lineWidth
    
    ctx.beginPath()
    ctx.moveTo(drawStartPos.current.x, drawStartPos.current.y)
    ctx.lineTo(x, y)
    ctx.stroke()
    
    drawStartPos.current.set(x, y)
    
    // Mettre à jour la texture
    if (textureRef.current) {
      textureRef.current.needsUpdate = true
    }
  }, [currentColor])

  // Convertir coordonnées UV en coordonnées canvas
  const uvToCanvas = (uv: THREE.Vector2): THREE.Vector2 => {
    return new THREE.Vector2(
      uv.x * CANVAS_SIZE.width,
      CANVAS_SIZE.height - uv.y * CANVAS_SIZE.height
    )
  }

  // Gestion des événements
  const handlePointerMove = useCallback((e: PointerEvent) => {
    pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    
    if (!isActive || !meshRef.current) return
    
    // Raycast pour trouver la position sur le whiteboard
    raycaster.setFromCamera(pointer.current, camera)
    const intersects = raycaster.intersectObject(meshRef.current)
    
    if (intersects.length > 0 && intersects[0]?.uv) {
      const canvasPos = uvToCanvas(intersects[0].uv)
      
      if (isDrawing) {
        draw(canvasPos.x, canvasPos.y)
      }
    }
  }, [isActive, isDrawing, camera, raycaster, draw])

  const handlePointerDown = useCallback(() => {
    if (!isActive || !meshRef.current) return
    
    raycaster.setFromCamera(pointer.current, camera)
    const intersects = raycaster.intersectObject(meshRef.current)
    
    if (intersects.length > 0 && intersects[0]?.uv) {
      const canvasPos = uvToCanvas(intersects[0].uv)
      drawStartPos.current.copy(canvasPos)
      setIsDrawing(true)
      
      if (contextRef.current) {
        contextRef.current.beginPath()
      }
    }
  }, [isActive, camera, raycaster])

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false)
    if (contextRef.current) {
      contextRef.current.closePath()
    }
  }, [])

  // Event listeners
  useEffect(() => {
    if (!isActive) return
    
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointerup', handlePointerUp)
    
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isActive, handlePointerMove, handlePointerDown, handlePointerUp])

  return (
    <group
      ref={groupRef}
      name="whiteboard"
      onPointerOver={() => groupRef.current && onHover([groupRef.current])}
      onPointerOut={() => onHover([])}
      onClick={() => !isActive && onSelect('whiteboard')}
    >
      {/* Modèle du tableau */}
      <primitive ref={whiteboardModelRef} object={scene} />

      {/* Surface de dessin */}
      <mesh
        ref={meshRef}
        position={WHITEBOARD_POSITION}
      >
        <planeGeometry args={[PLANE_SIZE.width, PLANE_SIZE.height]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* Boutons de couleur (visible quand actif) */}
      {isActive && (
        <Html position={[-3.4, 4.5, -4.6]} center>
          <div style={{
            display: 'flex',
            gap: '8px',
            background: 'rgba(0,0,0,0.7)',
            padding: '8px 12px',
            borderRadius: '8px',
          }}>
            {Object.keys(MARKER_COLORS).map((color) => {
              const config = MARKER_COLORS[color]
              return (
                <button
                  key={color}
                  onClick={() => setCurrentColor(color)}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    border: currentColor === color ? '3px solid white' : '2px solid #666',
                    background: color === 'eraser' ? '#f0f0f0' : config?.color ?? 'black',
                    cursor: 'pointer',
                  }}
                  title={color === 'eraser' ? 'Gomme' : color}
                />
              )
            })}
          </div>
        </Html>
      )}
    </group>
  )
}

// Preload
useGLTF.preload('/pierre/assets/models/whiteboard.glb')

export default Whiteboard

