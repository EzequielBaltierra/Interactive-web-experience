import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { createGrassBladeGeometry, createGrassMeshes, grassLayout } from '../src/components/garden/vegetation/grassGeometry.js'
import { createFoliageGeometry } from '../src/components/garden/vegetation/foliageGeometry.js'
import { createWindMaterials, windUniforms } from '../src/components/garden/vegetation/vegetationWind.js'
import { acquireFoliageResources, releaseFoliageResources } from '../src/components/garden/vegetation/foliageResources.js'

test('grass ribbons share section vertices, preserve 8:3.2:1 heights, and pin roots', () => {
  const geometry = createGrassBladeGeometry()
  const position = geometry.attributes.position
  assert.equal(position.count, 28)
  assert.equal(geometry.index.count, 72)
  for (const offset of [0, 14]) {
    assert.equal(position.getY(offset), 0)
    assert.equal(geometry.attributes.windWeight.getX(offset), 0)
    assert.ok(Math.abs(position.getY(offset + 4) - 8 / 12.2) < 1e-7)
    assert.ok(Math.abs(position.getY(offset + 8) - 11.2 / 12.2) < 1e-7)
    assert.equal(position.getY(offset + 12), 1)
    assert.equal(geometry.attributes.windWeight.getX(offset + 12), 1)
  }
  geometry.dispose()
})

test('nearby grass shares an instanced batch and disposes all owned shadow resources', () => {
  const grass = createGrassMeshes(grassLayout.slice(0, 4))
  assert.equal(grass.meshes.length, 1)
  const [mesh] = grass.meshes
  assert.equal(mesh.count, 4)
  assert.equal(mesh.geometry.attributes.bladeBend.count, 4)
  const resources = [mesh, mesh.geometry, mesh.material, mesh.customDepthMaterial]
  let disposed = 0
  resources.forEach((resource) => resource.addEventListener('dispose', () => disposed++))
  grass.dispose()
  assert.equal(disposed, resources.length)
})

test('every foliage card has full-mask UVs and a shared anchor for rigid sway', () => {
  const geometry = createFoliageGeometry(36)
  assert.equal(geometry.attributes.position.count, 144)
  for (let card = 0; card < 36; card++) {
    assert.deepEqual(Array.from(geometry.attributes.uv.array.slice(card * 8, card * 8 + 8)), [0, 0, 1, 0, 1, 1, 0, 1])
    const anchors = geometry.attributes.windAnchor
    const first = new THREE.Vector3().fromBufferAttribute(anchors, card * 4)
    for (let corner = 1; corner < 4; corner++) {
      assert.equal(first.distanceTo(new THREE.Vector3().fromBufferAttribute(anchors, card * 4 + corner)), 0)
    }
  }
  geometry.dispose()
})

test('surface and depth shaders use matching wind and main-camera billboard uniforms', () => {
  const alphaMap = new THREE.Texture()
  const { material, depthMaterial } = createWindMaterials({ color: 'green', amplitude: 0.018, alphaMap, billboardSize: 0.16 })
  for (const [target, source] of [[material, THREE.ShaderLib.lambert], [depthMaterial, THREE.ShaderLib.depth]]) {
    const shader = { uniforms: {}, vertexShader: source.vertexShader }
    target.onBeforeCompile(shader)
    assert.equal(shader.uniforms.uVegetationTime, windUniforms.uVegetationTime)
    assert.equal(shader.uniforms.uCameraRight, windUniforms.uCameraRight)
    assert.ok(shader.vertexShader.includes('windWeight * windWeight'))
    assert.ok(!shader.vertexShader.includes('inverse(mat3(vegetationMatrix))'))
    assert.ok(shader.vertexShader.includes('dot(offsetWorld, basis[0])'))
    assert.equal(target.alphaMap, alphaMap)
    assert.equal(target.alphaTest, 0.5)
  }
  material.dispose()
  depthMaterial.dispose()
  alphaMap.dispose()
})

test('spatial grass batches preserve every blade and share materials', () => {
  const grass = createGrassMeshes(grassLayout)
  assert.ok(grass.meshes.length > 1 && grass.meshes.length <= 36)
  assert.equal(grass.meshes.reduce((sum, mesh) => sum + mesh.count, 0), grassLayout.length)
  for (const mesh of grass.meshes) {
    assert.equal(mesh.material, grass.meshes[0].material)
    assert.equal(mesh.customDepthMaterial, grass.meshes[0].customDepthMaterial)
    assert.ok(mesh.boundingSphere.radius < 8)
  }
  grass.dispose()
})

test('canopies reuse resources until the final owner unmounts', () => {
  const texture = new THREE.Texture()
  const first = acquireFoliageResources(texture)
  const second = acquireFoliageResources(texture)
  assert.equal(first, second)
  let disposed = 0
  for (const resource of [first.geometry, first.material, first.depthMaterial]) {
    resource.addEventListener('dispose', () => disposed++)
  }
  releaseFoliageResources(texture)
  assert.equal(disposed, 0)
  releaseFoliageResources(texture)
  assert.equal(disposed, 3)
  const remounted = acquireFoliageResources(texture)
  assert.notEqual(remounted, first)
  releaseFoliageResources(texture)
  texture.dispose()
})

test('orthogonal projection matches inverse transforms for vegetation rotation and scale', () => {
  const offset = new THREE.Vector3(0.025, 0.01, -0.02)
  for (const scale of [new THREE.Vector3(0.01, 0.24, 0.01), new THREE.Vector3(0.25, 0.25, 0.25)]) {
    const matrix = new THREE.Matrix4().compose(new THREE.Vector3(),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 1.3, 0.2)), scale)
    const columns = [0, 1, 2].map((index) => new THREE.Vector3().setFromMatrixColumn(matrix, index))
    const projected = new THREE.Vector3(...columns.map((column) => offset.dot(column) / column.lengthSq()))
    const inverse = offset.clone().applyMatrix3(new THREE.Matrix3().setFromMatrix4(matrix).invert())
    assert.ok(projected.distanceTo(inverse) < 1e-12)
  }
})
