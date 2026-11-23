import { Vector3, Raycaster } from 'three';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export class CameraRig {
  constructor(camera) {
    this.camera = camera; this.yaw = 0; this.pitch = .26;
    this.distance = 7; this.mode = 'third-person';
    this.look = new Vector3(); this.target = new Vector3();
    this.position = new Vector3(); this.temp = new Vector3(); this.direction = new Vector3();
    this.ray = new Raycaster();
  }
  orbit(dx, dy) { this.yaw = clamp(this.yaw - dx * .003, -1.3, 1.3); this.pitch = clamp(this.pitch + dy * .003, -.16, .86); }
  setMode(mode) { if (['third-person', 'first-person', 'cinematic', 'vehicle'].includes(mode)) this.mode = mode; }
  update(foot, dt, obstacles, sprint = false) {
    this.look.set(foot.x, foot.y + 1.42, foot.z - .4);
    const distance = this.mode === 'first-person' ? .12 : this.mode === 'cinematic' ? 12 : sprint ? 8.1 : this.distance;
    this.position.set(
      this.look.x + Math.sin(this.yaw) * distance,
      this.look.y + Math.max(.3, Math.sin(this.pitch)) * distance * .68 + 1.05,
      this.look.z + Math.cos(this.yaw) * distance
    );
    // Keep the camera on the near side of obstructing world meshes.
    this.direction.copy(this.position).sub(this.look);
    const length = this.direction.length(); this.direction.normalize();
    this.ray.set(this.look, this.direction); this.ray.far = Math.max(.1, length - .2);
    const hits = this.ray.intersectObjects(obstacles, true);
    if (hits.length) this.position.copy(this.look).addScaledVector(this.direction, Math.max(.45, hits[0].distance - .4));
    const factor = 1 - Math.exp(-7 * Math.min(dt, .06));
    this.camera.position.lerp(this.position, factor);
    this.camera.lookAt(this.look);
  }
}
