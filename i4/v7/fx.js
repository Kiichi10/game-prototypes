'use strict';
// ===== クラス・ライバルの個性 =====
const CLASSES=[{n:'50cc',k:1},{n:'100cc',k:1.07},{n:'150cc',k:1.14}];
const KURO={nm:'くろ',col:'#2a2a30',style:'最強',items:['bomb','dash','bomb','shield'],v:.32,pass:['遅い','それが全力か'],hit:['終わりだ','甘い'],ouch:['…ほう','やるな'],car:{body:'kuro',tire:'big',acc:'none'}};
const PERS=[
  {nm:'あお',col:'#3a8cff',style:'攻撃型',items:['bomb','bomb','oil','dash'],v:0,pass:['どいてどいて！','じゃまだよ！'],hit:['えいっ！','命中〜！'],ouch:['いったぁ！','なにすんの！']},
  {nm:'みどり',col:'#3fbf5a',style:'守り型',items:['shield','oil','shield','dash'],v:0,pass:['お先に〜','ごめんね〜'],hit:['ふふっ','すべった？'],ouch:['あらら…','やるわね']},
  {nm:'きいろ',col:'#ffb02e',style:'スピード型',items:['dash','dash','bomb','shield'],v:.12,pass:['おっそーい！','ついてこれる？'],hit:['どーん！','遅いよ！'],ouch:['ちぇっ！','まだまだ！']},
];
function say(v,kind){if(!v||v===P||v.sayCd>t0)return;const L=v.p[kind];v.say={s:L[Math.floor(Math.random()*L.length)],l:80};v.sayCd=t0+180;}
function drawSay(x,y,s){s=tr(s);g.font='13px DotGothic16';const w=g.measureText(s).width+14;g.fillStyle='#fff';g.strokeStyle='#000';g.lineWidth=2;
  g.beginPath();g.roundRect(x-w/2,y-48,w,22,8);g.fill();g.stroke();g.beginPath();g.moveTo(x-4,y-26);g.lineTo(x,y-20);g.lineTo(x+4,y-26);g.fill();g.fillStyle='#000';g.textAlign='center';g.textBaseline='middle';g.fillText(s,x,y-37);}
// ===== 画面の揺れ・紙吹雪 =====
let shakeV=0,confetti=[];
function popConfetti(){for(let i=0;i<90;i++)confetti.push({x:Math.random()*W,y:-20-Math.random()*H*.4,vx:(Math.random()-.5)*2,vy:2+Math.random()*3,r:Math.random()*6,c:['#ffd84a','#e8402c','#3a8cff','#3fbf5a','#ff9ad0'][i%5],l:200});}
function drawConfetti(){for(const c of confetti){c.x+=c.vx;c.y+=c.vy;c.r+=.15;c.l--;g.save();g.translate(c.x,c.y);g.rotate(c.r);g.fillStyle=c.c;g.fillRect(-4,-2,8,4);g.restore();}confetti=confetti.filter(c=>c.l>0&&c.y<H+20);}
// ===== スタートの信号 =====
function drawLights(){const n=Math.ceil(cd/60),cx=W/2,cy=H*.33;g.fillStyle='#222';g.strokeStyle='#000';g.lineWidth=3;g.beginPath();g.roundRect(cx-75,cy-28,150,56,14);g.fill();g.stroke();
  for(let i=0;i<3;i++){const on=3-n>i||cd<=0;g.fillStyle=cd<=0?'#3fdf5a':on?'#ff3a2a':'#4a1a1a';g.beginPath();g.arc(cx-45+i*45,cy,17,0,7);g.fill();}}
// ===== 初回案内 =====
let tut=localStorage.getItem('itembox_tut')||'0';
function tutTick(){if(tut==='done'||state!=='race')return;
  if(tut==='0'&&t0===40){toast2('◀ ▶ で車線を変える');tut='1';}
  if(tut==='1'&&P.items.length&&!P.roll){toast2('「つかう」でアイテムを使う');tut='2';}
  if(tut==='2'&&t0>600){toast2('ライバルの真後ろに付くと…スリップストリーム！');tut='done';localStorage.setItem('itembox_tut','done');}}
function toast2(s){const e=document.createElement('div');e.className='tip';e.textContent=s;$('app').appendChild(e);setTimeout(()=>e.remove(),2600);}
// ===== BGM（コースごと・合成音） =====
const SONGS=[
  {ms:180,ch:[[0,4,7],[5,9,12],[7,11,14],[0,4,7]],bass:'square'},     // はらっぱ：C F G C 明るく
  {ms:200,ch:[[2,5,9],[-2,2,5],[0,4,7],[-3,0,4]],bass:'square'},      // さばく：Dm Bb C Am
  {ms:190,ch:[[0,4,7],[-3,0,4],[5,9,12],[7,11,14]],bass:'triangle'},  // ゆきやま：C Am F G
  {ms:165,ch:[[-3,0,4],[-7,-3,0],[-5,-1,2],[-8,-4,-1]],bass:'sawtooth'}, // よるのまち：Am F G E 速く
  {ms:210,ch:[[0,4,7],[-3,0,4],[-7,-3,0],[-5,-1,2]],bass:'triangle'},  // うみべ：C Am F G
  {ms:170,ch:[[-3,0,3],[-3,0,3],[-5,-2,2],[-1,2,5]],bass:'square'},   // こうじょう
  {ms:185,ch:[[5,9,12],[7,11,14],[4,7,11],[9,12,16]],bass:'triangle'}, // そらのみち
  {ms:155,ch:[[-5,-2,2],[-9,-5,-2],[-7,-3,0],[-4,0,3]],bass:'sawtooth'}, // かざん
];
const BGM={on:localStorage.getItem('itembox_bgm')!=='0',timer:null,step:0,song:0};
function bgmStart(i){BGM.song=i;bgmStop();BGM.step=0;if(!BGM.on)return;const S=SONGS[i];
  BGM.timer=setInterval(()=>{if(!AC)return;const st=BGM.step++,ch=S.ch[Math.floor(st/8)%4],root=220;
    tone(root*Math.pow(2,(ch[[0,1,2,1,2,1,0,1][st%8]]+12)/12),S.ms/1000*.8,'square',.016);
    if(st%2===0)tone(root/2*Math.pow(2,ch[0]/12),S.ms/1000*1.6,S.bass,.02);
    if(st%4===2)noise(.04,.03);},S.ms);}
function bgmStop(){if(BGM.timer)clearInterval(BGM.timer);BGM.timer=null;}
function bgmToggle(){BGM.on=!BGM.on;localStorage.setItem('itembox_bgm',BGM.on?'1':'0');$('bgmBtn').textContent=BGM.on?'🔊':'🔇';if(BGM.on&&state==='race')bgmStart(cidx());else bgmStop();}

// ===== ライバルとの物語（レース前のひと言） =====
const STORY=[['きいろ「今日こそ負けないよ！」','あお「砂なんて関係ないね！」','みどり「ゆっくり行きましょ」','きいろ「夜はわたしの時間！」'],
  ['くろ「お前が噂の新人か」','くろ「ベルトも読めないなら帰れ」','きいろ「くろさん、速すぎない…？」','くろ「ここで決着をつける」']];
function storyLine(){if(CUP.ta)return;let s=STORY[CUP.cup][CUP.race];const ld=CUP.pts.indexOf(Math.max(...CUP.pts));if(CUP.race>0&&ld===0&&CUP.cup===1&&CUP.race<3)s='くろ「少しはやるようだな」';setTimeout(()=>{if(state==='count')toast2(s);},500);}
