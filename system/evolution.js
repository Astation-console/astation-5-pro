(()=>{'use strict';
const $=s=>document.querySelector(s);
const root=document.documentElement;
const settingsKey='astation_system90';
let config={tv:false,theme:'blue'};try{Object.assign(config,JSON.parse(localStorage.getItem(settingsKey)||'{}'))}catch{}
function apply(){root.classList.toggle('ast-tv',!!config.tv);root.dataset.astTheme=config.theme;try{localStorage.setItem(settingsKey,JSON.stringify(config))}catch{}}
apply();
const nav=$('#console .navigation');if(!nav)return;
const button=document.createElement('button');button.id='ast90-open';button.className='iconbtn';button.textContent='9.0';button.title='System Evolution';button.setAttribute('aria-label','System Evolution');nav.insertBefore(button,nav.querySelector('.nav-spacer'));
const dialog=document.createElement('section');dialog.id='ast90-dialog';dialog.hidden=true;dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','ASTATION System Evolution');
dialog.innerHTML='<div class="ast90-sheet"><button id="ast90-close" style="float:right">Zamknij</button><h2>ASTATION SYSTEM 9.0</h2><p>Ustawienia lokalne · System Evolution</p><div class="ast90-grid"><div><h3>TV Mode</h3><p>Większy interfejs i bezpieczne marginesy.</p><button id="ast90-tv">Tryb TV</button> <button id="ast90-full">Pełny ekran</button></div><div><h3>Motyw</h3><select id="ast90-theme"><option value="blue">Original Blue</option><option value="midnight">Midnight Black</option><option value="purple">Neon Purple</option><option value="red">Crimson Red</option><option value="arctic">Arctic</option><option value="retro">Retro Classic</option></select></div><div><h3>Instalacja PWA</h3><p>iPhone: Safari → Udostępnij → Do ekranu początkowego. Android/PC: menu przeglądarki → Zainstaluj, jeśli dostępne.</p></div><div><h3>Offline</h3><p id="ast90-offline">Sprawdzanie...</p><button id="ast90-check">Sprawdź</button></div><div><h3>Pamięć urządzenia</h3><p id="ast90-storage">Sprawdzanie...</p><button id="ast90-persist">Poproś o trwały magazyn</button></div><div><h3>Aktualizacja</h3><p id="ast90-update">9.0 · Development</p><button id="ast90-update-check">Sprawdź aktualizację</button></div></div><h3>Diagnostyka</h3><pre id="ast90-report"></pre><button id="ast90-copy">Kopiuj raport</button><p id="ast90-message" role="status"></p></div>';
document.body.append(dialog);
const msg=s=>$('#ast90-message').textContent=s;
let reg;
async function offline(){
 const el=$('#ast90-offline');if(!navigator.serviceWorker?.controller){el.textContent='Download Required · Service Worker jeszcze nie kontroluje strony.';return}
 try{const ch=new MessageChannel();const result=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('timeout')),2000);ch.port1.onmessage=e=>{clearTimeout(timer);ch.port1.close();resolve(e.data)};navigator.serviceWorker.controller.postMessage({type:'ASTATION_OFFLINE_STATUS'},[ch.port2])});el.textContent=(result.ready?'Ready for Offline · interfejs systemu':'Download Required · interfejs')+'; Offline Unavailable · emulatory niezweryfikowane.'}catch{el.textContent='Offline Unavailable · nie udało się sprawdzić zasobów.'}
}
function report(){let gl=false;try{const c=document.createElement('canvas'),g=c.getContext('webgl2')||c.getContext('webgl');gl=!!g;g?.getExtension('WEBGL_lose_context')?.loseContext()}catch{}return ['ASTATION 9.0','WebAssembly: '+(typeof WebAssembly==='object'),'WebGL: '+gl,'Gamepad API: '+(typeof navigator.getGamepads==='function'),'IndexedDB API: '+('indexedDB'in window),'Service Worker: '+!!navigator.serviceWorker?.controller,'Viewport: '+innerWidth+'×'+innerHeight,'Online: '+navigator.onLine].join('\n')}
async function storage(){try{const e=await navigator.storage?.estimate?.();$('#ast90-storage').textContent=e?Math.round((e.usage||0)/1048576)+' MiB / '+Math.round((e.quota||0)/1048576)+' MiB limitu witryny':'Pomiar niedostępny'}catch{$('#ast90-storage').textContent='Pomiar niedostępny'}}
function open(){dialog.hidden=false;$('#ast90-theme').value=config.theme;$('#ast90-tv').textContent=config.tv?'Wyłącz TV Mode':'Włącz TV Mode';$('#ast90-report').textContent=report();offline();storage();$('#ast90-close').focus()}
function close(){dialog.hidden=true;button.focus()}
button.addEventListener('click',open);$('#ast90-close').addEventListener('click',close);
$('#ast90-tv').addEventListener('click',()=>{config.tv=!config.tv;apply();$('#ast90-tv').textContent=config.tv?'Wyłącz TV Mode':'Włącz TV Mode'});
$('#ast90-theme').addEventListener('change',e=>{config.theme=e.target.value;apply()});
$('#ast90-full').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(root.requestFullscreen)await root.requestFullscreen();else throw Error('unsupported')}catch{msg('Pełny ekran niedostępny w tej przeglądarce.')}});
$('#ast90-check').addEventListener('click',offline);
$('#ast90-persist').addEventListener('click',async()=>{try{msg(await navigator.storage?.persist?.()?'Trwały magazyn przyznany.':'Nie przyznano trwałego magazynu.')}catch{msg('Trwały magazyn niedostępny.')}});
$('#ast90-copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(report());msg('Raport skopiowany.')}catch{msg('Kopiowanie niedostępne.')}});
$('#ast90-update-check').addEventListener('click',async()=>{try{if(!reg)throw Error('unsupported');await reg.update();$('#ast90-update').textContent=reg.waiting?'Aktualizacja gotowa · zamknij wszystkie karty ASTATION po zapisaniu gry.':'Sprawdzono dostępność aktualizacji.'}catch{msg('Nie udało się sprawdzić aktualizacji.')}});
document.addEventListener('keydown',e=>{if(!dialog.hidden&&e.key==='Escape'){e.stopImmediatePropagation();close()}},true);
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').then(r=>{reg=r;r.addEventListener('updatefound',()=>{$('#ast90-update').textContent='Znaleziono nową wersję. Nie zamykamy gry automatycznie.'});offline()}).catch(()=>{});
})();
