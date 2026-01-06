# 🗺️ Roadmap - Génération Procédurale Three.js

> Portfolio interactif avec terrain procédural inspiré Minecraft/Roblox
> Stack: React Three Fiber + Rapier Physics + Custom Shaders

---

## 📊 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE CIBLE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [Main Thread]              [Web Worker Pool]                  │
│   ┌─────────────┐           ┌─────────────────┐                │
│   │ Scene Mgr   │◄─────────►│ Chunk Generator │                │
│   │ - LOD       │  Transfer │ - Noise calc    │                │
│   │ - Frustum   │  Objects  │ - Mesh vertices │                │
│   │ - Render    │           │ - Biome logic   │                │
│   └─────────────┘           └─────────────────┘                │
│         │                                                       │
│         ▼                                                       │
│   ┌─────────────┐           ┌─────────────────┐                │
│   │ Chunk Pool  │           │ GPU Compute     │                │
│   │ (recycling) │           │ (WebGPU/GPGPU)  │                │
│   └─────────────┘           └─────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Phases de Développement

### Phase 1 : Optimisation Immédiate
**Objectif** : Gains de performance sans refonte architecturale

| Tâche | Priorité | Fichiers concernés | Status |
|-------|----------|-------------------|--------|
| InstancedMesh pour arbres Nature | 🔴 Haute | `BiomeZone.tsx` | ⬜ TODO |
| InstancedMesh pour rochers | 🔴 Haute | `BiomeZone.tsx` | ⬜ TODO |
| InstancedMesh pour champignons | 🔴 Haute | `BiomeZone.tsx` | ⬜ TODO |
| InstancedMesh pour cristaux Crypto | 🔴 Haute | `BiomeZone.tsx` | ⬜ TODO |
| InstancedMesh pour serveurs Tech | 🟡 Moyenne | `BiomeZone.tsx` | ⬜ TODO |
| Intégration three-mesh-bvh | 🟡 Moyenne | `ShootingSystem.tsx` | ⬜ TODO |
| Pool de projectiles | 🟢 Basse | `ShootingSystem.tsx` | ⬜ TODO |

**Détails techniques :**

```typescript
// Pattern InstancedMesh pour décorations
const InstancedTrees = ({ positions, biomeColor }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);

  useEffect(() => {
    positions.forEach((pos, i) => {
      tempMatrix.setPosition(pos.x, pos.y, pos.z);
      tempMatrix.scale(new THREE.Vector3(
        0.8 + Math.random() * 0.4,  // Variation taille
        0.8 + Math.random() * 0.4,
        0.8 + Math.random() * 0.4
      ));
      meshRef.current.setMatrixAt(i, tempMatrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, positions.length]}>
      <coneGeometry args={[1, 3, 8]} />
      <meshToonMaterial color={biomeColor} />
    </instancedMesh>
  );
};
```

---

### Phase 2 : Système de Chunks Basique
**Objectif** : Diviser le monde en sections gérables

| Tâche | Priorité | Fichiers à créer | Status |
|-------|----------|-----------------|--------|
| ChunkManager component | 🔴 Haute | `src/components/3d/chunks/ChunkManager.tsx` | ⬜ TODO |
| Chunk component | 🔴 Haute | `src/components/3d/chunks/Chunk.tsx` | ⬜ TODO |
| ChunkStore (Zustand) | 🔴 Haute | `src/stores/chunkStore.ts` | ⬜ TODO |
| Chunk loading/unloading | 🔴 Haute | `ChunkManager.tsx` | ⬜ TODO |
| Chunk recycling pool | 🟡 Moyenne | `ChunkManager.tsx` | ⬜ TODO |
| Debug visualization | 🟢 Basse | `ChunkDebug.tsx` | ⬜ TODO |

**Configuration chunks :**

```typescript
// src/config/chunkConfig.ts
export const CHUNK_CONFIG = {
  size: 32,              // 32×32 unités par chunk
  resolution: 64,        // 64×64 vertices (LOD max)
  viewDistance: 3,       // Chunks visibles: 7×7 grille
  unloadDistance: 5,     // Distance de déchargement
  totalChunks: 16,       // Grille 4×4 pour map 128×128
  heightScale: 10,       // Amplitude max du relief
};

// Structure d'un chunk
interface Chunk {
  id: string;            // "chunk_x_z"
  position: Vector3;     // Position monde
  lod: 0 | 1 | 2;       // Niveau de détail
  mesh: THREE.Mesh;      // Géométrie
  biome: BiomeType;      // Type de biome
  loaded: boolean;       // État de chargement
  lastAccess: number;    // Timestamp pour LRU cache
}
```

