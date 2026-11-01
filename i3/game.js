'use strict';
const $=id=>document.getElementById(id);
// ===== 音 =====
let AC; const ac=()=>AC||(AC=new (window.AudioContext||window.webkitAudioContext)());
function tone(f,d,type='sine',v=.08,when=0,slide=0){const a=ac(),o=a.createOscillator(),gn=a.createGain(),t=a.currentTime+when;o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide),t+d);gn.gain.setValueAtTime(v,t);gn.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(gn).connect(a.destination);o.start(t);o.stop(t+d+.02);}
let orbP=0,orbT=0;
const sfx={pop(){tone(520,.12,'triangle',.1,0,300);tone(90,.1,'square',.04);},
  ouch(){tone(200,.2,'sawtooth',.05,0,-120);},
  orb(){const n=performance.now();orbP=n-orbT<400?Math.min(orbP+1,12):0;orbT=n;tone(880*Math.pow(2,orbP/12),.07,'sine',.06);},
  grow(){[0,4,7,11,12].forEach((s,i)=>tone(440*Math.pow(2,s/12),.22,'triangle',.08,i*.07));},
  evo(){[0,4,7,12,16,19,24,28].forEach((s,i)=>tone(330*Math.pow(2,s/12),.3,'square',.05,i*.08));tone(1318,1,'triangle',.06,.7);},
  boss(){tone(110,.6,'sawtooth',.07,0,-40);tone(82,.8,'square',.05,.3);},
  zap(){tone(1400,.08,'sawtooth',.03,0,-900);},
  dash(){tone(200,.25,'sawtooth',.04,0,500);},
  shot(){tone(600,.06,'square',.02,0,-300);},
  end(){[0,7,12,16,19,24].forEach((s,i)=>tone(392*Math.pow(2,s/12),.3,'triangle',.07,i*.1));}};

// ===== 保存（図鑑・家系） =====
const DEX=JSON.parse(localStorage.getItem('sodatsu_dex')||'{}');const saveDex=()=>localStorage.setItem('sodatsu_dex',JSON.stringify(DEX));
let PARENT=JSON.parse(localStorage.getItem('sodatsu_parent')||'null');

// ===== ゲーム =====
const cv=$('cv'),g=cv.getContext('2d');let W=0,H=0,DPR=1,Z=1;
function resize(){DPR=window.devicePixelRatio||1;const cw=cv.clientWidth,ch=cv.clientHeight;Z=Math.max(1.2,Math.min(1.8,cw/270));W=cw/Z;H=ch/Z;cv.width=cw*DPR;cv.height=ch*DPR;}
let C,G,run=false,paused=true,ptr=null,last=0;
function startStage(){G={t:30,en:[],orbs:[],pt:[],bul:[],beams:[],spawn:0,need:G&&G.need||4+C.lvl*2,xp:G&&G.xp||0,shake:0,hurt:0,cd:0,dashT:2500,dash:0,beamT:900,boss:false,wander:{x:W/2,y:H/2}};
  if(C.segs[0].x==null){C.segs.forEach((s,i)=>{s.x=W/2-i*20;s.y=H/2;});C.dir=0;}
  paused=false;$('stage').textContent=C.stage;foot();}
const EN={
  blob:{r:()=>10+rint(4),hp:s=>1+Math.floor(s/3),sp:1,hue:()=>270+rint(60)},
  fast:{r:()=>7,hp:()=>1,sp:1.9,hue:()=>25+rint(20)},
  shooter:{r:()=>11,hp:s=>2+Math.floor(s/3),sp:.8,hue:()=>195+rint(25)},
  tank:{r:()=>20,hp:s=>5+s*2,sp:.5,hue:()=>350+rint(15)},
  boss:{r:()=>32,hp:s=>18+s*12,sp:.55,hue:()=>300},
};
function spawnEnemy(type){const side=rint(4),m=40;const x=side===0?-m:side===1?W+m:Math.random()*W,y=side===2?-m:side===3?H+m:Math.random()*H;
  if(!type){const s=C.stage,r=Math.random();type=s>=2&&r<.22?'fast':s>=2&&r<.38?'shooter':s>=3&&r<.5?'tank':'blob';}
  const T=EN[type],hk=1+Math.max(0,C.stage-3)*.6;G.en.push({type,x,y,r:T.r(),hp:T.hp(C.stage)*hk,sp:T.sp*(.7+Math.random()*.4)*(C.stage===1?.85:1+C.stage*.1),hue:T.hue(),cd:0,wob:Math.random()*6,fire:1200+rint(800)});}
