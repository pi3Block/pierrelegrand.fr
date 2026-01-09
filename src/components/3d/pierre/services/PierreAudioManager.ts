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
import { PIERRE } from '@config/assetPaths'

// Liste des sons disponibles
const SOUND_PATHS: Record<string, string> = {
  // Rubik's cube
  rubik_1: PIERRE.SOUNDS.RUBIK_1,
  rubik_2: PIERRE.SOUNDS.RUBIK_2,
  rubik_3: PIERRE.SOUNDS.RUBIK_3,

  // Victoire
  confetti: PIERRE.SOUNDS.CONFETTI,
  trophy: PIERRE.SOUNDS.TROPHY,
  trophy_platinum: PIERRE.SOUNDS.TROPHY_PLATINUM,
  partyblower: PIERRE.SOUNDS.PARTYBLOWER,

  // Tableau blanc
  marker_open: PIERRE.SOUNDS.MARKER_OPEN,
  eraser: PIERRE.SOUNDS.ERASER,

  // Transitions
  whoosh: PIERRE.SOUNDS.WHOOSH,
  whoosh_: PIERRE.SOUNDS.WHOOSH_,
  whoosh__: PIERRE.SOUNDS.WHOOSH__,
  whoosh___: PIERRE.SOUNDS.WHOOSH___,
  door: PIERRE.SOUNDS.DOOR,

  // Interface
  select1: PIERRE.SOUNDS.SELECT1,
  select2: PIERRE.SOUNDS.SELECT2,
  mouseclick: PIERRE.SOUNDS.MOUSECLICK,
  mouserelease: PIERRE.SOUNDS.MOUSERELEASE,

  // Arcade
  hit: PIERRE.SOUNDS.HIT,
  tetris: PIERRE.SOUNDS.TETRIS,
  die: PIERRE.SOUNDS.DIE,
  start: PIERRE.SOUNDS.START,

  // Footsteps
  footstep01: PIERRE.SOUNDS.FOOTSTEP_01,
  footstep02: PIERRE.SOUNDS.FOOTSTEP_02,
  footstep03: PIERRE.SOUNDS.FOOTSTEP_03,

  // Divers
  floral: PIERRE.SOUNDS.FLORAL,
  vase_break: PIERRE.SOUNDS.VASE_BREAK,
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

