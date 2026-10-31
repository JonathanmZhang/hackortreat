const $=id=>document.getElementById(id);
const logEl=$('log');
$('lights').innerHTML='<i></i>'.repeat(48); // string lights; the CSS makes them blink
const CH=["Ch 1<br>Static","Ch 2<br>Haunted Home Makeover","Ch 3<br>Séance Shopping","Ch 4<br>Ghost News at Nine"];
let ch=0,lightsOn=true,plugOn=true,cool={},focus='tv'; // focus: what next/previous control, 'tv' or 'jukebox'
const ROOMS=['Living room','Bedroom','Kitchen'],RS=ROOMS.map(()=>({lights:true,ch:0}));let cur=0,score=0,alertT=0;
function log(t){logEl.textContent=t}
function ready(k,ms){const n=performance.now();if(cool[k]&&n-cool[k]<ms)return false;cool[k]=n;return true}

// ---------- Gesture caption ----------
// Visual feedback above the camera. #log is the aria-live announcement, so the caption is aria-hidden.
// An action can be a function when its label depends on what has focus; it's resolved when painted.
const stepLabel=d=>()=>(d>0?'Next ':'Previous ')+(focus==='tv'?'channel':'song');
const GESTURES={
 pinch:{icon:'🤏',name:'Pinch',action:'Flick the lights'},
 fist:{icon:'✊',name:'Fist',action:'Slam the door'},
 swipeL:{icon:'👋',name:'Swipe left',action:stepLabel(-1)},
 swipeR:{icon:'👋',name:'Swipe right',action:stepLabel(1)},
 nod:{icon:'🙂',name:'Nod',action:'Flick the lights'},
 tiltL:{icon:'🙃',name:'Tilt head left',action:stepLabel(-1)},
 tiltR:{icon:'🙃',name:'Tilt head right',action:stepLabel(1)},
 mouth:{icon:'😮',name:'Open mouth',action:'Slam the door'},
 peace:{icon:'✌️',name:'Peace sign',action:'Next room'},
 horns:{icon:'🤘',name:'Horns',action:'Switch TV / Jukebox'},
 palm:{icon:'✋',name:'Open palm',action:'Play / pause music'},
 brows:{icon:'🤨',name:'Raise eyebrows',action:'Switch TV / Jukebox'}};
const VIA={voice:'🗣️',keyboard:'⌨️',button:'🖱️','voice AI':'🤖'};
const CAP={frames:3,linger:400,fired:1200};
// capVia names what triggered the next act(): a GESTURES key, a spoken word or a key label.
let camOn=false,capVia=null,capCand=null,capKey=null,capRun=0,capHeld=null,capGap=0,capSeen=0,capUntil=0,capTimer=0,capSig='',capElapsed=0,capShown=[];
function paint(state,icon,name,action,hold,total){
 const el=$('gcap'),timed=hold!==undefined,sig=[state,icon,name,action,timed].join('|'),fresh=sig!==capSig;
 capShown=[state,icon,name,action];
 if(fresh){capSig=sig;$('gcapIcon').textContent=icon;$('gcapName').textContent=name;$('gcapAct').textContent=action}
 if(fresh||state==='fired'){el.className='gcap';void el.offsetWidth;el.className='gcap '+state+(timed?' hold':'')}
 // The bar is a CSS animation started part-way through, so it needs no per-frame DOM writes.
 if(timed&&(fresh||hold<capElapsed)){const b=$('gcapBar');b.style.animation='none';void b.offsetWidth;b.style.animation='';b.style.animationDuration=(total||FACE.hold)+'ms';b.style.animationDelay=-hold+'ms'}
 capElapsed=timed?hold:0;
}
// States: idle, detecting (x = ms held, total = that gesture's hold time), cooldown (x = optional note), fired (x = {text,src}).
// detecting and cooldown only record a candidate; captionTick decides once per frame what to show.
function setCaption(key,state,x,total){
 if(state==='idle'){paint('idle','',camOn?'Show a hand or your face…':'Start the camera to see gestures here','');return}
 if(state==='fired'){
  const g=GESTURES[key];capUntil=performance.now()+CAP.fired;capHeld=g?key:null;capGap=0;
  paint('fired',g?'✓':VIA[x.src],g?g.name:key||(x.src==='voice AI'?'AI voice':'Button'),x.text);
  clearTimeout(capTimer);capTimer=setTimeout(()=>{if(!camOn)setCaption(null,'idle')},CAP.fired);return}
 if(!capCand)capCand={key,state,x,total};
}
function captionTick(){
 const c=capCand,now=performance.now();capCand=null;
 if(c&&c.key===capKey)capRun++;else{capKey=c?c.key:null;capRun=c?1:0}
 if(c&&c.key===capHeld)capGap=0;else if(++capGap>=2)capHeld=null;
 const show=capRun>=CAP.frames;
 // A fired confirmation stays up, unless the user tries again and is blocked: release and repeat, or another gesture for that action.
 if(now<capUntil&&!(show&&c.state==='cooldown'&&c.key!==capHeld))return;
 capUntil=0;
 if(show){const g=GESTURES[c.key],cd=c.state==='cooldown',a=typeof g.action==='function'?g.action():g.action;capSeen=now;
  paint(c.state,g.icon,g.name,cd?a+' ('+(c.x||'cooling down')+')':a,cd?undefined:c.x,c.total)}
 else if(now-capSeen>CAP.linger)setCaption(null,'idle');
 else if(capElapsed)paint(...capShown);
}
setCaption(null,'idle');

