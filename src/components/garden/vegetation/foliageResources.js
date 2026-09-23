import { createFoliageGeometry } from './foliageGeometry.js'
import { createWindMaterials } from './vegetationWind.js'

// All canopies use the same shape, mask, and shader. Keep one resource set alive
// while any canopy is mounted, then release it (including during effect replay).
const resourcesByTexture = new WeakMap()

export function acquireFoliageResources(alphaMap) {
  let resources = resourcesByTexture.get(alphaMap)
  if (!resources) {
    const geometry = createFoliageGeometry()
    geometry.boundingSphere.radius += 0.65
    const materials = createWindMaterials({
      color: '#4d7835', alphaMap, amplitude: 0.018, billboardSize: 0.16,
    })
    resources = { geometry, ...materials, users: 0 }
    resourcesByTexture.set(alphaMap, resources)
  }
  resources.users++
  return resources
}

export function releaseFoliageResources(alphaMap) {
  const resources = resourcesByTexture.get(alphaMap)
  if (!resources) return
  resources.users--
  if (resources.users === 0) {
    resources.geometry.dispose()
    resources.material.dispose()
    resources.depthMaterial.dispose()
    resourcesByTexture.delete(alphaMap)
  }
}
