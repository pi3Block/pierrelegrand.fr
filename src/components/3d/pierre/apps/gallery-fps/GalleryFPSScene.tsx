/**
 * GalleryFPSScene - Scene 3D de la galerie FPS dans RenderTexture.
 *
 * Note: Les overlays HTML ne fonctionnent pas dans RenderTexture.
 * L'UI sera geree via des meshes 3D ou dans le composant parent.
 *
 * IMPORTANT: PointerLockControls ne fonctionne pas dans RenderTexture
 * car il s'attache au document principal. La rotation camera est geree
 * manuellement via les evenements mousemove du document.
 */

import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useGalleryFPSStore } from './stores/galleryFPSStore'
import { useHeadBob } from './hooks/useHeadBob'
import { GalleryRoom } from './components/GalleryRoom'
import { Paintings } from './components/Paintings'
import { Door } from './components/Door'
import { PaintingInfo3D } from './components/PaintingInfo3D'
import { WallText } from './components/WallText'
import { Vases } from './components/Vases'
import { PauseMenu3D } from './ui/PauseMenu3D'
import { FONTS } from '@config/assetPaths'

interface GalleryFPSSceneProps {
  isActive: boolean
  onExit?: () => void
  isMobile?: boolean
}

/**
 * Animation de rotation automatique de la camera quand non actif.
 */
function CameraAnimation({ isActive }: { isActive: boolean }) {
  const { camera } = useThree()
  const angleRef = useRef(0)

  useFrame((_, delta) => {
    if (isActive) return // Pas d'animation auto quand actif

    // Rotation lente autour du centre (rayon réduit pour rester dans la galerie)
    angleRef.current += delta * 0.2
    const radius = 4 // Réduit de 8 à 4 pour rester dans la pièce
    const x = Math.sin(angleRef.current) * radius
    const z = Math.cos(angleRef.current) * radius

    camera.position.set(x, 2, z)
    camera.lookAt(0, 1.5, 0)
  })

  return null
}

/**
 * Crosshair 3D (visible dans la RenderTexture).
 */
function Crosshair3D({ visible }: { visible: boolean }) {
  const { camera } = useThree()
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (!meshRef.current || !visible) return

    // Positionner le crosshair devant la camera
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyQuaternion(camera.quaternion)
    meshRef.current.position.copy(camera.position).add(direction.multiplyScalar(2))
    meshRef.current.quaternion.copy(camera.quaternion)
  })

  if (!visible) return null

  return (
    <mesh ref={meshRef}>
      <ringGeometry args={[0.01, 0.015, 16]} />
      <meshBasicMaterial color="white" transparent opacity={0.8} />
    </mesh>
  )
}

/**
 * Panneau d'information - visible en mode apercu et focus (avant pointer lock).
 */
function EnterPrompt({ visible, isPreview }: { visible: boolean; isPreview: boolean }) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!groupRef.current || !visible) return

    // Positionner devant la camera
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyQuaternion(camera.quaternion)
    groupRef.current.position.copy(camera.position).add(direction.multiplyScalar(3))
    groupRef.current.quaternion.copy(camera.quaternion)
  })

  if (!visible) return null

  return (
    <group ref={groupRef}>
      {/* Fond semi-transparent */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[3, 1.2]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.7} />
      </mesh>

      {/* Titre */}
      <Text
        position={[0, 0.25, 0]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font={FONTS.ROBOTO_LIGHT}
      >
        Art Gallery
      </Text>

      {/* Instruction - change selon le mode */}
      <Text
        position={[0, -0.15, 0]}
        fontSize={0.12}
        color="#4ecdc4"
        anchorX="center"
        anchorY="middle"
        font={FONTS.ROBOTO_LIGHT}
      >
        {isPreview ? 'Cliquez sur le moniteur' : 'Cliquez pour entrer'}
      </Text>

      {/* Controles - seulement en mode focus */}
      {!isPreview && (
        <Text
          position={[0, -0.4, 0]}
          fontSize={0.08}
          color="#888888"
          anchorX="center"
          anchorY="middle"
          font={FONTS.ROBOTO_LIGHT}
        >
          WASD: Deplacer | Souris: Regarder | ESC: Quitter
        </Text>
      )}
    </group>
  )
}

// Configuration du joueur
const PLAYER_HEIGHT = 1.6
const PLAYER_RADIUS = 0.3
const MOVE_SPEED = 4
const MOUSE_SENSITIVITY = 0.002

/**
 * Controleur FPS avec gestion manuelle du pointer lock.
 * Supporte desktop (WASD/souris) et mobile (joystick/touch).
 */
