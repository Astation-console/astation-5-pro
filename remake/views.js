import * as S from '../prime/state.js';
import {t,esc,icon,mark,order,game,name,platform,photo,cover,titleArt,category,description,action,round,profileInitials,time,date,trophyTitles,size} from './ui.js';

const navLabel=k=>({home:t('Home','Start'),library:t('Library','Biblioteka'),store:t('Store','Sklep'),trophies:t('Trophies','Trofea'),saves:t('Save center','Centrum zapisów'),settings:t('Settings','Ustawienia'),profiles:t('Profiles','Profile'),notes:t('Notifications','Powiadomienia')})[k];
export const navTitle=navLabel;
const badge=(name)=>'<span class="eyebrow">'+esc(name)+'</span>';
function nav(k,i,active){return '<button class="nav-link '+(active?'current':'')+'" data-act="nav" data-id="'+k+'" '+(active?'aria-current="page"':'')+'>'+icon(i,18)+'<span>'+navLabel(k)+'</span></button>'}
export function frame(c,body){
 const p=S.profile;
 return '<header class="topbar"><div class="header-wrap"><button class="brand" data-act="nav" data-id="home" aria-label="ASTATION Home">'+mark+'<b>ASTATION</b><small>5 PRO</small></button><nav aria-label="'+t('Main navigation','Nawigacja główna')+'">'+nav('home','home',c.page==='home')+nav('library','library',c.page==='library')+nav('store','store',c.page==='store')+'</nav><div class="status">'+round('nav',navLabel('notes'),'bell','notes')+round('nav',navLabel('settings'),'settings','settings')+'<span class="status-line"></span><time id="clock"></time><button class="avatar" data-act="nav" data-id="profiles" title="'+esc(p.name)+'" aria-label="'+navLabel('profiles')+'">'+esc(profileInitials())+'</button></div></div></header><main id="view">'+body+'</main><footer><div><span class="online-dot"></span><span id="connection"></span><span class="foot-sep">/</span><span>ASTATION OS 15.0</span></div><button data-act="control">'+icon('sliders',16)+t('Control center','Centrum sterowania')+'</button></footer>'
}
function available(c,id){return !game(id).direct||c.roms.some(r=>r.gameId===id)}
function hasResume(c,id){return id==='world'&&!!(S.profile.worldSave||S.profile.prime.worldLite)||c.roms.some(r=>r.gameId===id&&r.snapshot)}
function heroButton(c,id){
 const installed=S.profile.installed.includes(id),ready=available(c,id);
 if(!ready)return action('launch',t('Set up game','Przygotuj grę'),'pad','primary',id);
 return action('launch',hasResume(c,id)?t('Continue','Kontynuuj'):t('Play now','Graj teraz'),'play','primary',id)
}
export function hero(c,id,hub=false){
 const pos=order.indexOf(id);
 const dots=order.map((g,i)=>'<button class="dot '+(i===pos?'selected':'')+'" data-act="feature" data-id="'+g+'" aria-label="'+esc(name(g))+'" aria-pressed="'+(i===pos)+'"><i></i></button>').join('');
 return '<section class="hero hero-'+id+'" aria-label="'+esc(name(id))+'"><div class="hero-photo" style="background-image:url(&quot;'+photo(id)+'&quot;)"></div><div class="hero-shade"></div><div class="hero-content"><div class="hero-kicker"><span class="slashes"></span>'+esc(hub?platform(id):t('Game spotlight','Gra w centrum uwagi'))+'</div><h1 class="game-title">'+titleArt(id)+'</h1><div class="hero-meta"><b>'+esc(platform(id))+'</b><span></span>'+esc(category(id))+'<span></span>'+t('Single player','Jeden gracz')+'</div><p>'+description(id)+'</p><div class="hero-actions">'+heroButton(c,id)+(hub?action('favorite',S.profile.prime.favorites.includes(id)?t('Favorited','W ulubionych'):t('Favorite','Ulubione'),'heart','glass',id):action('hub',t('Game hub','Centrum gry'),'grid','glass',id))+'</div>'+(hub?'<div class="track-status" id="now-track" hidden></div>':'')+'</div>'+(!hub?'<div class="slides">'+dots+'</div><div class="hero-arrows">'+round('cycle',t('Previous game','Poprzednia gra'),'prev','-1')+round('cycle',t('Next game','Następna gra'),'next','1')+'</div>':'')+'</section>'
}
export function card(c,id,home=false){
 const chosen=home&&c.selected===id;
 const label=available(c,id)?t('Ready to play','Gotowa do gry'):t('Local ROM','Lokalny ROM');
 return '<button class="game-card '+(chosen?'chosen':'')+'" data-act="hub" data-card="'+id+'" data-id="'+id+'"><div class="card-pic pic-'+id+'" style="background-image:url(&quot;'+(id==='retro'&&!S.profile.prime.covers?.retro?'./remake/art/mario-titles.webp':cover(id))+'&quot;)">'+(!S.profile.prime.covers?.[id]&&!game(id).direct?'<span class="cover-logo '+id+'" aria-hidden="true">'+titleArt(id)+'</span>':'')+'<span class="card-glyph">'+icon(game(id).direct?'disk':'pad',15)+'</span></div><div class="card-info"><h3>'+esc(name(id))+'</h3><small>'+esc(platform(id))+'</small><span class="card-state" title="'+label+'">'+icon(available(c,id)?'play':'disk',13)+'</span></div></button>'
}
const section=(title,right='')=>'<div class="section-head"><h2>'+title+'</h2>'+right+'</div>';
const jump=(id,glyph,title,detail)=>'<button class="jump" data-act="nav" data-id="'+id+'"><i>'+icon(glyph,24)+'</i><span><b>'+title+'</b><small>'+detail+'</small></span>'+icon('next',16)+'</button>';
const trophyCount=()=>['orbit','world'].reduce((n,k)=>n+(S.profile.trophies[k]?.length||0),0);
export function home(c){
 return '<div class="home-hero">'+hero(c,c.selected)+'</div>'+section(t('Game shelf','Półka z grami'),action('nav',t('View library','Zobacz bibliotekę'),'library','text-button','library'))+'<div class="game-grid shelf">'+order.map(id=>card(c,id,true)).join('')+'</div>'+section(t('Control center','Centrum sterowania'))+'<div class="jump-grid">'+jump('trophies','trophy',navLabel('trophies'),trophyCount()+' / 20 '+t('unlocked','odblokowanych'))+jump('saves','save',navLabel('saves'),t('Backups and game progress','Kopie i postęp w grach'))+jump('settings','sliders',navLabel('settings'),t('Sound, display and controllers','Dźwięk, ekran i kontrolery'))+'</div>'
}
const head=(title,kind='ASTATION 5 PRO')=>'<div class="page-head">'+badge(kind)+'<h1>'+esc(title)+'</h1></div>';
const empty=msg=>'<p class="empty">'+msg+'</p>';
export function collection(c){
 const store=c.page==='store';
 const tabs=store?[['all',t('All games','Wszystkie gry')],['original',t('Originals','Oryginalne')],['retro','Nintendo DS']]:[['all',t('Installed','Zainstalowane')],['favorites',t('Favorites','Ulubione')],['recent',t('Recently played','Ostatnio grane')]];
 return head(navLabel(c.page))+ '<div class="collection-tools"><div class="tabs">'+tabs.map(([k,v])=>action('filter',v,'',c.filter===k?'active':'',k)).join('')+'</div><label class="search">'+icon('search',17)+'<input id="search" type="search" value="'+esc(c.query)+'" placeholder="'+t('Search games','Szukaj gry')+'" aria-label="'+t('Search games','Szukaj gry')+'"></label></div><div id="results">'+results(c)+'</div>'+(!store?'<div class="section-head"><h2>'+t('Retro center','Centrum retro')+'</h2></div><button class="retro-banner" data-act="retro-center"><span>'+badge('NINTENDO DS')+'<b>'+t('Local game library','Biblioteka lokalnych gier')+'</b><small>'+t('Open your saved games or import an NDS or ZIP file.','Otwórz zapisane gry lub zaimportuj plik NDS albo ZIP.')+'</small></span>'+icon('next')+'</button>':'')
}
export function results(c){
 const store=c.page==='store',p=S.profile;
 let ids=store?order:c.filter==='favorites'?order.filter(id=>p.prime.favorites.includes(id)):c.filter==='recent'?p.recent.filter(id=>order.includes(id)):order.filter(id=>p.installed.includes(id));
 if(store&&c.filter!=='all')ids=ids.filter(id=>(c.filter==='retro')===!!game(id).direct);
 ids=ids.filter(id=>name(id).toLowerCase().includes(c.query.trim().toLowerCase()));
 return ids.length?'<div class="game-grid">'+ids.map(id=>card(c,id)).join('')+'</div>':empty(c.query?t('No matching games.','Brak pasujących gier.'):c.filter==='favorites'?t('Use the heart in a game hub to add a favorite.','W centrum gry wybierz serce, aby dodać grę do ulubionych.'):t('Games will appear here as you add or play them.','Tutaj pojawią się dodane lub uruchomione gry.'))
}
const dataCell=(k,v)=>'<div class="data-cell"><small>'+esc(k)+'</small><strong>'+esc(v)+'</strong></div>';
export function hub(c){
 const id=c.selected,st=S.profile.stats[id]||{},r=c.roms.find(x=>x.gameId===id),inLib=S.profile.installed.includes(id);
 return action('back',t('Back','Wróć'),'prev','text-button back')+hero(c,id,true)+'<div class="stats-grid">'+dataCell(t('Play time','Czas gry'),time(r?.stats.seconds||st.played))+dataCell(t('Last played','Ostatnia sesja'),date(S.profile.prime.last[id]))+dataCell(game(id).direct?'ROM':t('Trophies','Trofea'),game(id).direct?(r?r.filename:t('Import required','Wymaga importu')):(S.profile.trophies[id]?.length||0)+' / 10')+'</div>'+section(t('Game options','Opcje gry'))+'<div class="button-list">'+action(inLib?'uninstall':'install',inLib?t('Remove from library','Usuń z biblioteki'):t('Add to library','Dodaj do biblioteki'),inLib?'library':'plus','subtle',id)+action('track',t('Theme music','Muzyka gry'),'music','subtle',id)+action('cover',t('Change cover','Zmień okładkę'),'grid','subtle',id)+action('nav',t('Save center','Centrum zapisów'),'save','subtle','saves')+'</div>'
}
export function trophies(c){
 const id=c.trophyGame,earned=S.profile.trophies[id]||[],history=S.profile.history||[];
 return head(navLabel('trophies'))+'<div class="trophy-total"><div class="trophy-symbol">'+icon('trophy',35)+'</div><div><strong>'+trophyCount()+' <em>/ 20</em></strong><small>'+t('Trophies unlocked','Zdobyte trofea')+'</small></div><progress max="20" value="'+trophyCount()+'"></progress></div><div class="tabs">'+['orbit','world'].map(k=>action('trophy-filter',name(k),'',k===id?'active':'',k)).join('')+'</div><div class="achievement-grid">'+trophyTitles(id).map((title,i)=>{const got=earned.includes(i);return '<div class="achievement '+(got?'earned':'')+'">'+icon(got?'trophy':'lock',22)+'<div><b>'+esc(title)+'</b><small>'+(got?date(history.find(h=>h.id===id&&h.index===i)?.time):t('Locked','Zablokowane'))+'</small></div></div>'}).join('')+'</div>'
}
export function saves(c){
 return head(navLabel('saves'))+'<div class="surface">'+section(t('Profile backup','Kopia profilu'))+'<p>'+t('Back up this profile’s game library, trophies, settings and Dreambound progress.','Zapisz bibliotekę tego profilu, trofea, ustawienia i postęp Dreambound.')+'</p><div class="button-list">'+action('export-profile',t('Export profile','Eksportuj profil'),'download','primary')+action('import-profile',t('Import backup','Wczytaj kopię'),'save','subtle')+'</div></div>'+section(t('Nintendo DS save states','Stany gry Nintendo DS'))+(c.roms.length?c.roms.map((r,i)=>'<div class="surface"><h3>'+esc(r.filename)+'</h3><p>'+size(r.blob.size)+' · '+esc(r.core)+' · '+(r.snapshot?date(r.snapshot.date):t('No save state yet','Brak stanu gry'))+'</p><div class="button-list">'+(r.snapshot?action('state-export',t('Export state','Eksportuj stan'),'download','subtle',i)+action('state-backup',t('Back up','Zrób kopię'),'save','subtle',i):'')+(r.backup?action('state-restore',t('Restore backup','Przywróć kopię'),'save','subtle',i):'')+action('state-import',t('Import state','Wczytaj stan'),'disk','subtle',i)+'</div></div>').join(''):empty(t('Import a DS game in the retro center to manage its save states here.','Zaimportuj grę DS w centrum retro, aby zarządzać jej stanami.')))+action('retro-center',t('Open retro center','Otwórz centrum retro'),'pad','subtle')
}
export function profiles(){
 const p=S.profile;
 return head(t('Who’s playing?','Kto gra?'))+'<div class="profile-grid">'+S.vault.accounts.map(a=>'<button class="profile-card '+(a.id===S.vault.active?'chosen':'')+'" data-act="choose" data-id="'+esc(a.id)+'"><span class="avatar large">'+esc(a.name.slice(0,2).toUpperCase())+'</span><b>'+esc(a.name)+'</b><small>'+(a.id===S.vault.active?t('Active profile','Aktywny profil'):t('Switch profile','Zmień profil'))+'</small></button>').join('')+'<button class="profile-card" data-act="new-profile"><span class="avatar large add">'+icon('plus',27)+'</span><b>'+t('New profile','Nowy profil')+'</b></button></div>'+section(t('Active profile','Aktywny profil'))+'<div class="button-list">'+action('rename',t('Rename','Zmień nazwę'),'user','subtle')+action('nav',t('Save center','Centrum zapisów'),'save','subtle','saves')+'</div>'
}
const row=(label,control)=>'<div class="setting-row"><b>'+label+'</b>'+control+'</div>';
const choice=(key,options,value)=>'<select aria-label="'+esc(key)+'" data-setting="'+key+'">'+options.map(([k,v])=>'<option value="'+k+'" '+(String(value)===String(k)?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select>';
const slider=(key,value)=>'<label class="slider"><input aria-label="'+esc(key)+'" type="range" min="0" max="100" data-setting="'+key+'" value="'+Number(value)+'"><output>'+Number(value)+'%</output></label>';
const toggle=(key,v)=>'<button class="toggle '+(v?'on':'')+'" data-act="toggle" data-id="'+key+'" aria-label="'+esc(key)+'" aria-pressed="'+!!v+'"><i></i></button>';
export function settings(){
 const p=S.profile.prime,a=p.audio;
 return head(navLabel('settings'))+'<div class="settings-grid"><section class="surface"><h2>'+t('Console','Konsola')+'</h2>'+row(t('Language','Język'),choice('language',[['en','English'],['pl','Polski']],S.profile.lang))+row(t('Accent','Kolor akcentu'),choice('accent',[['ion','Ion Lime'],['ice','Arctic Blue'],['violet','Neon Violet'],['amber','Solar Amber']],p.remakeAccent||'ion'))+row(t('Animations','Animacje'),toggle('motion',p.motion))+row(t('TV mode','Tryb TV'),toggle('tv',p.tv))+row(t('Display','Ekran'),action('fullscreen',t('Full screen','Pełny ekran'),'screen','small-button'))+'</section><section class="surface"><h2>'+t('Audio','Dźwięk')+'</h2>'+row(t('Menu music','Muzyka menu'),toggle('audio',a.enabled))+row(t('Master volume','Głośność główna'),slider('master',a.master))+row(t('Game themes','Motywy gier'),slider('music',a.music))+row(t('Interface sounds','Dźwięki interfejsu'),slider('ui',a.ui))+row(t('DS game volume','Głośność gier DS'),slider('game',a.game))+'</section><section class="surface"><h2>'+t('Controller','Kontroler')+'</h2><p id="pad-info"></p>'+row(t('Stick dead zone','Martwa strefa'),slider('deadzone',Math.round(p.deadzone*100)))+'<div id="pad-test" class="mono"></div></section><section class="surface"><h2>'+t('System','System')+'</h2><p id="storage"></p><div class="button-list">'+action('diagnostics',t('Diagnostics','Diagnostyka'),'sliders','subtle')+action('standby',t('Standby','Uśpij'),'power','subtle')+'</div></section></div>'
}
export function notes(){
 const list=S.profile.prime.notes||[];
 return head(navLabel('notes'))+(list.length?'<div class="surface">'+list.map(n=>'<div class="notice">'+icon('bell')+'<div><b>'+esc(n.title)+'</b><p>'+esc(n.body)+'</p></div><small>'+date(n.at)+'</small></div>').join('')+'</div>':empty(t('Your game and system notifications will appear here.','Tutaj pojawią się powiadomienia z gier i systemu.')))
}
export const standby=()=>'<div class="standby">'+mark+'<h1>ASTATION <small>5 PRO</small></h1>'+action('wake',t('Start console','Uruchom konsolę'),'power','primary')+'</div>';
