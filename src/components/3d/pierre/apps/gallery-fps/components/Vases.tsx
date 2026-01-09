/**
 * Vases - Vases cassables dans la galerie FPS.
 *
 * Charge le modele vase.glb et le place a plusieurs endroits.
 * Les vases peuvent etre casses par le joueur (collision).
 */

import { useRef, useState, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { GALLERY_FPS } from '@config/assetPaths'

// Chemin vers le modele
const VASE_MODEL_PATH = GALLERY_FPS.MODELS.VASE

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
 * Places sur des piedestaux le long des murs pour decoration.
 * Positions ajustees pour le modele scene.glb (~10x12 unites).
 */
const VASES_CONFIG: VaseConfig[] = [
  // Cote gauche (entre les tableaux)
  { id: 'vase-1', position: [-2.5, 0.6, 0.5], rotation: [0, 0.5, 0], scale: 1.5 },
  { id: 'vase-2', position: [-2.5, 0.6, -2.5], rotation: [0, 1.2, 0], scale: 1.3 },
  // Cote droit (entre les tableaux)
  { id: 'vase-3', position: [2.5, 0.6, 0.5], rotation: [0, -0.3, 0], scale: 1.4 },
  { id: 'vase-4', position: [2.5, 0.6, -2.5], rotation: [0, 2.1, 0], scale: 1.2 },
]

/**
 * Composant pour un seul vase cassable.
 */
function Vase({ config, onBreak }: { config: VaseConfig; onBreak: (id: string) => void }) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const [isBroken, setIsBroken] = useState(false)

  const { scene } = useGLTF(VASE_MODEL_PATH)

  // Creer le materiau ceramique
  const vaseMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#C4A77D', // Couleur ceramique/terre cuite
      roughness: 0.6,
      metalness: 0.1,
    })
  }, [])

  // Cloner la scene et appliquer le materiau
  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.material = vaseMaterial
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
