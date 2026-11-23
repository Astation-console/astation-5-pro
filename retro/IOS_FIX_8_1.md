# ASTATION RETRO 8.1 — iOS startup diagnostics

- `EJS_ready` only signals that the frontend is initialized; the UI never claims that a game has started until `EJS_onGameStart`.
- On iOS, `EJS_startOnLoaded` is disabled to require a direct Play tap within the emulator frame.
- Core screen-layout switching is attempted after game start (and only if the API is available). A missing runtime option does not imply a bad ROM.
- Timeout/error panels offer two explicit retry paths: normal DeSmuME or lighter DeSmuME 2015, without removing ROMs or save data.
- Legacy DS saves, existing game imports, and ASTATION OS are not changed.
- Browser automated tests run against a stub loader; the real-core test uses an MIT homebrew NDS program. Physical iOS/Safari testing is still required.
