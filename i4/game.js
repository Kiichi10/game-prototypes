'use strict';
const cv=$('cv'),g=cv.getContext('2d');let W,H,DPR,RW,RL;
function resize(){DPR=window.devicePixelRatio||1;W=cv.clientWidth;H=cv.clientHeight;cv.width=W*DPR;cv.height=H*DPR;RW=Math.min(W*.8,300);RL=(W-RW)/2;}
const laneX=l=>RL+RW*(l+.5)/3;
function rng(seed){let s=seed*9301+49297;return()=>{s=(s*9301+49297)%233280;return s/233280;};}
let GH=null,CUP,CO,P,RV,OB,PJ,state='title',cd=0,fx=[],flash=0,t0=0,L=9200;

// ===== グランプリ =====
const cidx=()=>CUP.cup*4+CUP.race;
const cupOpen=()=>(SV.trophies||[]).length>0;
function newCup(){CUP={cup:cupOpen()?(SV.cupSel||0):0,race:0,pts:[0,0,0,0],marks:[],cls:SV.clsSel||0};newRace();}
function newTA(i){CUP={ta:true,cup:Math.floor(i/4),race:i%4,pts:[0,0,0,0],marks:[],cls:SV.clsSel||0};newRace();}
function newRace(){resize();const ci=cidx();CO=COURSES[ci];L=CO.L;const r=rng(ci*101+7);
  P={who:0,lane:1,x:laneX(1),d:0,v:0,spin:0,boost:0,shield:false,jump:0,ghost:0,giant:0,star:0,items:[],roll:0,magnet:0,coins:0,got:0,fin:0,holeCd:0};
  const K=CLASSES[CUP.cls].k,per=CUP.cup===1?[PERS[0],KURO,PERS[2]]:PERS;
  RV=CUP.ta?[]:per.map((c,i)=>({p:c,car:c.car||RIVAL_CAR[i],who:i+1,col:c.col===COLORS[SV.color][0]?'#9a5aff':c.col,nm:c.nm,lane:i,x:laneX(i),d:50+i*45,v0:(5.88+r()*.4+CUP.race*.05+CUP.cup*.12+c.v)*K*(1+CUP.cls*.06),ahead:true,sayCd:0,say:null,spin:0,fin:0,boost:0,item:null,icd:0,shield:false,jump:0}));
  OB=[];let d=420;if(!CUP.ta)OB.push({t:'box',lane:0,d},{t:'box',lane:1,d},{t:'box',lane:2,d});d+=300;
  const sand=CO.gim.includes('sand'),gim=CO.gim[0];
  while(d<L-300){const x=r();
    if(['wave','belt','sky','lava'].includes(gim)&&r()<.42){
      if(gim==='wave'){OB.push({t:'wave',lane:0,d,len:130,ph:Math.floor(r()*3)});d+=140;}
      if(gim==='belt'){const a=Math.floor(r()*3),b=(a+1+Math.floor(r()*2))%3;OB.push({t:'belt',lane:a,d,len:230,dir:1},{t:'belt',lane:b,d,len:230,dir:-1});d+=240;}
      if(gim==='sky'){const l=Math.floor(r()*3),safe=(l+1+Math.floor(r()*2))%3;OB.push({t:'ramp',lane:l,d});for(let k=0;k<3;k++)if(k!==safe)OB.push({t:'hole',lane:k,d:d+180});for(let k=0;k<3;k++)OB.push({t:'coin',lane:l,d:d+140+k*38});d+=260;}
      if(gim==='lava'){const n=1+Math.floor(r()*2),a=Math.floor(r()*3);for(let k=0;k<n;k++)OB.push({t:'geyser',lane:(a+k)%3,d,ph:Math.floor(r()*150)});}
      d+=200+r()*170;continue;}
    if(x<.27){if(!CUP.ta){const sk=Math.floor(r()*3);for(let l=0;l<3;l++)if(l!==sk||r()<.4)OB.push({t:'box',lane:l,d});}}
    else if(x<.55){if(sand&&r()<.5)OB.push({t:'sand',lane:Math.floor(r()*3),d,len:150});else OB.push({t:r()<.5?'rock':'cone',lane:Math.floor(r()*3),d});}
    else if(x<.65){const sk=Math.floor(r()*3);for(let l=0;l<3;l++)if(l!==sk)OB.push({t:'cone',lane:l,d});}
    else if(x<.8){const l=Math.floor(r()*3);for(let k=0;k<4;k++)OB.push({t:'coin',lane:l,d:d+k*38});}
    else if(x<.9){OB.push({t:'pad',lane:Math.floor(r()*3),d});}
    else if(sand){const l=Math.floor(r()*3);OB.push({t:'sand',lane:l,d,len:200});}
    d+=200+r()*170;}
  const cs=carStats();P.st=cs.s;P.sp=cs.sp;P.track=[];GH=(CUP.ta&&SV.ghost&&SV.ghost[ci])||null;
  if(!CUP.ta){SV.run=JSON.parse(JSON.stringify(CUP));saveSV();}
  PJ=[];fx=[];confetti=[];state='count';cd=180;t0=0;P.slip=0;$('course').textContent=CUP.ta?`${CO.ic} ${CO.n}　タイムアタック`:`${CO.ic} ${CO.n}　${CUP.race+1}/4`;renderSlot();storyLine();}
