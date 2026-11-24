import { unpackLocalFile, dbPut } from './rom.js';
import { loadLocalROMs, persistLocalROM, deleteLocalROM } from './persistent.js';

'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const parsedProfile = new URLSearchParams(location.search).get('profile') || 'legacy';
const profile = /^[\w-]{1,40}$/.test(parsedProfile) ? parsedProfile : 'legacy';
const DIRECT_GAME = ['mario','cod'].includes(new URLSearchParams(location.search).get('game')) ? new URLSearchParams(location.search).get('game') : null;
const DIRECT_TITLES={mario:'New Super Mario Bros.',cod:'Call of Duty: Black Ops'};
const matchesDirectROM=item=>{
 const code=String(item?.info?.code||'').toUpperCase();
 const title=String(item?.info?.title||'').toUpperCase();
 return DIRECT_GAME==='mario'? /^A2D[A-Z0-9]$/.test(code)&&title.startsWith('NEW MARIO') : DIRECT_GAME==='cod'?/^BDY[A-Z0-9]$/.test(code)&&title.startsWith('CALLOFDUTY7'):true;
};
const SETTINGS_KEY = 'astation_retro_settings_v8_' + profile;
const IMPORT_MARK_KEY='astation_retro_lastimport_v85_'+profile+'_'+(DIRECT_GAME||'library');
const DEFAULT_KEYS = Object.freeze({Up:'up arrow',Down:'down arrow',Left:'left arrow',Right:'right arrow',B:'z',A:'x',Y:'a',X:'s',Start:'enter',Select:'shift',L:'q',R:'e'});
const mobileDevice=/(iPhone|iPad|iPod|Android)/i.test(navigator.userAgent)||(matchMedia('(pointer:coarse)').matches&&innerWidth<800);
const PERF_PRESETS={performance:{core:'desmume2015',frameskip:2},balanced:{core:mobileDevice?'desmume2015':'desmume',frameskip:mobileDevice?1:0},quality:{core:'desmume',frameskip:0}};
const DEFAULT_SETTINGS={...PERF_PRESETS.balanced,performance:'balanced',layout:'classic',volume:65,persist:true,fastEnabled:false,keys:{...DEFAULT_KEYS}};
function readSettings(){try{
 const data=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'null');
 const current={...DEFAULT_SETTINGS,...data,keys:{...DEFAULT_KEYS,...(data?.keys||{})}};
 // Upgrade untouched v8 mobile defaults once without overwriting custom settings.
 if(mobileDevice&&data&&!Object.hasOwn(data,'performance')&&data.core==='desmume'&&Number(data.frameskip)===0){current.core='desmume2015';current.frameskip=1;current.performance='balanced'}
 return current;
}catch{return {...DEFAULT_SETTINGS,keys:{...DEFAULT_KEYS}}}}
const settings=readSettings();
const state={games:[],volatile:new Map(),selected:null,playerUrl:null,playerReady:false,coreReady:false,view:'library',playing:null,menuWasPaused:false,saveWaiters:[],closing:false,gameStarted:false,startupTimer:null};
const formatBytes=n=>n>1024*1024?`${(n/1048576).toFixed(1)} MiB`:`${(n/1024).toFixed(0)} KiB`;
const safeName=s=>String(s||'Untitled').replace(/[\x00-\x1f<>]/g,'').slice(0,90);
let toastTimeout;
function toast(message,error=false){const box=$('#toast');box.textContent=message;box.style.background=error?'#5a2030':'#17365a';box.hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>{box.hidden=true},6000)}
function saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings))}catch(e){toast('Nie można zachować ustawień w tej przeglądarce.',true)}}
function markImport(){try{localStorage.setItem(IMPORT_MARK_KEY,JSON.stringify({at:Date.now(),game:DIRECT_GAME}))}catch{}}
function storedBefore(){try{return !!localStorage.getItem(IMPORT_MARK_KEY)}catch{return false}}
function storageStatus(message,problem=false){const tag=$('#rom-storage-status');if(!tag)return;tag.hidden=false;tag.classList.toggle('storage-error',problem);tag.textContent=message}

