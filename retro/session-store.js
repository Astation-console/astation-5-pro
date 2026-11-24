// Separate local store: never modifies original ROM or emulator save databases.
const DB='astation-retro-session-v90';
function open(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('snapshots');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Storage blocked'))})}
async function operation(mode,fn){const db=await open();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('snapshots',mode),req=fn(tx.objectStore('snapshots'));tx.oncomplete=()=>resolve(req.result);tx.onabort=()=>reject(tx.error||Error('Storage aborted'));tx.onerror=()=>reject(tx.error)})}finally{db.close()}}
export const readSnapshot=key=>operation('readonly',s=>s.get(key));
export async function writeSnapshot(key,bytes){
 if(!(bytes instanceof Uint8Array)||!bytes.byteLength||bytes.byteLength>64*1024*1024)throw Error('Unsupported state size');
 const record={bytes,date:Date.now(),size:bytes.byteLength};
 await operation('readwrite',s=>s.put(record,key));
 const check=await readSnapshot(key);
 if(check?.size!==record.size||check?.date!==record.date||check?.bytes?.byteLength!==record.size)throw Error('State readback failed');
 return check;
}
export const removeSnapshot=key=>operation('readwrite',s=>s.delete(key));
export function statsKey(profile,sha){return 'astation_session90_'+profile+'_'+sha}
export function getStats(profile,sha){try{const v=JSON.parse(localStorage.getItem(statsKey(profile,sha))||'{}');return {seconds:Math.max(0,Number(v.seconds)||0),sessions:Math.max(0,Number(v.sessions)||0),last:Math.max(0,Number(v.last)||0)}}catch{return {seconds:0,sessions:0,last:0}}}
export function saveStats(profile,sha,value){try{localStorage.setItem(statsKey(profile,sha),JSON.stringify(value));return true}catch{return false}}

export async function backupSnapshot(key){const s=await readSnapshot(key);if(!s)throw Error('No snapshot');await operation('readwrite',o=>o.put(s,key+':backup'));return s}
export async function restoreBackup(key){const s=await readSnapshot(key+':backup');if(!s)throw Error('No backup');return writeSnapshot(key,s.bytes)}
export async function snapshotInventory(profile){const db=await open();try{return await new Promise((resolve,reject)=>{const req=db.transaction('snapshots','readonly').objectStore('snapshots').getAllKeys();req.onsuccess=()=>resolve(req.result.filter(k=>typeof k==='string'&&k.startsWith(profile+':')));req.onerror=()=>reject(req.error)})}finally{db.close()}}
