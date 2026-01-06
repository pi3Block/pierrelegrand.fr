import { useFrame, useThree } from '@react-three/fiber'
import { useState } from 'react'
import { Html } from '@react-three/drei'

interface DebugStats {
  fps: number
  drawCalls: number
  triangles: number
  memory: number
}

// Component to track stats inside Canvas
export function DebugStatsTracker({ onUpdate }: { onUpdate: (stats: DebugStats) => void }) {
  const { gl } = useThree()

  useFrame((state) => {
    const info = gl.info
    onUpdate({
      fps: Math.round(1 / state.clock.getDelta()) || 60,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      memory: info.memory.geometries + info.memory.textures,
    })
  })

  return null
}

// UI overlay component (outside Canvas)
export function DebugOverlay() {
  return (
    <div className="debug-overlay">
      <div>DEBUG MODE ACTIVE</div>
      <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.7 }}>
        Stats affichés dans la console
      </div>
    </div>
  )
}

// Combined component for inside Canvas
export function DebugPanel() {
  const [stats, setStats] = useState<DebugStats>({
    fps: 60,
    drawCalls: 0,
    triangles: 0,
    memory: 0,
  })

  return (
    <>
      <DebugStatsTracker onUpdate={setStats} />
      <Html
        position={[-8, 4, 0]}
        style={{
          background: 'rgba(0,0,0,0.8)',
          padding: '12px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#22d3ee',
          whiteSpace: 'nowrap',
        }}
      >
        <div>FPS: {stats.fps}</div>
        <div>Calls: {stats.drawCalls}</div>
        <div>Tris: {stats.triangles.toLocaleString()}</div>
        <div>Mem: {stats.memory}</div>
      </Html>
    </>
  )
}
