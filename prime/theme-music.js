// Original ASTATION compositions. No recordings, melodies, samples, or streams from Spotify or other games.
export const themes={
 system:{title:'A New Horizon',bpm:78,type:'sine',root:[48,45,53,43],mode:[0,4,7,11],lead:[[72,0,3],[74,4,2],[76,8,4],[71,14,2]],beat:false},
 retro:{title:'Sunny Steps',bpm:114,type:'triangle',root:[48,53,45,55,50,53,55,48],mode:[0,4,7,9],lead:[[72,0,1],[76,2,1],[79,3,2],[77,6,1],[74,8,2],[81,11,1],[79,13,2]],beat:true},
 retro_cod:{title:'Midnight Signal',bpm:82,type:'triangle',root:[38,34,41,36,38,31,34,36],mode:[0,3,7,10],lead:[[62,0,4],[65,6,2],[64,9,3],[60,14,2]],beat:true},
 world:{title:'Islands of Light',bpm:88,type:'sine',root:[50,46,53,48,55,50,46,48],mode:[0,4,7,11],lead:[[74,0,3],[81,4,2],[77,7,3],[76,11,2],[84,14,2]],beat:false},
 orbit:{title:'Beyond the Rings',bpm:108,type:'sawtooth',root:[45,41,48,43,45,48,41,43],mode:[0,3,7,12],lead:[[69,0,2],[72,3,1],[76,5,2],[79,8,2],[74,11,1],[72,14,2]],beat:true}
};
const freq=n=>440*2**((n-69)/12);
export function titleFor(id){return (themes[id]||themes.system).title}
export function renderTheme(id,Offline=globalThis.OfflineAudioContext||globalThis.webkitOfflineAudioContext){
 if(!Offline)return Promise.reject(Error('Offline audio unavailable'));
 const p=themes[id]||themes.system,step=60/p.bpm/4,bar=step*16,duration=p.root.length*bar;
 const c=new Offline(1,Math.ceil(duration*22050),22050),bus=c.createGain();bus.gain.value=.8;bus.connect(c.destination);
 function note(m,t,len,vol,kind,filter=2500,attack=.012){if(t>=duration)return;len=Math.min(len,duration-t);if(len<.01)return;const o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();o.type=kind;o.frequency.value=freq(m);f.type='lowpass';f.frequency.value=filter;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+Math.min(attack,len*.35));g.gain.exponentialRampToValueAtTime(.0001,t+len);o.connect(f);f.connect(g);g.connect(bus);o.start(t);o.stop(t+len)}
 function kick(t){const len=Math.min(.15,duration-t);if(len<=.01)return;const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(42,t+len);g.gain.setValueAtTime(.13,t);g.gain.exponentialRampToValueAtTime(.0001,t+len);o.connect(g);g.connect(bus);o.start(t);o.stop(t+len)}
 for(let b=0;b<p.root.length;b++){const r=p.root[b],t=b*bar,offset=r-p.root[0];for(const n of p.mode)note(r+12+n,t,bar*.95,id==='retro_cod'?.032:.023,'sine',1100,.18);
  for(let j=0;j<16;j++){if(id==='retro'||id==='orbit'){const a=p.mode[[0,2,1,3,2,1,3,0][j%8]];note(r+12+a,t+j*step,step*.72,id==='orbit'?.038:.047,p.type,id==='orbit'?950:2100)}
   else if(j%4===0)note(r+p.mode[(j/4)%4],t+j*step,step*3.6,.065,'triangle',720,.025);
   if(p.beat&&j%4===0)kick(t+j*step);
   if(p.beat&&j%4===2)note(r-12,t+j*step,step*.65,.045,'triangle',700);
  }
  for(const [n,pos,l] of p.lead){const m=n+offset+(b%4===3?-2:0);note(m,t+pos*step,l*step*.88,id==='world'?.10:.075,id==='orbit'?'triangle':p.type,3100,.023);if(id==='world'||id==='system'){note(m+12,t+(pos+.4)*step,Math.min(l*step*.8,bar-pos*step),.026,'sine',3500,.03)}}
 }
 return c.startRendering();
}
