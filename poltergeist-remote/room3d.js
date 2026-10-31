// 3D haunted room (Three.js r128). Exposes window.Room for script.js.
(function(){
const host=document.getElementById('room');
let R;
try{R=new THREE.WebGLRenderer({antialias:true})}catch(e){
 host.insertAdjacentHTML('beforeend','<p style="padding:16px;color:#9a8fb0">3D view needs WebGL. Gestures still work.</p>');
 window.Room={lights(){},tv(){},slam(){},ghost(){},setRoom(){},scare(){return{hit:false}}};return}
const W=()=>host.clientWidth||640,H=()=>host.clientHeight||400;
R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(W(),H(),false);
R.domElement.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block';
host.insertBefore(R.domElement,host.firstChild);

const S=new THREE.Scene();S.background=new THREE.Color(0x0b0714);S.fog=new THREE.Fog(0x0b0714,11,24);
const C=new THREE.PerspectiveCamera(48,W()/H(),.1,60);
const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.85},o));
const add=(g,m,x,y,z,p)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);(p||S).add(o);return o};
const bx=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
const PL=(c,i,d,x,y,z)=>{const l=new THREE.PointLight(c,i,d);l.position.set(x,y,z);S.add(l);return l};
const flick=[];

// lights
const amb=new THREE.AmbientLight(0x6a5a9a,.7);S.add(amb);
PL(0x8fa8ff,.9,14,-2.6,3.1,-1.5); // moonlight

// floor + walls
const pc=document.createElement('canvas');pc.width=pc.height=256;const px=pc.getContext('2d');
for(let i=0;i<8;i++){px.fillStyle=i%2?'#4a362b':'#3e2d24';px.fillRect(0,i*32,256,32);px.fillStyle='#2a1c15';px.fillRect(0,i*32,256,2)}
const pt=new THREE.CanvasTexture(pc);pt.wrapS=pt.wrapT=THREE.RepeatWrapping;pt.repeat.set(2,2);
const floorM=M(0xffffff,{map:pt}),wallM=M(0x4a3a6e),sideM=M(0x3f3262);
add(bx(10,.2,8),floorM,0,-.1,1);
add(bx(10,5,.2),wallM,0,2.5,-3.1);
add(bx(.2,5,8),sideM,-5.1,2.5,1);
add(bx(.2,5,8),sideM,5.1,2.5,1);

// window with moon
const fr=M(0x120b1c);
add(new THREE.PlaneGeometry(1.6,2),new THREE.MeshBasicMaterial({color:0x14204a}),-2.6,3.1,-2.97);
add(new THREE.CircleGeometry(.35,24),new THREE.MeshBasicMaterial({color:0xfff1c4}),-2.3,3.5,-2.96);
[[1.8,.1,0,1.05],[1.8,.1,0,-1.05],[.1,2.2,.85,0],[.1,2.2,-.85,0],[1.7,.06,0,0],[.06,2,0,0]]
 .forEach(a=>add(bx(a[0],a[1],.1),fr,-2.6+a[2],3.1+a[3],-2.94));

// door (hinged on the left edge)
add(bx(1.7,3.5,.1),new THREE.MeshBasicMaterial({color:0x0f2a22}),3.05,1.75,-2.97);
add(bx(1.9,.12,.12),fr,3.05,3.55,-2.93);add(bx(.12,3.6,.12),fr,2.15,1.8,-2.93);add(bx(.12,3.6,.12),fr,3.95,1.8,-2.93);
const dg=new THREE.Group();dg.position.set(2.2,0,-2.92);dg.rotation.y=-1.15;S.add(dg);
add(bx(1.7,3.4,.1),M(0x6b4a33),.85,1.7,0,dg);
add(new THREE.SphereGeometry(.07,10,8),M(0xd9b45b,{metalness:.6}),1.45,1.6,.1,dg);
let dk=-1.15,dkK=.05,shake=0;

