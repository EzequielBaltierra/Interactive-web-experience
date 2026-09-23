import { useEffect, useRef } from 'react'
import { useBeforePhysicsStep, useRapier } from '@react-three/rapier'
import * as THREE from 'three'

// The intact flower is controlled by dragging, not gravity. Its collider follows
// the visual transform so loose petals can still collide with planted flowers.
export default function useFlowerCollider(rootRef, enabled) {
  const { world, rapier } = useRapier()
  const bodyRef = useRef(null)
  const position = useRef(new THREE.Vector3())
  const rotation = useRef(new THREE.Quaternion())

  useEffect(() => {
    if (!enabled || !rootRef.current) return
    const root = rootRef.current
    root.updateWorldMatrix(true, true)
    root.getWorldPosition(position.current)
    root.getWorldQuaternion(rotation.current)
    const body = world.createRigidBody(rapier.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(...position.current.toArray()).setRotation(rotation.current))
    const worldToBody = new THREE.Matrix4().compose(
      position.current, rotation.current, new THREE.Vector3(1, 1, 1),
    ).invert()
    const point = new THREE.Vector3()
    root.traverse((mesh) => {
      if (!mesh.isMesh) return
      const transform = new THREE.Matrix4().multiplyMatrices(worldToBody, mesh.matrixWorld)
      const positions = mesh.geometry.attributes.position
      const vertices = new Float32Array(positions.count * 3)
      for (let index = 0; index < positions.count; index++) {
        point.fromBufferAttribute(positions, index).applyMatrix4(transform).toArray(vertices, index * 3)
      }
      const collider = rapier.ColliderDesc.convexHull(vertices)
      if (collider) world.createCollider(collider.setFriction(0.8), body)
    })
    bodyRef.current = body
    return () => {
      bodyRef.current = null
      if (world.getRigidBody(body.handle)) world.removeRigidBody(body)
    }
  }, [enabled, rootRef, world, rapier])

  useBeforePhysicsStep(() => {
    if (!bodyRef.current || !rootRef.current) return
    rootRef.current.getWorldPosition(position.current)
    rootRef.current.getWorldQuaternion(rotation.current)
    bodyRef.current.setNextKinematicTranslation(position.current)
    bodyRef.current.setNextKinematicRotation(rotation.current)
  })
}
