# ASTATION 5 PRO — New Super Mario Bros. Store integration (8.3)

The ASTATION Store tile **New Super Mario Bros. — Nintendo DS** installs the *local game launcher integration*, not a copy of Nintendo's game. No commercial ROM, original game artwork, BIOS or firmware is included. This game appears under the existing internal ID `retro`, to preserve previously installed ASTATION RETRO app progress and local storage.

On first launch through the ASTATION home menu or game library, `AstationRetro.open({game:'mario'})` opens the same-origin embedded player in direct Mario mode. The player asks the user to select a locally held `.nds` or `.zip` containing an NDS image with game header `NEW MARIO` and code `A2D?`. The data is checked for ZIP CRC32 and NDS CRC16, then can be saved to IndexedDB (profile-isolated, as before) with user's local preference. After import the game is passed to the **actual EmulatorJS DeSmuME** core. On subsequent launches the locally stored ROM is selected and started automatically. The emulator does not guarantee that a particular copyrighted game is compatible or runs at full speed on iOS.

The Store's small “virtual installation” is a user interface simulation only; ROM bytes are not downloaded from ASTATION. The emulator core is fetched from the official EmulatorJS CDN. Clear browser data or use a new device/profile and you must supply your ROM again. ASTATION's Dreambound and prior user profiles remain unchanged.

Testing: `node --test retro/tests/retro-unit.test.mjs retro/tests/store-integration.test.mjs`; `node retro/tests/store-browser.mjs`. The test fixture contains a synthetic Nintendo DS header and **no copyrighted ROM**. The commercial file supplied in chat was inspected privately; it is never committed or included as a test artifact.
