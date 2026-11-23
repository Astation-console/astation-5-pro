// Per-profile, versioned Dreambound checkpoints. Legacy saves keep their original key.
const DB='ASTATION_GAME_ENGINE_6', STORE='game_saves';
export const LEGACY_SAVE_KEY='world:green-valley:v1';
export function profileSaveKey(id='legacy'){
  const safe=/^[a-zA-Z0-9_-]{1,64}$/.test(id)?id:'legacy';
  return safe==='legacy'?LEGACY_SAVE_KEY:`${LEGACY_SAVE_KEY}:profile:${safe}`;
}
export class SaveManager {
  constructor() {
    this.db=null;
    this.profileId=new URLSearchParams(location.search).get('profile')||'legacy';
    this.key=profileSaveKey(this.profileId);
  }
  async init(){
    if(!('indexedDB' in globalThis))return this;
    try{this.db=await new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB,1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    })}catch(error){console.warn('IndexedDB unavailable; local fallback',error)}
    return this;
  }
  async load(){
    if(this.db){try{return await new Promise((resolve,reject)=>{
      const req=this.db.transaction(STORE,'readonly').objectStore(STORE).get(this.key);
      req.onsuccess=()=>resolve(req.result?.data??null);req.onerror=()=>reject(req.error);
    })}catch(error){console.warn('Save read fallback',error)}}
    try{return JSON.parse(localStorage.getItem(this.key)||'null')}catch{return null}
  }
  async save(data){
    const snapshot=structuredClone(data);
    const record={schema:2,savedAt:Date.now(),data:snapshot};
    if(this.db){try{await new Promise((resolve,reject)=>{
      const tx=this.db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put(record,this.key);
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    });return}catch(error){console.warn('Save write fallback',error)}}
    try{localStorage.setItem(this.key,JSON.stringify(snapshot))}catch(error){console.warn('Local save failed',error)}
  }
  async reset(){await this.save({})}
  close(){this.db?.close()}
}
