# ASTATION 5 PRO — Ultimate 7.0 Foundation (etap 1)

**Status:** jedna pełna, grywalna przygoda 3D *ASTATION WORLD: Dreambound / Serce Doliny* (Chapter I) z GLB PIX, 11 klipami AnimationMixer, fizyką Rapier, misjami, checkpointami, fabułą, VFX, zapisem IndexedDB, trofeami i trybem Classic Worlds. Konsola pozostaje na **GitHub Pages**. **To nie jest jeszcze kompletna wersja 7.0 ani sześć gotowych gier.**

## Co rzeczywiście dodaje etap 7.0

- Lokalny wybór maksymalnie ośmiu profili; nazwa, awatar, trofea, biblioteka, postępy, ustawienia i historia rozdzielone. Pierwszy profil **legacy** przejmuje dotychczasowe dane z `astation_pro_v2`, bez kasowania archiwów.
- Zapisy **IndexedDB** gry i starszych Classic Worlds dostają odrębne klucze profili; `legacy` zachowuje poprzedni klucz. Zrzuty ekranu są filtrowane według profilu.
- Działający przycisk zmiany użytkownika w profilu i szybkim centrum sterowania. Centrum sterowania wysyła pauzę do aktywnej gry, a po zamknięciu przywraca jej symulację.
- Postęp kolejki oznaczony **SYMULOWANA INSTALACJA** — bez udawania rzeczywistych szybkości internetu. Dysk 825 GB jest wirtualny.
- Istniejące funkcje ASTATION OS: ekran zasilania, menu, sklep, pobieranie, awatary z gier, archiwum, osiągnięcia, galerie, ustawienia, lokalni znajomi NPC, parties demo, odtwarzanie sesji i tryb uśpienia.

**Ograniczenia:** profile są lokalne, bez haseł i synchronizacji; nie zastępują kont online. Pozostałe 5 gier z dokumentu produkcyjnego to plan, a nie aktywne produkty. PIX jest detalicznym GLB z animacjami transformacji obiektów, nie zawiera szkieletu z riggingiem Blendera; nie deklarujemy inaczej. Figma pozostaje projektem UI, a GSAP i Howler.js są opcjonalne, nie wdrożone w tym etapie. Pełnych testów fizycznego kontrolera i iPhone'a nie wykonano.

## Testy

`npm install --no-audit --no-fund && npm run test && npm run build && npx playwright install chromium && npm run test:e2e`

GitHub Actions publikuje podgląd `/preview-6/` z gałęzi `engine-6-dreambound-preview` **dopiero po testach**. Publiczny adres konsoli i poprzednia wersja są chronione gałęziami `backup-astation-6-5-before-ultimate-7` i `backup-engine-6-5-before-ultimate-7`. Publikacja głównego ASTATION 7.0 wymaga promocji potwierdzonego wydania, nie oznacza automatycznie ukończenia kolejnych etapów.

---

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
