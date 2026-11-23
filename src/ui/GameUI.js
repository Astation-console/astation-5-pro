import {STORY_ORDER,STORY_SCENES,STORY_CHAPTERS} from '../systems/StoryCampaign.js';
export class UI {
  constructor(){this.overlay=document.getElementById('overlay');this.hudLayer=document.getElementById('hud');this.toastLayer=document.getElementById('toast');this.loading=document.getElementById('loading');}
  status(message,value=0){
    const label=document.querySelector('#load-label'),track=document.querySelector('#load-progress');
    if(label)label.textContent=message;if(track)track.style.width=`${Math.max(0,Math.min(100,value))}%`;
    this.loading?.classList.toggle('hidden',value>=100);
  }
  bind(html,handlers){this._removeStoryListener?.();this._removeStoryListener=null;this.overlay.classList.remove('story-mode');this.overlay.innerHTML=html;this.overlay.classList.remove('hidden');
    for(const [name,action] of Object.entries(handlers)){this.overlay.querySelector(`[data-action="${name}"]`)?.addEventListener('click',action);}
  }
  menu(title,{onPlay,onNew,onClassic,onJournal}){
    this.bind(`<div class="dialog"><div class="eyebrow">ASTATION STUDIOS · STORY EDITION 6.5</div><h1>WORLD <span>DREAMBOUND</span></h1><p>${title}</p><div class="mission-line">GREEN VALLEY · PIX · 3D ADVENTURE · 7 FLOATING ISLANDS · PIX PRO 6.5</div><p>Poznaj LUMĘ i odkryj tajemnicę ECHO. Ocal Serce Doliny, zbierz sześć iskier pamięci i przywróć dwa przekaźniki.</p><div class="buttons"><button class="primary" data-action="play">CONTINUE</button><button data-action="new">NEW GAME</button><button data-action="journal">FABUŁA / STORY JOURNAL</button><button data-action="classic">CLASSIC WORLDS (1–5)</button></div><small>The original 5-world game and previous saves are preserved.</small></div>`,{play:onPlay,new:onNew,classic:onClassic,journal:onJournal});
  }
  pause({onResume,onRestart,onSave,onPhoto,onQuality,onClassic,onExit,onJournal}){
    this.bind(`<div class="dialog"><div class="eyebrow">PIX · GREEN VALLEY</div><h2>PAUSED</h2><p>Your progress can be resumed from the last checkpoint.</p><div class="buttons"><button class="primary" data-action="resume">RESUME</button><button data-action="restart">RESTART CHECKPOINT</button><button data-action="save">SAVE GAME</button><button data-action="journal">FABUŁA / STORY JOURNAL</button><button data-action="photo">PHOTO MODE / CAPTURE</button><div class="eyebrow" style="margin-top:10px">GRAPHICS QUALITY</div><div style="display:flex;gap:7px;flex-wrap:wrap"><button data-action="performance" style="flex:1">PERFORMANCE</button><button data-action="balanced" style="flex:1">BALANCED</button><button data-action="quality" style="flex:1">QUALITY</button></div><button data-action="classic">CLASSIC WORLDS</button><button data-action="exit">RETURN TO ASTATION OS</button></div></div>`,{resume:onResume,restart:onRestart,save:onSave,photo:onPhoto,journal:onJournal,performance:()=>onQuality('performance'),balanced:()=>onQuality('balanced'),quality:()=>onQuality('quality'),classic:onClassic,exit:onExit});
  }
  complete(mission,{record,onReplay,onExit,onClassic}){
    this.bind(`<div class="dialog"><div class="eyebrow">GREEN VALLEY COMPLETED</div><h2>CORE RESTORED</h2><p>PIX restored the first Dream Core!</p><div class="summary">${mission.crystals.size} CRYSTALS · ${mission.terminals.size} TERMINALS · ${Math.round(mission.played)}s · BEST ${record?Math.round(record)+'s':'—'}</div><div class="buttons"><button class="primary" data-action="replay">REPLAY LEVEL</button><button data-action="classic">FIVE CLASSIC WORLDS</button><button data-action="exit">RETURN TO ASTATION OS</button></div></div>`,{replay:onReplay,classic:onClassic,exit:onExit});
  }
  story(scene,onDone){
    if(!scene || !Array.isArray(scene.lines))return;
    const lang=scene.lang==='en'?'en':'pl';let at=0;
    const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const paint=()=>{
      const l=scene.lines[at],who=l.who;
      const colors={PIX:'#9eedf2',LUMA:'#9a91ff',ECHO:'#ff90c7',GUARDIAN:'#e1beff'};
      const done=at===scene.lines.length-1;
      this.bind(`<div class="story-cinema"><div class="story-overline">ASTATION WORLD · ${lang==='pl'?'ROZDZIAŁ I':'CHAPTER I'}</div><div class="story-location">${esc(scene.place[lang])}</div><div class="story-content"><div class="story-orb" style="--story-color:${colors[who]||'#92e2ff'}">${esc(who[0])}</div><div class="story-lines"><div class="story-who" style="color:${colors[who]||'#92e2ff'}">${esc(who)}</div><p class="story-text">${esc(l[lang])}</p><div class="story-actions"><span class="story-count">${at+1} / ${scene.lines.length}</span><button class="story-skip" data-action="skip">${lang==='pl'?'Pomiń scenę':'Skip scene'}</button><button class="story-next" data-action="next">${done?(lang==='pl'?'Zakończ scenę':'Finish scene'):(lang==='pl'?'Dalej':'Continue')} →</button></div></div></div><div class="story-progress">${scene.lines.map((_,i)=>`<i class="${i<=at?'lit':''}"></i>`).join('')}</div></div>`,{next:()=>{if(done){this._removeStoryListener?.();this._removeStoryListener=null;this.overlay.classList.remove('story-mode');this.overlay.classList.add('hidden');onDone?.();}else{at++;paint();}},skip:()=>{this._removeStoryListener?.();this._removeStoryListener=null;this.overlay.classList.remove('story-mode');this.overlay.classList.add('hidden');onDone?.();}});
      this.overlay.classList.add('story-mode');
      const handler=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopImmediatePropagation();this.overlay.querySelector('[data-action="next"]')?.click();}else if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();this.overlay.querySelector('[data-action="skip"]')?.click();}};
      document.addEventListener('keydown',handler);
      this._removeStoryListener=()=>document.removeEventListener('keydown',handler);
      this.overlay.querySelector('[data-action="next"]')?.focus({preventScroll:true});
    };
    paint();
  }
  journal(mission,{lang='pl',onBack=()=>{}}={}){
    const isPl=lang!=='en';
    const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const seen=mission.story?.seen||new Set();
    const rows=STORY_CHAPTERS.map((chapter,i)=>`<div class="journal-entry ${chapter.available?'available':'future'}"><b>${String(i+1).padStart(2,'0')} · ${esc(chapter.world)}</b><span>${esc(chapter.name[isPl?'pl':'en'])} — ${chapter.available?(isPl?'Grywalny rozdział':'Playable chapter'):(isPl?'Fabuła w przygotowaniu':'Story in development')}</span></div>`).join('');
    const scenes=STORY_ORDER.map(id=>{let scene=STORY_SCENES[id];let unlocked=seen.has(id);return `<div class="journal-entry"><b>${unlocked?esc(scene.name[isPl?'pl':'en']):'??? · '+(isPl?'Nieodkryta scena':'Undiscovered scene')}</b><span>${unlocked?esc(scene.place[isPl?'pl':'en']):(isPl?'Odkryj podczas rozgrywki':'Discover during gameplay')}</span></div>`}).join('');
    this.bind(`<div class="dialog journal-dialog"><div class="eyebrow">LUMA · DREAM ARCHIVE</div><h2>${isPl?'KRONIKA SNÓW':'DREAM JOURNAL'}</h2><p>${isPl?'Odzyskuj pamięć Doliny poprzez kryształy, przekaźniki i podróż PIX-a. Tylko pierwszy rozdział ma teraz nową fabułę.':'Restore the valley’s memories through crystals, relays and PIX’s journey. Only chapter one currently has the new story.'}</p><div class="journal-scroll"><div class="eyebrow">${isPl?'ROZDZIAŁY':'CHAPTERS'}</div>${rows}<div class="eyebrow" style="margin-top:19px">${isPl?'ODKRYTE SCENY':'DISCOVERED SCENES'} · ${seen.size}/8</div>${scenes}</div><div class="buttons"><button class="primary" data-action="back">${isPl?'Powrót':'Back'}</button></div></div>`,{back:onBack});
  }
  photo(image,onClose=()=>{}){this.bind(`<div class="dialog"><h2>PHOTO CAPTURED</h2><img class="photo" alt="Dreambound capture" src="${image}"><div class="buttons"><a class="primary" download="astation-dreambound.png" href="${image}">SAVE PHOTO</a><button data-action="close">BACK</button></div></div>`,{close:onClose});}
  hud(mission,health,{dash=0,position=null,level=null,record=null,elapsed=0}={}){
    const set=(id,text)=>{const el=document.getElementById(id);if(el&&el.textContent!==text)el.textContent=text;};
    set('hp',`HP  ${health} / 3`);set('crystals',`${mission.crystals.size} / 6`);set('terminals',`${mission.terminals.size} / 2`);
    set('dash',dash>0?`READY IN ${dash.toFixed(1)}s`:'DASH READY');
    const duration=Math.floor(elapsed),minutes=String(Math.floor(duration/60)).padStart(2,'0'),seconds=String(duration%60).padStart(2,'0');
    set('timer',`${minutes}:${seconds}`);
    if(level&&position){
      const terminals=level.terminals.filter(t=>!t.active);
      const crystals=level.crystals.filter(c=>!c.taken);
      const targets=mission.terminals.size<2?terminals:mission.crystals.size<6?crystals:[];
      const nearest=targets.sort((a,b)=>Math.hypot(a.x-position.x,a.z-position.z)-Math.hypot(b.x-position.x,b.z-position.z))[0];
      const dist=nearest?Math.round(Math.hypot(nearest.x-position.x,nearest.z-position.z)):null;
      set('target', dist!=null?`${mission.terminals.size<2?'TERMINAL':'CRYSTAL'} · ${dist}m`:'DREAM GATE · FOLLOW THE LIGHT');
      set('interactHint',terminals.some(t=>Math.hypot(t.x-position.x,t.z-position.z)<2.5)?'PRESS E / △ TO ACTIVATE':'');
    }
    const bar=document.getElementById('mission-bar');if(bar){let width=`${mission.progress()}%`;if(bar.style.width!==width)bar.style.width=width;}
    set('mission',mission.completed?'THE CORE IS RESTORED':mission.terminals.size<2?'ACTIVATE BOTH TERMINALS':mission.crystals.size<6?'FIND SIX CRYSTALS':'REACH THE DREAM GATE');
  }
  toast(message){const el=document.createElement('div');el.className='toast';el.textContent=message;this.toastLayer.prepend(el);setTimeout(()=>el.remove(),3100);}
  hideOverlay(){this.overlay.classList.add('hidden');}
  error(message,classic){
    this.bind(`<div class="dialog"><h2>ENGINE COULD NOT START</h2><p>${String(message).replaceAll('<','&lt;')}</p><div class="buttons"><button class="primary" data-action="classic">PLAY CLASSIC WORLDS</button></div></div>`,{classic});
  }
}
