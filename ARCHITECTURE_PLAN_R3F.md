# Plan d'Architecture Enterprise - Optimisation R3F
## Pierre Legrand Portfolio 3.0

**Version:** 1.1.0
**Date:** 2026-01-08
**Statut:** Draft - En attente d'approbation
**Auteur:** Architecture Team
**Révisé par:** Claude Code Analysis

---

## Executive Summary

Ce document définit le plan d'implémentation enterprise-grade pour l'optimisation du portfolio 3D Pierre Legrand, basé sur les meilleures pratiques React Three Fiber (R3F) identifiées lors de l'analyse de la documentation officielle pmndrs.

### Objectifs Stratégiques

| Objectif | KPI Cible | Priorité |
|----------|-----------|----------|
| Performance CPU | -40% raycasting overhead | P0 |
| Performance GPU | -30% draw calls | P0 |
| Maintenabilité | -40% LOC dupliqué | P0 |
| UX Transitions | <500ms latence | P1 |
| Bundle Size | -15% JS initial | P1 |
| DX (Developer Experience) | +50% réutilisabilité | P2 |

### Changements v1.1.0
- **Réorganisation des phases** : Ordre optimisé pour maximiser l'impact (0 → 1 → 2 → 3 → 4 → 5 → 6)
- **Phase 2 reprioritisée** : Event System (ancienne Phase 6) devient Phase 2 - impact CPU critique
- **Diagramme de dépendances** ajouté
- **Feature flags simplifiés** : Un flag principal + flags granulaires optionnels
- **MVP défini** : Phases 0-1-2-3 pour gains majeurs

---

## Table des Matières

