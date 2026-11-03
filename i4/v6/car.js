'use strict';
// ===== 車の組み立て：部品には得と損がある・見た目も変わる =====
const BODY_SP={
std:`......kk......
.....kxxk.....
...kkxxxxkk...
..kxxxwwxxxk..
..kxxxwwxxxk..
..kxxxxxxxxk..
..kxkkkkkkxk..
..kxkhhhhkxk..
..kxkhwwhkxk..
..kxkhhhhkxk..
..kxkkkkkkxk..
..kxxxxxxxxk..
...kxxxxxxk...
...kXXXXXXk...
....kkkkkk....`,
light:`......kk......
.....kxxk.....
.....kxxk.....
....kxwwxk....
....kxwwxk....
....kxxxxk....
...kkkkkkkk...
...kkhhhhkk...
...kkhwwhkk...
...kkhhhhkk...
...kkkkkkkk...
....kxxxxk....
....kxxxxk....
....kXXXXk....
.....kkkk.....`,
tank:`...kkkkkkkk...
..kxxxxxxxxk..
.kxxxwwwwxxxk.
.kxxxwwwwxxxk.
.kXxxxxxxxxXk.
.kxxkkkkkkxxk.
.kxkkhhhhkkxk.
.kxkhhwwhhkxk.
.kxkkhhhhkkxk.
.kxxkkkkkkxxk.
.kXxxxxxxxxXk.
.kxxxxxxxxxxk.
.kxxXXXXXXxxk.
..kkXXXXXXkk..
....kkkkkk....`,
kuro:`.....kkkk.....
....kxxxxk....
...kxxwwxxk...
..kxxxwwxxxk..
..kxyxxxxyxk..
.kxxxxxxxxxxk.
.kxxkkkkkkxxk.
.kxkkhhhhkkxk.
.kxkhhwwhhkxk.
.kxkkhhhhkkxk.
.kxxkkkkkkxxk.
.kxyxxxxxxyxk.
.kxxxxxxxxxxk.
.kXXXXXXXXXXk.
..kkkkkkkkkk..`,
arrow:`......kk......
......kk......
.....kxxk.....
.....kxxk.....
....kxwwxk....
....kxwwxk....
...kxxxxxxk...
...kxkkkkxk...
..kxkhhhhkxk..
..kxkhwwhkxk..
..kxkhhhhkxk..
..kxkkkkkkxk..
.kxxxxxxxxxxk.
.kXXXXXXXXXXk.
..kkkkkkkkkk..`};
const CARP={
  body:{std:{n:'ふつう',cost:0,d:'バランス型',st:{}},light:{n:'かるがる',cost:40,d:'加速と曲がりが良い／ぶつかると弱い',st:{acc:3,turn:2,tough:-2}},
    tank:{n:'どっしり',cost:60,d:'スピンが短い／加速が遅い',st:{tough:4,acc:-2,turn:-1}},arrow:{n:'やじり',cost:90,d:'最高速が伸びる／ぶつかると弱い',st:{spd:3,tough:-2,turn:-1}},kuro:{n:'くろがね',cost:0,hidden:1,d:'くろに勝った証。速くて丈夫',st:{spd:2,tough:2,acc:-1}}},
  tire:{std:{n:'ふつう',cost:0,d:'バランス型',st:{}},slick:{n:'スリック',cost:40,d:'舗装で速い／砂と雪に弱い',st:{spd:2},sp:'slick'},
    snow:{n:'スパイク',cost:40,d:'砂と雪に強い／最高速が落ちる',st:{spd:-1},sp:'snow'},big:{n:'大径',cost:70,d:'丈夫で少し速い／曲がりにくい',st:{tough:2,turn:-1,spd:1}}},
  acc:{none:{n:'なし',cost:0,d:'飾りなし',st:{}},wing:{n:'大きな羽根',cost:50,d:'スリップストリームが早くたまる',st:{},sp:'wing'},muffler:{n:'太いマフラー',cost:60,d:'ダッシュが長く続く',st:{},sp:'muffler'},
    magnet:{n:'コイン磁石',cost:60,d:'となりの車線のコインも拾う',st:{},sp:'magnet'},antenna:{n:'くじアンテナ',cost:80,d:'くじ玉から強いアイテムが出やすい',st:{luck:2}}},
};
const SLOT={body:'ボディ',tire:'タイヤ',acc:'飾り'},STN={spd:'最高速',acc:'加速',turn:'曲がり',tough:'頑丈さ',luck:'くじ運'};
const myCar=()=>{SV.car=SV.car||{body:'std',tire:'std',acc:'none',own:['body.std','tire.std','acc.none']};return SV.car;};
function carStats(c){c=c||myCar();const s={spd:0,acc:0,turn:0,tough:0,luck:0},sp={};for(const k of ['body','tire','acc']){const p=CARP[k][c[k]];for(const a in p.st)s[a]+=p.st[a];if(p.sp)sp[p.sp]=1;}return {s,sp};}
const CC={};
function makeCar(col,helm,c){const key=[col,helm,c.body,c.tire,c.acc].join();if(CC[key])return CC[key];const cv=document.createElement('canvas');cv.width=20;cv.height=24;const x=cv.getContext('2d');
  const d=col.replace('#',''),dark='#'+[0,2,4].map(i=>Math.round(parseInt(d.slice(i,i+2),16)*.62).toString(16).padStart(2,'0')).join('');
  const R=(a,b,w,h,cl)=>{x.fillStyle=cl;x.fillRect(a,b,w,h);};const wd=c.body==='light'?3:c.body==='tank'?1:2;
  // タイヤ
  const big=c.tire==='big',tw=big?5:4,th=big?8:6;for(const wy of [c.body==='arrow'?8:6,16])for(const side of [0,1]){const wx=side?20-wd-tw:wd;R(wx,wy,tw,th,'#1a1210');R(wx+1,wy+1,tw-2,th-2,c.tire==='slick'?'#d8342a':c.tire==='snow'?'#c4c4cc':'#3a3a44');if(c.tire==='snow')for(let i=0;i<th;i+=2)R(side?wx+tw-1:wx,wy+i,1,1,'#fff8e8');}
  // 飾り（車体の下に出る物）
  if(c.acc==='muffler'){R(6,20,3,4,'#1a1210');R(11,20,3,4,'#1a1210');R(7,21,1,3,'#c4c4cc');R(12,21,1,3,'#c4c4cc');}
  // ボディ
  BODY_SP[c.body].split('\n').forEach((r,j)=>{for(let i=0;i<r.length;i++){const ch=r[i];if(ch==='.')continue;x.fillStyle=ch==='x'?col:ch==='X'?dark:ch==='h'?helm:PAL[ch];x.fillRect(3+i,4+j,1,1);}});
  // 飾り（車体の上に出る物）
  if(c.acc==='wing'){R(1,17,18,3,'#1a1210');R(2,18,16,1,dark);R(3,15,2,3,'#1a1210');R(15,15,2,3,'#1a1210');}
  if(c.acc==='magnet'){R(6,0,8,3,'#1a1210');R(7,1,2,3,'#d8342a');R(11,1,2,3,'#3a7ad8');R(7,3,6,1,'#1a1210');}
  if(c.acc==='antenna'){R(15,5,1,10,'#1a1210');R(14,3,3,3,'#1a1210');R(15,4,1,1,'#ffcf3a');}
  return CC[key]=cv;}
