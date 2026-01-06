/**
 * Versions circulaires des sols pour les BiomeZones
 * Incluent un collider cylindrique pour la physique
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CylinderCollider } from '@react-three/rapier'
import * as THREE from 'three'

// ============================================================================
// SOL NATURE CIRCULAIRE
// ============================================================================

interface CircularNatureGroundProps {
  radius?: number
  position?: [number, number, number]
  variant?: 'grass' | 'dirt' | 'forest'
}

const NATURE_PALETTES = {
  grass: {
    base: new THREE.Color('#2d5a27'),
    accent: new THREE.Color('#4a7c43'),
    dark: new THREE.Color('#1a3518'),
  },
  dirt: {
    base: new THREE.Color('#6b4423'),
    accent: new THREE.Color('#8b6914'),
    dark: new THREE.Color('#3d2817'),
  },
  forest: {
    base: new THREE.Color('#1e4620'),
    accent: new THREE.Color('#2d6a4f'),
    dark: new THREE.Color('#0d1f0f'),
  },
}

const natureVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const natureFragmentShader = `
  uniform vec3 uColorBase;
  uniform vec3 uColorAccent;
  uniform vec3 uColorDark;
  uniform float uTime;
  uniform float uRadius;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  // Bruit simplex 2D
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  void main() {
    // Position en coordonnées polaires depuis le centre
    vec2 centered = vPosition.xz;
    float dist = length(centered) / uRadius;
    
    // Bruit multi-échelle
    float noise1 = snoise(centered * 0.2) * 0.5 + 0.5;
    float noise2 = snoise(centered * 0.8) * 0.5 + 0.5;
    float noise3 = snoise(centered * 2.0 + uTime * 0.02) * 0.5 + 0.5;
    
    // Mélange des couleurs
    vec3 color = mix(uColorBase, uColorAccent, noise1 * 0.7);
    color = mix(color, uColorDark, noise2 * 0.25);
    
    // Brins d'herbe / grains
    color += (noise3 - 0.5) * 0.06;
    
    // Assombrissement vers les bords (effet naturel)
    color = mix(color, uColorDark, smoothstep(0.6, 1.0, dist) * 0.4);
    
    // Légère brillance au centre
    color += uColorAccent * smoothstep(0.3, 0.0, dist) * 0.1;
    
    gl_FragColor = vec4(color, 1.0);
  }
`

export function CircularNatureGround({
  radius = 18,
  position = [0, 0.08, 0],
  variant = 'grass',
}: CircularNatureGroundProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const palette = NATURE_PALETTES[variant]

  const uniforms = useMemo(
    () => ({
      uColorBase: { value: palette.base },
      uColorAccent: { value: palette.accent },
      uColorDark: { value: palette.dark },
      uTime: { value: 0 },
      uRadius: { value: radius },
    }),
    [palette, radius]
  )

  useFrame((state) => {
    const mesh = meshRef.current
    if (mesh) {
      const material = mesh.material
      if (material instanceof THREE.ShaderMaterial && material.uniforms.uTime) {
        material.uniforms.uTime.value = state.clock.elapsedTime
      }
    }
  })

  return (
    <RigidBody type="fixed" friction={1.2} position={position}>
      {/* Collider cylindrique pour la physique */}
      <CylinderCollider args={[0.05, radius]} />

      {/* Mesh visuel avec shader */}
      <mesh ref={meshRef} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 64]} />
        <shaderMaterial
          vertexShader={natureVertexShader}
          fragmentShader={natureFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
    </RigidBody>
  )
}

// ============================================================================
// SOL ARCADE CIRCULAIRE (Synthwave/Tron)
// ============================================================================

interface CircularArcadeGroundProps {
  radius?: number
  position?: [number, number, number]
  variant?: 'synthwave' | 'tron' | 'vaporwave' | 'disco'
  speed?: number
}

const ARCADE_THEMES = {
  synthwave: {
    gridColor: new THREE.Color('#ff00ff'),
    glowColor: new THREE.Color('#00ffff'),
    bgColor: new THREE.Color('#0a0015'),
  },
  tron: {
    gridColor: new THREE.Color('#00d4ff'),
    glowColor: new THREE.Color('#ffffff'),
    bgColor: new THREE.Color('#000810'),
  },
  vaporwave: {
    gridColor: new THREE.Color('#ff71ce'),
    glowColor: new THREE.Color('#01cdfe'),
    bgColor: new THREE.Color('#1a0a2e'),
  },
  disco: {
    gridColor: new THREE.Color('#ffff00'),
    glowColor: new THREE.Color('#ff00ff'),
    bgColor: new THREE.Color('#1a0a0a'),
  },
}

const arcadeVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const arcadeFragmentShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uRadius;
  uniform vec3 uGridColor;
  uniform vec3 uGlowColor;
  uniform vec3 uBgColor;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  // Grille sans fwidth (plus stable, pas de scintillement)
  float grid(vec2 uv, float cellSize, float lineWidth) {
    vec2 wrapped = mod(uv, cellSize) / cellSize;
    vec2 lines = smoothstep(0.0, lineWidth, wrapped) * smoothstep(1.0, 1.0 - lineWidth, wrapped);
    return 1.0 - lines.x * lines.y;
  }
  
  void main() {
    vec2 pos = vPosition.xz;
    float dist = length(pos) / uRadius;
    
    // Grilles
    float mainGrid = grid(pos, 2.0, 0.08);
    float subGrid = grid(pos, 0.5, 0.15) * 0.25;
    
    // Cercles concentriques animés
    float rings = smoothstep(0.4, 0.6, sin(dist * 15.0 - uTime * uSpeed)) * 0.3;
    
    float gridPattern = max(mainGrid, subGrid) + rings;
    
    // Pulsation douce
    float pulse = sin(uTime * 2.0) * 0.1 + 0.9;
    
    // Couleur de base
    vec3 color = uBgColor;
    
    // Grille avec couleur
    vec3 gridColorFinal = mix(uGridColor, uGlowColor, sin(uTime * 0.3 + dist * 3.0) * 0.5 + 0.5);
    color = mix(color, gridColorFinal * pulse, gridPattern * 0.8);
    
    // Glow central
    float centerGlow = exp(-dist * 2.5) * 0.25;
    color += uGlowColor * centerGlow;
    
    // Fade vers les bords
    color = mix(color, uBgColor, smoothstep(0.7, 1.0, dist) * 0.5);
    
    gl_FragColor = vec4(color, 1.0);
  }
`

export function CircularArcadeGround({
  radius = 18,
  position = [0, 0.08, 0],
  variant = 'synthwave',
  speed = 1.0,
}: CircularArcadeGroundProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const theme = ARCADE_THEMES[variant]

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: speed },
      uRadius: { value: radius },
      uGridColor: { value: theme.gridColor },
      uGlowColor: { value: theme.glowColor },
      uBgColor: { value: theme.bgColor },
    }),
    [theme, speed, radius]
  )

  useFrame((state) => {
    const mesh = meshRef.current
    if (mesh) {
      const material = mesh.material
      if (material instanceof THREE.ShaderMaterial && material.uniforms.uTime) {
        material.uniforms.uTime.value = state.clock.elapsedTime
      }
    }
  })

  return (
    <RigidBody type="fixed" friction={0.8} position={position}>
      {/* Collider cylindrique pour la physique */}
      <CylinderCollider args={[0.05, radius]} />

      {/* Mesh visuel avec shader */}
      <mesh ref={meshRef} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 64]} />
        <shaderMaterial
          vertexShader={arcadeVertexShader}
          fragmentShader={arcadeFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
    </RigidBody>
  )
}

// ============================================================================
// SOL CRYPTO CIRCULAIRE (Doré/Brillant)
// ============================================================================

interface CircularCryptoGroundProps {
  radius?: number
  position?: [number, number, number]
}

const cryptoVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const cryptoFragmentShader = `
  uniform float uTime;
  uniform float uRadius;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  // Hash pour le bruit
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  void main() {
    vec2 pos = vPosition.xz;
    float dist = length(pos) / uRadius;
    float angle = atan(pos.y, pos.x);
    
    // Couleurs crypto (or, orange, ambre)
    vec3 goldDark = vec3(0.2, 0.12, 0.02);
    vec3 goldMid = vec3(0.6, 0.4, 0.1);
    vec3 goldBright = vec3(0.95, 0.7, 0.2);
    vec3 orange = vec3(0.95, 0.5, 0.1);
    
    // Motif hexagonal (blockchain)
    vec2 hexUv = pos * 0.5;
    float hex = sin(hexUv.x * 3.0) * sin(hexUv.y * 1.732) + sin(hexUv.x * 1.5 + hexUv.y * 2.598);
    hex = smoothstep(0.8, 1.0, abs(hex));
    
    // Cercles de données
    float dataRings = sin(dist * 15.0 - uTime * 0.5) * 0.5 + 0.5;
    dataRings = smoothstep(0.4, 0.6, dataRings);
    
    // Lignes radiales (rayons)
    float rays = sin(angle * 12.0 + uTime * 0.3) * 0.5 + 0.5;
    rays = smoothstep(0.7, 0.9, rays) * (1.0 - dist);
    
    // Bruit de texture
    float n = noise(pos * 2.0 + uTime * 0.1) * 0.3;
    
    // Mélange des couleurs
    vec3 color = goldDark;
    color = mix(color, goldMid, n + 0.3);
    color = mix(color, goldBright, hex * 0.4);
    color = mix(color, orange, dataRings * 0.3);
    color += goldBright * rays * 0.3;
    
    // Brillance centrale
    color += goldBright * exp(-dist * 2.0) * 0.2;
    
    // Pulsation
    float pulse = sin(uTime * 2.0) * 0.1 + 0.9;
    color *= pulse;
    
    // Fade aux bords
    color = mix(color, goldDark * 0.5, smoothstep(0.7, 1.0, dist));
    
    gl_FragColor = vec4(color, 1.0);
  }
`

export function CircularCryptoGround({
  radius = 18,
  position = [0, 0.08, 0],
}: CircularCryptoGroundProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRadius: { value: radius },
    }),
    [radius]
  )

  useFrame((state) => {
    const mesh = meshRef.current
    if (mesh) {
      const material = mesh.material
      if (material instanceof THREE.ShaderMaterial && material.uniforms.uTime) {
        material.uniforms.uTime.value = state.clock.elapsedTime
      }
    }
  })

  return (
    <RigidBody type="fixed" friction={1.0} position={position}>
      {/* Collider cylindrique pour la physique */}
      <CylinderCollider args={[0.05, radius]} />

      {/* Mesh visuel avec shader */}
      <mesh ref={meshRef} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 64]} />
        <shaderMaterial
          vertexShader={cryptoVertexShader}
          fragmentShader={cryptoFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
    </RigidBody>
  )
}