1. [Architecture Cible](#1-architecture-cible)
2. [Diagramme de Dépendances](#2-diagramme-de-dépendances)
3. [Phases d'Implémentation](#3-phases-dimplémentation)
4. [Spécifications Techniques](#4-spécifications-techniques)
5. [Patterns & Standards](#5-patterns--standards)
6. [Migration Strategy](#6-migration-strategy)
7. [Testing Strategy](#7-testing-strategy)
8. [Rollback Plan](#8-rollback-plan)
9. [Monitoring & Observability](#9-monitoring--observability)

---

## 1. Architecture Cible

### 1.1 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│  App.tsx                                                             │
│  ├── Canvas (shared)                                                 │
│  │   ├── SceneRouter (level-based)                                  │
│  │   ├── GlobalEffects (post-processing)                            │
│  │   └── PerformanceMonitor                                         │
│  └── UIOverlay (React DOM)                                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SCENE LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│  PierreExperience/                                                   │
│  ├── CameraSystem (CameraControls + Transitions)                    │
│  ├── InteractionSystem (Raycasting + Hover + Selection)             │
│  ├── LODSystem (Distance-based rendering)                           │
│  └── SuspenseGroups (Priority-based loading)                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       COMPONENT LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│  Primitives/          │  Composites/           │  Features/          │
│  ├── BakedMesh        │  ├── MonitorScreen     │  ├── JoanOS         │
│  ├── InteractiveMesh  │  ├── ArcadeStation     │  ├── ArtGallery     │
│  └── LODMesh          │  └── SocialIcons       │  └── RubikGame      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         STATE LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Zustand Stores (Slices Pattern)                                     │
│  ├── cameraStore      → position, target, isAnimating, flyTo()      │
│  ├── interactionStore → hovered, selected, focusedStage             │
│  ├── performanceStore → fps, drawCalls, triangles, adaptiveQuality  │
│  └── pierreStore      → rubikSolved, currentStage (existing)        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  AssetService         │  TransitionService     │  AnalyticsService   │
│  ├── preloadQueue     │  ├── easing configs    │  ├── performance    │
│  ├── cacheManager     │  ├── duration configs  │  ├── interactions   │
│  └── progressTracker  │  └── interruption      │  └── errors         │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Flux de Données

```
User Interaction
       │
       ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Raycaster   │───▶│  Zustand     │───▶│  React       │
│  (R3F)       │    │  Store       │    │  Components  │
└──────────────┘    └──────────────┘    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Three.js    │
                    │  Scene Graph │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  WebGL       │
                    │  Renderer    │
                    └──────────────┘
```

---

## 2. Diagramme de Dépendances

### 2.1 Ordre d'Exécution Optimisé

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                    PHASES D'IMPLÉMENTATION                   │
                    │                  (Ordre optimisé v1.1.0)                     │
                    └─────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   PHASE 0    │  Foundation
    │  (Prérequis) │  • Structure dossiers
    │              │  • Aliases TypeScript
    │   Risque: ◯  │  • Stores Zustand base
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   PHASE 1    │  Camera System
    │   (Camera)   │  • CameraControls drei
    │              │  • cameraSlice.ts
    │   Risque: ◐  │  • Remplacement GSAP
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐     ┌─────────────────────────────────────────────────────┐
    │   PHASE 2    │     │  CRITIQUE: Impact CPU -40%                          │
    │   (Events)   │◀────│  Ancienne Phase 6, promue pour impact maximal       │
    │              │     │  Prérequis de Phase 4 (PostProcessing)              │
    │   Risque: ◐  │     └─────────────────────────────────────────────────────┘
    └──────┬───────┘
           │
           ├─────────────────────────────┐
           │                             │
           ▼                             ▼
    ┌──────────────┐              ┌──────────────┐
    │   PHASE 3    │              │   PHASE 4    │
    │(Interactions)│              │    (LOD)     │  ← Peuvent être parallélisées
    │              │              │              │
    │   Risque: ◐  │              │   Risque: ◐  │
    └──────┬───────┘              └──────┬───────┘
           │                             │
           └─────────────┬───────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │   PHASE 5    │  Post-Processing
                  │   (Effects)  │  • Dépend de interactionSlice (Phase 3)
                  │              │  • Dépend de cameraSlice (Phase 1)
                  │   Risque: ◯  │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │   PHASE 6    │  Suspense + Cleanup
                  │  (Suspense)  │  • Consolidation finale
                  │              │  • Suppression code legacy
                  │   Risque: ◯  │
                  └──────────────┘

    ═══════════════════════════════════════════════════════════════════════════
                                    MVP BOUNDARY
    ═══════════════════════════════════════════════════════════════════════════
    │  Phases 0-1-2-3 = MVP (gains majeurs: -40% CPU, -30% GPU, UX amélioré)   │
    │  Phases 4-5-6 = Polish (LOD, effets visuels, optimisation finale)        │
    ═══════════════════════════════════════════════════════════════════════════

    Légende Risque: ◯ Faible  ◐ Moyen  ● Élevé
```

### 2.2 Matrice de Dépendances

| Phase | Dépend de | Bloque | Fichiers Créés |
|-------|-----------|--------|----------------|
| **0** | - | 1, 2, 3, 4, 5, 6 | `stores/slices/`, `core/`, aliases |
| **1** | 0 | 5 | `cameraSlice.ts`, `CameraSystem.tsx` |
| **2** | 0 | 3 | `InteractiveMesh.tsx`, `EventGate.tsx`, `PointerEventsLayer.tsx` |
| **3** | 0, 2 | 5 | `interactionSlice.ts`, `InteractionSystem.tsx` |
| **4** | 0 | 6 | `LODWrapper.tsx`, `MonitorScreenLOD.tsx` |
| **5** | 1, 3 | 6 | `PostProcessing.tsx` |
| **6** | 4, 5 | - | `SuspenseGroup.tsx`, cleanup files |

### 2.3 Risques et Mitigations

| Phase | Risque Principal | Mitigation |
|-------|------------------|------------|
| 1 | Régression UX transitions | Feature flag + A/B test |
| 2 | Breaking changes events | `InteractiveMesh` wrapper graduel |
| 3 | Outline cassé | Tests visuels automatisés |
| 4 | Textures LOD manquantes | Screenshots générés au build |
| 5 | Performance DOF | Désactivation conditionnelle mobile |

---

## 3. Phases d'Implémentation

### Phase 0: Foundation (Pre-requisites)
**Durée estimée:** Sprint 0
**Risque:** Faible

| Tâche | Fichiers Impactés | Dépendances |
|-------|-------------------|-------------|
| Créer structure dossiers | `src/components/3d/pierre/core/` | Aucune |
| Setup stores Zustand slices | `src/stores/` | Aucune |
| Configurer aliases paths | `vite.config.ts`, `tsconfig.json` | Aucune |
| Documenter patterns | `.claude`, `CONTRIBUTING.md` | Aucune |

```
src/
├── components/3d/pierre/
│   ├── core/                    # NEW: Primitives réutilisables
│   │   ├── CameraSystem.tsx
│   │   ├── InteractionSystem.tsx
│   │   ├── LODWrapper.tsx
│   │   └── SuspenseGroup.tsx
│   ├── elements/                # Existing: Éléments spécifiques
│   ├── apps/                    # Existing: Applications (JoanOS, etc.)
│   └── ui/                      # Existing: UI components
├── stores/
│   ├── slices/                  # NEW: Store slices
│   │   ├── cameraSlice.ts
│   │   ├── interactionSlice.ts
│   │   └── performanceSlice.ts
│   └── pierreStore.ts           # Existing: Refactor to use slices
└── services/                    # NEW: Business logic
    ├── AssetService.ts
    └── TransitionService.ts
```

---

### Phase 1: Camera System Refactor
**Durée estimée:** Sprint 1
**Risque:** Moyen
**Impact:** Haute visibilité UX

#### 1.1 Objectif
Remplacer GSAP + variable globale par `CameraControls` de drei avec state Zustand.

#### 1.2 Implementation

**Fichier: `src/stores/slices/cameraSlice.ts`**
```typescript
import { StateCreator } from 'zustand'
import * as THREE from 'three'
import type { PierreStage } from '@components/3d/pierre/stores/pierreStore'

export interface CameraState {
  // State
  position: THREE.Vector3
  target: THREE.Vector3
  isAnimating: boolean
  currentStage: PierreStage

  // Actions
  flyTo: (stage: PierreStage) => void
  setAnimating: (value: boolean) => void
  reset: () => void
}

export const STAGE_POSITIONS: Record<PierreStage, {
  position: THREE.Vector3
  target: THREE.Vector3
}> = {
  default: {
    position: new THREE.Vector3(-23, 17, 23),
    target: new THREE.Vector3(0, 2.5, 0),
  },
  arcadeMachine: {
    position: new THREE.Vector3(-4.5, 5.5, 2.3009),
    target: new THREE.Vector3(3.25776, 2.74209, 2.3009),
  },
  leftMonitor: {
    position: new THREE.Vector3(1.06738, 2.60725, -1.6),
    target: new THREE.Vector3(1.06738, 2.50725, -4.23009),
  },
  rightMonitor: {
    position: new THREE.Vector3(2.13997, 2.60716, -1.53751),
    target: new THREE.Vector3(2.47898, 2.50716, -4.14566),
  },
  whiteboard: {
    position: new THREE.Vector3(-3.3927, 5.18774, 4.61366),
    target: new THREE.Vector3(-3.3927, 3.18774, -4.61366),
  },
  rubikGroup: {
    position: new THREE.Vector3(-2.5, 2.8, -1.5),
    target: new THREE.Vector3(-0.67868, 1.7, -3.92849),
  },
  rubikGame: {
    position: new THREE.Vector3(3, 3, 8),
    target: new THREE.Vector3(0, 2, 0),
  },
  hubPortal: {
    position: new THREE.Vector3(-23, 17, 23),
    target: new THREE.Vector3(0, 2.5, 0),
  },
  hub: {
    position: new THREE.Vector3(-23, 17, 23),
    target: new THREE.Vector3(0, 2.5, 0),
  },
}

export const createCameraSlice: StateCreator<CameraState> = (set, get) => ({
  position: STAGE_POSITIONS.default.position.clone(),
  target: STAGE_POSITIONS.default.target.clone(),
  isAnimating: false,
  currentStage: 'default',

  flyTo: (stage) => {
    if (get().isAnimating) return

    const config = STAGE_POSITIONS[stage]
    if (!config) return

    set({
      isAnimating: true,
      currentStage: stage,
      position: config.position.clone(),
      target: config.target.clone(),
    })
  },

  setAnimating: (value) => set({ isAnimating: value }),

  reset: () => set({
    position: STAGE_POSITIONS.default.position.clone(),
    target: STAGE_POSITIONS.default.target.clone(),
    isAnimating: false,
    currentStage: 'default',
  }),
})
```

**Fichier: `src/components/3d/pierre/core/CameraSystem.tsx`**
```typescript
import { useRef, useEffect } from 'react'
import { CameraControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useCameraStore } from '@stores/cameraStore'

// Configuration des contrôles
const CONTROLS_CONFIG = {
  smoothTime: 0.5,
  draggingSmoothTime: 0.1,
  maxSpeed: Infinity,
  minDistance: 2,
  maxDistance: 35,
  minPolarAngle: Math.PI / 6,
  maxPolarAngle: Math.PI / 2,
  minAzimuthAngle: -Math.PI / 2,
  maxAzimuthAngle: Math.PI * 2,
}

export function CameraSystem() {
  const controlsRef = useRef<CameraControls>(null)
  const { camera } = useThree()

  const position = useCameraStore((s) => s.position)
  const target = useCameraStore((s) => s.target)
  const isAnimating = useCameraStore((s) => s.isAnimating)
  const currentStage = useCameraStore((s) => s.currentStage)
  const setAnimating = useCameraStore((s) => s.setAnimating)

  // Transition vers nouvelle position
  useEffect(() => {
    if (!controlsRef.current || !isAnimating) return

    const controls = controlsRef.current

    // Désactiver interactions pendant transition
    controls.enabled = false

    // Animation native CameraControls
    controls.setLookAt(
      position.x, position.y, position.z,
      target.x, target.y, target.z,
      true // enable transition
    ).then(() => {
      setAnimating(false)
      // Réactiver seulement en mode default
      controls.enabled = currentStage === 'default'
    })
  }, [position, target, isAnimating, currentStage, setAnimating])

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      smoothTime={CONTROLS_CONFIG.smoothTime}
      draggingSmoothTime={CONTROLS_CONFIG.draggingSmoothTime}
      minDistance={CONTROLS_CONFIG.minDistance}
      maxDistance={CONTROLS_CONFIG.maxDistance}
      minPolarAngle={CONTROLS_CONFIG.minPolarAngle}
      maxPolarAngle={CONTROLS_CONFIG.maxPolarAngle}
      minAzimuthAngle={CONTROLS_CONFIG.minAzimuthAngle}
      maxAzimuthAngle={CONTROLS_CONFIG.maxAzimuthAngle}
    />
  )
}
```

#### 1.3 Migration Steps

```
Step 1: Créer cameraSlice.ts
Step 2: Créer CameraSystem.tsx
Step 3: Intégrer dans PierreExperience.tsx (parallel à l'ancien)
Step 4: Feature flag pour A/B test
Step 5: Valider métriques performance
Step 6: Supprimer ancien code GSAP
Step 7: Supprimer globalFlyToStage
```

#### 1.4 Rollback Trigger
- Latence transition > 800ms
- Jank visible (frame drops > 10%)
- Bug bloquant sur mobile

---

### Phase 2: Event System Optimization (CRITIQUE - ancienne Phase 6)
**Durée estimée:** Sprint 1-2
**Risque:** Moyen
**Impact:** Performance CPU critique (-40% raycasting overhead)
**Priorité:** P0 - Gains CPU majeurs, prérequis de Phase 3

> **Note v1.1.0:** Cette phase était initialement Phase 6. Elle a été promue en Phase 2 car elle représente le gain de performance le plus significatif (-75% raycasts/frame) et est un prérequis pour la Phase 3 (Interaction System).

#### 2.1 Problèmes Identifiés dans le Code Actuel

```typescript
// ❌ PROBLÈME 1: Raycasting sur TOUS les objets
// Actuellement: chaque mesh avec onPointerOver déclenche un raycast à chaque frame
<group
  onPointerOver={() => onHover([ref.current])}  // Raycast coûteux
  onPointerOut={() => onHover([])}
>
  <primitive object={scene} />  // Scène entière testée
</group>

// ❌ PROBLÈME 2: Fonctions inline recréées à chaque render
onPointerOver={() => linkedinRef.current && onHover([linkedinRef.current])}

// ❌ PROBLÈME 3: Pas de filter sur les événements (meshes non-interactifs testés)
// Les 3 parties room (room1, room2, room3) n'ont pas d'événements mais sont
// quand même traversées par le raycaster

// ❌ PROBLÈME 4: Pas de stopPropagation (événements bubblent)
onClick={() => handleSocialClick('linkedin')}  // Peut trigger parent aussi

// ❌ PROBLÈME 5: Événements actifs même en mode interactif
// Quand currentStage !== 'default', les événements hover sont inutiles
// mais toujours traités
```

#### 2.2 Solutions R3F Enterprise

##### 2.2.1 Canvas Event Optimization

```typescript
// src/components/3d/pierre/PierreExperience.tsx

<Canvas
  // ✅ Filtrer les objets raycastables
  raycaster={{
    filter: (intersects) => {
      // Ne garder que les objets avec userData.interactive
      return intersects.filter(
        (hit) => hit.object.userData.interactive === true
      )
    },
  }}
  // ✅ Réduire la fréquence des événements pointer
  events={(state) => ({
    ...state.events,
    // Throttle les événements move (pas besoin de 60fps pour hover)
    onPointerMove: throttle(state.events.onPointerMove, 50),
  })}
>
```

##### 2.2.2 Mesh Interactive Marker Pattern

**Fichier: `src/components/3d/pierre/core/InteractiveMesh.tsx`**
```typescript
import { useEffect, useRef, useCallback, memo } from 'react'
import * as THREE from 'three'
import { ThreeEvent } from '@react-three/fiber'
import { useInteractionStore } from '@stores/interactionStore'

interface InteractiveMeshProps {
  children: React.ReactNode
  name: string
  onSelect?: () => void
  disabled?: boolean
}

/**
 * Wrapper qui marque un mesh comme interactif pour le raycaster filter.
 * Gère hover/click de manière optimisée.
 */
export const InteractiveMesh = memo(function InteractiveMesh({
  children,
  name,
  onSelect,
  disabled = false,
}: InteractiveMeshProps) {
  const groupRef = useRef<THREE.Group>(null)
  const setHovered = useInteractionStore((s) => s.setHovered)
  const clearHover = useInteractionStore((s) => s.clearHover)

  // Marquer tous les meshes enfants comme interactifs
  useEffect(() => {
    if (!groupRef.current) return

    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.userData.interactive = !disabled
        child.userData.interactiveName = name
      }
    })

    return () => {
      groupRef.current?.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.userData.interactive = false
        }
      })
    }
  }, [name, disabled])

  // Handlers mémorisés (jamais recréés)
  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (disabled) return
      e.stopPropagation()  // ✅ Empêche bubble
      setHovered([e.object])
    },
    [disabled, setHovered]
  )

  const handlePointerOut = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      clearHover()
    },
    [clearHover]
  )

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (disabled || !onSelect) return
      e.stopPropagation()
      onSelect()
    },
    [disabled, onSelect]
  )

  return (
    <group
      ref={groupRef}
      name={name}
      onPointerOver={disabled ? undefined : handlePointerOver}
      onPointerOut={disabled ? undefined : handlePointerOut}
      onClick={disabled ? undefined : handleClick}
    >
      {children}
    </group>
  )
})
```

##### 2.2.3 Désactivation Conditionnelle des Événements

**Fichier: `src/components/3d/pierre/core/EventGate.tsx`**
```typescript
import { createContext, useContext, useMemo } from 'react'
import { useCameraStore } from '@stores/cameraStore'

