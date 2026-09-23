import * as THREE from 'three'
import { TERRAIN_HALF_SIZE, TERRAIN_SIZE, TERRAIN_ORIGIN_LIMIT } from '../terrain/gardenConfig.js'
import { getModelPosition } from '../terrain/terrain.js'
import { createWindMaterials } from './vegetationWind.js'

const CELL_SIZE = 1
const MODELS_PER_CELL = 14
const COLOR = '#43a349'
const MAX_HEIGHT = 0.3
const WIDTH_SCALE = 0.3
const SIZE_SCALE = 0.6
const BASE_SEGMENT_HEIGHT_MULTIPLIER = 1.6
const heightWeights = [5, 3.2, 1]
const totalHeightWeight = heightWeights.reduce((total, weight) => total + weight, 0)

function createGrassLayout() {
  const cellsPerSide = Math.ceil(TERRAIN_SIZE / CELL_SIZE)
  return Array.from({ length: cellsPerSide ** 2 * MODELS_PER_CELL }, (_, index) => {
    const cellIndex = Math.floor(index / MODELS_PER_CELL)
    const cellX = -TERRAIN_HALF_SIZE + (cellIndex % cellsPerSide) * CELL_SIZE
    const cellZ = -TERRAIN_HALF_SIZE + Math.floor(cellIndex / cellsPerSide) * CELL_SIZE
    const position = [cellX + Math.random() * CELL_SIZE, 0, cellZ + Math.random() * CELL_SIZE]

    if (Math.abs(position[0]) <= TERRAIN_ORIGIN_LIMIT && Math.abs(position[2]) <= TERRAIN_ORIGIN_LIMIT) {
      return null
    }

    // One bend direction per blade gives successive segments a coherent slant.
    const bendDirection = Math.random() * Math.PI * 2
    const baseTilt = THREE.MathUtils.degToRad(Math.random() * 5)
    const tiltStep = THREE.MathUtils.degToRad(6 + Math.random() * 4)

    return {
      position,
      width: (0.05 + Math.random() * 0.1) * WIDTH_SCALE * SIZE_SCALE,
      segments: heightWeights.map((weight, index) => ({
        // Extend only the base; keep the upper cylinder and tip at their existing sizes.
        height: weight / totalHeightWeight * MAX_HEIGHT * SIZE_SCALE
          * (index === 0 ? BASE_SEGMENT_HEIGHT_MULTIPLIER : 1),
        angleX: Math.cos(bendDirection) * (baseTilt + index * tiltStep),
        angleZ: Math.sin(bendDirection) * (baseTilt + index * tiltStep),
      })),
    }
  }).filter(Boolean)
}

// Data is generated once per module load; GPU resources belong to each mount.
export const grassLayout = createGrassLayout()


// Two crossed, connected ribbons keep blades visible from different angles.
// Each of the three height sections has a midpoint so wind bends smoothly.
export function createGrassBladeGeometry() {
  const heights = [8, 3.2, 1]
  const total = heights.reduce((sum, height) => sum + height, 0)
  const boundaries = [0, heights[0] / total, (heights[0] + heights[1]) / total, 1]
  const widths = [1, 0.8, 0.64, 0]
  const positions = []
  const uvs = []
  const weights = []
  const indices = []
  for (let ribbon = 0; ribbon < 2; ribbon++) {
    const start = positions.length / 3
    for (let row = 0; row <= 6; row++) {
      const segment = Math.min(Math.floor(row / 2), 2)
      const progress = row === 6 ? 1 : (row % 2) / 2
      const y = THREE.MathUtils.lerp(boundaries[segment], boundaries[segment + 1], progress)
      const halfWidth = THREE.MathUtils.lerp(widths[segment], widths[segment + 1], progress) / 2
      for (const side of [-1, 1]) {
        positions.push(ribbon === 0 ? side * halfWidth : 0, y, ribbon === 1 ? side * halfWidth : 0)
        uvs.push((side + 1) / 2, y)
        weights.push(y)
      }
      if (row < 6) {
        const a = start + row * 2
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('windWeight', new THREE.Float32BufferAttribute(weights, 1))
  geometry.setAttribute('windAnchor', new THREE.Float32BufferAttribute(new Float32Array(weights.length * 3), 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}


// Spatial batches trade a few draw calls for culling off-screen grass in both
// the main view and shadow pass. A single 50-unit batch was always submitted.
const GRASS_CHUNK_SIZE = 10

export function createGrassMeshes(layout) {
  const chunks = new Map()
  for (const blade of layout) {
    const key = Math.floor(blade.position[0] / GRASS_CHUNK_SIZE) + ':'
      + Math.floor(blade.position[2] / GRASS_CHUNK_SIZE)
    if (!chunks.has(key)) chunks.set(key, [])
    chunks.get(key).push(blade)
  }
  const { material, depthMaterial } = createWindMaterials({ color: COLOR, amplitude: 0.025, grass: true })
  const transform = new THREE.Object3D()
  const meshes = []

  for (const blades of chunks.values()) {
    const geometry = createGrassBladeGeometry()
    const mesh = new THREE.InstancedMesh(geometry, material, blades.length)
    const bend = new Float32Array(blades.length * 2)
    blades.forEach((blade, index) => {
      const height = blade.segments.reduce((sum, segment) => sum + segment.height, 0)
      const tip = blade.segments[blade.segments.length - 1]
      transform.position.fromArray(getModelPosition(blade.position))
      transform.rotation.set(0, Math.atan2(tip.angleX, tip.angleZ), 0)
      transform.scale.set(blade.width, height, blade.width)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
      bend[index * 2] = -Math.sin(tip.angleZ) * height
      bend[index * 2 + 1] = Math.sin(tip.angleX) * height
    })
    geometry.setAttribute('bladeBend', new THREE.InstancedBufferAttribute(bend, 2))
    mesh.instanceMatrix.needsUpdate = true
    mesh.customDepthMaterial = depthMaterial
    mesh.castShadow = true
    // Build a tight sphere from the batch box; repeated sphere unions can drift
    // and inflate the bounds enough to defeat useful spatial culling.
    mesh.computeBoundingBox()
    mesh.boundingSphere = mesh.boundingBox.getBoundingSphere(new THREE.Sphere())
    mesh.boundingSphere.radius += 0.15
    meshes.push(mesh)
  }
  return {
    meshes,
    dispose() {
      meshes.forEach((mesh) => {
        mesh.dispose()
        mesh.geometry.dispose()
      })
      material.dispose()
      depthMaterial.dispose()
    },
  }
}
