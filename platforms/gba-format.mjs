// GBA header screening. Not proof that a ROM is executable or licensed.
export const MAX_GBA=32*1024*1024;
export function inspectGBA(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<192||bytes.length>MAX_GBA)throw Error('GBA: nieprawidłowy rozmiar');
 if(bytes[0xb2]!==0x96)throw Error('GBA: brak stałej nagłówka');
 let check=0;for(let i=0xa0;i<=0xbc;i++)check=(check-bytes[i])&255;
 if(((check-0x19)&255)!==bytes[0xbd])throw Error('GBA: błędna suma kontrolna');
 const title=new TextDecoder().decode(bytes.slice(0xa0,0xac)).replace(/[^ -~]/g,'').trim();
 return {platform:'gba',title:title||'GBA ROM',size:bytes.length};
}
