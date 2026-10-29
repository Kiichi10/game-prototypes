'use strict';
// ===== 技の木（親を使うと、子を閃く） =====
const T = {
  kiru:{n:'斬る',p:10,h:1,c:'#ffffff'},
  nidan:{n:'二段斬り',p:8,h:2,c:'#9cdcff',par:'kiru'},
  tsuki:{n:'突き',p:15,h:1,c:'#ffe27a',par:'kiru',st:'thrust'},
  harai:{n:'払い抜け',p:13,h:1,c:'#8cff9c',par:'kiru',st:'dash'},
  sandan:{n:'三段斬り',p:8,h:3,c:'#7ac4ff',par:'nidan'},
  tsubame:{n:'燕返し',p:12,h:2,c:'#c9a0ff',par:'nidan',st:'cross'},
  senbon:{n:'千本突き',p:5,h:6,c:'#ffd84a',par:'tsuki',st:'thrust'},
  inazuma:{n:'稲妻突き',p:26,h:1,c:'#fff36a',par:'tsuki',st:'bolt'},
  shippu:{n:'疾風斬り',p:11,h:2,c:'#6affc0',par:'harai',st:'dash'},
  kagenui:{n:'影縫い',p:20,h:1,c:'#b47aff',par:'harai',st:'shadow'},
  musou:{n:'無双三段',p:12,h:3,c:'#5aa8ff',par:'sandan'},
  midare:{n:'乱れ雪月花',p:7,h:6,c:'#e0f4ff',par:'sandan',st:'snow'},
  tsukikage:{n:'月影',p:18,h:2,c:'#d8c0ff',par:'tsubame',st:'cross'},
  hyakka:{n:'百花繚乱突き',p:5,h:10,c:'#ff9ad0',par:'senbon',st:'thrust'},
  raimei:{n:'雷鳴剣',p:40,h:1,c:'#fff7a0',par:'inazuma',st:'bolt'},
  tenchi:{n:'天地二段',p:22,h:2,c:'#ffc26a',par:'inazuma'},
  tatsumaki:{n:'竜巻斬り',p:8,h:5,c:'#7affd8',par:'shippu',st:'spin'},
  shinku:{n:'真空斬り',p:30,h:1,c:'#c0fff0',par:'shippu',st:'dash'},
  oboro:{n:'朧',p:16,h:3,c:'#9a7aff',par:'kagenui',st:'shadow'},
  tenka:{n:'天下無双',p:16,h:4,c:'#3a8cff',par:'musou'},
  sange:{n:'散華',p:9,h:8,c:'#ffb0c8',par:'midare',st:'snow'},
  gekka:{n:'月下一閃',p:60,h:1,c:'#f0e0ff',par:'tsukikage',st:'cross'},
  senshi:{n:'千紫万紅',p:6,h:14,c:'#ff70b0',par:'hyakka',st:'thrust'},
  kaminari:{n:'神鳴',p:75,h:1,c:'#ffffff',par:'raimei',st:'bolt'},
  shoryu:{n:'昇竜嵐',p:12,h:6,c:'#40ffc8',par:'tatsumaki',st:'spin'},
  kokuu:{n:'虚空斬',p:55,h:1,c:'#a0fff8',par:'shinku',st:'dash'},
  mugen:{n:'夢幻',p:14,h:6,c:'#7a5aff',par:'oboro',st:'shadow'},
};
const IDS = Object.keys(T);
const kids = id => IDS.filter(k => T[k].par === id);
const tier = id => T[id].par ? tier(T[id].par) + 1 : 0;

// ===== 保存 =====
const SAVE = 'hirameki_v1';
let S = load();
function load(){ try{ const s=JSON.parse(localStorage.getItem(SAVE)); if(s&&s.learned) return s; }catch(e){} return {learned:{kiru:{at:1,uses:0}},floor:1}; }
function save(){ localStorage.setItem(SAVE, JSON.stringify(S)); }

