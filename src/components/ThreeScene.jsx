import { Canvas } from '@react-three/fiber'
import { Leva, useControls } from 'leva'
import { Suspense, useRef } from 'react'
import { OrbitControls, useGLTF } from '@react-three/drei'

const petalFiles = Array.from({ length: 10 }, (_, index) => `/Petal1_${index + 1}.glb`)

function ModelPart({ src, name }) {
  const { scene } = useGLTF(src)
  const modelRef = useRef(null)

  return (
    <group ref={modelRef} name={name} position={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  )
}
function Flower1({ position }) {
  const { scene } = useGLTF('/flower1_3.glb')

  return (
    <group name="flower1" position={position}>
      <primitive object={scene} />
    </group>
  )
}
function FlowerParts({ position }) {
  return (
    <group name="flowerParts" position={position}>
      <group name="petalsOrigin">
        {petalFiles.map((src, index) => (
          <ModelPart key={src} src={src} name={`Petal1_${index + 1}`} />
        ))}
      </group>

      <group name="stemOrigin">
        <ModelPart src="/Stem1.glb" name="Stem1" />
      </group>
    </group>
  )
}

function CameraRig() {
  const { orbit } = useControls('Camera', {
    orbit: true,
  })
  return (
      <OrbitControls enabled={orbit} />
  )
}


function ThreeScene() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Leva collapsed={false} />
    <section className="three-scene" aria-label="Interactive 3D scene">
      <Canvas
        camera={{ position: [0, 0, 50], fov: 75, near: 0.1, far: 1000 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          <Flower1 position={[-25, 0, 0]} />
          <FlowerParts position={[25, 0, 0]} />
        </Suspense>
        <CameraRig />
      </Canvas>
    </section>
    </div>
  )
}

export default ThreeScene