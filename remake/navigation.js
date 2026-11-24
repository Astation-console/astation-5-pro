export function attachNavigation({enabled,deadzone,back,menu}){
 const scope=()=>document.querySelector('dialog[open]')||document.querySelector('#console');
 function visible(){return [...scope().querySelectorAll('button:not(:disabled),input:not(:disabled),select,a[href]')].filter(el=>!el.closest('[hidden],[inert]')&&el.getClientRects().length)}
 function focus(el){if(!el)return;el.focus({preventScroll:true});el.scrollIntoView({block:'nearest',inline:'nearest'})}
 function move(dir){
  const list=visible(),cur=document.activeElement;
  if(!list.includes(cur)){focus(scope().querySelector('.hero .primary')||list[0]);return}
  if(cur.type==='range'&&['left','right'].includes(dir)){cur.value=Number(cur.value)+(dir==='left'?-5:5);cur.dispatchEvent(new Event('input',{bubbles:true}));return}
  if(cur.tagName==='SELECT'&&['left','right'].includes(dir)){cur.selectedIndex=Math.max(0,Math.min(cur.length-1,cur.selectedIndex+(dir==='left'?-1:1)));cur.dispatchEvent(new Event('change',{bubbles:true}));return}
  const r=cur.getBoundingClientRect(),horizontal=['left','right'].includes(dir);
  const rectCenter=a=>[a.x+a.width/2,a.y+a.height/2];
  const [x,y]=rectCenter(r);let target,score=Infinity;
  for(const el of list){
   if(el===cur)continue;
   const a=el.getBoundingClientRect(),[xx,yy]=rectCenter(a),dx=xx-x,dy=yy-y;
   const distance=({left:-dx,right:dx,up:-dy,down:dy})[dir],cross=Math.abs(horizontal?dy:dx);
   const overlap=horizontal?Math.min(a.bottom,r.bottom)-Math.max(a.top,r.top):Math.min(a.right,r.right)-Math.max(a.left,r.left);
   if(distance<4)continue;
   const s=distance+cross*(overlap>0?.75:3.8);
   if(s<score){score=s;target=el}
  }
  focus(target);
 }
 document.addEventListener('keydown',e=>{
  if(!enabled()||e.altKey||e.ctrlKey||e.metaKey)return;
  if(e.key==='Escape'){e.preventDefault();back();return}
  if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
  const dir={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[e.key];
  if(dir){e.preventDefault();document.body.classList.add('pad-nav');move(dir)}
  if(e.key.toLowerCase()==='c'){e.preventDefault();menu()}
 });
 document.addEventListener('pointerdown',()=>document.body.classList.remove('pad-nav'));
 let old=[],direction='',next=0;
 function frame(now){
  requestAnimationFrame(frame);let pad;try{pad=Array.from(navigator.getGamepads?.()||[]).find(p=>p?.connected)}catch{return}
  if(!pad){old=[];direction='';return}
  const b=pad.buttons.map(btn=>btn.pressed),edge=i=>b[i]&&!old[i];
  if(enabled()&&!document.hidden){
   const [x=0,y=0]=pad.axes,z=Math.max(.08,Math.min(.95,deadzone()));
   const dir=b[12]?'up':b[13]?'down':b[14]?'left':b[15]?'right':Math.max(Math.abs(x),Math.abs(y))<=z?'':Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up');
   if(dir&&(dir!==direction||now>next)){document.body.classList.add('pad-nav');move(dir);next=now+(dir!==direction?320:150)}
   direction=dir;
   if(edge(0)){const el=document.activeElement;if(visible().includes(el))el.click();else focus(scope().querySelector('.hero .primary')||visible()[0])}
   if(edge(1))back();if(edge(9)||edge(16))menu();
  }
  old=b;
 }
 requestAnimationFrame(frame);
}
