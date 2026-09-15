function Experience() {
  return (
    <>
      <color attach="background" args={['#0b1020']} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, 4, 4]} intensity={1.5} color="#f5d7a8" />
      <pointLight position={[-3, -1, 2]} intensity={0.8} distance={10} color="#7dd3fc" />
    </>
  )
}

export default Experience