# ASTATION 5 PRO — PIX ADVENTURE UPDATE 6.1 (PREVIEW)

**Status: test branch, not production.** The public ASTATION OS 5.1 homepage stays live until CI + browser testing confirms this engine is ready.

## What changed in PIX Adventure 6.1

- **Camera-relative controls** with full 360° orbit. Forward always follows the view rather than map axes.
- **Forgiving jumping** with a short coyote-time window and buffered jump input, plus double-jump effects.
- **Energy spring pads** on two islands, burst effects for crystals/terminals/jumps and an animated PIX dash trail.
- **More distinctive Green Valley:** varied island surfaces, ruins, glowing markers, waterfalls and distant moving clouds.
- **Guardian awareness:** patrol, limited-range facing-based detection, chase, short search and return to patrol; dash can stun the Guardian.
- **Fairer obstacles:** the rotating beam, orb and timing gates use position/height-sensitive detection so jumps can avoid hits.
- **HUD and settings:** live objective proximity, dash cooldown, timer, checkpoint feedback, graphical quality buttons in pause and a saved best completion time.
- **Compatibility:** v6 mission save ID is unchanged and existing 5 classic worlds, trophies, installed games and OS settings remain untouched.

## What works in the preview

- **ASTATION OS remains the exact 5.1 console**, including boot sequence, profiles, store, downloads, trophies, control centre, settings, saved progress and collectible avatars.
- **ASTATION WORLD: Dreambound — Green Valley:** one fully designed 3D level with the original PIX model GLB and its Idle, Walk and Jump animation clips, 7 islands, moving platforms, rotating obstacles, energy hazards, a patrolling enemy, 10 crystals, 2 activation terminals, a mid-level checkpoint, a completion portal, and a result screen.
- Three **real, event-triggered** ASTATION trophy events: first crystal (`collect`), Green Valley completion (`worldComplete`), and collecting every crystal (`secret`).
- Real Rapier 3D collision shapes and a kinematic character controller, fixed step 1/90 second, grounded double jump, dash, camera orbit and obstruction checking.
- **Vite + Three.js + Rapier** modular game engine. Independent modules for graphics, physics, loading, AnimationMixer, camera, sound, input and IndexedDB saves.
- Keyboard + mouse, touch joystick/buttons, Gamepad API, adjustable performance/balanced/quality modes, pause/resume, checkpoint restart, photo capture, export, exit.
- Previous five-world Dreambound remains available under **CLASSIC WORLDS**. Existing `ASTATION_WORLD_DREAMBOUND_v4` saves are retained unmodified and OS backups are preserved.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:5173/astation-5-pro/` and install ASTATION WORLD from the store.

Tests and production build:

```bash
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

The GitHub Actions test workflow runs all of those checks on every change to `engine-6-dreambound-preview`.

## Important accuracy notes

- The existing PIX GLB contains **mesh-transform animations** named Idle, Walk and Jump, **not a skinned rig**. The new AnimationMixer supports any GLTF animations, but we will add rigged assets later when Blender production files are available.
- This is **one** next-gen Green Valley level, not six finished games. The five older worlds remain in Classic mode and no other new products appear as unfinished storefront tiles.
- A virtual game download in ASTATION OS does not download a real external title.
- ASTATION has no real online multiplayer backend on GitHub Pages.
- No original PlayStation sounds or assets are included; sound cues are synthesized specifically for ASTATION.

## Figma UI project

Editable Dreambound HUD, loading and pause screens: https://www.figma.com/design/kpMsC4skZIvlbLTOEJavlj

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for module ownership and save compatibility.
