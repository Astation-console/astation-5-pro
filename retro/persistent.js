// ASTATION 8.5 — local-only ROM persistence, never uploads ROM bytes.
// IndexedDB is primary. Cache Storage is used only when IndexedDB cannot keep the ROM.
import { dbAll, dbPut, dbDelete, openRetroDB } from './rom.js';

const CACHE_NAME='astation-retro-local-rom-cache-v1';
const cacheURL=id=>new URL('./__local_rom_cache__/'+encodeURIComponent(id),location.href).href;

async function cacheAll(profile){
  if(!('caches' in globalThis))return [];
  const cache=await caches.open(CACHE_NAME),keys=await cache.keys(),list=[];
  for(const key of keys){
    const response=await cache.match(key);if(!response)continue;
    try{
      const meta=JSON.parse(decodeURIComponent(response.headers.get('X-Astation-Meta')||''));
      if(meta.profile!==profile||!meta.id||!meta.sha)continue;
      const blob=await response.blob();
      if(blob.size!==meta.info?.size||blob.size<0x4000)continue;
      list.push({...meta,blob,cacheBackup:true});
    }catch{continue}
  }
  return list;
}
async function cachePut(record){
  if(!('caches' in globalThis))throw Error('Cache Storage is unavailable');
  const cache=await caches.open(CACHE_NAME);
  const {blob,...meta}=record;
  await cache.put(cacheURL(record.id),new Response(blob,{headers:{
    'Content-Type':'application/octet-stream',
    'X-Astation-Meta':encodeURIComponent(JSON.stringify(meta))
  }}));
  const response=await cache.match(cacheURL(record.id));
  const read=await response?.blob();
  if(read?.size!==blob.size)throw Error('Cache Storage readback failed');
}
export async function loadLocalROMs(profile){
  let primary=[],cached=[],error=null;
  try{primary=await dbAll(profile)}catch(e){error=e}
  try{cached=await cacheAll(profile)}catch(e){if(!error)error=e}
  const games=new Map();
  for(const item of cached)games.set(item.id,item);
  for(const item of primary){
    if(item.blob instanceof Blob&&item.blob.size===item.info?.size)games.set(item.id,{...item,cacheBackup:false});
  }
  return {games:[...games.values()],error};
}
export async function persistLocalROM(record){
  let failure=null;
  try{
    await dbPut(record);
    // Verify the actual bytes are accessible after the transaction commits. A write ack alone is not enough.
    const db=await openRetroDB();
    let saved;
    try{saved=await new Promise((resolve,reject)=>{
      const req=db.transaction('games','readonly').objectStore('games').get(record.id);
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    })}finally{db.close()}
    if(saved?.blob instanceof Blob&&saved.blob.size===record.blob.size&&saved.sha===record.sha&&saved.profile===record.profile){
      return {method:'IndexedDB',confirmed:true};
    }
    throw Error('IndexedDB did not retain the complete file');
  }catch(e){failure=e}
  try{
    await cachePut(record);
    return {method:'Cache Storage',confirmed:true,warning:failure?.message};
  }catch(e){
    throw new Error('Nie udało się zachować pliku gry na tym urządzeniu. IndexedDB: '+(failure?.message||'?')+'; Cache Storage: '+e.message);
  }
}
export async function deleteLocalROM(record){
  await dbDelete(record.id).catch(()=>{});
  if('caches' in globalThis){try{const cache=await caches.open(CACHE_NAME);await cache.delete(cacheURL(record.id))}catch{}}
}
