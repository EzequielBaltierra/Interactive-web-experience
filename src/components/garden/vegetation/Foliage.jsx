import { useLayoutEffect, useRef } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { acquireFoliageResources, releaseFoliageResources } from './foliageResources.js'

export default function Foliage({ position, radius }) {
  const groupRef = useRef(null)
  const alphaMap = useTexture('/assets/textures/foliage/foliage_alpha3.png')

  useLayoutEffect(() => {
    const group = groupRef.current
    const { geometry, material, depthMaterial } = acquireFoliageResources(alphaMap)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.customDepthMaterial = depthMaterial
    mesh.castShadow = true
    // Radial shading normals aren't the card surface normals. Receiving shadows
    // here produces noisy self-shadowing on overlapping, animated cutouts.
    // Keep canopy volume from lighting and cast the detailed mask onto the ground.
    mesh.receiveShadow = false
    group.add(mesh)
    return () => {
      group.remove(mesh)
      releaseFoliageResources(alphaMap)
    }
  }, [alphaMap])

  return <group ref={groupRef} position={position} scale={radius} />
}
