/**
 * PierreOSUikit - Simulation Windows OS avec @pmndrs/uikit.
 *
 * Version native 3D de PierreOS utilisant uikit au lieu de Html de drei.
 * Rendu directement en Three.js pour une meilleure intégration visuelle.
 */

import { useCallback, useEffect, useState } from 'react'
import { Container, Text, DefaultProperties, Input } from '@react-three/uikit'
import {
  User,
  Briefcase,
  Mail,
  Rocket,
  Keyboard,
  X,
  Minus,
  Monitor,
  Globe,
  Linkedin,
  Gamepad2,
  Building2,
  Target,
  Joystick,
  // System Tray icons
  Wifi,
  Volume2,
  Battery,
  Bell,
  ChevronUp,
  // Contact Form icons
  Send,
  CircleCheck,
  CircleAlert,
  Loader,
  // Credits navigation icons
  ChevronLeft,
  ChevronRight,
} from '@react-three/uikit-lucide'
import type { MonitorResponsiveConfig } from '@hooks/useResponsive'

// Types
type IconComponent = typeof User

interface ContactFormState {
  name: string
  email: string
  message: string
  status: 'idle' | 'sending' | 'success' | 'error'
  errorMessage: string
}

type CreditSection = 'credits' | 'inspirations' | 'resources' | 'thanks'

interface CreditLine {
  type: 'command' | 'output' | 'comment'
  text: string
}

interface WindowState {
  id: string
  title: string
  Icon: IconComponent
  isOpen: boolean
  isMinimized: boolean
  zIndex: number
}

interface PierreOSUikitProps {
  /** Callback pour naviguer vers le Hub 3D */
  onNavigateToHub?: () => void
  /** Configuration responsive pour adapter l'UI selon l'appareil */
  responsiveConfig?: MonitorResponsiveConfig
}

// Valeurs par défaut pour le responsive (desktop)
const DEFAULT_RESPONSIVE: MonitorResponsiveConfig = {
  pixelSize: 0.00102,
  uiScale: 1,
  windowWidth: 900,
  windowHeight: 550,
  iconSize: 80,
  baseFontSize: 11,
}

// Configuration des fenêtres
const WINDOW_CONFIGS: Array<{ id: string; title: string; Icon: IconComponent }> = [
  { id: 'about', title: 'About Me', Icon: User },
  { id: 'experience', title: 'Experience', Icon: Briefcase },
  { id: 'contact', title: 'Contact', Icon: Mail },
  { id: 'projects', title: 'Projects', Icon: Rocket },
  { id: 'credits', title: 'Credits', Icon: Keyboard },
]

