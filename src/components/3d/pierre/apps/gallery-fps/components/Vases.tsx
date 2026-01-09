/**
 * Vases - Vases cassables dans la galerie FPS.
 *
 * Charge le modele vase.glb et le place a plusieurs endroits.
 * Les vases peuvent etre casses par le joueur (collision).
 */

import { useRef, useState, useMemo, useEffect } from 'react'
import { useGLTF, useKTX2 } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'

// Chemins vers les assets
const VASE_MODEL_PATH = '/assets/models/vase.glb'
const VASE_TEXTURE_PATH = '/assets/vase/vaseTexture.ktx2'
const BASIS_PATH = '/basis/'

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
 * Liste des vases dans la galerie.
 * Places pres des murs pour decoration.
 */
const VASES_CONFIG: VaseConfig[] = [
  // Coins de la galerie
  { id: 'vase-1', position: [-4, 0, -4], rotation: [0, 0.5, 0], scale: 0.8 },
  { id: 'vase-2', position: [4, 0, -4], rotation: [0, -0.3, 0], scale: 0.7 },
  { id: 'vase-3', position: [-4, 0, 4], rotation: [0, 1.2, 0], scale: 0.9 },
  { id: 'vase-4', position: [4, 0, 4], rotation: [0, 2.1, 0], scale: 0.75 },
  // Centre
  { id: 'vase-5', position: [0, 0, 0], rotation: [0, 0, 0], scale: 1.0 },
]

/**
 * Composant pour un seul vase cassable.
 */
function Vase({ config, onBreak }: { config: VaseConfig; onBreak: (id: string) => void }) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const [isBroken, setIsBroken] = useState(false)

  const { scene } = useGLTF(VASE_MODEL_PATH)
  const vaseTexture = useKTX2(VASE_TEXTURE_PATH, BASIS_PATH)

  // Configurer la texture
  useEffect(() => {
    if (vaseTexture) {
      vaseTexture.flipY = false
      vaseTexture.colorSpace = THREE.SRGBColorSpace
    }
  }, [vaseTexture])

  // Creer le materiau avec texture
  const vaseMaterial = useMemo(() => {
    if (!vaseTexture) return null
    return new THREE.MeshStandardMaterial({
      map: vaseTexture,
      roughness: 0.4,
      metalness: 0.1,
    })
  }, [vaseTexture])

  // Cloner la scene et appliquer le materiau
  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (vaseMaterial) {
          mesh.material = vaseMaterial
        }
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
    return clone
  }, [scene, vaseMaterial])

  // Handler de collision pour casser le vase
  const handleCollision = () => {
    if (!isBroken) {
      setIsBroken(true)
      onBreak(config.id)
    }
  }

  if (isBroken) {
    return null // Le vase disparait quand casse
  }

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={config.position}
      rotation={config.rotation}
      colliders={false}
      mass={0.5}
      linearDamping={0.5}
      angularDamping={0.5}
      onCollisionEnter={handleCollision}
    >
      <CuboidCollider args={[0.15 * config.scale, 0.3 * config.scale, 0.15 * config.scale]} />
      <primitive
        object={clonedScene}
        scale={config.scale}
      />
    </RigidBody>
  )
}

/**
 * Composant principal des vases.
 */
export function Vases() {
  const [brokenVases, setBrokenVases] = useState<string[]>([])

  const handleBreak = (id: string) => {
    setBrokenVases((prev) => [...prev, id])
    // On pourrait ajouter un effet de particules ici
    console.log(`Vase ${id} casse!`)
  }

  const activeVases = VASES_CONFIG.filter((v) => !brokenVases.includes(v.id))

  return (
    <group name="vases">
      {activeVases.map((config) => (
        <Vase key={config.id} config={config} onBreak={handleBreak} />
      ))}
    </group>
  )
}

// Preload du modele
useGLTF.preload(VASE_MODEL_PATH)

export default Vases
