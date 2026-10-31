const $=id=>document.getElementById(id);
const logEl=$('log');
const CH=["Ch 1<br>Static","Ch 2<br>Haunted Home Makeover","Ch 3<br>Séance Shopping","Ch 4<br>Ghost News at Nine"];
let ch=0,lightsOn=true,plugOn=true,cool={};
const ROOMS=['Living room','Bedroom','Kitchen'],RS=ROOMS.map(()=>({lights:true,ch:0}));let cur=0,score=0,alertT=0;
function log(t){logEl.textContent=t}
function ready(k,ms){const n=performance.now();if(cool[k]&&n-cool[k]<ms)return false;cool[k]=n;return true}
function thud(){try{const a=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();
 o.frequency.setValueAtTime(110,a.currentTime);o.frequency.exponentialRampToValueAtTime(35,a.currentTime+.25);
 g.gain.setValueAtTime(.6,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.3);
 o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.3)}catch(e){}}

// ---------- Gesture caption ----------
// Visual feedback above the camera. #log is the aria-live announcement, so the caption is aria-hidden.
const GESTURES={
 pinch:{icon:'🤏',name:'Pinch',action:'Flick the lights'},
 fist:{icon:'✊',name:'Fist',action:'Slam the door'},
 swipeL:{icon:'👋',name:'Swipe left',action:'Previous channel'},
 swipeR:{icon:'👋',name:'Swipe right',action:'Next channel'},
 nod:{icon:'🙂',name:'Nod',action:'Flick the lights'},
 tiltL:{icon:'🙃',name:'Tilt head left',action:'Previous channel'},
 tiltR:{icon:'🙃',name:'Tilt head right',action:'Next channel'},
 mouth:{icon:'😮',name:'Open mouth',action:'Slam the door'},
 peace:{icon:'✌️',name:'Peace sign',action:'Next room'}};