**Algorithme de visibilité :**

```typescript
const getVisibleChunks = (playerPos: Vector3): string[] => {
  const chunkX = Math.floor(playerPos.x / CHUNK_CONFIG.size);
  const chunkZ = Math.floor(playerPos.z / CHUNK_CONFIG.size);
  const visible: string[] = [];

  for (let dx = -CHUNK_CONFIG.viewDistance; dx <= CHUNK_CONFIG.viewDistance; dx++) {
    for (let dz = -CHUNK_CONFIG.viewDistance; dz <= CHUNK_CONFIG.viewDistance; dz++) {
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= CHUNK_CONFIG.viewDistance) {
        visible.push(`chunk_${chunkX + dx}_${chunkZ + dz}`);
      }
    }
  }

  return visible;
};
```

---

### Phase 3 : Heightmap et Relief
**Objectif** : Terrain 3D avec relief procédural

| Tâche | Priorité | Fichiers concernés | Status |
|-------|----------|-------------------|--------|
| Simplex noise integration | 🔴 Haute | `src/utils/noise.ts` | ⬜ TODO |
| HeightmapGenerator | 🔴 Haute | `src/utils/heightmap.ts` | ⬜ TODO |
| Terrain vertex shader | 🔴 Haute | `src/shaders/terrain.vert` | ⬜ TODO |
| Multi-octave noise | �� Moyenne | `heightmap.ts` | ⬜ TODO |
| Biome-specific terrain | 🟡 Moyenne | `heightmap.ts` | ⬜ TODO |
| Normal recalculation | 🟡 Moyenne | `terrain.vert` | ⬜ TODO |

**Dépendance à installer :**
```bash
npm install simplex-noise
```

**Générateur de heightmap :**

```typescript
// src/utils/heightmap.ts
import { createNoise2D } from 'simplex-noise';

export interface HeightmapConfig {
  size: number;
  seed: number;
  octaves: number;
  persistence: number;  // Réduction amplitude par octave
  lacunarity: number;   // Augmentation fréquence par octave
  scale: number;        // Échelle globale
}

export const generateHeightmap = (config: HeightmapConfig): Float32Array => {
  const noise2D = createNoise2D(() => config.seed);
  const data = new Float32Array(config.size * config.size);

  for (let z = 0; z < config.size; z++) {
    for (let x = 0; x < config.size; x++) {
      let amplitude = 1;
      let frequency = 1;
      let value = 0;
      let maxValue = 0;

      // Multi-octave fractal noise
      for (let o = 0; o < config.octaves; o++) {
        const nx = (x / config.size) * config.scale * frequency;
        const nz = (z / config.size) * config.scale * frequency;

        value += noise2D(nx, nz) * amplitude;
        maxValue += amplitude;

        amplitude *= config.persistence;
        frequency *= config.lacunarity;
      }

      // Normaliser entre 0 et 1
      data[z * config.size + x] = (value / maxValue + 1) / 2;
    }
  }

  return data;
};

// Configurations par biome
export const BIOME_HEIGHTMAP_CONFIG: Record<BiomeType, Partial<HeightmapConfig>> = {
  tech: {
    octaves: 2,
    persistence: 0.3,
    scale: 4,        // Terrain plus plat, géométrique
  },
  nature: {
    octaves: 6,
    persistence: 0.5,
    scale: 8,        // Terrain vallonné, organique
  },
  crypto: {
    octaves: 3,
    persistence: 0.4,
    scale: 6,        // Terrain modéré avec pics
  },
};
```

**Vertex Shader terrain :**

