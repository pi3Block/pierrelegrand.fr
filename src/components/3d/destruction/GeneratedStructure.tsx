/**
 * GeneratedStructure - Rend une StructureDefinition en blocs physiques
 */

import { useMemo, memo } from 'react'
import { DestructibleBlock } from './DestructibleStructure'
import type { StructureDefinition, BlockDefinition } from './types'

interface GeneratedStructureProps {
  /** La definition de structure a rendre */
  definition: StructureDefinition
  /** Position dans le monde */
  position: [number, number, number]
  /** Rotation sur l'axe Y */
  rotation?: number
  /** Echelle uniforme */
  scale?: number
}

/**
 * Rend un bloc individuel a partir d'une BlockDefinition
 */
const StructureBlock = memo(function StructureBlock({
  block,
  parentPosition,
  parentRotation,
  parentScale,
}: {
  block: BlockDefinition
  parentPosition: [number, number, number]
  parentRotation: number
  parentScale: number
}) {
  // Appliquer les transformations parentes a la position du bloc
  const cos = Math.cos(parentRotation)
  const sin = Math.sin(parentRotation)

  const rotatedX = block.position[0] * cos - block.position[2] * sin
  const rotatedZ = block.position[0] * sin + block.position[2] * cos

  const worldPosition: [number, number, number] = [
    parentPosition[0] + rotatedX * parentScale,
    parentPosition[1] + block.position[1] * parentScale,
    parentPosition[2] + rotatedZ * parentScale,
  ]

  const scaledSize: [number, number, number] = [
    block.size[0] * parentScale,
    block.size[1] * parentScale,
    block.size[2] * parentScale,
  ]

  const blockRotation: [number, number, number] = [
    block.rotation?.[0] ?? 0,
    (block.rotation?.[1] ?? 0) + parentRotation,
    block.rotation?.[2] ?? 0,
  ]

  return (
    <DestructibleBlock
      position={worldPosition}
      size={scaledSize}
      material={block.material}
      rotation={blockRotation}
      colorVariation={block.colorVariation ?? 0}
      isFoundation={block.isFoundation ?? false}
    />
  )
})

/**
 * Composant principal qui rend une structure generee complete
 */
export const GeneratedStructure = memo(function GeneratedStructure({
  definition,
  position,
  rotation = 0,
  scale = 1,
}: GeneratedStructureProps) {
  // Memoiser le rendu des blocs pour eviter les recalculs inutiles
  const blocks = useMemo(
    () =>
      definition.blocks.map((block, index) => (
        <StructureBlock
          key={`${definition.id}-${index}`}
          block={block}
          parentPosition={position}
          parentRotation={rotation}
          parentScale={scale}
        />
      )),
    [definition, position, rotation, scale]
  )

  return <>{blocks}</>
})
