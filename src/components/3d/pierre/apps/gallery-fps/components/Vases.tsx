/**
 * Vases - Vases cassables dans la galerie FPS.
 *
 * Utilise les modèles GLB :
 * - vase_idle.glb : vase intact
 * - vase.glb : vase brisé (débris animés)
 */

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { GALLERY_CONFIG } from '../galleryConfig'
import { GALLERY_FPS } from '@config/assetPaths'

/**
 * Configuration d'un vase.
 */
interface VaseConfig {
  id: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
}

/**
 * Liste des vases - placés sur les piédestaux.
 */
const VASES_CONFIG: VaseConfig[] = GALLERY_CONFIG.pedestals.map((pedestal, index) => ({
  id: `vase-${index + 1}`,
  position: [pedestal.position[0], pedestal.position[1] + pedestal.size[1] / 2 + 0.01, pedestal.position[2]] as [number, number, number],
  rotation: [0, (index * Math.PI) / 2, 0] as [number, number, number],
  scale: 1.5,
}))

/**
 * Données d'un débris GLB pour l'animation.
 */
interface DebrisPartData {
  mesh: THREE.Object3D
  velocity: THREE.Vector3
  rotationSpeed: THREE.Vector3
  startY: number
}

/**
 * Vase brisé avec animation des débris (utilise vase.glb).
 */
function BrokenVase({ position, rotation, scale, onComplete }: {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  onComplete: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(GALLERY_FPS.MODELS.VASE)
  const debrisDataRef = useRef<DebrisPartData[]>([])
  const timeRef = useRef(0)
  const [isComplete, setIsComplete] = useState(false)

  // Cloner la scène et initialiser les débris
  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    debrisDataRef.current = []

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true

        // Stocker les données d'animation pour chaque morceau
        debrisDataRef.current.push({
          mesh: child,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            Math.random() * 3 + 1,
            (Math.random() - 0.5) * 2
          ),
          rotationSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8
          ),
          startY: child.position.y,
        })
      }
    })

    return clone
  }, [scene])

  useFrame((_, delta) => {
    if (!groupRef.current || isComplete) return

    const gravity = -12
    timeRef.current += delta

    let allOnGround = true

    debrisDataRef.current.forEach((data) => {
      // Appliquer la vélocité
      data.velocity.y += gravity * delta
      data.mesh.position.x += data.velocity.x * delta
      data.mesh.position.y += data.velocity.y * delta
      data.mesh.position.z += data.velocity.z * delta

      // Rotation
      data.mesh.rotation.x += data.rotationSpeed.x * delta
      data.mesh.rotation.y += data.rotationSpeed.y * delta
      data.mesh.rotation.z += data.rotationSpeed.z * delta

      // Rebond au sol (relatif à la position du groupe)
      const groundY = -position[1] / scale + 0.02
      if (data.mesh.position.y < groundY) {
        data.mesh.position.y = groundY
        data.velocity.y *= -0.2
        data.velocity.x *= 0.7
        data.velocity.z *= 0.7
        data.rotationSpeed.multiplyScalar(0.8)
      }

      // Vérifier si le débris est encore en mouvement
      if (Math.abs(data.velocity.y) > 0.1 || data.mesh.position.y > groundY + 0.05) {
        allOnGround = false
      }
    })

    // Terminer après 3 secondes ou quand tout est au sol
    if (timeRef.current > 3 || (allOnGround && timeRef.current > 0.5)) {
      setIsComplete(true)
      onComplete()
    }
  })

  if (isComplete) return null

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  )
}

/**
 * Vase intact (utilise vase_idle.glb).
 */
function VaseModel({ scale }: { scale: number }) {
  const { scene } = useGLTF(GALLERY_FPS.MODELS.VASE_IDLE)

  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
    return clone
  }, [scene])

  return <primitive object={clonedScene} scale={scale} />
}

/**
 * Composant pour un seul vase cassable.
 */
function Vase({ config, onBreak }: { config: VaseConfig; onBreak: (config: VaseConfig) => void }) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const [isBroken, setIsBroken] = useState(false)

  // Handler de collision
  const handleCollision = () => {
    if (isBroken) return
    setIsBroken(true)
    onBreak(config)
  }

  if (isBroken) {
    return null
  }

  return (
    <RigidBody
      ref={rigidBodyRef}
      name={`vase-${config.id}`}
      type="dynamic"
      position={config.position}
      rotation={config.rotation}
      colliders={false}
      mass={0.5}
      linearDamping={3}
      angularDamping={3}
      onCollisionEnter={handleCollision}
    >
      <CuboidCollider args={[0.08 * config.scale, 0.2 * config.scale, 0.08 * config.scale]} />
      <VaseModel scale={config.scale} />
    </RigidBody>
  )
}

/**
 * État d'un vase brisé en cours d'animation.
 */
interface BrokenVaseState {
  config: VaseConfig
  key: string
}

/**
 * Composant principal des vases.
 */
export function Vases({ playSound }: { playSound?: (soundId: string) => void }) {
  const [brokenVases, setBrokenVases] = useState<string[]>([])
  const [brokenVaseAnimations, setBrokenVaseAnimations] = useState<BrokenVaseState[]>([])

  const handleBreak = (config: VaseConfig) => {
    setBrokenVases((prev) => [...prev, config.id])
    setBrokenVaseAnimations((prev) => [...prev, { config, key: `broken-${config.id}-${Date.now()}` }])

    // Jouer le son de cassage
    if (playSound) {
      playSound('VASE_BREAK')
    }
  }

  const handleAnimationComplete = (key: string) => {
    setBrokenVaseAnimations((prev) => prev.filter((v) => v.key !== key))
  }

  const activeVases = VASES_CONFIG.filter((v) => !brokenVases.includes(v.id))

  return (
    <group name="vases">
      {/* Vases intacts */}
      {activeVases.map((config) => (
        <Vase key={config.id} config={config} onBreak={handleBreak} />
      ))}

      {/* Vases brisés en animation */}
      {brokenVaseAnimations.map(({ config, key }) => (
        <BrokenVase
          key={key}
          position={config.position}
          rotation={config.rotation}
          scale={config.scale}
          onComplete={() => handleAnimationComplete(key)}
        />
      ))}
    </group>
  )
}

// Preload des modèles
useGLTF.preload(GALLERY_FPS.MODELS.VASE_IDLE)
useGLTF.preload(GALLERY_FPS.MODELS.VASE)

export default Vases
