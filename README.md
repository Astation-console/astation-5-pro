# ASTATION WORLD: Dreambound — Story Edition 6.5

**Podgląd gry:** https://astation-console.github.io/astation-5-pro/preview-6/games/world/index.html

Pierwsza grywalna odsłona oryginalnej, fabularnej platformówki 3D, uruchamianej w przeglądarce. Prace nad tym wydaniem prowadzimy na gałęzi `engine-6-dreambound-preview`, z zachowaniem gałęzi zapasowych poprzednich wydań.

## Rozdział I: Serce Doliny

PIX budzi się w rozpadającym się Green Valley, a przewodniczka LUMA pomaga mu odnaleźć sześć iskier pamięci i uruchomić dwa przekaźniki. Poznaje organizację ECHO, historię Strażnika i tajemnicę Dream Core. Finał prowadzi do bramy i zapowiada **Candy Galaxy**. Rozdział I zawiera osiem scen (Przebudzenie, Pierwsza iskra, Zapis ECHO, Pamięć Strażnika, Utracona prawda, Ocalony Strażnik — opcjonalne, Próba przy bramie i Pierwszy świt).

- Dialogi po polsku i angielsku, uruchamiane przez rzeczywiste wydarzenia w grze, z przyciskami Dalej/Pomiń i obsługą klawiatury.
- **Kronika Snów** z odkrytymi scenami, stanem rozdziałów i oznaczeniem kolejnych części jako *w przygotowaniu*.
- Obejrzenie sceny zapisuje się w istniejącym stanie misji (`storySeen`) w IndexedDB i w stanie konsoli ASTATION OS; starsze zapisy pozostają kompatybilne.
- Grywalne wcześniej: kryształy, trampoliny, ruchome platformy, uniki, Strażnik, checkpointy, sterowanie dotykiem i padem, tryb fotograficzny, grafika Three.js, fizyka Rapier.
- Oryginalny model PIX (GLB) z 11 klipami animacji i AnimationMixer oraz szczegółowe modele strażnika, drzew i ruin.

**Granice wydania:** fabułę i osiem scen ma wyłącznie Green Valley. Candy Galaxy, Frozen Kingdom, Mechanical Factory i Sky Islands są w planie nowej historii, a ich poprzednie wersje zachowano jako *Classic Worlds*. Nie ma prawdziwego multiplayera ani backendu.

## Integracja z konsolą

Po pomyślnym przejściu testów, ASTATION OS uruchamia grę bezpośrednio pod własnym adresem `/astation-5-pro/preview-6/games/world/index.html` w bezpiecznym oknie osadzonym w konsoli. Gra komunikuje się z systemem przez `postMessage` z kontrolą pochodzenia: zapisy, zdarzenia znajdziek, trofea, status, zakończenie rozdziału. Wcześniejsze instalacje zachowują swoją bibliotekę — nie jest potrzebne ponowne pobieranie gry. 

## Testy

`npm install && npm run test && npm run build && npx playwright install chromium && npm run test:e2e`

GitHub Actions uruchamia kompilację oraz testy Chrome na osobnej gałęzi, a dopiero po ich przejściu publikuje przetestowane zasoby w `/preview-6/`.

> Game assets and narrative are original ASTATION work. Blender authoring was not used for this specific narrative update.
