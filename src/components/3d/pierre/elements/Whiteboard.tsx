/**
 * Whiteboard - Tableau blanc collaboratif interactif.
 *
 * Fonctionnalités:
 * - Dessin avec différentes couleurs (marqueurs)
 * - Gomme pour effacer
 * - Canvas 2D mappé sur une texture 3D
 * - Raycasting UV pour le positionnement précis
 * - Synchronisation collaborative avec le serveur (strokes JSON)
 * - Sons de marqueur et gomme
 */

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import { usePierreStore, type PierreStage } from '../stores/pierreStore'
import { useWhiteboardStore } from '@stores/whiteboardStore'
import { pierreAudioManager } from '../services/PierreAudioManager'
import { PIERRE } from '@config/assetPaths'
import type { ServerStroke, StrokeData } from '@api/whiteboard'

// Configuration
const WHITEBOARD_POSITION: [number, number, number] = [-3.3927, 3.18774, -4.61366]
const CANVAS_SIZE = { width: 2048, height: 1024 }
const PLANE_SIZE = { width: 2.6, height: 1.82 }

// Image initiale du whiteboard (fallback si serveur non disponible)
const TEXTURE_PAINT_URL = PIERRE.TEXTURES.TEXTURE_PAINT

// Couleurs des marqueurs
const MARKER_COLORS: Record<string, { color: string; hex: string; width: number }> = {
  black: { color: 'black', hex: '#000000', width: 8 },
  red: { color: 'red', hex: '#FF0000', width: 8 },
  green: { color: 'darkgreen', hex: '#006400', width: 8 },
  blue: { color: 'blue', hex: '#0000FF', width: 8 },
  eraser: { color: 'white', hex: '#FFFFFF', width: 50 },
}

interface WhiteboardProps {
  onHover: (objects: THREE.Object3D[]) => void
  onSelect: (stage: PierreStage) => void
}

/**
 * Dessine un stroke sur le canvas
 */
function drawStrokeOnCanvas(
  ctx: CanvasRenderingContext2D,
  stroke: StrokeData | ServerStroke
) {
  if (stroke.points.length < 2) return

  ctx.strokeStyle = stroke.tool === 'eraser' ? '#FFFFFF' : stroke.color
  ctx.lineWidth = stroke.width
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  ctx.beginPath()
  const firstPoint = stroke.points[0]!
  ctx.moveTo(firstPoint.x, firstPoint.y)

  for (let i = 1; i < stroke.points.length; i++) {
    const point = stroke.points[i]!
    ctx.lineTo(point.x, point.y)
  }

  ctx.stroke()
}

/**
 * Composant Whiteboard collaboratif interactif.
 */
