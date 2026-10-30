'use strict';
const $=id=>document.getElementById(id);
let busy=true,gained=[],lastUsed=null,curNode=null;
const msg=s=>{$('msg').innerHTML=s;};
function updTop(){$('floor').textContent=S.floor;$('cnt').textContent=nLearned();$('all').textContent=IDS.length;$('area').textContent=areaOf(S.floor).n;}
function hpLine(){return `HP ${Math.max(0,S.hp)} / ${maxHp()}`;}

// ===== 分かれ道 =====
function spPool(){const a=AREAS.indexOf(areaOf(S.floor));const lo=Math.min(a*2,6),hi=Math.min(lo+4,SPECIES.length);const out=[];for(let i=lo;i<hi;i++)out.push(i);return out;}
const pick=a=>a[Math.floor(Math.random()*a.length)];
function genChoices(){
  if(S.floor===1)return [{kind:'enemy',sp:0,rank:'mid'}];
  if(S.floor%5===0)return [{kind:'enemy',sp:pick(spPool()),rank:'boss'}];
  const ranks=['weak','mid','strong'].sort(()=>Math.random()-.5).slice(0,2);
  const c=ranks.map(r=>({kind:'enemy',sp:pick(spPool()),rank:r}));
  if(c[0].sp===c[1].sp)c[1].sp=pick(spPool());
  const low=S.hp<maxHp()*.6;if(Math.random()<(low?.55:.25))c[Math.floor(Math.random()*2)]={kind:'spring'};
  return c;}
function thumb(node){const c=document.createElement('canvas');c.width=72;c.height=72;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
  if(node.kind==='spring'){x.fillStyle='#2a6ad8';x.beginPath();x.ellipse(36,52,26,10,0,0,7);x.fill();x.fillStyle='#8ad0ff';x.fillRect(33,14,6,36);x.fillRect(24,20,4,14);x.fillRect(44,20,4,14);x.fillStyle='#fff';x.fillRect(34,14,2,10);return c;}
  const e=makeEnemy(node.sp,node.rank,S.floor);const sc=Math.floor(64/e.size);drawMap(x,e.map,e.col,(72-e.size*sc)/2,(72-e.size*sc)/2,sc,false);return c;}
function showPath(){const ch=genChoices();
  if(ch.length===1&&S.floor===1){startNode(ch[0]);return;}
  $('pathT').textContent=S.floor%5===0?`第${S.floor}戦　ぬしが待っている`:`第${S.floor}戦　どちらへ進む？`;
  $('pathHp').innerHTML=`${hpLine()}　<span style="color:#9fb0ff">強い敵ほど 💡閃きやすい</span>`;
  const box=$('paths');box.innerHTML='';
  ch.forEach((n,i)=>{const b=document.createElement('button');b.className='path';b.style.animationDelay=(i*.08)+'s';b.appendChild(thumb(n));
    const d=document.createElement('div');
    if(n.kind==='spring')d.innerHTML=`<b>⛲ 泉</b><span>HPを60%回復する<br>（戦わずに1戦進む）</span>`;
    else{const R=RANK[n.rank],sp=SPECIES[n.sp],kn=S.known[n.sp]||{};
      d.innerHTML=`<b>${(n.rank==='boss'?'【ぬし】':n.rank==='strong'?'あばれ':'')+sp.n}</b><span>強さ ${'★'.repeat(R.star)}<br>閃きやすさ ${'💡'.repeat(R.star)}<br>弱点 ${kn.w?`<i style="color:${TCOL[sp.w]}">${sp.w}</i>`:'？'}</span>`;}
    b.appendChild(d);b.onclick=()=>{$('pathSheet').hidden=true;sfx.sel();startNode(n);};box.appendChild(b);});
  $('pathSheet').hidden=false;}
