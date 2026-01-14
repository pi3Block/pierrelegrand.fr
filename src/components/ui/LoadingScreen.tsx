import { useProgress } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'

export function LoadingScreen() {
  const { progress, active } = useProgress()
  const [smoothProgress, setSmoothProgress] = useState(0)
  const [isRevealing, setIsRevealing] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const animationRef = useRef<number>(0)
  const targetProgressRef = useRef(0)

  // Smooth progress animation to avoid jerky updates
  useEffect(() => {
    targetProgressRef.current = progress

    const animate = () => {
      setSmoothProgress((current) => {
        const target = targetProgressRef.current
        const diff = target - current
        // Ease towards target, faster when far, slower when close
        const step = Math.max(0.5, Math.abs(diff) * 0.1)
        if (Math.abs(diff) < 0.5) return target
        return current + Math.sign(diff) * step
      })
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [progress])

  // Trigger reveal animation when loading complete
  useEffect(() => {
    if (!active && progress === 100 && smoothProgress >= 99) {
      // Start reveal animation
      const revealTimeout = setTimeout(() => {
        setIsRevealing(true)
      }, 300)

      // Hide completely after animation
      const hideTimeout = setTimeout(() => {
        setIsHidden(true)
      }, 1300) // 300ms delay + 1000ms animation

      return () => {
        clearTimeout(revealTimeout)
        clearTimeout(hideTimeout)
      }
    }
  }, [active, progress, smoothProgress])

  if (isHidden) return null

  const displayProgress = Math.round(smoothProgress)

  return (
    <>
      {/* Top panel - slides up */}
      <div
        className="loading-panel loading-panel-top"
        style={{
          transform: isRevealing ? 'translateY(-100%)' : 'translateY(0)',
        }}
      >
        <div className="loading-content">
          <div className="loading-logo">
            <span className="loading-logo-text">PIERRE LEGRAND</span>
            <span className="loading-logo-subtitle">Creative Developer</span>
          </div>
        </div>
      </div>

      {/* Bottom panel - slides down */}
      <div
        className="loading-panel loading-panel-bottom"
        style={{
          transform: isRevealing ? 'translateY(100%)' : 'translateY(0)',
        }}
      >
        <div className="loading-content loading-content-bottom">
          <div className="loading-progress-container">
            <div className="loading-progress-bar">
              <div
                className="loading-progress-fill"
                style={{ width: `${smoothProgress}%` }}
              />
            </div>
            <span className="loading-progress-text">{displayProgress}%</span>
          </div>
        </div>
      </div>

      {/* Center line that expands */}
      <div
        className="loading-center-line"
        style={{
          transform: isRevealing ? 'scaleX(0)' : 'scaleX(1)',
          opacity: isRevealing ? 0 : 1,
        }}
      />
    </>
  )
}
