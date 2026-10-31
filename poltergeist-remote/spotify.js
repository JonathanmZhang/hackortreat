// Haunted Jukebox: controls Spotify with Authorization Code + PKCE. Runs in the browser only: no client secret, nothing on server.js.
// Exposes window.Spotify for script.js and wires the Connect button and the now-playing display. Setup steps are in the README.
const SPOTIFY_CLIENT_ID='PASTE_CLIENT_ID_HERE';
const HAUNT_PLAYLIST=''; // optional spotify:playlist:... URI, started by the AI or by saying "spooky music"
(function(){
'use strict';
const $=id=>document.getElementById(id);
const TKEY='poltergeist-spotify',PKEY='poltergeist-spotify-pkce',AUTH='https://accounts.spotify.com',API='https://api.spotify.com/v1';
const SCOPES='user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private',POLL=4000;
const MSG={setup:"Spotify isn't set up yet",device:'Open Spotify on any device and start a song',login:'Spotify login expired. Connect again.',
 denied:"Spotify said no: this needs Premium, or this account isn't on the app's allowlist.",refused:"Spotify can't do that right now.",
 net:"Can't reach Spotify. Check your connection.",down:'Spotify is having trouble. Trying again soon.',
 failed:'Spotify login failed. Check the Client ID and redirect URI, then try again.',
 secure:'Spotify login needs HTTPS or http://127.0.0.1.',local:()=>'Spotify rejects localhost: open http://127.0.0.1:'+(location.port||80)+location.pathname};
const isSet=()=>!!SPOTIFY_CLIENT_ID&&SPOTIFY_CLIENT_ID!=='PASTE_CLIENT_ID_HERE';
const playback=()=>({playing:false,track:'',trackId:'',artist:'',album:'',albumArt:'',image:'',playlist:'',device:'',progress:0,duration:0});
let s=Object.assign({connected:false,msg:''},playback());
let tok=null,refreshing=null,waitUntil=0,seq=0,polledAt=0,holdUntil=0,ctxId='';
const lists={},subs=[];

// ---------- Storage (can be blocked, so every access is guarded) ----------
const loadTok=()=>{try{return JSON.parse(localStorage.getItem(TKEY))}catch(e){return null}};
const saveTok=()=>{try{if(tok)localStorage.setItem(TKEY,JSON.stringify(tok));else localStorage.removeItem(TKEY)}catch(e){}};
function setTok(j){tok={access:j.access_token,refresh:j.refresh_token||(tok&&tok.refresh),expires:Date.now()+(j.expires_in||3600)*1000};saveTok();s.connected=true}
function dropLogin(msg){tok=null;saveTok();s=Object.assign({connected:false,msg:msg||''},playback());ctxId='';emit()}

// ---------- Login ----------
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const redirectUri=()=>location.origin+location.pathname.replace(/index\.html$/,'').replace(/\/?$/,'/');
async function connect(){
 if(!isSet()){s.msg=MSG.setup;emit();return}
 if(location.hostname==='localhost'){s.msg=MSG.local();emit();return}
 if(!window.crypto||!crypto.subtle){s.msg=MSG.secure;emit();return}
 const verifier=b64(crypto.getRandomValues(new Uint8Array(64))),state=b64(crypto.getRandomValues(new Uint8Array(16)));
 const challenge=b64(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));
 try{sessionStorage.setItem(PKEY,JSON.stringify({verifier,state}))}catch(e){s.msg=MSG.failed;emit();return}
 location.assign(AUTH+'/authorize?'+new URLSearchParams({response_type:'code',client_id:SPOTIFY_CLIENT_ID,scope:SCOPES,redirect_uri:redirectUri(),state,code_challenge_method:'S256',code_challenge:challenge}))}
async function finishLogin(q){
 let saved=null;try{saved=JSON.parse(sessionStorage.getItem(PKEY));sessionStorage.removeItem(PKEY)}catch(e){}
 if(q.get('error')){s.msg='Spotify login was cancelled.';return}
 if(!saved||!q.get('state')||q.get('state')!==saved.state){s.msg='Spotify login could not be verified. Try again.';return}
 s.msg='Connecting…';emit();
 try{
  const r=await fetch(AUTH+'/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
   body:new URLSearchParams({grant_type:'authorization_code',code:q.get('code'),redirect_uri:redirectUri(),client_id:SPOTIFY_CLIENT_ID,code_verifier:saved.verifier})});
  if(!r.ok){s.msg=MSG.failed;return}
  setTok(await r.json());s.msg=''
 }catch(e){s.msg=MSG.net}}
