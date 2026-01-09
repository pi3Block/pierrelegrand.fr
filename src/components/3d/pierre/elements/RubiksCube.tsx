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
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { usePierreStore, type PierreStage } from '../stores/pierreStore'
import { PIERRE } from '@config/assetPaths'

// Configuration - Position originale sur le bureau
const RUBIK_ORIGINAL_POSITION = new THREE.Vector3(-0.67868, 1.499, -3.92849)
const RUBIK_ORIGINAL_SCALE = 0.021432
const RUBIK_ORIGINAL_ROTATION = new THREE.Euler(Math.PI, (-152.484 * Math.PI) / 180, Math.PI)

// Position centrale quand en mode jeu (après double clic)
// Position sur la ligne de vue caméra(-23,17,23) → target(0,2,0), à ~30% du chemin
const RUBIK_CENTER_POSITION = new THREE.Vector3(-16, 12.5, 16)
const RUBIK_CENTER_SCALE = 0.08
const RUBIK_CENTER_ROTATION = new THREE.Euler(0.3, 0.5, 0)

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

  // États
  const [isActive, setIsActive] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [isPlaced, setIsPlaced] = useState(true) // true = sur le bureau, false = au centre
  const [_cubies, setCubies] = useState<THREE.Object3D[]>([])

  // Store
  const currentStage = usePierreStore((s) => s.currentStage)
  const setRubikSolved = usePierreStore((s) => s.setRubikSolved)
  const setShuffleRubikCallback = usePierreStore((s) => s.setShuffleRubikCallback)
  const setIsRubikShuffling = usePierreStore((s) => s.setIsRubikShuffling)

  // Charger le modèle
  const { scene } = useGLTF(PIERRE.MODELS.RUBIK)

  // Refs pour le drag
  const isDragging = useRef(false)
  const startPosition = useRef(new THREE.Vector2())
  const clickedCubie = useRef<THREE.Object3D | null>(null)
  const clickedNormal = useRef<{ layer: string; sign: number } | null>(null)
  const pointer = useRef(new THREE.Vector2())

  // Ref pour éviter de recharger les cubies
  const cubiesLoaded = useRef(false)

  // Ref pour éviter les clics multiples pendant l'animation
  const isAnimating = useRef(false)

  // Refs pour le shuffle
  const shuffleQueueRef = useRef<Array<{ layer: 'row' | 'col' | 'depth'; number: number; orientation: number }>>([])
  const isShufflingRef = useRef(false)

  // Charger les données des cubies et initialiser
  useEffect(() => {
    if (!scene || !groupRef.current || cubiesLoaded.current) return

    // Vérifier qu'il y a des enfants à traiter
    if (scene.children.length === 0) {
      return
    }

    cubiesLoaded.current = true

    console.log('[RubiksCube] 🎲 Fetching cubeInfo.json...')
    fetch(PIERRE.DATA.CUBE_INFO)
      .then((res) => {
        console.log('[RubiksCube] 📥 Response status:', res.status, res.ok)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((cubeInfo: Record<string, CubeInfo>) => {
        console.log('[RubiksCube] ✅ cubeInfo loaded, entries:', Object.keys(cubeInfo).length)
        const newCubies: THREE.Object3D[] = []

        // Clone les enfants car on va les déplacer
        const children = [...scene.children]
        for (let i = children.length - 1; i >= 0; i--) {
          const currentChild = children[i]
          if (!currentChild) continue

          const info = cubeInfo[i.toString()]
          if (info) {
            ;(currentChild as any).row = info.row
            ;(currentChild as any).col = info.col
            ;(currentChild as any).depth = info.depth
            ;(currentChild as any).colors = { ...info.colors }
            ;(currentChild as any).isRubik = true

            // Marquer comme interactif pour le raycaster filtering
            currentChild.userData.interactive = true

            // Attacher au groupe
            groupRef.current!.add(currentChild)
            newCubies.push(currentChild)
          }
        }

        setCubies(newCubies)
      })
      .catch((err) => console.error('[RubiksCube] ❌ Erreur chargement cubeInfo.json:', err))
  }, [scene])

  /**
   * Déplace le cube au centre de l'écran (comme Joan's reubicateCube).
   * IMPORTANT: On anime seulement le GROUPE, pas les cubies individuellement.
   * Les cubies gardent leur position relative pour former le cube.
   */
  const reubicateCube = useCallback(() => {
    if (!groupRef.current) {
      return
    }

    setIsPlaced(false)

    // Rendre le cube devant tout mais garder depthTest pour le raycaster
    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.renderOrder = 999
        // NE PAS désactiver depthTest, sinon le raycaster ne fonctionne plus
      }
    })

    // Animer le GROUPE vers le centre (pas les cubies individuellement!)
    const group = groupRef.current

    gsap.to(group.scale, {
      x: RUBIK_CENTER_SCALE,
      y: RUBIK_CENTER_SCALE,
      z: RUBIK_CENTER_SCALE,
      duration: 1,
      ease: 'sine.out',
    })

    gsap.to(group.position, {
      x: RUBIK_CENTER_POSITION.x,
      y: RUBIK_CENTER_POSITION.y,
      z: RUBIK_CENTER_POSITION.z,
      duration: 1,
      ease: 'sine.out',
    })

    gsap.to(group.rotation, {
      x: RUBIK_CENTER_ROTATION.x,
      y: RUBIK_CENTER_ROTATION.y,
      z: RUBIK_CENTER_ROTATION.z,
      duration: 1,
      ease: 'sine.out',
      onComplete: () => {
        setIsActive(true)
        isAnimating.current = false
      },
    })
  }, [])

  /**
   * Remet le cube sur le bureau (position originale).
   * IMPORTANT: On anime seulement le GROUPE, pas les cubies individuellement.
   */
  const resetOriginalConfig = useCallback(() => {
    if (!groupRef.current) return

    // Animer le GROUPE vers sa position originale
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
      onComplete: () => {
        setIsPlaced(true)
        isAnimating.current = false
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
  }, [])

  // Réagir aux changements de stage (entrée/sortie du mode rubikGroup)
  useEffect(() => {
    // Si on entre en mode rubikGroup depuis la bannière (pas encore actif)
    if (currentStage === 'rubikGroup' && !isActive && isPlaced && !isAnimating.current) {
      console.log('[RubiksCube] 📍 Entering rubikGroup from banner - reubicating cube')
      isAnimating.current = true
      reubicateCube()
    }
    // Si on quitte le mode rubikGroup mais qu'on est encore actif
    else if (currentStage !== 'rubikGroup' && isActive) {
      setIsActive(false)
      // Remettre le cube sur le bureau seulement s'il n'est pas déjà placé
      if (!isPlaced) {
        resetOriginalConfig()
      }
    }
  }, [currentStage, isActive, isPlaced, resetOriginalConfig, reubicateCube])

  // Gestion du pointeur
  const handlePointerMove = useCallback((e: PointerEvent) => {
    pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1
  }, [])

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
    if (!groupRef.current) return

    const allCubies = groupRef.current.children.filter((child: any) => child.isRubik)
    const faces: Record<string, string | null> = { U: null, D: null, L: null, R: null, F: null, B: null }
    let solved = true

    allCubies.forEach((cubie: any) => {
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

    if (solved && allCubies.length > 0) {
      setRubikSolved(true)

      // Attendre 2.5 secondes pour la célébration AVANT de revenir au bureau
      setTimeout(() => {
        onSelect('default')
        // Réinitialiser après un délai pour permettre de rejouer
        setTimeout(() => {
          setRubikSolved(false)
        }, 1000)
      }, 2500)
    }
  }, [setRubikSolved, onSelect])

  // Rotation d'une couche
  const rotateCubeLayer = useCallback(
    (layer: 'row' | 'col' | 'depth', number: number, orientation: number) => {
      if (isMoving || !groupRef.current) {
        return
      }

      // Utiliser groupRef.current.children pour avoir la liste à jour (pas cubies de l'état)
      const allCubies = groupRef.current.children.filter((child: any) => child.isRubik)

      setIsMoving(true)

      const cubiesToRotate = allCubies.filter((cubie: any) => {
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
    [isMoving, checkIfSolved]
  )

  /**
   * Exécute le prochain mouvement de la file de shuffle.
   * Version rapide de rotateCubeLayer (0.12s au lieu de 0.5s).
   */
  const executeNextShuffleMove = useCallback(() => {
    if (shuffleQueueRef.current.length === 0) {
      isShufflingRef.current = false
      setIsMoving(false)
      setIsRubikShuffling(false)
      return
    }

    const move = shuffleQueueRef.current.shift()!
    if (!groupRef.current) return

    const allCubies = groupRef.current.children.filter((child: any) => child.isRubik)

    const cubiesToRotate = allCubies.filter((cubie: any) => {
      if (move.layer === 'row') return cubie.row === move.number
      if (move.layer === 'col') return cubie.col === move.number
      return cubie.depth === move.number
    })

    let axis: 'x' | 'y' | 'z' = 'y'
    if (move.layer === 'row') axis = 'y'
    else if (move.layer === 'col') axis = 'x'
    else axis = 'z'

    const targetAngle = ((move.orientation ? 1 : -1) * Math.PI) / 2
    const pivot = pivotRef.current

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
      duration: 0.12,
      ease: 'power1.inOut',
      onComplete: () => {
        pivot.updateMatrixWorld()
        cubiesToRotate.forEach((cubie: any) => {
          cubie.updateMatrixWorld()
          groupRef.current?.attach(cubie)
          updateCubieAfterRotation(cubie, move.layer, move.orientation)
        })

        // Continuer avec le prochain mouvement
        executeNextShuffleMove()
      },
    })
  }, [setIsRubikShuffling])

  /**
   * Mélange le cube avec 20 mouvements aléatoires.
   */
  const shuffleCube = useCallback(() => {
    if (isMoving || isShufflingRef.current || !groupRef.current) return

    isShufflingRef.current = true
    setIsMoving(true)
    setIsRubikShuffling(true)

    // Générer 20 mouvements aléatoires
    const moves: Array<{ layer: 'row' | 'col' | 'depth'; number: number; orientation: number }> = []
    const layers: Array<'row' | 'col' | 'depth'> = ['row', 'col', 'depth']

    for (let i = 0; i < 20; i++) {
      moves.push({
        layer: layers[Math.floor(Math.random() * 3)]!,
        number: Math.floor(Math.random() * 3) + 1, // 1, 2, ou 3
        orientation: Math.floor(Math.random() * 2), // 0 ou 1
      })
    }

    shuffleQueueRef.current = moves
    executeNextShuffleMove()
  }, [isMoving, executeNextShuffleMove, setIsRubikShuffling])

  // Enregistrer le callback shuffle dans le store quand le cube est actif
  useEffect(() => {
    console.log('[DEBUG] RubiksCube useEffect - isActive:', isActive)
    if (isActive) {
      console.log('[DEBUG] Registering shuffle callback')
      // Créer la fonction callback
      const callback = () => {
        console.log('[DEBUG] Shuffle callback executed!')
        shuffleCube()
      }
      setShuffleRubikCallback(callback)
    } else {
      console.log('[DEBUG] Clearing shuffle callback')
      setShuffleRubikCallback(null)
    }
    return () => {
      setShuffleRubikCallback(null)
    }
  }, [isActive, shuffleCube, setShuffleRubikCallback])

  // Handler R3F pour pointerdown sur le cube (en mode jeu)
  const handleR3FPointerDown = useCallback((e: any) => {
    if (!isActive || isMoving) return

    // Empêcher la propagation pour éviter les conflits
    e.stopPropagation()

    const hit = e.intersections[0]
    if (!hit) return

    // Chercher le cubie parent qui a isRubik = true
    let cubie: THREE.Object3D | null = hit.object
    while (cubie && !(cubie as any).isRubik) {
      cubie = cubie.parent
    }

    if (cubie && (cubie as any).isRubik) {
      clickedCubie.current = cubie
      startPosition.current.set(
        (e.nativeEvent.clientX / window.innerWidth) * 2 - 1,
        -(e.nativeEvent.clientY / window.innerHeight) * 2 + 1
      )

      if (hit.face) {
        const normal = hit.face.normal.clone()
        normal.transformDirection(cubie.matrixWorld)
        clickedNormal.current = getRealNormal(normal)
      }

      isDragging.current = true
    }
  }, [isActive, isMoving])

  // Handler pour pointerup sur window (capture le relâchement même hors du cube)
  const handleWindowPointerUp = useCallback((e: PointerEvent) => {
    if (!isDragging.current || !clickedCubie.current || !clickedNormal.current) {
      isDragging.current = false
      return
    }

    const currentPointer = {
      x: (e.clientX / window.innerWidth) * 2 - 1,
      y: -(e.clientY / window.innerHeight) * 2 + 1
    }

    const distX = currentPointer.x - startPosition.current.x
    const distY = currentPointer.y - startPosition.current.y

    if (Math.abs(distX) < 0.01 && Math.abs(distY) < 0.01) {
      isDragging.current = false
      clickedCubie.current = null
      clickedNormal.current = null
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
  }, [rotateCubeLayer])

  // Event listeners sur window pour capturer pointermove et pointerup partout
  useEffect(() => {
    if (!isActive) return

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handleWindowPointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handleWindowPointerUp)
    }
  }, [isActive, handlePointerMove, handleWindowPointerUp])

  // Handler de clic sur le cube
  const handleCubeClick = useCallback((e?: any) => {
    // Stopper la propagation pour éviter les événements parasites
    e?.stopPropagation()

    // Bloquer si déjà en animation ou en mode jeu
    if (isActive || isAnimating.current) return

    // Comme Joan : un seul clic active directement le mode jeu
    // Le cube se déplace au centre et la scène disparaît
    if (currentStage !== 'rubikGroup' && isPlaced) {
      isAnimating.current = true
      reubicateCube()
      onSelect('rubikGroup')
    }
  }, [isActive, currentStage, isPlaced, reubicateCube, onSelect])

  // Désactiver le hover quand on n'est pas en vue default
  const isInDefaultView = currentStage === 'default'

  // Handlers mémorisés pour éviter la GC pressure des fonctions inline
  const handlePointerOver = useCallback(() => {
    if (!isActive && isInDefaultView && groupRef.current) {
      onHover([groupRef.current])
    }
  }, [isActive, isInDefaultView, onHover])

  const handlePointerOut = useCallback(() => {
    if (!isActive && isInDefaultView) {
      onHover([])
    }
  }, [isActive, isInDefaultView, onHover])

  // Cacher le Rubik's Cube en mode pingpong (visible=false au lieu de null pour préserver les refs)
  const shouldHideRubik = currentStage === 'pingpong'

  return (
    <group
      ref={groupRef}
      name="rubikGroup"
      visible={!shouldHideRubik}
      position={RUBIK_ORIGINAL_POSITION.toArray()}
      scale={RUBIK_ORIGINAL_SCALE}
      rotation={[RUBIK_ORIGINAL_ROTATION.x, RUBIK_ORIGINAL_ROTATION.y, RUBIK_ORIGINAL_ROTATION.z]}
      onPointerOver={!shouldHideRubik ? handlePointerOver : undefined}
      onPointerOut={!shouldHideRubik ? handlePointerOut : undefined}
      onClick={!isActive && !shouldHideRubik ? handleCubeClick : undefined}
      onPointerDown={isActive ? handleR3FPointerDown : undefined}
    >
      {/* Les cubies sont ajoutés directement au groupe via groupRef.current.add() dans useEffect */}
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
useGLTF.preload(PIERRE.MODELS.RUBIK)

export default RubiksCube