const allKarts=()=>[P,...RV];
function rank(){return 1+RV.filter(v=>v.fin?(!P.fin||v.fin<P.fin):v.d>P.d).length;}
function order(){return allKarts().slice().sort((a,b)=>(a.fin&&b.fin)?a.fin-b.fin:a.fin?-1:b.fin?1:b.d-a.d);}
function toast(s){const e=document.createElement('div');e.className='toast';e.textContent=s;$('app').appendChild(e);setTimeout(()=>e.remove(),900);}
function renderSlot(){const s=$('slot'),s2=$('slot2');s.className='slot'+(P&&P.roll>0?' spin':'');
  if(!P){s.textContent='';s2.textContent='';return;}
  if(P.roll>0)s.textContent=ITEMS[SV.have[Math.floor(P.roll/4)%SV.have.length]].ic;
  else s.textContent=P.items[0]?ITEMS[P.items[0].k].ic+(P.items[0].u>1?P.items[0].u:''):'';
  s2.textContent=P.items[1]?ITEMS[P.items[1].k].ic:'';if(P.roll>0&&P.items[0]){s.textContent=ITEMS[P.items[0].k].ic;s2.textContent=ITEMS[SV.have[Math.floor(P.roll/4)%SV.have.length]].ic;}
  const it=P.items[0];$('use').disabled=!it;$('use').textContent=it?ITEMS[it.k].n:'つかう';$('coins').textContent=P.coins;}
function rollItem(rk){const pool=[],lk=lv('luck')+(P.st.luck||0);for(const k of SV.have){let w=1;if(rk===1&&DEF.includes(k))w=3;if(rk>=3&&CATCH.includes(k))w=3+lk;if(rk===2&&CATCH.includes(k))w=1+lk*.5;if(rk===1&&CATCH.includes(k))w=.2+lk*.15;if(k==='dash')w=rk>=2?2:1;for(let i=0;i<w*10;i++)pool.push(k);}return pool[Math.floor(Math.random()*pool.length)];}

// ===== 操作 =====
function move(dl){if(state!=='race'||P.spin)return;P.lane=Math.max(0,Math.min(2,P.lane+dl));tone(400,.04,'square',.02);}
function useItem(){if(state!=='race'||!P.items.length)return;const it=P.items[0],k=it.k;
  if(k==='dash'||k==='dash3'){P.boost=P.sp.muffler?105:75;sfx.dash();}
  if(k==='bomb'){PJ.push({t:'bomb',own:P,lane:P.lane,x:P.x,d:P.d+30,v:13});tone(300,.1);}
  if(k==='homing'){const tg=RV.filter(v=>v.d>P.d&&!v.fin).sort((a,b)=>a.d-b.d)[0];PJ.push({t:'homing',own:P,tg,lane:P.lane,x:P.x,d:P.d+30,v:14});tone(500,.1);}
  if(k==='shield'){P.shield=true;sfx.shield();}
  if(k==='oil'){OB.push({t:'oil',lane:P.lane,d:P.d-40,own:P});tone(200,.1);}
  if(k==='jump'){P.jump=55;tone(300,.3,'square',.05,0,500);}
  if(k==='magnet'){P.magnet=120;sfx.shield();}
  if(k==='ghost'){P.ghost=130;tone(700,.4,'sine',.05,0,-400);}
  if(k==='giant'){P.giant=160;tone(120,.5,'square',.07,0,200);}
  if(k==='star'){P.star=160;P.boost=160;[0,4,7,12].forEach((s,i)=>tone(784*Math.pow(2,s/12),.1,'square',.04,i*.05));}
  if(k==='thunder'){sfx.thunder();flash=14;RV.forEach(v=>{if(!v.fin){if(v.shield)v.shield=false;else v.spin=80;}});}
  it.u--;if(it.u<=0)P.items.shift();renderSlot();}
$('bl').onclick=()=>move(-1);$('br').onclick=()=>move(1);$('use').onclick=useItem;
cv.addEventListener('pointerdown',e=>{const r=cv.getBoundingClientRect();const x=e.clientX-r.left;if(x<W*.35)move(-1);else if(x>W*.65)move(1);else useItem();});
window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1);if(e.key===' '||e.key==='ArrowUp')useItem();});

// ===== 更新 =====
const near=(x,d,o,len)=>Math.abs(x-laneX(o.lane))<24&&(len?(d>o.d-10&&d<o.d+len):Math.abs(d-o.d)<20);
function spin(k){if(k===P){if(P.star||P.ghost||P.giant)return false;if(P.shield){P.shield=false;sfx.shield();toast('🛡️ ふせいだ');return false;}
    P.spin=Math.max(20,Math.round(60*(1-.15*lv('tire'))*(1-P.st.tough*.08)));shakeV=9;sfx.crash();P.boost=0;const lost=Math.min(P.st.tough>=3?2:3,P.coins);P.coins-=lost;if(lost)toast(`🪙-${lost}`);renderSlot();return true;}
  if(k.shield){k.shield=false;return false;}k.spin=60;return true;}
function rivalAI(v){v.icd--;if(!v.item||v.icd>0||v.fin)return;
  const ahead=allKarts().filter(k=>k!==v&&k.d>v.d&&k.d-v.d<450&&Math.abs(k.x-v.x)<30);
  if(v.item==='dash'){v.boost=60;v.item=null;}
  else if(v.item==='bomb'&&ahead.length){PJ.push({t:'bomb',own:v,lane:v.lane,x:v.x,d:v.d+30,v:12.5});v.item=null;}
  else if(v.item==='oil'&&P.d<v.d&&v.d-P.d<320){OB.push({t:'oil',lane:v.lane,d:v.d-40,own:v});v.item=null;}
  else if(v.item==='shield'){v.shield=true;v.item=null;}
  else if(v.icd<-360){v.item==='bomb'?PJ.push({t:'bomb',own:v,lane:v.lane,x:v.x,d:v.d+30,v:12.5}):v.item==='oil'?OB.push({t:'oil',lane:v.lane,d:v.d-40,own:v}):0;v.item=null;}}
