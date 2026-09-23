import { viewOffsets } from './cameraViews.js'

export default function DevControls({
  view,
  setView,
  pauseCameraFollow,
  setPauseCameraFollow,
  cameraMode,
  setCameraMode,
  disabled = false,
}) {
  return (
    <div className="scene-controls">
      <div className="camera-mode-controls" aria-label="Camera mode">
        <button
          type="button"
          disabled={disabled || cameraMode === 'orbital'}
          aria-pressed={pauseCameraFollow}
          onClick={() => setPauseCameraFollow((isEnabled) => !isEnabled)}
        >
          {pauseCameraFollow ? 'Resume camera follow' : 'Pause camera follow'}
        </button>
        {[
          ['perspective', 'Perspective'],
          ['orbital', 'Orbital'],
        ].map(([mode, label]) => (
          <button
            key={mode}
            disabled={disabled}
            type="button"
            aria-pressed={cameraMode === mode}
            onClick={() => setCameraMode(mode)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="scene-view-controls" aria-label="Camera views">
        {Object.keys(viewOffsets).map((viewName) => (
          <button
            key={viewName}
            disabled={disabled}
            type="button"
            aria-pressed={view === viewName}
            onClick={() => setView(viewName)}
          >
            {viewName}
          </button>
        ))}
      </div>
    </div>
  )
}
