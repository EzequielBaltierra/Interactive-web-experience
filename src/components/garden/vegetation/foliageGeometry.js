import * as THREE from 'three'

// A compact cloud of leaf cards replaces a solid sphere. Each quad receives
// the entire alpha mask, rather than a slice of a sphere's UV layout.
export function createFoliageGeometry(count = 36) {
  const positions = []
  const normals = []
  const uvs = []
  const anchors = []
  const weights = []
  const indices = []
  const up = new THREE.Vector3(0, 1, 0)
  const right = new THREE.Vector3()
  const vertical = new THREE.Vector3()
  const normal = new THREE.Vector3()
  const center = new THREE.Vector3()
  const vertex = new THREE.Vector3()

  for (let card = 0; card < count; card++) {
    const y = 1 - 2 * (card + 0.5) / count
    const angle = card * Math.PI * (3 - Math.sqrt(5))
    const ringRadius = Math.sqrt(1 - y * y)
    normal.set(Math.cos(angle) * ringRadius, y, Math.sin(angle) * ringRadius)
    center.copy(normal).multiplyScalar(0.72)
    right.crossVectors(up, normal).normalize()
    vertical.crossVectors(normal, right).normalize()
    const halfSize = 0.27

    for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
      vertex.copy(center).addScaledVector(right, (u * 2 - 1) * halfSize)
        .addScaledVector(vertical, (v * 2 - 1) * halfSize)
      positions.push(...vertex.toArray())
      normals.push(...normal.toArray())
      anchors.push(...center.toArray())
      uvs.push(u, v)
      weights.push(0.65 + (y + 1) * 0.175)
    }
    const offset = card * 4
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('windAnchor', new THREE.Float32BufferAttribute(anchors, 3))
  geometry.setAttribute('windWeight', new THREE.Float32BufferAttribute(weights, 1))
  geometry.setIndex(indices)
  geometry.computeBoundingSphere()
  return geometry
}
