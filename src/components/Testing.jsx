import { Suspense, useRef } from 'react'

import { Canvas, useFrame } from '@react-three/fiber'
import { Clone, GizmoHelper, GizmoViewport, GizmoViewcube, OrbitControls, useGLTF } from '@react-three/drei'
import WindAnimation from './garden/vegetation/WindAnimation.jsx'
import useTestingWind from './testing/useTestingWind.js'

// Radians per second on each axis; signed speeds give each object its own motion.
function useSpin(meshRef, [x, y, z]) {
  useFrame((state, delta) => {
    if (!meshRef.current) return

    meshRef.current.rotation.x += delta * x
    meshRef.current.rotation.y += delta * y
    meshRef.current.rotation.z += delta * z
  })
}

function Sphere() {
  const meshRef = useRef(null)
  useSpin(meshRef, [-0.1, 0.14, 0.06])
  useTestingWind(meshRef, 0.12)

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 25, 25]} />
      <meshStandardMaterial color="#cd7f32" wireframe />
    </mesh>
  )
}

function Box() {
  const meshRef = useRef(null)
  useSpin(meshRef, [0.07, -0.09, 0.04])
  useTestingWind(meshRef, 0.12)

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[5, 5, 5, 40, 40, 40]} />
      <meshStandardMaterial color="#cd7f32" wireframe />
    </mesh>
  )
}

function Model() {
  const { scene } = useGLTF('/assets/models/flowers/flower1/flower1_3.glb')
  const modelRef = useRef(null)

  useSpin(modelRef, [0.12, 0.18, -0.1])
  useTestingWind(modelRef, 0.025)

  return (
    <group ref={modelRef} scale={0.005}>
      <Clone object={scene} dispose={null} />
    </group>
  )
}

function TorusKnot() {
  const meshRef = useRef(null)
  useSpin(meshRef, [0.12, 0.05, -0.1])
  useTestingWind(meshRef, 0.12)

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[1.4, 0.5, 25, 25]} />
      <meshPhongMaterial color="silver" wireframe />
    </mesh>
  )
}

function TestObjects() {
  return (
    <>
      <directionalLight position={[2, 5, 10]} />
      <Box />
      <Sphere />
      <Suspense fallback={null}>
        <Model />
      </Suspense>
      <TorusKnot />
    </>
  )
}

function Testing() {
  return (
    <div id="testing" className="scene">
      <Canvas>
        <GizmoHelper alignment="bottom-right">
          <GizmoViewport />
          <GizmoViewcube />
        </GizmoHelper>
        <gridHelper args={[20, 20]} />
        <axesHelper args={[10]} />
        <OrbitControls />
        <WindAnimation />
        <TestObjects />
      </Canvas>
    </div>
  )
}

export default Testing
