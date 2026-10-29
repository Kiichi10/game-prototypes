'use strict';
const $=id=>document.getElementById(id);
// ===== 音 =====
let AC; const ac=()=>AC||(AC=new (window.AudioContext||window.webkitAudioContext)());
function tone(f,d,type='triangle',v=.08,when=0,slide=0){const a=ac(),o=a.createOscillator(),gn=a.createGain(),t=a.currentTime+when;o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide),t+d);gn.gain.setValueAtTime(v,t);gn.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(gn).connect(a.destination);o.start(t);o.stop(t+d+.02);}
const sfx={
  take(c){const f=392*Math.pow(2,Math.min(c,14)*2/12);tone(f,.16,'triangle',.09);tone(f*2,.08,'sine',.03);},
  draw(){tone(180,.06,'square',.03);tone(120,.05,'square',.02,.03);},
  coin(){tone(1568,.08,'square',.04);tone(2093,.18,'square',.04,.06);},
  chest(){[0,4,7,12].forEach((s,i)=>tone(523*Math.pow(2,s/12),.2,'square',.05,i*.08));},
  stairs(){[12,7,4,0,-5].forEach((s,i)=>tone(523*Math.pow(2,s/12),.22,'triangle',.08,i*.1));},
  no(){tone(110,.15,'square',.05);},
  clear(){[0,4,7,12,16,19,24].forEach((s,i)=>tone(392*Math.pow(2,s/12),.18,'square',.05,i*.07));},
};
// ===== 乱数（日付で全員同じ） =====
const today=new Date(); const DKEY=`${today.getFullYear()}${today.getMonth()+1}${today.getDate()}`;
function rng(seed){let s=0;for(const ch of String(seed))s=(s*31+ch.charCodeAt(0))>>>0;s=s||1;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
const SUITS=['♠','♥','♦','♣'], RN=['','A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const RELICS={
  wild:{n:'万能の鍵',d:'1階に1回、どのカードでも取れる（押してから取る）',act:true,ic:'🗝'},
  undo:{n:'時の砂',d:'1階に1回、最後の1手を戻す',act:true,ic:'⏳'},
  candle:{n:'長いろうそく',d:'毎階、山札が3枚増える',ic:'🕯'},
  ring:{n:'連鎖の指輪',d:'5連鎖ごとに、山札が1枚増える',ic:'💍'},
  thief:{n:'盗賊の手袋',d:'💰が2倍',ic:'🧤'},
  lantern:{n:'ランタン',d:'山札の次の3枚が見える',ic:'🏮'},
  eye:{n:'鷹の目',d:'数字が2ちがいでも取れる',ic:'👁'},
};
// ===== 状態 =====
let R; // run
let F; // floor
function newRun(){R={floor:1,gold:0,relics:[],taken:0};startFloor();}
function startFloor(){
  const rand=rng(DKEY+'-'+R.floor);
  const deck=[];for(let s=0;s<4;s++)for(let r=1;r<=13;r++)deck.push({r,s});
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  const cols=[];for(let c=0;c<7;c++){cols.push(deck.splice(0,5));}
  // 宝の配置
  const stairsRow=R.floor<=2?2:1;
  const sc=Math.floor(rand()*7); cols[sc][stairsRow].loot='stairs';
  let c1=(sc+1+Math.floor(rand()*6))%7; cols[c1][3].loot=cols[c1][3].loot||'chest';
  let c2=(c1+1+Math.floor(rand()*5))%7; if(c2===sc)c2=(c2+1)%7; cols[c2][0].loot=cols[c2][0].loot||'chest';
  let n=0;while(n<10){const c=Math.floor(rand()*7),r=Math.floor(rand()*5);if(!cols[c][r].loot){cols[c][r].loot='gold';cols[c][r].amt=1+Math.floor(rand()*3)+Math.floor(R.floor/2);n++;}}
  const stock=deck; if(R.relics.includes('candle'))for(let i=0;i<3;i++)stock.push({r:1+Math.floor(rand()*13),s:Math.floor(rand()*4)});
  const waste=[stock.pop()];
  F={cols,stock,waste,chain:0,stairs:false,hist:[],used:{},armed:null,goldF:0,rand};
  $('fl').textContent=R.floor; render();
}
const ok=(card)=>{if(F.armed==='wild')return true;const w=F.waste[F.waste.length-1];const d=Math.abs(card.r-w.r);const lim=R.relics.includes('eye')?2:1;return d>=1&&d<=lim||d===13-1||(lim===2&&d===11);};
function playable(){const out=[];F.cols.forEach((col,ci)=>{if(col.length&&ok(col[col.length-1]))out.push(ci);});return out;}

// ===== 描画 =====
function cardEl(c,cls=''){const e=document.createElement('div');e.className='card '+cls+(c.s===1||c.s===2?' red':'');
  e.innerHTML=`<span class="r">${RN[c.r]}</span><span class="s">${SUITS[c.s]}</span><span class="big">${SUITS[c.s]}</span>`+
  (c.loot?`<span class="loot">${{gold:'💰',chest:'🎁',stairs:'🪜'}[c.loot]}</span>`:'');return e;}
function render(){
  const b=$('board');b.innerHTML='';const pl=playable();
  const cw=(b.clientWidth-16-6*4)/7, chh=cw*7/5, off=chh*.5;
  F.cols.forEach((col,ci)=>{const ce=document.createElement('div');ce.className='col';ce.style.height=(chh+off*4)+'px';
    col.forEach((c,ri)=>{const last=ri===col.length-1;const e=cardEl(c,last?(pl.includes(ci)?'ok':''):'lock');e.style.top=(ri*off)+'px';
      if(last)e.onclick=()=>take(ci,e);ce.appendChild(e);});
    b.appendChild(ce);});
  const st=$('stock');st.innerHTML='';
  if(F.stock.length){const e=document.createElement('div');e.className='card back';e.innerHTML=`<span class="n">${F.stock.length}</span>`;st.appendChild(e);st.onclick=draw;}
  else{st.innerHTML='<div class="card back" style="filter:grayscale(1)"><span class="n" style="font-size:15px">終える</span></div>';st.onclick=()=>{if(!busy)endFloor(F.cols.every(c=>!c.length));};}
  const w=$('waste');w.innerHTML='';w.appendChild(cardEl(F.waste[F.waste.length-1]));
  $('chain').innerHTML=F.chain>=2?`<b>${F.chain}</b>連鎖`:(R.relics.includes('lantern')&&F.stock.length?'次: '+F.stock.slice(-3).reverse().map(c=>RN[c.r]).join(' '):'');
  $('gold').textContent=R.gold;
  const left=F.cols.reduce((a,c)=>a+c.length,0);$('left').textContent=`のこり ${left} 枚`+(F.stairs?' 🪜':'');
  const rl=$('relics');rl.innerHTML='';R.relics.forEach(k=>{const r=RELICS[k];const e=document.createElement('span');
    e.className='relic'+(r.act?(F.used[k]?' spent':' use'):'');e.textContent=r.ic+' '+r.n+(F.armed===k?'（発動中）':'');
    if(r.act&&!F.used[k])e.onclick=()=>useRelic(k);rl.appendChild(e);});
}
function toast(s){const t=document.createElement('div');t.className='toast';t.textContent=s;$('app').appendChild(t);setTimeout(()=>t.remove(),1000);}
function flyTo(from,ic,targetId){const r=from.getBoundingClientRect(),tr=$(targetId).getBoundingClientRect();const f=document.createElement('div');f.className='fly';f.textContent=ic;
  f.style.left=r.left+r.width/2-10+'px';f.style.top=r.top+'px';document.body.appendChild(f);requestAnimationFrame(()=>{f.style.left=tr.left+'px';f.style.top=tr.top+'px';f.style.transform='scale(.6)';});setTimeout(()=>f.remove(),650);}

// ===== 操作 =====
let busy=false;
function take(ci,el){if(busy)return;const col=F.cols[ci],c=col[col.length-1];
  if(!ok(c)){sfx.no();el.animate([{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'none'}],{duration:180});return;}
  if(F.armed==='wild'){F.used.wild=true;F.armed=null;}
  col.pop();F.waste.push(c);F.chain++;R.taken++;F.hist.push({t:'take',ci,c});sfx.take(F.chain);
  if(R.relics.includes('ring')&&F.chain%5===0){F.stock.push({r:1+Math.floor(F.rand()*13),s:Math.floor(F.rand()*4)});toast('💍 山札+1');}
  if(F.chain>=3&&F.chain%3===0)toast(`${F.chain}連鎖！`);
  let wait=0;
  if(c.loot==='gold'){const a=c.amt*(R.relics.includes('thief')?2:1);R.gold+=a;F.goldF+=a;flyTo(el,'💰','gold');setTimeout(sfx.coin,120);}
  if(c.loot==='stairs'){F.stairs=true;sfx.stairs();toast('🪜 階段を見つけた！');}
  if(c.loot==='chest'){sfx.chest();wait=1;}
  render();
  if(wait){busy=true;setTimeout(()=>{busy=false;openChest();},450);return;}
  checkEnd();
}
function draw(){if(busy||!F.stock.length)return;F.armed=null;const c=F.stock.pop();F.waste.push(c);F.hist.push({t:'draw',c});F.chain=0;sfx.draw();render();checkEnd();}
function useRelic(k){if(k==='wild'){F.armed=F.armed==='wild'?null:'wild';render();return;}
  if(k==='undo'){const h=F.hist.pop();if(!h){sfx.no();return;}F.used.undo=true;const c=F.waste.pop();
    if(h.t==='draw')F.stock.push(c);else{c.loot=null;F.cols[h.ci].push(c);}F.chain=0;render();}}
function openChest(){const pool=Object.keys(RELICS).filter(k=>!R.relics.includes(k));
  const box=$('picks');box.innerHTML='';
  if(!pool.length){R.gold+=10;toast('💰+10');checkEnd();return;}
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  pool.slice(0,3).forEach(k=>{const r=RELICS[k];const b=document.createElement('button');b.className='pick';b.innerHTML=`<b>${r.ic} ${r.n}</b>${r.d}`;
    b.onclick=()=>{R.relics.push(k);$('pickSheet').hidden=true;sfx.coin();render();checkEnd();};box.appendChild(b);});
  $('pickSheet').hidden=false;}
function checkEnd(){
  const left=F.cols.reduce((a,c)=>a+c.length,0);
  if(left===0){sfx.clear();R.gold+=10;F.stairs=true;return endFloor(true);}
  if(F.stock.length===0&&playable().length===0){
    const canWild=R.relics.includes('wild')&&!F.used.wild; const canUndo=R.relics.includes('undo')&&!F.used.undo;
    if(canWild||canUndo){toast(canWild?'🗝 鍵が使える（左上）':'⏳ 砂が使える（左上）');return;}
    setTimeout(()=>endFloor(false),500);
  }
}
function endFloor(cleared){
  const left=F.cols.reduce((a,c)=>a+c.length,0);
  if(F.stairs){$('endT').textContent=cleared?'全部取った！':`地下${R.floor}階 突破`;
    $('endP').innerHTML=`このフロアで 💰${F.goldF}${cleared?'（全取り +10）':''}<br>のこり ${left} 枚<br><br>持ち物 ${R.relics.map(k=>RELICS[k].ic).join(' ')||'なし'}`;
    $('endBtn').textContent=`🪜 地下${R.floor+1}階へ降りる`;$('endBtn').onclick=()=>{$('endSheet').hidden=true;R.floor++;startFloor();sfx.stairs();};
    $('shareBtn').hidden=true;
  }else{
    const best=Math.max(R.floor,+(localStorage.getItem('mekuri_best_'+DKEY)||0));localStorage.setItem('mekuri_best_'+DKEY,best);
    $('endT').textContent='ここまで…';
    $('endP').innerHTML=`🪜 階段を取れなかった（あと ${left} 枚）<br><br>到達 <b style="color:#ffcf5a;font-size:22px">地下${R.floor}階</b>　💰${R.gold}<br>持ち物 ${R.relics.map(k=>RELICS[k].ic).join(' ')||'なし'}<br><span style="font-size:12px;color:#a08a60">今日のダンジョンは全員同じ。今日の最高 地下${best}階</span>`;
    $('endBtn').textContent='もう一度もぐる';$('endBtn').onclick=()=>{$('endSheet').hidden=true;newRun();};
    $('shareBtn').hidden=false;$('shareBtn').onclick=()=>{const t=`めくって降りる地下 ${today.getMonth()+1}/${today.getDate()}\n地下${R.floor}階 💰${R.gold} ${R.relics.map(k=>RELICS[k].ic).join('')}\n${location.href}`;navigator.clipboard&&navigator.clipboard.writeText(t);toast('コピーした');};
  }
  $('endSheet').hidden=false;
}
$('start').onclick=()=>{ac();$('title').hidden=true;newRun();};
window.addEventListener('resize',()=>F&&render());
