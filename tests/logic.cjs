const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements=new Map(),handlers={},storage=new Map();const gradient={addColorStop(){}};
const ctx=new Proxy({createLinearGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});
function el(id){if(!elements.has(id))elements.set(id,{width:960,height:540,hidden:false,textContent:'',classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},setPointerCapture(){},getContext:()=>ctx,click(){this.onclick?.()}});return elements.get(id)}
const sandbox={console,Math,performance:{now:()=>1000},setTimeout:()=>0,requestAnimationFrame:()=>0,Image:class{},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},addEventListener(type,fn){(handlers[type]??=[]).push(fn)},document:{getElementById:el,addEventListener(){},querySelectorAll:()=>[]},window:{}};
vm.createContext(sandbox);vm.runInContext(code,sandbox);
function run(code){return vm.runInContext(code,sandbox)}
run('atlasReady=true;atlas.naturalWidth=1280;atlas.naturalHeight=684;mode="playing";');
assert.equal(run('SPRITE_TILES.flat().length'),16);
assert.equal(run('new Set(SPRITE_TILES.flat().map(f=>f.name)).size'),16);
assert.equal(run('SPRITE_ATLAS.width'),1280);assert.equal(run('SPRITE_ATLAS.height'),684);assert.equal(run('KOE_TILE.y'),524);run('render()');
for(const f of run('SPRITE_TILES.flat()')){assert(f.w>100&&f.h>150);assert(f.x>=0&&f.y>=0);assert(f.x+f.w<=1280&&f.y+f.h<=684)}
assert.deepEqual(run('overlapCenter({x:10,y:20,w:30,h:20},{x:25,y:25,w:20,h:30})'),{x:32.5,y:32.5});
assert(run('shotTrailEndpoints({x:500,y:200,vx:7,vy:0}).tailX<500'));assert(run('shotTrailEndpoints({x:500,y:200,vx:-7,vy:0}).tailX>500'));
assert.equal(run('shotItemState'),'pending');run('resetLevel();mode="playing";keys.i=true;update(16.6667);keys.i=false');assert.equal(run('shots.length'),0);assert.equal(el('shot').hidden,true);assert(!el('controlsHelp').textContent.includes('ミサイル'));assert(el('controlsHelp').textContent.includes('C コンティニュー（GAME OVER時）'));run('shotItemState="collected";syncShotUI();syncControlsHelp()');assert(el('controlsHelp').textContent.includes('I / Z ミサイル'));
assert.equal(run('typeof sfx.shotUnlock'),'function');
assert.equal(run('typeof sfx.voiceAttack'),'function');
run('stompKills=0;koeItemState="pending";shotItemState="pending"');assert(run('gameOverHintCandidates(false)').includes('敵は 上からふみつけて たおすことができるぞ'));assert(!run('gameOverHintCandidates(false)').some(h=>h.includes('ボタンをおす長さ')));assert(run('gameOverHintCandidates(false)').some(h=>h.includes('干し芋')));
run('stompKills=1;koeItemState="collected";shotItemState="collected"');assert(!run('gameOverHintCandidates(true)').some(h=>h.includes('ふみつけて')));assert(run('gameOverHintCandidates(true)').some(h=>h.includes('ボタンをおす長さ')));assert(run('gameOverHintCandidates(true)').some(h=>h.includes('強い声')));
for(const facing of [-1,1]){
 run(`resetLevel();level.platforms=[{x:0,y:455,w:5200,h:85}];enemies=[];mode="playing";player.x=500;player.y=455;player.onGround=true;player.facing=${facing};keys.i=true;update(16.6667);keys.i=false;var bullet=shots[0];var origin=bullet.x-bullet.vx;var launchVy=bullet.vy;var n=0;while(bullet.alive&&n++<160)update(16.6667);`);
 assert(run('Math.sign(launchVy)')===-1);assert(run('Math.abs(bullet.vx)<8.5'));assert(run('Math.abs(bullet.x-origin)>180'));assert.equal(run('bullet.alive'),false);
}
assert(!code.includes('remainingX=600'));assert(!code.includes('travelX>=600'));assert(code.includes('s.vy+=.20*f'));
assert(!code.includes('previousY+s.r<=FLOOR_Y'));
run('resetLevel();mode="playing";player.y=455;player.onGround=false;player.coyote=90;keys[" "]=true;update(16.6667)');assert(run('player.vy<0'));run('clearKeys()');
run('resetLevel();mode="playing";player.y=455;player.onGround=false;player.coyote=90;keys.x=true;update(16.6667)');assert(run('player.vy<0'));run('clearKeys()');
run('resetLevel();mode="playing";player.x=500;player.y=455;player.onGround=true;keys.z=true;update(16.6667)');assert.equal(run('shots.length'),1);run('clearKeys()');
run('resetLevel();player.safeX=500;player.safeY=455;player.x=900;player.y=700;hurtPlayer(true)');assert.equal(run('player.x'),500);assert.equal(run('player.hp'),2);
run('player.hp=1;hurtPlayer(true)');assert.equal(run('mode'),'dead');el('action').click();assert.equal(run('mode'),'playing');assert.equal(run('player.hp'),3);
assert.equal(run('STAGE_COUNT'),5);assert.equal(run('themes.length'),5);
assert.equal(run('enemyAttackOriginY({y:500,h:100})'),415);
run('debugMode=false;stageIndex=2;resetLevel();mode="playing";player.hp=1;voiceEnergy=4;shotItemState="pending";koeItemState="pending";syncShotUI();syncVoiceUI()');
handlers.keydown.forEach(fn=>fn({key:'d',ctrlKey:true,repeat:false,preventDefault(){}}));assert.equal(run('debugMode'),true);
handlers.keydown.forEach(fn=>fn({key:'f',ctrlKey:false,repeat:false,preventDefault(){}}));assert.equal(run('shotItemState'),'collected');assert.equal(run('koeItemState'),'collected');assert.equal(run('player.hp'),run('player.maxHp'));assert.equal(run('voiceEnergy'),run('VOICE_ENERGY_MAX'));
handlers.keydown.forEach(fn=>fn({key:'5',ctrlKey:false,repeat:false,preventDefault(){}}));assert.equal(run('stageIndex'),4);assert.equal(run('mode'),'playing');assert.equal(run('shotItemState'),'pending');assert.equal(run('koeItemState'),'pending');
handlers.keydown.forEach(fn=>fn({key:'d',ctrlKey:true,repeat:false,preventDefault(){}}));assert.equal(run('debugMode'),false);
run('stageIndex=4;resetLevel();mode="playing";var boss=enemies.find(e=>e.type==="boss")');assert(run('boss'));assert.equal(run('boss.hp'),3);assert(run('bossAlive()'));assert.equal(run('level.bossGate'),run('level.goalX-70'));
run('player.x=level.goalX+1;update(16.6667)');assert.equal(run('mode'),'playing');
run('boss.hitCooldown=0;damageEnemy(boss)');assert.equal(run('boss.hp'),2);assert(run('boss.damageInv>0'));run('damageEnemy(boss)');assert.equal(run('boss.hp'),2);
run('boss.hitCooldown=0;boss.damageInv=0;damageEnemy(boss);boss.hitCooldown=0;boss.damageInv=0;damageEnemy(boss)');assert.equal(run('bossAlive()'),false);
run('player.x=level.goalX+1;update(16.6667)');assert.equal(run('mode'),'clear');
run('stageIndex=4;resetLevel();mode="playing";var contactBoss=enemies.find(e=>e.type==="boss");player.x=contactBoss.x;player.y=contactBoss.y;player.hp=3;player.starTime=0;update(0)');assert.equal(run('contactBoss.hp'),3);assert.equal(run('player.hp'),2);assert.notEqual(run('player.x'),run('contactBoss.x'));
run('stageIndex=4;resetLevel();mode="playing";var starBoss=enemies.find(e=>e.type==="boss");player.x=starBoss.x;player.y=starBoss.y;player.starTime=8000;const hpBeforeBossContact=player.hp;update(0)');assert.equal(run('starBoss.hp'),3);assert.equal(run('player.hp'),run('hpBeforeBossContact'));assert.notEqual(run('player.x'),run('starBoss.x'));
run('stageIndex=0;resetLevel();mode="playing";player.x=level.goalX+1;player.y=455;update(16.6667)');handlers.keydown.forEach(fn=>fn({key:'Enter',repeat:false,preventDefault(){}}));assert.equal(run('mode'),'clear');assert.equal(run('stageIndex'),0);handlers.keydown.forEach(fn=>fn({key:'x',repeat:false,preventDefault(){}}));assert.equal(run('mode'),'playing');assert.equal(run('stageIndex'),1);
run('stageIndex=0;totalIbo=0;stageStartIbo=0;resetLevel();mode="playing"');
for(let i=0;i<5;i++){if(i===4)run('enemies.find(e=>e.type==="boss").alive=false');run('player.x=level.goalX+1;player.y=455;update(16.6667)');assert.equal(run('mode'),'clear');el('action').click();assert.equal(run('stageIndex'),(i+1)%5);run('render()');}
run('muted=true;stageIndex=0;resetLevel();player.x=level.goalX+1;mode="playing";update(16.6667)');el('action').click();assert.equal(run('muted'),true);
run('muted=false;stageIndex=0;resetLevel();player.x=level.goalX+1;mode="playing";update(16.6667)');el('action').click();assert.equal(run('muted'),false);
run('togglePause()');assert.equal(run('mode'),'paused');const x=run('player.x');run('keys.arrowright=true;update(16.6667)');assert.equal(run('player.x'),x);el('action').click();assert.equal(run('mode'),'playing');
for(let i=0;i<5;i++){run(`stageIndex=${i};resetLevel();mode="playing";player.inv=100000;for(let n=0;n<600;n++)update(16.6667);render()`);assert(run('enemies.every(e=>Number.isFinite(e.x)&&Number.isFinite(e.y))'));}
assert.equal(run('enemyCanShoot("walker",0)'),false);assert.equal(run('enemyCanShoot("hopper",1)'),true);assert.equal(run('enemyCanShoot("flyer",1)'),false);assert.equal(run('enemyCanShoot("hopper",2)'),true);assert.equal(run('enemyCanShoot("flyer",2)'),true);assert.equal(run('enemyCanShoot("walker",2)'),false);assert.equal(run('enemyCanShoot("walker",3)'),true);assert.equal(run('beamTuning(3).speed<beamTuning(4).speed'),true);assert.equal(run('beamTuning(3).cooldown>beamTuning(4).cooldown'),true);
run('stageIndex=1;resetLevel();mode="playing";const horned=enemies.find(e=>e.type==="hopper");player.x=horned.x;player.y=horned.y-player.h+12;player.vy=5;player.inv=0;update(0)');assert.equal(run('horned.alive'),true);assert.equal(run('player.hp'),2);
run('stageIndex=1;resetLevel();mode="playing";const starHorned=enemies.find(e=>e.type==="hopper");player.x=starHorned.x;player.y=starHorned.y;player.starTime=8000;const starHp=player.hp;update(0)');assert.equal(run('starHorned.alive'),false);assert.equal(run('player.hp'),run('starHp'));
run('muted=true;stageIndex=1;resetLevel();mode="playing";const shooter=enemies.find(e=>e.type==="hopper");player.x=700;player.y=455;shooter.x=400;shooter.y=455;shooter.onGround=true;shooter.beamCd=0;update(16.6667)');assert(run('enemyShots.length>0'));
// The first enemy drops KOE. A Stage 2 firing enemy drops the normal-shot unlock.
run('startFromStageOne();mode="playing";const firstEnemy=enemies[0];dropKoeItem(firstEnemy)');assert.equal(run('koeItemState'),'dropped');assert.equal(run('powerups.filter(p=>p.type==="koe").length'),1);
run('const koe=powerups.find(p=>p.type==="koe");player.x=koe.x;player.y=koe.y+player.h/2;update(0)');assert.equal(run('koeItemState'),'collected');assert.equal(run('voiceEnergy'),50);
assert(el('controlsHelp').textContent.includes('P / S / B / V 声攻撃'));
run('stageIndex=1;resetLevel();mode="playing";const shotEnemy=enemies.find(e=>e.type==="hopper");dropShotItem(shotEnemy)');assert.equal(run('shotItemState'),'dropped');assert.equal(run('powerups.filter(p=>p.type==="shot").length'),1);
run('const shotItem=powerups.find(p=>p.type==="shot");player.x=shotItem.x;player.y=shotItem.y+player.h/2;update(0)');assert.equal(run('shotItemState'),'collected');assert.equal(el('shot').hidden,false);
run('stageIndex=2;resetLevel()');assert.equal(run('koeItemState'),'collected');assert.equal(run('shotItemState'),'collected');
run('restartCurrentStage()');assert.equal(run('koeItemState'),'collected');assert.equal(run('shotItemState'),'collected');
run('mode="playing";player.facing=1;voiceEnergy=VOICE_ENERGY_MAX;voiceAttacks=[];voiceFog=[];fireVoiceAttack("p");var shortVoice=voiceAttacks[0];fireVoiceAttack("v")');assert.equal(run('shortVoice.text'),'プ');assert(run('shortVoice.vx<0'));assert.equal(run('shortVoice.range'),run('W*.30'));assert.equal(run('voiceEnergy'),92);assert.equal(run('voiceAttacks.length'),1);assert.equal(run('voiceFog.length'),4);
run('voiceAttacks=[];fireVoiceAttack("v");var longVoice=voiceAttacks[0]');assert.equal(run('longVoice.text'),'ヴリヴリブー');assert(run('Math.abs(longVoice.vx)<Math.abs(shortVoice.vx)'));assert.equal(run('longVoice.range'),run('W*.70'));
run('mode="playing";koeItemState="collected";voiceEnergy=7;voiceAttacks=[];voiceFog=[];fireVoiceAttack("p")');assert.equal(run('voiceAttacks.length'),0);assert.equal(run('voiceFog.length'),4);assert.equal(run('voiceFog[0].color'),'#ffffff');assert.equal(el('voice').disabled,false);
run('voiceAttacks=[];level.platforms=[{x:0,y:300,w:5200,h:85}];player.x=500;player.y=307;player.facing=1;voiceEnergy=VOICE_ENERGY_MAX;fireVoiceAttack("p");update(0)');assert.equal(run('voiceAttacks.length'),1);
run('startFromStageOne()');assert.equal(run('koeItemState'),'pending');assert.equal(run('shotItemState'),'pending');assert.equal(el('shot').hidden,true);
run('stageIndex=0;resetLevel();mode="playing";enemies=[];player.hp=2;player.x=level.hearts[0].x;player.y=level.hearts[0].y+player.h/2;update(0)');assert.equal(run('player.hp'),3);assert(run('level.hearts[0].taken'));
run('highScore=0;stageIndex=0;stageStartScore=9;resetLevel();mode="playing";enemies=[];totalIbo=9;Math.random=()=>0;const coin=level.coins[0];player.x=coin.x;player.y=coin.y+player.h/2;update(0)');assert.equal(run('totalIbo'),10);assert.equal(run('totalScore'),11);assert.equal(run('highScore'),11);assert.equal(storage.get('ibojigen-rush-high-score'),'11');assert.equal(run('powerups.filter(p=>p.type==="star").length'),1);assert.equal(run('powerups.filter(p=>p.type==="maxHeart").length'),1);
run('const star=powerups.find(p=>p.type==="star");player.x=star.x;player.y=star.y+player.h/2;update(0)');assert.equal(run('player.starTime'),8000);const hp=run('player.hp');run('hurtPlayer(false)');assert.equal(run('player.hp'),hp);run('player.starTime=975');assert.equal(run('playerIsGold()'),false);run('player.starTime=925');assert.equal(run('playerIsGold()'),true);
run('const bigHeart=powerups.find(p=>p.type==="maxHeart");player.hp=1;player.x=bigHeart.x;player.y=bigHeart.y+player.h/2;update(0)');assert.equal(run('player.maxHp'),4);assert.equal(run('player.hp'),4);assert.equal(run('runMaxHp'),4);
run('stageIndex=3;totalScore=27;stageStartScore=20;totalIbo=27;stageStartIbo=20;runMaxHp=4;mode="dead"');handlers.keydown.forEach(fn=>fn({key:'c',repeat:false,preventDefault(){}}));assert.equal(run('stageIndex'),3);assert.equal(run('totalScore'),0);assert.equal(run('totalIbo'),0);assert.equal(run('player.maxHp'),4);
run('stageIndex=0;mode="dead";setMode("dead")');assert.equal(el('retry').hidden,true);
run('stageIndex=2;totalScore=18;stageStartScore=12;totalIbo=18;stageStartIbo=12;runMaxHp=4;mode="dead";setMode("dead")');assert.equal(el('retry').hidden,false);assert.equal(el('retry').textContent,'コンティニュー');el('retry').click();assert.equal(run('stageIndex'),2);assert.equal(run('totalScore'),0);assert.equal(run('totalIbo'),0);assert.equal(run('mode'),'playing');assert.equal(run('player.maxHp'),4);
run('stageIndex=3;totalScore=27;stageStartScore=20;totalIbo=27;stageStartIbo=20;runMaxHp=4;mode="playing"');handlers.keydown.forEach(fn=>fn({key:'r',repeat:false,preventDefault(){}}));assert.equal(run('stageIndex'),0);assert.equal(run('totalScore'),0);assert.equal(run('totalIbo'),0);assert.equal(run('player.maxHp'),3);
assert.equal(run('VOICE_ENERGY_MAX'),100);assert.equal(run('KOE_PICKUP_ENERGY'),50);assert.equal(run('enemyScore({type:"walker"})'),1);assert.equal(run('enemyScore({type:"hopper"})'),2);assert.equal(run('enemyScore({type:"flyer"})'),3);assert.equal(run('stageIndex=1;enemyScore({type:"hopper"})'),3);assert.equal(run('stageIndex=2;enemyScore({type:"flyer"})'),4);
run('stageIndex=0;stageStartScore=0;resetLevel();mode="playing";koeItemState="collected";voiceEnergy=43;const target={type:"walker",alive:true,id:-1};defeatEnemy(target)');assert.equal(run('totalScore'),1);assert.equal(run('voiceEnergy'),44);
assert.equal(run('VOICE_WORDS.p.cost'),8);assert.equal(run('VOICE_WORDS.s.cost'),12);assert.equal(run('VOICE_WORDS.b.cost'),20);assert.equal(run('VOICE_WORDS.v.cost'),30);
// All intended jumps fit the player's maximum rise. Reachability of the primary route.
run('stageIndex=0;resetLevel();mode="playing";shotItemState="collected";syncShotUI();player.y=455;player.onGround=true;keys.arrowright=true');
let finished=false;for(let i=0;i<1800;i++){
 const jump=run('player.onGround && level.platforms.some(p=>p.y===455&&player.x<p.x+p.w&&player.x>p.x+p.w-32&&p.x+p.w<5200)');
 run(`keys[' ']=${jump};keys.i=${i%20===0};update(16.6667)`);
 if(run('player.clear')){finished=true;break;}if(run('player.dead'))break;
}console.log({mainRouteCompleted:finished,hp:run('player.hp'),x:run('player.x')});assert(finished);
console.log('PASS: syntax, controls, stage-1 retry, C/button continue from stage 2+, 5-stage progression, cumulative/high score, enemy beams, hearts, star power, pause, main route');



