# AGENTS.md

## Project overview
This repository is a React + Vite front-end portfolio experience centered on a mystical fortune-telling interaction. The intended product is a polished, atmospheric, single-page experience that demonstrates creative front-end development and interactive storytelling.

Primary product intent:
- personal portfolio showcase
- recruiter-facing demo
- interactive 3D flower fortune concept
- front-end only implementation

## Core goals
- Create a memorable experience that feels magical, elegant, and modern.
- Showcase strong design sensibility and front-end implementation skill.
- Preserve a lightweight, static-site-friendly architecture.
- Emphasize the user flow: ask a question -> choose flower -> drag petals -> reveal narrative outcome -> restart.

## Project context
Current repo state:
- Vite + React app
- 3D canvas background with React Three Fiber
- dark ambient aesthetic
- no starter asset library for flowers or environment
- no backend requirement for MVP

Important product decisions from the current brief:
- The user enters a question.
- The user selects a flower in a garden scene.
- The chosen flower is emphasized by dimming/blurring the surrounding environment.
- The user clicks and drags petals off the flower.
- After all petals are removed, a narrative fortune result is revealed.
- The user can restart and ask another question.
- AI may be used later to infer question category and generate more tailored responses, but it is not required for the initial prototype.

## Constraints and guardrails
- Do not introduce backend services unless explicitly requested.
- Keep the project light and front-end focused.
- Preserve the experiential aesthetic: atmospheric, mystical, polished, not gimmicky.
- Avoid placeholder content that feels unfinished or generic.
- Do not add heavy external dependencies without strong cause.
- Keep the 3D scene intentionally minimal early on; the blank canvas is acceptable and preferred until the flower interaction is built.

## Codebase conventions
- Keep React logic clear, readable, and beginner-friendly.
- Prioritize minimal invasion and minimal overhaul of existing code.
- Do not refactor broadly just to optimize for abstraction.
- Separate UI state, interaction logic, and 3D scene concerns where practical.
- Maintain a clean distinction between the question flow, the flower interaction, and the result state.
- Prefer simple, maintainable patterns over clever or overly complex ones.
- Treat the project as a learning-stage portfolio build: transparent code is more valuable than impressive complexity.
- Do not add architectural complexity unless it directly supports the feature being built.
- Treat the experience as a portfolio demo, not a generic app template.

## Implementation guidance for AI agents
When editing this project:
1. Start from the current Vite/React structure and preserve the working setup.
2. Keep changes minimal and surgical; avoid large rewrites unless necessary.
3. Favor simple, direct solutions over clever abstractions.
4. Keep the code readable and understandable to a beginner-level developer.
5. Preserve the dark atmospheric mood where it already exists, but do not lock in a final design direction prematurely.
6. Build toward a clear user flow, not a disconnected set of UI components.
7. If adding question classification or fortune generation, keep it modular and easy to swap with AI later.
8. If creating a flower interaction, design it to feel intentional and ritualistic, not random.
9. Treat the blank 3D canvas as a valid base state until the chosen interaction model is finalized.
10. If visual design decisions are not yet finalized, avoid heavy styling overhauls; keep edits lightweight and reversible.

## Files of special importance
- src/App.jsx — app-level flow and composition
- src/components/ThreeScene.jsx — 3D canvas wrapper
- src/scene/Experience.jsx — 3D scene setup and atmosphere
- src/components/ProfileCard.jsx — content surface and overlay UI
- docs/PRD.md — product requirements and product intent

## Working style
- Be concise, direct, and intentional.
- Favor practical implementation over speculative additions.
- Keep the project aligned with the portfolio-demo brief.
- Ask clarifying questions whenever the visual or product direction is ambiguous.

## Success criteria
A good contribution should feel like a polished portfolio experience:
- visually coherent
- emotionally atmospheric
- easy to understand
- smooth in motion and interaction
- intentionally designed for a recruiter-facing demo
