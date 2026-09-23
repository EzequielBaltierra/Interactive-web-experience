import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { RigidBody } from '@react-three/rapier'
import { TERRAIN_SIZE, TERRAIN_SEGMENTS } from './gardenConfig.js'
import { applyTerrainHeights } from './terrain.js'

const TERRAIN_COLOR = '#75a843'

export default function Ground() {
  const geometryRef = useRef(null)

  useLayoutEffect(() => {
    applyTerrainHeights(geometryRef.current)
  }, [])

  return (
    <RigidBody type="fixed" colliders="trimesh" friction={0.9}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry ref={geometryRef} args={[TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS]} />
        <meshStandardMaterial color={TERRAIN_COLOR} roughness={1} metalness={0} side={THREE.DoubleSide} />
      </mesh>
    </RigidBody>
  )
}
