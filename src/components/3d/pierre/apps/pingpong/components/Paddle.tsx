/**
 * Paddle - Raquette contrôlée par la souris (kinematic).
 *
 * Utilise le modèle GLB pingpong.glb comme dans l'exemple original.
 * - Mouse raycasting pour la position
 * - Rotation basée sur position X souris
 * - Collision force pour audio et score
 */

import { useRef, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CylinderCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { Text, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { easing } from 'maath'
import { usePingPongStore } from '../stores/pingpongStore'
import { PINGPONG, FONTS } from '@config/assetPaths'

export function Paddle() {
  const apiRef = useRef<RapierRigidBody>(null)
  const modelRef = useRef<THREE.Group>(null)
  const { pointer } = useThree()

  // Charger le modèle GLB
  const gltf = useGLTF(PINGPONG.MODELS.PADDLE)
  const nodes = gltf.nodes as {
    Bone: THREE.Bone
    Bone003: THREE.Bone
    Bone006: THREE.Bone
    Bone010: THREE.Bone
    arm: THREE.SkinnedMesh
    mesh: THREE.Mesh
    mesh_1: THREE.Mesh
    mesh_2: THREE.Mesh
    mesh_3: THREE.Mesh
    mesh_4: THREE.Mesh
  }
  const materials = gltf.materials as {
    glove: THREE.Material
    wood: THREE.Material
    side: THREE.Material
    foam: THREE.Material
    lower: THREE.Material
    upper: THREE.Material
  }

  // Store
  const score = usePingPongStore((s) => s.score)
  const incrementScore = usePingPongStore((s) => s.incrementScore)
  const setLastHitForce = usePingPongStore((s) => s.setLastHitForce)
  const isMobile = usePingPongStore((s) => s.isMobile)
  const paddleInput = usePingPongStore((s) => s.paddleInput)

  /**
   * Callback de collision - joue le son et met à jour le score.
   */
  const contactForce = useCallback(
    (payload: { totalForceMagnitude: number }) => {
      const force = payload.totalForceMagnitude / 100
      setLastHitForce(force)

      // Feedback visuel - pousse la raquette vers le bas
      if (modelRef.current) {
        modelRef.current.position.y = -payload.totalForceMagnitude / 10000
      }

      // Score seulement si frappe assez forte (> 1000 unités brutes)
      if (payload.totalForceMagnitude > 1000) {
        incrementScore()
      }
    },
    [incrementScore, setLastHitForce]
  )

  useFrame((_state, delta) => {
    if (!apiRef.current) return

    if (isMobile) {
      // Mobile: utiliser le joystick
      const x = paddleInput.x * 5
      const y = paddleInput.y * 3 + 2
      apiRef.current.setNextKinematicTranslation({ x, y, z: 0 })
    } else {
      // Desktop: position basée sur la souris (coordonnées normalisées -1 à 1)
      // Multiplié par un facteur pour couvrir la zone de jeu
      const x = pointer.x * 6
      const y = pointer.y * 4 + 2

      apiRef.current.setNextKinematicTranslation({ x, y, z: 0 })
      apiRef.current.setNextKinematicRotation({
        x: 0,
        y: 0,
        z: (pointer.x * Math.PI) / 10,
        w: 1,
      })
    }

    // Retour progressif du modèle visuel à la position neutre
    if (modelRef.current) {
      easing.damp3(modelRef.current.position, [0, 0, 0], 0.2, delta)
    }
  })

  return (
    <RigidBody
      ref={apiRef}
      ccd
      canSleep={false}
      type="kinematicPosition"
      colliders={false}
      onContactForce={contactForce}
    >
      {/* Collider: args = [halfHeight, radius] */}
      <CylinderCollider args={[0.15, 1.75]} />

      <group ref={modelRef} position={[0, 2, 0]} scale={0.15}>
        {/* Score affiché au-dessus de la raquette */}
        <Text
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 1, 0]}
          fontSize={10}
          color="white"
          font={FONTS.ROBOTO_LIGHT}
        >
          {score}
        </Text>

        {/* Main avec gant (du modèle GLB) */}
        <group rotation={[1.88, -0.35, 2.32]} scale={[2.97, 2.97, 2.97]}>
          <primitive object={nodes.Bone} />
          <primitive object={nodes.Bone003} />
          <primitive object={nodes.Bone006} />
          <primitive object={nodes.Bone010} />
          <skinnedMesh
            castShadow
            receiveShadow
            material={materials.glove}
            geometry={nodes.arm.geometry}
            skeleton={nodes.arm.skeleton}
          />
        </group>

        {/* Raquette (du modèle GLB) */}
        <group rotation={[0, -0.04, 0]} scale={141.94}>
          <mesh castShadow receiveShadow material={materials.wood} geometry={nodes.mesh.geometry} />
          <mesh castShadow receiveShadow material={materials.side} geometry={nodes.mesh_1.geometry} />
          <mesh castShadow receiveShadow material={materials.foam} geometry={nodes.mesh_2.geometry} />
          <mesh castShadow receiveShadow material={materials.lower} geometry={nodes.mesh_3.geometry} />
          <mesh castShadow receiveShadow material={materials.upper} geometry={nodes.mesh_4.geometry} />
        </group>
      </group>
    </RigidBody>
  )
}

// Preload du modèle
useGLTF.preload(PINGPONG.MODELS.PADDLE)

export default Paddle
