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
  end(){[0,7,12,16,19,24].forEach((s,i)=>tone(392*Math.pow(2,s/12),.3,'triangle',.07,i*.1));}};

// ===== 生き物 =====
const BONE='#f7ecd0', INK='#3a3226';
function newCreature(){const hue=Math.floor(Math.random()*360);
  const c={hue,segs:[],hp:10,maxhp:10,speed:2.3,magnet:50,lvl:0,kills:0,hist:[]};
  c.segs.push({r:17,parts:[{k:'horn',len:12}]});c.segs.push({r:14,parts:[]});c.segs.push({r:11,parts:[]});
  return c;}
const clone=o=>JSON.parse(JSON.stringify(o));
const rint=n=>Math.floor(Math.random()*n);
function partCount(c,k){return c.segs.reduce((a,s)=>a+s.parts.filter(p=>p.k===k).length,0);}
const GROW={
  horn:{ok:c=>true,ap(c){const h=c.segs[0].parts.find(p=>p.k==='horn');h.len+=9;return '角がのびる';}},
  spike:{ok:c=>c.segs.length>1,ap(c){const i=1+rint(c.segs.length-1);const s=c.segs[i];const p=s.parts.find(p=>p.k==='spike');if(p)p.n++;else s.parts.push({k:'spike',n:3+rint(3)});return `${i+1}節目にトゲ`;}},
  seg:{ok:c=>c.segs.length<12,ap(c){const l=c.segs[c.segs.length-1];c.segs.push({r:Math.max(7,l.r*(.85+Math.random()*.2)),parts:[]});c.maxhp+=3;c.hp+=3;return '体が1節のびる';}},
  wing:{ok:c=>partCount(c,'wing')<3,ap(c){const i=Math.min(c.segs.length-1,1+rint(2));c.segs[i].parts.push({k:'wing',sz:16+rint(10)});c.speed+=.5;return '羽が生える（速い）';}},
  arm:{ok:c=>c.segs.length>1,ap(c){const i=1+rint(c.segs.length-1);c.segs[i].parts.push({k:'arm',len:14+rint(8)});return `${i+1}節目にツメ`;}},
  club:{ok:c=>true,ap(c){const l=c.segs[c.segs.length-1];const p=l.parts.find(p=>p.k==='club');if(p){p.sz+=4;return '尻尾のコブが大きく';}l.parts.push({k:'club',sz:9});return '尻尾にコブ';}},
  eye:{ok:c=>partCount(c,'eye')<5,ap(c){const i=rint(c.segs.length);c.segs[i].parts.push({k:'eye',o:Math.random()*2-1});c.magnet+=45;return i?`${i+1}節目に目（よく拾う）`:'目がふえる（よく拾う）';}},
  big:{ok:c=>c.segs[0].r<30,ap(c){c.segs.forEach(s=>s.r*=1.12);c.maxhp+=4;c.hp+=4;return 'ひとまわり大きく';}},
};
function options(c){const ks=Object.keys(GROW).filter(k=>GROW[k].ok(c));for(let i=ks.length-1;i>0;i--){const j=rint(i+1);[ks[i],ks[j]]=[ks[j],ks[i]];}
  return ks.slice(0,2).map(k=>{const n=clone(c);const label=GROW[k].ap(n);n.hue=(n.hue+(Math.random()<.5?-1:1)*(12+rint(16))+360)%360;n.hist.push(k);return {k,label,c:n};});}

// 体の配置（ゲーム中は物理、肖像は曲線）
function follow(c){for(let i=1;i<c.segs.length;i++){const a=c.segs[i-1],b=c.segs[i];const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,L=(a.r+b.r)*.62;b.x=a.x+dx/d*L;b.y=a.y+dy/d*L;b.ang=Math.atan2(-dy,-dx);}}
function pose(c,cx,cy,dir){const p=clone(c);p.dir=dir;p.segs[0].x=cx;p.segs[0].y=cy;p.segs[0].ang=dir;let ang=dir+Math.PI;
  for(let i=1;i<p.segs.length;i++){const a=p.segs[i-1],b=p.segs[i];ang+=Math.sin(i*.9+.6)*.55;const L=(a.r+b.r)*.62;b.x=a.x+Math.cos(ang)*L;b.y=a.y+Math.sin(ang)*L;b.ang=ang+Math.PI;}return p;}
