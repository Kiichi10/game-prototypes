'use strict';
const $=id=>document.getElementById(id);
// ===== 音 =====
let AC,eng,engG; const ac=()=>AC||(AC=new (window.AudioContext||window.webkitAudioContext)());
function tone(f,d,type='square',v=.06,when=0,slide=0){const a=ac(),o=a.createOscillator(),gn=a.createGain(),t=a.currentTime+when;o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide),t+d);gn.gain.setValueAtTime(v,t);gn.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(gn).connect(a.destination);o.start(t);o.stop(t+d+.02);}
function noise(d,v=.12){const a=ac(),n=a.sampleRate*d,b=a.createBuffer(1,n,a.sampleRate),x=b.getChannelData(0);for(let i=0;i<n;i++)x[i]=(Math.random()*2-1)*(1-i/n);const s=a.createBufferSource(),gn=a.createGain();gn.gain.value=v;s.buffer=b;s.connect(gn).connect(a.destination);s.start();}
function engineOn(){const a=ac();if(eng)return;eng=a.createOscillator();engG=a.createGain();eng.type='sawtooth';eng.frequency.value=60;engG.gain.value=.025;const f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=400;eng.connect(f).connect(engG).connect(a.destination);eng.start();}
const sfx={tick(){tone(1200,.03,'square',.03);},get(){tone(880,.08,'square',.05);tone(1320,.15,'square',.05,.07);},
  dash(){noise(.4,.08);tone(300,.4,'sawtooth',.04,0,600);},crash(){noise(.35,.18);tone(160,.3,'square',.06,0,-100);},
  boom(){noise(.5,.2);tone(90,.4,'square',.07,0,-50);},shield(){tone(600,.3,'sine',.06,0,400);},
  beep(h){tone(h?1046:523,.2,'square',.06);},fan(){[0,4,7,12,7,12,16].forEach((s,i)=>tone(523*Math.pow(2,s/12),.18,'square',.05,i*.1));},
  thunder(){noise(.8,.25);tone(70,.6,'sawtooth',.08,0,-30);}};

// ===== アイテム =====
const ITEMS={
  dash:{ic:'🚀',n:'ダッシュ'},bomb:{ic:'💣',n:'まっすぐ爆弾'},shield:{ic:'🛡️',n:'バリア'},oil:{ic:'🛢️',n:'オイル'},
  jump:{ic:'🦘',n:'ジャンプ'},dash3:{ic:'🔥',n:'3連ダッシュ'},homing:{ic:'🎯',n:'追いかけ爆弾'},magnet:{ic:'🧲',n:'吸いよせ'},
  ghost:{ic:'👻',n:'すりぬけ'},giant:{ic:'🐘',n:'でっかくなる'},star:{ic:'⭐',n:'スター'},thunder:{ic:'⚡',n:'カミナリ'}};
const START=['dash','bomb','shield','oil'], UNLOCK=['jump','dash3','homing','magnet','ghost','giant','star','thunder'];
const DEF=['oil','shield','bomb'], CATCH=['dash3','star','thunder','homing','magnet','giant'];
let SV=JSON.parse(localStorage.getItem('itembox_v1')||'null')||{have:START.slice(),race:1,wins:0};
const saveSV=()=>localStorage.setItem('itembox_v1',JSON.stringify(SV));
function rollItem(rank){const pool=[];for(const k of SV.have){let w=1;if(rank===1&&DEF.includes(k))w=3;if(rank>=3&&CATCH.includes(k))w=3;if(rank===1&&CATCH.includes(k))w=.2;if(k==='dash')w=rank>=2?2:1;for(let i=0;i<w*10;i++)pool.push(k);}return pool[Math.floor(Math.random()*pool.length)];}

