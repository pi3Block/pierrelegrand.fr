/**
 * PierreScene - Scène Pierre sans Canvas (pour intégration dans Canvas unique).
 *
 * Cette version de la scène Pierre est conçue pour être utilisée à l'intérieur
 * d'un Canvas partagé avec les autres niveaux. Elle gère:
 * - OrbitControls (activés uniquement quand level === 5)
 * - Post-processing (Outline, SMAA)
 * - Transitions caméra GSAP
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Outline, SMAA } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import gsap from 'gsap'
import { usePierreStore, type PierreStage } from './stores/pierreStore'
import { PierreWorld } from './PierreWorld'

// Configuration de la caméra et des positions
const CAMERA_CONFIG = {
  fov: 20,
  position: new THREE.Vector3(-23, 17, 23),
  target: new THREE.Vector3(0, 2.5, 0),
}

// Configuration des OrbitControls
const ORBIT_CONFIG = {
  enableDamping: true,
  dampingFactor: 0.05,
  rotateSpeed: 0.4,
  zoomSpeed: 1,
  minDistance: 2,
  maxDistance: 35,
  minPolarAngle: Math.PI / 6,
  maxPolarAngle: Math.PI / 2,
  minAzimuthAngle: -Math.PI / 2,
  maxAzimuthAngle: Math.PI * 2,
}

// Positions des zones interactives (caméra)
const STAGE_POSITIONS: Record<PierreStage, { position: THREE.Vector3; target: THREE.Vector3 }> = {
  default: {
    position: new THREE.Vector3(-23, 17, 23),
    target: new THREE.Vector3(0, 2.5, 0),
  },
  arcadeMachine: {
    position: new THREE.Vector3(-4.5, 5.5, 2.3009),
    target: new THREE.Vector3(3.25776, 2.74209, 2.3009),
  },
  leftMonitor: {
    position: new THREE.Vector3(1.06738, 2.60725, -1.6),
    target: new THREE.Vector3(1.06738, 2.50725, -4.23009),
  },
  rightMonitor: {
    position: new THREE.Vector3(2.13997, 2.60716, -1.53751),
    target: new THREE.Vector3(2.47898, 2.50716, -4.14566),
  },
  whiteboard: {
    position: new THREE.Vector3(-3.3927, 5.18774, 4.61366),
    target: new THREE.Vector3(-3.3927, 3.18774, -4.61366),
  },
  rubikGroup: {
    // Caméra reste en place, target vers la position du cube au centre de la vue
    position: new THREE.Vector3(-23, 17, 23),
    target: new THREE.Vector3(-16, 12.5, 16),
  },
  hubPortal: {
    position: new THREE.Vector3(-23, 17, 23),
    target: new THREE.Vector3(0, 2.5, 0),
  },
  hub: {
    position: new THREE.Vector3(-23, 17, 23),
    target: new THREE.Vector3(0, 2.5, 0),
  },
}

// Positions de caméra ajustées pour mobile (plus éloignées pour voir tout l'écran)
const STAGE_POSITIONS_MOBILE: Partial<Record<PierreStage, { position: THREE.Vector3; target: THREE.Vector3 }>> = {
  leftMonitor: {
    position: new THREE.Vector3(1.06738, 2.60725, 2.5),
    target: new THREE.Vector3(1.06738, 2.50725, -4.23009),
  },
  rightMonitor: {
    position: new THREE.Vector3(2.13997, 2.60716, 2.6),
    target: new THREE.Vector3(2.47898, 2.50716, -4.14566),
  },
}

// Store global pour exposer flyToStage depuis le bandeau
let globalFlyToStage: ((stage: PierreStage) => void) | null = null

export function getGlobalFlyToStage() {
  return globalFlyToStage
}

interface PierreSceneProps {
  /** Si true, setup la caméra pour la vue Pierre */
  setupCamera?: boolean
}

/**
 * Scène Pierre - À utiliser à l'intérieur d'un Canvas partagé.
 */
