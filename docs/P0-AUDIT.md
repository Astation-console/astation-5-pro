# P0 audit — 2026-11-24
Stable reference: 14.0, 1df34ec54f139b7128ebd6f8556203661eb4c974. Pages and full CI passed (45463973412, 45463974432).
- Critical issue: 9.0.3 FAST patch replaced simulateInput and repeatedly held input 27 every 750 ms, even treating releases as presses. Old tests explicitly expected this. That is not normal-speed optimization.
- Candidate: remove monkey patch and guard; clear fast-forward once on start, leave native manual FAST controls visible, migrate old autoBoost config to false. Keep actual core selection and save identifiers intact. Label measured core frame cadence rather than display FPS. If unavailable, show unavailable.
- Storage: local ROM persists via IndexedDB and Cache Storage fallback with readback, no upload. Existing mock tests exercise import and Quick Resume bytes. Real-core test boots MIT homebrew. Neither proves commercial Mario gameplay or physical iPhone performance.
- Still open: actual normal-speed benchmark on user's iPhone, real audio/touch/pad, DS layout variants, complete save center, real downloads, full EN/PL, and all further requirements from master spec. No P0 acceptance checkbox marked complete.
- Candidate branch p0-normal-speed; promote only after regression tests pass and relevant evidence is reviewed. Do not deploy a speculative emulator fix on main.
