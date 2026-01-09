# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pierre Legrand 3.0 is an immersive 3D portfolio built with React Three Fiber (R3F). It features an interactive 3D office environment where users can explore different zones (monitors, arcade, whiteboard, Rubik's cube), a procedural world with biomes, and a cheat code system backed by a Node.js/Hono API.

## Commands

```bash
# Frontend (from root)
npm run dev          # Start Vite dev server (port 5173)
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint
npm run type-check   # TypeScript only (no emit)
npm run preview      # Preview production build

# Backend (from /server)
cd server
npm run dev          # tsx watch mode (port 3000)
npm run build        # tsc compile
npm run start        # Run compiled dist/index.js
```

The frontend dev server proxies `/api/*` to `localhost:3000`.

## Architecture

### Tech Stack
- **Frontend**: React 19 + React Three Fiber v9 + Drei v10 + @pmndrs/uikit + Zustand 5
- **Physics**: @react-three/rapier v2 (WASM)
- **Character Controller**: ecctrl v1.0.97
- **Animation**: GSAP (legacy) + drei CameraControls (new)
- **Backend**: Node.js 20 LTS + Hono + MySQL2 + Zod
- **Build**: Vite 6 with manual chunks for vendor splitting
- **Hosting**: Hostinger Node.js (200Go, 1.5Go RAM, 2 CPU)

### Key Path Aliases
```
@/          → src/
@components → src/components
@stores     → src/stores
@hooks      → src/hooks
@config     → src/config
@services   → src/services
@factories  → src/factories
@utils      → src/utils
@api        → src/api
@data       → src/data
```

### Feature Flags System
The codebase uses feature flags in [src/config/featureFlags.ts](src/config/featureFlags.ts) for gradual rollout of R3F optimizations. Check `isFeatureEnabled('flagName')` before using new systems.

Current flags:
- `useCameraControls` - drei CameraControls vs GSAP legacy
- `useEventSystem` - InteractiveMesh + BVH raycasting
- `useLODSystem` - Distance-based LOD
- `usePostProcessing` - New post-processing system
- `useSuspenseStrategy` - Optimized Suspense grouping
- `usePerformanceMonitor` - Debug performance overlay

### Main Entry Points
- [src/App.tsx](src/App.tsx) - Root component with single Canvas for all levels
- [src/components/3d/Experience.tsx](src/components/3d/Experience.tsx) - Level router
- [src/components/3d/pierre/PierreScene.tsx](src/components/3d/pierre/PierreScene.tsx) - Main 3D office scene
- [src/components/3d/ProceduralWorld.tsx](src/components/3d/ProceduralWorld.tsx) - Procedural world with biomes

### State Management (Zustand)
- [src/stores/gameStore.ts](src/stores/gameStore.ts) - Game state, levels, cheat codes
- [src/stores/uiStore.ts](src/stores/uiStore.ts) - UI state
- [src/stores/worldStore.ts](src/stores/worldStore.ts) - Procedural world state, heightmaps
- [src/components/3d/pierre/stores/pierreStore.ts](src/components/3d/pierre/stores/pierreStore.ts) - Pierre scene navigation
- [src/stores/slices/cameraSlice.ts](src/stores/slices/cameraSlice.ts) - New camera system state

