/** Camera-relative movement. Positive input.z goes backwards, negative forward. */
export function cameraRelativeMovement(x, z, yaw) {
  const co = Math.cos(yaw), si = Math.sin(yaw);
  return { x: x * co + z * si, z: -x * si + z * co };
}
/** Buffered jumps allow input just before landing; coyote time allows jumping briefly after an edge. */
export class JumpAssist {
  constructor({ coyote = .12, buffer = .14 } = {}) {
    this.coyoteDuration = coyote;
    this.bufferDuration = buffer;
    this.coyoteLeft = 0;
    this.bufferLeft = 0;
  }
  update(dt, grounded, requested) {
    this.coyoteLeft = grounded ? this.coyoteDuration : Math.max(0, this.coyoteLeft - dt);
    this.bufferLeft = requested ? this.bufferDuration : Math.max(0, this.bufferLeft - dt);
  }
  canGroundJump() { return this.coyoteLeft > 0 && this.bufferLeft > 0; }
  canAirJump(jumpCount) { return this.bufferLeft > 0 && jumpCount === 1 && this.coyoteLeft <= 0; }
  consume() { this.bufferLeft = 0; this.coyoteLeft = 0; }
  reset() { this.coyoteLeft = 0; this.bufferLeft = 0; }
}
