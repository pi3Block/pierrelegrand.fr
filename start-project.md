# Pierre Legrand 3.0 - Documentation Technique Enterprise-Grade

Cette documentation structure votre projet **"Pierre Legrand 3.0"**. Elle sert de feuille de route pour le développement et de référence pour la maintenance future de votre plateforme gamifiée.

---

## 1. Vision & Objectifs

* **Concept :** Transformer un portfolio classique en une expérience immersive 3D (Metaverse léger).
* **Cible :** Clients Web3, entreprises en quête de transformation (Coaching), et recruteurs tech.
* **Innovation :** Navigation par "exploration" et système de privilèges via "Cheat Codes".

---

## 2. Architecture Fonctionnelle (Expérience Utilisateur)

### A. L'Environnement 3D (World Design)

Le site est divisé en 3 biomes distincts représentant vos piliers :

1. **Le Lab (Expertise Tech) :** Zone industrielle/futuriste. Objets cliquables : Écrans flottants (projets GitHub), Serveurs (compétences Backend).
2. **Le Temple (Coaching Humaniste) :** Zone zen/organique. Objets cliquables : Arbres de connaissances, zones de méditation (articles sur l'hypnose).
3. **La Banque (Crypto/Web3) :** Zone dorée/cryptographique. Objets cliquables : Graphiques temps réel, coffres-forts (lexique Blockchain).

### B. Le Système de "Codes Secrets"

* **Accès :** Une touche spécifique (ex: `BACKTICK` ou `K`) ouvre un terminal de commande en overlay.
* **Fonctions :**
  * `unlock_vip` : Débloque une zone cachée ou un document confidentiel.
  * `apply_discount` : Affiche des tarifs préférentiels pour le coaching.
  * `debug_mode` : Affiche les statistiques techniques du site (FPS, polycount).

---

## 3. Architecture Technique

### A. Stack Technologique

| Composant | Technologie | Version | Notes |
|-----------|-------------|---------|-------|
| **Frontend** | React + React Three Fiber (R3F) + Drei | React 19 + R3F v9 | [Documentation officielle](https://r3f.docs.pmnd.rs/) |
| **Moteur Physique** | Rapier (WASM) | Latest | [rapier.rs](https://rapier.rs/) |
| **Backend** | Node.js + Hono | Node 20 LTS | API REST ultra-légère |
| **Base de données** | MySQL | 8.x | Intégré Hostinger |
| **Build Tool** | Vite.js | 5.x | HMR ultra-rapide |

### B. Infrastructure Hostinger

| Ressource | Disponible | Utilisation estimée |
|-----------|------------|---------------------|
| Espace disque | 200 Go | < 2 Go (~1%) |
| RAM | 1536 Mo | ~300-500 Mo (~25%) |
| CPU | 2 cœurs | ~0.5 cœur (~25%) |
| Processus max | 120 | 2-5 (~4%) |
| Bande passante | Illimité | ~10-50 Go/mois |

**Capacité estimée :** 10,000 - 50,000 visiteurs/mois sans effort.

### C. Schéma de Données (MySQL)

| Table | Colonne | Type | Description |
|-------|---------|------|-------------|
| **codes** | `id` | INT AUTO_INCREMENT | Clé primaire |
| | `code_key` | VARCHAR(64) | Le code alphanumérique (ex: "GOLD2024") |
| | `privilege_level` | TINYINT | Niveau d'accès (1: Client, 2: VIP, 3: Admin) |
| | `features` | JSON | Features débloquées `["vip_zone", "discount"]` |
| | `created_at` | TIMESTAMP | Date de création |
| | `expires_at` | TIMESTAMP NULL | Date d'expiration optionnelle |
| | `max_uses` | INT NULL | Nombre max d'utilisations |
| | `use_count` | INT DEFAULT 0 | Utilisations actuelles |
| **access_logs** | `id` | BIGINT AUTO_INCREMENT | Clé primaire |
| | `code_id` | INT | FK vers codes |
| | `ip_address` | VARCHAR(45) | IPv4 ou IPv6 |
| | `user_agent` | VARCHAR(512) | Navigateur/Device |
| | `created_at` | TIMESTAMP | Horodatage |

```sql
-- Script de création
CREATE TABLE codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code_key VARCHAR(64) NOT NULL UNIQUE,
  privilege_level TINYINT NOT NULL DEFAULT 1,
  features JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  max_uses INT NULL,
  use_count INT DEFAULT 0,
  INDEX idx_code_key (code_key)
);

CREATE TABLE access_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code_id INT,
  ip_address VARCHAR(45),
  user_agent VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (code_id) REFERENCES codes(id)
);

-- Codes initiaux
INSERT INTO codes (code_key, privilege_level, features) VALUES
('DEBUG2024', 3, '["debug_mode"]'),
('VIP2024', 2, '["vip_zone", "discount"]'),
('GOLD2024', 2, '["vip_zone"]');
```

---

## 4. Backend Node.js (API)

### A. Structure du Projet

```
server/
├── src/
│   ├── index.ts          # Point d'entrée
│   ├── routes/
│   │   ├── codes.ts      # Endpoints cheat codes
│   │   └── health.ts     # Health check
│   ├── middleware/
│   │   ├── cors.ts
│   │   ├── rateLimit.ts
│   │   └── security.ts
│   ├── db/
│   │   └── mysql.ts      # Pool de connexions
│   └── utils/
│       └── logger.ts
├── package.json
├── tsconfig.json
└── .env
```

### B. API avec Hono (Ultra-légère)

```typescript
// server/src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { rateLimiter } from 'hono-rate-limiter'
import { codesRouter } from './routes/codes'
import { healthRouter } from './routes/health'

const app = new Hono()

// Middleware globaux
app.use('*', secureHeaders())
app.use('/api/*', cors({
  origin: ['https://pierrelegrand.fr', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  maxAge: 86400,
}))

// Rate limiting: 20 requêtes/minute par IP
app.use('/api/*', rateLimiter({
  windowMs: 60 * 1000,
  limit: 20,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || 'unknown',
}))

// Routes
app.route('/api/codes', codesRouter)
app.route('/api/health', healthRouter)

// Servir le frontend (build Vite)
app.get('*', (c) => c.html(/* index.html */))

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
}
```

### C. Endpoint Validation des Codes

```typescript
// server/src/routes/codes.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { pool } from '../db/mysql'

const codesRouter = new Hono()

const codeSchema = z.object({
  code: z.string().min(4).max(32).regex(/^[A-Za-z0-9_-]+$/),
})

codesRouter.post(
  '/validate',
  zValidator('json', codeSchema),
  async (c) => {
    const { code } = c.req.valid('json')

    try {
      const [rows] = await pool.execute<any[]>(
        `SELECT id, privilege_level, features
         FROM codes
         WHERE code_key = ?
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (max_uses IS NULL OR use_count < max_uses)`,
        [code.toUpperCase()]
      )

      if (rows.length === 0) {
        return c.json({ valid: false, error: 'Code invalide ou expiré' }, 404)
      }

      const codeData = rows[0]

      // Incrémenter le compteur d'utilisation
      await pool.execute(
        'UPDATE codes SET use_count = use_count + 1 WHERE id = ?',
        [codeData.id]
      )

      // Logger l'accès
      await pool.execute(
        `INSERT INTO access_logs (code_id, ip_address, user_agent)
         VALUES (?, ?, ?)`,
        [
          codeData.id,
          c.req.header('x-forwarded-for') || 'unknown',
          (c.req.header('user-agent') || '').substring(0, 512),
        ]
      )

      return c.json({
        valid: true,
        level: codeData.privilege_level,
        features: JSON.parse(codeData.features || '[]'),
      })
    } catch (error) {
      console.error('Database error:', error)
      return c.json({ valid: false, error: 'Erreur serveur' }, 500)
    }
  }
)

export { codesRouter }
```

### D. Connexion MySQL

```typescript
// server/src/db/mysql.ts
import mysql from 'mysql2/promise'

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,      // Adapté à Hostinger
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
})

// Test de connexion au démarrage
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected')
    conn.release()
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message)
    process.exit(1)
  })
```

### E. Health Check

```typescript
// server/src/routes/health.ts
import { Hono } from 'hono'
import { pool } from '../db/mysql'

const healthRouter = new Hono()

healthRouter.get('/', async (c) => {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'unknown',
  }

  try {
    const start = Date.now()
    await pool.execute('SELECT 1')
    checks.database = `ok (${Date.now() - start}ms)`
  } catch (error) {
    checks.status = 'degraded'
    checks.database = 'error'
  }

  return c.json(checks, checks.status === 'healthy' ? 200 : 503)
})

export { healthRouter }
```

### F. Variables d'Environnement

```bash
# server/.env
PORT=3000
NODE_ENV=production

# MySQL Hostinger
DB_HOST=localhost
DB_USER=u123456789_portfolio
DB_PASSWORD=VotreMotDePasseSecurise
DB_NAME=u123456789_portfolio

# Optionnel
SENTRY_DSN=
```

### G. Package.json

```json
{
  "name": "pierre-legrand-api",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "mysql2": "^3.9.0",
    "zod": "^3.22.0",
    "@hono/zod-validator": "^0.2.0",
    "hono-rate-limiter": "^0.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.4.0"
  }
}
```

---

## 5. React Three Fiber - Bonnes Pratiques Enterprise

### A. Architecture Composants

```
src/
├── components/
│   ├── 3d/
│   │   ├── biomes/
│   │   │   ├── Lab.tsx
│   │   │   ├── Temple.tsx
│   │   │   └── Bank.tsx
│   │   ├── objects/
│   │   │   ├── InteractiveScreen.tsx
│   │   │   └── CollectibleItem.tsx
│   │   └── ui/
│   │       ├── CheatCodeTerminal.tsx
│   │       └── DebugOverlay.tsx
│   └── shared/
├── hooks/
│   ├── useCheatCode.ts
│   └── usePrivilegeLevel.ts
├── stores/
│   └── gameStore.ts (Zustand)
├── api/
│   └── codes.ts          # Client API
└── utils/
    └── performance.ts
```

### B. Client API (Frontend)

```typescript
// src/api/codes.ts
const API_URL = import.meta.env.VITE_API_URL || '/api'

interface CodeResponse {
  valid: boolean
  level?: number
  features?: string[]
  error?: string
}

export async function validateCode(code: string): Promise<CodeResponse> {
  try {
    const response = await fetch(`${API_URL}/codes/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })

    return await response.json()
  } catch (error) {
    return { valid: false, error: 'Erreur réseau' }
  }
}
```

### C. State Management avec Zustand

```typescript
// src/stores/gameStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GameState {
  currentBiome: 'lab' | 'temple' | 'bank'
  privilegeLevel: number
  unlockedFeatures: string[]

  setCurrentBiome: (biome: GameState['currentBiome']) => void
  unlockFeatures: (level: number, features: string[]) => void
  reset: () => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      currentBiome: 'lab',
      privilegeLevel: 0,
      unlockedFeatures: [],

      setCurrentBiome: (biome) => set({ currentBiome: biome }),

      unlockFeatures: (level, features) => set((state) => ({
        privilegeLevel: Math.max(state.privilegeLevel, level),
        unlockedFeatures: [...new Set([...state.unlockedFeatures, ...features])],
      })),

      reset: () => set({
        privilegeLevel: 0,
        unlockedFeatures: [],
      }),
    }),
    { name: 'pierre-legrand-game' }
  )
)
```

### D. Hook Cheat Code

```typescript
// src/hooks/useCheatCode.ts
import { useState, useCallback } from 'react'
import { validateCode } from '../api/codes'
import { useGameStore } from '../stores/gameStore'