### Pierre Scene Architecture
The Pierre office scene (`src/components/3d/pierre/`) is organized as:
- **core/** - Reusable R3F primitives (CameraSystem, InteractiveMesh, LODMesh, PostProcessingSystem, SuspenseGroup, BvhProvider)
- **elements/** - Scene objects (BakedRoom, MonitorScreen, RubiksCube, etc.)
- **apps/** - Interactive applications (PierreOS, ArtGallery, ArcadeMachine)
- **contexts/** - React contexts (BakedMaterialContext)
- **ui/** - HTML overlays (PierreBanner, PierreLoading)
- **stores/** - Scene-specific Zustand store

### Camera Navigation (Pierre)
Stage-based camera navigation with types defined in `PierreStage`:
- `default` - Overview
- `leftMonitor` / `rightMonitor` - OS interfaces
- `arcadeMachine` - Retro games
- `whiteboard` - Content display
- `rubikGroup` - Rubik's cube game
- `hubPortal` / `hub` - Return to main hub

### Procedural World (3 Biomes)
1. **Tech** - Industrial/futuristic zone (center: [30, 0, -30])
2. **Nature** - Organic/forest zone (center: [-30, 0, -30])
3. **Crypto** - Golden/blockchain zone (center: [0, 0, 40])

Configuration in `src/config/worldConfig.ts`.

### Backend API
Server code is in `/server/src/`:
- Hono framework with CORS, rate limiting, secure headers
- MySQL connection pool with prepared statements
- `/api/codes/validate` - Cheat code validation
- `/api/health` - Health check endpoint

## Code Patterns

### R3F Component Pattern
```tsx
export function MyComponent({ prop }: MyComponentProps) {
  // 1. Hooks (stores, R3F)
  // 2. Refs
  // 3. State
  // 4. Effects
  // 5. Handlers
  // 6. Render
  return (
    <group name="my-component">
      {/* Content */}
    </group>
  )
}
```

### Interactive Elements
Use `InteractiveMesh` wrapper from `src/components/3d/pierre/core/` for:
- Automatic `userData.interactive` marking for raycaster filter
- Memoized event handlers (no inline functions)
- `stopPropagation()` on all events

### Imports Order
1. React
2. R3F & Drei
3. Three.js
4. Stores (`@stores/*`)
5. Internal components
6. Types

### useFrame Best Practices
```tsx
// ✅ Refs + mutation directe + delta framerate-independent
const meshRef = useRef<THREE.Mesh>(null)
useFrame((_, delta) => {
  if (!meshRef.current) return
  meshRef.current.position.y += velocity * delta * 60
})

// ❌ NEVER setState in useFrame - causes freeze/lag
useFrame(() => {
  setParticles(prev => ...) // BAD!
})
```

### InstancedMesh for Particles
```tsx
const meshRef = useRef<THREE.InstancedMesh>(null)
const dummyRef = useRef(new THREE.Object3D()) // Reused!

useFrame((_, delta) => {
  dataRef.current.forEach((p, i) => {
    p.position.y += p.velocity.y * delta * 60
    dummy.position.copy(p.position)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  })
  mesh.instanceMatrix.needsUpdate = true // CRITICAL!
})
```

## Performance Guidelines

| Metric | Desktop | Mobile |
|--------|---------|--------|
| FPS | 60 | 30+ |
| Draw Calls | <200 | <100 |
| Triangles | <500K | <200K |
| Load Time | <3s | <5s |

- Use `<Detailed>` for LOD on complex meshes
- Wrap heavy assets in `<Suspense>` with priority grouping
- Use `useGLTF.preload()` for critical assets
- Avoid inline function handlers on R3F elements
- Mark non-interactive meshes outside of `<Bvh>` wrapper

## Critical Don'ts

- **Never** `console.log` in production (drop_console: true in build)
- **Never** concatenate SQL strings (prepared statements only)
- **Never** store secrets in code (use env variables)
- **Never** use `EcctrlAnimation` (bugs with React 19) - manage animations manually
- **Never** use `THREE.DoubleSide` for horizontal water (artifacts)
- **Never** call `set()` from Zustand unconditionally in `useFrame` (causes "Maximum update depth exceeded")
- **Never** put `queryHeight` in useMemo dependencies (causes re-renders)
- **Never** use HeightfieldCollider/trimesh for terrains with Ecctrl (floating capsule instability)

## R3F/Drei CRITICAL Rules - NO useEffect!

**NEVER use `useEffect` with R3F/drei/three.js objects!** This causes infinite re-renders because:
- `camera` from `useThree()` changes reference on every render
- drei components have their own lifecycle management
- Three.js objects mutate, not re-render

### ❌ WRONG - useEffect avec objets R3F
```tsx
// CAUSES INFINITE LOOPS!
const { camera } = useThree()
useEffect(() => {
  camera.position.set(0, 5, 10)
}, [camera]) // camera changes every render!
```

### ✅ CORRECT - Callback ref pattern
```tsx
// Use callback ref for initialization
const handleRef = useCallback((controls: CameraControlsImpl | null) => {
  if (!controls) return
  controls.setLookAt(0, 5, 10, 0, 0, 0, false)
}, [])

return <CameraControls ref={handleRef} />
```

### ✅ CORRECT - useFrame for per-frame updates
```tsx
// Use useFrame for continuous updates
useFrame(() => {
  meshRef.current.rotation.y += 0.01
})
```

### ✅ CORRECT - Props déclaratifs drei
```tsx
// drei components handle their own updates via props
<CameraControls
  minAzimuthAngle={-Math.PI / 4}
  maxAzimuthAngle={Math.PI / 4}
  enabled={isEnabled}
/>
```

### Drei CameraControls API
```tsx
// Transitions animées via ref (pas useEffect!)
const controlsRef = useRef<CameraControlsImpl>(null)

const flyTo = async () => {
  await controlsRef.current?.setLookAt(x, y, z, tx, ty, tz, true)
}

// Props pour les limites (déclaratif, pas d'effet)
<CameraControls
  ref={controlsRef}
  minDistance={2}
  maxDistance={35}
  minPolarAngle={Math.PI / 6}
  maxPolarAngle={Math.PI / 2}
  minAzimuthAngle={-Math.PI / 4}
  maxAzimuthAngle={Math.PI / 4}
/>
```

### Quand utiliser quoi
| Besoin | Solution |
|--------|----------|
| Init au montage | Callback ref |
| Update chaque frame | useFrame |
| Réagir à un state | Props déclaratives ou useFrame avec condition |
| Transition caméra | `controls.setLookAt()` via ref |
| Cleanup au démontage | Callback ref retournant null |

## @pmndrs/uikit Notes

- Root: `sizeX`, `sizeY` in Three.js units, `pixelSize` ratio (default 0.01)
- Canvas requires `gl={{ localClippingEnabled: true }}` for scroll/clipping
- No HTML canvas or iframe support - use `Html` from drei for arcade games
- Wrap with `<Defaults>` from uikit-default for base styles

## Outline Effect Setup
```tsx
<EffectComposer autoClear={false}>
  <Outline
    selection={hoveredMeshes}  // Array of THREE.Mesh (not groups!)
    blendFunction={BlendFunction.SCREEN}
    xRay={true}
  />
</EffectComposer>
```
- `autoClear={false}` required on EffectComposer
- `selection` must contain Mesh objects, not Groups (use `traverse` + `isMesh`)

## Key Files Reference

- `start-project.md` - Full technical documentation
- `ARCHITECTURE_PLAN_R3F.md` - R3F optimization plan
- `src/config/worldConfig.ts` - Unified world configuration
- `src/services/HeightmapService.ts` - Terrain height queries
- `src/components/3d/Player.tsx` - Character + ecctrl + animations