function bounds(p){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const s of p.segs){const m=s.r+30;x0=Math.min(x0,s.x-m);y0=Math.min(y0,s.y-m);x1=Math.max(x1,s.x+m);y1=Math.max(y1,s.y+m);}const h=p.segs[0].parts.find(q=>q.k==='horn');if(h){const s=p.segs[0];x1=Math.max(x1,s.x+Math.cos(p.dir)*(s.r+h.len+10));}return{x0,y0,x1,y1};}

function drawCreature(g,c,t,hurt){
  const col=`hsl(${c.hue},55%,62%)`, dark=`hsl(${c.hue},45%,42%)`, light=`hsl(${c.hue},70%,80%)`;
  g.lineJoin='round';g.lineCap='round';
  // 羽（後ろ）
  c.segs.forEach((s,i)=>s.parts.filter(p=>p.k==='wing').forEach((p,j)=>{const a=s.ang,fl=Math.sin(t*.35+j)*.35;
    for(const side of [-1,1]){g.save();g.translate(s.x,s.y);g.rotate(a+side*(1.9+fl));g.fillStyle=`hsla(${(c.hue+170)%360},70%,80%,.75)`;g.strokeStyle=INK;g.lineWidth=2.5;
      g.beginPath();g.ellipse(p.sz,0,p.sz*1.1,p.sz*.55,0,0,7);g.fill();g.stroke();g.beginPath();g.moveTo(4,0);g.lineTo(p.sz*1.8,0);g.stroke();g.restore();}}));
  // ツメ
  c.segs.forEach((s,i)=>s.parts.filter(p=>p.k==='arm').forEach((p,j)=>{for(const side of [-1,1]){const w=Math.sin(t*.25+i+side)*.4;const a=s.ang+side*(1.45+w);
    const ex=s.x+Math.cos(a)*(s.r+p.len),ey=s.y+Math.sin(a)*(s.r+p.len);g.strokeStyle=INK;g.lineWidth=7;g.beginPath();g.moveTo(s.x,s.y);g.lineTo(ex,ey);g.stroke();g.strokeStyle=dark;g.lineWidth=4;g.stroke();
    g.fillStyle=BONE;g.strokeStyle=INK;g.lineWidth=2;for(const k of [-.5,.5]){g.beginPath();g.moveTo(ex,ey);g.lineTo(ex+Math.cos(a+k)*9,ey+Math.sin(a+k)*9);g.lineTo(ex+Math.cos(a+k*2)*3,ey+Math.sin(a+k*2)*3);g.closePath();g.fill();g.stroke();}}}));
  // 尻尾のコブ
  const tl=c.segs[c.segs.length-1];tl.parts.filter(p=>p.k==='club').forEach(p=>{const a=tl.ang+Math.PI+Math.sin(t*.2)*.6;const L=tl.r+p.sz+4;const x=tl.x+Math.cos(a)*L,y=tl.y+Math.sin(a)*L;
    g.strokeStyle=INK;g.lineWidth=5;g.beginPath();g.moveTo(tl.x,tl.y);g.lineTo(x,y);g.stroke();
    for(let k=0;k<6;k++){const b=k/6*6.283;g.fillStyle=BONE;g.beginPath();g.moveTo(x+Math.cos(b)*(p.sz+6),y+Math.sin(b)*(p.sz+6));g.lineTo(x+Math.cos(b+.4)*p.sz,y+Math.sin(b+.4)*p.sz);g.lineTo(x+Math.cos(b-.4)*p.sz,y+Math.sin(b-.4)*p.sz);g.fill();}
    g.fillStyle=dark;g.strokeStyle=INK;g.lineWidth=2.5;g.beginPath();g.arc(x,y,p.sz,0,7);g.fill();g.stroke();p._x=x;p._y=y;});
  // 体節（尻尾→頭）
  for(let i=c.segs.length-1;i>=0;i--){const s=c.segs[i];
    s.parts.filter(p=>p.k==='spike').forEach(p=>{for(let k=0;k<p.n;k++){const b=s.ang+Math.PI/2+(k/(p.n-1||1)-.5)*Math.PI*1.1*(k%2?1:-1)+(k%2?0:Math.PI);
      const r0=s.r-2,r1=s.r+9+(p.n>5?3:0);g.fillStyle=BONE;g.strokeStyle=INK;g.lineWidth=2;g.beginPath();g.moveTo(s.x+Math.cos(b-.25)*r0,s.y+Math.sin(b-.25)*r0);g.lineTo(s.x+Math.cos(b)*r1,s.y+Math.sin(b)*r1);g.lineTo(s.x+Math.cos(b+.25)*r0,s.y+Math.sin(b+.25)*r0);g.fill();g.stroke();}});
    g.fillStyle=hurt?'#fff':col;g.strokeStyle=INK;g.lineWidth=3;g.beginPath();g.arc(s.x,s.y,s.r,0,7);g.fill();g.stroke();
    g.fillStyle=light;g.beginPath();g.arc(s.x-s.r*.3,s.y-s.r*.35,s.r*.35,0,7);g.fill();
    if(i%2&&i){g.fillStyle=dark;g.beginPath();g.arc(s.x+s.r*.25,s.y+s.r*.2,s.r*.22,0,7);g.fill();}
    s.parts.filter(p=>p.k==='eye').forEach(p=>{const ex=s.x+Math.cos(s.ang+p.o)*s.r*.3,ey=s.y+Math.sin(s.ang+p.o)*s.r*.3-s.r*.2;eye(g,ex,ey,s.r*.32,s.ang);});
  }
  // 頭：角と目
  const h=c.segs[0],d=c.dir;
  h.parts.filter(p=>p.k==='horn').forEach(p=>{const b=h.r*.45;const tx=h.x+Math.cos(d)*(h.r+p.len),ty=h.y+Math.sin(d)*(h.r+p.len);
    g.fillStyle=BONE;g.strokeStyle=INK;g.lineWidth=2.5;g.beginPath();g.moveTo(h.x+Math.cos(d-.6)*h.r*.85,h.y+Math.sin(d-.6)*h.r*.85);g.quadraticCurveTo(h.x+Math.cos(d)*(h.r+p.len*.5)+Math.cos(d-1.57)*b*.3,h.y+Math.sin(d)*(h.r+p.len*.5)+Math.sin(d-1.57)*b*.3,tx,ty);g.lineTo(h.x+Math.cos(d+.6)*h.r*.85,h.y+Math.sin(d+.6)*h.r*.85);g.closePath();g.fill();g.stroke();p._x=tx;p._y=ty;});
  for(const side of [-1,1])eye(g,h.x+Math.cos(d+side*.75)*h.r*.55,h.y+Math.sin(d+side*.75)*h.r*.55,h.r*.3,d);
}
function eye(g,x,y,r,look){g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=2;g.beginPath();g.arc(x,y,r,0,7);g.fill();g.stroke();g.fillStyle=INK;g.beginPath();g.arc(x+Math.cos(look)*r*.35,y+Math.sin(look)*r*.35,r*.5,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(x+Math.cos(look)*r*.35-r*.15,y+Math.sin(look)*r*.35-r*.2,r*.15,0,7);g.fill();}
function portrait(cv,c){const g=cv.getContext('2d'),W=cv.width;g.clearRect(0,0,W,W);g.fillStyle=`hsl(${c.hue},40%,95%)`;g.fillRect(0,0,W,W);
  const p=pose(c,0,0,-.35);const b=bounds(p);const s=Math.min(W*.86/(b.x1-b.x0),W*.86/(b.y1-b.y0),W/90);
  g.save();g.translate(W/2,W/2);g.scale(s,s);g.translate(-(b.x0+b.x1)/2,-(b.y0+b.y1)/2);drawCreature(g,p,6,false);g.restore();}
function cname(c){const cnt={};c.segs.forEach(s=>s.parts.forEach(p=>cnt[p.k]=(cnt[p.k]||0)+(p.k==='horn'?Math.floor(p.len/12):1)));
  const W={horn:'ツノ',spike:'トゲ',wing:'ハネ',arm:'ツメ',club:'コブ',eye:'メダマ'};const top=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]).slice(0,2).map(k=>W[k]);
  const suf=c.segs.length>=8?'リュウ':c.segs.length>=6?'ムカデ':c.segs[0].r>22?'ゴン':'ムシ';return (c.segs.length>=7?'ナガ':'')+top.join('')+suf;}