export function useCheatCode() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const unlockFeatures = useGameStore((s) => s.unlockFeatures)

  const submitCode = useCallback(async (code: string) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const result = await validateCode(code)

    if (result.valid && result.level && result.features) {
      unlockFeatures(result.level, result.features)
      setSuccess(`Code activé ! Niveau ${result.level} débloqué.`)
      setTimeout(() => setIsOpen(false), 2000)
    } else {
      setError(result.error || 'Code invalide')
    }

    setIsLoading(false)
  }, [unlockFeatures])

  return {
    isOpen,
    setIsOpen,
    isLoading,
    error,
    success,
    submitCode,
  }
}
```

### E. Rendering On-Demand

Pour économiser les ressources quand la scène est statique :

```tsx
<Canvas frameloop="demand">
  {/* Vos composants 3D */}
</Canvas>
```

> **Note :** Les contrôles Drei gèrent automatiquement l'invalidation du frame.

### F. WebGPU (Préparation Future)

WebGPU devient le standard pour les performances 3D web. Prévoir une architecture compatible :

```tsx
// Détection et fallback WebGPU
import * as THREE from 'three/webgpu'
import { Canvas, extend } from '@react-three/fiber'

extend(THREE)

const WebGPUCanvas = () => (
  <Canvas
    gl={async (props) => {
      const renderer = new THREE.WebGPURenderer(props)
      await renderer.init()
      return renderer
    }}
  >
    {/* Scene */}
  </Canvas>
)
```

> **Attention :** WebGPU est encore en développement actif. Utiliser WebGL pour la production jusqu'à maturité complète.

---

## 6. Spécifications de Performance (Critique pour la 3D)

### A. Budgets de Performance

| Métrique | Cible Desktop | Cible Mobile | Critique |
|----------|---------------|--------------|----------|
| FPS | 60 | 30-60 | < 24 FPS |
| Draw Calls | < 200 | < 100 | > 1000 |
| Triangles | < 500K | < 200K | > 1M |
| Texture Memory | < 256 MB | < 128 MB | > 512 MB |
| Initial Load | < 3s | < 5s | > 10s |

### B. Optimisation des Assets 3D

#### Format GLB avec Compression Draco

| Type d'Asset | Niveau Draco | Quantization | Cas d'usage |
|--------------|--------------|--------------|-------------|
| Props statiques | 9 (agressif) | 10 bits | Décors, objets non-interactifs |
| Hero Assets | 7 (modéré) | 14 bits | Personnages, objets principaux |
| CAD/Architecture | 6 (précis) | 16 bits | Détails techniques |

```bash
# Compression avec gltf-transform
npx gltf-transform draco input.glb output.glb --method edgebreaker
```

> **Réduction typique :** 80-95% sur les données vertex brutes.

#### Textures

| Usage | Résolution Max | Format | Notes |
|-------|----------------|--------|-------|
| Détails principaux | 2048x2048 | WebP/AVIF | Héros uniquement |
| Environnement | 1024x1024 | WebP | Standard |
| Mobile/LOD bas | 512x512 | WebP | Fallback |

### C. Techniques d'Optimisation Drei

```tsx
import {
  useGLTF,
  Instances,
  Detailed,
  AdaptiveDpr,
  BakeShadows,
  Preload
} from '@react-three/drei'

