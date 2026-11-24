# ASTATION 9.0 development
- Backup: backup-before-system-9.
- Stage 2: disable forced fast-forward, sample EmulatorJS core frame counter, adaptive DS frameskip (0–2), retain per-profile/per-ROM/per-core preference.
- Stage 3: browser standard Gamepad menu navigation, connection status, focus ring, Select+Start shortcut. Existing core handles gameplay. Physical controller and iOS testing still required.
- Existing ROM storage keys and core game IDs intentionally unchanged.
- Release gate: browser integration, actual licensed homebrew core, physical Mario on the user's device, save compatibility.
- Not yet delivered: universal emulator support, complete controller remapping, save-state compatibility, offline ROM assets, design system, and the other roadmap items.

- Stage 4 foundation: existing verified IndexedDB/Cache ROM persistence retained; add StorageManager persistent-storage request and real origin quota estimate; controller tester, deadzone and diagnostics. These do not guarantee protection from manual browser data removal.
