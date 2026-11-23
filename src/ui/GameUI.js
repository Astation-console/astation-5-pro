export class UI {
  constructor(){this.overlay=document.getElementById('overlay');this.hudLayer=document.getElementById('hud');this.toastLayer=document.getElementById('toast');this.loading=document.getElementById('loading');}
  status(message,value=0){
    const label=document.querySelector('#load-label'),track=document.querySelector('#load-progress');
    if(label)label.textContent=message;if(track)track.style.width=`${Math.max(0,Math.min(100,value))}%`;
    this.loading?.classList.toggle('hidden',value>=100);
  }
  bind(html,handlers){this.overlay.innerHTML=html;this.overlay.classList.remove('hidden');
    for(const [name,action] of Object.entries(handlers)){this.overlay.querySelector(`[data-action="${name}"]`)?.addEventListener('click',action);}
  }
  menu(title,{onPlay,onNew,onClassic}){
    this.bind(`<div class="dialog"><div class="eyebrow">ASTATION STUDIOS · GAME ENGINE 6.0</div><h1>WORLD <span>DREAMBOUND</span></h1><p>${title}</p><div class="mission-line">GREEN VALLEY · PIX · FIRST PLAYABLE NEXT-GEN LEVEL</div><div class="buttons"><button class="primary" data-action="play">CONTINUE</button><button data-action="new">NEW GAME</button><button data-action="classic">CLASSIC WORLDS (1–5)</button></div><small>The original 5-world game and previous saves are preserved.</small></div>`,{play:onPlay,new:onNew,classic:onClassic});
  }
  pause({onResume,onRestart,onSave,onPhoto,onClassic,onExit}){
    this.bind(`<div class="dialog"><div class="eyebrow">PIX · GREEN VALLEY</div><h2>PAUSED</h2><p>Your progress can be resumed from the last checkpoint.</p><div class="buttons"><button class="primary" data-action="resume">RESUME</button><button data-action="restart">RESTART CHECKPOINT</button><button data-action="save">SAVE GAME</button><button data-action="photo">PHOTO MODE / CAPTURE</button><button data-action="classic">CLASSIC WORLDS</button><button data-action="exit">RETURN TO ASTATION OS</button></div></div>`,{resume:onResume,restart:onRestart,save:onSave,photo:onPhoto,classic:onClassic,exit:onExit});
  }
  complete(mission,{onReplay,onExit,onClassic}){
    this.bind(`<div class="dialog"><div class="eyebrow">GREEN VALLEY COMPLETED</div><h2>CORE RESTORED</h2><p>PIX restored the first Dream Core!</p><div class="summary">${mission.crystals.size} CRYSTALS · ${mission.terminals.size} TERMINALS · ${Math.round(mission.played)}s</div><div class="buttons"><button class="primary" data-action="replay">REPLAY LEVEL</button><button data-action="classic">FIVE CLASSIC WORLDS</button><button data-action="exit">RETURN TO ASTATION OS</button></div></div>`,{replay:onReplay,classic:onClassic,exit:onExit});
  }
  photo(image,onClose=()=>{}){this.bind(`<div class="dialog"><h2>PHOTO CAPTURED</h2><img class="photo" alt="Dreambound capture" src="${image}"><div class="buttons"><a class="primary" download="astation-dreambound.png" href="${image}">SAVE PHOTO</a><button data-action="close">BACK</button></div></div>`,{close:onClose});}
  hud(mission,health){
    const set=(id,text)=>{const el=document.getElementById(id);if(el)el.textContent=text;};
    set('hp',`HP  ${health} / 3`);set('crystals',`${mission.crystals.size} / 6`);set('terminals',`${mission.terminals.size} / 2`);
    const bar=document.getElementById('mission-bar');if(bar)bar.style.width=`${mission.progress()}%`;
    set('mission',mission.completed?'THE CORE IS RESTORED':mission.terminals.size<2?'ACTIVATE BOTH TERMINALS':mission.crystals.size<6?'FIND SIX CRYSTALS':'REACH THE DREAM GATE');
  }
  toast(message){const el=document.createElement('div');el.className='toast';el.textContent=message;this.toastLayer.prepend(el);setTimeout(()=>el.remove(),3100);}
  hideOverlay(){this.overlay.classList.add('hidden');}
  error(message,classic){
    this.bind(`<div class="dialog"><h2>ENGINE COULD NOT START</h2><p>${String(message).replaceAll('<','&lt;')}</p><div class="buttons"><button class="primary" data-action="classic">PLAY CLASSIC WORLDS</button></div></div>`,{classic});
  }
}
