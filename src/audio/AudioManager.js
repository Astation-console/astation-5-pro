export class AudioManager {
  constructor() { this.context = null; this.enabled = true; this.volume = .15; this.nodes = new Set(); }
  ensure() {
    if (!this.enabled) return null;
    try {
      this.context ??= new (window.AudioContext || window.webkitAudioContext)();
      if (this.context.state === 'suspended') this.context.resume();
      return this.context;
    } catch { return null; }
  }
  play(kind, point = null, listener = null) {
    const context = this.ensure(); if (!context) return;
    const variants = { jump: [440,760,.18], land:[200,150,.08], gem:[830,1300,.2], dash:[330,680,.16], interact:[480,1100,.23], hit:[250,170,.17], checkpoint:[500,950,.3], win:[540,1130,.48] };
    const [from,to,length] = variants[kind] ?? [440,550,.12];
    const o=context.createOscillator(),g=context.createGain();
    o.type = kind === 'hit' ? 'triangle' : 'sine';
    o.frequency.setValueAtTime(from,context.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(80,to),context.currentTime+length);
    g.gain.setValueAtTime(.0001,context.currentTime);
    g.gain.exponentialRampToValueAtTime(this.volume,context.currentTime+.025);
    g.gain.exponentialRampToValueAtTime(.0001,context.currentTime+length);
    o.connect(g);
    if (point && listener && context.createPanner) {
      const p = context.createPanner();p.panningModel='HRTF';p.distanceModel='inverse';
      p.positionX.value=point.x-listener.x;p.positionY.value=point.y-listener.y;p.positionZ.value=point.z-listener.z;
      g.connect(p).connect(context.destination);
    } else g.connect(context.destination);
    o.start();o.stop(context.currentTime+length+.02);
  }
  dispose(){this.context?.close();this.context=null;}
}
