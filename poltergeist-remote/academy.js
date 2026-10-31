// Fright Academy: the monster builder, its stats, and the instructor who trains it.
// Loaded before script.js; it reads script.js globals (lightsOn, blindsOn, here, cur, ROOMS, log) only at run time.
const Academy=(function(){
'use strict';
const $=id=>document.getElementById(id),KEY='fright-build';
const OPT={
 species:[
  {n:'Ghost',e:'👻',s:{scare:3,stealth:3,stamina:3},note:'Moves things with hands, voice and head. Flick, swipe and slam your way to a fright.'},
  {n:'Vampire',e:'🧛',s:{scare:4,stealth:3,stamina:2},note:'Burns in light. Switch the lights off and shut the blinds before the sun gets you.'}],
 colour:[
  {n:'Cyan',h:0x19f0ff,c:'#19f0ff',s:{stealth:1}},
  {n:'Magenta',h:0xff2bd6,c:'#ff2bd6',s:{scare:1}},
  {n:'Acid green',h:0xb6ff2a,c:'#b6ff2a',s:{stamina:1}}],
 accessory:[
  {n:'None',e:'',s:{}},
  {n:'Top hat',e:'🎩',s:{scare:1,stealth:-1}},
  {n:'Sunglasses',e:'🕶️',s:{stealth:1,stamina:-1}}]};
const LABEL={species:'Species',colour:'Colour',accessory:'Accessory'},STATS=['scare','stealth','stamina'];
// Objectives per species. a = event name sent by script.js; ok = extra condition.
const COURSE={
 Ghost:[
  {t:'Flick the lights. Pinch, nod, say "Lights" or press L.',a:'lights'},
  {t:'Change the TV channel. Swipe, tilt your head, say "Channel" or press →.',a:'channel'},
  {t:'Slam the door. Make a fist, open your mouth, say "Slam" or press D.',a:'door'},
  {t:'Scare a visitor.',a:'scare'},
  {t:'Scare a visitor so badly they run away.',a:'flee'}],
 Vampire:[
  {t:'Sunlight burns. Switch the lights off.',a:'lightsOff'},
  {t:'Close the blinds. Say "Blinds" or press B.',a:'blinds'},
  {t:'Stay in the dark and slam the door.',a:'door',ok:()=>!lightsOn&&blindsOn},
  {t:'Scare a visitor while keeping your exposure under half.',a:'scare',ok:()=>exposure<50},
  {t:'Make a visitor run away.',a:'flee'}]};
let sel={species:0,colour:0,accessory:0},me=null,idx=0,exposure=0,lastSay='';
try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');Object.keys(sel).forEach(k=>{if(Number.isInteger(s[k])&&s[k]>=0&&s[k]<OPT[k].length)sel[k]=s[k]})}catch(e){}
const A={cd:1,f:1}; // cooldown multiplier (stamina) and fear multiplier (scare), read by script.js

function stats(){
 const r={};STATS.forEach(k=>r[k]=0);
 Object.keys(OPT).forEach(g=>{const s=OPT[g][sel[g]].s;STATS.forEach(k=>r[k]+=s[k]||0)});
 STATS.forEach(k=>r[k]=Math.max(1,Math.min(5,r[k])));return r}
function paint(){
 const sp=OPT.species[sel.species],co=OPT.colour[sel.colour],ac=OPT.accessory[sel.accessory];
 Object.keys(OPT).forEach(k=>$('bv-'+k).textContent=OPT[k][sel[k]].n);
 $('bBody').textContent=sp.e;$('bBody').style.filter='drop-shadow(0 0 22px '+co.c+')';$('bAcc').textContent=ac.e;
 const st=stats();
 $('bStats').innerHTML=STATS.map(k=>'<li><span>'+k[0].toUpperCase()+k.slice(1)+'</span><span role="img" aria-label="'+k+' '+st[k]+' of 5">'+'●'.repeat(st[k])+'○'.repeat(5-st[k])+'</span></li>').join('');
 $('bNote').textContent=sp.note}
function step(k,d){const n=OPT[k].length;sel[k]=(sel[k]+d+n)%n;paint()}
function open(){
 document.body.classList.add('building');document.querySelector('.wrap').inert=true;
 $('builder').hidden=false;paint();$('bGo').focus()}
function go(){
 try{localStorage.setItem(KEY,JSON.stringify(sel))}catch(e){}
 const sp=OPT.species[sel.species],co=OPT.colour[sel.colour],st=stats();
 me={sp:sp.n,name:co.n+' '+sp.n,st};idx=0;exposure=0;lastSay='';
 A.cd=1.6-st.stamina*.2;A.f=.5+st.scare*.25; // stamina shortens cooldowns, scare adds fear per action
 document.body.dataset.species=sp.n.toLowerCase();Room.skin&&Room.skin(co.h);
 $('builder').hidden=true;document.body.classList.remove('building');document.querySelector('.wrap').inert=false;
 $('expWrap').hidden=sp.n!=='Vampire';render();$('coachTitle').focus()}
function say(t){if(t!==lastSay){lastSay=t;$('coachSay').textContent=t}}
function render(){
 if(!me)return;
 const c=COURSE[me.sp],s=c[idx];
 $('coachWho').textContent=me.name+' · Scare '+me.st.scare+' · Stealth '+me.st.stealth+' · Stamina '+me.st.stamina;
 $('coachSteps').innerHTML=c.map((x,i)=>'<li class="'+(i<idx?'done':i===idx?'now':'')+'">'+(i<idx?'✓ ':'')+x.t+'</li>').join('');
 if(!s)say('Training complete! Keep haunting for points, or change your monster.');
 else if(s.a==='scare'||s.a==='flee'){
  const v=here.findIndex(Boolean);
  say(v<0?'Waiting for a visitor to walk in…':v===cur?'A visitor is right here. '+s.t:'A visitor is in the '+ROOMS[v]+'. Go there. '+s.t)}
 else say(s.t)}
function on(ev){
 if(!me)return;const s=COURSE[me.sp][idx];
 if(s&&s.a===ev&&(!s.ok||s.ok())){idx++;Sfx.chime();render()}}
// Vampires burn while the room is lit or the blinds are open. Stealth slows the burn.
setInterval(()=>{
 if(!me||me.sp!=='Vampire'||document.hidden||document.body.classList.contains('building'))return;
 const lit=lightsOn||!blindsOn;
 exposure=Math.max(0,Math.min(100,exposure+(lit?7*(1.6-me.st.stealth*.2):-10)*.2));
 $('exp').value=exposure;
 if(exposure>=100){exposure=0;Sfx.scare();log('You burned in the light! Back into the dark.');say('You burned! Lights off, blinds shut, then try again.')}
},200);
['species','colour','accessory'].forEach(k=>{
 const r=document.createElement('div');r.className='brow';
 r.innerHTML='<span class="blab">'+LABEL[k]+'</span><button type="button" class="bnav" aria-label="Previous '+k+'">‹</button><b id="bv-'+k+'" aria-live="polite"></b><button type="button" class="bnav" aria-label="Next '+k+'">›</button>';
 const b=r.querySelectorAll('button');b[0].onclick=()=>step(k,-1);b[1].onclick=()=>step(k,1);$('bRows').appendChild(r)});
$('bGo').onclick=go;$('reBuild').onclick=open;
open();
return Object.assign(A,{on,render})
})();
