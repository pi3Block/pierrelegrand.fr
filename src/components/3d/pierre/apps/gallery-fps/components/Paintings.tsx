/**
 * Paintings - Systeme de tableaux interactifs pour la galerie FPS.
 *
 * Affiche des tableaux avec textures KTX2 reelles.
 * Detecte quand le joueur regarde un tableau via raycasting.
 */

import { useRef, useMemo, useEffect, Suspense } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useKTX2 } from '@react-three/drei'
import * as THREE from 'three'
import { useGalleryFPSStore, type PaintingInfo } from '../stores/galleryFPSStore'

// Chemin vers le transcoder Basis
const BASIS_PATH = '/basis/'

/**
 * Configuration d'un tableau.
 */
interface PaintingConfig {
  id: string
  title: string
  description: string
  texture: string // Chemin vers la texture KTX2
  position: [number, number, number]
  rotation: [number, number, number]
  size: [number, number]
  links?: {
    demo?: string
    source?: string
  }
}

/**
 * Liste des tableaux de la galerie.
 * Positions adaptees pour la galerie (taille reduite).
 * Mur gauche: X negatif, Mur droit: X positif, Mur fond: Z negatif
 */
const PAINTINGS_CONFIG: PaintingConfig[] = [
  // Mur gauche (3 tableaux)
  {
    id: 'portfolio',
    title: 'Portfolio 3D',
    description: 'Mon portfolio interactif en 3D avec React Three Fiber',
    texture: '/assets/paintings/portfolio.ktx2',
    position: [-4.9, 1.8, -2],
    rotation: [0, Math.PI / 2, 0],
    size: [1.2, 0.9],
    links: { demo: 'https://pierrelegrand.fr' },
  },
  {
    id: 'joan-art-gallery',
    title: 'Joan Art Gallery',
    description: 'Galerie d\'art 3D immersive en premiere personne',
    texture: '/assets/paintings/joan-art-gallery.ktx2',
    position: [-4.9, 1.8, 0],
    rotation: [0, Math.PI / 2, 0],
    size: [1.2, 0.9],
    links: { demo: 'https://joan-art-gallery.vercel.app', source: 'https://github.com/jrefusta/joan-art-gallery' },
  },
  {
    id: 'joan-os',
    title: 'Joan OS',
    description: 'Systeme d\'exploitation web simule',
    texture: '/assets/paintings/joan-os.ktx2',
    position: [-4.9, 1.8, 2],
    rotation: [0, Math.PI / 2, 0],
    size: [1.2, 0.9],
    links: { demo: 'https://joan-os.vercel.app' },
  },
  // Mur droit (3 tableaux)
  {
    id: 'joan-arcade-machine',
    title: 'Joan Arcade Machine',
    description: 'Borne d\'arcade retro avec jeux integres',
    texture: '/assets/paintings/joan-arcade-machine.ktx2',
    position: [4.9, 1.8, -2],
    rotation: [0, -Math.PI / 2, 0],
    size: [1.2, 0.9],
  },
  {
    id: 'apocalypse-now',
    title: 'Apocalypse Now',
    description: 'Jeu de survie post-apocalyptique',
    texture: '/assets/paintings/apocalypse-now.ktx2',
    position: [4.9, 1.8, 0],
    rotation: [0, -Math.PI / 2, 0],
    size: [1.2, 0.9],
  },
  {
    id: 'starduster',
    title: 'Starduster',
    description: 'Shoot\'em up spatial arcade',
    texture: '/assets/paintings/starduster.ktx2',
    position: [4.9, 1.8, 2],
    rotation: [0, -Math.PI / 2, 0],
    size: [1.2, 0.9],
  },
  // Mur du fond (1 tableau)
  {
    id: 'break-in',
    title: 'Break In',
    description: 'Jeu de casse-briques moderne',
    texture: '/assets/paintings/break-in.ktx2',
    position: [0, 1.8, -4.9],
    rotation: [0, 0, 0],
    size: [1.2, 0.9],
  },
]

/**
 * Composant interne pour charger et afficher la texture d'un tableau.
 */
function PaintingTexture({ texturePath }: { texturePath: string }) {
  const texture = useKTX2(texturePath, BASIS_PATH)

  // Configurer la texture
  useEffect(() => {
    if (texture) {
      texture.flipY = false
      texture.colorSpace = THREE.SRGBColorSpace
    }
  }, [texture])

  return (
    <meshStandardMaterial
      map={texture}
      roughness={0.5}
      metalness={0.1}
    />
  )
}

/**
 * Composant pour un seul tableau avec texture KTX2.
 */
function PaintingFrame({ config }: { config: PaintingConfig }) {
  const meshRef = useRef<THREE.Mesh>(null)

  return (
    <group
      position={config.position}
      rotation={config.rotation}
      name={`painting-${config.id}`}
    >
      {/* Cadre */}
      <mesh castShadow position={[0, 0, -0.02]}>
        <boxGeometry args={[config.size[0] + 0.15, config.size[1] + 0.15, 0.08]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Toile avec texture */}
      <mesh ref={meshRef} userData={{ paintingId: config.id }}>
        <planeGeometry args={config.size} />
        <Suspense fallback={<meshStandardMaterial color="#333333" />}>
          <PaintingTexture texturePath={config.texture} />
        </Suspense>
      </mesh>
    </group>
  )
}

/**
 * Hook pour detecter le tableau regarde par le joueur.
 */
function usePaintingRaycast() {
  const { camera } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const setCurrentPainting = useGalleryFPSStore((s) => s.setCurrentPainting)
  const markPaintingViewed = useGalleryFPSStore((s) => s.markPaintingViewed)
  const isLocked = useGalleryFPSStore((s) => s.isLocked)

  const paintingsGroupRef = useRef<THREE.Group>(null)
  const lastPaintingRef = useRef<string | null>(null)

  useFrame(() => {
    if (!paintingsGroupRef.current || !isLocked) {
      if (lastPaintingRef.current) {
        setCurrentPainting(null)
        lastPaintingRef.current = null
      }
      return
    }

    // Raycast depuis le centre de la camera
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
    raycaster.far = 5 // Distance max de detection

    const intersects = raycaster.intersectObjects(
      paintingsGroupRef.current.children,
      true
    )

    const firstIntersect = intersects[0]
    if (firstIntersect) {
      // Trouver le painting ID dans le userData
      let paintingId: string | null = null
      let obj: THREE.Object3D | null = firstIntersect.object

      while (obj && !paintingId) {
        if (obj.userData?.paintingId) {
          paintingId = obj.userData.paintingId
        }
        obj = obj.parent as THREE.Object3D | null
      }

      if (paintingId && paintingId !== lastPaintingRef.current) {
        const config = PAINTINGS_CONFIG.find((p) => p.id === paintingId)
        if (config) {
          const info: PaintingInfo = {
            id: config.id,
            title: config.title,
            description: config.description,
            links: config.links,
          }
          setCurrentPainting(info)
          markPaintingViewed(paintingId)
          lastPaintingRef.current = paintingId
        }
      }
    } else if (lastPaintingRef.current) {
      setCurrentPainting(null)
      lastPaintingRef.current = null
    }
  })

  return paintingsGroupRef
}

/**
 * Composant principal des tableaux.
 */
export function Paintings() {
  const paintingsGroupRef = usePaintingRaycast()

  return (
    <group ref={paintingsGroupRef} name="paintings">
      {PAINTINGS_CONFIG.map((config) => (
        <PaintingFrame key={config.id} config={config} />
      ))}
    </group>
  )
}

export default Paintings