// TV on a cabinet
add(bx(4.6,.9,1),M(0x2b1d33),0,.45,-2.4);
add(bx(2.3,1.45,.2),M(0x0a0710),0,1.65,-2.4);
const tc=document.createElement('canvas');tc.width=128;tc.height=72;const tx=tc.getContext('2d');
const tt=new THREE.CanvasTexture(tc);tt.magFilter=THREE.NearestFilter;
add(new THREE.PlaneGeometry(2.1,1.25),new THREE.MeshBasicMaterial({map:tt}),0,1.65,-2.28);
PL(0x7df3c6,.7,9,0,1.7,-1.2);
let tvT=['Ch 1','Static'];
function drawTV(){
 if(tvT[1]==='Static'){
  const d=tx.createImageData(128,72);
  for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}
  tx.putImageData(d,0,0);tx.fillStyle='rgba(0,0,0,.55)';tx.fillRect(34,26,60,18);
  tx.fillStyle='#7df3c6';tx.font='bold 10px sans-serif';tx.textAlign='center';tx.fillText(tvT[0],64,38);
 }else{
  const g=tx.createLinearGradient(0,0,128,72);g.addColorStop(0,'#2b1a4d');g.addColorStop(1,'#0f3a3a');
  tx.fillStyle=g;tx.fillRect(0,0,128,72);tx.textAlign='center';
  tx.fillStyle='#7df3c6';tx.font='bold 10px sans-serif';tx.fillText(tvT[0],64,16);
  tx.fillStyle='#ece6f5';tx.font='9px sans-serif';
  let line='',y=38;tvT[1].split(' ').forEach(w=>{if(tx.measureText(line+w).width>110){tx.fillText(line,64,y);y+=12;line=''}line+=w+' '});
  tx.fillText(line,64,y);
 }
 tt.needsUpdate=true}
drawTV();

// skull on the cabinet
const bone=M(0xe8e2cf,{emissive:0x222018});
add(new THREE.SphereGeometry(.25,14,10),bone,-1.9,1.15,-2.3);
add(bx(.26,.12,.2),bone,-1.9,.93,-2.2);
[-.09,.09].forEach(x=>add(new THREE.SphereGeometry(.06,8,6),new THREE.MeshBasicMaterial({color:0x000000}),-1.9+x,1.18,-2.07));

// candles
const flames=[];
[[1.6,.5],[1.85,.8],[2.1,.35]].forEach(c=>{
 add(new THREE.CylinderGeometry(.07,.07,c[1],10),M(0xe9dfc8),c[0],.9+c[1]/2,-2.3);
 const f=add(new THREE.SphereGeometry(.05,8,6),new THREE.MeshBasicMaterial({color:0xffc56b}),c[0],.95+c[1],-2.3);
 f.scale.y=1.7;flames.push(f)});
const candleL=PL(0xffa84d,.8,6,1.85,1.9,-2.0);candleL.userData.b=.8;flick.push(candleL);

// floor lamp
add(new THREE.CylinderGeometry(.35,.4,.08,16),M(0x2a2036),-3.9,.04,-1.6);
add(new THREE.CylinderGeometry(.04,.04,2.6,8),M(0x2a2036),-3.9,1.3,-1.6);
const shadeM=M(0xffe9b0,{emissive:0xffd98a,emissiveIntensity:.9,side:2});
add(new THREE.CylinderGeometry(.3,.5,.6,16,1,true),shadeM,-3.9,2.8,-1.6);
const lampL=PL(0xffd98a,1.4,13,-3.9,3.0,-1.4);

// pumpkins
function pumpkin(x,z,s,ry){
 const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;g.scale.setScalar(s);S.add(g);
 add(new THREE.SphereGeometry(.5,20,14),M(0xe8641b,{emissive:0x6a2200,emissiveIntensity:.5}),0,.42,0,g).scale.set(1.15,.85,1.05);
 add(new THREE.CylinderGeometry(.05,.08,.18,8),M(0x4a5a22),0,.85,0,g);
 const fm=new THREE.MeshBasicMaterial({color:0xffd070});
 [-.2,.2].forEach(ex=>add(new THREE.CircleGeometry(.1,3),fm,ex,.52,.54,g));
 add(new THREE.CircleGeometry(.24,12,Math.PI,Math.PI),fm,0,.34,.54,g);
 const l=new THREE.PointLight(0xff8a2b,.8,5);l.position.set(0,.5,.8);l.userData.b=.8;g.add(l);flick.push(l)}
pumpkin(3.6,1.4,1.3,-.5);pumpkin(-1.6,2.0,.8,.35);pumpkin(-2.4,-1.3,.7,.5);

