import { unpackLocalFile, dbPut } from './rom.js';
import { loadLocalROMs, persistLocalROM, deleteLocalROM } from './persistent.js';
import { readSnapshot, writeSnapshot, getStats, saveStats, removeSnapshot, backupSnapshot, restoreBackup, snapshotInventory } from './session-store.js?v=90';

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
const DEFAULT_SETTINGS={...PERF_PRESETS.balanced,performance:'balanced',layout:'classic',volume:65,persist:true,keys:{...DEFAULT_KEYS}};
function readSettings(){try{
 const data=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'null');
 const current={...DEFAULT_SETTINGS,...data,keys:{...DEFAULT_KEYS,...(data?.keys||{})}};
 // Upgrade untouched v8 mobile defaults once without overwriting custom settings.
 if(mobileDevice&&data&&!Object.hasOwn(data,'performance')&&data.core==='desmume'&&Number(data.frameskip)===0){current.core='desmume2015';current.frameskip=1;current.performance='balanced'}
 delete current.fastEnabled; // Legacy toggle no longer controls the core.
 return current;
}catch{return {...DEFAULT_SETTINGS,keys:{...DEFAULT_KEYS}}}}
const settings=readSettings();settings.mobile={enabled:false,size:1,opacity:.68,position:'bottom',mode:'dpad',filter:'original',...(settings.mobile||{})};
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
function show(view){state.view=view;document.body.classList.toggle('playing-mode',view==='play');for(const name of ['library','play','settings'])$('#'+name+'-view').hidden=view!==name}
function profileSwitch(){// Prevent accidental cross-profile ROM access when the parent console changes users.
 if(window.parent===window)return;
}
async function storageEstimate(){
 const target=$('#storage-estimate');
 if(!target)return;
 try{
 const s=navigator.storage;
 if(!s?.estimate){target.textContent='Szacowanie pamięci niedostępne.';return}
 const [e,persisted]=await Promise.all([s.estimate(),s.persisted?.()??false]);
 const percent=e.quota?Math.round((e.usage||0)/e.quota*100):null;
 target.textContent='Dane całej witryny: '+formatBytes(e.usage||0)+(e.quota?' / limit '+formatBytes(e.quota):'')+(percent!==null?' · '+percent+'%':'')+' · '+(persisted?'magazyn trwały':'magazyn może zostać usunięty')+(percent>=85?' · Mało miejsca':'');
 }catch{target.textContent='Przeglądarka nie udostępniła informacji o magazynie.'}
}
function diagnostics90(){
 let webgl=false;try{const c=document.createElement('canvas'),g=c.getContext('webgl2')||c.getContext('webgl');webgl=!!g;g?.getExtension('WEBGL_lose_context')?.loseContext()}catch{}
 return ['ASTATION 9 · DS','WebAssembly: '+(typeof WebAssembly==='object'?'tak':'nie'),'WebGL: '+(webgl?'tak':'nie'),'Gamepad API: '+(typeof navigator.getGamepads==='function'?'tak':'nie'),'IndexedDB: '+('indexedDB' in window?'dostępne API':'brak API'),'Service Worker: '+(navigator.serviceWorker?.controller?'aktywny':'brak aktywnego'),'Viewport: '+innerWidth+' × '+innerHeight,'Rdzeń: '+settings.core,'Pomiar: '+(state.gameStarted?$('#playing-status').textContent:'gra nieaktywna')].join('\n');
}
function showPadTest90(){
 if(state.view!=='settings')return;
 let pad;try{pad=Array.from(navigator.getGamepads?.()||[]).find(Boolean)}catch{}
 const target=$('#pad-test90');if(!target)return;
 target.textContent=pad?'Przyciski: '+pad.buttons.map((b,i)=>b.pressed?i:null).filter(v=>v!==null).join(', ')+' · Analogi: '+pad.axes.map(v=>v.toFixed(2)).join(' / '):'Nie wykryto kontrolera. Naciśnij dowolny przycisk.';
}
function displaySettings(){
 renderSaveCenter90();renderStats90();
 $('#touch90').checked=settings.mobile.enabled;$('#touch-size90').value=settings.mobile.size*100;$('#touch-opacity90').value=settings.mobile.opacity*100;$('#touch-position90').value=settings.mobile.position;$('#touch-mode90').value=settings.mobile.mode;$('#filter90').value=settings.mobile.filter;
 storageEstimate();
 $('#diagnostic90').textContent=diagnostics90();
 const dz=Math.round((window.AstationController?.deadzone??.35)*100);
 $('#pad-deadzone').value=String(dz);$('#pad-deadzone-value').textContent=dz+'%';
 $('#core-select').value=settings.core;$('#frameskip-select').value=String(settings.frameskip);$('#performance-select').value=settings.performance||'custom';$('#layout-select').value=settings.layout;$('#volume-range').value=settings.volume;$('#volume-value').textContent=settings.volume+'%';$('#persist-rom').checked=settings.persist;
 const area=$('#key-mappings');area.replaceChildren();
 for(const name of ['Up','Down','Left','Right','B','A','Y','X','Start','Select','L','R']){
   const wrap=document.createElement('div');wrap.className='key-assign';const label=document.createElement('span');label.textContent=name;
   const key=document.createElement('button');key.type='button';key.textContent=settings.keys[name]||DEFAULT_KEYS[name];key.title='Kliknij i naciśnij nowy klawisz';
   key.addEventListener('click',()=>{key.textContent='Naciśnij…';function onKey(e){e.preventDefault();e.stopPropagation();window.removeEventListener('keydown',onKey,true);if(e.key==='Escape'){key.textContent=settings.keys[name]||DEFAULT_KEYS[name];return}const value=e.key.toLowerCase();if(value.length>15){toast('Tego klawisza nie można przypisać.',true);key.textContent=settings.keys[name]||DEFAULT_KEYS[name];return}settings.keys[name]=value;saveSettings();key.textContent=value;toast('Zapisano klawisz '+name+'. Zastosowanie po ponownym uruchomieniu ROM.')}window.addEventListener('keydown',onKey,true)});
   wrap.append(label,key);area.append(wrap);
 }
}
let sessionStats=null,sessionTick=0,canSnapshot=false,pendingState=new Map(),requestId=0;
let importTarget90=null;
const createBtn90=(label,action)=>{const b=document.createElement('button');b.type='button';b.className='secondary slim';b.textContent=label;b.addEventListener('click',async()=>{b.disabled=true;try{await action()}catch(e){toast(e.message||String(e),true)}finally{b.disabled=false}});return b};
function download90(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000)}
async function exportState90(key){
 const s=await readSnapshot(key);if(!s)throw Error('Brak stanu');
 const meta=JSON.stringify({format:'ASTATION_STATE_1',rom:key.split(':')[1],core:key.split(':')[2],size:s.size});
 const prefix=new TextEncoder().encode(meta+'\n');download90(new Blob([prefix,s.bytes],{type:'application/octet-stream'}),'astation-'+key.split(':')[1].slice(0,12)+'.aststate');
}
async function renderSaveCenter90(){
 const area=$('#save-center90');if(!area)return;area.textContent='Wczytywanie...';
 try{
 const stored=await snapshotInventory(profile);const keys=new Set(stored.map(k=>k.replace(/:backup$/,'')));
 for(const item of state.games)keys.add(profile+':'+item.sha+':'+settings.core);
 area.replaceChildren();
 if(!keys.size){area.textContent='Brak lokalnych gier i stanów.';return}
 for(const key of keys){
  const [owner,sha,core]=key.split(':');if(owner!==profile||!/^[a-f0-9]{64}$/i.test(sha)||!['desmume','desmume2015'].includes(core))continue;
  const [s,backup]=await Promise.all([readSnapshot(key),readSnapshot(key+':backup')]);
  const item=state.games.find(g=>g.sha===sha),row=document.createElement('div');row.className='key-assign';row.style.display='block';
  const title=document.createElement('p');title.textContent=(item?safeName(item.info?.title||item.filename):sha.slice(0,12))+' · '+core;
  const meta=document.createElement('p');meta.textContent=s?new Date(s.date).toLocaleString('pl-PL')+' · '+formatBytes(s.size):'Brak Quick Save';if(backup)meta.textContent+=' · Kopia zapasowa';
  row.append(title,meta);
  if(s){row.append(createBtn90('Eksport',()=>exportState90(key)),createBtn90('Kopia',async()=>{await backupSnapshot(key);await renderSaveCenter90()}),createBtn90('Usuń stan',async()=>{if(confirm('Usunąć ten Quick Save? Zwykły zapis gry pozostaje.')){await removeSnapshot(key);await renderSaveCenter90()}}))}
  if(backup)row.append(createBtn90('Przywróć kopię',async()=>{if(confirm('Zastąpić bieżący stan kopią?')){await restoreBackup(key);await renderSaveCenter90()}}));
  row.append(createBtn90('Import',()=>{importTarget90=key;$('#state-import90').click()}));area.append(row);
 }
 }catch(e){area.textContent='Magazyn stanów niedostępny: '+e.message}
}
function renderStats90(){
 const el=$('#stats-center90');if(!el)return;
 let seconds=0,sessions=0,bronze=0,silver=0,gold=0;
 for(const item of state.games){const st=getStats(profile,item.sha);seconds+=st.seconds;sessions+=st.sessions;if(st.sessions>0)bronze++;if(st.seconds>=600)silver++;if(st.seconds>=3600)gold++}
 el.textContent='Czas: '+elapsed90(seconds)+' · Sesje: '+sessions+' · Bronze (pierwsza sesja): '+bronze+' · Silver (10 min): '+silver+' · Gold (1 h): '+gold;
}