async function startNode(n){curNode=n;
  if(n.kind==='spring'){sfx.heal();const add=Math.round(maxHp()*.6);S.hp=Math.min(maxHp(),S.hp+add);msg(`泉で休んだ。HPが ${add} 回復した。`);S.floor++;save();updTop();renderCmds();await wait(900);showPath();return;}
  st.en=makeEnemy(n.sp,n.rank,S.floor);st.ealpha=0;tween(st,'ealpha',1,400);gained=[];lastUsed=null;busy=false;
  msg(`${st.en.name}があらわれた！`+(S.floor===2&&!S.tips.weak?'<br><span style="font-size:13px;color:#ffe9a0">敵には弱点がある。流派（斬・突・払）を変えて試そう</span>':''));
  if(S.floor===2)S.tips.weak=1;renderCmds();updTop();}

// ===== コマンド =====
function renderCmds(){const box=$('cmds');box.innerHTML='';const e=st.en,kn=e?(S.known[e.sp]||{}):{};
  const list=Object.keys(S.learned).sort((a,b)=>(T[a].t==='連')-(T[b].t==='連')||tier(a)-tier(b)||IDS.indexOf(a)-IDS.indexOf(b));
  for(const id of list){const t=T[id];const b=document.createElement('button');b.className='cmd'+(kids(id).some(k=>!S.learned[k])?' hint':'');
    let mark='';if(e&&t.t!=='連'){if(kn.w&&t.t===e.spec.w)mark='<em class="w">◎</em>';else if(kn.r&&t.t===e.spec.r)mark='<em class="r">△</em>';}
    b.innerHTML=`<span class="ty" style="background:${TCOL[t.t]}">${t.t}</span>${t.n}<small>×${t.h}</small>${mark}`;b.disabled=busy;b.onclick=()=>act(id);box.appendChild(b);}
  const hb=document.createElement('div');hb.className='hpline';hb.innerHTML=`${hpLine()}`+(lastUsed?`　<span style="color:#9fb0ff">前の技：${T[lastUsed].n}</span>`:'');box.appendChild(hb);}

// ===== 閃き判定 =====
const anc2=id=>{if(T[id].t==='連'||tier(id)<2)return null;let x=id;while(tier(x)>2)x=T[x].par;return x;};
function tryHira(id){const R=RANK[st.en.rank];S.pity=S.pity||0;
  // 連携閃き：ちがう流派の技を続けて使った
  const a2=lastUsed&&anc2(lastUsed),b2=anc2(id);if(a2&&b2&&T[a2].t!==T[b2].t){const c=comboOf(a2,b2);if(c&&!S.learned[c]){if(Math.random()<R.hira+.08+S.pity){S.pity=0;return {id:c,combo:true};}S.pity+=.05;}}
  const fresh=kids(id).filter(k=>!S.learned[k]);if(!fresh.length)return null;
  const pr=(nLearned()<3?.45:R.hira)+Math.min(.1,S.floor*.006)+S.pity;
  if(Math.random()<pr){S.pity=0;return {id:pick(fresh),combo:false};}S.pity+=.07;return null;}

