/**
 * BrickWall - Mur de briques destructible
 * OPTIMISÉ: Utilise InstancedRigidBodies pour regrouper toutes les briques
 * en un seul appel de rendu avec physique individuelle.
 */

import { InstancedRigidBodies, type InstancedRigidBodyProps } from '@react-three/rapier'
import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'

interface BrickWallProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  rows?: number
  cols?: number
  brickWidth?: number
  brickHeight?: number
  brickDepth?: number
  gap?: number
  color?: string
  brickMass?: number
}

export function BrickWall({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  rows = 5,
  cols = 8,
  brickWidth = 0.6,
  brickHeight = 0.3,
  brickDepth = 0.25,
  gap = 0.02,
  color = '#8B4513',
  brickMass = 0.3,
}: BrickWallProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  // Dimensions totales du mur
  const wallWidth = cols * (brickWidth + gap) - gap

  // Nombre total de briques
  const brickCount = rows * cols

  // Générer les instances pour InstancedRigidBodies
  const instances = useMemo<InstancedRigidBodyProps[]>(() => {
    const result: InstancedRigidBodyProps[] = []

    for (let row = 0; row < rows; row++) {
      const rowOffset = row % 2 === 0 ? 0 : (brickWidth + gap) / 2

      for (let col = 0; col < cols; col++) {
        const x = col * (brickWidth + gap) + brickWidth / 2 - wallWidth / 2 + rowOffset
        const y = row * (brickHeight + gap) + brickHeight / 2
        const z = 0

        result.push({
          key: `brick-${row}-${col}`,
          position: [x, y, z] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
        })
      }
    }

    return result
  }, [rows, cols, brickWidth, brickHeight, gap, wallWidth])

  // Appliquer les couleurs variées aux instances
  useEffect(() => {
    if (!meshRef.current) return

    const baseColor = new THREE.Color(color)
    const tempColor = new THREE.Color()

    for (let i = 0; i < brickCount; i++) {
      const variation = Math.sin(i * 0.7) * 0.05 + Math.cos(i * 1.3) * 0.05
      tempColor.copy(baseColor).offsetHSL(0, 0, variation)
      meshRef.current.setColorAt(i, tempColor)
    }

    meshRef.current.instanceColor!.needsUpdate = true
  }, [brickCount, color])

  // Géométrie partagée
  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(brickWidth, brickHeight, brickDepth)
  }, [brickWidth, brickHeight, brickDepth])

  // Matériau partagé
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      roughness: 0.9,
      metalness: 0.05,
      vertexColors: true,
    })
  }, [])

  return (
    <group position={position} rotation={rotation}>
      <InstancedRigidBodies
        instances={instances}
        colliders="cuboid"
        mass={brickMass}
        friction={0.8}
        restitution={0.1}
        linearDamping={0.5}
        angularDamping={0.5}
      >
        <instancedMesh
          ref={meshRef}
          args={[geometry, material, brickCount]}
          castShadow
          receiveShadow
        />
      </InstancedRigidBodies>
    </group>
  )
}