export function PierreScene({ setupCamera = true }: PierreSceneProps) {
  const controlsRef = useRef<any>(null)
  const [hoveredObjects, setHoveredObjects] = useState<THREE.Object3D[]>([])

  // currentStage pour savoir si on est en vue default ou focalisé sur un élément
  const currentStage = usePierreStore((s) => s.currentStage)
  const setCurrentStage = usePierreStore((s) => s.setCurrentStage)
  const isCameraMoving = usePierreStore((s) => s.isCameraMoving)
  const setIsCameraMoving = usePierreStore((s) => s.setIsCameraMoving)

  // Désactiver l'outline quand on est focalisé sur un élément (pas en default)
  const isInInteractiveZone = currentStage !== 'default'

  // Vider les outlines quand on entre dans une zone interactive
  useEffect(() => {
    if (isInInteractiveZone) {
      setHoveredObjects([])
    }
  }, [isInInteractiveZone])

  const { camera } = useThree()

  // Setup caméra au montage (une seule fois)
  useEffect(() => {
    if (setupCamera) {
      camera.position.copy(CAMERA_CONFIG.position)
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = CAMERA_CONFIG.fov
        camera.updateProjectionMatrix()
      }
    }

    // Reset au démontage
    return () => {
      setCurrentStage('default')
      setIsCameraMoving(false)
    }
  }, [camera, setupCamera, setCurrentStage, setIsCameraMoving])

  /**
   * Collecte tous les meshes d'un groupe pour l'OutlinePass.
   */
  const collectMeshes = useCallback((objects: THREE.Object3D[]): THREE.Object3D[] => {
    const meshes: THREE.Object3D[] = []
    objects.forEach((obj) => {
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          meshes.push(child)
        }
      })
    })
    return meshes
  }, [])

  /**
   * Gère le hover sur les éléments interactifs.
   * Désactivé quand on est dans une zone interactive.
   */
  const handleHover = useCallback(
    (objects: THREE.Object3D[]) => {
      // Désactiver l'outline quand on est focalisé sur un élément
      if (isInInteractiveZone) {
        setHoveredObjects([])
        return
      }

      if (objects.length === 0) {
        setHoveredObjects([])
      } else {
        const meshes = collectMeshes(objects)
        setHoveredObjects(meshes)
      }
    },
    [collectMeshes, isInInteractiveZone]
  )

  /**
   * Transition de la caméra vers une zone spécifique.
   * Utilise les positions mobile si disponibles sur mobile.
   */
  const flyToStage = useCallback(
    (stage: PierreStage) => {
      if (isCameraMoving) {
        return
      }

      // Détection mobile directe pour éviter les closures stale
      const isMobileNow = window.innerWidth < 768

      // Debug: vérifier si isMobile est détecté
      console.log('[flyToStage] isMobileNow:', isMobileNow, 'stage:', stage, 'window.innerWidth:', window.innerWidth)

      // Utiliser les positions mobile si disponibles, sinon les positions desktop
      const mobileConfig = isMobileNow ? STAGE_POSITIONS_MOBILE[stage] : undefined
      const stageConfig = mobileConfig || STAGE_POSITIONS[stage]

      console.log('[flyToStage] Using config:', mobileConfig ? 'MOBILE' : 'DESKTOP', stageConfig?.position)

      if (!stageConfig) {
        return
      }

      setIsCameraMoving(true)
      // Mettre à jour le stage IMMÉDIATEMENT pour que RubiksCube sache qu'on est en mode rubikGroup
      setCurrentStage(stage)

      // Désactiver les contrôles pendant la transition
      if (controlsRef.current) {
        controlsRef.current.enableDamping = false
        controlsRef.current.enabled = false
      }

      // Animation de la position
      gsap.to(camera.position, {
        x: stageConfig.position.x,
        y: stageConfig.position.y,
        z: stageConfig.position.z,
        duration: 1,
        ease: 'sine.out',
      })

      // Animation du target
      if (controlsRef.current) {
        gsap.to(controlsRef.current.target, {
          x: stageConfig.target.x,
          y: stageConfig.target.y,
          z: stageConfig.target.z,
          duration: 1,
          ease: 'sine.out',
          onComplete: () => {
            setIsCameraMoving(false)

            // Réactiver les contrôles seulement si on revient à default
            if (stage === 'default' && controlsRef.current) {
              controlsRef.current.enableDamping = true
              controlsRef.current.enabled = true
            }
          },
        })
      }
    },
    [camera, isCameraMoving, setCurrentStage, setIsCameraMoving]
  )

  // Exposer flyToStage globalement pour le bandeau
  useEffect(() => {
    globalFlyToStage = flyToStage
    return () => {
      globalFlyToStage = null
    }
  }, [flyToStage])

  // Mettre à jour les contrôles à chaque frame
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update()
    }
  })

  return (
    <>
      {/* Éclairage spécifique Pierre */}
      <ambientLight intensity={1} />
      <directionalLight position={[40, 40, 40]} intensity={1} castShadow />

      {/* OrbitControls */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping={ORBIT_CONFIG.enableDamping}
        dampingFactor={ORBIT_CONFIG.dampingFactor}
        rotateSpeed={ORBIT_CONFIG.rotateSpeed}
        zoomSpeed={ORBIT_CONFIG.zoomSpeed}
        minDistance={ORBIT_CONFIG.minDistance}
        maxDistance={ORBIT_CONFIG.maxDistance}
        minPolarAngle={ORBIT_CONFIG.minPolarAngle}
        maxPolarAngle={ORBIT_CONFIG.maxPolarAngle}
        minAzimuthAngle={ORBIT_CONFIG.minAzimuthAngle}
        maxAzimuthAngle={ORBIT_CONFIG.maxAzimuthAngle}
        target={CAMERA_CONFIG.target}
      />

      {/* Post-processing - outline désactivé en mode interactif */}
      <EffectComposer autoClear={false}>
        <Outline
          selection={!isInInteractiveZone && hoveredObjects.length > 0 ? hoveredObjects : []}
          visibleEdgeColor={0xffffff}
          hiddenEdgeColor={0xffffff}
          edgeStrength={10}
          blendFunction={BlendFunction.SCREEN}
          xRay={true}
        />
        <SMAA />
      </EffectComposer>

      {/* Monde Pierre */}
      <PierreWorld onHover={handleHover} onSelect={flyToStage} />
    </>
  )
}

export default PierreScene
