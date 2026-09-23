import { useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'
import { viewOffsets } from './cameraViews.js'

const CAMERA_VIEW_LIMIT = 25
const CAMERA_MIN_DISTANCE = 0.02
const CAMERA_NEAR_CLIP = 0.005

function clampHorizontalPosition(position) {
  position.x = THREE.MathUtils.clamp(position.x, -CAMERA_VIEW_LIMIT, CAMERA_VIEW_LIMIT)
  position.z = THREE.MathUtils.clamp(position.z, -CAMERA_VIEW_LIMIT, CAMERA_VIEW_LIMIT)
}

export default function CameraRigging({ view, getSelectedObject, pauseCameraFollow, cameraMode, pickedFlower, onInspectionReady }) {
  const orbitControlsRef = useRef(null)
  const targetLookAt = useRef(new THREE.Vector3())
  const objectWorldPosition = useRef(new THREE.Vector3())
  const targetPosition = useRef(new THREE.Vector3())
  const orbitalOffset = useRef(viewOffsets.main.clone())
  const wasMovingFlower = useRef(false)
  const previousTargetPosition = useRef(new THREE.Vector3())
  const previousSelectedObject = useRef(null)
  const previousView = useRef(view)
  const previousCameraMode = useRef(cameraMode)

  useFrame((state, delta) => {
    const alpha = Math.min(delta * 4, 1)
    const selectedObject = getSelectedObject?.()

    if (cameraMode === 'perspective') {
      targetLookAt.current.set(0, 0, 0)
    } else if (selectedObject) {
      selectedObject.getWorldPosition(objectWorldPosition.current)
      targetLookAt.current.copy(objectWorldPosition.current)
    } else {
      targetLookAt.current.set(0, 0, 0)
    }

    const viewChanged = previousView.current !== view
    const cameraModeChanged = previousCameraMode.current !== cameraMode
    const targetChanged = previousSelectedObject.current !== selectedObject

    // Follow the lifted flower during its flight, then release control to orbiting.
    if (cameraMode === 'orbital' && pickedFlower && (pickedFlower.moving || wasMovingFlower.current)) {
      const controls = orbitControlsRef.current
      const distance = pickedFlower.distance
      targetPosition.current.copy(targetLookAt.current)
      targetPosition.current.y += distance
      targetPosition.current.z += distance * 0.001 // Avoid the pole singularity at exactly top-down.
      const blend = 1 - Math.exp(-5 * delta)
      if (pickedFlower.moving) {
        state.camera.position.lerp(targetPosition.current, blend)
        controls.target.lerp(targetLookAt.current, blend)
      } else {
        state.camera.position.copy(targetPosition.current)
        controls.target.copy(targetLookAt.current)
      }
      state.camera.lookAt(controls.target)
      controls.update()
      if (pickedFlower.moving && pickedFlower.flowerArrived
        && state.camera.position.distanceToSquared(targetPosition.current) < 1e-8
        && controls.target.distanceToSquared(targetLookAt.current) < 1e-8) {
        onInspectionReady(pickedFlower.id)
      }
      wasMovingFlower.current = pickedFlower.moving
      previousSelectedObject.current = selectedObject
      previousTargetPosition.current.copy(targetLookAt.current)
      previousView.current = view
      previousCameraMode.current = cameraMode
      return
    }
    wasMovingFlower.current = false

    if (cameraMode === 'orbital' && targetChanged && !viewChanged) {
      orbitalOffset.current
        .copy(state.camera.position)
        .sub(previousTargetPosition.current)
    }

    const shouldResetView = viewChanged
      || cameraModeChanged
      || (cameraMode !== 'orbital' && targetChanged)

    if (shouldResetView) {
      orbitalOffset.current.copy(viewOffsets[view] || viewOffsets.front)
      if (pickedFlower && cameraMode === 'orbital') orbitalOffset.current.setLength(pickedFlower.distance)
    }

    targetPosition.current
      .copy(targetLookAt.current)
      .add(orbitalOffset.current)
    clampHorizontalPosition(targetPosition.current)

    if (shouldResetView || (cameraMode === 'orbital' && targetChanged)) {
      if (orbitControlsRef.current && cameraMode === 'orbital') {
        orbitControlsRef.current.target.copy(targetLookAt.current)
        orbitControlsRef.current.update()
      }

      state.camera.position.copy(targetPosition.current)
      state.camera.lookAt(targetLookAt.current)

      previousView.current = view
      previousCameraMode.current = cameraMode
    }

    previousSelectedObject.current = selectedObject
    previousTargetPosition.current.copy(targetLookAt.current)

    if (!pauseCameraFollow && cameraMode !== 'orbital') {
      state.camera.position.lerp(targetPosition.current, alpha)
      state.camera.lookAt(targetLookAt.current)
    }

    clampHorizontalPosition(state.camera.position)
  }, -0.5) // After OrbitControls (-1), before wind uniforms and rendering (0).

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={viewOffsets.main.toArray()}
        fov={75}
        near={CAMERA_NEAR_CLIP}
        far={1000}
      />
      <OrbitControls
        ref={orbitControlsRef}
        enabled={cameraMode === 'orbital' && !pickedFlower?.moving}
        enablePan
        screenSpacePanning
        enableDamping={!pickedFlower?.moving}
        minDistance={CAMERA_MIN_DISTANCE}
        maxDistance={CAMERA_VIEW_LIMIT}
      />
    </>
  )
}
