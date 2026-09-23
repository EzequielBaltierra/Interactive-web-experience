import { useState } from 'react'
import { TERRAIN_HALF_SIZE } from '../terrain/gardenConfig.js'
import { getModelPosition } from '../terrain/terrain.js'
import Foliage from './Foliage.jsx'
import BarkCylinder from './BarkCylinder.jsx'

const TREE_COUNT = 160
const ORIGIN_CLEARANCE = 1.5
const TRUNK_HEIGHT = 0.4
const TRUNK_RADIUS = TRUNK_HEIGHT * 0.1
const CANOPY_RADIUS = 0.25

function getRandomTreeCoordinate() {
  const magnitude = ORIGIN_CLEARANCE + Math.random() * (TERRAIN_HALF_SIZE - ORIGIN_CLEARANCE)
  return Math.random() < 0.5 ? -magnitude : magnitude
}

// Positions stay fixed across scene remounts until the module reloads.
const treePositions = Array.from({ length: TREE_COUNT }, () => [
  getRandomTreeCoordinate(), 0, getRandomTreeCoordinate(),
])

function Branch({ direction }) {
  return (
    <>
      <BarkCylinder
        position={[0, TRUNK_HEIGHT * 0.45, direction * TRUNK_HEIGHT * 0.2]}
        rotation={[0, direction * Math.PI / 2, direction * Math.PI / 3]}
        topRadius={TRUNK_RADIUS * 0.24}
        bottomRadius={TRUNK_RADIUS * 0.48}
        height={TRUNK_HEIGHT / 2}
        sides={6}
      />
      <Foliage
        position={[direction * CANOPY_RADIUS * 0.4, TRUNK_HEIGHT * 0.9, direction * CANOPY_RADIUS * 0.2]}
        radius={CANOPY_RADIUS * 0.7}
      />
    </>
  )
}

export function Tree({ position = [0, 0, 0], scale = 1, objectId }) {
  // Each side has its own random decision, stable for this mounted tree.
  const [branchSides] = useState(() => [1, -1].filter(() => Math.random() > 0.5))

  return (
    <group
      name={objectId}
      position={getModelPosition(position)}
      scale={scale * 2}
    >
      <BarkCylinder
        position={[0, TRUNK_HEIGHT / 2, 0]}
        topRadius={TRUNK_RADIUS * 0.7}
        bottomRadius={TRUNK_RADIUS}
        height={TRUNK_HEIGHT}
        sides={8}
      />
      <Foliage position={[0, TRUNK_HEIGHT + CANOPY_RADIUS * 0.7, 0]} radius={CANOPY_RADIUS} />
      {branchSides.map((direction) => <Branch key={direction} direction={direction} />)}
    </group>
  )
}

export default function Trees() {
  return (
    <group>
      {treePositions.map((position, index) => {
        const objectId = `tree-${index}`
        return (
          <Tree
            key={objectId}
            objectId={objectId}
            position={position}
            scale={0.5 + (index % 3) * 0.25}
          />
        )
      })}
    </group>
  )
}
