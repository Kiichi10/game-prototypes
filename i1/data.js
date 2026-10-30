'use strict';
// ===== 技の木（親を使うと、子を閃く）  t=流派 斬/突/払、連=連携技 =====
const T = {
  kiru:{n:'斬る',p:10,h:1,c:'#ffffff',t:'斬'},
  nidan:{n:'二段斬り',p:8,h:2,c:'#9cdcff',par:'kiru',t:'斬'},
  tsuki:{n:'突き',p:15,h:1,c:'#ffe27a',par:'kiru',t:'突',st:'thrust'},
  harai:{n:'払い抜け',p:13,h:1,c:'#8cff9c',par:'kiru',t:'払',st:'dash'},
  sandan:{n:'三段斬り',p:8,h:3,c:'#7ac4ff',par:'nidan',t:'斬'},
  tsubame:{n:'燕返し',p:12,h:2,c:'#c9a0ff',par:'nidan',t:'斬',st:'cross'},
  senbon:{n:'千本突き',p:5,h:6,c:'#ffd84a',par:'tsuki',t:'突',st:'thrust'},
  inazuma:{n:'稲妻突き',p:26,h:1,c:'#fff36a',par:'tsuki',t:'突',st:'bolt'},
  shippu:{n:'疾風斬り',p:11,h:2,c:'#6affc0',par:'harai',t:'払',st:'dash'},
  kagenui:{n:'影縫い',p:20,h:1,c:'#b47aff',par:'harai',t:'払',st:'shadow'},
  musou:{n:'無双三段',p:12,h:3,c:'#5aa8ff',par:'sandan',t:'斬'},
  midare:{n:'乱れ雪月花',p:7,h:6,c:'#e0f4ff',par:'sandan',t:'斬',st:'snow'},
  tsukikage:{n:'月影',p:18,h:2,c:'#d8c0ff',par:'tsubame',t:'斬',st:'cross'},
  hyakka:{n:'百花繚乱突き',p:5,h:10,c:'#ff9ad0',par:'senbon',t:'突',st:'thrust'},
  raimei:{n:'雷鳴剣',p:40,h:1,c:'#fff7a0',par:'inazuma',t:'突',st:'bolt'},
  tenchi:{n:'天地二段',p:22,h:2,c:'#ffc26a',par:'inazuma',t:'突'},
  tatsumaki:{n:'竜巻斬り',p:8,h:5,c:'#7affd8',par:'shippu',t:'払',st:'spin'},
  shinku:{n:'真空斬り',p:30,h:1,c:'#c0fff0',par:'shippu',t:'払',st:'dash'},
  oboro:{n:'朧',p:16,h:3,c:'#9a7aff',par:'kagenui',t:'払',st:'shadow'},
  tenka:{n:'天下無双',p:16,h:4,c:'#3a8cff',par:'musou',t:'斬'},
  sange:{n:'散華',p:9,h:8,c:'#ffb0c8',par:'midare',t:'斬',st:'snow'},
  gekka:{n:'月下一閃',p:60,h:1,c:'#f0e0ff',par:'tsukikage',t:'斬',st:'cross'},
  senshi:{n:'千紫万紅',p:6,h:14,c:'#ff70b0',par:'hyakka',t:'突',st:'thrust'},
  kaminari:{n:'神鳴',p:75,h:1,c:'#ffffff',par:'raimei',t:'突',st:'bolt'},
  shoryu:{n:'昇竜嵐',p:12,h:6,c:'#40ffc8',par:'tatsumaki',t:'払',st:'spin'},
  kokuu:{n:'虚空斬',p:55,h:1,c:'#a0fff8',par:'shinku',t:'払',st:'dash'},
  mugen:{n:'夢幻',p:14,h:6,c:'#7a5aff',par:'oboro',t:'払',st:'shadow'},
  // 連携技：ちがう流派の技を続けて使うと閃く（a→b でも b→a でもよい）
  c_senjin:{n:'千刃乱舞',p:9,h:8,c:'#ff9a5a',t:'連',combo:['sandan','senbon'],st:'thrust'},
  c_raiko:{n:'雷光三段',p:24,h:3,c:'#fff36a',t:'連',combo:['sandan','inazuma'],st:'bolt'},
  c_ensen:{n:'燕千突',p:7,h:10,c:'#e0a0ff',t:'連',combo:['tsubame','senbon'],st:'thrust'},
  c_raien:{n:'雷燕',p:34,h:2,c:'#fff0a0',t:'連',combo:['tsubame','inazuma'],st:'bolt'},
  c_senpu:{n:'旋風三段',p:12,h:5,c:'#80ffd0',t:'連',combo:['sandan','shippu'],st:'spin'},
  c_kagesan:{n:'影三段',p:20,h:3,c:'#a080ff',t:'連',combo:['sandan','kagenui'],st:'shadow'},
  c_fuen:{n:'風燕',p:16,h:4,c:'#a0ffe0',t:'連',combo:['tsubame','shippu'],st:'cross'},
  c_oboroen:{n:'朧燕',p:28,h:2,c:'#c0a0ff',t:'連',combo:['tsubame','kagenui'],st:'shadow'},
  c_hyakuretsu:{n:'疾風百裂',p:6,h:12,c:'#a0ffa0',t:'連',combo:['senbon','shippu'],st:'thrust'},
  c_kagesen:{n:'影千本',p:8,h:9,c:'#c080ff',t:'連',combo:['senbon','kagenui'],st:'shadow'},
  c_ranrai:{n:'嵐雷',p:22,h:4,c:'#e0ff80',t:'連',combo:['inazuma','shippu'],st:'spin'},
  c_kokurai:{n:'黒雷',p:50,h:1,c:'#d0a0ff',t:'連',combo:['inazuma','kagenui'],st:'bolt'},
};
const IDS = Object.keys(T);
const BASE = IDS.filter(k => T[k].t !== '連'), COMBOS = IDS.filter(k => T[k].t === '連');
const kids = id => BASE.filter(k => T[k].par === id);
const tier = id => T[id].t === '連' ? 3 : (T[id].par ? tier(T[id].par) + 1 : 0);
const comboOf = (a, b) => COMBOS.find(k => { const c = T[k].combo; return (c[0] === a && c[1] === b) || (c[0] === b && c[1] === a); });
const TCOL = {斬:'#5aa8ff',突:'#ffd24a',払:'#5ae08a',連:'#ff7ab8'};