// ---------- Command history ----------
// Every action is recorded with its time and the input that triggered it (hand, voice, head, face, button, keyboard).
// Saved in localStorage so it survives a page reload.
const HKEY='poltergeist-history',HMAX=200;
let cmds=[];
try{const s=JSON.parse(localStorage.getItem(HKEY)||'[]');if(Array.isArray(s))cmds=s.slice(-HMAX)}catch(e){}
function saveHist(){try{localStorage.setItem(HKEY,JSON.stringify(cmds))}catch(e){}}
function renderHist(){
 const ul=$('histList');ul.textContent='';
 $('histCount').textContent=cmds.length;$('histEmpty').hidden=cmds.length>0;$('histClear').disabled=!cmds.length;
 const todayStr=new Date().toDateString();
 cmds.slice().reverse().forEach(h=>{
  const d=new Date(h.t),li=document.createElement('li'),t=document.createElement('time'),a=document.createElement('span'),s=document.createElement('span');
  t.dateTime=d.toISOString();
  t.textContent=d.toDateString()===todayStr?d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit',second:'2-digit'}):d.toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
  a.className='what';a.textContent=h.text;s.className='src';s.textContent=h.src;
  li.append(t,a,s);ul.appendChild(li)})}
function act(text,src){log(text+'.');cmds.push({t:Date.now(),text,src});if(cmds.length>HMAX)cmds.shift();saveHist();renderHist();setCaption(capVia,'fired',{text,src});capVia=null}
$('histClear').onclick=()=>{cmds=[];saveHist();renderHist();log('History cleared.')};
renderHist();

function lights(src){lightsOn=!lightsOn;Room.lights(lightsOn);Sfx.click(lightsOn);act('Lights '+(lightsOn?'on':'off')+' ('+ROOMS[cur]+')',src);haunt(1)}
function channel(d,src){ch=(ch+d+CH.length)%CH.length;Room.tv(CH[ch]);Sfx.tv();act('Channel '+(ch+1)+': '+CH[ch].split('<br>')[1]+' ('+ROOMS[cur]+')',src);haunt(1)}
function slam(src){Room.slam();Sfx.slam();
 plugOn=false;$('plugState').textContent='OFF';setTimeout(()=>{plugOn=true;$('plugState').textContent='ON'},1400);act('Door slammed, smart plug triggered ('+ROOMS[cur]+')',src);haunt(3)}

// ---------- Focus: the ghost possesses the TV or the jukebox ----------
// Next and previous go to whichever one has focus. They return false if the cooldown or a missing connection blocked them.
const stepKey=()=>focus==='tv'?'channel':'track';
function paintFocus(){const j=focus==='jukebox';$('possessT').textContent=j?'Jukebox':'TV';document.querySelector('.crt').classList.toggle('possessed',!j);$('jukebox').classList.toggle('possessed',j)}
function setFocus(t,src){
 if(t==='jukebox'&&!Spotify.connected()){capVia=null;log('Connect Spotify first.');return}
 if(t===focus){capVia=null;log('The ghost is already possessing the '+(t==='tv'?'TV':'jukebox')+'.');return}
 focus=t;paintFocus();act('The ghost now possesses the '+(t==='tv'?'TV':'jukebox'),src)}
