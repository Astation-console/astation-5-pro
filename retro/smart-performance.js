// 9.0.3: latch the same game-manager input used by EmulatorJS virtual FAST (index 27).
(function(root){
'use strict';
function chooseSkip(){return 0}
function create({getCore,report,initial=0,adaptive=true,autoBoost=true,active=()=>true}){
 const skip=adaptive?0:Math.max(0,Math.min(3,Number(initial)||0));
 let timer=0,guard=0,prev=null,reported=false,patched=null,original=null,applied=false;
 function bindInput(gm){
  if(patched===gm)return;
  if(patched&&original)patched.simulateInput=original;
  patched=gm;original=typeof gm.simulateInput==='function'?gm.simulateInput:null;
  if(original){gm.simulateInput=function(player,index,value,...rest){
    if(autoBoost&&Number(index)===27){const em=getCore();if(em)em.isFastForward=false;return original.call(this,player,index,1,...rest)}
    return original.call(this,player,index,value,...rest);
  }}
 }
 function applySpeed(){
  const em=getCore(),gm=em?.gameManager;if(!em||!gm)return false;
  try{
    bindInput(gm);
    if(autoBoost){
      // With isFastForward=false, simulateInput(0,27,1) is identical to holding FAST.
      em.isFastForward=false;
      if(original){original.call(gm,0,27,1)}
      else if(typeof gm.toggleFastForward==='function'){gm.toggleFastForward(1)}
      else if(typeof em.handleSpecialOptions==='function'){em.handleSpecialOptions('fastForward','enabled')}
      else return false;
    }else{
      em.isFastForward=false;
      if(original)original.call(gm,0,27,0);
      else if(typeof gm.toggleFastForward==='function')gm.toggleFastForward(0);
      else em.handleSpecialOptions?.('fastForward','disabled');
    }
    applied=true;return true;
  }catch{applied=false;return false}
 }
 function normalSpeed(){autoBoost=false;applySpeed()}
 function reset(){prev=null}
 function applyVisualOptions(){if(!adaptive)return;const gm=getCore()?.gameManager;try{gm?.setVariable?.('desmume_frameskip','0')}catch{}try{gm?.setVariable?.('desmume_internal_resolution','256x192')}catch{}}
 function sample(){
  if(!active()||document.hidden){reset();return}
  let frame;try{frame=getCore()?.gameManager?.getFrameNum?.()}catch{}
  if(!Number.isFinite(frame)){if(!reported){reported=true;report({fps:null,frameMs:null,skip,boostApplied:autoBoost&&applied,adaptive:false})}return}
  const now=performance.now();if(!prev){prev={frame,now};return}
  const delta=frame-prev.frame,elapsed=now-prev.now;prev={frame,now};if(delta<0||elapsed<500||elapsed>10000)return;
  const fps=delta*1000/elapsed;report({fps:Math.round(fps*10)/10,frameMs:fps>0?Math.round(10000/fps)/10:null,skip,boostApplied:autoBoost&&applied,adaptive:false});
 }
 return {start(){clearInterval(timer);clearInterval(guard);applyVisualOptions();applySpeed();reset();timer=setInterval(sample,2500);guard=setInterval(()=>{if(autoBoost&&active()&&!document.hidden)applySpeed()},750)},stop(){clearInterval(timer);clearInterval(guard);timer=guard=0;if(patched&&original)patched.simulateInput=original;patched=original=null;reset()},reset,normalSpeed,applySpeed,setBoost(enabled){autoBoost=!!enabled;applySpeed();reset()}};
}
root.AstationSmartPerformance={chooseSkip,create};
})(globalThis);