// ===== 敵の種類（弱点 w／効きにくい r） =====
const SPECIES = [
  {n:'スライム',w:'斬',r:'突'},{n:'ゴブリン',w:'突',r:null},{n:'こうもり',w:'払',r:'斬'},{n:'がいこつ',w:'払',r:'突'},
  {n:'おばけ',w:'突',r:'斬'},{n:'トロル',w:'斬',r:'払'},{n:'まじゅつし',w:'払',r:null},{n:'ゴーレム',w:'突',r:'斬'},
  {n:'キメラ',w:'斬',r:'突'},{n:'ドラゴン',w:'突',r:'払'},
];
const RANK = {
  weak:{n:'弱い',star:1,hp:.7,atk:.7,hira:.16},
  mid:{n:'ふつう',star:2,hp:1,atk:1,hira:.28},
  strong:{n:'強い',star:3,hp:1.45,atk:1.3,hira:.46},
  boss:{n:'ぬし',star:4,hp:1.8,atk:1.2,hira:.5},
};
const AREAS = [
  {n:'草原',from:1},{n:'洞窟',from:5},{n:'古城',from:10},{n:'天空',from:15},
];
const areaOf = fl => { let a = AREAS[0]; for (const x of AREAS) if (fl >= x.from) a = x; return a; };

// ===== 音 =====
let AC; const ac=()=>AC||(AC=new (window.AudioContext||window.webkitAudioContext)());
function tone(f,d,type='square',v=.06,slide=0,when=0){const a=ac(),o=a.createOscillator(),g=a.createGain(),t=a.currentTime+when;o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide),t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(g).connect(a.destination);o.start(t);o.stop(t+d+.02);}
function noise(d,v=.12,when=0,hp=900){const a=ac(),n=a.sampleRate*d,b=a.createBuffer(1,n,a.sampleRate),x=b.getChannelData(0);for(let i=0;i<n;i++)x[i]=(Math.random()*2-1)*(1-i/n);const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();f.type='highpass';f.frequency.value=hp;g.gain.value=v;s.buffer=b;s.connect(f).connect(g).connect(a.destination);s.start(a.currentTime+when);}
const sfx={
  slash(){noise(.12,.14,0,1800);tone(900,.08,'sawtooth',.03,-600);},
  hit(){tone(140,.12,'square',.08,-80);noise(.06,.1,0,400);},
  weak(){tone(1200,.1,'square',.05);tone(1600,.12,'square',.04,0,.06);},
  resist(){tone(180,.12,'triangle',.06);},
  hurt(){tone(300,.18,'square',.07,-220);},
  sel(){tone(660,.04,'square',.04);},
  hira(){[0,4,7,12,16].forEach((s,i)=>tone(523*Math.pow(2,s/12),.18,'square',.05,0,i*.06));tone(2093,.5,'triangle',.05,0,.32);},
  combo(){[0,7,12,19,24].forEach((s,i)=>tone(392*Math.pow(2,s/12),.2,'sawtooth',.04,0,i*.07));[0,4,7].forEach((s,i)=>tone(1046*Math.pow(2,s/12),.6,'triangle',.05,0,.4+i*.02));},
  win(){[0,4,7,4,7,12].forEach((s,i)=>tone(392*Math.pow(2,s/12),.16,'square',.05,0,i*.11));},
  heal(){[0,4,7,11,14].forEach((s,i)=>tone(659*Math.pow(2,s/12),.25,'triangle',.05,0,i*.09));},
  die(){noise(.5,.12,0,200);tone(220,.5,'square',.05,-180);},
};
