import { Suspense, useCallback, useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Clone } from '@react-three/drei'
import * as THREE from 'three'
import FlowerParts from './FlowerParts.jsx'
import useFlowerCollider from './useFlowerCollider.js'
import {
  FLOWER_MOVE_SPEED, getInspectionRootPosition, getLiftedFlowerY, isFlowerClearOfSoil,
} from './flowerPicking.js'

export default function PickableFlower({
  flower, flowerType, placement, objectId, setObjectRef, onSelect,
  canDig, pickedFlower, onDragChange, onUproot, onArrive,
}) {
  const rootRef = useRef(null)
  const canvas = useThree((state) => state.gl.domElement)
  const drag = useRef(null)
  const scratch = useRef({
    point: new THREE.Vector3(), target: new THREE.Vector3(),
    scale: new THREE.Vector3(), center: new THREE.Vector3(),
  })
  const { position, scale, modelOffset, focusPosition, centerPosition, bottomOffset, height } = placement
  const isPicked = pickedFlower?.id === objectId
  const showParts = isPicked && !pickedFlower.moving
  useFlowerCollider(rootRef, !showParts)

  const releasePointer = useCallback(() => {
    const current = drag.current
    if (!current) return
    drag.current = null
    if (current.target.hasPointerCapture(current.pointerId)) {
      current.target.releasePointerCapture(current.pointerId)
    }
    onDragChange?.(false)
  }, [onDragChange])

  useEffect(() => {
    // R3F does not forward lost capture/cancel to mesh handlers.
    const cancel = (event) => {
      if (event.pointerId === undefined || event.pointerId === drag.current?.pointerId) releasePointer()
    }
    canvas.addEventListener('pointercancel', cancel)
    canvas.addEventListener('lostpointercapture', cancel)
    window.addEventListener('blur', cancel)
    return () => {
      canvas.removeEventListener('pointercancel', cancel)
      canvas.removeEventListener('lostpointercapture', cancel)
      window.removeEventListener('blur', cancel)
      releasePointer()
    }
  }, [canvas, releasePointer])

  useFrame((_, delta) => {
    const root = rootRef.current
    if (!root || drag.current) return
    const { target } = scratch.current
    if (isPicked) {
      getInspectionRootPosition(root.parent, scratch.current.center.fromArray(centerPosition), target)
    } else {
      target.fromArray(position)
    }
    root.position.lerp(target, 1 - Math.exp(-FLOWER_MOVE_SPEED * delta))
    if (root.position.distanceToSquared(target) < 1e-10) {
      root.position.copy(target)
      if (isPicked && !pickedFlower.flowerArrived) onArrive(objectId)
    }
  }, -0.75) // Move before the camera reads the focus anchor's world position.

  const startDrag = (event) => {
    event.stopPropagation()
    if (!canDig || drag.current || event.button !== 0) return
    const root = rootRef.current
    const origin = root.getWorldPosition(new THREE.Vector3())
    // A vertical plane facing the camera converts screen dragging into world height.
    const normal = event.camera.getWorldDirection(new THREE.Vector3())
    normal.y = 0
    if (normal.lengthSq() < 0.0001) return
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal.normalize(), origin)
    const hit = event.ray.intersectPlane(plane, new THREE.Vector3())
    if (!hit) return
    root.parent.worldToLocal(hit)
    drag.current = {
      plane, startY: hit.y, rootY: root.position.y,
      pointerId: event.pointerId, target: event.target,
    }
    event.target.setPointerCapture(event.pointerId)
    onDragChange(true)
  }

  const moveDrag = (event) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    event.stopPropagation()
    const root = rootRef.current
    const { point, scale: worldScale } = scratch.current
    if (!event.ray.intersectPlane(current.plane, point)) return
    root.parent.worldToLocal(point)
    root.position.y = getLiftedFlowerY(current.rootY, current.startY, point.y)
    if (isFlowerClearOfSoil(root.position.y, bottomOffset, position[1])) {
      root.getWorldScale(worldScale)
      releasePointer()
      onUproot(objectId, Math.max(height * worldScale.y * 1.8, 0.4))
    }
  }

  const endDrag = (event) => {
    if (drag.current?.pointerId !== event.pointerId) return
    event.stopPropagation()
    releasePointer()
  }

  return (
    <group
      ref={rootRef}
      name={objectId}
      position={position}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onClick={(event) => {
        event.stopPropagation()
        if (!canDig && !isPicked) onSelect?.(objectId)
      }}
    >
      <group
        name={`${objectId}-camera-target`}
        position={focusPosition}
        ref={(node) => setObjectRef?.(objectId, node)}
      />
      {showParts ? (
        <Suspense fallback={<Clone object={flower} position={modelOffset} scale={scale} dispose={null} />}>
          <FlowerParts flowerType={flowerType} position={modelOffset} scale={scale} />
        </Suspense>
      ) : (
        <Clone object={flower} position={modelOffset} scale={scale} castShadow receiveShadow dispose={null} />
      )}
    </group>
  )
}
