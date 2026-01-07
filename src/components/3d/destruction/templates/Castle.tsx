/**
 * Castle - Structure large avec tours aux coins
 * Design de chateau iconique style Angry Birds
 */

import { useMemo } from 'react'
import {
  DestructibleBlock,
  WoodPlank,
  WoodBeam,
  GlassBlock,
  StoneBlock,
} from '../DestructibleStructure'

interface CastleProps {
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

export function Castle({ position, rotation = 0, scale = 1 }: CastleProps) {
  const rng = useMemo(
    () => createSeededRandom(position[0] * 100 + position[2] + 500),
    [position]
  )

  const mainWidth = 4
  const mainDepth = 2
  const towerHeight = 3
  const wallHeight = 1.8

  const cornerPositions: [number, number][] = [
    [-mainWidth / 2, -mainDepth / 2],
    [mainWidth / 2, -mainDepth / 2],
    [-mainWidth / 2, mainDepth / 2],
    [mainWidth / 2, mainDepth / 2],
  ]

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* TOURS AUX COINS (4x) */}
      {cornerPositions.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          {/* Base de la tour - pierre FIXE */}
          <StoneBlock position={[0, 0.35, 0]} size={[0.5, 0.7, 0.5]} colorVariation={rng() - 0.5} isFoundation={true} />
          <StoneBlock position={[0, 0.95, 0]} size={[0.4, 0.5, 0.4]} colorVariation={rng() - 0.5} />

          {/* Milieu de la tour - cadre en bois */}
          <WoodBeam
            position={[-0.15, 1.8, -0.15]}
            height={1.5}
            colorVariation={rng() - 0.5}
          />
          <WoodBeam
            position={[0.15, 1.8, -0.15]}
            height={1.5}
            colorVariation={rng() - 0.5}
          />
          <WoodBeam
            position={[-0.15, 1.8, 0.15]}
            height={1.5}
            colorVariation={rng() - 0.5}
          />
          <WoodBeam
            position={[0.15, 1.8, 0.15]}
            height={1.5}
            colorVariation={rng() - 0.5}
          />

          {/* Chapeau de la tour - pierre */}
          <StoneBlock
            position={[0, towerHeight - 0.15, 0]}
            size={[0.6, 0.3, 0.6]}
            colorVariation={rng() - 0.5}
          />
        </group>
      ))}

      {/* MUR AVANT */}
      <group position={[0, 0, -mainDepth / 2]}>
        {/* Base en pierre du mur - FIXE */}
        {[-1.2, 0, 1.2].map((x, i) => (
          <StoneBlock
            key={i}
            position={[x, 0.3, 0]}
            size={[0.8, 0.6, 0.4]}
            colorVariation={rng() - 0.5}
            isFoundation={true}
          />
        ))}

        {/* Mur en bois avec ouverture (porte) */}
        <WoodBeam
          position={[-1, wallHeight / 2 + 0.6, 0]}
          height={wallHeight}
          colorVariation={rng() - 0.5}
        />
        <WoodBeam
          position={[1, wallHeight / 2 + 0.6, 0]}
          height={wallHeight}
          colorVariation={rng() - 0.5}
        />

        {/* Poutre superieure */}
        <WoodPlank position={[0, wallHeight + 0.6, 0]} length={2.5} colorVariation={rng() - 0.5} />

        {/* Arc de porte (verre pour l'interet visuel) */}
        <GlassBlock position={[0, 1.2, 0]} size={0.4} colorVariation={rng() - 0.5} />
      </group>

      {/* MUR ARRIERE */}
      <group position={[0, 0, mainDepth / 2]}>
        {[-1.5, -0.5, 0.5, 1.5].map((x, i) => (
          <DestructibleBlock
            key={i}
            position={[x, 0.3, 0]}
            size={[0.7, 0.6, 0.35]}
            material="stone"
            colorVariation={rng() - 0.5}
            isFoundation={true}
          />
        ))}
        {[-1.5, -0.5, 0.5, 1.5].map((x, i) => (
          <DestructibleBlock
            key={i + 10}
            position={[x, 0.9, 0]}
            size={[0.7, 0.6, 0.35]}
            material="wood"
            colorVariation={rng() - 0.5}
          />
        ))}
        {[-1, 0, 1].map((x, i) => (
          <DestructibleBlock
            key={i + 20}
            position={[x, 1.5, 0]}
            size={[0.7, 0.6, 0.35]}
            material="wood"
            colorVariation={rng() - 0.5}
          />
        ))}
      </group>

      {/* MURS LATERAUX - connectant les tours */}
      {[-mainDepth / 2, mainDepth / 2].map((z, sideIndex) => (
        <group key={sideIndex}>
          {/* Blocs de pierre inferieurs - FIXES */}
          <StoneBlock
            position={[-mainWidth / 4, 0.3, z]}
            size={[mainWidth / 2 - 0.5, 0.6, 0.4]}
            colorVariation={rng() - 0.5}
            isFoundation={true}
          />
          <StoneBlock
            position={[mainWidth / 4, 0.3, z]}
            size={[mainWidth / 2 - 0.5, 0.6, 0.4]}
            colorVariation={rng() - 0.5}
            isFoundation={true}
          />

          {/* Planches de bois superieures */}
          <WoodPlank
            position={[0, 1.0, z]}
            length={mainWidth - 1}
            colorVariation={rng() - 0.5}
          />
          <WoodPlank
            position={[0, 1.4, z]}
            length={mainWidth - 1.2}
            colorVariation={rng() - 0.5}
          />
        </group>
      ))}

      {/* PLATEFORME CENTRALE */}
      <WoodPlank
        position={[-0.8, wallHeight + 0.15, 0]}
        length={1.5}
        colorVariation={rng() - 0.5}
      />
      <WoodPlank
        position={[0.8, wallHeight + 0.15, 0]}
        length={1.5}
        colorVariation={rng() - 0.5}
      />
    </group>
  )
}
