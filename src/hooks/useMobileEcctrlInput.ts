/**
 * useMobileEcctrlInput - Hook pour connecter les contrôles mobiles à Ecctrl.
 *
 * Convertit les inputs du joystick mobile (x, y normalisés) vers le format
 * Ecctrl (distance, angle, sprint) via useJoystickControls.
 *
 * À utiliser dans un composant R3F qui a accès au contexte Ecctrl.
 */

import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useJoystickControls } from 'ecctrl'
import { useMobileInputStore, selectJoystickInput, selectIsJumpPressed, selectIsSprintPressed, selectIsMobile } from '@stores/mobileInputStore'

/**
 * Hook qui synchronise le mobileInputStore avec le joystick interne d'Ecctrl.
 *
 * Doit être appelé dans un composant enfant d'Ecctrl ou dans le même contexte.
 */
export function useMobileEcctrlInput() {
  const isMobile = useMobileInputStore(selectIsMobile)
  const joystickInput = useMobileInputStore(selectJoystickInput)
  const isJumpPressed = useMobileInputStore(selectIsJumpPressed)
  const isSprintPressed = useMobileInputStore(selectIsSprintPressed)

  // Accès au store Ecctrl joystick
  const setJoystick = useJoystickControls((s) => s.setJoystick)
  const pressButton1 = useJoystickControls((s) => s.pressButton1) // Button1 = Jump dans Ecctrl
  const releaseAllButtons = useJoystickControls((s) => s.releaseAllButtons)

  // Ref pour éviter les re-renders dans useFrame
  const inputRef = useRef({ x: 0, y: 0, jump: false, sprint: false })

  // Mettre à jour la ref quand les inputs changent
  useEffect(() => {
    inputRef.current = {
      x: joystickInput.x,
      y: joystickInput.y,
      jump: isJumpPressed,
      sprint: isSprintPressed,
    }
  }, [joystickInput.x, joystickInput.y, isJumpPressed, isSprintPressed])

  // Synchroniser avec Ecctrl à chaque frame (seulement sur mobile)
  useFrame(() => {
    if (!isMobile) return

    const { x, y, jump, sprint } = inputRef.current

    // Calculer distance et angle pour Ecctrl
    const distance = Math.sqrt(x * x + y * y)
    // Ecctrl utilise un angle où 0 = droite, PI/2 = avant
    // Notre joystick: x = droite/gauche, y = avant/arrière
    const angle = Math.atan2(y, x) - Math.PI / 2 // Ajuster pour que avant = 0

    // Normaliser la distance (max 1)
    const normalizedDistance = Math.min(distance, 1)

    // Mettre à jour le joystick Ecctrl
    setJoystick(normalizedDistance, angle, sprint)

    // Gérer le saut via button1
    if (jump) {
      pressButton1()
    }
  })

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      if (isMobile) {
        releaseAllButtons()
        setJoystick(0, 0, false)
      }
    }
  }, [isMobile, releaseAllButtons, setJoystick])

  return {
    isMobile,
    hasInput: joystickInput.x !== 0 || joystickInput.y !== 0,
  }
}

/**
 * Hook simplifié qui retourne juste si on est en mode mobile.
 * Utile pour les composants qui doivent adapter leur comportement.
 */
export function useIsMobileInput() {
  return useMobileInputStore(selectIsMobile)
}

export default useMobileEcctrlInput
