import { Canvas, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'
import { createTexturedQuestionPart } from './questionBoxMaterials.js'

const BORDER_MODEL = '/assets/models/textbox/Border.glb'
const TEXT_BOX_MODEL = '/assets/models/textbox/Text%20Box.glb'
const EXIT_DURATION = 700
const CHERRY_MAP = '/assets/textures/cherry_veneer_diff_1k.jpg'
const CHERRY_NORMAL = '/assets/textures/cherry_veneer_nor_gl_1k.exr'
const CHERRY_ROUGHNESS = '/assets/textures/cherry_veneer_rough_1k.exr'
const ROUGH_WOOD_MAP = '/assets/textures/rough-wood/rough_wood_diff_1k.jpg'
const ROUGH_WOOD_NORMAL = '/assets/textures/rough-wood/rough_wood_nor_gl_1k.exr'
const ROUGH_WOOD_ROUGHNESS = '/assets/textures/rough-wood/rough_wood_rough_1k.jpg'

function TexturedQuestionPart({ source, textures, normalizedUvs, onActivate }) {
  const groupRef = useRef(null)

  useLayoutEffect(() => {
    const group = groupRef.current
    const part = createTexturedQuestionPart(source, textures, normalizedUvs)
    group.add(part.scene)
    return () => {
      group.remove(part.scene)
      part.dispose()
    }
  }, [source, textures, normalizedUvs])

  return (
    <group
      ref={groupRef}
      onClick={onActivate}
      onPointerOver={() => { document.body.style.cursor = 'text' }}
      onPointerOut={() => { document.body.style.cursor = '' }}
    />
  )
}

function QuestionBoxModels({ onActivate }) {
  const border = useGLTF(BORDER_MODEL)
  const textBox = useGLTF(TEXT_BOX_MODEL)
  const viewport = useThree((state) => state.viewport)
  const [roughWoodMap, roughWoodRoughness, cherryMap] = useLoader(THREE.TextureLoader, [
    ROUGH_WOOD_MAP,
    ROUGH_WOOD_ROUGHNESS,
    CHERRY_MAP,
  ])
  const [roughWoodNormal, cherryNormal, cherryRoughness] = useLoader(EXRLoader, [
    ROUGH_WOOD_NORMAL,
    CHERRY_NORMAL,
    CHERRY_ROUGHNESS,
  ])
  const borderTextures = useMemo(() => ({
    map: roughWoodMap,
    normalMap: roughWoodNormal,
    roughnessMap: roughWoodRoughness,
  }), [roughWoodMap, roughWoodNormal, roughWoodRoughness])
  const panelTextures = useMemo(() => ({
    map: cherryMap,
    normalMap: cherryNormal,
    roughnessMap: cherryRoughness,
  }), [cherryMap, cherryNormal, cherryRoughness])
  const scale = Math.min(viewport.width * 0.005, viewport.height * 0.007)

  return (
    <group position={[viewport.width * 0.03, 0, 0]} rotation={[Math.PI / 2, 0, 0]} scale={scale}>
      {/* Center the authored model bounds at the viewport center. */}
      <group position={[0, -3, -0.5]}>
        <TexturedQuestionPart source={border.scene} textures={borderTextures} normalizedUvs={false} />
        <TexturedQuestionPart
          source={textBox.scene}
          textures={panelTextures}
          normalizedUvs
          onActivate={(event) => {
            event.stopPropagation()
            onActivate()
          }}
        />
      </group>
    </group>
  )
}

export default function QuestionScene({ initialQuestion = '', onComplete, onReady, canEnter = true }) {
  const [draft, setDraft] = useState(initialQuestion)
  const [phase, setPhase] = useState('before-entry')
  const inputRef = useRef(null)
  const exitTimerRef = useRef(null)

  useEffect(() => {
    if (!canEnter) return undefined

    const frame = requestAnimationFrame(() => setPhase('ready'))
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [canEnter])

  useEffect(() => () => {
    clearTimeout(exitTimerRef.current)
    document.body.style.cursor = ''
  }, [])

  const submitQuestion = (event) => {
    event.preventDefault()
    const question = draft.trim()
    if (!question || phase === 'exiting') return

    setPhase('exiting')
    inputRef.current?.blur()
    exitTimerRef.current = setTimeout(() => onComplete(question), EXIT_DURATION)
  }

  return (
    <section className="question-scene" data-phase={phase} aria-labelledby="question-title">
      <div className="question-blue-veil" aria-hidden="true" />
      <div className="question-content">
        <header className="question-copy">
          <h1 id="question-title">Enter your yes or no question</h1>
          <p>Hold it clearly in your mind, then offer it to the garden.</p>
        </header>
        <div className="question-model" aria-hidden="true">
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 1.5]} onCreated={onReady}>
            <ambientLight intensity={1.8} />
            <directionalLight position={[-2, 3, 4]} intensity={2.2} />
            <QuestionBoxModels onActivate={() => inputRef.current?.focus()} />
          </Canvas>
        </div>
        <form className="question-form" onSubmit={submitQuestion}>
          <label className="visually-hidden" htmlFor="garden-question">Enter your question</label>
          <input
            ref={inputRef}
            id="garden-question"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            type="text"
            maxLength={180}
            autoComplete="off"
            placeholder="What would you like to know?"
          />
          <button className="question-submit" type="submit" disabled={!draft.trim()} aria-label="Offer question to the garden">
            <span aria-hidden="true">&#8594;</span>
          </button>
        </form>
        <span className="question-hint">Press Enter to continue</span>
      </div>
    </section>
  )
}

useGLTF.preload(BORDER_MODEL)
useGLTF.preload(TEXT_BOX_MODEL)