function switchFocus(t,src){if(!ready('focus',1500))return false;setFocus(t==='toggle'?(focus==='tv'?'jukebox':'tv'):t,src);return true}
function tvStep(d,src){if(!ready('channel',900))return false;channel(d,src);return true}
// act() waits until the new track is known, so remember what triggered this for the caption.
function trackStep(d,src){
 if(!Spotify.connected()){capVia=null;log('Connect Spotify first.');return false}
 if(!ready('track',900))return false;
 const via=capVia,before=Spotify.state().trackId;capVia=null;
 (d>0?Spotify.next():Spotify.previous()).then(ok=>{
  if(!ok){log(Spotify.state().msg||'Spotify could not do that.');return}
  let off=null,t=0;
  const finish=text=>{if(!off)return;off();off=null;clearTimeout(t);capVia=via;act(text,src);haunt(1)};
  off=Spotify.onChange(s=>{if(s.trackId&&s.trackId!==before)finish('Skipped to: '+s.track)});
  t=setTimeout(()=>finish(d>0?'Next song':'Previous song'),1500)});
 return true}
function next(src){return focus==='jukebox'?trackStep(1,src):tvStep(1,src)}
function previous(src){return focus==='jukebox'?trackStep(-1,src):tvStep(-1,src)}
// Play and pause work whatever has focus. want: true, false or undefined to toggle. uri: a playlist to start.
function playPause(want,src,uri){
 if(!Spotify.connected()){capVia=null;log(Spotify.ready()?'Connect Spotify first.':"Spotify isn't set up yet.");return false}
 if(!ready('play',1500))return false;
 const via=capVia,playing=Spotify.state().playing,will=uri?true:want===undefined?!playing:want;capVia=null;
 if(!uri&&will===playing){log('The music is already '+(will?'playing':'paused')+'.');return true}
 (will?Spotify.play(uri):Spotify.togglePlay()).then(ok=>{
  if(!ok){log(Spotify.state().msg||'Spotify could not do that.');return}
  capVia=via;act(uri?'Spooky music playing':will?'Music playing':'Music paused',src);haunt(1)});
 return true}
const spooky=src=>playPause(true,src,HAUNT_PLAYLIST||undefined);
// Polling can end a login, and that must not leave focus on a jukebox nobody can reach.
Spotify.onChange(s=>{Sfx.duck(s.playing);if(focus==='jukebox'&&!s.connected){focus='tv';paintFocus();log('Spotify is disconnected. The ghost is back on the TV.')}});
paintFocus();

$('bL').onclick=()=>lights('button');$('bC').onclick=()=>next('button');$('bD').onclick=()=>slam('button');
$('jPrev').onclick=()=>trackStep(-1,'button');$('jNext').onclick=()=>trackStep(1,'button');$('jPlay').onclick=()=>playPause(undefined,'button');
addEventListener('keydown',e=>{capVia={ArrowRight:'→',ArrowLeft:'←',' ':'Space'}[e.key]||(e.key||'').toUpperCase();if(e.key==='l'||e.key==='L')lights('keyboard');if(e.key==='ArrowRight')next('keyboard');if(e.key==='ArrowLeft')previous('keyboard');if(e.key==='d'||e.key==='D')slam('keyboard');if(e.key>='1'&&e.key<='3')goRoom(+e.key-1,'keyboard');
 if((e.key==='m'||e.key==='M')&&!e.ctrlKey&&!e.metaKey)switchFocus('toggle','keyboard');
 // Space keeps its normal job on focused controls, and keeps scrolling the page until Spotify is set up.
 if(e.key===' '&&Spotify.ready()&&!(e.target.closest&&e.target.closest('button,input,summary'))){e.preventDefault();if(!e.repeat)playPause(undefined,'keyboard')}
 capVia=null});