// ===== ゲーム =====
const cv=$('cv'),g=cv.getContext('2d');let W=0,H=0,DPR=1,Z=1;
function resize(){DPR=window.devicePixelRatio||1;const cw=cv.clientWidth,ch=cv.clientHeight;Z=Math.max(1.2,Math.min(1.8,cw/270));W=cw/Z;H=ch/Z;cv.width=cw*DPR;cv.height=ch*DPR;}
let C,G,run=false,paused=true,ptr=null,last=0;
function startStage(){G={t:30,en:[],orbs:[],pt:[],spawn:0,need:4+C.lvl*2,xp:G&&G.xp||0,shake:0,hurt:0,cd:0,tick:0,wander:{x:W/2,y:H/2}};
  if(!C.segs[0].x){C.segs.forEach((s,i)=>{s.x=W/2-i*20;s.y=H/2;});C.dir=0;}
  paused=false;$('stage').textContent=C.stage;}
function spawnEnemy(){const side=rint(4),m=30;const x=side===0?-m:side===1?W+m:Math.random()*W,y=side===2?-m:side===3?H+m:Math.random()*H;
  const big=C.stage>1&&Math.random()<.15+C.stage*.04;G.en.push({x,y,r:big?18:10+rint(4),hp:big?3+C.stage:1+Math.floor(C.stage/3),sp:(.7+Math.random()*.5)*(1+C.stage*.12),big,hue:270+rint(60),cd:0,wob:Math.random()*6});}