const VIA={voice:'🗣️',keyboard:'⌨️',button:'🖱️'};
const CAP={frames:3,linger:400,fired:1200};
// capVia names what triggered the next act(): a GESTURES key, a spoken word or a key label.
let camOn=false,capVia=null,capCand=null,capKey=null,capRun=0,capHeld=null,capGap=0,capSeen=0,capUntil=0,capTimer=0,capSig='',capElapsed=0,capShown=[];
function paint(state,icon,name,action,hold){
 const el=$('gcap'),timed=hold!==undefined,sig=[state,icon,name,action,timed].join('|'),fresh=sig!==capSig;
 capShown=[state,icon,name,action];
 if(fresh){capSig=sig;$('gcapIcon').textContent=icon;$('gcapName').textContent=name;$('gcapAct').textContent=action}
 if(fresh||state==='fired'){el.className='gcap';void el.offsetWidth;el.className='gcap '+state+(timed?' hold':'')}
 // The bar is a CSS animation started part-way through, so it needs no per-frame DOM writes.
 if(timed&&(fresh||hold<capElapsed)){const b=$('gcapBar');b.style.animation='none';void b.offsetWidth;b.style.animation='';b.style.animationDuration=FACE.hold+'ms';b.style.animationDelay=-hold+'ms'}
 capElapsed=timed?hold:0;
}
// States: idle, detecting (x = ms held, for hold gestures), cooldown (x = optional note), fired (x = {text,src}).
// detecting and cooldown only record a candidate; captionTick decides once per frame what to show.
function setCaption(key,state,x){
 if(state==='idle'){paint('idle','',camOn?'Show a hand or your face…':'Start the camera to see gestures here','');return}
 if(state==='fired'){
  const g=GESTURES[key];capUntil=performance.now()+CAP.fired;capHeld=g?key:null;capGap=0;
  paint('fired',g?'✓':VIA[x.src],g?g.name:key||'Button',x.text);
  clearTimeout(capTimer);capTimer=setTimeout(()=>{if(!camOn)setCaption(null,'idle')},CAP.fired);return}
 if(!capCand)capCand={key,state,x};
}
function captionTick(){
 const c=capCand,now=performance.now();capCand=null;
 if(c&&c.key===capKey)capRun++;else{capKey=c?c.key:null;capRun=c?1:0}
 if(c&&c.key===capHeld)capGap=0;else if(++capGap>=2)capHeld=null;
 const show=capRun>=CAP.frames;
 // A fired confirmation stays up, unless the user tries again and is blocked: release and repeat, or another gesture for that action.
 if(now<capUntil&&!(show&&c.state==='cooldown'&&c.key!==capHeld))return;
 capUntil=0;
 if(show){const g=GESTURES[c.key],cd=c.state==='cooldown';capSeen=now;
  paint(c.state,g.icon,g.name,cd?g.action+' ('+(c.x||'cooling down')+')':g.action,cd?undefined:c.x)}
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

function lights(src){lightsOn=!lightsOn;Room.lights(lightsOn);act('Lights '+(lightsOn?'on':'off')+' ('+ROOMS[cur]+')',src);haunt(1)}
function channel(d,src){ch=(ch+d+CH.length)%CH.length;Room.tv(CH[ch]);act('Channel '+(ch+1)+': '+CH[ch].split('<br>')[1]+' ('+ROOMS[cur]+')',src);haunt(1)}
function slam(src){Room.slam();thud();
 plugOn=false;$('plugState').textContent='OFF';setTimeout(()=>{plugOn=true;$('plugState').textContent='ON'},1400);act('Door slammed, smart plug triggered ('+ROOMS[cur]+')',src);haunt(3)}
$('bL').onclick=()=>lights('button');$('bC').onclick=()=>channel(1,'button');$('bD').onclick=()=>slam('button');
addEventListener('keydown',e=>{capVia={ArrowRight:'→',ArrowLeft:'←'}[e.key]||(e.key||'').toUpperCase();if(e.key==='l'||e.key==='L')lights('keyboard');if(e.key==='ArrowRight')channel(1,'keyboard');if(e.key==='ArrowLeft')channel(-1,'keyboard');if(e.key==='d'||e.key==='D')slam('keyboard');if(e.key>='1'&&e.key<='3')goRoom(+e.key-1,'keyboard');capVia=null});

// ---------- Rooms and visitors ----------
// Visitors wander into a random room every so often. Be in their room when you act and they get scared.
const tabs=$('tabs');
ROOMS.forEach((n,i)=>{const b=document.createElement('button');b.type='button';b.textContent=(i+1)+' '+n;b.onclick=()=>goRoom(i,'button');tabs.appendChild(b)});
function paintTabs(){[...tabs.children].forEach((b,i)=>b.setAttribute('aria-pressed',i===cur))}
function goRoom(i,src){if(i===cur)return;RS[cur]={lights:lightsOn,ch};cur=i;lightsOn=RS[i].lights;ch=RS[i].ch;
 Room.setRoom(i);Room.lights(lightsOn);Room.tv(CH[ch]);paintTabs();hideAlert();act('Moved to the '+ROOMS[i],src||'button')}
function nextRoom(src){goRoom((cur+1)%ROOMS.length,src)}
function haunt(n){const r=Room.scare(n);if(!r.hit)return;score+=r.fled?60:10;$('score').textContent=score;log(r.fled?'The visitor ran screaming! +60':'Spooked them! +10')}
function ping(){try{const a=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();
 o.frequency.setValueAtTime(660,a.currentTime);o.frequency.setValueAtTime(880,a.currentTime+.12);
 g.gain.setValueAtTime(.25,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.4);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.4)}catch(e){}}
function hideAlert(){clearTimeout(alertT);$('alert').hidden=true}
function showAlert(t,go){hideAlert();$('alertText').textContent=t;$('alertGo').hidden=go==null;$('alertGo').onclick=()=>goRoom(go,'button');$('alert').hidden=false;alertT=setTimeout(hideAlert,9000)}
Room.on=(type,i)=>{const n=ROOMS[i];
 if(type==='arrive'){tabs.children[i].classList.add('has');ping();showAlert(i===cur?'Someone just walked in. Haunt them!':'Someone walked into the '+n+'!',i===cur?null:i)}
 else{tabs.children[i].classList.remove('has');if(type==='leave')showAlert('They left the '+n+' unscared.',null)}};
