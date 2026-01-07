/**
 * JoanOSUikit - Simulation Windows OS avec @pmndrs/uikit.
 *
 * Version native 3D de JoanOS utilisant uikit au lieu de Html de drei.
 * Rendu directement en Three.js pour une meilleure intégration visuelle.
 */

import { useCallback, useEffect, useState } from 'react'
import { Container, Text, DefaultProperties } from '@react-three/uikit'

// Types
interface WindowState {
  id: string
  title: string
  icon: string
  isOpen: boolean
  isMinimized: boolean
  zIndex: number
}

interface JoanOSUikitProps {
  /** Callback pour naviguer vers le Hub 3D */
  onNavigateToHub?: () => void
}

// Configuration des fenêtres
const WINDOW_CONFIGS = [
  { id: 'about', title: 'About Me', icon: '👤' },
  { id: 'experience', title: 'Experience', icon: '💼' },
  { id: 'contact', title: 'Contact', icon: '📧' },
  { id: 'projects', title: 'Projects', icon: '🚀' },
  { id: 'credits', title: 'Credits', icon: '⌨️' },
]

// Icônes du bureau
const DESKTOP_ICONS = [
  { id: 'about', label: 'About Me', icon: '👤' },
  { id: 'experience', label: 'Experience', icon: '💼' },
  { id: 'contact', label: 'Contact', icon: '📧' },
  { id: 'projects', label: 'Projects', icon: '🚀' },
  { id: 'credits', label: 'Credits', icon: '⌨️' },
]

// Couleurs du thème
const COLORS = {
  background: '#1a1a2e',
  surface: '#1e1e1e',
  surfaceHover: '#2d2d2d',
  titleBar: '#2d2d2d',
  taskbar: '#000000',
  primary: '#0078d4',
  text: '#ffffff',
  textMuted: '#888888',
  border: '#333333',
  closeHover: '#e81123',
}

/**
 * Composant DesktopIcon - Icône du bureau
 */