// ライバルの車：個性に合わせて見た目を変える
const RIVAL_CAR=[{body:'arrow',tire:'std',acc:'none'},{body:'tank',tire:'big',acc:'none'},{body:'light',tire:'slick',acc:'wing'}];
const carName=c=>{c=c||myCar();return `${COLORS[SV.color][1]}の${CARP.body[c.body].n}号`;};
function barHTML(s){return Object.keys(STN).map(k=>{const v=Math.max(0,Math.min(10,5+s[k]));return `<div class="sb"><span>${STN[k]}</span><i><b style="width:${v*10}%"></b></i></div>`;}).join('');}
function renderCarUI(){const c=myCar(),{s}=carStats();const pv=$('carPv'),x=pv.getContext('2d');x.imageSmoothingEnabled=false;x.clearRect(0,0,pv.width,pv.height);x.drawImage(makeCar(COLORS[SV.color][0],SV.color===4?'#e8402c':'#fff8e8',c),0,0,pv.width,pv.height);
  $('carName').textContent=carName();$('carBars').innerHTML=barHTML(s);const box=$('carParts');box.innerHTML='';
  for(const slot in CARP){const h=document.createElement('p');h.className='sl';h.textContent=SLOT[slot];box.appendChild(h);const row=document.createElement('div');row.className='cps';
    for(const k in CARP[slot]){const p=CARP[slot][k],own=c.own.includes(slot+'.'+k);if(p.hidden&&!own)continue;const b=document.createElement('button');b.className='cp'+(c[slot]===k?' on':'');
      b.innerHTML=`<b>${p.n}${own?'':`<span>🪙${p.cost}</span>`}</b><small>${p.d}</small>`;b.disabled=!own&&SV.coins<p.cost;
      b.onclick=()=>{if(!own){SV.coins-=p.cost;c.own.push(slot+'.'+k);sfx.buy();}else tone(660,.05);c[slot]=k;saveSV();openGarage();};row.appendChild(b);}
    box.appendChild(row);}}
