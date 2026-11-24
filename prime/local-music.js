// Local per-profile, per-title audio only. Never upload or change ROM/save databases.
const DB='astation-game-music-v1',STORE='tracks',ids=new Set(['retro','retro_cod','world','orbit']);
function key(profile,id){if(!profile||!ids.has(id))throw Error('Nieprawidłowa gra');return JSON.stringify([profile,id])}
async function op(mode,fn){const db=await new Promise((ok,no)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);r.onblocked=()=>no(Error('Magazyn audio zablokowany'))});try{return await new Promise((ok,no)=>{const t=db.transaction(STORE,mode),r=fn(t.objectStore(STORE));t.oncomplete=()=>ok(r.result);t.onerror=()=>no(t.error||Error('Błąd magazynu audio'));t.onabort=()=>no(t.error||Error('Nie zapisano audio'))})}finally{db.close()}}
export const getMusic=(profile,id)=>op('readonly',s=>s.get(key(profile,id)));
export async function putMusic(profile,id,file,title){if(!(file instanceof Blob)||!file.size||file.size>24*1024*1024)throw Error('Wybierz plik audio do 24 MiB');const k=key(profile,id);await op('readwrite',s=>s.put({blob:file,title:String(title).slice(0,120)},k));const check=await getMusic(profile,id);if(check?.blob?.size!==file.size)throw Error('Nie potwierdzono zapisu pliku audio');return check}
export const removeMusic=(profile,id)=>op('readwrite',s=>s.delete(key(profile,id)));
export const spotify={
 retro:{title:'Overworld (From "New Super Mario Bros") — Qumu',url:'https://open.spotify.com/track/6m2gjY0xoV8deIIr16mCTU'},
 retro_cod:{title:'Theme from Call of Duty Black Ops II — Jack Wall',url:'https://open.spotify.com/track/1JfiQdz2BGBKZkVyS98ltQ'},
 world:{title:'Ori, Lost In the Storm — Gareth Coker',url:'https://open.spotify.com/track/1AvDDjLuwwC63X1xlRReCD'},
 orbit:{title:'A Walk — Tycho',url:'https://open.spotify.com/track/0sQNqu37YQQSI3K0ueswyA'}
};
