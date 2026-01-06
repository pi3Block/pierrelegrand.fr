/**
 * GPGPU Heightmap Generator
 * Utilise les shaders WebGL pour générer des heightmaps sur le GPU
 * Beaucoup plus rapide que le CPU pour les grandes résolutions
 */

import { useMemo, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

// Vertex shader simple pour un quad plein écran
const gpgpuVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

// Fragment shader pour générer le heightmap avec simplex noise
const gpgpuHeightmapShader = /* glsl */ `
  precision highp float;

  uniform float seed;
  uniform float scale;
  uniform int octaves;
  uniform float persistence;
  uniform float lacunarity;
  uniform vec2 offset;
  uniform float erosionStrength;
  uniform float ridgeWeight;

  varying vec2 vUv;

  // Simplex noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                            dot(x12.zw,x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Fractional Brownian Motion
  float fbm(vec2 p, int octaveCount) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float maxValue = 0.0;

    for (int i = 0; i < 8; i++) {
      if (i >= octaveCount) break;
      value += snoise(p * frequency + seed) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value / maxValue;
  }

  // Ridge noise pour les montagnes
  float ridgeNoise(vec2 p, int octaveCount) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float maxValue = 0.0;

    for (int i = 0; i < 8; i++) {
      if (i >= octaveCount) break;
      float n = snoise(p * frequency + seed);
      n = 1.0 - abs(n); // Ridge effect
      n = n * n; // Sharper ridges
      value += n * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value / maxValue;
  }

  // Domain warping pour des patterns plus organiques
  float warpedFbm(vec2 p, int octaveCount) {
    vec2 warp = vec2(
      fbm(p + vec2(0.0, 0.0), 2),
      fbm(p + vec2(5.2, 1.3), 2)
    ) * 2.0;

    return fbm(p + warp, octaveCount);
  }

  void main() {
    vec2 p = (vUv + offset) * scale;

    // Combiner différents types de bruit
    float baseHeight = fbm(p, octaves);
    float ridgeHeight = ridgeNoise(p * 0.5, octaves - 1);
    float warpedHeight = warpedFbm(p * 0.3, octaves - 2);

    // Mélanger les différents bruits
    float height = baseHeight * (1.0 - ridgeWeight) + ridgeHeight * ridgeWeight;
    height = mix(height, warpedHeight, 0.2);

    // Normaliser entre 0 et 1
    height = (height + 1.0) * 0.5;

    // Appliquer une courbe pour plus de variation
    height = pow(height, 1.2);

    // Simuler une érosion simple (aplatir les zones basses)
    if (erosionStrength > 0.0) {
      float erosion = smoothstep(0.0, 0.4, height);
      height = mix(height * 0.3, height, erosion);
    }

    gl_FragColor = vec4(height, height, height, 1.0);
  }
`

export interface GPGPUHeightmapConfig {
  resolution: number
  seed?: number
  scale?: number
  octaves?: number
  persistence?: number
  lacunarity?: number
  offset?: [number, number]
  erosionStrength?: number
  ridgeWeight?: number
}

/**
 * Hook pour générer une heightmap sur le GPU
 */
export function useGPGPUHeightmap(config: GPGPUHeightmapConfig): THREE.DataTexture | null {
  const { gl } = useThree()
  const textureRef = useRef<THREE.DataTexture | null>(null)

  const {
    resolution,
    seed = 12345,
    scale = 4.0,
    octaves = 6,
    persistence = 0.5,
    lacunarity = 2.0,
    offset = [0, 0],
    erosionStrength = 0.5,
    ridgeWeight = 0.3,
  } = config

  useEffect(() => {
    // Créer un render target pour le GPU
    const renderTarget = new THREE.WebGLRenderTarget(resolution, resolution, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    })

    // Créer la scène et la caméra pour le rendu
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    // Créer le material avec le shader
    const material = new THREE.ShaderMaterial({
      vertexShader: gpgpuVertexShader,
      fragmentShader: gpgpuHeightmapShader,
      uniforms: {
        seed: { value: seed },
        scale: { value: scale },
        octaves: { value: octaves },
        persistence: { value: persistence },
        lacunarity: { value: lacunarity },
        offset: { value: new THREE.Vector2(offset[0], offset[1]) },
        erosionStrength: { value: erosionStrength },
        ridgeWeight: { value: ridgeWeight },
      },
    })

    // Créer un quad plein écran
    const geometry = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // Rendre dans le render target
    gl.setRenderTarget(renderTarget)
    gl.render(scene, camera)
    gl.setRenderTarget(null)

    // Lire les pixels du render target
    const pixels = new Float32Array(resolution * resolution * 4)
    gl.readRenderTargetPixels(renderTarget, 0, 0, resolution, resolution, pixels)

    // Créer une DataTexture à partir des pixels
    const data = new Float32Array(resolution * resolution)
    for (let i = 0; i < resolution * resolution; i++) {
      data[i] = pixels[i * 4] // Prendre seulement le canal R
    }

    const texture = new THREE.DataTexture(
      data,
      resolution,
      resolution,
      THREE.RedFormat,
      THREE.FloatType
    )
    texture.needsUpdate = true
    textureRef.current = texture

    // Cleanup
    return () => {
      renderTarget.dispose()
      geometry.dispose()
      material.dispose()
    }
  }, [gl, resolution, seed, scale, octaves, persistence, lacunarity, offset, erosionStrength, ridgeWeight])

  return textureRef.current
}

