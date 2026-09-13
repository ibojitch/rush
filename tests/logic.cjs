const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements=new Map();const gradient={addColorStop(){}};
const ctx=new Proxy({createLinearGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});
function el(id){if(!elements.has(id))elements.set(id,{width:960,height:540,hidden:false,textContent:'',classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},setPointerCapture(){},getContext:()=>ctx,click(){this.onclick?.()}});return elements.get(id)}
const sandbox={console,Math,performance:{now:()=>1000},setTimeout:()=>0,requestAnimationFrame:()=>0,Image:class{},addEventListener(){},document:{getElementById:el,addEventListener(){},querySelectorAll:()=>[]},window:{}};
vm.createContext(sandbox);vm.runInContext(code,sandbox);
function run(code){return vm.runInContext(code,sandbox)}
run('atlasReady=true;atlas.naturalWidth=1774;atlas.naturalHeight=887;mode="playing";');
assert.equal(run('SPRITE_FRAMES.flat().length'),16);run('render()');
for(const f of run('SPRITE_FRAMES.flat()')){assert(f.w>100&&f.h>150);assert(f.x+f.w<=1774&&f.y+f.h<=887)}
for(const facing of [-1,1]){
 run(`resetLevel();mode="playing";player.x=500;player.y=455;player.onGround=true;player.facing=${facing};keys.i=true;update(16.6667);keys.i=false;var bullet=shots[0];var origin=bullet.x-bullet.vx;var n=0;while(bullet.alive&&n++<100)update(16.6667);`);
 assert.equal(run('bullet.distance'),384);assert(Math.abs(run('Math.abs(bullet.x-origin)')-384)<.01);
}
run('resetLevel();mode="playing";player.y=455;player.onGround=false;player.coyote=90;keys[" "]=true;update(16.6667)');assert(run('player.vy<0'));run('clearKeys()');
run('resetLevel();player.safeX=500;player.safeY=455;player.x=900;player.y=700;hurtPlayer(true)');assert.equal(run('player.x'),500);assert.equal(run('player.hp'),2);
run('player.hp=1;hurtPlayer(true)');assert.equal(run('mode'),'dead');el('action').click();assert.equal(run('mode'),'playing');assert.equal(run('player.hp'),3);
for(let i=0;i<3;i++){run('player.x=level.goalX+1;player.y=455;update(16.6667)');assert.equal(run('mode'),'clear');el('action').click();assert.equal(run('stageIndex'),(i+1)%3);run('render()');}
run('togglePause()');assert.equal(run('mode'),'paused');const x=run('player.x');run('keys.arrowright=true;update(16.6667)');assert.equal(run('player.x'),x);el('action').click();assert.equal(run('mode'),'playing');
for(let i=0;i<3;i++){run(`stageIndex=${i};resetLevel();mode="playing";player.inv=100000;for(let n=0;n<600;n++)update(16.6667);render()`);assert(run('enemies.every(e=>Number.isFinite(e.x)&&Number.isFinite(e.y))'));}
// All intended jumps fit the player's maximum rise. Reachability of the primary route.
run('stageIndex=0;resetLevel();mode="playing";player.y=455;player.onGround=true;keys.arrowright=true');
let finished=false;for(let i=0;i<1800;i++){
 const jump=run('player.onGround && level.platforms.some(p=>p.y===455&&player.x<p.x+p.w&&player.x>p.x+p.w-32&&p.x+p.w<5200)');
 run(`keys[' ']=${jump};keys.i=${i%20===0};update(16.6667)`);
 if(run('player.clear')){finished=true;break;}if(run('player.dead'))break;
}console.log({mainRouteCompleted:finished,hp:run('player.hp'),x:run('player.x')});assert(finished);
console.log('PASS: syntax, 16 sprite rectangles, render paths, 384px range both directions, jump grace, fall recovery, touch-button retry handler, 3-stage progression, pause, enemy simulation, main route');



