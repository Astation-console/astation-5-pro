const CACHE='astation-shell-remake-15-5';
const urls=[
 "./classic.html",
 "./games/orbit/cover.svg",
 "./games/orbit/index.html",
 "./games/orbit/orbit.js",
 "./index.html",
 "./manifest.webmanifest",
 "./preview-6/assets/dreambound-C_CF2j-M.js",
 "./preview-6/games/world/index.html",
 "./preview-6/models/dream_arch_mk2.glb",
 "./preview-6/models/dream_tree_mk2.glb",
 "./preview-6/models/guardian_mk2.glb",
 "./preview-6/models/pix.glb",
 "./preview-6/models/pix_cinematic_6_4.glb",
 "./preview-6/models/pix_mk2.glb",
 "./prime/app.js",
 "./prime/art/action-cover.svg",
 "./prime/art/aurora.svg",
 "./prime/art/city-dusk.svg",
 "./prime/art/city-lights.svg",
 "./prime/art/cod.svg",
 "./prime/art/dream-cover.svg",
 "./prime/art/dream-landscape.svg",
 "./prime/art/mario-landscape.svg",
 "./prime/art/mario.svg",
 "./prime/art/orbit-cover.svg",
 "./prime/art/orbit-landscape.svg",
 "./prime/art/platform-cover.svg",
 "./prime/art/wave.svg",
 "./prime/art/world.svg",
 "./prime/audio.js",
 "./prime/catalog.js",
 "./prime/console12.css",
 "./prime/controller.js",
 "./prime/live14.css",
 "./prime/local-music.js",
 "./prime/music142.css",
 "./prime/reference13.css",
 "./prime/save-center.js",
 "./prime/state.js",
 "./prime/styles.css",
 "./prime/theme-music.js",
 "./prime/views.js",
 "./remake/art/black-ops-boxarts.webp",
 "./remake/art/dreambound.webp",
 "./remake/art/mario-boxarts.webp",
 "./remake/art/mario-titles.webp",
 "./remake/art/orbit.webp",
 "./remake/art/retro.webp",
 "./remake/audio/mario-overworld.mp3",
 "./remake/console.css",
 "./remake/console.js",
 "./remake/dreambound-lite.html",
 "./remake/dreambound-lite.js",
 "./remake/ds-canvas.js",
 "./remake/ds-canvas.css",
 "./remake/fonts/display-800.woff2",
 "./remake/fonts/interface-500.woff2",
 "./remake/fonts/interface-600.woff2",
 "./remake/fonts/interface-700.woff2",
 "./remake/fonts/mono-500.woff2",
 "./remake/icon.svg",
 "./remake/icon-192.png",
 "./remake/icon-512.png",
 "./remake/navigation.js",
 "./remake/retro.css",
 "./remake/session.js",
 "./remake/ui.js",
 "./remake/views.js",
 "./retro/app.js",
 "./retro/bridge.js",
 "./retro/index.html",
 "./retro/mobile.js",
 "./retro/persistent.js",
 "./retro/player.html",
 "./retro/prime.css",
 "./retro/remake.css",
 "./retro/retro.css",
 "./retro/rom.js",
 "./retro/session-store.js",
 "./retro/smart-performance.js",
 "./system/controller.css",
 "./system/controller.js",
 "./system/evolution.css",
 "./system/evolution.js",
 "./system/icon.svg",
 "./system/remake.css"
];
const scope=new URL(self.registration.scope);
const assets=new Map(urls.map(path=>[new URL(path,scope).pathname,path]));
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await cache.addAll(urls.map(path=>new Request(new URL(path,scope),{cache:'reload'})));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys()){
  if((key.startsWith('astation-shell-90-')||key.startsWith('astation-shell-remake-'))&&key!==CACHE)await caches.delete(key);
 }
 await self.clients.claim();
})()));
self.addEventListener('message',e=>{
 if(e.data?.type==='ASTATION_OFFLINE_STATUS')e.waitUntil(caches.open(CACHE).then(async c=>e.ports[0]?.postMessage({ready:!!(await c.match('./remake/console.js')),shell:true,emulatorOffline:false})));
});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==scope.origin||url.pathname.includes('__local_rom_cache__')||req.headers.has('Range'))return;
 const path=url.pathname===scope.pathname?'./index.html':assets.get(url.pathname);
 if(!path)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(req.mode==='navigate'){
   try{const response=await fetch(req,{cache:'no-cache'});if(response.ok)return response}catch{}
  }
  return await cache.match(path)||fetch(req);
 })());
});