function snapshotKey(){return profile+':'+state.playing.sha+':'+settings.core}
function elapsed90(sec){return Math.floor(sec/3600)+' h '+Math.floor(sec%3600/60)+' min'}
function tickSession(){
 const now=performance.now(),delta=Math.min(2,Math.max(0,(now-sessionTick)/1000));sessionTick=now;
 if(!state.gameStarted||!state.playing||!sessionStats||state.menuWasPaused||state.closing||state.view!=='play'||document.hidden)return;
 try{const em=$('#player-frame').contentWindow?.EJS_emulator;if(em?.paused===true||em?.isPaused===true)return}catch{}
 sessionStats.seconds+=delta;
}
function flushSession(){if(state.playing&&sessionStats)saveStats(profile,state.playing.sha,sessionStats)}
setInterval(tickSession,1000);setInterval(flushSession,10000);
window.addEventListener('pagehide',flushSession);
document.addEventListener('visibilitychange',()=>{sessionTick=performance.now();flushSession()});
function stateRequest(event,bytes){
 if(!state.gameStarted||!canSnapshot)return Promise.reject(Error('Save States niedostępne w tym rdzeniu'));
 const id=++requestId;
 return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pendingState.delete(id);reject(Error('Przekroczono czas odpowiedzi rdzenia'))},3500);pendingState.set(id,{resolve,reject,timer});post(event,{id,bytes})});
}
async function quickSave(){const key=snapshotKey(),result=await stateRequest('snapshot');const old=await readSnapshot(key);if(old)await backupSnapshot(key);return writeSnapshot(key,result.bytes)}
async function quickRestore(){
 const saved=await readSnapshot(snapshotKey());if(!saved)throw Error('Brak stanu dla obecnego rdzenia');
 await stateRequest('restore',saved.bytes);
 // EmulatorJS loadState currently gives no proof of in-game restoration.
 toast('Stan przekazano do rdzenia. Sprawdź, czy rozgrywka została przywrócona.');
}
function updateSessionSummary(){
 const el=$('#session-summary90');if(!el)return;
 el.textContent=sessionStats?'Czas: '+elapsed90(sessionStats.seconds)+' · Sesje: '+sessionStats.sessions:'Brak aktywnej sesji';
 for(const action of ['snapshot','restore']){const b=$('[data-pause='+action+']');if(b)b.disabled=!canSnapshot}
}
function gameCard(item){
 const card=document.createElement('article');card.className='game-card';
 const meta=document.createElement('div');meta.className='meta';meta.textContent=`NINTENDO DS · ${item.info?.code||'NDS'}`;
 const title=document.createElement('h3');title.textContent=safeName(item.info?.title||item.filename);
 const stats=getStats(profile,item.sha);
 const info=document.createElement('p');info.textContent=`${formatBytes(item.info?.size||item.blob?.size||0)} · ${stats.last?'Ostatnio: '+new Date(stats.last).toLocaleDateString('pl-PL'):'Jeszcze nie uruchamiana'}`;
 const detail=document.createElement('p');detail.textContent='Czas gry: '+elapsed90(stats.seconds)+' · Sesje: '+stats.sessions;
 const savedInfo=document.createElement('p');savedInfo.textContent='Sprawdzanie Quick Save…';
 const foot=document.createElement('div');foot.className='card-footer';
 const play=document.createElement('button');play.type='button';play.textContent='Graj';play.addEventListener('click',()=>launch(item));
 const remove=document.createElement('button');remove.type='button';remove.className='del';remove.textContent='Usuń ROM';remove.addEventListener('click',async()=>{
   if(!confirm(`Usunąć grę „${safeName(item.info?.title)}” z lokalnej biblioteki? Zapisy emulatora pozostaną.`))return;
   try{await deleteLocalROM(item);state.volatile.delete(item.id);state.games=state.games.filter(g=>g.id!==item.id);renderLibrary();toast('Usunięto lokalny ROM. Zapisy emulatora pozostają.')}catch(e){toast('Błąd usuwania: '+e.message,true)}
 });
 foot.append(play,remove);card.append(meta,title,info,detail,savedInfo,foot);
 readSnapshot(profile+':'+item.sha+':'+settings.core).then(s=>{savedInfo.textContent=s?'Quick Save: '+new Date(s.date).toLocaleString('pl-PL')+' · '+formatBytes(s.size):'Quick Save: brak stanu dla tego rdzenia'}).catch(()=>{savedInfo.textContent='Quick Save: magazyn niedostępny'});
 return card;
}
function renderLibrary(){
 const box=$('#library-grid');box.replaceChildren();const games=[...state.games].filter(matchesDirectROM).sort((a,b)=>(getStats(profile,b.sha).last||b.imported||0)-(getStats(profile,a.sha).last||a.imported||0));
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
  $('#player-frame').src='./player.html?v=90&retry='+Date.now();
}