function update(){
  if(state==='count'){cd--;if(cd%60===0&&cd>0)sfx.beep(false);if(cd<=0){state='race';sfx.beep(true);toast('GO!');engineOn();bgmStart(cidx());}return;}
  if(state!=='race'&&state!=='finish')return;t0++;
  const ice=CO.gim.includes('ice');
  // プレイヤー
  tutTick();
  if(!P.fin){let tv=6.2*CLASSES[CUP.cls].k*(1+lv('engine')*.03)*(1+P.coins*.008)*(1+P.st.spd*.015);if(P.boost>0){tv*=1.6;P.boost--;}
    if(P.magnet>0){P.magnet--;const tg=RV.filter(v=>v.d>P.d).sort((a,b)=>a.d-b.d)[0];if(tg&&tg.d-P.d>30)tv*=1.7;}
    if(!P.jump&&!P.star&&OB.some(o=>o.t==='sand'&&near(P.x,P.d,o,o.len)))tv*=P.sp.snow?.82:P.sp.slick?.45:.55;
    if(!P.jump)tv*=terrain(P);
    if(P.spin>0){tv*=.25;P.spin--;}P.v+=(tv-P.v)*Math.max(.03,.06+P.st.acc*.006);P.d+=P.v;}
  else P.d+=P.v*.97;
  const lead=RV.find(v=>Math.abs(v.x-P.x)<18&&v.d-P.d>25&&v.d-P.d<120&&!v.fin);if(lead&&!P.fin&&!P.spin){P.slip++;if(P.slip>=(P.sp.wing?60:95)){P.slip=0;P.boost=Math.max(P.boost,38);sfx.pad();toast('スリップストリーム！');}}else P.slip=Math.max(0,P.slip-2);
  P.x+=(laneX(P.lane)-P.x)*Math.max(.05,(ice&&!P.sp.snow?(P.sp.slick?.05:.07):.22+lv('tire')*.04+P.st.turn*.02));if(ice&&!P.sp.snow&&Math.random()<.01&&!P.spin)P.x+=(Math.random()-.5)*10;
  ['jump','ghost','giant','star'].forEach(k=>{if(P[k]>0)P[k]--;});
  if(P.roll>0){P.roll--;if(P.roll%4===0)sfx.tick();if(P.roll===0){const k=rollItem(rank());P.items.push({k,u:k==='dash3'?3:1});sfx.get();}renderSlot();}
  // ライバル
  for(const v of RV){let tv=v.v0;const gap=v.d-P.d;if(gap>350)tv*=.93;if(gap<-200)tv*=1.13;if(v.boost>0){tv*=1.5;v.boost--;}
    if(OB.some(o=>o.t==='sand'&&near(v.x,v.d,o,o.len)))tv*=.6;if(!v.jump)tv*=terrain(v);if(v.jump>0)v.jump--;if(v.spin>0){tv*=.25;v.spin--;}if(v.fin)tv*=.97;
    v.v=(v.v||0)+(tv-(v.v||0))*.06;v.d+=v.v;
    const danger=OB.find(o=>(o.t==='rock'||o.t==='cone'||o.t==='oil'||o.t==='sand'||o.t==='hole'||(o.t==='belt'&&o.dir<0))&&!o.gone&&o.lane===v.lane&&o.d>v.d&&o.d-v.d<160);
    if(danger&&Math.random()<.06){const opts=[v.lane-1,v.lane+1].filter(l=>l>=0&&l<3);v.lane=opts[Math.floor(Math.random()*opts.length)];}
    v.x+=(laneX(v.lane)-v.x)*(ice?.08:.15);if(!v.fin&&v.d>=L)v.fin=t0;rivalAI(v);
    const ah=v.d>P.d;if(ah&&!v.ahead&&!P.fin)say(v,'pass');v.ahead=ah;if(v.say&&--v.say.l<=0)v.say=null;}
  // 物
  for(const o of OB){if(o.gone||o.t==='sand'||o.t==='wave'||o.t==='belt')continue;
    if(o.t==='ramp'||o.t==='hole'||o.t==='geyser'){const hot=o.t==='hole'||(o.t==='geyser'&&gey(o)>=110);
      if(near(P.x,P.d,o)&&!P.fin){if(o.t==='ramp'){if(!P.jump){P.jump=62;tone(300,.3,'square',.05,0,500);}}else if(hot&&!P.jump&&!P.spin&&P.holeCd<t0){P.holeCd=t0+40;spin(P);}}
      for(const v of RV)if(near(v.x,v.d,o)){if(o.t==='ramp')v.jump=62;else if(hot&&!v.jump&&!v.spin&&!o['h'+v.who]){o['h'+v.who]=1;if(Math.random()<.3)spin(v);}}continue;}
    if((near(P.x,P.d,o)||(o.t==='coin'&&P.sp.magnet&&Math.abs(P.d-o.d)<20&&Math.abs(P.x-laneX(o.lane))<RW/3+6))&&!P.fin){
      if(o.t==='box'){o.gone=true;burst(laneX(o.lane),o.d,'#ffd84a');if(P.items.length<2&&!P.roll){P.roll=56;renderSlot();}else tone(700,.05);}
      else if(o.t==='coin'){o.gone=true;if(P.coins<10)P.coins++;P.got++;sfx.coin();renderSlot();}
      else if(o.t==='pad'){if(!o.cool||o.cool<t0){o.cool=t0+30;P.boost=Math.max(P.boost,45);sfx.pad();}}
      else if(!P.jump){if(P.giant||P.star){o.gone=true;sfx.boom();burst(laneX(o.lane),o.d,'#fff');}else{spin(P);o.gone=true;burst(laneX(o.lane),o.d,'#aaa');}}}
    for(const v of RV){if(o.gone)break;if(!near(v.x,v.d,o))continue;
      if(o.t==='box'){if(!v.item){const it=PERS[v.who-1].items;v.item=it[Math.floor(Math.random()*it.length)];v.icd=40+Math.floor(Math.random()*90);}o.gone=true;burst(laneX(o.lane),o.d,'#ffd84a');}
      else if(o.t==='pad'){v.boost=Math.max(v.boost,40);}
      else if(o.t!=='coin'&&!v.spin){spin(v);o.gone=true;burst(laneX(o.lane),o.d,'#aaa');}}}
  // 体当たり
  for(const v of RV){if(Math.abs(v.x-P.x)<26&&Math.abs(v.d-P.d)<30&&!P.ghost){
    if(P.giant||P.star){if(!v.spin){v.spin=70;sfx.boom();burst(v.x,v.d,v.col);}}else{const s=P.x<v.x?-1:1;P.x+=s*6;v.x-=s*6;P.v*=.97;v.v*=.97;}}}
  // 弾
  let warn=null;
  for(const p of PJ){if(p.gone)continue;p.d+=p.v;
    if(p.t==='homing'&&p.tg){p.x+=(p.tg.x-p.x)*.12;}else p.x+=(laneX(p.lane)-p.x)*.2;
    for(const k of allKarts()){if(k===p.own||k.fin)continue;if(Math.abs(k.x-p.x)<24&&Math.abs(k.d-p.d)<26){p.gone=true;
      if(spin(k)){sfx.boom();burst(k.x,k.d,'#ff6a2a');if(p.own===P){toast('💥 命中！');say(k,'ouch');}else if(k===P){toast('💥 やられた！');say(p.own,'hit');}}break;}}
    if(!p.gone)for(const o of OB)if((o.t==='rock'||o.t==='cone'||o.t==='oil')&&!o.gone&&Math.abs(laneX(o.lane)-p.x)<22&&Math.abs(o.d-p.d)<20){o.gone=p.gone=true;sfx.boom();burst(laneX(o.lane),o.d,'#ff6a2a');break;}
    if(p.own!==P&&!p.gone&&p.d<P.d&&P.d-p.d<380&&Math.abs(p.x-P.x)<40){warn=p;if(!p.warned){p.warned=1;sfx.warn();}}
    if(Math.abs(p.d-P.d)>H*1.5)p.gone=true;}
  PJ=PJ.filter(p=>!p.gone);P.warn=warn;
  if(eng)eng.frequency.value=50+P.v*9;
  if(t0%4===0&&P.track)P.track.push(Math.round(P.d),Math.round(P.x));
  if(!P.fin&&P.d>=L){P.fin=t0;state='finish';const rk=rank();sfx.fan();if(rk<=3)popConfetti();toast(rk===1?'🏆 1位！':`ゴール！ ${rk}位`);setTimeout(()=>CUP.ta?finishTA():finish(rk),1600);}
  $('pos').innerHTML=`${rank()}<small>位</small>`;
  $('prog').innerHTML=[...RV.map(v=>[v.d,v.col]),[P.d,COLORS[SV.color][0]]].map(([d,c])=>`<i style="background:${c};bottom:${Math.min(100,d/L*100)}%;margin-bottom:-8px"></i>`).join('');}