function FPSController({ enabled, isMobile }: { enabled: boolean; isMobile: boolean }) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const { camera } = useThree()

  const isLocked = useGalleryFPSStore((s) => s.isLocked)
  const setIsLocked = useGalleryFPSStore((s) => s.setIsLocked)
  const setIsMoving = useGalleryFPSStore((s) => s.setIsMoving)
  const currentPainting = useGalleryFPSStore((s) => s.currentPainting)
  const joystickInput = useGalleryFPSStore((s) => s.joystickInput)
  const touchRotation = useGalleryFPSStore((s) => s.touchRotation)
  const setTouchRotation = useGalleryFPSStore((s) => s.setTouchRotation)

  // Head bob effect
  const headBob = useHeadBob({ amplitude: 0.03, frequency: 12 })

  // Etat des touches
  const keysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  })

  const velocityRef = useRef(new THREE.Vector3())
  const directionRef = useRef(new THREE.Vector3())
  const currentSpeedRef = useRef(0)

  // Euler pour la rotation camera
  const eulerRef = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))

  // Ref pour tracker isLocked sans re-declencher l'effet
  const isLockedRef = useRef(isLocked)
  isLockedRef.current = isLocked

  // Gestion du pointer lock et de la souris
  // IMPORTANT: Ne PAS mettre isLocked dans les deps sinon le cleanup libere le pointer lock!
  useEffect(() => {
    if (!enabled || isMobile) return

    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement === document.body
      setIsLocked(locked)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isLockedRef.current) return

      // Rotation camera
      eulerRef.current.setFromQuaternion(camera.quaternion)
      eulerRef.current.y -= e.movementX * MOUSE_SENSITIVITY
      eulerRef.current.x -= e.movementY * MOUSE_SENSITIVITY

      // Limiter la rotation verticale
      eulerRef.current.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, eulerRef.current.x))

      camera.quaternion.setFromEuler(eulerRef.current)
    }

    document.addEventListener('pointerlockchange', handlePointerLockChange)
    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
      document.removeEventListener('mousemove', handleMouseMove)
      // Liberer le pointer lock seulement si on desactive le controleur
      if (document.pointerLockElement) {
        document.exitPointerLock()
      }
    }
  }, [enabled, isMobile, setIsLocked, camera])

  // Gestion du clavier
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keysRef.current.forward = true
          break
        case 'KeyS':
        case 'ArrowDown':
          keysRef.current.backward = true
          break
        case 'KeyA':
        case 'ArrowLeft':
          keysRef.current.left = true
          break
        case 'KeyD':
        case 'ArrowRight':
          keysRef.current.right = true
          break
        case 'KeyE':
          // Ouvrir le lien du tableau regarde
          if (currentPainting?.links?.demo) {
            window.open(currentPainting.links.demo, '_blank')
          } else if (currentPainting?.links?.source) {
            window.open(currentPainting.links.source, '_blank')
          }
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keysRef.current.forward = false
          break
        case 'KeyS':
        case 'ArrowDown':
          keysRef.current.backward = false
          break
        case 'KeyA':
        case 'ArrowLeft':
          keysRef.current.left = false
          break
        case 'KeyD':
        case 'ArrowRight':
          keysRef.current.right = false
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [enabled, currentPainting])

  // Mouvement du joueur (desktop + mobile)
  useFrame((_, delta) => {
    // Sur mobile, on n'a pas besoin du pointer lock
    const canMove = isMobile ? enabled : isLocked
    if (!rigidBodyRef.current || !canMove) return

    const rb = rigidBodyRef.current
    const keys = keysRef.current
    const velocity = velocityRef.current
    const direction = directionRef.current

    // Appliquer la rotation tactile (mobile)
    if (isMobile && (touchRotation.x !== 0 || touchRotation.y !== 0)) {
      eulerRef.current.setFromQuaternion(camera.quaternion)
      eulerRef.current.y -= touchRotation.x
      eulerRef.current.x -= touchRotation.y
      eulerRef.current.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, eulerRef.current.x))
      camera.quaternion.setFromEuler(eulerRef.current)
      // Reset apres application
      setTouchRotation({ x: 0, y: 0 })
    }

    // Recuperer la velocite actuelle
    const currentVel = rb.linvel()
    velocity.set(currentVel.x, currentVel.y, currentVel.z)

    // Calculer la direction (clavier OU joystick)
    direction.set(0, 0, 0)

    if (isMobile) {
      // Input joystick mobile
      direction.x = joystickInput.x
      direction.z = -joystickInput.y // Inverser Y pour que haut = avancer
    } else {
      // Input clavier desktop
      if (keys.forward) direction.z -= 1
      if (keys.backward) direction.z += 1
      if (keys.left) direction.x -= 1
      if (keys.right) direction.x += 1
    }

    const isMovingNow = direction.lengthSq() > 0.01

    if (isMovingNow) {
      if (!isMobile) {
        direction.normalize()
      }

      // Appliquer la rotation de la camera (yaw seulement)
      const moveEuler = new THREE.Euler(0, 0, 0, 'YXZ')
      moveEuler.setFromQuaternion(camera.quaternion)
      moveEuler.x = 0
      moveEuler.z = 0
      direction.applyEuler(moveEuler)
      direction.multiplyScalar(MOVE_SPEED)

      velocity.x = direction.x
      velocity.z = direction.z
      currentSpeedRef.current = Math.sqrt(velocity.x ** 2 + velocity.z ** 2)
      setIsMoving(true)
    } else {
      velocity.x *= 0.9
      velocity.z *= 0.9
      currentSpeedRef.current *= 0.9
      setIsMoving(false)
    }

    rb.setLinvel({ x: velocity.x, y: velocity.y, z: velocity.z }, true)

    // Sync camera avec head bob
    const pos = rb.translation()
    headBob.update(delta, isMovingNow, currentSpeedRef.current)
    camera.position.set(
      pos.x + headBob.offset.x,
      pos.y + PLAYER_HEIGHT / 2 + headBob.offset.y,
      pos.z
    )
  })

  if (!enabled) return null

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={[0, PLAYER_HEIGHT, 3]}
      enabledRotations={[false, false, false]}
      linearDamping={0.5}
      mass={1}
      colliders={false}
    >
      <CapsuleCollider args={[PLAYER_HEIGHT / 2 - PLAYER_RADIUS, PLAYER_RADIUS]} />
    </RigidBody>
  )
}

