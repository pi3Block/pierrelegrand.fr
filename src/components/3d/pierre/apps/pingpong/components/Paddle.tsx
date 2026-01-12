/**
 * Paddle - Raquette contrôlée par la souris/joystick/gyroscope (kinematic).
 *
 * Utilise le modèle GLB pingpong.glb comme dans l'exemple original.
 * - Mouse raycasting pour la position (desktop)
 * - Joystick virtuel pour la position (mobile)
 * - Gyroscope pour la rotation (mobile)
 * - Collision force pour audio et score avec combo
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

// Seuil de force réduit pour scoring (était 1000)
const SCORING_THRESHOLD = 500

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
  const combo = usePingPongStore((s) => s.combo)
  const registerHit = usePingPongStore((s) => s.registerHit)
  const setLastHitForce = usePingPongStore((s) => s.setLastHitForce)
  const isMobile = usePingPongStore((s) => s.isMobile)
  const paddleInput = usePingPongStore((s) => s.paddleInput)
  const gyroRotation = usePingPongStore((s) => s.gyroRotation)
  const isGyroEnabled = usePingPongStore((s) => s.isGyroEnabled)

  /**
   * Callback de collision - joue le son et met à jour le score avec combo.
   */
  const contactForce = useCallback(
    (payload: { totalForceMagnitude: number }) => {
      const force = payload.totalForceMagnitude / 100
      setLastHitForce(force)

      // Feedback visuel - pousse la raquette vers le bas
      if (modelRef.current) {
        modelRef.current.position.y = -payload.totalForceMagnitude / 10000
      }

      // Score avec combo si frappe assez forte (seuil réduit à 500)
      if (payload.totalForceMagnitude > SCORING_THRESHOLD) {
        registerHit()
      }
    },
    [registerHit, setLastHitForce]
  )

  useFrame((_state, delta) => {
    if (!apiRef.current) return

    let rotationZ = 0

    if (isMobile) {
      // Mobile: utiliser le joystick pour la position
      const x = paddleInput.x * 5
      const y = paddleInput.y * 3 + 2
      apiRef.current.setNextKinematicTranslation({ x, y, z: 0 })

      // Gyroscope pour la rotation (gamma = inclinaison gauche/droite)
      if (isGyroEnabled) {
        // gamma va de -90 à 90, on normalise pour la rotation
        rotationZ = (gyroRotation.gamma / 90) * (Math.PI / 6)
      }
    } else {
      // Desktop: position basée sur la souris (coordonnées normalisées -1 à 1)
      // Multiplié par un facteur pour couvrir la zone de jeu
      const x = pointer.x * 6
      const y = pointer.y * 4 + 2

      apiRef.current.setNextKinematicTranslation({ x, y, z: 0 })
      rotationZ = (pointer.x * Math.PI) / 10
    }

    // Appliquer la rotation
    apiRef.current.setNextKinematicRotation({
      x: 0,
      y: 0,
      z: rotationZ,
      w: 1,
    })

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

        {/* Combo affiché sous le score */}
        {combo > 1 && (
          <Text
            anchorX="center"
            anchorY="middle"
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 1, 4]}
            fontSize={5}
            color="#FFA500"
            font={FONTS.ROBOTO_LIGHT}
          >
            {`x${combo}`}
          </Text>
        )}

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