function burst(x,d,c){for(let i=0;i<12;i++)fx.push({x,d,vx:(Math.random()-.5)*6,vd:(Math.random()-.5)*6,c,l:25});}

// ===== ゴール後 =====
function finish(rk){state='end';if(engG)engG.gain.value=0;bgmStop();
  SV.rec=SV.rec||{};const rkey=CUP.cls+'-'+cidx(),tm=P.fin/60,old=SV.rec[rkey],newRec=!old||tm<old;if(newRec)SV.rec[rkey]=tm;
  const ord=order();ord.forEach((k,i)=>{CUP.pts[k.who]+=POINTS[i];});CUP.marks.push(rk);SV.run=Object.assign(JSON.parse(JSON.stringify(CUP)),CUP.race===3?{showResult:true}:{race:CUP.race+1});
  const earned=P.got+[10,6,4,2][rk-1];SV.coins+=earned;
  let unlocked=null;if(rk<=3){const nx=UNLOCK.find(k=>!SV.have.includes(k));if(nx){SV.have.push(nx);unlocked=nx;}}saveSV();
  const names=['あなた',...RV.map(v=>v.nm)],cols=[COLORS[SV.color][0],...RV.map(v=>v.col)];
  const tbl=ord.map((k,i)=>`<tr${k===P?' class="me"':''}><td>${i+1}位</td><td><i style="background:${cols[k.who]}"></i>${names[k.who]}</td><td>+${POINTS[i]}</td><td>${CUP.pts[k.who]}pt</td></tr>`).join('');
  const last=CUP.race===3;
  $('endT').textContent=`${CO.ic} ${CO.n}　${rk===1?'🏆 1位！':rk+'位'}`;
  $('endRec').innerHTML=`タイム ${tm.toFixed(2)}秒　${newRec?'<b>🎉 コース記録更新！</b>'+(old?`（前 ${old.toFixed(2)}秒）`:''):`ベスト ${old.toFixed(2)}秒`}`;
  $('endP').innerHTML=`<table class="tb">${tbl}</table>🪙 +${earned}（拾った${P.got}＋順位${[10,6,4,2][rk-1]}）　手持ち ${SV.coins}`+
    (unlocked?`<div class="unl">新アイテム ${ITEMS[unlocked].ic} ${ITEMS[unlocked].n}<br><small>次からくじ玉に入る</small></div>`:rk>3?'<br><small>3位以内で新しいアイテムがくじ玉に入る</small>':'');
  const nxt=COURSES[cidx()+1];$('again').textContent=last?'グランプリの結果へ':`次のレース（${nxt.ic} ${nxt.n}）`;
  $('again').onclick=()=>{$('endSheet').hidden=true;if(last)cupResult();else{CUP.race++;newRace();}};
  $('endGar').onclick=()=>{openGarage();};
  $('endSheet').hidden=false;}
