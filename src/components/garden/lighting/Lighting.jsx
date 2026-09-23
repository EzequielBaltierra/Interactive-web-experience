import { useRef } from 'react'
import { useHelper } from '@react-three/drei'
import * as THREE from 'three'

export default function Lighting() {
  const sunRef = useRef(null)

  useHelper(sunRef, THREE.DirectionalLightHelper, 1, 'gold')

  return (
    <>
      <hemisphereLight args={['#b9e7ff', '#405631', 1.2]} />
      <directionalLight
        ref={sunRef}
        position={[-24, 32, 20]}
        intensity={2.4}
        color="#fff0c2"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-camera-near={1}
        shadow-camera-far={75}
        shadow-bias={-0.00003}
        shadow-normalBias={0.003}
        shadow-radius={1.5}
      />
      <ambientLight intensity={0.25} color="#b8d8e8" />
    </>
  )
}