paintTabs();

// Every input (hand, voice, head/face) shares one cooldown per action: 'lights', 'channel', 'slam'.
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

// ---------- Hand gestures ----------
const hist=[];
function detect(lm){
 const scale=dist(lm[0],lm[9])||.1;
 const pinch=dist(lm[4],lm[8])/scale<0.28;
 const curled=[[8,6],[12,10],[16,14],[20,18]].every(([t,p])=>dist(lm[t],lm[0])<dist(lm[p],lm[0]));
 const now=performance.now(),x=1-lm[0].x;
 hist.push({t:now,x});while(hist.length&&now-hist[0].t>350)hist.shift();
 const ext=(t,p)=>dist(lm[t],lm[0])>dist(lm[p],lm[0]);
 if(ext(8,6)&&ext(12,10)&&!ext(16,14)&&!ext(20,18)){if(ready('room',1500)){capVia='peace';nextRoom('hand')}else setCaption('peace','cooldown');return}
 if(pinch){if(ready('lights',1200)){capVia='pinch';lights('hand')}else setCaption('pinch','cooldown');return}
 if(curled){if(ready('slam',1500)){capVia='fist';slam('hand')}else setCaption('fist','cooldown');return}
 if(hist.length>3){const dx=x-hist[0].x;
  if(Math.abs(dx)>0.28&&ready('channel',900)){capVia=dx>0?'swipeR':'swipeL';channel(dx>0?1:-1,'hand');hist.length=0}}
}

// ---------- Head & face (MediaPipe Face Mesh) ----------
// Tune these if it triggers too easily or not at all.
const FACE={nod:0.09,tilt:18,mouth:0.12,hold:350};
const pitchHist=[];let tiltArmed=true,tiltSince=0,mouthSince=0;
function detectFace(lm){
 const now=performance.now(),faceH=dist(lm[10],lm[152])||.1;
 // Open mouth (hold briefly) -> slam the door
 if(dist(lm[13],lm[14])/faceH>FACE.mouth){
  mouthSince=mouthSince||now;
  if(now-mouthSince>FACE.hold){if(ready('slam',1500)){capVia='mouth';slam('face');pitchHist.length=0}else setCaption('mouth','cooldown')}
  else setCaption('mouth','detecting',now-mouthSince);
 }else mouthSince=0;
 // Head tilt toward a shoulder (hold briefly) -> change channel. Tilt right = next, left = previous.
 const roll=Math.atan2(lm[263].y-lm[33].y,lm[263].x-lm[33].x)*180/Math.PI,big=Math.abs(roll)>FACE.tilt;
 if(Math.abs(roll)<8)tiltArmed=true;
 const tilt=roll<0?'tiltR':'tiltL';
 if(big&&tiltArmed){
  tiltSince=tiltSince||now;
  if(now-tiltSince>FACE.hold){if(ready('channel',900)){capVia=tilt;channel(roll<0?1:-1,'head')}else setCaption(tilt,'cooldown');tiltArmed=false;tiltSince=0;pitchHist.length=0}
  else setCaption(tilt,'detecting',now-tiltSince);
 }else if(!big)tiltSince=0;
 // A tilt fires once per hold: once the cooldown ends, the head has to straighten before it can fire again.
 else setCaption(tilt,'cooldown',now-cool.channel<900?'':'straighten head to repeat');
 if(big)return;
 // Nod (down and back up) -> flick the lights
 const eyeY=(lm[33].y+lm[263].y)/2,pitch=(lm[1].y-eyeY)/((lm[152].y-eyeY)||.1);
 pitchHist.push({t:now,p:pitch});while(pitchHist.length&&now-pitchHist[0].t>900)pitchHist.shift();
 if(pitchHist.length>6){
  const ps=pitchHist.map(h=>h.p),hi=Math.max(...ps),lo=Math.min(...ps),range=hi-lo;
  if(range>FACE.nod){
   if(Math.abs(pitch-ps[0])>=range*.4)setCaption('nod','detecting');
   else if(ready('lights',1200)){capVia='nod';lights('head');pitchHist.length=0}
   else setCaption('nod','cooldown');
  }
 }
}

