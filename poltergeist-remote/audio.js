// Ghost sounds, synthesised in the browser with the Web Audio API: no audio files to download.
// Exposes window.Sfx for script.js and wires the Mute button and Volume slider on the TV.
(function(){
'use strict';
const AC=window.AudioContext||window.webkitAudioContext,SKEY='poltergeist-sound';
const $=id=>document.getElementById(id);
let ctx=null,master=null,revIn=null,noiseBuf=null,windG=null,windF=null,started=false;
let vol=.6,muted=false,heartOn=false,heartT0=0,bump=0,heartTimer=0;
try{const s=JSON.parse(localStorage.getItem(SKEY)||'{}');if(typeof s.vol==='number')vol=Math.min(1,Math.max(0,s.vol));muted=s.muted===true}catch(e){}
const level=()=>muted?0:vol*vol*1.4; // squared so the slider feels even
const save=()=>{try{localStorage.setItem(SKEY,JSON.stringify({vol,muted}))}catch(e){}};
const rnd=(a,b)=>a+Math.random()*(b-a);

// ---------- Small node helpers ----------
const T=()=>ctx.currentTime;
function gain(v){const g=ctx.createGain();g.gain.value=v;return g}
function filt(type,f,q){const b=ctx.createBiquadFilter();b.type=type;b.frequency.value=f;if(q!==undefined)b.Q.value=q;return b}
function osc(type,f,t,dur){const o=ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);o.start(t);o.stop(t+dur);return o}
function noise(t,dur){const s=ctx.createBufferSource();s.buffer=noiseBuf;s.loop=true;s.start(t,rnd(0,1.5));s.stop(t+dur);return s}
// Quick attack, exponential decay.
function env(g,t,a,peak,d){g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d)}
// Send a node to the mix, plus some of it to the echo (reverb) for a haunted-room tail.
function out(n,wet){n.connect(master);if(wet){const w=gain(wet);n.connect(w);w.connect(revIn)}}

// ---------- Ambience: drone, wind, creaks ----------
function drone(){
 const lp=filt('lowpass',240,3),g=gain(.2);lp.connect(g);out(g,.25);
 [[55,'sawtooth',.4],[55.35,'sawtooth',.4],[82.4,'sine',.5],[110.3,'triangle',.25]].forEach(([f,ty,v])=>{
  const o=ctx.createOscillator();o.type=ty;o.frequency.value=f;const x=gain(v);o.connect(x);x.connect(lp);o.start()});
 const l=ctx.createOscillator(),lg=gain(110);l.frequency.value=.06;l.connect(lg);lg.connect(lp.frequency);l.start()}
function wind(){
 const s=ctx.createBufferSource();s.buffer=noiseBuf;s.loop=true;
 windF=filt('bandpass',500,.8);windG=gain(.01);s.connect(windF);windF.connect(windG);out(windG,.4);s.start()}
function gust(){
 const t=T(),dur=rnd(3,6.5);
 windG.gain.setTargetAtTime(rnd(.05,.12),t,dur*.2);windG.gain.setTargetAtTime(.01,t+dur*.5,dur*.2);
 windF.frequency.setTargetAtTime(rnd(300,900),t,dur*.3);
 setTimeout(gust,(dur+rnd(1,5))*1000)}
function creak(){
 if(document.hidden||!started)return;
 const t=T(),dur=rnd(.5,1.3),f=rnd(60,130);
 const o=osc('sawtooth',f,t,dur);o.frequency.linearRampToValueAtTime(f*rnd(.6,1.5),t+dur);
 const bp=filt('bandpass',rnd(350,900),5),tr=gain(.6),g=gain(0);
 const l=osc('sine',rnd(14,26),t,dur),lg=gain(.4);l.connect(lg);lg.connect(tr.gain); // stuttery wobble
 o.connect(bp);bp.connect(tr);tr.connect(g);env(g,t,.08,.3,dur);out(g,.5)}
function creakLoop(){setTimeout(()=>{creak();creakLoop()},rnd(7000,17000))}

// ---------- One-shot sounds ----------
function chime(){const t=T();[[880,0],[1320,.14]].forEach(([f,dt])=>{
 const o=osc('sine',f,t+dt,.9),g=gain(0);env(g,t+dt,.005,.22,.7);o.connect(g);out(g,.5)})}
