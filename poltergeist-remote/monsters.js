// Monster powers: how each species scares (or converts) visitors.
// Loaded after academy.js and before script.js. It reads script.js globals (lightsOn, blindsOn, here, cur, act, note, haunt, award, sync)
// only at run time, and drives the 3D side through window.Room.
const Monster=(function(){
'use strict';
const $=id=>document.getElementById(id);
const POWER={Ghost:'Wail',Vampire:'Bite',Witch:'Cast',Werewolf:'Howl'};
// Base fear a plain room action adds, per species. 0 = it does not scare them at all.
const FEAR={Ghost:{lights:1,channel:1,door:3},Vampire:{lights:0,channel:0,door:.5},Witch:{lights:.5,channel:.5,door:1},Werewolf:{lights:0,channel:0,door:2}};
const ITEMS={skull:{e:'💀',n:'skull'},candle:{e:'🕯️',n:'candle'},pumpkin:{e:'🎃',n:'pumpkin'},spider:{e:'🕷️',n:'spider'},potion:{e:'🧪',n:'potion'}};
const WORDS=[[/\b(skull|bone|bones)\b/,'skull'],[/\b(candle|candles|flame|wick)\b/,'candle'],[/\b(pumpkin|gourd)\b/,'pumpkin'],[/\b(spider|bug)\b/,'spider'],[/\b(potion|cauldron|brew)\b/,'potion']];
// The witch's ten pairings (keys are the two ingredients, sorted). f = base fear, c = spell colour.
const SPELLS={
 'candle+potion':{n:'Glow Brew',f:1.5,c:0x7dffd0},
 'candle+pumpkin':{n:'Jack-o-Flare',f:2,c:0xff9a1f},
 'candle+skull':{n:'Hex of Dread',f:2.5,c:0xff3030},
 'candle+spider':{n:'Web of Flames',f:2,c:0xffb04a},
 'potion+pumpkin':{n:'Pumpkin Spice Hex',f:1,c:0xffc27a},
 'potion+skull':{n:'Bone Broth Curse',f:1.5,c:0xd8ffcf},
 'potion+spider':{n:'Toad Touch',f:3,c:0x7dff6a},
 'pumpkin+skull':{n:'Gourd Ghoul',f:1.5,c:0xffd070},
 'pumpkin+spider':{n:'Itsy Gourd',f:1,c:0xc59cff},
 'skull+spider':{n:'Creepy Crawl',f:2,c:0xb28cff}};
const DW=900,REACH=.3; // hover time to grab (ms) and how close counts as "in reach"
let sp=null,slots=[],dwellK=null,dwell=0,wary=0,mirrorAt=0,nearFor=false,tipped={};
const lock={};
const sc=b=>b<3?b*Academy.f:b; // a little fear is scaled by the monster's Scare stat; a big one is always big

function powerName(){return POWER[sp]||'Wail'}
function fear(kind){return sc(((FEAR[sp]||FEAR.Ghost)[kind])||0)}
function itemIn(t){for(const [re,k] of WORDS)if(re.test(t))return k;return null}
function tipOnce(k,t){if(tipped[k])return;tipped[k]=1;Academy.tip(t)}
function paintHeld(){
 const el=$('held');
 el.textContent=slots.length?'Holding: '+slots.map(k=>ITEMS[k].e).join(' ')+(slots.length===2?' ✨ ready':''):'Hands empty';
}
function setSpecies(n){
 sp=n;slots=[];dwellK=null;dwell=0;wary=0;nearFor=false;tipped={};
 Room.hold&&Room.hold([]);Room.ring&&Room.ring(null);
 $('bP').textContent=POWER[n]+' (P)';$('bG').hidden=n!=='Witch';
 $('held').hidden=n!=='Witch';paintHeld()}

// ---------- Witch: grab ingredients, then cast ----------
function grab(k,src){
 if(sp!=='Witch'){note(sp==='Ghost'?'Your hand passes right through it.':'You have no use for trinkets.',src);return}
 k=k||(Room.hover&&Room.hover(.34));
 if(!k){note('Your fingers close on thin air.',src);return}
 if(slots.includes(k)){note('You already hold the '+ITEMS[k].n+'.',src);return}
 if(slots.length>=2){const d=slots.shift();lock[d]=performance.now()+3000} // hands full: the oldest ingredient drops
 slots.push(k);Room.hold(slots);Sfx.pluck();paintHeld();
 act('Grabbed the '+ITEMS[k].n+' '+ITEMS[k].e,src);
 Academy.on('grab');if(slots.length===2)Academy.on('ready')}
function cast(src){
 if(slots.length<2){Sfx.fizzle();note(slots.length?'One ingredient alone only fizzles.':'Your hands are empty. The spell fizzles.',src);return}
 const v=Room.visitor();
 if(!v||v.state!=='walk'){note('No one here to hex. You keep your ingredients.',src);return}
 const s=SPELLS[slots.slice().sort().join('+')];
 Sfx.spell();Room.cast(s.c);
 slots=[];Room.hold(slots);paintHeld();
 act(s.n+' cast on a visitor',src);
 Academy.on('cast');Academy.on('spell',{fear:s.f});
 haunt(sc(s.f),s.n)}

// ---------- Vampire: bite in a moonlit dark room, avoid garlic and mirrors ----------
function bite(src){
 const v=Room.visitor(),now=performance.now();
 if(!v||v.state!=='walk'){note('Your fangs snap at empty air.',src);return}
 if(now<wary){note('They are on their guard. Give it a moment.',src);return}
 if(v.d>=REACH){note('Too far away. They have not even noticed you.',src);return}
 if(lightsOn){Academy.hurt(12);note('The lamp stings your gums. Not like this.',src);return}
 if(blindsOn){note('Your fangs feel dull. Something is missing from the night.',src);return}
 if(v.garlic){wary=now+4500;Academy.hurt(10);Sfx.fizzle();Academy.on('garlic');
  tipOnce('garlic','That smell! Some people wear protection around their necks.');
  note('GARLIC! You reel back, gagging.',src);return}
 Sfx.bite();
 if(Room.bite()==='turned'){here[cur]=false;sync();award(80);Sfx.flee();
  act('Turned! A new vampire stalks out of the house. +80',src);Academy.on('turned')}
 else{act('Bitten! They sway, dizzy…',src);Academy.on('bite')}}
function mirror(now){
 mirrorAt=now+3500;wary=now+6000;Room.mirrorFlash();Sfx.shatter();Academy.hurt(25);
 tipOnce('mirror','The glass on the wall shows nothing where you hover. That makes people nervous.');
 note('A mirror! Nothing is reflected where you float. Everyone is on guard now.','game')}

// ---------- Werewolf: howl at the moon ----------
function howl(src){
 if(lightsOn){Sfx.fizzle();note('Your howl is lost in the lamplight. It sounds like a sad dog.',src);return}
 if(blindsOn){Sfx.fizzle();note('There is no moon in sight. The howl falls flat.',src);return}
 Sfx.howl();Room.moon();
 act('AWOOOO! The moon howls back.',src);Academy.on('howl');
 haunt(sc(2),'Howl')}

// ---------- Ghost: wail ----------
function wail(src){
 Sfx.whoo(true);act('You wail through the walls.',src);Academy.on('wail');
 haunt(sc(lightsOn?.5:1),'Wail')}

function use(src){
 if(sp==='Vampire')bite(src);else if(sp==='Witch')cast(src);else if(sp==='Werewolf')howl(src);else wail(src)}

// Hovering is how a witch picks things up; a vampire's reach decides who it can bite, and a mirror gives it away.
setInterval(()=>{
 if(!sp||document.hidden||document.body.classList.contains('building'))return;
 const now=performance.now();
 if(sp==='Witch'){
  const k=Room.hover(.28);
  if(k&&!slots.includes(k)&&now>(lock[k]||0)){
   if(k!==dwellK){dwellK=k;dwell=0}else dwell+=80;
   Room.ring(k,Math.min(1,dwell/DW));
   if(dwell>=DW){dwell=0;dwellK=null;grab(k,'hover')}
  }else{dwellK=null;dwell=0;Room.ring(null)}
 }else if(sp==='Vampire'){
  const v=Room.visitor();
  if(v&&v.state==='walk'&&v.d<REACH){if(!nearFor){nearFor=true;Academy.on('near')}}else nearFor=false;
  if(Room.mirrorNear()&&now>mirrorAt)mirror(now)}
},80);

return{setSpecies,fear,use,grab,itemIn,powerName}
})();
