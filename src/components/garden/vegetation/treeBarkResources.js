import * as THREE from 'three'

const resourcesByTexture = new WeakMap()

function createBarkTexture(source, colorSpace) {
  const texture = source.clone()
  texture.colorSpace = colorSpace
  texture.flipY = false
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.needsUpdate = true
  return texture
}

export function acquireTreeBark(map, normalMap, roughnessMap) {
  let resources = resourcesByTexture.get(map)
  if (!resources) {
    const material = new THREE.MeshStandardMaterial({
      map: createBarkTexture(map, THREE.SRGBColorSpace),
      normalMap: createBarkTexture(normalMap, THREE.NoColorSpace),
      roughnessMap: createBarkTexture(roughnessMap, THREE.NoColorSpace),
      roughness: 1,
      metalness: 0,
      flatShading: true,
    })
    resources = { material, users: 0 }
    resourcesByTexture.set(map, resources)
  }
  resources.users++
  return resources.material
}

export function releaseTreeBark(map) {
  const resources = resourcesByTexture.get(map)
  if (!resources) return
  resources.users--
  if (resources.users === 0) {
    const { material } = resources
    material.map.dispose()
    material.normalMap.dispose()
    material.roughnessMap.dispose()
    material.dispose()
    resourcesByTexture.delete(map)
  }
}