function weapons(){const out=[];const h=C.segs[0];const dashK=G.dash>0?2.5:1;
  h.parts.forEach(p=>{if(p.k==='horn'&&p._x!=null)out.push({x:p._x,y:p._y,r:5+p.len*.18,d:(1+p.len/18)*dashK});});
  if(hasT(C,'big'))out.push({x:h.x,y:h.y,r:h.r+3,d:2});
  C.segs.forEach((s,i)=>{const sp=s.parts.find(p=>p.k==='spike');
    if(sp)out.push({x:s.x,y:s.y,r:s.r+8,d:.5+sp.n*.2});else if(hasT(C,'spike'))out.push({x:s.x,y:s.y,r:s.r+7,d:1});
    else if(hasT(C,'seg')&&i)out.push({x:s.x,y:s.y,r:s.r+2,d:.5,push:1});
    s.parts.forEach(p=>{
      if(p.k==='arm'){const big=hasT(C,'arm');for(const side of [-1,1]){const a=s.ang+side*1.45;const L=s.r+p.len+(big?8:0);out.push({x:s.x+Math.cos(a)*L,y:s.y+Math.sin(a)*L,r:big?12:8,d:big?3:1.5});}}
      if(p.k==='club'&&p._x!=null)out.push({x:p._x,y:p._y,r:p.sz+4,d:1.5+p.sz/8+(hasT(C,'club')?1.5:0)});});});
  return out;}
const armored=s=>hasT(C,'spike')||s.parts.some(p=>p.k==='spike');
function hurtMe(){if(G.cd>0)return false;C.hp--;G.cd=hasT(C,'wing')?1800:C.stage===1?1300:900;G.hurt=8;G.shake=6;sfx.ouch();return true;}
function kill(e){e.dead=true;C.kills++;sfx.pop();burst(e.x,e.y,`hsl(${e.hue},60%,55%)`,e.type==='boss'?40:14);
  const n=e.type==='boss'?10:e.type==='tank'?3:1;for(let k=0;k<n;k++)G.orbs.push({x:e.x+(Math.random()-.5)*e.r,y:e.y+(Math.random()-.5)*e.r});
  if(e.type==='boss'){G.bossDead=true;G.shake=12;setTimeout(()=>{if(!paused&&run)grow(true);else G.rarePending=true;},700);}}
