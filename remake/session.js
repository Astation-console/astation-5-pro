import * as S from '../prime/state.js';
import {game,name,t,esc,icon,trophyTitles} from './ui.js';
const layer=document.querySelector('#session');
let running=null;
export const inGame=()=>!!running;
function send(event,extra={}){
 const s=running;if(!s)return;
 const source=s.id==='world'?'astation-os4':s.id==='orbit'?'astation-orbit-host':'astation-console15';
 s.frame.contentWindow?.postMessage({source,event,...extra},location.origin);
}
function finish(){
 const s=running;if(!s)return;
 running=null;clearTimeout(s.timer);layer.replaceChildren();layer.hidden=true;document.querySelector('#console').inert=false;document.body.classList.remove('playing');s.onExit();
}
export function pauseSession(){
 if(!running)return;
 const s=running;
 if(s.id==='orbit'||s.id==='world'){s.paused=!s.paused;send(s.paused?'pause':'resume');const btn=layer.querySelector('[data-game="pause"]');if(btn)btn.textContent=s.paused?t('Resume','Wznów'):t('Pause','Pauza')}
 else send('pause-menu');
}
export function exitSession(){
 const s=running;if(!s)return;
 if(!s.ready&&s.id==='world'){finish();return}
 send('exit');
 if(s.id==='world'&&s.ready){clearTimeout(s.timer);s.timer=setTimeout(()=>{if(running===s&&confirm(t('The game has not confirmed a save. Close anyway?','Gra nie potwierdziła zapisu. Zamknąć mimo to?')))finish()},4500)}
}
export function startSession(id,{resume=false,onExit,notify}){
 if(running)return;
 const g=game(id),frame=document.createElement('iframe'),profile=S.vault.active,params=new URLSearchParams({profile,lang:S.profile.lang});
 frame.allow='autoplay; fullscreen; gamepad';frame.allowFullscreen=true;frame.title=name(id);
 if(id==='world'){
  const gl=document.createElement('canvas').getContext('webgl2');
  frame.src=(gl?'./preview-6/games/world/index.html?':'./remake/dreambound-lite.html?')+params;
  gl?.getExtension('WEBGL_lose_context')?.loseContext();
 }
 else if(id==='orbit'){params.set('autostart','1');frame.src='./games/orbit/index.html?'+params}
 else{
  const key='astation_retro_settings_v8_'+profile,settings=S.read(key,{});
  try{localStorage.setItem(key,JSON.stringify({...settings,volume:S.profile.prime.audio.game}))}catch{}
  params.set('shell','15');if(g?.direct)params.set('game',g.direct);
  if(resume)params.set('resume','1');
  frame.src='./retro/index.html?'+params;
 }
 const title=g?.title||t('Retro center','Centrum retro');
 const bar=document.createElement('div');bar.className='session-bar';bar.innerHTML='<b>'+icon('pad')+esc(title)+'</b><div><button data-game="pause">'+t('Pause','Pauza')+'</button><button data-game="exit">'+icon('close',15)+t('Exit game','Zamknij grę')+'</button></div>';
 bar.addEventListener('click',e=>{const cmd=e.target.closest('button')?.dataset.game;if(cmd==='pause')pauseSession();if(cmd==='exit')exitSession()});
 running={id,frame,profile,resume,notify,onExit,seconds:0,ready:false,paused:false,tick:performance.now(),timer:0};
 layer.replaceChildren(bar,frame);document.querySelector('#console').inert=true;document.body.classList.add('playing');layer.hidden=false;frame.addEventListener('load',()=>frame.focus(),{once:true});
}
function award(id,index){
 if(!S.earn(id,index))return;
 running.notify(t('Trophy unlocked','Zdobyto trofeum'),trophyTitles(id)[index],'trophy');
 if(index!==4&&[0,1,2,3,5,6,7,8,9].every(i=>S.profile.trophies[id].includes(i)))award(id,4);
}
window.addEventListener('message',e=>{
 const s=running;if(!s||e.origin!==location.origin||e.source!==s.frame.contentWindow||s.profile!==S.vault.active)return;
 const d=e.data||{};
 if(s.id==='orbit'&&d.source==='astation-orbit10'){
  if(d.event==='ready')s.ready=true;
  if(d.event==='run-start'){s.seconds=0;award('orbit',0)}
  if(d.event==='stats'){
   const stat=S.stat('orbit'),seconds=Math.min(86400,Math.max(0,+d.seconds||0)),score=Math.max(0,+d.score||0),cores=Math.max(0,+d.collected||0);
   stat.played=(stat.played||0)+Math.max(0,seconds-s.seconds);s.seconds=seconds;
   stat.best=Math.max(stat.best||0,score);stat.progress=Math.min(100,Math.round(stat.best/20));
   for(const [idx,ok] of [[1,cores>=10],[2,score>=2000],[3,seconds>=60],[5,score>=250],[6,score>=500],[7,score>=1000],[8,cores>=5],[9,seconds>=120]])if(ok)award('orbit',idx);
   S.save();
  }
  if(d.event==='exit')finish();
 }else if(s.id==='world'&&d.source==='astation-dream-lite'){
  if(d.event==='ready'){s.ready=true;send('start',{data:S.profile.prime.worldLite||{}})}
  if(d.event==='save'){S.profile.prime.worldLite=d.save;S.save()}
  if(d.event==='status'){const stat=S.stat('world');stat.played=(stat.played||0)+Math.min(4,Math.max(0,+d.seconds||0));S.save()}
  if(d.event==='pause')s.paused=!!d.paused;
  if(d.event==='collect')award('world',0);
  if(d.event==='win')award('world',1);
  if(d.event==='exit')finish();
 }else if(s.id==='world'&&d.source==='astation-world-v4'){
  const stat=S.stat('world');
  switch(d.event){
   case 'ready':
    s.ready=true;if(S.profile.worldSave)send('restore',{data:S.profile.worldSave});
    send('settings',{lang:S.profile.lang});send('quality',{mode:'balanced'});send('start',{newGame:!s.resume});break;
   case 'started':s.tick=performance.now();s.started=true;break;
   case 'save':S.profile.worldSave=d.save;S.save();break;
   case 'status':{
    const now=performance.now();if(s.started&&!s.paused&&!document.hidden)stat.played=(stat.played||0)+Math.min(10,(now-s.tick)/1000);s.tick=now;
    stat.level=d.stage||1;stat.best=Math.max(stat.best||0,d.cores||0);stat.progress=Math.max(stat.progress||0,d.progress||0);
    const p=S.profile.worldSave||{};
    for(const [idx,ok] of [[5,Object.keys(p.collected||{}).length>=15],[6,Object.keys(p.switches||{}).length>=8],[7,stat.level>=5],[8,(p.failures||0)>=3]])if(ok)award('world',idx);
    S.save();break}
   case 'collect':award('world',0);break;
   case 'worldComplete':award('world',1);break;
   case 'win':award('world',2);break;
   case 'secret':award('world',3);break;
   case 'bossDefeated':S.profile.worldBossWon=true;award('world',9);break;
   case 'exit':finish();break;
   case 'error':s.notify('Dreambound',String(d.message||t('Game engine error','Błąd silnika gry')),'error');break;
  }
 }else if(!['orbit','world'].includes(s.id)&&d.source==='astation-retro8'&&d.event==='exit')finish();
});