function cupResult(){delete SV.run;saveSV();const ord=[0,1,2,3].sort((a,b)=>CUP.pts[b]-CUP.pts[a]);const pl=ord.indexOf(0)+1;const tr=['🥇','🥈','🥉',''][pl-1];
  let opened=null;if(tr){SV.trophies.push(tr);SV.tro=SV.tro||{};SV.tro[CUP.cls]=SV.tro[CUP.cls]||[];SV.tro[CUP.cls].push(tr);if(CUP.cls<2&&(SV.clsOpen||1)<CUP.cls+2){SV.clsOpen=CUP.cls+2;opened=CLASSES[CUP.cls+1].n;}}SV.cups++;saveSV();sfx.cup();
  const names=['あなた',...(CUP.cup===1?[PERS[0],KURO,PERS[2]]:PERS).map(v=>v.nm)];
  $('cupT').textContent=(tr?`${tr} `:'')+`${CUPS[CUP.cup].n} ${CLASSES[CUP.cls].n} ${pl}位`+(tr?'！':'…');
  let extra='';if(tr&&!SV.cup2seen){SV.cup2seen=1;saveSV();extra+=`<div class="unl">🔓 ほしのカップ が走れるようになった<br><small>新しい4コース。最強のライバル「くろ」が待っている</small></div>`;}
  const kuroBeat=CUP.cup===1&&pl===1;if(kuroBeat&&!myCar().own.includes('body.kuro')){myCar().own.push('body.kuro');saveSV();extra+=`<div class="unl">くろ「…負けた。これを持っていけ」<br>新しいボディ「くろがね」を手に入れた<br><small>ガレージで付けられる</small></div>`;}
  $('cupOpen').innerHTML=(opened?`<div class="unl">🔓 ${opened} が走れるようになった<br><small>ライバルがもっと速い</small></div>`:'')+extra;
  $('cupP').innerHTML=ord.map((w,i)=>`${i+1}位　${names[w]}　${CUP.pts[w]}pt`).join('<br>')+`<br><br>各レース ${CUP.marks.map(m=>'①②③④'[m-1]).join('')}<br>トロフィー ${SV.trophies.join('')||'まだなし'}`;
  $('cupShare').onclick=()=>{const t=`アイテムボックス一本道 ${CUPS[CUP.cup].n} ${CLASSES[CUP.cls].n} ${tr||'4位'}\n${CUP.marks.map(m=>'①②③④'[m-1]).join('')} 合計${CUP.pts[0]}pt\n${location.href}`;navigator.clipboard&&navigator.clipboard.writeText(t);toast('コピーした');};
  $('cupSheet').hidden=false;}

// ===== ガレージ =====
function openGarage(){$('gcoins').textContent=SV.coins;renderCarUI();const L=$('glist');L.innerHTML='';
  for(const k in PARTS){const p=PARTS[k],l=lv(k),mx=p.cost.length,c=p.cost[l];const b=document.createElement('button');b.className='gp';
    b.innerHTML=`<b>${p.ic} ${p.n}　Lv${l}/${mx}<span>${l<mx?'🪙'+c:'最大'}</span></b>${p.d}`;b.disabled=l>=mx||SV.coins<c;
    b.onclick=()=>{SV.coins-=c;SV.parts[k]=l+1;saveSV();sfx.buy();openGarage();};L.appendChild(b);}
  $('gcolors').innerHTML='';COLORS.forEach((c,i)=>{const b=document.createElement('button');b.className='gc'+(SV.color===i?' on':'');const own=SV.colors.includes(i);
    b.innerHTML=`<i style="background:${c[0]}"></i>${own?c[1]:'🪙10'}`;b.disabled=!own&&SV.coins<10;
    b.onclick=()=>{if(!own){SV.coins-=10;SV.colors.push(i);sfx.buy();}SV.color=i;saveSV();openGarage();};$('gcolors').appendChild(b);});
  $('gitems').innerHTML=[...START,...UNLOCK].map(k=>{const h=SV.have.includes(k);return `<div class="it${h?'':' lock'}">${h?ITEMS[k].ic:'？'}<small>${h?ITEMS[k].n:'？？？'}</small></div>`;}).join('');
  $('garage').hidden=false;}

