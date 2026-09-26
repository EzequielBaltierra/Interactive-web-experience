# Interactive Web Experience

An interactive 3D garden built with React, Vite, Three.js, React Three Fiber, Drei, and Rapier. This portfolio project explores a flower fortune experience through procedural scenery, model interaction, and petal physics.

The current build opens behind a full-screen loading indicator that tracks the shared 3D asset queue and waits for both canvases to initialize before revealing the animated question-entry scene. It then transitions into a clean garden demo with twelve flowers and no developer controls. Removing every petal reveals the submitted question with its answer: YES for an odd petal count, NO for even. The current ten-petal flower always produces NO.

## Try the garden

1. Click the framed 3D text box, type a question, and press Enter or the arrow button. Its center panel uses cherry veneer and its outer frame uses rough wood. The submitted question appears again in the final result.
2. The garden starts in its locked main perspective view. Drag a flower upward; release before its base clears the soil to let it settle back.
3. Lift it clear to enter a close, top-down orbital view. The camera takes a direct 0.65-second path while preserving its horizontal heading. Once the flower and camera settle, its complete model is replaced by a stem and ten separate petals.
4. Click petals to detach them and watch them fall and collide. Each pick creates a separate screen-space label around the flower: YES on odd picks, NO on even picks. Labels rise and fade over 1.8 seconds; reduced-motion settings use a stationary fade. Dragging to orbit does not remove a petal; petal dragging is still planned.
5. After the final petal is removed and its label fades, a green, dark-wood-framed result card repeats the submitted question with its Yes/No answer. Select **Ask another question** to reset the flower and camera and return to question entry.

The camera remains in the main perspective view while choosing a flower and changes to orbital control only after a flower is lifted into inspection.

## Component map

```text
src/components/
  GardenScene.jsx       Active scene, selection, and inspection state
  Testing.jsx           Isolated developer sandbox
  question/             3D question prompt and entry transition
  result/               Question, YES/NO result, and restart action
  camera/               Camera rigging, view definitions, and inspection motion
  garden/
    terrain/            Ground geometry, height sampling, shared dimensions
    vegetation/         Grass, trees, foliage, shared resources, and wind
    flowerbed/          Bed model assembly and texture mapping
    flowers/            Grid placement, movement, parts, and collisions
    lighting/           Garden scene lighting
  testing/              Sandbox wind adapter
```

`App.jsx` mounts `GardenScene`, which composes the modules below. `Testing` remains available for isolated experiments.

### Geometry and terrain

- **Ground / terrain.js:** displace a subdivided plane on the CPU. The same triangle heights place objects and define the ground collider, keeping rendered ground and physical contact aligned.
- **Grass / grassGeometry.js:** build each blade from two crossed, tapered ribbons. Instancing draws many copies efficiently; spatial batches allow distant or off-screen grass to be skipped.
- **Trees / BarkCylinder / Foliage:** combine tapered cylinders for trunks and branches with rounded clouds of masked leaf cards. Cards are small planes whose texture mask cuts out leaf silhouettes.
- **gardenConfig.js:** keeps terrain dimensions, noise settings, and far-fog distance together. Grounded objects sample terrain at their origin; wide models do not bend to match a slope.

### Models and materials

**GardenBed** assembles three GLB models under one grounded parent: planks, posts, and dirt. **GardenBedPart** loads each part; **gardenBedModels.js** assigns hinoki-plank, rough-wood, or farm-soil textures. Generated box-projected UV coordinates tell the models how to display those textures.

Color maps provide surface color, normal maps add apparent detail without extra geometry, and roughness maps control how broadly light reflects. Tree bark shares the rough-wood material. Resource helpers share reusable materials and dispose of owned copies when no longer needed.

Assets live in `public/assets/models/garden-bed/`, `public/assets/models/flowers/flower1/`, and material-specific folders under `public/assets/textures/`. Future flower variants belong in sibling model folders.

### Grid assignment and random generation

**FlowerGrid** plants twelve copies of the current flower in a 4-by-3 soil grid. **flowerGrid.js** places one flower at a randomized position inside each cell, samples the dirt surface, and holds scale, burial, and bud-target settings.

**Trees** scatters 160 trees plus one separately placed feature tree. Population scales cycle through three sizes; each tree independently includes or omits its two branches. Grass position, width, and lean also vary. Tree and grass layouts are generated per module load, while branch choices are fixed for each mount; layouts are not seeded.