function launch(item){
 if(state.playing){toast('Najpierw zamknij poprzednią grę.',true);return}
 const blob=activeBlob(item);if(!blob){toast('Brak ROM-u w tej sesji. Zaimportuj plik ponownie.',true);return}
 state.playing=item;sessionStats=null;canSnapshot=false;state.playerUrl=null;state.playerReady=false;state.coreReady=false;state.gameStarted=false;clearStartupTimer();$('#player-recovery').hidden=true;
 const frame=$('#player-frame');frame.src='./player.html?v=90';$('#playing-title').textContent=DIRECT_GAME?DIRECT_TITLES[DIRECT_GAME]:safeName(item.info?.title||item.filename);$('#playing-info').textContent=item.info.code+' · '+formatBytes(item.info.size);
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
   if(state.playing){post('pause');flushSession();const saved=await requestSaveBeforeExit();if(state.gameStarted&&!saved){if(!confirm('Nie potwierdzono zapisu gry. Wyjść mimo to?')){state.menuWasPaused=true;pauseMenu(true);return false}}if(canSnapshot){try{await quickSave()}catch(e){toast('Quick Save: '+e.message,true)}}}
   const frame=$('#player-frame');frame.removeAttribute('src');$('#pause-overlay').hidden=true;$('#player-loading').hidden=true;
   if(state.playerUrl){URL.revokeObjectURL(state.playerUrl);state.playerUrl=null}
   state.playerReady=false;state.coreReady=false;state.gameStarted=false;clearStartupTimer();$('#player-recovery').hidden=true;state.playing=null;sessionStats=null;canSnapshot=false;state.menuWasPaused=false;show('library');renderLibrary();
   if(notify)toast('Powrót do biblioteki. Zapis w grze: użyj menu EmulatorJS do kontroli danych.');
 return true;
 }finally{state.closing=false}
}