interface EventGateContextValue {
  eventsEnabled: boolean
}

const EventGateContext = createContext<EventGateContextValue>({
  eventsEnabled: true,
})

export const useEventGate = () => useContext(EventGateContext)

/**
 * Gate qui désactive tous les événements enfants quand on est en mode focus.
 * Évite les raycasts inutiles quand on interagit avec un élément spécifique.
 */
export function EventGate({ children }: { children: React.ReactNode }) {
  const currentStage = useCameraStore((s) => s.currentStage)

  const value = useMemo(
    () => ({
      // Événements actifs seulement en mode default
      eventsEnabled: currentStage === 'default',
    }),
    [currentStage]
  )

  return (
    <EventGateContext.Provider value={value}>
      {children}
    </EventGateContext.Provider>
  )
}

// Usage dans InteractiveMesh
export const InteractiveMesh = memo(function InteractiveMesh(props) {
  const { eventsEnabled } = useEventGate()
  const effectivelyDisabled = props.disabled || !eventsEnabled

  // ... rest du composant avec effectivelyDisabled
})
```

##### 2.2.4 Bounding Volume Hierarchy (BVH)

```typescript
// src/components/3d/pierre/PierreWorld.tsx

import { Bvh } from '@react-three/drei'

export function PierreWorld({ onHover, onSelect }: PierreWorldProps) {
  return (
    <BakedMaterialProvider>
      {/* BVH accélère le raycasting sur les modèles complexes */}
      <Bvh firstHitOnly>
        <group name="pierre-world">
          <EventGate>
            {/* Éléments interactifs uniquement */}
            <InteractiveMesh name="linkedin" onSelect={() => openLink('linkedin')}>
              <primitive object={linkedin.scene} />
            </InteractiveMesh>

            <InteractiveMesh name="github" onSelect={() => openLink('github')}>
              <primitive object={github.scene} />
            </InteractiveMesh>

            {/* ... autres éléments interactifs */}
          </EventGate>

          {/* Éléments NON interactifs - en dehors de Bvh pour éviter overhead */}
          <primitive object={room1.scene} />
          <primitive object={room2.scene} />
          <primitive object={room3.scene} />
        </group>
      </Bvh>
    </BakedMaterialProvider>
  )
}
```

##### 2.2.5 Pointer Events Filter Layer

**Fichier: `src/components/3d/pierre/core/PointerEventsLayer.tsx`**
```typescript
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

