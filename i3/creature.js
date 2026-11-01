'use strict';
// ===== 生き物 =====
const BONE='#f7ecd0', INK='#3a3226';
// 進化：同じ部位を3回選ぶと形質がつく
const TRAIT={horn:{n:'突進',ic:'⚡',w:'トツゲキ',d:'ときどき猛スピードで突っ込む（角が2.5倍）'},spike:{n:'全身トゲ',ic:'🌵',w:'ハリ',d:'体のどこに当たっても敵が傷つく'},
  wing:{n:'浮遊',ic:'🪶',w:'フワ',d:'速くなり、体当たりされにくい'},arm:{n:'大バサミ',ic:'🦀',w:'ハサミ',d:'ツメが大きく、2倍強くなる'},
  club:{n:'鉄球',ic:'⛓',w:'テッキュウ',d:'尻尾のコブがぐるぐる回る'},eye:{n:'怪光線',ic:'👁',w:'ビーム',d:'近くの敵を目から撃つ'},
  seg:{n:'大蛇',ic:'🐍',w:'オロチ',d:'体で敵をはね飛ばす・体力アップ'},big:{n:'巨体',ic:'🗻',w:'オオ',d:'頭でぶつかるだけで倒せる'}};
const KN={horn:'ツノ',spike:'トゲ',wing:'ハネ',arm:'ツメ',club:'コブ',eye:'メ',seg:'体',big:'大きさ'};
const hasT=(c,k)=>c.traits.includes(k);
function newCreature(parent){const hue=parent?(parent.hue+(Math.random()-.5)*60+360)%360:Math.floor(Math.random()*360);
  const c={hue,segs:[],hp:12,maxhp:12,speed:2.3,magnet:50,lvl:0,kills:0,hist:[],cnt:{},traits:[]};
  c.segs.push({r:17,parts:[{k:'horn',len:12}]});c.segs.push({r:14,parts:[]});c.segs.push({r:11,parts:[]});
  if(parent&&GROW[parent.top]){GROW[parent.top].ap(c);c.cnt[parent.top]=1;c.parent=parent.name;c.inherit=parent.top;}
  return c;}
function applyGrow(n,k,times){let label='';for(let i=0;i<times;i++){label=GROW[k].ap(n);n.cnt[k]=(n.cnt[k]||0)+1;}
  let evo=null;if(n.cnt[k]>=3&&!hasT(n,k)){n.traits.push(k);evo=k;
    if(k==='wing')n.speed+=.6;if(k==='seg'){n.maxhp+=5;n.hp+=5;}if(k==='big')n.segs.forEach(s=>s.r*=1.15);}
  return {label,evo};}
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
function options(c,rare){const ks=Object.keys(GROW).filter(k=>GROW[k].ok(c));for(let i=ks.length-1;i>0;i--){const j=rint(i+1);[ks[i],ks[j]]=[ks[j],ks[i]];}
  return ks.slice(0,rare?3:2).map(k=>{const n=clone(c);const before=n.cnt[k]||0;const r=applyGrow(n,k,rare?2:1);n.hue=(n.hue+(Math.random()<.5?-1:1)*(12+rint(16))+360)%360;n.hist.push(k);
    const prog=hasT(c,k)?`${KN[k]}（進化ずみ）`:`${KN[k]} ${Math.min(3,n.cnt[k])}/3`+(r.evo?'':(n.cnt[k]===2?` → 次で【${TRAIT[k].n}】`:''));
    return {k,label:(rare?'★':'')+r.label+(rare?'×2':''),c:n,evo:r.evo,prog,near:!r.evo&&n.cnt[k]===2&&!hasT(c,k)};});}

// 体の配置（ゲーム中は物理、肖像は曲線）
function follow(c){for(let i=1;i<c.segs.length;i++){const a=c.segs[i-1],b=c.segs[i];const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,L=(a.r+b.r)*.62;b.x=a.x+dx/d*L;b.y=a.y+dy/d*L;b.ang=Math.atan2(-dy,-dx);}}
function pose(c,cx,cy,dir){const p=clone(c);p.dir=dir;p.segs[0].x=cx;p.segs[0].y=cy;p.segs[0].ang=dir;let ang=dir+Math.PI;
  for(let i=1;i<p.segs.length;i++){const a=p.segs[i-1],b=p.segs[i];ang+=Math.sin(i*.9+.6)*.55;const L=(a.r+b.r)*.62;b.x=a.x+Math.cos(ang)*L;b.y=a.y+Math.sin(ang)*L;b.ang=ang+Math.PI;}return p;}
function bounds(p){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const s of p.segs){const m=s.r+30;x0=Math.min(x0,s.x-m);y0=Math.min(y0,s.y-m);x1=Math.max(x1,s.x+m);y1=Math.max(y1,s.y+m);}const h=p.segs[0].parts.find(q=>q.k==='horn');if(h){const s=p.segs[0];x1=Math.max(x1,s.x+Math.cos(p.dir)*(s.r+h.len+10));}return{x0,y0,x1,y1};}

