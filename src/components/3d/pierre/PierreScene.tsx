/**
 * PierreScene - Scène Pierre sans Canvas (pour intégration dans Canvas unique).
 *
 * Cette version de la scène Pierre est conçue pour être utilisée à l'intérieur
 * d'un Canvas partagé avec les autres niveaux. Elle gère:
 * - OrbitControls (activés uniquement quand level === 5)
 * - Post-processing (Outline, SMAA)
 * - Transitions caméra (GSAP legacy ou CameraControls R3F)
 *
 * Architecture R3F v1.1.0:
 * - Feature flag `useCameraControls` pour basculer entre GSAP et CameraControls
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
import { isFeatureEnabled } from '@config/featureFlags'
import { CameraSystem, getGlobalFlyToStageR3F } from './core/CameraSystem'
import { InteractionProvider, useInteractionContext, useHoveredObjects, BvhProvider, PostProcessingSystem } from './core'

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
  minAzimuthAngle: -Math.PI / 4,     // -45° - moins de rotation vers la droite (arcade)
  maxAzimuthAngle: Math.PI / 4,      // 45° - moins de rotation vers la gauche (whiteboard)
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
let globalFlyToStageLegacy: ((stage: PierreStage) => void) | null = null

/**
 * Retourne la fonction flyToStage appropriée selon le feature flag.
 * Compatible avec l'ancienne API.
 */
export function getGlobalFlyToStage() {
  // Si CameraControls R3F est activé, utiliser la nouvelle implémentation
  if (isFeatureEnabled('useCameraControls')) {
    return getGlobalFlyToStageR3F()
  }
  // Sinon, utiliser l'implémentation GSAP legacy
  return globalFlyToStageLegacy
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

  // Vider les outlines quand on entre dans une zone interactive - OK car pas d'objet R3F
  useEffect(() => {
    if (isInInteractiveZone) {
      setHoveredObjects([])
    }
  }, [isInInteractiveZone])

  const { camera } = useThree()
  // Stocker camera dans une ref pour éviter de l'avoir dans les deps des callbacks
  const cameraRef = useRef(camera)
  cameraRef.current = camera

  // Ref pour s'assurer que le setup n'est fait qu'une fois
  const isCameraSetupRef = useRef(false)

  // Setup caméra initial via useFrame (premier frame seulement)
  // Pattern R3F: pas de useEffect avec camera!
  useFrame(() => {
    if (isCameraSetupRef.current) return
    if (!setupCamera) {
      isCameraSetupRef.current = true
      return
    }

    isCameraSetupRef.current = true
    console.log('[PierreScene] 📷 Camera setup (once)')
    camera.position.copy(CAMERA_CONFIG.position)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = CAMERA_CONFIG.fov
      camera.updateProjectionMatrix()
    }
  })

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
   * IMPORTANT: Utilise cameraRef au lieu de camera pour éviter les re-renders.
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

      // Animation de la position - utiliser cameraRef.current (pas camera direct)
      gsap.to(cameraRef.current.position, {
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
    [isCameraMoving, setCurrentStage, setIsCameraMoving] // Supprimé camera des deps
  )

  // Exposer flyToStage globalement pour le bandeau (legacy GSAP)
  useEffect(() => {
    globalFlyToStageLegacy = flyToStage
    return () => {
      globalFlyToStageLegacy = null
    }
  }, [flyToStage])

  // Mettre à jour les contrôles à chaque frame
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update()
    }
  })

  // Détermine quel système utiliser
  const useCameraControlsR3F = isFeatureEnabled('useCameraControls')
  const useEventSystem = isFeatureEnabled('useEventSystem')

  // Fonction de sélection à passer au PierreWorld
  // Utilise le système R3F si activé, sinon GSAP legacy
  const handleSelect = useCameraControlsR3F ? getGlobalFlyToStageR3F() ?? flyToStage : flyToStage

  // Si le nouveau système d'événements est activé, utiliser le wrapper
  if (useEventSystem) {
    return (
      <InteractionProvider>
        <PierreSceneContent
          useCameraControlsR3F={useCameraControlsR3F}
          controlsRef={controlsRef}
          isInInteractiveZone={isInInteractiveZone}
          handleHover={handleHover}
          handleSelect={handleSelect}
        />
      </InteractionProvider>
    )
  }

  // Legacy: sans InteractionProvider
  return (
    <>
      {/* Éclairage spécifique Pierre */}
      <ambientLight intensity={1} />
      <directionalLight position={[40, 40, 40]} intensity={1} castShadow />

      {/* Système de caméra - R3F CameraControls ou OrbitControls legacy */}
      {useCameraControlsR3F ? (
        <CameraSystem
          initialPreset={{
            position: [-23, 17, 23],
            target: [0, 2.5, 0],
            fov: 20,
          }}
        />
      ) : (
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
      )}

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
      <PierreWorld onHover={handleHover} onSelect={handleSelect} />
    </>
  )
}

