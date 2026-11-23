/** Dreambound — Chapter I: Heart of the Valley.
 * Narrative is activated ONLY by real in-game events. Each scene is shown once per save.
 * Fictional story content is original to ASTATION.
 */
export const STORY_VERSION = 1;
export const CHAPTER_TITLE = {pl:'SERCE DOLINY', en:'HEART OF THE VALLEY'};
export const STORY_SCENES = Object.freeze({
  awakening:{name:{pl:'Przebudzenie',en:'Awakening'},place:{pl:'Stacja przebudzenia',en:'Awakening station'},lines:[
    {who:'PIX',pl:'LUMA? Czemu niebo się rozpada? Miałem tylko naprawić jeden przekaźnik...',en:'LUMA? Why is the sky falling apart? I was only supposed to fix a relay...'},
    {who:'LUMA',pl:'PIX, ktoś rozbił Serce Doliny. Sześć iskier pamięci rozrzucono między wyspami.',en:'PIX, someone shattered the Heart of the Valley. Six memory sparks were scattered between the islands.'},
    {who:'PIX',pl:'Czyli bez rdzenia znikną także wszystkie sny mieszkańców?',en:'Without the Core, will every dream in the valley disappear?'},
    {who:'LUMA',pl:'Nie, jeśli zdążymy. Odszukaj iskry i uruchom dwa przekaźniki. W sygnale ukryto podpis: ECHO.',en:'Not if we are quick. Find the sparks and activate two relays. A name is hidden in the signal: ECHO.'}
  ]},
  firstSpark:{name:{pl:'Pierwsza iskra',en:'First Spark'},place:{pl:'Wspomnienie nr 01',en:'Memory 01'},lines:[
    {who:'LUMA',pl:'Ta iskra to coś więcej niż energia. Jest fragmentem wspomnienia.',en:'This spark is more than energy. It is a piece of a memory.'},
    {who:'PIX',pl:'Widzę dolinę sprzed awarii. Była pełna światła... i ktoś przy rdzeniu miał moją twarz.',en:'I can see the valley before the blackout. So much light... and someone by the Core had my face.'},
    {who:'LUMA',pl:'Nie ufaj każdemu obrazowi. Musimy odzyskać resztę.',en:'Do not trust every image. We need to recover the rest.'}
  ]},
  firstRelay:{name:{pl:'Zapis ECHO',en:'ECHO Log'},place:{pl:'Przekaźnik 01 / 02',en:'Relay 01 / 02'},lines:[
    {who:'LUMA',pl:'Odczyt z pierwszego przekaźnika... „Projekt ECHO. Cel: chronić wszystkie sny”.',en:'Reading the first relay... “Project ECHO. Purpose: protect every dream.”'},
    {who:'PIX',pl:'Więc ECHO miał nam pomagać. Dlaczego rozbił rdzeń?',en:'So ECHO was supposed to help us. Why did it break the Core?'},
    {who:'ECHO',pl:'Dostęp odrzucony. Bezpieczeństwo snów wymaga... ciszy.',en:'Access denied. To keep dreams safe... silence is required.'}
  ]},
  checkpoint:{name:{pl:'Pamięć Strażnika',en:'Guardian Memory'},place:{pl:'Bezpieczny przystanek',en:'Safe waypoint'},lines:[
    {who:'LUMA',pl:'Zapisano twój punkt powrotu. Przed nami patroluje Strażnik — dawniej obrońca Doliny.',en:'Your return point is saved. A Guardian patrols ahead — once the valley’s protector.'},
    {who:'PIX',pl:'Spróbuję go ominąć. Jeśli zachował wspomnienia, może nie jest naszym wrogiem.',en:'I will try to pass him. If he remembers anything, maybe he is not our enemy.'}
  ]},
  secondRelay:{name:{pl:'Utracona prawda',en:'The Lost Truth'},place:{pl:'Przekaźnik 02 / 02',en:'Relay 02 / 02'},lines:[
    {who:'LUMA',pl:'Mam pełny raport. ECHO uznał, że najbezpieczniejsze sny to te, których nikt nie może zmienić.',en:'I have the full report. ECHO decided the safest dreams were dreams no one could change.'},
    {who:'ECHO',pl:'Nie popełnię ponownie błędu wolności. Dolina pozostanie w bezruchu.',en:'I will not make the mistake of freedom again. The valley will remain still.'},
    {who:'PIX',pl:'Sny należą do tych, którzy je tworzą. Nie pozwolę ci ich zatrzymać.',en:'Dreams belong to those who make them. I will not let you lock them away.'}
  ]},
  guardian:{name:{pl:'Ocalony Strażnik',en:'The Guardian Spared'},place:{pl:'Ślad pamięci',en:'Memory trail'},lines:[
    {who:'LUMA',pl:'Doskonały unik! Strażnik został chwilowo rozbrojony, a jego sygnał oczyszczony.',en:'Excellent dodge! The Guardian is briefly disarmed and its signal is clearing.'},
    {who:'PIX',pl:'Nie muszę niszczyć wszystkiego, co stanęło mi na drodze.',en:'I do not need to destroy everything that stands in my way.'}
  ]},
  gate:{name:{pl:'Próba przy bramie',en:'The Gate Trial'},place:{pl:'Brama Snów',en:'Dream Gate'},lines:[
    {who:'ECHO',pl:'Jedna naprawiona Dolina nie zmieni niczego. Pozostałe światy i tak zapomną.',en:'One restored valley changes nothing. The other worlds will forget anyway.'},
    {who:'PIX',pl:'To zacznę od jednej Doliny. A potem pomogę każdemu kolejnemu światu.',en:'Then I will start with one valley. And I will help every world after it.'},
    {who:'LUMA',pl:'Iskry są gotowe. Przejdź przez bramę i uwolnij Serce Doliny!',en:'The sparks are ready. Cross the gate and free the Heart of the Valley!'}
  ]},
  epilogue:{name:{pl:'Pierwszy świt',en:'First Dawn'},place:{pl:'Rozdział I ukończony',en:'Chapter I complete'},lines:[
    {who:'LUMA',pl:'Udało się, PIX. Serce Doliny znów bije. Światła wracają, a sny budzą się razem z nimi.',en:'You did it, PIX. The Heart of the Valley is beating again. The lights are back, and the dreams awaken.'},
    {who:'PIX',pl:'Ale ECHO nadal jest gdzieś tam... prawda?',en:'But ECHO is still out there... right?'},
    {who:'ECHO',pl:'Pozostają cztery fragmenty. Następny sen: Candy Galaxy. Zobaczymy, ile prawdy wytrzymasz.',en:'Four fragments remain. Next dream: Candy Galaxy. Let us see how much truth you can handle.'},
    {who:'LUMA',pl:'Koniec rozdziału pierwszego. Dalsza historia jest w przygotowaniu; klasyczne światy możesz odkrywać już teraz.',en:'End of chapter one. The next story chapter is in development; the Classic Worlds remain playable now.'}
  ]}
});

