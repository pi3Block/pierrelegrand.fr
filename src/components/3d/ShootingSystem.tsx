/**
 * ShootingSystem - Système de tir à la troisième personne (TPS) avec charge.
 * Le cube est éjecté depuis le torse du personnage et va en direction
 * du réticule (centre de l'écran) via raycasting.
 * 
 * Système de charge:
 * - Maintenir le clic pour charger le tir
 * - Plus la charge est haute, plus le projectile est rapide et gros
 * - Charge limitée à 90% pour éviter les tirs excessifs
 * - Relâcher pour tirer
 * 
 * Optimisations collision:
 * - CCD (Continuous Collision Detection) activé pour éviter le tunneling
 * - Vitesse max réduite à 50 pour garantir les collisions
 * - Damping appliqué pour ralentir progressivement les projectiles
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
  /** Niveau de charge (0-1) pour la taille du projectile */
  chargeLevel: number
}

// Configuration du système de charge
const CHARGE_TIME_MS = 1500 // Temps pour atteindre charge max (1.5s)
const MIN_SPEED = 20 // Vitesse minimum (sans charge)
const MAX_SPEED = 50 // Vitesse maximum (charge complète) - réduite pour éviter le tunneling
const MIN_SIZE = 0.25 // Taille minimum du cube
const MAX_SIZE = 0.6 // Taille maximum du cube (chargé)
const MIN_MASS = 0.3 // Masse minimum
const MAX_MASS = 1.5 // Masse maximum (réduite pour éviter les collisions trop puissantes)
const MAX_CHARGE_LEVEL = 0.9 // Plafond de charge à 90% pour éviter les tirs excessifs

const PROJECTILE_LIFETIME = 5000 // 5 secondes
const MAX_PROJECTILES = 20 // Limite pour les performances
const DEFAULT_TARGET_DISTANCE = 100 // Distance par défaut si pas d'intersection

/**
 * Système de tir TPS principal avec charge.
 * Utilise la position du personnage depuis le store et calcule la direction
 * via raycasting depuis le centre de l'écran.
 */