// ===== 描画 =====
function kart(x,y,col,o){g.save();g.translate(Math.round(x),Math.round(y));const sc=o.big?1.7:o.jump?1+Math.sin(o.jump/55*Math.PI)*.35:1;g.scale(sc,sc);if(o.spin)g.rotate(o.spin*.35);if(o.alpha)g.globalAlpha=o.alpha;
  g.fillStyle='rgba(0,0,0,.25)';g.fillRect(-11,-11,26,30);g.imageSmoothingEnabled=false;g.drawImage(o.cv,-20,-24,40,48);
  if(o.star){g.strokeStyle=`hsl(${t0*20%360},100%,60%)`;g.lineWidth=3;g.beginPath();g.arc(0,0,26,0,7);g.stroke();}
  if(o.shield){g.strokeStyle='rgba(120,200,255,.9)';g.lineWidth=3;g.beginPath();g.arc(0,0,24,0,7);g.stroke();}
  if(o.item)drawSp(g,emoSp(ITEMS[o.item].ic),0,-27,1.5);
  g.restore();}
function draw(){g.setTransform(DPR,0,0,DPR,0,0);if(shakeV>.3){g.translate((Math.random()-.5)*shakeV,(Math.random()-.5)*shakeV);shakeV*=.88;}const co=CO||COURSES[0];const pd=P?P.d:0,py=H*.72,sy=d=>py-(d-pd);
  g.fillStyle=co.grass[0];g.fillRect(0,0,W,H);const off=pd%80;for(let y=-80;y<H+80;y+=80){g.fillStyle=co.grass[1];g.fillRect(0,y+off,W,40);}
  if(co.n==='そらのみち'){g.fillStyle='#fff';for(let i=0;i<8;i++){const y=((i*170+pd*.6)%(H+60))-30;for(const sx of [(i*53)%Math.max(1,RL-30),W-RL+(i*37)%Math.max(1,RL-30)]){g.fillRect(sx,y,28,8);g.fillRect(sx+6,y-5,16,5);}}}
  else if(co.n==='よるのまち'){for(let i=0;i<10;i++){const y=((i*150+pd)%(H+150))-150;for(const side of [0,1]){const x=side?RL+RW+14:4,w=RL-18;g.fillStyle='#2a2a46';g.fillRect(x,y,w,120);g.fillStyle=i%2?'#ffd84a':'#3af0ff';for(let k=0;k<6;k++)if((i+k)%3)g.fillRect(x+6+(k%2)*(w/2-4),y+10+Math.floor(k/2)*34,6,8);}}}
  else for(let i=0;i<14;i++){const y=((i*137+pd)%(H+40))-20;g.fillStyle=co.deco[i%2];const s=co.n==='ゆきやま'||co.n==='さばく'?7:4;g.fillRect((i*71)%(RL-10)+2,y,4,s);g.fillRect(W-((i*53)%(RL-10))-6,y,4,s);}
  g.fillStyle=co.road;g.fillRect(RL,0,RW,H);
  if(co.n==='ゆきやま'){g.fillStyle='rgba(255,255,255,.18)';for(let i=0;i<20;i++){g.fillRect(RL+(i*47)%RW,((i*97+pd*1.0)%H),12,2);}}
  for(let y=-40;y<H+40;y+=40){const yy=y+(pd%40),a=((Math.floor((y+pd)/40))%2);g.fillStyle=co.curb[a];g.fillRect(RL-8,yy,8,20);g.fillRect(RL+RW,yy,8,20);g.fillStyle=co.curb[1-a];g.fillRect(RL-8,yy+20,8,20);g.fillRect(RL+RW,yy+20,8,20);}
  g.fillStyle='rgba(255,255,255,.5)';for(const lx of [RL+RW/3,RL+RW*2/3])for(let y=-60;y<H+60;y+=60)g.fillRect(lx-2,y+(pd%60),4,28);
  for(const d of [0,L]){const y=sy(d);if(y<-30||y>H+30)continue;for(let i=0;i<RW/12;i++)for(let j=0;j<2;j++){g.fillStyle=(i+j)%2?'#000':'#fff';g.fillRect(RL+i*12,y+j*12-12,12,12);}}
  if(!P)return;
  for(const o of OB){if(o.gone)continue;const y=sy(o.d);if(o.t==='wave'){const cl=(o.ph+Math.floor(t0/45))%3,y2=sy(o.d+o.len);if(y<-30||y2>H+30)continue;g.fillStyle='rgba(60,150,255,.75)';g.fillRect(laneX(cl)-RW/6+2,y2,RW/3-4,o.len);g.fillStyle='#fff';for(let k=0;k<5;k++)g.fillRect(laneX(cl)-22+(k*11+t0)%44,y2+k*(o.len/5),8,2);continue;}
    if(o.t==='belt'){const y2=sy(o.d+o.len);if(y<-30||y2>H+30)continue;const bx=laneX(o.lane);g.fillStyle=o.dir>0?'rgba(60,140,255,.6)':'rgba(230,60,40,.6)';g.fillRect(bx-RW/6+3,y2,RW/3-6,o.len);g.fillStyle='rgba(255,255,255,.7)';for(let q=0;q<o.len;q+=26){const yy=y2+((q+(o.dir>0?-1:1)*t0*2)%o.len+o.len)%o.len;g.fillRect(bx-10,yy,20,3);}continue;}
    if(o.t==='sand'){const y2=sy(o.d+o.len);if(y<-30||y2>H+30)continue;g.fillStyle='rgba(230,190,110,.85)';g.fillRect(laneX(o.lane)-RW/6+3,y2,RW/3-6,y-y2);g.fillStyle='rgba(180,140,70,.6)';for(let k=0;k<6;k++)g.fillRect(laneX(o.lane)-20+(k*13)%40,y2+k*(o.len/6),6,2);continue;}
    if(y<-30||y>H+30)continue;const x=laneX(o.lane);
    if(o.t==='belt'){g.fillStyle=o.dir>0?'rgba(60,140,255,.65)':'rgba(230,60,40,.65)';const yb=sy(o.d+o.len);g.fillRect(x-RW/6+3,yb,RW/3-6,o.len);continue;}
    if(o.t==='box')drawSp(g,'capsule',x,y+Math.sin(t0*.12+o.d)*2,2);
    if(o.t==='coin')drawSp(g,'coin',x,y,1.5,Math.max(.15,Math.abs(Math.cos(t0*.1+o.d))));
    if(o.t==='pad'){g.fillStyle='rgba(60,240,255,.3)';g.fillRect(x-RW/6+6,y-18,RW/3-12,36);for(let k=0;k<2;k++)drawSp(g,'chev',x,y+8-k*14-(t0%14)/2,2);}
    if(o.t==='rock')drawSp(g,'rock',x,y,2);
    if(o.t==='cone')drawSp(g,'cone',x,y,2);
    if(o.t==='oil')drawSp(g,'puddle',x,y,2);
    if(o.t==='ramp')drawSp(g,'ramp',x,y,2.5);
    if(o.t==='hole'){g.fillStyle='#000';g.fillRect(x-RW/6+4,y-22,RW/3-8,44);g.fillStyle='#8ad0f4';g.fillRect(x-RW/6+8,y-16,RW/3-16,32);g.fillStyle='#fff';g.fillRect(x-14,y-8,18,5);}
    if(o.t==='geyser'){const gg=gey(o);g.fillStyle=gg>=70&&gg<110&&t0%10<5?'#ff5a1a':'#5a1a0e';g.fillRect(x-20,y-12,40,24);g.fillStyle='#000';g.fillRect(x-14,y-7,28,14);if(gg>=110){drawSp(g,'flame',x,y-18,3+Math.sin(t0*.6)*.4);}}}
  if(GH&&state!=='end'){const i=Math.floor(t0/4)*2;if(i<GH.length){g.globalAlpha=.45;kart(GH[i+1],sy(GH[i]),COLORS[SV.color][0],{cv:makeCar(COLORS[SV.color][0],'#fff8e8',myCar())});g.globalAlpha=1;}}
  for(const p of PJ)drawSp(g,p.t==='homing'?'target':'bomb',p.x,sy(p.d),2);
  for(const v of RV){const y=sy(v.d);if(y>-40&&y<H+40){kart(v.x,y,v.col,{cv:makeCar(v.col,'#fff8e8',v.car),spin:v.spin,jump:v.jump,shield:v.shield,item:v.item});if(v.say)drawSay(v.x,y,v.say.s);}}
  if(P.slip>15){g.strokeStyle=`rgba(255,255,255,${Math.min(.8,P.slip/70)})`;g.lineWidth=2;for(let i=0;i<4;i++){const xx=P.x-14+i*9+(Math.random()-.5)*3;g.beginPath();g.moveTo(xx,py-40-Math.random()*20);g.lineTo(xx,py-10);g.stroke();}}
  if(P.boost>0)for(let i=0;i<5;i++){g.fillStyle='rgba(255,220,120,.7)';g.fillRect(P.x-10+Math.random()*20,py+20+Math.random()*30,2,14);}
  kart(P.x,py,COLORS[SV.color][0],{cv:makeCar(COLORS[SV.color][0],SV.color===4?'#e8402c':'#fff8e8',myCar()),spin:P.spin,big:P.giant>0,jump:P.jump,star:P.star>0,shield:P.shield,alpha:P.ghost?.4:0,helm:SV.color===4?'#e8402c':'#fff'});
  g.fillStyle='#ffd84a';g.beginPath();g.moveTo(P.x,py-34);g.lineTo(P.x-6,py-42);g.lineTo(P.x+6,py-42);g.fill();
  for(const f of fx){f.x+=f.vx;f.d+=f.vd;f.l--;g.fillStyle=f.c;g.globalAlpha=f.l/25;g.fillRect(f.x,sy(f.d),4,4);g.globalAlpha=1;}fx=fx.filter(f=>f.l>0);
  if(co.gim.includes('dark')){const gr=g.createRadialGradient(P.x,py-60,40,P.x,py-60,Math.max(W,H)*.55);gr.addColorStop(0,'rgba(0,0,10,0)');gr.addColorStop(1,'rgba(0,0,10,.86)');g.fillStyle=gr;g.fillRect(0,0,W,H);}
  if(P.warn&&t0%10<6)drawSp(g,'warn',P.warn.x,H-28,2.5);
  drawConfetti();
  if(state==='count'){drawLights();g.fillStyle='#fff';g.strokeStyle='#000';g.textAlign='center';g.textBaseline='middle';
    g.font='26px DotGothic16';g.lineWidth=4;const s=`${co.n}`+(co.tip?'　'+co.tip:'');g.strokeText(s,W/2,H*.55);g.fillText(s,W/2,H*.55);drawSp(g,emoSp(co.ic),W/2,H*.55-40,2.5);}
  if(flash>0){g.fillStyle=`rgba(255,255,200,${flash/14})`;g.fillRect(0,0,W,H);flash--;}}
