const $=id=>document.getElementById(id);
const room=$('room'),tv=$('tv'),door=$('door'),logEl=$('log');
const CH=["Ch 1<br>Static","Ch 2<br>Haunted Home Makeover","Ch 3<br>Séance Shopping","Ch 4<br>Ghost News at Nine"];
let ch=0,lightsOn=true,plugOn=true,cool={};
function log(t){logEl.textContent=t}
function ready(k,ms){const n=performance.now();if(cool[k]&&n-cool[k]<ms)return false;cool[k]=n;return true}
function thud(){try{const a=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();
 o.frequency.setValueAtTime(110,a.currentTime);o.frequency.exponentialRampToValueAtTime(35,a.currentTime+.25);
 g.gain.setValueAtTime(.6,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.3);
 o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.3)}catch(e){}}
function lights(){lightsOn=!lightsOn;room.classList.toggle('on',lightsOn);room.classList.toggle('off',!lightsOn);log('Lights '+(lightsOn?'on':'off')+'.')}
function channel(d){ch=(ch+d+CH.length)%CH.length;tv.querySelector('span').innerHTML=CH[ch];tv.classList.remove('flick');void tv.offsetWidth;tv.classList.add('flick');log('Channel '+(ch+1)+'.')}
function slam(){door.classList.remove('shut','shake');void door.offsetWidth;door.classList.add('shut','shake');thud();
 plugOn=false;$('plugState').textContent='OFF';setTimeout(()=>{door.classList.remove('shut');plugOn=true;$('plugState').textContent='ON'},1400);log('Door slammed. Smart plug triggered.')}
$('bL').onclick=lights;$('bC').onclick=()=>channel(1);$('bD').onclick=slam;
addEventListener('keydown',e=>{if(e.key==='l'||e.key==='L')lights();if(e.key==='ArrowRight')channel(1);if(e.key==='ArrowLeft')channel(-1);if(e.key==='d'||e.key==='D')slam()});

const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const hist=[];
function detect(lm){
 const scale=dist(lm[0],lm[9])||.1;
 const pinch=dist(lm[4],lm[8])/scale<0.28;
 const curled=[[8,6],[12,10],[16,14],[20,18]].every(([t,p])=>dist(lm[t],lm[0])<dist(lm[p],lm[0]));
 const now=performance.now(),x=1-lm[0].x;
 hist.push({t:now,x});while(hist.length&&now-hist[0].t>350)hist.shift();
 if(pinch){if(ready('pinch',1200))lights();return}
 if(curled){if(ready('fist',1500))slam();return}
 if(hist.length>3){const dx=x-hist[0].x;
  if(Math.abs(dx)>0.28&&ready('swipe',900)){channel(dx>0?1:-1);hist.length=0}}
}
function draw(ctx,lm){ctx.clearRect(0,0,640,480);ctx.fillStyle='#7df3c6';
 lm.forEach(p=>{ctx.beginPath();ctx.arc(p.x*640,p.y*480,4,0,7);ctx.fill()})}

$('startBtn').onclick=async()=>{
 const msg=$('camMsg');msg.textContent='Starting camera…';
 try{
  const v=$('v');v.srcObject=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480}});await v.play();
  const hands=new Hands({locateFile:f=>'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/'+f});
  hands.setOptions({maxNumHands:1,modelComplexity:0,minDetectionConfidence:.6,minTrackingConfidence:.5});
  const ctx=$('c').getContext('2d');
  hands.onResults(r=>{const lm=r.multiHandLandmarks&&r.multiHandLandmarks[0];
   if(lm){draw(ctx,lm);detect(lm);msg.textContent='Hand detected.'}else{ctx.clearRect(0,0,640,480);msg.textContent='Show one hand to the camera.'}});
  msg.textContent='Loading hand model…';
  const loop=async()=>{if(v.readyState>=2)await hands.send({image:v});requestAnimationFrame(loop)};loop();
  $('startBtn').style.display='none';
 }catch(e){msg.textContent='Camera or hand model could not load ('+(e.name||'error')+'). Use the buttons or keys instead.'}
};
if(typeof Hands==='undefined')$('camMsg').textContent='Hand model script was blocked. Use the buttons or keys instead.';