async function act(id){if(busy)return;busy=true;renderCmds();sfx.sel();
  let use=id;const hr=tryHira(id);
  if(hr){st.dark=0;tween(st,'dark',.55,200);st.bulb=hr.combo?2:1;hr.combo?sfx.combo():sfx.hira();
    msg(hr.combo?`${T[lastUsed].n} → ${T[id].n}…　<b style="color:#ff9ad0">💡 連携閃き！</b>`:`${T[id].n}…　<b style="color:#ffd75e">💡 閃いた！</b>`);
    await wait(hr.combo?900:650);S.learned[hr.id]={at:S.floor,uses:0};S.order.push(hr.id);gained.push(hr.id);use=hr.id;
    st.banner={s:T[hr.id].n,c:T[hr.id].c,life:85,combo:hr.combo};S.hp+=6;save();updTop();await wait(750);st.bulb=0;tween(st,'dark',0,300);}
  const t=T[use],e=st.en;S.learned[use].uses++;
  const mult=t.t==='連'?1.3:t.t===e.spec.w?2:t.t===e.spec.r?.5:1;
  msg(`${t.n}！`);const h=st.hero,dash=t.st==='dash'||t.st==='shadow';
  await tween(h,'x',dash?126:104,dash?120:200);let total=0;
  for(let i=0;i<t.h;i++){const kind={thrust:'thrust',bolt:'bolt',spin:'spin',snow:'snow',shadow:'shadow'}[t.st]||'slash';
    const a=t.st==='cross'?(i%2?-.8:.8):(-.9+Math.random()*.9+(i%2)*.6);
    st.fx.push({k:kind,a:a+i,o:(i%5-2)*7,c:t.c,life:14,max:14});if(kind==='bolt'||t.p>=40)st.fx.push({k:'ring',c:t.c,life:20,max:20});
    sfx.slash();await wait(70);sfx.hit();
    const d=Math.max(1,Math.round(t.p*(0.85+Math.random()*.3)*(1+tier(use)*.12)*mult*(1+(S.best-1)*.06)));total+=d;e.hp-=d;
    st.ef=4;st.eshake=mult>=2?9:6;st.shake=t.p>=40||mult>=2?6:3;burst(st.ex,st.ey,t.c,6);
    st.fl.push({s:d,x:st.ex+(Math.random()-.5)*30,y:st.ey-10-(i%3)*8,c:mult>=2?'#ffe14a':mult<1?'#9aa0b8':'#fff',life:40,big:t.p>=40||mult>=2});
    await wait(Math.max(70,260/t.h));}
  if(t.t!=='連'&&(t.t===e.spec.w||t.t===e.spec.r)){const kn=S.known[e.sp]||(S.known[e.sp]={});const isW=t.t===e.spec.w;
    st.fl.push({s:isW?'弱点！':'いまひとつ…',x:st.ex,y:st.ey-46,c:isW?'#ffe14a':'#9aa0b8',life:55,big:true});isW?sfx.weak():sfx.resist();
    if(isW&&!kn.w){kn.w=1;msg(`弱点！　${e.spec.n}は「${e.spec.w}」に弱い`);}else if(!isW&&!kn.r){kn.r=1;msg(`${e.spec.n}に「${e.spec.r}」は効きにくい`);}save();}
  else if(t.h>1)st.fl.push({s:`${t.h}HIT ${total}`,x:st.ex,y:st.ey-46,c:'#ffd75e',life:50,big:true});
  lastUsed=use;await tween(h,'x',50,200);
  if(e.hp<=0){await victory();return;}
  await wait(300);msg(`${e.name}のこうげき！`);await tween(st,'ex',130,120);sfx.hurt();
  const d=Math.round(e.atk*(0.8+Math.random()*.4));S.hp-=d;h.f=6;st.shake=4;st.fl.push({s:d,x:h.x,y:GY-50,c:'#ff7a7a',life:40});await tween(st,'ex',172,200);
  if(S.hp<=0){await defeat();return;}
  save();busy=false;renderCmds();msg('どうする？');}

