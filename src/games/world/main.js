import { WorldGame } from './WorldGame.js';
const game=new WorldGame();
window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==window.parent||e.data?.source!=='astation-os4')return;
  game.receive(e.data);
});
window.addEventListener('pagehide',()=>game.destroy(),{once:true});
try{await game.boot();}catch(error){
  console.error('[ASTATION Engine 6] Boot failed:',error);
  game.ui.status('Could not initialize 3D',100);
  game.ui.error(error?.message||'Graphics or physics could not load.',()=>game.classic());
  game.bridge.send('error',{message:String(error?.message||error)});
}
