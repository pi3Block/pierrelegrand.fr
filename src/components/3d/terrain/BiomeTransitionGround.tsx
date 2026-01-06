/**
 * Sol avec transition entre biomes
 * Utilise un shader pour blender les textures/couleurs de différents biomes
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import { RigidBody, CylinderCollider } from '@react-three/rapier'
import type { BiomeType } from '@/config/proceduralConfig'

// Couleurs par défaut des biomes
const BIOME_COLORS: Record<BiomeType, { primary: THREE.Color; secondary: THREE.Color }> = {
  tech: {
    primary: new THREE.Color('#1e1b4b'),
    secondary: new THREE.Color('#4f46e5'),
  },
  nature: {
    primary: new THREE.Color('#166534'),
    secondary: new THREE.Color('#22c55e'),
  },
  crypto: {
    primary: new THREE.Color('#78350f'),
    secondary: new THREE.Color('#f59e0b'),
  },
}

/**
 * Vertex Shader pour le sol avec transition
 */
const transitionVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

/**
 * Fragment Shader pour le blending de biomes
 */
const transitionFragmentShader = /* glsl */ `
  uniform float time;
  uniform vec3 centerPosition;
  uniform float radius;
  uniform float transitionWidth;

  // Couleurs des biomes (current biome)
  uniform vec3 biomeColorPrimary;
  uniform vec3 biomeColorSecondary;

  // Couleurs de la zone hub/neutre
  uniform vec3 hubColor;

  varying vec2 vUv;
  varying vec3 vWorldPosition;

  // Fonction de bruit simplex simplifié
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                            dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Smoothstep amélioré
  float smootherstep(float edge0, float edge1, float x) {
    x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
  }

  void main() {
    // Distance au centre du biome
    vec2 toCenter = vWorldPosition.xz - centerPosition.xz;
    float dist = length(toCenter);

    // Calcul du facteur de transition
    float innerRadius = radius - transitionWidth;
    float outerRadius = radius + transitionWidth;
    float transitionFactor = smootherstep(innerRadius, outerRadius, dist);

    // Pattern de base du biome (grille/organic selon type)
    float noise1 = snoise(vWorldPosition.xz * 0.1 + time * 0.02);
    float noise2 = snoise(vWorldPosition.xz * 0.3 - time * 0.01);
    float pattern = noise1 * 0.6 + noise2 * 0.4;

    // Mélange des couleurs du biome
    vec3 biomeColor = mix(biomeColorPrimary, biomeColorSecondary, pattern * 0.5 + 0.5);

    // Transition vers la zone hub
    vec3 finalColor = mix(biomeColor, hubColor, transitionFactor);

    // Effet de brillance sur les bords de transition
    float edgeGlow = smootherstep(innerRadius - 1.0, innerRadius + 1.0, dist) *
                     (1.0 - smootherstep(outerRadius - 1.0, outerRadius + 1.0, dist));
    finalColor += biomeColorSecondary * edgeGlow * 0.3 * (0.5 + 0.5 * sin(time * 2.0));

    // Légère variation de luminosité
    float brightness = 0.9 + pattern * 0.1;
    finalColor *= brightness;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

/**
 * Création du matériau shader
 */
const BiomeTransitionMaterial = shaderMaterial(
  {
    time: 0,
    centerPosition: new THREE.Vector3(0, 0, 0),
    radius: 18,
    transitionWidth: 4,
    biomeColorPrimary: new THREE.Color('#166534'),
    biomeColorSecondary: new THREE.Color('#22c55e'),
    hubColor: new THREE.Color('#374151'),
  },
  transitionVertexShader,
  transitionFragmentShader
)

extend({ BiomeTransitionMaterial })

// Déclaration TypeScript
declare module '@react-three/fiber' {
  interface ThreeElements {
    biomeTransitionMaterial: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        time?: number
        centerPosition?: THREE.Vector3
        radius?: number
        transitionWidth?: number
        biomeColorPrimary?: THREE.Color
        biomeColorSecondary?: THREE.Color
        hubColor?: THREE.Color
        attach?: string
      },
      HTMLElement
    >
  }
}

interface BiomeTransitionGroundProps {
  biome: BiomeType
  center: [number, number, number]
  radius?: number
  transitionWidth?: number
  hubColor?: string
}

/**
 * Composant de sol avec transition de biome
 */
export function BiomeTransitionGround({
  biome,
  center,
  radius = 18,
  transitionWidth = 4,
  hubColor = '#374151',
}: BiomeTransitionGroundProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const colors = BIOME_COLORS[biome]
  const centerVec = useMemo(() => new THREE.Vector3(...center), [center])

  // Animer le temps
  useFrame((state) => {
    const mesh = meshRef.current
    if (mesh && mesh.material && 'uniforms' in mesh.material) {
      const mat = mesh.material as THREE.ShaderMaterial
      if (mat.uniforms.time) {
        mat.uniforms.time.value = state.clock.elapsedTime
      }
    }
  })

  const geometry = useMemo(() => {
    const geo = new THREE.CircleGeometry(radius + transitionWidth, 64)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [radius, transitionWidth])

  // Créer le matériau avec les uniforms
  const material = useMemo(() => {
    const mat = new BiomeTransitionMaterial()
    if (mat.uniforms.centerPosition) mat.uniforms.centerPosition.value = centerVec
    if (mat.uniforms.radius) mat.uniforms.radius.value = radius
    if (mat.uniforms.transitionWidth) mat.uniforms.transitionWidth.value = transitionWidth
    if (mat.uniforms.biomeColorPrimary) mat.uniforms.biomeColorPrimary.value = colors.primary
    if (mat.uniforms.biomeColorSecondary) mat.uniforms.biomeColorSecondary.value = colors.secondary
    if (mat.uniforms.hubColor) mat.uniforms.hubColor.value = new THREE.Color(hubColor)
    return mat
  }, [centerVec, radius, transitionWidth, colors, hubColor])

  const colliderRadius = radius + transitionWidth

  return (
    <group position={center}>
      {/* Collider physique pour la zone de transition */}
      <RigidBody type="fixed" friction={0.7} restitution={0}>
        <CylinderCollider args={[0.02, colliderRadius]} position={[0, 0.02, 0]} />
      </RigidBody>

      {/* Mesh visuel avec shader - légèrement au-dessus pour éviter le z-fighting */}
      <mesh ref={meshRef} geometry={geometry} material={material} position={[0, 0.02, 0]} receiveShadow />
    </group>
  )
}

/**
 * Composant pour afficher les limites de transition (debug)
 */
export function BiomeTransitionDebug({
  center,
  radius,
  transitionWidth = 4,
  color = '#ff0000',
}: {
  center: [number, number, number]
  radius: number
  transitionWidth?: number
  color?: string
}) {
  const innerRadius = radius - transitionWidth
  const outerRadius = radius + transitionWidth

  return (
    <group position={center}>
      {/* Cercle intérieur (début transition) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[innerRadius - 0.1, innerRadius + 0.1, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>

      {/* Cercle extérieur (fin transition) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[outerRadius - 0.1, outerRadius + 0.1, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>

      {/* Rayon du biome */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[radius - 0.05, radius + 0.05, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
    </group>
  )
}
