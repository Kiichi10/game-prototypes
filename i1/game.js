'use strict';
// ===== 保存 =====
const SAVE='hirameki_v2';
let S=load();
function load(){try{const s=JSON.parse(localStorage.getItem(SAVE));if(s&&s.learned)return s;}catch(e){}
  const s={learned:{kiru:{at:1,uses:0}},floor:1,hp:null,known:{},best:1,order:['kiru'],tips:{}};
  try{const v1=JSON.parse(localStorage.getItem('hirameki_v1'));if(v1&&v1.learned){for(const k in v1.learned)if(T[k]){s.learned[k]=v1.learned[k];if(!s.order.includes(k))s.order.push(k);}}}catch(e){}
  return s;}
function save(){localStorage.setItem(SAVE,JSON.stringify(S));}
const nLearned=()=>Object.keys(S.learned).length;
const maxHp=()=>80+6*nLearned();
if(S.hp==null)S.hp=maxHp();

// ===== 描画 =====
const cv=document.getElementById('cv'),g=cv.getContext('2d');g.imageSmoothingEnabled=false;
const W=240,H=200,GY=160;
const HERO=['....kkkk....','...kRRRRk...','..kRRRRRRk..','..kSSSSSSk..','..kSkSSkSk..','..kSSSSSSk..','...kSSSSk...',
'..kBBBBBBk..','.kBBWBBWBBk.','.kSBBBBBBSk.','..kBBBBBBk..','..kNNkkNNk..','..kNk..kNk..','..kk....kk..'];
const HC={k:'#141018',R:'#d8402c',S:'#ffd2a0',B:'#3a5ad8',W:'#ffffff',N:'#5a3a2a'};
function drawMap(ctx,map,col,x,y,sc,flash){for(let r=0;r<map.length;r++)for(let c=0;c<map[r].length;c++){const ch=map[r][c];if(ch==='.')continue;ctx.fillStyle=flash?'#fff':col[ch];ctx.fillRect(x+c*sc,y+r*sc,sc,sc);}}
let seedN=1;const rnd=()=>{seedN=(seedN*16807)%2147483647;return seedN/2147483647;};
function sprite(seed,size){seedN=seed;const half=Math.ceil(size/2),m=[];for(let r=0;r<size;r++)m.push(Array(size).fill('.'));
  for(let r=0;r<size;r++)for(let c=0;c<half;c++){const dc=half-1-c,dr=Math.abs(r-size/2)/(size/2);const pr=.75-dc*.09-dr*.35;if(rnd()<pr){const ch=rnd()<.18?'d':(rnd()<.5?'a':'b');m[r][c]=ch;m[r][size-1-c]=ch;}}
  const out=m.map(r=>r.slice());
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){if(m[r][c]!=='.')continue;if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>m[r+a]&&m[r+a][c+b]&&m[r+a][c+b]!=='.'))out[r][c]='k';}
  const er=Math.floor(size*.38),ec=half-2;out[er][ec]='e';out[er][size-1-ec]='e';out[er+1][ec]='p';out[er+1][size-1-ec]='p';
  return out.map(r=>r.join(''));}
function makeEnemy(sp,rank,fl){const spec=SPECIES[sp],R=RANK[rank],boss=rank==='boss',size=boss?14:10;
  const hue=(sp*36+(boss?0:fl*3))%360,l=rank==='strong'?38:rank==='weak'?55:46;
  const col={a:`hsl(${hue},60%,${l}%)`,b:`hsl(${hue},70%,${l+16}%)`,d:`hsl(${(hue+180)%360},70%,55%)`,k:'#141018',e:rank==='strong'||boss?'#ff5040':'#fff',p:'#141018'};
  const hp=Math.round((30+fl*20)*R.hp);
  return {sp,spec,rank,name:(boss?'【ぬし】':rank==='strong'?'あばれ':'')+spec.n,map:sprite(sp*7919+(boss?99:13),size),col,size,hp,max:hp,atk:Math.round((4+fl*2)*R.atk)};}