/**
 * Classe pour générer des heightmaps GPGPU de manière impérative
 */
export class GPGPUHeightmapGenerator {
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private material: THREE.ShaderMaterial
  private mesh: THREE.Mesh
  private renderTarget: THREE.WebGLRenderTarget

  constructor(renderer: THREE.WebGLRenderer, resolution: number = 512) {
    this.renderer = renderer
    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    this.renderTarget = new THREE.WebGLRenderTarget(resolution, resolution, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    })

    this.material = new THREE.ShaderMaterial({
      vertexShader: gpgpuVertexShader,
      fragmentShader: gpgpuHeightmapShader,
      uniforms: {
        seed: { value: 12345 },
        scale: { value: 4.0 },
        octaves: { value: 6 },
        persistence: { value: 0.5 },
        lacunarity: { value: 2.0 },
        offset: { value: new THREE.Vector2(0, 0) },
        erosionStrength: { value: 0.5 },
        ridgeWeight: { value: 0.3 },
      },
    })

    const geometry = new THREE.PlaneGeometry(2, 2)
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.scene.add(this.mesh)
  }

  generate(config: Partial<GPGPUHeightmapConfig> = {}): Float32Array {
    const resolution = this.renderTarget.width

    // Mettre à jour les uniforms
    if (config.seed !== undefined) this.material.uniforms.seed.value = config.seed
    if (config.scale !== undefined) this.material.uniforms.scale.value = config.scale
    if (config.octaves !== undefined) this.material.uniforms.octaves.value = config.octaves
    if (config.persistence !== undefined) this.material.uniforms.persistence.value = config.persistence
    if (config.lacunarity !== undefined) this.material.uniforms.lacunarity.value = config.lacunarity
    if (config.offset !== undefined) this.material.uniforms.offset.value.set(config.offset[0], config.offset[1])
    if (config.erosionStrength !== undefined) this.material.uniforms.erosionStrength.value = config.erosionStrength
    if (config.ridgeWeight !== undefined) this.material.uniforms.ridgeWeight.value = config.ridgeWeight

    // Rendre
    this.renderer.setRenderTarget(this.renderTarget)
    this.renderer.render(this.scene, this.camera)
    this.renderer.setRenderTarget(null)

    // Lire les pixels
    const pixels = new Float32Array(resolution * resolution * 4)
    this.renderer.readRenderTargetPixels(this.renderTarget, 0, 0, resolution, resolution, pixels)

    // Extraire le canal R
    const data = new Float32Array(resolution * resolution)
    for (let i = 0; i < resolution * resolution; i++) {
      data[i] = pixels[i * 4]
    }

    return data
  }

  setResolution(resolution: number): void {
    this.renderTarget.setSize(resolution, resolution)
  }

  dispose(): void {
    this.renderTarget.dispose()
    this.material.dispose()
    this.mesh.geometry.dispose()
  }
}

/**
 * Composant React pour visualiser une heightmap GPGPU
 */
interface GPGPUHeightmapDisplayProps {
  config: GPGPUHeightmapConfig
  size?: number
  heightScale?: number
  position?: [number, number, number]
}

export function GPGPUHeightmapDisplay({
  config,
  size = 100,
  heightScale = 10,
  position = [0, 0, 0],
}: GPGPUHeightmapDisplayProps) {
  const heightmapTexture = useGPGPUHeightmap(config)

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, config.resolution - 1, config.resolution - 1)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [size, config.resolution])

  // Appliquer la heightmap à la géométrie
  useEffect(() => {
    if (!heightmapTexture || !heightmapTexture.image?.data) return

    const positions = geometry.attributes.position
    const data = heightmapTexture.image.data as Float32Array

    for (let i = 0; i < positions.count; i++) {
      const height = data[i] ?? 0
      positions.setY(i, height * heightScale)
    }

    positions.needsUpdate = true
    geometry.computeVertexNormals()
  }, [heightmapTexture, geometry, heightScale])

  return (
    <mesh geometry={geometry} position={position} receiveShadow castShadow>
      <meshStandardMaterial
        color="#4a5568"
        roughness={0.8}
        metalness={0.1}
        flatShading
      />
    </mesh>
  )
}