```glsl
// src/shaders/terrain.vert
uniform sampler2D heightMap;
uniform float heightScale;
uniform float chunkSize;
uniform vec2 chunkOffset;

varying vec2 vUv;
varying vec3 vNormal;
varying float vHeight;

void main() {
  vUv = uv;

  // Échantillonner la heightmap
  float height = texture2D(heightMap, uv).r;
  vHeight = height;

  // Déplacer le vertex verticalement
  vec3 newPosition = position;
  newPosition.y += height * heightScale;

  // Recalculer les normales (approximation par différences finies)
  float texelSize = 1.0 / float(textureSize(heightMap, 0).x);
  float hL = texture2D(heightMap, uv - vec2(texelSize, 0.0)).r * heightScale;
  float hR = texture2D(heightMap, uv + vec2(texelSize, 0.0)).r * heightScale;
  float hD = texture2D(heightMap, uv - vec2(0.0, texelSize)).r * heightScale;
  float hU = texture2D(heightMap, uv + vec2(0.0, texelSize)).r * heightScale;

  vNormal = normalize(vec3(hL - hR, 2.0, hD - hU));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
```

---

### Phase 4 : Transitions et Blending Biomes
**Objectif** : Transitions fluides entre zones

| Tâche | Priorité | Fichiers concernés | Status |
|-------|----------|-------------------|--------|
| BiomeBlender utility | 🔴 Haute | `src/utils/biomeBlender.ts` | ⬜ TODO |
| Transition shader | 🔴 Haute | `src/shaders/biomeTransition.frag` | ⬜ TODO |
| Voronoi biome map | 🟡 Moyenne | `src/utils/voronoi.ts` | ⬜ TODO |
| Terrain texture blending | 🟡 Moyenne | `biomeTransition.frag` | ⬜ TODO |
| Decoration density falloff | 🟢 Basse | `BiomeZone.tsx` | ⬜ TODO |

**Système de blending :**

```typescript
// src/utils/biomeBlender.ts
export const calculateBiomeInfluence = (
  position: Vector3,
  biomes: BiomeDefinition[]
): Map<BiomeType, number> => {
  const influences = new Map<BiomeType, number>();

  biomes.forEach(biome => {
    const dist = position.distanceTo(biome.center);
    const transitionStart = biome.radius * 0.8;
    const transitionEnd = biome.radius * 1.2;

    let influence: number;
    if (dist < transitionStart) {
      influence = 1.0;
    } else if (dist > transitionEnd) {
      influence = 0.0;
    } else {
      // Smoothstep pour transition douce
      const t = (dist - transitionStart) / (transitionEnd - transitionStart);
      influence = 1.0 - (t * t * (3 - 2 * t));
    }

    influences.set(biome.type, influence);
  });

  // Normaliser pour que la somme = 1
  const total = Array.from(influences.values()).reduce((a, b) => a + b, 0);
  if (total > 0) {
    influences.forEach((v, k) => influences.set(k, v / total));
  }

  return influences;
};
```

**Fragment shader transition :**

```glsl
// src/shaders/biomeTransition.frag
uniform sampler2D techTexture;
uniform sampler2D natureTexture;
uniform sampler2D cryptoTexture;
uniform vec3 biomeWeights; // (tech, nature, crypto)

varying vec2 vUv;

void main() {
  vec4 techColor = texture2D(techTexture, vUv);
  vec4 natureColor = texture2D(natureTexture, vUv);
  vec4 cryptoColor = texture2D(cryptoTexture, vUv);

  vec4 finalColor =
    techColor * biomeWeights.x +
    natureColor * biomeWeights.y +
    cryptoColor * biomeWeights.z;

  gl_FragColor = finalColor;
}
```

---

### Phase 5 : Web Workers
**Objectif** : Génération off-thread pour 60+ FPS constant

| Tâche | Priorité | Fichiers à créer | Status |
|-------|----------|-----------------|--------|
| ChunkWorker | 🔴 Haute | `src/workers/chunkWorker.ts` | ⬜ TODO |
| Worker pool manager | 🔴 Haute | `src/utils/workerPool.ts` | ⬜ TODO |
| Transferable geometry | 🟡 Moyenne | `chunkWorker.ts` | ⬜ TODO |
| Comlink integration | 🟡 Moyenne | `workerPool.ts` | ⬜ TODO |
| Progress callbacks | 🟢 Basse | `ChunkManager.tsx` | ⬜ TODO |

**Dépendance :**
```bash
npm install comlink
```

**Architecture Worker :**

