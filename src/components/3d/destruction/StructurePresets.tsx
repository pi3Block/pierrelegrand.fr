/**
 * StructurePresets - Configurations pre-construites de structures destructibles
 * Tours, maisons, ponts, pyramides style Angry Birds
 */

import {
  DestructibleBlock,
  WoodPlank,
  WoodBeam,
  GlassBlock,
  StoneBlock,
  StonePillar,
} from './DestructibleStructure'

interface StructureProps {
  position: [number, number, number]
  rotation?: number
  scale?: number
}

/**
 * Generateur pseudo-aleatoire avec seed
 */
function createSeededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = Math.sin(s * 9999) * 10000
    return s - Math.floor(s)
  }
}

/**
 * Tour simple - Piliers + planches horizontales
 */
export function TowerStructure({ position, rotation = 0, scale = 1 }: StructureProps) {
  const rng = createSeededRandom(position[0] * 100 + position[2])

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Base - 4 piliers pierre */}
      <StonePillar position={[-0.8, 0.75, -0.3]} height={1.5} colorVariation={rng() - 0.5} />
      <StonePillar position={[0.8, 0.75, -0.3]} height={1.5} colorVariation={rng() - 0.5} />
      <StonePillar position={[-0.8, 0.75, 0.3]} height={1.5} colorVariation={rng() - 0.5} />
      <StonePillar position={[0.8, 0.75, 0.3]} height={1.5} colorVariation={rng() - 0.5} />

      {/* Plancher 1 */}
      <WoodPlank position={[0, 1.6, -0.3]} length={2} colorVariation={rng() - 0.5} />
      <WoodPlank position={[0, 1.6, 0.3]} length={2} colorVariation={rng() - 0.5} />
      <WoodPlank position={[0, 1.75, 0]} rotation={[0, Math.PI / 2, 0]} length={0.8} colorVariation={rng() - 0.5} />

      {/* Etage 2 - poutres bois */}
      <WoodBeam position={[-0.7, 2.6, 0]} height={1.5} colorVariation={rng() - 0.5} />
      <WoodBeam position={[0.7, 2.6, 0]} height={1.5} colorVariation={rng() - 0.5} />

      {/* Fenetre verre */}
      <GlassBlock position={[0, 2.8, 0]} size={0.6} colorVariation={rng() - 0.5} />

      {/* Toit */}
      <WoodPlank position={[0, 3.5, 0]} length={1.8} colorVariation={rng() - 0.5} />
      <WoodPlank position={[0, 3.65, 0]} rotation={[0, Math.PI / 2, 0]} length={0.6} colorVariation={rng() - 0.5} />

      {/* Bloc decoratif au sommet */}
      <StoneBlock position={[0, 3.95, 0]} size={[0.4, 0.3, 0.3]} colorVariation={rng() - 0.5} />
    </group>
  )
}

/**
 * Maison simple - Structure rectangulaire avec toit
 */
export function HouseStructure({ position, rotation = 0, scale = 1 }: StructureProps) {
  const rng = createSeededRandom(position[0] * 100 + position[2] + 50)

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Fondation pierre */}
      <StoneBlock position={[-1, 0.3, 0]} size={[0.5, 0.6, 0.8]} colorVariation={rng() - 0.5} />
      <StoneBlock position={[1, 0.3, 0]} size={[0.5, 0.6, 0.8]} colorVariation={rng() - 0.5} />

      {/* Murs - poutres verticales */}
      <WoodBeam position={[-1, 1.4, -0.3]} height={1.6} colorVariation={rng() - 0.5} />
      <WoodBeam position={[-1, 1.4, 0.3]} height={1.6} colorVariation={rng() - 0.5} />
      <WoodBeam position={[1, 1.4, -0.3]} height={1.6} colorVariation={rng() - 0.5} />
      <WoodBeam position={[1, 1.4, 0.3]} height={1.6} colorVariation={rng() - 0.5} />

      {/* Poutre centrale (entree) */}
      <WoodBeam position={[0, 1.4, 0.3]} height={1.6} colorVariation={rng() - 0.5} />

      {/* Fenetres */}
      <GlassBlock position={[-1, 1.5, 0]} size={0.5} colorVariation={rng() - 0.5} />
      <GlassBlock position={[1, 1.5, 0]} size={0.5} colorVariation={rng() - 0.5} />

      {/* Plancher superieur */}
      <WoodPlank position={[-0.5, 2.3, 0]} length={1.2} colorVariation={rng() - 0.5} />
      <WoodPlank position={[0.5, 2.3, 0]} length={1.2} colorVariation={rng() - 0.5} />

      {/* Toit en pente (simplify) */}
      <WoodPlank position={[0, 2.7, -0.3]} length={2.4} colorVariation={rng() - 0.5} />
      <WoodPlank position={[0, 2.7, 0.3]} length={2.4} colorVariation={rng() - 0.5} />
      <WoodPlank position={[0, 2.95, 0]} length={2.2} colorVariation={rng() - 0.5} />
    </group>
  )
}

/**
 * Pont - Deux piliers + planches
 */
