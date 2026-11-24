/* ASTATION 9.0 offline shell. Never cache or remove the user's ROM/save databases. */
const CACHE='astation-shell-90-r3';
const urls=['./index.html','./manifest.webmanifest','./system/icon.svg','./system/controller.js?v=902','./system/controller.css?v=902','./system/evolution.js?v=902','./system/evolution.css?v=902','./retro/bridge.js?v=902','./retro/index.html','./retro/app.js?v=902','./retro/retro.css?v=902','./retro/player.html?v=902','./retro/smart-performance.js?v=902','./retro/session-store.js?v=902','./retro/rom.js','./retro/persistent.js','./retro/mobile.js?v=902'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(urls))));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys()){if(k.startsWith('astation-shell-90-')&&k!==CACHE)await caches.delete(k)}await self.clients.claim()})()));
self.addEventListener('message',e=>{if(e.data?.type==='ASTATION_OFFLINE_STATUS')e.waitUntil((async()=>{const c=await caches.open(CACHE);const checks=await Promise.all(urls.map(u=>c.match(u)));e.ports[0]?.postMessage({ready:checks.every(Boolean),shell:true,emulatorOffline:false})})())});
self.addEventListener('fetch',e=>{
 const req=e.request,u=new URL(req.url);
 if(req.method!=='GET'||u.origin!==self.location.origin||!u.pathname.startsWith(new URL(self.registration.scope).pathname)||u.pathname.includes('__local_rom_cache__'))return;
 const canonical=urls.find(path=>new URL(path,self.registration.scope).pathname===u.pathname);
 if(!canonical)return;
 e.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(req);if(response.ok)await cache.put(canonical,response.clone());return response}catch(err){return await cache.match(canonical)||Response.error()}})());
});
