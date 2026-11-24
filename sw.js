/* ASTATION 9.0 offline shell. Never cache or remove the user's ROM/save databases. */
const CACHE='astation-shell-90-prime142';
const urls=['./index.html','./prime/app.js?v=1420','./prime/music142.css?v=1420','./prime/theme-music.js?v=1420','./prime/styles.css?v=1400','./prime/console12.css?v=1400','./prime/reference13.css?v=1400','./prime/live14.css?v=1400','./prime/art/mario-landscape.svg','./prime/art/city-dusk.svg','./prime/art/dream-landscape.svg','./prime/art/orbit-landscape.svg','./prime/art/aurora.svg','./prime/art/city-lights.svg?v=1400','./prime/art/wave.svg','./prime/art/platform-cover.svg','./prime/art/action-cover.svg','./prime/art/dream-cover.svg','./prime/art/orbit-cover.svg','./prime/state.js?v=1400','./prime/views.js?v=1420','./prime/catalog.js?v=1400','./prime/audio.js?v=1420','./prime/controller.js','./prime/save-center.js','./prime/art/mario.svg','./prime/art/cod.svg','./prime/art/world.svg','./manifest.webmanifest','./system/icon.svg','./system/controller.js?v=903','./system/controller.css?v=903','./system/evolution.js?v=903','./system/evolution.css?v=903','./retro/bridge.js?v=903','./retro/index.html','./retro/app.js?v=1410','./retro/prime.css?v=1100','./retro/player.html?v=1410','./retro/smart-performance.js?v=1410','./retro/session-store.js?v=903','./retro/rom.js','./retro/persistent.js','./retro/mobile.js?v=903','./system/remake.css?v=1000','./retro/remake.css?v=1000','./games/orbit/index.html?v=1302','./games/orbit/orbit.js?v=1302','./games/orbit/cover.svg'];
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