function weapons(){const out=[];const h=C.segs[0];
  h.parts.forEach(p=>{if(p.k==='horn'&&p._x!=null)out.push({x:p._x,y:p._y,r:5+p.len*.18,d:1+p.len/18});});
  C.segs.forEach((s,i)=>s.parts.forEach(p=>{
    if(p.k==='spike')out.push({x:s.x,y:s.y,r:s.r+8,d:.5+p.n*.2,body:i});
    if(p.k==='arm')for(const side of [-1,1]){const a=s.ang+side*1.45;out.push({x:s.x+Math.cos(a)*(s.r+p.len),y:s.y+Math.sin(a)*(s.r+p.len),r:8,d:1.5});}
    if(p.k==='club'&&p._x!=null)out.push({x:p._x,y:p._y,r:p.sz+4,d:1.5+p.sz/8});}));return out;}
function update(dt){if(paused)return;G.tick++;
  G.t-=dt/1000;if(G.t<=0){G.t=0;return endStage(false);}
  // 移動
  const h=C.segs[0];let tg=ptr;if(!tg){if(Math.hypot(G.wander.x-h.x,G.wander.y-h.y)<30)G.wander={x:40+Math.random()*(W-80),y:40+Math.random()*(H-80)};tg=G.wander;}
  const ta=Math.atan2(tg.y-h.y,tg.x-h.x);let da=ta-C.dir;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;C.dir+=da*.14;
  const dist=Math.hypot(tg.x-h.x,tg.y-h.y);const sp=C.speed*Math.min(1,dist/40)*(ptr?1:.6);
  h.x+=Math.cos(C.dir)*sp;h.y+=Math.sin(C.dir)*sp;h.x=Math.max(h.r,Math.min(W-h.r,h.x));h.y=Math.max(h.r,Math.min(H-h.r,h.y));h.ang=C.dir;follow(C);
  // 敵
  G.spawn-=dt;if(G.spawn<=0){spawnEnemy();G.spawn=Math.max(260,1000-C.stage*120)*(0.7+Math.random()*.6);}
  const ws=weapons();
  for(const e of G.en){const a=Math.atan2(h.y-e.y,h.x-e.x);e.x+=Math.cos(a)*e.sp;e.y+=Math.sin(a)*e.sp;e.cd=Math.max(0,e.cd-dt);
    for(const w of ws){if(e.cd>0)break;if(Math.hypot(w.x-e.x,w.y-e.y)<w.r+e.r){e.hp-=w.d;e.cd=250;e.x-=Math.cos(a)*14;e.y-=Math.sin(a)*14;burst(e.x,e.y,'#fff',5);G.shake=2;
      if(e.hp<=0){e.dead=true;C.kills++;sfx.pop();burst(e.x,e.y,`hsl(${e.hue},60%,55%)`,14);for(let k=0;k<(e.big?3:1);k++)G.orbs.push({x:e.x+(Math.random()-.5)*14,y:e.y+(Math.random()-.5)*14});}else tone(300,.05,'square',.04);}}
    if(!e.dead&&e.cd<=0)for(let i=0;i<C.segs.length;i++){const s=C.segs[i];if(s.parts.some(p=>p.k==='spike'))continue;
      if(Math.hypot(s.x-e.x,s.y-e.y)<s.r+e.r-2){if(G.cd<=0){C.hp--;G.cd=900;G.hurt=8;G.shake=6;sfx.ouch();}e.cd=400;e.x-=Math.cos(a)*24;e.y-=Math.sin(a)*24;break;}}}
  G.en=G.en.filter(e=>!e.dead);G.cd-=dt;if(G.hurt>0)G.hurt--;
  if(C.hp<=0)return endStage(true);
  // 光の粒
  for(const o of G.orbs){const d=Math.hypot(h.x-o.x,h.y-o.y);if(d<C.magnet){o.x+=(h.x-o.x)/d*4;o.y+=(h.y-o.y)/d*4;}
    let got=d<h.r+8;if(!got)for(const s of C.segs)if(Math.hypot(s.x-o.x,s.y-o.y)<s.r+6){got=true;break;}
    if(got){o.got=true;G.xp++;sfx.orb();}}
  G.orbs=G.orbs.filter(o=>!o.got);
  if(G.xp>=G.need){G.xp=0;C.lvl++;G.need=4+C.lvl*2;grow();}
  hud();}