function DesktopIcon({
  icon,
  label,
  onDoubleClick
}: {
  icon: string
  label: string
  onDoubleClick: () => void
}) {
  return (
    <Container
      flexDirection="column"
      alignItems="center"
      width={80}
      padding={8}
      borderRadius={4}
      hover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
      active={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
      cursor="pointer"
      onDblClick={onDoubleClick}
    >
      <Text fontSize={32} marginBottom={4}>{icon}</Text>
      <Text fontSize={11} color={COLORS.text} textAlign="center">{label}</Text>
    </Container>
  )
}

/**
 * Composant Window - Fenêtre flottante
 */
function Window({
  title,
  icon,
  children,
  zIndex,
  onClose,
  onMinimize,
  onFocus,
}: {
  title: string
  icon: string
  children: React.ReactNode
  zIndex: number
  onClose: () => void
  onMinimize: () => void
  onFocus: () => void
}) {
  return (
    <Container
      positionType="absolute"
      positionTop={60}
      positionLeft={40}
      width={500}
      height={400}
      flexDirection="column"
      backgroundColor={COLORS.surface}
      borderRadius={8}
      zIndexOffset={zIndex}
      onClick={onFocus}
    >
      {/* Title Bar */}
      <Container
        height={32}
        flexDirection="row"
        backgroundColor={COLORS.titleBar}
        alignItems="center"
        paddingLeft={8}
        borderTopLeftRadius={8}
        borderTopRightRadius={8}
      >
        <Text fontSize={14} marginRight={8}>{icon}</Text>
        <Text fontSize={12} color={COLORS.text} flexGrow={1}>{title}</Text>

        {/* Window Controls */}
        <Container
          width={46}
          height={32}
          justifyContent="center"
          alignItems="center"
          hover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          cursor="pointer"
          onClick={() => onMinimize()}
        >
          <Text fontSize={10} color={COLORS.text}>─</Text>
        </Container>
        <Container
          width={46}
          height={32}
          justifyContent="center"
          alignItems="center"
          hover={{ backgroundColor: COLORS.closeHover }}
          cursor="pointer"
          borderTopRightRadius={8}
          onClick={() => onClose()}
        >
          <Text fontSize={10} color={COLORS.text}>✕</Text>
        </Container>
      </Container>

      {/* Content */}
      <Container
        flexGrow={1}
        padding={16}
        overflow="scroll"
      >
        {children}
      </Container>
    </Container>
  )
}

/**
 * Composant AboutContent - Contenu de la fenêtre About Me
 */
function AboutContent() {
  return (
    <Container flexDirection="column" gap={16}>
      {/* Header */}
      <Container flexDirection="row" alignItems="center" gap={16} paddingBottom={16} borderBottomWidth={1} borderColor={COLORS.border}>
        <Container
          width={80}
          height={80}
          borderRadius={40}
          backgroundColor={COLORS.primary}
          justifyContent="center"
          alignItems="center"
        >
          <Text fontSize={28} color={COLORS.text}>PL</Text>
        </Container>
        <Container flexDirection="column">
          <Text fontSize={20} color={COLORS.text} fontWeight="bold">Pierre Legrand</Text>
          <Text fontSize={14} color={COLORS.textMuted}>Full-Stack Developer & 3D Enthusiast</Text>
        </Container>
      </Container>

      {/* Bio */}
      <Text fontSize={13} color="#ccc" lineHeight={1.6}>
        Passionné par le développement web et les technologies 3D interactives. Je crée des expériences immersives qui combinent créativité et performance technique.
      </Text>

      {/* Stats */}
      <Container flexDirection="row" gap={24} paddingTop={16} borderTopWidth={1} borderColor={COLORS.border}>
        <Container flexDirection="column" alignItems="center">
          <Text fontSize={24} color={COLORS.primary} fontWeight="bold">5+</Text>
          <Text fontSize={12} color={COLORS.textMuted}>Years XP</Text>
        </Container>
        <Container flexDirection="column" alignItems="center">
          <Text fontSize={24} color={COLORS.primary} fontWeight="bold">50+</Text>
          <Text fontSize={12} color={COLORS.textMuted}>Projects</Text>
        </Container>
        <Container flexDirection="column" alignItems="center">
          <Text fontSize={24} color={COLORS.primary} fontWeight="bold">∞</Text>
          <Text fontSize={12} color={COLORS.textMuted}>Curiosity</Text>
        </Container>
      </Container>
    </Container>
  )
}

/**
 * Composant ExperienceContent - Contenu de la fenêtre Experience
 */
function ExperienceContent() {
  const experiences = [
    { title: 'Senior Full-Stack Developer', company: 'Tech Company', date: '2022 - Present', desc: 'Lead development of 3D web applications using React Three Fiber.' },
    { title: 'Full-Stack Developer', company: 'Digital Agency', date: '2020 - 2022', desc: 'Developed interactive web experiences and e-commerce platforms.' },
    { title: 'Frontend Developer', company: 'Startup', date: '2019 - 2020', desc: 'Built responsive user interfaces with React and TypeScript.' },
  ]

  return (
    <Container flexDirection="column" gap={24}>
      {experiences.map((exp, i) => (
        <Container key={i} paddingLeft={20} borderLeftWidth={2} borderColor={COLORS.primary}>
          <Text fontSize={16} color={COLORS.text} fontWeight="bold">{exp.title}</Text>
          <Text fontSize={14} color={COLORS.primary} marginTop={4}>{exp.company}</Text>
          <Text fontSize={12} color={COLORS.textMuted} marginTop={4}>{exp.date}</Text>
          <Text fontSize={13} color="#ccc" marginTop={8} lineHeight={1.5}>{exp.desc}</Text>
        </Container>
      ))}
    </Container>
  )
}

/**
 * Composant ContactContent - Contenu de la fenêtre Contact
 */
function ContactContent() {
  const contacts = [
    { icon: '📧', label: 'Email', value: 'contact@pierrelegrand.fr' },
    { icon: '🐙', label: 'GitHub', value: 'github.com/pierrelegrand' },
    { icon: '💼', label: 'LinkedIn', value: 'linkedin.com/in/pierrelegrand' },
    { icon: '🐦', label: 'Twitter', value: '@pierrelegrand' },
  ]

  return (
    <Container flexDirection="column" gap={12}>
      {contacts.map((contact, i) => (
        <Container
          key={i}
          flexDirection="row"
          alignItems="center"
          gap={12}
          padding={12}
          backgroundColor={COLORS.surfaceHover}
          borderRadius={8}
          hover={{ backgroundColor: '#3d3d3d' }}
          cursor="pointer"
        >
          <Text fontSize={24}>{contact.icon}</Text>
          <Container flexDirection="column" flexGrow={1}>
            <Text fontSize={12} color={COLORS.textMuted}>{contact.label}</Text>
            <Text fontSize={14} color={COLORS.text}>{contact.value}</Text>
          </Container>
        </Container>
      ))}
    </Container>
  )
}

/**
 * Composant ProjectsContent - Contenu de la fenêtre Projects
 */
function ProjectsContent() {
  const projects = [
    { icon: '🎮', title: '3D Portfolio', desc: 'Interactive 3D portfolio with biomes', tags: ['React', 'R3F'] },
    { icon: '🏗️', title: 'Procedural World', desc: 'Terrain generation with biomes', tags: ['Three.js', 'GLSL'] },
    { icon: '🎯', title: 'Angry Birds 3D', desc: 'Physics-based destruction game', tags: ['Rapier'] },
    { icon: '🕹️', title: 'Arcade Games', desc: 'Snake, Tetris, Breakout', tags: ['Canvas', 'TS'] },
  ]

  return (
    <Container flexDirection="row" flexWrap="wrap" gap={16}>
      {projects.map((project, i) => (
        <Container
          key={i}
          width={200}
          backgroundColor={COLORS.surfaceHover}
          borderRadius={8}
          overflow="hidden"
          hover={{ backgroundColor: '#3d3d3d' }}
          cursor="pointer"
        >
          <Container
            height={80}
            backgroundColor={COLORS.primary}
            justifyContent="center"
            alignItems="center"
          >
            <Text fontSize={32}>{project.icon}</Text>
          </Container>
          <Container padding={12} flexDirection="column">
            <Text fontSize={14} color={COLORS.text} fontWeight="bold">{project.title}</Text>
            <Text fontSize={12} color={COLORS.textMuted} marginTop={4}>{project.desc}</Text>
            <Container flexDirection="row" gap={4} marginTop={8} flexWrap="wrap">
              {project.tags.map((tag, j) => (
                <Container key={j} paddingX={8} paddingY={2} backgroundColor={COLORS.primary} borderRadius={12}>
                  <Text fontSize={10} color={COLORS.text}>{tag}</Text>
                </Container>
              ))}
            </Container>
          </Container>
        </Container>
      ))}
    </Container>
  )
}

/**
 * Composant CreditsContent - Contenu de la fenêtre Credits (Terminal)
 */
function CreditsContent() {
  const lines = [
    { type: 'command', text: '$ cat credits.txt' },
    { type: 'output', text: '' },
    { type: 'output', text: '═══════════════════════════════════' },
    { type: 'output', text: '       PIERRE LEGRAND PORTFOLIO' },
    { type: 'output', text: '═══════════════════════════════════' },
    { type: 'output', text: '' },
    { type: 'comment', text: '# Inspirations' },
    { type: 'output', text: 'Joan OS - jrefusta' },
    { type: 'output', text: 'Bruno Simon - threejs-journey.com' },
    { type: 'output', text: '' },
    { type: 'comment', text: '# Technologies' },
    { type: 'output', text: 'React 19 + React Three Fiber' },
    { type: 'output', text: '@pmndrs/uikit + Zustand' },
    { type: 'output', text: '' },
    { type: 'comment', text: '# Made with ❤️ in 2024' },
  ]

  return (
    <Container
      backgroundColor="#0c0c0c"
      padding={16}
      borderRadius={4}
      flexDirection="column"
    >
      {lines.map((line, i) => (
        <Text
          key={i}
          fontSize={12}
          fontFamily="monospace"
          color={
            line.type === 'command' ? '#0f0' :
            line.type === 'comment' ? '#888' : '#fff'
          }
          marginBottom={2}
        >
          {line.text || ' '}
        </Text>
      ))}
    </Container>
  )
}

/**
 * Composant TaskbarApp - Application dans la barre des tâches
 */
function TaskbarApp({
  icon,
  title,
  isActive,
  onClick,
}: {
  icon: string
  title: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <Container
      height={40}
      paddingX={12}
      flexDirection="row"
      alignItems="center"
      gap={8}
      borderRadius={4}
      backgroundColor={isActive ? 'rgba(255,255,255,0.15)' : 'transparent'}
      borderBottomWidth={isActive ? 2 : 0}
      borderColor={COLORS.primary}
      hover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
      cursor="pointer"
      onClick={onClick}
    >
      <Text fontSize={16}>{icon}</Text>
      <Text fontSize={12} color={COLORS.text}>{title}</Text>
    </Container>
  )
}

/**
 * Composant JoanOSUikit - OS complet
 */
export function JoanOSUikit({ onNavigateToHub }: JoanOSUikitProps) {
  // État des fenêtres
  const [windows, setWindows] = useState<Map<string, WindowState>>(() => {
    const map = new Map<string, WindowState>()
    WINDOW_CONFIGS.forEach((config) => {
      map.set(config.id, {
        ...config,
        isOpen: false,
        isMinimized: false,
        zIndex: 100,
      })
    })
    return map
  })

  const [activeWindowId, setActiveWindowId] = useState<string | null>(null)
  const [highestZIndex, setHighestZIndex] = useState(100)
  const [startMenuOpen, setStartMenuOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Horloge
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Ouvrir une fenêtre
  const openWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const newMap = new Map(prev)
      const win = newMap.get(id)
      if (win) {
        const newZIndex = highestZIndex + 1
        setHighestZIndex(newZIndex)
        newMap.set(id, { ...win, isOpen: true, isMinimized: false, zIndex: newZIndex })
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
      const win = newMap.get(id)
      if (win) {
        newMap.set(id, { ...win, isOpen: false, isMinimized: false })
      }
      return newMap
    })
    if (activeWindowId === id) setActiveWindowId(null)
  }, [activeWindowId])

  // Minimiser une fenêtre
  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const newMap = new Map(prev)
      const win = newMap.get(id)
      if (win) {
        newMap.set(id, { ...win, isMinimized: true })
      }
      return newMap
    })
    if (activeWindowId === id) setActiveWindowId(null)
  }, [activeWindowId])

  // Focus sur une fenêtre
  const focusWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const newMap = new Map(prev)
      const win = newMap.get(id)
      if (win && win.isOpen) {
        const newZIndex = highestZIndex + 1
        setHighestZIndex(newZIndex)
        newMap.set(id, { ...win, isMinimized: false, zIndex: newZIndex })
      }
      return newMap
    })
    setActiveWindowId(id)
  }, [highestZIndex])

  // Rendu du contenu de fenêtre
  const renderWindowContent = (windowId: string) => {
    switch (windowId) {
      case 'about': return <AboutContent />
      case 'experience': return <ExperienceContent />
      case 'contact': return <ContactContent />
      case 'projects': return <ProjectsContent />
      case 'credits': return <CreditsContent />
      default: return <Text color={COLORS.text}>Content not found</Text>
    }
  }

  // Fenêtres ouvertes pour la taskbar
  const openWindows = Array.from(windows.values()).filter(w => w.isOpen && !w.isMinimized)

  return (
    <DefaultProperties>
      {/* Desktop Background */}
      <Container
        flexDirection="column"
        backgroundColor={COLORS.background}
        width="100%"
        height="100%"
        positionType="relative"
      >
        {/* Desktop Icons */}
        <Container
          flexGrow={1}
          padding={16}
          flexDirection="column"
          flexWrap="wrap"
          gap={8}
          alignContent="flex-start"
        >
          {DESKTOP_ICONS.map((icon) => (
            <DesktopIcon
              key={icon.id}
              icon={icon.icon}
              label={icon.label}
              onDoubleClick={() => openWindow(icon.id)}
            />
          ))}
        </Container>

        {/* Windows */}
        {Array.from(windows.values()).map((win) => {
          if (!win.isOpen || win.isMinimized) return null
          return (
            <Window
              key={win.id}
              title={win.title}
              icon={win.icon}
              zIndex={win.zIndex}
              onClose={() => closeWindow(win.id)}
              onMinimize={() => minimizeWindow(win.id)}
              onFocus={() => focusWindow(win.id)}
            >
              {renderWindowContent(win.id)}
            </Window>
          )
        })}

        {/* Start Menu */}
        {startMenuOpen && (
          <Container
            positionType="absolute"
            positionBottom={56}
            positionLeft={8}
            width={320}
            backgroundColor="rgba(30,30,30,0.95)"
            borderRadius={8}
            padding={16}
            zIndexOffset={1000}
          >
            <Container flexDirection="row" flexWrap="wrap" gap={8}>
              {DESKTOP_ICONS.map((icon) => (
                <Container
                  key={icon.id}
                  flexDirection="column"
                  alignItems="center"
                  width={90}
                  padding={12}
                  borderRadius={4}
                  hover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  cursor="pointer"
                  onClick={() => openWindow(icon.id)}
                >
                  <Text fontSize={24} marginBottom={4}>{icon.icon}</Text>
                  <Text fontSize={11} color={COLORS.text} textAlign="center">{icon.label}</Text>
                </Container>
              ))}
              {onNavigateToHub && (
                <Container
                  flexDirection="column"
                  alignItems="center"
                  width={90}
                  padding={12}
                  borderRadius={4}
                  hover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  cursor="pointer"
                  onClick={onNavigateToHub}
                >
                  <Text fontSize={24} marginBottom={4}>🌍</Text>
                  <Text fontSize={11} color={COLORS.text} textAlign="center">3D Worlds</Text>
                </Container>
              )}
            </Container>
          </Container>
        )}

        {/* Taskbar */}
        <Container
          height={48}
          flexDirection="row"
          alignItems="center"
          backgroundColor="rgba(0,0,0,0.85)"
          paddingX={8}
          gap={4}
        >
          {/* Start Button */}
          <Container
            width={48}
            height={48}
            justifyContent="center"
            alignItems="center"
            borderRadius={4}
            hover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            cursor="pointer"
            onClick={() => setStartMenuOpen(!startMenuOpen)}
          >
            <Text fontSize={20} color={COLORS.text}>⊞</Text>
          </Container>

          {/* Open Apps */}
          <Container flexDirection="row" gap={4} flexGrow={1}>
            {openWindows.map((win) => (
              <TaskbarApp
                key={win.id}
                icon={win.icon}
                title={win.title}
                isActive={activeWindowId === win.id}
                onClick={() => focusWindow(win.id)}
              />
            ))}
          </Container>

          {/* Clock */}
          <Container flexDirection="column" alignItems="flex-end" paddingX={12}>
            <Text fontSize={11} color={COLORS.text}>
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text fontSize={11} color={COLORS.textMuted}>
              {currentTime.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </Text>
          </Container>
        </Container>
      </Container>
    </DefaultProperties>
  )
}

export default JoanOSUikit
