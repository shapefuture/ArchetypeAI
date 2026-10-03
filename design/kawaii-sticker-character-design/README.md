# My Internal Family — with parts sewn in felt

The IFS sticker-journal app (React 19 + Vite, Tailwind v4). Its parts are now sewn by the
**Felt Atelier** engine in `felt-atelier/`: each part is real stuffed-felt geometry — two cut pieces
inflated into domes, blanket-stitched at the rim, felt eyes and patches laid on the surface — rendered
two ways from one sewing pass:

- **3D** (`src/felt/FeltStage.tsx`) — the plush on a turntable, lit live in the page.
- **2D** (`src/felt/FeltSticker.tsx`) — the flat sticker drawn from the same sewing record.

The header switch (Sewn felt ⇄ Flat art) swaps between the felt parts and the original kawaii art, so
the replacement is visible side by side.

## How a part becomes felt

`src/felt/dnaMap.ts` turns app data into felt DNA, deterministically (seed = hash of the part's id, so a
part is the same plush every reload):

| App | Felt |
|---|---|
| role (Self / Manager / Firefighter / Exile) | engine profile: body priors, mood, axes. The Self is the layered sun |
| part colour | nearest real felt swatch, matched on hue first (pastels keep their identity) |
| species (bunny, fox, ghost, star, hamster) | body outline |
| expression (happy, worried, grumpy, crying, excited) | eyes + mouth |
| accessory (clipboard, shield, lantern, heart…) | a sewn-on patch, or a piece stitched standing off the seam |

`src/felt/engine.ts` is the only place that talks to the engine (`felt-atelier/src`) — nothing about
felt is re-implemented here. Sewing is cached by DNA hash and scheduled one character per idle slice,
so the app never stalls; cards use the crowd LOD, the turntable uses the hero LOD.

## Run it

```
npm install
npm run dev              # dev server
npm run build:preview    # single self-contained felt-preview.html (no network, no server)
npm i --no-save jsdom && npm run smoke   # drives the built file in jsdom and checks the felt parts
```

`felt-preview.html` is the whole app in one file: React, three.js, the engine and Tailwind are inlined.
