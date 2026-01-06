import { RigidBody } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import { useEffect } from 'react'
import * as THREE from 'three'

export function RoughPlane() {
  const { scene } = useGLTF('/roughPlane.glb')

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.receiveShadow = true
      }
    })
  }, [scene])

  return (
    <RigidBody type="fixed" colliders="trimesh" position={[10, -1.2, 10]}>
      <primitive object={scene} />
    </RigidBody>
  )
}

useGLTF.preload('/roughPlane.glb')