export function BridgeStructure({ position, rotation = 0, scale = 1 }: StructureProps) {
  const rng = createSeededRandom(position[0] * 100 + position[2] + 100)

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Pilier gauche */}
      <StonePillar position={[-2, 0.75, 0]} height={1.5} colorVariation={rng() - 0.5} />
      <StoneBlock position={[-2, 1.65, 0]} size={[0.6, 0.3, 0.5]} colorVariation={rng() - 0.5} />

      {/* Pilier droit */}
      <StonePillar position={[2, 0.75, 0]} height={1.5} colorVariation={rng() - 0.5} />
      <StoneBlock position={[2, 1.65, 0]} size={[0.6, 0.3, 0.5]} colorVariation={rng() - 0.5} />

      {/* Planches du pont */}
      <WoodPlank position={[-1, 1.9, 0]} length={1.8} colorVariation={rng() - 0.5} />
      <WoodPlank position={[0, 1.9, 0]} length={1.8} colorVariation={rng() - 0.5} />
      <WoodPlank position={[1, 1.9, 0]} length={1.8} colorVariation={rng() - 0.5} />

      {/* Rambardes */}
      <WoodBeam position={[-1, 2.5, -0.2]} height={1} colorVariation={rng() - 0.5} />
      <WoodBeam position={[1, 2.5, -0.2]} height={1} colorVariation={rng() - 0.5} />
      <WoodPlank position={[0, 3.1, -0.2]} length={2.5} colorVariation={rng() - 0.5} />
    </group>
  )
}

/**
 * Pyramide - Empilement de blocs
 */
export function PyramidStructure({ position, rotation = 0, scale = 1 }: StructureProps) {
  const rng = createSeededRandom(position[0] * 100 + position[2] + 150)

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Base - 3 blocs pierre */}
      <StoneBlock position={[-0.7, 0.3, 0]} size={[0.6, 0.6, 0.5]} colorVariation={rng() - 0.5} />
      <StoneBlock position={[0, 0.3, 0]} size={[0.6, 0.6, 0.5]} colorVariation={rng() - 0.5} />
      <StoneBlock position={[0.7, 0.3, 0]} size={[0.6, 0.6, 0.5]} colorVariation={rng() - 0.5} />

      {/* Niveau 2 - 2 blocs bois */}
      <DestructibleBlock position={[-0.35, 0.9, 0]} size={[0.6, 0.5, 0.4]} material="wood" colorVariation={rng() - 0.5} />
      <DestructibleBlock position={[0.35, 0.9, 0]} size={[0.6, 0.5, 0.4]} material="wood" colorVariation={rng() - 0.5} />

      {/* Niveau 3 - 1 bloc verre */}
      <GlassBlock position={[0, 1.4, 0]} size={0.5} colorVariation={rng() - 0.5} />

      {/* Sommet - petit bloc pierre */}
      <StoneBlock position={[0, 1.85, 0]} size={[0.3, 0.3, 0.3]} colorVariation={rng() - 0.5} />
    </group>
  )
}

/**
 * Mur simple - Empilage horizontal
 */
export function WallStructure({ position, rotation = 0, scale = 1 }: StructureProps) {
  const rng = createSeededRandom(position[0] * 100 + position[2] + 200)

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Rangee 1 */}
      <DestructibleBlock position={[-0.9, 0.25, 0]} size={[0.8, 0.5, 0.35]} material="stone" colorVariation={rng() - 0.5} />
      <DestructibleBlock position={[0, 0.25, 0]} size={[0.8, 0.5, 0.35]} material="stone" colorVariation={rng() - 0.5} />
      <DestructibleBlock position={[0.9, 0.25, 0]} size={[0.8, 0.5, 0.35]} material="stone" colorVariation={rng() - 0.5} />

      {/* Rangee 2 (decalee) */}
      <DestructibleBlock position={[-0.45, 0.75, 0]} size={[0.8, 0.5, 0.35]} material="wood" colorVariation={rng() - 0.5} />
      <DestructibleBlock position={[0.45, 0.75, 0]} size={[0.8, 0.5, 0.35]} material="wood" colorVariation={rng() - 0.5} />

      {/* Rangee 3 */}
      <DestructibleBlock position={[-0.9, 1.25, 0]} size={[0.8, 0.5, 0.35]} material="wood" colorVariation={rng() - 0.5} />
      <GlassBlock position={[0, 1.25, 0]} size={0.5} colorVariation={rng() - 0.5} />
      <DestructibleBlock position={[0.9, 1.25, 0]} size={[0.8, 0.5, 0.35]} material="wood" colorVariation={rng() - 0.5} />

      {/* Rangee 4 (decalee) */}
      <DestructibleBlock position={[-0.45, 1.75, 0]} size={[0.8, 0.5, 0.35]} material="wood" colorVariation={rng() - 0.5} />
      <DestructibleBlock position={[0.45, 1.75, 0]} size={[0.8, 0.5, 0.35]} material="wood" colorVariation={rng() - 0.5} />
    </group>
  )
}

/**
 * Structure composite - Plusieurs elements combines
 */
export function CompositeStructure({ position, rotation = 0, scale = 1 }: StructureProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <TowerStructure position={[-3, 0, 0]} scale={0.8} />
      <WallStructure position={[0, 0, 0]} />
      <TowerStructure position={[3, 0, 0]} scale={0.8} />
    </group>
  )
}
