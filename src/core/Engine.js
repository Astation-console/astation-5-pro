import * as THREE from 'three';
import { EventBus } from './EventBus.js';
import { Resources } from './Resources.js';
/** Owns the renderer, a fixed timestep and the GPU lifetime. */
export class Engine {
  constructor(container, { quality = 'balanced', onProgress } = {}) {
    this.container = container; this.quality = quality;
    this.events = new EventBus(); this.resources = new Resources(onProgress);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(66, 1, .08, 230);
    this.renderer = new THREE.WebGLRenderer({ antialias: quality === 'quality', powerPreference: 'high-performance', alpha: false, preserveDrawingBuffer: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.16;
    this.renderer.shadowMap.enabled = quality !== 'performance';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    this.clock = 0; this.accumulator = 0; this.running = false; this.paused = true; this.disposed = false;
    this.step = 1 / 90; this.maxSteps = 5;
    this.raf = null; this.onTick = () => {}; this.onFrame = () => {};
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container); this.resize();
  }
  resize() {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth), height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
    const ratio = this.quality === 'performance' ? .75 : this.quality === 'quality' ? Math.min(devicePixelRatio, 1.5) : Math.min(devicePixelRatio, 1.15);
    this.renderer.setPixelRatio(ratio); this.renderer.setSize(width, height, false);
  }
  setQuality(quality) { this.quality = quality; this.renderer.shadowMap.enabled = quality !== 'performance'; this.resize(); }
  start() {
    if (this.running) return;
    this.running = true; this.paused = false; this.clock = performance.now();
    const frame = now => {
      if (!this.running || this.disposed) return;
      this.raf = requestAnimationFrame(frame);
      const dt = Math.min(.06, (now - this.clock) / 1000); this.clock = now;
      if (!this.paused) {
        this.accumulator = Math.min(.12, this.accumulator + dt);
        let count = 0;
        while (this.accumulator >= this.step && count++ < this.maxSteps) { this.onTick(this.step); this.accumulator -= this.step; }
        this.onFrame(dt);
      }
      this.renderer.render(this.scene, this.camera);
    };
    this.raf = requestAnimationFrame(frame);
  }
  pause(flag = true) { this.paused = flag; this.clock = performance.now(); this.accumulator = 0; }
  photo(type = 'image/png') { return this.renderer.domElement.toDataURL(type, .9); }
  destroy() {
    if (this.disposed) return;
    this.running = false; this.disposed = true;
    cancelAnimationFrame(this.raf); this.resizeObserver.disconnect();
    this.resources.dispose(this.scene);
    this.events.clear();
    this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove();
  }
}
