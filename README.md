# ASTATION 5 PRO — Game Revolution 4.0 · World Alpha

**Graj:** https://astation-console.github.io/astation-5-pro/

Pierwszy etap całkowitej przebudowy gier. Zachowuje dotychczasowy **ASTATION OS 3.0** (profile, sklep, pobieranie, trofea, zapis, powiadomienia, znajomi NPC, imprezy, galerię, SSD i ustawienia), ale zastępuje aktywną bibliotekę gier.

## Kopia bezpieczeństwa

Wersja sprzed przebudowy jest zachowana w gałęzi: [`backup-astation-os-3-before-game-revolution-4`](https://github.com/Astation-console/astation-5-pro/tree/backup-astation-os-3-before-game-revolution-4).

Podczas pierwszego wejścia do 4.0 aplikacja zapisuje **jednorazową kopię starego stanu** w `localStorage` pod nazwą `astation_legacy_backup_v4`, a historię/stare statystyki/trofea w archiwum systemu. Pięć dawnych gier znika z instalacji i aktywnego sklepu. Trofea i ich historia **nie są kasowane**. Nowe gry nie wczytują ich niezgodnych zapisów.

## Dostępna gra: ASTATION WORLD — DREAMBOUND

**Grywalna wersja Alpha:** powstała odrębna produkcja z własnym kodem w `games/world/world.js` oraz silnikiem Three.js. Obejmuje:

- Bohater PIX — animowany, składający się z wielu elementów model robota 3D.
- Pięć światów: Green Valley, Candy Galaxy, Frozen Kingdom, Mechanical Factory i Sky Islands.
- Sterowanie 3D, kamera zza bohatera, skok i podwójny skok, dash.
- Ruchome platformy, zagrożenia, obiekty kolekcjonerskie, 2 interaktywne terminale na poziom, checkpointy i finałowy strażnik.
- Stopniowe odblokowywanie światów, automatyczne zapisywanie, ekrany Nowa gra / Kontynuuj / Pauza / Zwycięstwo.
- Dziesięć trofeów powiązanych z faktycznymi wydarzeniami w grze.

Sterowanie na komputerze: **WASD / strzałki** ruch, **Spacja** skok i podwójny skok, **Q** dash, **E** aktywacja terminalu, **Shift** sprint, **Esc** pauza. Na telefonie: joystick i przyciski Skok / Dash / E / Pauza. Podstawowe sterowanie padem opiera się na Gamepad API.

## Instalowanie i zapisy

Wszystkie transfery GB są **symulowane**. Rzeczywisty kod gry jest częścią strony, a nie pobieranym produktem konsolowym. Po ukończeniu symulacji instalacji gra pojawia się w menu i bibliotece.

System zapisuje do `astation_pro_v2` (ustawienia, profil, osiągnięcia, biblioteka, kopia punktów kontrolnych). Sama gra zapisuje dodatkowo do `ASTATION_WORLD_DREAMBOUND_v4`. Panel eksportu ASTATION OS zawiera też `worldSave` z ostatnim zapisanym stanem. Wyczyść dane strony tylko wtedy, gdy nie potrzebujesz lokalnych postępów.

## Ważne ograniczenia wersji Alpha

- To **nie jest emulator PS5**, ani gra o skali komercyjnego AAA.
- Postacie i dekoracje są proceduralnymi modelami 3D. Animowane modele GLB/GLTF, dopracowane tekstury i szczegółowe poziomy pozostają do zrobienia.
- Do załadowania Three.js jest potrzebne połączenie z CDN. Bez Three.js/WebGL pojawia się wyraźny komunikat zamiast udawanej rozgrywki.
- Testy automatyczne sprawdziły menu desktop/mobile, migrację archiwum, sklep, symulowane pobieranie oraz logikę pięciu światów w symulowanym środowisku Three.js. Nie był możliwy pełny test renderera WebGL na iPhonie ani fizycznego kontrolera.
- Pozostałe pięć nowych gier nie jest jeszcze dostępnych. Ich plan znajduje się w `ROADMAP.md`. Nie dodajemy pustych kafelków.

Kod własny ASTATION. Three.js autorstwa Three.js Authors, licencja MIT, importowany z jsDelivr. Projekt nie jest powiązany z Sony.
