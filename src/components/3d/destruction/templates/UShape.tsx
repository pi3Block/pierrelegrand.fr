/**
 * UShape - Structure avec empreinte en forme de U
 * Batiment avec cour interieure
 */

import { useMemo } from 'react'
import {
  DestructibleBlock,
  WoodPlank,
  WoodBeam,
  GlassBlock,
  StoneBlock,
} from '../DestructibleStructure'

interface UShapeProps {
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

export function UShape({
  position,
  rotation = 0,
  scale = 1,
  floors = 2,
}: UShapeProps) {
  const rng = useMemo(
    () => createSeededRandom(position[0] * 100 + position[2] + 2500),
    [position]
  )

  const floorHeight = 1.3
  const totalWidth = 4
  const wingDepth = 2
  const wingWidth = 1
  // courtWidth = totalWidth - wingWidth * 2 (non utilise mais utile pour reference)

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* MUR DU FOND (connecte les deux ailes) */}
      <group position={[0, 0, -wingDepth / 2]}>
        {/* Fondation FIXE */}
        {[-totalWidth / 2 + 0.3, 0, totalWidth / 2 - 0.3].map((x, i) => (
          <StoneBlock
            key={i}
            position={[x, 0.25, 0]}
            size={[0.5, 0.5, 0.4]}
            colorVariation={rng() - 0.5}
            isFoundation={true}
          />
        ))}

        {/* Etages du mur du fond */}
        {Array.from({ length: floors }, (_, floor) => {
          const y = 0.5 + floor * floorHeight
          return (
            <group key={floor}>
              {/* Piliers */}
              <WoodBeam
                position={[-totalWidth / 2, y + floorHeight / 2, 0]}
                height={floorHeight}
                colorVariation={rng() - 0.5}
              />
              <WoodBeam
                position={[totalWidth / 2, y + floorHeight / 2, 0]}
                height={floorHeight}
                colorVariation={rng() - 0.5}
              />
              <WoodBeam
                position={[0, y + floorHeight / 2, 0]}
                height={floorHeight}
                colorVariation={rng() - 0.5}
              />

              {/* Poutres horizontales */}
              <WoodPlank
                position={[-totalWidth / 4, y, 0]}
                length={totalWidth / 2}
                colorVariation={rng() - 0.5}
              />
              <WoodPlank
                position={[totalWidth / 4, y, 0]}
                length={totalWidth / 2}
                colorVariation={rng() - 0.5}
              />

              {/* Fenetres */}
              {floor > 0 && (
                <>
                  <GlassBlock
                    position={[-totalWidth / 4, y + floorHeight * 0.4, 0]}
                    size={0.35}
                    colorVariation={rng() - 0.5}
                  />
                  <GlassBlock
                    position={[totalWidth / 4, y + floorHeight * 0.4, 0]}
                    size={0.35}
                    colorVariation={rng() - 0.5}
                  />
                </>
              )}
            </group>
          )
        })}

        {/* Toit du mur du fond */}
        <WoodPlank
          position={[0, 0.5 + floors * floorHeight, 0]}
          length={totalWidth + 0.3}
          colorVariation={rng() - 0.5}
        />
      </group>

      {/* AILE GAUCHE */}
      <group position={[-totalWidth / 2 + wingWidth / 2, 0, 0]}>
        {/* Fondation FIXE */}
        <StoneBlock
          position={[0, 0.35, wingDepth / 2 - 0.2]}
          size={[0.5, 0.7, 0.5]}
          colorVariation={rng() - 0.5}
          isFoundation={true}
        />

