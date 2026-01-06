/**
 * Store Zustand pour la gestion des chunks
 * Gère le chargement/déchargement dynamique des chunks
 */

import { create } from 'zustand'
import * as THREE from 'three'
import { CHUNK_CONFIG } from '@/config/proceduralConfig'

export interface ChunkData {
  id: string
  x: number
  z: number
  worldX: number
  worldZ: number
  lod: number
  loaded: boolean
  loading: boolean
  lastAccess: number
  geometry?: THREE.BufferGeometry
}

interface ChunkState {
  chunks: Map<string, ChunkData>
  activeChunks: Set<string>
  playerChunk: { x: number; z: number }
  seed: number

  // Actions
  setSeed: (seed: number) => void
  updatePlayerPosition: (position: THREE.Vector3) => void
  getChunk: (x: number, z: number) => ChunkData | undefined
  loadChunk: (x: number, z: number) => void
  unloadChunk: (id: string) => void
  updateChunkGeometry: (id: string, geometry: THREE.BufferGeometry) => void
  getVisibleChunks: () => ChunkData[]
  cleanup: () => void
}

/**
 * Génère l'ID unique d'un chunk
 */
export function getChunkId(x: number, z: number): string {
  return `chunk_${x}_${z}`
}

/**
 * Calcule la coordonnée chunk depuis une position monde
 */
export function worldToChunk(worldPos: number): number {
  return Math.floor(worldPos / CHUNK_CONFIG.size)
}

/**
 * Calcule la position monde du coin d'un chunk
 */
export function chunkToWorld(chunkCoord: number): number {
  return chunkCoord * CHUNK_CONFIG.size
}

/**
 * Calcule le LOD basé sur la distance
 */
function calculateLOD(distance: number): number {
  if (distance <= 1) return 0  // Haute résolution
  if (distance <= 2) return 1  // Moyenne
  if (distance <= 3) return 2  // Basse
  return 3                      // Très basse
}

export const useChunkStore = create<ChunkState>((set, get) => ({
  chunks: new Map(),
  activeChunks: new Set(),
  playerChunk: { x: 0, z: 0 },
  seed: 12345,

  setSeed: (seed) => set({ seed }),

  updatePlayerPosition: (position) => {
    const newChunkX = worldToChunk(position.x)
    const newChunkZ = worldToChunk(position.z)
    const { playerChunk, chunks, activeChunks } = get()

    // Si le joueur n'a pas changé de chunk, ne rien faire
    if (playerChunk.x === newChunkX && playerChunk.z === newChunkZ) {
      return
    }

    set({ playerChunk: { x: newChunkX, z: newChunkZ } })

    const newActiveChunks = new Set<string>()
    const chunksToLoad: { x: number; z: number }[] = []
    const chunksToUnload: string[] = []

    // Déterminer les chunks à charger (dans le rayon de vue)
    for (let dx = -CHUNK_CONFIG.viewDistance; dx <= CHUNK_CONFIG.viewDistance; dx++) {
      for (let dz = -CHUNK_CONFIG.viewDistance; dz <= CHUNK_CONFIG.viewDistance; dz++) {
        const distance = Math.sqrt(dx * dx + dz * dz)
        if (distance <= CHUNK_CONFIG.viewDistance) {
          const cx = newChunkX + dx
          const cz = newChunkZ + dz
          const id = getChunkId(cx, cz)
          newActiveChunks.add(id)

          if (!chunks.has(id)) {
            chunksToLoad.push({ x: cx, z: cz })
          }
        }
      }
    }

    // Déterminer les chunks à décharger
    for (const id of activeChunks) {
      if (!newActiveChunks.has(id)) {
        const chunk = chunks.get(id)
        if (chunk) {
          const dx = chunk.x - newChunkX
          const dz = chunk.z - newChunkZ
          const distance = Math.sqrt(dx * dx + dz * dz)
          if (distance > CHUNK_CONFIG.unloadDistance) {
            chunksToUnload.push(id)
          }
        }
      }
    }

    // Charger les nouveaux chunks
    chunksToLoad.forEach(({ x, z }) => get().loadChunk(x, z))

    // Décharger les chunks éloignés
    chunksToUnload.forEach(id => get().unloadChunk(id))

    set({ activeChunks: newActiveChunks })
  },

  getChunk: (x, z) => {
    return get().chunks.get(getChunkId(x, z))
  },

  loadChunk: (x, z) => {
    const id = getChunkId(x, z)
    const { chunks, playerChunk } = get()

    if (chunks.has(id)) return

    const dx = x - playerChunk.x
    const dz = z - playerChunk.z
    const distance = Math.sqrt(dx * dx + dz * dz)

    const newChunk: ChunkData = {
      id,
      x,
      z,
      worldX: chunkToWorld(x),
      worldZ: chunkToWorld(z),
      lod: calculateLOD(distance),
      loaded: false,
      loading: true,
      lastAccess: Date.now(),
    }

    const newChunks = new Map(chunks)
    newChunks.set(id, newChunk)
    set({ chunks: newChunks })

    // Marquer comme chargé après un court délai (simulation)
    // En production, ça serait le callback du Worker
    setTimeout(() => {
      const { chunks: currentChunks } = get()
      const chunk = currentChunks.get(id)
      if (chunk) {
        const updated = new Map(currentChunks)
        updated.set(id, { ...chunk, loaded: true, loading: false })
        set({ chunks: updated })
      }
    }, 10)
  },

  unloadChunk: (id) => {
    const { chunks } = get()
    const chunk = chunks.get(id)

    if (chunk?.geometry) {
      chunk.geometry.dispose()
    }

    const newChunks = new Map(chunks)
    newChunks.delete(id)
    set({ chunks: newChunks })
  },

  updateChunkGeometry: (id, geometry) => {
    const { chunks } = get()
    const chunk = chunks.get(id)

    if (chunk) {
      // Disposer l'ancienne géométrie
      if (chunk.geometry) {
        chunk.geometry.dispose()
      }

      const updated = new Map(chunks)
      updated.set(id, { ...chunk, geometry, loaded: true, loading: false })
      set({ chunks: updated })
    }
  },

  getVisibleChunks: () => {
    const { chunks, activeChunks } = get()
    const visible: ChunkData[] = []

    for (const id of activeChunks) {
      const chunk = chunks.get(id)
      if (chunk?.loaded) {
        visible.push(chunk)
      }
    }

    return visible
  },

  cleanup: () => {
    const { chunks } = get()
    for (const chunk of chunks.values()) {
      if (chunk.geometry) {
        chunk.geometry.dispose()
      }
    }
    set({ chunks: new Map(), activeChunks: new Set() })
  },
}))
