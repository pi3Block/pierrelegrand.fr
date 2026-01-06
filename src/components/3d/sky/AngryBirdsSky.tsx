/**
 * AngryBirdsSky - Ciel gradient style Angry Birds
 * Bleu en haut, jaune pale a l'horizon
 * Inclut des nuages flottants
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface AngryBirdsSkyProps {
  /** Couleur du haut du ciel */
  topColor?: string
  /** Couleur de l'horizon */
  bottomColor?: string
  /** Taille du dome */
  radius?: number
}

/**
 * Dome de ciel avec gradient
 */
export function AngryBirdsSky({
  topColor = '#87CEEB',     // Bleu ciel
  bottomColor = '#FFF8E1',  // Jaune pale
  radius = 200,
}: AngryBirdsSkyProps) {
  // Shader personnalise pour gradient vertical
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(topColor) },
        bottomColor: { value: new THREE.Color(bottomColor) },
        offset: { value: 0.4 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y + offset;
          h = clamp(h, 0.0, 1.0);
          h = pow(h, exponent);
          gl_FragColor = vec4(mix(bottomColor, topColor, h), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    })
  }, [topColor, bottomColor])

  return (
    <mesh>
      <sphereGeometry args={[radius, 32, 16]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

/**
 * Nuage individuel (groupe de spheres)
 */
interface CloudProps {
  position: [number, number, number]
  scale?: number
  speed?: number
  opacity?: number
}

function Cloud({ position, scale = 1, speed = 0.02, opacity = 0.9 }: CloudProps) {
  const groupRef = useRef<THREE.Group>(null)
  const initialX = position[0]
  const range = 100 // Distance de deplacement

  // Animation de deplacement
  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.elapsedTime
    // Mouvement horizontal avec boucle
    groupRef.current.position.x = initialX + Math.sin(time * speed) * range * 0.1
    // Leger mouvement vertical
    groupRef.current.position.y = position[1] + Math.sin(time * speed * 2) * 0.5
  })

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity,
    }),
    [opacity]
  )

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Forme du nuage - spheres combinees */}
      <mesh material={material} position={[0, 0, 0]}>
        <sphereGeometry args={[1.5, 8, 8]} />
      </mesh>
      <mesh material={material} position={[1.2, 0.2, 0]}>
        <sphereGeometry args={[1.2, 8, 8]} />
      </mesh>
      <mesh material={material} position={[-1.3, 0.1, 0]}>
        <sphereGeometry args={[1.3, 8, 8]} />
      </mesh>
      <mesh material={material} position={[0.5, 0.5, 0]}>
        <sphereGeometry args={[1, 8, 8]} />
      </mesh>
      <mesh material={material} position={[-0.6, 0.4, 0]}>
        <sphereGeometry args={[1.1, 8, 8]} />
      </mesh>
    </group>
  )
}

/**
 * Groupe de nuages animes
 */
interface CloudSystemProps {
  count?: number
  minHeight?: number
  maxHeight?: number
  spread?: number
}

export function CloudSystem({
  count = 8,
  minHeight = 20,
  maxHeight = 35,
  spread = 80,
}: CloudSystemProps) {
  // Generer positions aleatoires mais coherentes
  const clouds = useMemo(() => {
    const result: {
      position: [number, number, number]
      scale: number
      speed: number
    }[] = []

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const distance = spread * 0.5 + Math.random() * spread * 0.5
      const x = Math.cos(angle) * distance
      const z = Math.sin(angle) * distance
      const y = minHeight + Math.random() * (maxHeight - minHeight)

      result.push({
        position: [x, y, z],
        scale: 1.5 + Math.random() * 2,
        speed: 0.01 + Math.random() * 0.03,
      })
    }

    return result
  }, [count, minHeight, maxHeight, spread])

  return (
    <>
      {clouds.map((cloud, i) => (
        <Cloud
          key={i}
          position={cloud.position}
          scale={cloud.scale}
          speed={cloud.speed}
        />
      ))}
    </>
  )
}

/**
 * Soleil decoratif (optionnel)
 */
export function CartoonSun({
  position = [50, 40, -60],
  size = 8,
}: {
  position?: [number, number, number]
  size?: number
}) {
  return (
    <mesh position={position}>
      <circleGeometry args={[size, 32]} />
      <meshBasicMaterial color="#FFEB3B" />
    </mesh>
  )
}