// ===== 状態 =====
const cv=$('cv'),g=cv.getContext('2d');let W,H,DPR,RW,RL;
function resize(){DPR=window.devicePixelRatio||1;W=cv.clientWidth;H=cv.clientHeight;cv.width=W*DPR;cv.height=H*DPR;RW=Math.min(W*.8,300);RL=(W-RW)/2;}
const laneX=l=>RL+RW*(l+.5)/3;
const L=9200;
let P,RV,OB,PJ,state='title',cd=0,fx=[],flash=0,t0=0;
function rng(seed){let s=seed*9301+49297;return()=>{s=(s*9301+49297)%233280;return s/233280;};}
function newRace(){resize();const r=rng(SV.race+7);
  P={lane:1,x:laneX(1),d:0,v:0,spin:0,boost:0,shield:false,jump:0,ghost:0,giant:0,star:0,item:null,uses:0,roll:0,magnet:0,fin:false};
  const cols=[['#3a8cff','あお'],['#3fbf5a','みどり'],['#ffb02e','きいろ']];
  RV=cols.map((c,i)=>({col:c[0],nm:c[1],lane:i,x:laneX(i),d:50+i*45,v0:5.75+r()*.45,spin:0,fin:0,boost:0}));
  OB=[];let d=420;OB.push({t:'box',lane:0,d},{t:'box',lane:1,d},{t:'box',lane:2,d});d+=300;
  while(d<L-300){const x=r();
    if(x<.33){const sk=Math.floor(r()*3);for(let l=0;l<3;l++)if(l!==sk||r()<.4)OB.push({t:'box',lane:l,d});}
    else if(x<.8){OB.push({t:r()<.5?'rock':'cone',lane:Math.floor(r()*3),d});}
    else if(x<.92){const sk=Math.floor(r()*3);for(let l=0;l<3;l++)if(l!==sk)OB.push({t:'cone',lane:l,d});}
    d+=200+r()*170;}
  PJ=[];fx=[];state='count';cd=180;t0=0;renderSlot();}
function rank(){return 1+RV.filter(v=>v.fin?(!P.fin||v.fin<P.fin):v.d>P.d).length;}
function toast(s){const e=document.createElement('div');e.className='toast';e.textContent=s;$('app').appendChild(e);setTimeout(()=>e.remove(),900);}
function renderSlot(){const s=$('slot');s.className='slot'+(P&&P.roll>0?' spin':'');
  if(!P){s.textContent='';return;}
  if(P.roll>0)s.textContent=ITEMS[SV.have[Math.floor(P.roll/4)%SV.have.length]].ic;
  else s.textContent=P.item?ITEMS[P.item].ic+(P.uses>1?P.uses:''):'';
  $('use').disabled=!P.item||P.roll>0;$('use').textContent=P.item&&!P.roll?ITEMS[P.item].n:'つかう';}

// ===== 操作 =====
function move(dl){if(state!=='race'||P.spin)return;P.lane=Math.max(0,Math.min(2,P.lane+dl));tone(400,.04,'square',.02);}
function useItem(){if(state!=='race'||!P.item||P.roll>0)return;const k=P.item;
  if(k==='dash'||k==='dash3'){P.boost=75;sfx.dash();}
  if(k==='bomb'){PJ.push({t:'bomb',lane:P.lane,x:P.x,d:P.d+30,v:13});tone(300,.1);}
  if(k==='homing'){const tg=RV.filter(v=>v.d>P.d&&!v.fin).sort((a,b)=>a.d-b.d)[0];PJ.push({t:'homing',tg,lane:P.lane,x:P.x,d:P.d+30,v:14});tone(500,.1);}
  if(k==='shield'){P.shield=true;sfx.shield();}
  if(k==='oil'){OB.push({t:'oil',lane:P.lane,d:P.d-40});tone(200,.1);}
  if(k==='jump'){P.jump=55;tone(300,.3,'square',.05,0,500);}
  if(k==='magnet'){P.magnet=120;sfx.shield();}
  if(k==='ghost'){P.ghost=130;tone(700,.4,'sine',.05,0,-400);}
  if(k==='giant'){P.giant=160;tone(120,.5,'square',.07,0,200);}
  if(k==='star'){P.star=160;P.boost=160;[0,4,7,12].forEach((s,i)=>tone(784*Math.pow(2,s/12),.1,'square',.04,i*.05));}
  if(k==='thunder'){sfx.thunder();flash=14;RV.forEach(v=>{if(!v.fin)v.spin=80;});}
  P.uses--;if(P.uses<=0)P.item=null;renderSlot();}
$('bl').onclick=()=>move(-1);$('br').onclick=()=>move(1);$('use').onclick=useItem;
cv.addEventListener('pointerdown',e=>{const r=cv.getBoundingClientRect();const x=e.clientX-r.left;if(x<W*.35)move(-1);else if(x>W*.65)move(1);else useItem();});
window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1);if(e.key===' '||e.key==='ArrowUp')useItem();});

