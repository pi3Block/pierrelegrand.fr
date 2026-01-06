import { CuboidCollider, RigidBody, RapierRigidBody } from '@react-three/rapier'
import { useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'

export function FloatingPlatform() {
  const floatingPlateRef = useRef<RapierRigidBody>(null)
  const floatingMovingPlateRef = useRef<RapierRigidBody>(null)

  // Moving Platform
  const movingVel = useMemo(() => new THREE.Vector3(), [])
  const movingDirRef = useRef(1)

  // Lock rotations on floating platform
  useEffect(() => {
    if (floatingPlateRef.current) {
      floatingPlateRef.current.lockRotations(true, true)
    }
    if (floatingMovingPlateRef.current) {
      floatingMovingPlateRef.current.setEnabledRotations(false, true, false, true)
      floatingMovingPlateRef.current.setEnabledTranslations(true, true, false, true)
    }
  }, [])

  useFrame(() => {
    // Moving platform logic
    if (floatingMovingPlateRef.current) {
      const translationMove = floatingMovingPlateRef.current.translation()

      // Change direction at bounds
      if (translationMove.x > 10) {
        movingDirRef.current = -1
      } else if (translationMove.x < -5) {
        movingDirRef.current = 1
      }

      const linvel = floatingMovingPlateRef.current.linvel()
      floatingMovingPlateRef.current.setLinvel(movingVel.set(2 * movingDirRef.current, linvel.y, 0), true)
    }
  })

  return (
    <>
      {/* Platform 1 - Static floating */}
      <RigidBody position={[0, 2, -10]} type="fixed" colliders={false}>
        <Text scale={0.5} color="white" position={[0, 1.5, 0]}>
          Plateforme flottante
        </Text>
        <CuboidCollider args={[2.5, 0.1, 2.5]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[5, 0.2, 5]} />
          <meshStandardMaterial color="#6366f1" />
        </mesh>
      </RigidBody>

      {/* Platform 2 - Higher */}
      <RigidBody position={[7, 4, -10]} type="fixed" colliders={false}>
        <Text scale={0.5} color="white" position={[0, 1.5, 0]}>
          Plateforme haute
        </Text>
        <CuboidCollider args={[2.5, 0.1, 2.5]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[5, 0.2, 5]} />
          <meshStandardMaterial color="#818cf8" />
        </mesh>
      </RigidBody>

      {/* Moving Platform */}
      <RigidBody
        position={[0, 3, -17]}
        colliders={false}
        ref={floatingMovingPlateRef}
        type="kinematicVelocity"
      >
        <Text scale={0.5} color="white" position={[0, 1.5, 0]}>
          Plateforme mobile
        </Text>
        <CuboidCollider args={[1.25, 0.1, 1.25]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[2.5, 0.2, 2.5]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
      </RigidBody>
    </>
  )
}