async function victory(){const e=st.en;sfx.die();burst(st.ex,st.ey,e.col.b,40);await tween(st,'ealpha',0,500);sfx.win();
  const heal=Math.round(maxHp()*(e.rank==='boss'?1:.25));S.hp=Math.min(maxHp(),S.hp+heal);S.floor++;S.best=Math.max(S.best,S.floor);save();updTop();
  $('winT').textContent=e.rank==='boss'?'ぬしを倒した！':'勝利！';const L=$('winList');L.innerHTML='';
  if(gained.length)gained.forEach((k,i)=>{const d=document.createElement('div');d.className='newt'+(T[k].t==='連'?' combo':'');d.style.animationDelay=(i*.15)+'s';
    d.innerHTML=`💡 ${T[k].n}<div style="font-size:11px;color:#cfd5ff">${T[k].t==='連'?T[T[k].combo[0]].n+' ＋ '+T[T[k].combo[1]].n+' の連携':T[T[k].par].n+' から閃いた'}</div>`;L.appendChild(d);});
  else L.innerHTML='<p>今回は閃かなかった…</p>';
  const rest=IDS.length-nLearned();
  const t2=[...new Set(Object.keys(S.learned).map(anc2).filter(Boolean))];
  const comboReady=t2.some(a=>t2.some(b=>T[a].t!==T[b].t&&!S.learned[comboOf(a,b)]));
  let tip=`まだ閃いていない技が <b style="color:#ffd75e">${rest}</b> 個`;
  if(comboReady&&!S.learned[COMBOS.find(c=>S.learned[c])])tip+=`<br><span style="font-size:12px;color:#ff9ad0">ちがう流派の技を続けて使うと、何かが起きるかもしれない…</span>`;
  else tip+=`<br><span style="font-size:12px">💡のついた技を使うと、その先を閃くことがある</span>`;
  $('winSub').innerHTML=`${tip}<br><span style="font-size:12px;color:#9fb0ff">HP +${heal}（${hpLine()}）</span>`;$('win').hidden=false;}
async function defeat(){sfx.die();msg('やられた…');await wait(700);
  $('winT').textContent='やられた…';$('winList').innerHTML='<p>でも、閃いた技は残っている。</p>'+gained.map(k=>`<div class="newt${T[k].t==='連'?' combo':''}">💡 ${T[k].n}</div>`).join('');
  $('winSub').textContent=`第${S.floor}戦をやり直す（HP全快）`;S.hp=maxHp();save();updTop();$('win').hidden=false;}

// ===== 系図 =====
function renderTree(){const mk=id=>{const ks=kids(id),k=S.learned[id];
    let s=`<li class="${k?'k':'u'}">${k?`<span class="ty" style="background:${TCOL[T[id].t]}">${T[id].t}</span>${T[id].n}<i>${k.uses}回</i>`:'？？？'}`;
    if(ks.length&&k)s+='<ul>'+ks.map(mk).join('')+'</ul>';return s+'</li>';};
  const cs=COMBOS.map(c=>S.learned[c]?`<div class="cb k">${T[c].n}<small>${T[T[c].combo[0]].n}＋${T[T[c].combo[1]].n}</small></div>`:'<div class="cb u">？？？</div>').join('');
  $('tree').innerHTML='<ul>'+mk('kiru')+'</ul>'+`<h3>連携技 ${COMBOS.filter(c=>S.learned[c]).length} / ${COMBOS.length}</h3><div class="cbs">${cs}</div>`;}
function titleOf(){let best='kiru',bu=-1;for(const k in S.learned)if(k!=='kiru'&&S.learned[k].uses>bu){best=k;bu=S.learned[k].uses;}
  const cnt={斬:0,突:0,払:0,連:0};for(const k in S.learned)cnt[T[k].t]+=S.learned[k].uses;const top=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0];
  return {main:T[best].n,school:{斬:'斬の流れ',突:'突の流れ',払:'払の流れ',連:'連携の流れ'}[top]};}
