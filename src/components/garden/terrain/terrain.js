import {
  TERRAIN_SIZE,
  TERRAIN_HALF_SIZE,
  TERRAIN_SEGMENTS,
  TERRAIN_ORIGIN_LIMIT,
  TERRAIN_NOISE_HEIGHT,
  TERRAIN_ORIGIN_NOISE_HEIGHT,
  TERRAIN_NOISE_SCALE,
} from './gardenConfig.js'

const MODEL_GROUND_OFFSET = -0.01
const GRID_SPACING = TERRAIN_SIZE / TERRAIN_SEGMENTS
const VERTICES_PER_SIDE = TERRAIN_SEGMENTS + 1

function terrainHash(x, z) {
  const value = Math.sin(x * 127.1 + z * 311.7) * 43758.5453
  return value - Math.floor(value)
}

function terrainNoise(x, z) {
  const cellX = Math.floor(x)
  const cellZ = Math.floor(z)
  const localX = x - cellX
  const localZ = z - cellZ
  const smoothedX = localX * localX * (3 - 2 * localX)
  const smoothedZ = localZ * localZ * (3 - 2 * localZ)
  const bottom = terrainHash(cellX, cellZ) * (1 - smoothedX)
    + terrainHash(cellX + 1, cellZ) * smoothedX
  const top = terrainHash(cellX, cellZ + 1) * (1 - smoothedX)
    + terrainHash(cellX + 1, cellZ + 1) * smoothedX

  return bottom * (1 - smoothedZ) + top * smoothedZ
}

export function getTerrainHeight(x, z) {
  const noiseHeight = Math.abs(x) <= TERRAIN_ORIGIN_LIMIT && Math.abs(z) <= TERRAIN_ORIGIN_LIMIT
    ? TERRAIN_ORIGIN_NOISE_HEIGHT
    : TERRAIN_NOISE_HEIGHT

  return (terrainNoise(x * TERRAIN_NOISE_SCALE, z * TERRAIN_NOISE_SCALE) - 0.5) * noiseHeight
}

// Rotating the plane -90 degrees around X maps local Y to -world Z and
// displacement to +world Y. Share Float32 heights with the rendered geometry.
const vertexHeights = Float32Array.from(
  { length: VERTICES_PER_SIDE ** 2 },
  (_, index) => {
    const x = (index % VERTICES_PER_SIDE) * GRID_SPACING - TERRAIN_HALF_SIZE
    const z = Math.floor(index / VERTICES_PER_SIDE) * GRID_SPACING - TERRAIN_HALF_SIZE
    return getTerrainHeight(x, -z)
  },
)

export function applyTerrainHeights(geometry) {
  const positions = geometry.attributes.position
  for (let index = 0; index < positions.count; index++) {
    positions.setZ(index, vertexHeights[index])
  }
  positions.needsUpdate = true
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  // Retain the previous shader's flat-plane normals and lighting appearance.
}

export function getTerrainSurfaceY(x, z) {
  if (!Number.isFinite(x) || !Number.isFinite(z)
    || Math.abs(x) > TERRAIN_HALF_SIZE || Math.abs(z) > TERRAIN_HALF_SIZE) {
    throw new RangeError('Model X/Z position must be within the terrain bounds.')
  }

  const gridX = (x + TERRAIN_HALF_SIZE) / GRID_SPACING
  const gridZ = (z + TERRAIN_HALF_SIZE) / GRID_SPACING
  const column = Math.min(Math.floor(gridX), TERRAIN_SEGMENTS - 1)
  const row = Math.min(Math.floor(gridZ), TERRAIN_SEGMENTS - 1)
  const localX = gridX - column
  const localZ = gridZ - row
  const topLeft = row * VERTICES_PER_SIDE + column
  const a = vertexHeights[topLeft]
  const b = vertexHeights[topLeft + VERTICES_PER_SIDE]
  const c = vertexHeights[topLeft + VERTICES_PER_SIDE + 1]
  const d = vertexHeights[topLeft + 1]

  // Match PlaneGeometry triangles (a,b,d) and (b,c,d), including the diagonal.
  if (localX + localZ <= 1) {
    return a + localX * (d - a) + localZ * (b - a)
  }
  return c + (1 - localX) * (b - c) + (1 - localZ) * (d - c)
}

export function getModelPosition([x, , z]) {
  return [x, getTerrainSurfaceY(x, z) + MODEL_GROUND_OFFSET, z]
}