let acc=0,lt=0;function frame(t){const dt=Math.min(100,t-(lt||t));lt=t;acc+=dt;while(acc>=16.67){update();acc-=16.67;}draw();requestAnimationFrame(frame);}
function terrain(k){let f=1;for(const o of OB){if(o.t==='belt'&&near(k.x,k.d,o,o.len))f*=o.dir>0?1.35:.7;if(o.t==='wave'&&k.d>o.d&&k.d<o.d+o.len&&Math.abs(k.x-laneX((o.ph+Math.floor(t0/45))%3))<30)f*=k===P&&P.sp.snow?.8:.6;}return k===P&&P.star&&f<1?1:f;}
const gey=o=>(t0+o.ph)%150;
function finishTA(){state='end';if(engG)engG.gain.value=0;bgmStop();const ci=cidx(),tm=P.fin/60;SV.rec=SV.rec||{};const k='ta-'+ci,old=SV.rec[k],nr=!old||tm<old;if(nr){SV.rec[k]=tm;SV.ghost=SV.ghost||{};SV.ghost[ci]=P.track;}SV.coins+=Math.min(P.got,8);saveSV();
  $('endT').textContent=`${CO.ic} ${CO.n}`;$('endRec').innerHTML=`タイム ${tm.toFixed(2)}秒　${nr?'<b>🎉 自己ベスト！</b>'+(old?`（前 ${old.toFixed(2)}秒）`:''):`ベスト ${old.toFixed(2)}秒（差 +${(tm-old).toFixed(2)}）`}`;
  $('endP').innerHTML=`半透明の車は、自己ベストの走りです<br>🪙 +${Math.min(P.got,8)}`;$('again').textContent='もう一度走る';$('again').onclick=()=>{$('endSheet').hidden=true;newTA(ci);};$('endGar').onclick=()=>openGarage();$('endTitle').hidden=false;$('endTitle').onclick=()=>{$('endSheet').hidden=true;$('endTitle').hidden=true;$('title').hidden=false;titleInfo();};$('endSheet').hidden=false;}
