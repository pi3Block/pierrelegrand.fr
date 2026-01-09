/**
 * Paintings - Systeme de tableaux interactifs pour la galerie FPS.
 *
 * Affiche des tableaux avec textures PNG/JPG.
 * Detecte quand le joueur regarde un tableau via raycasting.
 *
 * Note: Utilise useLoader de R3F pour charger les textures de maniere
 * compatible avec le contexte RenderTexture.
 */

import { useRef, useMemo } from 'react'
import { useFrame, useThree, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { TextureLoader } from 'three'
import { useGalleryFPSStore, type PaintingInfo } from '../stores/galleryFPSStore'

/**
 * Configuration d'un tableau.
 */
interface PaintingConfig {
  id: string
  title: string
  description: string
  texture: string // Chemin vers la texture PNG/JPG
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
 * Le modele scene.glb est une piece d'environ 10x10 unites.
 * Positions ajustees pour correspondre aux murs du modele.
 */
const PAINTINGS_CONFIG: PaintingConfig[] = [
  // Mur gauche (X = -3.8, face vers +X) - 3 tableaux espaces sur Z
  {
    id: 'portfolio',
    title: 'Portfolio Pierre Legrand',
    description: 'Mon portfolio interactif en 3D avec React Three Fiber',
    texture: '/images/pages/RougeFutur1.png',
    position: [-3.8, 2, 2],
    rotation: [0, Math.PI / 2, 0], // Face vers +X
    size: [1.5, 1.1],
    links: { demo: 'https://pierrelegrand.fr' },
  },
  {
    id: 'foudafrique',
    title: 'FouDafrique',
    description: 'Site e-commerce de produits africains',
    texture: '/images/pages/Foudafrique-acceuil.png',
    position: [-3.8, 2, -1],
    rotation: [0, Math.PI / 2, 0],
    size: [1.5, 1.1],
    links: { demo: 'https://foudafrique.fr' },
  },
  {
    id: '2lb-gestion',
    title: '2LB Gestion',
    description: "Application de gestion d'avis Google",
    texture: '/images/pages/2Lb-gestion-avis-google.png',
    position: [-3.8, 2, -4],
    rotation: [0, Math.PI / 2, 0],
    size: [1.5, 1.1],
  },
  // Mur droit (X = +3.8, face vers -X) - 3 tableaux espaces sur Z
  {
    id: 'gt-vintage',
    title: 'GT Vintage',
    description: 'Site de voitures de collection',
    texture: '/images/pages/GtVicntage1.png',
    position: [3.8, 2, 2],
    rotation: [0, -Math.PI / 2, 0], // Face vers -X
    size: [1.5, 1.1],
  },
  {
    id: 'neghome',
    title: 'NegHome',
    description: 'Plateforme immobiliere',
    texture: '/images/pages/neghome.com.png',
    position: [3.8, 2, -1],
    rotation: [0, -Math.PI / 2, 0],
    size: [1.5, 1.1],
    links: { demo: 'https://neghome.com' },
  },
  {
    id: 'mydata',
    title: 'MyData Machine',
    description: 'Solution de gestion de donnees',
    texture: '/images/pages/MachineMydata5.webp',
    position: [3.8, 2, -4],
    rotation: [0, -Math.PI / 2, 0],
    size: [1.5, 1.1],
  },
  // Mur du fond (Z = -5.8, face vers +Z) - 1 tableau central
  {
    id: 'carte-electronique',
    title: 'Carte Electronique',
    description: 'Projet de carte electronique',
    texture: '/images/pages/CarteElectronique.jpg',
    position: [0, 2, -5.8],
    rotation: [0, 0, 0], // Face vers +Z
    size: [2, 1.5],
  },
]

/**
 * Composant pour un seul tableau avec texture.
 * Utilise useLoader de R3F pour charger les textures de maniere
 * compatible avec le contexte RenderTexture.
 */
function PaintingFrame({ config }: { config: PaintingConfig }) {
  const meshRef = useRef<THREE.Mesh>(null)

  // useLoader de R3F est compatible avec RenderTexture
  const texture = useLoader(TextureLoader, config.texture)

  // Configurer la texture une seule fois via useMemo
  useMemo(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true
    }
  }, [texture])

  return (
    <group
      position={config.position}
      rotation={config.rotation}
      name={`painting-${config.id}`}
    >
      {/* Cadre dore */}
      <mesh castShadow position={[0, 0, -0.03]}>
        <boxGeometry args={[config.size[0] + 0.15, config.size[1] + 0.15, 0.08]} />
        <meshStandardMaterial color="#8B6914" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Toile avec texture */}
      <mesh ref={meshRef} userData={{ paintingId: config.id }}>
        <planeGeometry args={config.size} />
        <meshBasicMaterial map={texture} />
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
