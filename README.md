# ASTATION 5 PRO — GAME REVOLUTION 5.0

**ASTATION WORLD: DREAMBOUND — World Beta (first production milestone)**

**Live:** https://astation-console.github.io/astation-5-pro/

ASTATION 5 PRO remains a browser console simulation hosted on GitHub Pages. The existing ASTATION OS is preserved: profile, shop, simulated game installation queue, trophy/archive history, notifications, friends/party NPC demo, game hub, local saves, and settings.

## What's new in Game Revolution 5.0

- **Original PIX model** exported to `games/world/assets/pix.glb` (glTF 2.0) with body parts and 3 animation clips: `Idle`, `Walk`, `Jump`.
- **Three.js 3D gameplay** with follow camera, character movement, double-jump, dash, crystals, enemy patrols, portals and puzzle terminals.
- **Polished Green Valley** terrain: sculpted rock formations, greenery, glowing waterfall, flags, moving platforms, checkpoint beacon and atmosphere; four additional existing worlds remain playable.
- **Custom audio cues** for jumps, collecting, dashing, checkpoints, damage, terminals and portals (not PlayStation copyrighted audio).
- **Redesigned HUD / title / pause screens** based on editable Figma concepts; link below.
- **Adaptive graphics** settings (`performance`, `balanced`, `quality`), touch controls, keyboard/gamepad, mouse camera drag.
- **Memory cleanup** between worlds; original procedural PIX fallback if GLB fails to load.
- **Save compatibility:** uses the existing ASTATION OS key `astation_pro_v2` and Dreambound key `ASTATION_WORLD_DREAMBOUND_v4`; prior game archives are retained.

## Figma

Editable HUD, loading and pause screens: https://www.figma.com/design/kpMsC4skZIvlbLTOEJavlj

## Tech stack

Static HTML/CSS/JavaScript + Three.js 0.186.1 and `GLTFLoader`, WebGL, glTF 2.0. No backend required. The Three.js runtime is loaded from jsDelivr; players must have internet access.

**Asset provenance:** Blender was **not available** in this session. The original PIX GLB was generated programmatically with Python + `trimesh` and contains glTF animations. It can be imported into Blender for further rigging/texturing. Figma was used directly for editable UI views.

## Controls

- Desktop: **WASD** move; **Space** jump/double jump; **Q** dash; **E** interact; **Shift** run; **Esc** pause; drag on 3D scene to rotate camera.
- Phone: left joystick; on-screen Jump, Dash, Interact, Pause. Right-side drag moves the camera.
- Gamepad (browser-dependent): left stick move, right stick camera, A jump, B dash, X interact, Start pause.

## Release scope

Only `ASTATION WORLD: DREAMBOUND` is active. The five other requested games — Hero, Racing, Shadow, Blade and Football — are not yet playable and are not falsely presented in the store.

**Testing:** OS integration and logic are verified with automated desktop/mobile tests and a simulated 3D renderer. GLB structure and animation tracks are validated. A final visual WebGL test on a physical mobile device / GPU remains necessary before claiming production-level visual quality or a guaranteed frame rate.

**Backup:** https://github.com/Astation-console/astation-5-pro/tree/backup-game-revolution-4-before-5

This is an original, independent browser project, not a PlayStation emulator and not affiliated with Sony.