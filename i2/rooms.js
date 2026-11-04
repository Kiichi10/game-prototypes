'use strict';
// ===== 魔物・階の種類・職業 =====
const MON={
  goblin:{n:'ゴブリン',sp:'goblin',every:3,d:'3回めくるごとに❤-1',gold:f=>5+f},
  bat:{n:'コウモリ',sp:'bat',every:2,d:'2回めくるごとに❤-1。せっかち。退治しても💰は少なめ',gold:f=>2+Math.floor(f/2)},
  wisp:{n:'水の霊',sp:'wisp',every:3,eff:'steal',d:'3回めくるごとに山札を2枚消す',gold:f=>6+f},
  mimic:{n:'ミミック',sp:'mimic',every:3,d:'宝箱のふりをしている。見えた瞬間に❤-1。退治すると本物の宝箱が開く',gold:f=>3+f},
  demon:{n:'炎の悪魔',sp:'demon',every:3,eff:'burn',d:'3回めくるごとに❤-1＋山札を1枚燃やす',gold:f=>10+f},
  boss:{n:'番人',sp:'boss',every:5,d:'階段を守っている。姿が見えなくても5回めくるごとに❤-1。倒すと階段が開き、宝箱も手に入る',gold:f=>20+f*2},
};
const kindsOf=f=>f>=10?['demon','demon','bat','wisp','mimic']:f>=6?['wisp','bat','goblin','mimic']:f>=5?['wisp','bat','goblin']:['goblin','bat'];
const TYPES={
  normal:{n:'',d:''},
  boss:{n:'番人の階',d:'階段の代わりに番人がいる。倒さないと降りられない'},
  dark:{n:'暗闇の階',d:'伏せたカードの印が見えない'},
  vault:{n:'宝物庫',d:'💰と🎁が多い。そのぶん山札が少ない'},
  chain:{n:'連鎖の間',d:'連鎖のごほうびが2倍'},
};
function floorType(f){if(f%5===0)return 'boss';if(f<3)return 'normal';const r=rng(((typeof R!=='undefined'&&R&&R.dkey)||DKEY)+'t'+f);r();const v=r();return v<.2?'dark':v<.35?'vault':v<.5?'chain':'normal';}
const CLS={
  exp:{n:'探検家',d:'ふつう。まずはここから',heart:0},
  thief:{n:'盗賊',unlock:3,d:'💰が1.5倍。そのかわり❤-1',heart:-1},
  knight:{n:'騎士',unlock:5,d:'❤+1。そのかわり毎階の山札-3',heart:1},
  mage:{n:'魔術師',unlock:7,d:'最初から万能の鍵と時の砂を持つ。そのかわり❤-1',heart:-1},
};
const HERO_OF={exp:'hero',thief:'hero_thief',knight:'hero_knight',mage:'hero_mage'};
SP.hero_thief=SP.hero.replace(/r/g,'e').replace(/b/g,'G');
SP.hero_knight=SP.hero.replace(/r/g,'s').replace(/b/g,'S');
SP.hero_mage=SP.hero.replace(/r/g,'p').replace(/b/g,'P');

// 道具の重要度と使いどころ（★はシミュレーターの到達階の差＋自動では測れない物は判断で決めた）
const RINFO={
 eye:{star:3,tag:'深く潜る',tip:'自動で効く。山札が残り2枚になったら、いつもより広く取れる'},
 map:{star:3,tag:'深く潜る',tip:'自動で効く。🪜が浅くなるので、🪜の列を先に掘ろう'},
 wild:{star:2,tag:'詰まった時',tip:'取れるカードが無い時や、🪜まであと1枚の時に押す'},
 candle:{star:2,tag:'余裕が増える',tip:'自動で効く。山札を多めに使える'},
 amulet:{star:2,tag:'魔物対策',tip:'自動で効く。階ごとの最初の攻撃を1回防ぐ'},
 hammer:{star:2,tag:'詰まった時',tip:'🪜や👹の上の邪魔なカードに。連鎖を切らずに掘れる'},
 undo:{star:2,tag:'やり直し',tip:'めくって後悔した直後に押す。1手だけ戻せる'},
 lantern:{star:1,tag:'先を読む',tip:'自動で効く。次の3枚を見て、先に取るカードを決めよう'},
 ring:{star:1,tag:'連鎖',tip:'自動で効く。5連鎖を狙うと山札が1枚戻る'},
 crown:{star:1,tag:'連鎖',tip:'自動で効く。7連鎖や10連鎖が得意な人向け'},
 thief:{star:1,tag:'お金',tip:'自動で効く。深く潜る力は増えないが、宿屋の強化が早く買える'},
 bell:{star:1,tag:'宝箱',tip:'自動で効く。宝箱で良い道具を選びやすくなる'},
};
const stars=n=>'★'.repeat(n)+'☆'.repeat(3-n);
function openBag(){const b=$('bagList');let h='';const row=(k,btn)=>{const r=RELICS[k],i=RINFO[k];return `<div class="bagi"><span class="bi">${r.ic}</span><div><b>${r.n}</b> <span class="st">${stars(i.star)}</span> <span class="tg">${i.tag}</span><br>${r.d}<br><small>使いどころ：${i.tip}</small></div>${btn||''}</div>`;};
  const act=R.relics.filter(k=>RELICS[k].act),pas=R.relics.filter(k=>!RELICS[k].act);
  if(R.jokers>0)h+=`<div class="bagi"><span class="bi">🃏</span><div><b>ジョーカー ×${R.jokers}</b><br>出すと、次はどのカードでも取れる。連鎖は切れない<br><small>使いどころ：詰まった時や、連鎖をつなげたい時</small></div><button class="ub" data-joker="1">つかう</button></div>`;
  if(act.length){h+='<h3>押して使う道具</h3>';act.forEach(k=>{h+=row(k,F.used[k]?'<span class="usd">この階は使用済み</span>':`<button class="ub" data-k="${k}">つかう</button>`);});}
  if(pas.length){h+='<h3>持っているだけで効く道具</h3>';pas.forEach(k=>{h+=row(k);});}
  if(!h)h='<p>まだ何も持っていません。<br>🎁を開けると道具が手に入ります。</p>';b.innerHTML=h;
  b.querySelectorAll('.ub').forEach(e=>e.onclick=()=>{$('bagSheet').hidden=true;if(e.dataset.joker)useJoker();else useRelic(e.dataset.k);});$('bagSheet').hidden=false;}
