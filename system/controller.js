/* ASTATION 9 — standard-mapped Gamepad navigation. Core handles its own inputs. */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const retro=!!$('#player-frame');
let last=[],lastDir='',nextMove=0,connected='',nextPoll=0,deadzone=.35;
const key='astation_pad90_deadzone';
try{const n=Number(localStorage.getItem(key));if(n>=.15&&n<=.8)deadzone=n}catch{}
function visible(el){if(!el||el.disabled||el.closest('[hidden],.hidden,[inert]'))return false;const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.left<innerWidth&&r.top<innerHeight&&s.visibility!=='hidden'&&s.display!=='none'}
function scope(){
 if(retro){
   if(visible($('#controls-overlay')))return $('#controls-overlay');
   if(visible($('#pause-overlay')))return $('#pause-overlay');
   if(visible($('#play-view')))return null;
   return visible($('#settings-view'))?$('#settings-view'):document.body;
 }
 if($('#ast-retro-shell'))return null;
 if(visible($('#control.open')))return $('#control');
 if(visible($('#panel')))return $('#panel');
 if(visible($('#sleep-screen')))return $('#sleep-screen');
 if(visible($('#game-overlay.active'))){
   const pause=$('#pause-overlay');
   return visible(pause)?pause:null;
 }
 return $('.screen.active')||document.body;
}
function candidates(root){return root?[...root.querySelectorAll('button,a[href],input:not([type=file]),select,[role=button],[tabindex]')].filter(x=>x.tabIndex!==-1&&visible(x)):[]}
function direction(p){
 const b=i=>p.buttons[i]?.pressed;
 const x=p.axes[0]||0,y=p.axes[1]||0;
 if(b(12)||y<-deadzone&&Math.abs(y)>=Math.abs(x))return 'up';
 if(b(13)||y>deadzone&&Math.abs(y)>=Math.abs(x))return 'down';
 if(b(14)||x<-deadzone)return 'left';
 if(b(15)||x>deadzone)return 'right';
 return '';
}
function focus(el){if(!el)return;el.focus({preventScroll:true});el.scrollIntoView({block:'nearest',inline:'nearest'});document.documentElement.classList.add('ast-pad-nav')}
function move(root,dir){
 const list=candidates(root);if(!list.length)return;
 const current=document.activeElement;
 if(!list.includes(current)){focus(list[0]);return}
 const r=current.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
 let best=null,score=Infinity;
 for(const el of list){if(el===current)continue;const t=el.getBoundingClientRect(),dx=t.left+t.width/2-x,dy=t.top+t.height/2-y;const primary=dir==='left'?-dx:dir==='right'?dx:dir==='up'?-dy:dy;const secondary=dir==='left'||dir==='right'?Math.abs(dy):Math.abs(dx);if(primary<5)continue;const n=primary+secondary*2.8;if(n<score){score=n;best=el}}
 if(best)focus(best);else if(dir==='up'||dir==='down'){(root.scrollHeight>root.clientHeight?root:document.scrollingElement)?.scrollBy({top:dir==='up'?-100:100})}
}
function click(s){const x=$(s);if(visible(x)){x.click();return true}return false}
function back(){
 if(retro){if(click('#controls-close')||click('#settings-close'))return;if(visible($('#pause-overlay'))){click('[data-pause=resume]');return}click('#os-back');return}
 if(click('#control.open [data-action=control]'))return;
 if(click('#panel:not(.hidden) [data-action=closepanel]'))return;
 if(visible($('#pause-overlay'))&&click('#game-pause'))return;
}
function options(){
 if(retro){if(visible($('#play-view')))click('#play-menu');else click('#settings-open');return}
 if(!click('#control.open [data-action=control]'))click('[data-action=control]');
}
function notify(message){const el=document.createElement('div');el.className='ast-pad-toast';el.setAttribute('role','status');el.textContent=message;document.body.append(el);setTimeout(()=>el.remove(),3000)}
function poll(t){
 if(document.hidden||(!retro&&$('#ast-retro-shell'))||(retro&&visible($('#play-view'))&&!visible($('#pause-overlay'))&&!visible($('#controls-overlay')))){setTimeout(()=>requestAnimationFrame(poll),350);return}
 requestAnimationFrame(poll);
 if(document.hidden||(!retro&&$('#ast-retro-shell'))||t<nextPoll)return;nextPoll=t+35;
 let p;try{p=Array.from(navigator.getGamepads?.()||[]).find(x=>x&&x.connected)}catch{}
 const id=p?.id||'';
 if(id!==connected){if(id)notify(p.mapping==='standard'?'Kontroler połączony':'Kontroler wykryty · niestandardowe mapowanie');else if(connected)notify('Kontroler rozłączony');connected=id;last=[];lastDir='';document.documentElement.classList.toggle('ast-pad-connected',!!id)}
 if(!p||p.mapping!=='standard')return;
 const pressed=p.buttons.map(x=>x.pressed),edge=i=>pressed[i]&&!last[i];
 const root=scope();
 if(root){
   const dir=direction(p);
   if(dir&&(dir!==lastDir||t>=nextMove)){move(root,dir);nextMove=t+(dir===lastDir?120:310)}
   lastDir=dir;
   if(edge(0)){const list=candidates(root);if(list.includes(document.activeElement))document.activeElement.click();else focus(list[0])}
   if(edge(1))back();
   if(edge(4)||edge(5)){if(!retro){click(edge(4)?'#nav-games':'#nav-media')}else move(root,edge(4)?'left':'right')}
   if(edge(6)||edge(7)){(root.scrollHeight>root.clientHeight?root:document.scrollingElement)?.scrollBy({top:edge(6)?-220:220})}
 }
 // Options / Select+Start work without using the OS-reserved PS button.
 if((edge(9)&&pressed[8])||(edge(8)&&pressed[9])||(root&&edge(9)))options();
 last=pressed;
}
document.addEventListener('pointerdown',()=>document.documentElement.classList.remove('ast-pad-nav'),true);
window.AstationController={get deadzone(){return deadzone},setDeadzone(v){deadzone=Math.max(.15,Math.min(.8,Number(v)||.35));try{localStorage.setItem(key,String(deadzone))}catch{}},supported:()=>typeof navigator.getGamepads==='function'};
if(window.AstationController.supported())requestAnimationFrame(poll);
})();
