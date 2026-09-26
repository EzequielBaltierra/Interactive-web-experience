import { useFrame, useThree } from '@react-three/fiber'
import {
  OrthographicCamera,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'
import { TERRAIN_FOG_FAR } from '../garden/terrain/gardenConfig.js'
import { CAMERA_FOV, getPerspectiveMatchedOrthographicZoom } from './cameraProjection.js'
import { viewOffsets } from './cameraViews.js'
import { advanceInspectionTransition, createInspectionTransition } from './inspectionTransition.js'

const CAMERA_VIEW_LIMIT = 25
const CAMERA_MIN_DISTANCE = 0.02
const CAMERA_NEAR_CLIP = 0.005

function clampHorizontalPosition(position) {
  position.x = THREE.MathUtils.clamp(position.x, -CAMERA_VIEW_LIMIT, CAMERA_VIEW_LIMIT)
  position.z = THREE.MathUtils.clamp(position.z, -CAMERA_VIEW_LIMIT, CAMERA_VIEW_LIMIT)
}

export default function CameraRigging({ view, getSelectedObject, pauseCameraFollow, cameraMode, pickedFlower, onInspectionReady }) {
  const viewportHeight = useThree((state) => state.size.height)
  const orbitControlsRef = useRef(null)
  const targetLookAt = useRef(new THREE.Vector3())
  const objectWorldPosition = useRef(new THREE.Vector3())
  const targetPosition = useRef(new THREE.Vector3())
  const orbitalOffset = useRef(viewOffsets.main.clone())
  const inspectionTransition = useRef(null)
  const previousTargetPosition = useRef(new THREE.Vector3())
  const previousSelectedObject = useRef(null)
  const previousView = useRef(view)
  const previousCameraMode = useRef(cameraMode)
  const activeViewOffset = viewOffsets[view] || viewOffsets.front
  const orthographicZoom = getPerspectiveMatchedOrthographicZoom(activeViewOffset, viewportHeight)
  // Orthographic rays do not widen away from the camera. Allow the overview
  // views to render the full fog-visible scene, including geometry beside or
  // slightly behind their camera position. Keep the close test view clipped.
  const orthographicNear = view === 'test' ? CAMERA_NEAR_CLIP : -TERRAIN_FOG_FAR

  useFrame((state, delta) => {
    const alpha = Math.min(delta * 4, 1)
    const selectedObject = getSelectedObject?.()

    if (cameraMode !== 'orbital') {
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

    // Move directly to the final flower position, then release control to orbiting.
    if (cameraMode === 'orbital' && pickedFlower?.moving) {
      const controls = orbitControlsRef.current
      if (!inspectionTransition.current) {
        inspectionTransition.current = createInspectionTransition(
          state.camera, pickedFlower.focus, pickedFlower.distance,
        )
      }
      const arrived = advanceInspectionTransition(
        inspectionTransition.current, state.camera, controls.target, delta,
      )
      if (arrived && pickedFlower.flowerArrived) {
        controls.update()
        onInspectionReady(pickedFlower.id)
      }
      previousSelectedObject.current = selectedObject
      previousTargetPosition.current.copy(targetLookAt.current)
      previousView.current = view
      previousCameraMode.current = cameraMode
      return
    }
    inspectionTransition.current = null

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
      {cameraMode === 'orthographic' ? (
        <OrthographicCamera
          makeDefault
          position={activeViewOffset.toArray()}
          zoom={orthographicZoom}
          near={orthographicNear}
          far={1000}
        />
      ) : (
        <PerspectiveCamera
          makeDefault
          position={activeViewOffset.toArray()}
          fov={CAMERA_FOV}
          near={CAMERA_NEAR_CLIP}
          far={1000}
        />
      )}
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