/**
 * Composant qui configure le système d'événements R3F.
 * À placer une seule fois dans le Canvas.
 */
export function PointerEventsLayer() {
  const { raycaster, gl } = useThree()

  useEffect(() => {
    // Configuration du raycaster
    raycaster.params.Line = { threshold: 0.1 }
    raycaster.params.Points = { threshold: 0.1 }

    // Filtrer uniquement les objets marqués interactifs
    const originalFilter = raycaster.filter
    raycaster.filter = (items) => {
      const filtered = items.filter(
        (item) => item.object.userData.interactive === true
      )
      return originalFilter ? originalFilter(filtered) : filtered
    }

    return () => {
      raycaster.filter = originalFilter
    }
  }, [raycaster])

  useEffect(() => {
    // Optimiser le canvas pour les événements
    const canvas = gl.domElement

    // Passive listeners pour scroll performance
    canvas.style.touchAction = 'none'

    return () => {
      canvas.style.touchAction = ''
    }
  }, [gl])

  return null
}
```

#### 2.3 Métriques de Performance Événements

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| Raycasts/frame | ~15-20 | ~3-5 | -75% |
| Event handlers | ~40 | ~12 | -70% |
| GC pressure (closures) | Haute | Basse | -80% |
| Hover latency | ~16ms | ~16ms | = |
| CPU idle time | 60% | 75% | +15% |

#### 2.4 Checklist Implémentation Phase 2

- [ ] Créer `InteractiveMesh.tsx` wrapper
- [ ] Créer `EventGate.tsx` context
- [ ] Créer `PointerEventsLayer.tsx` configuration
- [ ] Ajouter `userData.interactive` à tous les meshes interactifs
- [ ] Implémenter `Bvh` wrapper sur PierreWorld
- [ ] Refactorer BakedRoom avec `InteractiveMesh`
- [ ] Refactorer tous les éléments interactifs
- [ ] Mesurer avant/après avec Chrome DevTools Performance

---

### Phase 3: Interaction System Centralization (ancienne Phase 4)
**Durée estimée:** Sprint 2
**Risque:** Moyen
**Impact:** Code maintenabilité + Prérequis PostProcessing
**Dépend de:** Phase 2 (Event System)

#### 3.1 Objectif
Centraliser la logique hover/selection dans un store dédié avec debouncing.

#### 3.2 Implementation

**Fichier: `src/stores/slices/interactionSlice.ts`**
```typescript
import { StateCreator } from 'zustand'
import * as THREE from 'three'
import { debounce } from 'lodash-es'

export interface InteractionState {
  // State
  hoveredObjects: THREE.Object3D[]
  hoveredMeshes: THREE.Mesh[]  // Pour OutlinePass (doit être Mesh, pas Group)
  selectedObject: THREE.Object3D | null
  cursorStyle: 'default' | 'pointer' | 'grab'

  // Actions
  setHovered: (objects: THREE.Object3D[]) => void
  setSelected: (object: THREE.Object3D | null) => void
  clearHover: () => void
  clearAll: () => void
}

/**
 * Extrait tous les Mesh d'une liste d'Object3D (pour OutlinePass).
 */
function collectMeshes(objects: THREE.Object3D[]): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = []
  objects.forEach((obj) => {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        meshes.push(child as THREE.Mesh)
      }
    })
  })
  return meshes
}

// Version débounced pour éviter les updates trop fréquentes
const debouncedSetHovered = debounce((set, objects, meshes) => {
  set({
    hoveredObjects: objects,
    hoveredMeshes: meshes,
    cursorStyle: objects.length > 0 ? 'pointer' : 'default',
  })
}, 16) // ~60fps max

export const createInteractionSlice: StateCreator<InteractionState> = (set, get) => ({
  hoveredObjects: [],
  hoveredMeshes: [],
  selectedObject: null,
  cursorStyle: 'default',

  setHovered: (objects) => {
    // Skip si identique (comparaison par référence)
    const current = get().hoveredObjects
    if (
      objects.length === current.length &&
      objects.every((obj, i) => obj === current[i])
    ) {
      return
    }

    const meshes = collectMeshes(objects)
    debouncedSetHovered(set, objects, meshes)
  },

  setSelected: (object) => set({ selectedObject: object }),

  // Version immédiate pour clear (pas de délai perçu)
  clearHover: () => {
    debouncedSetHovered.cancel()
    set({
      hoveredObjects: [],
      hoveredMeshes: [],
      cursorStyle: 'default',
    })
  },

  clearAll: () => {
    debouncedSetHovered.cancel()
    set({
      hoveredObjects: [],
      hoveredMeshes: [],
      selectedObject: null,
      cursorStyle: 'default',
    })
  },
})
```

**Fichier: `src/components/3d/pierre/core/InteractionSystem.tsx`**
```typescript
import { useEffect } from 'react'
import { useInteractionStore } from '@stores/interactionStore'

