import {readSnapshot,writeSnapshot} from '../retro/session-store.js?v=903';
const MAX=64*1024*1024;
function valid(sha,core){if(!/^[a-f0-9]{64}$/i.test(sha)||!['desmume','desmume2015'].includes(core))throw Error('Nieprawidłowy identyfikator stanu')}
const key=(profile,sha,core)=>{valid(sha,core);return profile+':'+sha+':'+core};
export async function exportState(profile,sha,core){const k=key(profile,sha,core),s=await readSnapshot(k);if(!s)throw Error('Brak zapisu');return new Blob([JSON.stringify({format:'ASTATION_PRIME_STATE_1',sha,core,size:s.size})+'\n',s.bytes],{type:'application/octet-stream'})}
export async function backupState(profile,sha,core){const k=key(profile,sha,core),s=await readSnapshot(k);if(!s)throw Error('Brak zapisu');return writeSnapshot(k+':prime-backup',s.bytes)}
export async function restoreBackup(profile,sha,core){const k=key(profile,sha,core),s=await readSnapshot(k+':prime-backup');if(!s)throw Error('Brak kopii');return writeSnapshot(k,s.bytes)}
export async function importState(file,profile,sha,core){const k=key(profile,sha,core);if(!file||file.size<10||file.size>MAX+2048)throw Error('Nieprawidłowy rozmiar');const bytes=new Uint8Array(await file.arrayBuffer()),n=bytes.indexOf(10);if(n<1||n>2048)throw Error('Brak nagłówka');const m=JSON.parse(new TextDecoder().decode(bytes.slice(0,n))),payload=bytes.slice(n+1);if(m.format!=='ASTATION_PRIME_STATE_1'||m.sha!==sha||m.core!==core||m.size!==payload.length||!payload.length)throw Error('Stan nie pasuje do gry lub rdzenia');if(await readSnapshot(k))await backupState(profile,sha,core);return writeSnapshot(k,payload)}
export const hasBackup=(profile,sha,core)=>readSnapshot(key(profile,sha,core)+':prime-backup').then(Boolean);
