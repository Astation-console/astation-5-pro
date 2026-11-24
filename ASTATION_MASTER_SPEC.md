# ASTATION 5 PRO — MASTER DEVELOPMENT DOCUMENT
## KOMPLETNA SPECYFIKACJA KONSOLI 10.0
Dokument nadrzędny projektu. Uporządkowany zapis wymagań użytkownika z 24 listopada 2026. Numer specyfikacji nie zastępuje numeru wydania ASTATION OS. Wszystkie 44 obszary są wymaganiami docelowymi, nie deklaracją ich ukończenia.
**MAKE IT WORK.** Mniej obietnic, więcej działającego kodu. Nie dodawać atrap ani deklarować ukończenia bez testu. Zachować działające gry, logo, adres GitHub Pages i zapisy.
## 1. Czym jest ASTATION 5 PRO?
Wirtualna konsola gamingowa w przeglądarce, inspirowana doświadczeniem PS5, z własną nazwą, logo, OS i funkcjami. Nie jest emulatorem sprzętu PS5 i nie uruchamia natywnych gier PS5. Adres: https://astation-console.github.io/astation-5-pro/. GitHub Pages, bez osobnej instalacji; komputery, telefony, kontrolery, kompatybilne TV; prawdziwa rozgrywka kompatybilnych gier retro i własnych produkcji, pobieranie/instalacja, trwałe zapisy, trofea i profesjonalny interfejs.
## 2. Uruchamianie
Czarny ekran → animacja logo ASTATION → delikatne światło → charakterystyczny dźwięk → wybór profilu → płynne menu główne. Krótka animacja, opcjonalne automatyczne logowanie; nie powtarzać konfiguracji.
## 3. Pierwsza konfiguracja
Kreator: język (English domyślny, Polski dostępny), nazwa profilu, awatar, motyw, głośność, sterowanie, jakość grafiki. Pełne tłumaczenie całego systemu.
## 4. ASTATION OS — menu główne
Góra: Games, Media, Search, Settings, Profile, godzina. Środek: poziomy rząd gier, okładki, animowane zaznaczenie, dynamiczne tło aktualnie wybranej gry (ten sam launcher, nie osobne menu startowe ASTATION), logo gry, Play/Continue, ostatnia rozgrywka. Dół: aktywności, trofea, postęp, znajdźki gdy dostępne, dodatkowe opcje. Profesjonalne ikony zamiast emoji, spójny wygląd konsolowy, Figma jeśli dostępna.
## 5. Game Library
All Games, Installed, Not Installed, Favorites, Recently Played, ASTATION Originals, Retro Games, Collections. Wyszukiwanie, sortowanie, filtry, kolekcje i kolejność. Każda gra: okładka, nazwa, platforma, rozmiar, instalacja, czas gry, zapisy, kompatybilność. Odinstalowanie nie usuwa zapisów.
## 6. ASTATION Store
Zintegrowany sklep, nie przypadkowe zewnętrzne strony; Featured, New Releases, Free Games, Retro, ASTATION Originals, Collections, Coming Soon, Wishlist. Karta: okładka, banner, tytuł, opis, gatunek, platforma, galeria, kompatybilność, instalacja/import, rozmiar zasobów, sterowanie. Bezpośrednie pobieranie własnych i odpowiednio licencjonowanych gier; komercyjne ROM-y wyłącznie legalnie pozyskane przez użytkownika, bez publikacji bez praw. Bez prawdziwych opłat.
## 7. Pobieranie i instalowanie
Download wraca do menu, instalacja działa w tle tylko gdy aplikacja może wykonywać operacje. Preparing, Downloading, Installing, Verifying, Ready to Play. Kolejka, anulowanie, retry, powiadomienia. Prawdziwy postęp z bajtów; symulacja wyraźnie oznaczona. Gotowa gra w bibliotece i grywalna. Nie obiecywać pobierania po zamknięciu przeglądarki.
## 8. Game Import System
Formaty zależnie od emulatora: ZIP, NDS, GBA, GB, GBC, NES, SFC, SMC, BIN, CUE, ISO, Z64, N64. Walidacja zawartości, rozpoznanie platformy, dobór emulatora, trwały lokalny magazyn (IndexedDB lub kompatybilny). Nie wymagać ponownego wskazania pliku, jeśli dane są dostępne. Komunikaty o usunięciu przez przeglądarkę i braku miejsca. Bez automatycznego uploadu plików prywatnych.
## 9. Universal Emulation Engine
Docelowe platformy: DS, GBA, GBC, GB, NES, SNES, Genesis, PS1, N64, PSP eksperymentalnie. Open source JS/WASM, zbadać EmulatorJS i alternatywy. Osobny moduł inicjalizacji, ładowania, sterowania, audio, renderingu, zapisów, pauzy, wznowienia, zamknięcia, błędów. Lazy loading. Deklarować tylko zintegrowane i przetestowane platformy.
## 10. Obecne gry
Zachować działające gry, szczególnie prawdziwe New Super Mario Bros. DS. Nie zastępować imitacją; nie usuwać emulatora bez przetestowanego zamiennika. Każdy tytuł dodawać indywidualnie: uruchamianie, rozgrywka, sterowanie, wydajność, audio, zapisy, powrót. Bez pustych kart.
## 11. Game Player
Play uruchamia wewnątrz ASTATION: ekran startu, logo/grafika, ładowanie emulatora, rozgrywka. Zintegrowany wygląd, oficjalne ustawienia do ukrycia zbędnego UI emulatora. Centrum sterowania i powrót do konsoli.
## 12. Smart Performance Engine
Normalne tempo bez wymuszania FAST; Fast Forward tylko do celowego przyspieszania. Mierzyć FPS, czas renderowania, tempo emulacji, problemy synchronizacji audio i możliwości przeglądarki. W grze zatrzymywać zbędne animacje menu, ograniczać efekty, zwalniać nieużywane zasoby. Performance (płynność), Balanced, Quality (jeśli sprzęt pozwala). Stabilne normalne tempo; bez fikcyjnych FPS.
## 13. Universal Controller System
Gamepad API; DualShock 4, DualSense, Xbox, kompatybilne Bluetooth/USB. Lewy analog/D-pad nawigacja; X/A zatwierdzenie; Circle/B cofnięcie; L1/R1 zakładki; Options dodatkowe menu. Alternatywa dla przycisku PS przechwytywanego przez urządzenie. Tester: nazwa, przyciski, analogi, triggery, połączenie, mapowanie, martwe strefy. Po rozłączeniu pauza jeśli możliwa i powiadomienie.
## 14. ASTATION Mobile
Safari na iPhonie, poziomo i pionowo, responsywność, dotyk, wirtualne analogi, D-pad, akcje, L/R, Start/Select, rozmiar, przezroczystość, pozycja, wielodotyk. Możliwość ukrycia dotyku po wykryciu pada. Prawidłowe proporcje gry.
## 15. TV Mode
Większe napisy i okładki, marginesy, wszystkie podstawowe funkcje padem bez myszy. Sprawdzać WASM, WebGL, Gamepad API. Nie obiecywać każdego Smart TV.
## 16. Nintendo DS Display System
Vertical, Horizontal, Main Screen Focus, Touch Screen Focus, Equal Size; odstęp, rozmiar, zamiana ekranów, poprawny dotyk dolnego. Zmiana bez restartu.
## 17. Retro HD
Original, Pixel Perfect, Smooth Scaling, CRT, Retro LCD, Fullscreen, Original Aspect Ratio. Opcja rozdzielczości wewnętrznej jeśli rdzeń pozwala. Skalowanie nie jest remasterem. Filtry bez znacznego kosztu wydajności.
## 18. Control Center
W menu i grze: Home, Game Switcher, Notifications, Downloads, Controller, Audio, Display, Performance, Capture, Profile, Power. Pauza jeśli możliwa, powrót w to samo miejsce bez restartu.
## 19. Quick Resume
Save States jeśli wspierane. Przy wyjściu zapisać dostępne dane, zatrzymać emulator, zaktualizować status, wrócić. Continue odtwarza stan, jeśli możliwe; zwykłe zapisy nie są pełnym Quick Resume.
## 20. Save Center
Automatyczny/ręczny zapis, wczytywanie, eksport/import, backup, historia, usuwanie, przywracanie, kopia wszystkich lokalnych zapisów. Przypisanie gra+profil. Aktualizacja nie usuwa danych. Potwierdzenie trwałego usuwania.
## 21. Trophy System
Bronze/Silver/Gold/Platinum. Nazwa, opis, ikona, kategoria, status, data, warunek, ukrycie. Animowane powiadomienie i dźwięk, procent ukończenia, poziom, platyny, historia. Tylko weryfikowalne warunki w emulacji; własne gry — rzeczywiste zdarzenia.
## 22. Game Hub
Osobna strona szczegółów, część ASTATION OS: duże tło, logo, okładka, Play/Continue, opis, czas, trofea, zapisy, galeria, wersja, emulator settings, usuwanie, kompatybilność.
## 23. Profile
Wiele lokalnych profili: nazwa, awatar, banner, ulubiona gra, poziom i liczba trofeów, łączny czas, historia, biblioteka, zapisy, ustawienia. Edycja i przełączanie; izolacja danych.
## 24. Settings
System: język, data/godzina, start, aktualizacje, informacje. Display: jasność, skalowanie UI, efekty, fullscreen, proporcje. Audio: system, menu, gry, muzyka, powiadomienia. Controller: wykrywanie, test, mapowanie, deadzone, wibracje jeśli dostępne. Performance: tryby, emulator, FPS. Storage: gry, zapisy, multimedia, cache. Accessibility: większy tekst, wysoki kontrast, ograniczenie animacji, szybkość nawigacji, napisy. Każde ustawienie wpływa na działanie.
## 25. Storage Manager
Opcjonalne 825 GB jako jawna symulacja, nie realny magazyn. Rzeczywiste dostępne dane o grach, zapisach, multimediach, emulatorach, cache, zajętości. Usuwanie gry bez zapisów; bez fikcyjnych parametrów urządzenia.
## 26. Download Center
Nazwa, okładka, status, pasek postępu, rozmiar, anuluj, retry, błąd, pauza/wznowienie jeśli obsługiwane, powiadomienie końcowe.
## 27. Notifications
Game Installed, Game Saved, Trophy Unlocked, Controller Connected/Disconnected, System Update Available, Download Failed, Storage Almost Full. Ikona, treść, czas, historia, czyszczenie.
## 28. Media/Capture Gallery
Media: zdjęcia, zrzuty, multimedia użytkownika, własne tapety. Screenshot rzeczywistej klatki jeśli możliwy, eksport, usuwanie, sortowanie, ustawianie jako tło. Wideo tylko gdy obsługiwane.
## 29. Motywy
ASTATION Original, Midnight Black, Neon Purple, Ocean Blue, Crimson Red, Arctic White, Retro Edition, Custom. Kolory, tła, akcenty, własne tapety, opcja wyłączenia animacji. Spójność całego systemu.
## 30. Game Switcher
Ostatnio uruchamiane gry: okładka, nazwa, status zapisu, aktywność. Resume, Play, Game Hub, Close Game. Nie utrzymywać kilku ciężkich emulatorów na telefonie bez potrzeby.
## 31. Power
Rest Mode (bezpieczne zatrzymanie procesów i zachowanie zapisów), Restart ASTATION (odświeżenie), Turn Off ASTATION (ekran wyłączenia aplikacji). Nie wyłącza urządzenia.
## 32. Offline Gaming
Service Worker, Cache API, lokalne dane, po pobraniu wszystkich wymaganych zasobów kompatybilna gra offline. Offline Ready, Requires Internet, Preparing Offline Data. Test po rozłączeniu.
## 33. PWA
Manifest, ikona, splash, standalone, Service Worker, instrukcja dodania na ekran główny iPhone'a. Zachować URL.
## 34. ASTATION Originals
DREAMBOUND: platformówka 3D, robot PIX, światy, skoki, znajdźki, zagadki, animacje, bossowie.
RISE OF LEGENDS: przygoda superbohaterska 3D, miasto, moce, misje, stylizowana walka.
VELOCITY X: wyścigi 3D, auta, garaż, zamknięte tory, nitro, AI, mistrzostwa.
LOST SIGNAL: przygoda FPP, ośrodek, latarka, eksploracja, zagadki, fabuła.
ETERNAL WAR: RPG fantasy, magia, rozwój, eksploracja, ekwipunek, bossowie.
PRO LEAGUE: piłka nożna, drużyny, stadion, mecze, turnieje, pad.
Nie robić wszystkich naraz kosztem jakości; najpierw jedna dopracowana produkcja.
## 35. Technologia
Three.js, Blender, Figma, Rapier, GSAP, Howler.js, Vite, GitHub. GLB/GLTF, animacje chodzenia/biegania/skoku/interakcji/akcji. Nie nieruchome prostokąty jako profesjonalne modele. Bez dostępu do narzędzia przygotować zasoby/skrypty, nie twierdzić że użyto.
## 36. Network
Docelowo konta, synchronizacja zapisów i trofeów, znajomi, rankingi własnych gier, prywatny multiplayer. Rzeczywisty dodatkowy backend. Bez fikcyjnych znajomych/liczników/serwerów. Lokalne profile niezależne.
## 37. Diagnostics
Wersja OS, aktualny emulator, WASM, WebGL, Gamepad API, IndexedDB, SW, rzeczywiste FPS jeśli mierzalne, błędy, zapisy, kompatybilność. Copy Diagnostics bez danych prywatnych i zawartości plików; konkretna przyczyna i rozwiązanie błędu.
## 38. Repozytorium
Modułowo: src/core, ui, emulators, games, input, storage, audio, trophies, profiles, services, localization; public/assets, models, icons, sounds; tests, docs. Dostosować do istniejącej struktury zamiast przepisywać sprawny kod. Base /astation-5-pro/. GitHub Actions build/test/deploy. Limity Pages rozmiaru i transferu.
## 39. Aktualizacje
System Update: bieżąca/dostępna wersja, changelog, data, naprawy, nowe funkcje. Nie przerywać gry bez zabezpieczenia postępu. Zgodność zapisów, wersjonowanie danych.
## 40. Ochrona przed zepsuciem
Backup przed dużą zmianą, osobna gałąź, zachować działające funkcje, regresja po każdej zmianie. Jeżeli Mario lub menu zepsute, nie publikować; naprawić lub przywrócić stabilną wersję.
## 41. Obowiązkowe testy
1. Otwórz ASTATION.
2. Wybierz profil.
3. Biblioteka.
4. Game Hub.
5. Wcześniej zaimportowana gra.
6. Sterowanie.
7. Dźwięk.
8. Tempo.
9. Control Center.
10. Wróć do rozgrywki.
11. Zapisz.
12. Wyjdź do menu.
13. Odśwież.
14. Uruchom ponownie.
15. Sprawdź zapis.
16. Trofea.
17. Ustawienia.
18. Telefon.
19. Kontroler.
20. Publiczne GitHub Pages.
Playwright i ręczne testy; nie deklarować fizycznego telefonu/pada bez dostępu.
## 42. Obowiązkowa lista odbioru (nie odhaczać bez dowodów)
- [ ] OS startuje
- [ ] Logo i animacja startowa
- [ ] Profile
- [ ] Zmiana języka
- [ ] Menu
- [ ] Biblioteka
- [ ] Sklep
- [ ] Instalowanie w przewidzianym zakresie
- [ ] Lokalny import
- [ ] Zaimportowane gry pozostają w bibliotece
- [ ] Bez ponownego importu gdy dane dostępne
- [ ] New Super Mario Bros. uruchamia się i jest grywalne
- [ ] Emulator
- [ ] Normalne tempo
- [ ] Audio
- [ ] Klawiatura
- [ ] Dotyk
- [ ] Kontrolery na kompatybilnych urządzeniach
- [ ] Dwa ekrany DS
- [ ] Dotyk DS
- [ ] Zapisy
- [ ] Wczytanie
- [ ] Trofea
- [ ] Control Center
- [ ] Powrót z gry
- [ ] Powiadomienia
- [ ] Ustawienia
- [ ] Motywy
- [ ] Odświeżenie nie usuwa celowo danych
- [ ] Działające Pages
- [ ] Brak krytycznych błędów
- [ ] Brak pustych przycisków
Funkcje zależne od emulatora/urządzenia wymagają wykrywania kompatybilności.
## 43. Priorytety
P0: start gier, błędy emulatora, wydajność, sterowanie, zapisy, trwały import, powrót, telefon.
P1: menu, biblioteka, sklep, trofea, profile, settings, control center, instalacja.
P2: kolejne emulatory, Quick Resume, PWA, offline, TV, capture, motywy.
P3: Originals, nowe platformy, synchronizacja, online, multiplayer.
Nie kolorować menu kosztem rozgrywki.
## 44. Raport aktualizacji
Rzeczywiście wykonane funkcje, zmienione pliki, naprawy, przeprowadzone testy, PASS/FAIL, funkcje niedziałające, ograniczenia, commit, wdrożenie, działający URL. Realne zmiany w repozytorium zamiast opisu. Realizacja etapami zgodnie z dokumentem.
