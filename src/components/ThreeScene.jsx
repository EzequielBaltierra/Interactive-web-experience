import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Experience from '../scene/Experience.jsx'

function ThreeScene() {
  return (
    <section className="three-scene" aria-label="Interactive 3D scene">
      <Canvas
        camera={{ position: [0, 0.4, 5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      </Canvas>
    </section>
  )
}

export default ThreeScene