import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import GardenScene from './components/GardenScene.jsx'
import QuestionScene from './components/question/QuestionScene.jsx'

function LoadingScreen({ isVisible, progress }) {
  if (!isVisible) return null

  const displayedProgress = Math.round(progress)

  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-screen-content">
        <span className="loading-eyebrow">The garden is stirring</span>
        <div
          className="loading-track"
          role="progressbar"
          aria-label="Loading the garden"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={displayedProgress}
        >
          <span className="loading-fill" style={{ width: `${displayedProgress}%` }} />
        </div>
        <span className="loading-percentage">{displayedProgress}%</span>
      </div>
    </div>
  )
}

function App() {
  const [question, setQuestion] = useState('')
  const [isAskingQuestion, setIsAskingQuestion] = useState(true)
  const [gardenCanvasReady, setGardenCanvasReady] = useState(false)
  const [questionCanvasReady, setQuestionCanvasReady] = useState(false)
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false)
  const { active, progress, total } = useProgress()

  useEffect(() => {
    if (isInitialLoadComplete || active || total === 0 || progress < 100
      || !gardenCanvasReady || !questionCanvasReady) return undefined

    let secondFrame
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setIsInitialLoadComplete(true))
    })

    return () => {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
    }
  }, [active, gardenCanvasReady, isInitialLoadComplete, progress, questionCanvasReady, total])

  const saveQuestion = (nextQuestion) => {
    setQuestion(nextQuestion)
    setIsAskingQuestion(false)
  }

  const skipQuestion = () => setIsAskingQuestion(false)

  return (
    <main className="app">
      <GardenScene
        isQuestionActive={isAskingQuestion}
        question={question}
        onReturnToQuestion={() => setIsAskingQuestion(true)}
        onReady={() => setGardenCanvasReady(true)}
      />
      {isAskingQuestion && (
        <QuestionScene
          initialQuestion={question}
          onComplete={saveQuestion}
          onSkip={skipQuestion}
          onReady={() => setQuestionCanvasReady(true)}
          canEnter={isInitialLoadComplete}
        />
      )}
      <LoadingScreen isVisible={!isInitialLoadComplete} progress={progress} />
    </main>
  )
}

export default App
