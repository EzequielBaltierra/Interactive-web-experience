export default function FinalAnswer({ answer }) {
  return (
    <section className="final-answer" role="status" aria-live="polite">
      <p>{answer}</p>
    </section>
  )
}