/**
 * Composant de gestion du curseur basé sur l'état d'interaction.
 */
export function InteractionSystem() {
  const cursorStyle = useInteractionStore((s) => s.cursorStyle)

  useEffect(() => {
    document.body.style.cursor = cursorStyle
    return () => {
      document.body.style.cursor = 'default'
    }
  }, [cursorStyle])

  return null
}

/**
 * Hook pour rendre un mesh interactif.
 */
export function useInteractive(name: string) {
  const setHovered = useInteractionStore((s) => s.setHovered)
  const clearHover = useInteractionStore((s) => s.clearHover)

  return {
    onPointerOver: (e: THREE.Event) => {
      e.stopPropagation()
      setHovered([e.object])
    },
    onPointerOut: () => clearHover(),
  }
}
```

#### 3.3 Checklist Implémentation Phase 3

- [ ] Créer `interactionSlice.ts` avec debouncing
- [ ] Créer `InteractionSystem.tsx`
- [ ] Créer `useInteractive` hook
- [ ] Intégrer avec `InteractiveMesh` de Phase 2
- [ ] Tests unitaires pour le debouncing
- [ ] Vérifier que l'outline fonctionne toujours

---

### Phase 4: LOD System Implementation (ancienne Phase 2)
**Durée estimée:** Sprint 2-3
**Risque:** Moyen
**Impact:** Performance GPU
**Peut être parallélisée avec:** Phase 3

#### 4.1 Objectif
Implémenter LOD (Level of Detail) pour les moniteurs uikit et éléments lointains.

#### 4.2 Implementation

**Fichier: `src/components/3d/pierre/core/LODWrapper.tsx`**
```typescript
import { ReactNode, useMemo } from 'react'
import { Detailed } from '@react-three/drei'
import { useThree } from '@react-three/fiber'

interface LODLevel {
  distance: number
  component: ReactNode
}

interface LODWrapperProps {
  levels: LODLevel[]
  position?: [number, number, number]
}

/**
 * Wrapper LOD enterprise-grade avec support pour composants React.
 *
 * Usage:
 * <LODWrapper
 *   levels={[
 *     { distance: 0, component: <FullQualityMonitor /> },
 *     { distance: 15, component: <StaticScreenshot /> },
 *     { distance: 30, component: <SimplePlane /> },
 *   ]}
 * />
 */
