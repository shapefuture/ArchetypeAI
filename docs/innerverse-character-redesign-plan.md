# Innerverse — Character Redesign Plan v2 (cosmic ontology)

Status: plan only. v1 (material looks: velvet, lantern, stone, glass, jelly, riso, yarn) is rejected. See §0.
Test character: **The Critic** (Manager · Active · Hot · Self-focused · Anxious · burden 0.82).

---

## 0. Ruthless critique of v1

1. **v1 was a shader dropdown, not a redesign.** Seven "looks" were seven *materials* on the same blob. That is exactly the draft's `FINISHES` list (felt, satin, baked, wet) with nicer names. I repeated the failure I diagnosed.
2. **It copied the references instead of beating them.** Flocked blobs with a beret is what the reference already is. "Superior to anything existing" can't start from the existing thing.
3. **It ignored the product's name.** It's called *Inner­verse*, and v1 put parts on plinths, tabletops and studio sweeps: small, earthly and domestic. Not one look was cosmic.
4. **The axis grammar was unreadable.** Four channels like "crinkled edge = hot" and "frayed rim = anxious" are a legend nobody will learn. Worse, the cosmos already encodes the axes as *position*, so loading them onto the body as well is redundant noise.
5. **The faces were still kawaii stickers.** Decal eyes on a blob are Pou / Molang / Duolingo. Nothing new.
6. **The far transfer was shallow.** Wagashi, Noguchi and Hepworth are design-blog clichés, not transfers that solve a contradiction.
7. **There was no SIGGRAPH idea.** SIGGRAPH rewards a *new way of seeing* (a rendering or interaction idea), not a prettier BRDF. v1 had none.
8. **The metaphor was thin.** Nothing in v1 expressed real IFS mechanics: blending, unblending, Self-energy, protection or polarisation.

**The rule for v2:** the character's *ontology* must be cosmic, and the cosmic physics must *be* the IFS mechanic. If you removed the psychology, the visuals would lose their logic.

---

## 1. Corrected division of labour

| Carrier | Encodes | Why |
|---|---|---|
| **Position in the cosmos** | AGENCY (x) · TEMPERATURE (y) · FOCUS (z) | Space is the honest place for continuous axes. |
| **Orbit around the Self** | ATTACHMENT (avoidant = distant, eccentric, cold orbit; anxious = tight, clinging, fast orbit) | Attachment is a *relation*, so it should be drawn as one. |
| **The body** | role, burden, current mood, blending with Self | These are the things a user needs to *feel*, not read from a legend. |
| **Light** | Self-energy | One light source, the Self. Everything else is lit by it or blocks it. |

Hue is the user's choice. Lightness, glow and value are the system's (Self brightest, Exiles darkest).

---

## 2. Cosmic concepts (each one is a whole ontology, not a skin)

### C1 — "Eclipse" ★ strongest metaphor
- **Ontology:** the Self is a sun. **Every part is a moon-body that can pass in front of it.** In IFS a part *blends* with the Self and eclipses it; *unblending* is the part moving aside. Here that's literal astronomy.
- **Body:** a dark disc or silhouette (a perfect 2D glyph by definition) wearing a **corona**, plasma streamers from the backlight. Corona shape is the personality: managers have tight regular streamers (like the solar-minimum corona), firefighters have flaring prominences, exiles have barely any rim.
- **Face:** **Baily's beads.** Two points of sunlight leaking through the silhouette's edge act as eyes. Expression = how they open, narrow or close. No stickers.
- **The Critic:** a sharp, leaning crescent-shield silhouette with spiky, hot, asymmetric streamers, its "eyes" two narrow bead slits glaring down. When selected it slides over the sun and the whole cosmos dims (you feel the blend). Drag it off, and light floods back: unblending as a gesture.
- **Burden:** the corona is choked on one side by dark ejected matter. Unburdening = a coronal mass ejection flung into deep space.
- **Render:** volumetric corona (raymarched streamers along a field-line SDF), diamond-ring bloom, limb darkening.
- **2D:** a black glyph with a light rim. It reads at 16px, and as an app icon it's iconic.

### C2 — "Phase" ★ strongest expression system
- **Ontology:** each part is a small world lit only by the Self, so **the part's mood is its phase.**
- **Face:** the **terminator line (day/night edge) is the eyelid.** Full = open and present. Crescent = withdrawn, sleepy, ashamed. New = exiled in darkness. Gibbous = curious. Eyes are two craters or lakes that catch a glint when lit.
- **Body:** a planetoid whose silhouette comes from the user's glyph. Moons are the "hands" (no limbs): they're satellites it holds, flings or hides behind.
- **The Critic:** a hard, faceted world with a sharp terminator that cuts its eyes into a squint. Its two small moons orbit tight and fast (anxious), and it sits on the sunward side, throwing its shadow onto the exiles behind it. Protection, made visible as shadow.
- **Burden:** a dark crater lake that never reflects. Unburdening = it fills with light.
- **Why it's novel:** expression comes from *lighting geometry*, not from drawn features. Moving the Self (the light) changes every part's expression at once, so the whole system reacts to Self-presence.

