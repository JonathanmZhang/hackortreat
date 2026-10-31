const $=id=>document.getElementById(id);
const logEl=$('log');
const CH=["Ch 1<br>Static","Ch 2<br>Haunted Home Makeover","Ch 3<br>Séance Shopping","Ch 4<br>Ghost News at Nine"];
let ch=0,lightsOn=true,plugOn=true,cool={};
function log(t){logEl.textContent=t}
function ready(k,ms){const n=performance.now();if(cool[k]&&n-cool[k]<ms)return false;cool[k]=n;return true}
function thud(){try{const a=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();
 o.frequency.setValueAtTime(110,a.currentTime);o.frequency.exponentialRampToValueAtTime(35,a.currentTime+.25);
 g.gain.setValueAtTime(.6,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.3);
 o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.3)}catch(e){}}

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
function act(text,src){log(text+'.');cmds.push({t:Date.now(),text,src});if(cmds.length>HMAX)cmds.shift();saveHist();renderHist()}
$('histClear').onclick=()=>{cmds=[];saveHist();renderHist();log('History cleared.')};
renderHist();

function lights(src){lightsOn=!lightsOn;Room.lights(lightsOn);act('Lights '+(lightsOn?'on':'off'),src)}
function channel(d,src){ch=(ch+d+CH.length)%CH.length;Room.tv(CH[ch]);act('Channel '+(ch+1)+': '+CH[ch].split('<br>')[1],src)}
function slam(src){Room.slam();thud();
 plugOn=false;$('plugState').textContent='OFF';setTimeout(()=>{plugOn=true;$('plugState').textContent='ON'},1400);act('Door slammed, smart plug triggered',src)}
$('bL').onclick=()=>lights('button');$('bC').onclick=()=>channel(1,'button');$('bD').onclick=()=>slam('button');
addEventListener('keydown',e=>{if(e.key==='l'||e.key==='L')lights('keyboard');if(e.key==='ArrowRight')channel(1,'keyboard');if(e.key==='ArrowLeft')channel(-1,'keyboard');if(e.key==='d'||e.key==='D')slam('keyboard')});

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
 if(pinch){if(ready('lights',1200))lights('hand');return}
 if(curled){if(ready('slam',1500))slam('hand');return}
 if(hist.length>3){const dx=x-hist[0].x;
  if(Math.abs(dx)>0.28&&ready('channel',900)){channel(dx>0?1:-1,'hand');hist.length=0}}
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
  if(now-mouthSince>FACE.hold&&ready('slam',1500)){slam('face');pitchHist.length=0}
 }else mouthSince=0;
 // Head tilt toward a shoulder (hold briefly) -> change channel. Tilt right = next, left = previous.
 const roll=Math.atan2(lm[263].y-lm[33].y,lm[263].x-lm[33].x)*180/Math.PI,big=Math.abs(roll)>FACE.tilt;
 if(Math.abs(roll)<8)tiltArmed=true;
 if(big&&tiltArmed){
  tiltSince=tiltSince||now;
  if(now-tiltSince>FACE.hold){if(ready('channel',900))channel(roll<0?1:-1,'head');tiltArmed=false;tiltSince=0;pitchHist.length=0}
 }else if(!big)tiltSince=0;
 if(big)return;
 // Nod (down and back up) -> flick the lights
 const eyeY=(lm[33].y+lm[263].y)/2,pitch=(lm[1].y-eyeY)/((lm[152].y-eyeY)||.1);
 pitchHist.push({t:now,p:pitch});while(pitchHist.length&&now-pitchHist[0].t>900)pitchHist.shift();
 if(pitchHist.length>6){
  const ps=pitchHist.map(h=>h.p),hi=Math.max(...ps),lo=Math.min(...ps),range=hi-lo;
  if(range>FACE.nod&&Math.abs(pitch-ps[0])<range*.4&&ready('lights',1200)){lights('head');pitchHist.length=0}
 }
}

// ---------- Voice (Web Speech API; Chrome / Edge) ----------
// Say the names on the page: "Lights", "Channel", "Slam" (or "Door").
function voiceCmd(t){
 t=t.toLowerCase();
 if(/\b(slam|slammed|slams|door)\b/.test(t)){if(ready('slam',1500))slam('voice');return true}
 if(/\b(lights?|flick)\b/.test(t)){if(ready('lights',1200))lights('voice');return true}
 if(/\b(previous|back)\b/.test(t)){if(ready('channel',900))channel(-1,'voice');return true}
 if(/\b(channel|next)\b/.test(t)){if(ready('channel',900))channel(1,'voice');return true}
 return false;
}
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null,voiceOn=false;
function setVoice(on){voiceOn=on;const b=$('voiceBtn');b.textContent=on?'Stop voice':'Start voice';b.setAttribute('aria-pressed',on)}
$('voiceBtn').onclick=()=>{
 const heard=$('heard');
 if(voiceOn){setVoice(false);rec&&rec.stop();heard.textContent='Voice is off.';return}
 if(!SR){heard.textContent='Voice needs Chrome or Edge. Use hand, head, buttons or keys instead.';return}
 rec=new SR();rec.continuous=true;rec.interimResults=true;rec.lang='en-US';
 let done={};
 rec.onstart=()=>{done={};heard.textContent='Listening… say Lights, Channel or Slam.'};
 rec.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){
  if(done[i])continue;const t=e.results[i][0].transcript.trim();
  heard.textContent='Heard: '+t;if(voiceCmd(t))done[i]=true}};
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
   requestAnimationFrame(loop)};loop();
  $('startBtn').style.display='none';
 }catch(e){msg.textContent='Camera or hand model could not load ('+(e.name||'error')+'). Use voice, the buttons or keys instead.'}
};
if(typeof Hands==='undefined')$('camMsg').textContent='Hand model script was blocked. Use voice, the buttons or keys instead.';