// cauldron
const cm=M(0x15121a,{metalness:.5,roughness:.5,side:2});
add(new THREE.SphereGeometry(.7,20,14,0,Math.PI*2,Math.PI*.38,Math.PI*.62),cm,-3.3,.75,1.2);
const rim=add(new THREE.TorusGeometry(.64,.05,8,24),cm,-3.3,1.01,1.2);rim.rotation.x=Math.PI/2;
const liq=add(new THREE.CircleGeometry(.6,20),new THREE.MeshBasicMaterial({color:0x7df3c6}),-3.3,.95,1.2);liq.rotation.x=-Math.PI/2;
PL(0x5dffc0,.9,6,-3.3,1.6,1.4);
const bubbles=[0,1,2,3].map(i=>add(new THREE.SphereGeometry(.07,8,6),new THREE.MeshBasicMaterial({color:0xb9ffe6}),-3.3+(i-1.5)*.18,1,1.2));

// cobwebs in the top corners
function web(cx,cy,cz,dir){
 const p=[],L=1.7;
 for(let i=0;i<=6;i++){const a=i/6*Math.PI/2;p.push(cx,cy,cz,cx+dir*Math.cos(a)*L,cy-Math.sin(a)*L,cz)}
 [.5,.9,1.3].forEach(r=>{for(let i=0;i<6;i++){
  const a=i/6*Math.PI/2,b=(i+1)/6*Math.PI/2,s=r*.92;
  p.push(cx+dir*Math.cos(a)*r,cy-Math.sin(a)*r,cz,cx+dir*Math.cos((a+b)/2)*s,cy-Math.sin((a+b)/2)*s,cz,
         cx+dir*Math.cos((a+b)/2)*s,cy-Math.sin((a+b)/2)*s,cz,cx+dir*Math.cos(b)*r,cy-Math.sin(b)*r,cz)}});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 S.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xc8c8dc,transparent:true,opacity:.6})))}
web(-4.95,4.95,-2.95,1);web(4.95,4.95,-2.95,-1);

// bats
function bat(){
 const g=new THREE.Group(),m=new THREE.MeshBasicMaterial({color:0x07050b,side:2});
 const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(.25,.22);sh.lineTo(.5,.05);sh.lineTo(.62,.18);sh.lineTo(.7,-.12);sh.lineTo(.3,-.15);sh.lineTo(0,-.1);
 const gm=new THREE.ShapeGeometry(sh),w1=new THREE.Mesh(gm,m),w2=new THREE.Mesh(gm,m);w2.scale.x=-1;g.add(w1,w2);
 add(new THREE.SphereGeometry(.09,8,6),m,0,0,0,g);g.userData={w1,w2};S.add(g);return g}
const bats=[0,1,2,3].map(i=>({m:bat(),o:i*1.6,sp:.5+i*.12,r:2.4+i*.4,y:3.6+i*.25}));

// hanging spider
const sp=new THREE.Group();S.add(sp);
add(new THREE.SphereGeometry(.12,10,8),new THREE.MeshBasicMaterial({color:0x07050b}),0,0,0,sp);
const thread=add(new THREE.CylinderGeometry(.008,.008,1,4),new THREE.MeshBasicMaterial({color:0xddddee}),0,0,0,sp);
sp.position.set(4.2,3.3,-2.2);

// the ghost (you)
const gh=new THREE.Group();S.add(gh);
const gM=M(0xffffff,{transparent:true,opacity:.88,emissive:0xcfe8ff,emissiveIntensity:.3});
add(new THREE.CylinderGeometry(.45,.62,.9,16),gM,0,0,0,gh);
add(new THREE.SphereGeometry(.45,16,12),gM,0,.45,0,gh);
[-.16,.16].forEach(x=>add(new THREE.SphereGeometry(.07,8,6),new THREE.MeshBasicMaterial({color:0x0a0710}),x,.5,.38,gh));
gh.position.set(1.6,3.3,.5);
const gt={x:1.6,y:3.3};let lastHand=-9999;

