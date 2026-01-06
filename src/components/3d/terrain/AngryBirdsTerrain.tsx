/**
 * AngryBirdsTerrain - Terrain low poly style Angry Birds
 * Collines douces vertes avec terre brune
 * FlatShading pour effet cartoon
 */

import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { RigidBody, HeightfieldCollider } from '@react-three/rapier'
import { createFractalNoise2D } from '@utils/procedural'

interface AngryBirdsTerrainProps {
  /** Taille du terrain (cote du carre) */
  size?: number
  /** Resolution (nombre de segments) - bas = low poly */
  resolution?: number
  /** Seed pour la generation */
  seed?: number
  /** Echelle de hauteur des collines */
  heightScale?: number
  /** Position du terrain */
  position?: [number, number, number]
  /** Callback pour recuperer les hauteurs (pour placer les structures) */
  onHeightmapReady?: (getHeight: (x: number, z: number) => number) => void
  /** Rayon de la zone plate centrale (0 = pas de zone plate) */
  flatCenterRadius?: number
}

// Palette de couleurs Angry Birds
const COLORS = {
  grassBright: new THREE.Color('#7CB342'),  // Vert vif
  grassMedium: new THREE.Color('#8BC34A'),  // Vert moyen
  grassDark: new THREE.Color('#689F38'),    // Vert fonce
  dirt: new THREE.Color('#8D6E63'),         // Terre brune
  dirtDark: new THREE.Color('#6D4C41'),     // Terre foncee
}

/**
 * Terrain procedural style Angry Birds
 * Utilise Simplex noise pour des collines douces
 */