function update(dt){if(paused)return;
  G.t-=dt/1000;if(G.t<=0){G.t=0;return endStage(false);}
  if(G.t<=10&&!G.boss){G.boss=true;spawnEnemy('boss');sfx.boss();toast('ぬしが来た！');}
  if(G.rarePending){G.rarePending=false;return grow(true);}
  // 移動
  const h=C.segs[0];let tg=ptr;if(!tg){if(Math.hypot(G.wander.x-h.x,G.wander.y-h.y)<30)G.wander={x:40+Math.random()*(W-80),y:40+Math.random()*(H-80)};tg=G.wander;}
  const ta=Math.atan2(tg.y-h.y,tg.x-h.x);let da=ta-C.dir;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;C.dir+=da*(G.dash>0?.05:.14);
  if(hasT(C,'horn')){G.dashT-=dt;if(G.dashT<=0){G.dashT=2500;G.dash=380;sfx.dash();}}if(G.dash>0)G.dash-=dt;
  const dist=Math.hypot(tg.x-h.x,tg.y-h.y);const sp=C.speed*(G.dash>0?3:Math.min(1,dist/40)*(ptr?1:.6));
  h.x+=Math.cos(C.dir)*sp;h.y+=Math.sin(C.dir)*sp;h.x=Math.max(h.r,Math.min(W-h.r,h.x));h.y=Math.max(h.r,Math.min(H-h.r,h.y));h.ang=C.dir;follow(C);
  if(G.dash>0)G.pt.push({x:C.segs[C.segs.length-1].x,y:C.segs[C.segs.length-1].y,vx:0,vy:0,c:'rgba(255,211,74,.8)',l:12});
  // 怪光線
  if(hasT(C,'eye')){G.beamT-=dt;if(G.beamT<=0){G.beamT=900;let best=null,bd=170;for(const e of G.en){const d=Math.hypot(e.x-h.x,e.y-h.y);if(d<bd){bd=d;best=e;}}
    if(best){G.beams.push({x1:h.x,y1:h.y,x2:best.x,y2:best.y,l:10});sfx.zap();best.hp-=1;burst(best.x,best.y,'#ff5040',5);if(best.hp<=0&&!best.dead)kill(best);}}}
  // 敵
  G.spawn-=dt;if(G.spawn<=0){spawnEnemy();if(C.stage>=4&&Math.random()<.15*(C.stage-3))spawnEnemy();G.spawn=(C.stage===1?1250:Math.max(260,1000-C.stage*120))*(0.7+Math.random()*.6);}
  const ws=weapons();
  for(const e of G.en){if(e.dead)continue;const a=Math.atan2(h.y-e.y,h.x-e.x),d=Math.hypot(h.y-e.y,h.x-e.x);
    if(e.type==='shooter'){const dir=d<110?-1:d>150?1:0;e.x+=Math.cos(a)*e.sp*dir;e.y+=Math.sin(a)*e.sp*dir;e.fire-=dt;
      if(e.fire<=0&&e.x>0&&e.x<W&&e.y>0&&e.y<H){e.fire=1700;G.bul.push({x:e.x,y:e.y,vx:Math.cos(a)*2.1,vy:Math.sin(a)*2.1});sfx.shot();}}
    else{e.x+=Math.cos(a)*e.sp;e.y+=Math.sin(a)*e.sp;}
    e.cd=Math.max(0,e.cd-dt);
    for(const w of ws){if(e.cd>0)break;if(Math.hypot(w.x-e.x,w.y-e.y)<w.r+e.r){e.hp-=w.d;e.cd=250;const kb=e.type==='boss'?4:w.push?30:14;e.x-=Math.cos(a)*kb;e.y-=Math.sin(a)*kb;burst(e.x,e.y,'#fff',5);G.shake=2;
      if(e.hp<=0)kill(e);else tone(300,.05,'square',.04);}}
    if(!e.dead&&e.cd<=0)for(const s of C.segs){if(armored(s))continue;
      if(Math.hypot(s.x-e.x,s.y-e.y)<s.r+e.r-2){hurtMe();e.cd=400;e.x-=Math.cos(a)*24;e.y-=Math.sin(a)*24;break;}}}
  G.en=G.en.filter(e=>!e.dead&&e.x>-200&&e.x<W+200&&e.y>-200&&e.y<H+200);
  // 弾
  for(const b of G.bul){b.x+=b.vx;b.y+=b.vy;if(b.x<-20||b.x>W+20||b.y<-20||b.y>H+20){b.gone=true;continue;}
    for(const w of ws)if(Math.hypot(w.x-b.x,w.y-b.y)<w.r+4){b.gone=true;burst(b.x,b.y,'#ffe',3);break;}
    if(!b.gone)for(const s of C.segs)if(Math.hypot(s.x-b.x,s.y-b.y)<s.r+3){b.gone=true;if(!armored(s))hurtMe();break;}}
  G.bul=G.bul.filter(b=>!b.gone);
  G.cd-=dt;if(G.hurt>0)G.hurt--;
  if(C.hp<=0)return endStage(true);
  // 光の粒
  for(const o of G.orbs){const d=Math.hypot(h.x-o.x,h.y-o.y);if(d<C.magnet){o.x+=(h.x-o.x)/d*4;o.y+=(h.y-o.y)/d*4;}
    let got=d<h.r+8;if(!got)for(const s of C.segs)if(Math.hypot(s.x-o.x,s.y-o.y)<s.r+6){got=true;break;}
    if(got){o.got=true;G.xp++;sfx.orb();}}
  G.orbs=G.orbs.filter(o=>!o.got);
  if(G.xp>=G.need){G.xp=0;C.lvl++;G.need=4+C.lvl*2;grow(false);}
  hud();}