// 1. Préchargement des assets
useGLTF.preload('/models/lab-environment.glb')

// 2. Instancing pour objets répétés (1 draw call pour N objets)
<Instances limit={1000}>
  <boxGeometry />
  <meshStandardMaterial />
  {positions.map((pos, i) => (
    <Instance key={i} position={pos} />
  ))}
</Instances>

// 3. Level of Detail (LOD)
<Detailed distances={[0, 50, 100]}>
  <HighPolyModel />  {/* < 50 unités */}
  <MediumPolyModel /> {/* 50-100 unités */}
  <LowPolyModel />   {/* > 100 unités */}
</Detailed>

// 4. DPR Adaptatif (baisse qualité si perf insuffisante)
<AdaptiveDpr pixelated />

// 5. Shadows précuites
<BakeShadows />
```

### D. Lazy Loading des Biomes

```tsx
import { Suspense, lazy } from 'react'
import { useProgress, Html } from '@react-three/drei'

const Lab = lazy(() => import('./biomes/Lab'))
const Temple = lazy(() => import('./biomes/Temple'))
const Bank = lazy(() => import('./biomes/Bank'))

function Loader() {
  const { progress } = useProgress()
  return <Html center>{progress.toFixed(0)}% loaded</Html>
}

// Chargement conditionnel selon proximité
<Suspense fallback={<Loader />}>
  {currentBiome === 'lab' && <Lab />}
  {currentBiome === 'temple' && <Temple />}
  {currentBiome === 'bank' && <Bank />}
