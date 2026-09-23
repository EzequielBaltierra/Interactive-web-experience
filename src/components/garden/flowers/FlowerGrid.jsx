import { useMemo, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import PickableFlower from './PickableFlower.jsx'
import { gardenBedParts } from '../flowerbed/gardenBedModels.js'
import { createFlowerGrid, flowerModels, FLOWER_GRID } from './flowerGrid.js'

const soilModel = gardenBedParts.find((part) => part.name === 'dirt').model

export default function FlowerGrid({ flowerType = 'flower1', bedId, setObjectRef, onSelect, picking }) {
  const { scene: soil } = useGLTF(soilModel)
  const { scene: flower } = useGLTF(flowerModels[flowerType])
  // One random point per cell, stable during camera changes and selection.
  const [samples] = useState(() => Array.from(
    { length: FLOWER_GRID.columns * FLOWER_GRID.rows },
    () => [Math.random(), Math.random()],
  ))
  const placements = useMemo(() => createFlowerGrid(soil, flower, samples), [soil, flower, samples])

  return (
    <group name="flowers">
      {placements.map((placement, index) => {
        const objectId = `${bedId}-flower-${index + 1}`
        return (
          <PickableFlower
            key={objectId}
            objectId={objectId}
            flower={flower}
            flowerType={flowerType}
            placement={placement}
            setObjectRef={setObjectRef}
            onSelect={onSelect}
            {...picking}
          />
        )
      })}
    </group>
  )
}
