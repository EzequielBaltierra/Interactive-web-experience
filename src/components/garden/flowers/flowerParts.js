import * as THREE from 'three'

// Each set preserves the complete model's exported coordinate system.
export const flowerPartModels = {
  flower1: {
    stem: '/assets/models/flowers/flower1/Stem1.glb',
    petals: Array.from({ length: 10 }, (_, index) => `/assets/models/flowers/flower1/Petal1_${index + 1}.glb`),
  },
}

export function createFlowerPart(source) {
  source.updateMatrixWorld(true)
  const bounds = new THREE.Box3().setFromObject(source)
  const center = bounds.getCenter(new THREE.Vector3())
  const meshes = []
  source.traverse((mesh) => {
    if (!mesh.isMesh) return
    const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld)
    geometry.translate(-center.x, -center.y, -center.z)
    meshes.push({ geometry, material: mesh.material })
  })
  return {
    center: center.toArray(), meshes,
    dispose: () => meshes.forEach(({ geometry }) => geometry.dispose()),
  }
}