async function shareImage(){await document.fonts.load('20px DotGothic16');
  const rows=[];(function dfs(id,d){const k=S.learned[id];rows.push({d,id,k});if(k)kids(id).forEach(c=>dfs(c,d+1));})('kiru',0);
  const cl=COMBOS.filter(c=>S.learned[c]);const Wc=720,Hc=230+rows.length*34+(cl.length?80+Math.ceil(cl.length/3)*40:0)+70;
  const c=document.createElement('canvas');c.width=Wc;c.height=Hc;const x=c.getContext('2d');
  const gr=x.createLinearGradient(0,0,0,Hc);gr.addColorStop(0,'#24308a');gr.addColorStop(1,'#0e1450');x.fillStyle=gr;x.fillRect(0,0,Wc,Hc);
  x.strokeStyle='#fff';x.lineWidth=6;x.strokeRect(14,14,Wc-28,Hc-28);x.strokeStyle='#1a2470';x.lineWidth=2;x.strokeRect(22,22,Wc-44,Hc-44);
  const ti=titleOf();x.textAlign='center';x.fillStyle='#9fb0ff';x.font='24px DotGothic16';x.fillText('閃き道場　わたしの技の系図',Wc/2,68);
  x.fillStyle='#ffd75e';x.font='44px DotGothic16';x.fillText(`「${ti.main}」の使い手`,Wc/2,126);
  x.fillStyle='#fff';x.font='22px DotGothic16';x.fillText(`${ti.school}　閃いた技 ${nLearned()}/${IDS.length}　最高 第${S.best}戦`,Wc/2,166);
  x.textAlign='left';let y=214;const pos={};
  rows.forEach(r=>{const px=60+r.d*58;pos[r.id]={x:px,y};
    if(T[r.id].par&&pos[T[r.id].par]){const p=pos[T[r.id].par];x.strokeStyle='rgba(159,176,255,.5)';x.lineWidth=2;x.beginPath();x.moveTo(p.x+10,p.y+6);x.lineTo(p.x+10,y-8);x.lineTo(px-6,y-8);x.stroke();}
    if(r.k){x.fillStyle=TCOL[T[r.id].t];x.fillRect(px,y-22,24,24);x.fillStyle='#000';x.font='18px DotGothic16';x.fillText(T[r.id].t,px+3,y-3);
      x.fillStyle='#fff';x.font='24px DotGothic16';x.fillText(T[r.id].n,px+32,y);x.fillStyle='#9fb0ff';x.font='16px DotGothic16';x.fillText(`${r.k.uses}回`,px+40+x.measureText(T[r.id].n).width*1.5,y);}
    else{x.fillStyle='#56608f';x.font='24px DotGothic16';x.fillText('？？？',px,y);}y+=34;});
  if(cl.length){y+=30;x.fillStyle='#ff9ad0';x.font='24px DotGothic16';x.fillText(`連携技 ${cl.length}/${COMBOS.length}`,60,y);y+=16;
    cl.forEach((k,i)=>{const cx=60+(i%3)*205,cy=y+Math.floor(i/3)*40;x.strokeStyle='#ff9ad0';x.lineWidth=2;x.strokeRect(cx,cy,190,32);x.fillStyle='#fff';x.font='20px DotGothic16';x.fillText(T[k].n,cx+10,cy+23);});
    y+=Math.ceil(cl.length/3)*40;}
  x.fillStyle='#7a84b8';x.font='18px DotGothic16';x.textAlign='center';x.fillText('kiichi10.github.io/game-prototypes/i1/',Wc/2,Hc-40);
  $('shareImg').src=c.toDataURL('image/png');$('shareSheet').hidden=false;}

// ===== ボタン =====
$('start').onclick=()=>{ac();$('title').hidden=true;if(S.floor===1&&!st.en)startNode({kind:'enemy',sp:0,rank:'mid'});else showPath();};
$('next').onclick=()=>{$('win').hidden=true;showPath();};
const openTree=()=>{renderTree();$('treeSheet').hidden=false;};
$('treeBtn').onclick=openTree;$('treeBtn2').onclick=openTree;
$('treeClose').onclick=()=>{$('treeSheet').hidden=true;};
$('shareBtn').onclick=shareImage;$('shareClose').onclick=()=>{$('shareSheet').hidden=true;};
$('shareDl').onclick=()=>{const a=document.createElement('a');a.download='閃き道場_系図.png';a.href=$('shareImg').src;a.click();};
$('reset').onclick=()=>{if(confirm('覚えた技を全部消して最初からにしますか？')){localStorage.removeItem(SAVE);localStorage.removeItem('hirameki_v1');location.reload();}};
if(S.floor>1)$('start').textContent=`つづきから（第${S.floor}戦）`;
updTop();renderCmds();requestAnimationFrame(loop);
