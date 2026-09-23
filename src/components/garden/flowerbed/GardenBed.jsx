import GardenBedPart from './GardenBedPart.jsx'
import { RigidBody } from '@react-three/rapier'
import FlowerGrid from '../flowers/FlowerGrid.jsx'
import { GARDEN_BED_SCALE, gardenBedParts } from './gardenBedModels.js'
import { getModelPosition } from '../terrain/terrain.js'

export default function GardenBed({ position = [0, 0, 0], objectId = 'flowerbed', objectRef, setObjectRef, onSelect, flowerType = 'flower1', picking }) {
  return (
    <group
      ref={objectRef}
      name={objectId}
      position={getModelPosition(position)}
      scale={GARDEN_BED_SCALE}
      onClick={(event) => {
        event.stopPropagation()
        onSelect?.(objectId)
      }}
    >
      {/* Keep each export's local transforms; ground and scale the assembly only once. */}
      {gardenBedParts.map((part) => (
        <RigidBody key={part.name} type="fixed" colliders="trimesh" friction={0.9}>
          <GardenBedPart part={part} />
        </RigidBody>
      ))}
      <FlowerGrid flowerType={flowerType} bedId={objectId} setObjectRef={setObjectRef} onSelect={onSelect} picking={picking} />
    </group>
  )
}