const st={hero:{x:50,y:GY,f:0},en:null,ex:172,ey:104,ef:0,eshake:0,ealpha:1,fx:[],fl:[],pt:[],bulb:0,dark:0,banner:null,shake:0,t:0};
function drawBg(){const a=areaOf(S.floor).n,t=st.t;
  if(a==='草原'){let sk=g.createLinearGradient(0,0,0,GY);sk.addColorStop(0,'#5aa0e8');sk.addColorStop(1,'#bfe4ff');g.fillStyle=sk;g.fillRect(-10,0,W+20,GY);
    g.fillStyle='#fff';for(let i=0;i<4;i++){const x=((i*80+t*.1)%(W+60))-30;g.fillRect(x,20+i*12,24,5);g.fillRect(x+5,16+i*12,14,4);}
    g.fillStyle='#6ab85a';for(let x=0;x<W;x+=2){const h=16+Math.sin(x*.04)*8+Math.sin(x*.11)*4;g.fillRect(x,GY-h,2,h);}
    g.fillStyle='#3e8a3a';g.fillRect(-10,GY,W+20,H);g.fillStyle='#52a04a';for(let x=0;x<W;x+=8)g.fillRect(x+(x%16?0:3),GY+4+(x%3)*6,2,3);}
  else if(a==='洞窟'){let sk=g.createLinearGradient(0,0,0,GY);sk.addColorStop(0,'#1a120c');sk.addColorStop(1,'#3a2a1c');g.fillStyle=sk;g.fillRect(-10,0,W+20,GY);
    g.fillStyle='#2a1e14';for(let x=0;x<W;x+=18){const h=10+((x*7)%23);g.beginPath();g.moveTo(x,0);g.lineTo(x+9,h);g.lineTo(x+18,0);g.fill();}
    for(const tx of [20,220]){const r=14+Math.sin(t*.2+tx)*2;const gr=g.createRadialGradient(tx,70,1,tx,70,r*2);gr.addColorStop(0,'rgba(255,170,60,.6)');gr.addColorStop(1,'rgba(255,170,60,0)');g.fillStyle=gr;g.fillRect(tx-30,40,60,60);g.fillStyle='#ffb040';g.fillRect(tx-1,66,3,5);g.fillStyle='#5a3a20';g.fillRect(tx-1,71,3,8);}
    g.fillStyle='#24180f';g.fillRect(-10,GY,W+20,H);g.fillStyle='#34241a';for(let x=0;x<W;x+=14)g.fillRect(x,GY+3+(x%5),6,3);}
  else if(a==='古城'){let sk=g.createLinearGradient(0,0,0,GY);sk.addColorStop(0,'#1a1030');sk.addColorStop(1,'#3a2a50');g.fillStyle=sk;g.fillRect(-10,0,W+20,GY);
    g.fillStyle='#f0e8c0';g.beginPath();g.arc(200,26,10,0,7);g.fill();
    g.fillStyle='#2a2238';g.fillRect(0,60,W,GY-60);g.fillStyle='#342a46';for(let y=60;y<GY;y+=8)for(let x=(y/8)%2*8;x<W;x+=16)g.fillRect(x,y,15,7);
    for(const wx of [30,120,210]){g.fillStyle='#141020';g.fillRect(wx-6,80,12,22);g.beginPath();g.arc(wx,80,6,Math.PI,0);g.fill();g.fillStyle=`rgba(255,200,90,${.25+.1*Math.sin(t*.1+wx)})`;g.fillRect(wx-5,82,10,19);}
    g.fillStyle='#1c1628';g.fillRect(-10,GY,W+20,H);g.fillStyle='#5a1a2a';g.fillRect(-10,GY,W+20,3);}
  else{let sk=g.createLinearGradient(0,0,0,GY);sk.addColorStop(0,'#ffb07a');sk.addColorStop(1,'#ffe8c8');g.fillStyle=sk;g.fillRect(-10,0,W+20,GY);
    g.fillStyle='rgba(255,255,255,.85)';for(let i=0;i<6;i++){const x=((i*60-t*.15)%(W+80)+W+80)%(W+80)-40;g.fillRect(x,40+i*16,40,8);g.fillRect(x+8,34+i*16,22,6);}
    g.fillStyle='#fff';g.fillRect(-10,GY,W+20,H);g.fillStyle='#e8e0f0';for(let x=0;x<W;x+=12)g.fillRect(x,GY+2,8,3);}
}
function loop(){st.t++;const sx=st.shake?(Math.random()-.5)*st.shake:0;st.shake*=.85;if(st.shake<.3)st.shake=0;
  g.save();g.translate(Math.round(sx),0);drawBg();
  if(st.en&&st.ealpha>0){const e=st.en,sc=e.size===14?5:6,ew=e.size*sc;
    const ox=st.ex-ew/2+(st.eshake?(Math.random()-.5)*st.eshake:0),oy=GY-ew-6+Math.sin(st.t*.06)*2;
    g.globalAlpha=st.ealpha;g.fillStyle='rgba(0,0,0,.3)';g.fillRect(st.ex-ew/2+6,GY,ew-12,4);
    drawMap(g,e.map,e.col,Math.round(ox),Math.round(oy),sc,st.ef>0);g.globalAlpha=1;st.eshake*=.8;if(st.ef>0)st.ef--;st.ey=oy+ew/2;
    g.fillStyle='#000';g.fillRect(132,26,80,6);g.fillStyle='#e04040';g.fillRect(133,27,78*Math.max(0,e.hp)/e.max,4);
    g.font='10px DotGothic16';g.textAlign='center';g.fillStyle='#000';g.fillText(e.name,173,23);g.fillStyle='#fff';g.fillText(e.name,172,22);
    const kn=S.known[e.sp]||{};g.font='9px DotGothic16';const ws=`弱:${kn.w?e.spec.w:'？'}　耐:${kn.r?(e.spec.r||'なし'):'？'}`;g.fillStyle='#000';g.fillText(ws,173,43);g.fillStyle='#ffe9a0';g.fillText(ws,172,42);}
  const h=st.hero;g.fillStyle='rgba(0,0,0,.3)';g.fillRect(h.x-14,GY,28,4);
  drawMap(g,HERO,HC,Math.round(h.x-18),Math.round(GY-42+(st.t%40<20?0:1)),3,h.f>0);if(h.f>0)h.f--;
  g.fillStyle='#d8e0ff';g.fillRect(Math.round(h.x+16),GY-24,2,14);g.fillStyle='#ffd75e';g.fillRect(Math.round(h.x+14),GY-12,6,2);
  if(st.dark>0){g.fillStyle=`rgba(0,0,10,${st.dark})`;g.fillRect(-10,0,W+20,H);}
  if(st.bulb>0){const bx=h.x,by=GY-62,r=10+Math.sin(st.t*.5)*1.5,cc=st.bulb===2?'255,150,210':'255,240,140';
    const gr=g.createRadialGradient(bx,by,2,bx,by,40);gr.addColorStop(0,`rgba(${cc},.9)`);gr.addColorStop(1,`rgba(${cc},0)`);g.fillStyle=gr;g.fillRect(bx-40,by-40,80,80);
    g.fillStyle=st.bulb===2?'#ffd0ec':'#fff6a0';g.beginPath();g.arc(bx,by,r*.7,0,7);g.fill();g.fillStyle='#ffd75e';g.fillRect(bx-3,by+5,6,5);g.fillStyle='#a08a40';g.fillRect(bx-3,by+10,6,2);
    for(let i=0;i<8;i++){const a=i/8*6.283+st.t*.05;g.fillStyle=st.bulb===2?'#ffb0e0':'#fff6a0';g.fillRect(bx+Math.cos(a)*16-1,by+Math.sin(a)*16-1,3,3);}}
  st.fx=st.fx.filter(f=>f.life-->0);for(const f of st.fx)drawFx(f);
  st.pt=st.pt.filter(p=>p.life-->0);for(const p of st.pt){p.x+=p.vx;p.y+=p.vy;p.vy+=.08;g.fillStyle=p.c;g.fillRect(p.x,p.y,2,2);}
  st.fl=st.fl.filter(f=>f.life-->0);for(const f of st.fl){f.y-=.5;g.font=(f.big?'16px':'12px')+' DotGothic16';g.textAlign='center';g.fillStyle='#000';g.fillText(f.s,f.x+1,f.y+1);g.fillStyle=f.c;g.fillText(f.s,f.x,f.y);}
  if(st.banner){const b=st.banner;b.life--;g.globalAlpha=Math.min(1,b.life/15);g.fillStyle='rgba(0,0,30,.82)';g.fillRect(0,56,W,50);g.fillStyle=b.combo?'#ff9ad0':'#ffd75e';g.font='12px DotGothic16';g.textAlign='center';
    g.fillText(b.combo?'連携閃き！':'閃いた！',W/2,73);g.fillStyle=b.c;g.font='22px DotGothic16';g.fillText(b.s,W/2,97);g.globalAlpha=1;if(b.life<=0)st.banner=null;}
  g.restore();requestAnimationFrame(loop);}
