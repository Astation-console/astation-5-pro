import * as S from '../prime/state.js';
import {PrimeAudio} from '../prime/audio.js?v=1430';
import {getMusic,putMusic,removeMusic} from '../prime/local-music.js?v=1430';
import {games,matchROM} from '../prime/catalog.js';
import {unpackLocalFile} from '../retro/rom.js';
import {loadLocalROMs,persistLocalROM} from '../retro/persistent.js';
import {readSnapshot,getStats} from '../retro/session-store.js?v=903';
import * as States from '../prime/save-center.js';
import * as V from './views.js';
import {t,esc,icon,order,game,name,action,round,size} from './ui.js';
import {startSession,inGame} from './session.js';
import {attachNavigation} from './navigation.js';

const root=document.querySelector('#console'),panel=document.querySelector('#panel'),audio=new PrimeAudio();
const c={page:'home',selected:'orbit',filter:'all',query:'',trophyGame:'orbit',roms:[]};
const history=[];
let romRevision=0,modalJob=null,hoverTimer=0,storageReported=false;
const fresh=!S.read(S.KEY,null)&&!S.read('astation_pro_v2',null)&&!S.read('astation_pro_v2_backup',null);
if(fresh){S.profile.lang='en';S.profile.installed=['orbit','world'];S.save()}
if(S.vault.accounts.length>1&&!sessionStorage.getItem('astation15-picked'))c.page='profiles';
const baseLoad=audio.loadTrack.bind(audio);
let marioBuffer;
audio.loadTrack=async id=>{
 if(id!=='retro')return baseLoad(id);
 const local=await getMusic(S.vault.active,id).catch(()=>null);
 if(local?.blob)return {buffer:await audio.ctx.decodeAudioData(await local.blob.arrayBuffer()),title:local.title,kind:'local'};
 if(!marioBuffer)marioBuffer=fetch('./remake/audio/mario-overworld.mp3').then(r=>{if(!r.ok)throw new Error('Audio unavailable');return r.arrayBuffer()}).then(b=>audio.ctx.decodeAudioData(b)).catch(e=>{marioBuffer=null;throw e});
 return {buffer:await marioBuffer,title:'Overworld (Remix) — Qumu',kind:'bundled'};
};
function showTrack(){
 const el=root.querySelector('#now-track');if(!el)return;
 const track=audio.current;el.hidden=!track||track.id!==c.selected||!S.profile.prime.audio.enabled;
 if(!el.hidden)el.innerHTML=icon('music',14)+'<span>'+esc(track.title)+'</span>';
}
audio.onTrack=showTrack;
function apply(){
 const p=S.profile.prime;document.documentElement.lang=S.profile.lang==='pl'?'pl':'en';document.documentElement.dataset.accent=p.remakeAccent||'ion';
 document.body.classList.toggle('tv',!!p.tv);document.body.classList.toggle('no-motion',!p.motion);audio.setProfile(S.vault.active);audio.apply(p.audio);
}
function notify(title,body,sound='confirm',record=true){
 if(record)S.note(title,body);audio.play(sound);
 const el=document.createElement('div');el.className='toast';el.innerHTML=icon(sound==='trophy'?'trophy':sound==='error'?'bell':'check')+'<div><b>'+esc(title)+'</b><small>'+esc(body)+'</small></div>';
 document.querySelector('#toasts').append(el);setTimeout(()=>el.remove(),4200);
}
function write(){
 if(!S.save()&&!storageReported){storageReported=true;notify(t('Storage is full','Brak miejsca'),t('Export a backup in Save center.','Wyeksportuj kopię w centrum zapisów.'),'error',false)}
}
function clocks(){
 const d=document.querySelector('#clock');if(d)d.textContent=new Date().toLocaleTimeString(S.profile.lang==='pl'?'pl-PL':'en-GB',{hour:'2-digit',minute:'2-digit'});
 const o=document.querySelector('#connection');if(o)o.textContent=navigator.onLine?t('System online','System online'):t('Offline mode','Tryb offline');
}
function render(){
 clearTimeout(hoverTimer);
 let body='';
 switch(c.page){
 case 'home':body=V.home(c);break;
 case 'hub':body=V.hub(c);break;
 case 'library':case 'store':body=V.collection(c);break;
 case 'saves':body=V.saves(c);break;
 case 'settings':body=V.settings(c);break;
 case 'trophies':body=V.trophies(c);break;
 case 'notes':body=V.notes();break;
 case 'profiles':body=V.profiles();break;
 }
 root.innerHTML=c.page==='standby'?V.standby():V.frame(c,body);
 document.title='ASTATION 5 Pro'+(c.page==='home'?'':' · '+(c.page==='hub'?name(c.selected):V.navTitle(c.page)||''));
 clocks();audio.setTheme(['home','hub'].includes(c.page)?c.selected:'system');
 showTrack();if(c.page==='settings'){measure();padStatus()}
}
function feature(id){
 if(!game(id)||c.selected===id||c.page!=='home'||panel.open||inGame())return;
 c.selected=id;audio.setTheme(id);
 const h=root.querySelector('.home-hero'),active=document.activeElement,focusId=active?.dataset?.id,focusAct=active?.dataset?.act,wasHero=h.contains(active);
 h.innerHTML=V.hero(c,id);root.querySelectorAll('[data-card]').forEach(el=>el.classList.toggle('chosen',el.dataset.id===id));
 if(wasHero)[...h.querySelectorAll('button')].find(e=>e.dataset.act===focusAct&&(e.dataset.id===focusId||focusAct==='launch'||focusAct==='hub'))?.focus({preventScroll:true});
}
function closeModal(){if(panel.open)panel.close();modalJob=null}
function modal(title,html,submit=null){
 closeModal();modalJob=submit;panel.innerHTML='<div class="dialog-head"><h2>'+esc(title)+'</h2>'+round('close',t('Close','Zamknij'),'close')+'</div>'+html;panel.showModal();
 const first=panel.querySelector('input:not([type=file]),button.primary')||panel.querySelector('button');first?.focus({preventScroll:true});
}
panel.addEventListener('cancel',e=>{e.preventDefault();closeModal()});
panel.addEventListener('click',e=>{if(e.target===panel){const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal()}});
panel.addEventListener('submit',e=>{e.preventDefault();const run=modalJob,form=e.target;if(form.reportValidity()&&run)run(new FormData(form))});
function go(page,remember=true){
 if(!['home','hub','library','store','settings','profiles','trophies','notes','saves','standby'].includes(page))return;
 closeModal();
 if(remember&&page!==c.page)history.push({page:c.page,id:c.selected,filter:c.filter,query:c.query});
 c.page=page;c.filter='all';c.query='';audio.play('panel');render();window.scrollTo(0,0);
 if(document.body.classList.contains('pad-nav'))(root.querySelector('.hero .primary,#view button,.standby button')||root.querySelector('button'))?.focus({preventScroll:true});
}
function back(){
 if(panel.open){closeModal();return}
 if(c.page==='standby'){choose(S.vault.active);return}
 if(c.page==='home'){control();return}
 const last=history.pop()||{page:'home',id:'orbit',filter:'all',query:''};closeModal();Object.assign(c,{page:last.page,selected:last.id,filter:last.filter,query:last.query});render();window.scrollTo(0,0);audio.play('back');
 if(document.body.classList.contains('pad-nav'))root.querySelector('.primary,#view button')?.focus({preventScroll:true});
}
function control(){
 if(panel.open){closeModal();return}
 modal(t('Control center','Centrum sterowania'),'<div class="panel-grid">'+[['trophies','trophy'],['saves','save'],['profiles','user'],['settings','settings'],['notes','bell']].map(([id,i])=>action('nav',V.navTitle(id),i,'subtle',id)).join('')+action('standby',t('Standby','Uśpij'),'power','subtle')+'</div>');
}
function choose(id){
 if(!S.switchProfile(id))return;
 sessionStorage.setItem('astation15-picked','1');c.roms=[];c.selected='orbit';history.length=0;apply();audio.setGame(false);go('home',false);loadRoms();
}
async function loadRoms(){
 const version=++romRevision,id=S.vault.active;
 const {games:roms}=await loadLocalROMs(id);
 const core=S.read('astation_retro_settings_v8_'+id,{}).core||(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)||(matchMedia('(pointer:coarse)').matches&&innerWidth<800)?'desmume2015':'desmume');
 const records=await Promise.all(roms.map(async r=>{
  const snapshot=await readSnapshot(id+':'+r.sha+':'+core).catch(()=>null);
  return {...r,gameId:games.find(g=>g.direct&&matchROM(g,r))?.id,core,snapshot:snapshot?{date:snapshot.date,size:snapshot.size}:null,backup:await States.hasBackup(id,r.sha,core).catch(()=>false),stats:getStats(id,r.sha)};
 }));
 if(version!==romRevision||id!==S.vault.active)return;
 const had=c.roms.length;c.roms=records;
 if(!inGame()&&!panel.open&&['home','hub','library','saves'].includes(c.page)&&(had||records.length)&&document.activeElement?.id!=='search')render();
}
async function importGame(id,file){
 const profile=S.vault.active;
 const info=panel.querySelector('#import-status');if(info)info.textContent=t('Checking cartridge…','Sprawdzam kartę gry…');
 const record=await unpackLocalFile(file);
 if(!matchROM(game(id),record))throw Error(t('This file belongs to a different DS game.','Ten plik należy do innej gry DS.'));
 if(info)info.textContent=t('Saving and verifying game data…','Zapisuję i sprawdzam dane gry…');
 const key=profile+':'+record.sha;
 await persistLocalROM({...record,id:key,profile,imported:Date.now(),lastPlayed:0});
 if(profile!==S.vault.active)return;
 S.markInstalled(id);await loadRoms();notify(t('Game installed','Zainstalowano grę'),name(id),'install');
 if(panel.open&&panel.querySelector('#import-status')&&c.selected===id)beginSession(id);
}
async function launch(id){
 if(inGame())return;
 if(game(id)?.direct){
  const profile=S.vault.active;if(!c.roms.some(r=>r.gameId===id))await loadRoms();
  if(S.vault.active!==profile||inGame())return;
  if(!c.roms.some(r=>r.gameId===id)&&S.read('astation_retro_settings_v8_'+profile,{}).persist!==false){
   c.selected=id;
   modal(name(id),'<p>'+t('Choose your NDS or ZIP file once. ASTATION keeps the game on this device for this profile.','Wybierz swój plik NDS lub ZIP. ASTATION zapamięta grę na tym urządzeniu dla tego profilu.')+'</p><p id="import-status" role="status"></p><div class="button-list">'+action('pick-rom',t('Choose game file','Wybierz plik gry'),'disk','primary',id)+action('retro-center',t('Retro center','Centrum retro'),'pad','subtle')+'</div>');return;
  }
 }
 beginSession(id);
}
function beginSession(id){
 if(inGame())return;closeModal();clearTimeout(hoverTimer);
 const g=game(id);
 if(g){if(!S.profile.installed.includes(id))S.markInstalled(id);S.recordLaunch(id);c.selected=id}
 audio.setGame(true);
 startSession(id,{resume:id==='world'?!!S.profile.worldSave:c.roms.some(r=>r.gameId===id&&r.snapshot),notify,onExit(){audio.setGame(false);render();loadRoms();root.querySelector('.hero .primary,#view button')?.focus({preventScroll:true})}});
}
function download(data,filename){
 const b=data instanceof Blob?data:new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(b),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);
}
function readFile(accept,callback){
 const id=S.vault.active,input=document.createElement('input');input.type='file';input.accept=accept;
 input.addEventListener('change',async()=>{const f=input.files?.[0];if(!f||S.vault.active!==id)return;try{await callback(f)}catch(e){notify(t('File error','Błąd pliku'),e.message,'error')}} ,{once:true});input.click();
}
async function artwork(id,file){
 if(!file.type.startsWith('image/')||file.size>20*1048576)throw Error(t('Choose an image up to 20 MiB.','Wybierz obraz do 20 MiB.'));
 const src=URL.createObjectURL(file),img=new Image(),profile=S.vault.active;
 try{
  img.src=src;await img.decode();const canvas=document.createElement('canvas'),factor=Math.min(1,700/img.width,600/img.height);canvas.width=Math.max(1,Math.round(img.width*factor));canvas.height=Math.max(1,Math.round(img.height*factor));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
  const cover=canvas.toDataURL('image/jpeg',.78);if(cover.length>=500000)throw Error(t('Image too large.','Obraz za duży.'));
  if(profile!==S.vault.active)return;
  const old=S.profile.prime.covers;S.profile.prime.covers={...old,[id]:cover};
  if(!S.save()){S.profile.prime.covers=old;throw Error(t('Not enough storage.','Za mało pamięci.'))}
  render();notify(t('Cover updated','Zmieniono okładkę'),name(id));
 }finally{URL.revokeObjectURL(src)}
}
function track(id){
 const profile=S.vault.active;modal(t('Theme music','Muzyka gry'),'<p>'+esc(name(id))+'</p><p id="track-name"></p><div class="button-list">'+action('upload-track',t('Choose audio','Wybierz audio'),'music','primary',id)+action('reset-track',t('Use default','Przywróć domyślny'),'sound','subtle',id)+'</div>');
 getMusic(profile,id).catch(()=>null).then(r=>{const el=panel.querySelector('#track-name');if(el&&profile===S.vault.active)el.textContent=r?.title||({retro:'Overworld (Remix) — Qumu',retro_cod:'Midnight Signal',world:'Islands of Light',orbit:'Beyond the Rings'})[id]});
}
async function setTrack(id,file){
 const profile=S.vault.active;if(!file.size||file.size>24*1048576)throw Error(t('Maximum file size is 24 MiB.','Maksymalny rozmiar to 24 MiB.'));
 await audio.unlock();const buffer=await audio.ctx.decodeAudioData(await file.arrayBuffer());if(buffer.duration<.25||buffer.duration>360)throw Error(t('Choose a track up to 6 minutes.','Wybierz utwór do 6 minut.'));
 await putMusic(profile,id,file,file.name.replace(/\.[^.]+$/,''));if(S.vault.active===profile){audio.reloadTheme(id);track(id)}
}
function confirmChange(title,detail,run){
 modal(title,'<p>'+esc(detail)+'</p><form><div class="button-list"><button class="primary" type="submit">'+t('Confirm','Potwierdź')+'</button>'+action('close',t('Cancel','Anuluj'),'','subtle')+'</div></form>',()=>{closeModal();Promise.resolve().then(run).catch(e=>notify(t('Error','Błąd'),e.message,'error'))});
}
function nameForm(create){
 const title=create?t('New profile','Nowy profil'):t('Rename profile','Zmień nazwę profilu');
 modal(title,'<form><label>'+t('Profile name','Nazwa profilu')+'<input name="name" maxlength="22" required value="'+(create?'':esc(S.profile.name))+'"></label><button class="primary" type="submit">'+t('Save','Zapisz')+'</button></form>',data=>{
  const n=String(data.get('name')||'').trim();if(!n)return;
  if(create){const lang=S.profile.lang,id=S.createProfile(n);S.profile.lang=lang;S.profile.installed=['orbit','world'];write();choose(id)}
  else{S.profile.name=n;write();closeModal();render()}
 });
}
async function importProfile(file){
 if(file.size>10*1048576)throw Error(t('File is too large.','Plik jest za duży.'));const data=JSON.parse(await file.text());
 if(data.format!=='ASTATION_PRIME_PROFILE_1'||!data.state||typeof data.state.name!=='string'||!Array.isArray(data.state.installed))throw Error(t('Unsupported backup.','Nieobsługiwana kopia.'));
 confirmChange(t('Restore profile backup?','Przywrócić kopię profilu?'),t('This replaces the active profile’s settings and progress. A backup of the current profile will be downloaded first.','Zastąpisz ustawienia i postęp aktywnego profilu. Najpierw pobierzesz kopię obecnego profilu.'),()=>{
  download({format:'ASTATION_PRIME_PROFILE_1',state:S.profile},'astation-before-restore.json');Object.assign(S.profile,S.normalize(data.state));write();apply();render();loadRoms();
 });
}
async function saveAction(act,i){
 const r=c.roms[Number(i)];if(!r)return;const args=[S.vault.active,r.sha,r.core];
 if(act==='state-export'){download(await States.exportState(...args),r.filename+'.astate');return}
 if(act==='state-import'){readFile('.astate,.bin',async file=>{await States.importState(file,...args);await loadRoms();notify(t('State imported','Stan zaimportowany'),r.filename)});return}
 if(act==='state-restore'){confirmChange(t('Restore save state?','Przywrócić stan gry?'),r.filename,async()=>{await States.restoreBackup(...args);await loadRoms();notify(t('State restored','Stan przywrócony'),r.filename)});return}
 await States.backupState(...args);await loadRoms();notify(t('Backup saved','Zapisano kopię'),r.filename);
}
async function measure(){
 const el=root.querySelector('#storage');if(!el)return;
 try{const s=await navigator.storage.estimate();el.textContent=t('Local storage','Pamięć lokalna')+' · '+size(s.usage)+' / '+size(s.quota)}catch{el.textContent=t('Storage estimate unavailable.','Brak oszacowania pamięci.')}
}
function padStatus(){
 const el=root.querySelector('#pad-info');if(!el)return;let p;try{p=[...navigator.getGamepads()].find(Boolean)}catch{}
 el.textContent=p?p.id:t('Press a button on a connected controller to test it.','Naciśnij przycisk na podłączonym padzie, aby go przetestować.');
 root.querySelector('#pad-test').textContent=p?'LX '+(p.axes[0]||0).toFixed(2)+' · LY '+(p.axes[1]||0).toFixed(2)+' · '+p.buttons.flatMap((b,i)=>b.pressed?['B'+i]:[]).join(' '):'';
}
function diagnostics(){
 const values={'ASTATION OS':'15.0',WebAssembly:typeof WebAssembly==='object',IndexedDB:!!window.indexedDB,Gamepad:!!navigator.getGamepads,'Service worker':!!navigator.serviceWorker?.controller,Online:navigator.onLine,Viewport:innerWidth+' × '+innerHeight};
 modal(t('Diagnostics','Diagnostyka'),Object.entries(values).map(([k,v])=>'<div class="setting-row"><b>'+esc(k)+'</b><span>'+esc(v===true?'✓':v===false?'—':v)+'</span></div>').join('')+action('report',t('Download report','Pobierz raport'),'download','subtle'));
 panel.querySelector('[data-act=report]').onclick=()=>download(values,'astation-diagnostics.json');
}
async function dispatch(act,id){
 switch(act){
 case 'nav':go(id);break;
 case 'back':back();break;
 case 'feature':feature(id);break;
 case 'cycle':feature(order[(order.indexOf(c.selected)+Number(id)+order.length)%order.length]);break;
 case 'hub':if(game(id)){const previous=c.selected;c.selected=id;go('hub');if(history.length)history.at(-1).id=previous}break;
 case 'launch':await launch(id);break;
 case 'pick-rom':readFile('.nds,.zip',async f=>{try{await importGame(id,f)}catch(e){const el=panel.querySelector('#import-status');if(el)el.textContent=e.message;throw e}});break;
 case 'retro-center':beginSession('retro-center');break;
 case 'filter':c.filter=id;render();break;
 case 'favorite':{const f=S.profile.prime.favorites;S.profile.prime.favorites=f.includes(id)?f.filter(x=>x!==id):[...f,id];write();render();break}
 case 'install':S.markInstalled(id);render();notify(t('Added to library','Dodano do biblioteki'),name(id),'install');break;
 case 'uninstall':confirmChange(t('Remove from library?','Usunąć z biblioteki?'),t('Your files and save data will stay on this device.','Pliki i zapisy gry pozostaną na tym urządzeniu.'),()=>{S.profile.installed=S.profile.installed.filter(x=>x!==id);write();render()});break;
 case 'track':track(id);break;
 case 'upload-track':readFile('audio/*',f=>setTrack(id,f));break;
 case 'reset-track':await removeMusic(S.vault.active,id);audio.reloadTheme(id);track(id);break;
 case 'cover':readFile('image/*',f=>artwork(id,f));break;
 case 'trophy-filter':c.trophyGame=id;render();break;
 case 'choose':choose(id);break;
 case 'rename':case 'new-profile':nameForm(act==='new-profile');break;
 case 'control':control();break;
 case 'close':closeModal();break;
 case 'export-profile':download({format:'ASTATION_PRIME_PROFILE_1',state:S.profile},'astation-profile.json');break;
 case 'import-profile':readFile('.json,application/json',importProfile);break;
 case 'state-export':case 'state-backup':case 'state-restore':case 'state-import':await saveAction(act,id);break;
 case 'diagnostics':diagnostics();break;
 case 'fullscreen':if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else notify(t('Full screen','Pełny ekran'),t('On iPhone, add ASTATION to your Home Screen from Safari.','Na iPhonie dodaj ASTATION do ekranu początkowego z Safari.'),'confirm',false);break;
 case 'toggle':if(id==='audio')S.profile.prime.audio.enabled=!S.profile.prime.audio.enabled;else if(['tv','motion'].includes(id))S.profile.prime[id]=!S.profile.prime[id];write();apply();render();break;
 case 'standby':go('standby');audio.setGame(true);break;
 case 'wake':audio.setGame(false);go('profiles');break;
 }
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');if(!b||inGame())return;
 if(!audio.ctx)audio.unlock().catch(()=>{});if(b.dataset.act!=='launch')audio.play('confirm');
 dispatch(b.dataset.act,b.dataset.id).catch(err=>notify(t('Console error','Błąd konsoli'),err.message,'error'));
});
function previewCard(e){
 const card=e.target.closest('[data-card]');if(!card||inGame()||panel.open)return;clearTimeout(hoverTimer);
 if(c.page==='home'){if(e.type==='focusin')feature(card.dataset.card);else hoverTimer=setTimeout(()=>feature(card.dataset.card),160)}
 else if(['store','library'].includes(c.page))audio.setTheme(card.dataset.card);
}
root.addEventListener('pointerover',e=>{if(e.pointerType==='mouse')previewCard(e)});
root.addEventListener('pointerout',e=>{if(e.target.closest('[data-card]')&&!e.target.closest('[data-card]').contains(e.relatedTarget))clearTimeout(hoverTimer)});
root.addEventListener('focusin',previewCard);
document.addEventListener('input',e=>{
 const input=e.target;if(input.id==='search'){c.query=input.value;root.querySelector('#results').innerHTML=V.results(c);return}
 const key=input.dataset.setting;if(!key||input.type!=='range')return;
 if(key==='deadzone')S.profile.prime.deadzone=Math.min(.95,Math.max(.08,+input.value/100));else S.profile.prime.audio[key]=+input.value;
 input.nextElementSibling.value=input.value+'%';write();audio.apply(S.profile.prime.audio);
});
document.addEventListener('change',e=>{
 const key=e.target.dataset.setting;if(!['accent','language'].includes(key))return;
 if(key==='accent')S.profile.prime.remakeAccent=e.target.value;else S.profile.lang=e.target.value;write();apply();render();
});
window.addEventListener('online',clocks);window.addEventListener('offline',clocks);
document.addEventListener('visibilitychange',()=>audio.sync());
attachNavigation({enabled:()=>!inGame(),deadzone:()=>S.profile.prime.deadzone,back,menu:control});
audio.setProfile(S.vault.active);apply();render();loadRoms().catch(()=>{});setInterval(clocks,10000);setInterval(()=>{if(c.page==='settings'&&!inGame())padStatus()},220);
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