</Suspense>
```

### E. Monitoring Performance

```tsx
import { Perf } from 'r3f-perf'
import { Stats } from '@react-three/drei'

// En développement uniquement
{import.meta.env.DEV && (
  <>
    <Perf position="top-left" />
    <Stats />
  </>
)}
```

Métriques à surveiller :
- **FPS** : Framerate temps réel
- **Calls** : Nombre de draw calls
- **Triangles** : Géométrie rendue
- **GPU/CPU** : Charge processeur

---

## 7. Moteur Physique Rapier

### A. Configuration Optimale

```tsx
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'

<Physics
  gravity={[0, -9.81, 0]}
  timeStep="vary" // ou 1/60 pour fixe
  interpolate={true}
>
  <RigidBody type="fixed">
    <CuboidCollider args={[10, 0.5, 10]} />
    <mesh>
      <boxGeometry args={[20, 1, 20]} />
      <meshStandardMaterial />
    </mesh>
  </RigidBody>
</Physics>
```

### B. Performance Rapier

| Feature | Activation | Impact |
|---------|------------|--------|
| SIMD | Auto (WASM) | +30-50% perf |
| Sleep Mode | Auto | Économie CPU corps au repos |
| Broad Phase | Built-in | Détection collision optimisée |

> **Benchmark :** Rapier WASM permet des milliers de corps physiques actifs tout en maintenant des performances stables.

---

## 8. Accessibilité (A11y) pour la 3D

### A. Installation

```bash
npm install @react-three/a11y
```

### B. Implémentation

```tsx
import { A11yAnnouncer, A11y } from '@react-three/a11y'