// ===== 更新 =====
const hitObj=(x,d,o)=>Math.abs(x-laneX(o.lane))<24&&Math.abs(d-o.d)<20;
function spinOut(o,isP){if(isP){if(P.star||P.ghost||P.giant)return false;if(P.shield){P.shield=false;sfx.shield();toast('🛡️ ふせいだ');return false;}P.spin=60;sfx.crash();P.boost=0;return true;}o.spin=60;return true;}
function update(){
  if(state==='count'){cd--;if(cd%60===0&&cd>0)sfx.beep(false);if(cd<=0){state='race';sfx.beep(true);toast('GO!');engineOn();}return;}
  if(state!=='race'&&state!=='finish')return;t0++;
  // プレイヤー
  if(!P.fin){let tv=6.2;if(P.boost>0){tv*=1.6;P.boost--;}if(P.magnet>0){P.magnet--;const tg=RV.filter(v=>v.d>P.d).sort((a,b)=>a.d-b.d)[0];if(tg&&tg.d-P.d>30)tv*=1.7;}
    if(P.spin>0){tv*=.25;P.spin--;}P.v+=(tv-P.v)*.06;P.d+=P.v;}
  else P.d+=P.v*.97;
  P.x+=(laneX(P.lane)-P.x)*.22;['jump','ghost','giant','star'].forEach(k=>{if(P[k]>0)P[k]--;});
  if(P.roll>0){P.roll--;if(P.roll%4===0)sfx.tick();if(P.roll===0){P.item=rollItem(rank());P.uses=P.item==='dash3'?3:1;sfx.get();}renderSlot();}
  // ライバル
  for(const v of RV){let tv=v.v0;const gap=v.d-P.d;if(gap>350)tv*=.92;if(gap<-250)tv*=1.1;if(v.spin>0){tv*=.25;v.spin--;}if(v.fin)tv*=.97;
    v.v=(v.v||0)+(tv-(v.v||0))*.06;v.d+=v.v;
    const ahead=OB.find(o=>o.t!=='box'&&!o.gone&&o.lane===v.lane&&o.d>v.d&&o.d-v.d<160);
    if(ahead&&Math.random()<.06){const opts=[v.lane-1,v.lane+1].filter(l=>l>=0&&l<3);v.lane=opts[Math.floor(Math.random()*opts.length)];}
    v.x+=(laneX(v.lane)-v.x)*.15;if(!v.fin&&v.d>=L)v.fin=t0;}
  // 物
  for(const o of OB){if(o.gone)continue;
    if(hitObj(P.x,P.d,o)&&!P.fin){
      if(o.t==='box'){o.gone=true;burst(laneX(o.lane),o.d,'#ffd84a');if(!P.item&&!P.roll){P.roll=56;renderSlot();}else tone(700,.05);}
      else if(!P.jump){if(P.giant||P.star){o.gone=true;sfx.boom();burst(laneX(o.lane),o.d,'#fff');}else if(spinOut(P,true)){o.gone=true;burst(laneX(o.lane),o.d,'#aaa');}else o.gone=true;}}
    for(const v of RV)if(o.t!=='box'&&!o.gone&&hitObj(v.x,v.d,o)&&!v.spin){v.spin=55;o.gone=true;burst(laneX(o.lane),o.d,'#aaa');}}
  // 体当たり
  for(const v of RV){if(Math.abs(v.x-P.x)<26&&Math.abs(v.d-P.d)<30&&!P.ghost){
    if(P.giant||P.star){if(!v.spin){v.spin=70;sfx.boom();burst(v.x,v.d,v.col);}}else{const s=P.x<v.x?-1:1;P.x+=s*6;v.x-=s*6;P.v*=.97;v.v*=.97;}}}
  // 弾
  for(const p of PJ){if(p.gone)continue;p.d+=p.v;
    if(p.t==='homing'&&p.tg){p.x+=(p.tg.x-p.x)*.12;}else p.x+=(laneX(p.lane)-p.x)*.2;
    for(const v of RV)if(Math.abs(v.x-p.x)<24&&Math.abs(v.d-p.d)<26&&!v.fin){v.spin=70;p.gone=true;sfx.boom();burst(v.x,v.d,'#ff6a2a');toast('💥 命中！');break;}
    if(!p.gone)for(const o of OB)if(o.t!=='box'&&!o.gone&&Math.abs(laneX(o.lane)-p.x)<22&&Math.abs(o.d-p.d)<20){o.gone=p.gone=true;sfx.boom();burst(laneX(o.lane),o.d,'#ff6a2a');break;}
    if(p.d-P.d>H)p.gone=true;}
  PJ=PJ.filter(p=>!p.gone);
  if(eng)eng.frequency.value=50+P.v*9;
  // ゴール
  if(!P.fin&&P.d>=L){P.fin=t0;state='finish';const rk=rank();sfx.fan();toast(rk===1?'🏆 1位！':`ゴール！ ${rk}位`);setTimeout(()=>finish(rk),1600);}
  const rk=rank();$('pos').innerHTML=`${rk}<small>位</small>`;
  const pr=$('prog');pr.innerHTML=[...RV.map(v=>[v.d,v.col]),[P.d,'#e8402c']].map(([d,c])=>`<i style="background:${c};bottom:${Math.min(100,d/L*100)}%;margin-bottom:-8px"></i>`).join('');
}
function burst(x,d,c){for(let i=0;i<12;i++)fx.push({x,d,vx:(Math.random()-.5)*6,vd:(Math.random()-.5)*6,c,l:25});}
function finish(rk){state='end';if(eng){engG.gain.value=0;}
  let unlocked=null;if(rk<=3){const nx=UNLOCK.find(k=>!SV.have.includes(k));if(nx){SV.have.push(nx);unlocked=nx;}}
  if(rk===1)SV.wins++;SV.race++;saveSV();
  $('endT').textContent=rk===1?'🏆 1位！':`${rk}位`;
  $('endP').innerHTML=unlocked?`<b style="color:#ffd84a;font-size:20px">新アイテム ${ITEMS[unlocked].ic} ${ITEMS[unlocked].n}</b><br>次から？の箱に入る`:(rk>3?'3位以内で、新しいアイテムが箱に入る':'全アイテムを集めた！');
  $('items').innerHTML=[...START,...UNLOCK].map(k=>{const h=SV.have.includes(k);return `<div class="it${h?'':' lock'}${k===unlocked?' new':''}">${h?ITEMS[k].ic:'？'}<small>${h?ITEMS[k].n:'？？？'}</small></div>`;}).join('');
  $('endSheet').hidden=false;}