export function ShootingSystem() {
  const [projectiles, setProjectiles] = useState<Projectile[]>([])
  const nextIdRef = useRef(0)
  const { camera, scene } = useThree()

  // Refs pour le système de charge
  const isChargingRef = useRef(false)
  const chargeStartTimeRef = useRef(0)
  const currentChargeRef = useRef(0)

  // Position du personnage et actions charge depuis le store
  const characterPosition = useGameStore((state) => state.characterPosition)
  const setChargeState = useGameStore((state) => state.setChargeState)

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
   */
  const getTargetPoint = useCallback((): THREE.Vector3 => {
    raycaster.setFromCamera(screenCenter, camera)

    const charPos = characterPosition
    charPosVec.set(charPos.x, charPos.y + 0.5, charPos.z)
    const distCameraToChar = camera.position.distanceTo(charPosVec)

    const intersects = raycaster.intersectObjects(scene.children, true).filter(
      (hit) =>
        !hit.object.name.startsWith('projectile') &&
        hit.distance > distCameraToChar + 0.5
    )

    const firstIntersect = intersects[0]
    if (firstIntersect) {
      return targetPoint.copy(firstIntersect.point)
    }

    return raycaster.ray.at(DEFAULT_TARGET_DISTANCE, targetPoint)
  }, [camera, scene, raycaster, screenCenter, targetPoint, characterPosition, charPosVec])

  /**
   * Tire un projectile avec la charge actuelle.
   * Appelé au relâchement du clic.
   */
  const fireProjectile = useCallback((chargeLevel: number) => {
    if (!document.pointerLockElement) return
    if (projectiles.length >= MAX_PROJECTILES) return

    // Calcul de la vitesse basée sur la charge
    const speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * chargeLevel

    // Position de spawn : torse du personnage
    const charPos = characterPosition
    spawnPosition.set(charPos.x, charPos.y + 0.5, charPos.z)

    // Calculer le point cible via raycasting
    const target = getTargetPoint()

    // Direction du tir
    direction.subVectors(target, spawnPosition).normalize()

    // Offset vers l'avant pour éviter l'auto-collision
    const offsetSpawn = spawnPosition.clone().add(direction.clone().multiplyScalar(0.8))

    // Vélocité du projectile basée sur la charge
    const velocity = direction.clone().multiplyScalar(speed)

    const newProjectile: Projectile = {
      id: nextIdRef.current++,
      position: offsetSpawn,
      velocity,
      createdAt: Date.now(),
      chargeLevel,
    }

    setProjectiles((prev) => [...prev, newProjectile])
  }, [characterPosition, getTargetPoint, projectiles.length, spawnPosition, direction])

  /**
   * Début de la charge (mousedown).
   */
  const startCharging = useCallback(() => {
    if (!document.pointerLockElement) return

    isChargingRef.current = true
    chargeStartTimeRef.current = Date.now()
    currentChargeRef.current = 0
    setChargeState({ isCharging: true, chargeLevel: 0 })
  }, [setChargeState])

  /**
   * Fin de la charge et tir (mouseup).
   */
  const stopChargingAndFire = useCallback(() => {
    if (!isChargingRef.current) return

    const chargeLevel = currentChargeRef.current
    isChargingRef.current = false
    currentChargeRef.current = 0
    setChargeState({ isCharging: false, chargeLevel: 0 })

    // Tirer avec la charge accumulée
    fireProjectile(chargeLevel)
  }, [fireProjectile, setChargeState])

  // Event listeners pour mousedown/mouseup et touche F
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        startCharging()
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        stopChargingAndFire()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Touche F pour tir instantané (charge 0)
      if (e.key === 'f' || e.key === 'F') {
        fireProjectile(0)
      }
    }

    // Annuler la charge si on perd le focus
    const handleBlur = () => {
      if (isChargingRef.current) {
        isChargingRef.current = false
        currentChargeRef.current = 0
        setChargeState({ isCharging: false, chargeLevel: 0 })
      }
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('blur', handleBlur)
    }
  }, [startCharging, stopChargingAndFire, fireProjectile, setChargeState])

  // Mise à jour de la charge et nettoyage des projectiles
  const lastCleanupRef = useRef(0)
  useFrame(() => {
    const now = Date.now()

    // Mise à jour de la charge si en cours
    if (isChargingRef.current) {
      const elapsed = now - chargeStartTimeRef.current
      const newCharge = Math.min(MAX_CHARGE_LEVEL, elapsed / CHARGE_TIME_MS)

      // Utiliser un seuil pour éviter les updates excessives
      if (Math.abs(newCharge - currentChargeRef.current) > 0.01) {
        currentChargeRef.current = newCharge
        setChargeState({ chargeLevel: newCharge })
      }
    }

    // Nettoyage des projectiles expirés (toutes les 500ms)
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
          chargeLevel={projectile.chargeLevel}
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
  chargeLevel: number
  onRemove: () => void
}

/**
 * Composant de projectile physique.
 * La taille, masse et couleur varient selon le niveau de charge.
 */
function ProjectileCube({ initialPosition, initialVelocity, chargeLevel, onRemove }: ProjectileCubeProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const hasSetVelocity = useRef(false)

  // Calcul des propriétés basées sur la charge
  const size = MIN_SIZE + (MAX_SIZE - MIN_SIZE) * chargeLevel
  const mass = MIN_MASS + (MAX_MASS - MIN_MASS) * chargeLevel

  // Couleur qui passe de orange à rouge vif selon la charge
  const color = useMemo(() => {
    const hue = 30 - chargeLevel * 30 // Orange (30) -> Rouge (0)
    const saturation = 80 + chargeLevel * 20 // Plus saturé
    const lightness = 50 + chargeLevel * 10 // Plus lumineux
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }, [chargeLevel])

  // Intensité émissive selon la charge
  const emissiveIntensity = 0.3 + chargeLevel * 0.7

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
      mass={mass}
      name="projectile"
      ccd={true}
      linearDamping={0.1}
      angularDamping={0.1}
    >
      <mesh castShadow name="projectile-mesh">
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
    </RigidBody>
  )
}