// Placer à côté du Canvas
<>
  <Canvas>
    <A11y
      role="button"
      description="Ouvrir le projet GitHub"
      actionCall={() => openProject()}
    >
      <InteractiveScreen />
    </A11y>
  </Canvas>
  <A11yAnnouncer />
</>
```

### C. Conformité WCAG

| Critère | Minimum | Recommandé | Implementation |
|---------|---------|------------|----------------|
| Contraste couleurs | 4.5:1 (AA) | 7:1 (AAA) | Vérifier avec WebAIM |
| Navigation clavier | Requis | Focus visible | Tab + Enter |
| Screen Reader | Requis | Descriptions riches | ARIA labels |
| Réduction mouvement | Requis | - | `prefers-reduced-motion` |

```tsx
// Respect des préférences utilisateur
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

<Canvas frameloop={prefersReducedMotion ? 'demand' : 'always'}>
```

---

## 9. Sécurité API Node.js

### A. Architecture Sécurisée

```
┌─────────────────────────────────────────────────────────────┐
│                      HOSTINGER                              │
│                                                             │
│  ┌─────────────┐     ┌──────────────┐     ┌─────────────┐  │
│  │  React App  │────▶│   Node.js    │────▶│   MySQL     │  │
│  │  (Static)   │     │   (Hono)     │     │             │  │
│  └─────────────┘     └──────────────┘     └─────────────┘  │
│                             │                               │
│                      ┌──────▼──────┐                       │
│                      │ Rate Limit  │                       │
│                      │ Validation  │                       │
│                      │ CORS        │                       │
│                      │ Logging     │                       │
│                      └─────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### B. Middleware de Sécurité

