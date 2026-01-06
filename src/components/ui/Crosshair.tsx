/**
 * Composant Crosshair - Réticule de visée TPS avec indicateur de charge.
 * Affiche un cercle avec point central au centre de l'écran
 * pour indiquer la direction de tir.
 * 
 * Intègre un arc de charge qui se remplit progressivement
 * lorsque le joueur maintient le clic pour charger le tir.
 */

import { useGameStore } from '@stores/gameStore'
import { useMemo } from 'react'

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
  // État de charge depuis le store
  const chargeState = useGameStore((state) => state.chargeState)
  const { chargeLevel, isCharging } = chargeState

  const strokeWidth = 2
  const dotRadius = 2
  const radius = (size - strokeWidth) / 2

  // Configuration de l'arc de charge (cercle externe plus grand)
  const chargeRadius = size / 2 + 8
  const chargeCircumference = 2 * Math.PI * chargeRadius
  const chargeOffset = chargeCircumference * (1 - chargeLevel)

  // Couleur de l'arc de charge (orange -> rouge selon la charge)
  const chargeColor = useMemo(() => {
    if (chargeLevel < 0.5) {
      // Orange au début
      return `hsl(30, 100%, ${50 + chargeLevel * 20}%)`
    } else {
      // Transition vers rouge
      const hue = 30 - (chargeLevel - 0.5) * 60 // 30 -> 0
      return `hsl(${hue}, 100%, ${60 + chargeLevel * 20}%)`
    }
  }, [chargeLevel])

  // Taille dynamique pour l'effet de pulsation à charge max
  const pulseScale = chargeLevel >= 1 ? 1.1 : 1

  // Afficher l'indicateur de charge uniquement si en cours de charge
  const showChargeIndicator = isCharging || chargeLevel > 0

  return (
    <div
      className="crosshair"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${pulseScale})`,
        pointerEvents: 'none',
        zIndex: 100,
        transition: chargeLevel >= 1 ? 'transform 0.1s ease-in-out' : 'none',
      }}
    >
      <svg
        width={size + 40}
        height={size + 40}
        viewBox={`0 0 ${size + 40} ${size + 40}`}
        style={{ display: 'block' }}
      >
        {/* Centre du SVG décalé */}
        <g transform={`translate(${(size + 40) / 2}, ${(size + 40) / 2})`}>
          {/* Cercle de fond pour la charge (toujours visible si en charge) */}
          {showChargeIndicator && (
            <circle
              cx={0}
              cy={0}
              r={chargeRadius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth={4}
            />
          )}

          {/* Arc de charge progressif */}
          {showChargeIndicator && (
            <circle
              cx={0}
              cy={0}
              r={chargeRadius}
              fill="none"
              stroke={chargeColor}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={chargeCircumference}
              strokeDashoffset={chargeOffset}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
                transition: 'stroke-dashoffset 0.05s linear',
                filter: chargeLevel >= 1 ? 'drop-shadow(0 0 8px currentColor)' : 'none',
              }}
            />
          )}

          {/* Cercle extérieur du réticule */}
          <circle
            cx={0}
            cy={0}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={opacity}
          />

          {/* Point central */}
          <circle
            cx={0}
            cy={0}
            r={dotRadius}
            fill={isCharging ? chargeColor : color}
            opacity={opacity}
            style={{
              transition: 'fill 0.1s',
            }}
          />

          {/* Indicateur de charge complète (étoile/flash) */}
          {chargeLevel >= 1 && (
            <>
              {/* Lignes qui rayonnent */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <line
                  key={angle}
                  x1={chargeRadius + 2}
                  y1={0}
                  x2={chargeRadius + 6}
                  y2={0}
                  stroke={chargeColor}
                  strokeWidth={2}
                  strokeLinecap="round"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: 'center',
                    opacity: 0.8,
                  }}
                />
              ))}
            </>
          )}
        </g>
      </svg>

      {/* Indicateur textuel de pourcentage (optionnel, apparaît à partir de 20%) */}
      {isCharging && chargeLevel >= 0.2 && (
        <div
          style={{
            position: 'absolute',
            bottom: -25,
            left: '50%',
            transform: 'translateX(-50%)',
            color: chargeColor,
            fontSize: '12px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            textShadow: '0 0 4px rgba(0,0,0,0.8)',
          }}
        >
          {Math.round(chargeLevel * 100)}%
        </div>
      )}
    </div>
  )
}