// rooms: same layout, recoloured, with different furniture
const RM=[[0x4a3a6e,0x3f3262,0xffffff],[0x3a4a7a,0x2f3a62,0xb8c8ff],[0x2f6a5a,0x265446,0xc8d8c8]];
const ex=[0,1,2].map(()=>{const g=new THREE.Group();S.add(g);return g});
const sf=M(0x7a2f3f);
add(bx(2.6,.5,1),sf,0,.25,.9,ex[0]);add(bx(2.6,.8,.3),sf,0,.7,1.3,ex[0]);add(bx(.3,.7,1),sf,-1.3,.45,.9,ex[0]);add(bx(.3,.7,1),sf,1.3,.45,.9,ex[0]);
add(bx(2.4,.35,2.8),M(0x3a2a22),0,.18,.3,ex[1]);add(bx(2.2,.3,2.6),M(0xdad4e8),0,.5,.3,ex[1]);add(bx(1,.15,.5),M(0xffffff),0,.7,-.8,ex[1]);add(bx(2.2,.12,1.5),M(0x5a2a6e),0,.66,.6,ex[1]);add(bx(2.4,1,.15),M(0x3a2a22),0,.8,-1.15,ex[1]);
add(bx(1.1,2.6,1),M(0xd8e0e8),-4.2,1.3,-2.3,ex[2]);add(bx(.06,.8,.08),M(0x555566),-3.8,1.5,-1.77,ex[2]);add(bx(2,.12,1.2),M(0x6b4a33),0,.85,.9,ex[2]);add(new THREE.CylinderGeometry(.12,.12,.85,10),M(0x6b4a33),0,.42,.9,ex[2]);

// visitors: people wander in through the door, one per room at a time
let cur=0;
const vis=[{m:null},{m:null},{m:null}],DOORP=new THREE.Vector3(3.05,0,-2.3);
function person(){
 const g=new THREE.Group(),c=[0x3b7dd8,0xd84a4a,0x4aa86a,0xd8a83b,0x8a5ad8][Math.random()*5|0];
 add(new THREE.CylinderGeometry(.22,.28,.8,12),M(c),0,1,0,g);
 add(new THREE.SphereGeometry(.2,12,10),M(0xf1c9a5),0,1.62,0,g);
 const l1=add(bx(.14,.6,.14),M(0x2a2a3a),-.12,.3,0,g),l2=add(bx(.14,.6,.14),M(0x2a2a3a),.12,.3,0,g);
 const bc=document.createElement('canvas');bc.width=128;bc.height=48;
 const bt=new THREE.CanvasTexture(bc),bub=new THREE.Sprite(new THREE.SpriteMaterial({map:bt,transparent:true}));
 bub.scale.set(1.3,.5,1);bub.position.y=2.3;bub.visible=false;g.add(bub);
 g.userData={l1,l2,bub,bc,bt};S.add(g);return g}
function say(v,t){const u=v.m.userData,x=u.bc.getContext('2d');x.clearRect(0,0,128,48);x.fillStyle='#fff';x.fillRect(0,0,128,40);
 x.fillStyle='#000';x.font='bold 22px sans-serif';x.textAlign='center';x.fillText(t,64,28);u.bt.needsUpdate=true;u.bub.visible=true;v.say=performance.now()+1300}
function setWP(v){v.wp=new THREE.Vector3(-2.4+Math.random()*4.8,0,-.2+Math.random()*2.6)}
function spawn(i){
 if(vis[i].m)return;const m=person();m.position.copy(DOORP);m.visible=(i===cur);
 vis[i]={m,state:'walk',fear:0,vy:0,say:0,until:performance.now()+22000+Math.random()*10000};setWP(vis[i]);
 window.Room.on&&window.Room.on('arrive',i)}
function removeV(i,type){S.remove(vis[i].m);vis[i]={m:null};window.Room.on&&window.Room.on(type,i)}
function visitors(t){
 const now=performance.now();
 vis.forEach((v,i)=>{if(!v.m)return;const m=v.m,u=m.userData;
  if(v.state==='walk'&&now>v.until)v.state='out';
  const leaving=v.state!=='walk',tgt=leaving?DOORP:v.wp,spd=v.state==='flee'?.09:.025;
  const dx=tgt.x-m.position.x,dz=tgt.z-m.position.z,d=Math.hypot(dx,dz);
  if(d<.15){if(leaving){removeV(i,v.state==='flee'?'fled':'leave');return}setWP(v)}
  else{m.position.x+=dx/d*spd;m.position.z+=dz/d*spd;m.rotation.y=Math.atan2(dx,dz)}
  v.vy-=.012;m.position.y=Math.max(0,m.position.y+v.vy);if(m.position.y===0)v.vy=0;
  const w=Math.sin(t*(v.state==='flee'?18:8))*.5;u.l1.rotation.x=w;u.l2.rotation.x=-w;
  if(u.bub.visible&&now>v.say)u.bub.visible=false})}