// 車検証：自分の車を1枚の画像にする
function carCard(){const c=myCar(),{s}=carStats(),W=720,H=1040,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');x.imageSmoothingEnabled=false;
  const text=(t,a,b,sz,cl,al='left')=>{x.font=`${sz}px DotGothic16`;x.textAlign=al;x.fillStyle=cl;x.fillText(t,a,b);};
  x.fillStyle='#f4ecd4';x.fillRect(0,0,W,H);x.strokeStyle='#2a1c10';x.lineWidth=8;x.strokeRect(16,16,W-32,H-32);x.lineWidth=2;x.strokeRect(28,28,W-56,H-56);
  text('自動車検査証',W/2,84,40,'#2a1c10','center');text('アイテムボックス一本道',W/2,120,20,'#7a6a4a','center');
  x.fillStyle='#55993f';x.fillRect(60,146,W-120,300);x.fillStyle='#5a5a62';x.fillRect(190,146,W-380,300);x.fillStyle='#fff8e8';for(let y=150;y<446;y+=44)x.fillRect(W/2-3,y,6,24);
  x.drawImage(makeCar(COLORS[SV.color][0],SV.color===4?'#e8402c':'#fff8e8',c),W/2-110,164,220,264);
  text(carName(),W/2,500,38,'#2a1c10','center');
  text(`ボディ ${CARP.body[c.body].n}　タイヤ ${CARP.tire[c.tire].n}　飾り ${CARP.acc[c.acc].n}`,W/2,538,22,'#54341c','center');
  let y=586;for(const k in STN){const v=Math.max(0,Math.min(10,5+s[k]));text(STN[k],80,y+18,22,'#2a1c10');x.fillStyle='#d8c498';x.fillRect(200,y,440,20);x.fillStyle='#d8342a';x.fillRect(200,y,44*v,20);y+=36;}
  y+=18;text('トロフィー',80,y+18,22,'#2a1c10');let tx=200;const mm={'🥇':'medal1','🥈':'medal2','🥉':'medal3'};(SV.trophies||[]).slice(-12).forEach(t=>{const sp=sprCanvas(mm[t]);x.drawImage(sp.c,tx,y-8,sp.w*2,sp.h*2);tx+=sp.w*2+6;});if(!(SV.trophies||[]).length)text('まだなし',200,y+18,22,'#7a6a4a');
  y+=52;const rec=SV.rec||{};const cl=SV.clsSel||0;text(`コース記録（${CLASSES[cl].n}）`,80,y,22,'#2a1c10');y+=32;COURSES.forEach((co,i)=>{const r=rec[cl+'-'+i];text(`${co.n} ${r?r.toFixed(2)+'秒':'--'}`,80+(i%2)*280,y+Math.floor(i/2)*28,20,'#54341c');});
  text('kiichi10.github.io/game-prototypes/i4/',W/2,H-44,20,'#7a6a4a','center');return cv;}
function openCarCard(){document.fonts.load('20px DotGothic16').then(()=>{$('cardImg').src=carCard().toDataURL('image/png');$('cardSheet').hidden=false;});}
