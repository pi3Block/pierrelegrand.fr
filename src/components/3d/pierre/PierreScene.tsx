/**
 * PierreScene - Scène Pierre sans Canvas (pour intégration dans Canvas unique).
 *
 * Cette version de la scène Pierre est conçue pour être utilisée à l'intérieur
 * d'un Canvas partagé avec les autres niveaux. Elle gère:
 * - CameraControls (drei) pour les transitions fluides
 * - Post-processing (Outline, SMAA)
 * - Système d'événements optimisé avec BVH
 *
 * Architecture R3F v1.1.0 - Code legacy GSAP supprimé
 */

import { useRef, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { type PierreStage } from './stores/pierreStore'
import { PierreWorld } from './PierreWorld'
import { CameraSystem, getGlobalFlyToStageR3F } from './core/CameraSystem'
import {
  InteractionProvider,
  useInteractionContext,
  BvhProvider,
  PostProcessingSystem,
} from './core'

// Configuration de la caméra
const CAMERA_CONFIG = {
  fov: 20,
  position: new THREE.Vector3(-23, 17, 23),
  target: new THREE.Vector3(0, 2.5, 0),
}

/**
 * Retourne la fonction flyToStage globale.
 * Utilisé par PierreBanner pour naviguer.
 */
export function getGlobalFlyToStage() {
  return getGlobalFlyToStageR3F()
}

interface PierreSceneProps {
  /** Si true, setup la caméra pour la vue Pierre */
  setupCamera?: boolean
}

/**
 * Scène Pierre - À utiliser à l'intérieur d'un Canvas partagé.
 */
export function PierreScene({ setupCamera = true }: PierreSceneProps) {
  const { camera } = useThree()

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

  // Fonction de sélection - utilise le nouveau système CameraControls
  const handleSelect = getGlobalFlyToStageR3F()

  return (
    <InteractionProvider>
      <PierreSceneContent handleSelect={handleSelect ?? (() => {})} />
    </InteractionProvider>
  )
}

/**
 * PierreSceneContent - Contenu de la scène avec le système d'événements.
 * Utilise le contexte d'interaction pour l'outline.
 */
interface PierreSceneContentProps {
  handleSelect: (stage: PierreStage) => void
}

function PierreSceneContent({ handleSelect }: PierreSceneContentProps) {
  // Utilise le hook du contexte pour gérer les objets survolés
  const { setHoveredObjects } = useInteractionContext()

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

  // Handler pour le hover - synchronise avec le contexte pour l'outline
  const handleHover = useCallback(
    (objects: THREE.Object3D[]) => {
      // Collecter les meshes car Outline nécessite des Mesh, pas des Group
      const meshes = collectMeshes(objects)
      setHoveredObjects(meshes)
    },
    [setHoveredObjects, collectMeshes]
  )

  return (
    <>
      {/* Fond bleu permanent */}
      <color attach="background" args={['#1a1a2e']} />

      {/* Éclairage spécifique Pierre */}
      <ambientLight intensity={1} />
      <directionalLight position={[40, 40, 40]} intensity={1} castShadow />

      {/* Système de caméra R3F avec CameraControls */}
      <CameraSystem
        initialPreset={{
          position: [-23, 17, 23],
          target: [0, 2.5, 0],
          fov: 20,
        }}
      />

      {/* Post-processing avec outline automatique */}
      <PostProcessingSystem />

      {/* Monde Pierre avec BVH pour raycasting optimisé */}
      <BvhProvider>
        <PierreWorld onHover={handleHover} onSelect={handleSelect} />
      </BvhProvider>
    </>
  )
}

export default PierreScene