function post(event,extra={}){const frame=$('#player-frame').contentWindow;if(!state.playerReady||!frame)return;frame.postMessage({source:'astation-retro-host',event,...extra},location.origin)}
function updateFastButton(){
 const button=$('#fast-toggle');if(!button)return;
 const enabled=!!settings.fastEnabled;
 button.textContent=enabled?'FAST ×2 · ON':'FAST ×2 · OFF';
 button.classList.toggle('fast-on',enabled);
 button.setAttribute('aria-pressed',String(enabled));
}
function toggleFast(){
 if(!state.playing||!state.gameStarted){toast('Uruchom grę, aby użyć FAST.',true);return}
 settings.fastEnabled=!settings.fastEnabled;
 saveSettings();updateFastButton();post('fast',{enabled:settings.fastEnabled});
}
function show(view){state.view=view;for(const name of ['library','play','settings'])$('#'+name+'-view').hidden=view!==name}
function profileSwitch(){// Prevent accidental cross-profile ROM access when the parent console changes users.
 if(window.parent===window)return;
}
function displaySettings(){
 updateFastButton();
 $('#core-select').value=settings.core;$('#frameskip-select').value=String(settings.frameskip);$('#performance-select').value=settings.performance||'custom';$('#layout-select').value=settings.layout;$('#volume-range').value=settings.volume;$('#volume-value').textContent=settings.volume+'%';$('#persist-rom').checked=settings.persist;
 const area=$('#key-mappings');area.replaceChildren();
 for(const name of ['Up','Down','Left','Right','B','A','Y','X','Start','Select','L','R']){
   const wrap=document.createElement('div');wrap.className='key-assign';const label=document.createElement('span');label.textContent=name;
   const key=document.createElement('button');key.type='button';key.textContent=settings.keys[name]||DEFAULT_KEYS[name];key.title='Kliknij i naciśnij nowy klawisz';
   key.addEventListener('click',()=>{key.textContent='Naciśnij…';function onKey(e){e.preventDefault();e.stopPropagation();window.removeEventListener('keydown',onKey,true);if(e.key==='Escape'){key.textContent=settings.keys[name]||DEFAULT_KEYS[name];return}const value=e.key.toLowerCase();if(value.length>15){toast('Tego klawisza nie można przypisać.',true);key.textContent=settings.keys[name]||DEFAULT_KEYS[name];return}settings.keys[name]=value;saveSettings();key.textContent=value;toast('Zapisano klawisz '+name+'. Zastosowanie po ponownym uruchomieniu ROM.')}window.addEventListener('keydown',onKey,true)});
   wrap.append(label,key);area.append(wrap);
 }
}
function gameCard(item){
 const card=document.createElement('article');card.className='game-card';
 const meta=document.createElement('div');meta.className='meta';meta.textContent=`NINTENDO DS · ${item.info?.code||'NDS'}`;
 const title=document.createElement('h3');title.textContent=safeName(item.info?.title||item.filename);
 const info=document.createElement('p');info.textContent=`${formatBytes(item.info?.size||item.blob?.size||0)} · ${item.lastPlayed?'Ostatnio: '+new Date(item.lastPlayed).toLocaleDateString('pl-PL'):'Jeszcze nie uruchamiana'}`;
 const foot=document.createElement('div');foot.className='card-footer';
 const play=document.createElement('button');play.type='button';play.textContent='Graj';play.addEventListener('click',()=>launch(item));
 const remove=document.createElement('button');remove.type='button';remove.className='del';remove.textContent='Usuń ROM';remove.addEventListener('click',async()=>{
   if(!confirm(`Usunąć grę „${safeName(item.info?.title)}” z lokalnej biblioteki? Zapisy emulatora pozostaną.`))return;
   try{await deleteLocalROM(item);state.volatile.delete(item.id);state.games=state.games.filter(g=>g.id!==item.id);renderLibrary();toast('Usunięto lokalny ROM. Zapisy emulatora pozostają.')}catch(e){toast('Błąd usuwania: '+e.message,true)}
 });
 foot.append(play,remove);card.append(meta,title,info,foot);return card;
}
function renderLibrary(){
 const box=$('#library-grid');box.replaceChildren();const games=[...state.games].filter(matchesDirectROM).sort((a,b)=>(b.lastPlayed||b.imported||0)-(a.lastPlayed||a.imported||0));
 $('#library-count').textContent=games.length?`${games.length} ${games.length===1?'gra':'gry'} · profil ${profile}`:`Brak gier · profil ${profile}`;
 if(!games.length){const empty=document.createElement('div');empty.className='empty-card';empty.innerHTML='<svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h4"/></svg><strong>Twoja biblioteka jest pusta</strong><span>Wybierz własny plik gry (.nds lub .zip), aby rozpocząć rozgrywkę.</span>';box.append(empty);return}
 for(const game of games)box.append(gameCard(game));
}
async function fetchLibrary(){
 const {games,error}=await loadLocalROMs(profile);
 state.games=[...games,...state.volatile.values()].filter((v,i,a)=>a.findIndex(x=>x.id===v.id)===i);
 renderLibrary();
 const target=DIRECT_GAME?state.games.find(matchesDirectROM):state.games[0];
 if(target){
   storageStatus(target.cacheBackup?'Plik gry odzyskany z lokalnej pamięci zapasowej.':'Gra zapisana na urządzeniu. Nie musisz ponownie wybierać ZIP-a.');
   if(DIRECT_GAME)launch(target);
 }else if(DIRECT_GAME){
   if(storedBefore())storageStatus('Poprzednio zapisany ROM nie jest już dostępny w tej przeglądarce. Otwórz ASTATION bezpośrednio w Safari i wskaż ZIP ponownie.',true);
   else storageStatus('Pierwsze uruchomienie: wskaż własny plik ZIP lub NDS. ASTATION spróbuje zachować go na przyszłość.');
 }
 if(error&&!target)storageStatus('Przeglądarka blokuje lokalną pamięć gier. Spróbuj otworzyć ASTATION w Safari poza przeglądarką aplikacji.',true);
}
async function importROM(file){
 if(!file)return;
 toast('Sprawdzanie pliku lokalnie…');
 const importButton=$('#import-btn');importButton.disabled=true;
 try{
  const {blob,info,sha,filename}=await unpackLocalFile(file);
  if(DIRECT_GAME&&!matchesDirectROM({info}))throw Error('Wybrany plik nie jest poprawną grą '+DIRECT_TITLES[DIRECT_GAME]+'. Kod ROM-u: '+info.code+'. Wskaż właściwy plik NDS lub ZIP.');
  const id=profile+':'+sha;
  const old=state.games.find(x=>x.id===id);
  const entry={id,profile,sha,filename,info,blob,imported:old?.imported||Date.now(),lastPlayed:old?.lastPlayed||0};
  state.games=[entry,...state.games.filter(x=>x.id!==id)];state.volatile.set(id,entry);
  if(settings.persist){
    try{
      storageStatus('Trwa sprawdzanie zapisu gry na urządzeniu…');
      const result=await persistLocalROM(entry);
      state.volatile.delete(id);
      entry.cacheBackup=result.method==='Cache Storage';
      markImport();
      storageStatus('Potwierdzono: ROM zapisany w '+result.method+'. Przy następnym uruchomieniu nie powinien być potrzebny wybór ZIP-a.');
      toast('Zapisano grę lokalnie i zweryfikowano jej odczyt.');
    }catch(e){
      storageStatus('Nie udało się zachować gry na przyszłość. '+e.message+' Plik działa tylko do zamknięcia tej strony.',true);
      toast('Uwaga: gra nie została zapisana na urządzeniu. Otwórz ASTATION w Safari.',true);
    }
  }else{
    storageStatus('Zapisywanie ROM-u zostało wyłączone w ustawieniach — następnym razem trzeba będzie wybrać plik.',true);
    toast('Plik dostępny tylko w tej sesji. Włącz Zapamiętuj ROM w ustawieniach.',true);
  }
  renderLibrary();
  if(DIRECT_GAME)launch(entry);
 }catch(e){toast('Import nieudany: '+(e?.message||e),true)}finally{importButton.disabled=false;$('#rom-input').value=''}
}
function refreshPad(){try{const connected=Array.from(navigator.getGamepads?.()||[]).some(Boolean);const target=$('#gamepad-status');target.classList.toggle('online',connected);target.title=connected?'Wykryto kontroler':'Nie wykryto kontrolera';target.lastElementChild.textContent=connected?'Pad ✓':'Pad';}catch{}}
function activeBlob(item){return state.volatile.get(item.id)?.blob||item.blob}
function clearStartupTimer(){if(state.startupTimer){clearTimeout(state.startupTimer);state.startupTimer=null}}
function recovery(message){
  if(!state.playing||state.gameStarted)return;
  $('#player-loading').hidden=true;
  $('#player-recovery-message').textContent=message;
  $('#player-recovery').hidden=false;
  $('#playing-status').textContent='Emulator nie rozpoczął gry — dostępna próba ponowna';
}
function retryCurrent(core){
  if(!state.playing)return;
  settings.core=core;saveSettings();displaySettings();
  clearStartupTimer();
  state.playerReady=false;state.coreReady=false;state.gameStarted=false;
  $('#player-recovery').hidden=true;
  $('#player-loading').hidden=false;
  $('#playing-status').textContent='Ponowne ładowanie rdzenia: '+(core==='desmume2015'?'DeSmuME 2015':'DeSmuME')+'…';
  $('#player-frame').src='./player.html?retry='+Date.now();
}