export function AngryBirdsTerrain({
  size = 80,
  resolution = 40,  // Low poly
  seed = 54321,
  heightScale = 4,
  position = [0, 0, 0],
  onHeightmapReady,
  flatCenterRadius = 0,
}: AngryBirdsTerrainProps) {
  // Configuration du bruit pour collines douces
  const noiseConfig = useMemo(() => ({
    seed,
    octaves: 2,           // Peu d'octaves = lisse
    persistence: 0.65,    // Maintient amplitude
    scale: 0.015,         // Grande longueur d'onde = collines douces
  }), [seed])

  // Fonction de hauteur (exposee pour placement des structures)
  const getHeight = useMemo(() => {
    const noise = createFractalNoise2D(noiseConfig)
    return (worldX: number, worldZ: number) => {
      const x = worldX - position[0]
      const z = worldZ - position[2]
      const distFromCenter = Math.sqrt(x * x + z * z)

      // Zone plate au centre si flatCenterRadius > 0
      if (flatCenterRadius > 0 && distFromCenter < flatCenterRadius) {
        return 0
      }

      // Transition douce entre zone plate et collines
      const transitionWidth = flatCenterRadius * 0.5
      let flatFactor = 1
      if (flatCenterRadius > 0 && distFromCenter < flatCenterRadius + transitionWidth) {
        flatFactor = (distFromCenter - flatCenterRadius) / transitionWidth
        flatFactor = flatFactor * flatFactor // Smoothstep quadratique
      }

      const noiseValue = (noise(worldX, worldZ) + 1) / 2

      // Attenuation aux bords
      const normalizedDist = distFromCenter / (size / 2)
      const falloff = Math.max(0, 1 - Math.pow(normalizedDist, 3))

      return noiseValue * falloff * heightScale * flatFactor
    }
  }, [noiseConfig, position, size, heightScale, flatCenterRadius])

  // Callback pour exposer la fonction de hauteur
  useEffect(() => {
    if (onHeightmapReady) {
      onHeightmapReady(getHeight)
    }
  }, [getHeight, onHeightmapReady])

  // Generer les hauteurs pour le heightfield collider
  // Format: tableau 1D row-major (resolution+1) x (resolution+1)
  const heightfieldData = useMemo(() => {
    const noise = createFractalNoise2D(noiseConfig)
    const cols = resolution + 1
    const rows = resolution + 1
    const heights = new Float32Array(cols * rows)
    const cellSize = size / resolution

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        // Position dans l'espace local (centre a 0,0)
        const x = (i - resolution / 2) * cellSize
        const z = (j - resolution / 2) * cellSize

        // Coordonnees monde
        const worldX = x + position[0]
        const worldZ = z + position[2]

        // Distance du centre
        const distFromCenter = Math.sqrt(x * x + z * z)

        // Zone plate au centre
        let height = 0
        if (flatCenterRadius === 0 || distFromCenter >= flatCenterRadius) {
          const transitionWidth = flatCenterRadius * 0.5
          let flatFactor = 1
          if (flatCenterRadius > 0 && distFromCenter < flatCenterRadius + transitionWidth) {
            flatFactor = (distFromCenter - flatCenterRadius) / transitionWidth
            flatFactor = flatFactor * flatFactor
          }

          const noiseValue = (noise(worldX, worldZ) + 1) / 2
          const normalizedDist = distFromCenter / (size / 2)
          const falloff = Math.max(0, 1 - Math.pow(normalizedDist, 3))

          height = noiseValue * falloff * heightScale * flatFactor
        }

        // Rapier heightfield: row-major order
        heights[j * cols + i] = height
      }
    }

    return { heights, rows, cols }
  }, [size, resolution, noiseConfig, position, heightScale, flatCenterRadius])

  // Generer la geometrie visuelle (separee du collider)
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution)
    geo.rotateX(-Math.PI / 2)

    const noise = createFractalNoise2D(noiseConfig)
    const positions = geo.attributes.position
    if (!positions) return geo

    const colors = new Float32Array(positions.count * 3)

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const z = positions.getZ(i)

      // Coordonnees monde
      const worldX = x + position[0]
      const worldZ = z + position[2]

      // Distance du centre
      const distFromCenter = Math.sqrt(x * x + z * z)

      // Zone plate au centre
      let height = 0
      if (flatCenterRadius === 0 || distFromCenter >= flatCenterRadius) {
        const transitionWidth = flatCenterRadius * 0.5
        let flatFactor = 1
        if (flatCenterRadius > 0 && distFromCenter < flatCenterRadius + transitionWidth) {
          flatFactor = (distFromCenter - flatCenterRadius) / transitionWidth
          flatFactor = flatFactor * flatFactor
        }

        const noiseValue = (noise(worldX, worldZ) + 1) / 2
        const normalizedDist = distFromCenter / (size / 2)
        const falloff = Math.max(0, 1 - Math.pow(normalizedDist, 3))

        height = noiseValue * falloff * heightScale * flatFactor
      }

      positions.setY(i, height)

      // Couleur basee sur la hauteur (zone plate = herbe moyenne)
      const normalizedHeight = flatCenterRadius > 0 && distFromCenter < flatCenterRadius
        ? 0.4
        : height / heightScale
      const color = getTerrainColor(normalizedHeight)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    positions.needsUpdate = true
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()

    return geo
  }, [size, resolution, noiseConfig, position, heightScale, flatCenterRadius])

  // Materiau avec flatShading pour effet low poly
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,  // Essentiel pour le look low poly
    })
  }, [])

  // Nettoyage
  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  return (
    <RigidBody type="fixed" colliders={false} friction={1} position={position}>
      {/* HeightfieldCollider - beaucoup plus stable que trimesh pour les terrains */}
      <HeightfieldCollider
        args={[
          heightfieldData.rows - 1,  // nrows (nombre de cellules, pas de vertices)
          heightfieldData.cols - 1,  // ncols
          Array.from(heightfieldData.heights),  // heights array (doit etre number[])
          { x: size, y: 1, z: size } // scale
        ]}
        friction={1}
        restitution={0}
      />
      {/* Mesh visuel */}
      <mesh
        geometry={geometry}
        material={material}
        receiveShadow
        castShadow
      />
    </RigidBody>
  )
}

/**
 * Calcule la couleur du terrain en fonction de la hauteur
 */
function getTerrainColor(normalizedHeight: number): THREE.Color {
  const h = Math.max(0, Math.min(1, normalizedHeight))

  // Gradient: terre foncee -> terre -> herbe foncee -> herbe moyenne -> herbe vive
  if (h < 0.1) {
    return COLORS.dirtDark.clone().lerp(COLORS.dirt, h / 0.1)
  } else if (h < 0.25) {
    return COLORS.dirt.clone().lerp(COLORS.grassDark, (h - 0.1) / 0.15)
  } else if (h < 0.5) {
    return COLORS.grassDark.clone().lerp(COLORS.grassMedium, (h - 0.25) / 0.25)
  } else if (h < 0.75) {
    return COLORS.grassMedium.clone().lerp(COLORS.grassBright, (h - 0.5) / 0.25)
  } else {
    // Sommet des collines - vert tres vif
    return COLORS.grassBright.clone()
  }
}

/**
 * Sol plat simple pour zones de jeu
 */
export function FlatGround({
  size = 30,
  position = [0, 0, 0],
}: {
  size?: number
  position?: [number, number, number]
}) {
  return (
    <RigidBody type="fixed" position={position} friction={1}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial
          color={COLORS.grassMedium}
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>
    </RigidBody>
  )
}