/**
 * Scene principale de la galerie FPS.
 */
export function GalleryFPSScene({ isActive, onExit, isMobile = false }: GalleryFPSSceneProps) {
  const isLocked = useGalleryFPSStore((s) => s.isLocked)
  const setIsLocked = useGalleryFPSStore((s) => s.setIsLocked)

  // Sur mobile, on considere toujours "locked" quand actif (pas de pointer lock)
  useEffect(() => {
    if (isMobile && isActive) {
      setIsLocked(true)
    }
  }, [isMobile, isActive, setIsLocked])

  // Gestion de la touche Backspace pour quitter (desktop uniquement)
  useEffect(() => {
    if (!isActive || isMobile) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Backspace' && onExit) {
        // Liberer le pointer lock avant de quitter
        if (document.pointerLockElement) {
          document.exitPointerLock()
        }
        onExit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, onExit, isMobile])

  // Fonction pour reprendre (re-activer le pointer lock) - desktop uniquement
  const handleResume = () => {
    if (!isMobile) {
      document.body.requestPointerLock()
    }
  }

  // Mode apercu: camera anime, pas de FPS
  // Mode actif non-locked: affiche menu pause (ESC appuye)
  // Mode actif locked: FPS active
  const isPreviewMode = !isActive
  const showEnterPrompt = !isActive && !isLocked // Seulement en preview
  const showPauseMenu = isActive && !isLocked // Menu pause quand actif mais ESC appuye
  const showFPSMode = isActive && isLocked

  return (
    <>
      {/* Galerie procedurale (murs, sol, plafond, piedestaux, eclairage) */}
      <GalleryRoom />

      {/* Tableaux interactifs (positions depuis galleryConfig) */}
      <Paintings />

      {/* Textes muraux (titres, descriptions, liens) */}
      <WallText />

      {/* Porte de sortie (position depuis galleryConfig) */}
      <Door />

      {/* Vases cassables sur les piédestaux */}
      <Vases />

      {/* Animation camera (mode apercu - quand non actif) */}
      <CameraAnimation isActive={isActive} />

      {/* Panneau d'information - visible en apercu (avant focus) */}
      <EnterPrompt visible={showEnterPrompt} isPreview={isPreviewMode} />

      {/* Menu pause 3D - visible quand en pause (ESC appuye) */}
      <PauseMenu3D
        visible={showPauseMenu}
        onResume={handleResume}
        onExit={onExit || (() => {})}
      />

      {/* Controleur FPS (quand actif) */}
      <FPSController enabled={isActive} isMobile={isMobile} />

      {/* Crosshair 3D (quand en mode FPS) */}
      <Crosshair3D visible={showFPSMode} />

      {/* Info tableau 3D (quand en mode FPS et regarde un tableau) */}
      <PaintingInfo3D />
    </>
  )
}

export default GalleryFPSScene
