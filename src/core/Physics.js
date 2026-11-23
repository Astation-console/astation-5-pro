import RAPIER from '@dimforge/rapier3d-compat';
export const PHYSICS_STEP = 1 / 90;
export class Physics {
  static async create() { await RAPIER.init(); return new Physics(); }
  constructor() {
    this.r = RAPIER;
    this.world = new RAPIER.World({ x: 0, y: -21, z: 0 });
    this.world.timestep = PHYSICS_STEP;
    this.controller = this.world.createCharacterController(.035);
    this.controller.enableAutostep(.3, .16, true);
    this.controller.enableSnapToGround(.26);
    this.controller.setMaxSlopeClimbAngle(Math.PI * .28);
    this.controller.setMinSlopeSlideAngle(Math.PI * .35);
    this.platforms = [];
    this.playerBody = this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 3, 4));
    this.playerCollider = this.world.createCollider(RAPIER.ColliderDesc.capsule(.55, .29).setFriction(0), this.playerBody);
    this.grounded = false;
  }
  staticCollider({ x, y, z, w, h, d }) {
    return this.world.createCollider(this.r.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setTranslation(x, y, z).setFriction(.85));
  }
  movingPlatform({ x, y, z, w, h, d, range = 2, speed = 1.1 }) {
    const body = this.world.createRigidBody(this.r.RigidBodyDesc.kinematicPositionBased().setTranslation(x, y, z));
    this.world.createCollider(this.r.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setFriction(1), body);
    const p = { body, x, y, z, w, h, d, range, speed, previousX: x, deltaX: 0 };
    this.platforms.push(p); return p;
  }
  animatePlatforms(time) {
    for (const p of this.platforms) {
      const nx = p.x + Math.sin(time * p.speed) * p.range;
      p.deltaX = nx - p.previousX; p.previousX = nx;
      p.body.setNextKinematicTranslation({ x: nx, y: p.y, z: p.z });
    }
  }
  setPlayer({ x, y, z }) {
    this.playerBody.setTranslation({ x, y, z }, true); this.playerBody.setNextKinematicTranslation({ x, y, z });
    this.grounded = false;
  }
  /** Player center must be ~1m above platform surface; no variable-frame tunnelling. */
  move(dx, dy, dz) {
    const p = this.playerBody.translation();
    if (this.grounded) {
      for (const moving of this.platforms) {
        const foot = p.y - .84;
        const top = moving.y + moving.h / 2;
        if (Math.abs(foot - top) < .36 && Math.abs(p.z - moving.z) < moving.d/2 && Math.abs(p.x - moving.previousX) < moving.w/2) {
          dx += moving.deltaX; break;
        }
      }
    }
    this.controller.computeColliderMovement(this.playerCollider, { x: dx, y: dy, z: dz });
    const m = this.controller.computedMovement();
    this.grounded = this.controller.computedGrounded();
    this.playerBody.setNextKinematicTranslation({ x: p.x + m.x, y: p.y + m.y, z: p.z + m.z });
    this.world.step();
    return { ...this.playerBody.translation(), grounded: this.grounded, movement: m };
  }
  dispose() { this.world.free(); }
}