function burst(x,y,c,n){for(let i=0;i<n;i++)G.pt.push({x,y,vx:(Math.random()-.5)*5,vy:(Math.random()-.5)*5,c,l:20+rint(15)});}
function drawEnemy(e,t){const wb=Math.sin(t*.008+e.wob)*1.5;const h=C.segs[0];const a=Math.atan2(h.y-e.y,h.x-e.x);
  g.fillStyle=`hsl(${e.hue},${e.type==='fast'?60:35}%,${e.type==='tank'||e.type==='boss'?30:42}%)`;g.strokeStyle=INK;g.lineWidth=e.type==='boss'?3.5:2.5;
  if(e.type==='tank'){g.beginPath();for(let k=0;k<12;k++){const b=k/12*6.283,rr=e.r+(k%2?4:0);g.lineTo(e.x+Math.cos(b)*rr,e.y+Math.sin(b)*rr);}g.closePath();g.fill();g.stroke();}
  else if(e.type==='fast'){g.beginPath();g.moveTo(e.x+Math.cos(a)*e.r*1.5,e.y+Math.sin(a)*e.r*1.5);g.lineTo(e.x+Math.cos(a+2.4)*e.r,e.y+Math.sin(a+2.4)*e.r);g.lineTo(e.x+Math.cos(a-2.4)*e.r,e.y+Math.sin(a-2.4)*e.r);g.closePath();g.fill();g.stroke();}
  else{g.beginPath();g.ellipse(e.x,e.y,e.r+wb,e.r-wb,0,0,7);g.fill();g.stroke();}
  if(e.type==='shooter'){g.fillStyle=INK;g.beginPath();g.arc(e.x+Math.cos(a)*e.r*.55,e.y+Math.sin(a)*e.r*.55,e.r*.3,0,7);g.fill();}
  else{g.fillStyle='#ffe';for(const sd of [-1,1]){g.beginPath();g.arc(e.x+Math.cos(a+sd*.6)*e.r*.45,e.y+Math.sin(a+sd*.6)*e.r*.45,e.r*.2,0,7);g.fill();}}
  if(e.type==='boss'){g.fillStyle='#ffd34a';g.strokeStyle=INK;g.lineWidth=2.5;const cy=e.y-e.r-2;g.beginPath();g.moveTo(e.x-16,cy+6);g.lineTo(e.x-16,cy-8);g.lineTo(e.x-8,cy-1);g.lineTo(e.x,cy-12);g.lineTo(e.x+8,cy-1);g.lineTo(e.x+16,cy-8);g.lineTo(e.x+16,cy+6);g.closePath();g.fill();g.stroke();
    const mx=EN.boss.hp(C.stage)*(1+Math.max(0,C.stage-3)*.6);g.fillStyle='#000';g.fillRect(e.x-24,e.y+e.r+6,48,5);g.fillStyle='#d8443a';g.fillRect(e.x-24,e.y+e.r+6,48*Math.max(0,e.hp)/mx,5);}}
function draw(t){g.setTransform(DPR*Z,0,0,DPR*Z,0,0);g.clearRect(0,0,W,H);
  const sx=G&&G.shake?(Math.random()-.5)*G.shake:0;if(G)G.shake*=.85;g.save();g.translate(sx,0);
  g.fillStyle='#e6dcc2';for(let x=10;x<W;x+=34)for(let y=10;y<H;y+=34){g.beginPath();g.arc(x+(y%68?17:0),y,1.6,0,7);g.fill();}
  if(G){for(const o of G.orbs){g.fillStyle='#f2a53a';g.strokeStyle=INK;g.lineWidth=2;g.beginPath();g.arc(o.x,o.y,4.5+Math.sin(t*.01+o.x)*1,0,7);g.fill();g.stroke();}
    for(const e of G.en)drawEnemy(e,t);
    for(const b of G.bul){g.fillStyle='#e8443a';g.strokeStyle=INK;g.lineWidth=1.5;g.beginPath();g.arc(b.x,b.y,4,0,7);g.fill();g.stroke();}
    for(const p of G.pt){p.x+=p.vx;p.y+=p.vy;p.vx*=.92;p.vy*=.92;p.l--;g.fillStyle=p.c;g.globalAlpha=Math.min(1,p.l/10);g.beginPath();g.arc(p.x,p.y,2.5,0,7);g.fill();g.globalAlpha=1;}
    G.pt=G.pt.filter(p=>p.l>0);
    for(const b of G.beams){b.l--;g.strokeStyle=`rgba(255,70,50,${b.l/10})`;g.lineWidth=4;g.beginPath();g.moveTo(b.x1,b.y1);g.lineTo(b.x2,b.y2);g.stroke();}G.beams=G.beams.filter(b=>b.l>0);}
  if(C&&C.segs[0].x!=null)drawCreature(g,C,t/16,G&&G.hurt>0&&G.hurt%2);
  if(ptr&&!paused){g.strokeStyle='rgba(58,50,38,.3)';g.lineWidth=2;g.beginPath();g.arc(ptr.x,ptr.y,10,0,7);g.stroke();}
  g.restore();}
