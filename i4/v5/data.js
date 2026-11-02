'use strict';
const $=id=>document.getElementById(id);
// ===== 音 =====
let AC,eng,engG; const ac=()=>AC||(AC=new (window.AudioContext||window.webkitAudioContext)());
function tone(f,d,type='square',v=.06,when=0,slide=0){const a=ac(),o=a.createOscillator(),gn=a.createGain(),t=a.currentTime+when;o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide),t+d);gn.gain.setValueAtTime(v,t);gn.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(gn).connect(a.destination);o.start(t);o.stop(t+d+.02);}
function noise(d,v=.12){const a=ac(),n=a.sampleRate*d,b=a.createBuffer(1,n,a.sampleRate),x=b.getChannelData(0);for(let i=0;i<n;i++)x[i]=(Math.random()*2-1)*(1-i/n);const s=a.createBufferSource(),gn=a.createGain();gn.gain.value=v;s.buffer=b;s.connect(gn).connect(a.destination);s.start();}
function engineOn(){const a=ac();if(eng){engG.gain.value=.025;return;}eng=a.createOscillator();engG=a.createGain();eng.type='sawtooth';eng.frequency.value=60;engG.gain.value=.025;const f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=400;eng.connect(f).connect(engG).connect(a.destination);eng.start();}
const sfx={tick(){tone(1200,.03,'square',.03);},get(){tone(880,.08,'square',.05);tone(1320,.15,'square',.05,.07);},
  dash(){noise(.4,.08);tone(300,.4,'sawtooth',.04,0,600);},crash(){noise(.35,.18);tone(160,.3,'square',.06,0,-100);},
  boom(){noise(.5,.2);tone(90,.4,'square',.07,0,-50);},shield(){tone(600,.3,'sine',.06,0,400);},
  coin(){tone(1568,.05,'square',.03);tone(2093,.08,'square',.03,.04);},pad(){tone(500,.15,'square',.04,0,700);},
  warn(){tone(880,.08,'square',.04);tone(880,.08,'square',.04,.12);},
  beep(h){tone(h?1046:523,.2,'square',.06);},fan(){[0,4,7,12,7,12,16].forEach((s,i)=>tone(523*Math.pow(2,s/12),.18,'square',.05,i*.1));},
  cup(){[0,4,7,12,16,19,24].forEach((s,i)=>tone(392*Math.pow(2,s/12),.25,'square',.05,i*.12));},
  thunder(){noise(.8,.25);tone(70,.6,'sawtooth',.08,0,-30);},buy(){tone(880,.1,'square',.05);tone(1320,.2,'square',.05,.08);}};

// ===== アイテム =====
const ITEMS={
  dash:{ic:'🚀',n:'ダッシュ'},bomb:{ic:'💣',n:'まっすぐ爆弾'},shield:{ic:'🛡️',n:'バリア'},oil:{ic:'🛢️',n:'オイル'},
  jump:{ic:'🦘',n:'ジャンプ'},dash3:{ic:'🔥',n:'3連ダッシュ'},homing:{ic:'🎯',n:'追いかけ爆弾'},magnet:{ic:'🧲',n:'吸いよせ'},
  ghost:{ic:'👻',n:'すりぬけ'},giant:{ic:'🐘',n:'でっかくなる'},star:{ic:'⭐',n:'スター'},thunder:{ic:'⚡',n:'カミナリ'}};
const START=['dash','bomb','shield','oil'],UNLOCK=['jump','dash3','homing','magnet','ghost','giant','star','thunder'];
const DEF=['oil','shield','bomb'],CATCH=['dash3','star','thunder','homing','magnet','giant'];

// ===== コース =====
const COURSES=[
  {n:'はらっぱ',ic:'🌼',grass:['#4a8c3a','#55993f'],road:'#5a5a62',curb:['#e8402c','#fff'],deco:['#f2e86a','#ff8fb0'],gim:[],L:9200},
  {n:'さばく',ic:'🌵',grass:['#d4aa58','#dcb666'],road:'#7a6a50',curb:['#c86a2a','#f0e0b0'],deco:['#4a8a3a','#a07a40'],gim:['sand'],L:9600},
  {n:'ゆきやま',ic:'⛄',grass:['#e4eef8','#f2f7fc'],road:'#6a7c92',curb:['#3a7ad8','#fff'],deco:['#2a6a4a','#ffffff'],gim:['ice'],L:9600},
  {n:'よるのまち',ic:'🌃',grass:['#161626','#1e1e34'],road:'#2a2a36',curb:['#ff3ab0','#3af0ff'],deco:['#ffd84a','#3af0ff'],gim:['dark'],L:10000},
];
const POINTS=[10,6,3,1];
// ===== ガレージ =====
const PARTS={
  engine:{n:'エンジン',ic:'🔧',d:'最高速度 +3%',cost:[20,50,100]},
  tire:{n:'タイヤ',ic:'🛞',d:'車線変更が速い・スピンが短い',cost:[15,40,80]},
  luck:{n:'くじ運',ic:'🍀',d:'くじ玉から強いアイテムが出やすい',cost:[25,60,120]},
};
const COLORS=[['#e8402c','あか'],['#3a8cff','あお'],['#ff9ad0','ピンク'],['#9a5aff','むらさき'],['#ffffff','しろ'],['#2a2a2a','くろ'],['#ffb02e','オレンジ'],['#3fbf5a','みどり']];
let SV=JSON.parse(localStorage.getItem('itembox_v2')||'null')||{have:START.slice(),coins:0,parts:{},color:0,colors:[0],trophies:[],cups:0};
try{const v1=JSON.parse(localStorage.getItem('itembox_v1')||'null');if(v1&&!SV.migrated){v1.have.forEach(k=>{if(!SV.have.includes(k))SV.have.push(k);});SV.migrated=1;}}catch(e){}
const saveSV=()=>localStorage.setItem('itembox_v2',JSON.stringify(SV));
const lv=k=>SV.parts[k]||0;
