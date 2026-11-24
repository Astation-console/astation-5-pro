// ASTATION 9.0.2: latch the actual EmulatorJS FAST function, without a held button.
// This changes emulation speed, not the renderer's physical refresh limit.
(function(root){
'use strict';
function chooseSkip(){return 0}
function create({getCore,report,initial=0,adaptive=true,autoBoost=true,active=()=>true}){
 const skip=adaptive?0:Math.max(0,Math.min(3,Number(initial)||0));
 let timer=0,prev=null,reported=false,applied=null;
 function applySpeed(force=false){
  const em=getCore(),gm=em?.gameManager;
  if(!em||!gm)return false;
  if(!force&&applied===em&&em.isFastForward!==!autoBoost)return true;
  try{
    if(autoBoost&&applied!==em)gm.setFastForwardRatio?.(3);
    if(typeof em.handleSpecialOptions==='function')em.handleSpecialOptions('fastForward',autoBoost?'enabled':'disabled');
    else if(typeof gm.toggleFastForward==='function'){gm.toggleFastForward(autoBoost?1:0);em.isFastForward=autoBoost}
    else if(autoBoost&&typeof gm.simulateInput==='function'){em.isFastForward=false;gm.simulateInput(0,27,1)}
    else return false;
    applied=em;return true;
  }catch{return false}
 }
 function normalSpeed(){autoBoost=false;applySpeed(true)}
 function reset(){prev=null}
 function applyVisualOptions(){
  if(!adaptive)return;
  const gm=getCore()?.gameManager;
  try{gm?.setVariable?.('desmume_frameskip','0')}catch{}
  try{gm?.setVariable?.('desmume_internal_resolution','256x192')}catch{}
 }
 function sample(){
  if(!active()||document.hidden){reset();return}
  const boostApplied=autoBoost?applySpeed():false;
  let frame;try{frame=getCore()?.gameManager?.getFrameNum?.()}catch{}
  if(!Number.isFinite(frame)){if(!reported){reported=true;report({fps:null,frameMs:null,skip,boostApplied,adaptive:false})}return}
  const now=performance.now();
  if(!prev){prev={frame,now};return}
  const delta=frame-prev.frame,elapsed=now-prev.now;prev={frame,now};
  if(delta<0||elapsed<500||elapsed>10000)return;
  const fps=delta*1000/elapsed;
  report({fps:Math.round(fps*10)/10,frameMs:fps>0?Math.round(10000/fps)/10:null,skip,boostApplied,adaptive:false});
 }
 return {start(){clearInterval(timer);applyVisualOptions();applySpeed(true);reset();timer=setInterval(sample,2500)},stop(){clearInterval(timer);timer=0;reset()},reset,normalSpeed,applySpeed,setBoost(enabled){autoBoost=!!enabled;applySpeed(true);reset()}};
}
root.AstationSmartPerformance={chooseSkip,create};
})(globalThis);
