/**
 * TallTower - Tour stable de 3-4 etages style Angry Birds
 * STABILITE: Blocs empiles directement les uns sur les autres
 */

import { useMemo } from 'react'
import { DestructibleBlock, StoneBlock, GlassBlock } from '../DestructibleStructure'

interface TallTowerProps {
  position: [number, number, number]
  rotation?: number
  scale?: number
  floors?: 3 | 4
  variant?: 'standard' | 'narrow' | 'wide'
}

function createSeededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = Math.sin(s * 9999) * 10000
    return s - Math.floor(s)
  }
}

export function TallTower({
  position,
  rotation = 0,
  scale = 1,
  floors = 3,
  variant = 'standard',
}: TallTowerProps) {
  const rng = useMemo(
    () => createSeededRandom(position[0] * 100 + position[2]),
    [position]
  )

  const widthMultiplier = variant === 'narrow' ? 0.8 : variant === 'wide' ? 1.3 : 1
  const baseSpacing = 1.2 * widthMultiplier
  const blockHeight = 0.5
  const blockWidth = 0.5
  const blockDepth = 0.4

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* FONDATION - Rangee de blocs de pierre FIXES */}
      <StoneBlock
        position={[-baseSpacing / 2, blockHeight / 2, 0]}
        size={[blockWidth, blockHeight, blockDepth]}
        colorVariation={rng() - 0.5}
        isFoundation={true}
      />
      <StoneBlock
        position={[0, blockHeight / 2, 0]}
        size={[blockWidth, blockHeight, blockDepth]}
        colorVariation={rng() - 0.5}
        isFoundation={true}
      />
      <StoneBlock
        position={[baseSpacing / 2, blockHeight / 2, 0]}
        size={[blockWidth, blockHeight, blockDepth]}
        colorVariation={rng() - 0.5}
        isFoundation={true}
      />

      {/* Generer les etages - empilement simple */}
      {Array.from({ length: floors }, (_, floorIndex) => {
        const y = blockHeight + floorIndex * (blockHeight * 2 + 0.02)
        const isEvenFloor = floorIndex % 2 === 0

        return (
          <group key={floorIndex}>
            {/* Piliers verticaux gauche et droit */}
            <DestructibleBlock
              position={[-baseSpacing / 2, y + blockHeight, 0]}
              size={[blockWidth * 0.4, blockHeight * 2, blockDepth * 0.5]}
              material="wood"
              colorVariation={rng() - 0.5}
            />
            <DestructibleBlock
              position={[baseSpacing / 2, y + blockHeight, 0]}
              size={[blockWidth * 0.4, blockHeight * 2, blockDepth * 0.5]}
              material="wood"
              colorVariation={rng() - 0.5}
            />

            {/* Bloc horizontal au-dessus des piliers */}
            <DestructibleBlock
              position={[0, y + blockHeight * 2 + 0.1, 0]}
              size={[baseSpacing + blockWidth, blockHeight * 0.3, blockDepth]}
              material="wood"
              colorVariation={rng() - 0.5}
            />

            {/* Bloc decoratif au centre (verre sur etages pairs) */}
            {floorIndex > 0 && isEvenFloor && (
              <GlassBlock
                position={[0, y + blockHeight, 0]}
                size={0.35}
                colorVariation={rng() - 0.5}
              />
            )}
          </group>
        )
      })}

      {/* TOIT - Bloc de pierre au sommet */}
      <StoneBlock
        position={[0, blockHeight + floors * (blockHeight * 2 + 0.02) + blockHeight * 0.4, 0]}
        size={[blockWidth * 0.8, blockHeight * 0.5, blockDepth * 0.8]}
        colorVariation={rng() - 0.5}
      />
    </group>
  )
}
