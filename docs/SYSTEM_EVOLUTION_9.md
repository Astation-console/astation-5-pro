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

- Save Center: ASTATION snapshots only, per-profile inventory, export/import with ROM SHA and core validation, backup before overwrite, confirmation before deletion, system-event trophy counts derived from measured sessions. Internal emulator SRAM management remains separate. Figma file created but canvas write was blocked by Starter MCP quota.

- Game Hub foundations: per-ROM Quick Resume button appears only if a matching local state exists; per-profile favorites, local screenshot gallery and export, notifications with timestamps. Canvas captures are capability-dependent; a canvas may not expose WebGL framebuffer contents.