### C3 — "Anamorphic Constellation" ★ most SIGGRAPH
- **Ontology:** a part is **5–12 stars scattered in depth.** From most viewpoints it's just stars. **Seen from the Self, they snap into a figure:** the part's glyph, connected by faint lines.
- **IFS mechanic:** you only see a part clearly when you look from Self. Camera at the Self = the system resolves into creatures. Camera wandering = chaos.
- **Face:** two of the stars form a close binary pair, and those are the eyes. They blink by occulting each other.
- **The Critic:** a sharp seven-star figure, a leaning wedge whose binary eyes sit low (self-focused). From off-axis it shatters into an aggressive scatter of hot white-blue stars.
- **Burden:** a dark star (a hole in the figure) that bends the light of its neighbours.
- **Render:** point sprites with a spectral PSF and diffraction spikes, anamorphic solving of star depths, line glow. Cheap (it's points), so 60 fps on phones even with 30 parts.
- **2D:** the resolved constellation glyph, as clean as a road sign.

### C4 — "Nebula Nursery"
- **Ontology:** a part is a **gas cloud with a protostar heart.** Its silhouette is the bright ionisation rim (like the Pillars of Creation: crisp edges in soft volume).
- **Agency:** active = collapsing, with a bipolar jet. Receptive = a diffuse, open cloud.
- **Face:** two embedded young stars glowing through the gas.
- **Burden = a Bok globule,** an opaque knot of dust over the heart. Unburdening = the globule evaporates and the star ignites (a "birth" moment, very shareable).
- **The Critic:** a dense, sharp-rimmed pillar with a jet firing inward at itself.
- **Risk:** volumetrics are heavy, and the silhouette is softer in 2D, so it needs a rim-led glyph.

### C5 — "Lensing" (for exiles and hidden parts)
- **Ontology:** an exile is a body you **can't see, only infer** from how it bends the starlight behind it (gravitational lensing, an Einstein ring).
- **IFS mechanic:** "The Unseen One" is literally unseen. Getting to know an exile slowly turns the lens into a visible body.
- **Face:** two small photon-ring glints.
- **Use:** this is not a full look, but a *state* layer that works on top of C1–C3.

---

## 3. Shared rules for every concept
- **No limbs.** Agency comes from motion, orbit, ejecta, satellites and light.
- **Eyes come from light physics** (beads, glints, binary stars), never stickers. Warmth comes from *behaviour*: eyes track the Self, bodies drift closer when noticed, blinks are occultations.
- **One silhouette glyph** per part, user-editable (convexity, lean, points, cup, asymmetry). Every concept derives its 2D icon from the glyph.
- **Customization:** glyph × corona / phase / star pattern × eye light × satellite set × hue. It's interchangeable across concepts, so a user's constellation can be re-rendered in any look.
- **Temperature caveat:** in astronomy hot = blue and in emotion hot = red. Don't fight this with hue (hue is the user's). Temperature shows as *activity*: flare rate, twinkle speed and jet strength.

---

## 4. What would make this actually win (and what could kill it)

| Risk | Mitigation |
|---|---|
| Cosmic = cold, NASA-poster, not lovable | Behavioural warmth (gaze, approach, breathing) and soft glow falloff. The test is whether a stranger says "aww" within 5 seconds. |
| Cosmic clichés (purple nebula wallpaper) | Near-black, mostly empty space. Light comes from the Self only, never decorative starfields. Restraint is the look. |
| Unreadable at small sizes | Every concept is glyph-first. The 32px silhouette test is mandatory. |
| Too abstract to feel like a "character" | Two eyes always, always looking at something meaningful (the Self, you, or the part it protects). |

---

## 5. Recommendation and next step
- **Prototype C1 Eclipse, C2 Phase and C3 Anamorphic** as one single-character lab page for The Critic: a concept switcher, a movable Self-light, a blend/unblend drag, and an unburden action.
- C4 is an optional hero or celebration effect. C5 is a state layer for exiles.
- Judge them with: the 32px silhouette test, the "aww in 5 seconds" test, a blind role guess, a phone performance check, and whether blending and unblending is *felt* without explanation.
- Only after a winner is picked: the cosmos (axes as space, attachment as orbits, relationships as gravity and tides).
