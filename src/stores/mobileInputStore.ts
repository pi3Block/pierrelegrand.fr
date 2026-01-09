/**
 * mobileInputStore - Store Zustand pour les inputs tactiles mobiles.
 *
 * Gère l'état du joystick virtuel et des inputs tactiles pour les
 * niveaux avec personnage (Levels 0-4).
 */

import { create } from 'zustand'

export interface JoystickInput {
  /** Direction X normalisée (-1 à 1) */
  x: number
  /** Direction Y normalisée (-1 à 1, positif = avant) */
  y: number
}

export interface MobileInputState {
  /** Input du joystick virtuel */
  joystickInput: JoystickInput
  /** Le joystick est-il actif (touché) */
  isJoystickActive: boolean
  /** Est-ce un appareil mobile/tactile */
  isMobile: boolean
  /** Bouton de saut pressé */
  isJumpPressed: boolean
  /** Bouton de sprint pressé */
  isSprintPressed: boolean
  /** Bouton de tir pressé */
  isShootPressed: boolean
}

export interface MobileInputActions {
  /** Met à jour l'input du joystick */
  setJoystickInput: (input: JoystickInput) => void
  /** Active/désactive le joystick */
  setJoystickActive: (active: boolean) => void
  /** Définit le mode mobile */
  setMobile: (isMobile: boolean) => void
  /** Active/désactive le saut */
  setJumpPressed: (pressed: boolean) => void
  /** Active/désactive le sprint */
  setSprintPressed: (pressed: boolean) => void
  /** Active/désactive le tir */
  setShootPressed: (pressed: boolean) => void
  /** Reset tous les inputs */
  resetInputs: () => void
}

const initialState: MobileInputState = {
  joystickInput: { x: 0, y: 0 },
  isJoystickActive: false,
  isMobile: false,
  isJumpPressed: false,
  isSprintPressed: false,
  isShootPressed: false,
}

export const useMobileInputStore = create<MobileInputState & MobileInputActions>((set) => ({
  ...initialState,

  setJoystickInput: (input) => set({ joystickInput: input }),

  setJoystickActive: (active) => set({ isJoystickActive: active }),

  setMobile: (isMobile) => set({ isMobile }),

  setJumpPressed: (pressed) => set({ isJumpPressed: pressed }),

  setSprintPressed: (pressed) => set({ isSprintPressed: pressed }),

  setShootPressed: (pressed) => set({ isShootPressed: pressed }),

  resetInputs: () => set({
    joystickInput: { x: 0, y: 0 },
    isJoystickActive: false,
    isJumpPressed: false,
    isSprintPressed: false,
    isShootPressed: false,
  }),
}))

/**
 * Sélecteurs optimisés pour éviter les re-renders inutiles
 */
export const selectJoystickInput = (state: MobileInputState) => state.joystickInput
export const selectIsJoystickActive = (state: MobileInputState) => state.isJoystickActive
export const selectIsMobile = (state: MobileInputState) => state.isMobile
export const selectIsJumpPressed = (state: MobileInputState) => state.isJumpPressed
export const selectIsSprintPressed = (state: MobileInputState) => state.isSprintPressed
export const selectIsShootPressed = (state: MobileInputState) => state.isShootPressed
