import { Canvas } from '@react-three/fiber'
import { useRef, useState } from 'react'
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
import FinalAnswer from './result/FinalAnswer.jsx'
import PetalPickFeedback from './garden/flowers/PetalPickFeedback.jsx'

const DEFAULT_SELECTED_OBJECT = 'flowerbed'
const TERRAIN_FOG_NEAR = 4
const TERRAIN_FOG_COLOR = '#87CEEB'

function GardenScene({ isQuestionActive = false, onReturnToQuestion, onReady }) {
  const [view, setView] = useState('main')
  const [selectedObject, setSelectedObject] = useState(DEFAULT_SELECTED_OBJECT)
  const [pauseCameraFollow, setPauseCameraFollow] = useState(false)
  const [cameraMode, setCameraMode] = useState('perspective')
  const [dragging, setDragging] = useState(false)
  const [pickedFlower, setPickedFlower] = useState(null)
  const objectRefs = useRef({})
  const allPetalsPicked = pickedFlower?.totalPetals > 0
    && pickedFlower.pickedPetalCount === pickedFlower.totalPetals
  const answer = allPetalsPicked ? (pickedFlower.pickedPetalCount % 2 === 1 ? 'YES' : 'NO') : null

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

  const uprootFlower = (objectId, distance, focus) => {
    setSelectedObject(objectId)
    setPickedFlower({ id: objectId, distance, focus, moving: true, flowerArrived: false, pickedPetalCount: 0, totalPetals: 0, petalLabels: [] })
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

  const recordPetalProgress = (objectId, pickedPetalCount, totalPetals) => {
    setPickedFlower((current) => current?.id === objectId && !current.moving
      && pickedPetalCount > current.pickedPetalCount
      ? {
        ...current, pickedPetalCount, totalPetals,
        petalLabels: [...current.petalLabels, pickedPetalCount],
      } : current)
  }

  const finishPetalLabel = (count) => {
    setPickedFlower((current) => current ? {
      ...current, petalLabels: current.petalLabels.filter((label) => label !== count),
    } : current)
  }

  const returnToQuestion = () => {
    changeCameraMode('perspective')
    setPauseCameraFollow(false)
    onReturnToQuestion?.()
  }

  return (
    <div className="scene">
      {!isQuestionActive && (
        <DevControls
          view={view}
          setView={setView}
          pauseCameraFollow={pauseCameraFollow}
          setPauseCameraFollow={setPauseCameraFollow}
          cameraMode={cameraMode}
          setCameraMode={changeCameraMode}
          disabled={dragging || pickedFlower?.moving}
          onReturnToQuestion={returnToQuestion}
        />
      )}
      <Canvas
        dpr={[1, 1.5]}
        shadows={{ type: THREE.PCFShadowMap }}
        style={{ userSelect: 'none', touchAction: 'none', pointerEvents: answer ? 'none' : 'auto' }}
        onContextMenu={(event) => event.preventDefault()}
        onCreated={onReady}
      >
        <color attach="background" args={[TERRAIN_FOG_COLOR]} />
        <fog attach="fog" args={[TERRAIN_FOG_COLOR, TERRAIN_FOG_NEAR, TERRAIN_FOG_FAR]} />
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
              canDig: !isQuestionActive && cameraMode === 'perspective' && view === 'main' && !pickedFlower && !dragging,
              pickedFlower,
              onDragChange: setDragging,
              onUproot: uprootFlower,
              onArrive: finishFlowerMove,
              onPetalProgress: recordPetalProgress,
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
      {!isQuestionActive && pickedFlower && (
        <PetalPickFeedback
          counts={pickedFlower.petalLabels}
          pickedPetalCount={pickedFlower.pickedPetalCount}
          onLabelFinished={finishPetalLabel}
        />
      )}
      {/* Let the final pick's label finish before presenting the lasting answer. */}
      {!isQuestionActive && answer && pickedFlower.petalLabels.length === 0 && <FinalAnswer answer={answer} />}
    </div>
  )
}

export default GardenScene