function launch(item){
 if(state.playing){toast('Najpierw zamknij poprzednią grę.',true);return}
 const blob=activeBlob(item);if(!blob){toast('Brak ROM-u w tej sesji. Zaimportuj plik ponownie.',true);return}
 state.playing=item;state.playerUrl=null;state.playerReady=false;state.coreReady=false;state.gameStarted=false;clearStartupTimer();$('#player-recovery').hidden=true;
 const frame=$('#player-frame');frame.src='./player.html';$('#playing-title').textContent=DIRECT_GAME?DIRECT_TITLES[DIRECT_GAME]:safeName(item.info?.title||item.filename);$('#playing-info').textContent=item.info.code+' · '+formatBytes(item.info.size);
 $('#player-loading').hidden=false;$('#playing-status').textContent='Ładowanie silnika DS · ROM lokalnie na urządzeniu';show('play');
 item.lastPlayed=Date.now();
 // Last-played timestamps are transient; do not risk overwriting a known-good ROM on every launch.
 renderLibrary();
}
function requestSaveBeforeExit(timeout=1800){
 if(!state.playing||!state.playerReady||!state.gameStarted)return Promise.resolve(false);
 return new Promise(resolve=>{
   const timer=setTimeout(()=>{state.saveWaiters=state.saveWaiters.filter(x=>x!==done);resolve(false)},timeout);
   const done=success=>{clearTimeout(timer);resolve(success)};
   state.saveWaiters.push(done);post('save');
 });
}
async function exitToLibrary(notify=true){
 if(state.closing)return;
 state.closing=true;
 try{
   if(state.playing){post('pause');await requestSaveBeforeExit()}
   const frame=$('#player-frame');frame.removeAttribute('src');$('#pause-overlay').hidden=true;$('#player-loading').hidden=true;
   if(state.playerUrl){URL.revokeObjectURL(state.playerUrl);state.playerUrl=null}
   state.playerReady=false;state.coreReady=false;state.gameStarted=false;clearStartupTimer();$('#player-recovery').hidden=true;state.playing=null;show('library');
   if(notify)toast('Powrót do biblioteki. Zapis w grze: użyj menu EmulatorJS do kontroli danych.');
 }finally{state.closing=false}
}

