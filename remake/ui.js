import * as S from '../prime/state.js';
import {games} from '../prime/catalog.js';

export const t=(en,pl)=>S.profile.lang==='pl'?pl:en;
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={
 home:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/>',
 store:'<path d="m4 8-1 13h18L20 8z"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 20a2 2 0 0 0 4 0"/>',
 settings:'<path d="m9 3 .7-1h4.6l.7 2 2 .9 2-.5 2.2 3.8-1.5 1.6.1 2.4 1.4 1.6-2.2 3.8-2.1-.5-2 .9-.6 2h-4.6l-.7-2-2-.9-2 .5-2.2-3.8 1.4-1.6v-2.4L2.8 8.2 5 4.4l2 .5 2-.9Z" transform="translate(0 1)"/><circle cx="12" cy="12" r="3.2"/>',
 play:'<path fill="currentColor" stroke="none" d="M6.6 3.9a1 1 0 0 1 1.6-.8l12 8a1.1 1.1 0 0 1 0 1.8l-12 8a1 1 0 0 1-1.6-.8z"/>',
 pad:'<path d="M8.5 7h7c2.8-1.5 4.3.6 5.2 4.5l.9 5.1c.5 3.6-2.3 4.5-4.4 1.8L15.5 16h-7l-1.8 2.4c-2.1 2.7-4.9 1.8-4.4-1.8l.9-5.1C4.1 7.6 5.7 5.5 8.5 7Z"/><path d="M7.4 9.7v4.2m-2.1-2.1h4.2"/><circle cx="15" cy="11" r=".7"/><circle cx="17.8" cy="13.1" r=".7"/>',
 trophy:'<path d="M7 3h10v6a5 5 0 0 1-10 0zm0 2H3v2a4 4 0 0 0 4 4m10-6h4v2a4 4 0 0 1-4 4m-5 3v5m-4 2h8m-7-2h6"/>',
 disk:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 14h18m-5 2.5h2"/>',
 spark:'<path d="m14 2-10 12h7l-1 8 10-13h-7z"/>',
 music:'<path d="M9 17V5l11-2v12M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2.5"/><ellipse cx="17" cy="16" rx="3" ry="2.5"/>',
 next:'<path d="m9 5 7 7-7 7"/>',prev:'<path d="m15 5-7 7 7 7"/>',down:'<path d="m5 9 7 7 7-7"/>',
 more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
 close:'<path d="m6 6 12 12m0-12L6 18"/>',plus:'<path d="M12 4v16M4 12h16"/>',
 check:'<path d="m4 13 5 4L20 6"/>',heart:'<path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.3a5.5 5.5 0 0 0 0-7.8z"/>',
 search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
 library:'<path d="M3 4h4v16H3zM10 4h4v16h-4zM16 5l3-1 4 15-3 1z"/>',
 save:'<path d="M4 3h13l4 4v14H3V3zM7 3v6h9V3M7 21v-8h10v8"/>',
 sound:'<path d="M3 9h4l5-5v16l-5-5H3zM16 8a6 6 0 0 1 0 8m2-11a10 10 0 0 1 0 14"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 sliders:'<path d="M3 7h7m4 0h7M3 17h11m4 0h3"/><circle cx="12" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v7l4 2"/>',
 power:'<path d="M12 2v10M6 5a9 9 0 1 0 12 0"/>',signal:'<path d="M3 20v-3m5 3v-7m5 7V9m5 11V5"/>',screen:'<rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 21h8"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'
};
export const icon=(name,n=20)=>'<svg aria-hidden="true" width="'+n+'" height="'+n+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(paths[name]||'')+'</svg>';
export const mark='<svg class="brand-symbol" aria-hidden="true" viewBox="0 0 42 38" fill="currentColor"><path d="M0 34 17 4h8L8 34zm16 0 6-10h7l-6-10 4-7 15 27h-9l-2-4H20l-2 4z"/></svg>';
export const order=['orbit','world','retro','retro_cod'];
const art={orbit:'orbit.webp',world:'dreambound.webp',retro:'mario-boxarts.webp',retro_cod:'black-ops-boxarts.webp'};
export const game=id=>games.find(g=>g.id===id);
export const photo=id=>'./remake/art/'+art[id];
export const cover=id=>S.profile.prime.covers?.[id]||photo(id);
export const name=id=>game(id)?.title||id;
export const platform=id=>({orbit:'ASTATION Arcade',world:'ASTATION Original',retro:'Nintendo DS',retro_cod:'Nintendo DS'})[id];
export const category=id=>({orbit:t('Space runner','Kosmiczny runner'),world:t('Adventure','Przygoda'),retro:t('Platformer','Platformowa'),retro_cod:t('Action','Akcja')})[id];
export function description(id){return ({
 orbit:t('Pilot your ship through the asteroid belt. Collect energy cores and chase a new high score.','Pilotuj statek przez pas asteroid. Zbieraj rdzenie energii i pobij swój rekord.'),
 world:t('Join PIX on a journey through floating islands, hidden ruins and a world made of dreams.','Wyrusz z PIX-em przez podniebne wyspy, ukryte ruiny i krainę zbudowaną ze snów.'),
 retro:t('Jump, stomp and power up across the Mushroom Kingdom in the Nintendo DS adventure.','Skacz po Grzybowym Królestwie, zdobywaj ulepszenia i ruszaj na ratunek Peach w przygodzie z Nintendo DS.'),
 retro_cod:t('Take on a Cold War campaign in the handheld edition of Black Ops.','Wyrusz na tajne operacje z czasów zimnej wojny w przenośnej wersji Black Ops.')
})[id]}
export const titleArt=id=>({orbit:'ORBIT <i>RUSH</i>',world:'DREAMBOUND',retro:'NEW SUPER<br>MARIO BROS.',retro_cod:'CALL OF DUTY<br><i>BLACK OPS</i>'})[id];
export const action=(act,label,ic='',cls='',id='')=>'<button type="button" class="'+cls+'" data-act="'+act+'" data-id="'+esc(id)+'">'+(ic?icon(ic):'')+'<span>'+esc(label)+'</span></button>';
export const round=(act,label,ic,id='')=>'<button type="button" class="round" data-act="'+act+'" data-id="'+esc(id)+'" aria-label="'+esc(label)+'" title="'+esc(label)+'">'+icon(ic)+'</button>';
export const profileInitials=()=>S.profile.name.trim().split(/\s+/).slice(0,2).map(s=>s.charAt(0)).join('').toUpperCase();
export const time=(sec=0)=>sec<60?Math.round(sec||0)+' s':sec<3600?Math.floor(sec/60)+' min':Math.floor(sec/3600)+' h '+Math.floor(sec%3600/60)+' min';
export const size=b=>b<1024*1024?Math.round((b||0)/1024)+' KiB':(b/1048576).toFixed(1)+' MiB';
export function date(ms){return ms?new Date(ms).toLocaleString(S.profile.lang==='pl'?'pl-PL':'en-GB',{day:'numeric',month:'short',year:'numeric'}):'—'}
export const trophyTitles=id=>id==='orbit'?[t('First flight','Pierwszy lot'),t('Core collector','10 rdzeni'),t('2,000 points','2000 punktów'),t('One minute in orbit','60 sekund'),t('Orbit legend','Legenda orbity'),t('250 points','250 punktów'),t('500 points','500 punktów'),t('1,000 points','1000 punktów'),t('Five cores','5 rdzeni'),t('Two minutes in orbit','120 sekund')]:[t('First spark','Pierwsza iskra'),t('Heart of the valley','Serce Doliny'),t('Dreams restored','Ocalone sny'),t('Secret found','Sekret'),t('Dream legend','Legenda snów'),t('15 crystals','15 kryształów'),t('8 switches','8 przełączników'),t('5 worlds','5 światów'),t('Persistence','Wytrwałość'),t('Dream guardian','Strażnik snów')];
