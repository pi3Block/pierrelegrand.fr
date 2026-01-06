/**
 * Système d'eau procédural
 * Inclut lacs, rivières, et effets de surface
 * Utilise WaterFactory pour positionner l'eau relativement au terrain
 */

import { useRef, useMemo } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { useWaterPlacements, type WaterPlacement } from '@factories/WaterFactory'
import type { WaterColorConfig } from '@config/worldConfig'

// Shader pour l'eau stylisée
const waterVertexShader = /* glsl */ `
  uniform float time;
  uniform float waveHeight;
  uniform float waveSpeed;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying float vWaveHeight;

  void main() {
    vUv = uv;

    vec3 pos = position;

    // Vagues multiples
    float wave1 = sin(pos.x * 0.5 + time * waveSpeed) * waveHeight;
    float wave2 = sin(pos.z * 0.7 + time * waveSpeed * 1.3) * waveHeight * 0.5;
    float wave3 = cos(pos.x * 0.3 + pos.z * 0.4 + time * waveSpeed * 0.8) * waveHeight * 0.3;

    pos.y += wave1 + wave2 + wave3;
    vWaveHeight = (wave1 + wave2 + wave3) / waveHeight;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const waterFragmentShader = /* glsl */ `
  uniform float time;
  uniform vec3 shallowColor;
  uniform vec3 deepColor;
  uniform vec3 foamColor;
  uniform float opacity;
  uniform float fresnelPower;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying float vWaveHeight;

  // Fonction de bruit simplifié pour les vagues
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    // Fresnel effect pour la réflexion
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vec3(0.0, 1.0, 0.0)), 0.0), fresnelPower);

    // Pattern de vagues multiples avec bruit
    vec2 uv1 = vUv * 3.0 + time * 0.3;
    vec2 uv2 = vUv * 5.0 - time * 0.2;
    vec2 uv3 = vUv * 2.0 + vec2(time * 0.1, -time * 0.15);

    float wave1 = noise(uv1);
    float wave2 = noise(uv2) * 0.5;
    float wave3 = noise(uv3) * 0.25;
    float pattern = (wave1 + wave2 + wave3) / 1.75;

    // Caustics simulés (motif de lumière sous l'eau)
    float caustic1 = sin(vUv.x * 12.0 + time * 1.5) * sin(vUv.y * 8.0 + time);
    float caustic2 = cos(vUv.x * 8.0 - time * 1.2) * cos(vUv.y * 10.0 + time * 0.8);
    float caustics = (caustic1 + caustic2) * 0.5 + 0.5;
    caustics = pow(caustics, 3.0) * 0.15;

    // Mélanger les couleurs shallow/deep basé sur le pattern et la hauteur de vague
    float depth = 0.4 + pattern * 0.3 + vWaveHeight * 0.3;
    vec3 waterColor = mix(shallowColor, deepColor, depth);

    // Ajouter les caustics
    waterColor += vec3(caustics) * shallowColor;

    // Ajouter de l'écume sur les crêtes des vagues
    float foam = smoothstep(0.5, 0.9, vWaveHeight + pattern * 0.3);
    waterColor = mix(waterColor, foamColor, foam * 0.4);

    // Appliquer fresnel pour la réflexion
    waterColor = mix(waterColor, foamColor * 1.1, fresnel * 0.25);

    // Brillance spéculaire subtile
    float specular = pow(max(pattern, 0.0), 6.0) * fresnel * 0.3;
    waterColor += vec3(specular);

    gl_FragColor = vec4(waterColor, opacity);
  }
