/* ASTATION RETRO 8.2 — integrated into ASTATION OS Store and installed game shelf. */
(()=>{'use strict';
  let shell=null;
  function profile(){try{const v=JSON.parse(localStorage.getItem('astation_profiles_v7')||'{}');return /^[\w-]{1,40}$/.test(v.active||'')?v.active:'legacy'}catch{return 'legacy'}}
  function open(options={}){
    if(shell)return;
    shell=document.createElement('section');shell.id='ast-retro-shell';shell.setAttribute('aria-label',options.game==='mario'?'New Super Mario Bros. — Nintendo DS':options.game==='cod'?'Call of Duty: Black Ops — Nintendo DS':'ASTATION RETRO — emulator Nintendo DS');
    shell.style.cssText='position:fixed;inset:0;z-index:8000;background:#030a15;display:flex;flex-direction:column;animation:retroOpen .24s ease-out';
    const frame=document.createElement('iframe');frame.title=options.game==='mario'?'New Super Mario Bros. — Nintendo DS':'ASTATION RETRO — Nintendo DS';frame.src='./retro/index.html?v=87&profile='+encodeURIComponent(profile())+(options.game==='mario'?'&game=mario':options.game==='cod'?'&game=cod':'');frame.allow='fullscreen;autoplay;gamepad';frame.style.cssText='border:0;flex:1;width:100%;min-height:0';
    shell.append(frame);document.body.append(shell);
    document.documentElement.classList.add('retro-is-open');
  }
  function close(){shell?.remove();shell=null;document.documentElement.classList.remove('retro-is-open')}
  window.AstationRetro=Object.freeze({open,close,isOpen:()=>!!shell});
  window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===shell?.querySelector('iframe')?.contentWindow&&e.data?.source==='astation-retro8'&&e.data.event==='exit')close()});
  const style=document.createElement('style');style.textContent='@keyframes retroOpen{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}html.retro-is-open #console{visibility:hidden}';document.head.append(style);
})();
