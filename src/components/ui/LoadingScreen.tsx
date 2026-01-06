import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'

export function LoadingScreen() {
  const { progress, active } = useProgress()
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (!active && progress === 100) {
      // Delay hiding for smooth transition
      const timeout = setTimeout(() => setShow(false), 500)
      return () => clearTimeout(timeout)
    }
  }, [active, progress])

  if (!show) return null

  return (
    <div
      className="loading-screen"
      style={{
        opacity: active ? 1 : 0,
        transition: 'opacity 0.5s ease',
        pointerEvents: active ? 'auto' : 'none',
      }}
    >
      <h1 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '4px' }}>
        PIERRE LEGRAND
      </h1>
      <div className="loading-bar">
        <div
          className="loading-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p style={{ marginTop: '12px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
        {Math.round(progress)}%
      </p>
    </div>
  )
}