export function LODWrapper({ levels, position = [0, 0, 0] }: LODWrapperProps) {
  const sortedLevels = useMemo(
    () => [...levels].sort((a, b) => a.distance - b.distance),
    [levels]
  )

  const distances = useMemo(
    () => sortedLevels.map((l) => l.distance),
    [sortedLevels]
  )

  return (
    <group position={position}>
      <Detailed distances={distances}>
        {sortedLevels.map((level, index) => (
          <group key={index}>{level.component}</group>
        ))}
      </Detailed>
    </group>
  )
}
```

**Fichier: `src/components/3d/pierre/elements/MonitorScreenLOD.tsx`**
```typescript
import { Suspense, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import { Root } from '@react-three/uikit'
import * as THREE from 'three'
import { LODWrapper } from '../core/LODWrapper'
import { JoanOSUikit } from '../apps/os'
import { ArtGalleryUikit } from '../apps/gallery'

const MONITOR_SIZE = { x: 1.4, y: 0.78 }

interface MonitorScreenLODProps {
  type: 'left' | 'right'
  screenPosition: [number, number, number]
  screenRotation: [number, number, number]
  onNavigateToHub: () => void
}

/**
 * Moniteur avec 3 niveaux de détail:
 * - LOD 0 (proche): UI interactive complète (uikit)
 * - LOD 1 (moyen): Screenshot statique haute qualité
 * - LOD 2 (loin): Simple plane coloré
 */
export function MonitorScreenLOD({
  type,
  screenPosition,
  screenRotation,
  onNavigateToHub,
}: MonitorScreenLODProps) {
  // Précharger screenshot pour LOD 1
  const screenshotPath = `/pierre/assets/textures/monitor-${type}-preview.webp`
  const screenshotTexture = useTexture(screenshotPath)

  // Configurer texture
  useMemo(() => {
    screenshotTexture.colorSpace = THREE.SRGBColorSpace
    screenshotTexture.minFilter = THREE.LinearFilter
  }, [screenshotTexture])

  const levels = useMemo(() => [
    {
      distance: 0,
      component: (
        <Suspense fallback={<MonitorPlaceholder />}>
          <Root
            sizeX={MONITOR_SIZE.x}
            sizeY={MONITOR_SIZE.y}
            pixelSize={0.00102}
            flexDirection="column"
          >
            {type === 'left' ? (
              <JoanOSUikit onNavigateToHub={onNavigateToHub} />
            ) : (
              <ArtGalleryUikit onNavigateToHub={onNavigateToHub} />
            )}
          </Root>
        </Suspense>
      ),
    },
    {
      distance: 12,
      component: (
        <mesh>
          <planeGeometry args={[MONITOR_SIZE.x, MONITOR_SIZE.y]} />
          <meshBasicMaterial map={screenshotTexture} />
        </mesh>
      ),
    },
    {
      distance: 25,
      component: (
        <mesh>
          <planeGeometry args={[MONITOR_SIZE.x, MONITOR_SIZE.y]} />
          <meshBasicMaterial color="#1a1a2e" />
        </mesh>
      ),
    },
  ], [type, screenshotTexture, onNavigateToHub])

  return (
    <group position={screenPosition} rotation={screenRotation}>
      <LODWrapper levels={levels} />
    </group>
  )
}

function MonitorPlaceholder() {
  return (
    <mesh>
      <planeGeometry args={[MONITOR_SIZE.x, MONITOR_SIZE.y]} />
      <meshBasicMaterial color="#0a0a0a" />
    </mesh>
  )
}
```

#### 4.3 Assets Required
```
public/pierre/assets/textures/
├── monitor-left-preview.webp   # Screenshot JoanOS (1370x765px)
└── monitor-right-preview.webp  # Screenshot ArtGallery (1370x765px)
```

#### 4.4 Checklist Implémentation Phase 4

- [ ] Créer `LODWrapper.tsx`
- [ ] Créer `MonitorScreenLOD.tsx`
- [ ] Générer screenshots des moniteurs (1370x765px)
- [ ] Intégrer dans PierreWorld
- [ ] Tester transitions LOD visuellement
- [ ] Mesurer draw calls avant/après

---

### Phase 5: Post-Processing Optimization (ancienne Phase 5)
**Durée estimée:** Sprint 3
**Risque:** Faible
**Impact:** Visual polish + Performance
**Dépend de:** Phase 1 (cameraSlice), Phase 3 (interactionSlice)

#### 5.1 Objectif
Optimiser EffectComposer et ajouter DepthOfField conditionnel.

#### 5.2 Implementation

**Fichier: `src/components/3d/pierre/core/PostProcessing.tsx`**
```typescript
import { useMemo } from 'react'
import { EffectComposer, Outline, SMAA, DepthOfField, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useInteractionStore } from '@stores/interactionStore'
import { useCameraStore } from '@stores/cameraStore'

interface PostProcessingProps {
  enableDOF?: boolean
  enableVignette?: boolean
}

/**
 * Post-processing centralisé avec effets conditionnels.
 */
export function PostProcessing({
  enableDOF = true,
  enableVignette = true
}: PostProcessingProps) {
  // Récupérer les meshes survolés depuis le store
  const hoveredMeshes = useInteractionStore((s) => s.hoveredMeshes)
  const currentStage = useCameraStore((s) => s.currentStage)

  // DOF seulement quand focalisé sur un élément
  const shouldShowDOF = enableDOF && currentStage !== 'default'

  // Configuration DOF basée sur le stage
  const dofConfig = useMemo(() => {
    switch (currentStage) {
      case 'leftMonitor':
      case 'rightMonitor':
        return { focusDistance: 0.02, focalLength: 0.05, bokehScale: 3 }
      case 'arcadeMachine':
        return { focusDistance: 0.03, focalLength: 0.04, bokehScale: 2 }
      default:
        return { focusDistance: 0, focalLength: 0.02, bokehScale: 2 }
    }
  }, [currentStage])

  return (
    <EffectComposer autoClear={false} multisampling={0}>
      {/* Outline sur hover */}
      <Outline
        selection={hoveredMeshes}
        visibleEdgeColor={0xffffff}
        hiddenEdgeColor={0xffffff}
        edgeStrength={10}
        blendFunction={BlendFunction.SCREEN}
        xRay={true}
      />

      {/* Depth of Field conditionnel */}
      {shouldShowDOF && (
        <DepthOfField
          focusDistance={dofConfig.focusDistance}
          focalLength={dofConfig.focalLength}
          bokehScale={dofConfig.bokehScale}
        />
      )}

      {/* Vignette subtile */}
      {enableVignette && (
        <Vignette
          eskil={false}
          offset={0.1}
          darkness={0.5}
        />
      )}

      {/* Anti-aliasing */}
      <SMAA />
    </EffectComposer>
  )
}
```

#### 5.3 Checklist Implémentation Phase 5

- [ ] Créer `PostProcessing.tsx`
- [ ] Intégrer avec `interactionSlice` (Phase 3)
- [ ] Intégrer avec `cameraSlice` (Phase 1)
- [ ] Tester DOF sur chaque stage
- [ ] Désactiver DOF sur mobile si performance insuffisante
- [ ] Vérifier outline fonctionne avec nouveaux meshes

---

### Phase 6: Suspense Consolidation + Cleanup (ancienne Phase 3 + Phase 7)
**Durée estimée:** Sprint 3-4
**Risque:** Faible
**Impact:** Perceived performance + Maintenabilité long-terme
**Dépend de:** Phases 4, 5

#### 6.1 Objectif
Réduire de 12 à 3 groupes Suspense stratégiques et nettoyer le code legacy.

#### 6.2 Implementation Suspense

**Fichier: `src/components/3d/pierre/core/SuspenseGroup.tsx`**
```typescript
import { Suspense, ReactNode } from 'react'
import { Html, useProgress } from '@react-three/drei'

type Priority = 'critical' | 'secondary' | 'deferred'

interface SuspenseGroupProps {
  priority: Priority
  children: ReactNode
  fallback?: ReactNode
}

const PRIORITY_CONFIG: Record<Priority, {
  showProgress: boolean
  minDelay: number
}> = {
  critical: { showProgress: true, minDelay: 0 },
  secondary: { showProgress: false, minDelay: 100 },
  deferred: { showProgress: false, minDelay: 200 },
}

/**
 * Groupe Suspense avec priorité et fallback intelligent.
 */
export function SuspenseGroup({ priority, children, fallback }: SuspenseGroupProps) {
  const config = PRIORITY_CONFIG[priority]

  const defaultFallback = config.showProgress ? (
    <ProgressFallback />
  ) : null

  return (
    <Suspense fallback={fallback ?? defaultFallback}>
      {children}
    </Suspense>
  )
}

function ProgressFallback() {
  const { progress, active } = useProgress()

  if (!active) return null

  return (
    <Html center>
      <div style={{
        color: 'white',
        background: 'rgba(0,0,0,0.8)',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '14px',
        fontFamily: 'monospace',
      }}>
        Chargement... {progress.toFixed(0)}%
      </div>
    </Html>
  )
}
```

**Refactor: `src/components/3d/pierre/PierreWorld.tsx`**
```typescript
import { SuspenseGroup } from './core/SuspenseGroup'

export function PierreWorld({ onHover, onSelect }: PierreWorldProps) {
  const rubikSolved = usePierreStore((s) => s.rubikSolved)

  return (
    <BakedMaterialProvider>
      <group name="pierre-world">
        {/* CRITICAL: Visible immédiatement */}
        <SuspenseGroup priority="critical">
          <BakedRoom onHover={onHover} onSelect={onSelect} />
          <Skybox />
        </SuspenseGroup>

        {/* SECONDARY: Ambiance, peut charger après */}
        <SuspenseGroup priority="secondary">
          <CoffeeSteam />
          <Carpet />
          <TopChair />
        </SuspenseGroup>

        {/* DEFERRED: Interactif, charge en dernier */}
        <SuspenseGroup priority="deferred">
          <RubiksCube onHover={onHover} onSelect={onSelect} />
          <Whiteboard onHover={onHover} onSelect={onSelect} />
          <ArcadeScreen onHover={onHover} onSelect={onSelect} />
          <MonitorScreenUikit type="left" onHover={onHover} onSelect={onSelect} />
          <MonitorScreenUikit type="right" onHover={onHover} onSelect={onSelect} />
          <HubPortal onHover={onHover} onSelect={onSelect} />
          {rubikSolved && <Confetti />}
        </SuspenseGroup>
      </group>
    </BakedMaterialProvider>
  )
}
```

#### 6.3 Code Cleanup

##### 6.3.1 Fichiers à Supprimer
```
src/components/3d/pierre/apps/os/JoanOS.tsx        # Remplacé par JoanOSUikit
src/components/3d/pierre/apps/os/JoanOS.module.css # Associé
```

##### 6.3.2 Dépendances à Retirer
```bash
npm uninstall gsap  # Si plus utilisé ailleurs
```

##### 6.3.3 Documentation à Mettre à Jour
- `.claude` - Ajouter nouveaux patterns
- `README.md` - Architecture mise à jour
- Storybook - Composants core documentés

#### 6.4 Checklist Implémentation Phase 6

- [ ] Créer `SuspenseGroup.tsx`
- [ ] Refactorer PierreWorld avec 3 groupes Suspense
- [ ] Supprimer fichiers legacy (JoanOS.tsx, etc.)
- [ ] Retirer dépendances inutilisées
- [ ] Mettre à jour documentation
- [ ] Feature flag cleanup (supprimer flags obsolètes)

---

## 4. Spécifications Techniques

### 4.1 Dependencies Requises

```json
{
  "dependencies": {
    "@react-three/drei": "^10.x",
    "@react-three/fiber": "^9.x",
    "@react-three/postprocessing": "^2.x",
    "@pmndrs/uikit": "^0.x",
    "zustand": "^5.x",
    "three": "^0.170.x"
  }
}
```

### 4.2 TypeScript Strict

```typescript
// tsconfig.json additions
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["src/components/3d/pierre/core/*"],
      "@stores/*": ["src/stores/*"],
      "@services/*": ["src/services/*"]
    }
  }
}
```

### 4.3 Performance Budgets

| Métrique | Budget | Alerte | Critique |
|----------|--------|--------|----------|
| FPS Desktop | 60 | <55 | <45 |
| FPS Mobile | 30 | <25 | <20 |
| Draw Calls | 150 | >180 | >220 |
| Triangles | 400K | >500K | >700K |
| JS Bundle | 300KB | >350KB | >450KB |
| LCP | 2.5s | >3s | >4s |

---

## 5. Patterns & Standards

### 5.1 Naming Conventions

```typescript
// Composants R3F
ComponentName.tsx           // PascalCase
ComponentName.module.css    // Styles associés

