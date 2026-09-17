# Product Requirements Document (PRD)

## 1. Project Overview

Project name: Interactive Web Experience

This project is a front-end portfolio experience built with React and Vite that blends a 3D visual environment with a fortune-telling interaction. The product is intended to feel atmospheric, magical, and personal while emphasizing creative front-end craftsmanship. The current direction is a single-page interactive experience in which a user asks a question, selects a flower, and receives a narrative answer based on the question category and the flower choice.

The repository currently contains the initial 3D scene foundation for that concept:
- a full-viewport React Three Fiber canvas
- a dark, ambient visual palette
- scene lighting and atmosphere managed by the 3D experience

At this stage, the experience is intentionally a prototype concept rather than a finished commercial product.

## 2. Product Summary

The application should provide a memorable browser-based experience that works as both a creative demonstration and a personal portfolio artifact. The experience should allow a user to:
1. Type or enter a question
2. Pick a flower from a 3D garden scene
3. Drag petals off the selected flower
4. Receive a narrative fortune response based on the question category
5. Restart the experience and ask another question

The final product should feel engaging, elegant, and mystical while remaining lightweight enough for static front-end deployment.

## 3. Product Intent and Brand Direction

This project is primarily a portfolio showcase experience for a career-focused audience, especially recruiters and employers. It is meant to demonstrate a combination of:
- creative visual design
- interactive front-end development
- atmospheric storytelling
- polished UI and motion design

The tone should be magical and inviting, rather than overly playful or gimmicky. The experience should feel premium, calm, and immersive.

## 4. Target Audience

### Primary audience
- Recruiters and employers evaluating creative front-end skills
- Visitors to a portfolio site looking for an engaging experience
- People who enjoy atmospheric and interactive web design

### Secondary audience
- General web users exploring a themed demo
- Creative peers or collaborators evaluating the project concept

## 5. Core User Experience

### Desired flow
1. User lands on the page and sees a blank or nearly empty 3D environment with a subtle atmospheric aesthetic.
2. User is prompted to ask a question.
3. User chooses a flower within the garden scene.
4. The selected flower becomes the focus while the rest of the garden fades or blurs.
5. The user clicks and drags petals away from the flower.
6. Once all petals are removed, the app reveals a narrative fortune response.
7. The user can click to ask another question and restart the experience from the initial screen.

### Experience principles
- Intuitive: the user should understand the interaction quickly
- Atmospheric: the environment should feel dreamy and immersive
- Focused: attention should shift clearly to the chosen flower during the reveal phase
- Replayable: the experience should be easy to repeat without friction

## 6. Functional Requirements

### MVP functional requirements
- The app supports a question-entry step before the flower interaction begins.
- A blank 3D canvas remains available as the background environment with no placeholder object assets.
- Users can pick a flower in the garden scene.
- Upon focusing on a flower, the broader garden scene becomes dimmed and blurred to emphasize the selected flower.
- Users can click and drag petals off the chosen flower.
- The system reveals a narrative fortune response after the petal-removal sequence is complete.
- The user can start over by asking another question after the reveal.
- The experience remains frontend-only and does not require a backend service for initial prototype use.

### Narrative logic requirements
- The fortune response should be based on the question category, not just random text.
- The product should support category-based interpretation such as love, career, personal growth, or uncertainty.
- A future AI-based implementation may analyze the question text to infer category and craft a more tailored narrative response.
- For the prototype, category mapping and narrative generation can be deterministic or rule-based, with AI as an optional enhancement.

### Garden interaction requirements
- The garden scene should initially be a minimal, blank 3D canvas so the project can evolve without placeholder assets.
- The selected flower should stand out visually from the rest of the scene when activated.
- The fade/blur treatment should make the chosen flower the clear focal point.
- Petal removal should be interactive, tactile, and visually satisfying.

## 7. Non-Functional Requirements

### Performance
- The page should load quickly and feel lightweight on a common desktop browser.
- The 3D scene should remain smooth during transitions and interaction.
- There should be no dependency on heavy external assets in the initial version.

