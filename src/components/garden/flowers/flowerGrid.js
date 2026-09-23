import * as THREE from 'three'

// Swap the model here; sizing and planting use the replacement model's bounds.
export const flowerModels = {
  flower1: '/assets/models/flowers/flower1/flower1_3.glb',
}

export const FLOWER_GRID = {
  columns: 4,
  rows: 3,
  cellFill: 0.48, // Maximum flower width/depth as a fraction of a cell.
  heightInCells: 1.05,
  burialFraction: 0.12, // Bury the bottom 12% of the flower's height.
  headHeightFraction: 0.88, // Orbital target near the center of the petals.
}

// All coordinates are local to the bed, before its shared scale is applied.
export function createFlowerGrid(soil, flower, samples, settings = FLOWER_GRID) {
  const soilBounds = new THREE.Box3().setFromObject(soil)
  const flowerBounds = new THREE.Box3().setFromObject(flower)
  const size = flowerBounds.getSize(new THREE.Vector3())
  const center = flowerBounds.getCenter(new THREE.Vector3())
  const cellWidth = (soilBounds.max.x - soilBounds.min.x) / settings.columns
  const cellDepth = (soilBounds.max.z - soilBounds.min.z) / settings.rows
  const scale = Math.min(
    cellWidth * settings.cellFill / size.x,
    cellDepth * settings.cellFill / size.z,
    Math.min(cellWidth, cellDepth) * settings.heightInCells / size.y,
  )
  const halfWidth = size.x * scale / 2
  const halfDepth = size.z * scale / 2
  const burial = size.y * scale * settings.burialFraction
  const raycaster = new THREE.Raycaster()
  const down = new THREE.Vector3(0, -1, 0)

  return samples.map(([randomX, randomZ], index) => {
    const column = index % settings.columns
    const row = Math.floor(index / settings.columns)
    // Keep the whole flower footprint inside its cell, including edge cells.
    const x = soilBounds.min.x + column * cellWidth + halfWidth
      + randomX * (cellWidth - 2 * halfWidth)
    const z = soilBounds.min.z + row * cellDepth + halfDepth
      + randomZ * (cellDepth - 2 * halfDepth)
    raycaster.set(new THREE.Vector3(x, soilBounds.max.y + 1, z), down)
    const surface = raycaster.intersectObject(soil, true)[0]
    if (!surface) throw new Error(`Flower cell ${index} does not intersect the soil.`)

    return {
      position: [x, surface.point.y, z],
      scale,
      height: size.y * scale,
      bottomOffset: -burial,
      centerPosition: [0, size.y * scale / 2 - burial, 0],
      focusPosition: [0, size.y * scale * settings.headHeightFraction - burial, 0],
      // Center horizontally and align the model's actual bottom with the soil.
      modelOffset: [-center.x * scale, -flowerBounds.min.y * scale - burial, -center.z * scale],
    }
  })
}
