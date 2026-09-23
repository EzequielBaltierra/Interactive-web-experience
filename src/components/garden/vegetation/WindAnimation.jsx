import { useFrame } from '@react-three/fiber'
import { windUniforms } from './vegetationWind.js'

export default function WindAnimation() {
  useFrame(({ clock, camera }) => {
    camera.updateMatrixWorld()
    windUniforms.uVegetationTime.value = clock.elapsedTime
    windUniforms.uCameraRight.value.setFromMatrixColumn(camera.matrixWorld, 0).normalize()
    windUniforms.uCameraUp.value.setFromMatrixColumn(camera.matrixWorld, 1).normalize()
  })
  return null
}
