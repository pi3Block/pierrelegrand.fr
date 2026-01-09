/**
 * GalleryRoom - Charge le modele GLTF de la galerie avec collisions Rapier.
 *
 * Utilise le modele scene.glb de joan-art-gallery avec texture baked KTX2.
 * Les murs sont detectes automatiquement et des colliders sont generes.
 */

import { useMemo, useEffect, useRef } from 'react'
import { useGLTF, useKTX2 } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { useHelper } from '@react-three/drei'
import * as THREE from 'three'

// Chemins vers les assets
const GALLERY_MODEL_PATH = '/assets/models/scene.glb'
const BAKED_TEXTURE_PATH = '/assets/baked/baked.ktx2'
const BASIS_PATH = '/basis/'

/**
 * GalleryRoom - Environnement 3D de la galerie charge depuis GLTF.
 */
export function GalleryRoom() {
  const { scene } = useGLTF(GALLERY_MODEL_PATH)
  const bakedTexture = useKTX2(BAKED_TEXTURE_PATH, BASIS_PATH)

  // Configurer la texture baked - drei/useKTX2 gere flipY automatiquement
  useEffect(() => {
    if (bakedTexture) {
      bakedTexture.colorSpace = THREE.SRGBColorSpace
      bakedTexture.needsUpdate = true
    }
  }, [bakedTexture])

  // Creer le materiau baked
  const bakedMaterial = useMemo(() => {
    if (!bakedTexture) return null
    return new THREE.MeshBasicMaterial({
      map: bakedTexture,
    })
  }, [bakedTexture])

  // Cloner la scene et appliquer le materiau baked + logger les infos de debug
  const clonedScene = useMemo(() => {
    const clone = scene.clone()

    // DEBUG: Log les infos de la scene
    console.log('=== GALLERY ROOM DEBUG ===')
    console.log('Scene children:', clone.children.map(c => ({ name: c.name, type: c.type })))

    // Calculer la bounding box
    const box = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    console.log('Bounding Box Size:', size)
    console.log('Bounding Box Center:', center)
    console.log('Bounding Box Min:', box.min)
    console.log('Bounding Box Max:', box.max)

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        // DEBUG: Log chaque mesh avec sa position
        console.log(`Mesh: ${mesh.name}, Position:`, mesh.position, 'Rotation:', mesh.rotation)

        // Appliquer le materiau baked uniquement s'il est pret
        if (bakedMaterial) {
          mesh.material = bakedMaterial
        }
        mesh.receiveShadow = true
        mesh.castShadow = true
      }
    })
    console.log('=========================')
    return clone
  }, [scene, bakedMaterial])

  // Ref pour le groupe et le box helper
  const groupRef = useRef<THREE.Group>(null)

  return (
    <group name="gallery-room" ref={groupRef}>
      {/* Modele de la galerie avec collider trimesh pour les murs */}
      <RigidBody type="fixed" colliders="trimesh">
        <primitive object={clonedScene} />
      </RigidBody>

      {/* DEBUG: Box3Helper pour visualiser les bounds */}
      <primitive object={new THREE.BoxHelper(clonedScene, 0xff0000)} />

      {/* Eclairage de la galerie */}
      <GalleryLighting />
    </group>
  )
}

/**
 * Eclairage de la galerie.
 */
function GalleryLighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[512, 512]}
      />
      {/* Lumieres d'ambiance pour les tableaux */}
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#fff5e6" />
      <pointLight position={[0, 3, -10]} intensity={0.3} color="#e6f0ff" />
      <pointLight position={[-8, 3, 0]} intensity={0.2} color="#ffe6f0" />
      <pointLight position={[8, 3, 0]} intensity={0.2} color="#e6fff0" />
    </>
  )
}

// Preload du modele
useGLTF.preload(GALLERY_MODEL_PATH)

export default GalleryRoom
