/**
 * ChunkManager - Gestionnaire de chunks procéduraux
 * Orchestre le chargement/déchargement des chunks selon la position du joueur
 */

import { useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useChunkStore } from '@stores/chunkStore'
import { Chunk, ChunkSimple } from './Chunk'
import { WorkerChunk, WorkerChunkSimple } from './WorkerChunk'
import { terminateWorkerPool } from '@/workers'

interface ChunkManagerProps {
  /** Position du joueur (mise à jour chaque frame) */
  playerPosition?: THREE.Vector3
  /** Seed pour la génération procédurale */
  seed?: number
  /** Afficher le wireframe pour debug */
  debug?: boolean
  /** Activer la physique sur les chunks proches */
  enablePhysics?: boolean
  /** Utiliser les Web Workers pour la génération (recommandé) */
  useWorkers?: boolean
  /** Callback quand un chunk est chargé */
  onChunkLoaded?: (chunkId: string) => void
  /** Callback quand un chunk est déchargé */
  onChunkUnloaded?: (chunkId: string) => void
}

/**
 * Composant principal de gestion des chunks
 * À placer dans la scène pour activer le terrain procédural
 */
export function ChunkManager({
  playerPosition,
  seed = 12345,
  debug = false,
  enablePhysics = true,
  useWorkers = true,
  onChunkLoaded,
  onChunkUnloaded: _onChunkUnloaded,
}: ChunkManagerProps) {
  const {
    setSeed,
    updatePlayerPosition,
    getVisibleChunks,
    cleanup,
  } = useChunkStore()

  // Initialiser le seed
  useEffect(() => {
    setSeed(seed)
  }, [seed, setSeed])

  // Nettoyer à la destruction
  useEffect(() => {
    return () => {
      cleanup()
      // Terminer les workers si on les utilise
      if (useWorkers) {
        terminateWorkerPool()
      }
    }
  }, [cleanup, useWorkers])

  // Mettre à jour la position du joueur chaque frame
  useFrame(() => {
    if (playerPosition) {
      updatePlayerPosition(playerPosition)
    }
  })

  // Récupérer les chunks visibles
  const visibleChunks = getVisibleChunks()

  // Sélectionner les composants appropriés
  const ChunkComponent = useWorkers ? WorkerChunk : Chunk
  const ChunkSimpleComponent = useWorkers ? WorkerChunkSimple : ChunkSimple

  return (
    <group name="chunk-manager">
      {visibleChunks.map((chunk) => {
        // Utiliser le chunk avec physics pour les proches, sans pour les lointains
        const usePhysics = enablePhysics && chunk.lod <= 1

        if (usePhysics) {
          return (
            <ChunkComponent
              key={chunk.id}
              data={chunk}
              seed={seed}
              showWireframe={debug}
              onLoaded={() => onChunkLoaded?.(chunk.id)}
            />
          )
        }

        return (
          <ChunkSimpleComponent
            key={chunk.id}
            data={chunk}
            seed={seed}
            showWireframe={debug}
            onLoaded={() => onChunkLoaded?.(chunk.id)}
          />
        )
      })}

      {/* Debug: afficher les stats */}
      {debug && (
        <ChunkDebugInfo chunksCount={visibleChunks.length} useWorkers={useWorkers} />
      )}
    </group>
  )
}

/**
 * Hook pour utiliser le ChunkManager avec la position du joueur
 */
export function useChunkManager() {
  const { updatePlayerPosition, getVisibleChunks, cleanup } = useChunkStore()

  const update = useCallback((position: THREE.Vector3) => {
    updatePlayerPosition(position)
  }, [updatePlayerPosition])

  return {
    update,
    getVisibleChunks,
    cleanup,
  }
}

/**
 * Composant de debug pour afficher les infos chunks
 */
function ChunkDebugInfo({
  chunksCount: _chunksCount,
  useWorkers: _useWorkers
}: {
  chunksCount: number
  useWorkers: boolean
}) {
  // Debug info - peut être étendu avec drei's Html
  // const { playerChunk, activeChunks } = useChunkStore()

  return (
    <group position={[0, 10, 0]}>
      {/* Ce serait mieux avec drei's Html, mais on garde simple */}
      <mesh>
        <planeGeometry args={[5, 1]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

/**
 * Composant pour prévisualiser la grille de chunks (debug)
 */
export function ChunkGridPreview({ size = 4, cellSize = 32 }: { size?: number; cellSize?: number }) {
  const gridSize = size * cellSize

  return (
    <group position={[0, 0.1, 0]}>
      {/* Grille */}
      <gridHelper args={[gridSize, size, '#444444', '#222222']} />

      {/* Axes */}
      <arrowHelper args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 10, 0xff0000]} />
      <arrowHelper args={[new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 10, 0x0000ff]} />
    </group>
  )
}