// Stores Zustand
sliceName.ts               // camelCase pour slices
useStoreName.ts            // Hook avec préfixe use

// Services
ServiceName.ts             // PascalCase

// Types
type ComponentProps = {}   // Suffixe Props
interface ServiceConfig = {} // Suffixe Config
```

### 5.2 Import Order

```typescript
// 1. React
import { useState, useEffect } from 'react'

// 2. R3F & Drei
import { useThree, useFrame } from '@react-three/fiber'
import { CameraControls, Html } from '@react-three/drei'

// 3. Three.js
import * as THREE from 'three'

// 4. Stores
import { useCameraStore } from '@stores/cameraStore'

// 5. Components internes
import { CameraSystem } from '../core/CameraSystem'

// 6. Types
import type { PierreStage } from '../stores/pierreStore'
```

### 5.3 Component Template

```typescript
/**
 * ComponentName - Description courte.
 *
 * @description Description détaillée du composant,
 * son rôle dans l'architecture et ses dépendances.
 */

interface ComponentNameProps {
  /** Description du prop */
  propName: PropType
}

export function ComponentName({ propName }: ComponentNameProps) {
  // 1. Hooks (stores, R3F)
  // 2. Refs
  // 3. State local
  // 4. Effects
  // 5. Handlers
  // 6. Render

  return (
    <group name="component-name">
      {/* Content */}
    </group>
  )
}

export default ComponentName
```

---

## 6. Migration Strategy

### 6.1 Feature Flags (Simplifié v1.1.0)

```typescript
// src/config/featureFlags.ts

// Flag principal - active toute la nouvelle architecture
export const USE_NEW_R3F_ARCHITECTURE = false

// Flags granulaires (optionnels, pour rollout progressif)
export const FEATURES = {
  // MVP (Phases 0-3)
  USE_CAMERA_CONTROLS: true,           // Phase 1 - Camera System
  USE_EVENT_OPTIMIZATION: false,       // Phase 2 - Event System (CRITIQUE)
  USE_CENTRALIZED_INTERACTIONS: false, // Phase 3 - Interaction Store

  // Polish (Phases 4-6)
  USE_LOD_MONITORS: false,             // Phase 4 - LOD System
  USE_ADVANCED_POST_PROCESSING: false, // Phase 5 - PostProcessing
  USE_SUSPENSE_GROUPS: false,          // Phase 6 - Suspense + Cleanup
} as const

// Usage
import { FEATURES } from '@config/featureFlags'

{FEATURES.USE_CAMERA_CONTROLS ? (
  <CameraSystem />
) : (
  <LegacyOrbitControls />
)}
```

### 6.2 Gradual Rollout

```
Week 1: 10% users (beta testers)
Week 2: 25% users (internal + power users)
Week 3: 50% users (A/B test)
Week 4: 100% users (full rollout)
```

### 6.3 Metrics to Monitor

```typescript
// Performance tracking
const trackPerformance = () => {
  const stats = {
    fps: getFPS(),
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    memory: renderer.info.memory,
    loadTime: performance.now() - startTime,
  }

  analytics.track('r3f_performance', stats)
}
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

```typescript
// src/stores/__tests__/cameraSlice.test.ts
import { createCameraSlice, STAGE_POSITIONS } from '../slices/cameraSlice'

describe('cameraSlice', () => {
  it('should initialize with default position', () => {
    const store = createCameraSlice()
    expect(store.currentStage).toBe('default')
  })

  it('should update position on flyTo', () => {
    const store = createCameraSlice()
    store.flyTo('leftMonitor')
    expect(store.currentStage).toBe('leftMonitor')
    expect(store.isAnimating).toBe(true)
  })

  it('should not flyTo if already animating', () => {
    const store = createCameraSlice()
    store.flyTo('leftMonitor')
    store.flyTo('rightMonitor') // Should be ignored
    expect(store.currentStage).toBe('leftMonitor')
  })
})
```

### 7.2 Visual Regression Tests

```typescript
// Using Playwright + Percy
import { test } from '@playwright/test'
import percySnapshot from '@percy/playwright'

test('PierreExperience renders correctly', async ({ page }) => {
  await page.goto('/pierre')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000) // Wait for 3D scene
  await percySnapshot(page, 'Pierre Experience - Default View')
})

test('Camera transition to monitor', async ({ page }) => {
  await page.goto('/pierre')
  await page.click('[data-testid="nav-leftMonitor"]')
  await page.waitForTimeout(1500) // Wait for animation
  await percySnapshot(page, 'Pierre Experience - Left Monitor')
})
```

### 7.3 Performance Tests

```typescript
// Lighthouse CI config
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/pierre'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.7 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3500 }],
      },
    },
  },
}
```

---

## 8. Rollback Plan

### 8.1 Trigger Conditions

| Condition | Seuil | Action |
|-----------|-------|--------|
| Error rate | >1% | Rollback automatique |
| P95 latency | >2s | Alerte + investigation |
| FPS drop | >20% | Rollback phase concernée |
| User complaints | >5 | Investigation immédiate |

