/**
 * WindowManager - Gestion des fenêtres pour PierreOS.
 * Adapté du projet joan-os de jrefusta.
 */

export interface WindowState {
  id: string
  title: string
  icon: string
  isOpen: boolean
  isMinimized: boolean
  isMaximized: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
}

export interface WindowManagerState {
  windows: Map<string, WindowState>
  activeWindowId: string | null
  highestZIndex: number
}

export class WindowManager {
  private state: WindowManagerState
  private onChange: (state: WindowManagerState) => void

  constructor(onChange: (state: WindowManagerState) => void) {
    this.onChange = onChange
    this.state = {
      windows: new Map(),
      activeWindowId: null,
      highestZIndex: 100,
    }
  }

  registerWindow(
    id: string,
    title: string,
    icon: string,
    defaultPosition: { x: number; y: number },
    defaultSize: { width: number; height: number }
  ): void {
    this.state.windows.set(id, {
      id,
      title,
      icon,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      position: defaultPosition,
      size: defaultSize,
      zIndex: 100,
    })
    this.notifyChange()
  }

  openWindow(id: string): void {
    const window = this.state.windows.get(id)
    if (!window) return

    this.state.highestZIndex++
    window.isOpen = true
    window.isMinimized = false
    window.zIndex = this.state.highestZIndex
    this.state.activeWindowId = id
    this.notifyChange()
  }

  closeWindow(id: string): void {
    const window = this.state.windows.get(id)
    if (!window) return

    window.isOpen = false
    window.isMinimized = false
    window.isMaximized = false

    if (this.state.activeWindowId === id) {
      this.state.activeWindowId = null
    }
    this.notifyChange()
  }

  minimizeWindow(id: string): void {
    const window = this.state.windows.get(id)
    if (!window) return

    window.isMinimized = true
    if (this.state.activeWindowId === id) {
      this.state.activeWindowId = null
    }
    this.notifyChange()
  }

  maximizeWindow(id: string): void {
    const window = this.state.windows.get(id)
    if (!window) return

    window.isMaximized = !window.isMaximized
    this.notifyChange()
  }

  focusWindow(id: string): void {
    const window = this.state.windows.get(id)
    if (!window || !window.isOpen) return

    this.state.highestZIndex++
    window.zIndex = this.state.highestZIndex
    window.isMinimized = false
    this.state.activeWindowId = id
    this.notifyChange()
  }

  updatePosition(id: string, x: number, y: number): void {
    const window = this.state.windows.get(id)
    if (!window) return

    window.position = { x, y }
    this.notifyChange()
  }

  getWindow(id: string): WindowState | undefined {
    return this.state.windows.get(id)
  }

  getOpenWindows(): WindowState[] {
    return Array.from(this.state.windows.values()).filter(w => w.isOpen)
  }

  getState(): WindowManagerState {
    return this.state
  }

  private notifyChange(): void {
    this.onChange({ ...this.state })
  }
}