// ===== 音 =====
let AC; const ac=()=>AC||(AC=new (window.AudioContext||window.webkitAudioContext)());
function tone(f,d,type='square',v=.06,slide=0,when=0){const a=ac(),o=a.createOscillator(),g=a.createGain(),t=a.currentTime+when;o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide),t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(g).connect(a.destination);o.start(t);o.stop(t+d+.02);}
function noise(d,v=.12,when=0,hp=900){const a=ac(),n=a.sampleRate*d,b=a.createBuffer(1,n,a.sampleRate),x=b.getChannelData(0);for(let i=0;i<n;i++)x[i]=(Math.random()*2-1)*(1-i/n);const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();f.type='highpass';f.frequency.value=hp;g.gain.value=v;s.buffer=b;s.connect(f).connect(g).connect(a.destination);s.start(a.currentTime+when);}
const sfx={
  slash(){noise(.12,.14,0,1800);tone(900,.08,'sawtooth',.03,-600);},
  hit(){tone(140,.12,'square',.08,-80);noise(.06,.1,0,400);},
  hurt(){tone(300,.18,'square',.07,-220);},
  sel(){tone(660,.04,'square',.04);},
  hira(){[0,4,7,12,16].forEach((s,i)=>tone(523*Math.pow(2,s/12),.18,'square',.05,0,i*.06));tone(2093,.5,'triangle',.05,0,.32);},
  win(){[0,4,7,4,7,12].forEach((s,i)=>tone(392*Math.pow(2,s/12),.16,'square',.05,0,i*.11));},
  die(){noise(.5,.12,0,200);tone(220,.5,'square',.05,-180);},
};

// ===== 描画 =====
const cv=document.getElementById('cv'), g=cv.getContext('2d'); g.imageSmoothingEnabled=false;
const W=240,H=250;
const HERO=[
'....kkkk....','...kRRRRk...','..kRRRRRRk..','..kSSSSSSk..','..kSkSSkSk..','..kSSSSSSk..','...kSSSSk...',
'..kBBBBBBk..','.kBBWBBWBBk.','.kSBBBBBBSk.','..kBBBBBBk..','..kNNkkNNk..','..kNk..kNk..','..kk....kk..'];
const HC={k:'#141018',R:'#d8402c',S:'#ffd2a0',B:'#3a5ad8',W:'#ffffff',N:'#5a3a2a'};
function drawMap(map,col,x,y,sc,flash){for(let r=0;r<map.length;r++)for(let c=0;c<map[r].length;c++){const ch=map[r][c];if(ch==='.')continue;g.fillStyle=flash?'#fff':col[ch];g.fillRect(x+c*sc,y+r*sc,sc,sc);}}

let seedN=1; function rnd(){seedN=(seedN*16807)%2147483647;return seedN/2147483647;}
function makeEnemy(fl){
  seedN = fl*7919+13; const size = fl%5===0?14:10, half=Math.ceil(size/2);
  const hue=(fl*47)%360, col={a:`hsl(${hue},60%,45%)`,b:`hsl(${hue},70%,62%)`,d:`hsl(${(hue+180)%360},70%,55%)`,k:'#141018',e:'#fff',p:'#141018'};
  const m=[];for(let r=0;r<size;r++){m.push(Array(size).fill('.'));}
  for(let r=0;r<size;r++)for(let c=0;c<half;c++){
    const dc=half-1-c, dr=Math.abs(r-size/2)/(size/2);
    const pr=.75-dc*.09-dr*.35; if(rnd()<pr){const ch=rnd()<.18?'d':(rnd()<.5?'a':'b');m[r][c]=ch;m[r][size-1-c]=ch;}
  }
  // 縁取り
  const out=m.map(r=>r.slice());
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){if(m[r][c]!=='.')continue;const nb=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>m[r+a]&&m[r+a][c+b]&&m[r+a][c+b]!=='.');if(nb)out[r][c]='k';}
  const er=Math.floor(size*.38), ec=half-2; out[er][ec]='e';out[er][size-1-ec]='e';out[er+1][ec]='p';out[er+1][size-1-ec]='p';
  const names=['スライム','ゴブリン','こうもり','がいこつ','おばけ','トロル','まじゅつし','ドラゴン','ゴーレム','キメラ'];
  const pre=['','おおきな','ふるい','やみの','いにしえの','あばれ','ねむれる'];
  const boss=fl%5===0;
  return {map:out.map(r=>r.join('')),col,size,name:(boss?'【ぬし】':'')+pre[fl%pre.length]+names[(fl*3)%names.length],
    hp:Math.round((34+fl*22)*(boss?1.8:1)),max:0,atk:4+fl*2+(boss?4:0)};
}