### Accessibility
- The experience should retain readable contrast for all UI text over dark backgrounds.
- Interactive elements should be keyboard and pointer accessible where possible.
- Status and result text should be clear, readable, and screen-reader friendly.

### Responsiveness
- The layout must adapt gracefully to desktop and tablet widths.
- The interaction should remain clear even with smaller viewport sizes.

### Maintainability
- The 3D environment should remain separate from the user-flow logic.
- Fortune content and category mapping should be easy to edit and extend.
- The project should be structured so future AI integration can slot into the narrative-generation layer without rewriting the UI.

## 8. Content and Interaction Requirements

The experience should include:
- a clear question prompt
- a simple, elegant text field or question input
- a flower-selection interaction in a 3D garden scene
- a petal-removal sequence
- a final fortune message with a polished, narrative tone
- a replay prompt to begin again

The final narrative response should be more evocative than generic. It should read like an insightful, poetic answer rather than a shallow or placeholder text fragment.

## 9. Visual Requirements

### Environment
- Dark, atmospheric background palette
- Minimal initial scene with blank 3D canvas and subtle lighting
- Ambient and mystical aesthetic suitable for a portfolio showcase

### Scene behavior
- Selected flower is highlighted by dimming and blurring surrounding garden context
- Petal removal should create the feeling of a ritual or reveal sequence
- Transitions should be smooth and intentional rather than abrupt

### Layout
- Future interface elements should overlay cleanly on the 3D canvas without obscuring the active scene.

## 10. Acceptance Criteria

### Functional acceptance criteria
- A user can enter a question and begin the experience.
- A user can pick a flower from the scene.
- The garden scene dims or blurs around the selected flower.
- The user can click and drag petals off the flower.
- After the petal sequence completes, the user sees a narrative fortune response.
- The user can start a new question and re-enter the experience.
- The initial 3D environment does not include placeholder objects or decorative assets that are not part of the final interaction.

### Quality acceptance criteria
- The interface feels polished and intentionally designed.
- The experience supports a clear, memorable interaction loop.
- The scene remains smooth and visually stable during transitions.
- The content and experience align with a portfolio-quality front-end showcase.

## 11. Risks and Constraints

### Risks
- The interaction may feel too ambiguous if the flower action is not communicated clearly.
- A narrative response system without strong category logic could feel generic.
- If the AI feature is added later, it may create complexity without improving the prototype’s core experience.
- The blank 3D canvas may feel under-designed unless the scene is intentionally styled and given a clear focal point.

### Constraints
- The project is intentionally frontend-only for now.
- There are no starter 3D assets to use; the environment must be built from scratch or remain intentionally minimal.
- The concept should remain suitable for a portfolio showcase and not become an overbuilt product before the core interaction is validated.

## 12. Open Decisions and Future Enhancements

The following items are open and should be treated as future iteration areas:
1. Whether the fortune system should remain rule-based in the first version or integrate AI for question analysis.
2. Whether the flower interaction should remain a simple petal-drag sequence or evolve into more complex motion and micro-interactions.
3. Whether the final response should appear in a single result panel, an overlay, or a cinematic reveal state.
4. Whether the garden will remain abstract and minimal or eventually include additional flower variations and environmental details.
5. Whether a future version will include multiple flower asset types or a more generative 3D garden layout.

## 13. Recommended MVP Definition

The recommended MVP is:
- blank 3D canvas foundation without placeholder object assets
- single-page question-entry flow
- one highlighted flower interaction
- click-and-drag petal-removal mechanics
- dim/blur transition around the selected flower
- narrative fortune reveal based on question category
- replay flow to restart the experience
- no backend required for prototype functionality

This MVP is the clearest way to align with the current project direction and the clarified product requirements.

## 14. Next Steps

The next implementation steps should be:
- design the exact question-entry UI and transition to flower selection
- define the question category model and narrative mapping
- build the blank 3D scene with a clear selected-flower focus state
- implement petal drag interactions and reveal sequence
- finalize the restart flow
- verify the experience as a polished prototype for a recruiter-facing portfolio demo
