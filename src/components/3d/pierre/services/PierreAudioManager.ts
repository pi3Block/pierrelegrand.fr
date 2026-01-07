/**
 * PierreAudioManager - Gestionnaire audio pour PierreExperience.
 * 
 * Fonctionnalités:
 * - Préchargement des sons
 * - Lecture avec gestion du volume
 * - Sons spatialisés (3D)
 * - Musique de fond
 */

import * as THREE from 'three'

// Liste des sons disponibles
const SOUND_PATHS: Record<string, string> = {
  // Rubik's cube
  rubik_1: '/pierre/assets/sounds/rubik_1.mp3',
  rubik_2: '/pierre/assets/sounds/rubik_2.mp3',
  rubik_3: '/pierre/assets/sounds/rubik_3.mp3',
  
  // Victoire
  confetti: '/pierre/assets/sounds/confetti.mp3',
  trophy: '/pierre/assets/sounds/trophy.mp3',
  trophy_platinum: '/pierre/assets/sounds/trophy_platinum.mp3',
  partyblower: '/pierre/assets/sounds/partyblower.mp3',
  
  // Tableau blanc
  marker_open: '/pierre/assets/sounds/marker-open.mp3',
  eraser: '/pierre/assets/sounds/eraser.mp3',
  
  // Transitions
  whoosh: '/pierre/assets/sounds/whoosh.mp3',
  whoosh_: '/pierre/assets/sounds/whoosh_.mp3',
  whoosh__: '/pierre/assets/sounds/whoosh__.mp3',
  whoosh___: '/pierre/assets/sounds/whoosh___.mp3',
  door: '/pierre/assets/sounds/door.mp3',
  
  // Interface
  select1: '/pierre/assets/sounds/select1.ogg',
  select2: '/pierre/assets/sounds/select2.ogg',
  mouseclick: '/pierre/assets/sounds/mouseclick.ogg',
  mouserelease: '/pierre/assets/sounds/mouserelease.ogg',
  
  // Arcade
  hit: '/pierre/assets/sounds/hit.ogg',
  tetris: '/pierre/assets/sounds/tetris.ogg',
  die: '/pierre/assets/sounds/die.ogg',
  start: '/pierre/assets/sounds/start.mp3',
  
  // Footsteps
  footstep01: '/pierre/assets/sounds/footstep01.ogg',
  footstep02: '/pierre/assets/sounds/footstep02.ogg',
  footstep03: '/pierre/assets/sounds/footstep03.ogg',
  
  // Divers
  floral: '/pierre/assets/sounds/floral.mp3',
  vase_break: '/pierre/assets/sounds/vase_break.mp3',
}

// Volumes par défaut
const DEFAULT_VOLUMES: Record<string, number> = {
  rubik_1: 0.4,
  rubik_2: 0.4,
  rubik_3: 0.4,
  confetti: 0.6,
  trophy: 0.5,
  trophy_platinum: 0.5,
  partyblower: 0.4,
  marker_open: 0.3,
  eraser: 0.3,
  whoosh: 0.5,
  whoosh_: 0.5,
  whoosh__: 0.5,
  whoosh___: 0.5,
  door: 0.5,
  select1: 0.3,
  select2: 0.3,
  mouseclick: 0.2,
  mouserelease: 0.2,
  hit: 0.5,
  tetris: 0.5,
  die: 0.5,
  start: 0.6,
  footstep01: 0.2,
  footstep02: 0.2,
  footstep03: 0.2,
  floral: 0.4,
  vase_break: 0.5,
}

export type SoundName = keyof typeof SOUND_PATHS

/**
 * Classe singleton pour gérer l'audio de PierreExperience.
 */
class PierreAudioManager {
  private static instance: PierreAudioManager | null = null
  
  private audioLoader: THREE.AudioLoader
  private listener: THREE.AudioListener | null = null
  private sounds: Map<string, THREE.Audio> = new Map()
  private buffers: Map<string, AudioBuffer> = new Map()
  private isInitialized = false
  private masterVolume = 0.5

  private constructor() {
    this.audioLoader = new THREE.AudioLoader()
  }

  /**
   * Obtenir l'instance singleton.
   */
  static getInstance(): PierreAudioManager {
    if (!PierreAudioManager.instance) {
      PierreAudioManager.instance = new PierreAudioManager()
    }
    return PierreAudioManager.instance
  }

