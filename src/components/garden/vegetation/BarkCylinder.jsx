import { useLayoutEffect, useRef } from 'react'
import { useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { RigidBody } from '@react-three/rapier'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'
import { acquireTreeBark, releaseTreeBark } from './treeBarkResources.js'

export default function BarkCylinder({ position, rotation, topRadius, bottomRadius, height, sides }) {
  const groupRef = useRef(null)
  const [map, roughnessMap] = useLoader(THREE.TextureLoader, [
    '/assets/textures/rough-wood/rough_wood_diff_1k.jpg', '/assets/textures/rough-wood/rough_wood_rough_1k.jpg',
  ])
  const [normalMap] = useLoader(EXRLoader, ['/assets/textures/rough-wood/rough_wood_nor_gl_1k.exr'])

  useLayoutEffect(() => {
    const group = groupRef.current
    const material = acquireTreeBark(map, normalMap, roughnessMap)
    // Cylinder UVs already wrap the grain around the trunk and along its height.
    const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, sides)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    group.add(mesh)
    return () => {
      group.remove(mesh)
      geometry.dispose()
      releaseTreeBark(map)
    }
  }, [map, normalMap, roughnessMap, topRadius, bottomRadius, height, sides])

  return (
    <RigidBody type="fixed" colliders="hull" position={position} rotation={rotation}>
      <group ref={groupRef} />
    </RigidBody>
  )
}