```typescript
// src/workers/chunkWorker.ts
import { expose } from 'comlink';
import { createNoise2D } from 'simplex-noise';

interface ChunkData {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

const generateChunkGeometry = (
  chunkX: number,
  chunkZ: number,
  resolution: number,
  seed: number
): ChunkData => {
  const noise = createNoise2D(() => seed);
  const size = resolution + 1;

  const positions = new Float32Array(size * size * 3);
  const normals = new Float32Array(size * size * 3);
  const uvs = new Float32Array(size * size * 2);
  const indices = new Uint32Array(resolution * resolution * 6);

  // Générer vertices
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const idx = (z * size + x);
      const worldX = chunkX * resolution + x;
      const worldZ = chunkZ * resolution + z;

      // Position
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = noise(worldX * 0.02, worldZ * 0.02) * 10;
      positions[idx * 3 + 2] = z;

      // UV
      uvs[idx * 2] = x / resolution;
      uvs[idx * 2 + 1] = z / resolution;
    }
  }

  // Générer indices
  let indexOffset = 0;
  for (let z = 0; z < resolution; z++) {
    for (let x = 0; x < resolution; x++) {
      const topLeft = z * size + x;
      const topRight = topLeft + 1;
      const bottomLeft = (z + 1) * size + x;
      const bottomRight = bottomLeft + 1;

      indices[indexOffset++] = topLeft;
      indices[indexOffset++] = bottomLeft;
      indices[indexOffset++] = topRight;
      indices[indexOffset++] = topRight;
      indices[indexOffset++] = bottomLeft;
      indices[indexOffset++] = bottomRight;
    }
  }

  // Calculer normales...
  // (code de calcul des normales)

  return { positions, normals, uvs, indices };
};

expose({ generateChunkGeometry });
```

**Utilisation avec Comlink :**

```typescript
// src/utils/workerPool.ts
import { wrap } from 'comlink';

const WORKER_COUNT = navigator.hardwareConcurrency || 4;

class WorkerPool {
  private workers: Worker[] = [];
  private apis: any[] = [];
  private currentWorker = 0;

  async init() {
    for (let i = 0; i < WORKER_COUNT; i++) {
      const worker = new Worker(
        new URL('../workers/chunkWorker.ts', import.meta.url),
        { type: 'module' }
      );
      this.workers.push(worker);
      this.apis.push(wrap(worker));
    }
  }

  async generateChunk(chunkX: number, chunkZ: number, resolution: number, seed: number) {
    const api = this.apis[this.currentWorker];
    this.currentWorker = (this.currentWorker + 1) % WORKER_COUNT;

    return api.generateChunkGeometry(chunkX, chunkZ, resolution, seed);
  }

  terminate() {
    this.workers.forEach(w => w.terminate());
  }
}

export const workerPool = new WorkerPool();
```

---

### Phase 6 : LOD (Level of Detail)
**Objectif** : Performance sur grandes distances

| Tâche | Priorité | Fichiers concernés | Status |
|-------|----------|-------------------|--------|
| LOD calculation | 🔴 Haute | `ChunkManager.tsx` | ⬜ TODO |
| Multi-resolution meshes | 🔴 Haute | `Chunk.tsx` | ⬜ TODO |
| Seamless LOD transitions | 🟡 Moyenne | `Chunk.tsx` | ⬜ TODO |
| Distance-based decoration | 🟡 Moyenne | `BiomeZone.tsx` | ⬜ TODO |

**Configuration LOD :**

```typescript
// src/config/lodConfig.ts
export const LOD_LEVELS = [
  { distance: 0,   resolution: 64, decorations: true },   // LOD 0 - Proche
  { distance: 50,  resolution: 32, decorations: true },   // LOD 1 - Moyen
  { distance: 100, resolution: 16, decorations: false },  // LOD 2 - Loin
  { distance: 200, resolution: 8,  decorations: false },  // LOD 3 - Très loin
];

export const getLodLevel = (distance: number): number => {
  for (let i = LOD_LEVELS.length - 1; i >= 0; i--) {
    if (distance >= LOD_LEVELS[i].distance) {
      return i;
    }
  }
  return 0;
};
```

---

### Phase 7 : Placement Procédural (Poisson Disc)
**Objectif** : Distribution organique des objets

