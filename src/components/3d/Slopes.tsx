import { RigidBody } from '@react-three/rapier'
import { useGLTF, Text } from '@react-three/drei'
import { useEffect } from 'react'
import * as THREE from 'three'

export function Slopes() {
  const { scene } = useGLTF('/slopes.glb')

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.receiveShadow = true
      }
    })
  }, [scene])

  return (
    <group position={[-10, -1, 10]}>
      <RigidBody type="fixed" colliders="trimesh" rotation={[0, Math.PI, 0]}>
        <primitive object={scene} />
      </RigidBody>
      <Text rotation={[0, Math.PI, 0]} position={[3.5, 3, 0]} color="white" fontSize={0.5}>
        23.5 Deg
      </Text>
      <Text rotation={[0, Math.PI, 0]} position={[0, 4.5, 0]} color="white" fontSize={0.5}>
        43.1 Deg
      </Text>
      <Text rotation={[0, Math.PI, 0]} position={[-3.5, 7, 0]} color="white" fontSize={0.5}>
        62.7 Deg
      </Text>
    </group>
  )
}

useGLTF.preload('/slopes.glb')