function pauseMenu(open){tickSession();if(open){flushSession();updateSessionSummary()}$('#pause-overlay').hidden=!open;if(state.playing){post(open?'pause':'resume');state.menuWasPaused=open}}
function changeLayout(){const values=['classic','side','focus'];settings.layout=values[(values.indexOf(settings.layout)+1)%3];saveSettings();post('layout',{layout:settings.layout});$('#layout-select').value=settings.layout;toast('Układ: '+({classic:'Classic',side:'Side by Side',focus:'Focus'}[settings.layout]))}
function openSettings(){displaySettings();$('#pause-overlay').hidden=true;show('settings')}
function exitSettings(){show(state.playing?'play':'library');if(state.playing&&state.menuWasPaused)pauseMenu(true)}
async function quitOS(){if(state.playing&&!(await exitToLibrary(false)))return;if(parent!==window)parent.postMessage({source:'astation-retro8',event:'exit'},location.origin);else location.href='../index.html'}
function preferredSkip(){if(!['balanced','performance'].includes(settings.performance))return settings.frameskip;try{const raw=localStorage.getItem('astation_perf90_'+profile+'_'+state.playing.sha+'_'+settings.core);if(raw!==null&&/^[012]$/.test(raw))return Number(raw)}catch{}return settings.frameskip}
const sources=['astation-retro-player'];
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==$('#player-frame').contentWindow||!sources.includes(event.data?.source))return;
 const d=event.data;
 if(d.event==='player-ready'&&state.playing){state.playerReady=true;post('start',{romBlob:activeBlob(state.playing),profile,sha:state.playing.sha,core:settings.core,layout:settings.layout,volume:settings.volume/100,frameskip:preferredSkip(),keys:settings.keys,performance:settings.performance,mobile:settings.mobile});}
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
   state.gameStarted=true;canSnapshot=!!d.canSnapshot;clearStartupTimer();sessionStats=getStats(profile,state.playing.sha);sessionStats.sessions++;sessionStats.last=Date.now();sessionTick=performance.now();flushSession();
   $('#player-recovery').hidden=true;$('#player-loading').hidden=true;
   $('#playing-status').textContent='Gra uruchomiona · '+(settings.core==='desmume2015'?'DeSmuME 2015':'DeSmuME')+' WebAssembly · '+(settings.frameskip?'pomijanie '+settings.frameskip+' klatek':'pełne klatki');
 }
 if(d.event==='controller-menu'&&state.gameStarted&&!state.menuWasPaused)pauseMenu(true);
 if(d.event==='snapshot-result'||d.event==='restore-result'){const req=pendingState.get(d.id);if(req){clearTimeout(req.timer);pendingState.delete(d.id);if(d.error)req.reject(Error(d.error));else req.resolve(d)}}
 if(d.event==='performance'){
   $('#playing-status').textContent=d.fps===null?'Normalne tempo · pomiar FPS niedostępny':'Normalne tempo · '+d.fps+' kl./s rdzenia · '+(d.frameMs??'—')+' ms/kl. · skip '+d.skip;
   if(d.adaptive&&state.playing&&Number.isFinite(d.skip)){try{localStorage.setItem('astation_perf90_'+profile+'_'+state.playing.sha+'_'+settings.core,String(d.skip))}catch{}}
 }
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
for(const [id,key,read] of [['touch90','enabled',e=>e.checked],['touch-size90','size',e=>Number(e.value)/100],['touch-opacity90','opacity',e=>Number(e.value)/100],['touch-position90','position',e=>e.value],['touch-mode90','mode',e=>e.value],['filter90','filter',e=>e.value]])$( '#'+id).addEventListener('change',e=>{settings.mobile[key]=read(e.target);saveSettings();post('mobile',{config:settings.mobile})});
$('#refresh-saves90').addEventListener('click',renderSaveCenter90);
$('#state-import90').addEventListener('change',async e=>{try{
 const file=e.target.files?.[0],key=importTarget90;importTarget90=null;
 if(!file||!key)return;if(file.size>64*1024*1024+2048||file.size<10)throw Error('Nieprawidłowy rozmiar pliku');
 const bytes=new Uint8Array(await file.arrayBuffer()),nl=bytes.indexOf(10);
 if(nl<1||nl>2048)throw Error('Nieprawidłowy nagłówek');
 const meta=JSON.parse(new TextDecoder().decode(bytes.slice(0,nl))),payload=bytes.slice(nl+1);
 if(meta.format!=='ASTATION_STATE_1'||meta.rom!==key.split(':')[1]||meta.core!==key.split(':')[2]||meta.size!==payload.length)throw Error('Stan nie pasuje do ROM-u lub rdzenia');
 if(!confirm('Zaimportować i zastąpić Quick Save?'))return;
 const old=await readSnapshot(key);if(old)await backupSnapshot(key);await writeSnapshot(key,payload);await renderSaveCenter90();toast('Zaimportowano stan');
 }catch(err){toast(err.message,true)}finally{e.target.value=''}});
