import * as THREE from 'three'

export const CAMERA_FOV = 75

export function getPerspectiveMatchedOrthographicZoom(viewOffset, viewportHeight) {
  const perspectiveHeight = 2
    * viewOffset.length()
    * Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2))

  return viewportHeight / perspectiveHeight
}
