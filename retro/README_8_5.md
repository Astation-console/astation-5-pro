# ASTATION RETRO 8.5 — local ROM persistence diagnostics

The browser game library does not distribute Nintendo DS ROMs. Players import their own compatible NDS/ZIP file once. Local ROMs are stored under each ASTATION profile, primarily using IndexedDB and using Cache Storage only if the IndexedDB write or readback fails. Every successful import is verified by reading the saved Blob back. A persistent status panel distinguishes confirmed storage from session-only data. No ROM bytes are uploaded.

**Storage limitations:** The host browser or an in-app webview may evict website data or prevent local storage. This cannot be overridden by a static GitHub Pages website. In that case the game requires another import and ASTATION explains the issue instead of claiming the file is installed. Opening ASTATION directly in Safari and avoiding Private Browsing may improve persistence. A launcher install alone is not a downloadable commercial game.

**QA:** `node --test retro/tests/retro-unit.test.mjs retro/tests/store-integration.test.mjs`; `node retro/tests/console84-browser.mjs` in GitHub Actions (uses synthetic NDS buffers and stubs the WebAssembly download; this is not a compatibility test for commercial ROMs).
