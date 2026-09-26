import assert from 'node:assert/strict'
import test from 'node:test'
import { Vector3 } from 'three'
import {
  CAMERA_FOV,
  getPerspectiveMatchedOrthographicZoom,
} from '../src/components/camera/cameraProjection.js'

const viewportHeight = 900
const cardinalViews = {
  front: new Vector3(0, 3, 6),
  left: new Vector3(-6, 3, 0),
  right: new Vector3(6, 3, 0),
  top: new Vector3(0, 8, 0),
}

test('cardinal orthographic views match perspective framing at the look-at target', () => {
  const halfFov = CAMERA_FOV * Math.PI / 360

  Object.entries(cardinalViews).forEach(([view, offset]) => {
    const perspectiveHeight = 2 * offset.length() * Math.tan(halfFov)
    const zoom = getPerspectiveMatchedOrthographicZoom(offset, viewportHeight)
    const orthographicHeight = viewportHeight / zoom

    assert.ok(
      Math.abs(orthographicHeight - perspectiveHeight) < 1e-10,
      `${view} should preserve its perspective scale`,
    )
  })
})