// "Whoo": a gliding, wobbling tone shaped like an "oo" vowel. near = the visitor is in your room.
function whoo(near){
 const t=T(),d=1.8,o=osc('sawtooth',240,t,d+.1);
 o.frequency.linearRampToValueAtTime(330,t+.5);o.frequency.linearRampToValueAtTime(170,t+d);
 const v=osc('sine',5.5,t,d+.1),vg=gain(7);v.connect(vg);vg.connect(o.frequency);
 const a=filt('bandpass',310,5),b=filt('bandpass',870,6),bg=gain(.3),g=gain(0);
 o.connect(a);o.connect(b);b.connect(bg);a.connect(g);bg.connect(g);env(g,t,.4,near?1.1:.7,1.35);out(g,1)}
function thump(t,v){
 const o=osc('sine',78,t,.25);o.frequency.exponentialRampToValueAtTime(36,t+.16);const g=gain(0);env(g,t,.006,v,.17);o.connect(g);out(g);
 const h=osc('triangle',150,t,.2);h.frequency.exponentialRampToValueAtTime(70,t+.12);const hg=gain(0);env(hg,t,.006,v*.35,.1);h.connect(hg);out(hg)}
// Heartbeat: lub-dub that speeds up the longer a visitor is in your room, and jumps when you scare them.
function beat(){
 if(!heartOn||!started)return;
 const k=Math.min(1,(performance.now()-heartT0)/25000+bump);
 if(!document.hidden){const t=T();thump(t,.55+.4*k);thump(t+.19-.05*k,.35+.3*k)}
 bump=Math.max(0,bump-.04);
 heartTimer=setTimeout(beat,60000/(60+k*85))}
function heart(on){
 if(on&&!heartOn){heartOn=true;heartT0=performance.now();bump=0;if(started&&!heartTimer)beat()}
 else if(!on&&heartOn){heartOn=false;clearTimeout(heartTimer);heartTimer=0}}
// Scare sting: clashing notes plus a burst of noise. big = a visitor ran away.
function sting(big){
 const t=T(),d=big?1.8:.9,lp=filt('lowpass',3200,1),g=gain(0);
 [[466.2,.5],[493.9,.5],[740,.35],[233,.6]].forEach(([f,v],i)=>{
  const o=osc(i===3?'sine':'sawtooth',f,t,d+.1);o.frequency.exponentialRampToValueAtTime(f*(big?.88:.96),t+d);
  const x=gain(v);o.connect(x);x.connect(lp)});
 lp.connect(g);env(g,t,.006,big?.5:.38,d);out(g,.6);
 const n=noise(t,.25),nf=filt('highpass',1800),ng=gain(0);n.connect(nf);nf.connect(ng);env(ng,t,.003,.4,.2);out(ng,.2)}
function gasp(){
 const t=T(),n=noise(t,.5),bp=filt('bandpass',900,1.2),g=gain(0);
 bp.frequency.setValueAtTime(900,t);bp.frequency.exponentialRampToValueAtTime(2300,t+.3);
 n.connect(bp);bp.connect(g);env(g,t,.1,1.3,.3);out(g,.35)}
function scream(dur,base){
 const t=T(),f=base*rnd(.9,1.2);
 const o=osc('sawtooth',f,t,dur+.1);o.frequency.linearRampToValueAtTime(f*2.1,t+dur*.25);o.frequency.linearRampToValueAtTime(f*1.6,t+dur);
 const vib=osc('sine',7,t,dur+.1),vg=gain(f*.03);vib.connect(vg);vg.connect(o.frequency);
 const n=noise(t,dur+.1),ng=gain(.25);
 const sh=ctx.createWaveShaper(),k=new Float32Array(256);for(let i=0;i<256;i++)k[i]=Math.tanh((i/128-1)*4);sh.curve=k;
 const f1=filt('bandpass',950,4),f2=filt('bandpass',2600,6),mix=gain(1),g2=gain(.5),g=gain(0);
 o.connect(sh);n.connect(ng);ng.connect(sh);sh.connect(f1);sh.connect(f2);f1.connect(mix);f2.connect(g2);g2.connect(mix);
 mix.connect(g);env(g,t,.03,.9,dur);out(g,.5)}
function slam(){
 const t=T(),o=osc('sine',130,t,.8);o.frequency.exponentialRampToValueAtTime(28,t+.5);
 const g=gain(0);env(g,t,.004,1,.65);o.connect(g);out(g,.5);
 const n=noise(t,.4),lp=filt('lowpass',700),ng=gain(0);n.connect(lp);lp.connect(ng);env(ng,t,.002,.9,.3);out(ng,.7);
 const r=osc('triangle',196,t,1.2),rg=gain(0);env(rg,t,.004,.12,1.1);r.connect(rg);out(rg,.9)}