// ---------- Rooms and visitors ----------
// Visitors wander into a random room every so often. Be in their room when you act and they get scared.
const tabs=$('tabs');
// Minimap on the TV screen: glowing floor plan, ghost dot in your room, magenta dot where a visitor is.
const minis=[...document.querySelectorAll('#mini .mr')],here=[false,false,false]; // here[i]: a visitor is in room i
function sync(){minis.forEach((g,k)=>{g.classList.toggle('here',k===cur);g.classList.toggle('vis',here[k])});Sfx.heart(here[cur])} // heartbeat runs while a visitor is in your room
function ringMini(i){const g=minis[i];g.classList.remove('ping');void g.getBoundingClientRect();g.classList.add('ping')}
minis.forEach((g,i)=>{g.onclick=()=>goRoom(i,'button');g.querySelector('.ring').addEventListener('animationend',()=>g.classList.remove('ping'))});
ROOMS.forEach((n,i)=>{const b=document.createElement('button');b.type='button';b.textContent=(i+1)+' '+n;b.onclick=()=>goRoom(i,'button');tabs.appendChild(b)});
function paintTabs(){[...tabs.children].forEach((b,i)=>b.setAttribute('aria-pressed',i===cur))}
function goRoom(i,src){if(i===cur)return;RS[cur]={lights:lightsOn,ch};cur=i;lightsOn=RS[i].lights;ch=RS[i].ch;
 Room.setRoom(i);Room.lights(lightsOn);Room.tv(CH[ch]);paintTabs();sync();hideAlert();act('Moved to the '+ROOMS[i],src||'button')}
function nextRoom(src){goRoom((cur+1)%ROOMS.length,src)}
function haunt(n){const r=Room.scare(n);if(!r.hit)return;if(r.fled){here[cur]=false;Sfx.flee()}else Sfx.scare();sync();score+=r.fled?60:10;$('score').textContent=score;log(r.fled?'The visitor ran screaming! +60':'Spooked them! +10')}
function hideAlert(){clearTimeout(alertT);$('alert').hidden=true}
function showAlert(t,go){hideAlert();$('alertText').textContent=t;$('alertGo').hidden=go==null;$('alertGo').onclick=()=>goRoom(go,'button');$('alert').hidden=false;alertT=setTimeout(hideAlert,9000)}
Room.on=(type,i)=>{const n=ROOMS[i];
 if(type==='arrive'){here[i]=true;tabs.children[i].classList.add('has');ringMini(i);Sfx.chime();Sfx.whoo(i===cur);showAlert(i===cur?'Someone just walked in. Haunt them!':'Someone walked into the '+n+'!',i===cur?null:i)}
 else{here[i]=false;tabs.children[i].classList.remove('has');if(type==='leave')showAlert('They left the '+n+' unscared.',null)}
 sync()};
paintTabs();sync();

// Every input (hand, voice, head/face) shares one cooldown per action: 'lights', 'channel', 'track', 'slam', 'room', 'focus', 'play'.
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

// A pose that must be held. Fires once per hold (done) and forgives a dropped frame or two of tracking.
function held(h,on,now){if(!on)return -1;if(!h.since||now-h.seen>HOLD.grace){h.since=now;h.done=false}h.seen=now;return now-h.since}