function scare(n){
 const v=vis[cur];if(!v.m||v.state!=='walk')return{hit:false};
 v.fear+=n;v.vy=.1;const fled=v.fear>=3;say(v,fled?'NOPE!':'Aah!');if(fled)v.state='flee';return{hit:true,fled}}
function setRoom(i){cur=i;const r=RM[i];wallM.color.setHex(r[0]);sideM.color.setHex(r[1]);floorM.color.setHex(r[2]);
 ex.forEach((g,k)=>g.visible=k===i);vis.forEach((v,k)=>{if(v.m)v.m.visible=k===i});dk=-1.15;dkK=.3}
setRoom(0);
function sched(){setTimeout(()=>{const free=[0,1,2].filter(i=>!vis[i].m);if(free.length)spawn(free[Math.random()*free.length|0]);sched()},9000+Math.random()*14000)}
setTimeout(()=>spawn(1+(Math.random()*2|0)),5000);sched();

// loop
const clock=new THREE.Clock();let mx=0,my=0;
host.addEventListener('pointermove',e=>{const r=host.getBoundingClientRect();mx=(e.clientX-r.left)/r.width-.5;my=(e.clientY-r.top)/r.height-.5});
function loop(){
 requestAnimationFrame(loop);const t=clock.getElapsedTime();
 dg.rotation.y+=(dk-dg.rotation.y)*dkK;
 if(tvT[1]==='Static')drawTV();
 flick.forEach((l,i)=>l.intensity=l.userData.b*(.78+.22*Math.sin(t*9+i*2)*Math.random()));
 flames.forEach((f,i)=>f.scale.y=1.5+.4*Math.sin(t*12+i));
 bubbles.forEach((b,i)=>{const p=(t*.5+i*.27)%1;b.position.y=1+p*.55;b.scale.setScalar(1-p*.6)});
 bats.forEach(b=>{const a=t*b.sp+b.o,m=b.m;
  m.position.set(Math.cos(a)*b.r,b.y+Math.sin(t*2+b.o)*.3,-1+Math.sin(a)*b.r*.4);m.rotation.y=-a;
  const f=Math.sin(t*14+b.o)*.6;m.userData.w1.rotation.z=f;m.userData.w2.rotation.z=-f});
 sp.position.y=3.3+Math.sin(t*1.3)*.3;const th=5-sp.position.y;thread.scale.y=th;thread.position.y=th/2;
 if(performance.now()-lastHand>1500){gt.x=1.6+Math.sin(t*.4)*1.2;gt.y=3.3}
 const px0=gh.position.x;gh.position.x+=(gt.x-gh.position.x)*.08;gh.position.y+=(gt.y+Math.sin(t*2)*.12-gh.position.y)*.08;
 gh.rotation.z=-(gt.x-px0)*.15;
 visitors(t);
 C.position.set(mx*1.4+(Math.random()-.5)*shake*.15,2.7-my*.5+(Math.random()-.5)*shake*.15,6.4);shake*=.9;
 C.lookAt(0,2.1,-1);R.render(S,C)}
loop();

new ResizeObserver(()=>{R.setSize(W(),H(),false);C.aspect=W()/H();C.updateProjectionMatrix()}).observe(host);

window.Room={
 setRoom,scare,
 lights(on){amb.intensity=on?.7:.12;lampL.intensity=on?1.4:0;shadeM.emissiveIntensity=on?.9:0;gM.emissiveIntensity=on?.3:.9},
 tv(text){tvT=text.split('<br>');drawTV()},
 slam(){dk=0;dkK=.4;shake=.6;setTimeout(()=>{dk=-1.15;dkK=.05},1400)},
 ghost(nx,ny){lastHand=performance.now();gt.x=Math.max(-4,Math.min(4,(nx-.5)*8));gt.y=Math.max(1.2,Math.min(4.4,4.4-ny*3.4))}
};
})();