// Icônes du bureau
const DESKTOP_ICONS: Array<{ id: string; label: string; Icon: IconComponent }> = [
  { id: 'about', label: 'About Me', Icon: User },
  { id: 'experience', label: 'Experience', Icon: Briefcase },
  { id: 'contact', label: 'Contact', Icon: Mail },
  { id: 'projects', label: 'Projects', Icon: Rocket },
  { id: 'credits', label: 'Credits', Icon: Keyboard },
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
  Icon,
  label,
  onClick,
  iconSize = 80,
  baseFontSize = 11,
}: {
  Icon: IconComponent
  label: string
  onClick: () => void
  iconSize?: number
  baseFontSize?: number
}) {
  const iconDimension = Math.round(iconSize * 0.4) // 40% de la taille du conteneur
  return (
    <Container
      flexDirection="column"
      alignItems="center"
      width={iconSize}
      padding={8}
      borderRadius={4}
      hover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
      active={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
      cursor="pointer"
      onClick={onClick}
    >
      <Icon width={iconDimension} height={iconDimension} color={COLORS.text} marginBottom={4} />
      <Text fontSize={baseFontSize} color={COLORS.text} textAlign="center">{label}</Text>
    </Container>
  )
}

/**
 * Composant Window - Fenêtre flottante centrée avec décalage selon l'index
 */
function Window({
  title,
  Icon,
  children,
  zIndex,
  windowIndex,
  onClose,
  onMinimize,
  onFocus,
  windowWidth = 900,
  windowHeight = 550,
}: {
  title: string
  Icon: IconComponent
  children: React.ReactNode
  zIndex: number
  windowIndex: number
  onClose: () => void
  onMinimize: () => void
  onFocus: () => void
  windowWidth?: number
  windowHeight?: number
}) {
  // Centrer la fenêtre avec un léger décalage selon l'index pour l'effet cascade
  // Pour un écran de ~1370px de large et ~765px de haut (taille moniteur)
  const baseTop = Math.max(20, Math.round((765 - windowHeight) / 2) - 24)
  const baseLeft = Math.max(20, Math.round((1370 - windowWidth) / 2))

  // Décalage en cascade (20px par fenêtre)
  const cascadeOffset = windowIndex * 25
  const posTop = baseTop + cascadeOffset
  const posLeft = baseLeft + cascadeOffset

  return (
    <Container
      positionType="absolute"
      positionTop={posTop}
      positionLeft={posLeft}
      width={windowWidth}
      height={windowHeight}
      flexDirection="column"
      backgroundColor={COLORS.surface}
      borderRadius={8}
      zIndexOffset={zIndex + 500}
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
        <Icon width={14} height={14} color={COLORS.text} marginRight={8} />
        <Text fontSize={12} color={COLORS.text} flexGrow={1}>{title}</Text>

        {/* Window Controls */}
        <Container
          width={46}
          height={32}
          justifyContent="center"
          alignItems="center"
          hover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          cursor="pointer"
          onClick={(e) => {
            e.stopPropagation?.()
            onMinimize()
          }}
        >
          <Minus width={10} height={10} color={COLORS.text} />
        </Container>
        <Container
          width={46}
          height={32}
          justifyContent="center"
          alignItems="center"
          hover={{ backgroundColor: COLORS.closeHover }}
          cursor="pointer"
          borderTopRightRadius={8}
          onClick={(e) => {
            e.stopPropagation?.()
            onClose()
          }}
        >
          <X width={10} height={10} color={COLORS.text} />
        </Container>
      </Container>

      {/* Content */}
      <Container
        flexGrow={1}
        padding={16}
        overflow="scroll"
        backgroundColor={COLORS.surface}
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
 * Composant ContactContent - Formulaire de contact fonctionnel
 */
function ContactContent() {
  const [form, setForm] = useState<ContactFormState>({
    name: '',
    email: '',
    message: '',
    status: 'idle',
    errorMessage: '',
  })

  // Validation
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isValid = form.name.length >= 2 && validateEmail(form.email) && form.message.length >= 10

  // Envoi du formulaire
  const handleSubmit = async () => {
    if (!isValid) return
    setForm((f) => ({ ...f, status: 'sending' }))

    try {
      // EmailJS integration - à configurer avec vos clés
      // await emailjs.send(
      //   import.meta.env.VITE_EMAILJS_SERVICE_ID,
      //   import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      //   { name: form.name, email: form.email, message: form.message },
      //   import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      // )

      // Simulation d'envoi (remplacer par EmailJS)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setForm({ name: '', email: '', message: '', status: 'success', errorMessage: '' })

      // Reset après 3 secondes
      setTimeout(() => {
        setForm((f) => ({ ...f, status: 'idle' }))
      }, 3000)
    } catch {
      setForm((f) => ({ ...f, status: 'error', errorMessage: "Erreur d'envoi. Réessayez." }))
    }
  }

  return (
    <Container flexDirection="column" gap={16}>
      {/* Champ Nom */}
      <Container flexDirection="column" gap={4}>
        <Text fontSize={12} color={COLORS.textMuted}>
          Nom *
        </Text>
        <Input
          value={form.name}
          onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
          placeholder="Votre nom"
          height={36}
          paddingX={12}
          backgroundColor={COLORS.surfaceHover}
          borderRadius={4}
          fontSize={13}
          color={COLORS.text}
          borderWidth={1}
          borderColor={form.name.length > 0 && form.name.length < 2 ? '#f87171' : COLORS.border}
        />
      </Container>

      {/* Champ Email */}
      <Container flexDirection="column" gap={4}>
        <Text fontSize={12} color={COLORS.textMuted}>
          Email *
        </Text>
        <Input
          value={form.email}
          onValueChange={(v) => setForm((f) => ({ ...f, email: v }))}
          placeholder="votre@email.com"
          height={36}
          paddingX={12}
          backgroundColor={COLORS.surfaceHover}
          borderRadius={4}
          fontSize={13}
          color={COLORS.text}
          borderWidth={1}
          borderColor={form.email.length > 0 && !validateEmail(form.email) ? '#f87171' : COLORS.border}
        />
      </Container>

      {/* Champ Message */}
      <Container flexDirection="column" gap={4}>
        <Text fontSize={12} color={COLORS.textMuted}>
          Message * (min. 10 caractères)
        </Text>
        <Input
          value={form.message}
          onValueChange={(v) => setForm((f) => ({ ...f, message: v }))}
          placeholder="Votre message..."
          height={80}
          paddingX={12}
          paddingY={8}
          backgroundColor={COLORS.surfaceHover}
          borderRadius={4}
          fontSize={13}
          color={COLORS.text}
          borderWidth={1}
          borderColor={form.message.length > 0 && form.message.length < 10 ? '#f87171' : COLORS.border}
        />
      </Container>

      {/* Bouton Envoyer */}
      <Container
        height={40}
        backgroundColor={isValid ? COLORS.primary : COLORS.surfaceHover}
        borderRadius={4}
        justifyContent="center"
        alignItems="center"
        flexDirection="row"
        gap={8}
        cursor={isValid && form.status !== 'sending' ? 'pointer' : 'default'}
        hover={{ backgroundColor: isValid && form.status !== 'sending' ? '#0066b8' : COLORS.surfaceHover }}
        onClick={isValid && form.status !== 'sending' ? handleSubmit : undefined}
      >
        {form.status === 'sending' ? (
          <Loader width={16} height={16} color={COLORS.text} />
        ) : (
          <Send width={16} height={16} color={isValid ? COLORS.text : COLORS.textMuted} />
        )}
        <Text fontSize={14} color={isValid ? COLORS.text : COLORS.textMuted}>
          {form.status === 'sending' ? 'Envoi en cours...' : 'Envoyer'}
        </Text>
      </Container>

      {/* Messages de feedback */}
      {form.status === 'success' && (
        <Container flexDirection="row" alignItems="center" gap={8} padding={12} backgroundColor="rgba(74, 222, 128, 0.1)" borderRadius={4}>
          <CircleCheck width={16} height={16} color="#4ade80" />
          <Text fontSize={12} color="#4ade80">
            Message envoyé avec succès !
          </Text>
        </Container>
      )}
      {form.status === 'error' && (
        <Container flexDirection="row" alignItems="center" gap={8} padding={12} backgroundColor="rgba(248, 113, 113, 0.1)" borderRadius={4}>
          <CircleAlert width={16} height={16} color="#f87171" />
          <Text fontSize={12} color="#f87171">
            {form.errorMessage}
          </Text>
        </Container>
      )}

      {/* Liens de contact directs */}
      <Container flexDirection="column" gap={8} marginTop={8} paddingTop={16} borderTopWidth={1} borderColor={COLORS.border}>
        <Text fontSize={11} color={COLORS.textMuted}>
          Ou contactez-moi directement :
        </Text>
        <Container flexDirection="row" gap={16}>
          <Container flexDirection="row" alignItems="center" gap={6} cursor="pointer" hover={{ opacity: 0.8 }}>
            <Mail width={14} height={14} color={COLORS.primary} />
            <Text fontSize={11} color={COLORS.text}>pro@pierrelegrand.fr</Text>
          </Container>
          <Container flexDirection="row" alignItems="center" gap={6} cursor="pointer" hover={{ opacity: 0.8 }}>
            <Linkedin width={14} height={14} color={COLORS.primary} />
            <Text fontSize={11} color={COLORS.text}>LinkedIn</Text>
          </Container>
        </Container>
      </Container>
    </Container>
  )
}

/**
 * Composant ProjectsContent - Contenu de la fenêtre Projects
 */
function ProjectsContent() {
  const projects: Array<{ Icon: IconComponent; title: string; desc: string; tags: string[] }> = [
    { Icon: Gamepad2, title: '3D Portfolio', desc: 'Interactive 3D portfolio with biomes', tags: ['React', 'R3F'] },
    { Icon: Building2, title: 'Procedural World', desc: 'Terrain generation with biomes', tags: ['Three.js', 'GLSL'] },
    { Icon: Target, title: 'Angry Birds 3D', desc: 'Physics-based destruction game', tags: ['Rapier'] },
    { Icon: Joystick, title: 'Arcade Games', desc: 'Snake, Tetris, Breakout', tags: ['Canvas', 'TS'] },
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
            <project.Icon width={32} height={32} color={COLORS.text} />
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

// Données des sections Credits
const CREDIT_SECTIONS: Record<CreditSection, CreditLine[]> = {
  credits: [
    { type: 'command', text: '$ cat credits.txt' },
    { type: 'output', text: '═══════════════════════════════════' },
    { type: 'output', text: '       PIERRE LEGRAND PORTFOLIO' },
    { type: 'output', text: '           Version 2.0' },
    { type: 'output', text: '═══════════════════════════════════' },
    { type: 'comment', text: '# Author: Pierre Legrand' },
    { type: 'comment', text: '# Made with love in 2024' },
  ],
  inspirations: [
    { type: 'command', text: '$ ls inspirations/' },
    { type: 'output', text: 'joan-os/          -> jrefusta' },
    { type: 'output', text: 'threejs-journey/  -> Bruno Simon' },
    { type: 'output', text: 'wawasensei/       -> wawasensei.dev' },
    { type: 'output', text: 'pmndrs/           -> Poimandres' },
    { type: 'output', text: 'codrops/          -> tympanus.net' },
  ],
  resources: [
    { type: 'command', text: '$ npm list --depth=0' },
    { type: 'output', text: 'react@19.0.0' },
    { type: 'output', text: '@react-three/fiber@9.0.0' },
    { type: 'output', text: '@react-three/drei@10.0.0' },
    { type: 'output', text: '@pmndrs/uikit@1.0.60' },
    { type: 'output', text: 'zustand@5.0.0' },
    { type: 'output', text: 'three@0.172.0' },
  ],
  thanks: [
    { type: 'command', text: '$ cat thanks.md' },
    { type: 'output', text: 'Special thanks to:' },
    { type: 'output', text: '  - The R3F community' },
    { type: 'output', text: '  - Open source contributors' },
    { type: 'output', text: '  - Coffee (lots of it)' },
    { type: 'output', text: '  - You, for visiting!' },
    { type: 'comment', text: '# Have a great day!' },
  ],
}

/**
 * Composant CreditsContent - Terminal Credits avec navigation et typing effect
 */
function CreditsContent() {
  const sections: CreditSection[] = ['credits', 'inspirations', 'resources', 'thanks']
  const sectionLabels: Record<CreditSection, string> = {
    credits: 'CREDITS',
    inspirations: 'INSPIRATIONS',
    resources: 'RESOURCES',
    thanks: 'THANKS',
  }
  const [currentSection, setCurrentSection] = useState<CreditSection>('credits')
  const [displayedLines, setDisplayedLines] = useState<CreditLine[]>([])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [cursorVisible, setCursorVisible] = useState(true)

  const currentIndex = sections.indexOf(currentSection)

  // Navigation entre sections
  const changeSection = useCallback((section: CreditSection) => {
    setCurrentSection(section)
    setDisplayedLines([])
    setCurrentLineIndex(0)
    setCurrentCharIndex(0)
  }, [])

  const goToPrev = useCallback(() => {
    const newIndex = (currentIndex - 1 + sections.length) % sections.length
    const nextSection = sections[newIndex]
    if (nextSection) changeSection(nextSection)
  }, [currentIndex, sections, changeSection])

  const goToNext = useCallback(() => {
    const newIndex = (currentIndex + 1) % sections.length
    const nextSection = sections[newIndex]
    if (nextSection) changeSection(nextSection)
  }, [currentIndex, sections, changeSection])

  // Effet typing
  useEffect(() => {
    const lines = CREDIT_SECTIONS[currentSection]
    if (currentLineIndex >= lines.length) return

    const currentLine = lines[currentLineIndex]
    if (!currentLine) return

    const text = currentLine.text

    if (currentCharIndex < text.length) {
      const timer = setTimeout(() => {
        setCurrentCharIndex((c) => c + 1)
      }, 15) // Vitesse du typing
      return () => clearTimeout(timer)
    } else {
      // Ligne complète, passer à la suivante
      setDisplayedLines((prev) => [...prev, currentLine])
      setCurrentLineIndex((i) => i + 1)
      setCurrentCharIndex(0)
    }
  }, [currentSection, currentLineIndex, currentCharIndex])

  // Curseur clignotant
  useEffect(() => {
    const timer = setInterval(() => {
      setCursorVisible((v) => !v)
    }, 530)
    return () => clearInterval(timer)
  }, [])

  // Ligne en cours de typing
  const lines = CREDIT_SECTIONS[currentSection]
  const currentLine = currentLineIndex < lines.length ? lines[currentLineIndex] : null
  const typingLine = currentLine ? currentLine.text.substring(0, currentCharIndex) : null
  const typingLineType = currentLine ? currentLine.type : 'output'

  const getLineColor = (type: CreditLine['type']) => {
    switch (type) {
      case 'command':
        return '#4ade80' // Vert
      case 'comment':
        return '#6b7280' // Gris
      default:
        return '#ffffff' // Blanc
    }
  }

  return (
    <Container flexDirection="column" height="100%">
      {/* Navigation tabs */}
      <Container flexDirection="row" gap={6} marginBottom={12}>
        {sections.map((section) => (
          <Container
            key={section}
            paddingX={10}
            paddingY={6}
            backgroundColor={section === currentSection ? COLORS.primary : 'transparent'}
            borderRadius={4}
            cursor="pointer"
            hover={{ backgroundColor: section !== currentSection ? 'rgba(255,255,255,0.1)' : COLORS.primary }}
            onClick={() => changeSection(section)}
          >
            <Text fontSize={9} color={COLORS.text}>
              {sectionLabels[section]}
            </Text>
          </Container>
        ))}
      </Container>

      {/* Terminal window */}
      <Container backgroundColor="#0c0c0c" padding={12} borderRadius={4} flexDirection="column" flexGrow={1} overflow="scroll">
        {/* Lignes déjà affichées */}
        {displayedLines.map((line, i) => (
          <Text key={i} fontSize={11} color={getLineColor(line.type)} marginBottom={2}>
            {line.text || ' '}
          </Text>
        ))}

        {/* Ligne en cours de typing + curseur */}
        {typingLine !== null && (
          <Text fontSize={11} color={getLineColor(typingLineType)}>
            {typingLine}
            {cursorVisible ? '█' : ' '}
          </Text>
        )}

        {/* Curseur seul quand typing terminé */}
        {typingLine === null && currentLineIndex >= lines.length && (
          <Text fontSize={11} color="#4ade80">
            $ {cursorVisible ? '█' : ' '}
          </Text>
        )}
      </Container>

      {/* Navigation prev/next */}
      <Container flexDirection="row" justifyContent="space-between" alignItems="center" marginTop={12}>
        <Container
          paddingX={14}
          paddingY={6}
          backgroundColor={COLORS.surfaceHover}
          borderRadius={4}
          cursor="pointer"
          hover={{ backgroundColor: '#3d3d3d' }}
          onClick={goToPrev}
          flexDirection="row"
          alignItems="center"
          gap={6}
        >
          <ChevronLeft width={12} height={12} color={COLORS.text} />
          <Text fontSize={11} color={COLORS.text}>
            Prev
          </Text>
        </Container>

        <Text fontSize={10} color={COLORS.textMuted}>
          {currentIndex + 1} / {sections.length}
        </Text>

        <Container
          paddingX={14}
          paddingY={6}
          backgroundColor={COLORS.surfaceHover}
          borderRadius={4}
          cursor="pointer"
          hover={{ backgroundColor: '#3d3d3d' }}
          onClick={goToNext}
          flexDirection="row"
          alignItems="center"
          gap={6}
        >
          <Text fontSize={11} color={COLORS.text}>
            Next
          </Text>
          <ChevronRight width={12} height={12} color={COLORS.text} />
        </Container>
      </Container>
    </Container>
  )
}

/**
 * Composant SystemTray - Zone système de la barre des tâches
 */
function SystemTray({ onShowDesktop }: { onShowDesktop: () => void }) {
  const [notificationCount] = useState(2)

  return (
    <Container flexDirection="row" alignItems="center" gap={2} paddingX={4}>
      {/* Bouton Show Desktop */}
      <Container
        width={24}
        height={40}
        justifyContent="center"
        alignItems="center"
        hover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        cursor="pointer"
        onClick={onShowDesktop}
        borderRadius={4}
      >
        <ChevronUp width={12} height={12} color={COLORS.text} />
      </Container>

      {/* Séparateur */}
      <Container width={1} height={20} backgroundColor={COLORS.border} marginX={4} />

      {/* Icônes système */}
      <Container flexDirection="row" alignItems="center" gap={0}>
        {/* Wifi */}
        <Container
          width={28}
          height={28}
          justifyContent="center"
          alignItems="center"
          borderRadius={4}
          hover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          cursor="pointer"
        >
          <Wifi width={12} height={12} color={COLORS.text} />
        </Container>

        {/* Volume */}
        <Container
          width={28}
          height={28}
          justifyContent="center"
          alignItems="center"
          borderRadius={4}
          hover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          cursor="pointer"
        >
          <Volume2 width={12} height={12} color={COLORS.text} />
        </Container>

        {/* Battery */}
        <Container
          width={28}
          height={28}
          justifyContent="center"
          alignItems="center"
          borderRadius={4}
          hover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          cursor="pointer"
        >
          <Battery width={12} height={12} color={COLORS.text} />
        </Container>
      </Container>

      {/* Séparateur */}
      <Container width={1} height={20} backgroundColor={COLORS.border} marginX={4} />

      {/* Notifications */}
      <Container
        width={28}
        height={28}
        justifyContent="center"
        alignItems="center"
        borderRadius={4}
        hover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        cursor="pointer"
        positionType="relative"
      >
        <Bell width={12} height={12} color={COLORS.text} />
        {notificationCount > 0 && (
          <Container
            positionType="absolute"
            positionTop={2}
            positionRight={2}
            width={12}
            height={12}
            borderRadius={6}
            backgroundColor={COLORS.primary}
            justifyContent="center"
            alignItems="center"
          >
            <Text fontSize={7} color={COLORS.text}>{notificationCount}</Text>
          </Container>
        )}
      </Container>
    </Container>
  )
}

/**
 * Composant TaskbarApp - Application dans la barre des tâches
 */
function TaskbarApp({
  Icon,
  title,
  isActive,
  onClick,
}: {
  Icon: IconComponent
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
      <Icon width={16} height={16} color={COLORS.text} />
      <Text fontSize={12} color={COLORS.text}>{title}</Text>
    </Container>
  )
}

/**
 * Composant PierreOSUikit - OS complet
 */

import { FONTS } from '@config/assetPaths'

// Configuration des fonts avec support des accents français (fichiers MSDF)
const FONT_FAMILIES = {
  roboto: {
    light: FONTS.ROBOTO_LIGHT_JSON,
    900: FONTS.ROBOTO_BLACK_JSON,
  },
}

export function PierreOSUikit({ onNavigateToHub, responsiveConfig }: PierreOSUikitProps) {
  // Utiliser la config responsive ou les valeurs par défaut
  const config = responsiveConfig || DEFAULT_RESPONSIVE

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

  // Minimiser toutes les fenêtres (Show Desktop)
  const minimizeAllWindows = useCallback(() => {
    setWindows((prev) => {
      const newMap = new Map(prev)
      newMap.forEach((win, id) => {
        if (win.isOpen) {
          newMap.set(id, { ...win, isMinimized: true })
        }
      })
      return newMap
    })
    setActiveWindowId(null)
  }, [])

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

  // Fenêtres ouvertes pour la taskbar (inclut les minimisées)
  const taskbarWindows = Array.from(windows.values()).filter(w => w.isOpen)

  return (
    <DefaultProperties>
      {/* Desktop Background */}
      <Container
        flexDirection="column"
        backgroundColor={COLORS.background}
        width="100%"
        height="100%"
        positionType="relative"
        fontFamilies={FONT_FAMILIES}
        fontFamily="roboto"
        fontWeight="light"
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
          {DESKTOP_ICONS.map((item) => (
            <DesktopIcon
              key={item.id}
              Icon={item.Icon}
              label={item.label}
              onClick={() => openWindow(item.id)}
              iconSize={config.iconSize}
              baseFontSize={config.baseFontSize}
            />
          ))}
        </Container>

        {/* Desktop Quote - Citation inspirante */}
        <Container
          positionType="absolute"
          positionBottom={70}
          positionRight={24}
          maxWidth={400}
          padding={20}
          backgroundColor="rgba(0,0,0,0.3)"
          borderRadius={8}
          flexDirection="column"
          gap={10}
        >
          <Text fontSize={14} color="rgba(255,255,255,0.85)" lineHeight={1.6} textAlign="right">
            {"Pour que ma vie s'améliore, je dois m'améliorer.\nPour que les choses changent, je dois changer.\nJe suis à moi.\nC'est ma vie et je suis le créateur de mon destin."}
          </Text>
          <Text fontSize={12} color="rgba(255,255,255,0.5)" textAlign="right">
            — Benjamin Franklin
          </Text>
        </Container>

        {/* Windows - Afficher seulement la fenêtre active pour éviter les superpositions transparentes */}
        {(() => {
          const openWindows = Array.from(windows.values()).filter((win) => win.isOpen && !win.isMinimized)
          // Trouver la fenêtre avec le zIndex le plus élevé (la fenêtre active)
          const activeWindow = openWindows.reduce<WindowState | null>(
            (highest, win) => (!highest || win.zIndex > highest.zIndex ? win : highest),
            null
          )
          if (!activeWindow) return null
          return (
            <Window
              key={activeWindow.id}
              title={activeWindow.title}
              Icon={activeWindow.Icon}
              zIndex={activeWindow.zIndex}
              windowIndex={0}
              onClose={() => closeWindow(activeWindow.id)}
              onMinimize={() => minimizeWindow(activeWindow.id)}
              onFocus={() => focusWindow(activeWindow.id)}
              windowWidth={config.windowWidth}
              windowHeight={config.windowHeight}
            >
              {renderWindowContent(activeWindow.id)}
            </Window>
          )
        })()}

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
              {DESKTOP_ICONS.map((item) => (
                <Container
                  key={item.id}
                  flexDirection="column"
                  alignItems="center"
                  width={90}
                  padding={12}
                  borderRadius={4}
                  hover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  cursor="pointer"
                  onClick={() => openWindow(item.id)}
                >
                  <item.Icon width={24} height={24} color={COLORS.text} marginBottom={4} />
                  <Text fontSize={11} color={COLORS.text} textAlign="center">{item.label}</Text>
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
                  <Globe width={24} height={24} color={COLORS.text} marginBottom={4} />
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
            <Monitor width={20} height={20} color={COLORS.text} />
          </Container>

          {/* Open Apps (inclut les fenêtres minimisées) */}
          <Container flexDirection="row" gap={4} flexGrow={1}>
            {taskbarWindows.map((win) => (
              <TaskbarApp
                key={win.id}
                Icon={win.Icon}
                title={win.title}
                isActive={activeWindowId === win.id && !win.isMinimized}
                onClick={() => focusWindow(win.id)}
              />
            ))}
          </Container>

          {/* System Tray */}
          <SystemTray onShowDesktop={minimizeAllWindows} />

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

export default PierreOSUikit