$('#storage-persist-request').addEventListener('click',async()=>{try{if(!navigator.storage?.persist){toast('Trwały magazyn nie jest obsługiwany.',true);return}const ok=await navigator.storage.persist();toast(ok?'Przeglądarka przyznała trwały magazyn.':'Przeglądarka nie przyznała trwałego magazynu.',!ok)}catch{toast('Nie udało się uzyskać trwałego magazynu.',true)}finally{storageEstimate()}});
$('#pad-deadzone').addEventListener('input',e=>{window.AstationController?.setDeadzone(Number(e.target.value)/100);$('#pad-deadzone-value').textContent=e.target.value+'%'});
$('#copy-diagnostic90').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(diagnostics90());toast('Skopiowano raport.')}catch{toast('Kopiowanie niedostępne. Zaznacz tekst raportu ręcznie.',true)}});
setInterval(showPadTest90,150);
$('#rom-input').addEventListener('change',e=>importROM(e.target.files?.[0]));
$('#import-btn').addEventListener('click',()=>$('#rom-input').click());$('#import-small').addEventListener('click',()=>$('#rom-input').click());
$('#os-back').addEventListener('click',quitOS);
$('#play-os-back').addEventListener('click',quitOS);
$('#play-exit').addEventListener('click',()=>exitToLibrary());
$('#play-menu').addEventListener('click',()=>pauseMenu(true));
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
document.querySelectorAll('[data-pause]').forEach(btn=>btn.addEventListener('click',async()=>{
 const action=btn.dataset.pause;
 if(action==='resume')pauseMenu(false);
 if(action==='save')post('save');
 if(action==='os')await quitOS();
 if(action==='snapshot'){try{const s=await quickSave();toast('Zapisano stan · '+formatBytes(s.size))}catch(e){toast(e.message,true)}}
 if(action==='restore'){if(confirm('Wczytać stan? Niezapisany postęp może zostać utracony.')){try{await quickRestore()}catch(e){toast(e.message,true)}}}
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
