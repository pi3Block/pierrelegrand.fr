/**
 * Confetti - Effet de particules pour célébration.
 * 
 * Utilisé quand le Rubik's cube est résolu.
 * Particules colorées tombant avec gravité et rotation.
 */

import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePierreStore } from '../stores/pierreStore'

// Configuration
const CONFETTI_COUNT = 200
const CONFETTI_COLORS = [
  '#ff6b6b', // Rouge
  '#4ecdc4', // Turquoise
  '#45b7d1', // Bleu
  '#96ceb4', // Vert menthe
  '#ffeaa7', // Jaune
  '#dfe6e9', // Blanc cassé
  '#fd79a8', // Rose
  '#a29bfe', // Lavande
]
const GRAVITY = -4
const SPAWN_HEIGHT = 8
const SPAWN_RADIUS = 3
const DURATION = 5000 // ms

interface ConfettiParticle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  rotation: THREE.Euler
  rotationSpeed: THREE.Vector3
  scale: number
  color: string
}

/**
 * Composant Confetti avec effet de particules.
 */
export function Confetti() {
  const groupRef = useRef<THREE.Group>(null)
  const [particles, setParticles] = useState<ConfettiParticle[]>([])
  const [isActive, setIsActive] = useState(false)
  const startTimeRef = useRef<number>(0)
  
  const rubikSolved = usePierreStore((s) => s.rubikSolved)

  // Générer les particules quand le cube est résolu
  useEffect(() => {
    if (rubikSolved && !isActive) {
      setIsActive(true)
      startTimeRef.current = Date.now()
      
      const newParticles: ConfettiParticle[] = []
      
      for (let i = 0; i < CONFETTI_COUNT; i++) {
        // Position initiale aléatoire dans un disque au-dessus
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * SPAWN_RADIUS
        
        newParticles.push({
          position: new THREE.Vector3(
            Math.cos(angle) * radius,
            SPAWN_HEIGHT + Math.random() * 2,
            Math.sin(angle) * radius
          ),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            -Math.random() * 2,
            (Math.random() - 0.5) * 2
          ),
          rotation: new THREE.Euler(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          ),
          rotationSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
          ),
          scale: 0.03 + Math.random() * 0.05,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] || '#ffffff',
        })
      }
      
      setParticles(newParticles)
    }
  }, [rubikSolved, isActive])

  // Animation des particules
  useFrame((_, delta) => {
    if (!isActive || particles.length === 0) return
    
    // Vérifier la durée
    if (Date.now() - startTimeRef.current > DURATION) {
      setIsActive(false)
      setParticles([])
      return
    }
    
    // Mettre à jour chaque particule
    setParticles((prev) =>
      prev.map((p) => {
        // Appliquer la gravité
        p.velocity.y += GRAVITY * delta
        
        // Mettre à jour la position
        p.position.add(p.velocity.clone().multiplyScalar(delta))
        
        // Mettre à jour la rotation
        p.rotation.x += p.rotationSpeed.x * delta
        p.rotation.y += p.rotationSpeed.y * delta
        p.rotation.z += p.rotationSpeed.z * delta
        
        return p
      }).filter((p) => p.position.y > -2) // Supprimer les particules sous le sol
    )
  })

  if (!isActive || particles.length === 0) return null

  return (
    <group ref={groupRef} name="confetti">
      {particles.map((particle, i) => (
        <mesh
          key={i}
          position={particle.position}
          rotation={particle.rotation}
          scale={particle.scale}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            color={particle.color}
            side={THREE.DoubleSide}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  )
}

export default Confetti

