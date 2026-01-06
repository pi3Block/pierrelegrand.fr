/**
 * ShootingSystem - Système de tir à la troisième personne (TPS)
 * Le cube est éjecté depuis le torse du personnage et va en direction
 * du réticule (centre de l'écran) via raycasting.
 */

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useGameStore } from '@stores/gameStore'

interface Projectile {
  id: number
  position: THREE.Vector3
  velocity: THREE.Vector3
  createdAt: number
}

const PROJECTILE_SPEED = 20
const PROJECTILE_LIFETIME = 5000 // 5 secondes
const SHOOT_COOLDOWN = 200 // 200ms entre chaque tir
const MAX_PROJECTILES = 20 // Limite pour les performances
const DEFAULT_TARGET_DISTANCE = 100 // Distance par défaut si pas d'intersection

/**
 * Système de tir TPS principal.
 * Utilise la position du personnage depuis le store et calcule la direction
 * via raycasting depuis le centre de l'écran.
 */
export function ShootingSystem() {
  const [projectiles, setProjectiles] = useState<Projectile[]>([])
  const nextIdRef = useRef(0)
  const lastShootRef = useRef(0)
  const { camera, scene } = useThree()

  // Position du personnage depuis le store
  const characterPosition = useGameStore((state) => state.characterPosition)

  // Vecteurs réutilisables pour éviter les allocations
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const screenCenter = useMemo(() => new THREE.Vector2(0, 0), [])
  const targetPoint = useMemo(() => new THREE.Vector3(), [])
  const direction = useMemo(() => new THREE.Vector3(), [])
  const spawnPosition = useMemo(() => new THREE.Vector3(), [])
  const charPosVec = useMemo(() => new THREE.Vector3(), [])

  /**
   * Calcule le point cible 3D depuis le centre de l'écran via raycasting.
   * Filtre les intersections pour ne garder que celles DEVANT le personnage.
   * Si aucune intersection valide, utilise un point sur le ray à DEFAULT_TARGET_DISTANCE mètres.
   */
  const getTargetPoint = useCallback((): THREE.Vector3 => {
    // Raycast depuis le centre de l'écran (0, 0 en coordonnées normalisées)
    raycaster.setFromCamera(screenCenter, camera)

    // Distance caméra -> personnage (pour filtrer les objets entre les deux)
    const charPos = characterPosition
    charPosVec.set(charPos.x, charPos.y + 0.5, charPos.z)
    const distCameraToChar = camera.position.distanceTo(charPosVec)

    // Trouver les intersections avec le monde
    // Filtrer : exclure projectiles ET objets plus proches que le personnage
    const intersects = raycaster.intersectObjects(scene.children, true).filter(
      (hit) => 
        !hit.object.name.startsWith('projectile') &&
        hit.distance > distCameraToChar + 0.5 // +0.5m de marge
    )

    const firstIntersect = intersects[0]
    if (firstIntersect) {
      // Point d'intersection le plus proche (mais devant le personnage)
      return targetPoint.copy(firstIntersect.point)
    }

    // Pas d'intersection valide : utiliser un point SUR LE RAY à DEFAULT_TARGET_DISTANCE mètres
    // Cela garantit l'alignement avec le centre de l'écran même avec caméra over-the-shoulder
    return raycaster.ray.at(DEFAULT_TARGET_DISTANCE, targetPoint)
  }, [camera, scene, raycaster, screenCenter, targetPoint, characterPosition, charPosVec])

  /**
   * Gestion du tir TPS.
   * 1. Vérifie que le pointer est locké
   * 2. Récupère la position du personnage
   * 3. Calcule le point cible via raycasting
   * 4. Calcule la direction du tir
   * 5. Crée le projectile
   */
  const handleShoot = useCallback(() => {
    // Ne tirer que si le pointer est verrouillé (évite tir au clic pour entrer dans le jeu)
    if (!document.pointerLockElement) return

    const now = Date.now()
    if (now - lastShootRef.current < SHOOT_COOLDOWN) return

    // Limite de projectiles pour les performances
    if (projectiles.length >= MAX_PROJECTILES) return

    lastShootRef.current = now

    // Position de spawn : torse du personnage (légèrement devant)
    const charPos = characterPosition
    spawnPosition.set(charPos.x, charPos.y + 0.5, charPos.z)

    // Calculer le point cible via raycasting depuis le centre de l'écran
    const target = getTargetPoint()

    // Direction du tir : du personnage vers le point cible
    direction.subVectors(target, spawnPosition).normalize()

    // Petit offset vers l'avant pour éviter l'auto-collision
    const offsetSpawn = spawnPosition.clone().add(direction.clone().multiplyScalar(0.8))

    // Vélocité du projectile
    const velocity = direction.clone().multiplyScalar(PROJECTILE_SPEED)

    const newProjectile: Projectile = {
      id: nextIdRef.current++,
      position: offsetSpawn,
      velocity,
      createdAt: now,
    }

    setProjectiles((prev) => [...prev, newProjectile])
  }, [characterPosition, getTargetPoint, projectiles.length, spawnPosition, direction])

  // Event listeners pour le clic et la touche F
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Clic gauche uniquement
      if (e.button === 0) {
        handleShoot()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Touche F pour tirer
      if (e.key === 'f' || e.key === 'F') {
        handleShoot()
      }
    }

    window.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleShoot])

  // Nettoyage des projectiles expirés (optimisé : pas à chaque frame)
  const lastCleanupRef = useRef(0)
  useFrame(() => {
    const now = Date.now()
    // Nettoyer toutes les 500ms maximum
    if (now - lastCleanupRef.current > 500) {
      lastCleanupRef.current = now
      setProjectiles((prev) =>
        prev.filter((p) => now - p.createdAt < PROJECTILE_LIFETIME)
      )
    }
  })

  return (
    <>
      {projectiles.map((projectile) => (
        <ProjectileCube
          key={projectile.id}
          initialPosition={projectile.position}
          initialVelocity={projectile.velocity}
          onRemove={() =>
            setProjectiles((prev) => prev.filter((p) => p.id !== projectile.id))
          }
        />
      ))}
    </>
  )
}

interface ProjectileCubeProps {
  initialPosition: THREE.Vector3
  initialVelocity: THREE.Vector3
  onRemove: () => void
}

/**
 * Composant de projectile physique.
 * Cube orange avec effet émissif, géré par Rapier.
 */
function ProjectileCube({ initialPosition, initialVelocity, onRemove }: ProjectileCubeProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const hasSetVelocity = useRef(false)

  useFrame(() => {
    if (rigidBodyRef.current && !hasSetVelocity.current) {
      rigidBodyRef.current.setLinvel(
        { x: initialVelocity.x, y: initialVelocity.y, z: initialVelocity.z },
        true
      )
      hasSetVelocity.current = true
    }

    // Supprimer si trop bas (tombé dans le vide)
    if (rigidBodyRef.current) {
      const pos = rigidBodyRef.current.translation()
      if (pos.y < -10) {
        onRemove()
      }
    }
  })

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[initialPosition.x, initialPosition.y, initialPosition.z]}
      colliders="cuboid"
      restitution={0.5}
      friction={0.5}
      mass={0.5}
      name="projectile"
    >
      <mesh castShadow name="projectile-mesh">
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={0.3}
        />
      </mesh>
    </RigidBody>
  )
}
