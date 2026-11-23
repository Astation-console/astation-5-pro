import { LoadingManager } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export class Resources {
  constructor(onProgress = () => {}) {
    this.manager = new LoadingManager();
    this.manager.onProgress = (url, loaded, total) => onProgress(Math.round(loaded / Math.max(total, 1) * 100), url);
    this.gltf = new GLTFLoader(this.manager);
    this.assets = new Set();
  }
  async model(path) {
    const gltf = await this.gltf.loadAsync(path);
    this.assets.add(gltf.scene);
    gltf.scene.traverse(o => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    return gltf;
  }
  dispose(root) {
    const geometries = new Set(), materials = new Set(), textures = new Set();
    root.traverse(o => {
      if (o.geometry) geometries.add(o.geometry);
      for (const material of (Array.isArray(o.material) ? o.material : [o.material])) {
        if (!material) continue;
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
    });
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    for (const t of textures) t.dispose();
  }
}
