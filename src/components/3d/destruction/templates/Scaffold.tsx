/**
 * Scaffold - Echafaudage stable style Angry Birds
 * STABILITE: Structure simple avec blocs empiles
 */

import { useMemo } from 'react'
import { DestructibleBlock, StoneBlock } from '../DestructibleStructure'

interface ScaffoldProps {
  position: [number, number, number]
  rotation?: number
  scale?: number
  levels?: 2 | 3 | 4
}

function createSeededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = Math.sin(s * 9999) * 10000
    return s - Math.floor(s)
  }
}

export function Scaffold({
  position,
  rotation = 0,
  scale = 1,
  levels = 3,
}: ScaffoldProps) {
  const rng = useMemo(
    () => createSeededRandom(position[0] * 100 + position[2] + 1500),
    [position]
  )

  const levelHeight = 1.0
  const baseWidth = 2.0
  const pillarWidth = 0.25
  const pillarDepth = 0.25
  const plankHeight = 0.15
  const plankDepth = 0.2

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* FONDATION - Blocs de pierre FIXES */}
      <StoneBlock
        position={[-baseWidth / 2, 0.25, 0]}
        size={[0.5, 0.5, 0.5]}
        colorVariation={rng() - 0.5}
        isFoundation={true}
      />
      <StoneBlock
        position={[baseWidth / 2, 0.25, 0]}
        size={[0.5, 0.5, 0.5]}
        colorVariation={rng() - 0.5}
        isFoundation={true}
      />
      <StoneBlock
        position={[0, 0.25, 0]}
        size={[0.5, 0.5, 0.5]}
        colorVariation={rng() - 0.5}
        isFoundation={true}
      />

      {/* Generer chaque niveau */}
      {Array.from({ length: levels }, (_, level) => {
        const y = 0.5 + level * levelHeight

        return (
          <group key={level}>
            {/* Piliers verticaux - directement sur les blocs de base */}
            <DestructibleBlock
              position={[-baseWidth / 2, y + levelHeight / 2, 0]}
              size={[pillarWidth, levelHeight, pillarDepth]}
              material="wood"
              colorVariation={rng() - 0.5}
            />
            <DestructibleBlock
              position={[baseWidth / 2, y + levelHeight / 2, 0]}
              size={[pillarWidth, levelHeight, pillarDepth]}
              material="wood"
              colorVariation={rng() - 0.5}
            />

            {/* Pilier central pour renfort */}
            {level < 2 && (
              <DestructibleBlock
                position={[0, y + levelHeight / 2, 0]}
                size={[pillarWidth, levelHeight, pillarDepth]}
                material="wood"
                colorVariation={rng() - 0.5}
              />
            )}

            {/* Planche horizontale au sommet des piliers */}
            <DestructibleBlock
              position={[0, y + levelHeight + plankHeight / 2, 0]}
              size={[baseWidth + 0.3, plankHeight, plankDepth]}
              material="wood"
              colorVariation={rng() - 0.5}
            />
          </group>
        )
      })}

      {/* SOMMET - Petit bloc decoratif */}
      <StoneBlock
        position={[0, 0.5 + levels * levelHeight + 0.3, 0]}
        size={[0.3, 0.3, 0.3]}
        colorVariation={rng() - 0.5}
      />
    </group>
  )
}