function click(on){
 const t=T(),n=noise(t,.05),hp=filt('highpass',2200),g=gain(0);n.connect(hp);hp.connect(g);env(g,t,.001,.8,.025);out(g,.1);
 const o=osc('square',on?2100:1400,t,.03),og=gain(0);env(og,t,.001,.1,.02);o.connect(og);out(og);
 const th=osc('sine',170,t,.12);th.frequency.exponentialRampToValueAtTime(80,t+.08);const tg=gain(0);env(tg,t,.002,.3,.07);th.connect(tg);out(tg)}
// Channel change: a short burst of fluttering static and a blip.
function tv(){
 const t=T(),d=.38,n=noise(t,d),bp=filt('bandpass',2800,.5),g=gain(0);n.connect(bp);bp.connect(g);
 g.gain.setValueAtTime(.0001,t);for(let i=0;i<12;i++)g.gain.setValueAtTime(rnd(.3,1.3),t+i*.03);g.gain.linearRampToValueAtTime(.0001,t+d);
 out(g,.15);
 const b=osc('sine',1800,t,.1),bg=gain(0);b.frequency.exponentialRampToValueAtTime(420,t+.09);env(bg,t,.004,.15,.08);b.connect(bg);out(bg)}

// ---------- Start, mute, volume ----------
function build(){
 ctx=new AC();
 const comp=ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=6;
 master=gain(level());master.connect(comp);comp.connect(ctx.destination);
 noiseBuf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
 const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 const conv=ctx.createConvolver(),len=ctx.sampleRate*1.8|0,ir=ctx.createBuffer(2,len,ctx.sampleRate);
 for(let c=0;c<2;c++){const x=ir.getChannelData(c);for(let i=0;i<len;i++)x[i]=(Math.random()*2-1)*Math.pow(1-i/len,3)}
 conv.buffer=ir;revIn=gain(.7);revIn.connect(conv);conv.connect(master);
 drone();wind();gust();creakLoop()}
// Browsers only allow sound after a click or key press, so this runs from those.
function start(){
 if(!AC)return;
 try{if(!ctx)build();if(ctx.state!=='running')ctx.resume();started=true;if(heartOn&&!heartTimer)beat()}catch(e){}
 paintUI()}
function apply(){if(master)master.gain.setTargetAtTime(level(),ctx.currentTime,.03)}
function paintUI(){
 const mb=$('muteBtn'),vs=$('vol'),note=$('sndNote');if(!mb||!vs)return;
 if(!AC){mb.disabled=vs.disabled=true;if(note)note.textContent='Sound is not supported in this browser.';return}
 mb.setAttribute('aria-pressed',muted);vs.value=Math.round(vol*100);
 if(note)note.textContent=!started?'Sound starts at your first click.':muted||!vol?'Muted':'Sound on'}
const mb=$('muteBtn'),vs=$('vol');
if(mb)mb.onclick=()=>{muted=!muted;if(!muted&&!vol)vol=.5;save();apply();paintUI()};
if(vs)vs.oninput=()=>{vol=vs.value/100;if(muted&&vol>0)muted=false;save();apply();paintUI()};
const unlock=()=>{start();if(ctx&&ctx.state==='running'){removeEventListener('pointerdown',unlock);removeEventListener('keydown',unlock)}};
addEventListener('pointerdown',unlock);addEventListener('keydown',unlock);
// Silence a hidden tab instead of droning in the background.
document.addEventListener('visibilitychange',()=>{if(!ctx||!started)return;if(document.hidden)ctx.suspend();else ctx.resume()});
paintUI();

// Sounds are skipped until the first click and while the tab is hidden.
const play=f=>(...a)=>{if(started&&!document.hidden)try{f(...a)}catch(e){}};
window.Sfx={
 start,heart,
 click:play(click),tv:play(tv),slam:play(slam),chime:play(chime),whoo:play(whoo),
 scare:play(()=>{sting(false);bump=Math.min(.6,bump+.25);if(Math.random()<.5)gasp();else scream(.7,650)}),
 flee:play(()=>{sting(true);scream(1.5,560);bump=Math.min(.6,bump+.3)})
};
})();
