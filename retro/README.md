# ASTATION RETRO 8.0 — Nintendo DS (beta integration)

**OS integration:** `retro/bridge.js` inserts ASTATION RETRO into the OS 7.0 game row and navigation as an embedded same-origin application. Existing Dreambound, profiles, trofeów and settings are not modified.

**Core:** [EmulatorJS](https://emulatorjs.org/docs/systems/nintendo-ds/) (GPL-3.0) supplies a compiled RetroArch/WebAssembly DeSmuME core, loaded from `https://cdn.emulatorjs.org/stable/data/`. DeSmuME and DeSmuME 2015 are available. The `nds` alias would select melonDS, which **requires** BIOS/firmware; no BIOS or firmware is distributed. See [EmulatorJS's GPL-3.0 license](https://github.com/EmulatorJS/EmulatorJS/blob/main/LICENSE) and [DeSmuME's license](https://docs.libretro.com/library/desmume_2015/).

**Import & security:** `retro/rom.js` accepts local `.nds` and `.zip` (one NDS member). Native ZIP parser verifies central directory, CRC32, max sizes, and NDS header checksum CRC16. If native DEFLATE is not supported, optional [JSZip 3.10.1](https://stuk.github.io/jszip/) (MIT) handles ZIP as fallback. Imported games **are not committed** to GitHub; host code makes no upload requests for ROM bytes. ROM is kept in memory or, with consent, in IndexedDB under the current local ASTATION profile. Third-party emulator JavaScript is loaded from the official CDN, so as with any embedded third-party code its origin and trust matter.

**Save:** EmulatorJS keeps Nintendo DS cartridge saves in browser storage, using a game key incorporating the ASTATION profile and ROM SHA256. The host's Save button invokes its real `gameManager.saveSaveFiles()` method. EmulatorJS's built-in toolbar offers save/state import/export when supported by the current core; browser storage can still be evicted by the OS. Deleting an imported ROM does **not** erase its saves. The app does not assert cross-device synchronization.

**Dual screens:** Classic, Side by Side and Focus use the DeSmuME native core variable `desmume_screens_layout` (top/bottom, left/right, hybrid/top), with guard/error messages for unsupported core builds. The lower screen's pointer input uses DeSmuME's standard touch pointer mode. Keyboard bindings are customizable; gamepads and touch controls use EmulatorJS.

**Limits:** Runtime requires internet access to download a WebAssembly core from the EmulatorJS CDN. Running an arbitrary NDS ROM on iPhone/Android/Safari/Windows is not guaranteed without device testing. The user's commercial ROM is **never included**, even in tests. For actual DS compatibility use your own games and legal rights. EmulatorJS is a third-party GPL-licensed component.

**Development/QA**

```sh
node --test retro/tests/retro-unit.test.mjs
npm install --no-save playwright
npx playwright install chromium
node retro/tests/retro-browser.mjs
```

Browser smoke tests stub the external core loader to exercise the local UI and ROM handoff deterministically; they do **not** prove real game execution. End-to-end real emulation requires an actual browser loading the real CDN core and a legally distributable homebrew ROM. Avoid publishing the commercial user's ZIP into the repository or CI artifacts.