| Tâche | Priorité | Fichiers à créer | Status |
|-------|----------|-----------------|--------|
| Poisson disc sampling | 🔴 Haute | `src/utils/poissonDisc.ts` | ⬜ TODO |
| Density maps | 🟡 Moyenne | `src/utils/densityMap.ts` | ⬜ TODO |
| Biome-aware placement | 🟡 Moyenne | `BiomeZone.tsx` | ⬜ TODO |
| Object variation | 🟢 Basse | `BiomeDecorations.tsx` | ⬜ TODO |

**Algorithme Poisson Disc :**

```typescript
// src/utils/poissonDisc.ts
export interface PoissonConfig {
  width: number;
  height: number;
  minDistance: number;
  maxAttempts?: number;
}

export const poissonDiscSampling = (config: PoissonConfig): Vector2[] => {
  const { width, height, minDistance, maxAttempts = 30 } = config;
  const cellSize = minDistance / Math.sqrt(2);
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);

  const grid: (Vector2 | null)[][] = Array(gridWidth)
    .fill(null)
    .map(() => Array(gridHeight).fill(null));

  const points: Vector2[] = [];
  const activeList: Vector2[] = [];

  // Point initial
  const firstPoint = new Vector2(
    Math.random() * width,
    Math.random() * height
  );
  points.push(firstPoint);
  activeList.push(firstPoint);

  const gridX = Math.floor(firstPoint.x / cellSize);
  const gridY = Math.floor(firstPoint.y / cellSize);
  grid[gridX][gridY] = firstPoint;

  while (activeList.length > 0) {
    const randomIndex = Math.floor(Math.random() * activeList.length);
    const point = activeList[randomIndex];
    let found = false;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = minDistance + Math.random() * minDistance;

      const newPoint = new Vector2(
        point.x + Math.cos(angle) * distance,
        point.y + Math.sin(angle) * distance
      );

      if (isValidPoint(newPoint, grid, points, width, height, cellSize, minDistance)) {
        points.push(newPoint);
        activeList.push(newPoint);

        const gx = Math.floor(newPoint.x / cellSize);
        const gy = Math.floor(newPoint.y / cellSize);
        grid[gx][gy] = newPoint;

        found = true;
        break;
      }
    }

    if (!found) {
      activeList.splice(randomIndex, 1);
    }
  }

  return points;
};
```

---

### Phase 8 : Fonctionnalités Avancées (Optionnel)
**Objectif** : Polish et effets avancés

| Tâche | Priorité | Description | Status |
|-------|----------|-------------|--------|
| Floating Origin | 🟢 Basse | Anti-jitter grandes distances | ⬜ TODO |
| GPU Heightmap (GPGPU) | 🟢 Basse | Génération GPU | ⬜ TODO |
| WebGPU Compute | 🟢 Basse | Future-proof (2026+) | ⬜ TODO |
| Erosion simulation | 🟢 Basse | Terrain réaliste | ⬜ TODO |
| Cave generation | 🟢 Basse | 3D noise pour grottes | ⬜ TODO |
| Water simulation | 🟢 Basse | Rivières, lacs | ⬜ TODO |

---

## 📦 Dépendances à Installer

```bash
# Phase 1 - Optimisation
npm install three-mesh-bvh

# Phase 3 - Heightmap
npm install simplex-noise

# Phase 5 - Web Workers
npm install comlink

# Optionnel - Stats
npm install stats.js
```

---

## 📁 Structure de Fichiers Proposée

```
src/
├── components/3d/
│   ├── chunks/
│   │   ├── ChunkManager.tsx      # Orchestration des chunks
│   │   ├── Chunk.tsx             # Composant chunk individuel
│   │   ├── ChunkDebug.tsx        # Visualisation debug
│   │   └── index.ts
│   ├── terrain/
│   │   ├── TerrainMaterial.tsx   # Shader terrain
│   │   ├── HeightmapPlane.tsx    # Plane avec heightmap
│   │   └── index.ts
│   ├── instanced/
│   │   ├── InstancedTrees.tsx
│   │   ├── InstancedRocks.tsx
│   │   ├── InstancedCrystals.tsx
│   │   └── index.ts
│   └── ... (existants)
├── workers/
│   ├── chunkWorker.ts            # Worker génération chunks
│   └── noiseWorker.ts            # Worker calcul bruit
├── utils/
│   ├── noise.ts                  # Wrapper simplex-noise
│   ├── heightmap.ts              # Générateur heightmap
│   ├── biomeBlender.ts           # Blending entre biomes
│   ├── poissonDisc.ts            # Placement organique
│   ├── workerPool.ts             # Gestion pool workers
│   └── voronoi.ts                # Génération biomes
├── stores/
│   ├── chunkStore.ts             # État des chunks
│   └── ... (existants)
├── shaders/
│   ├── terrain.vert              # Vertex shader terrain
│   ├── terrain.frag              # Fragment shader terrain
│   └── biomeTransition.frag      # Blending biomes
└── config/
    ├── chunkConfig.ts            # Configuration chunks
    └── lodConfig.ts              # Configuration LOD
```

