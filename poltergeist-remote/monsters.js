// The ghost's power and fear rules. The other species' mechanics live in classes.js.
// Loaded after academy.js and before classes.js and script.js. It reads script.js globals (lightsOn, act, note, haunt) only at run time.
const Monster=(function(){
'use strict';
// Base fear a plain room action adds. Only the ghost scares by moving the room around.
const FEAR={lights:1,channel:1,door:3};
let sp=null;
const sc=b=>b<3?b*Academy.f:b; // a little fear is scaled by the monster's Scare stat; a big one is always big

function setSpecies(n){sp=n}
function fear(kind){return sp==='Ghost'?sc(FEAR[kind]||0):0}
function grab(src){note('Your hand passes right through it.',src)}
function use(src){
 Sfx.whoo(true);act('You wail through the walls.',src);Academy.on('wail');
 haunt(sc(lightsOn?.5:1),'Wail')}

return{setSpecies,fear,use,grab,powerName:()=>'Wail'}
})();
