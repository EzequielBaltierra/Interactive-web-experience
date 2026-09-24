import { Vector3 } from 'three'

export const INSPECTION_TRANSITION_DURATION = 0.65

export function createInspectionTransition(camera, focus, distance) {
  const destinationTarget = new Vector3().fromArray(focus)
  const backward = camera.getWorldDirection(new Vector3()).negate()
  const heading = backward.clone().setY(0)
  if (heading.lengthSq() < 1e-12) heading.set(0, 0, 1)
  heading.normalize()

  return {
    elapsed: 0,
    startPosition: camera.position.clone(),
    // Start along the current sightline, avoiding an initial look-at jump.
    startTarget: camera.position.clone().addScaledVector(backward, -Math.max(
      camera.position.distanceTo(destinationTarget), distance,
    )),
    destinationTarget,
    // A tiny offset avoids the top-down pole without changing the initial heading.
    destinationPosition: destinationTarget.clone()
      .add(new Vector3(0, distance, 0))
      .addScaledVector(heading, distance * 0.001),
  }
}

export function advanceInspectionTransition(transition, camera, lookAt, delta) {
  transition.elapsed = Math.min(transition.elapsed + delta, INSPECTION_TRANSITION_DURATION)
  const progress = transition.elapsed / INSPECTION_TRANSITION_DURATION
  const eased = 1 - (1 - progress) ** 3
  // Fixed endpoints give a straight path, with no chasing a moving flower.
  camera.position.lerpVectors(transition.startPosition, transition.destinationPosition, eased)
  lookAt.lerpVectors(transition.startTarget, transition.destinationTarget, eased)
  camera.lookAt(lookAt)
  return progress === 1
}