function burst(x,y,c,n){for(let i=0;i<n;i++)G.pt.push({x,y,vx:(Math.random()-.5)*5,vy:(Math.random()-.5)*5,c,l:20+rint(15)});}
function draw(t){g.setTransform(DPR*Z,0,0,DPR*Z,0,0);g.clearRect(0,0,W,H);
  const sx=G&&G.shake?(Math.random()-.5)*G.shake:0;if(G)G.shake*=.85;g.save();g.translate(sx,0);
  g.fillStyle='#e6dcc2';for(let x=10;x<W;x+=34)for(let y=10;y<H;y+=34){g.beginPath();g.arc(x+(y%68?17:0),y,1.6,0,7);g.fill();}
  if(G){for(const o of G.orbs){g.fillStyle='#f2a53a';g.strokeStyle=INK;g.lineWidth=2;g.beginPath();g.arc(o.x,o.y,4.5+Math.sin(t*.01+o.x)*1,0,7);g.fill();g.stroke();}
    for(const e of G.en){const wb=Math.sin(t*.008+e.wob)*1.5;g.fillStyle=`hsl(${e.hue},35%,${e.big?32:42}%)`;g.strokeStyle=INK;g.lineWidth=2.5;g.beginPath();g.ellipse(e.x,e.y,e.r+wb,e.r-wb,0,0,7);g.fill();g.stroke();
      const a=Math.atan2(C.segs[0].y-e.y,C.segs[0].x-e.x);g.fillStyle='#ffe';for(const sd of [-1,1]){g.beginPath();g.arc(e.x+Math.cos(a+sd*.6)*e.r*.45,e.y+Math.sin(a+sd*.6)*e.r*.45,e.r*.2,0,7);g.fill();}
      g.strokeStyle='#ffe';g.lineWidth=1.5;g.beginPath();g.moveTo(e.x+Math.cos(a-1)*e.r*.7,e.y+Math.sin(a-1)*e.r*.7);g.lineTo(e.x+Math.cos(a-.3)*e.r*.55,e.y+Math.sin(a-.3)*e.r*.55);g.stroke();}
    for(const p of G.pt){p.x+=p.vx;p.y+=p.vy;p.vx*=.92;p.vy*=.92;p.l--;g.fillStyle=p.c;g.globalAlpha=Math.min(1,p.l/10);g.beginPath();g.arc(p.x,p.y,2.5,0,7);g.fill();g.globalAlpha=1;}
    G.pt=G.pt.filter(p=>p.l>0);}
  if(C&&C.segs[0].x!=null)drawCreature(g,C,t/16,G&&G.hurt>0&&G.hurt%2);
  if(ptr&&!paused){g.strokeStyle='rgba(58,50,38,.3)';g.lineWidth=2;g.beginPath();g.arc(ptr.x,ptr.y,10,0,7);g.stroke();}
  g.restore();}