/**
 * PierreSceneContent - Contenu de la scène avec le nouveau système d'événements.
 * Utilise le contexte d'interaction pour l'outline.
 */
interface PierreSceneContentProps {
  useCameraControlsR3F: boolean
  controlsRef: React.RefObject<any>
  isInInteractiveZone: boolean
  handleHover: (objects: THREE.Object3D[]) => void
  handleSelect: (stage: PierreStage) => void
}

function PierreSceneContent({
  useCameraControlsR3F,
  controlsRef,
  isInInteractiveZone,
  handleHover,
  handleSelect,
}: PierreSceneContentProps) {
  // Utilise le hook du contexte pour les objets survolés
  const contextHoveredObjects = useHoveredObjects()
  const { setHoveredObjects: setContextHoveredObjects } = useInteractionContext()

  // Collecte les meshes d'un groupe (pour outline qui nécessite des Mesh, pas des Group)
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

  // Handler qui synchronise le contexte avec le state local
  const handleHoverWithContext = useCallback(
    (objects: THREE.Object3D[]) => {
      // Appeler le handler legacy pour maintenir la compatibilité
      handleHover(objects)
      // Synchroniser avec le contexte pour le nouveau PostProcessingSystem
      // IMPORTANT: Collecter les meshes car Outline nécessite des Mesh, pas des Group
      const meshes = collectMeshes(objects)
      setContextHoveredObjects(meshes)
    },
    [handleHover, setContextHoveredObjects, collectMeshes]
  )

  // Détermine si on utilise le nouveau système de post-processing
  const useNewPostProcessing = isFeatureEnabled('usePostProcessing')

  return (
    <>
      {/* Éclairage spécifique Pierre */}
      <ambientLight intensity={1} />
      <directionalLight position={[40, 40, 40]} intensity={1} castShadow />

      {/* Système de caméra - R3F CameraControls ou OrbitControls legacy */}
      {useCameraControlsR3F ? (
        <CameraSystem
          initialPreset={{
            position: [-23, 17, 23],
            target: [0, 2.5, 0],
            fov: 20,
          }}
        />
      ) : (
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
      )}

      {/* Post-processing - nouveau système ou legacy */}
      {useNewPostProcessing ? (
        <PostProcessingSystem />
      ) : (
        <EffectComposer autoClear={false}>
          <Outline
            selection={!isInInteractiveZone && contextHoveredObjects.length > 0 ? contextHoveredObjects : []}
            visibleEdgeColor={0xffffff}
            hiddenEdgeColor={0xffffff}
            edgeStrength={10}
            blendFunction={BlendFunction.SCREEN}
            xRay={true}
          />
          <SMAA />
        </EffectComposer>
      )}

      {/* Monde Pierre avec BVH pour raycasting optimisé */}
      <BvhProvider>
        <PierreWorld onHover={handleHoverWithContext} onSelect={handleSelect} />
      </BvhProvider>
    </>
  )
}

export default PierreScene