// ---------- Hand gestures ----------
// Hold times (ms), how far the wrist may drift during an open-palm hold (fraction of the frame), dropped-frame grace (ms).
const HOLD={horns:400,palm:1000,palmMove:.04,grace:150};
const hist=[],hornH={since:0,seen:0,done:false},palmH={since:0,seen:0,done:false,at:null};
function detect(lm){
 const scale=dist(lm[0],lm[9])||.1;
 const pinch=dist(lm[4],lm[8])/scale<0.28;
 const curled=[[8,6],[12,10],[16,14],[20,18]].every(([t,p])=>dist(lm[t],lm[0])<dist(lm[p],lm[0]));
 const now=performance.now(),x=1-lm[0].x;
 hist.push({t:now,x});while(hist.length&&now-hist[0].t>350)hist.shift();
 const ext=(t,p)=>dist(lm[t],lm[0])>dist(lm[p],lm[0]);
 // Horns: index and pinky up, middle and ring curled. The middle finger keeps it apart from a peace sign. A pinch stays a pinch.
 const hE=held(hornH,!pinch&&ext(8,6)&&ext(20,18)&&!ext(12,10)&&!ext(16,14),now);
 if(hE>=0){
  if(hornH.done)setCaption('horns','cooldown',now-cool.focus<1500?'':'release to repeat');
  else if(hE>=HOLD.horns){hornH.done=true;capVia='horns';if(!switchFocus('toggle','hand')){capVia=null;setCaption('horns','cooldown')}}
  else setCaption('horns','detecting',hE,HOLD.horns);
  return}
 if(ext(8,6)&&ext(12,10)&&!ext(16,14)&&!ext(20,18)){if(ready('room',1500)){capVia='peace';nextRoom('hand')}else setCaption('peace','cooldown');return}
 if(pinch){if(ready('lights',1200)){capVia='pinch';lights('hand')}else setCaption('pinch','cooldown');return}
 if(curled){if(ready('slam',1500)){capVia='fist';slam('hand')}else setCaption('fist','cooldown');return}
 // Open palm held still -> play/pause. People swipe with an open hand, so any wrist movement restarts the hold, and it can't return here.
 // Until Spotify is set up, a resting open hand does nothing at all.
 let pE=held(palmH,!pinch&&ext(8,6)&&ext(12,10)&&ext(16,14)&&ext(20,18),now);
 if(pE>=0&&palmH.done){if(Spotify.connected())setCaption('palm','cooldown',now-cool.play<1500?'':'lower your hand to repeat')}
 else if(pE>=0){
  if(pE===0||dist(lm[0],palmH.at)>HOLD.palmMove){palmH.at=lm[0];palmH.since=now;pE=0}
  if(pE>=HOLD.palm){palmH.done=true;
   if(Spotify.ready()){capVia='palm';if(!playPause(undefined,'hand')&&Spotify.connected()){capVia=null;setCaption('palm','cooldown')}}}
  else if(Spotify.ready()&&pE>HOLD.palm*.15)setCaption('palm','detecting',pE,HOLD.palm)}
 if(hist.length>3){const dx=x-hist[0].x;
  if(Math.abs(dx)>0.28){capVia=dx>0?'swipeR':'swipeL';if((dx>0?next:previous)('hand')){hist.length=0;palmH.since=0;palmH.done=false}else capVia=null}}
}

