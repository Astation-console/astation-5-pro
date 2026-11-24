const params=new URLSearchParams(location.search),pl=params.get('lang')==='pl';
const t=(en,polish)=>pl?polish:en,$=id=>document.getElementById(id);
document.documentElement.lang=pl?'pl':'en';
$('edition').textContent='DREAMBOUND · '+t('2D MODE','TRYB 2D');
$('level').textContent=t('Green Valley','Zielona Dolina');$('help').textContent=t('Move with A/D or arrows · Space to double jump · Reach the gate with six crystals','Ruch A/D lub strzałkami · Spacja wykonuje podwójny skok · Zdobądź sześć kryształów i dotrzyj do bramy');
$('jump').textContent=t('Jump','Skok');$('exit').textContent=t('Exit game','Zamknij grę');
const send=(event,extra={})=>parent.postMessage({source:'astation-dream-lite',event,...extra},location.origin);
const canvas=$('scene'),ctx=canvas.getContext('2d');
const backdrop=new Image();backdrop.src='./art/dreambound.webp';
const platforms=[[0,430,480],[550,393,260],[889,350,240],[1200,400,330],[1590,350,215],[1875,315,290],[2220,372,275],[2555,420,480]];
const crystals=[[312,374],[685,338],[999,292],[1416,342],[1730,285],[2038,254]];
const keys=new Set(),touch=new Map(),stats={collected:new Set(),checkpoint:0,deaths:0,complete:false};
let player={x:70,y:396,dy:0,jumps:0,ground:true,dir:1},started=false,paused=false,clock=0,last=0,camera=0,lastButtons=[],messageTime=0,lastUpdate=0;
const worldHeight=540;
function resetPlayer(){const p=platforms[stats.checkpoint];player={x:p[0]+45,y:p[1]-31,dy:0,jumps:0,ground:true,dir:1};camera=Math.max(0,player.x-210)}
function save(){send('save',{save:{collected:[...stats.collected],checkpoint:stats.checkpoint,deaths:stats.deaths,complete:stats.complete}})}
function hud(){$('count').textContent='◆ '+stats.collected.size+' / 6'}
function pause(v){if(stats.complete)return;paused=v;$('overlay').hidden=!v;if(v){$('message').textContent=t('Paused','Pauza');$('detail').textContent=t('Your checkpoint is saved.','Twój punkt kontrolny został zapisany.');$('again').textContent=t('Resume','Wznów');save()}send('pause',{paused:v})}
function jump(){if(started&&!paused&&!stats.complete&&player.jumps<2){player.dy=player.jumps?-342:-405;player.jumps++;player.ground=false}}
function finish(){stats.complete=true;save();$('message').textContent=t('Valley restored!','Dolina ocalona!');$('detail').textContent=t('All six crystals returned to the gate.','Wszystkie sześć kryształów wróciło do bramy.');$('again').textContent=t('Play again','Zagraj ponownie');$('overlay').hidden=false;send('win')}
function again(){if(!stats.complete){pause(false);return}stats.collected.clear();stats.checkpoint=0;stats.deaths=0;stats.complete=false;resetPlayer();hud();save();$('overlay').hidden=true}
$('again').onclick=again;$('exit').onclick=()=>{save();send('exit')};$('jump').onpointerdown=e=>{e.preventDefault();jump()};
for(const b of document.querySelectorAll('[data-move]')){b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);touch.set(e.pointerId,+b.dataset.move)};for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>touch.delete(e.pointerId))}
document.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW','Escape'].includes(e.code)){e.preventDefault();if(!e.repeat){if(['ArrowUp','KeyW','Space'].includes(e.code))jump();if(e.code==='Escape')pause(!paused)}keys.add(e.code)}});
document.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();touch.clear()});
function update(dt,axis){
 let dx=axis+Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));for(const v of touch.values())dx+=v;
 dx=Math.max(-1,Math.min(1,dx));const oldBottom=player.y+30;
 player.x=Math.max(12,Math.min(3010,player.x+dx*247*dt));if(Math.abs(dx)>.05)player.dir=Math.sign(dx);
 player.dy+=900*dt;player.y+=player.dy*dt;player.ground=false;
 if(player.dy>=0){for(const [x,y,w] of platforms){if(player.x+10>=x&&player.x-10<=x+w&&oldBottom<=y+2&&player.y+30>=y){player.y=y-30;player.dy=0;player.ground=true;player.jumps=0;break}}}
 if(player.y>worldHeight+90){stats.deaths++;resetPlayer();save()}
 for(const [i,[x,y]] of crystals.entries()){if(!stats.collected.has(i)&&Math.hypot(player.x-x,player.y+4-y)<31){stats.collected.add(i);hud();save();send('collect');break}}
 if(player.ground){const point=player.x>2248?6:player.x>1240?3:0;if(point>stats.checkpoint){stats.checkpoint=point;messageTime=clock+2;save()}}
 if(player.x>2865&&stats.collected.size===6&&!stats.complete)finish();
 lastUpdate+=dt;if(lastUpdate>=2){send('status',{seconds:lastUpdate});lastUpdate=0}
}
function paint(w,h){
 const s=h/worldHeight,viewWidth=w/s;camera+=(Math.max(0,Math.min(3050-viewWidth,player.x-viewWidth*.34))-camera)*.12;
 ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);
 const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#63c6d8');sky.addColorStop(1,'#bedb80');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 if(backdrop.complete&&backdrop.naturalWidth){ctx.save();ctx.globalAlpha=.85;const r=Math.max(w/backdrop.width,h/backdrop.height)*1.08,bw=backdrop.width*r,bh=backdrop.height*r;ctx.drawImage(backdrop,-(bw-w)*(.25+.5*camera/3050),(h-bh)*.5,bw,bh);ctx.restore()}
 ctx.fillStyle='#a7dba21f';ctx.fillRect(0,0,w,h);ctx.save();ctx.scale(s,s);ctx.translate(-camera,0);
 for(const [x,y,pw] of platforms){
  if(x>camera+viewWidth+5||x+pw<camera-5)continue;
  const dirt=ctx.createLinearGradient(0,y,0,worldHeight+20);dirt.addColorStop(0,'#557648');dirt.addColorStop(.15,'#3e5845');dirt.addColorStop(1,'#243b39');
  ctx.fillStyle=dirt;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+pw,y);ctx.lineTo(x+pw-12,y+62);ctx.lineTo(x+pw-40,worldHeight+20);ctx.lineTo(x+35,worldHeight+20);ctx.lineTo(x+5,y+64);ctx.fill();
  ctx.fillStyle='#74ae56';ctx.fillRect(x,y,pw,8);ctx.fillStyle='#b4d96b';ctx.fillRect(x,y,pw,3);
  for(let k=5;k<pw-5;k+=22){ctx.fillStyle='#3d8147';ctx.fillRect(x+k,y+8,4,4+(k*7)%14)}
 }
 for(const [i,[x,y]] of crystals.entries())if(!stats.collected.has(i)){
  const yy=y+Math.sin(clock*3+i)*4;ctx.save();ctx.translate(x,yy);ctx.shadowBlur=13;ctx.shadowColor='#74fff1';ctx.fillStyle='#b6fff0';ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(9,0);ctx.lineTo(0,14);ctx.lineTo(-9,0);ctx.closePath();ctx.fill();ctx.fillStyle='#45cabe';ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(9,0);ctx.lineTo(0,14);ctx.fill();ctx.restore()
 }
 ctx.strokeStyle=stats.collected.size===6?'#a6fff0':'#74968a';ctx.lineWidth=11;ctx.beginPath();ctx.arc(2900,400,34,Math.PI,Math.PI*2);ctx.moveTo(2866,400);ctx.lineTo(2866,420);ctx.moveTo(2934,400);ctx.lineTo(2934,420);ctx.stroke();
 ctx.save();ctx.translate(player.x,player.y);ctx.scale(player.dir,1);const step=player.ground?Math.sin(clock*12)*2:3;
 ctx.fillStyle='#233731';ctx.fillRect(-10,16,7,11+step);ctx.fillRect(4,16,7,11-step);ctx.fillStyle='#e1ad52';ctx.fillRect(-13,24+step,11,5);ctx.fillRect(3,24-step,12,5);
 ctx.fillStyle='#c99046';ctx.fillRect(-11,0,23,19);ctx.fillStyle='#f9d68a';ctx.fillRect(-8,1,17,7);ctx.fillStyle='#d48f38';ctx.beginPath();ctx.roundRect(-16,-18,32,23,7);ctx.fill();ctx.fillStyle='#233a3b';ctx.beginPath();ctx.roundRect(-9,-13,23,13,5);ctx.fill();ctx.fillStyle='#79ffee';ctx.fillRect(-4,-10,4,5);ctx.fillRect(7,-10,4,5);ctx.restore();
 if(messageTime>clock){ctx.fillStyle='white';ctx.textAlign='center';ctx.font='bold 16px system-ui';ctx.fillText(t('Checkpoint saved','Punkt kontrolny zapisany'),player.x,player.y-33)}
 ctx.restore();
}
function frame(now){
 let pad;try{pad=Array.from(navigator.getGamepads?.()||[]).find(Boolean)}catch{}const buttons=pad?.buttons.map(b=>b.pressed)||[],edge=i=>buttons[i]&&!lastButtons[i];
 if(edge(0)){if(paused||stats.complete)again();else jump()}if(edge(9))pause(!paused);if(edge(1)&&(paused||stats.complete)){save();send('exit')}lastButtons=buttons;
 const axis=(Math.abs(pad?.axes[0]||0)>.18?pad.axes[0]:0)+(buttons[15]?1:0)-(buttons[14]?1:0),dt=Math.min(.04,(now-last)/1000||0);last=now;
 if(started&&!paused&&!stats.complete&&!document.hidden){clock+=dt;update(dt,axis)}
 const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight),ratio=Math.min(2,devicePixelRatio||1);
 if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)}
 paint(w,h);requestAnimationFrame(frame)
}
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==parent||e.data?.source!=='astation-os4')return;
 const d=e.data;if(d.event==='start'){
  const v=d.data||{};stats.collected=new Set((Array.isArray(v.collected)?v.collected:[]).filter(i=>Number.isInteger(i)&&i>=0&&i<6));stats.checkpoint=[0,3,6].includes(v.checkpoint)?v.checkpoint:0;stats.deaths=Number(v.deaths)||0;
  resetPlayer();hud();started=true;if(v.complete===true)finish()
 }
 if(d.event==='pause')pause(true);if(d.event==='resume')pause(false);if(d.event==='exit'){save();send('exit')}
});
hud();requestAnimationFrame(frame);send('ready');
