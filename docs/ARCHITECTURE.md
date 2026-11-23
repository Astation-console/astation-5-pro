# ASTATION GAME ENGINE 6.0 — preview architecture

One shared browser-native renderer and physics runtime for the next-generation games.

- `src/core/Engine.js` — Three.js renderer, frame scheduling and resource disposal.
- `src/core/Physics.js` — Rapier 3D, character movement and platform colliders.
- `src/core/CameraRig.js` — adaptive third-person/cinematic and collision avoidance.
- `src/core/AnimationController.js` — GLB clips and AnimationMixer transitions.
- `src/core/Resources.js` — GLTF loading/progress/disposal.
- `src/input/InputManager.js` — keyboard, touch and Gamepad API.
- `src/systems/SaveManager.js` — versioned, per-game IndexedDB records with local fallback.
- `src/systems/MissionManager.js` — deterministic, event-driven objectives and checkpoints.
- `src/systems/TrophyBridge.js` — ASTATION OS postMessage contract, origin validation.
- `src/audio/AudioManager.js` — original Web Audio sounds, 3D panning when supported.
- `src/games/world` — Green Valley level, original PIX model and world-specific logic.

There is only **one** next-generation playable level in this preview. The existing 5-world game is preserved at `public/games/world/classic.html`, using the same source code and saves it had in version 5.1.

**Save migration:** Old `ASTATION_WORLD_DREAMBOUND_v4` data is not erased; Engine 6 writes a separate namespaced `ASTATION_WORLD_DREAMBOUND_v6` IndexedDB record. ASTATION OS receives a backwards-compatible `state.worldSave.nextgen` snapshot without discarding legacy fields.

**Deployment:** `npm install && npm run build`. GitHub Pages must be configured to **GitHub Actions** for Vite-generated `dist`. Do not switch the existing Pages source until production build and browser smoke tests pass.

Model provenance: PIX GLB is the prior original, authored procedural mesh with object transform clips `Idle`, `Walk`, `Jump` (not a skinned rig). Engine 6 supports skinned rigs for new assets but does not invent a skeleton for PIX. Blender is not connected to this task.