// ---------- Head & face (MediaPipe Face Mesh) ----------
// Tune these if it triggers too easily or not at all.
// brow: how far above this face's neutral the eyebrows must rise, as a fraction of face height. browFrames: neutral frames to average.
const FACE={nod:0.09,tilt:18,mouth:0.12,hold:350,brow:0.02,browFrames:30};
const pitchHist=[],browH={since:0,seen:0,done:false};let tiltArmed=true,tiltSince=0,mouthSince=0,browN=0,browBase=0,browP=0,browSeen=0;
function detectFace(lm){
 const now=performance.now(),faceH=dist(lm[10],lm[152])||.1,mouthOpen=dist(lm[13],lm[14])/faceH>FACE.mouth;
 if(now-browSeen>2000)browN=0; // a new face (or none for a while): calibrate again
 browSeen=now;
 // Open mouth (hold briefly) -> slam the door
 if(mouthOpen){
  mouthSince=mouthSince||now;
  if(now-mouthSince>FACE.hold){if(ready('slam',1500)){capVia='mouth';slam('face');pitchHist.length=0}else setCaption('mouth','cooldown')}
  else setCaption('mouth','detecting',now-mouthSince);
 }else mouthSince=0;
 // Head tilt toward a shoulder (hold briefly) -> next or previous on whatever has focus. Tilt right = next, left = previous.
 const roll=Math.atan2(lm[263].y-lm[33].y,lm[263].x-lm[33].x)*180/Math.PI,big=Math.abs(roll)>FACE.tilt;
 if(Math.abs(roll)<8)tiltArmed=true;
 const tilt=roll<0?'tiltR':'tiltL';
 if(big&&tiltArmed){
  tiltSince=tiltSince||now;
  if(now-tiltSince>FACE.hold){capVia=tilt;if(!(roll<0?next:previous)('head')){capVia=null;setCaption(tilt,'cooldown')}tiltArmed=false;tiltSince=0;pitchHist.length=0}
  else setCaption(tilt,'detecting',now-tiltSince);
 }else if(!big)tiltSince=0;
 // A tilt fires once per hold: once the cooldown ends, the head has to straighten before it can fire again.
 else setCaption(tilt,'cooldown',now-cool[stepKey()]<900?'':'straighten head to repeat');
 if(big)return;
 // Nod (down and back up) -> flick the lights
 const eyeY=(lm[33].y+lm[263].y)/2,pitch=(lm[1].y-eyeY)/((lm[152].y-eyeY)||.1);
 pitchHist.push({t:now,p:pitch});while(pitchHist.length&&now-pitchHist[0].t>900)pitchHist.shift();
 let nodRange=0;
 if(pitchHist.length>6){
  const ps=pitchHist.map(h=>h.p),hi=Math.max(...ps),lo=Math.min(...ps),range=hi-lo;nodRange=range;
  if(range>FACE.nod){
   if(Math.abs(pitch-ps[0])>=range*.4)setCaption('nod','detecting');
   else if(ready('lights',1200)){capVia='nod';lights('head');pitchHist.length=0}
   else setCaption('nod','cooldown');
  }
 }
 // Raised eyebrows (hold briefly) -> switch TV / jukebox, measured against this face's own neutral brow height and head pitch.
 // Only counts on a still, level head with the mouth shut, so a nod, tilt or open mouth can't fire it. A tilt already returned above.
 const brow=(dist(lm[105],lm[159])+dist(lm[334],lm[386]))/2/faceH,calm=!mouthOpen&&Math.abs(roll)<10&&nodRange<FACE.nod*.5&&!(now-cool.lights<600);
 if(browN<FACE.browFrames){if(calm){browBase=browN?browBase+(brow-browBase)/(browN+1):brow;browP=browN?browP+(pitch-browP)/(browN+1):pitch;browN++}return}
 const bE=held(browH,calm&&brow-browBase>FACE.brow&&Math.abs(pitch-browP)<FACE.nod*.5,now);
 if(bE<0){if(calm){browBase+=(brow-browBase)*.002;browP+=(pitch-browP)*.002}return} // follows slow changes in posture
 if(browH.done)setCaption('brows','cooldown',now-cool.focus<1500?'':'lower your eyebrows to repeat');
 else if(bE>=FACE.hold){browH.done=true;capVia='brows';if(!switchFocus('toggle','face')){capVia=null;setCaption('brows','cooldown')}}
 else setCaption('brows','detecting',bE,FACE.hold);
}

