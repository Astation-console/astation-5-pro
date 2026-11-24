# ASTATION OS PRIME 11
Independent frontend in prime/: state, views, controller, catalog, audio, app. Root index is rewritten, not patched OS X markup. Previous shell is legacy.html only for compatibility. Existing commercial game launchers, original games, profile vault, ROM persistence, and Nintendo DS core are deliberately preserved. Original synthesized audio, separate buses, local profiles, measured storage, game hub ROM detection, real library registration, responsive controller-first UI. Offline shell and Orbit assets only; no fake online play or bundled commercial ROMs. Tests use synthetic NDS headers and a mock core, plus separate real DeSmuME homebrew smoke test. Physical iPhone FPS not measured.
PRIME Game Hub adds actual per-ROM state detection, Quick Resume only when matching snapshot exists, binary export/import with SHA/core validation, and backup before import. Original SRAM is separate; state restoration uses existing core API and requires gameplay verification.

Retro Center now has its own fresh PRIME stylesheet and vector DS illustration, replacing the old UI styles rather than overlaying them. Core player/FAST module unchanged. Launcher shelf sorts recent titles first; Quick Resume available only with actual matching saved state.

Import readiness gate: picker disabled until existing ROM inventory initialization finishes; browser test waits for the same readiness condition and reports real import failures. System audio context is suspended during gameplay.

Extended QA to verify snapshot-based resume (mock core receives the exact saved bytes), and align default core detection on touch browsers. Preserve legacy system volume and ambient preference when initializing PRIME audio.