// ===== 描画 =====
function kart(x,y,col,o){g.save();g.translate(x,y);const sc=o.big?1.7:o.jump?1+Math.sin(o.jump/55*Math.PI)*.35:1;g.scale(sc,sc);if(o.spin)g.rotate(o.spin*.35);if(o.alpha)g.globalAlpha=o.alpha;
  g.fillStyle='rgba(0,0,0,.3)';g.fillRect(-13,-14,28,36);g.fillStyle='#111';[[-15,-14],[11,-14],[-15,8],[11,8]].forEach(([a,b])=>g.fillRect(a,b,5,10));
  g.fillStyle=col;g.beginPath();g.roundRect(-11,-18,22,36,7);g.fill();g.strokeStyle='#000';g.lineWidth=2;g.stroke();
  g.fillStyle='rgba(255,255,255,.35)';g.fillRect(-7,-14,14,5);g.fillStyle=o.helm||'#fff';g.beginPath();g.arc(0,2,7,0,7);g.fill();g.stroke();
  if(o.star){g.strokeStyle=`hsl(${t0*20%360},100%,60%)`;g.lineWidth=3;g.beginPath();g.arc(0,0,26,0,7);g.stroke();}
  if(o.shield){g.strokeStyle='rgba(120,200,255,.9)';g.lineWidth=3;g.beginPath();g.arc(0,0,24,0,7);g.stroke();}
  g.restore();}