// ---------- Voice (Web Speech API; Chrome / Edge) ----------
// Say the names on the page: "Lights", "Next", "Slam" (or "Door"), "Music", "Pause".
function voiceCmd(t){
 t=t.toLowerCase();
 let m;const said=()=>capVia='"'+m[0][0].toUpperCase()+m[0].slice(1)+'"';
 // goRoom skips act() when already in that room, so clear capVia here.
 const go=i=>{said();goRoom(i,'voice');capVia=null;return true};
 if(m=t.match(/\bliving\b/))return go(0);
 if(m=t.match(/\bbed(room)?\b/))return go(1);
 if(m=t.match(/\bkitchen\b/))return go(2);
 if(m=t.match(/\b(slam|slammed|slams|door)\b/)){if(ready('slam',1500)){said();slam('voice')}return true}
 if(m=t.match(/\b(lights?|flick)\b/)){if(ready('lights',1200)){said();lights('voice')}return true}
 // Specific phrases first: these ignore focus.
 const run=f=>{said();if(!f())capVia=null;return true};
 if(m=t.match(/\b(next\s+(song|track)|skip)\b/))return run(()=>trackStep(1,'voice'));
 if(m=t.match(/\bprevious\s+(song|track)\b/))return run(()=>trackStep(-1,'voice'));
 if(m=t.match(/\bprevious\s+channel\b/))return run(()=>tvStep(-1,'voice'));
 if(m=t.match(/\b(next\s+channel|channel)\b/))return run(()=>tvStep(1,'voice'));
 // Play and pause. \b keeps "playlist" from matching.
 if(m=t.match(/\b(spooky\s+music|play\s+(some\s+)?music)\b/))return run(()=>spooky('voice'));
 if(m=t.match(/\b(music\s+off|off\s+the\s+music|pause|stop)\b/))return run(()=>playPause(false,'voice'));
 if(m=t.match(/\b(music\s+on|on\s+the\s+music|play)\b/))return run(()=>playPause(true,'voice'));
 // Switch focus.
 if(m=t.match(/\b(t\.?v\.?|television)(?!\w)/))return run(()=>switchFocus('tv','voice'));
 if(m=t.match(/\b(music|jukebox)\b/))return run(()=>switchFocus('jukebox','voice'));
 if(m=t.match(/\bswitch\b/))return run(()=>switchFocus('toggle','voice'));
 // Generic: whatever has focus.
 if(m=t.match(/\b(previous|back)\b/))return run(()=>previous('voice'));
 if(m=t.match(/\bnext\b/))return run(()=>next('voice'));
 return false;
}
// ---------- Free-form voice (needs server.js + GEMINI_API_KEY) ----------
// With AI voice on, finished phrases that the keywords don't catch (or that are 4+ words) go to /api/interpret.
// Gemini returns a short list of actions, e.g. "set the mood for a scary movie night" -> lights off, channel, door.
const aiOn=()=>$('aiOn').checked&&!$('aiOn').disabled;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let planId=0;
fetch('/api/status').then(r=>r.ok?r.json():null).then(j=>{
 if(!j||!j.ai)return;const c=$('aiOn');c.disabled=false;c.checked=true;
 $('aiNote').textContent='(sends what you say to Gemini)';$('aiRow').hidden=false}).catch(()=>{});
function setLights(on,src){if(lightsOn!==on)lights(src)}
function setChannel(n,src){if(n-1!==ch)channel(n-1-ch,src)}
function musicOp(op,src){
 if(op==='next')trackStep(1,src);else if(op==='previous')trackStep(-1,src);
 else if(op==='spooky')spooky(src);else playPause(op==='play',src)}
async function runPlan(actions,src){
 const id=++planId; // a newer spoken plan cancels an older one that is still running
 for(const a of actions){
  if(id!==planId)return;
  if(a.type==='wait'){await sleep(a.seconds*1000);continue}
  if(a.type==='lights')setLights(a.on,src);
  else if(a.type==='channel')setChannel(a.channel,src);
  else if(a.type==='door')slam(src);
  else if(a.type==='room')goRoom(a.room-1,src);
  else if(a.type==='music')musicOp(a.op,src);
  await sleep(400)}}
async function aiCommand(t){
 const heard=$('heard');heard.textContent='Thinking: "'+t+'"';
 try{
  const mu=Spotify.state(),r=await fetch('/api/interpret',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({text:t,state:{room:cur+1,lights:lightsOn,channel:ch+1,music:{connected:mu.connected,playing:mu.playing,track:mu.track}}})});
  if(!r.ok)throw new Error('http '+r.status);
  const p=await r.json();
  if(!Array.isArray(p.actions)||!p.actions.length){heard.textContent=p.message?'Ghost: '+p.message:'Heard: '+t+' (not a room command)';return}
  heard.textContent='Ghost: '+(p.message||'On it.');runPlan(p.actions,'voice AI')
 }catch(e){heard.textContent='AI unavailable, trying keywords. Heard: '+t;voiceCmd(t)}}