function drawFx(f){const k=1-f.life/f.max;g.strokeStyle=f.c;g.fillStyle=f.c;g.lineWidth=2;const cx=st.ex,cy=st.ey;
  if(f.k==='slash'){const a=f.a,L=50;g.globalAlpha=1-k;g.beginPath();g.moveTo(cx-Math.cos(a)*L*(1-k*.3),cy-Math.sin(a)*L);g.lineTo(cx+Math.cos(a)*L*k*1.4,cy+Math.sin(a)*L*k*1.4);g.stroke();g.globalAlpha=1;}
  else if(f.k==='thrust'){g.globalAlpha=1-k;g.fillRect(cx-60+k*40,cy+f.o-1,50,2);g.globalAlpha=1;}
  else if(f.k==='bolt'){g.globalAlpha=1-k;let x=cx,y=0;g.beginPath();g.moveTo(x,y);while(y<cy){x+=(Math.random()-.5)*16;y+=12;g.lineTo(x,y);}g.lineWidth=3;g.stroke();g.globalAlpha=1;}
  else if(f.k==='spin'){g.globalAlpha=1-k;g.beginPath();g.arc(cx,cy,10+k*40,f.a,f.a+3.5);g.stroke();g.globalAlpha=1;}
  else if(f.k==='snow'){g.globalAlpha=1-k;for(let i=0;i<6;i++)g.fillRect(cx+Math.sin(i*2+f.a)*30,cy-30+k*60+i*5,2,2);g.globalAlpha=1;}
  else if(f.k==='shadow'){g.globalAlpha=(1-k)*.8;g.fillStyle='#000';g.fillRect(cx-30+k*20,cy-20,40,40);g.fillStyle=f.c;g.fillRect(cx-30,cy+f.o,60,2);g.globalAlpha=1;}
  else if(f.k==='ring'){g.globalAlpha=(1-k)*.8;g.beginPath();g.arc(cx,cy,k*70,0,7);g.stroke();g.globalAlpha=1;}}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const tween=(o,k,to,ms)=>new Promise(r=>{const from=o[k],t0=performance.now();(function s(){const p=Math.min(1,(performance.now()-t0)/ms);o[k]=from+(to-from)*(1-Math.pow(1-p,3));p<1?requestAnimationFrame(s):r();})();});
function burst(x,y,c,n=14){for(let i=0;i<n;i++)st.pt.push({x,y,vx:(Math.random()-.5)*4,vy:-Math.random()*3,c,life:30+Math.random()*20});}
