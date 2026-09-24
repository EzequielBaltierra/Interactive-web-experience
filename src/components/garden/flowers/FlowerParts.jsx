import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { RigidBody, useRapier } from '@react-three/rapier'
import { createFlowerPart, flowerPartModels } from './flowerParts.js'

function FlowerPart({ scene, name, removable = false, onPicked }) {
  const bodyRef = useRef(null)
  const meshesRef = useRef(null)
  const removed = useRef(false)
  const [detached, setDetached] = useState(false)
  const { rapier } = useRapier()
  const center = useMemo(() => new THREE.Box3().setFromObject(scene)
    .getCenter(new THREE.Vector3()).toArray(), [scene])

  useLayoutEffect(() => {
    const group = meshesRef.current
    const resource = createFlowerPart(scene)
    const meshes = resource.meshes.map(({ geometry, material }) => {
      const mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = mesh.receiveShadow = true
      group.add(mesh)
      return mesh
    })
    return () => {
      meshes.forEach((mesh) => group.remove(mesh))
      resource.dispose()
    }
  }, [scene])

  const detach = (event) => {
    event.stopPropagation()
    // Orbit drags must not pluck petals on release.
    if (!removable || removed.current || event.delta > 4 || !bodyRef.current) return
    removed.current = true
    const body = bodyRef.current
    body.setBodyType(rapier.RigidBodyType.Dynamic, true)
    const length = Math.hypot(center[0], center[2]) || 1
    body.setLinvel({ x: center[0] / length * 0.12, y: -0.03, z: center[2] / length * 0.12 }, true)
    body.setAngvel({ x: 0.7, y: 0.25, z: -0.45 }, true)
    setDetached(true)
    onPicked?.()
  }

  return (
    <RigidBody
      ref={bodyRef}
      name={name}
      type={detached ? 'dynamic' : 'fixed'}
      position={center}
      colliders="hull"
      ccd
      restitution={0.08}
      friction={0.8}
      linearDamping={0.4}
      angularDamping={1.5}
      onClick={detach}
      dispose={null}
    >
      <group ref={meshesRef} />
      {/* The rendered petal triangles are its precise clickable hitbox.
          Physics uses a convex hull, so falling petals remain inexpensive. */}
    </RigidBody>
  )
}

export default function FlowerParts({ flowerType, position, scale, onPetalProgress }) {
  const models = flowerPartModels[flowerType]
  const loaded = useGLTF([models.stem, ...models.petals])
  const pickedPetalCount = useRef(0)

  const countPickedPetal = () => {
    // Each FlowerPart guards against repeated clicks on an already detached petal.
    pickedPetalCount.current += 1
    onPetalProgress?.(pickedPetalCount.current, models.petals.length)
  }
  return (
    <group position={position} scale={scale}>
      {loaded.map(({ scene }, index) => (
        <FlowerPart
          key={index}
          scene={scene}
          name={index === 0 ? 'Stem1' : `Petal1_${index}`}
          removable={index > 0}
          onPicked={countPickedPetal}
        />
      ))}
    </group>
  )
}

Object.values(flowerPartModels).forEach(({ stem, petals }) => {
  useGLTF.preload([stem, ...petals])
})
