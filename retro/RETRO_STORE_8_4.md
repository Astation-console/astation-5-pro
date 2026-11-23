# ASTATION 5 PRO — Console Edition 8.4

- Adds two separately installable Nintendo DS **launcher cards** to the existing ASTATION Store: New Super Mario Bros. and Call of Duty: Black Ops.
- The install queue only adds a local game launcher. It does **not** download a commercial game ROM, firmware, or BIOS. User-owned NDS/ZIP files are imported privately in the browser.
- NDS title checks: `A2D*` with `NEW MARIO` in the header, and `BDY*` with `CALLOFDUTY7` in the header, respectively. ROMs are never copied to GitHub or to a third-party server by ASTATION.
- Game cover photographs are referenced as external provider URLs, not embedded into the repository. Each has an original CSS fallback when the remote site does not permit hotlinking or is unavailable. The official game assets remain the property of their respective owners.
- The app imports ROMs into profile-scoped IndexedDB. If the browser later removes site data or lacks available storage, the file must be reimported.
- **iOS load fix:** pass the local `Blob` to the actual emulator iframe via same-origin `postMessage`, and create the `blob:` URL within that iframe. This avoids reusing a parent iframe's object URL when the embedded browser cannot fetch it. The actual emulator still downloads its WebAssembly core from EmulatorJS's CDN and needs network access initially.
- Settings already provide DeSmuME 2015 / Performance mode for weaker hardware, but no fixed FPS is promised. No requirement or user instruction to weaken device security settings.
- DeSmuME and EmulatorJS are third-party GPL projects. See `retro/README.md` for provenance and licensing.

## Tests

Run `node --test retro/tests/retro-unit.test.mjs` for NDS/ZIP format and hashing tests. `node retro/tests/console84-browser.mjs` covers desktop/mobile Store install, one-time local import of synthetic NDS data, passing data into the same iframe, persisted ROM recall and return to ASTATION OS. A separate workflow test runs a genuine DeSmuME WebAssembly core on a licensed homebrew ROM; that test does not prove compatibility of every commercial game or Safari on physical devices.
