import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { applyTerrainHeights, getTerrainHeight, getTerrainSurfaceY, getModelPosition } from '../src/components/garden/terrain/terrain.js'
import { createGrassMeshes, grassLayout } from '../src/components/garden/vegetation/grassGeometry.js'
import { TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_HALF_SIZE, TERRAIN_ORIGIN_LIMIT } from '../src/components/garden/terrain/gardenConfig.js'

test('model origins replace incoming Y with terrain height minus 0.01', () => {
  const position = [0, 999, 0]
  const grounded = getModelPosition(position)
  assert.deepEqual([grounded[0], grounded[2]], [0, 0])
  assert.ok(Math.abs(grounded[1] - (-0.06)) < 1e-8)
  for (const [x, z] of [[2, 2], [-2.13, 3.27], [0.8, -1.1]]) {
    assert.equal(getModelPosition([x, 999, z])[1], getTerrainSurfaceY(x, z) - 0.01)
  }
  assert.deepEqual(position, [0, 999, 0])
})

test('terrain sampling matches raycasts on both triangles, the clearing, and edges', () => {
  const geometry = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS)
  applyTerrainHeights(geometry)
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
  const ground = new THREE.Mesh(geometry, material)
  ground.rotation.x = -Math.PI / 2
  ground.updateMatrixWorld(true)
  const ray = new THREE.Raycaster()

  for (const [x, z] of [[2, 2], [2.1, 2.1], [2.4, 2.4], [2.25, 2.25], [-3.2, -2.9],
    [0, 0], [0.9, 1.1], [-1.1, -0.9], [24.999, 0], [-24.999, 0], [0, 24.999], [0, -24.999]]) {
    ray.set(new THREE.Vector3(x, 10, z), new THREE.Vector3(0, -1, 0))
    const [hit] = ray.intersectObject(ground)
    assert.ok(hit, `Expected ground at (${x}, ${z})`)
    assert.ok(Math.abs(getTerrainSurfaceY(x, z) - hit.point.y) < 1e-8)
    assert.ok(Math.abs(getModelPosition([x, 100, z])[1] - (hit.point.y - 0.01)) < 1e-8)
  }
  geometry.dispose()
  material.dispose()
})

test('tilted grass roots use the same terrain-relative origin at non-grid coordinates', () => {
  const position = [2.13, 500, -3.27]
  const grass = createGrassMeshes([{
    position,
    width: 0.02,
    segments: [0.03, 0.09, 0.06].map((height) => ({ height, angleX: 0.04, angleZ: -0.03 })),
  }])
  const matrix = new THREE.Matrix4()
  grass.meshes[0].getMatrixAt(0, matrix)
  const root = new THREE.Vector3(0, 0, 0).applyMatrix4(matrix)
  const expected = new THREE.Vector3(...getModelPosition(position))
  assert.ok(root.distanceTo(expected) < 1e-6)
  grass.dispose()
})

test('exact terrain boundaries return vertex heights and outside positions are rejected', () => {
  for (const [x, z] of [[25, 25], [-25, -25], [25, -25], [-25, 25], [0, -25]]) {
    assert.equal(getTerrainSurfaceY(x, z), Math.fround(getTerrainHeight(x, -z)))
  }
  assert.throws(() => getModelPosition([26, 0, 0]), RangeError)
})

test('grass layout stays within terrain bounds and leaves the central clearing open', () => {
  assert.ok(grassLayout.length > 0)
  for (const { position: [x, , z], segments } of grassLayout) {
    assert.ok(Math.abs(x) <= TERRAIN_HALF_SIZE && Math.abs(z) <= TERRAIN_HALF_SIZE)
    assert.ok(Math.abs(x) > TERRAIN_ORIGIN_LIMIT || Math.abs(z) > TERRAIN_ORIGIN_LIMIT)
    assert.equal(segments.length, 3)
    assert.ok(Math.abs(segments[0].height - (0.18 * 5 / 9.2 * 1.6)) < 1e-12)
    assert.ok(Math.abs(segments[1].height - (0.18 * 3.2 / 9.2)) < 1e-12)
    assert.ok(Math.abs(segments[2].height - (0.18 / 9.2)) < 1e-12)
  }
})

test('grass heights follow 8:3.2:1 and tilt increases by 6–10 degrees per segment', () => {
  for (const { segments } of grassLayout) {
    assert.ok(Math.abs(segments[0].height / segments[2].height - 8) < 1e-12)
    assert.ok(Math.abs(segments[1].height / segments[2].height - 3.2) < 1e-12)
    for (let index = 1; index < segments.length; index++) {
      const previous = segments[index - 1]
      const current = segments[index]
      assert.ok(Math.hypot(current.angleX, current.angleZ) > Math.hypot(previous.angleX, previous.angleZ))
      const step = Math.hypot(current.angleX - previous.angleX, current.angleZ - previous.angleZ)
      assert.ok(step >= THREE.MathUtils.degToRad(6) - 1e-12)
      assert.ok(step <= THREE.MathUtils.degToRad(10) + 1e-12)
    }
  }
})
