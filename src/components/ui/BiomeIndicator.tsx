import { useGameStore, Biome } from '@stores/gameStore'

const BIOME_LABELS: Record<Biome, string> = {
  lab: 'Le Lab',
  temple: 'Le Temple',
  bank: 'La Banque',
}

const BIOME_COLORS: Record<Biome, string> = {
  lab: '#6366f1',
  temple: '#22c55e',
  bank: '#f59e0b',
}

export function BiomeIndicator() {
  const currentBiome = useGameStore((s) => s.currentBiome)
  const isTransitioning = useGameStore((s) => s.isTransitioning)

  return (
    <div
      className="biome-indicator"
      style={{
        borderColor: BIOME_COLORS[currentBiome],
        opacity: isTransitioning ? 0.5 : 1,
        transition: 'all 0.3s ease',
      }}
    >
      {BIOME_LABELS[currentBiome]}
    </div>
  )
}
