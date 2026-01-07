/**
 * LShape - Structure avec empreinte en forme de L
 * Batiment a deux ailes perpendiculaires
 */

import { useMemo } from 'react'
import {
  DestructibleBlock,
  WoodPlank,
  WoodBeam,
  GlassBlock,
  StoneBlock,
  StonePillar,
} from '../DestructibleStructure'

interface LShapeProps {
  position: [number, number, number]
  rotation?: number
  scale?: number
  floors?: 2 | 3
}

function createSeededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = Math.sin(s * 9999) * 10000
    return s - Math.floor(s)
  }
}

export function LShape({
  position,
  rotation = 0,
  scale = 1,
  floors = 2,
}: LShapeProps) {
  const rng = useMemo(
    () => createSeededRandom(position[0] * 100 + position[2] + 2000),
    [position]
  )

  const floorHeight = 1.3
  const wingLength = 2.5
  const wingWidth = 1.2

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* AILE PRINCIPALE (direction X) */}
      <group position={[wingLength / 2 - wingWidth / 2, 0, 0]}>
        {/* Fondation FIXE */}
        <StoneBlock
          position={[-wingLength / 2 + 0.3, 0.25, 0]}
          size={[0.5, 0.5, wingWidth]}
          colorVariation={rng() - 0.5}
          isFoundation={true}
        />
        <StoneBlock
          position={[wingLength / 2 - 0.3, 0.25, 0]}
          size={[0.5, 0.5, wingWidth]}
          colorVariation={rng() - 0.5}
          isFoundation={true}
        />

        {/* Etages */}
        {Array.from({ length: floors }, (_, floor) => {
          const y = 0.5 + floor * floorHeight
          return (
            <group key={floor}>
              {/* Piliers */}
              <WoodBeam
                position={[-wingLength / 2, y + floorHeight / 2, -wingWidth / 2 + 0.1]}
                height={floorHeight}
                colorVariation={rng() - 0.5}
              />
              <WoodBeam
                position={[-wingLength / 2, y + floorHeight / 2, wingWidth / 2 - 0.1]}
                height={floorHeight}
                colorVariation={rng() - 0.5}
              />
              <WoodBeam
                position={[wingLength / 2, y + floorHeight / 2, -wingWidth / 2 + 0.1]}
                height={floorHeight}
                colorVariation={rng() - 0.5}
              />
              <WoodBeam
                position={[wingLength / 2, y + floorHeight / 2, wingWidth / 2 - 0.1]}
                height={floorHeight}
                colorVariation={rng() - 0.5}
              />

              {/* Poutres horizontales */}
              <WoodPlank position={[0, y, -wingWidth / 2 + 0.1]} length={wingLength} colorVariation={rng() - 0.5} />
              <WoodPlank position={[0, y, wingWidth / 2 - 0.1]} length={wingLength} colorVariation={rng() - 0.5} />

              {/* Fenetre au milieu */}
              {floor > 0 && (
                <GlassBlock
                  position={[0, y + floorHeight * 0.4, 0]}
                  size={0.4}
                  colorVariation={rng() - 0.5}
                />
              )}
            </group>
          )
        })}

        {/* Toit */}
        <WoodPlank
          position={[0, 0.5 + floors * floorHeight, 0]}
          length={wingLength + 0.3}
          colorVariation={rng() - 0.5}
        />
      </group>

      {/* AILE SECONDAIRE (direction Z) */}
      <group position={[0, 0, wingLength / 2 - wingWidth / 2]}>
        {/* Fondation FIXE */}
        <StoneBlock
          position={[0, 0.25, wingLength / 2 - 0.3]}
          size={[wingWidth, 0.5, 0.5]}
          colorVariation={rng() - 0.5}
          isFoundation={true}
        />

        {/* Etages */}
        {Array.from({ length: floors }, (_, floor) => {
          const y = 0.5 + floor * floorHeight
          return (
            <group key={floor}>
              {/* Piliers (seulement ceux qui ne chevauchent pas) */}
              <WoodBeam
                position={[-wingWidth / 2 + 0.1, y + floorHeight / 2, wingLength / 2]}
                height={floorHeight}
                colorVariation={rng() - 0.5}
              />
              <WoodBeam
                position={[wingWidth / 2 - 0.1, y + floorHeight / 2, wingLength / 2]}
                height={floorHeight}
                colorVariation={rng() - 0.5}
              />

              {/* Poutres horizontales */}
              <WoodPlank
                position={[-wingWidth / 2 + 0.1, y, wingLength / 4]}
                rotation={[0, Math.PI / 2, 0]}
                length={wingLength / 2}
                colorVariation={rng() - 0.5}
              />
              <WoodPlank
                position={[wingWidth / 2 - 0.1, y, wingLength / 4]}
                rotation={[0, Math.PI / 2, 0]}
                length={wingLength / 2}
                colorVariation={rng() - 0.5}
              />

              {/* Mur arriere avec blocs */}
              <DestructibleBlock
                position={[-0.4, y + floorHeight * 0.4, wingLength / 2]}
                size={[0.5, 0.4, 0.2]}
                material="wood"
                colorVariation={rng() - 0.5}
              />
              <DestructibleBlock
                position={[0.4, y + floorHeight * 0.4, wingLength / 2]}
                size={[0.5, 0.4, 0.2]}
                material="wood"
                colorVariation={rng() - 0.5}
              />
            </group>
          )
        })}

        {/* Toit */}
        <WoodPlank
          position={[0, 0.5 + floors * floorHeight, wingLength / 4]}
          rotation={[0, Math.PI / 2, 0]}
          length={wingLength / 2 + 0.3}
          colorVariation={rng() - 0.5}
        />
      </group>

      {/* COIN CENTRAL - Renforcement */}
      <StonePillar
        position={[0, 0.5 + (floors * floorHeight) / 2, 0]}
        height={floors * floorHeight}
        colorVariation={rng() - 0.5}
      />

      {/* Chapeau au centre */}
      <StoneBlock
        position={[0, 0.65 + floors * floorHeight, 0]}
        size={[0.5, 0.3, 0.5]}
        colorVariation={rng() - 0.5}
      />
    </group>
  )
}