export function Whiteboard({ onHover, onSelect }: WhiteboardProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const whiteboardModelRef = useRef<THREE.Object3D>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const textureRef = useRef<THREE.CanvasTexture | null>(null)

  // Buffer pour les points du stroke en cours
  const strokePointsRef = useRef<{ x: number; y: number }[]>([])

  const { camera, raycaster } = useThree()
  const cameraRef = useRef(camera)
  const raycasterRef = useRef(raycaster)
  cameraRef.current = camera
  raycasterRef.current = raycaster

  // États locaux
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedColor, setSelectedColor] = useState('black')
  const drawStartPos = useRef(new THREE.Vector2(-1, -1))
  const pointer = useRef(new THREE.Vector2())

  // Store Pierre
  const currentStage = usePierreStore((s) => s.currentStage)

  // Store Whiteboard (sync collaborative)
  const addStroke = useWhiteboardStore((s) => s.addStroke)
  const loadState = useWhiteboardStore((s) => s.loadState)
  const startPolling = useWhiteboardStore((s) => s.startPolling)
  const stopPolling = useWhiteboardStore((s) => s.stopPolling)
  const syncError = useWhiteboardStore((s) => s.error)

  // Cacher complètement en mode Rubik
  const isHidden = currentStage === 'rubikGroup'
  const isActive = currentStage === 'whiteboard'

  // Charger le modèle du tableau
  const { scene } = useGLTF(PIERRE.MODELS.WHITEBOARD)
  scene.name = 'whiteboard'

  // Initialiser le canvas de dessin
  useEffect(() => {
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

    // Track if server load succeeded (to cancel fallback)
    let serverLoadSucceeded = false
    let fallbackTimeoutId: ReturnType<typeof setTimeout> | null = null

    // Charger l'état depuis le serveur
    loadState()

    // Démarrer le polling pour les mises à jour
    startPolling()

    // Écouter le chargement initial des strokes
    const handleLoad = (e: CustomEvent<{ strokes: ServerStroke[] }>) => {
      if (ctx && e.detail.strokes) {
        // Server load succeeded - cancel fallback
        serverLoadSucceeded = true
        if (fallbackTimeoutId) {
          clearTimeout(fallbackTimeoutId)
          fallbackTimeoutId = null
        }

        // Effacer et redessiner tous les strokes
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height)

        for (const stroke of e.detail.strokes) {
          drawStrokeOnCanvas(ctx, stroke)
        }

        texture.needsUpdate = true
      }
    }

    // Écouter les nouveaux strokes (polling)
    const handleNewStrokes = (e: CustomEvent<{ strokes: ServerStroke[] }>) => {
      if (ctx && e.detail.strokes) {
        for (const stroke of e.detail.strokes) {
          drawStrokeOnCanvas(ctx, stroke)
        }
        texture.needsUpdate = true
      }
    }

    window.addEventListener('whiteboard:load', handleLoad as EventListener)
    window.addEventListener('whiteboard:newStrokes', handleNewStrokes as EventListener)

    // Fallback: charger l'image locale si le serveur n'est pas disponible après 5s
    fallbackTimeoutId = setTimeout(() => {
      // Only load fallback if server didn't respond
      if (serverLoadSucceeded) return

      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => {
        // Double-check server hasn't loaded in the meantime
        if (ctx && !serverLoadSucceeded) {
          ctx.drawImage(image, 0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height)
          texture.needsUpdate = true
        }
      }
      image.src = TEXTURE_PAINT_URL
    }, 5000)

    return () => {
      if (fallbackTimeoutId) clearTimeout(fallbackTimeoutId)
      stopPolling()
      texture.dispose()
      window.removeEventListener('whiteboard:load', handleLoad as EventListener)
      window.removeEventListener('whiteboard:newStrokes', handleNewStrokes as EventListener)
    }
  }, [loadState, startPolling, stopPolling])

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

  // Gestion du changement de couleur avec son
  const handleColorChange = useCallback((color: string) => {
    setSelectedColor(color)

    // Jouer le son approprié
    if (color === 'eraser') {
      pierreAudioManager.play('eraser', { volume: 0.3 })
    } else {
      pierreAudioManager.play('marker_open', { volume: 0.3 })
    }
  }, [])

  // Fonction de dessin (rendu local immédiat)
  const draw = useCallback((x: number, y: number) => {
    const ctx = contextRef.current
    if (!ctx) return

    const config = MARKER_COLORS[selectedColor] ?? MARKER_COLORS.black!
    ctx.strokeStyle = config.color
    ctx.lineWidth = config.width

    ctx.beginPath()
    ctx.moveTo(drawStartPos.current.x, drawStartPos.current.y)
    ctx.lineTo(x, y)
    ctx.stroke()

    drawStartPos.current.set(x, y)

    // Ajouter le point au buffer de stroke
    strokePointsRef.current.push({ x, y })

    // Mettre à jour la texture
    if (textureRef.current) {
      textureRef.current.needsUpdate = true
    }
  }, [selectedColor])

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

    raycasterRef.current.setFromCamera(pointer.current, cameraRef.current)
    const intersects = raycasterRef.current.intersectObject(meshRef.current)

    if (intersects.length > 0 && intersects[0]?.uv) {
      const canvasPos = uvToCanvas(intersects[0].uv)

      if (isDrawing) {
        draw(canvasPos.x, canvasPos.y)
      }
    }
  }, [isActive, isDrawing, draw])

  const handlePointerDown = useCallback(() => {
    if (!isActive || !meshRef.current) return

    raycasterRef.current.setFromCamera(pointer.current, cameraRef.current)
    const intersects = raycasterRef.current.intersectObject(meshRef.current)

    if (intersects.length > 0 && intersects[0]?.uv) {
      const canvasPos = uvToCanvas(intersects[0].uv)
      drawStartPos.current.copy(canvasPos)

      // Initialiser le buffer de stroke avec le premier point
      strokePointsRef.current = [{ x: canvasPos.x, y: canvasPos.y }]

      setIsDrawing(true)

      if (contextRef.current) {
        contextRef.current.beginPath()
      }
    }
  }, [isActive])

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return

    setIsDrawing(false)

    if (contextRef.current) {
      contextRef.current.closePath()
    }

    // Envoyer le stroke au serveur si on a assez de points
    const points = strokePointsRef.current
    if (points.length >= 2) {
      const config = MARKER_COLORS[selectedColor] ?? MARKER_COLORS.black!
      const strokeData: StrokeData = {
        points: points,
        color: config.hex,
        width: config.width,
        tool: selectedColor === 'eraser' ? 'eraser' : 'pen',
      }
      addStroke(strokeData)
    }

    // Réinitialiser le buffer
    strokePointsRef.current = []
  }, [isDrawing, selectedColor, addStroke])

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

  // Ne pas rendre en mode Rubik
  if (isHidden) return null

  // Désactiver le hover quand on n'est pas en vue default
  const isInDefaultView = currentStage === 'default'

  return (
    <group
      ref={groupRef}
      name="whiteboard"
      onPointerOver={() => isInDefaultView && groupRef.current && onHover([groupRef.current])}
      onPointerOut={() => isInDefaultView && onHover([])}
      onClick={() => isInDefaultView && !isActive && onSelect('whiteboard')}
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
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}>
            {/* Indicateur de sync */}
            {syncError && (
              <div style={{
                background: 'rgba(255,100,100,0.9)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                marginBottom: '4px',
              }}>
                {syncError}
              </div>
            )}

            {/* Palette de couleurs */}
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
                    onClick={() => handleColorChange(color)}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      border: selectedColor === color ? '3px solid white' : '2px solid #666',
                      background: color === 'eraser' ? '#f0f0f0' : config?.color ?? 'black',
                      cursor: 'pointer',
                      transition: 'transform 0.1s',
                      transform: selectedColor === color ? 'scale(1.1)' : 'scale(1)',
                    }}
                    title={color === 'eraser' ? 'Gomme' : color.charAt(0).toUpperCase() + color.slice(1)}
                  />
                )
              })}
            </div>

            {/* Info collaborative */}
            <div style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '10px',
              textAlign: 'center',
            }}>
              Tableau collaboratif
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

// Preload
useGLTF.preload(PIERRE.MODELS.WHITEBOARD)

export default Whiteboard