function hud(){$('time').textContent=Math.ceil(G.t);$('kills').textContent=C.kills;$('xp').style.width=(G.xp/G.need*100)+'%';$('hp').style.width=(C.hp/C.maxhp*100)+'%';}
function foot(){$('foot').innerHTML=C.traits.length?'形質 '+C.traits.map(k=>`<b>${TRAIT[k].ic}${TRAIT[k].n}</b>`).join(' '):'指でなぞった方へ進む。武器（ツノ・トゲ・ツメ…）でぶつかると倒せる。<br>同じ部位を3回選ぶと<b>進化</b>する。';}
function frame(t){const dt=Math.min(50,t-(last||t));last=t;if(run)update(dt);draw(t);requestAnimationFrame(frame);}
function toast(s){const e=document.createElement('div');e.className='toast';e.textContent=s;$('app').appendChild(e);setTimeout(()=>e.remove(),1200);}

// ===== 成長・進化 =====
function grow(rare){paused=true;ptr=null;sfx.grow();const os=options(C,rare);const box=$('opts');box.innerHTML='';
  $('growT').textContent=rare?'ぬしを倒した！':'そだつ！';$('growP').textContent=rare?'★ 効果2倍のレア成長（3つから選ぶ）':'どっちに育てる？';box.className='opts'+(rare?' three':'');
  os.forEach(o=>{const b=document.createElement('button');b.className='opt'+(o.evo?' evo':o.near?' near':'');const c=document.createElement('canvas');c.width=360;c.height=360;b.appendChild(c);
    b.insertAdjacentHTML('beforeend',`<b>${o.label}</b><small>${o.evo?`<em>進化！【${TRAIT[o.evo].n}】</em>`:o.prog}</small>`);portrait(c,o.c);
    b.onclick=()=>{const before=clone(C);const keep=C.segs.map(s=>({x:s.x,y:s.y,ang:s.ang}));const dir=C.dir;C=o.c;C.dir=dir;
      C.segs.forEach((s,i)=>{const k=keep[Math.min(i,keep.length-1)];s.x=k.x-(i>=keep.length?5:0);s.y=k.y;s.ang=k.ang;});follow(C);
      $('growSheet').hidden=true;if(o.evo)return evolve(before,o.evo);paused=false;last=0;hud();foot();};box.appendChild(b);});
  $('growSheet').hidden=false;}
function evolve(before,k){sfx.evo();const first=!DEX[k];DEX[k]=DEX[k]||{at:Date.now(),by:cname(C)};saveDex();
  portrait($('evoA'),before);portrait($('evoB'),C);$('evoT').textContent=`【${TRAIT[k].n}】`;$('evoD').innerHTML=`${TRAIT[k].ic} ${TRAIT[k].d}<br><b style="font-size:20px">${cname(C)}</b> になった`+(first?'<br><span style="color:#c86a2a">図鑑に新しく載った！</span>':'');
  $('evoSheet').hidden=false;}
$('evoOk').onclick=()=>{$('evoSheet').hidden=true;paused=false;last=0;hud();foot();};

// ===== 形態の完成・カード =====
function topKind(c){return Object.keys(c.cnt).sort((a,b)=>c.cnt[b]-c.cnt[a])[0]||'horn';}
function drawCard(cv,c,dead){const x=cv.getContext('2d'),Wc=cv.width,Hc=cv.height;
  x.fillStyle=`hsl(${c.hue},35%,92%)`;x.fillRect(0,0,Wc,Hc);x.strokeStyle=INK;x.lineWidth=10;x.strokeRect(14,14,Wc-28,Hc-28);
  const pc=document.createElement('canvas');pc.width=pc.height=520;portrait(pc,c);x.drawImage(pc,40,40,Wc-80,Wc-80);x.lineWidth=4;x.strokeRect(40,40,Wc-80,Wc-80);
  x.fillStyle=INK;x.textAlign='center';x.font='800 46px "M PLUS Rounded 1c"';x.fillText(cname(c),Wc/2,Wc+18);
  x.font='500 24px "M PLUS Rounded 1c"';x.fillText(c.traits.length?c.traits.map(k=>TRAIT[k].ic+TRAIT[k].n).join('　'):'形質なし',Wc/2,Wc+62);
  x.fillStyle='#7a6e56';x.font='500 20px "M PLUS Rounded 1c"';x.fillText(`第${c.stage}形態${dead?'（力尽きた）':''} ・ 体${c.segs.length}節 ・ 倒した${c.kills}${c.parent?` ・ 親 ${c.parent}`:''}`,Wc/2,Wc+98);
  x.fillText('勝手に育つ1匹　kiichi10.github.io/game-prototypes/i3/',Wc/2,Hc-34);}
