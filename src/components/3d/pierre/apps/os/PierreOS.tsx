/**
 * PierreOS - Simulation Windows OS pour le moniteur gauche.
 * Adapté du projet joan-os de jrefusta pour fonctionner en React.
 *
 * Contenu personnalisé pour Pierre Legrand (About Me, Experience, Contact, Projects).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './PierreOS.module.css'

// Types
interface WindowState {
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

interface PierreOSProps {
  /** Callback pour naviguer vers le Hub 3D */
  onNavigateToHub?: () => void
}

// Configuration des fenêtres
const WINDOW_CONFIGS: Omit<WindowState, 'isOpen' | 'isMinimized' | 'isMaximized' | 'zIndex'>[] = [
  { id: 'about', title: 'About Me', icon: '👤', position: { x: 50, y: 30 }, size: { width: 400, height: 450 } },
  { id: 'experience', title: 'Experience', icon: '💼', position: { x: 100, y: 60 }, size: { width: 450, height: 400 } },
  { id: 'contact', title: 'Contact', icon: '📧', position: { x: 150, y: 90 }, size: { width: 380, height: 350 } },
  { id: 'projects', title: 'Projects', icon: '🚀', position: { x: 200, y: 120 }, size: { width: 500, height: 400 } },
  { id: 'credits', title: 'Credits', icon: '⌨️', position: { x: 80, y: 80 }, size: { width: 450, height: 350 } },
]

// Icônes du bureau
const DESKTOP_ICONS = [
  { id: 'about', label: 'About Me', icon: '👤' },
  { id: 'experience', label: 'Experience', icon: '💼' },
  { id: 'contact', label: 'Contact', icon: '📧' },
  { id: 'projects', label: 'Projects', icon: '🚀' },
  { id: 'credits', label: 'Credits', icon: '⌨️' },
]

