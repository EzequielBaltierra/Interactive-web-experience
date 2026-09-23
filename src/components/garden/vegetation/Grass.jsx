import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createGrassMeshes, grassLayout } from './grassGeometry.js'
import { TERRAIN_FOG_FAR } from '../terrain/gardenConfig.js'

export default function Grass() {
  const groupRef = useRef(null)
  const cameraDirection = useRef(new THREE.Vector3())
  const relativeCenter = useRef(new THREE.Vector3())

  useFrame(({ camera }) => {
    camera.getWorldDirection(cameraDirection.current)
    for (const mesh of groupRef.current.children) {
      // Instance positions are in garden/world coordinates. Skip only batches
      // entirely beyond the fog's view-depth limit, including their sway bounds.
      relativeCenter.current.copy(mesh.boundingSphere.center).sub(camera.position)
      const nearestDepth = relativeCenter.current.dot(cameraDirection.current) - mesh.boundingSphere.radius
      mesh.visible = nearestDepth < TERRAIN_FOG_FAR
    }
  })

  useLayoutEffect(() => {
    const group = groupRef.current
    const grass = createGrassMeshes(grassLayout)
    group.add(...grass.meshes)

    return () => {
      group.remove(...grass.meshes)
      grass.dispose()
    }
  }, [])

  return <group ref={groupRef} name="grassGrid" />
}