function endStage(dead){paused=true;ptr=null;sfx.end();
  $('formT').textContent=dead?`力尽きた… 第${C.stage}形態`:`第${C.stage}形態 完成！`;
  document.fonts.load('800 40px "M PLUS Rounded 1c"').then(()=>drawCard($('portrait'),C,dead));drawCard($('portrait'),C,dead);
  $('formP').innerHTML=`育った回数 ${C.lvl} ・ 形質 ${C.traits.length}/8`+(dead?'':`<br><span style="font-size:12px;color:#8a7e66">体力 ${C.hp}/${C.maxhp}（次の形態へ進むと半分回復）</span>`);
  $('cont').hidden=dead;saveGal();PARENT={name:cname(C),hue:C.hue,top:topKind(C)};localStorage.setItem('sodatsu_parent',JSON.stringify(PARENT));$('formSheet').hidden=false;}
function saveGal(){try{const L=JSON.parse(localStorage.getItem('sodatsu_gal')||'[]');const c=document.createElement('canvas');c.width=c.height=160;portrait(c,C);
  const item={id:C.id,img:c.toDataURL('image/png'),name:cname(C)};const i=L.findIndex(x=>x.id===C.id);if(i>=0)L[i]=item;else L.unshift(item);localStorage.setItem('sodatsu_gal',JSON.stringify(L.slice(0,12)));}catch(e){}}
function showTitle(){const L=JSON.parse(localStorage.getItem('sodatsu_gal')||'[]');$('galWrap').hidden=!L.length;$('gal').innerHTML=L.map(x=>`<img src="${x.img}" title="${x.name}">`).join('');
  $('dex').innerHTML=Object.keys(TRAIT).map(k=>DEX[k]?`<div class="dx on">${TRAIT[k].ic}<small>${TRAIT[k].n}</small></div>`:`<div class="dx">？<small>${KN[k]}×3</small></div>`).join('');
  $('dexN').textContent=Object.keys(DEX).length;
  $('parentLine').innerHTML=PARENT?`前の子 <b>${PARENT.name}</b> の「${KN[PARENT.top]}」を受けつぐ卵`:'';egg();}
function egg(){const c=$('egg'),e=c.getContext('2d');e.clearRect(0,0,400,400);const hue=PARENT?PARENT.hue:Math.floor(Math.random()*360);e.fillStyle=`hsl(${hue},50%,85%)`;e.strokeStyle=INK;e.lineWidth=8;e.beginPath();e.ellipse(200,215,110,140,0,0,7);e.fill();e.stroke();
  e.fillStyle=`hsl(${hue},45%,62%)`;for(let i=0;i<7;i++){e.beginPath();e.arc(130+Math.random()*140,130+Math.random()*170,10+Math.random()*16,0,7);e.fill();}}
function newGame(){C=newCreature(PARENT);C.stage=1;C.id=Date.now();G=null;resize();startStage();run=true;hud();}

cv.addEventListener('pointerdown',e=>{const r=cv.getBoundingClientRect();ptr={x:(e.clientX-r.left)/Z,y:(e.clientY-r.top)/Z};});
cv.addEventListener('pointermove',e=>{if(!ptr)return;const r=cv.getBoundingClientRect();ptr={x:(e.clientX-r.left)/Z,y:(e.clientY-r.top)/Z};});
window.addEventListener('pointerup',()=>{ptr=null;});
$('start').onclick=()=>{ac();$('title').hidden=true;newGame();};
$('cont').onclick=()=>{$('formSheet').hidden=true;C.stage++;C.hp=Math.min(C.maxhp,C.hp+Math.ceil(C.maxhp/2));startStage();last=0;};
$('newEgg').onclick=()=>{$('formSheet').hidden=true;$('title').hidden=false;run=false;showTitle();};
$('savePng').onclick=()=>{const a=document.createElement('a');a.download=cname(C)+'.png';a.href=$('portrait').toDataURL('image/png');a.click();};
window.addEventListener('resize',resize);
resize();showTitle();requestAnimationFrame(frame);
