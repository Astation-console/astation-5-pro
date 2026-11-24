# ASTATION 9.0 development
- Backup: backup-before-system-9.
- Stage 2: disable forced fast-forward, sample EmulatorJS core frame counter, adaptive DS frameskip (0–2), retain per-profile/per-ROM/per-core preference.
- Stage 3: browser standard Gamepad menu navigation, connection status, focus ring, Select+Start shortcut. Existing core handles gameplay. Physical controller and iOS testing still required.
- Existing ROM storage keys and core game IDs intentionally unchanged.
- Release gate: browser integration, actual licensed homebrew core, physical Mario on the user's device, save compatibility.
- Not yet delivered: universal emulator support, complete controller remapping, save-state compatibility, offline ROM assets, design system, and the other roadmap items.

- Stage 4 foundation: existing verified IndexedDB/Cache ROM persistence retained; add StorageManager persistent-storage request and real origin quota estimate; controller tester, deadzone and diagnostics. These do not guarantee protection from manual browser data removal.

- Stage 5: fix hidden OS return in play mode; local per-ROM/session statistics, separate IndexedDB state slot, manual Quick Save/Resume, snapshot on exit where supported. Existing SRAM storage untouched. Restore API returns no verified in-game result; manual restore is explicitly described as handed to core. Real-core save-state compatibility not yet verified.

- Added a browser test using synthetic emulator state bytes to check persistence after reload and restore handoff. This is an integration test, not proof of actual game-state restoration in real DeSmuME.

- Stage 6/7 foundation: optional direct-input multitouch DS overlay (not enabled by default), persisted size/opacity/position/mode and simple color filters; TV layout, theme accents, manifest and offline shell cache. No claim of offline emulator or Smart TV compatibility; external emulator assets are not cached. PWA install requires platform support.

- 9.0.1 hotfix: automatic frameskip 0 (ignore stale learned skips), native resolution on automatic profiles, suspend parent console painting/animation and reduce redundant polling. Core throughput is still not actual displayed unique FPS; physical phone performance remains unverified.

- 9.0.2: user requested identical FAST behavior without holding the virtual button. Auto FAST is enabled by default using actual EmulatorJS speed API, with 3x maximum ratio (EmulatorJS default), re-applied on resume/restart, optional normal-speed setting and hidden manual FAST control. No claim of real 60 FPS; speed may exceed normal on fast devices.

- 9.0.3: emulate the exact held FAST input (27,1), protect it from input release, restore on resume, periodically reassert. Keep original FAST ratio instead of overriding it. Fresh release URLs and network-first no-store cache. A real phone FPS result still requires physical test.