### Flower interaction and physics

**PickableFlower** owns pointer dragging and movement into inspection. **flowerPicking.js** supplies soil-clearance and destination calculations. **FlowerParts** loads the stem and individual petals mapped in **flowerParts.js**, then releases clicked petals into Rapier's gravity simulation.

**useFlowerCollider** keeps planted-flower colliders aligned while flowers move. Terrain and bed use mesh colliders; tree wood and flower parts use convex hulls. Grass and leaf cards are decorative. The stem and attached petals stay fixed during inspection, while detached petals fall, collide, and settle.

### Lighting and camera

**Lighting** combines hemisphere light for sky/ground fill, ambient light, and a directional light with a 2048-square shadow map. **GardenScene** adds distance fog without exposing grid, axes, light-direction, or view-gizmo helpers. The current bright inspection lighting precedes the planned atmospheric presentation.

**CameraRigging** keeps the demo on its main perspective view until a flower is selected, then enables orbital inspection around that flower. The transition preserves the starting horizontal heading and moves directly toward the flower's final inspection position.

### Shaders and wind

A vertex shader moves geometry on the GPU before it is drawn. **vegetationWind.js** extends Three.js materials through `onBeforeCompile`, retaining their built-in lighting and fog.

- **Shared uniforms:** time, wind strength/direction, and camera orientation are inputs updated by **WindAnimation** each frame. Grass and foliage use different sway amplitudes.
- **Grass bending:** per-vertex weights increase from root to tip. Squared weights keep roots pinned while static lean and layered sine waves bend the upper blade.
- **Foliage billboarding:** leaf cards expand along the camera's right/up directions so the canopy stays full from different views. Alpha testing discards transparent parts of the leaf mask.
- **Matching shadows:** a depth material repeats the deformation and alpha mask when drawing the shadow map, keeping moving silhouettes and shadows aligned. Leaf cards cast shadows but do not receive them.

Wind changes rendered vertices, not collision geometry. Grass lighting normals approximate the bent surface. **useTestingWind** applies the shared shader to copied sandbox geometry and materials without modifying cached models.

## Remaining implementation

- Add updated, varying flower models with matching stems, petals, placement settings, and petal counts.
- Extend click-to-remove petals into a deliberate dragging interaction.
- Add selected-flower dimming/blur and continue refining the result presentation.
- Refine atmospheric styling and verify accessibility, touch interaction, and browser performance.

## Development

```bash
npm install
npm run dev
```

React and React DOM use matching `~19.2.8` ranges, compatible with Fiber 9.7's React requirement (`>=19 <19.3`). The tilde allows 19.2 patch updates without moving to 19.3. Use `npm ci` for a reproducible installation from the lockfile; no legacy peer override is needed.

```bash
npm run lint
npm test
npm run build
npm run preview
```

The build produces a static site in `dist/`. The 3D and physics bundle still needs a loading-performance review.

## Tests and build verification

AI assistance was used to integrate application logic and functionality tests. The tests use Node.js's built-in runner.

| Test file | What it checks |
| --- | --- |
| [cameraProjection.test.mjs](tests/cameraProjection.test.mjs) | Perspective-to-orthographic framing calculations. |
| [garden.test.mjs](tests/garden.test.mjs) | Terrain sampling, grounded model positions, terrain boundaries, grass coverage, and blade proportions. |
| [gardenBed.test.mjs](tests/gardenBed.test.mjs) | Bed-part alignment, texture availability and EXR decoding, and resource cleanup without modifying cached assets. |
| [flowerPicking.test.mjs](tests/flowerPicking.test.mjs) | Drag-height limits, clearance above soil, inspection positioning, and consistent movement across frame rates. |
| [inspectionTransition.test.mjs](tests/inspectionTransition.test.mjs) | Straight camera motion, unchanged horizontal heading, top-down arrival, and frame-rate-independent completion. |
| [flowerParts.test.mjs](tests/flowerParts.test.mjs) | Stem/petal alignment and simulated collisions between detached petals, the bed, and terrain. |
| [vegetation.test.mjs](tests/vegetation.test.mjs) | Grass and foliage geometry, instanced batches, shared-resource cleanup, matching surface/shadow shader settings, and transform calculations. |

Run `npm test` for these logic and functionality checks, `npm run lint` for static code checks, and `npm run build` to verify production compilation and bundling. Tests do not run automatically during the build. Browser rendering, GPU shader compilation, and pointer interactions still require manual verification.
