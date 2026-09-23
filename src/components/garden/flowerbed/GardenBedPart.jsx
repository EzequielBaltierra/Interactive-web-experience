import { useLayoutEffect, useRef } from 'react'
import { useLoader } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'
import { createTexturedBedPart } from './gardenBedModels.js'

export default function GardenBedPart({ part }) {
  const groupRef = useRef(null)
  const { scene } = useGLTF(part.model)
  const roughnessIsEXR = part.roughness.endsWith('.exr')
  const [map, jpegRoughness] = useLoader(THREE.TextureLoader,
    roughnessIsEXR ? [part.color] : [part.color, part.roughness])
  const [normalMap, exrRoughness] = useLoader(EXRLoader,
    roughnessIsEXR ? [part.normal, part.roughness] : [part.normal])
  const roughnessMap = roughnessIsEXR ? exrRoughness : jpegRoughness

  useLayoutEffect(() => {
    const group = groupRef.current
    const model = createTexturedBedPart(scene, { map, normalMap, roughnessMap })
    group.add(model.scene)
    return () => {
      group.remove(model.scene)
      model.dispose()
    }
  }, [scene, map, normalMap, roughnessMap])

  return <group ref={groupRef} name={part.name} />
}
