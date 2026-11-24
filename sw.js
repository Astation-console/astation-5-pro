/* ASTATION 9.0 offline shell. Never cache or remove the user's ROM/save databases. */
const CACHE='astation-shell-90-prime11';
const urls=['./index.html','./prime/app.js?v=1100','./prime/styles.css?v=1100','./prime/state.js','./prime/views.js','./prime/catalog.js','./prime/audio.js','./prime/controller.js','./prime/art/mario.svg','./prime/art/cod.svg','./prime/art/world.svg','./manifest.webmanifest','./system/icon.svg','./system/controller.js?v=903','./system/controller.css?v=903','./system/evolution.js?v=903','./system/evolution.css?v=903','./retro/bridge.js?v=903','./retro/index.html','./retro/app.js?v=903','./retro/retro.css?v=903','./retro/player.html?v=903','./retro/smart-performance.js?v=903','./retro/session-store.js?v=903','./retro/rom.js','./retro/persistent.js','./retro/mobile.js?v=903','./system/remake.css?v=1000','./retro/remake.css?v=1000','./games/orbit/index.html','./games/orbit/orbit.js','./games/orbit/cover.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(urls))));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys()){if(k.startsWith('astation-shell-90-')&&k!==CACHE)await caches.delete(k)}await self.clients.claim()})()));
self.addEventListener('message',e=>{if(e.data?.type==='ASTATION_OFFLINE_STATUS')e.waitUntil((async()=>{const c=await caches.open(CACHE);const checks=await Promise.all(urls.map(u=>c.match(u)));e.ports[0]?.postMessage({ready:checks.every(Boolean),shell:true,emulatorOffline:false})})())});
self.addEventListener('fetch',e=>{
 const req=e.request,u=new URL(req.url);
 if(req.method!=='GET'||u.origin!==self.location.origin||!u.pathname.startsWith(new URL(self.registration.scope).pathname)||u.pathname.includes('__local_rom_cache__'))return;
 const canonical=urls.find(path=>new URL(path,self.registration.scope).pathname===u.pathname);
 if(!canonical)return;
 // Never substitute an old cached script for a newly requested release URL.
 const expected=new URL(canonical,self.registration.scope).searchParams.get('v');const requested=u.searchParams.get('v');if(expected&&requested&&expected!==requested)return;
 e.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(req,{cache:'no-store'});if(response.ok)await cache.put(canonical,response.clone());return response}catch(err){return await cache.match(canonical)||Response.error()}})());
});
