import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import RAPIER from '@dimforge/rapier3d-compat'
import { createFlowerPart, flowerPartModels } from '../src/components/garden/flowers/flowerParts.js'
import { gardenBedParts, GARDEN_BED_SCALE } from '../src/components/garden/flowerbed/gardenBedModels.js'
import { applyTerrainHeights, getModelPosition, getTerrainSurfaceY } from '../src/components/garden/terrain/terrain.js'
import { TERRAIN_SIZE, TERRAIN_SEGMENTS } from '../src/components/garden/terrain/gardenConfig.js'

async function loadModel(path) {
  const bytes = await readFile(new URL(`../public${path}`, import.meta.url))
  return (await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '',
  )).scene
}

test('stem and ten independent petals retain the complete flower bounds and cached geometry', async () => {
  const models = flowerPartModels.flower1
  assert.equal(models.petals.length, 10)
  const complete = await loadModel('/assets/models/flowers/flower1/flower1_3.glb')
  const expected = new THREE.Box3().setFromObject(complete, true)
  const assembly = new THREE.Group()
  const resources = []
  for (const path of [models.stem, ...models.petals]) {
    const scene = await loadModel(path)
    const before = new THREE.Box3().setFromObject(scene, true)
    const part = createFlowerPart(scene)
    const group = new THREE.Group()
    group.position.fromArray(part.center)
    part.meshes.forEach(({ geometry, material }) => group.add(new THREE.Mesh(geometry, material)))
    const after = new THREE.Box3().setFromObject(group, true)
    assert.ok(before.min.distanceTo(after.min) < 0.00005)
    assert.ok(before.max.distanceTo(after.max) < 0.00005)
    assert.ok(new THREE.Box3().setFromObject(scene, true).equals(before))
    assembly.add(group)
    resources.push(part)
  }
  const actual = new THREE.Box3().setFromObject(assembly, true)
  assert.ok(actual.min.distanceTo(expected.min) < 0.00005)
  assert.ok(actual.max.distanceTo(expected.max) < 0.00005)
  resources.forEach((part) => part.dispose())
})

test('detached petal hulls collide with each other, the bed, and the displaced terrain', async () => {
  await RAPIER.init()
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
  const events = new RAPIER.EventQueue(true)
  const ground = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS)
  applyTerrainHeights(ground)
  ground.rotateX(-Math.PI / 2)
  world.createCollider(RAPIER.ColliderDesc.trimesh(
    ground.attributes.position.array, Uint32Array.from(ground.index.array),
  ).setFriction(0.9))
  ground.dispose()
  const bedPosition = getModelPosition([0, 0, 0])
  for (const part of gardenBedParts) {
    const scene = await loadModel(part.model)
    scene.updateMatrixWorld(true)
    scene.traverse((mesh) => {
      if (!mesh.isMesh) return
      const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld)
      geometry.scale(GARDEN_BED_SCALE, GARDEN_BED_SCALE, GARDEN_BED_SCALE)
      geometry.translate(...bedPosition)
      const indices = geometry.index ? Uint32Array.from(geometry.index.array)
        : Uint32Array.from({ length: geometry.attributes.position.count }, (_, i) => i)
      world.createCollider(RAPIER.ColliderDesc.trimesh(geometry.attributes.position.array, indices).setFriction(0.9))
      geometry.dispose()
    })
  }
  const part = createFlowerPart(await loadModel(flowerPartModels.flower1.petals[0]))
  const vertices = Float32Array.from(part.meshes[0].geometry.attributes.position.array, (value) => value * 0.0024)
  const bodies = []
  const colliders = []
  for (const y of [0.8, 1.1]) {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, y, 0))
    const collider = world.createCollider(RAPIER.ColliderDesc.convexHull(vertices)
      .setFriction(0.8).setRestitution(0.08).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS), body)
    body.setBodyType(RAPIER.RigidBodyType.Dynamic, true)
    body.enableCcd(true)
    body.lockRotations(true, true)
    bodies.push(body)
    colliders.push(collider.handle)
  }
  const groundPetal = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(1, 1, 0).lockRotations().setCcdEnabled(true))
  world.createCollider(RAPIER.ColliderDesc.convexHull(vertices).setFriction(0.9), groundPetal)
  let petalsCollided = false
  let hitBed = false
  for (let frame = 0; frame < 600; frame++) {
    world.step(events)
    events.drainCollisionEvents((a, b, started) => {
      if (!started) return
      if (colliders.includes(a) && colliders.includes(b)) petalsCollided = true
      else if (colliders.includes(a) || colliders.includes(b)) hitBed = true
    })
  }
  assert.ok(petalsCollided, 'petals should collide with other petals')
  assert.ok(hitBed, 'petals should collide with the bed')
  for (const body of bodies) {
    assert.ok(body.translation().y > 0.11 && body.translation().y < 0.3)
    assert.ok(Math.abs(body.linvel().y) < 0.01)
  }
  const terrainY = getTerrainSurfaceY(groundPetal.translation().x, groundPetal.translation().z)
  assert.ok(groundPetal.translation().y > terrainY && groundPetal.translation().y < terrainY + 0.1)
  assert.ok(Math.abs(groundPetal.linvel().y) < 0.01)
  part.dispose()
  events.free()
  world.free()
})
