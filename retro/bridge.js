/* ASTATION RETRO — non-destructive system-app integration for ASTATION OS 7.0 */
(()=>{'use strict';
  const icon='<svg viewBox="0 0 32 32" aria-hidden="true" fill="none"><rect x="3" y="3" width="26" height="26" rx="7" stroke="currentColor" stroke-width="1.8"/><rect x="7" y="7" width="18" height="8" rx="2" fill="currentColor" opacity=".8"/><rect x="7" y="17" width="18" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="19" cy="21" r="2" fill="currentColor"/></svg>';
  let shell=null;
  function profile(){try{const v=JSON.parse(localStorage.getItem('astation_profiles_v7')||'{}');return /^[\w-]{1,40}$/.test(v.active||'')?v.active:'legacy'}catch{return 'legacy'}}
  function open(){
    if(shell)return;
    shell=document.createElement('section');shell.id='ast-retro-shell';shell.setAttribute('aria-label','ASTATION RETRO');
    shell.style.cssText='position:fixed;inset:0;z-index:8000;background:#030a15;display:flex;flex-direction:column;animation:retroOpen .24s ease-out';
    const frame=document.createElement('iframe');frame.title='ASTATION RETRO — Nintendo DS';frame.src='./retro/index.html?profile='+encodeURIComponent(profile());frame.allow='fullscreen;autoplay;gamepad';frame.style.cssText='border:0;flex:1;width:100%;min-height:0';
    shell.append(frame);document.body.append(shell);
    document.documentElement.classList.add('retro-is-open');
  }
  function close(){shell?.remove();shell=null;document.documentElement.classList.remove('retro-is-open')}
  function entry(){
    const nav=document.querySelector('#nav-media');if(nav&&!document.querySelector('#retro-nav')){
      const btn=document.createElement('button');btn.id='retro-nav';btn.className='nav-link';btn.textContent='RETRO';btn.title='ASTATION RETRO — Nintendo DS';btn.addEventListener('click',e=>{e.stopPropagation();open()});nav.after(btn);
    }
    const bar=document.querySelector('#game-tiles');if(bar&&!bar.querySelector('#retro-tile')){
      const btn=document.createElement('button');btn.id='retro-tile';btn.className='tile';btn.style.cssText='background:linear-gradient(145deg,#092a46,#185e86);display:grid;place-items:center;gap:2px;color:#c9f2ff;position:relative';
      btn.innerHTML='<span style="width:44px;height:44px;display:block">'+icon+'</span><small style="position:absolute;bottom:6px;font-size:10px;letter-spacing:1px;font-weight:800">RETRO</small>';
      btn.title='ASTATION RETRO';btn.setAttribute('aria-label','Otwórz ASTATION RETRO');btn.addEventListener('click',e=>{e.stopPropagation();open()});bar.append(btn);
    }
  }
  window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.source==='astation-retro8'&&e.data.event==='exit')close()});
  const st=document.createElement('style');st.textContent='@keyframes retroOpen{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@media(max-width:700px){#retro-nav{font-size:13px!important}}';document.head.append(st);
  const run=()=>{entry();const target=document.querySelector('#game-tiles');if(target)new MutationObserver(()=>{if(!target.querySelector('#retro-tile'))entry()}).observe(target,{childList:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
