// Software video path for browsers without WebGL. The default DeSmuME player
// keeps its established storage and state format. This core stores battery saves separately.
import {readSnapshot,writeSnapshot} from '../retro/session-store.js?v=903';
const upstream='https://cdn.jsdelivr.net/gh/js-emulators/desmond@e4a802d6d81ff4b2434454fa5fcabc34d24b328e/dist/';
async function bootCore(){
 const host=document.createElement('iframe');host.hidden=true;host.title='DS runtime';document.body.append(host);
 const engine=host.contentWindow;
 await new Promise((ok,no)=>{
  engine.wasmReady=()=>{};
  engine.Module={locateFile:n=>upstream+n,onRuntimeInitialized:()=>setTimeout(ok,0),onAbort:why=>no(Error(String(why||'DS core unavailable')))};
  const script=engine.document.createElement('script');script.crossOrigin='anonymous';script.src=upstream+'desmond.js';script.onerror=()=>no(Error('Nie udało się pobrać rdzenia DS. Sprawdź połączenie.'));engine.document.head.append(script);
 });
 return engine.Module;
}
export async function mountDS(cfg,post){
 const core=await bootCore(),key='canvas-battery:'+cfg.profile+':'+cfg.sha,root=document.querySelector('#game');
 const src=new Uint8Array(await cfg.romBlob.arrayBuffer()),ptr=core._prepareRomBuffer(src.length);
 if(!ptr)throw Error('Za mało pamięci na uruchomienie gry DS.');
 core.HEAPU8.set(src,ptr);let previous=await readSnapshot(key);
 if(previous?.bytes?.length){const savePointer=core._savGetPointer(previous.bytes.length);core.HEAPU8.set(previous.bytes,savePointer)}
 core._savUpdateChangeFlag();if(core._loadROM(src.length)!==1)throw Error('Rdzeń DS nie otworzył tej gry.');
 core._setSampleRate(32768);
 const style=document.createElement('link');style.rel='stylesheet';style.href='../remake/ds-canvas.css';document.head.append(style);
 root.innerHTML='<div class="ds-screens"><canvas width="256" height="192" aria-label="DS top screen"></canvas><canvas width="256" height="192" aria-label="DS touch screen"></canvas></div><div class="ds-keys"></div>';
 document.querySelector('#waiting').classList.add('hide');
 const group=root.firstElementChild,canvases=[...group.children],ctxs=canvases.map(c=>c.getContext('2d',{alpha:false})),names=['Right','Left','Down','Up','Select','Start','B','A','Y','X','L','R'],padMap=[15,14,13,12,8,9,1,0,2,3,4,5];
 const fallbackKeys=['right arrow','left arrow','down arrow','up arrow','shift','enter','z','x','a','s','q','e'];
 const keyMap=new Map(names.map((k,i)=>[String(cfg.keys?.[k]||fallbackKeys[i]).toLowerCase().replace(/^(left|right|up|down) arrow$/,'arrow$1'),i]));
 const keys=new Set(),touchKeys=new Map(),buttons=root.lastElementChild;
 for(const k of ['Left','Right','Up','Down','Select','Start','L','R','Y','X','B','A']){
  const b=document.createElement('button');b.textContent=({Left:'◀',Right:'▶',Up:'▲',Down:'▼'})[k]||k;b.setAttribute('aria-label',k);
  b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touchKeys.set(e.pointerId,names.indexOf(k));unlock()};
  for(const t of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(t,e=>touchKeys.delete(e.pointerId));buttons.append(b);
 }
 let x=0,y=0,stylus=0,paused=false,volume=cfg.volume,alive=true,audio,scheduled=0,queue=Promise.resolve(),dirty=false,prevDirty=0,frameCount=0,lastTime=0,carry=0;
 let fb=core._getSymbol(4),audioPtr=core._getSymbol(6),buffer,images;
 function unlock(){if(!audio){try{audio=new (window.AudioContext||window.webkitAudioContext)()}catch{}}if(audio?.state==='suspended')audio.resume().catch(()=>{})}
 function playAudio(){
  const n=core._fillAudioBuffer(4096);if(!n||!audio||audio.state!=='running'||volume<=0)return;
  if(scheduled-audio.currentTime>.15)return;
  const wave=new Int16Array(core.HEAPU8.buffer,audioPtr,n*2),audioBuffer=audio.createBuffer(2,n,32768);
  for(let channel=0;channel<2;channel++){const out=audioBuffer.getChannelData(channel);for(let i=0;i<n;i++)out[i]=wave[2*i+channel]*volume/32768}
  const source=audio.createBufferSource();source.buffer=audioBuffer;source.connect(audio.destination);scheduled=Math.max(audio.currentTime+.008,scheduled);source.start(scheduled);scheduled+=audioBuffer.duration;source.onended=()=>source.disconnect();
 }
 function battery(force=false){
  if(!dirty&&!force)return queue;
  const n=core._savGetSize();if(!n||n>16*1048576)return queue;
  const p=core._savGetPointer(0),data=core.HEAPU8.slice(p,p+n);dirty=false;
  queue=queue.catch(()=>{}).then(()=>writeSnapshot(key,data));return queue;
 }
 const pen=(e)=>{const r=canvases[1].getBoundingClientRect();x=Math.max(0,Math.min(255,Math.floor((e.clientX-r.left)*256/r.width)));y=Math.max(0,Math.min(191,Math.floor((e.clientY-r.top)*192/r.height)))};
 canvases[1].onpointerdown=e=>{canvases[1].setPointerCapture(e.pointerId);stylus=1;pen(e);unlock()};
 canvases[1].onpointermove=e=>{if(stylus)pen(e)};for(const t of ['pointerup','pointercancel','lostpointercapture'])canvases[1].addEventListener(t,()=>stylus=0);
 window.addEventListener('keydown',e=>{unlock();const k=keyMap.get(e.key.toLowerCase());if(k!==undefined){e.preventDefault();keys.add(k)}if(e.key==='Escape'&&!e.repeat)post('controller-menu')});
 window.addEventListener('keyup',e=>keys.delete(keyMap.get(e.key.toLowerCase())));
 window.addEventListener('pointerdown',unlock);window.addEventListener('blur',()=>{keys.clear();touchKeys.clear();stylus=0});
 let chord=false;
 function step(now){
  if(!alive)return;requestAnimationFrame(step);const dt=Math.min(50,now-(lastTime||now));lastTime=now;
  if(paused||document.hidden){carry=0;return}carry+=dt;
  let pad;try{pad=Array.from(navigator.getGamepads?.()||[]).find(Boolean)}catch{}
  let mask=0;for(const i of keys)mask|=1<<i;for(const i of touchKeys.values())mask|=1<<i;
  if(pad){padMap.forEach((b,i)=>{if(pad.buttons[b]?.pressed)mask|=1<<i});const [ax,ay]=pad.axes;if(ax>.3)mask|=1;if(ax<-.3)mask|=2;if(ay>.3)mask|=4;if(ay<-.3)mask|=8;
   const both=pad.buttons[8]?.pressed&&pad.buttons[9]?.pressed;if(both&&!chord)post('controller-menu');chord=both;
  }
  let rendered=false;
  while(carry>=1000/60){carry-=1000/60;rendered=carry<1000/60;core._runFrame(rendered?1:0,mask,stylus,x,y);frameCount++;playAudio();
   const flag=core._savUpdateChangeFlag();if(flag||prevDirty)dirty=true;if(!flag&&prevDirty)battery().catch(()=>post('save-error',{message:'Nie udało się zachować zapisu DS.'}));prevDirty=flag;
  }
  if(!rendered)return;
  if(core.HEAPU8.buffer!==buffer){buffer=core.HEAPU8.buffer;images=[0,1].map(i=>new ImageData(new Uint8ClampedArray(buffer,fb+i*256*192*4,256*192*4),256,192))}
  ctxs.forEach((ctx,i)=>ctx.putImageData(images[i],0,0));if(frameCount%120===0)root.dataset.frames=String(frameCount);
 }
 function layout(value){group.dataset.layout=value||'classic'}
 layout(cfg.layout);requestAnimationFrame(step);
 window.addEventListener('pagehide',()=>{alive=false;battery(true).catch(()=>{});audio?.close()?.catch(()=>{})});
 post('core-ready',{requiresTap:false});post('game-started',{build:'canvas-15',renderer:'canvas',canSnapshot:false});
 return async d=>{
  switch(d.event){
   case 'pause':paused=true;audio?.suspend()?.catch(()=>{});break;
   case 'resume':paused=false;lastTime=0;audio?.resume()?.catch(()=>{});break;
   case 'save':try{await battery(true);post('save-ok')}catch(e){post('save-error',{message:e.message})}break;
   case 'layout':layout(d.layout);post('layout-ok',{mode:d.layout});break;
   case 'volume':volume=Math.max(0,Math.min(1,Number(d.value)));break;
   case 'mobile':buttons.style.display=d.config?.enabled?'flex':'';break;
   case 'fullscreen':root.requestFullscreen?.().catch(()=>{});break;
   case 'restart':await battery(true);post('exited');break;
  }
 };
}
