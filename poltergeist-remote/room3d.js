// 3D haunted room (Three.js r128). Exposes window.Room for script.js.
(function(){
const host=document.getElementById('room');
let R;
try{R=new THREE.WebGLRenderer({antialias:true})}catch(e){
 host.insertAdjacentHTML('beforeend','<p style="padding:16px;color:#9a8fb0">3D view needs WebGL. Gestures still work.</p>');
 window.Room={lights(){},tv(){},slam(){},ghost(){}};return}
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
add(bx(10,.2,8),M(0xffffff,{map:pt}),0,-.1,1);
add(bx(10,5,.2),M(0x4a3a6e),0,2.5,-3.1);
add(bx(.2,5,8),M(0x3f3262),-5.1,2.5,1);
add(bx(.2,5,8),M(0x3f3262),5.1,2.5,1);

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
 C.position.set(mx*1.4+(Math.random()-.5)*shake*.15,2.7-my*.5+(Math.random()-.5)*shake*.15,6.4);shake*=.9;
 C.lookAt(0,2.1,-1);R.render(S,C)}
loop();

new ResizeObserver(()=>{R.setSize(W(),H(),false);C.aspect=W()/H();C.updateProjectionMatrix()}).observe(host);

window.Room={
 lights(on){amb.intensity=on?.7:.12;lampL.intensity=on?1.4:0;shadeM.emissiveIntensity=on?.9:0;gM.emissiveIntensity=on?.3:.9},
 tv(text){tvT=text.split('<br>');drawTV()},
 slam(){dk=0;dkK=.4;shake=.6;setTimeout(()=>{dk=-1.15;dkK=.05},1400)},
 ghost(nx,ny){lastHand=performance.now();gt.x=Math.max(-4,Math.min(4,(nx-.5)*8));gt.y=Math.max(1.2,Math.min(4.4,4.4-ny*3.4))}
};
})();