const st={hero:{x:44,y:150,f:0},en:null,ex:150,ey:110,ef:0,eshake:0,ealpha:1,fx:[],fl:[],pt:[],bulb:0,dark:0,banner:null,shake:0,t:0};
function loop(){
  st.t++; const sx=st.shake?(Math.random()-.5)*st.shake:0; st.shake*=.85; if(st.shake<.3)st.shake=0;
  g.save(); g.translate(Math.round(sx),0);
  // 背景
  const hue=(S.floor*23)%360;
  const sky=g.createLinearGradient(0,0,0,H); sky.addColorStop(0,`hsl(${hue},45%,18%)`); sky.addColorStop(1,`hsl(${hue},40%,34%)`);
  g.fillStyle=sky; g.fillRect(-10,0,W+20,H);
  for(let i=0;i<24;i++){g.fillStyle='rgba(255,255,255,'+(.2+.2*Math.sin(st.t*.03+i))+')';g.fillRect((i*53)%W,(i*37)%110,1,1);}
  g.fillStyle=`hsl(${hue},30%,14%)`; g.fillRect(-10,178,W+20,H);
  for(let x=0;x<W;x+=12){g.fillStyle=`hsl(${hue},30%,${18+((x/12)%2)*4}%)`;g.fillRect(x,178,12,4);}
  // 敵
  if(st.en&&st.ealpha>0){const e=st.en,sc=e.size===14?6:6,ew=e.size*sc;
    const ox=st.ex-ew/2+(st.eshake?(Math.random()-.5)*st.eshake:0), oy=st.ey-ew/2+Math.sin(st.t*.06)*2;
    g.globalAlpha=st.ealpha; g.fillStyle='rgba(0,0,0,.35)';g.fillRect(st.ex-ew/2+6,178,ew-12,4);
    drawMap(e.map,e.col,Math.round(ox),Math.round(oy),sc,st.ef>0); g.globalAlpha=1; st.eshake*=.8; if(st.ef>0)st.ef--;
    // HPバー
    g.fillStyle='#000';g.fillRect(150-40,30,80,6);g.fillStyle='#e04040';g.fillRect(151-40,31,78*Math.max(0,e.hp)/e.max,4);
    g.fillStyle='#fff';g.font='10px DotGothic16';g.textAlign='center';g.fillText(e.name,150,26);
  }
  // 主人公
  const h=st.hero; g.fillStyle='rgba(0,0,0,.35)';g.fillRect(h.x-14,178,28,4);
  drawMap(HERO,HC,Math.round(h.x-18),Math.round(h.y-42+(st.t%40<20?0:1)),3,h.f>0); if(h.f>0)h.f--;
  // 剣
  g.fillStyle='#d8e0ff';g.fillRect(Math.round(h.x+16),Math.round(h.y-24),2,14);g.fillStyle='#ffd75e';g.fillRect(Math.round(h.x+14),Math.round(h.y-12),6,2);
  // 暗転＋電球
  if(st.dark>0){g.fillStyle=`rgba(0,0,10,${st.dark})`;g.fillRect(-10,0,W+20,H);}
  if(st.bulb>0){const bx=h.x,by=h.y-62,r=10+Math.sin(st.t*.5)*1.5;
    const gr=g.createRadialGradient(bx,by,2,bx,by,40);gr.addColorStop(0,'rgba(255,240,140,.9)');gr.addColorStop(1,'rgba(255,240,140,0)');g.fillStyle=gr;g.fillRect(bx-40,by-40,80,80);
    g.fillStyle='#fff6a0';g.beginPath();g.arc(bx,by,r*.7,0,7);g.fill();g.fillStyle='#ffd75e';g.fillRect(bx-3,by+5,6,5);g.fillStyle='#a08a40';g.fillRect(bx-3,by+10,6,2);
    for(let i=0;i<8;i++){const a=i/8*6.283+st.t*.05;g.fillStyle='#fff6a0';g.fillRect(bx+Math.cos(a)*16-1,by+Math.sin(a)*16-1,3,3);} }
  // エフェクト
  st.fx=st.fx.filter(f=>f.life-->0); for(const f of st.fx)drawFx(f);
  st.pt=st.pt.filter(p=>p.life-->0); for(const p of st.pt){p.x+=p.vx;p.y+=p.vy;p.vy+=.08;g.fillStyle=p.c;g.fillRect(p.x,p.y,2,2);}
  st.fl=st.fl.filter(f=>f.life-->0); for(const f of st.fl){f.y-=.5;g.font=(f.big?'16px':'12px')+' DotGothic16';g.textAlign='center';g.fillStyle='#000';g.fillText(f.s,f.x+1,f.y+1);g.fillStyle=f.c;g.fillText(f.s,f.x,f.y);}
  if(st.banner){const b=st.banner;b.life--;const a=Math.min(1,b.life/15);g.globalAlpha=a;g.fillStyle='rgba(0,0,30,.8)';g.fillRect(0,70,W,48);g.fillStyle='#ffd75e';g.font='12px DotGothic16';g.textAlign='center';g.fillText('閃いた！',W/2,88);g.fillStyle=b.c;g.font='22px DotGothic16';g.fillText(b.s,W/2,110);g.globalAlpha=1;if(b.life<=0)st.banner=null;}
  g.restore(); requestAnimationFrame(loop);
}
function drawFx(f){const k=1-f.life/f.max; g.strokeStyle=f.c; g.fillStyle=f.c; g.lineWidth=2;
  if(f.k==='slash'){const a=f.a, L=50; const cx=st.ex, cy=st.ey; g.globalAlpha=1-k; g.beginPath(); g.moveTo(cx-Math.cos(a)*L*(1-k*.3),cy-Math.sin(a)*L); g.lineTo(cx+Math.cos(a)*L*k*1.4,cy+Math.sin(a)*L*k*1.4); g.stroke(); g.globalAlpha=1;}
  else if(f.k==='thrust'){g.globalAlpha=1-k;g.fillRect(st.ex-60+k*40,st.ey+f.o-1,50,2);g.globalAlpha=1;}
  else if(f.k==='bolt'){g.globalAlpha=1-k;let x=st.ex,y=0;g.beginPath();g.moveTo(x,y);while(y<st.ey){x+=(Math.random()-.5)*16;y+=12;g.lineTo(x,y);}g.lineWidth=3;g.stroke();g.globalAlpha=1;}
  else if(f.k==='spin'){g.globalAlpha=1-k;g.beginPath();g.arc(st.ex,st.ey,10+k*40,f.a,f.a+3.5);g.stroke();g.globalAlpha=1;}
  else if(f.k==='snow'){g.globalAlpha=1-k;for(let i=0;i<6;i++)g.fillRect(st.ex+Math.sin(i*2+f.a)*30,st.ey-30+k*60+i*5,2,2);g.globalAlpha=1;}
  else if(f.k==='ring'){g.globalAlpha=(1-k)*.8;g.beginPath();g.arc(st.ex,st.ey,k*70,0,7);g.stroke();g.globalAlpha=1;}
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const tween=(o,k,to,ms)=>new Promise(r=>{const from=o[k],t0=performance.now();(function s(){const p=Math.min(1,(performance.now()-t0)/ms);o[k]=from+(to-from)*(1-Math.pow(1-p,3));p<1?requestAnimationFrame(s):r();})();});
function burst(x,y,c,n=14){for(let i=0;i<n;i++)st.pt.push({x,y,vx:(Math.random()-.5)*4,vy:-Math.random()*3,c,life:30+Math.random()*20});}

// ===== 戦闘 =====
const $=id=>document.getElementById(id);
let busy=false, gained=[], hp=100;
function msg(s){$('msg').innerHTML=s;}
function newEnemy(){st.en=makeEnemy(S.floor);st.en.max=st.en.hp;st.ealpha=0;tween(st,'ealpha',1,400);gained=[];
  msg(`${st.en.name}があらわれた！`);renderCmds();updTop();}
function updTop(){$('floor').textContent=S.floor;$('cnt').textContent=Object.keys(S.learned).length;$('all').textContent=IDS.length;}
function renderCmds(){const box=$('cmds');box.innerHTML='';
  const list=Object.keys(S.learned).sort((a,b)=>tier(a)-tier(b)||IDS.indexOf(a)-IDS.indexOf(b));
  for(const id of list){const b=document.createElement('button');b.className='cmd'+(kids(id).some(k=>!S.learned[k])?' hint':'');
    b.innerHTML=`${T[id].n}<small>×${T[id].h}</small>`;b.disabled=busy;b.onclick=()=>act(id);box.appendChild(b);}
  const hb=document.createElement('div');hb.style.cssText='grid-column:1/3;font-size:13px;color:#9fb0ff;padding:2px 6px';hb.textContent=`HP ${Math.max(0,hp)} / 100`;box.appendChild(hb);}
function hiraChance(id){const fresh=kids(id).filter(k=>!S.learned[k]);if(!fresh.length)return null;
  // 強い敵ほど閃きやすい（ロマサガ式）。最初の数回は出やすく
  const total=Object.keys(S.learned).length; const base= total<3?.45:.28; const pr=base+Math.min(.15,S.floor*.01);
  return Math.random()<pr?fresh[Math.floor(Math.random()*fresh.length)]:null;}

async function act(id){if(busy)return;busy=true;renderCmds();sfx.sel();
  let use=id; const hira=hiraChance(id);
  if(hira){ // 閃きの演出
    st.dark=0;tween(st,'dark',.55,200);st.bulb=1;sfx.hira();msg(`${T[id].n}…　<b style="color:#ffd75e">💡 閃いた！</b>`);
    await wait(650);S.learned[hira]={at:S.floor,uses:0};gained.push(hira);use=hira;
    st.banner={s:T[hira].n,c:T[hira].c,life:80};save();updTop();await wait(700);st.bulb=0;tween(st,'dark',0,300);
  }
  const t=T[use]; S.learned[use].uses++; msg(`${t.n}！`);
  const h=st.hero; const dash=t.st==='dash'||t.st==='shadow';
  await tween(h,'x',dash?118:96,dash?120:200);
  let dmgTotal=0;
  for(let i=0;i<t.h;i++){
    const kind={thrust:'thrust',bolt:'bolt',spin:'spin',snow:'snow'}[t.st]||'slash';
    const a=t.st==='cross'?(i%2?-.8:.8):(-.9+Math.random()*1.8*.5+(i%2)*.6);
    st.fx.push({k:kind,a:a+i,o:(i%5-2)*7,c:t.c,life:14,max:14}); if(kind==='bolt'||t.p>=40)st.fx.push({k:'ring',c:t.c,life:20,max:20});
    sfx.slash(); await wait(70); sfx.hit();
    const d=Math.max(1,Math.round(t.p*(0.85+Math.random()*.3)*(1+tier(use)*.12))); dmgTotal+=d; st.en.hp-=d;
    st.ef=4; st.eshake=6; st.shake=t.p>=40?7:3; burst(st.ex,st.ey,t.c,6);
    st.fl.push({s:d,x:st.ex+(Math.random()-.5)*30,y:st.ey-10-(i%3)*8,c:'#fff',life:40,big:t.p>=40});
    await wait(Math.max(70,260/t.h));
  }
  if(t.h>1){st.fl.push({s:`${t.h}HIT ${dmgTotal}`,x:st.ex,y:st.ey-40,c:'#ffd75e',life:50,big:true});}
  await tween(h,'x',44,200);
  if(st.en.hp<=0){await victory();return;}
  // 敵の反撃
  await wait(250); msg(`${st.en.name}のこうげき！`); await tween(st,'ex',110,120); sfx.hurt();
  const d=Math.round(st.en.atk*(0.8+Math.random()*.4)); hp-=d; h.f=6; st.shake=4;
  st.fl.push({s:d,x:h.x,y:h.y-50,c:'#ff7a7a',life:40}); await tween(st,'ex',150,200);
  if(hp<=0){await defeat();return;}
  busy=false;renderCmds();msg('どうする？');
}
async function victory(){sfx.die();burst(st.ex,st.ey,st.en.col.b,40);await tween(st,'ealpha',0,500);sfx.win();
  $('winT').textContent=st.en.name.startsWith('【')?'ぬしを倒した！':'勝利！';
  const L=$('winList');L.innerHTML='';
  if(gained.length){gained.forEach((k,i)=>{const d=document.createElement('div');d.className='newt';d.style.animationDelay=(i*.15)+'s';d.innerHTML=`💡 ${T[k].n}<div style="font-size:11px;color:#cfd5ff">${T[T[k].par].n} から閃いた</div>`;L.appendChild(d);});}
  else{L.innerHTML='<p>今回は閃かなかった…</p>';}
  const rest=IDS.length-Object.keys(S.learned).length;
  const hintN=Object.keys(S.learned).filter(id=>kids(id).some(k=>!S.learned[k])).length;
  $('winSub').innerHTML=rest?`まだ閃いていない技が <b style="color:#ffd75e">${rest}</b> 個<br><span style="font-size:12px">💡のついた技を使うと、その先を閃くことがある（${hintN}個）</span>`:'全ての技を閃いた！';
  S.floor++;save();hp=100;$('win').hidden=false;}
async function defeat(){sfx.die();msg('やられた…');await wait(700);
  $('winT').textContent='やられた…';$('winList').innerHTML='<p>でも、閃いた技は残っている。</p>';
  $('winSub').textContent=`3戦前からやり直し`;S.floor=Math.max(1,S.floor-3);save();hp=100;$('win').hidden=false;}

function renderTree(){const mk=id=>{const ks=kids(id);const k=S.learned[id];
    let s=`<li class="${k?'k':'u'}">${k?T[id].n+`<i>${k.uses}回</i>`:'？？？'}`;
    if(ks.length&&k)s+='<ul>'+ks.map(mk).join('')+'</ul>';return s+'</li>';};
  $('tree').innerHTML='<ul>'+mk('kiru')+'</ul>';}

$('start').onclick=()=>{ac();$('title').hidden=true;newEnemy();busy=false;renderCmds();};
$('next').onclick=()=>{$('win').hidden=true;busy=false;newEnemy();};
const openTree=()=>{renderTree();$('treeSheet').hidden=false;};
$('treeBtn').onclick=openTree;$('treeBtn2').onclick=openTree;
$('treeClose').onclick=()=>{$('treeSheet').hidden=true;};
$('reset').onclick=()=>{if(confirm('覚えた技を全部消して最初からにしますか？')){localStorage.removeItem(SAVE);location.reload();}};
updTop();renderCmds();requestAnimationFrame(loop);
