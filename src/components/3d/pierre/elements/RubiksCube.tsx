/**
 * RubiksCube - Mini-jeu Rubik's Cube interactif.
 *
 * Fonctionnalités:
 * - Rotation des couches par glisser-déposer
 * - Détection automatique de la victoire
 * - Animation fluide avec GSAP
 * - Confetti à la résolution
 * - Déplacement au centre de l'écran quand actif (comme Joan)
 */

import { useRef, useState, useEffect, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { usePierreStore, type PierreStage } from '../stores/pierreStore'

// Configuration - Position originale sur le bureau
const RUBIK_ORIGINAL_POSITION = new THREE.Vector3(-0.67868, 1.499, -3.92849)
const RUBIK_ORIGINAL_SCALE = 0.021432
const RUBIK_ORIGINAL_ROTATION = new THREE.Euler(Math.PI, (-152.484 * Math.PI) / 180, Math.PI)

// Position centrale quand actif (comme Joan's reubicateCube)
const RUBIK_CENTER_POSITION = new THREE.Vector3(0, 0, 0)
const RUBIK_CENTER_SCALE = 1
const RUBIK_CENTER_ROTATION = new THREE.Euler(0, 0, 0)

interface CubeInfo {
  row: number
  col: number
  depth: number
  colors: {
    F: string | null
    B: string | null
    L: string | null
    R: string | null
    U: string | null
    D: string | null
  }
}

interface RubiksCubeProps {
  onHover: (objects: THREE.Object3D[]) => void
  onSelect: (stage: PierreStage) => void
}

/**
 * Composant Rubik's Cube interactif.
 */
export function RubiksCube({ onHover, onSelect }: RubiksCubeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const pivotRef = useRef<THREE.Object3D>(new THREE.Object3D())
  const { camera, raycaster } = useThree()

  // États
  const [isActive, setIsActive] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [isPlaced, setIsPlaced] = useState(true) // true = sur le bureau, false = au centre
  const [cubies, setCubies] = useState<THREE.Object3D[]>([])

  // Store
  const currentStage = usePierreStore((s) => s.currentStage)
  const setRubikSolved = usePierreStore((s) => s.setRubikSolved)

  // Charger le modèle
  const { scene } = useGLTF('/pierre/assets/models/Rubik.glb')

  // Refs pour le drag
  const isDragging = useRef(false)
  const startPosition = useRef(new THREE.Vector2())
  const clickedCubie = useRef<THREE.Object3D | null>(null)
  const clickedNormal = useRef<{ layer: string; sign: number } | null>(null)
  const pointer = useRef(new THREE.Vector2())

  // Charger les données des cubies et initialiser
  useEffect(() => {
    if (!scene) return

    fetch('/pierre/assets/json/cubeInfo.json')
      .then((res) => res.json())
      .then((cubeInfo: Record<string, CubeInfo>) => {
        const newCubies: THREE.Object3D[] = []

        for (let i = scene.children.length - 1; i >= 0; i--) {
          const currentChild = scene.children[i]
          if (!currentChild) continue

          const info = cubeInfo[i.toString()]
          if (info) {
            ;(currentChild as any).row = info.row
            ;(currentChild as any).col = info.col
            ;(currentChild as any).depth = info.depth
            ;(currentChild as any).colors = { ...info.colors }
            ;(currentChild as any).isRubik = true

            newCubies.push(currentChild)
          }
        }

        setCubies(newCubies)
      })
      .catch((err) => console.warn('Erreur chargement cubeInfo.json:', err))
  }, [scene])

  /**
   * Déplace le cube au centre de l'écran (comme Joan's reubicateCube).
   */
  const reubicateCube = useCallback(() => {
    if (!groupRef.current) return

    setIsPlaced(false)

    // Rendre le cube transparent et devant tout (comme Joan)
    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.renderOrder = 999
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial
          mat.transparent = true
          mat.depthTest = false
        }
      }
    })

    // Animer chaque cubie vers le centre (position relative 0,0,0)
    cubies.forEach((cubie) => {
      gsap.to(cubie.position, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1,
        ease: 'sine.out',
      })
    })

    // Animer le groupe vers le centre
    gsap.to(groupRef.current.scale, {
      x: RUBIK_CENTER_SCALE,
      y: RUBIK_CENTER_SCALE,
      z: RUBIK_CENTER_SCALE,
      duration: 1,
      ease: 'sine.out',
    })

    gsap.to(groupRef.current.position, {
      x: RUBIK_CENTER_POSITION.x,
      y: RUBIK_CENTER_POSITION.y,
      z: RUBIK_CENTER_POSITION.z,
      duration: 1,
      ease: 'sine.out',
    })

    gsap.to(groupRef.current.rotation, {
      x: RUBIK_CENTER_ROTATION.x,
      y: RUBIK_CENTER_ROTATION.y,
      z: RUBIK_CENTER_ROTATION.z,
      duration: 1,
      ease: 'sine.out',
      onComplete: () => {
        setIsActive(true)
      },
    })
  }, [cubies])

  /**
   * Remet le cube sur le bureau (position originale).
   */
  const resetOriginalConfig = useCallback(() => {
    if (!groupRef.current) return

    // Animer chaque cubie vers sa position originale
    cubies.forEach((cubie) => {
      gsap.to(cubie.position, {
        x: RUBIK_ORIGINAL_POSITION.x,
        y: RUBIK_ORIGINAL_POSITION.y,
        z: RUBIK_ORIGINAL_POSITION.z,
        duration: 1,
        ease: 'sine.out',
        onComplete: () => {
          setIsPlaced(true)
          // Restaurer le rendu normal
          groupRef.current?.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh
              mesh.renderOrder = 0
              if (mesh.material) {
                const mat = mesh.material as THREE.MeshStandardMaterial
                mat.transparent = false
                mat.depthTest = true
              }
            }
          })
        },
      })
    })

    gsap.to(groupRef.current.scale, {
      x: RUBIK_ORIGINAL_SCALE,
      y: RUBIK_ORIGINAL_SCALE,
      z: RUBIK_ORIGINAL_SCALE,
      duration: 1,
      ease: 'sine.out',
    })

    gsap.to(groupRef.current.position, {
      x: RUBIK_ORIGINAL_POSITION.x,
      y: RUBIK_ORIGINAL_POSITION.y,
      z: RUBIK_ORIGINAL_POSITION.z,
      duration: 1,
      ease: 'sine.out',
    })

    gsap.to(groupRef.current.rotation, {
      x: RUBIK_ORIGINAL_ROTATION.x,
      y: RUBIK_ORIGINAL_ROTATION.y,
      z: RUBIK_ORIGINAL_ROTATION.z,
      duration: 1,
      ease: 'sine.out',
    })
  }, [cubies])

  // Activer/désactiver selon le stage
  useEffect(() => {
    const shouldBeActive = currentStage === 'rubikGroup'

    if (shouldBeActive && !isActive && isPlaced) {
      // Activer: déplacer au centre
      reubicateCube()
    } else if (!shouldBeActive && !isPlaced) {
      // Désactiver: remettre sur le bureau
      setIsActive(false)
      resetOriginalConfig()
    }
  }, [currentStage, isActive, isPlaced, reubicateCube, resetOriginalConfig])

  // Gestion du pointeur
  const handlePointerMove = useCallback((e: PointerEvent) => {
    pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1
  }, [])

  const handlePointerDown = useCallback(() => {
    if (!isActive || isMoving) return

    raycaster.setFromCamera(pointer.current, camera)
    const intersects = raycaster.intersectObjects(cubies, true)

    if (intersects.length > 0) {
      const hit = intersects[0]
      if (hit && hit.object.parent && (hit.object.parent as any).isRubik) {
        clickedCubie.current = hit.object.parent
        startPosition.current.copy(pointer.current)

        if (hit.face) {
          const normal = hit.face.normal.clone()
          normal.transformDirection(hit.object.parent.matrixWorld)
          clickedNormal.current = getRealNormal(normal)
        }

        isDragging.current = true
      }
    }
  }, [isActive, isMoving, camera, raycaster, cubies])

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current || !clickedCubie.current || !clickedNormal.current) {
      isDragging.current = false
      return
    }

    const distX = pointer.current.x - startPosition.current.x
    const distY = pointer.current.y - startPosition.current.y

    if (Math.abs(distX) < 0.01 && Math.abs(distY) < 0.01) {
      isDragging.current = false
      return
    }

    const vertical = Math.abs(distX) <= Math.abs(distY)
    const positiveX = distX >= 0
    const positiveY = distY >= 0
    const cubie = clickedCubie.current as any
    const normal = clickedNormal.current

    let layer: 'row' | 'col' | 'depth' = 'row'
    let number = 1
    let orientation = 0

    if (vertical) {
      if (normal.layer === 'x') {
        layer = 'depth'
        number = cubie.depth
        orientation = normal.sign === 0 ? (positiveY ? 0 : 1) : positiveY ? 1 : 0
      } else {
        layer = 'col'
        number = cubie.col
        orientation = normal.sign === 0 ? (positiveY ? 1 : 0) : positiveY ? 0 : 1
      }
    } else {
      if (normal.layer === 'x') {
        layer = 'row'
        number = cubie.row
        orientation = positiveX ? 1 : 0
      } else if (normal.layer === 'y') {
        layer = 'depth'
        number = cubie.depth
        orientation = normal.sign === 0 ? (positiveX ? 1 : 0) : positiveX ? 0 : 1
      } else {
        layer = 'row'
        number = cubie.row
        orientation = positiveX ? 1 : 0
      }
    }

    rotateCubeLayer(layer, number, orientation)

    isDragging.current = false
    clickedCubie.current = null
    clickedNormal.current = null
  }, [])

  // Rotation d'une couche
  const rotateCubeLayer = useCallback(
    (layer: 'row' | 'col' | 'depth', number: number, orientation: number) => {
      if (isMoving || !groupRef.current) return

      setIsMoving(true)

      const cubiesToRotate = cubies.filter((cubie: any) => {
        if (layer === 'row') return cubie.row === number
        if (layer === 'col') return cubie.col === number
        return cubie.depth === number
      })

      let axis: 'x' | 'y' | 'z' = 'y'
      if (layer === 'row') axis = 'y'
      else if (layer === 'col') axis = 'x'
      else axis = 'z'

      const targetAngle = ((orientation ? 1 : -1) * Math.PI) / 2
      const pivot = pivotRef.current

      // Position du pivot au centre du cube (0,0,0 quand au centre)
      pivot.position.set(0, 0, 0)
      pivot.rotation.set(0, 0, 0)
      pivot.updateMatrixWorld()

      if (groupRef.current && !groupRef.current.children.includes(pivot)) {
        groupRef.current.add(pivot)
      }

      cubiesToRotate.forEach((cubie) => {
        pivot.attach(cubie)
      })

      gsap.to(pivot.rotation, {
        [axis]: targetAngle,
        duration: 0.5,
        ease: 'power1.inOut',
        onComplete: () => {
          pivot.updateMatrixWorld()
          cubiesToRotate.forEach((cubie: any) => {
            cubie.updateMatrixWorld()
            groupRef.current?.attach(cubie)
            updateCubieAfterRotation(cubie, layer, orientation)
          })

          setIsMoving(false)
          checkIfSolved()
        },
      })
    },
    [cubies, isMoving]
  )

  // Mettre à jour un cubie après rotation
  const updateCubieAfterRotation = (cubie: any, layer: string, orientation: number) => {
    const rotateValues = (v1: number, v2: number) => {
      let newV1, newV2
      if (v1 === 1) newV2 = 3
      else if (v1 === 3) newV2 = 1
      else newV2 = v1
      newV1 = v2
      return { newV1, newV2 }
    }

    const updateColors = (colors: any, order: string[]) => {
      const original = { ...colors }
      order.forEach((color, i) => {
        const nextIndex = (i + 1) % order.length
        const next = order[nextIndex]
        if (next !== undefined && color !== undefined) {
          colors[next] = original[color]
        }
      })
      return colors
    }

    let result
    if (layer === 'row') {
      if (orientation === 1) {
        result = rotateValues(cubie.depth, cubie.col)
        cubie.depth = result.newV1
        cubie.col = result.newV2
        cubie.colors = updateColors(cubie.colors, ['F', 'R', 'B', 'L'])
      } else {
        result = rotateValues(cubie.col, cubie.depth)
        cubie.col = result.newV1
        cubie.depth = result.newV2
        cubie.colors = updateColors(cubie.colors, ['F', 'L', 'B', 'R'])
      }
    } else if (layer === 'col') {
      if (orientation === 1) {
        result = rotateValues(cubie.depth, cubie.row)
        cubie.depth = result.newV1
        cubie.row = result.newV2
        cubie.colors = updateColors(cubie.colors, ['F', 'D', 'B', 'U'])
      } else {
        result = rotateValues(cubie.row, cubie.depth)
        cubie.row = result.newV1
        cubie.depth = result.newV2
        cubie.colors = updateColors(cubie.colors, ['F', 'U', 'B', 'D'])
      }
    } else {
      if (orientation === 1) {
        result = rotateValues(cubie.col, cubie.row)
        cubie.col = result.newV1
        cubie.row = result.newV2
        cubie.colors = updateColors(cubie.colors, ['R', 'U', 'L', 'D'])
      } else {
        result = rotateValues(cubie.row, cubie.col)
        cubie.row = result.newV1
        cubie.col = result.newV2
        cubie.colors = updateColors(cubie.colors, ['R', 'D', 'L', 'U'])
      }
    }
  }

  // Vérifier si le cube est résolu
  const checkIfSolved = useCallback(() => {
    const faces: Record<string, string | null> = { U: null, D: null, L: null, R: null, F: null, B: null }
    let solved = true

    cubies.forEach((cubie: any) => {
      if (!cubie.colors) return

      const checks = [
        { pos: 'depth', val: 1, face: 'F' },
        { pos: 'depth', val: 3, face: 'B' },
        { pos: 'row', val: 1, face: 'U' },
        { pos: 'row', val: 3, face: 'D' },
        { pos: 'col', val: 1, face: 'L' },
        { pos: 'col', val: 3, face: 'R' },
      ]

      checks.forEach(({ pos, val, face }) => {
        if (cubie[pos] === val && cubie.colors[face]) {
          if (faces[face] === null) {
            faces[face] = cubie.colors[face]
          } else if (faces[face] !== cubie.colors[face]) {
            solved = false
          }
        }
      })
    })

    if (solved && cubies.length > 0) {
      setRubikSolved(true)
      onSelect('default')
    }
  }, [cubies, setRubikSolved, onSelect])

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
      name="rubikGroup"
      position={RUBIK_ORIGINAL_POSITION.toArray()}
      scale={RUBIK_ORIGINAL_SCALE}
      rotation={[RUBIK_ORIGINAL_ROTATION.x, RUBIK_ORIGINAL_ROTATION.y, RUBIK_ORIGINAL_ROTATION.z]}
      onPointerOver={() => groupRef.current && onHover([groupRef.current])}
      onPointerOut={() => onHover([])}
      onClick={() => !isActive && isPlaced && onSelect('rubikGroup')}
    >
      {cubies.map((cubie, i) => (
        <primitive key={i} object={cubie} />
      ))}

      {/* Texte d'instruction (visible quand actif et au centre) */}
      {isActive && !isPlaced && (
        <Html position={[0, -2.5, 0]} center>
          <div
            style={{
              color: '#f5a623',
              fontFamily: "'Caveat', cursive",
              fontSize: '24px',
              fontStyle: 'italic',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            Click and drag anywhere on the cube to rotate it in that direction.
          </div>
        </Html>
      )}
    </group>
  )
}

/**
 * Calcule la direction normale dominante.
 */
function getRealNormal(normal: THREE.Vector3): { layer: string; sign: number } {
  if (Math.abs(normal.x) > Math.abs(normal.y)) {
    if (Math.abs(normal.z) > Math.abs(normal.x)) {
      return { layer: 'z', sign: normal.z >= 0 ? 1 : 0 }
    }
    return { layer: 'x', sign: normal.x >= 0 ? 1 : 0 }
  }
  if (Math.abs(normal.z) > Math.abs(normal.y)) {
    return { layer: 'z', sign: normal.z >= 0 ? 1 : 0 }
  }
  return { layer: 'y', sign: normal.y >= 0 ? 1 : 0 }
}

// Preload
useGLTF.preload('/pierre/assets/models/Rubik.glb')

export default RubiksCube