// Shares one refresh between callers. A rejected token ends the login; a network or server problem keeps it for a retry.
function refresh(){
 if(!tok)return Promise.resolve(false);
 if(!refreshing)refreshing=(async()=>{
  try{
   const r=await fetch(AUTH+'/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({grant_type:'refresh_token',refresh_token:tok.refresh,client_id:SPOTIFY_CLIENT_ID})});
   if(r.status>=500)return false;
   if(!r.ok){dropLogin(MSG.login);return false}
   setTok(await r.json());return true
  }catch(e){return false}
 })().finally(()=>{refreshing=null});
 return refreshing}

// ---------- API ----------
// Returns a Response, or a stand-in {ok:false,status} (status 0 = network problem).
async function api(path,o,retried){
 if(!tok)return{ok:false,status:401};
 if(Date.now()<waitUntil)return{ok:false,status:429};
 if(Date.now()>tok.expires-60000&&!await refresh())return{ok:false,status:tok?0:401};
 let r;
 try{r=await fetch(API+path,Object.assign({},o,{headers:Object.assign({Authorization:'Bearer '+tok.access},o&&o.headers)}))}catch(e){return{ok:false,status:0}}
 if(r.status===401){
  if(retried){dropLogin(MSG.login);return{ok:false,status:401}}
  return await refresh()?api(path,o,true):{ok:false,status:tok?0:401}}
 if(r.status===429)waitUntil=Date.now()+(+r.headers.get('Retry-After')||5)*1000;
 return r}
async function problem(r){
 if(!r.status)return MSG.net;
 if(r.status===401)return MSG.login;
 if(r.status===429)return'Spotify asked us to slow down. Waiting '+Math.max(1,Math.ceil((waitUntil-Date.now())/1000))+' s.';
 if(r.status===404)return MSG.device;
 if(r.status===403){let m='';try{const e=(await r.clone().json()).error||{};m=(e.reason||'')+' '+(e.message||'')}catch(e){}
  return/no.active.device/i.test(m)?MSG.device:/restriction/i.test(m)?MSG.refused:MSG.denied}
 return r.status>=500?MSG.down:MSG.refused}

// Playlist name and image if Spotify allows it; some endpoints are restricted for development-mode apps, so fall back to the album silently.
function applyList(){const l=lists[ctxId];s.playlist=l?l.name:s.album;s.image=l&&l.image||s.albumArt}
async function loadList(id){
 lists[id]=null;
 const r=await api('/playlists/'+encodeURIComponent(id)+'?fields=name,images');
 if(!r.ok){if(r.status!==403&&r.status!==404)delete lists[id];return}
 try{const j=await r.json();lists[id]={name:j.name||'',image:j.images&&j.images[0]&&j.images[0].url||''};applyList();emit()}catch(e){}}
function read(j){
 const it=j.item||{},alb=it.album||it.show||{},c=j.context;
 if(Date.now()>=holdUntil)s.playing=!!j.is_playing; // a toggle just sent wins over an answer that may predate it
 s.track=it.name||'';s.trackId=it.id||it.uri||'';s.artist=it.artists?it.artists.map(a=>a.name).join(', '):it.show&&it.show.name||'';
 s.album=alb.name||'';s.albumArt=alb.images&&alb.images[0]&&alb.images[0].url||'';
 s.device=j.device&&j.device.name||'';s.progress=j.progress_ms||0;s.duration=it.duration_ms||0;polledAt=Date.now();
 ctxId=c&&c.type==='playlist'&&c.uri?c.uri.split(':').pop():'';
 if(ctxId&&!(ctxId in lists))loadList(ctxId);
 applyList()}
async function poll(){
 if(!tok||document.hidden)return;
 const id=++seq,r=await api('/me/player?additional_types=episode');
 if(id!==seq||!tok)return;
 if(r.status===204){Object.assign(s,playback());ctxId='';s.msg=MSG.device}
 else if(r.ok){let j=null;try{j=await r.json()}catch(e){}
  if(id!==seq)return;
  if(j){read(j);s.msg=''}else{Object.assign(s,playback());ctxId='';s.msg=MSG.device}}
 else s.msg=await problem(r);
 emit()}
function burst(){poll();setTimeout(poll,400);setTimeout(poll,1100)} // a new track takes a moment to show up
async function ctl(method,path,body){
 if(!tok)return false;seq++;
 const o={method};if(body){o.headers={'Content-Type':'application/json'};o.body=JSON.stringify(body)}
 const r=await api(path,o);
 if(!r.ok){s.msg=await problem(r);emit();return false}
 s.msg='';emit();burst();return true}
const pos=()=>Math.min(s.duration,s.progress+(s.playing?Date.now()-polledAt:0));
async function setPlaying(want,body){
 const p=pos(),ok=await ctl('PUT','/me/player/'+(want?'play':'pause'),body);
 if(ok){s.progress=body?0:p;polledAt=Date.now();s.playing=want;holdUntil=Date.now()+1500;emit()}
 return ok}

// ---------- Panel ----------
function paintBar(){const b=$('jBar');if(!b)return;const k=s.duration?pos()/s.duration:0;b.style.transform='scaleX('+k+')';$('jProg').setAttribute('aria-valuenow',Math.round(k*100))}
function paint(){
 const p=$('jukebox');if(!p)return;
 const has=s.connected&&!!(s.track||s.device),art=$('jArt'),btn=$('jConnect'),play=$('jPlay');
 p.classList.toggle('playing',s.playing);
 $('jNow').hidden=$('jProg').hidden=!has;$('jCtl').hidden=!s.connected;
 btn.hidden=!isSet();btn.textContent=s.connected?'Disconnect':'Connect Spotify';
 $('jTrack').textContent=s.track||'Nothing playing';$('jArtist').textContent=s.artist;$('jList').textContent=s.playlist;$('jDevice').textContent=s.device&&'on '+s.device;
 if(art.getAttribute('src')!==s.image){if(s.image)art.src=s.image;else art.removeAttribute('src')}
 art.hidden=!s.image;art.alt=s.playlist&&'Cover art: '+s.playlist;
 play.textContent=s.playing?'⏸':'▶';play.setAttribute('aria-label',s.playing?'Pause':'Play');
 $('jStatus').textContent=isSet()?s.msg||(s.connected?'':'Connect to work the jukebox with gestures and voice.'):MSG.setup;
 paintBar()}
function emit(){paint();subs.forEach(cb=>{try{cb(state())}catch(e){}})}
const state=()=>Object.assign({},s,{progress:pos()});
const btn=$('jConnect');if(btn)btn.onclick=()=>{if(s.connected)dropLogin();else connect()};

// ---------- Start: nothing runs at all until a Client ID is pasted in ----------
paint();
if(isSet()){
 const q=new URLSearchParams(location.search),back=q.has('code')||q.has('error');
 if(back){const u=new URLSearchParams(q);['code','state','error'].forEach(k=>u.delete(k));
  try{history.replaceState(null,'',location.pathname+(u.toString()?'?'+u:'')+location.hash)}catch(e){}}
 tok=loadTok();if(tok&&tok.access&&tok.refresh)s.connected=true;else tok=null;
 (back?finishLogin(q):Promise.resolve()).catch(()=>{s.msg=MSG.failed}).then(()=>{emit();poll()});
 setInterval(poll,POLL);setInterval(()=>{if(s.playing&&!document.hidden)paintBar()},500);
 document.addEventListener('visibilitychange',poll)}

window.Spotify={
 ready:isSet,connected:()=>s.connected,state,connect,disconnect:()=>dropLogin(),
 next:()=>ctl('POST','/me/player/next'),previous:()=>ctl('POST','/me/player/previous'),
 togglePlay:()=>setPlaying(!s.playing),
 play:uri=>setPlaying(true,uri?{context_uri:uri}:undefined),
 onChange(cb){subs.push(cb);return()=>{const i=subs.indexOf(cb);if(i>=0)subs.splice(i,1)}}
};
})();
