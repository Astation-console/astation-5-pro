# ASTATION 5 PRO — PIX Story Edition 6.5

**Graj w konsolę:** https://astation-console.github.io/astation-5-pro/

ASTATION OS uruchamia teraz **ASTATION WORLD: DREAMBOUND 6.5 — Serce Doliny** bezpośrednio wewnątrz konsoli, zamiast starszego modułu gry. Dotychczasowa biblioteka zainstalowanych gier, profil, trofea i lokalne zapisy nie są kasowane.

## Fabularny Rozdział I — Serce Doliny

PIX budzi się w zagrożonej krainie Green Valley. Przewodniczka LUMA pomaga mu odnaleźć sześć iskier pamięci, aktywować dwa przekaźniki i odkryć tajemnicę tajemniczego ECHO. **Osiem autorskich scen** uruchamia się przy wydarzeniach w grze, a Kronika Snów zapamiętuje odkryte dialogi. Gra jest w pełni 3D z oryginalnym modelem GLB, 11 klipami animacji, skakaniem, dash, Strażnikiem, checkpointem i zapisywaniem postępów.

**Ważne:** Nową fabułę ma obecnie tylko pierwszy rozdział Green Valley. Kolejne fabularne rozdziały są planowane; starsze światy pozostają dostępne jako Classic Worlds. „Pobieranie” w ASTATION OS jest symulowane, a dane zapisu pozostają w przeglądarce.

**Testy:** 23 testy jednostkowe i 8 testów przeglądarkowych przeszły w GitHub Actions na gałęzi testowej przed integracją.

**Kod silnika:** [engine-6-dreambound-preview](https://github.com/Astation-console/astation-5-pro/tree/engine-6-dreambound-preview)

**Kopia bezpieczeństwa konsoli przed aktualizacją:** [backup-before-pix-story-6-5-console-update](https://github.com/Astation-console/astation-5-pro/tree/backup-before-pix-story-6-5-console-update)

---

# ASTATION 5 PRO — Update 5.1: Power, Avatars & Collision Fix

Oficjalna przeglądarkowa konsola ASTATION, hostowana na GitHub Pages:

https://astation-console.github.io/astation-5-pro/

## Nowe w wersji 5.1

- **Nowy ekran zasilania:** przed uruchomieniem systemu gracz musi nacisnąć wirtualny przycisk Power. Następują animacja startowa, wybór profilu i ekran konsoli. Wyłączanie konsoli wraca na ekran zasilania.
- **Profilowe z naszych gier:** 12 oryginalnych awatarów SVG, m.in. PIX, Green Valley, Candy Galaxy, Frozen Kingdom, Mechanical Factory, Sky Islands, Crystal Collector i Dream Guardian. Niektóre są dostępne od początku; pozostałe odblokowują się wraz z postępami, zdobywaniem kryształów i trofeów. Można wybrać awatar na ekranie użytkownika i w panelu profilu.
- **Zachowanie konta:** wybrany awatar zapisuje się w dotychczasowym `astation_pro_v2` bez usuwania statystyk, biblioteki, historii ani trofeów.
- **Kolizje Dreambound 5.1:** osobny moduł `games/world/collision.js` obsługujący pionowe zderzenia przez wykrycie przekroczenia powierzchni między klatkami, blokowanie wejścia w boki platform, podtrzymywanie postaci na ruchomej platformie i korektę małych penetracji ze starszych wersji.
- **Stabilny checkpoint i portal:** dodatkowe stałe platformy na trasie przy punkcie zapisu i końcowym portalu.
- **Wiadomość o odblokowaniu nowego awatara**, gdy postęp z rozgrywki spełni jego warunek.

## Co pozostaje bez zmian

- ASTATION OS, logo, profil użytkownika, trofea i historia, sklep, kolejka symulowanych instalacji, centrum sterowania, ustawienia, galerie, Game Hub oraz archiwalne dane poprzednich gier.
- Dreambound: model PIX GLB (Idle, Walk, Jump), pięć światów, zadania, kryształy, terminale, przeciwnicy, boss, gamepad/touch, zapisy i pauza.

## Pliki

- `index.html` — system ASTATION OS, zasilanie, profile, sklep i integracja gry
- `games/world/index.html` — ekran i HUD Dreambound
- `games/world/world.js` — silnik rozgrywki
- `games/world/collision.js` — logika kolizji platform
- `games/world/assets/pix.glb` — autorski model 3D z animacjami

## Sterowanie

**System:** wciśnij Power, wybierz profil. W menu wybierz profil, żeby zmienić awatar. Możesz też otworzyć jego kolekcję na ekranie logowania.

**Dreambound:** WASD lub analog — ruch, Spacja/A — skok i podwójny skok, Q/B — dash, E/X — terminal, Esc — pauza. Na telefonie korzystaj z joysticka i przycisków dotykowych.

## Testy

- Osiem deterministycznych testów modułu kolizji platform w Node.js.
- Test integracyjny logiki Dreambound w przeglądarce z symulowanym rendererem: pięć światów, ruch, skok, zbiory, boss, brak błędów JS.
- Testy interfejsu w Chromium desktop i układzie mobilnym: power, boot, wybór awatara, profil, sklep, pobieranie, centrum sterowania, wyłączenie i zapisy po re-inicjalizacji.

> Renderowanie WebGL na fizycznym iPhonie i fizycznym kontrolerze wymaga osobnego testu. Pojemności pobierania w konsoli są symulowane; nie pobieramy rzeczywistych gier PS5. ASTATION 5 PRO nie jest produktem Sony.

## Bezpieczeństwo

Poprzedni commit jest zachowany w gałęzi GitHub `backup-revolution-5-before-5-1`. Lokalnych zapisów przeglądarki nie nadpisujemy przy wdrożeniu.


## Engine 6.0 preview (tested)

Play the new Green Valley prototype safely alongside the current 5.1 console: https://astation-console.github.io/astation-5-pro/preview-6/

Source and tests: https://github.com/Astation-console/astation-5-pro/tree/engine-6-dreambound-preview

The main ASTATION 5.1 console is not replaced by this preview. Deployment to the site root will follow only after further device testing.
