// Viewport percentages spread the labels around the centered inspection flower.
// These stay in the camera's 2D plane while the garden can orbit underneath.
const LABEL_POSITIONS = [
  [16, 38], [78, 60], [48, 22], [24, 73], [80, 38],
  [26, 24], [57, 80], [82, 77], [17, 61], [72, 25],
]

export default function PetalPickFeedback({ counts, pickedPetalCount, onLabelFinished }) {
  return (
    <>
      <div className="petal-pick-feedback" aria-hidden="true">
        {counts.map((count) => {
          const [left, top] = LABEL_POSITIONS[(count - 1) % LABEL_POSITIONS.length]
          return (
            <span
              key={count}
              className="petal-pick-label"
              style={{ left: `${left}%`, top: `${top}%` }}
              onAnimationEnd={() => onLabelFinished(count)}
            >
              {count % 2 === 1 ? 'YES' : 'NO'}
            </span>
          )
        })}
      </div>
      <span className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {pickedPetalCount > 0 && `Petal ${pickedPetalCount}: ${pickedPetalCount % 2 === 1 ? 'YES' : 'NO'}`}
      </span>
    </>
  )
}
