// ASTATION 9: measured emulation throughput, never fast-forward.
(function(root){
'use strict';
function chooseSkip(skip,fps,good,bad){
 if(bad>=3&&fps<54)return Math.min(2,skip+1);
 if(good>=5&&fps>=59)return Math.max(0,skip-1);
 return skip;
}
function create({getCore,report,initial=0,adaptive=true,active=()=>true}){
 let skip=Math.max(0,Math.min(adaptive?2:9,Number(initial)||0)),timer=0,prev=null,good=0,bad=0,changed=0;
 function normalSpeed(){
   const em=getCore(),gm=em?.gameManager;
   if(typeof em?.handleSpecialOptions==='function')em.handleSpecialOptions('fastForward','disabled');
   else if(typeof gm?.toggleFastForward==='function'){gm.toggleFastForward(0);em.isFastForward=false}
 }
 function reset(){prev=null;good=bad=0}
 function sample(){
   const gm=getCore()?.gameManager;
   if(!active()||document.hidden){reset();return}
   let frame;try{frame=gm?.getFrameNum?.()}catch{}
   if(!Number.isFinite(frame)){report({fps:null,frameMs:null,skip,adaptive:false});return}
   const now=performance.now();
   if(!prev){prev={frame,now};return}
   const delta=frame-prev.frame,elapsed=now-prev.now;prev={frame,now};
   if(delta<0||elapsed<500||elapsed>4000){good=bad=0;return}
   const fps=delta*1000/elapsed;
   if(fps<54){bad++;good=0}else if(fps>=59&&fps<=65){good++;bad=0}else{good=bad=0}
   if(adaptive&&now-changed>15000&&typeof gm?.setVariable==='function'){
     const next=chooseSkip(skip,fps,good,bad);
     if(next!==skip){try{gm.setVariable('desmume_frameskip',String(next));skip=next;changed=now;good=bad=0}catch{}}
   }
   report({fps:Math.round(fps*10)/10,frameMs:fps>0?Math.round(10000/fps)/10:null,skip,adaptive:adaptive&&typeof gm?.setVariable==='function'});
 }
 return {start(){clearInterval(timer);try{normalSpeed()}catch{}reset();changed=performance.now();timer=setInterval(sample,2000)},stop(){clearInterval(timer);timer=0;reset()},reset,normalSpeed};
}
root.AstationSmartPerformance={chooseSkip,create};
})(globalThis);
