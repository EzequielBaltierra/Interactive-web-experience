import assert from 'node:assert/strict'
import test from 'node:test'
import { PerspectiveCamera, Vector3 } from 'three'
import {
  advanceInspectionTransition, createInspectionTransition, INSPECTION_TRANSITION_DURATION,
} from '../src/components/camera/inspectionTransition.js'

test('inspection follows a straight segment without changing horizontal heading from any garden quadrant', () => {
  for (const [x, z] of [[-1.2, -1.35], [1.2, -1.35], [1.2, 1.35], [-1.2, 1.35]]) {
    const camera = new PerspectiveCamera()
    camera.position.set(x, 1.2, z)
    camera.lookAt(0, 0, 0)
    const initialHeading = camera.getWorldDirection(new Vector3()).setY(0).normalize()
    const flight = createInspectionTransition(camera, [0, 1.15, 0], 0.4)
    const segment = flight.destinationPosition.clone().sub(flight.startPosition)
    const target = new Vector3()
    let arrived = false
    for (let frame = 0; frame < 60; frame++) {
      arrived = advanceInspectionTransition(flight, camera, target, 1 / 60)
      const traveled = camera.position.clone().sub(flight.startPosition)
      assert.ok(traveled.cross(segment).length() < 1e-9, 'position must stay on the direct path')
      const heading = camera.getWorldDirection(new Vector3()).setY(0).normalize()
      assert.ok(heading.dot(initialHeading) > 0.999999, 'heading must not rotate around Y')
    }
    assert.equal(arrived, true)
    assert.ok(target.distanceTo(new Vector3(0, 1.15, 0)) < 1e-10)
    assert.ok(Math.hypot(camera.position.x, camera.position.z) < 0.0005)
    assert.ok(Math.abs(camera.position.y - 1.55) < 1e-10)
  }
})

test('inspection finishes at the same destination across frame rates, including a frame longer than the transition', () => {
  const endpoints = [1, 30, 60, 144].map((fps) => {
    const camera = new PerspectiveCamera()
    camera.position.set(-1, 2, -3)
    camera.lookAt(0, 0, 0)
    const flight = createInspectionTransition(camera, [0, 1.1, 0], 0.5)
    const target = new Vector3()
    for (let frame = 0; frame <= Math.ceil(INSPECTION_TRANSITION_DURATION * fps); frame++) {
      advanceInspectionTransition(flight, camera, target, 1 / fps)
    }
    assert.equal(flight.elapsed, INSPECTION_TRANSITION_DURATION)
    assert.ok(camera.quaternion.toArray().every(Number.isFinite))
    return camera.position.clone()
  })
  endpoints.forEach((position) => assert.ok(position.distanceTo(endpoints[0]) < 1e-10))
})
