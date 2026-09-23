import * as THREE from 'three'

export const FLOWER_INSPECTION_POSITION = new THREE.Vector3(0, 1, 0)
export const FLOWER_MOVE_SPEED = 5

export function getLiftedFlowerY(plantedY, startPointerY, pointerY) {
  return plantedY + Math.max(0, pointerY - startPointerY)
}

export function isFlowerClearOfSoil(rootY, bottomOffset, soilY) {
  return rootY + bottomOffset > soilY + 0.0001
}

// The flower remains under the bed; convert the world destination to its parent space.
export function getInspectionRootPosition(parent, centerOffset, target = new THREE.Vector3()) {
  parent.updateWorldMatrix(true, false)
  return parent.worldToLocal(target.copy(FLOWER_INSPECTION_POSITION)).sub(centerOffset)
}
