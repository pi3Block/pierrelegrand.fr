/**
 * Matériau de terrain procédural avec shader personnalisé
 * Coloration par hauteur, normale, et blending de textures
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

/**
 * Vertex Shader - Applique le heightmap et calcule les données
 */
const terrainVertexShader = /* glsl */ `
  uniform sampler2D heightMap;
  uniform float heightScale;
  uniform vec2 chunkOffset;
  uniform float chunkSize;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vHeight;

  void main() {
    vUv = uv;

    // Échantillonner la heightmap
    float height = texture2D(heightMap, uv).r;
    vHeight = height;

    // Déplacer le vertex verticalement
    vec3 newPosition = position;
    newPosition.y += height * heightScale;
    vPosition = newPosition;

    // Recalculer les normales par différences finies
    float texelSize = 1.0 / 64.0; // Résolution de la heightmap
    float hL = texture2D(heightMap, uv - vec2(texelSize, 0.0)).r * heightScale;
    float hR = texture2D(heightMap, uv + vec2(texelSize, 0.0)).r * heightScale;
    float hD = texture2D(heightMap, uv - vec2(0.0, texelSize)).r * heightScale;
    float hU = texture2D(heightMap, uv + vec2(0.0, texelSize)).r * heightScale;

    vNormal = normalize(vec3(hL - hR, 2.0, hD - hU));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`

/**
 * Fragment Shader - Coloration par hauteur et éclairage
 */
const terrainFragmentShader = /* glsl */ `
  uniform vec3 lowColor;      // Couleur basse (eau/sable)
  uniform vec3 midColor;      // Couleur moyenne (herbe)
  uniform vec3 highColor;     // Couleur haute (roche)
  uniform vec3 peakColor;     // Couleur sommet (neige)
  uniform float time;
  uniform vec3 sunDirection;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vHeight;

  void main() {
    // Gradient de couleur par hauteur
    vec3 color;
    if (vHeight < 0.25) {
      color = mix(lowColor, midColor, vHeight / 0.25);
    } else if (vHeight < 0.5) {
      color = mix(midColor, highColor, (vHeight - 0.25) / 0.25);
    } else if (vHeight < 0.75) {
      color = mix(highColor, peakColor, (vHeight - 0.5) / 0.25);
    } else {
      color = peakColor;
    }

    // Éclairage diffus simple
    float diffuse = max(dot(vNormal, sunDirection), 0.0);
    float ambient = 0.3;
    float light = ambient + diffuse * 0.7;

    // Légère variation par la pente (plus sombre sur les pentes raides)
    float slope = 1.0 - vNormal.y;
    color = mix(color, color * 0.7, slope * 0.5);

    gl_FragColor = vec4(color * light, 1.0);
  }
`

/**
 * Création du matériau shader avec drei
 */
const TerrainShaderMaterial = shaderMaterial(
  {
    heightMap: null,
    heightScale: 10.0,
    chunkOffset: new THREE.Vector2(0, 0),
    chunkSize: 32.0,
    lowColor: new THREE.Color('#c2b280'),   // Sable
    midColor: new THREE.Color('#4a7c59'),   // Herbe
    highColor: new THREE.Color('#6b7280'),  // Roche
    peakColor: new THREE.Color('#ffffff'),  // Neige
    time: 0,
    sunDirection: new THREE.Vector3(0.5, 0.8, 0.3).normalize(),
  },
  terrainVertexShader,
  terrainFragmentShader
)

// Étendre pour utilisation dans R3F
extend({ TerrainShaderMaterial })

// Déclaration TypeScript pour le matériau custom
declare module '@react-three/fiber' {
  interface ThreeElements {
    terrainShaderMaterial: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        heightMap?: THREE.Texture | null
        heightScale?: number
        chunkOffset?: THREE.Vector2
        chunkSize?: number
        lowColor?: THREE.Color
        midColor?: THREE.Color
        highColor?: THREE.Color
        peakColor?: THREE.Color
        time?: number
        sunDirection?: THREE.Vector3
        attach?: string
      },
      HTMLElement
    >
  }
}

interface TerrainMaterialProps {
  heightMap?: THREE.Texture | null
  heightScale?: number
  colorScheme?: 'default' | 'desert' | 'arctic' | 'volcanic'
}

/**
 * Composant wrapper pour le matériau de terrain
 */
export function TerrainMaterial({
  heightMap = null,
  heightScale = 10,
  colorScheme = 'default',
}: TerrainMaterialProps) {
  const colors = useMemo(() => {
    switch (colorScheme) {
      case 'desert':
        return {
          lowColor: new THREE.Color('#d4a373'),
          midColor: new THREE.Color('#bc6c25'),
          highColor: new THREE.Color('#6b4423'),
          peakColor: new THREE.Color('#fefae0'),
        }
      case 'arctic':
        return {
          lowColor: new THREE.Color('#a8dadc'),
          midColor: new THREE.Color('#e9ecef'),
          highColor: new THREE.Color('#dee2e6'),
          peakColor: new THREE.Color('#ffffff'),
        }
      case 'volcanic':
        return {
          lowColor: new THREE.Color('#2d2d2d'),
          midColor: new THREE.Color('#4a4a4a'),
          highColor: new THREE.Color('#8b0000'),
          peakColor: new THREE.Color('#ff4500'),
        }
      default:
        return {
          lowColor: new THREE.Color('#c2b280'),
          midColor: new THREE.Color('#4a7c59'),
          highColor: new THREE.Color('#6b7280'),
          peakColor: new THREE.Color('#ffffff'),
        }
    }
  }, [colorScheme])

  return (
    <terrainShaderMaterial
      heightMap={heightMap}
      heightScale={heightScale}
      {...colors}
    />
  )
}

/**
 * Hook pour créer une texture heightmap à partir de données Float32Array
 */
export function useHeightmapTexture(
  data: Float32Array | null,
  width: number,
  height: number
): THREE.DataTexture | null {
  return useMemo(() => {
    if (!data) return null

    const texture = new THREE.DataTexture(
      data,
      width,
      height,
      THREE.RedFormat,
      THREE.FloatType
    )
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearFilter
    texture.needsUpdate = true

    return texture
  }, [data, width, height])
}

export { TerrainShaderMaterial }
