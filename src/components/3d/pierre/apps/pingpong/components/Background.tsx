/**
 * Background - Fond sphérique pour le jeu.
 *
 * Utilise une sphère avec texture sur BackSide
 * pour créer un environnement immersif.
 */

import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

export function Background() {
  const texture = useTexture('/assets/pingpong/bg.jpg')

  return (
    <mesh rotation={[0, Math.PI / 1.25, 0]} scale={100}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  )
}

export default Background
