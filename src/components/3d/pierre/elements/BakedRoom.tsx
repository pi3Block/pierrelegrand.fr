/**
 * BakedRoom - Modèle de la pièce avec textures baked.
 *
 * Charge les 3 parties de la pièce (room, room2, room3) avec leurs
 * textures pré-calculées (baked1, baked2, baked3) en format KTX2.
 * Inclut également les icônes sociales (LinkedIn, GitHub, itch.io).
 */

import { useEffect, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { type PierreStage } from '../stores/pierreStore'
import { useBakedMaterials } from '../contexts/BakedMaterialContext'

// Chemins vers les assets
const MODELS = {
  room1: '/pierre/assets/models/room.glb',
  room2: '/pierre/assets/models/room2.glb',
  room3: '/pierre/assets/models/room3.glb',
  linkedin: '/pierre/assets/models/linkedin.glb',
  github: '/pierre/assets/models/github.glb',
  itchio: '/pierre/assets/models/itchio.glb',
}

// URLs externes des réseaux sociaux
const SOCIAL_URLS = {
  linkedin: 'https://www.linkedin.com/in/legrand-pierre/',
  github: 'https://github.com/pi3Block',
  itchio: 'https://pi3r2dev.itch.io/',
}

interface BakedRoomProps {
  onHover: (objects: THREE.Object3D[]) => void
  onSelect: (stage: PierreStage) => void
}

/**
 * Composant de la pièce avec textures baked.
 */
export function BakedRoom({ onHover }: BakedRoomProps) {
  // Chargement des modèles GLB
  const room1 = useGLTF(MODELS.room1)
  const room2 = useGLTF(MODELS.room2)
  const room3 = useGLTF(MODELS.room3)
  const linkedin = useGLTF(MODELS.linkedin)
  const github = useGLTF(MODELS.github)
  const itchio = useGLTF(MODELS.itchio)

  // Récupérer les matériaux baked depuis le contexte
  const { material1, material2, material3 } = useBakedMaterials()

  // Refs pour le raycasting
  const linkedinRef = useRef<THREE.Group>(null)
  const githubRef = useRef<THREE.Group>(null)
  const itchioRef = useRef<THREE.Group>(null)

  /**
   * Applique le matériau à tous les meshes d'un objet.
   */
  const applyMaterial = (object: THREE.Object3D, material: THREE.Material | null) => {
    if (!material) return
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = material
      }
    })
  }

  // Appliquer les matériaux aux modèles
  useEffect(() => {
    applyMaterial(room1.scene, material1)
    applyMaterial(room2.scene, material2)
    applyMaterial(room3.scene, material3)
    applyMaterial(linkedin.scene, material3)
    applyMaterial(github.scene, material3)
    applyMaterial(itchio.scene, material3)

    // Nommer les objets pour le raycasting
    linkedin.scene.name = 'linkedin'
    github.scene.name = 'github'
    itchio.scene.name = 'itchio'
  }, [room1, room2, room3, linkedin, github, itchio, material1, material2, material3])

  /**
   * Gère le clic sur les icônes sociales.
   */
  const handleSocialClick = (network: keyof typeof SOCIAL_URLS) => {
    window.open(SOCIAL_URLS[network], '_blank')
  }

  return (
    <group name="baked-room">
      {/* Pièce partie 1 */}
      <primitive object={room1.scene} />
      
      {/* Pièce partie 2 */}
      <primitive object={room2.scene} />
      
      {/* Pièce partie 3 */}
      <primitive object={room3.scene} />

      {/* Icônes sociales interactives */}
      <group
        ref={linkedinRef}
        onPointerOver={() => linkedinRef.current && onHover([linkedinRef.current])}
        onPointerOut={() => onHover([])}
        onClick={() => handleSocialClick('linkedin')}
      >
        <primitive object={linkedin.scene} />
      </group>

      <group
        ref={githubRef}
        onPointerOver={() => githubRef.current && onHover([githubRef.current])}
        onPointerOut={() => onHover([])}
        onClick={() => handleSocialClick('github')}
      >
        <primitive object={github.scene} />
      </group>

      <group
        ref={itchioRef}
        onPointerOver={() => itchioRef.current && onHover([itchioRef.current])}
        onPointerOut={() => onHover([])}
        onClick={() => handleSocialClick('itchio')}
      >
        <primitive object={itchio.scene} />
      </group>
    </group>
  )
}

// Preload des modèles
useGLTF.preload(MODELS.room1)
useGLTF.preload(MODELS.room2)
useGLTF.preload(MODELS.room3)
useGLTF.preload(MODELS.linkedin)
useGLTF.preload(MODELS.github)
useGLTF.preload(MODELS.itchio)

export default BakedRoom

