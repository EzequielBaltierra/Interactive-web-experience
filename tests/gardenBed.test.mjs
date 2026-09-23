import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'
import { createTexturedBedPart, gardenBedParts, GARDEN_BED_SCALE } from '../src/components/garden/flowerbed/gardenBedModels.js'
import { getModelPosition } from '../src/components/garden/terrain/terrain.js'

async function readAsset(path) {
  const bytes = await readFile(new URL(`../public${path}`, import.meta.url))
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}

async function loadModel(path) {
  const gltf = await new GLTFLoader().parseAsync(await readAsset(path), '')
  return gltf.scene
}

test('separate bed models retain assembly bounds, local transforms, and parent placement', async () => {
  const assembly = new THREE.Group()
  const instances = []
  for (const part of gardenBedParts) {
    const source = await loadModel(part.model)
    const model = createTexturedBedPart(source, {})
    const before = new THREE.Box3().setFromObject(source)
    const after = new THREE.Box3().setFromObject(model.scene)
    assert.ok(before.min.distanceTo(after.min) < 1e-8)
    assert.ok(before.max.distanceTo(after.max) < 1e-8)
    source.traverse((object) => {
      if (object.isMesh) assert.equal(object.geometry.attributes.uv, undefined)
    })
    model.scene.traverse((object) => {
      if (!object.isMesh) return
      const uv = object.geometry.attributes.uv
      assert.equal(uv.count, object.geometry.attributes.position.count)
      assert.ok(uv.array.every(Number.isFinite))
      assert.ok(uv.array.some((value) => value !== 0))
    })
    assembly.add(model.scene)
    instances.push(model)
  }
  assembly.position.fromArray(getModelPosition([2, 999, 2]))
  assembly.scale.setScalar(GARDEN_BED_SCALE)
  assembly.updateMatrixWorld(true)
  // Recorded assembly bounds retain the regression check without a duplicate GLB.
  const expected = new THREE.Box3(
    new THREE.Vector3(-0.054, 0.000003, -0.054),
    new THREE.Vector3(0.054, 0.022, 0.055),
  ).applyMatrix4(assembly.matrixWorld)
  const actual = new THREE.Box3().setFromObject(assembly)
  assert.ok(actual.min.distanceTo(expected.min) < 1e-7)
  assert.ok(actual.max.distanceTo(expected.max) < 1e-7)
  instances.forEach((model) => model.dispose())
})

test('all assigned bed textures exist and EXR maps decode successfully', async () => {
  const loader = new EXRLoader()
  for (const part of gardenBedParts) {
    for (const path of [part.color, part.normal, part.roughness]) {
      const buffer = await readAsset(path)
      assert.ok(buffer.byteLength > 0)
      if (path.endsWith('.exr')) {
        const decoded = loader.parse(buffer)
        assert.ok(decoded.width > 0 && decoded.height > 0)
        assert.ok(decoded.data.length > 0)
      }
    }
  }
})

test('part textures use independent settings and clean up without disposing cached assets', async () => {
  const source = await loadModel('/assets/models/garden-bed/Dirt.glb')
  const map = new THREE.Texture()
  const normalMap = new THREE.Texture()
  const roughnessMap = new THREE.Texture()
  let cachedDisposals = 0
  for (const texture of [map, normalMap, roughnessMap]) {
    texture.addEventListener('dispose', () => cachedDisposals++)
  }
  const model = createTexturedBedPart(source, { map, normalMap, roughnessMap })
  let ownedDisposals = 0
  model.scene.traverse((object) => {
    if (!object.isMesh) return
    assert.notEqual(object.material.map, map)
    assert.equal(object.material.map.colorSpace, THREE.SRGBColorSpace)
    assert.equal(object.material.normalMap.colorSpace, THREE.NoColorSpace)
    assert.equal(object.material.map.wrapS, THREE.RepeatWrapping)
    for (const texture of [object.material.map, object.material.normalMap, object.material.roughnessMap]) {
      texture.addEventListener('dispose', () => ownedDisposals++)
    }
  })
  model.dispose()
  assert.equal(ownedDisposals, 3)
  assert.equal(cachedDisposals, 0)
  assert.equal(map.wrapS, THREE.ClampToEdgeWrapping)
})