// ---------- Voice (Web Speech API; Chrome / Edge) ----------
// Say the names on the page: "Lights", "Channel", "Slam" (or "Door").
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
 if(m=t.match(/\b(previous|back)\b/)){if(ready('channel',900)){said();channel(-1,'voice')}return true}
 if(m=t.match(/\b(channel|next)\b/)){if(ready('channel',900)){said();channel(1,'voice')}return true}
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
async function runPlan(actions,src){
 const id=++planId; // a newer spoken plan cancels an older one that is still running
 for(const a of actions){
  if(id!==planId)return;
  if(a.type==='wait'){await sleep(a.seconds*1000);continue}
  if(a.type==='lights')setLights(a.on,src);
  else if(a.type==='channel')setChannel(a.channel,src);
  else if(a.type==='door')slam(src);
  else if(a.type==='room')goRoom(a.room-1,src);
  await sleep(400)}}
async function aiCommand(t){
 const heard=$('heard');heard.textContent='Thinking: "'+t+'"';
 try{
  const r=await fetch('/api/interpret',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({text:t,state:{room:cur+1,lights:lightsOn,channel:ch+1}})});
  if(!r.ok)throw new Error('http '+r.status);
  const p=await r.json();
  if(!Array.isArray(p.actions)||!p.actions.length){heard.textContent=p.message?'Ghost: '+p.message:'Heard: '+t+' (not a room command)';return}
  heard.textContent='Ghost: '+(p.message||'On it.');runPlan(p.actions,'voice AI')
 }catch(e){heard.textContent='AI unavailable, trying keywords. Heard: '+t;voiceCmd(t)}}

const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null,voiceOn=false;
function setVoice(on){voiceOn=on;const b=$('voiceBtn');b.textContent=on?'Stop voice':'Start voice';b.setAttribute('aria-pressed',on)}
$('voiceBtn').onclick=()=>{
 const heard=$('heard');
 if(voiceOn){setVoice(false);rec&&rec.stop();heard.textContent='Voice is off.';return}
 if(!SR){heard.textContent='Voice needs Chrome or Edge. Use hand, head, buttons or keys instead.';return}
 rec=new SR();rec.continuous=true;rec.interimResults=true;rec.lang='en-US';
 let done={};
 rec.onstart=()=>{done={};heard.textContent=aiOn()?'Listening… try "set the mood for a scary movie night".':'Listening… say Lights, Channel or Slam.'};
 rec.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){
  if(done[i])continue;const r=e.results[i],t=r[0].transcript.trim();
  heard.textContent='Heard: '+t;
  if(aiOn()){ // free-form mode: act on finished phrases only, so half-spoken sentences aren't misread
   if(!r.isFinal)continue;done[i]=true;
   if(t.split(/\s+/).length<4&&voiceCmd(t))continue;
   aiCommand(t);continue}
  if(voiceCmd(t))done[i]=true}};
 rec.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed'){setVoice(false);heard.textContent='Microphone blocked. Allow it in the browser, or use the other inputs.'}};
 rec.onend=()=>{if(voiceOn){try{rec.start()}catch(e){}}};
 setVoice(true);try{rec.start()}catch(e){}
};

// ---------- Camera, drawing, loop ----------
let handLm=null,faceLm=null;
function dot(ctx,p,r){ctx.beginPath();ctx.arc(p.x*640,p.y*480,r,0,7);ctx.fill()}
function render(){const ctx=$('c').getContext('2d');ctx.clearRect(0,0,640,480);
 if(handLm){ctx.fillStyle='#7df3c6';handLm.forEach(p=>dot(ctx,p,4))}
 if(faceLm){ctx.fillStyle='#ffd98a';[1,33,263,13,14,61,291,10,152].forEach(i=>dot(ctx,faceLm[i],3))}
 $('camMsg').textContent=handLm||faceLm?[handLm?'Hand detected':'',faceLm?'Face detected':''].filter(Boolean).join(' · ')+'.':'Show a hand or your face to the camera.'}

$('startBtn').onclick=async()=>{
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
