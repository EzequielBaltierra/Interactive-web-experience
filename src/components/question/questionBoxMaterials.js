import * as THREE from 'three'

function createTexture(source, colorSpace, repeat) {
  const texture = source.clone()
  texture.colorSpace = colorSpace
  texture.flipY = false
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeat, repeat)
  texture.needsUpdate = true
  return texture
}

function addBoxProjectionUvs(source, normalized) {
  const geometry = source.index ? source.toNonIndexed() : source.clone()
  const positions = geometry.attributes.position
  geometry.computeBoundingBox()
  const bounds = geometry.boundingBox
  const uv = new Float32Array(positions.count * 2)
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const normal = new THREE.Vector3()
  const edge = new THREE.Vector3()
  const axes = [
    [2, 1], // X-facing: project Z/Y.
    [0, 2], // Y-facing: project X/Z.
    [0, 1], // Z-facing: project X/Y.
  ]

  for (let index = 0; index < positions.count; index += 3) {
    a.fromBufferAttribute(positions, index)
    b.fromBufferAttribute(positions, index + 1)
    c.fromBufferAttribute(positions, index + 2)
    normal.subVectors(b, a).cross(edge.subVectors(c, a)).normalize()
    const dominantAxis = Math.abs(normal.x) > Math.abs(normal.y)
      ? (Math.abs(normal.x) > Math.abs(normal.z) ? 0 : 2)
      : (Math.abs(normal.y) > Math.abs(normal.z) ? 1 : 2)
    const [uAxis, vAxis] = axes[dominantAxis]
    const uSize = bounds.max.getComponent(uAxis) - bounds.min.getComponent(uAxis)
    const vSize = bounds.max.getComponent(vAxis) - bounds.min.getComponent(vAxis)

    for (let vertex = index; vertex < index + 3; vertex += 1) {
      const uValue = positions.getX(vertex) * (uAxis === 0)
        + positions.getY(vertex) * (uAxis === 1)
        + positions.getZ(vertex) * (uAxis === 2)
      const vValue = positions.getX(vertex) * (vAxis === 0)
        + positions.getY(vertex) * (vAxis === 1)
        + positions.getZ(vertex) * (vAxis === 2)
      const u = normalized && uSize > 0 ? (uValue - bounds.min.getComponent(uAxis)) / uSize : uValue / 22
      const v = normalized && vSize > 0 ? (vValue - bounds.min.getComponent(vAxis)) / vSize : vValue / 22
      uv[vertex * 2] = u
      uv[vertex * 2 + 1] = v
    }
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  if (!geometry.attributes.normal) geometry.computeVertexNormals()
  return geometry
}

export function createTexturedQuestionPart(source, { map, normalMap, roughnessMap }, normalizedUvs) {
  const scene = source.clone(true)
  const material = new THREE.MeshStandardMaterial({
    map: createTexture(map, THREE.SRGBColorSpace, 1),
    normalMap: createTexture(normalMap, THREE.NoColorSpace, 1),
    roughnessMap: createTexture(roughnessMap, THREE.NoColorSpace, 1),
    roughness: 1,
    metalness: 0,
  })
  const geometries = []

  scene.traverse((object) => {
    if (!object.isMesh) return
    object.geometry = addBoxProjectionUvs(object.geometry, normalizedUvs)
    object.material = material
    geometries.push(object.geometry)
  })

  return {
    scene,
    dispose() {
      geometries.forEach((geometry) => geometry.dispose())
      material.map.dispose()
      material.normalMap.dispose()
      material.roughnessMap.dispose()
      material.dispose()
    },
  }
}
