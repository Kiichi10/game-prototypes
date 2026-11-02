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
function floorType(f){if(f%5===0)return 'boss';if(f<3)return 'normal';const r=rng(DKEY+'t'+f);r();const v=r();return v<.2?'dark':v<.35?'vault':v<.5?'chain':'normal';}
const CLS={
  exp:{n:'探検家',d:'ふつう。まずはここから',heart:0},
  thief:{n:'盗賊',unlock:3,d:'💰が1.5倍。そのかわり❤-1',heart:-1},
  knight:{n:'騎士',unlock:5,d:'❤+2。そのかわり毎階の山札-3',heart:2},
  mage:{n:'魔術師',unlock:7,d:'最初から万能の鍵と時の砂を持つ。そのかわり❤-1',heart:-1},
};
const HERO_OF={exp:'hero',thief:'hero_thief',knight:'hero_knight',mage:'hero_mage'};
SP.hero_thief=SP.hero.replace(/r/g,'e').replace(/b/g,'G');
SP.hero_knight=SP.hero.replace(/r/g,'s').replace(/b/g,'S');
SP.hero_mage=SP.hero.replace(/r/g,'p').replace(/b/g,'P');
