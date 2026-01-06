/**
 * Composant Crosshair - Réticule de visée TPS
 * Affiche un cercle avec point central au centre de l'écran
 * pour indiquer la direction de tir.
 */

interface CrosshairProps {
  /** Taille du cercle extérieur en pixels */
  size?: number
  /** Couleur du réticule */
  color?: string
  /** Opacité du réticule (0-1) */
  opacity?: number
}

export function Crosshair({
  size = 24,
  color = 'white',
  opacity = 0.7,
}: CrosshairProps) {
  const strokeWidth = 2
  const dotRadius = 2
  const radius = (size - strokeWidth) / 2

  return (
    <div
      className="crosshair"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'block' }}
      >
        {/* Cercle extérieur */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          opacity={opacity}
        />
        {/* Point central */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={dotRadius}
          fill={color}
          opacity={opacity}
        />
      </svg>
    </div>
  )
}

