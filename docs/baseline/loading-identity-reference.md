# Loading identity reference

Source audit snapshot: repository commit `610d2a0` (`docs: capture Stage 0 baseline evidence`), branch `codex/stage0-loading-reference`. Scope follows [80-20 plan §8.1](../80-20-plan.md#81-step-by-step-baseline), item 6, and Bead `ArchetypeAI-28h.1.3`. This is a source-only reference: neither app was launched, and no runtime, device, account, or network behavior was observed.

## Source evidence

### Current React arrival

- `src/parts-cartographer/screens/landing.jsx:12-38` defines the `Loading` screen. It centers a 250 px composition with a 130 px floating character, `PARTS.` mark, translated app name, progress bar, three dots, and one of three rotating boot labels. The character is seeded from `seed-self`, with a fallback to the first seed part (`:26-28`).
- `src/parts-cartographer/app.jsx:174-195` leaves loading after a fixed 4,200 ms timer. It then starts anonymous auth bootstrap, selects onboarding or intro from local onboarding state, and applies supported deep links. Auth completion does not gate this transition in the shown code (`:177-181`).
- The bar is a timed visual: `landing.jsx:15-20` advances it by 1.4 every 55 ms, independent of a readiness signal. The boot label advances every 1,350 ms (`:18-22`).
- `src/parts-cartographer/pal/Character.tsx:1-3` exports `FeltCharacter` as `Character`. `src/parts-cartographer/pal/FeltCharacter.tsx:8-21` asynchronously requests a thumbnail from `felt-engine`, marks the wrapper `data-character-engine="felt-atelier"`, then shows the returned image. Before it resolves or if generation fails, it renders a translucent rounded silhouette (`:10-21`). The `lite` prop passed by the loading screen is accepted in the type but does not alter this implementation (`:4-6`).
- `src/parts-cartographer/services/felt-engine.ts:1-6,12-32,66-82` connects character traits to `felt-atelier` DNA, uses its worker/build path, and generates thumbnails from the same sewn Felt result. The live React loading character is therefore the merged Felt character pipeline, not the legacy Angular SVG blob.

### Angular startup and retained cinematic motifs

- `src/app.component.html:12-81` contains the current root startup state: dark indigo cosmic field, full-screen constellation canvas, three orbital rings with colored dots, a glowing “Self star” made from HTML spans, Innerverse wordmark and translated subline, cycling loading phrase/cursor, progress track, three dots, and tagline. Its hero is not an `<app-blob-character>` or a Felt image.
- `src/styles/loading-screen.css:7-24,38-77,79-120,122-226` supplies the night gradient and grain, particle/orbit presentation, CSS glow and star flares, wordmark, loading copy, gold progress meridian, star knob, dots, and tagline. Reduced-motion handling is defined at `:238-248`.
- `src/app.component.ts:459-562` defines the staged GSAP sequence: rings and dots appear, the Self star enters with an elastic motion, phrase and progress appear, tagline fades in, then the sequence closes. A 4,200 ms fallback also calls `finishLoading` (`:472-475`). Progress is tweened on a time-based proxy (`:543-550`). `finishLoading` transitions to intro after a fade and profile restoration (`:434-456`).
- `src/app.component.ts:565-658` builds 45 animated canvas particles with glow and nearby constellation links. Phrase keys cycle among “calibrating,” “polishing,” “teaching,” “unfolding,” “reticulating,” and “waking” (`:182-190`; scheduling starts at `:389-394`).
- The archived `design/backup-kawaii/index.html:37-84` loading composition instead places `<app-blob-character>` in the central container. `src/app/shared/components/blob-character/blob-character.component.ts:8-39` draws that character directly as a simple 2D SVG body, limbs, eyes, mouth, and cheeks. This archive is evidence of a legacy 2D loading reference, not evidence that the current Angular startup uses that character. The current root loading markup uses the CSS Self star; the Angular blob component remains used elsewhere in the app (`src/app.component.html:252-253`).

## Preservation recommendation

Keep the React arrival recognizable: the centered floating `seed-self` Felt character, PARTS/app-name lockup, compact progress-and-dots area, and changing boot copy form its current identity. The actual character should continue to come from the merged Felt pipeline so its identity stays consistent with the character system. Treat the pre-render silhouette as a temporary placeholder, not the character artwork.

Carry forward Angular’s cinematic grammar as reference motifs: a quiet night-sky field, a constellation that gathers, orbiting colored part-stars, a luminous central Self, a deliberate entrance, and a restrained wordmark/tagline reveal. Reinterpret the motifs around the React composition and its Felt character. The historical 2D SVG blob can inform continuity only if deliberately redrawn or merged; do not silently substitute it for the current React character.

Make readiness control when the app can be used, and let ceremony provide visual continuity without holding a ready app hostage. Base determinate progress only on measured work; use a labeled indeterminate cue when duration is unknown. When local content is ready, enter it promptly and let any remaining arrival motion resolve nonblockingly. Keep recoverable errors and actual retry/local-continuation choices visible outside the decorative sequence. A static Felt tableau with equivalent status should remain complete under reduced motion. These recommendations follow [80-20 plan §9.1, steps 1-7](../80-20-plan.md#91-shared-foundation-and-preserved-loading-implementation-steps); they describe a target, not behavior verified in the current implementation.

## Evidence limits

The source establishes the React asset-generation path and the Angular templates, styling, and choreography. It does not establish their rendered appearance, animation timing under load, startup readiness duration, accessibility in a browser, or performance on a real device. Those observations require runtime and device capture.