function draw(){g.setTransform(DPR,0,0,DPR,0,0);const pd=P?P.d:0,py=H*.72,sy=d=>py-(d-pd);
  // 芝生
  g.fillStyle='#4a8c3a';g.fillRect(0,0,W,H);const off=pd%80;for(let y=-80;y<H+80;y+=80){g.fillStyle='#55993f';g.fillRect(0,y+off,W,40);}
  for(let i=0;i<14;i++){const y=((i*137+pd)%(H+40))-20;g.fillStyle=i%3?'#f2e86a':'#ff8fb0';g.fillRect((i*71)%(RL-10)+2,y,4,4);g.fillRect(W-((i*53)%(RL-10))-6,y,4,4);}
  // 道
  g.fillStyle='#5a5a62';g.fillRect(RL,0,RW,H);
  for(let y=-40;y<H+40;y+=40){const yy=y+(pd%40);g.fillStyle=((Math.floor((y+pd)/40))%2)?'#e8402c':'#fff';g.fillRect(RL-8,yy,8,20);g.fillRect(RL+RW,yy,8,20);g.fillStyle=((Math.floor((y+pd)/40))%2)?'#fff':'#e8402c';g.fillRect(RL-8,yy+20,8,20);g.fillRect(RL+RW,yy+20,8,20);}
  g.fillStyle='rgba(255,255,255,.6)';for(const lx of [RL+RW/3,RL+RW*2/3])for(let y=-60;y<H+60;y+=60)g.fillRect(lx-2,y+(pd%60),4,28);
  for(const [d,ch] of [[0,0],[L,1]]){const y=sy(d);if(y<-30||y>H+30)continue;for(let i=0;i<RW/12;i++)for(let j=0;j<2;j++){g.fillStyle=(i+j)%2?'#000':'#fff';g.fillRect(RL+i*12,y+j*12-12,12,12);}}
  if(!P)return;
  // 物
  for(const o of OB){if(o.gone)continue;const y=sy(o.d);if(y<-30||y>H+30)continue;const x=laneX(o.lane);
    if(o.t==='box'){g.save();g.translate(x,y);g.rotate(Math.sin(t0*.08+o.d)*.2);g.fillStyle=`hsl(${(t0*6+o.d)%360},85%,60%)`;g.globalAlpha=.85;g.beginPath();g.roundRect(-13,-13,26,26,5);g.fill();g.globalAlpha=1;g.strokeStyle='#fff';g.lineWidth=2.5;g.stroke();
      g.fillStyle='#fff';g.font='800 18px "M PLUS Rounded 1c"';g.textAlign='center';g.textBaseline='middle';g.fillText('?',0,1);g.restore();}
    if(o.t==='rock'){g.fillStyle='#8a8478';g.strokeStyle='#000';g.lineWidth=2;g.beginPath();g.ellipse(x,y,15,12,0,0,7);g.fill();g.stroke();g.fillStyle='#b0aa9c';g.fillRect(x-7,y-6,6,4);}
    if(o.t==='cone'){g.fillStyle='#ff7a1a';g.strokeStyle='#000';g.lineWidth=2;g.beginPath();g.moveTo(x,y-14);g.lineTo(x+10,y+10);g.lineTo(x-10,y+10);g.closePath();g.fill();g.stroke();g.fillStyle='#fff';g.fillRect(x-5,y-1,10,4);}
    if(o.t==='oil'){g.fillStyle='rgba(10,10,20,.85)';g.beginPath();g.ellipse(x,y,16,10,0,0,7);g.fill();g.fillStyle='rgba(120,90,255,.5)';g.fillRect(x-5,y-3,7,2);}}
  for(const p of PJ){const y=sy(p.d);g.font='22px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(p.t==='homing'?'🎯':'💣',p.x,y);}
  for(const v of RV){const y=sy(v.d);if(y>-40&&y<H+40)kart(v.x,y,v.col,{spin:v.spin,helm:'#ffe'});}
  if(P.boost>0)for(let i=0;i<5;i++){g.fillStyle='rgba(255,220,120,.7)';g.fillRect(P.x-10+Math.random()*20,py+20+Math.random()*30,2,14);}
  kart(P.x,py,'#e8402c',{spin:P.spin,big:P.giant>0,jump:P.jump,star:P.star>0,shield:P.shield,alpha:P.ghost?.4:0,helm:'#fff'});
  g.fillStyle='#ffd84a';g.beginPath();g.moveTo(P.x,py-34);g.lineTo(P.x-6,py-42);g.lineTo(P.x+6,py-42);g.fill();
  for(const f of fx){f.x+=f.vx;f.d+=f.vd;f.l--;g.fillStyle=f.c;g.globalAlpha=f.l/25;g.fillRect(f.x,sy(f.d),4,4);g.globalAlpha=1;}fx=fx.filter(f=>f.l>0);
  if(state==='count'){const n=Math.ceil(cd/60);g.fillStyle='#fff';g.strokeStyle='#000';g.lineWidth=6;g.font='800 90px "M PLUS Rounded 1c"';g.textAlign='center';g.textBaseline='middle';g.strokeText(n,W/2,H*.4);g.fillText(n,W/2,H*.4);}
  if(flash>0){g.fillStyle=`rgba(255,255,200,${flash/14})`;g.fillRect(0,0,W,H);flash--;}
}
let acc=0,lt=0;function frame(t){const dt=Math.min(100,t-(lt||t));lt=t;acc+=dt;while(acc>=16.67){update();acc-=16.67;}draw();requestAnimationFrame(frame);}
$('start').onclick=()=>{ac();$('title').hidden=true;newRace();};
$('again').onclick=()=>{$('endSheet').hidden=true;if(engG)engG.gain.value=.025;newRace();};
window.addEventListener('resize',resize);resize();requestAnimationFrame(frame);
