/* Rush procedural audio: Web Audio setup, music, and sound effects. */
(function(root){
  const MASTER_VOLUME=.34;
  let muted=false,ac=null,master=null,musicBus=null,sfxBus=null,delay=null,delayGain=null;
  let musicTimer=0,musicStep=0;

  function audio(){
    if(!ac){
      const AC=root.AudioContext||root.webkitAudioContext;
      if(!AC)return null;
      ac=new AC();master=ac.createGain();musicBus=ac.createGain();sfxBus=ac.createGain();
      const compressor=ac.createDynamicsCompressor();delay=ac.createDelay(.6);delayGain=ac.createGain();
      master.gain.value=MASTER_VOLUME;musicBus.gain.value=.72;sfxBus.gain.value=.95;
      delay.delayTime.value=.19;delayGain.gain.value=.18;
      musicBus.connect(master);sfxBus.connect(master);musicBus.connect(delay);sfxBus.connect(delay);delay.connect(delayGain);delayGain.connect(master);
      master.connect(compressor);compressor.connect(ac.destination);
    }
    if(ac.state==="suspended")ac.resume();
    return ac;
  }

  function setMuted(next){
    muted=!!next;const a=audio();
    if(master&&a)master.gain.setValueAtTime(muted?0:MASTER_VOLUME,a.currentTime);
  }

  function voice(f1,f2=f1,d=.12,type="square",v=.12,options={}){
    if(muted)return;const a=audio();if(!a)return;
    const t=a.currentTime+(options.delay||0),o=a.createOscillator(),g=a.createGain(),filter=a.createBiquadFilter();
    o.type=type;o.detune.value=options.detune||0;o.frequency.setValueAtTime(Math.max(30,f1),t);o.frequency.exponentialRampToValueAtTime(Math.max(30,f2),t+d);
    filter.type="lowpass";filter.frequency.setValueAtTime(options.cutoff||5200,t);if(options.cutoffEnd)filter.frequency.exponentialRampToValueAtTime(options.cutoffEnd,t+d);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+(options.attack||.008));g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(filter);filter.connect(g);g.connect(options.bus||sfxBus);o.start(t);o.stop(t+d+.03);
  }

  function noise(d=.08,v=.06,options={}){
    if(muted)return;const a=audio();if(!a)return;
    const length=Math.max(1,Math.floor(a.sampleRate*d)),buffer=a.createBuffer(1,length,a.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);
    const source=a.createBufferSource(),filter=a.createBiquadFilter(),g=a.createGain(),t=a.currentTime+(options.delay||0);
    filter.type=options.filterType||"highpass";filter.frequency.value=options.cutoff||900;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    source.buffer=buffer;source.connect(filter);filter.connect(g);g.connect(options.bus||sfxBus);source.start(t);
  }

  const sfx={
    jump:()=>{voice(250,620,.14,"square",.12,{cutoff:2600});voice(500,900,.10,"sine",.07,{delay:.025});},
    shot:()=>{voice(1050,170,.11,"sawtooth",.10,{cutoff:4200,cutoffEnd:500});voice(1700,420,.07,"square",.055);noise(.07,.045,{cutoff:1600});},
    shotUnlock:()=>{[523.25,659.25,783.99].forEach((f,i)=>voice(f,f,.16,"triangle",.11,{delay:i*.07,cutoff:3600}));},
    voiceFail:()=>{voice(190,95,.10,"sine",.045,{cutoff:750,cutoffEnd:280});noise(.05,.018,{cutoff:1200});},
    bossLaser:()=>{voice(150,72,.48,"sawtooth",.06,{cutoff:1200,cutoffEnd:440});noise(.18,.025,{cutoff:2400});},
    voiceAttack:kind=>{
      if(kind==="p"){voice(760,380,.09,"square",.075,{cutoff:3200});noise(.045,.022,{cutoff:2600});}
      else if(kind==="s"){noise(.20,.04,{cutoff:4200});voice(980,640,.16,"triangle",.035,{cutoff:3000});}
      else if(kind==="b"){[0,.075,.15].forEach((delay,i)=>voice(180-i*18,105-i*12,.11,"square",.06,{delay,cutoff:1100}));}
      else{voice(105,48,.36,"sawtooth",.09,{cutoff:850,cutoffEnd:260});[0,.08,.16,.24].forEach((delay,i)=>voice(180-i*20,105-i*12,.10,"triangle",.035,{delay,cutoff:900}));}
    },
    hit:()=>{voice(190,55,.18,"sawtooth",.14,{cutoff:1300,cutoffEnd:250});voice(95,45,.22,"square",.07);noise(.12,.075,{cutoff:420});},
    coin:()=>{voice(740,740,.09,"square",.09,{cutoff:3600});voice(1110,1110,.12,"triangle",.08,{delay:.065});voice(1480,1480,.16,"sine",.045,{delay:.12});},
    heal:()=>{[523.25,659.25,783.99].forEach((f,i)=>voice(f,f*1.01,.24,"sine",.08,{delay:i*.07,attack:.02}));},
    maxHp:()=>{[392,523.25,659.25,783.99].forEach((f,i)=>voice(f,f*1.015,.34,"triangle",.085,{delay:i*.075,attack:.025}));},
    star:()=>{[523.25,659.25,783.99,1046.5,1318.5].forEach((f,i)=>voice(f,f*1.02,.28,"square",.065,{delay:i*.055,cutoff:4800}));},
    enemyShot:()=>{voice(360,115,.16,"sawtooth",.055,{cutoff:1800,cutoffEnd:350});noise(.055,.025,{cutoff:2100});},
    clear:()=>{
      [523.25,659.25,783.99,1046.5].forEach((f,i)=>{voice(f,f,.28,"triangle",.10,{delay:i*.105,bus:sfxBus});voice(f/2,f/2,.34,"sine",.055,{delay:i*.105,bus:sfxBus});});
      [523.25,659.25,783.99].forEach(f=>voice(f,f,.75,"sine",.035,{delay:.48,bus:sfxBus}));
    }
  };

  function resetMusic(){musicTimer=0;musicStep=0;}
  function updateMusic({dt,player,theme,stageIndex}){
    if(muted)return;musicTimer-=dt;if(musicTimer>0)return;
    if(player.starTime>0){
      musicTimer=95;const starNotes=[523.25,659.25,783.99,1046.5,783.99,659.25,880,1046.5],step=musicStep%16,f=starNotes[musicStep%starNotes.length];
      voice(f,f*1.005,.13,"square",.045,{cutoff:5200,bus:musicBus});if(step%2===0)voice(step%4===0?130.81:196,step%4===0?130.81:196,.18,"triangle",.06,{cutoff:1100,bus:musicBus});if(step%2===1)noise(.035,.025,{cutoff:5200,bus:musicBus});if(step%4===0)voice(105,48,.10,"sine",.075,{cutoff:420,bus:musicBus});musicStep++;return;
    }
    musicTimer=170;const notes=theme.notes,step=musicStep%16;
    if(![3,7,11].includes(step)){const f=notes[musicStep%notes.length]*(step===14?2:1);voice(f,f*.998,.24,stageIndex===2?"triangle":"square",.035,{attack:.018,cutoff:stageIndex===0?3400:2600,bus:musicBus});voice(f*2,f*2,.16,"sine",.012,{delay:.012,bus:musicBus});}
    if(step%4===0){const bass=step%8===0?notes[0]/2:notes[2]/2;voice(bass,bass*.99,.52,"triangle",.075,{attack:.012,cutoff:850,bus:musicBus});voice(92,48,.13,"sine",.09,{cutoff:350,bus:musicBus});}
    if(step%8===0)[notes[0],notes[2],notes[4]].forEach((f,i)=>voice(f/2,f/2,.9,"sine",.022,{delay:i*.012,attack:.08,cutoff:1800,bus:musicBus}));
    if(step%2===1)noise(.045,stageIndex===2?.016:.026,{cutoff:4200,bus:musicBus});if(step===6||step===14)noise(.11,.03,{filterType:"bandpass",cutoff:1200,bus:musicBus});musicStep++;
  }

  ["pointerdown","keydown","touchstart"].forEach(ev=>root.addEventListener(ev,audio,{once:true,capture:true}));
  root.RushSound={audio,setMuted,resetMusic,updateMusic,sfx};
})(globalThis);
