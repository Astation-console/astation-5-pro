// ASTATION RETRO 8 — Nintendo DS file inspection and local IndexedDB library.
// No imported ROM data is transmitted by these functions.
export const MAX_ROM_BYTES = 128 * 1024 * 1024;
export const MAX_ARCHIVE_BYTES = 96 * 1024 * 1024;
const DB_NAME = 'astation_retro_v8';
const DB_VERSION = 1;

export function ndsCRC16(bytes) {
  let crc = 0xffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xa001 : 0);
  }
  return crc;
}
export function inspectNDS(bytes) {
  if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);
  if (bytes.byteLength < 0x4000) throw new Error('To nie jest kompletny plik Nintendo DS (zbyt mały).');
  if (bytes.byteLength > MAX_ROM_BYTES) throw new Error('Plik jest za duży dla mobilnej wersji ASTATION RETRO (limit 128 MiB).');
  const header = bytes.subarray(0, 0x200);
  const title = Array.from(header.subarray(0, 12)).map(v => v === 0 ? '' : String.fromCharCode(v)).join('').trim();
  const code = Array.from(header.subarray(12, 16)).map(v => String.fromCharCode(v)).join('');
  const maker = Array.from(header.subarray(16, 18)).map(v => String.fromCharCode(v)).join('');
  const storedLogo = header[0x15c] | header[0x15d] << 8;
  const storedHeader = header[0x15e] | header[0x15f] << 8;
  if (!title || !/^[A-Z0-9]{4}$/.test(code)) throw new Error('Nieprawidłowy nagłówek NDS (tytuł lub kod gry).');
  if (ndsCRC16(header.subarray(0xc0, 0x15c)) !== storedLogo) throw new Error('Nagłówek NDS ma niepoprawne dane logo (CRC16).');
  if (ndsCRC16(header.subarray(0, 0x15e)) !== storedHeader) throw new Error('Uszkodzony nagłówek NDS (CRC16).');
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (const [offsetPos, lengthPos] of [[0x20, 0x2c], [0x30, 0x3c]]) {
    const offset = dv.getUint32(offsetPos, true), size = dv.getUint32(lengthPos, true);
    if (!offset || !size || offset + size > bytes.byteLength) throw new Error('Nieprawidłowe położenie danych ARM7/ARM9 w pliku NDS.');
  }
  return {title, code, maker, size:bytes.byteLength, format:'Nintendo DS', validHeader:true};
}
// ZIP central-directory parser: supports stored and deflated NDS entries without uploading files.
export async function extractZipNDS(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length < 22 || bytes.length > MAX_ARCHIVE_BYTES) throw Error('Nieprawidłowy rozmiar ZIP.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u16 = p => view.getUint16(p, true), u32 = p => view.getUint32(p, true);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (u32(i) === 0x06054b50) {eocd = i; break}
  }
  if (eocd < 0) throw Error('Brak katalogu centralnego ZIP.');
  const count = u16(eocd + 10), off = u32(eocd + 16);
  if (count > 200 || off >= bytes.length) throw Error('ZIP zawiera za dużo plików lub uszkodzony katalog.');
  let pos=off, found=[];
  for (let i=0; i<count; i++) {
    if (pos + 46 > bytes.length || u32(pos) !== 0x02014b50) throw Error('Uszkodzony katalog ZIP.');
    const flags=u16(pos+8),method=u16(pos+10),crc=u32(pos+16),compressed=u32(pos+20),uncompressed=u32(pos+24),nameLen=u16(pos+28),extraLen=u16(pos+30),commentLen=u16(pos+32),localOff=u32(pos+42);
    if (pos + 46 + nameLen + extraLen + commentLen > bytes.length) throw Error('Błędna długość nazwy ZIP.');
    const name = new TextDecoder('utf-8').decode(bytes.subarray(pos+46,pos+46+nameLen));
    pos += 46 + nameLen + extraLen + commentLen;
    if (!/\.nds$/i.test(name) || name.startsWith('__MACOSX/')) continue;
    if (uncompressed > MAX_ROM_BYTES || compressed > MAX_ARCHIVE_BYTES) throw Error('ROM w ZIP przekracza bezpieczny limit pamięci.');
    if (flags & 1) throw Error('Zaszyfrowane archiwa ZIP nie są obsługiwane.');
    if (![0,8].includes(method)) throw Error('ZIP zawiera nieobsługiwane kompresowanie (wymagane STORE lub DEFLATE).');
    if (localOff + 30 > bytes.length || u32(localOff) !== 0x04034b50) throw Error('Uszkodzony nagłówek pliku ZIP.');
    const start=localOff+30+u16(localOff+26)+u16(localOff+28);
    if (start+compressed>bytes.length) throw Error('ZIP jest ucięty.');
    found.push({name,method,crc,compressed,uncompressed,start});
  }
  if (found.length !== 1) throw Error(found.length?'ZIP zawiera kilka plików .nds. Wybierz archiwum z jedną grą.':'ZIP nie zawiera pliku .nds.');
  const item=found[0];
  let output;
  if (item.method === 0) output=bytes.slice(item.start,item.start+item.compressed);
  else {
    if (!globalThis.DecompressionStream) throw Error('Przeglądarka nie obsługuje dekompresji ZIP.');
    const compressedData=new Blob([bytes.subarray(item.start,item.start+item.compressed)]);
    const stream=compressedData.stream().pipeThrough(new DecompressionStream('deflate-raw'));
    output=new Uint8Array(await new Response(stream).arrayBuffer());
  }
  if (output.length!==item.uncompressed) throw Error('ZIP ma niezgodny rozmiar rozpakowanego pliku.');
  const table = new Uint32Array(256);
  for(let i=0;i<256;i++){let v=i;for(let k=0;k<8;k++)v=(v>>>1)^((v&1)?0xedb88320:0);table[i]=v>>>0}
  let crc=0xffffffff;
  for (const byte of output) crc=(crc>>>8)^table[(crc^byte)&0xff];
  if (((crc ^ 0xffffffff)>>>0)!==item.crc) throw Error('Błąd sumy kontrolnej ZIP (CRC32).');
  return {bytes:output, filename:item.name.split('/').pop()};
}
export async function unpackLocalFile(file) {
  if (!file) throw new Error('Nie wybrano pliku.');
  if (file.size > (/\.nds$/i.test(file.name)?MAX_ROM_BYTES:MAX_ARCHIVE_BYTES)) throw new Error('Plik przekracza limit rozmiaru dla tego formatu.');
  let bytes, filename = file.name;
  if (/\.nds$/i.test(filename)) bytes = new Uint8Array(await file.arrayBuffer());
  else if (/\.zip$/i.test(filename)) {
    try {
      const result=await extractZipNDS(file);
      bytes=result.bytes;filename=result.filename;
    }catch(e){
      // Older browsers can use JSZip when deflate-raw is unavailable.
      if (!/dekompresji ZIP/.test(String(e?.message)) || !globalThis.JSZip) throw e;
      const zip=await globalThis.JSZip.loadAsync(file,{checkCRC32:true});
      const entries=Object.values(zip.files).filter(v=>!v.dir&&/\.nds$/i.test(v.name)&&!v.name.startsWith('__MACOSX/'));
      if(entries.length!==1)throw Error('ZIP musi zawierać dokładnie jeden plik .nds.');
      if(entries[0]._data?.uncompressedSize>MAX_ROM_BYTES)throw Error('ROM jest zbyt duży.');
      filename=entries[0].name.split('/').pop();bytes=await entries[0].async('uint8array');
    }
  } else throw new Error('Wybierz plik .nds lub .zip.');
  const info = inspectNDS(bytes);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const sha = Array.from(new Uint8Array(digest)).map(v => v.toString(16).padStart(2, '0')).join('');
  return {blob:new Blob([bytes], {type:'application/octet-stream'}), info, sha, filename};
}
export function openRetroDB() {
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if (!db.objectStoreNames.contains('games')) {
        const store=db.createObjectStore('games',{keyPath:'id'});
        store.createIndex('profile','profile',{unique:false});
      }
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('IndexedDB error'));
  });
}
export async function dbAll(profile) {
  const db=await openRetroDB();
  try {return await new Promise((resolve,reject)=>{
    const req=db.transaction('games').objectStore('games').index('profile').getAll(profile);
    req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);
  });}finally{db.close()}
}
export async function dbPut(record) {
  const db=await openRetroDB();
  try{return await new Promise((resolve,reject)=>{
    const tx=db.transaction('games','readwrite');tx.objectStore('games').put(record);
    tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error);
  });}finally{db.close()}
}
export async function dbDelete(id) {
  const db=await openRetroDB();
  try{return await new Promise((resolve,reject)=>{
    const tx=db.transaction('games','readwrite');tx.objectStore('games').delete(id);
    tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error);
  });}finally{db.close()}
}
