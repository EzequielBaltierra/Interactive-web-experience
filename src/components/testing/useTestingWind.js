import { useLayoutEffect } from 'react'
import * as THREE from 'three'
import { applyVegetationShader } from '../garden/vegetation/vegetationWind.js'

// Adapt ordinary meshes to the garden shader's root-to-tip wind attributes.
export default function useTestingWind(objectRef, amplitude) {
  useLayoutEffect(() => {
    const root = objectRef.current
    root.updateWorldMatrix(true, true)
    const bounds = new THREE.Box3().setFromObject(root)
    const height = Math.max(bounds.max.y - bounds.min.y, 0.0001)
    const point = new THREE.Vector3()
    const worldScale = new THREE.Vector3()
    const cleanup = []

    root.traverse((mesh) => {
      if (!mesh.isMesh) return
      const originalGeometry = mesh.geometry
      const originalMaterial = mesh.material
      // Own our copies so the cached flower and garden materials stay untouched.
      const geometry = originalGeometry.clone()
      const positions = geometry.attributes.position
      const weights = new Float32Array(positions.count)
      const anchors = new Float32Array(positions.count * 3)
      geometry.computeBoundingBox()
      const anchor = geometry.boundingBox.getCenter(new THREE.Vector3())

      for (let index = 0; index < positions.count; index++) {
        point.fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld)
        weights[index] = THREE.MathUtils.clamp((point.y - bounds.min.y) / height, 0, 1)
        anchor.toArray(anchors, index * 3)
      }
      geometry.setAttribute('windWeight', new THREE.BufferAttribute(weights, 1))
      geometry.setAttribute('windAnchor', new THREE.BufferAttribute(anchors, 3))
      geometry.computeBoundingSphere()
      mesh.getWorldScale(worldScale)
      geometry.boundingSphere.radius += amplitude * 1.25 / Math.min(worldScale.x, worldScale.y, worldScale.z)

      const materials = (Array.isArray(originalMaterial) ? originalMaterial : [originalMaterial])
        .map((material) => applyVegetationShader(material.clone(), { amplitude }))
      mesh.geometry = geometry
      mesh.material = Array.isArray(originalMaterial) ? materials : materials[0]
      cleanup.push(() => {
        mesh.geometry = originalGeometry
        mesh.material = originalMaterial
        geometry.dispose()
        materials.forEach((material) => material.dispose())
      })
    })

    return () => cleanup.forEach((dispose) => dispose())
  }, [objectRef, amplitude])
}