---

## 🎮 Références et Ressources

### Articles
- [Red Blob Games - Procedural Generation](https://www.redblobgames.com/)
- [GPU Gems - Terrain Rendering](https://developer.nvidia.com/gpugems/gpugems3/part-i-geometry)
- [Minecraft Chunk Format](https://minecraft.wiki/w/Chunk_format)

### Bibliothèques
- [simplex-noise](https://www.npmjs.com/package/simplex-noise)
- [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh)
- [comlink](https://github.com/GoogleChromeLabs/comlink)

### Exemples Three.js
- [Three.js LOD Example](https://threejs.org/examples/#webgl_lod)
- [Three.js InstancedMesh](https://threejs.org/examples/#webgl_instancing_performance)
- [Three.js GPGPU](https://threejs.org/examples/#webgl_gpgpu_water)

---

## ✅ Checklist de Progression

- [x] **Phase 1** : InstancedMesh + BVH (simplex-noise, three-mesh-bvh installés)
- [x] **Phase 2** : Système de chunks (ChunkManager, Chunk, chunkStore)
- [x] **Phase 3** : Heightmap et relief (ProceduralTerrain, TerrainMaterial)
- [x] **Phase 4** : Transitions biomes (BiomeTransitionGround, biomeBlender)
- [x] **Phase 5** : Web Workers (chunkWorker, workerPool, WorkerChunk)
- [x] **Phase 6** : LOD avancé (LODSystem, frustum culling, morphing)
- [x] **Phase 7** : Poisson Disc + Végétation (VegetationSystem, BiomeVegetation)
- [ ] **Phase 8** : Fonctionnalités avancées

---

## 📂 Fichiers Créés

### Utilitaires
- `src/utils/procedural/noise.ts` - Génération de bruit multi-octaves
- `src/utils/procedural/poissonDisc.ts` - Placement organique d'objets
- `src/utils/procedural/biomeBlender.ts` - Calcul d'influence et blending entre biomes
- `src/config/proceduralConfig.ts` - Configuration centralisée

### Composants Instanciés
- `src/components/3d/instanced/InstancedNatureDecorations.tsx` - Arbres, rochers, champignons, lucioles
- `src/components/3d/instanced/InstancedCryptoDecorations.tsx` - Cristaux, pièces, blocs de données
- `src/components/3d/instanced/InstancedTechDecorations.tsx` - Serveurs, hologrammes, circuits

### Système de Chunks
- `src/stores/chunkStore.ts` - Store Zustand pour gestion des chunks
- `src/components/3d/chunks/Chunk.tsx` - Composant chunk avec physics
- `src/components/3d/chunks/ChunkManager.tsx` - Orchestrateur de chunks
- `src/components/3d/chunks/WorkerChunk.tsx` - Chunk généré par Web Worker

### Terrain Procédural
- `src/components/3d/terrain/TerrainMaterial.tsx` - Shader de terrain avec heightmap
- `src/components/3d/terrain/ProceduralTerrain.tsx` - Terrain autonome avec coloration
- `src/components/3d/terrain/BiomeTransitionGround.tsx` - Sol avec transition shader entre biomes

### Web Workers
- `src/workers/chunkWorker.ts` - Worker de génération de chunks (Comlink)
- `src/workers/workerPool.ts` - Pool de workers avec priorités

### Système LOD
- `src/components/3d/lod/LODSystem.tsx` - Composants LOD, hooks frustum culling

### Végétation Procédurale
- `src/components/3d/vegetation/VegetationSystem.tsx` - Placement de végétation avec Poisson Disc

---

> 📅 Dernière mise à jour : Janvier 2026
> 🔧 Version : 1.1.0