  /**
   * Initialiser le gestionnaire avec une caméra.
   */
  init(camera: THREE.Camera): void {
    if (this.isInitialized) return
    
    this.listener = new THREE.AudioListener()
    camera.add(this.listener)
    this.isInitialized = true
  }

  /**
   * Précharger tous les sons.
   */
  async preloadAll(): Promise<void> {
    const promises = Object.entries(SOUND_PATHS).map(([name, path]) => 
      this.preload(name, path)
    )
    await Promise.all(promises)
  }

  /**
   * Précharger un son spécifique.
   */
  async preload(name: string, path: string): Promise<void> {
    return new Promise((resolve) => {
      this.audioLoader.load(
        path,
        (buffer) => {
          this.buffers.set(name, buffer)
          resolve()
        },
        undefined,
        (err) => {
          console.warn(`Impossible de charger le son: ${name}`, err)
          resolve() // Ne pas bloquer le chargement
        }
      )
    })
  }

  /**
   * Jouer un son.
   */
  play(name: SoundName, options?: { volume?: number; loop?: boolean }): THREE.Audio | null {
    if (!this.listener || !this.isInitialized) {
      console.warn('AudioManager non initialisé')
      return null
    }
    
    const buffer = this.buffers.get(name)
    if (!buffer) {
      console.warn(`Son non préchargé: ${name}`)
      return null
    }
    
    // Créer ou récupérer l'audio
    let audio = this.sounds.get(name)
    
    if (!audio) {
      audio = new THREE.Audio(this.listener)
      this.sounds.set(name, audio)
    }
    
    // Arrêter si déjà en cours
    if (audio.isPlaying) {
      audio.stop()
    }
    
    audio.setBuffer(buffer)
    audio.setVolume((options?.volume ?? DEFAULT_VOLUMES[name] ?? 0.5) * this.masterVolume)
    audio.setLoop(options?.loop ?? false)
    audio.play()
    
    return audio
  }

  /**
   * Arrêter un son.
   */
  stop(name: SoundName): void {
    const audio = this.sounds.get(name)
    if (audio?.isPlaying) {
      audio.stop()
    }
  }

  /**
   * Arrêter tous les sons.
   */
  stopAll(): void {
    this.sounds.forEach((audio) => {
      if (audio.isPlaying) {
        audio.stop()
      }
    })
  }

  /**
   * Définir le volume principal.
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    
    // Mettre à jour tous les sons en cours
    this.sounds.forEach((audio, name) => {
      if (audio.isPlaying) {
        const baseVolume = DEFAULT_VOLUMES[name] ?? 0.5
        audio.setVolume(baseVolume * this.masterVolume)
      }
    })
  }

  /**
   * Obtenir le volume principal.
   */
  getMasterVolume(): number {
    return this.masterVolume
  }

  /**
   * Jouer un son aléatoire d'un groupe.
   */
  playRandom(names: SoundName[], options?: { volume?: number }): THREE.Audio | null {
    const randomName = names[Math.floor(Math.random() * names.length)]
    if (randomName) {
      return this.play(randomName, options)
    }
    return null
  }

  /**
   * Jouer un son de rotation du Rubik's cube.
   */
  playRubikRotation(): THREE.Audio | null {
    return this.playRandom(['rubik_1', 'rubik_2', 'rubik_3'], { volume: 0.4 })
  }

  /**
   * Jouer un son de whoosh.
   */
  playWhoosh(): THREE.Audio | null {
    return this.playRandom(['whoosh', 'whoosh_', 'whoosh__', 'whoosh___'], { volume: 0.5 })
  }

  /**
   * Jouer un son de footstep.
   */
  playFootstep(): THREE.Audio | null {
    return this.playRandom(['footstep01', 'footstep02', 'footstep03'], { volume: 0.2 })
  }

  /**
   * Nettoyer les ressources.
   */
  dispose(): void {
    this.stopAll()
    this.sounds.clear()
    this.buffers.clear()
    
    if (this.listener) {
      this.listener.parent?.remove(this.listener)
      this.listener = null
    }
    
    this.isInitialized = false
  }
}

// Exporter l'instance singleton
export const pierreAudioManager = PierreAudioManager.getInstance()

export default pierreAudioManager