function drawCreature(g,c,t,hurt){
  const col=`hsl(${c.hue},55%,62%)`, dark=`hsl(${c.hue},45%,42%)`, light=`hsl(${c.hue},70%,80%)`;
  g.lineJoin='round';g.lineCap='round';
  if(hasT(c,'wing')){g.fillStyle='rgba(58,50,38,.12)';c.segs.forEach(s=>{g.beginPath();g.ellipse(s.x+6,s.y+14,s.r,s.r*.5,0,0,7);g.fill();});}
  // 羽（後ろ）
  c.segs.forEach((s,i)=>s.parts.filter(p=>p.k==='wing').forEach((p,j)=>{const a=s.ang,fl=Math.sin(t*.35+j)*.35;
    for(const side of [-1,1]){g.save();g.translate(s.x,s.y);g.rotate(a+side*(1.9+fl));if(hasT(c,'wing'))g.scale(1.35,1.35);g.fillStyle=`hsla(${(c.hue+170)%360},70%,80%,.75)`;g.strokeStyle=INK;g.lineWidth=2.5;
      g.beginPath();g.ellipse(p.sz,0,p.sz*1.1,p.sz*.55,0,0,7);g.fill();g.stroke();g.beginPath();g.moveTo(4,0);g.lineTo(p.sz*1.8,0);g.stroke();g.restore();}}));
  // ツメ
  c.segs.forEach((s,i)=>s.parts.filter(p=>p.k==='arm').forEach((p,j)=>{for(const side of [-1,1]){const w=Math.sin(t*.25+i+side)*.4;const a=s.ang+side*(1.45+w);
    const big=hasT(c,'arm')?1.7:1;const ex=s.x+Math.cos(a)*(s.r+p.len+(big>1?8:0)),ey=s.y+Math.sin(a)*(s.r+p.len+(big>1?8:0));g.strokeStyle=INK;g.lineWidth=7;g.beginPath();g.moveTo(s.x,s.y);g.lineTo(ex,ey);g.stroke();g.strokeStyle=dark;g.lineWidth=4;g.stroke();
    g.fillStyle=BONE;g.strokeStyle=INK;g.lineWidth=2;for(const k of [-.5,.5]){g.beginPath();g.moveTo(ex,ey);g.lineTo(ex+Math.cos(a+k)*9*big,ey+Math.sin(a+k)*9*big);g.lineTo(ex+Math.cos(a+k*2)*3*big,ey+Math.sin(a+k*2)*3*big);g.closePath();g.fill();g.stroke();}}}));
  // 尻尾のコブ
  const tl=c.segs[c.segs.length-1];tl.parts.filter(p=>p.k==='club').forEach(p=>{const fl=hasT(c,'club');const a=fl?t*.22:tl.ang+Math.PI+Math.sin(t*.2)*.6;const L=tl.r+p.sz+(fl?18:4);const x=tl.x+Math.cos(a)*L,y=tl.y+Math.sin(a)*L;
    g.strokeStyle=INK;g.lineWidth=5;g.beginPath();g.moveTo(tl.x,tl.y);g.lineTo(x,y);g.stroke();
    for(let k=0;k<6;k++){const b=k/6*6.283;g.fillStyle=BONE;g.beginPath();g.moveTo(x+Math.cos(b)*(p.sz+6),y+Math.sin(b)*(p.sz+6));g.lineTo(x+Math.cos(b+.4)*p.sz,y+Math.sin(b+.4)*p.sz);g.lineTo(x+Math.cos(b-.4)*p.sz,y+Math.sin(b-.4)*p.sz);g.fill();}
    g.fillStyle=dark;g.strokeStyle=INK;g.lineWidth=2.5;g.beginPath();g.arc(x,y,p.sz,0,7);g.fill();g.stroke();p._x=x;p._y=y;});
  // 体節（尻尾→頭）
  for(let i=c.segs.length-1;i>=0;i--){const s=c.segs[i];
    if(hasT(c,'spike')&&!s.parts.some(p=>p.k==='spike')){for(let k=0;k<6;k++){const b=k/6*6.283+i;g.fillStyle=BONE;g.strokeStyle=INK;g.lineWidth=2;g.beginPath();g.moveTo(s.x+Math.cos(b-.3)*(s.r-2),s.y+Math.sin(b-.3)*(s.r-2));g.lineTo(s.x+Math.cos(b)*(s.r+8),s.y+Math.sin(b)*(s.r+8));g.lineTo(s.x+Math.cos(b+.3)*(s.r-2),s.y+Math.sin(b+.3)*(s.r-2));g.fill();g.stroke();}}
    s.parts.filter(p=>p.k==='spike').forEach(p=>{for(let k=0;k<p.n;k++){const b=s.ang+Math.PI/2+(k/(p.n-1||1)-.5)*Math.PI*1.1*(k%2?1:-1)+(k%2?0:Math.PI);
      const r0=s.r-2,r1=s.r+9+(p.n>5?3:0);g.fillStyle=BONE;g.strokeStyle=INK;g.lineWidth=2;g.beginPath();g.moveTo(s.x+Math.cos(b-.25)*r0,s.y+Math.sin(b-.25)*r0);g.lineTo(s.x+Math.cos(b)*r1,s.y+Math.sin(b)*r1);g.lineTo(s.x+Math.cos(b+.25)*r0,s.y+Math.sin(b+.25)*r0);g.fill();g.stroke();}});
    g.fillStyle=hurt?'#fff':col;g.strokeStyle=INK;g.lineWidth=3;g.beginPath();g.arc(s.x,s.y,s.r,0,7);g.fill();g.stroke();
    g.fillStyle=light;g.beginPath();g.arc(s.x-s.r*.3,s.y-s.r*.35,s.r*.35,0,7);g.fill();
    if(hasT(c,'seg')&&i){g.strokeStyle=dark;g.lineWidth=3;g.beginPath();g.arc(s.x,s.y,s.r*.7,s.ang+1.2,s.ang+5.1);g.stroke();}
    if(i%2&&i){g.fillStyle=dark;g.beginPath();g.arc(s.x+s.r*.25,s.y+s.r*.2,s.r*.22,0,7);g.fill();}
    s.parts.filter(p=>p.k==='eye').forEach(p=>{const ex=s.x+Math.cos(s.ang+p.o)*s.r*.3,ey=s.y+Math.sin(s.ang+p.o)*s.r*.3-s.r*.2;eye(g,ex,ey,s.r*.32,s.ang);});
  }
  // 頭：角と目
  const h=c.segs[0],d=c.dir;
  h.parts.filter(p=>p.k==='horn').forEach(p=>{const b=h.r*.45;const tx=h.x+Math.cos(d)*(h.r+p.len),ty=h.y+Math.sin(d)*(h.r+p.len);
    g.fillStyle=hasT(c,'horn')?'#ffd34a':BONE;g.strokeStyle=INK;g.lineWidth=2.5;g.beginPath();g.moveTo(h.x+Math.cos(d-.6)*h.r*.85,h.y+Math.sin(d-.6)*h.r*.85);g.quadraticCurveTo(h.x+Math.cos(d)*(h.r+p.len*.5)+Math.cos(d-1.57)*b*.3,h.y+Math.sin(d)*(h.r+p.len*.5)+Math.sin(d-1.57)*b*.3,tx,ty);g.lineTo(h.x+Math.cos(d+.6)*h.r*.85,h.y+Math.sin(d+.6)*h.r*.85);g.closePath();g.fill();g.stroke();p._x=tx;p._y=ty;});
  for(const side of [-1,1]){const ex=h.x+Math.cos(d+side*.75)*h.r*.55,ey=h.y+Math.sin(d+side*.75)*h.r*.55;if(hasT(c,'eye')){g.fillStyle='rgba(255,80,60,.35)';g.beginPath();g.arc(ex,ey,h.r*.5,0,7);g.fill();}eye(g,ex,ey,h.r*.3,d);}
  if(hasT(c,'big')){g.fillStyle='#ffd34a';g.strokeStyle=INK;g.lineWidth=2;g.beginPath();const cx=h.x-Math.cos(d)*h.r*.2,cy=h.y-h.r*.95;g.moveTo(cx-9,cy+5);g.lineTo(cx-9,cy-5);g.lineTo(cx-4,cy);g.lineTo(cx,cy-8);g.lineTo(cx+4,cy);g.lineTo(cx+9,cy-5);g.lineTo(cx+9,cy+5);g.closePath();g.fill();g.stroke();}
}
function eye(g,x,y,r,look){g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=2;g.beginPath();g.arc(x,y,r,0,7);g.fill();g.stroke();g.fillStyle=INK;g.beginPath();g.arc(x+Math.cos(look)*r*.35,y+Math.sin(look)*r*.35,r*.5,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(x+Math.cos(look)*r*.35-r*.15,y+Math.sin(look)*r*.35-r*.2,r*.15,0,7);g.fill();}
function portrait(cv,c){const g=cv.getContext('2d'),W=cv.width;g.clearRect(0,0,W,W);g.fillStyle=`hsl(${c.hue},40%,95%)`;g.fillRect(0,0,W,W);
  const p=pose(c,0,0,-.35);const b=bounds(p);const s=Math.min(W*.86/(b.x1-b.x0),W*.86/(b.y1-b.y0),W/90);
  g.save();g.translate(W/2,W/2);g.scale(s,s);g.translate(-(b.x0+b.x1)/2,-(b.y0+b.y1)/2);drawCreature(g,p,6,false);g.restore();}
function cname(c){const pre=c.traits.length?TRAIT[c.traits[0]].w:'';return pre+cname0(c);}
function cname0(c){const cnt={};c.segs.forEach(s=>s.parts.forEach(p=>cnt[p.k]=(cnt[p.k]||0)+(p.k==='horn'?Math.floor(p.len/12):1)));
  const W={horn:'ツノ',spike:'トゲ',wing:'ハネ',arm:'ツメ',club:'コブ',eye:'メダマ'};const top=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]).slice(0,2).map(k=>W[k]);
  const suf=c.segs.length>=8?'リュウ':c.segs.length>=6?'ムカデ':c.segs[0].r>22?'ゴン':'ムシ';return (c.segs.length>=7?'ナガ':'')+top.join('')+suf;}