### 8.2 Rollback Procedure

```bash
# 1. Désactiver feature flag
# src/config/featureFlags.ts
USE_CAMERA_CONTROLS: false

# 2. Deploy hotfix
git checkout -b hotfix/rollback-camera-controls
git commit -m "Rollback: Disable CameraControls feature"
git push origin hotfix/rollback-camera-controls

# 3. Merge et deploy
gh pr create --title "Hotfix: Rollback CameraControls" --body "Rollback due to [reason]"
```

### 8.3 Post-Mortem Template

```markdown
## Incident Report: [Feature] Rollback

**Date:** YYYY-MM-DD
**Duration:** X hours
**Impact:** X% users affected

### Timeline
- HH:MM - Feature deployed
- HH:MM - First alerts triggered
- HH:MM - Investigation started
- HH:MM - Rollback initiated
- HH:MM - Service restored

### Root Cause
[Description]

### Action Items
- [ ] Fix identified issue
- [ ] Add missing tests
- [ ] Update documentation
- [ ] Re-deploy with monitoring
```

---

## 9. Monitoring & Observability

### 9.1 Dashboards

```typescript
// Performance dashboard metrics
const metrics = {
  // Rendering
  'r3f.fps': { type: 'gauge', unit: 'fps' },
  'r3f.draw_calls': { type: 'gauge', unit: 'count' },
  'r3f.triangles': { type: 'gauge', unit: 'count' },

  // Memory
  'r3f.geometries': { type: 'gauge', unit: 'count' },
  'r3f.textures': { type: 'gauge', unit: 'count' },

  // Interactions
  'r3f.transition_duration': { type: 'histogram', unit: 'ms' },
  'r3f.stage_views': { type: 'counter', tags: ['stage'] },

  // Errors
  'r3f.context_lost': { type: 'counter' },
  'r3f.load_errors': { type: 'counter', tags: ['asset'] },
}
```

### 9.2 Alerts

```yaml
# alerts.yaml
alerts:
  - name: r3f_low_fps
    condition: avg(r3f.fps) < 30
    duration: 5m
    severity: warning

  - name: r3f_high_draw_calls
    condition: avg(r3f.draw_calls) > 200
    duration: 10m
    severity: warning

  - name: r3f_context_lost
    condition: sum(r3f.context_lost) > 0
    duration: 1m
    severity: critical
```

### 9.3 Logging

```typescript
// Structured logging for R3F events
const logger = {
  sceneLoaded: (duration: number) => {
    console.info('[R3F] Scene loaded', { duration, timestamp: Date.now() })
  },

  transitionStarted: (from: string, to: string) => {
    console.info('[R3F] Transition started', { from, to })
  },

  transitionCompleted: (stage: string, duration: number) => {
    console.info('[R3F] Transition completed', { stage, duration })
  },

  error: (error: Error, context: object) => {
    console.error('[R3F] Error', { error: error.message, ...context })
  },
}
```

---

## Appendix A: File Structure Final (v1.1.0)

```
src/
├── components/
│   └── 3d/
│       └── pierre/
│           ├── core/                         # NEW
│           │   ├── CameraSystem.tsx          # Phase 1
│           │   ├── InteractiveMesh.tsx       # Phase 2
│           │   ├── EventGate.tsx             # Phase 2
│           │   ├── PointerEventsLayer.tsx    # Phase 2
│           │   ├── InteractionSystem.tsx     # Phase 3
│           │   ├── LODWrapper.tsx            # Phase 4
│           │   ├── PostProcessing.tsx        # Phase 5
│           │   └── SuspenseGroup.tsx         # Phase 6
│           ├── elements/
│           │   ├── BakedRoom.tsx             # REFACTORED (Phase 2)
│           │   ├── MonitorScreenLOD.tsx      # NEW (Phase 4)
│           │   └── ...
│           ├── apps/
│           │   ├── os/
│           │   │   └── JoanOSUikit.tsx       # KEPT (JoanOS.tsx deleted Phase 6)
│           │   └── gallery/
│           │       └── ArtGalleryUikit.tsx
│           ├── stores/
│           │   └── pierreStore.ts            # REFACTORED (uses slices)
│           ├── contexts/
│           │   └── BakedMaterialContext.tsx
│           ├── ui/
│           │   └── PierreBanner.tsx
│           ├── PierreExperience.tsx          # REFACTORED
│           └── PierreWorld.tsx               # REFACTORED
├── stores/
│   ├── slices/                               # NEW (Phase 0)
│   │   ├── cameraSlice.ts                    # Phase 1
│   │   ├── interactionSlice.ts               # Phase 3
│   │   └── performanceSlice.ts               # Phase 0
│   ├── cameraStore.ts                        # NEW
│   ├── interactionStore.ts                   # NEW
│   ├── gameStore.ts
│   └── uiStore.ts
├── services/                                 # NEW (Phase 0)
│   ├── AssetService.ts
│   └── TransitionService.ts
└── config/
    └── featureFlags.ts                       # NEW (Phase 0)
```

---

## Appendix B: Checklist Validation (v1.1.0)

### Phase 0 - Foundation
- [ ] Structure dossiers créée
- [ ] Aliases TypeScript configurés
- [ ] Store slices base créés

### Phase 1 - Camera System
- [ ] `cameraSlice.ts` créé et testé
- [ ] `CameraSystem.tsx` implémenté
- [ ] Feature flag `USE_CAMERA_CONTROLS` configuré
- [ ] Tests unitaires passent
- [ ] Visual regression OK
- [ ] Ancien code GSAP supprimé

### Phase 2 - Event System (CRITIQUE)
- [ ] `InteractiveMesh.tsx` créé
- [ ] `EventGate.tsx` créé
- [ ] `PointerEventsLayer.tsx` créé
- [ ] BakedRoom refactoré
- [ ] Métriques CPU validées (-40%)

### Phase 3 - Interaction System
- [ ] `interactionSlice.ts` avec debouncing
- [ ] `InteractionSystem.tsx` créé
- [ ] Outline fonctionne toujours

### Phase 4 - LOD System
- [ ] `LODWrapper.tsx` créé
- [ ] `MonitorScreenLOD.tsx` créé
- [ ] Screenshots générés
- [ ] Draw calls réduits

### Phase 5 - Post-Processing
- [ ] `PostProcessing.tsx` créé
- [ ] DOF conditionnel testé
- [ ] Mobile performance OK

### Phase 6 - Suspense + Cleanup
- [ ] `SuspenseGroup.tsx` créé
- [ ] Code legacy supprimé
- [ ] Documentation mise à jour

---

**Document approuvé par:**
- [ ] Tech Lead
- [ ] Product Owner
- [ ] QA Lead

**Dernière mise à jour:** 2026-01-08