        {/* Etages */}
        {Array.from({ length: floors }, (_, floor) => {
          const y = 0.5 + floor * floorHeight
          return (
            <group key={floor}>
              {/* Piliers exterieurs */}
              <WoodBeam
                position={[-wingWidth / 2 + 0.1, y + floorHeight / 2, -wingDepth / 2 + 0.1]}
                height={floorHeight}
                colorVariation={rng() - 0.5}
              />
              <WoodBeam
                position={[-wingWidth / 2 + 0.1, y + floorHeight / 2, wingDepth / 2 - 0.1]}
                height={floorHeight}
                colorVariation={rng() - 0.5}
              />

              {/* Poutres */}
              <WoodPlank
                position={[-wingWidth / 2 + 0.1, y, 0]}
                rotation={[0, Math.PI / 2, 0]}
                length={wingDepth}
                colorVariation={rng() - 0.5}
              />

              {/* Blocs de remplissage */}
              <DestructibleBlock
                position={[-wingWidth / 2 + 0.1, y + floorHeight * 0.4, 0]}
                size={[0.2, 0.5, wingDepth * 0.6]}
                material="wood"
                colorVariation={rng() - 0.5}
              />
            </group>
          )
        })}

        {/* Toit de l'aile */}
        <WoodPlank
          position={[-wingWidth / 2 + 0.1, 0.5 + floors * floorHeight, 0]}
          rotation={[0, Math.PI / 2, 0]}
          length={wingDepth + 0.2}
          colorVariation={rng() - 0.5}
        />

        {/* Chapeau */}
        <StoneBlock
          position={[-wingWidth / 2 + 0.1, 0.65 + floors * floorHeight, wingDepth / 2 - 0.2]}
          size={[0.35, 0.3, 0.35]}
          colorVariation={rng() - 0.5}
        />
      </group>

      {/* AILE DROITE */}
      <group position={[totalWidth / 2 - wingWidth / 2, 0, 0]}>
        {/* Fondation FIXE */}
        <StoneBlock
          position={[0, 0.35, wingDepth / 2 - 0.2]}
          size={[0.5, 0.7, 0.5]}
          colorVariation={rng() - 0.5}
          isFoundation={true}
        />

        {/* Etages */}
        {Array.from({ length: floors }, (_, floor) => {
          const y = 0.5 + floor * floorHeight
          return (
            <group key={floor}>
              {/* Piliers exterieurs */}
              <WoodBeam
                position={[wingWidth / 2 - 0.1, y + floorHeight / 2, -wingDepth / 2 + 0.1]}
                height={floorHeight}
                colorVariation={rng() - 0.5}
              />
              <WoodBeam
                position={[wingWidth / 2 - 0.1, y + floorHeight / 2, wingDepth / 2 - 0.1]}
                height={floorHeight}
                colorVariation={rng() - 0.5}
              />

              {/* Poutres */}
              <WoodPlank
                position={[wingWidth / 2 - 0.1, y, 0]}
                rotation={[0, Math.PI / 2, 0]}
                length={wingDepth}
                colorVariation={rng() - 0.5}
              />

              {/* Blocs de remplissage */}
              <DestructibleBlock
                position={[wingWidth / 2 - 0.1, y + floorHeight * 0.4, 0]}
                size={[0.2, 0.5, wingDepth * 0.6]}
                material="wood"
                colorVariation={rng() - 0.5}
              />
            </group>
          )
        })}

        {/* Toit de l'aile */}
        <WoodPlank
          position={[wingWidth / 2 - 0.1, 0.5 + floors * floorHeight, 0]}
          rotation={[0, Math.PI / 2, 0]}
          length={wingDepth + 0.2}
          colorVariation={rng() - 0.5}
        />

        {/* Chapeau */}
        <StoneBlock
          position={[wingWidth / 2 - 0.1, 0.65 + floors * floorHeight, wingDepth / 2 - 0.2]}
          size={[0.35, 0.3, 0.35]}
          colorVariation={rng() - 0.5}
        />
      </group>

      {/* COUR INTERIEURE - Elements decoratifs */}
      <GlassBlock
        position={[0, 0.3, 0]}
        size={0.4}
        colorVariation={rng() - 0.5}
      />
    </group>
  )
}
