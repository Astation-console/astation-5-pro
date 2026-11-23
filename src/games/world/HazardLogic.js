/** Maths for non-graphic energy obstacles. Pure functions allow deterministic QA. */
export function beamHazard(player, time, center={x:-.65,z:-16}, length=2.2) {
  const dx=player.x-center.x,dz=player.z-center.z,angle=time*1.9;
  const parallel=dx*Math.cos(angle)+dz*Math.sin(angle);
  const perpendicular=Math.abs(-dx*Math.sin(angle)+dz*Math.cos(angle));
  return Math.abs(parallel)<length && perpendicular<.42 && player.y<3.9;
}
export function orbHazard(player, orb) {
  return Math.hypot(player.x-orb.x,player.y-orb.y,player.z-orb.z)<1.22;
}
export function gateHazard(player, time){
  if(Math.abs(player.z+89)>.7||player.y>4.3)return false;
  return [-3,0,3].some((x,i)=>Math.abs(player.x-x)<.55 && Math.sin(time*3+i*2)>-.1);
}
/** A patrol guard only chases if near enough and actually sees the player. */
export function canSpotPlayer(enemy,player,facingX,facingZ,range=6.1){
  const dx=player.x-enemy.x,dz=player.z-enemy.z;
  const distance=Math.hypot(dx,dz);
  if(distance>range)return false;
  if(distance<1.9)return true;
  const f=Math.hypot(facingX,facingZ)||1;
  return (dx*facingX+dz*facingZ)/(distance*f)>.22;
}
