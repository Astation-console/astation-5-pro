/** Framework independent PIX state selection. Testable without GPU or Three.js. */
export function selectPixLocomotion({grounded=false,verticalSpeed=0,move=0,sprint=false,dashing=false}={}){
  if(dashing)return 'Dash';
  if(!grounded)return verticalSpeed<-.9?'Fall':'Jump';
  return move>.22?(sprint?'Run':'Walk'):'Idle';
}
export function pixLean({move=0,sprint=false,dashing=false,airborne=false,turn=0}={}) {
  return {
    forward: dashing?.26:airborne?-.045:move>.2?(sprint?.135:.06):0,
    bank: Math.max(-.14,Math.min(.14,turn*.14)),
  };
}
