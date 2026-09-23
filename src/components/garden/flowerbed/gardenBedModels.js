import * as THREE from 'three'

export const GARDEN_BED_SCALE = 12
const TEXTURE_TILE_SIZE = 0.5 // World units per texture repeat.

export const gardenBedParts = [
  {
    name: 'planks',
    model: '/assets/models/garden-bed/PlanksF.glb',
    color: '/assets/textures/hinoki-planks/hinoki_planks_diff_1k.jpg',
    normal: '/assets/textures/hinoki-planks/hinoki_planks_nor_gl_1k.exr',
    roughness: '/assets/textures/hinoki-planks/hinoki_planks_rough_1k.exr',
  },
  {
    name: 'posts',
    model: '/assets/models/garden-bed/Posts.glb',
    color: '/assets/textures/rough-wood/rough_wood_diff_1k.jpg',
    normal: '/assets/textures/rough-wood/rough_wood_nor_gl_1k.exr',
    roughness: '/assets/textures/rough-wood/rough_wood_rough_1k.jpg',
  },
  {
    name: 'dirt',
    model: '/assets/models/garden-bed/Dirt.glb',
    color: '/assets/textures/farm-soil/farm_soil_diff_1k.jpg',
    normal: '/assets/textures/farm-soil/farm_soil_nor_gl_1k.exr',
    roughness: '/assets/textures/farm-soil/farm_soil_rough_1k.exr',
  },
]

function createTexturedGeometry(source) {
  // Separate vertices at face boundaries so each face can use its own projection.
  const geometry = source.index ? source.toNonIndexed() : source.clone()
  const positions = geometry.attributes.position
  const uvs = new Float32Array(positions.count * 2)
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const normal = new THREE.Vector3()
  const edge = new THREE.Vector3()
  const textureScale = GARDEN_BED_SCALE / TEXTURE_TILE_SIZE

  for (let index = 0; index < positions.count; index += 3) {
    a.fromBufferAttribute(positions, index)
    b.fromBufferAttribute(positions, index + 1)
    c.fromBufferAttribute(positions, index + 2)
    normal.subVectors(b, a).cross(edge.subVectors(c, a))
    const nx = Math.abs(normal.x)
    const ny = Math.abs(normal.y)
    const nz = Math.abs(normal.z)

    for (let corner = index; corner < index + 3; corner++) {
      const x = positions.getX(corner)
      const y = positions.getY(corner)
      const z = positions.getZ(corner)
      // These exports use local Z as up; their root transform converts it to Y.
      const u = nx > ny && nx > nz ? y : x
      const v = nz >= nx && nz >= ny ? y : z
      uvs[corner * 2] = u * textureScale
      uvs[corner * 2 + 1] = v * textureScale
    }
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  if (!geometry.attributes.normal) geometry.computeVertexNormals()
  return geometry
}

function createPartTexture(source, colorSpace) {
  if (!source) return null
  const texture = source.clone()
  texture.colorSpace = colorSpace
  // Generated UVs use the same orientation for image and EXR textures.
  texture.flipY = false
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.needsUpdate = true
  return texture
}

export function createTexturedBedPart(source, { map, normalMap, roughnessMap }) {
  const scene = source.clone(true)
  const material = new THREE.MeshStandardMaterial({
    map: createPartTexture(map, THREE.SRGBColorSpace),
    normalMap: createPartTexture(normalMap, THREE.NoColorSpace),
    roughnessMap: createPartTexture(roughnessMap, THREE.NoColorSpace),
    roughness: 1,
    metalness: 0,
  })
  const geometries = []
  scene.traverse((object) => {
    if (!object.isMesh) return
    object.geometry = createTexturedGeometry(object.geometry)
    object.material = material
    geometries.push(object.geometry)
  })

  return {
    scene,
    dispose() {
      geometries.forEach((geometry) => geometry.dispose())
      material.dispose()
      material.map?.dispose()
      material.normalMap?.dispose()
      material.roughnessMap?.dispose()
      // Cached source textures and geometry remain untouched.
    },
  }
}
