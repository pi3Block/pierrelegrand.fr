/**
 * Paintings - Systeme de tableaux interactifs pour la galerie FPS.
 *
 * Affiche des tableaux avec textures PNG/JPG.
 * Detecte quand le joueur regarde un tableau via raycasting.
 *
 * Les positions sont maintenant définies dans galleryConfig.ts (paintingSlots)
 * et associées aux données de contenu ici.
 */

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useGalleryFPSStore, type PaintingInfo } from '../stores/galleryFPSStore'
import { GALLERY_CONFIG } from '../galleryConfig'
import { getPageImagePath } from '@config/assetPaths'

/**
 * Données de contenu d'un tableau (sans position, définie dans config).
 */
interface PaintingData {
  id: string
  title: string
  description: string
  texture: string
  links?: {
    demo?: string
    source?: string
  }
}

/**
 * Configuration complète d'un tableau (données + position du slot).
 */
interface PaintingConfig extends PaintingData {
  position: [number, number, number]
  rotation: [number, number, number]
  size: [number, number]
}

/**
 * Données de contenu des tableaux.
 * L'ordre correspond aux slots définis dans galleryConfig.ts
 */
const PAINTINGS_DATA: PaintingData[] = [
  // Mur Ouest (3 tableaux)
  {
    id: 'portfolio',
    title: 'Portfolio Pierre Legrand',
    description: 'Mon portfolio interactif en 3D avec React Three Fiber',
    texture: getPageImagePath('RougeFutur1.png'),
    links: { demo: 'https://pierrelegrand.fr' },
  },
  {
    id: 'foudafrique',
    title: 'FouDafrique',
    description: 'Site e-commerce de produits africains',
    texture: getPageImagePath('Foudafrique-acceuil.png'),
    links: { demo: 'https://foudafrique.fr' },
  },
  {
    id: '2lb-gestion',
    title: '2LB Gestion',
    description: "Application de gestion d'avis Google",
    texture: getPageImagePath('2Lb-gestion-avis-google.png'),
  },
  // Mur Est (3 tableaux)
  {
    id: 'gt-vintage',
    title: 'GT Vintage',
    description: 'Site de voitures de collection',
    texture: getPageImagePath('GtVicntage1.png'),
  },
  {
    id: 'neghome',
    title: 'NegHome',
    description: 'Plateforme immobiliere',
    texture: getPageImagePath('neghome.com.png'),
    links: { demo: 'https://neghome.com' },
  },
  {
    id: 'mydata',
    title: 'MyData Machine',
    description: 'Solution de gestion de donnees',
    texture: getPageImagePath('MachineMydata5.webp'),
  },
  // Mur Nord (1 tableau)
  {
    id: 'carte-electronique',
    title: 'Carte Electronique',
    description: 'Projet de carte electronique',
    texture: getPageImagePath('CarteElectronique.jpg'),
  },
]

/**
 * Combine les données de contenu avec les positions des slots.
 */
function buildPaintingsConfig(): PaintingConfig[] {
  const slots = GALLERY_CONFIG.paintingSlots
  const configs: PaintingConfig[] = []

  // Associer chaque donnée à un slot dans l'ordre
  PAINTINGS_DATA.forEach((data, index) => {
    const slot = slots[index]
    if (slot) {
      configs.push({
        ...data,
        position: slot.position,
        rotation: slot.rotation,
        size: slot.size,
      })
    }
  })

  return configs
}

const PAINTINGS_CONFIG = buildPaintingsConfig()

/**
 * Composant pour un seul tableau avec texture.
 * Utilise useTexture avec meshBasicMaterial pour compatibilité RenderTexture.
 */
function PaintingFrame({ config }: { config: PaintingConfig }) {
  // Charger la texture avec useTexture de drei
  const texture = useTexture(config.texture)

  // Configurer la texture pour un rendu correct dans RenderTexture
  useMemo(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.generateMipmaps = false
      texture.needsUpdate = true
    }
  }, [texture])

  // Dimensions du cadre
  const frameWidth = config.size[0] + 0.1
  const frameHeight = config.size[1] + 0.1
  const frameDepth = 0.05

  return (
    <group
      position={config.position}
      rotation={config.rotation}
      name={`painting-${config.id}`}
    >
      {/* Cadre doré */}
      <mesh castShadow position={[0, 0, -0.025]}>
        <boxGeometry args={[frameWidth, frameHeight, frameDepth]} />
        <meshStandardMaterial
          color="#B8860B"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Toile avec texture - meshBasicMaterial pour couleurs correctes */}
      <mesh userData={{ paintingId: config.id }} position={[0, 0, 0.001]}>
        <planeGeometry args={config.size} />
        <meshBasicMaterial
          map={texture}
          toneMapped={false}
        />
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

// Précharger toutes les textures au chargement du module
// Cela permet d'éviter les textures noires dans RenderTexture
PAINTINGS_DATA.forEach((data) => {
  useTexture.preload(data.texture)
})