`

// Créer le material shader
const WaterMaterial = shaderMaterial(
  {
    time: 0,
    waveHeight: 0.1,
    waveSpeed: 1.0,
    shallowColor: new THREE.Color('#4fc3f7'),
    deepColor: new THREE.Color('#0277bd'),
    foamColor: new THREE.Color('#ffffff'),
    opacity: 0.85,
    fresnelPower: 2.0,
  },
  waterVertexShader,
  waterFragmentShader
)

extend({ WaterMaterial })

// Déclaration TypeScript
declare module '@react-three/fiber' {
  interface ThreeElements {
    waterMaterial: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        time?: number
        waveHeight?: number
        waveSpeed?: number
        shallowColor?: THREE.Color
        deepColor?: THREE.Color
        foamColor?: THREE.Color
        opacity?: number
        fresnelPower?: number
        transparent?: boolean
        side?: THREE.Side
        depthWrite?: boolean
        attach?: string
      },
      HTMLElement
    >
  }
}

/**
 * Configuration de l'eau
 */
export interface WaterConfig {
  shallowColor?: string
  deepColor?: string
  foamColor?: string
  opacity?: number
  waveHeight?: number
  waveSpeed?: number
  fresnelPower?: number
}

const DEFAULT_WATER_CONFIG: Required<WaterConfig> = {
  shallowColor: '#4fc3f7',
  deepColor: '#0277bd',
  foamColor: '#e0f7fa',
  opacity: 0.85,
  waveHeight: 0.15,
  waveSpeed: 1.0,
  fresnelPower: 2.0,
}

/**
 * Lac circulaire avec eau animée
 */
interface LakeProps {
  position: [number, number, number]
  radius: number
  depth?: number
  config?: WaterConfig
  hasCollider?: boolean
}

export function Lake({
  position,
  radius,
  depth: _depth = 2,
  config = {},
  hasCollider = true,
}: LakeProps) {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const cfg = { ...DEFAULT_WATER_CONFIG, ...config }

  // Géométrie circulaire avec UVs propres et plus de segments au centre
  const geometry = useMemo(() => {
    const segments = 64
    const rings = 16 // Plus de rings pour éviter le "trou" au centre
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    // Centre du cercle
    positions.push(0, 0, 0)
    uvs.push(0.5, 0.5)

    // Anneaux concentriques
    for (let ring = 1; ring <= rings; ring++) {
      const r = (ring / rings) * radius
      for (let seg = 0; seg < segments; seg++) {
        const angle = (seg / segments) * Math.PI * 2
        const x = Math.cos(angle) * r
        const z = Math.sin(angle) * r
        positions.push(x, 0, z)
        // UVs: 0-1 basé sur la position normalisée
        uvs.push(0.5 + (x / radius) * 0.5, 0.5 + (z / radius) * 0.5)
      }
    }

    // Triangles du centre vers le premier anneau
    for (let seg = 0; seg < segments; seg++) {
      const next = (seg + 1) % segments
      indices.push(0, 1 + seg, 1 + next)
    }

    // Triangles entre les anneaux
    for (let ring = 0; ring < rings - 1; ring++) {
      const ringStart = 1 + ring * segments
      const nextRingStart = 1 + (ring + 1) * segments
      for (let seg = 0; seg < segments; seg++) {
        const next = (seg + 1) % segments
        const a = ringStart + seg
        const b = ringStart + next
        const c = nextRingStart + seg
        const d = nextRingStart + next
        indices.push(a, c, b)
        indices.push(b, c, d)
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geo.setIndex(indices)
    geo.computeVertexNormals()

    return geo
  }, [radius])

  useFrame((state) => {
    if (materialRef.current?.uniforms?.time) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
    }
  })

  return (
    <group position={position}>
      {/* Surface de l'eau avec offset Y pour éviter z-fighting */}
      <mesh geometry={geometry} position={[0, 0.02, 0]}>
        <waterMaterial
          ref={materialRef as React.Ref<THREE.ShaderMaterial>}
          transparent
          side={THREE.FrontSide}
          depthWrite={false}
          waveHeight={cfg.waveHeight}
          waveSpeed={cfg.waveSpeed}
          shallowColor={new THREE.Color(cfg.shallowColor)}
          deepColor={new THREE.Color(cfg.deepColor)}
          foamColor={new THREE.Color(cfg.foamColor)}
          opacity={cfg.opacity}
          fresnelPower={cfg.fresnelPower}
        />
      </mesh>

      {/* Collider physique (zone de nage/slow) */}
      {hasCollider && (
        <RigidBody type="fixed" sensor>
          <CuboidCollider args={[radius, 0.5, radius]} position={[0, 0, 0]} />
        </RigidBody>
      )}
    </group>
  )
}

/**
 * Rivière avec chemin courbe
 */
interface RiverProps {
  points: [number, number, number][]
  width?: number
  depth?: number
  config?: WaterConfig
  hasCollider?: boolean
}

export function River({
  points,
  width = 3,
  depth = 1,
  config = {},
  hasCollider = true,
}: RiverProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const cfg = { ...DEFAULT_WATER_CONFIG, ...config }

  // Créer une courbe à partir des points
  const curve = useMemo(() => {
    const vectors = points.map(p => new THREE.Vector3(p[0], p[1], p[2]))
    return new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.5)
  }, [points])

  // Géométrie de la rivière
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-width / 2, 0)
    shape.lineTo(width / 2, 0)
    shape.lineTo(width / 2, depth)
    shape.lineTo(-width / 2, depth)
    shape.closePath()

    const extrudeSettings = {
      steps: points.length * 10,
      bevelEnabled: false,
      extrudePath: curve,
    }

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    return geo
  }, [curve, width, depth, points.length])

  // Surface de l'eau (mesh plat le long de la courbe)
  const surfaceGeometry = useMemo(() => {
    const curvePoints = curve.getPoints(points.length * 20)
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    curvePoints.forEach((point, i) => {
      const tangent = curve.getTangentAt(i / (curvePoints.length - 1))
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize()

      // Points gauche et droite
      const left = point.clone().add(normal.clone().multiplyScalar(-width / 2))
      const right = point.clone().add(normal.clone().multiplyScalar(width / 2))

      positions.push(left.x, point.y, left.z)
      positions.push(right.x, point.y, right.z)

      uvs.push(0, i / (curvePoints.length - 1))
      uvs.push(1, i / (curvePoints.length - 1))

      if (i < curvePoints.length - 1) {
        const baseIndex = i * 2
        indices.push(baseIndex, baseIndex + 1, baseIndex + 2)
        indices.push(baseIndex + 1, baseIndex + 3, baseIndex + 2)
      }
    })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geo.setIndex(indices)
    geo.computeVertexNormals()

    return geo
  }, [curve, width, points.length])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
    }
  })

  return (
    <group>
      {/* Surface de l'eau avec offset Y */}
      <mesh geometry={surfaceGeometry} position={[0, 0.02, 0]}>
        <waterMaterial
          ref={materialRef}
          transparent
          side={THREE.FrontSide}
          depthWrite={false}
          waveHeight={cfg.waveHeight * 0.5}
          waveSpeed={cfg.waveSpeed * 1.5}
          shallowColor={new THREE.Color(cfg.shallowColor)}
          deepColor={new THREE.Color(cfg.deepColor)}
          foamColor={new THREE.Color(cfg.foamColor)}
          opacity={cfg.opacity}
          fresnelPower={cfg.fresnelPower}
        />
      </mesh>

      {/* Colliders le long de la rivière */}
      {hasCollider && points.map((point, i) => (
        <RigidBody key={i} type="fixed" sensor position={point}>
          <CuboidCollider args={[width / 2, 0.5, width]} />
        </RigidBody>
      ))}
    </group>
  )
}

/**
 * Canal d'eau droit (plus simple que rivière)
 */
interface CanalProps {
  start: [number, number, number]
  end: [number, number, number]
  width?: number
  depth?: number
  config?: WaterConfig
}

export function Canal({
  start,
  end,
  width = 4,
  depth = 1.5,
  config = {},
}: CanalProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const cfg = { ...DEFAULT_WATER_CONFIG, ...config }

  const { length, rotation, center } = useMemo(() => {
    const startVec = new THREE.Vector3(...start)
    const endVec = new THREE.Vector3(...end)
    const direction = endVec.clone().sub(startVec)
    const len = direction.length()
    const rot = Math.atan2(direction.x, direction.z)
    const mid = startVec.clone().add(direction.multiplyScalar(0.5))

    return {
      length: len,
      rotation: rot,
      center: [mid.x, mid.y, mid.z] as [number, number, number],
    }
  }, [start, end])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
    }
  })

  return (
    <group position={center} rotation={[0, rotation, 0]}>
      {/* Surface de l'eau avec offset Y */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, length, 32, 32]} />
        <waterMaterial
          ref={materialRef}
          transparent
          side={THREE.FrontSide}
          depthWrite={false}
          waveHeight={cfg.waveHeight * 0.3}
          waveSpeed={cfg.waveSpeed * 2}
          shallowColor={new THREE.Color(cfg.shallowColor)}
          deepColor={new THREE.Color(cfg.deepColor)}
          foamColor={new THREE.Color(cfg.foamColor)}
          opacity={cfg.opacity}
          fresnelPower={cfg.fresnelPower}
        />
      </mesh>

      {/* Collider */}
      <RigidBody type="fixed" sensor>
        <CuboidCollider args={[width / 2, 0.5, length / 2]} position={[0, 0, 0]} />
      </RigidBody>
    </group>
  )
}

/**
 * Crée une géométrie d'anneau avec UVs optimisées pour le shader d'eau
 * U = position le long de l'anneau (0-1, répété)
 * V = distance radiale (0 = inner, 1 = outer)
 */
function createMoatGeometry(
  innerRadius: number,
  outerRadius: number,
  segments: number = 64,
  radialSegments: number = 4
): THREE.BufferGeometry {
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  // Générer les vertices
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    for (let j = 0; j <= radialSegments; j++) {
      const t = j / radialSegments
      const radius = innerRadius + (outerRadius - innerRadius) * t

      positions.push(cos * radius, 0, sin * radius)

      // UV: U = position le long de l'anneau (avec répétition pour les vagues)
      // V = distance radiale
      const uRepeat = 8 // Nombre de répétitions du pattern autour de l'anneau
      uvs.push((i / segments) * uRepeat, t)
    }
  }

  // Générer les indices
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j
      const b = a + 1
      const c = (i + 1) * (radialSegments + 1) + j
      const d = c + 1

      indices.push(a, b, c)
      indices.push(b, d, c)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}

/**
 * Douves (fossé d'eau autour d'une zone)
 */
interface MoatProps {
  center: [number, number, number]
  innerRadius: number
  outerRadius: number
  depth?: number
  config?: WaterConfig
  segments?: number
}

export function Moat({
  center,
  innerRadius,
  outerRadius,
  depth: _depth = 2,
  config = {},
  segments = 64,
}: MoatProps) {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const cfg = { ...DEFAULT_WATER_CONFIG, ...config }

  // Géométrie personnalisée avec UVs optimisées pour l'eau
  const geometry = useMemo(() => {
    return createMoatGeometry(innerRadius, outerRadius, segments, 6)
  }, [innerRadius, outerRadius, segments])

  useFrame((state) => {
    if (materialRef.current?.uniforms?.time) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
    }
  })

  return (
    <group position={center}>
      {/* Surface de l'eau avec offset Y pour éviter z-fighting */}
      <mesh geometry={geometry} position={[0, 0.03, 0]}>
        <waterMaterial
          ref={materialRef as React.Ref<THREE.ShaderMaterial>}
          transparent
          side={THREE.FrontSide}
          depthWrite={false}
          waveHeight={cfg.waveHeight}
          waveSpeed={cfg.waveSpeed}
          shallowColor={new THREE.Color(cfg.shallowColor)}
          deepColor={new THREE.Color(cfg.deepColor)}
          foamColor={new THREE.Color(cfg.foamColor)}
          opacity={cfg.opacity}
          fresnelPower={cfg.fresnelPower}
        />
      </mesh>
    </group>
  )
}

/**
 * Cascade (chute d'eau)
 */
interface WaterfallProps {
  position: [number, number, number]
  width?: number
  height?: number
  config?: WaterConfig
}

export function Waterfall({
  position,
  width = 3,
  height = 5,
  config = {},
}: WaterfallProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const cfg = { ...DEFAULT_WATER_CONFIG, ...config }

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime * 3 // Plus rapide
    }
  })

  return (
    <group position={position}>
      {/* Cascade verticale - garde DoubleSide car vue des deux côtés */}
      <mesh position={[0, -height / 2, 0]}>
        <planeGeometry args={[width, height, 16, 32]} />
        <waterMaterial
          ref={materialRef}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          waveHeight={0.3}
          waveSpeed={5}
          shallowColor={new THREE.Color('#b3e5fc')}
          deepColor={new THREE.Color(cfg.deepColor)}
          foamColor={new THREE.Color('#ffffff')}
          opacity={0.8}
          fresnelPower={1.5}
        />
      </mesh>

      {/* Éclaboussures au bas */}
      <mesh position={[0, -height + 0.5, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[width * 0.8, 32]} />
        <waterMaterial
          transparent
          side={THREE.FrontSide}
          depthWrite={false}
          waveHeight={0.4}
          waveSpeed={8}
          shallowColor={new THREE.Color('#e1f5fe')}
          deepColor={new THREE.Color(cfg.deepColor)}
          foamColor={new THREE.Color('#ffffff')}
          opacity={0.9}
          fresnelPower={1.0}
        />
      </mesh>

      {/* Point light pour l'éclat */}
      <pointLight position={[0, -height / 2, 1]} intensity={0.3} color="#b3e5fc" distance={10} />
    </group>
  )
}

/**
 * Fontaine centrale
 */
interface FountainProps {
  position: [number, number, number]
  radius?: number
  height?: number
  config?: WaterConfig
}

export function Fountain({
  position,
  radius = 3,
  height = 4,
  config = {},
}: FountainProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const jetRef = useRef<THREE.Mesh>(null)
  const cfg = { ...DEFAULT_WATER_CONFIG, ...config }

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
    }
    if (jetRef.current) {
      jetRef.current.scale.y = 0.9 + Math.sin(state.clock.elapsedTime * 3) * 0.1
    }
  })

  return (
    <group position={position}>
      {/* Bassin */}
      <Lake position={[0, 0, 0]} radius={radius} depth={0.8} config={cfg} hasCollider={false} />

      {/* Piédestal central */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.8, 1, 16]} />
        <meshStandardMaterial color="#78909c" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Jet d'eau central */}
      <mesh ref={jetRef} position={[0, 1 + height / 2, 0]}>
        <cylinderGeometry args={[0.1, 0.05, height, 8]} />
        <meshStandardMaterial
          color={cfg.shallowColor}
          transparent
          opacity={0.6}
          emissive={cfg.shallowColor}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Particules d'eau (simplifiées) */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[
          Math.cos(i * Math.PI / 2) * 0.3,
          1.5 + height * 0.3,
          Math.sin(i * Math.PI / 2) * 0.3
        ]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial
            color={cfg.foamColor}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}

      {/* Lumière */}
      <pointLight position={[0, 2, 0]} intensity={0.5} color={cfg.shallowColor} distance={8} />
    </group>
  )
}

// ============================================================================
// COMPOSANT AUTOMATIQUE AVEC WATER FACTORY
// ============================================================================

/**
 * Helper pour convertir WaterColorConfig en WaterConfig
 */
function waterColorToConfig(colors: WaterColorConfig): WaterConfig {
  return {
    shallowColor: colors.shallowColor,
    deepColor: colors.deepColor,
    foamColor: colors.foamColor,
    opacity: colors.opacity,
    waveHeight: colors.waveHeight,
    waveSpeed: colors.waveSpeed,
  }
}

/**
 * Rend un WaterPlacement selon son type
 */
function WaterFeatureRenderer({ placement }: { placement: WaterPlacement }) {
  if (!placement.enabled) return null

  const config = waterColorToConfig(placement.colors)
  const pos: [number, number, number] = [
    placement.position.x,
    placement.position.y,
    placement.position.z,
  ]

  switch (placement.type) {
    case 'lake':
    case 'pond':
      return (
        <Lake
          position={pos}
          radius={placement.radius ?? 5}
          config={config}
        />
      )

    case 'moat':
      return (
        <Moat
          center={pos}
          innerRadius={placement.innerRadius ?? 10}
          outerRadius={placement.outerRadius ?? 15}
          config={config}
        />
      )

    case 'fountain':
      return (
        <Fountain
          position={pos}
          radius={placement.radius ?? 2.5}
          height={placement.height ?? 4}
          config={config}
        />
      )

    default:
      return null
  }
}

/**
 * Rend automatiquement tous les water features depuis la configuration
 * Utilise WaterFactory pour calculer les positions Y correctes
 */
export function WaterFeatures() {
  const placements = useWaterPlacements()

  return (
    <group name="water-features">
      {placements.map((placement) => (
        <WaterFeatureRenderer key={placement.id} placement={placement} />
      ))}
    </group>
  )
}

/**
 * Export groupé des composants d'eau
 */
export const WaterSystem = {
  Lake,
  River,
  Canal,
  Moat,
  Waterfall,
  Fountain,
  WaterFeatures,
}
