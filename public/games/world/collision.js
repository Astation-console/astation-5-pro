// ASTATION WORLD 5.1: deterministic swept collisions for floating islands.
// Coordinates: player.y is the robot's collision datum, 1.05 units above a top surface.
export const FOOT_OFFSET=1.05;
export const PLAYER_RADIUS=.33;
export const EPS=.065;
export function platformSurface(p){return p.group.position.y+FOOT_OFFSET}
export function footprintOverlaps(p,x,z,r=PLAYER_RADIUS){return Math.abs(x-p.group.position.x)<=p.w*.5+r&&Math.abs(z-p.group.position.z)<=p.d*.5+r}
export function solvePlatformCollision({pos,prev,velY,platforms,wasGrounded=false,support=null}){
  let landed=null;
  // Land on the *highest* crossed surface. Swept vertical test prevents tunnelling.
  for(const p of platforms){
    const top=platformSurface(p);
    if(!footprintOverlaps(p,pos.x,pos.z))continue;
    const crossed=velY<=0&&prev.y>=top-EPS&&pos.y<=top+EPS;
    const retained=wasGrounded&&support===p&&velY<=0&&pos.y<=top+.18&&prev.y>=top-.22;
    // Recover from the old collider having allowed a few centimetres of penetration.
    const recover=velY<=0&&prev.y>=top-.28&&pos.y<=top&&pos.y>=top-.45;
    if((crossed||retained||recover)&&(!landed||top>platformSurface(landed)))landed=p;
  }
  if(landed){pos.y=platformSurface(landed);return {pos,velY:0,grounded:true,support:landed,hit:'landed'}}
  // The player can pass through a platform's open air *above* it, but not its side or underside.
  // Resolve the side axis only if the player is below the top and overlaps the solid layer.
  for(const p of platforms){
    const cx=p.group.position.x,cz=p.z,top=platformSurface(p),bottom=p.group.position.y-1.16;
    if(pos.y>=top-.13||pos.y+1.2<=bottom)continue;
    const hw=p.w*.5+PLAYER_RADIUS,hd=p.d*.5+PLAYER_RADIUS;
    const px=pos.x-cx,pz=pos.z-cz;
    if(Math.abs(px)>=hw||Math.abs(pz)>=hd)continue;
    const oldX=prev.x-cx,oldZ=prev.z-cz;
    if(Math.abs(oldX)>=hw){pos.x=cx+Math.sign(oldX||px||1)*hw;continue}
    if(Math.abs(oldZ)>=hd){pos.z=cz+Math.sign(oldZ||pz||1)*hd;continue}
    // Recover after a bad legacy checkpoint without bouncing up through the island.
    const dx=hw-Math.abs(px),dz=hd-Math.abs(pz);
    if(dx<dz)pos.x=cx+Math.sign(px||1)*hw;else pos.z=cz+Math.sign(pz||1)*hd;
  }
  return {pos,velY,grounded:false,support:null,hit:null}
}
export function carryPlatform(pos,p,deltaX){if(!p||!Number.isFinite(deltaX))return;pos.x+=deltaX}