export function PierreOS({ onNavigateToHub }: PierreOSProps) {
  // État des fenêtres
  const [windows, setWindows] = useState<Map<string, WindowState>>(() => {
    const map = new Map<string, WindowState>()
    WINDOW_CONFIGS.forEach((config) => {
      map.set(config.id, {
        ...config,
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 100,
      })
    })
    return map
  })

  const [activeWindowId, setActiveWindowId] = useState<string | null>(null)
  const [highestZIndex, setHighestZIndex] = useState(100)
  const [startMenuOpen, setStartMenuOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Refs pour le drag
  const dragRef = useRef<{
    windowId: string
    startX: number
    startY: number
    startPosX: number
    startPosY: number
  } | null>(null)

  // Horloge
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Ouvrir une fenêtre
  const openWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const newMap = new Map(prev)
      const window = newMap.get(id)
      if (window) {
        const newZIndex = highestZIndex + 1
        setHighestZIndex(newZIndex)
        newMap.set(id, {
          ...window,
          isOpen: true,
          isMinimized: false,
          zIndex: newZIndex,
        })
      }
      return newMap
    })
    setActiveWindowId(id)
    setStartMenuOpen(false)
  }, [highestZIndex])

  // Fermer une fenêtre
  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const newMap = new Map(prev)
      const window = newMap.get(id)
      if (window) {
        newMap.set(id, {
          ...window,
          isOpen: false,
          isMinimized: false,
          isMaximized: false,
        })
      }
      return newMap
    })
    if (activeWindowId === id) setActiveWindowId(null)
  }, [activeWindowId])

  // Minimiser une fenêtre
  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const newMap = new Map(prev)
      const window = newMap.get(id)
      if (window) {
        newMap.set(id, { ...window, isMinimized: true })
      }
      return newMap
    })
    if (activeWindowId === id) setActiveWindowId(null)
  }, [activeWindowId])

  // Maximiser une fenêtre
  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const newMap = new Map(prev)
      const window = newMap.get(id)
      if (window) {
        newMap.set(id, { ...window, isMaximized: !window.isMaximized })
      }
      return newMap
    })
  }, [])

  // Focus sur une fenêtre
  const focusWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const newMap = new Map(prev)
      const window = newMap.get(id)
      if (window && window.isOpen) {
        const newZIndex = highestZIndex + 1
        setHighestZIndex(newZIndex)
        newMap.set(id, {
          ...window,
          isMinimized: false,
          zIndex: newZIndex,
        })
      }
      return newMap
    })
    setActiveWindowId(id)
  }, [highestZIndex])

  // Drag & Drop des fenêtres
  const handleDragStart = useCallback((e: React.MouseEvent, windowId: string) => {
    const window = windows.get(windowId)
    if (!window || window.isMaximized) return

    e.preventDefault()
    dragRef.current = {
      windowId,
      startX: e.clientX,
      startY: e.clientY,
      startPosX: window.position.x,
      startPosY: window.position.y,
    }
    focusWindow(windowId)
  }, [windows, focusWindow])

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return

    const { windowId, startX, startY, startPosX, startPosY } = dragRef.current
    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY

    setWindows((prev) => {
      const newMap = new Map(prev)
      const window = newMap.get(windowId)
      if (window) {
        newMap.set(windowId, {
          ...window,
          position: {
            x: Math.max(0, startPosX + deltaX),
            y: Math.max(0, startPosY + deltaY),
          },
        })
      }
      return newMap
    })
  }, [])

  const handleDragEnd = useCallback(() => {
    dragRef.current = null
  }, [])

  // Event listeners pour le drag
  useEffect(() => {
    window.addEventListener('mousemove', handleDragMove)
    window.addEventListener('mouseup', handleDragEnd)
    return () => {
      window.removeEventListener('mousemove', handleDragMove)
      window.removeEventListener('mouseup', handleDragEnd)
    }
  }, [handleDragMove, handleDragEnd])

  // Fermer le menu démarrer si on clique ailleurs
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(`.${styles.startMenu}`) && !target.closest(`.${styles.startButton}`)) {
        setStartMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // Rendu du contenu des fenêtres
  const renderWindowContent = (windowId: string) => {
    switch (windowId) {
      case 'about':
        return (
          <div className={styles.aboutMeContent}>
            <div className={styles.aboutMeHeader}>
              <div className={styles.aboutMeAvatar}>PL</div>
              <div className={styles.aboutMeInfo}>
                <h2>Pierre Legrand</h2>
                <p>Full-Stack Developer & 3D Enthusiast</p>
              </div>
            </div>
            <p className={styles.aboutMeBio}>
              Passionné par le développement web et les technologies 3D interactives.
              Je crée des expériences immersives qui combinent créativité et performance technique.
              Spécialisé en React, Three.js et les architectures modernes.
            </p>
            <div className={styles.aboutMeStats}>
              <div className={styles.aboutMeStat}>
                <div className={styles.aboutMeStatValue}>5+</div>
                <div className={styles.aboutMeStatLabel}>Years XP</div>
              </div>
              <div className={styles.aboutMeStat}>
                <div className={styles.aboutMeStatValue}>50+</div>
                <div className={styles.aboutMeStatLabel}>Projects</div>
              </div>
              <div className={styles.aboutMeStat}>
                <div className={styles.aboutMeStatValue}>∞</div>
                <div className={styles.aboutMeStatLabel}>Curiosity</div>
              </div>
            </div>
          </div>
        )

      case 'experience':
        return (
          <div className={styles.experienceContent}>
            <div className={styles.experienceItem}>
              <h3>Senior Full-Stack Developer</h3>
              <div className={styles.experienceCompany}>Tech Company</div>
              <div className={styles.experienceDate}>2022 - Present</div>
              <p className={styles.experienceDescription}>
                Lead development of 3D web applications using React Three Fiber.
                Architecture design and performance optimization for large-scale projects.
              </p>
            </div>
            <div className={styles.experienceItem}>
              <h3>Full-Stack Developer</h3>
              <div className={styles.experienceCompany}>Digital Agency</div>
              <div className={styles.experienceDate}>2020 - 2022</div>
              <p className={styles.experienceDescription}>
                Developed interactive web experiences and e-commerce platforms.
                Implemented CI/CD pipelines and automated testing.
              </p>
            </div>
            <div className={styles.experienceItem}>
              <h3>Frontend Developer</h3>
              <div className={styles.experienceCompany}>Startup</div>
              <div className={styles.experienceDate}>2019 - 2020</div>
              <p className={styles.experienceDescription}>
                Built responsive user interfaces with React and TypeScript.
                Collaborated with UX designers to improve user experience.
              </p>
            </div>
          </div>
        )

      case 'contact':
        return (
          <div className={styles.contactContent}>
            <div className={styles.contactItem} onClick={() => window.open('mailto:contact@pierrelegrand.fr')}>
              <span className={styles.contactIcon}>📧</span>
              <div className={styles.contactInfo}>
                <div className={styles.contactLabel}>Email</div>
                <div className={styles.contactValue}>contact@pierrelegrand.fr</div>
              </div>
            </div>
            <div className={styles.contactItem} onClick={() => window.open('https://github.com/pi3Block', '_blank')}>
              <span className={styles.contactIcon}>🐙</span>
              <div className={styles.contactInfo}>
                <div className={styles.contactLabel}>GitHub</div>
                <div className={styles.contactValue}>github.com/pi3Block</div>
              </div>
            </div>
            <div className={styles.contactItem} onClick={() => window.open('https://www.linkedin.com/in/legrand-pierre/', '_blank')}>
              <span className={styles.contactIcon}>💼</span>
              <div className={styles.contactInfo}>
                <div className={styles.contactLabel}>LinkedIn</div>
                <div className={styles.contactValue}>linkedin.com/in/pierrelegrand</div>
              </div>
            </div>
            <div className={styles.contactItem} onClick={() => window.open('https://twitter.com/pi3r2dev', '_blank')}>
              <span className={styles.contactIcon}>🐦</span>
              <div className={styles.contactInfo}>
                <div className={styles.contactLabel}>Twitter</div>
                <div className={styles.contactValue}>@pi3r2dev</div>
              </div>
            </div>
          </div>
        )

      case 'projects':
        return (
          <div className={styles.projectsContent}>
            <div className={styles.projectCard}>
              <div className={styles.projectImage}>🎮</div>
              <div className={styles.projectInfo}>
                <h4>3D Portfolio</h4>
                <p>Interactive 3D portfolio with biomes and physics</p>
                <div className={styles.projectTags}>
                  <span className={styles.projectTag}>React</span>
                  <span className={styles.projectTag}>R3F</span>
                  <span className={styles.projectTag}>Rapier</span>
                </div>
              </div>
            </div>
            <div className={styles.projectCard}>
              <div className={styles.projectImage}>🏗️</div>
              <div className={styles.projectInfo}>
                <h4>Procedural World</h4>
                <p>Terrain generation with biomes and decorations</p>
                <div className={styles.projectTags}>
                  <span className={styles.projectTag}>Three.js</span>
                  <span className={styles.projectTag}>GLSL</span>
                </div>
              </div>
            </div>
            <div className={styles.projectCard}>
              <div className={styles.projectImage}>🎯</div>
              <div className={styles.projectInfo}>
                <h4>Angry Birds Clone</h4>
                <p>Physics-based destruction game in 3D</p>
                <div className={styles.projectTags}>
                  <span className={styles.projectTag}>Rapier</span>
                  <span className={styles.projectTag}>GSAP</span>
                </div>
              </div>
            </div>
            <div className={styles.projectCard}>
              <div className={styles.projectImage}>🕹️</div>
              <div className={styles.projectInfo}>
                <h4>Arcade Games</h4>
                <p>Snake, Tetris, Breakout in TypeScript</p>
                <div className={styles.projectTags}>
                  <span className={styles.projectTag}>Canvas</span>
                  <span className={styles.projectTag}>TS</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'credits':
        return (
          <div className={styles.creditsContent}>
            <p className={styles.creditsLine}>
              <span className={styles.creditsCommand}>$ cat credits.txt</span>
            </p>
            <p className={styles.creditsLine}>
              <span className={styles.creditsOutput}></span>
            </p>
            <p className={styles.creditsLine}>
              <span className={styles.creditsOutput}>═══════════════════════════════════</span>
            </p>
            <p className={styles.creditsLine}>
              <span className={styles.creditsOutput}>       PIERRE LEGRAND PORTFOLIO</span>
            </p>
            <p className={styles.creditsLine}>
              <span className={styles.creditsOutput}>═══════════════════════════════════</span>
            </p>
            <p className={styles.creditsLine}>
              <span className={styles.creditsOutput}></span>
            </p>
            <p className={styles.creditsLine}>
              <span className={styles.creditsComment}># Inspirations</span>
            </p>
            <p className={styles.creditsLine}>
              <span className={styles.creditsOutput}>Joan OS - jrefusta</span>
            </p>
            <p className={styles.creditsLine}>
              <span className={styles.creditsOutput}>Bruno Simon - threejs-journey.com</span>
            </p>
            <p className={styles.creditsLine}>
              <span className={styles.creditsOutput}>Wawa Sensei - wawasensei.dev</span>
            </p>
            <p className={styles.creditsLine}>
              <span className={styles.creditsOutput}></span>
            </p>
            <p className={styles.creditsLine}>
              <span className={styles.creditsComment}># Technologies</span>
            </p>
            <p className={styles.creditsLine}>
              <span className={styles.creditsOutput}>React 19 + React Three Fiber</span>
            </p>
            <p className={styles.creditsLine}>
              <span className={styles.creditsOutput}>@react-three/drei + rapier</span>
            </p>
            <p className={styles.creditsLine}>
              <span className={styles.creditsOutput}>Zustand + TypeScript + Vite</span>
            </p>
            <p className={styles.creditsLine}>
              <span className={styles.creditsOutput}></span>
            </p>
            <p className={styles.creditsLine}>
              <span className={styles.creditsComment}># Made with ❤️ in 2024</span>
            </p>
          </div>
        )

      default:
        return <div>Content not found</div>
    }
  }

  // Fenêtres ouvertes pour la taskbar
  const openWindows = Array.from(windows.values()).filter(w => w.isOpen)

  return (
    <div className={styles.container}>
      {/* Bureau avec icônes */}
      <div className={styles.desktop}>
        {DESKTOP_ICONS.map((icon) => (
          <div
            key={icon.id}
            className={styles.desktopIcon}
            onDoubleClick={() => openWindow(icon.id)}
          >
            <div className={styles.desktopIconImage}>{icon.icon}</div>
            <div className={styles.desktopIconLabel}>{icon.label}</div>
          </div>
        ))}
      </div>

      {/* Fenêtres */}
      {Array.from(windows.values()).map((win) => {
        if (!win.isOpen) return null

        const windowClasses = [
          styles.window,
          win.isMaximized && styles.windowMaximized,
          win.isMinimized && styles.windowMinimized,
        ].filter(Boolean).join(' ')

        return (
          <div
            key={win.id}
            className={windowClasses}
            style={{
              left: win.isMaximized ? undefined : win.position.x,
              top: win.isMaximized ? undefined : win.position.y,
              width: win.isMaximized ? undefined : win.size.width,
              height: win.isMaximized ? undefined : win.size.height,
              zIndex: win.zIndex,
            }}
            onMouseDown={() => focusWindow(win.id)}
          >
            <div
              className={styles.titleBar}
              onMouseDown={(e) => handleDragStart(e, win.id)}
              onDoubleClick={() => maximizeWindow(win.id)}
            >
              <div className={styles.titleBarTitle}>
                <span className={styles.titleBarIcon}>{win.icon}</span>
                {win.title}
              </div>
              <div className={styles.titleBarControls}>
                <button
                  className={styles.titleBarButton}
                  onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id) }}
                >
                  ─
                </button>
                <button
                  className={styles.titleBarButton}
                  onClick={(e) => { e.stopPropagation(); maximizeWindow(win.id) }}
                >
                  {win.isMaximized ? '❐' : '□'}
                </button>
                <button
                  className={`${styles.titleBarButton} ${styles.titleBarButtonClose}`}
                  onClick={(e) => { e.stopPropagation(); closeWindow(win.id) }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className={styles.windowContent}>
              {renderWindowContent(win.id)}
            </div>
          </div>
        )
      })}

      {/* Menu Démarrer */}
      <div className={`${styles.startMenu} ${startMenuOpen ? styles.startMenuOpen : ''}`}>
        <input
          type="text"
          className={styles.startMenuSearch}
          placeholder="Type to search..."
          readOnly
        />
        <div className={styles.startMenuApps}>
          {DESKTOP_ICONS.map((icon) => (
            <div
              key={icon.id}
              className={styles.startMenuApp}
              onClick={() => openWindow(icon.id)}
            >
              <span className={styles.startMenuAppIcon}>{icon.icon}</span>
              <span className={styles.startMenuAppLabel}>{icon.label}</span>
            </div>
          ))}
          {onNavigateToHub && (
            <div className={styles.startMenuApp} onClick={onNavigateToHub}>
              <span className={styles.startMenuAppIcon}>🌍</span>
              <span className={styles.startMenuAppLabel}>3D Worlds</span>
            </div>
          )}
        </div>
      </div>

      {/* Barre des tâches */}
      <div className={styles.taskbar}>
        <button
          className={styles.startButton}
          onClick={(e) => { e.stopPropagation(); setStartMenuOpen(!startMenuOpen) }}
        >
          ⊞
        </button>

        <div className={styles.taskbarApps}>
          {openWindows.map((win) => (
            <button
              key={win.id}
              className={`${styles.taskbarApp} ${activeWindowId === win.id ? styles.taskbarAppActive : ''}`}
              onClick={() => {
                if (win.isMinimized || activeWindowId !== win.id) {
                  focusWindow(win.id)
                } else {
                  minimizeWindow(win.id)
                }
              }}
            >
              <span className={styles.taskbarAppIcon}>{win.icon}</span>
              {win.title}
            </button>
          ))}
        </div>

        <div className={styles.taskbarClock}>
          <div className={styles.taskbarTime}>
            {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className={styles.taskbarDate}>
            {currentTime.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PierreOS
