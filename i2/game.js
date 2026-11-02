'use strict';
const $=id=>document.getElementById(id);
// ===== 音 =====
let AC; const ac=()=>AC||(AC=new (window.AudioContext||window.webkitAudioContext)());
function tone(f,d,type='triangle',v=.08,when=0,slide=0){const a=ac(),o=a.createOscillator(),gn=a.createGain(),t=a.currentTime+when;o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide),t+d);gn.gain.setValueAtTime(v,t);gn.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(gn).connect(a.destination);o.start(t);o.stop(t+d+.02);}
const sfx={
  take(c){const f=392*Math.pow(2,Math.min(c,16)*2/12);tone(f,.16,'triangle',.09);tone(f*2,.08,'sine',.03);},
  flip(){tone(700,.04,'square',.025);tone(1000,.04,'square',.02,.03);},
  draw(){tone(180,.06,'square',.03);tone(120,.05,'square',.02,.03);},
  coin(){tone(1568,.08,'square',.04);tone(2093,.18,'square',.04,.06);},
  chest(){[0,4,7,12].forEach((s,i)=>tone(523*Math.pow(2,s/12),.2,'square',.05,i*.08));},
  joker(){[0,5,9,12,17].forEach((s,i)=>tone(659*Math.pow(2,s/12),.14,'square',.04,i*.05));},
  stairs(){[12,7,4,0,-5].forEach((s,i)=>tone(523*Math.pow(2,s/12),.22,'triangle',.08,i*.1));},
  no(){tone(110,.15,'square',.05);},
  clear(){[0,4,7,12,16,19,24].forEach((s,i)=>tone(392*Math.pow(2,s/12),.18,'square',.05,i*.07));},
  buy(){tone(880,.1,'square',.05);tone(1320,.2,'square',.05,.08);},
  hurt(){tone(200,.25,'sawtooth',.07,0,-120);tone(90,.3,'square',.05,.05);},
  slay(){tone(300,.08,'square',.06,0,500);tone(900,.15,'square',.05,.08);},
};
// ===== 乱数（日付で全員同じ） =====
const today=new Date();const DKEY=`${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
function rng(seed){let s=0;for(const ch of String(seed))s=(s*31+ch.charCodeAt(0))>>>0;s=s||1;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
const RN=['','A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const LOOT={gold:'💰',chest:'🎁',stairs:'🪜',monster:'👹'};
const ZONES=[{n:'石の回廊',from:1},{n:'水の洞',from:5},{n:'溶岩の底',from:10}];
const zoneOf=f=>f>=10?2:f>=5?1:0;
// ===== 道具（宝箱から） =====
const RELICS={
  wild:{n:'万能の鍵',d:'1階に1回、どのカードでも取れる（押してから取る）',act:true,ic:'🗝'},
  undo:{n:'時の砂',d:'1階に1回、最後の1手を戻す',act:true,ic:'⏳'},
  candle:{n:'長いろうそく',d:'毎階、山札が2枚増える',ic:'🕯'},
  ring:{n:'連鎖の指輪',d:'5連鎖ごとに山札が1枚増える（1階に1回）',ic:'💍'},
  thief:{n:'盗賊の手袋',d:'💰が1.5倍',ic:'🧤'},
  lantern:{n:'ランタン',d:'山札の次の3枚が見える',ic:'🏮'},
  eye:{n:'鷹の目',d:'山札が残り2枚以下になると、数字が2ちがいでも取れる',ic:'👁',unlock:3},
  map:{n:'古地図',d:'🪜が1段浅いところに出る',ic:'🗺',unlock:4},
  hammer:{n:'つるはし',d:'1階に1回、どのカードでも1枚くだく（連鎖は切れない）',act:true,ic:'⛏',unlock:5},
  bell:{n:'幸運の鈴',d:'宝箱の選択肢が4つになる',ic:'🔔',unlock:6},
  crown:{n:'王冠',d:'連鎖のごほうびが2倍',ic:'👑',unlock:8},
  amulet:{n:'魔除けのお守り',d:'1階に1回、魔物の攻撃を防ぐ',ic:'🧿',unlock:7},
};
// ===== 宿屋（ずっと効く） =====
const PERKS={
  stock:{n:'大きな背負い袋',d:'毎階、山札+1',ic:'🎒',cost:[80,200,400]},
  joker:{n:'お守りのジョーカー',d:'最初からジョーカーを1枚持つ',ic:'🃏',cost:[250]},
  coin:{n:'金貨の嗅覚',d:'💰を拾うたび+1',ic:'👃',cost:[120,300]},
  lamp:{n:'古いランプ',d:'最初からランタンを持つ',ic:'🏮',cost:[180]},
  heart:{n:'丈夫な鎧',d:'最大❤+1（魔物に強くなる）',ic:'🛡',cost:[150,350]},
};
let M=JSON.parse(localStorage.getItem('mekuri_meta')||'null')||{bank:0,perks:{},best:0,unlocked:[],day:{},runs:0};
const saveM=()=>localStorage.setItem('mekuri_meta',JSON.stringify(M));
const pool=()=>Object.keys(RELICS).filter(k=>!RELICS[k].unlock||M.unlocked.includes(k));
const has=k=>R.relics.includes(k);
// ===== 状態 =====
let R,F,busy=false;
const CHAIN=[{n:4,ic:'💰'},{n:7,ic:'🃏'},{n:10,ic:'🎁'}];
const maxHearts=()=>3+(M.perks.heart||0)+(R?CLS[R.cls].heart:0);
function newRun(){const cls=M.cls&&CLS[M.cls]&&(M.best>=(CLS[M.cls].unlock||0))?M.cls:'exp';R={cls,floor:1,gold:0,relics:[],jokers:M.perks.joker?1:0,log:[],maxChain:0,hearts:0,trip:[]};R.hearts=maxHearts();if(cls==='mage')R.relics.push('wild','undo');bgmStart(0);if(M.perks.lamp&&!has('lantern'))R.relics.push('lantern');M.runs++;saveM();startFloor();}
function startFloor(){
  const rand=rng(DKEY+'-'+R.floor),type=floorType(R.floor);
  const deck=[];for(let s=0;s<4;s++)for(let r=1;r<=13;r++)deck.push({r,s});
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  const cols=[];for(let c=0;c<7;c++)cols.push(deck.splice(0,5));
  let sRow=R.floor<=2?2:R.floor<=5?1:0;if(has('map'))sRow=Math.min(3,sRow+1);
  const sc=Math.floor(rand()*7);if(type==='boss'){const bc=cols[sc][has('map')?1:0];bc.loot='monster';bc.mon='boss';}else cols[sc][sRow].loot='stairs';
  const c1=(sc+1+Math.floor(rand()*6))%7;cols[c1][3].loot=cols[c1][3].loot||'chest';
  let c2=(c1+1+Math.floor(rand()*5))%7;if(c2===sc)c2=(c2+1)%7;cols[c2][0].loot=cols[c2][0].loot||'chest';
  if(R.floor>=4){let m=0;const want=R.floor>=15?4:R.floor>=12?3:R.floor>=8?2:1;while(m<want){const c=Math.floor(rand()*7),r=1+Math.floor(rand()*3);if(!cols[c][r].loot){const ks=kindsOf(R.floor);cols[c][r].loot='monster';cols[c][r].mon=ks[Math.floor(rand()*ks.length)];m++;}}}
  if(type==='vault'){let q=0;while(q<1){const c=Math.floor(rand()*7);if(!cols[c][2].loot){cols[c][2].loot='chest';q++;}}}
  let n=0;const golds=type==='vault'?18:10;while(n<golds){const c=Math.floor(rand()*7),r=Math.floor(rand()*5);if(!cols[c][r].loot){cols[c][r].loot='gold';cols[c][r].amt=1+Math.floor(rand()*3)+Math.floor(R.floor/4);n++;}}
  cols.forEach(col=>col[col.length-1].up=true);
  const stock=deck;const want=Math.max(4,16-Math.min(13,R.floor-1)+(M.perks.stock||0)+(has('candle')?2:0)+(type==='boss'?4:type==='vault'?-3:0)+(R.cls==='knight'?-3:0));
  while(stock.length>want+1)stock.shift();while(stock.length<want+1)stock.unshift({r:1+Math.floor(rand()*13),s:Math.floor(rand()*4)});
  const waste=[stock.pop()];waste[0].up=true;
  F={cols,stock,waste,chain:0,got:{},stairs:false,hist:[],used:{},armed:null,goldF:0,rand,dealing:true,type,bossCnt:5,ev:{mon:0,chest:0,relics:[],chain:0,hurt:0,last:0,kinds:[],boss:0,killer:null}};
  $('app').dataset.zone=zoneOf(R.floor);$('board').dataset.type=type;$('fl').textContent=R.floor;render();F.dealing=false;
  setTimeout(seeMon,800);}
const wtop=()=>F.waste[F.waste.length-1];
function ok(card){if(F.armed==='wild'||F.armed==='hammer')return true;const w=wtop();if(w.joker)return true;
  const d=Math.abs(card.r-w.r),lim=has('eye')&&F.stock.length<=2?2:1;return (d>=1&&d<=lim)||d===12||(lim===2&&d===11);}
function playable(){const out=[];F.cols.forEach((col,ci)=>{if(col.length&&ok(col[col.length-1]))out.push(ci);});return out;}

// ===== 描画 =====
function lootIc(l,sc,c){return ic(l==='gold'?'coin':l==='chest'?'chest':l==='stairs'?'stairs':c&&c.mon?MON[c.mon].sp:curMon(),sc);}
function seeMon(){if(!F||F.ended)return;M.seen=M.seen||{};const list=[];F.cols.forEach(col=>{const n=col[col.length-1];if(n&&n.up&&n.loot==='monster')list.push(n.mon);});if(F.type==='boss')list.push('boss');const k=list.find(x=>!M.seen[x]);if(!k||!$('monSheet').hidden)return;M.seen[k]=1;saveM();$('monT').innerHTML=`${ic(MON[k].sp,3,'in')} ${MON[k].n}`;$('monP').textContent=MON[k].d;$('monSheet').hidden=false;}
function cardEl(c,cls=''){const e=document.createElement('div');
  if(c.joker){e.className='card joker '+cls;e.innerHTML=`<span class="jk">${ic('joker',3)}</span>`;return e;}
  if(!c.up){e.className='card back '+cls;const dark=F&&F.type==='dark';e.innerHTML=c.loot&&!dark?`<span class="bl">${c.mon==='mimic'?ic('chest',2):lootIc(c.loot,2,c)}</span>`:'';return e;}
  e.className='card '+cls+(c.s===1||c.s===2?' red':'')+(c.flipNow?' flip':'');c.flipNow=false;const mon=c.loot==='monster';
  e.innerHTML=`<span class="r">${RN[c.r]}</span><span class="s">${ic(SUIT_SP[c.s],1)}</span><span class="big${mon?' monb':''}">${mon?lootIc('monster',3,c):ic(SUIT_SP[c.s],3)}</span>`+(c.loot&&!mon?`<span class="loot">${lootIc(c.loot,2)}</span>`:'')+(mon&&c.mon!=='boss'?`<span class="cnt">${c.cnt==null?MON[c.mon].every:c.cnt}</span>`:'');return e;}
function render(){
  const b=$('board');b.innerHTML='';const pl=playable();
  const cw=(b.clientWidth-16-6*4)/7,chh=cw*7/5,off=chh*.42;
  F.cols.forEach((col,ci)=>{const ce=document.createElement('div');ce.className='col';ce.style.height=(chh+off*4)+'px';
    col.forEach((c,ri)=>{const last=ri===col.length-1;const e=cardEl(c,(last&&pl.includes(ci)?'ok':'')+(last&&c.up&&c.loot==='monster'?' mon':'')+(F.dealing?' deal':''));e.style.top=(ri*off)+'px';if(F.dealing)e.style.animationDelay=(ri*7+ci)*16+'ms';if(last)e.onclick=()=>take(ci,e);ce.appendChild(e);});b.appendChild(ce);});
  const st=$('stock');st.innerHTML='';
  if(F.stock.length){const e=document.createElement('div');e.className='card back';e.innerHTML=`<span class="n">${F.stock.length}</span>`;st.appendChild(e);st.onclick=draw;}
  else{st.innerHTML='<div class="card back" style="filter:grayscale(1)"><span class="n" style="font-size:15px">終える</span></div>';st.onclick=()=>{if(!busy)endFloor(F.cols.every(c=>!c.length));};}
  const w=$('waste');w.innerHTML='';w.appendChild(cardEl(wtop()));
  ['j0','j1'].forEach((id,i)=>{const s=$(id);s.innerHTML='';if(R.jokers>i){const e=cardEl({joker:true});e.onclick=useJoker;s.appendChild(e);}});
  // 連鎖バー
  const mx=Math.max(12,F.chain+2);$('chainfill').style.width=Math.min(100,F.chain/mx*100)+'%';
  $('chaintxt').textContent=F.chain>=2?`${F.chain} 連鎖`:'連鎖';
  const bar=$('chainbar');bar.querySelectorAll('span').forEach(x=>x.remove());
  CHAIN.forEach(m=>{const sp=document.createElement('span');sp.textContent=m.ic;sp.style.left=(m.n/mx*100)+'%';if(F.got[m.n])sp.className='got';bar.appendChild(sp);});
  $('gold').textContent=R.gold;$('hearts').textContent='❤'.repeat(R.hearts)+'🖤'.repeat(Math.max(0,maxHearts()-R.hearts));
  const left=F.cols.reduce((a,c)=>a+c.length,0);
  $('left').textContent=(has('lantern')&&F.stock.length?'次 '+F.stock.slice(-3).reverse().map(c=>RN[c.r]).join(' ')+'　':'')+(F.type==='boss'&&!F.bossDead?`番人あと${F.bossCnt}　`:'')+`のこり${left}`+(F.stairs?' 🪜':'');
  const rl=$('relics');rl.innerHTML='';R.relics.forEach(k=>{const r=RELICS[k];const e=document.createElement('span');
    e.className='relic'+(r.act?(F.used[k]?' spent':F.armed===k?' armed':' use'):'');e.textContent=r.ic+' '+r.n;
    if(r.act&&!F.used[k])e.onclick=()=>useRelic(k);rl.appendChild(e);});
  renderDepth();setTimeout(tutorial,30);}
function renderDepth(){const cur=R?R.floor:1,dayBest=M.day[DKEY]||0,start=Math.max(1,Math.min(cur-3,M.best-6)),cells=[];
  for(let f=start;f<start+9;f++){const unl=Object.keys(RELICS).find(k=>RELICS[k].unlock===f&&!M.unlocked.includes(k));
    let ic=f===cur&&R?'🧍':unl?'🔒':f===M.best?'👑':f===dayBest?'🚩':'';
    cells.push(`<div class="cell${f<cur?' done':''}${f===cur&&R?' now':''}"><span class="ic">${ic}</span>B${f}${unl?`<br>${RELICS[unl].ic}`:''}</div>`);}
  const nx=Object.keys(RELICS).filter(k=>RELICS[k].unlock&&!M.unlocked.includes(k)).sort((a,b)=>RELICS[a].unlock-RELICS[b].unlock)[0];
  $('depth').innerHTML=`<div class="row">${cells.join('')}</div><div class="note">今日の最高 B${dayBest||'-'}　自己最高 B${M.best||'-'}${nx?`　次の解禁 B${RELICS[nx].unlock} ${RELICS[nx].ic}${RELICS[nx].n}`:''}</div>`;}
function toast(s){const t=document.createElement('div');t.className='toast';t.textContent=s;$('app').appendChild(t);setTimeout(()=>t.remove(),1000);}
function flyTo(from,ic,targetId){const r=from.getBoundingClientRect(),tr=$(targetId).getBoundingClientRect();const f=document.createElement('div');f.className='fly';f.textContent=ic;
  f.style.left=r.left+r.width/2-10+'px';f.style.top=r.top+'px';document.body.appendChild(f);requestAnimationFrame(()=>{f.style.left=tr.left+'px';f.style.top=tr.top+'px';f.style.transform='scale(.6)';});setTimeout(()=>f.remove(),650);}

// ===== 操作 =====
function gainGold(a,el){a=Math.round(a*(has('thief')?1.5:1)*(R.cls==='thief'?1.5:1))+(M.perks.coin||0);R.gold+=a;F.goldF+=a;if(el)flyTo(el,'💰','gold');setTimeout(sfx.coin,120);return a;}
function reveal(ci){const col=F.cols[ci];if(col.length){const n=col[col.length-1];if(!n.up){n.up=true;n.flipNow=true;setTimeout(sfx.flip,60);if(n.mon==='mimic')hurtP(1,'ミミックだ！','mimic');}}}
function chainReward(){const c=F.chain;R.maxChain=Math.max(R.maxChain,c);const x2=(has('crown')?2:1)*(F.type==='chain'?2:1);
  if(c===7||c===10)shake(c===10?9:5);
  if(c===4&&!F.got[4]){F.got[4]=1;const a=gainGold((3+R.floor)*x2);toast(`4連鎖！ 💰+${a}`);}
  else if(c===7&&!F.got[7]){F.got[7]=1;const n=Math.min(2-R.jokers,x2);if(n>0){R.jokers+=n;sfx.joker();toast(`7連鎖！ 🃏ジョーカー`);}else{const a=gainGold(8*x2);toast(`7連鎖！ 💰+${a}`);}}
  else if(c===10&&!F.got[10]){F.got[10]=1;toast('10連鎖！ 🎁');return true;}
  else if(c>10&&(c-10)%3===0){const a=gainGold(5*x2);toast(`${c}連鎖！ 💰+${a}`);}
  if(has('ring')&&c%5===0&&!F.used.ring){F.used.ring=true;F.stock.push({r:1+Math.floor(F.rand()*13),s:Math.floor(F.rand()*4)});setTimeout(()=>toast('💍 山札+1'),400);}
  return false;}
function take(ci,el){if(busy)return;const col=F.cols[ci],c=col[col.length-1];
  if(!ok(c)){sfx.no();el.animate([{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'none'}],{duration:180});return;}
  F.ev.last=ci;
  let chest=false,c0=null;
  if(F.armed==='hammer'){F.used.hammer=true;F.armed=null;col.pop();F.hist.push({t:'hammer',ci,c});tone(160,.15,'square',.07);toast('⛏ くだいた');}
  else{if(F.armed==='wild'){F.used.wild=true;F.armed=null;}
    c0=cloneAt(el);tutDone('take');col.pop();F.waste.push(c);F.chain++;F.ev.chain=Math.max(F.ev.chain,F.chain);F.hist.push({t:'take',ci,c});sfx.take(F.chain);chest=chainReward();}
  if(c.loot==='gold')gainGold(c.amt,el);
  if(c.loot==='stairs'&&!F.stairs){F.stairs=true;sfx.stairs();toast('🪜 階段を見つけた！');}
  if(c.loot==='chest'){sfx.chest();chest=true;}
  if(c.loot==='monster'){const k=c.mon,mk=MON[k];F.ev.mon++;F.ev.kinds.push(k);M.dex=M.dex||{};M.dex[k]=(M.dex[k]||0)+1;const a=gainGold(mk.gold(R.floor));sfx.slay();toast(`${mk.n}を退治！ 💰+${a}`);
    if(k==='mimic')chest=true;if(k==='boss'){F.bossDead=true;F.stairs=true;F.ev.boss=1;chest=true;shake(12);sfx.stairs();}}
  c.loot=null;reveal(ci);render();setTimeout(seeMon,350);
  if(c0){const ch=F.chain;flyToWaste(c0,wr=>sparks(wr,Math.min(3+ch*2,22),ch>=7));}
  if(chest){busy=true;setTimeout(()=>{busy=false;openChest();},450);return;}
  checkEnd();}
function hurtP(m,msg,kind){if(has('amulet')&&!F.used.amulet){F.used.amulet=true;toast('🧿 お守りが防いだ');return false;}
  R.hearts-=m;F.ev.hurt+=m;sfx.hurt();shake(9);toast(`${msg} ❤-${m}`);
  if(R.hearts<=0){R.hearts=0;F.ev.killer=kind;busy=true;const f=F;setTimeout(()=>{busy=false;if(F===f)endFloor(false,'dead');},600);return true;}return false;}
function monsterAttack(){let dead=false;
  F.cols.forEach(col=>{const c=col[col.length-1];if(!c||!c.up||c.loot!=='monster'||c.mon==='boss')return;const k=MON[c.mon];c.cnt=(c.cnt==null?k.every:c.cnt)-1;if(c.cnt>0)return;c.cnt=k.every;
    if(k.eff==='steal'){F.stock.splice(0,2);toast(`${k.n}が山札を2枚消した`);sfx.hurt();return;}if(k.eff==='burn')F.stock.splice(0,1);dead=hurtP(1,`${k.n}のこうげき！`,c.mon)||dead;});
  if(F.type==='boss'&&!F.bossDead&&--F.bossCnt<=0){F.bossCnt=5;dead=hurtP(1,'番人の気配！','boss')||dead;}return dead;}
function draw(){if(busy||!F.stock.length)return;if(F.armed==='wild')F.armed=null;const c0=cloneAt($('stock').firstChild);const c=F.stock.pop();c.up=true;F.waste.push(c);F.hist.push({t:'draw',c});F.chain=0;sfx.draw();tutDone('draw');
  const dead=monsterAttack();render();flyToWaste(c0);if(!dead)checkEnd();}
function useJoker(){if(busy||!R.jokers||wtop().joker)return;R.jokers--;F.waste.push({joker:true});F.hist.push({t:'joker'});sfx.joker();toast('🃏 どれでも取れる');render();}
function useRelic(k){if(k==='wild'||k==='hammer'){F.armed=F.armed===k?null:k;render();return;}
  if(k==='undo'){const h=F.hist.pop();if(!h){sfx.no();return;}F.used.undo=true;
    if(h.t==='draw'){F.stock.push(F.waste.pop());}
    else if(h.t==='joker'){F.waste.pop();R.jokers++;}
    else{const col=F.cols[h.ci];if(col.length)col[col.length-1].up=false;if(h.t==='take')F.waste.pop();h.c.up=true;col.push(h.c);}
    F.chain=0;render();}}
function openChest(){F.ev.chest++;const p=pool().filter(k=>!has(k));const box=$('picks');box.innerHTML='';
  if(!p.length){gainGold(10);toast('💰+10');checkEnd();return;}
  for(let i=p.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[p[i],p[j]]=[p[j],p[i]];}
  p.slice(0,has('bell')?4:3).forEach(k=>{const r=RELICS[k];const b=document.createElement('button');b.className='pick';b.innerHTML=`<b>${r.ic} ${r.n}</b>${r.d}`;
    b.onclick=()=>{R.relics.push(k);F.ev.relics.push(k);$('pickSheet').hidden=true;sfx.coin();if(k==='candle')for(let i=0;i<2;i++)F.stock.push({r:1+Math.floor(Math.random()*13),s:Math.floor(Math.random()*4)});render();checkEnd();};box.appendChild(b);});
  $('pickSheet').hidden=false;}
function checkEnd(){const left=F.cols.reduce((a,c)=>a+c.length,0);
  if(left===0){sfx.clear();gainGold(10);F.stairs=true;if(R.hearts<maxHearts()&&R.floor%2===0){R.hearts++;toast('全部取った！ ❤+1');}return endFloor(true);}
  if(F.stock.length===0&&playable().length===0){
    const can=R.jokers>0?'🃏 ジョーカーが使える':(has('wild')&&!F.used.wild)?'🗝 鍵が使える':(has('hammer')&&!F.used.hammer)?'⛏ つるはしが使える':(has('undo')&&!F.used.undo)?'⏳ 砂が使える':null;
    if(can){toast(can);return;}const f=F;setTimeout(()=>{if(F===f)endFloor(false);},500);}}
function recordFloor(cleared,why){const e=F.ev,col=e.last||0;R.trip.push({type:F.type,kinds:e.kinds,boss:e.boss,killer:e.killer,f:R.floor,mon:e.mon,chest:e.chest,relics:e.relics,chain:e.chain,hurt:e.hurt,gold:F.goldF,col,end:why==='dead'?'dead':cleared?'clear':F.stairs?'stairs':'lost'});}
function endFloor(cleared,why){if(F.ended)return;hint(null);recordFloor(cleared,why);F.ended=true;const left=F.cols.reduce((a,c)=>a+c.length,0);const ex=$('endExtra');ex.innerHTML='';
  if(F.stairs&&why!=='dead'){R.log.push(cleared?'🌟':'🪜');
    $('endT').textContent=cleared?'全部取った！':`地下${R.floor}階 突破`;
    $('endP').innerHTML=`このフロアで 💰${F.goldF}${cleared?'（全取り +10）':''}<br>のこり ${left} 枚<br><br>持ち物 ${R.relics.map(k=>RELICS[k].ic).join(' ')||'なし'}${R.jokers?'　🃏×'+R.jokers:''}`;
    $('endBtn').textContent=`🪜 地下${R.floor+1}階へ降りる`;$('endBtn').onclick=()=>{$('endSheet').hidden=true;sfx.stairs();const nf=R.floor+1,nz=zoneOf(nf)!==zoneOf(R.floor),ty=TYPES[floorType(nf)];descend(nf,[nz?`― ${ZONES[zoneOf(nf)].n} ―`:'',ty.n?`<b style="font-size:22px">${ty.n}</b><br><small>${ty.d}</small>`:''].filter(Boolean).join('<br>'),()=>{R.floor=nf;startFloor();if(nz)bgmStart(zoneOf(nf));});};
    $('shareBtn').hidden=true;$('shopBtn').hidden=true;
  }else{R.log.push(why==='dead'?'👹':'💀');
    M.bank+=R.gold;M.best=Math.max(M.best,R.floor);M.day[DKEY]=Math.max(M.day[DKEY]||0,R.floor);
    const newU=Object.keys(RELICS).filter(k=>RELICS[k].unlock&&RELICS[k].unlock<=R.floor&&!M.unlocked.includes(k));newU.forEach(k=>M.unlocked.push(k));saveM();
    $('endT').textContent=why==='dead'?'力尽きた…':'ここまで…';
    $('endP').innerHTML=`${why==='dead'?'👹 魔物にやられた':`${F.type==='boss'?'番人を倒せなかった':'🪜 階段を取れなかった'}（あと ${left} 枚）`}<br><br>到達 <b style="color:#ffcf5a;font-size:22px">地下${R.floor}階</b><br><span class="grid">${R.log.join('')}</span><br>💰${R.gold} を宿屋に持ち帰った（合計 ${M.bank}）<br><span style="font-size:12px;color:#a08a60">最大 ${R.maxChain} 連鎖 ／ 今日の最高 B${M.day[DKEY]} ／ 自己最高 B${M.best}</span>`;
    newU.forEach(k=>{const d=document.createElement('div');d.className='newunlock';d.innerHTML=`🔓 新しい道具が宝箱に入るようになった<br><b style="font-size:18px">${RELICS[k].ic} ${RELICS[k].n}</b><br><span style="font-size:12px">${RELICS[k].d}</span>`;ex.appendChild(d);});
    const jr=saveJournal();const jb=document.createElement('button');jb.className='btn';jb.textContent=`探検記を見る（${jr.title}）`;jb.onclick=()=>openJournal(jr);ex.appendChild(jb);
    $('endBtn').textContent='もう一度もぐる';$('endBtn').onclick=()=>{$('endSheet').hidden=true;$('title').hidden=false;renderCls();};
    $('shopBtn').hidden=false;$('shareBtn').hidden=false;
    $('shareBtn').onclick=()=>{const t=`めくって降りる地下 ${today.getMonth()+1}/${today.getDate()}\n地下${R.floor}階 ${R.log.join('')}\n最大${R.maxChain}連鎖 ${R.relics.map(k=>RELICS[k].ic).join('')}\n${location.href}`;navigator.clipboard&&navigator.clipboard.writeText(t);toast('コピーした');};}
  $('endSheet').hidden=false;renderDepth();}
// ===== 宿屋 =====
function openShop(){$('bank').textContent=M.bank;const L=$('shopList');L.innerHTML='';
  for(const k in PERKS){const p=PERKS[k],lv=M.perks[k]||0,mx=p.cost.length,cost=p.cost[lv];const b=document.createElement('button');b.className='pick';
    b.innerHTML=`<b>${p.ic} ${p.n}${mx>1?`　Lv${lv}/${mx}`:lv?'（持っている）':''}<span class="cost">${lv<mx?'💰'+cost:'最大'}</span></b>${p.d}`;
    b.disabled=lv>=mx||M.bank<cost;b.onclick=()=>{M.bank-=cost;M.perks[k]=lv+1;saveM();sfx.buy();openShop();};L.appendChild(b);}
  $('pool').textContent=pool().map(k=>RELICS[k].ic).join(' ')+'　'+Object.keys(RELICS).filter(k=>!pool().includes(k)).map(()=>'🔒').join('');
  $('shopSheet').hidden=false;}
$('jBtn0').onclick=()=>{ac();openJournalList();};$('jListClose').onclick=()=>{$('jListSheet').hidden=true;};
$('shopBtn0').onclick=()=>{ac();openShop();};$('shopBtn').onclick=openShop;$('shopClose').onclick=()=>{$('shopSheet').hidden=true;};
function renderCls(){const b=$('clsPick');b.innerHTML='';for(const k in CLS){const c=CLS[k],open=M.best>=(c.unlock||0),e=document.createElement('button');e.className='clsb'+((M.cls||'exp')===k?' on':'');e.disabled=!open;e.innerHTML=`${ic(open?HERO_OF[k]:'lock',2)}<b>${c.n}</b><small>${open?c.d:`地下${c.unlock}階で解禁`}</small>`;e.onclick=()=>{M.cls=k;saveM();renderCls();};b.appendChild(e);}}
renderCls();
$('start').onclick=()=>{ac();$('title').hidden=true;newRun();};
$('bgmBtn').textContent=BGM.on?'🔊':'🔇';$('bgmBtn').onclick=bgmToggle;$('monOk').onclick=()=>{$('monSheet').hidden=true;};
if(M.runs)$('titleSub').innerHTML=`宿屋の💰 ${M.bank} ／ 今日の最高 B${M.day[DKEY]||'-'} ／ 自己最高 B${M.best}<br>今日は全員が同じダンジョン（試作 v6）`;
window.addEventListener('resize',()=>F&&render());
renderDepth();
