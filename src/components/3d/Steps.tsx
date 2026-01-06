import { RigidBody } from '@react-three/rapier'

export function Steps() {
  return (
    <>
      {/* Petites marches */}
      <RigidBody type="fixed" position={[0, -0.9, 5]}>
        <mesh receiveShadow>
          <boxGeometry args={[4, 0.2, 0.2]} />
          <meshStandardMaterial color="#6366f1" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[0, -0.9, 6]}>
        <mesh receiveShadow>
          <boxGeometry args={[4, 0.2, 0.2]} />
          <meshStandardMaterial color="#6366f1" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[0, -0.9, 7]}>
        <mesh receiveShadow>
          <boxGeometry args={[4, 0.2, 0.2]} />
          <meshStandardMaterial color="#6366f1" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[0, -0.9, 8]}>
        <mesh receiveShadow>
          <boxGeometry args={[4, 0.2, 0.2]} />
          <meshStandardMaterial color="#6366f1" />
        </mesh>
      </RigidBody>
      {/* Plateforme d'arrivée */}
      <RigidBody type="fixed" position={[0, -0.9, 11]}>
        <mesh receiveShadow>
          <boxGeometry args={[4, 0.2, 4]} />
          <meshStandardMaterial color="#818cf8" />
        </mesh>
      </RigidBody>
    </>
  )
}
