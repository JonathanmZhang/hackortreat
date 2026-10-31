// Fright Academy: the monster builder, its stats, and the instructor who trains it.
// The instructor sets goals (what to achieve) and gives hints that nudge, but never says which button or gesture to use.
// Loaded before monsters.js and script.js; it reads script.js globals (lightsOn) only at run time.
const Academy=(function(){
'use strict';
const $=id=>document.getElementById(id),KEY='fright-build';
const OPT={
 species:[
  {n:'Ghost',e:'👻',s:{scare:3,stealth:3,stamina:3},note:'Moves things without touching them. Fright through household chaos.'},
  {n:'Vampire',e:'🧛',s:{scare:4,stealth:3,stamina:2},note:'A creature of the night who wants company. Dislikes bright lamps, garlic and reflections.'},
  {n:'Witch',e:'🧙',s:{scare:3,stealth:2,stamina:4},note:'Hands-on. Gathers odd ingredients and turns them into hexes.'},
  {n:'Werewolf',e:'🐺',s:{scare:4,stealth:1,stamina:3},note:'Loud and strong. Something changes when the moon is out.'}],
 colour:[
  {n:'Cyan',h:0x19f0ff,c:'#19f0ff',s:{stealth:1}},
  {n:'Magenta',h:0xff2bd6,c:'#ff2bd6',s:{scare:1}},
  {n:'Acid green',h:0xb6ff2a,c:'#b6ff2a',s:{stamina:1}}],
 accessory:[
  {n:'None',e:'',s:{}},
  {n:'Top hat',e:'🎩',s:{scare:1,stealth:-1}},
  {n:'Sunglasses',e:'🕶️',s:{stealth:1,stamina:-1}}]};
const LABEL={species:'Species',colour:'Colour',accessory:'Accessory'},STATS=['scare','stealth','stamina'];
// Goals per species. a = event name sent by script.js / monsters.js, ok(detail) = extra condition, n = how many times.
// t = the goal (an outcome, never an instruction). h = hints, from a gentle nudge to a stronger one.
const COURSE={
 Ghost:[
  {t:'Prove you are real: disturb something in the room.',a:'act',h:['Ghosts touch things without touching them.','The room is full of switches, screens and doors.']},
  {t:'Plunge the room into darkness.',a:'lightsOff',h:['Darkness is a ghost\'s best friend.','Something near the ceiling keeps the room bright.']},
  {t:'Ruin the evening\'s entertainment.',a:'channel',h:['Ghosts love bad television.','The glowing box in the middle has more than one story to tell.']},
  {t:'Make the whole house shudder.',a:'door',h:['Something heavy, wooden and hinged is begging for drama.','Doors are for dramatic exits.']},
  {t:'Give a visitor a proper fright.',a:'scare',h:['Visitors wander into rooms now and then. Be where they are.','Visitors react to what you do to the room around them.']},
  {t:'Send a visitor running out of the house.',a:'flee',h:['Small frights add up, but one huge one finishes the job.','A loud bang does more than a flicker.']}],
 Vampire:[
  {t:'Make the room safe for a creature of the night.',a:'lightsOff',h:['Vampires and bright lamps do not mix. Watch your exposure bar.','The brightness comes from something you can switch.']},
  {t:'Get close to a visitor without being noticed.',a:'near',h:['First you need company. Visitors wander in now and then.','You are a floating shape. Go to them.']},
  {t:'Sink your fangs into someone.',a:'bite',h:['Fangs need an invitation: something outside should be shining in.','Dark room, moonlit window, someone within reach.','Not everyone is safe to bite. Look closely at their necks.']},
  {t:'Turn a visitor into a vampire.',a:'turned',h:['One bite only makes them dizzy. How many would make them yours?','Dizziness wears off. Do not wait too long.']},
  {t:'Convert three visitors to your side.',a:'turned',n:3,h:['Stay clear of shiny things on the wall. Vampires and reflections do not mix.','Garlic wearers are not worth the trouble.','Keep the lights low and the window open.']}],
 Witch:[
  {t:'Get a feel for your surroundings.',a:'grab',h:['Witches work with ingredients, not switches.','Hold your hand over something in the room and wait.']},
  {t:'Gather what a spell needs.',a:'ready',h:['One ingredient never made a good spell.','Bones, flames, gourds, bugs and bubbling things all lie around the room.']},
  {t:'Unleash your first spell.',a:'cast',h:['Magic is meant to be released, and it needs a target.','Spells are best aimed at a visitor.']},
  {t:'Find a pairing with real power.',a:'spell',ok:d=>d.fear>=2.5,h:['Some combinations are old favourites among witches.','Bone, wick, gourd, spider and brew: ten pairings, and not all of them bite.','Creepy things together tend to hit hardest.']},
  {t:'Send a visitor running with your magic.',a:'flee',h:['A weak hex only rattles them.','The strongest pairings can finish the job in one go.']}],
 Werewolf:[
  {t:'Set a moonlit scene.',a:'lightsOff',ok:()=>!blindsOn,h:['Werewolves love dark rooms and bright moons.','Is the moon visible from where you stand?']},
  {t:'Let the beast out.',a:'howl',h:['The moon is calling. Answer it.','Your voice is your weapon, but only once the moon is in view.']},
  {t:'Terrify a visitor.',a:'scare',h:['A howl is better with an audience.','Someone has to be in the room to be scared.']},
  {t:'Send a visitor running out of the house.',a:'flee',h:['Claws on the door make a statement.','Combine a loud howl with something that goes bang.']}]};
let sel={species:0,colour:0,accessory:0},me=null,course=[],idx=0,exposure=0,hintLvl=0,since=0,tipText='',tipUntil=0;
try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');Object.keys(sel).forEach(k=>{if(Number.isInteger(s[k])&&s[k]>=0&&s[k]<OPT[k].length)sel[k]=s[k]})}catch(e){}
const A={cd:1,f:1}; // cooldown multiplier (stamina) and fear multiplier (scare), read by script.js and monsters.js

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
 const sp=OPT.species[sel.species],co=OPT.colour[sel.colour],ac=OPT.accessory[sel.accessory],st=stats();
 me={sp:sp.n,name:co.n+' '+sp.n,st};exposure=0;
 course=COURSE[sp.n].map(o=>Object.assign({c:0},o));idx=0;hintLvl=0;since=performance.now();tipText='';tipUntil=0;
 A.cd=1.6-st.stamina*.2;A.f=.5+st.scare*.25; // stamina shortens cooldowns, scare adds fear per action
 document.body.dataset.species=sp.n.toLowerCase();
 Room.setMonster&&Room.setMonster(sp.n,co.h,ac.n);Monster.setSpecies(sp.n);
 $('builder').hidden=true;document.body.classList.remove('building');document.querySelector('.wrap').inert=false;
 $('expWrap').hidden=sp.n!=='Vampire';$('exp').value=0;render();$('coachTitle').focus()}
function setText(id,t){const el=$(id);if(el.textContent!==t)el.textContent=t}
function render(){
 if(!me)return;
 const s=course[idx];
 setText('coachWho',me.name+' · Scare '+me.st.scare+' · Stealth '+me.st.stealth+' · Stamina '+me.st.stamina);
 // Goals still to come stay hidden, so the course is something to discover.
 $('coachSteps').innerHTML=course.map((x,i)=>'<li class="'+(i<idx?'done':i===idx?'now':'')+'">'+(i<idx?'✓ '+x.t:i===idx?x.t+(x.n>1?' ('+x.c+'/'+x.n+')':''):'???')+'</li>').join('');
 setText('coachSay',s?s.t:'Training complete! Keep haunting for points, or change your monster.');
 const tipOn=tipText&&performance.now()<tipUntil;
 setText('coachHint',tipOn?tipText:s&&hintLvl>0?'Hint: '+s.h[Math.min(hintLvl,s.h.length)-1]:'');
 $('hintBtn').disabled=!s;
 $('hintBtn').textContent=s&&hintLvl>=s.h.length?'No more hints':'Hint'}
function advance(){idx++;hintLvl=0;since=performance.now();tipText='';Sfx.chime();render()}
function on(ev,d){
 if(!me)return;const s=course[idx];
 if(!s||s.a!==ev||(s.ok&&!s.ok(d||{})))return;
 if(++s.c<(s.n||1)){Sfx.chime();render();return}
 advance()}
// A one-off in-world remark from the instructor (shown for a few seconds).
function tip(t){if(!me)return;tipText=t;tipUntil=performance.now()+9000;render()}
// Vampire exposure from the monster side (a mirror's glare, a lamp, garlic).
function hurt(n){if(!me||me.sp!=='Vampire')return;exposure=Math.min(100,exposure+n);$('exp').value=exposure}
$('hintBtn').onclick=()=>{const s=course[idx];if(!s)return;hintLvl=Math.min(s.h.length,hintLvl+1);since=performance.now();render()}
// Stuck for a while? The instructor offers a nudge on its own.
setInterval(()=>{
 if(!me||document.hidden||document.body.classList.contains('building'))return;
 const s=course[idx],now=performance.now();
 if(tipUntil&&now>tipUntil){tipUntil=0;render()}
 if(!s)return;
 if(hintLvl<1&&now-since>25000){hintLvl=1;render()}
 else if(hintLvl<2&&hintLvl<s.h.length&&now-since>60000){hintLvl=2;render()}
},1000);
// Vampires burn while the room is lit. Stealth slows the burn.
setInterval(()=>{
 if(!me||me.sp!=='Vampire'||document.hidden||document.body.classList.contains('building'))return;
 exposure=Math.max(0,Math.min(100,exposure+(lightsOn?7*(1.6-me.st.stealth*.2):-10)*.2));
 $('exp').value=exposure;
 if(exposure>=100){exposure=0;Sfx.scare();log('You burned in the light! Back into the dark.');tip('You burned! Somewhere in this room, a lamp is to blame.')}
},200);
['species','colour','accessory'].forEach(k=>{
 const r=document.createElement('div');r.className='brow';
 r.innerHTML='<span class="blab">'+LABEL[k]+'</span><button type="button" class="bnav" aria-label="Previous '+k+'">‹</button><b id="bv-'+k+'" aria-live="polite"></b><button type="button" class="bnav" aria-label="Next '+k+'">›</button>';
 const b=r.querySelectorAll('button');b[0].onclick=()=>step(k,-1);b[1].onclick=()=>step(k,1);$('bRows').appendChild(r)});
$('bGo').onclick=go;$('reBuild').onclick=open;
open();
return Object.assign(A,{on,render,tip,hurt})
})();
