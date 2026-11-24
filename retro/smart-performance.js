// P0 normal-speed policy. Never patch or latch controller inputs. FAST belongs to the user.
(function(root){
'use strict';
function chooseSkip(){return 0}
function create({getCore,report,initial=0,adaptive=true,active=()=>true}){
 const skip=adaptive?0:Math.max(0,Math.min(3,Number(initial)||0));
 let timer=0,prev=null,reported=false,normalApplied=false;
 function reset(){prev=null}
 function normalSpeed(){
  const em=getCore(),gm=em?.gameManager;if(!em||!gm)return false;
  try{
   if(typeof gm.toggleFastForward==='function')gm.toggleFastForward(0);
   else if(typeof gm.functions?.toggleFastForward==='function')gm.functions.toggleFastForward(0);
   else if(typeof em.handleSpecialOptions==='function')em.handleSpecialOptions('fastForward','disabled');
   else if(typeof gm.simulateInput==='function'){em.isFastForward=false;gm.simulateInput(0,27,0)}
   else return false;
   em.isFastForward=false;normalApplied=true;reset();return true;
  }catch{normalApplied=false;return false}
 }
 function applyVisualOptions(){if(!adaptive)return;const gm=getCore()?.gameManager;try{gm?.setVariable?.('desmume_frameskip','0')}catch{}try{gm?.setVariable?.('desmume_internal_resolution','256x192')}catch{}}
 function sample(){
  if(!active()||document.hidden){reset();return}
  let frame;try{frame=getCore()?.gameManager?.getFrameNum?.()}catch{}
  if(!Number.isFinite(frame)){if(!reported){reported=true;report({fps:null,frameMs:null,skip,normalApplied,metric:'core-frame-counter',adaptive:false})}return}
  const now=performance.now();if(!prev){prev={frame,now};return}
  const delta=frame-prev.frame,elapsed=now-prev.now;prev={frame,now};if(delta<0||elapsed<500||elapsed>10000)return;
  const fps=delta*1000/elapsed;report({fps:Math.round(fps*10)/10,frameMs:fps>0?Math.round(10000/fps)/10:null,skip,normalApplied,metric:'core-frame-counter',adaptive:false});
 }
 return {start(){clearInterval(timer);applyVisualOptions();normalSpeed();reset();timer=setInterval(sample,2500)},stop(){clearInterval(timer);timer=0;reset()},reset,normalSpeed};
}
root.AstationSmartPerformance={chooseSkip,create};
})(globalThis);
