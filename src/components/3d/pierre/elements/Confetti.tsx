/**
 * Confetti - Effet de particules pour célébration.
 *
 * Utilisé quand le Rubik's cube est résolu.
 * Particules colorées tombant avec gravité et rotation.
 *
 * Optimisé selon les best practices R3F:
 * - Utilise useRef au lieu de useState pour les updates dans useFrame
 * - Mutation directe des positions (pas de setState dans le render loop)
 * - Frame delta pour animation indépendante du framerate
 */

import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePierreStore } from '../stores/pierreStore'

// Configuration
const CONFETTI_COUNT = 150
const CONFETTI_COLORS = [
  0xff6b6b, // Rouge
  0x4ecdc4, // Turquoise
  0x45b7d1, // Bleu
  0x96ceb4, // Vert menthe
  0xffeaa7, // Jaune
  0xdfe6e9, // Blanc cassé
  0xfd79a8, // Rose
  0xa29bfe, // Lavande
]
const GRAVITY = -9.8
// Position du cube au centre quand en mode jeu
const CENTER_POS = { x: -16, y: 12.5, z: 16 }
const SPAWN_HEIGHT = CENTER_POS.y + 2
const SPAWN_RADIUS = 1.5
const DURATION = 3000 // ms

interface ParticleData {
  velocity: THREE.Vector3
  rotationSpeed: THREE.Vector3
}

/**
 * Composant Confetti avec InstancedMesh pour performance optimale.
 */
export function Confetti() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const isActiveRef = useRef(false)
  const startTimeRef = useRef(0)
  const particleDataRef = useRef<ParticleData[]>([])
  const dummyRef = useRef(new THREE.Object3D())

  const rubikSolved = usePierreStore((s) => s.rubikSolved)

  // Créer la géométrie et le matériau une seule fois
  const geometry = useMemo(() => new THREE.PlaneGeometry(0.08, 0.08), [])
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  }), [])

  // Initialiser les particules quand le cube est résolu
  useEffect(() => {
    if (rubikSolved && !isActiveRef.current && meshRef.current) {
      isActiveRef.current = true
      startTimeRef.current = Date.now()

      const mesh = meshRef.current
      const dummy = dummyRef.current
      const particleData: ParticleData[] = []

      for (let i = 0; i < CONFETTI_COUNT; i++) {
        // Position initiale aléatoire
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * SPAWN_RADIUS

        dummy.position.set(
          CENTER_POS.x + Math.cos(angle) * radius,
          SPAWN_HEIGHT + Math.random() * 2,
          CENTER_POS.z + Math.sin(angle) * radius
        )

        // Rotation initiale aléatoire
        dummy.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        )

        // Scale aléatoire
        const scale = 0.5 + Math.random() * 1
        dummy.scale.set(scale, scale, scale)

        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)

        // Couleur aléatoire
        const colorIndex = Math.floor(Math.random() * CONFETTI_COLORS.length)
        mesh.setColorAt(i, new THREE.Color(CONFETTI_COLORS[colorIndex]))

        // Stocker les données de vélocité
        particleData.push({
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 4,
            Math.random() * 2 + 2, // Éjection vers le haut
            (Math.random() - 0.5) * 4
          ),
          rotationSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8
          ),
        })
      }

      particleDataRef.current = particleData
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      mesh.visible = true
    }
  }, [rubikSolved])

  // Animation des particules - mutation directe, pas de setState
  useFrame((_, delta) => {
    if (!isActiveRef.current || !meshRef.current) return

    // Vérifier la durée
    if (Date.now() - startTimeRef.current > DURATION) {
      isActiveRef.current = false
      meshRef.current.visible = false
      return
    }

    const mesh = meshRef.current
    const dummy = dummyRef.current
    const particleData = particleDataRef.current
    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const rotation = new THREE.Euler()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const data = particleData[i]
      if (!data) continue

      // Récupérer la matrice actuelle
      mesh.getMatrixAt(i, matrix)
      matrix.decompose(position, quaternion, scale)
      rotation.setFromQuaternion(quaternion)

      // Appliquer la gravité à la vélocité
      data.velocity.y += GRAVITY * delta

      // Mettre à jour la position avec delta pour indépendance du framerate
      position.x += data.velocity.x * delta
      position.y += data.velocity.y * delta
      position.z += data.velocity.z * delta

      // Mettre à jour la rotation
      rotation.x += data.rotationSpeed.x * delta
      rotation.y += data.rotationSpeed.y * delta
      rotation.z += data.rotationSpeed.z * delta

      // Reconstruire la matrice
      dummy.position.copy(position)
      dummy.rotation.copy(rotation)
      dummy.scale.copy(scale)
      dummy.updateMatrix()

      mesh.setMatrixAt(i, dummy.matrix)
    }

    // Signaler que la matrice a été mise à jour
    mesh.instanceMatrix.needsUpdate = true
  })

  // Reset quand rubikSolved redevient false
  useEffect(() => {
    if (!rubikSolved) {
      isActiveRef.current = false
      if (meshRef.current) {
        meshRef.current.visible = false
      }
    }
  }, [rubikSolved])

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, CONFETTI_COUNT]}
      visible={false}
      frustumCulled={false}
    />
  )
}

export default Confetti
