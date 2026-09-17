import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { useGLTF, OrbitControls } from '@react-three/drei';

function Model() {
  const { scene } = useGLTF('/flower1.glb');
  
  return <primitive object={scene} scale={1} position={[0, 0, 0]} />;
}

function ThreeScene() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
    <section className="three-scene" aria-label="Interactive 3D scene">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75, near: 0.1, far: 1000 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          <Model />
        </Suspense>
        <OrbitControls />
      </Canvas>
    </section>
    </div>
  )
}

export default ThreeScene