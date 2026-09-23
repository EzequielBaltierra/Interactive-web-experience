import { Canvas } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { GizmoHelper, GizmoViewcube, GizmoViewport } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import * as THREE from 'three'
import CameraRigging from './camera/CameraRigging.jsx'
import DevControls from './camera/DevControls.jsx'
import Ground from './garden/terrain/Ground.jsx'
import Grass from './garden/vegetation/Grass.jsx'
import Trees, { Tree } from './garden/vegetation/Trees.jsx'
import GardenBed from './garden/flowerbed/GardenBed.jsx'
import Lighting from './garden/lighting/Lighting.jsx'
import WindAnimation from './garden/vegetation/WindAnimation.jsx'
import { TERRAIN_FOG_FAR } from './garden/terrain/gardenConfig.js'

const DEFAULT_SELECTED_OBJECT = 'flowerbed'
const TERRAIN_FOG_NEAR = 4
const TERRAIN_FOG_COLOR = '#87CEEB'

function GardenScene() {
  const [view, setView] = useState('main')
  const [selectedObject, setSelectedObject] = useState(DEFAULT_SELECTED_OBJECT)
  const [pauseCameraFollow, setPauseCameraFollow] = useState(false)
  const [cameraMode, setCameraMode] = useState('perspective')
  const [dragging, setDragging] = useState(false)
  const [pickedFlower, setPickedFlower] = useState(null)
  const objectRefs = useRef({})

  const setObjectRef = (objectId, node) => {
    if (node) {
      objectRefs.current[objectId] = node
    } else {
      delete objectRefs.current[objectId]
    }
  }

  const getSelectedObject = () => objectRefs.current[selectedObject] || null

  const selectObject = (objectId) => {
    if (cameraMode === 'perspective' || dragging || pickedFlower) return
    setSelectedObject(objectId)
    setCameraMode('orbital')
  }

  const uprootFlower = (objectId, distance) => {
    setSelectedObject(objectId)
    setPickedFlower({ id: objectId, distance, moving: true, flowerArrived: false })
    setView('top')
    setCameraMode('orbital')
  }

  const finishFlowerMove = (objectId) => {
    setPickedFlower((current) => current?.id === objectId && !current.flowerArrived
      ? { ...current, flowerArrived: true } : current)
  }

  const finishInspectionTransition = (objectId) => {
    setPickedFlower((current) => current?.id === objectId && current.moving
      ? { ...current, moving: false } : current)
  }

  const changeCameraMode = (mode) => {
    if (mode === 'perspective') {
      setPickedFlower(null)
      setSelectedObject(DEFAULT_SELECTED_OBJECT)
      setView('main')
    }
    setCameraMode(mode)
  }

  return (
    <div className="scene">
      <DevControls
        view={view}
        setView={setView}
        pauseCameraFollow={pauseCameraFollow}
        setPauseCameraFollow={setPauseCameraFollow}
        cameraMode={cameraMode}
        setCameraMode={changeCameraMode}
        disabled={dragging || pickedFlower?.moving}
      />
      <Canvas
        dpr={[1, 1.5]}
        shadows={{ type: THREE.PCFShadowMap }}
        style={{ userSelect: 'none', touchAction: 'none' }}
        onContextMenu={(event) => event.preventDefault()}
      >
        <color attach="background" args={[TERRAIN_FOG_COLOR]} />
        <fog attach="fog" args={[TERRAIN_FOG_COLOR, TERRAIN_FOG_NEAR, TERRAIN_FOG_FAR]} />
        <GizmoHelper alignment="bottom-right">
          <GizmoViewport />
          <GizmoViewcube />
        </GizmoHelper>
        <gridHelper args={[2, 2]} />
        <axesHelper args={[10]} />
        <Lighting />
        <WindAnimation />
        <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60} updatePriority={-0.6}>
          <Ground />
          <Grass />
          <GardenBed
            objectRef={(node) => setObjectRef('flowerbed', node)}
            setObjectRef={setObjectRef}
            onSelect={selectObject}
            picking={{
              canDig: cameraMode === 'perspective' && view === 'main' && !pickedFlower && !dragging,
              pickedFlower,
              onDragChange: setDragging,
              onUproot: uprootFlower,
              onArrive: finishFlowerMove,
            }}
          />
          <Trees />
          <Tree
            objectId="tree-feature"
            position={[2, 0, 0]}
          />
        </Physics>
        <CameraRigging
          view={view}
          getSelectedObject={getSelectedObject}
          pauseCameraFollow={pauseCameraFollow || dragging}
          cameraMode={cameraMode}
          pickedFlower={pickedFlower}
          onInspectionReady={finishInspectionTransition}
        />
      </Canvas>
    </div>
  )
}

export default GardenScene
