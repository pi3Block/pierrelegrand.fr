import { Text } from '@react-three/drei'
import { BallCollider, CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'

export function RigidObjects() {
  return (
    <>
      {/* Cubes empilables */}
      <RigidBody position={[15, 1, 2]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
      </RigidBody>
      <RigidBody position={[15.1, 0, 2]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
      </RigidBody>

      {/* Cube moyen */}
      <RigidBody position={[15, 0, 0]} colliders={false}>
        <Text scale={0.5} color="white" position={[0, 1, 0]} rotation={[0, -Math.PI / 2, 0]}>
          mass: 1
        </Text>
        <CuboidCollider args={[0.5, 0.5, 0.5]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#4ade80" />
        </mesh>
      </RigidBody>

      {/* Gros cube */}
      <RigidBody position={[15, 0, -2]} colliders={false}>
        <Text scale={0.5} color="white" position={[0, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
          mass: 3.375
        </Text>
        <CuboidCollider args={[0.75, 0.75, 0.75]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="#16a34a" />
        </mesh>
      </RigidBody>

      {/* Très gros cube */}
      <RigidBody position={[15, 0, -5]} colliders={false}>
        <Text scale={0.5} color="white" position={[0, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          mass: 8
        </Text>
        <CuboidCollider args={[1, 1, 1]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#15803d" />
        </mesh>
      </RigidBody>

      {/* Jouet toupie */}
      <RigidBody colliders={false} position={[15, 5, -10]}>
        <Text scale={0.5} color="white" position={[0, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
          Toupie!
        </Text>
        <CylinderCollider args={[0.03, 2.5]} position={[0, 0.25, 0]} />
        <BallCollider args={[0.25]} />
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[2.5, 0.2, 0.5]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
      </RigidBody>
    </>
  )
}