```typescript
// server/src/middleware/security.ts
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

export const securityMiddleware = (app: Hono) => {
  // Headers de sécurité automatiques
  app.use('*', secureHeaders({
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    strictTransportSecurity: 'max-age=31536000; includeSubDomains',
  }))

  // Validation Content-Type
  app.use('/api/*', async (c, next) => {
    if (c.req.method === 'POST') {
      const contentType = c.req.header('content-type')
      if (!contentType?.includes('application/json')) {
        return c.json({ error: 'Content-Type must be application/json' }, 400)
      }
    }
    await next()
  })
}
```

### C. Checklist Sécurité OWASP

| Vulnérabilité | Mitigation | Status |
|---------------|------------|--------|
| SQL Injection | mysql2 prepared statements | ✅ |
| XSS | Hono secure headers + CSP | ✅ |
| CSRF | CORS restrictif | ✅ |
| Rate Limiting | hono-rate-limiter | ✅ |
| Input Validation | Zod schemas | ✅ |
| Sensitive Data | HTTPS + env variables | ✅ |
| Broken Access Control | Validation privilege level | ✅ |
| Logging | Console + fichiers | ✅ |

---

## 10. Pipeline CI/CD (GitHub Actions)

### A. Structure des Workflows

```
.github/
└── workflows/
    ├── ci.yml          # Tests + Lint sur PR
    └── deploy.yml      # Déploiement production
```

### B. Workflow de Déploiement

```yaml
# .github/workflows/deploy.yml
name: Deploy to Hostinger

on:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # Build Frontend
      - name: Install frontend dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Build frontend
        run: npm run build
        env:
          VITE_API_URL: /api

      # Build Backend
      - name: Install server dependencies
        run: cd server && npm ci

      - name: Build server
        run: cd server && npm run build

      # Deploy
      - name: Deploy via SFTP
        uses: wlixcc/SFTP-Deploy-Action@v1.2.4
        with:
          server: ${{ secrets.SFTP_HOST }}
          username: ${{ secrets.SFTP_USER }}
          ssh_private_key: ${{ secrets.SFTP_SSH_KEY }}
          local_path: |
            ./dist/*
            ./server/dist/*
            ./server/package.json
            ./server/package-lock.json
          remote_path: '/home/u123456789/domains/pierrelegrand.fr/'
          sftp_only: true

      - name: Restart Node.js app
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SFTP_HOST }}
          username: ${{ secrets.SFTP_USER }}
          key: ${{ secrets.SFTP_SSH_KEY }}
          script: |
            cd /home/u123456789/domains/pierrelegrand.fr/server
            npm ci --production
            pm2 restart pierre-legrand || pm2 start dist/index.js --name pierre-legrand
```

### C. Configuration Vite Production

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: false, gzipSize: true })
  ],

  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: false,

    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-three': ['three'],
          'vendor-r3f': ['@react-three/fiber', '@react-three/drei'],
          'vendor-rapier': ['@react-three/rapier'],
        }
      }
    },

    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },

  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.hdr']
})
```

### D. Sécurité SFTP/Déploiement

| Pratique | Implémentation | Fréquence |
|----------|----------------|-----------|
| Clés SSH Ed25519 | GitHub Secrets | - |
| Rotation des clés | Renouvellement | 6-12 mois |
| IP Whitelist | Hostinger firewall | Fixe |
| Audit logs | Vérification accès | Hebdomadaire |

---

## 11. Observabilité et Monitoring

### A. Stack Monitoring Recommandée

| Composant | Outil | Gratuit | Usage |
|-----------|-------|---------|-------|
| APM Frontend | Sentry | ✅ (10K events/mois) | Errors + Performance |
| Analytics | Plausible/Umami | ✅ (self-hosted) | RGPD compliant |
| Logs Node.js | Pino + Logtail | ✅ | Structured logging |
| Uptime | UptimeRobot | ✅ (50 monitors) | Alerting |

### B. Intégration Sentry (Frontend)

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
```

