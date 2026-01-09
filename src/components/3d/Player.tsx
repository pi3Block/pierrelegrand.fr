import { useAnimations, useGLTF, useTexture, Trail } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import Ecctrl from 'ecctrl'
import { useGame } from 'ecctrl'
import { useGameStore } from '@stores/gameStore'
import { Suspense, useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { HUB } from '@config/assetPaths'

const CHARACTER_URL = HUB.MODELS.FLOATING_CHARACTER
const GRADIENT_TEXTURE_URL = HUB.TEXTURES.GRADIENT_3

// Animation set - les noms doivent correspondre aux animations dans le GLB
const animationSet = {
  idle: 'Idle',
  walk: 'Walk',
  run: 'Run',
  jump: 'Jump_Start',
  jumpIdle: 'Jump_Idle',
  jumpLand: 'Jump_Land',
  fall: 'Climbing',
  action1: 'Wave',
  action2: 'Dance',
  action3: 'Cheer',
  action4: 'Attack(1h)',
}

interface PlayerProps {
  position?: [number, number, number]
}

export function Player({ position = [0, 2, 0] }: PlayerProps) {
  const hasDebug = useGameStore((s) => s.hasFeature('debug_mode'))

  return (
    <Ecctrl
      position={position}
      // Dimensions du personnage
      capsuleHalfHeight={0.35}
      capsuleRadius={0.3}
      floatHeight={0.3}
      // Mouvement
      maxVelLimit={8}
      turnSpeed={15}
      sprintMult={2}
      jumpVel={5}
      // Caméra - Vue over-the-shoulder droite (TPS)
      camInitDis={-4}
      camMaxDis={-8}
      camMinDis={-2}
      camUpLimit={1.2}
      camLowLimit={-0.5}
      camTargetPos={{ x: -1.2, y: 0.3, z: 0 }}
      camCollision
      camCollisionOffset={0.5}
      // Mode
      mode="CameraBasedMovement"
      // Animation
      animated
      // Debug
      debug={hasDebug}
    >
      <CharacterModel />
    </Ecctrl>
  )
}

// Couleurs du personnage
const MAIN_COLOR = 'mediumslateblue'
const OUTLINE_COLOR = 'black'
const TRAIL_COLOR = 'violet'

// Composant du modèle 3D avec animations gérées manuellement et style toon
function CharacterModel() {
  const group = useRef<THREE.Group>(null)
  const { nodes, animations } = useGLTF(CHARACTER_URL)
  const { actions } = useAnimations(animations, group)

  // Texture pour le toon shading
  const gradientTexture = useTexture(GRADIENT_TEXTURE_URL)
  gradientTexture.minFilter = THREE.NearestFilter
  gradientTexture.magFilter = THREE.NearestFilter
  gradientTexture.generateMipmaps = false

  // Matériaux toon
  const outlineMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR, transparent: true }),
    []
  )
  const toonMaterial = useMemo(
    () => new THREE.MeshToonMaterial({ color: MAIN_COLOR, gradientMap: gradientTexture, transparent: true }),
    [gradientTexture]
  )

  // Store ecctrl pour les animations
  const curAnimation = useGame((state) => state.curAnimation)
  const resetAnimation = useGame((state) => state.reset)
  const initializeAnimationSet = useGame((state) => state.initializeAnimationSet)

  // Store pour publier la position du personnage (système de tir TPS)
  const setCharacterPosition = useGameStore((state) => state.setCharacterPosition)
  const worldPosition = useMemo(() => new THREE.Vector3(), [])
  const lastPosition = useRef({ x: 0, y: 0, z: 0 })

  // Publier la position du personnage uniquement si elle a changé significativement
  // Evite les re-renders infinis causés par setState dans useFrame
  useFrame(() => {
    if (!group.current) return
    group.current.getWorldPosition(worldPosition)

    // Seuil de 0.01 pour éviter les micro-updates
    const dx = Math.abs(worldPosition.x - lastPosition.current.x)
    const dy = Math.abs(worldPosition.y - lastPosition.current.y)
    const dz = Math.abs(worldPosition.z - lastPosition.current.z)

    if (dx > 0.01 || dy > 0.01 || dz > 0.01) {
      lastPosition.current = {
        x: worldPosition.x,
        y: worldPosition.y,
        z: worldPosition.z,
      }
      setCharacterPosition(lastPosition.current)
    }
  })

  // Initialiser le set d'animations au montage
  useEffect(() => {
    initializeAnimationSet(animationSet)
  }, [initializeAnimationSet])

  // Appliquer les matériaux toon au modèle
  useEffect(() => {
    if (!group.current) return

    group.current.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        if (child.name === 'outline') {
          child.material = outlineMaterial
        } else if (child.name === 'PrototypePete') {
          child.material = toonMaterial
          child.castShadow = true
          child.receiveShadow = true
        }
      }
    })
  }, [outlineMaterial, toonMaterial])

  // Jouer l'animation courante
  useEffect(() => {
    const action = actions[curAnimation ? curAnimation : animationSet.idle]
    if (!action) return

    // Pour jump, jumpLand et actions, jouer une fois
    if (
      curAnimation === animationSet.jump ||
      curAnimation === animationSet.jumpLand ||
      curAnimation === animationSet.action1 ||
      curAnimation === animationSet.action2 ||
      curAnimation === animationSet.action3 ||
      curAnimation === animationSet.action4
    ) {
      action.reset().fadeIn(0.2).setLoop(THREE.LoopOnce, 1).play()
      action.clampWhenFinished = true
    } else {
      action.reset().fadeIn(0.2).play()
    }

    // Reset quand l'animation est terminée
    const onFinished = () => resetAnimation()
    const mixer = action.getMixer()
    mixer.addEventListener('finished', onFinished)

    return () => {
      action.fadeOut(0.2)
      mixer.removeEventListener('finished', onFinished)
    }
  }, [curAnimation, actions, resetAnimation])

  // Trouver les noeuds du modèle
  const typedNodes = nodes as Record<string, THREE.Object3D | THREE.SkinnedMesh | THREE.Bone>
  const bodyBone = typedNodes.Body as THREE.Bone | undefined

  return (
    <Suspense fallback={null}>
      <group ref={group} dispose={null}>
        <group name="Scene" scale={0.8} position={[0, -0.6, 0]}>
          <group name="KayKit_Animated_Character">
            {/* Outline mesh */}
            {typedNodes.outline && (
              <skinnedMesh
                name="outline"
                geometry={(typedNodes.outline as THREE.SkinnedMesh).geometry}
                material={outlineMaterial}
                skeleton={(typedNodes.outline as THREE.SkinnedMesh).skeleton}
              />
            )}
            {/* Main character mesh */}
            {typedNodes.PrototypePete && (
              <skinnedMesh
                name="PrototypePete"
                geometry={(typedNodes.PrototypePete as THREE.SkinnedMesh).geometry}
                material={toonMaterial}
                skeleton={(typedNodes.PrototypePete as THREE.SkinnedMesh).skeleton}
                castShadow
                receiveShadow
              />
            )}
            {/* Trail effect */}
            {bodyBone && (
              <Trail width={1.5} color={TRAIL_COLOR} length={1.5} attenuation={(width) => width}>
                <primitive object={bodyBone} />
              </Trail>
            )}
          </group>
        </group>
      </group>
    </Suspense>
  )
}

// Preload du modèle
useGLTF.preload(CHARACTER_URL)