const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null,voiceOn=false;
function setVoice(on){voiceOn=on;const b=$('voiceBtn');b.textContent=on?'Stop voice':'Start voice';b.setAttribute('aria-pressed',on)}
$('voiceBtn').onclick=()=>{
 Sfx.start();
 const heard=$('heard');
 if(voiceOn){setVoice(false);rec&&rec.stop();heard.textContent='Voice is off.';return}
 if(!SR){heard.textContent='Voice needs Chrome or Edge. Use hand, head, buttons or keys instead.';return}
 rec=new SR();rec.continuous=true;rec.interimResults=true;rec.lang='en-US';
 let done={};
 rec.onstart=()=>{done={};heard.textContent=aiOn()?'Listening… try "set the mood for a scary movie night" or "play something spooky".':'Listening… say Lights, Next, Slam, Music or Pause.'};
 rec.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){
  if(done[i])continue;const r=e.results[i],t=r[0].transcript.trim();
  heard.textContent='Heard: '+t;
  if(aiOn()){ // free-form mode: act on finished phrases only, so half-spoken sentences aren't misread
   if(!r.isFinal)continue;done[i]=true;
   if(t.split(/\s+/).length<4&&voiceCmd(t))continue;
   aiCommand(t);continue}
  // A half-spoken "next" could still become "next song": wait for the rest of the phrase before acting on these words.
  if(!r.isFinal&&/\b(next|previous|play|music|spooky|switch)$/i.test(t))continue;
  if(voiceCmd(t))done[i]=true}};
 rec.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed'){setVoice(false);heard.textContent='Microphone blocked. Allow it in the browser, or use the other inputs.'}};
 rec.onend=()=>{if(voiceOn){try{rec.start()}catch(e){}}};
 setVoice(true);try{rec.start()}catch(e){}
};

// ---------- Camera, drawing, loop ----------
let handLm=null,faceLm=null;
function dot(ctx,p,r){ctx.beginPath();ctx.arc(p.x*640,p.y*480,r,0,7);ctx.fill()}
function render(){const ctx=$('c').getContext('2d');ctx.clearRect(0,0,640,480);
 if(handLm){ctx.fillStyle='#19f0ff';handLm.forEach(p=>dot(ctx,p,4))}
 if(faceLm){ctx.fillStyle='#ff2bd6';[1,33,263,13,14,61,291,10,152].forEach(i=>dot(ctx,faceLm[i],3))}
 $('camMsg').textContent=handLm||faceLm?[handLm?'Hand detected':'',faceLm?'Face detected':''].filter(Boolean).join(' · ')+'.':'Show a hand or your face to the camera.'}

$('startBtn').onclick=async()=>{
 Sfx.start();
 const msg=$('camMsg');msg.textContent='Starting camera…';
 try{
  const v=$('v');v.srcObject=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480}});await v.play();
  const base='https://cdn.jsdelivr.net/npm/@mediapipe/';
  const hands=new Hands({locateFile:f=>base+'hands@0.4.1675469240/'+f});
  hands.setOptions({maxNumHands:1,modelComplexity:0,minDetectionConfidence:.6,minTrackingConfidence:.5});
  hands.onResults(r=>{handLm=r.multiHandLandmarks&&r.multiHandLandmarks[0]||null;if(handLm){Room.ghost(1-handLm[9].x,handLm[9].y);detect(handLm)}render()});
  let face=null;
  if(typeof FaceMesh!=='undefined'){
   face=new FaceMesh({locateFile:f=>base+'face_mesh@0.4.1633559619/'+f});
   face.setOptions({maxNumFaces:1,refineLandmarks:false,minDetectionConfidence:.6,minTrackingConfidence:.5});
   face.onResults(r=>{faceLm=r.multiFaceLandmarks&&r.multiFaceLandmarks[0]||null;if(faceLm){if(!handLm)Room.ghost(1-faceLm[1].x,faceLm[1].y);detectFace(faceLm)}render()});
  }else log('Face model script was blocked. Hand, voice, buttons and keys still work.');
  msg.textContent='Loading models…';
  const loop=async()=>{
   if(v.readyState>=2){
    await hands.send({image:v});
    if(face&&$('faceOn').checked){try{await face.send({image:v})}catch(e){face=null;faceLm=null;log('Face model could not load. Hand, voice, buttons and keys still work.')}}
    else if(faceLm){faceLm=null;render()}
   }
   captionTick();
   requestAnimationFrame(loop)};camOn=true;captionTick();loop();
  $('startBtn').style.display='none';
 }catch(e){msg.textContent='Camera or hand model could not load ('+(e.name||'error')+'). Use voice, the buttons or keys instead.'}
};
if(typeof Hands==='undefined')$('camMsg').textContent='Hand model script was blocked. Use voice, the buttons or keys instead.';