### C. Métriques Custom 3D

```typescript
// src/utils/metrics.ts
import * as Sentry from '@sentry/react'

export function trackPerformance() {
  const metrics = {
    fps: 0,
    drawCalls: 0,
    triangles: 0,
    textureMemory: 0,
  }

  setInterval(() => {
    if (metrics.fps < 24) {
      Sentry.captureMessage('Low FPS detected', {
        level: 'warning',
        extra: metrics
      })
    }
  }, 30000)

  return metrics
}
```

---

## 12. Environnements et Configuration

### A. Variables d'Environnement

```bash
# Frontend (.env.development)
VITE_API_URL=http://localhost:3000/api
VITE_DEBUG_MODE=true
VITE_SENTRY_DSN=

# Frontend (.env.production)
VITE_API_URL=/api
VITE_DEBUG_MODE=false
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Backend (server/.env)
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_USER=u123456789_portfolio
DB_PASSWORD=VotreMotDePasseSecurise
DB_NAME=u123456789_portfolio
```

### B. Configuration Hostinger Node.js

| Paramètre | Valeur Recommandée |
|-----------|-------------------|
| Node Version | 20 LTS |
| Entry point | server/dist/index.js |
| Port | 3000 (ou auto-assigné) |
| Process Manager | PM2 |
| SSL | Let's Encrypt (auto-renew) |

---

## 13. Roadmap Technique

### Phase 1 : MVP (Fondations)
- [ ] Setup projet Vite + R3F + TypeScript
- [ ] Setup serveur Node.js + Hono
- [ ] Création du premier biome (Lab)
- [ ] Système de navigation basique
- [ ] API endpoint codes
- [ ] CI/CD GitHub Actions

### Phase 2 : Core Features
- [ ] 3 biomes complets
- [ ] Terminal cheat codes UI
- [ ] Système de privilèges frontend
- [ ] Compression Draco tous assets
- [ ] Tests E2E (Playwright)

### Phase 3 : Polish & Scale
- [ ] Accessibilité A11y complète
- [ ] PWA + Offline support
- [ ] Monitoring Sentry
- [ ] WebGPU opt-in
- [ ] Internationalisation (i18n)

---

## Sources et Références

### Documentation Officielle
- [React Three Fiber Documentation](https://r3f.docs.pmnd.rs/)
- [Drei Helpers](https://github.com/pmndrs/drei)
- [Rapier Physics](https://rapier.rs/)
- [Hono Framework](https://hono.dev/)
- [Vite.js Deployment Guide](https://vite.dev/guide/static-deploy)
- [Google Draco Compression](https://google.github.io/draco/)

### Sécurité
- [OWASP REST API Security](https://www.browserstack.com/guide/rest-api-design-principles-and-best-practices)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [SFTP Security Best Practices](https://www.kiteworks.com/secure-file-transfer/sftp-best-practices/)

### Performance
- [R3F Scaling Performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [Three.js Performance Optimization](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)
- [WebGPU Migration Guide](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide)

### Accessibilité
- [React Three A11y](https://github.com/pmndrs/react-three-a11y)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### CI/CD
- [GitHub Actions Vite Deployment](https://dev.to/brucedevnairobi/build-deploy-and-host-your-vite-app-on-github-pages-with-github-actions-cicd-2g51)
- [Hostinger Node.js Deployment](https://support.hostinger.com/en/articles/6419605-how-to-set-up-node-js)

---

*Document mis à jour : Janvier 2026*
*Version : 3.0 Node.js Enterprise-Grade*