function pauseMenu(open){$('#pause-overlay').hidden=!open;if(state.playing){post(open?'pause':'resume');state.menuWasPaused=open}}
function changeLayout(){const values=['classic','side','focus'];settings.layout=values[(values.indexOf(settings.layout)+1)%3];saveSettings();post('layout',{layout:settings.layout});$('#layout-select').value=settings.layout;toast('Układ: '+({classic:'Classic',side:'Side by Side',focus:'Focus'}[settings.layout]))}
function openSettings(){displaySettings();$('#pause-overlay').hidden=true;show('settings')}
function exitSettings(){show(state.playing?'play':'library');if(state.playing&&state.menuWasPaused)pauseMenu(true)}
async function quitOS(){if(state.playing)await exitToLibrary(false);if(parent!==window)parent.postMessage({source:'astation-retro8',event:'exit'},location.origin);else location.href='../index.html'}
const sources=['astation-retro-player'];
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==$('#player-frame').contentWindow||!sources.includes(event.data?.source))return;
 const d=event.data;
 if(d.event==='player-ready'&&state.playing){state.playerReady=true;post('start',{romBlob:activeBlob(state.playing),profile,sha:state.playing.sha,core:settings.core,layout:settings.layout,volume:settings.volume/100,frameskip:settings.frameskip,keys:settings.keys,performance:settings.performance});}
 if(d.event==='core-ready'){
   state.coreReady=true;
   $('#player-loading').hidden=true;
   $('#playing-status').textContent=d.requiresTap?'Rdzeń gotowy · naciśnij Play na ekranie emulatora':'Rdzeń gotowy · oczekiwanie na rozpoczęcie gry';
   clearStartupTimer();
   state.startupTimer=setTimeout(()=>{
     if(!state.gameStarted)recovery('Gra nadal się nie uruchomiła. Na iPhonie dotknij Play w emulatorze albo spróbuj DeSmuME 2015.');
   },60000);
 }
 if(d.event==='game-started'){
   state.gameStarted=true;clearStartupTimer();
   if(settings.fastEnabled)post('fast',{enabled:true});
   updateFastButton();
   $('#player-recovery').hidden=true;$('#player-loading').hidden=true;
   $('#playing-status').textContent='Gra uruchomiona · '+(settings.core==='desmume2015'?'DeSmuME 2015':'DeSmuME')+' WebAssembly · '+(settings.frameskip?'pomijanie '+settings.frameskip+' klatek':'pełne klatki');
 }
 if(d.event==='fast-state'){updateFastButton();$('#playing-status').textContent=d.enabled?'Gra uruchomiona · FAST ×2':'Gra uruchomiona · normalna prędkość'}
 if(d.event==='fast-unavailable'){settings.fastEnabled=false;saveSettings();updateFastButton();toast(d.message||'FAST nie jest dostępny',true)}
 if(d.event==='startup-slow')recovery(d.message||'Próba uruchomienia trwa zbyt długo.');
 if(d.event==='core-error'){
   $('#playing-status').textContent='Błąd uruchamiania emulatora';
   recovery('Błąd EmulatorJS: '+d.message);
   toast('Błąd rdzenia: '+d.message,true);
 }
 if(d.event==='save-ok'||d.event==='save-error'){
   state.saveWaiters.splice(0).forEach(done=>done(d.event==='save-ok'));
   if(d.event==='save-ok')toast('Zlecono zapis danych gry w EmulatorJS.');
   else toast('Zapis nieudany: '+d.message,true);
 }
 if(d.event==='layout-unsupported')toast(d.message||'Układ można zmienić w ustawieniach EmulatorJS.');
 if(d.event==='exited')exitToLibrary(false);
});
$('#rom-input').addEventListener('change',e=>importROM(e.target.files?.[0]));
$('#import-btn').addEventListener('click',()=>$('#rom-input').click());$('#import-small').addEventListener('click',()=>$('#rom-input').click());
$('#os-back').addEventListener('click',quitOS);
$('#play-exit').addEventListener('click',()=>exitToLibrary());
$('#play-menu').addEventListener('click',()=>pauseMenu(true));
$('#fast-toggle').addEventListener('click',toggleFast);
$('#play-fullscreen').addEventListener('click',async()=>{try{await $('.player-wrap').requestFullscreen();}catch(e){toast('Pełny ekran niedostępny: '+e.message,true)}});
$('#layout-cycle').addEventListener('click',changeLayout);
$('#retry-light-core').addEventListener('click',()=>retryCurrent('desmume2015'));
$('#retry-default-core').addEventListener('click',()=>retryCurrent('desmume'));
$('#recovery-close').addEventListener('click',()=>$('#player-recovery').hidden=true);
$('#settings-open').addEventListener('click',openSettings);$('#settings-close').addEventListener('click',exitSettings);
$('#controls-open').addEventListener('click',()=>$('#controls-overlay').hidden=false);$('#controls-close').addEventListener('click',()=>$('#controls-overlay').hidden=true);
$('#gamepad-status').addEventListener('click',()=>toast(navigator.getGamepads?.()?.filter(Boolean).length?'Kontroler został wykryty.':'Nie podłączono kontrolera.'));
$('#keys-reset').addEventListener('click',()=>{settings.keys={...DEFAULT_KEYS};saveSettings();displaySettings();toast('Przywrócono domyślną klawiaturę.')});
for(const [selector,key,fn] of [['#core-select','core',v=>v],['#frameskip-select','frameskip',v=>Number(v)],['#layout-select','layout',v=>v],['#volume-range','volume',v=>Number(v)]])$(selector).addEventListener('change',e=>{settings[key]=fn(e.target.value);if(key==='core'||key==='frameskip'){settings.performance='custom';$('#performance-select').value='custom'}saveSettings();if(key==='volume'){post('volume',{value:settings.volume/100});$('#volume-value').textContent=settings.volume+'%'}if(key==='layout')post('layout',{layout:settings.layout})});
$('#volume-range').addEventListener('input',e=>$('#volume-value').textContent=e.target.value+'%');
$('#performance-select').addEventListener('change',e=>{const mode=e.target.value;if(!PERF_PRESETS[mode])return;Object.assign(settings,PERF_PRESETS[mode],{performance:mode});saveSettings();displaySettings();toast('Tryb '+mode+' zapisany. Zastosowanie przy następnym uruchomieniu gry.')});
$('#persist-rom').addEventListener('change',e=>{settings.persist=e.target.checked;saveSettings();toast(settings.persist?'Nowe ROM-y będą zapisane lokalnie.':'Nowe ROM-y będą tylko w bieżącej sesji.')});
$$('[data-pause]').forEach(btn=>btn.addEventListener('click',()=>{
 const action=btn.dataset.pause;
 if(action==='resume')pauseMenu(false);
 if(action==='save')post('save');
 if(action==='layout')changeLayout();
 if(action==='controls')$('#controls-overlay').hidden=false;
 if(action==='settings')openSettings();
 if(action==='restart'){if(confirm('Uruchomić ROM od początku? Zapis w grze pozostanie.')){post('restart');pauseMenu(false)}}
 if(action==='exit')exitToLibrary();
}));
window.addEventListener('gamepadconnected',refreshPad);window.addEventListener('gamepaddisconnected',refreshPad);
setInterval(refreshPad,2500);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#controls-overlay').hidden){$('#controls-overlay').hidden=true;e.preventDefault()}else if(e.key==='Escape'&&!$('#pause-overlay').hidden){pauseMenu(false);e.preventDefault()}});
window.addEventListener('beforeunload',()=>{if(state.playerUrl)URL.revokeObjectURL(state.playerUrl)});
function setDirectMarioMode(){
 if(!DIRECT_GAME)return;
 document.body.classList.add(DIRECT_GAME==='mario'?'mario-direct':'cod-direct');
 document.title=DIRECT_TITLES[DIRECT_GAME]+' — ASTATION 5 PRO';
 const hero=$('.hero h1');if(hero)hero.textContent=DIRECT_TITLES[DIRECT_GAME];
 const eyebrow=$('.hero .eyebrow');if(eyebrow)eyebrow.textContent='ASTATION STORE · NINTENDO DS · GRA LOKALNA';
 const desc=$('.hero-copy p');if(desc)desc.textContent='Przy pierwszym uruchomieniu wskaż własny plik '+DIRECT_TITLES[DIRECT_GAME]+' (.nds lub .zip). Następne uruchomienia otworzą grę z zapisu lokalnego. Emulator nie wymaga ponownego wybierania pliku, jeśli IndexedDB zachowa dane.';
 const fine=$('.hero .fineprint');if(fine)fine.textContent='Uwaga: komercyjny ROM NIE jest pobierany ze sklepu. Plik pozostaje lokalnie w pamięci przeglądarki. Nie przesyłamy go na GitHub.';
 const importButton=$('#import-btn');if(importButton)importButton.textContent='Wybierz plik '+DIRECT_TITLES[DIRECT_GAME]+' (.zip / .nds)';
 const heading=$('.content-head h2');if(heading)heading.textContent=DIRECT_TITLES[DIRECT_GAME]+' · zapisana gra';
 const brand=$('.brand strong');if(brand)brand.innerHTML='ASTATION <em>GAMES</em>';
 const b=$('#play-exit span');if(b)b.textContent='Karta gry';
}
refreshPad();setDirectMarioMode();fetchLibrary();displaySettings();show('library');profileSwitch();
