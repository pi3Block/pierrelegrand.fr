/**
 * VideoScreen - Écran 3D interactif qui affiche des vidéos YouTube directement dans le monde 3D.
 * Toujours orienté vers le joueur (Billboard). Clic pour play/pause.
 */

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard, Html } from '@react-three/drei'
import * as THREE from 'three'
import { VIDEOS, type VideoConfig } from '@config/videos'
import { useUIStore } from '@stores/uiStore'

interface VideoScreenProps {
  /** Clé de la vidéo dans le catalogue VIDEOS */
  videoKey: keyof typeof VIDEOS
  /** Position dans le monde 3D */
  position: [number, number, number]
  /** Taille de l'écran [largeur, hauteur] */
  size?: [number, number]
  /** Couleur de l'écran */
  color?: string
  /** Couleur du glow/émissif */
  glowColor?: string
  /** Intensité du glow */
  glowIntensity?: number
  /** Afficher le titre de la vidéo */
  showTitle?: boolean
}

/**
 * Composant VideoScreen - Écran 3D avec vidéo YouTube intégrée.
 * Toujours face au joueur grâce à Billboard.
 */
export function VideoScreen({
  videoKey,
  position,
  size = [4, 2.25],
  color = '#0a0a15',
  glowColor = '#6366f1',
  glowIntensity = 1.2,
  showTitle = true,
}: VideoScreenProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const setVideo3DPlaying = useUIStore((s) => s.setVideo3DPlaying)

  // Récupérer la config de la vidéo
  const videoConfig: VideoConfig | undefined = VIDEOS[videoKey]

  // Sync état global quand la vidéo joue/s'arrête
  useEffect(() => {
    setVideo3DPlaying(isPlaying)
    return () => setVideo3DPlaying(false) // Cleanup au démontage
  }, [isPlaying, setVideo3DPlaying])

  // Animation continue + hover
  useFrame((state) => {
    if (!meshRef.current || !glowRef.current) return
    
    const time = state.clock.elapsedTime
    const material = meshRef.current.material as THREE.MeshStandardMaterial
    const glowMaterial = glowRef.current.material as THREE.MeshBasicMaterial
    
    if (isPlaying) {
      // En lecture : glow constant
      material.emissiveIntensity = 0.3
      glowMaterial.opacity = 0.5
    } else {
      // Pulsation constante pour attirer l'attention
      const basePulse = Math.sin(time * 2) * 0.3 + 1
      
      if (hovered) {
        material.emissiveIntensity = glowIntensity * 2 + Math.sin(time * 8) * 0.5
        glowMaterial.opacity = 0.6 + Math.sin(time * 6) * 0.2
      } else {
        material.emissiveIntensity = glowIntensity * basePulse
        glowMaterial.opacity = 0.25 + Math.sin(time * 2) * 0.1
      }
    }
  })

  // Toggle play/pause au clic
  const handleClick = () => {
    if (!videoConfig) return
    setIsPlaying(!isPlaying)
  }

  if (!videoConfig) {
    console.warn(`VideoScreen: Vidéo "${videoKey}" non trouvée dans le catalogue`)
    return null
  }

  return (
    <Billboard position={position} follow={true} lockX={false} lockY={false} lockZ={false}>
      <group>
        {/* Halo lumineux derrière */}
        <mesh ref={glowRef} position={[0, 0, -0.15]}>
          <planeGeometry args={[size[0] + 1.5, size[1] + 1.5]} />
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Cadre néon extérieur */}
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[size[0] + 0.3, size[1] + 0.3]} />
          <meshStandardMaterial
            color={glowColor}
            emissive={glowColor}
            emissiveIntensity={isPlaying ? 1.5 : 2}
            metalness={1}
            roughness={0}
          />
        </mesh>

        {/* Cadre noir */}
        <mesh position={[0, 0, -0.03]}>
          <planeGeometry args={[size[0] + 0.15, size[1] + 0.15]} />
          <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Écran principal - cliquable pour toggle */}
        <mesh
          ref={meshRef}
          onClick={handleClick}
          onPointerEnter={() => {
            setHovered(true)
            document.body.style.cursor = 'pointer'
          }}
          onPointerLeave={() => {
            setHovered(false)
            document.body.style.cursor = 'auto'
          }}
        >
          <planeGeometry args={size} />
          <meshStandardMaterial
            color={isPlaying ? '#000' : color}
            emissive={glowColor}
            emissiveIntensity={isPlaying ? 0.3 : glowIntensity}
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>

        {/* Vidéo YouTube intégrée - taille fixe visible */}
        {isPlaying && (
          <Html
            position={[0, 0, 0.2]}
            center
            style={{
              width: '480px',
              height: '270px',
            }}
          >
            <iframe
              width="480"
              height="270"
              src={`https://www.youtube.com/embed/${videoConfig.id}?autoplay=1&rel=0&modestbranding=1`}
              title={videoConfig.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                borderRadius: '8px',
                border: `3px solid ${glowColor}`,
                pointerEvents: 'auto',
                boxShadow: `0 0 30px ${glowColor}`,
              }}
            />
          </Html>
        )}

        {/* Interface quand pas en lecture */}
        {!isPlaying && (
          <>
            {/* Grande icône Play centrale */}
            <mesh position={[0, 0, 0.02]}>
              <circleGeometry args={[0.6, 32]} />
              <meshBasicMaterial 
                color={hovered ? '#ffffff' : glowColor} 
                transparent 
                opacity={hovered ? 0.95 : 0.7} 
              />
            </mesh>
            
            {/* Triangle Play */}
            <mesh position={[0.1, 0, 0.03]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.3, 0.5, 3]} />
              <meshBasicMaterial color={hovered ? glowColor : '#111'} />
            </mesh>

            {/* Texte au-dessus */}
            <Text
              position={[0, size[1] / 2 + 0.35, 0.01]}
              fontSize={0.25}
              color={hovered ? '#ffffff' : glowColor}
              anchorX="center"
              anchorY="bottom"
              outlineWidth={0.02}
              outlineColor="#000000"
            >
              {hovered ? '► PLAY' : '🎬 CLIQUEZ'}
            </Text>

            {/* Particules décoratives aux coins */}
            {([[-1, 1], [1, 1], [-1, -1], [1, -1]] as const).map(([px, py], i) => (
              <mesh key={i} position={[px * size[0] / 2 * 0.9, py * size[1] / 2 * 0.9, 0.01]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshBasicMaterial color={glowColor} />
              </mesh>
            ))}
          </>
        )}

        {/* Indicateur PAUSE quand en lecture */}
        {isPlaying && (
          <Text
            position={[0, size[1] / 2 + 0.35, 0.01]}
            fontSize={0.2}
            color="#ef4444"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            ⏹ CLIC POUR ARRÊTER
          </Text>
        )}

        {/* Titre de la vidéo en bas */}
        {showTitle && (
          <Text
            position={[0, -size[1] / 2 - 0.3, 0.01]}
            fontSize={0.22}
            color={isPlaying ? glowColor : (hovered ? '#fff' : '#ccc')}
            anchorX="center"
            anchorY="top"
            maxWidth={size[0]}
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {videoConfig.title}
          </Text>
        )}
      </group>
    </Billboard>
  )
}

