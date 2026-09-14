const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements=new Map(),handlers={},storage=new Map();const gradient={addColorStop(){}};
const ctx=new Proxy({createLinearGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});
function el(id){if(!elements.has(id))elements.set(id,{width:960,height:540,hidden:false,textContent:'',classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},setPointerCapture(){},getContext:()=>ctx,click(){this.onclick?.()}});return elements.get(id)}
const sandbox={console,Math,performance:{now:()=>1000},setTimeout:()=>0,requestAnimationFrame:()=>0,Image:class{},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},addEventListener(type,fn){(handlers[type]??=[]).push(fn)},document:{getElementById:el,addEventListener(){},querySelectorAll:()=>[]},window:{}};
vm.createContext(sandbox);vm.runInContext(code,sandbox);
function run(code){return vm.runInContext(code,sandbox)}
run('atlasReady=true;atlas.naturalWidth=1280;atlas.naturalHeight=456;mode="playing";');
assert.equal(run('SPRITE_TILES.flat().length'),16);
assert.equal(run('new Set(SPRITE_TILES.flat().map(f=>f.name)).size'),16);
assert.equal(run('SPRITE_ATLAS.width'),1280);assert.equal(run('SPRITE_ATLAS.height'),456);run('render()');
for(const f of run('SPRITE_TILES.flat()')){assert(f.w>100&&f.h>150);assert(f.x>=0&&f.y>=0);assert(f.x+f.w<=1280&&f.y+f.h<=456)}
for(const facing of [-1,1]){
 run(`resetLevel();level.platforms=[{x:0,y:455,w:5200,h:85}];enemies=[];mode="playing";player.x=500;player.y=455;player.onGround=true;player.facing=${facing};keys.i=true;update(16.6667);keys.i=false;var bullet=shots[0];var origin=bullet.x-bullet.vx;var launchVy=bullet.vy;var n=0;while(bullet.alive&&n++<160)update(16.6667);`);
 assert(run('Math.sign(launchVy)')===-1);assert(run('Math.abs(bullet.vx)<8.5'));assert(run('Math.abs(bullet.x-origin)>250'));assert.equal(run('bullet.alive'),false);
}
assert(!code.includes('remainingX=600'));assert(!code.includes('travelX>=600'));
run('resetLevel();mode="playing";player.y=455;player.onGround=false;player.coyote=90;keys[" "]=true;update(16.6667)');assert(run('player.vy<0'));run('clearKeys()');
run('resetLevel();mode="playing";player.y=455;player.onGround=false;player.coyote=90;keys.x=true;update(16.6667)');assert(run('player.vy<0'));run('clearKeys()');
run('resetLevel();mode="playing";player.x=500;player.y=455;player.onGround=true;keys.z=true;update(16.6667)');assert.equal(run('shots.length'),1);run('clearKeys()');
run('resetLevel();player.safeX=500;player.safeY=455;player.x=900;player.y=700;hurtPlayer(true)');assert.equal(run('player.x'),500);assert.equal(run('player.hp'),2);
run('player.hp=1;hurtPlayer(true)');assert.equal(run('mode'),'dead');el('action').click();assert.equal(run('mode'),'playing');assert.equal(run('player.hp'),3);
assert.equal(run('STAGE_COUNT'),5);assert.equal(run('themes.length'),5);
run('stageIndex=0;resetLevel();mode="playing";player.x=level.goalX+1;player.y=455;update(16.6667)');handlers.keydown.forEach(fn=>fn({key:'Enter',repeat:false,preventDefault(){}}));assert.equal(run('mode'),'clear');assert.equal(run('stageIndex'),0);handlers.keydown.forEach(fn=>fn({key:'x',repeat:false,preventDefault(){}}));assert.equal(run('mode'),'playing');assert.equal(run('stageIndex'),1);
run('stageIndex=0;totalIbo=0;stageStartIbo=0;resetLevel();mode="playing"');
for(let i=0;i<5;i++){run('player.x=level.goalX+1;player.y=455;update(16.6667)');assert.equal(run('mode'),'clear');el('action').click();assert.equal(run('stageIndex'),(i+1)%5);run('render()');}
run('muted=true;stageIndex=0;resetLevel();player.x=level.goalX+1;mode="playing";update(16.6667)');el('action').click();assert.equal(run('muted'),true);
run('muted=false;stageIndex=0;resetLevel();player.x=level.goalX+1;mode="playing";update(16.6667)');el('action').click();assert.equal(run('muted'),false);
run('togglePause()');assert.equal(run('mode'),'paused');const x=run('player.x');run('keys.arrowright=true;update(16.6667)');assert.equal(run('player.x'),x);el('action').click();assert.equal(run('mode'),'playing');
for(let i=0;i<5;i++){run(`stageIndex=${i};resetLevel();mode="playing";player.inv=100000;for(let n=0;n<600;n++)update(16.6667);render()`);assert(run('enemies.every(e=>Number.isFinite(e.x)&&Number.isFinite(e.y))'));}
assert.equal(run('enemyCanShoot("walker",0)'),false);assert.equal(run('enemyCanShoot("hopper",1)'),true);assert.equal(run('enemyCanShoot("flyer",1)'),false);assert.equal(run('enemyCanShoot("hopper",2)'),true);assert.equal(run('enemyCanShoot("flyer",2)'),true);assert.equal(run('enemyCanShoot("walker",2)'),false);assert.equal(run('enemyCanShoot("walker",3)'),true);assert.equal(run('beamTuning(3).speed<beamTuning(4).speed'),true);assert.equal(run('beamTuning(3).cooldown>beamTuning(4).cooldown'),true);
run('stageIndex=1;resetLevel();mode="playing";const horned=enemies.find(e=>e.type==="hopper");player.x=horned.x;player.y=horned.y-player.h+12;player.vy=5;player.inv=0;update(0)');assert.equal(run('horned.alive'),true);assert.equal(run('player.hp'),2);
run('muted=true;stageIndex=1;resetLevel();mode="playing";const shooter=enemies.find(e=>e.type==="hopper");player.x=700;player.y=455;shooter.x=400;shooter.y=455;shooter.onGround=true;shooter.beamCd=0;update(16.6667)');assert(run('enemyShots.length>0'));
// Stage 2's first firing enemy drops KOE. Collection survives stages and continues, but a fresh run resets it.
run('dropKoeItem(shooter)');assert.equal(run('koeItemState'),'dropped');assert.equal(run('powerups.filter(p=>p.type==="koe").length'),1);
run('const koe=powerups.find(p=>p.type==="koe");player.x=koe.x;player.y=koe.y+player.h/2;update(0)');assert.equal(run('koeItemState'),'collected');assert.equal(run('voiceEnergy'),50);
run('stageIndex=2;resetLevel()');assert.equal(run('koeItemState'),'collected');
run('restartCurrentStage()');assert.equal(run('koeItemState'),'collected');
run('mode="playing";player.facing=1;voiceEnergy=VOICE_ENERGY_MAX;voiceAttacks=[];voiceFog=[];fireVoiceAttack("p");var shortVoice=voiceAttacks[0];fireVoiceAttack("v")');assert.equal(run('shortVoice.text'),'プ');assert(run('shortVoice.vx<0'));assert.equal(run('shortVoice.range'),run('W*.30'));assert.equal(run('voiceEnergy'),94);assert.equal(run('voiceAttacks.length'),1);assert.equal(run('voiceFog.length'),4);
run('voiceAttacks=[];fireVoiceAttack("v");var longVoice=voiceAttacks[0]');assert.equal(run('longVoice.text'),'ヴリヴリブー');assert(run('Math.abs(longVoice.vx)<Math.abs(shortVoice.vx)'));assert.equal(run('longVoice.range'),run('W*.70'));
run('voiceAttacks=[];level.platforms=[{x:0,y:300,w:5200,h:85}];player.x=500;player.y=307;player.facing=1;voiceEnergy=VOICE_ENERGY_MAX;fireVoiceAttack("p");update(0)');assert.equal(run('voiceAttacks.length'),1);
run('startFromStageOne()');assert.equal(run('koeItemState'),'pending');
run('stageIndex=0;resetLevel();mode="playing";enemies=[];player.hp=2;player.x=level.hearts[0].x;player.y=level.hearts[0].y+player.h/2;update(0)');assert.equal(run('player.hp'),3);assert(run('level.hearts[0].taken'));
run('highScore=0;stageIndex=0;stageStartScore=9;resetLevel();mode="playing";enemies=[];totalIbo=9;Math.random=()=>0;const coin=level.coins[0];player.x=coin.x;player.y=coin.y+player.h/2;update(0)');assert.equal(run('totalIbo'),10);assert.equal(run('totalScore'),11);assert.equal(run('highScore'),11);assert.equal(storage.get('ibojigen-rush-high-score'),'11');assert.equal(run('powerups.filter(p=>p.type==="star").length'),1);assert.equal(run('powerups.filter(p=>p.type==="maxHeart").length'),1);
run('const star=powerups.find(p=>p.type==="star");player.x=star.x;player.y=star.y+player.h/2;update(0)');assert.equal(run('player.starTime'),8000);const hp=run('player.hp');run('hurtPlayer(false)');assert.equal(run('player.hp'),hp);run('player.starTime=975');assert.equal(run('playerIsGold()'),false);run('player.starTime=925');assert.equal(run('playerIsGold()'),true);
run('const bigHeart=powerups.find(p=>p.type==="maxHeart");player.hp=1;player.x=bigHeart.x;player.y=bigHeart.y+player.h/2;update(0)');assert.equal(run('player.maxHp'),4);assert.equal(run('player.hp'),4);assert.equal(run('runMaxHp'),4);
run('stageIndex=3;totalScore=27;stageStartScore=20;totalIbo=27;stageStartIbo=20;runMaxHp=4;mode="dead"');handlers.keydown.forEach(fn=>fn({key:'c',repeat:false,preventDefault(){}}));assert.equal(run('stageIndex'),3);assert.equal(run('totalScore'),0);assert.equal(run('totalIbo'),0);assert.equal(run('player.maxHp'),4);
run('stageIndex=0;mode="dead";setMode("dead")');assert.equal(el('retry').hidden,true);
run('stageIndex=2;totalScore=18;stageStartScore=12;totalIbo=18;stageStartIbo=12;runMaxHp=4;mode="dead";setMode("dead")');assert.equal(el('retry').hidden,false);assert.equal(el('retry').textContent,'コンティニュー');el('retry').click();assert.equal(run('stageIndex'),2);assert.equal(run('totalScore'),0);assert.equal(run('totalIbo'),0);assert.equal(run('mode'),'playing');assert.equal(run('player.maxHp'),4);
run('stageIndex=3;totalScore=27;stageStartScore=20;totalIbo=27;stageStartIbo=20;runMaxHp=4;mode="playing"');handlers.keydown.forEach(fn=>fn({key:'r',repeat:false,preventDefault(){}}));assert.equal(run('stageIndex'),0);assert.equal(run('totalScore'),0);assert.equal(run('totalIbo'),0);assert.equal(run('player.maxHp'),3);
assert.equal(run('VOICE_ENERGY_MAX'),100);assert.equal(run('KOE_PICKUP_ENERGY'),50);assert.equal(run('enemyScore({type:"walker"})'),1);assert.equal(run('enemyScore({type:"hopper"})'),2);assert.equal(run('enemyScore({type:"flyer"})'),3);assert.equal(run('stageIndex=1;enemyScore({type:"hopper"})'),3);assert.equal(run('stageIndex=2;enemyScore({type:"flyer"})'),4);
run('stageIndex=0;stageStartScore=0;resetLevel();mode="playing";koeItemState="collected";voiceEnergy=43;const target={type:"walker",alive:true,id:-1};defeatEnemy(target)');assert.equal(run('totalScore'),1);assert.equal(run('voiceEnergy'),45);
// All intended jumps fit the player's maximum rise. Reachability of the primary route.
run('stageIndex=0;resetLevel();mode="playing";player.y=455;player.onGround=true;keys.arrowright=true');
let finished=false;for(let i=0;i<1800;i++){
 const jump=run('player.onGround && level.platforms.some(p=>p.y===455&&player.x<p.x+p.w&&player.x>p.x+p.w-32&&p.x+p.w<5200)');
 run(`keys[' ']=${jump};keys.i=${i%20===0};update(16.6667)`);
 if(run('player.clear')){finished=true;break;}if(run('player.dead'))break;
}console.log({mainRouteCompleted:finished,hp:run('player.hp'),x:run('player.x')});assert(finished);
console.log('PASS: syntax, controls, stage-1 retry, C/button continue from stage 2+, 5-stage progression, cumulative/high score, enemy beams, hearts, star power, pause, main route');



