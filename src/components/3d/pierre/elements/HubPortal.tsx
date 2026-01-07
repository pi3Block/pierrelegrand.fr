/**
 * HubPortal - Portail 3D interactif vers le Hub.
 * 
 * Un portail lumineux/porte qui permet de passer de la scène Pierre
 * vers le Hub (Level 0) avec le personnage Ecctrl.
 */

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '@stores/gameStore'
import { type PierreStage } from '../stores/pierreStore'

// Position du portail dans la scène (près de la porte de la pièce)
const PORTAL_POSITION: [number, number, number] = [-5, 2, -3]
const PORTAL_ROTATION: [number, number, number] = [0, Math.PI / 4, 0]
const PORTAL_SIZE = { width: 1.5, height: 2.5 }

interface HubPortalProps {
  onHover: (objects: THREE.Object3D[]) => void
  onSelect: (stage: PierreStage) => void
}

/**
 * Portail vers le Hub.
 */
export function HubPortal({ onHover }: HubPortalProps) {
  const portalRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const [isHovered, setIsHovered] = useState(false)
  
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel)

  // Couleurs du portail
  const portalColor = useMemo(() => new THREE.Color('#6366f1'), [])
  const glowColor = useMemo(() => new THREE.Color('#818cf8'), [])

  // Animation du glow
  useFrame((state) => {
    if (glowRef.current) {
      const material = glowRef.current.material as THREE.MeshBasicMaterial
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 0.7
      material.opacity = isHovered ? 0.8 : pulse * 0.5
    }
  })

  /**
   * Transition vers le Hub.
   */
  const handlePortalClick = () => {
    // TODO: Ajouter animation de transition (fade, whoosh sound)
    setCurrentLevel(0) // Retour au Hub
  }

  return (
    <group 
      position={PORTAL_POSITION} 
      rotation={PORTAL_ROTATION}
      name="hub-portal"
    >
      {/* Cadre du portail */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[PORTAL_SIZE.width + 0.2, PORTAL_SIZE.height + 0.2, 0.1]} />
        <meshStandardMaterial color="#1e1b4b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Surface du portail (interactive) */}
      <mesh
        ref={portalRef}
        onPointerOver={() => {
          setIsHovered(true)
          portalRef.current && onHover([portalRef.current])
        }}
        onPointerOut={() => {
          setIsHovered(false)
          onHover([])
        }}
        onClick={handlePortalClick}
      >
        <planeGeometry args={[PORTAL_SIZE.width, PORTAL_SIZE.height]} />
        <meshBasicMaterial 
          color={portalColor} 
          transparent 
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Effet de glow */}
      <mesh ref={glowRef} position={[0, 0, 0.01]}>
        <planeGeometry args={[PORTAL_SIZE.width + 0.3, PORTAL_SIZE.height + 0.3]} />
        <meshBasicMaterial 
          color={glowColor} 
          transparent 
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Texte "HUB" */}
      <Text
        position={[0, PORTAL_SIZE.height / 2 + 0.3, 0.1]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        ENTRER DANS LE HUB
      </Text>

      {/* Texte descriptif */}
      <Text
        position={[0, -PORTAL_SIZE.height / 2 - 0.2, 0.1]}
        fontSize={0.12}
        color="#a5b4fc"
        anchorX="center"
        anchorY="middle"
      >
        Monde 3D explorable
      </Text>

      {/* Particules autour du portail */}
      <PortalParticles isActive={isHovered} />
    </group>
  )
}

/**
 * Particules flottantes autour du portail.
 */
function PortalParticles({ isActive }: { isActive: boolean }) {
  const particlesRef = useRef<THREE.Points>(null)
  const particleCount = 50

  // Génération des positions initiales
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5
    }
    return pos
  }, [])

  // Animation des particules
  useFrame((state) => {
    const points = particlesRef.current
    if (!points) return
    
    const posAttr = points.geometry.attributes.position
    if (!posAttr) return
    
    points.rotation.y = state.clock.elapsedTime * 0.1
    const posArray = posAttr.array as Float32Array
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const currentY = posArray[i3 + 1]
      if (currentY !== undefined) {
        posArray[i3 + 1] = currentY + Math.sin(state.clock.elapsedTime + i) * 0.002
      }
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={isActive ? '#c7d2fe' : '#6366f1'}
        transparent
        opacity={isActive ? 0.8 : 0.4}
        sizeAttenuation
      />
    </points>
  )
}

export default HubPortal

