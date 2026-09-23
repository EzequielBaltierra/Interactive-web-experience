import * as THREE from 'three'

// Shared by the visible materials and shadow materials. Strength zero stops wind.
export const windUniforms = {
  uVegetationTime: { value: 0 },
  uWindStrength: { value: 1 },
  uWindDirection: { value: new THREE.Vector2(1, 0.35).normalize() },
  uCameraRight: { value: new THREE.Vector3(1, 0, 0) },
  uCameraUp: { value: new THREE.Vector3(0, 1, 0) },
}

export function applyVegetationShader(material, { amplitude, billboardSize = 0, grass = false }) {
  if (grass) material.defines = { ...material.defines, GRASS_BLADE: 1 }
  if (billboardSize > 0) material.defines = { ...material.defines, FOLIAGE_CARDS: 1 }
  material.customProgramCacheKey = () => `vegetation-${amplitude}-${billboardSize}-${grass}`
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, windUniforms, {
      uWindAmplitude: { value: amplitude },
      uBillboardSize: { value: billboardSize },
    })
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `
      #include <common>
      attribute float windWeight;
      attribute vec3 windAnchor;
      #ifdef GRASS_BLADE
        attribute vec2 bladeBend;
      #endif
      uniform float uVegetationTime;
      uniform float uWindStrength;
      uniform float uWindAmplitude;
      uniform float uBillboardSize;
      uniform vec2 uWindDirection;
      uniform vec3 uCameraRight;
      uniform vec3 uCameraUp;
    `).replace('#include <begin_vertex>', `
      #include <begin_vertex>
      mat4 vegetationMatrix = modelMatrix;
      #ifdef USE_INSTANCING
        vegetationMatrix = modelMatrix * instanceMatrix;
      #endif
      vec3 anchorWorld = (vegetationMatrix * vec4(windAnchor, 1.0)).xyz;
      float phase = dot(anchorWorld.xz, vec2(1.7, 1.1));
      float sway = sin(uVegetationTime * 1.25 + phase)
        + 0.25 * sin(uVegetationTime * 2.3 + phase * 1.8);
      vec3 offsetWorld = vec3(uWindDirection.x, 0.0, uWindDirection.y)
        * sway * uWindAmplitude * uWindStrength * windWeight * windWeight;
      #ifdef GRASS_BLADE
        offsetWorld += vec3(bladeBend.x, 0.0, bladeBend.y) * windWeight * windWeight;
      #endif

      // Like the PDF, expand each full-UV card toward the camera. Use the main
      // camera basis in shadow passes too, so silhouettes don't turn toward the light.
      #ifdef FOLIAGE_CARDS
        vec2 cardOffset = uv * 2.0 - 1.0;
        offsetWorld += (uCameraRight * cardOffset.x + uCameraUp * cardOffset.y)
          * uBillboardSize * length(vegetationMatrix[0].xyz);
      #endif
      // These meshes use rotation and scale, without shear. Projecting onto the
      // orthogonal basis avoids a matrix inverse for every vertex in both passes.
      mat3 basis = mat3(vegetationMatrix);
      transformed += vec3(
        dot(offsetWorld, basis[0]) / dot(basis[0], basis[0]),
        dot(offsetWorld, basis[1]) / dot(basis[1], basis[1]),
        dot(offsetWorld, basis[2]) / dot(basis[2], basis[2])
      );
    `)
  }
  return material
}

export function createWindMaterials({ color, amplitude, alphaMap = null, billboardSize = 0, grass = false }) {
  const settings = { amplitude, billboardSize, grass }
  const surface = { side: THREE.DoubleSide, alphaMap, alphaTest: alphaMap ? 0.5 : 0 }
  const material = applyVegetationShader(new THREE.MeshLambertMaterial({ color, ...surface }), settings)
  const depthMaterial = applyVegetationShader(new THREE.MeshDepthMaterial({
    ...surface, depthPacking: THREE.RGBADepthPacking,
  }), settings)
  return { material, depthMaterial }
}
