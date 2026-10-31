// Fright Academy: the monster builder, its stats, and the instructor who trains it.
// The instructor sets goals (what to achieve) and gives hints that nudge, but never says which button or gesture to use.
// Loaded before monsters.js, classes.js and script.js; it reads their globals (lightsOn, Monster, Classes, stopHandsFree, resetGame) only at run time.
const Academy=(function(){
'use strict';
const $=id=>document.getElementById(id),KEY='fright-build';
const OPT={
 species:[
  {n:'Ghost',e:'👻',cls:'Haunting 101',s:{scare:3,stealth:3,stamina:3},note:'Moves things without touching them. Fright through household chaos.',done:'Training complete! Keep haunting for points, or change your monster.'},
  {n:'Vampire',e:'🧛',cls:'Scent Matching',s:{scare:4,stealth:3,stamina:2},note:'A creature of the night with a very good nose. Dislikes bright lamps, garlic and reflections.',done:'Training complete! The coven keeps sending orders, or change your monster.'},
  {n:'Witch',e:'🧙',cls:'Potions',s:{scare:3,stealth:2,stamina:4},note:'Hands-on. Gathers odd ingredients and brews them at the cauldron.',done:'Training complete! The orders keep coming, or change your monster.'},
  {n:'Werewolf',e:'🐺',cls:'Dodging',s:{scare:4,stealth:1,stamina:3},note:'Loud and strong, and hunted. Silver is the one thing it can\'t shrug off.',done:'Training complete! The hunters are not done with you, or change your monster.'}],
 colour:[
  {n:'Cyan',h:0x19f0ff,c:'#19f0ff',s:{stealth:1}},
  {n:'Magenta',h:0xff2bd6,c:'#ff2bd6',s:{scare:1}},
  {n:'Acid green',h:0xb6ff2a,c:'#b6ff2a',s:{stamina:1}}],
 accessory:[
  {n:'None',e:'',s:{}},
  {n:'Top hat',e:'🎩',s:{scare:1,stealth:-1}},
  {n:'Sunglasses',e:'🕶️',s:{stealth:1,stamina:-1}}]};
const LABEL={species:'Species',colour:'Colour',accessory:'Accessory'},STATS=['scare','stealth','stamina'];
// Goals per class. a = event name sent by script.js / monsters.js / classes.js, ok(detail) = extra condition, n = how many times.
// t = the goal (an outcome, never an instruction). h = hints, from a gentle nudge to a stronger one.
const COURSE={
 Ghost:[
  {t:'Prove you are real: disturb something in the room.',a:'act',h:['Ghosts touch things without touching them.','The room is full of switches, screens and doors.']},
  {t:'Plunge the room into darkness.',a:'lightsOff',h:['Darkness is a ghost\'s best friend.','Something near the ceiling keeps the room bright.']},
  {t:'Ruin the evening\'s entertainment.',a:'channel',h:['Ghosts love bad television.','The glowing box in the middle has more than one story to tell.']},
  {t:'Make the whole house shudder.',a:'door',h:['Something heavy, wooden and hinged is begging for drama.','Doors are for dramatic exits.']},
  {t:'Give a visitor a proper fright.',a:'scare',h:['Visitors wander into rooms now and then. Be where they are.','Visitors react to what you do to the room around them.']},
  {t:'Send a visitor running out of the house.',a:'flee',h:['Small frights add up, but one huge one finishes the job.','A loud bang does more than a flicker.']}],
 Witch:[
  {t:'Give the cauldron something to chew on.',a:'added',h:['A cauldron is only a pot until something goes in.','Bones, wicks, gourds, bugs, bottles and toadstools all lie around the room. Take one to the pot.']},
  {t:'Brew anything that actually works.',a:'brewed',h:['Your recipe book lists a few things that are known to work.','Everything a recipe names has to be in the pot before you call it finished.','If it sulks and does nothing, it may want some attention from a spoon.']},
  {t:'Fill the order on the card.',a:'order',h:['Customers want what they want, and this one is not in your book. Old witches had to guess too.','Something warm from the autumn patch, something that already bubbles.','The old tales pair a gourd with a flask.']},
  {t:'Brew something fussy about what goes in first.',a:'brewed',ok:d=>d.ordered,h:['Some recipes in your book care about the order, and they show it.','Follow the arrows. A pot does not forgive a shuffled recipe.']},
  {t:'Clear a rush of orders before the candle burns out.',a:'rush',n:3,h:['The middle candle is your clock, and it lights when the first thing goes in the pot.','Do not overthink it. The simplest order on the card is still an order.','A pot full of mistakes costs time. Pour it out and start again.']}],
 Werewolf:[
  {t:'Stay out of the line of fire.',a:'dodge',h:['Watch for the red glint at the window and the door. It shows you where the shot will land.','Whatever the red line touches when the silver comes through is the wrong place to be.']},
  {t:'Dodge five in a row.',a:'dodge',n:5,h:['A shot down your lane wants you in another lane.','A line up high and a line down low cannot be outrun. A werewolf has knees and legs for a reason.','Wait until the silver is on its way before you leave the floor.']},
  {t:'Last thirty seconds without a scratch.',a:'clean',h:['A clean run counts on your panel. One hit starts it over.','Stay near the middle lane. It always has somewhere to go.']},
  {t:'Slip a double shot.',a:'double',h:['Two hunters, two lines. One lane is always left.','Look for the lane that stays dark, not for the lines.']},
  {t:'Survive a full moon.',a:'moonDone',h:['Under a full moon they all come at once, and they do not hesitate. Lose every heart and the round starts over.','A howl at the moon buys a moment of peace, and a moment is all you need.']}],
 Vampire:[
  {t:'Catch a scent.',a:'sniff',h:['A vampire\'s nose finds supper before its fangs do. Visitors wander in now and then.','Drift close to someone and breathe in. It takes a moment.']},
  {t:'Find someone who shares a note with the coven\'s order.',a:'share',h:['Read the order card. It has three notes, but one is enough for now.','Everyone smells different. Try the other rooms.','Garlic hides everything else. Do not waste your breath on those necklaces.']},
  {t:'Bite an exact match.',a:'match',h:['Fangs need the right mood: a dark room and something shining in from outside.','All three notes have to agree with the card, in any order.','A wrong bite will make you sick, so know before you bite.']},
  {t:'Bring the coven three exact matches in a row.',a:'match',n:3,h:['One bad bite and the coven starts counting again.','Stay clear of shiny things on the wall. Vampires and reflections do not mix.','Lamps burn. Keep the rooms you hunt in dark and the window clear.']},
  {t:'Settle a tricky order.',a:'tricky',h:['Two people in this house smell almost the same. Almost.','Sniff everyone before you commit. The difference is a single note.']}]};
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
 $('bNote').textContent=sp.note;$('bClass').textContent='Class: '+sp.cls}
function step(k,d){const n=OPT[k].length;sel[k]=(sel[k]+d+n)%n;paint()}
function open(){
 document.body.classList.add('building');document.querySelector('.wrap').inert=true;
 $('builder').hidden=false;paint();$('bGo').focus()}
function go(){
 try{localStorage.setItem(KEY,JSON.stringify(sel))}catch(e){}
 const sp=OPT.species[sel.species],co=OPT.colour[sel.colour],ac=OPT.accessory[sel.accessory],st=stats();
 Classes.stop();document.body.dataset.species=sp.n.toLowerCase();
 // Hands-free input is the ghost's mode: leaving it releases the camera and the microphone.
 if(sp.n!=='Ghost')stopHandsFree();
 resetGame();
 me={sp:sp.n,name:co.n+' '+sp.n,st,done:sp.done};exposure=0;
 course=COURSE[sp.n].map(o=>Object.assign({c:0},o));idx=0;hintLvl=0;since=performance.now();tipText='';tipUntil=0;
 A.cd=1.6-st.stamina*.2;A.f=.5+st.scare*.25; // stamina shortens cooldowns, scare adds fear per action
 Room.setMonster&&Room.setMonster(sp.n,co.h,ac.n);Monster.setSpecies(sp.n);Classes.start(sp.n,st,sp.cls);
 $('builder').hidden=true;document.body.classList.remove('building');document.querySelector('.wrap').inert=false;
 $('expWrap').hidden=sp.n!=='Vampire';$('exp').value=0;render();$('coachTitle').focus({preventScroll:true});$('room').scrollIntoView({block:'nearest'})}
function setText(id,t){const el=$(id);if(el.textContent!==t)el.textContent=t}
function render(){
 if(!me)return;
 const s=course[idx];
 setText('coachWho',me.name+' · Scare '+me.st.scare+' · Stealth '+me.st.stealth+' · Stamina '+me.st.stamina);
 // Goals still to come stay hidden, so the course is something to discover.
 $('coachSteps').innerHTML=course.map((x,i)=>'<li class="'+(i<idx?'done':i===idx?'now':'')+'">'+(i<idx?'✓ '+x.t:i===idx?x.t+(x.n>1?' ('+x.c+'/'+x.n+')':''):'???')+'</li>').join('');
 setText('coachSay',s?s.t:me.done);
 const tipOn=tipText&&performance.now()<tipUntil;
 setText('coachHint',[tipOn?tipText:'',s&&hintLvl>0?'Hint: '+s.h[Math.min(hintLvl,s.h.length)-1]:''].filter(Boolean).join(' '));
 $('hintBtn').disabled=!s;
 $('hintBtn').textContent=s&&hintLvl>=s.h.length?'No more hints':'Hint'}
function advance(){idx++;hintLvl=0;since=performance.now();tipText='';Sfx.chime();render();Classes.goal(idx)}
function on(ev,d){
 if(!me)return;const s=course[idx];
 if(!s||s.a!==ev||(s.ok&&!s.ok(d||{})))return;
 if(++s.c<(s.n||1)){Sfx.chime();render();return}
 advance()}
// A streak goal starts over (a bad bite, a silver bullet).
function reset(ev){const s=course[idx];if(s&&s.a===ev&&s.c){s.c=0;render()}}
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
return Object.assign(A,{on,render,tip,hurt,reset,goal:()=>idx})
})();