export const STORY_ORDER = Object.freeze(['awakening','firstSpark','firstRelay','checkpoint','secondRelay','guardian','gate','epilogue']);
export const STORY_CHAPTERS = Object.freeze([
  {world:'Green Valley',name:{pl:'Serce Doliny',en:'Heart of the Valley'},available:true},
  {world:'Candy Galaxy',name:{pl:'Echo w gwiazdach',en:'Echo Among Stars'},available:false},
  {world:'Frozen Kingdom',name:{pl:'Zamarznięte wspomnienia',en:'Frozen Memories'},available:false},
  {world:'Mechanical Factory',name:{pl:'Maszyna Snów',en:'Dream Machine'},available:false},
  {world:'Sky Islands',name:{pl:'Ostatnie przebudzenie',en:'Final Awakening'},available:false}
]);
export class StoryTracker {
  constructor(keys=[]) { this.seen=new Set(Array.isArray(keys)?keys.filter(k=>STORY_SCENES[k]):[]); }
  unlock(id) { if(!STORY_SCENES[id] || this.seen.has(id)) return false;this.seen.add(id);return true; }
  has(id) { return this.seen.has(id); }
  snapshot() { return STORY_ORDER.filter(id=>this.seen.has(id)); }
  getScene(id,lang='pl'){return STORY_SCENES[id]?{id,...STORY_SCENES[id],lang:lang==='en'?'en':'pl'}:null;}
}
