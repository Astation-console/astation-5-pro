# ASTATION 5 PRO — ULTRA UPDATE 3.0 · ETAP 1

**Graj:** https://astation-console.github.io/astation-5-pro/

Autorski, przeglądarkowy symulator konsoli ASTATION 5 PRO. Nie jest emulatorem PlayStation 5 ani produktem Sony. Zachowuje dotychczasowe gry i zapisuje postępy lokalnie.

## Co jest nowe w tym etapie

- **ASTATION OS 3.0 — podstawa systemu:** nowe panelowe ekrany Friends, Parties, Capture Gallery, SSD, Wishlist, Game Hub i Controller Tester; brak przeładowań strony między ekranami.
- **Quick Resume:** bieżące sesje gier można zachować i wznowić. Dla gier 2D zapisywany jest stan rozgrywki. Dla WebGL 3D pełna sesja jest zachowywana w otwartej stronie; po odświeżeniu używany jest ostatni checkpoint (a nie obietnica wznowienia każdej klatki 3D).
- **Nowe menu startowe gry:** oddzielne przyciski „Nowa gra” i „Kontynuuj”, z opcją Quick Resume tam, gdzie stan jest dostępny.
- **Trofea 3.0:** każda z pięciu dotychczasowych gier ma teraz 10 osiągnięć, własne grafiki i konkretne warunki zdobycia. Stare trofea pozostają odblokowane. Poziom i postęp profilu, historia, możliwość przypięcia zdobytego trofeum.
- **Galeria:** zrzuty ekranu zapisane lokalnie w IndexedDB, przeglądanie, powiększanie, usuwanie i eksport. Dostępność zależy od obsługi IndexedDB i Canvas w przeglądarce.
- **Eksport/import zapisów:** plik JSON; przy imporcie zachowywana jest kopia poprzedniego zapisu w localStorage.
- **Wirtualne SSD:** pojemność 825 GB; odinstalowanie gry zwalnia symulowane GB, ale nie usuwa jej statystyk. Postępy można wyczyścić osobną świadomą akcją.
- **Lokalni znajomi NPC i Parties:** lista, zaproszenia, wybór gry, gotowość i opuszczanie grup. Są wyraźnie oznaczone jako lokalna symulacja — bez realnego multiplayera.
- **Sterowanie:** tester Gamepad API, ustawiana martwa strefa analoga, skalowanie interfejsu, jasność, kontrast, intensywność animacji i tryb jakości/wydajności 3D.
- **Sklep i biblioteka:** lepsze bannery, kategorie, zrzuty, lista życzeń, Game Hub, symulowane pobieranie w tle z paskiem postępu widocznym także w menu.
- **Dźwięk:** własne syntetyczne efekty ASTATION, bez plików dźwiękowych Sony. Oddzielna kontrola muzyki i efektów.
- **Powiadomienia:** historia, pojedyncze usuwanie i czyszczenie listy.
- **Pełny ekran:** opcja w Centrum sterowania, zależna od wsparcia przeglądarki.

## Zachowane gry

1. Eclipse Zero — akcja (WebGL 3D + grywalny tryb 2D)
2. Velocity Nights — wyścigi (WebGL 3D + grywalny tryb 2D)
3. Astrobound Worlds — platformówka (WebGL 3D + grywalny tryb 2D)
4. Lost Signal — przygoda 2D, trzy misje
5. Afterlight Survival — survival 2D, trzy noce

## Sterowanie

- PC: WASD lub strzałki, Spacja/A (akcja), B/Ctrl (unik), Esc (pauza), P (centrum), F8 (zrzut ekranu).
- Telefon: przyciski ekranowe i joystick w trybie 3D.
- Kontroler: Gamepad API, lewy analog/D-pad, A, B, spusty, Start; dostępność przycisku PS i wibracji zależy od przeglądarki.

## Stan zapisów

- Podstawowy klucz: `astation_pro_v2` (zachowany, aby nie stracić wcześniejszych postępów).
- Kopia rezerwowa: `astation_pro_v2_backup`.
- Zrzuty ekranów: IndexedDB `ASTATION_OS3_MEDIA`.
- Zapisy i trofea zachowują się tylko w tej samej przeglądarce, chyba że użytkownik wyeksportuje zapis.

## Rzeczy jeszcze NIEzaimplementowane

Nowe gry **ASTATION SPEED, HERO, WORLD, FOOTBALL, ADVENTURE** nie są jeszcze dostępne jako grywalne produkty. Nie dodajemy pustych atrap. Niezależny, prawdziwy multiplayer i czat głosowy wymagają backendu, a nagrywanie wideo wymaga dodatkowej pracy. Pełnej zgodności WebGL 3D z fizycznymi urządzeniami nie potwierdzono w tym etapie. Zobacz [ROADMAP.md](ROADMAP.md).

## Testy

Automatycznie sprawdzono uruchamianie wszystkich pięciu gier w trybie 2D, pauzę, powrót do menu, zachowanie zapisów, bibliotekę/sklep, pasek pobierania w menu, 50 kart trofeów, Quick Resume 2D, lokalne grupy NPC, listę życzeń, eksport zapisów, reakcje Gamepad API z kontrolerem symulowanym oraz układ desktopowy i mobilny. Testy nie zastępują sprawdzenia rzeczywistych iPhone'ów/padów ani renderera WebGL na urządzeniu z GPU.

© ASTATION — niezależny projekt demonstracyjny.