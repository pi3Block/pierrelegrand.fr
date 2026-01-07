/**
 * Fortress - Structure robuste basee sur la pierre
 * Construction solide avec murs epais
 */

import { useMemo } from 'react'
import { WoodPlank, StoneBlock, StonePillar, GlassBlock } from '../DestructibleStructure'

interface FortressProps {
  position: [number, number, number]
  rotation?: number
  scale?: number
}

function createSeededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = Math.sin(s * 9999) * 10000
    return s - Math.floor(s)
  }
}

export function Fortress({ position, rotation = 0, scale = 1 }: FortressProps) {
  const rng = useMemo(
    () => createSeededRandom(position[0] * 100 + position[2] + 1000),
    [position]
  )

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* BASE EN PIERRE EPAISSE - Premiere rangee FIXE */}
      {[-2, -1, 0, 1, 2].map((x, i) => (
        <StoneBlock
          key={i}
          position={[x * 0.7, 0.35, 0]}
          size={[0.65, 0.7, 0.5]}
          colorVariation={rng() - 0.5}
          isFoundation={true}
        />
      ))}

      {/* Deuxieme rangee - decalee */}
      {[-1.5, -0.5, 0.5, 1.5].map((x, i) => (
        <StoneBlock
          key={i + 10}
          position={[x * 0.7, 1.0, 0]}
          size={[0.65, 0.6, 0.5]}
          colorVariation={rng() - 0.5}
        />
      ))}

      {/* PILIERS AUX COINS */}
      <StonePillar position={[-1.8, 1.6, -0.15]} height={1.8} colorVariation={rng() - 0.5} />
      <StonePillar position={[1.8, 1.6, -0.15]} height={1.8} colorVariation={rng() - 0.5} />
      <StonePillar position={[-1.8, 1.6, 0.15]} height={1.8} colorVariation={rng() - 0.5} />
      <StonePillar position={[1.8, 1.6, 0.15]} height={1.8} colorVariation={rng() - 0.5} />

      {/* SECTION MEDIANE - Pierre avec renfort en bois */}
      <StoneBlock
        position={[-0.9, 1.6, 0]}
        size={[0.8, 0.8, 0.45]}
        colorVariation={rng() - 0.5}
      />
      <StoneBlock
        position={[0.9, 1.6, 0]}
        size={[0.8, 0.8, 0.45]}
        colorVariation={rng() - 0.5}
      />

      {/* Ouverture centrale avec verre */}
      <GlassBlock position={[0, 1.7, 0]} size={0.6} colorVariation={rng() - 0.5} />

      {/* Plateforme en bois */}
      <WoodPlank position={[-0.9, 2.1, 0]} length={1.5} colorVariation={rng() - 0.5} />
      <WoodPlank position={[0.9, 2.1, 0]} length={1.5} colorVariation={rng() - 0.5} />
      <WoodPlank position={[0, 2.1, 0]} length={0.8} colorVariation={rng() - 0.5} />

      {/* NIVEAU SUPERIEUR - Creneaux */}
      <StoneBlock
        position={[-1.5, 2.75, 0]}
        size={[0.5, 0.5, 0.4]}
        colorVariation={rng() - 0.5}
      />
      <StoneBlock
        position={[-0.5, 2.75, 0]}
        size={[0.5, 0.5, 0.4]}
        colorVariation={rng() - 0.5}
      />
      <StoneBlock
        position={[0.5, 2.75, 0]}
        size={[0.5, 0.5, 0.4]}
        colorVariation={rng() - 0.5}
      />
      <StoneBlock
        position={[1.5, 2.75, 0]}
        size={[0.5, 0.5, 0.4]}
        colorVariation={rng() - 0.5}
      />

      {/* Poutre superieure connectant les creneaux */}
      <WoodPlank position={[0, 2.55, 0]} length={3.5} colorVariation={rng() - 0.5} />
    </group>
  )
}
