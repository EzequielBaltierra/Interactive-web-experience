import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { createFlowerGrid } from '../src/components/garden/flowers/flowerGrid.js'
import { GARDEN_BED_SCALE } from '../src/components/garden/flowerbed/gardenBedModels.js'
import {
  FLOWER_INSPECTION_POSITION, FLOWER_MOVE_SPEED,
  getInspectionRootPosition, getLiftedFlowerY, isFlowerClearOfSoil,
} from '../src/components/garden/flowers/flowerPicking.js'

async function loadModel(path) {
  const bytes = await readFile(new URL(`../public/assets/models/${path}`, import.meta.url))
  return (await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '',
  )).scene
}

test('a downward drag cannot bury the flower farther; upward dragging tracks pointer height', () => {
  assert.equal(getLiftedFlowerY(0.015, 0.04, 0.02), 0.015)
  assert.ok(Math.abs(getLiftedFlowerY(0.015, 0.04, 0.06) - 0.035) < 1e-10)
})

test('actual flower bounds clear the actual soil only after the buried base is lifted out', async () => {
  const soil = await loadModel('garden-bed/Dirt.glb')
  const flower = await loadModel('flowers/flower1/flower1_3.glb')
  const samples = Array.from({ length: 12 }, (_, i) => [i % 2, (i % 3) / 2])
  for (const placement of createFlowerGrid(soil, flower, samples)) {
    const root = new THREE.Group()
    const model = flower.clone(true)
    model.scale.setScalar(placement.scale)
    model.position.fromArray(placement.modelOffset)
    root.add(model)
    root.position.fromArray(placement.position)
    const soilY = placement.position[1]
    let bounds = new THREE.Box3().setFromObject(root)
    assert.ok(bounds.min.y < soilY)
    assert.equal(isFlowerClearOfSoil(root.position.y, placement.bottomOffset, soilY), false)
    root.position.y -= placement.bottomOffset
    assert.equal(isFlowerClearOfSoil(root.position.y, placement.bottomOffset, soilY), false)
    root.position.y += 0.0002
    bounds = new THREE.Box3().setFromObject(root)
    assert.ok(bounds.min.y > soilY)
    assert.equal(isFlowerClearOfSoil(root.position.y, placement.bottomOffset, soilY), true)
  }
})

test('inspection centers the real flower at world [0,1,0], including bed scale and position', async () => {
  const soil = await loadModel('garden-bed/Dirt.glb')
  const flower = await loadModel('flowers/flower1/flower1_3.glb')
  const [placement] = createFlowerGrid(soil, flower, [[0.25, 0.75]])
  const bed = new THREE.Group()
  bed.position.set(3, -0.06, -2)
  bed.scale.setScalar(GARDEN_BED_SCALE)
  const root = new THREE.Group()
  const model = flower.clone(true)
  model.position.fromArray(placement.modelOffset)
  model.scale.setScalar(placement.scale)
  root.add(model)
  bed.add(root)
  root.position.copy(getInspectionRootPosition(bed, new THREE.Vector3(...placement.centerPosition)))
  const center = new THREE.Box3().setFromObject(bed).getCenter(new THREE.Vector3())
  assert.deepEqual(FLOWER_INSPECTION_POSITION.toArray(), [0, 1, 0])
  assert.ok(center.distanceTo(FLOWER_INSPECTION_POSITION) < 1e-8)
})

test('flower flight converges consistently at different frame rates', () => {
  const target = FLOWER_INSPECTION_POSITION.clone()
  const ends = [30, 60, 144].map((fps) => {
    const position = new THREE.Vector3(-0.3, 0.1, 0.4)
    for (let frame = 0; frame < fps * 3; frame++) {
      position.lerp(target, 1 - Math.exp(-FLOWER_MOVE_SPEED / fps))
    }
    assert.ok(position.distanceTo(target) < 0.00001)
    return position
  })
  assert.ok(ends[0].distanceTo(ends[2]) < 1e-10)
})