function openTA(){const b=$('taList');b.innerHTML='';COURSES.forEach((c,i)=>{const open=i<4||cupOpen(),rec=SV.rec&&SV.rec['ta-'+i],e=document.createElement('button');e.className='gp';e.disabled=!open;e.innerHTML=`<b>${open?c.ic:'🔒'} ${open?c.n:'？？？'}<span>${rec?rec.toFixed(2)+'秒':''}</span></b>${open?(c.tip||'基本のコース'):'トロフィーを取ると走れる'}`;e.onclick=()=>{$('taSheet').hidden=true;$('title').hidden=true;ac();newTA(i);};b.appendChild(e);});$('taSheet').hidden=false;}
function titleInfo(){renderResume();const co=cupOpen();$('cups').innerHTML=CUPS.map((c,i)=>`<button class="clb${(SV.cupSel||0)===i&&(co||!i)?' on':''}" ${i&&!co?'disabled':''} data-c="${i}">${i&&!co?'🔒':c.ic}${c.n}</button>`).join('');$('cups').querySelectorAll('button').forEach(b=>b.onclick=()=>{SV.cupSel=+b.dataset.c;saveSV();titleInfo();});$('tinfo').innerHTML=`🪙 ${SV.coins}　トロフィー ${SV.trophies.slice(-8).join('')||'まだなし'}`;const o=SV.clsOpen||1;
  $('cls').innerHTML=CLASSES.map((c,i)=>`<button class="clb${(SV.clsSel||0)===i?' on':''}" ${i>=o?'disabled':''} data-i="${i}">${i>=o?'🔒':''}${c.n}<small>${(SV.tro&&SV.tro[i]||[]).slice(-3).join('')}</small></button>`).join('');
  $('cls').querySelectorAll('button').forEach(b=>b.onclick=()=>{SV.clsSel=+b.dataset.i;saveSV();titleInfo();});}
function renderResume(){const r=SV.run,b=$('resume');b.hidden=!r;if(r){const c=COURSES[r.cup*4+r.race];b.innerHTML=r.showResult?'つづきから（グランプリの結果へ）':`つづきから（${c.ic} ${c.n} ${r.race+1}/4）`;}$('start').textContent=r?'グランプリを最初から':'グランプリ スタート';}
$('resume').onclick=()=>{ac();$('title').hidden=true;const r=SV.run;CUP=JSON.parse(JSON.stringify(r));if(r.showResult){delete CUP.showResult;cupResult();}else newRace();};
$('start').onclick=()=>{if(SV.run&&!confirm('今のグランプリは消えます。よろしいですか？'))return;delete SV.run;ac();$('title').hidden=true;newCup();};
$('bgmBtn').textContent=BGM.on?'🔊':'🔇';$('bgmBtn').onclick=bgmToggle;$('taBtn').onclick=()=>{ac();openTA();};$('taClose').onclick=()=>{$('taSheet').hidden=true;};
$('gBtn').onclick=()=>{ac();openGarage();};$('gClose').onclick=()=>{$('garage').hidden=true;titleInfo();};
$('cupAgain').onclick=()=>{$('cupSheet').hidden=true;$('title').hidden=false;titleInfo();};
$('cupGarage').onclick=()=>{openGarage();};
$('cardBtn').onclick=openCarCard;$('cardClose').onclick=()=>{$('cardSheet').hidden=true;};$('cardDl').onclick=()=>{const a=document.createElement('a');a.download='車検証.png';a.href=$('cardImg').src;a.click();};
window.addEventListener('resize',resize);resize();titleInfo();requestAnimationFrame(frame);