function hud(){$('time').textContent=Math.ceil(G.t);$('kills').textContent=C.kills;$('xp').style.width=(G.xp/G.need*100)+'%';$('hp').style.width=(C.hp/C.maxhp*100)+'%';}
function frame(t){const dt=Math.min(50,t-(last||t));last=t;if(run)update(dt);draw(t);requestAnimationFrame(frame);}

function grow(){paused=true;ptr=null;sfx.grow();const os=options(C);const box=$('opts');box.innerHTML='';
  os.forEach(o=>{const b=document.createElement('button');b.className='opt';const c=document.createElement('canvas');c.width=360;c.height=360;b.appendChild(c);
    b.insertAdjacentHTML('beforeend',`<b>${o.label}</b>`);portrait(c,o.c);
    b.onclick=()=>{const keep=C.segs.map(s=>({x:s.x,y:s.y,ang:s.ang}));const dir=C.dir;C=o.c;C.dir=dir;
      C.segs.forEach((s,i)=>{const k=keep[Math.min(i,keep.length-1)];s.x=k.x-(i>=keep.length?5:0);s.y=k.y;s.ang=k.ang;});follow(C);
      $('growSheet').hidden=true;paused=false;last=0;hud();};box.appendChild(b);});
  $('growSheet').hidden=false;}
function endStage(dead){paused=true;ptr=null;sfx.end();
  $('formT').textContent=dead?`力尽きた… 第${C.stage}形態`:`第${C.stage}形態 完成！`;portrait($('portrait'),C);
  $('formP').innerHTML=`<b style="font-size:22px">${cname(C)}</b><br>体 ${C.segs.length}節 ・ 倒した ${C.kills} ・ 育った回数 ${C.lvl}`;
  $('cont').hidden=dead;saveGal();$('formSheet').hidden=false;}
function saveGal(){try{const L=JSON.parse(localStorage.getItem('sodatsu_gal')||'[]');const c=document.createElement('canvas');c.width=c.height=160;portrait(c,C);
  const id=C.id;const item={id,img:c.toDataURL('image/png'),name:cname(C)};const i=L.findIndex(x=>x.id===id);if(i>=0)L[i]=item;else L.unshift(item);localStorage.setItem('sodatsu_gal',JSON.stringify(L.slice(0,12)));}catch(e){}}
function showGal(){const L=JSON.parse(localStorage.getItem('sodatsu_gal')||'[]');$('galWrap').hidden=!L.length;$('gal').innerHTML=L.map(x=>`<img src="${x.img}" title="${x.name}">`).join('');}
function egg(){const c=$('egg'),e=c.getContext('2d');e.clearRect(0,0,400,400);const hue=Math.floor(Math.random()*360);e.fillStyle=`hsl(${hue},50%,85%)`;e.strokeStyle=INK;e.lineWidth=8;e.beginPath();e.ellipse(200,215,110,140,0,0,7);e.fill();e.stroke();
  e.fillStyle=`hsl(${hue},45%,62%)`;for(let i=0;i<7;i++){e.beginPath();e.arc(130+Math.random()*140,130+Math.random()*170,10+Math.random()*16,0,7);e.fill();}}
function newGame(){C=newCreature();C.stage=1;C.id=Date.now();G=null;resize();startStage();run=true;hud();}

cv.addEventListener('pointerdown',e=>{const r=cv.getBoundingClientRect();ptr={x:(e.clientX-r.left)/Z,y:(e.clientY-r.top)/Z};});
cv.addEventListener('pointermove',e=>{if(!ptr)return;const r=cv.getBoundingClientRect();ptr={x:(e.clientX-r.left)/Z,y:(e.clientY-r.top)/Z};});
window.addEventListener('pointerup',()=>{ptr=null;});
$('start').onclick=()=>{ac();$('title').hidden=true;newGame();};
$('cont').onclick=()=>{$('formSheet').hidden=true;C.stage++;C.hp=C.maxhp;startStage();last=0;};
$('newEgg').onclick=()=>{$('formSheet').hidden=true;$('title').hidden=false;run=false;showGal();egg();};
$('savePng').onclick=()=>{const a=document.createElement('a');a.download=cname(C)+'.png';a.href=$('portrait').toDataURL('image/png');a.click();};
window.addEventListener('resize',resize);
resize();egg();showGal();requestAnimationFrame(frame);
