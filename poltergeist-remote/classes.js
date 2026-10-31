// Fright Academy classes: each species takes its own class. The Ghost's Haunting 101 is script.js + monsters.js; Potions, Dodging and Scent Matching live here.
// Goals and hints are in COURSE in academy.js. This file owns each class's rules, keys, buttons, panel and controls table, and cleans all of it up in stop().
// Loaded after academy.js and monsters.js and before script.js. It reads script.js globals (lights, blinds, goRoom, act, note, log, award, ready, sync, here, cur, lightsOn, blindsOn) only at run time.
const Classes=(function(){
'use strict';
const $=id=>document.getElementById(id);
let C=null,st={scare:3,stealth:3,stamina:3},timers=[],last=0;
const later=(f,ms)=>timers.push(setTimeout(f,ms));
const setT=(id,t)=>{const el=$(id);if(el&&el.textContent!==t)el.textContent=t};
const pick=a=>a[Math.random()*a.length|0];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const tippedOnce={};
function tipOnce(k,t){if(tippedOnce[k])return;tippedOnce[k]=1;Academy.tip(t)}
function held(t){const el=$('held');el.hidden=!t;if(el.textContent!==(t||''))el.textContent=t||''} // only on change: it is a live region
function btn(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;$('classBtns').appendChild(b);return b}

// ---------- Witch: Potions ----------
// Stats: stamina = a longer rush timer, scare = more points per potion, stealth = fewer stirs needed.
const ING={skull:{e:'💀',n:'skull'},candle:{e:'🕯️',n:'candle'},pumpkin:{e:'🎃',n:'pumpkin'},spider:{e:'🕷️',n:'spider'},potion:{e:'🧪',n:'flask'},toadstool:{e:'🍄',n:'toadstool'}},INGK=Object.keys(ING);
// parts = what goes in. order = they must go in that order. stir = base stirs (stealth lowers it). hidden = not in the book until brewed. c = colour.
const RECIPES=[
 {n:'Glow Brew',parts:['candle','potion'],c:0x7dffd0},
 {n:'Jack-o-Flare',parts:['candle','pumpkin'],stir:3,c:0xff9a1f},
 {n:'Hex of Dread',parts:['skull','candle','spider'],order:true,c:0xff3030},
 {n:'Toad Touch',parts:['potion','toadstool','spider'],order:true,stir:4,c:0x7dff6a},
 {n:'Pumpkin Spice Hex',parts:['pumpkin','potion'],hidden:true,c:0xffc27a},
 {n:'Creepy Crawl',parts:['skull','spider'],hidden:true,stir:3,c:0xb28cff}];
const RUSH_GOAL=4,rushMs=()=>50000+st.stamina*10000,potPts=()=>20+st.scare*5,stirsFor=r=>r.stir?Math.max(1,r.stir-(st.stealth>>1)):0;
let W=null;
const sameSet=(a,b)=>a.length===b.length&&a.every(k=>b.includes(k));
function witchPaint(){
 held('Order: '+W.order+' · '+(W.pot.length?'Cauldron: '+W.pot.map(k=>ING[k].e).join(' ')+(W.stirs?' · stirred '+W.stirs+'×':''):'Cauldron empty')+(W.held?' · holding '+ING[W.held].e:''));
 const r=RECIPES.find(x=>x.n===W.order);
 $('wOrder').innerHTML='Order: '+W.order+'<small>'+(r.hidden&&!W.known[r.n]?'Not in your book. Someone must know how.':'Worth double.')+'</small>';
 $('wBook').innerHTML=RECIPES.map(x=>x.hidden&&!W.known[x.n]?'<li>???<small>Not written down yet</small></li>':
  '<li>'+x.n+'<small>'+x.parts.map(k=>ING[k].e+' '+ING[k].n).join(x.order?' → ':' + ')+(x.stir?' · stir ×'+stirsFor(x):'')+'</small></li>').join('');
 setT('wCount',String(W.shelf.length))}
function newOrder(){
 const g=Academy.goal();let n;
 if(g<2)n='Glow Brew';
 else if(g===2)n='Pumpkin Spice Hex';
 else if(g===3)n='Hex of Dread';
 else n=pick(RECIPES.filter(r=>(!r.hidden||W.known[r.n])&&r.n!==W.order)).n;
 W.order=n;witchPaint()}
function take(k,src){
 if(W.held===k)return;
 W.held=k;Room.hold([k]);Sfx.pluck();act('Picked up the '+ING[k].n+' '+ING[k].e,src);witchPaint()}
function addIn(src){
 if(!W.held){note('Your hands are empty.',src);return}
 if(W.pot.includes(W.held)){note('The '+ING[W.held].n+' is already in there.',src);return}
 if(W.pot.length>=3){Sfx.fizzle();note('The cauldron is full. Finish it or pour it out.',src);return}
 const k=W.held;W.held=null;W.pot.push(k);W.stirs=0;
 Room.pour();Room.hold([]);Room.stew(W.pot);Sfx.plop();act('Added the '+ING[k].n+' '+ING[k].e,src);
 if(Academy.goal()===RUSH_GOAL&&!W.rushOn)startRush();
 Academy.on('added');witchPaint()}
function stir(src){
 if(!W.pot.length){note('You stir plain water. It is not impressed.',src);return}
 W.stirs++;Sfx.stir();note('Stirred '+W.stirs+(W.stirs===1?' time.':' times.'),src);witchPaint()}
function fizzled(t,src){
 W.pot=[];W.stirs=0;Room.stew([]);Room.smoke();Sfx.puff();Sfx.fizzle();note(t,src);witchPaint()}
function brew(src){
 if(!W.pot.length){note('Nothing in the pot to brew.',src);return}
 const r=RECIPES.find(x=>sameSet(x.parts,W.pot));
 if(!r){fizzled('Puff! That is not a potion, that is smoke. The cauldron resets.',src);return}
 if(r.order&&!r.parts.every((k,i)=>W.pot[i]===k)){fizzled('Puff! Right ingredients, wrong order. The cauldron resets.',src);tipOnce('order','Some brews are particular about who goes in first.');return}
 const need=stirsFor(r);
 if(W.stirs<need){Sfx.fizzle();note('It sulks. It wants stirring: '+W.stirs+' of '+need+'.',src);return}
 const hit=W.order===r.n,g=Academy.goal(),pts=potPts()*(hit?2:1);
 W.known[r.n]=true;W.pot=[];W.stirs=0;W.shelf.push(r.c);Room.shelf(W.shelf);Room.glow(r.c);later(()=>{if(W&&!W.pot.length)Room.stew([])},1400);
 Sfx.brew();award(pts);act(r.n+' brewed'+(hit?', order filled':'')+'. +'+pts,src);
 // Later goals first, so a single brew never finishes two goals in one go.
 if(hit){Academy.on('rush');Academy.on('order')}
 Academy.on('brewed',{ordered:!!r.order});
 if(hit&&Academy.goal()===g)newOrder();witchPaint()}
function emptyPot(src){
 if(!W.pot.length){note('The cauldron is already empty.',src);return}
 W.pot=[];W.stirs=0;Room.stew([]);Sfx.plop();act('Poured out the cauldron',src);witchPaint()}
function startRush(){W.rushOn=true;W.rush=rushMs();$('wRush').hidden=false;$('wRushL').hidden=false;log('The candle is lit. Go!')}
function endRush(){W.rushOn=false;W.rush=rushMs();$('wRush').hidden=true;$('wRushL').hidden=true;Room.candle(1)}
const Witch={
 title:'Potions',score:'Points',head:'A witch works with her hands. Pick things up, drop them in the cauldron and see what the pot makes of them. Orders keep coming in, and some of them are not in the book.',
 greet:'The cauldron is simmering.',keys:'1–6 pick up · A add · S stir · B brew · E empty',
 legend:[['Pick up an ingredient','1–6','Click it in the room'],['Add it to the cauldron','A','Click the cauldron'],['Stir','S','Drag circles over the cauldron'],['Finish the brew','B','Brew button'],['Pour it out','E','Empty button']],
 enter(){
  W={held:null,pot:[],stirs:0,order:'Glow Brew',known:{},shelf:[],rushOn:false,rush:rushMs(),drag:null};
  Room.props(true);Room.view(-.75);Room.place(-3.2,2.65,1.2);
  INGK.forEach((k,i)=>btn(ING[k].e+' '+ING[k].n[0].toUpperCase()+ING[k].n.slice(1)+' ('+(i+1)+')',()=>take(k,'button')));
  btn('Add (A)',()=>addIn('button'));btn('Stir (S)',()=>stir('button'));btn('Brew (B)',()=>brew('button'));btn('Empty (E)',()=>emptyPot('button'));
  $('classPanel').innerHTML='<h2>Potions</h2><div class="ocard" id="wOrder"></div><h3 id="wRushL" hidden>Candle</h3><progress id="wRush" max="1" value="1" hidden></progress>'+
   '<h3>Recipe book</h3><ul id="wBook"></ul><p class="stat">Potions on the shelf <b id="wCount">0</b></p><p class="ckeys">'+this.keys+'</p>';
  witchPaint()},
 leave(){W=null},
 goal(g){if(g===RUSH_GOAL)log('Rush orders: the candle lights when something goes in the pot.');else endRush();newOrder()},
 tick(dt){
  if(!W.rushOn)return;
  W.rush-=dt;const f=Math.max(0,W.rush/rushMs());$('wRush').value=f;Room.candle(f);
  if(W.rush<=0){endRush();Academy.reset('rush');Sfx.fizzle();log('The candle burned out. The rush starts over.');Academy.tip('Too slow. The customers have gone home, and new ones are on their way.');newOrder()}},
 key(k,e){
  if(e.repeat)return;
  if(k>='1'&&k<='6'){take(INGK[+k-1],'keyboard');return}
  if(k==='a')addIn('keyboard');else if(k==='s')stir('keyboard');else if(k==='b')brew('keyboard');else if(k==='e')emptyPot('keyboard')},
 down(e){
  const k=Room.pick(e.clientX,e.clientY);if(!k)return;
  if(k!=='cauldron'){take(k,'mouse');return}
  if(W.held){addIn('mouse');return}
  if(W.pot.length){const c=Room.cauldronXY();W.drag={a:Math.atan2(e.clientY-c.y,e.clientX-c.x),sum:0,c};$('room').setPointerCapture(e.pointerId)}},
 // One full circle around the cauldron = one stir.
 move(e){
  if(W.drag){const d=W.drag,a=Math.atan2(e.clientY-d.c.y,e.clientX-d.c.x);let da=a-d.a;if(da>Math.PI)da-=Math.PI*2;if(da<-Math.PI)da+=Math.PI*2;d.a=a;d.sum+=da;
   if(Math.abs(d.sum)>=Math.PI*2){d.sum=0;stir('mouse')}return}
  const k=Room.pick(e.clientX,e.clientY);if(k!==W.hover){W.hover=k;Room.ring(k,1);$('room').style.cursor=k?'pointer':''}},
 up(){if(W.drag)W.drag=null}};

// ---------- Werewolf: Dodging ----------
// Stats: stealth = longer telegraphs, stamina = faster lane changes, scare = hunters hesitate longer between shots.
const LX=[-2.2,0,2.2],LANE=['left','middle','right'],WZ=1,WY=.78,POSE=750,HIGH=1.55,LOW=.32,MOON_MS=30000,CLEAN_MS=30000,HOWL_QUIET=4000,DOUBLE_GOAL=3,MOON_GOAL=4;
let D=null;
const teleMs=l=>Math.max(420,(800+st.stealth*40)*(1-.06*l)),travelMs=l=>Math.max(260,520-30*l),gapMs=l=>Math.max(400+st.scare*50,(900+st.scare*150)*(1-.06*l));
const wolfLvl=()=>D.moon?Math.max(D.level,6):D.level;
function wolfPanel(){
 held('❤️'.repeat(D.hearts)+'🖤'.repeat(3-D.hearts));
 setT('dHearts','❤️'.repeat(D.hearts)+'🖤'.repeat(3-D.hearts));
 const hot=D.vol?D.vol.shots.filter(s=>s.kind==='lane'&&!s.done).map(s=>s.lane):[];
 [...$('dLanes').children].forEach((el,i)=>el.className=(i===D.lane?'me':'')+(hot.includes(i)?' hot':''));
 setT('dRow',String(D.row));setT('dClean',Math.floor(D.clean/1000)+' s');setT('dLevel',String(wolfLvl()+1));
 $('dMoon').hidden=$('dMoonL').hidden=!D.moon;$('dMoon').value=D.moon?1-D.moonT/MOON_MS:0}
function moveLane(d,src){const n=Math.max(0,Math.min(2,D.lane+d));if(n===D.lane)return;D.lane=n;Sfx.click(false);Room.lanes(n,D.vol?D.vol.shots.filter(s=>s.kind==='lane').map(s=>s.lane):[]);wolfPanel()}
function setPose(p){D.pose=p;D.poseT=POSE;if(p==='jump')Sfx.pluck()}
function howl(src){
 if(!ready('power',12000))return note('Your voice has not come back yet.',src);
 if(lightsOn){Sfx.fizzle();note('Your howl is lost in the lamplight. It sounds like a sad dog.',src);return}
 if(blindsOn){Sfx.fizzle();note('There is no moon in sight. The howl falls flat.',src);return}
 Sfx.howl();Room.moon();D.quiet=HOWL_QUIET;
 if(D.vol&&D.vol.t<D.vol.tele)clearVolley(); // anyone still aiming thinks better of it
 $('cue').hidden=true;
 act('AWOOOO! The hunters back away for a moment',src);Academy.on('howl')}
function clearVolley(){D.vol=null;D.next=gapMs(wolfLvl());Room.hunter([]);Room.aim([]);Room.lanes(D.lane,[]);$('cue').hidden=true}
function volley(){
 const l=wolfLvl(),g=Academy.goal(),n=D.volNo++,tele=teleMs(l),travel=travelMs(l);
 const double=g===DOUBLE_GOAL?n%2===1:l>=3&&Math.random()<.2+.04*l;
 const kinds=n<2&&g===0?['lane']:['lane','lane','high','low'];
 const sides=blindsOn?['door']:shuffle(['window','door']);
 let shots;
 if(double){ // two lanes, and the one left open is always next to you, so it can always be reached
  const safe=D.lane===1?pick([0,2]):1,lanes=[0,1,2].filter(i=>i!==safe);
  shots=lanes.map((i,k)=>({kind:'lane',lane:i,side:sides[k%sides.length]}))
 }else{const kind=pick(kinds);shots=[{kind,lane:D.lane,side:sides[0]}]}
 shots.forEach(s=>{
  const m=Room.muzzle(s.side);
  if(s.kind==='lane'){const tgt={x:LX[s.lane],y:WY+.25,z:WZ};s.a=m;s.b={x:m.x+(tgt.x-m.x)*1.4,y:m.y+(tgt.y-m.y)*1.4,z:m.z+(tgt.z-m.z)*1.4};s.imp=1/1.4;s.aimB=s.b}
  else{const y=s.kind==='high'?HIGH:LOW,dir=s.side==='door'?-1:1;s.a={x:-dir*5,y,z:WZ};s.b={x:dir*5,y,z:WZ};s.aimB=s.b}});
 D.vol={shots,t:0,tele,travel,double,hit:false,fired:false};
 Room.hunter(shots.map(s=>s.side));Room.aim(shots.map(s=>({a:s.a,b:s.aimB})));
 Room.lanes(D.lane,shots.filter(s=>s.kind==='lane').map(s=>s.lane));Sfx.aim(shots[0].kind);
 const kind=shots[0].kind,cue=double?'⚠ TWO LANES':kind==='high'?'▲ HIGH':kind==='low'?'▼ LOW':'● '+LANE[shots[0].lane].toUpperCase()+' LANE';
 $('cue').textContent=cue;$('cue').hidden=false;
 log(double?'Two hunters aim down two lanes.':'Hunter at the '+shots[0].side+' aims '+(kind==='lane'?'down the '+LANE[shots[0].lane]+' lane.':kind+'.'));
 wolfPanel()}
function roundReset(){
 D.hearts=3;D.level=0;D.row=0;D.clean=0;D.volNo=0;D.pause=2600;clearVolley();
 if(D.moon)D.moonT=MOON_MS;
 Academy.reset('dodge');Sfx.fizzle();
 Academy.tip(pick(['Silver in the ribs. Up you get, we go again.','Dead weight on the carpet. Hearts back, start over.','You are supposed to be faster than a bullet. Again.']));
 log('Out of hearts. The round starts over.');wolfPanel()}
function resolve(s){
 s.done=true;const v=D.vol;
 const hit=s.kind==='lane'?Math.abs(D.x-LX[s.lane])<.9:s.kind==='high'?D.pose!=='duck':D.pose!=='jump';
 if(hit){
  v.hit=true;D.hearts--;D.row=0;D.clean=0;Sfx.hit();Room.shake(.9);Room.flash(0xdfe8ff);Academy.reset('dodge');
  log('Silver! '+D.hearts+(D.hearts===1?' heart':' hearts')+' left.');
  if(D.hearts<=0){roundReset();return}
 }else{
  D.row++;award(1);Sfx.whiz();
  if(D.row%4===0)D.level=Math.min(8,D.level+1);
  Academy.on('dodge');if(D&&v===D.vol&&v.double&&!v.hit&&v.shots.every(x=>x.done))Academy.on('double')}
 wolfPanel()}
const Werewolf={
 title:'Dodging',score:'Dodges',head:'Hunters know what you are. Silver comes through the window and the door, so keep moving. Watch for the red glint, and be somewhere else when the shot lands.',
 greet:'Hunters are in the garden.',keys:'A/D or ←/→ move · W/Space jump · S duck · H howl · L lights · B blinds',
 legend:[['Change lane','A/D or ←/→','Click the left or right of the room, or the buttons'],['Jump a low shot','W, ↑ or Space','Jump button'],['Duck a high shot','S or ↓','Duck button'],['Howl at the moon','H','Howl button'],['Lights / blinds','L / B','Lights and Blinds buttons']],
 enter(){
  D={lane:1,x:0,pose:'stand',poseT:0,hearts:3,level:0,row:0,clean:0,next:1800,vol:null,volNo:0,quiet:0,pause:0,moon:false,moonT:0,ui:0};
  Room.arena(true);Room.lanes(1,[]);Room.place(0,WY,WZ,1,0,1);
  btn('◀ Left (A/←)',()=>moveLane(-1,'button'));btn('Jump (W/Space)',()=>setPose('jump'));btn('Duck (S)',()=>setPose('duck'));btn('Right (D/→) ▶',()=>moveLane(1,'button'));btn('Howl (H)',()=>howl('button'));
  $('classPanel').innerHTML='<h2>Dodging</h2><div class="hearts" id="dHearts" role="img" aria-label="Your hearts"></div><div class="lanes" id="dLanes"><span>Left</span><span>Middle</span><span>Right</span></div>'+
   '<p class="stat">Dodges in a row <b id="dRow">0</b></p><p class="stat">Clean run <b id="dClean">0 s</b></p><p class="stat">Hunter fury <b id="dLevel">1</b></p>'+
   '<h3 id="dMoonL" hidden>Full moon</h3><progress id="dMoon" max="1" value="0" hidden></progress><p class="ckeys">'+this.keys+'</p>';
  wolfPanel()},
 leave(){D=null},
 goal(g){if(g!==MOON_GOAL)return;
  D.moon=true;D.moonT=MOON_MS;D.hearts=3;clearVolley();D.next=1800;D.pause=1200;
  if(lightsOn)lights('game');if(blindsOn)blinds('game');Room.moon();Sfx.howl();log('The moon comes up. Here they all come.');wolfPanel()},
 tick(dt){
  const tx=LX[D.lane],step=(4+st.stamina*.8)*dt/1000;D.x+=Math.sign(tx-D.x)*Math.min(Math.abs(tx-D.x),step);
  if(D.poseT>0&&(D.poseT-=dt)<=0)D.pose='stand';
  let y=WY,sy=1;
  if(D.pose==='jump')y+=1.25*Math.min(1,Math.sin(Math.PI*(1-D.poseT/POSE))*2.2);else if(D.pose==='duck'){y=.45;sy=.5}
  Room.place(D.x,y,WZ,1,0,sy);
  if((D.ui-=dt)<=0){D.ui=200;wolfPanel()}
  if(D.pause>0){D.pause-=dt;return}
  if(D.quiet>0)D.quiet-=dt;else D.clean+=dt;
  if(D.clean>=CLEAN_MS)Academy.on('clean');
  if(D.moon){if(D.quiet<=0)D.moonT-=dt;
   if(D.moonT<=0){D.moon=false;Sfx.howl();Room.moon();log('Dawn. The full moon is over and you are still standing.');Academy.on('moonDone');wolfPanel()}}
  const v=D.vol;
  if(!v){if(D.quiet<=0&&(D.next-=dt)<=0)volley();return}
  v.t+=dt;
  if(v.t<v.tele)return;
  if(!v.fired){v.fired=true;Sfx.shot();Room.aim([]);$('cue').hidden=true;v.shots.forEach(s=>Room.streak(s.a,s.b,v.travel))}
  const p=(v.t-v.tele)/v.travel;
  for(const s of v.shots){if(s.done)continue;
   const imp=s.kind==='lane'?s.imp:(D.x-s.a.x)/(s.b.x-s.a.x);
   if(p>=imp){resolve(s);if(D.vol!==v)return}}
  if(p>=1){const l=wolfLvl();D.vol=null;D.next=gapMs(l);Room.hunter([]);Room.lanes(D.lane,[]);wolfPanel()}},
 key(k,e){
  if(k==='ArrowLeft'||k==='ArrowRight'||k==='ArrowUp'||k==='ArrowDown'||k===' ')e.preventDefault();
  // Holding duck keeps you down (the key repeats). Everything else is one press, one action.
  if(k==='s'||k==='ArrowDown'){setPose('duck');return}
  if(e.repeat)return;
  if(k==='a'||k==='ArrowLeft')moveLane(-1,'keyboard');
  else if(k==='d'||k==='ArrowRight')moveLane(1,'keyboard');
  else if(k==='w'||k==='ArrowUp'||k===' ')setPose('jump');
  else if(k==='h')howl('keyboard');
  else if(k==='l')lights('keyboard');
  else if(k==='b')blinds('keyboard')},
 down(e){const r=$('room').getBoundingClientRect();moveLane(e.clientX<r.left+r.width/2?-1:1,'mouse')}};

// ---------- Vampire: Scent Matching ----------
// Stats: stealth = notes reveal faster and you get noticed less (it also slows the lamp burn, in academy.js),
// scare = more points per good bite, stamina = you float faster on the keyboard and shake off being noticed sooner.
const NOTES={sweet:'🍯',iron:'🩸',smoky:'🔥',floral:'🌸',salty:'🧂',citrus:'🍋'},NOTEK=Object.keys(NOTES),REACH=.3,TRICKY_GOAL=4,VISIT_MS=25000;
const noteMs=()=>1000-st.stealth*120,noticeChance=()=>Math.max(.01,.16-st.stealth*.03),bitePts=()=>40+st.scare*10,floatSp=()=>.3+st.stamina*.05,waryMs=()=>4200-st.stamina*300;
let V=null;
const nLabel=n=>NOTES[n]+' '+n;
const threeNotes=()=>shuffle(NOTEK).slice(0,3);
const exact=(a,b)=>a.length===b.length&&a.every(n=>b.includes(n));
function liveVisitors(){return [0,1,2].map(i=>Room.visitorAt(i)).filter(Boolean)}
// One note swapped for another: the near-miss a tricky order is built on.
function decoyOf(order){const out=shuffle(order),left=NOTEK.filter(n=>!order.includes(n));out[0]=pick(left);return shuffle(out)}
// Hand out a scent. There is always a way to fill the order: if nobody in the house matches, this visitor does.
function scentFor(i,v){
 const others=liveVisitors().filter(x=>x!==v&&x.scent&&!x.garlic&&x.state==='walk');
 if(!others.some(x=>exact(x.scent,V.order))){Room.setGarlic(i,false);return shuffle(V.order)}
 if(V.tricky&&!others.some(x=>!exact(x.scent,V.order)&&x.scent.filter(n=>V.order.includes(n)).length===2)){Room.setGarlic(i,false);return decoyOf(V.order)}
 let s;do{s=threeNotes()}while(exact(s,V.order));return s}
// A new order re-rolls anyone nobody has sniffed yet. Garlic wearers keep their necklace, so they can't be the answer.
function rescent(){const open=[0,1,2].filter(i=>{const v=Room.visitorAt(i);return v&&v.state==='walk'&&!v.rev&&!v.garlic});
 open.forEach(i=>Room.visitorAt(i).scent=null);open.forEach(i=>{const v=Room.visitorAt(i);v.scent=scentFor(i,v)})}
function newScentOrder(tricky){V.tricky=!!tricky;let o;do{o=threeNotes()}while(V.order&&exact(o,V.order));V.order=o;rescent();vampPaint()}
function vampPaint(){
 held('Order: '+V.order.map(n=>NOTES[n]).join(' '));
 $('vOrder').innerHTML='The coven asks for<div class="notes">'+V.order.map(nLabel).join(' · ')+'</div><small>'+(V.tricky?'Careful: someone smells almost like this.':'All three notes, in any order.')+'</small>';
 const rows=liveVisitors().filter(v=>v.rev).map(v=>'<li>'+ROOMS[v.room]+(v.room===cur?' (here)':'')+'<small>'+(v.garlic?'🧄 garlic, and nothing else':
  v.scent.map((n,k)=>k<v.rev?'<span class="'+(V.order.includes(n)?'nhit':'')+'">'+nLabel(n)+'</span>':'?').join(' · ')+(v.rev===3&&exact(v.scent,V.order)?' · <span class="nhit">exact match</span>':''))+'</small></li>');
 $('vSniffs').innerHTML=rows.join('')||'<li><small>Nobody sniffed yet.</small></li>'}
function sniffStart(src){
 const x=Room.visitor(),now=performance.now();
 if(!x||x.state!=='walk'){note('Nothing here but dust and old carpet.',src);return}
 if(now<V.wary){note('They are on their guard. Give it a moment.',src);return}
 if(x.ref.rev>=3||(x.garlic&&x.ref.rev)){note('You already know that scent.',src);return}
 Sfx.sniff();V.sn={ref:x.ref,t:0,grace:1500};log('You breathe in…')}
function revealNote(v){
 v.rev=v.garlic?3:v.rev+1;Sfx.sniff();
 if(v.garlic){Academy.on('sniff');Sfx.fizzle();log('Garlic, and nothing else.');tipOnce('garlic','Garlic masks everything. Whoever wears it is no use to the coven.');V.sn=null;vampPaint();return}
 const n=v.scent[v.rev-1],shared=V.order.includes(n);
 log('Scent note '+v.rev+' of 3: '+n+(shared?', and the order wants it.':'.'));
 if(shared)Academy.on('share');
 Academy.on('sniff');
 if(v.rev>=3){V.sn=null;Room.linger(5000);if(exact(v.scent,V.order))log('All three notes match the order.');else log('The scent is complete. It is not what the coven asked for.')}
 vampPaint()}
function bite(src){
 const x=Room.visitor(),now=performance.now();
 if(!x||x.state!=='walk'){note('Your fangs snap at empty air.',src);return}
 if(now<V.wary){note('They are on their guard. Give it a moment.',src);return}
 if(x.d>=REACH){note('Too far away. They have not even noticed you.',src);return}
 if(lightsOn){Academy.hurt(12);note('The lamp stings your gums. Not like this.',src);return}
 if(blindsOn){note('Your fangs feel dull. Something is missing from the night.',src);return}
 if(x.garlic){V.wary=now+waryMs();Academy.hurt(10);Sfx.fizzle();tipOnce('garlic','That smell! Some people wear protection around their necks.');note('GARLIC! You reel back, gagging.',src);return}
 V.sn=null;
 if(!exact(x.ref.scent,V.order)){
  Room.scare(9);here[cur]=false;sync();Academy.hurt(30);award(-15);Sfx.bite();Sfx.sick();Academy.reset('match');
  tipOnce('sick','The coven does not want that one, and neither does your stomach. Check the order first.');
  note('Wrong blood! You double over, sick, and they run for it. -15',src);V.wary=now+waryMs();vampPaint();return}
 const pts=bitePts(),g=Academy.goal();
 Room.bite();Room.flash(0xff2b4a);here[cur]=false;sync();award(pts);Sfx.bite();Sfx.spell();
 act('An exact match! The coven is pleased. +'+pts,src);
 if(V.tricky)Academy.on('tricky');
 Academy.on('match');
 // Reaching the tricky goal already set its own order.
 const ng=Academy.goal();if(ng===g||ng<TRICKY_GOAL)newScentOrder(false)}
const Vampire={
 title:'Scent Matching',score:'Points',head:'The coven is particular about its supper. Drift through the dark house, breathe in each visitor and bite only the one whose scent matches the order. Lamps, mirrors and garlic all get in the way.',
 greet:'The coven has sent an order.',visitors:true,keys:'Arrows or W/A/D float (↓ for down) · S sniff · F bite · L lights · B blinds · 1–3 rooms',
 legend:[['Float around','Arrow keys, or W A D (↓ for down)','Move the pointer, or drag'],['Sniff a visitor','S','Click them, or the Sniff button'],['Bite','F','Bite button'],['Lights / blinds','L / B','Lights and Blinds buttons'],['Switch room','1, 2, 3','Tabs or the minimap']],
 enter(){
  V={order:null,tricky:false,sn:null,wary:0,mirrorAt:0,nx:.5,ny:.35,keys:{},ui:0};
  Room.place(0,3,.5);Room.ghost(V.nx,V.ny);
  btn('Sniff (S)',()=>sniffStart('button'));btn('Bite (F)',()=>{if(ready('power',1400))bite('button')});
  $('classPanel').innerHTML='<h2>Scent Matching</h2><div class="ocard" id="vOrder"></div><h3>Sniff results</h3><ul id="vSniffs"></ul><p class="ckeys">'+this.keys+'</p>';
  newScentOrder(false)},
 leave(){V=null},
 goal(g){if(g===TRICKY_GOAL){newScentOrder(true);log('A tricky order from the coven.')}else if(g>TRICKY_GOAL)newScentOrder(false)},
 arrive(i){const v=Room.visitorAt(i);if(!v)return;v.room=i;v.rev=0;Room.extend(i,VISIT_MS);v.scent=scentFor(i,v);vampPaint()},
 gone(){if(V.sn&&!liveVisitors().includes(V.sn.ref))V.sn=null;rescent();vampPaint()},
 tick(dt){
  const k=V.keys,s=floatSp()*dt/1000,dx=(k.right?1:0)-(k.left?1:0),dy=(k.down?1:0)-(k.up?1:0);
  if(dx||dy){V.nx=Math.max(0,Math.min(1,V.nx+dx*s));V.ny=Math.max(0,Math.min(1,V.ny+dy*s*1.2));Room.ghost(V.nx,V.ny)}
  const now=performance.now();
  if((V.ui-=dt)<=0){V.ui=500;vampPaint()}
  if(Room.mirrorNear()&&now>V.mirrorAt){
   V.mirrorAt=now+3500;V.wary=now+waryMs()+1800;Room.mirrorFlash();Sfx.shatter();Academy.hurt(25);
   tipOnce('mirror','The glass on the wall shows nothing where you hover. That makes people nervous.');
   note('A mirror! Nothing is reflected where you float. Everyone is on guard now.','game')}
  if(V.sn){const x=Room.visitor();
   if(!x||x.ref!==V.sn.ref||x.state!=='walk'){V.sn=null;return}
   if(x.d<REACH){Room.linger(1200);V.sn.t+=dt;
    if(V.sn.t>=noteMs()){V.sn.t=0;
     if(Math.random()<noticeChance()){V.sn=null;V.wary=now+waryMs();Room.startle('Huh?');log('They felt that. They are on their guard for a moment.');return}
     revealNote(V.sn.ref)}}
   else if((V.sn.grace-=dt)<=0){V.sn=null;log('You lost the scent. They drifted out of reach.')}}},
 key(k,e){
  const dir={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',ArrowDown:'down'}[k];
  if(dir){e.preventDefault();V.keys[dir]=true;return}
  if(e.repeat)return;
  if(k==='s')sniffStart('keyboard');
  else if(k==='f'){if(ready('power',1400))bite('keyboard')}
  else if(k==='l')lights('keyboard');
  else if(k==='b')blinds('keyboard');
  else if(k>='1'&&k<='3'){V.sn=null;goRoom(+k-1,'keyboard');vampPaint()}},
 keyup(k){const dir={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',ArrowDown:'down'}[k];if(dir)V.keys[dir]=false},
 point(e){const r=$('room').getBoundingClientRect();V.nx=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));V.ny=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));Room.ghost(V.nx,V.ny)},
 down(e){this.point(e);if(Room.pickVisitor(e.clientX,e.clientY))sniffStart('mouse')},
 move(e){this.point(e)}};

// ---------- Ghost: Haunting 101 keeps its own course, rooms, keys and hands-free input in script.js ----------
const Ghost={title:'Haunting 101',score:'Scares',visitors:true,ghost:true,greet:'Waiting for a gesture.',
 head:'A ghost can\'t touch a light switch. Wave a hand, nod your head or just say the word, and the room obeys: no contact, no reaching, no fine motor control. Visitors wander into the house now and then: switch rooms and give them a fright.'};
const CLS={Ghost,Witch,Werewolf,Vampire};

// ---------- Switching classes ----------
function legend(c){
 $('classLegend').innerHTML=c.legend?'<caption>'+c.title+' controls</caption><thead><tr><th>Action</th><th>Keyboard</th><th>Mouse / touch</th></tr></thead><tbody>'+
  c.legend.map(r=>'<tr><th scope="row">'+r[0]+'</th><td>'+r[1]+'</td><td>'+r[2]+'</td></tr>').join('')+'</tbody>':''}
function start(species,stats,title){
 stop();st=stats;C=CLS[species];
 const key=species.toLowerCase();
 document.querySelectorAll('[data-for]').forEach(el=>el.toggleAttribute('data-off',!el.dataset.for.split(' ').includes(key)));
 $('coachTitle').textContent='Instructor · '+title;$('headCopy').textContent=C.head;$('scoreLabel').textContent=C.score;legend(C);log(C.greet);
 Room.setVisitors(!!C.visitors);C.enter&&C.enter()}
// Everything a class set up comes down here, including anything it left in the room.
function stop(){
 if(C&&C.leave)C.leave();C=null;
 timers.forEach(clearTimeout);timers=[];Object.keys(tippedOnce).forEach(k=>delete tippedOnce[k]);
 Room.resetClass();Room.setVisitors(false);
 $('classBtns').textContent='';$('classPanel').textContent='';$('classLegend').textContent='';
 held('');$('cue').hidden=true;$('room').style.cursor=''}
function key(e){
 if(!C||!C.key||e.ctrlKey||e.metaKey||e.altKey)return;
 const t=e.target&&e.target.tagName;
 if(t==='INPUT'||t==='SELECT'||t==='TEXTAREA')return;
 // Space and Enter on a focused button should press that button, not also jump.
 if((e.key===' '||e.key==='Enter')&&(t==='BUTTON'||t==='SUMMARY'||t==='A'))return;
 C.key(e.key.length===1?e.key.toLowerCase():e.key,e)}
addEventListener('keyup',e=>{if(C&&C.keyup)C.keyup(e.key.length===1?e.key.toLowerCase():e.key)});
addEventListener('blur',()=>{if(V)V.keys={}});
const onRoom=(type,fn)=>$('room').addEventListener(type,e=>{if(!C||!C[fn]||document.body.classList.contains('building')||(e.target.closest&&e.target.closest('.mini')))return;C[fn](e)});
onRoom('pointerdown','down');onRoom('pointermove','move');onRoom('pointerup','up');onRoom('pointercancel','up');
// One clock for every class, so stopping a class stops its clock too. requestAnimationFrame also pauses in a hidden tab.
function frame(now){
 requestAnimationFrame(frame);
 const dt=Math.min(100,now-last);last=now;
 if(C&&C.tick&&!document.body.classList.contains('building'))C.tick(dt)}
requestAnimationFrame(frame);

return{start,stop,key,
 goal(g){if(C&&C.goal)C.goal(g)},
 on(type,i){if(!C)return;if(type==='arrive'){if(C.arrive)C.arrive(i)}else if(C.gone)C.gone(i)}}
})();
