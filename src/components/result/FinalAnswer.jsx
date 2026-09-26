import { useEffect, useRef } from 'react'

export default function FinalAnswer({ question, answer, onRestart }) {
  const restartButtonRef = useRef(null)

  useEffect(() => {
    restartButtonRef.current?.focus()
  }, [])

  const formattedAnswer = answer.toLowerCase() === 'yes' ? 'Yes' : 'No'

  return (
    <section
      className="final-answer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="final-answer-title"
    >
      <div className="final-answer-card">
        <p className="final-answer-eyebrow">The garden has answered</p>
        <h2 id="final-answer-title"><q>{question}</q>... {formattedAnswer}</h2>
        <button ref={restartButtonRef} type="button" onClick={onRestart}>
          Ask another question
        </button>
      </div>
    </section>
  )
}
