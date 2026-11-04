'use strict';
// ===== ふっかつのじゅもん：進み具合を短い文字列にする（打ち間違いは検出する） =====
const JK='あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだでどばびぶべぼ';
const JL='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?';
function jSum(v){let a=1,b=0;for(const x of v){a=(a+x+1)%65521;b=(b+a)%65521;}return (a^(b<<3)^(b>>5))&4095;}
function jMask(sum,i){let s=(sum*2654435761+i*40503+12345)>>>0;s^=s>>>13;s=(s*1274126177)>>>0;return (s>>>17)&63;}
function jEncode(bits){while(bits.length%6)bits.push(0);const v=[];for(let i=0;i<bits.length;i+=6){let n=0;for(let k=0;k<6;k++)n=n*2+bits[i+k];v.push(n);}const sum=jSum(v);const body=v.map((x,i)=>x^jMask(sum,i));body.push(sum>>6,sum&63);const A=LANG==='ja'?JK:JL;return body.map(x=>A[x]).join('');}
function jDecode(txt){let s=String(txt||'').replace(/[\s　・、,.]+/g,'').replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-96));if(s.length<4)return null;const A=JK.includes(s[0])?JK:JL;const a=[];for(const c of s){const i=A.indexOf(c);if(i<0)return null;a.push(i);}
  const sum=a[a.length-2]*64+a[a.length-1];const v=a.slice(0,-2).map((x,i)=>x^jMask(sum,i));if(jSum(v)!==sum)return null;const bits=[];for(const x of v)for(let k=5;k>=0;k--)bits.push((x>>k)&1);return bits;}
class BitW{constructor(){this.b=[];}put(v,n){v=Math.max(0,Math.min(2**n-1,Math.floor(+v||0)));for(let k=n-1;k>=0;k--)this.b.push(Math.floor(v/2**k)%2);return this;}}
class BitR{constructor(b){this.b=b;this.i=0;}get(n){let v=0;for(let k=0;k<n;k++)v=v*2+(this.b[this.i++]||0);return v;}}
const jGroup=s=>s.replace(/(.{5})(?=.)/g,'$1 ');
function openWord(){if(typeof saveRun==='function'&&typeof R!=='undefined'&&R&&F&&!F.ended)saveRun();$('wordOut').textContent=jGroup(jumonMake());$('wordIn').value='';$('wordErr').hidden=true;$('wordSheet').hidden=false;}
$('wordCopy').onclick=()=>copyText($('wordOut').textContent,()=>toast('コピーした'));$('wordClose').onclick=()=>{$('wordSheet').hidden=true;};
$('wordGo').onclick=()=>{const bits=jDecode($('wordIn').value);if(!bits||!jumonCheck(bits)){$('wordErr').hidden=false;return;}if(!confirm(tr('今の進み具合は、じゅもんの時点に置き換わります。よろしいですか？')))return;jumonApply(bits);sessionStorage.setItem(SAVE_PREFIX+'revived','1');location.reload();};
$('wordBtn').onclick=()=>{ac();openWord();};
if(sessionStorage.getItem(SAVE_PREFIX+'revived')){sessionStorage.removeItem(SAVE_PREFIX+'revived');const e=document.createElement('div');e.className='revived';e.textContent='ふっかつしました';$('app').appendChild(e);setTimeout(()=>e.remove(),2400);}

const J_REL=['wild','undo','candle','ring','thief','lantern','eye','map','hammer','bell','crown','amulet'],J_UNL=['eye','map','hammer','bell','crown','amulet'],J_MON=['goblin','bat','wisp','mimic','demon','boss'],J_CLS=['exp','thief','knight','mage'];
const J_EPOCH=Date.UTC(2026,0,1);
function jumonMake(){const w=new BitW(),P=M.perks||{};w.put(1,4).put(M.bank,20).put(M.best,10).put(P.stock,2).put(P.joker,1).put(P.coin,2).put(P.lamp,1).put(P.heart,2);
  J_UNL.forEach(k=>w.put((M.unlocked||[]).includes(k)?1:0,1));w.put(J_CLS.indexOf(M.cls||'exp'),2);J_MON.forEach(k=>w.put((M.dex||{})[k],8));J_MON.forEach(k=>w.put((M.seen||{})[k]?1:0,1));
  const sv=loadRun();w.put(sv&&sv.R.hearts>0?1:0,1);if(sv&&sv.R.hearts>0){const r=sv.R,[y,m,dd]=(r.dkey||DKEY).split('-').map(Number);w.put(Math.round((Date.UTC(y,m-1,dd)-J_EPOCH)/864e5),14);w.put(r.floor+(sv.F&&sv.F.ended?1:0),10).put(r.hearts,4).put(r.gold,20).put(r.jokers,2);J_REL.forEach(k=>w.put(r.relics.includes(k)?1:0,1));w.put(J_CLS.indexOf(r.cls),2);}
  return jEncode(w.b);}
function jumonRead(bits){const r=new BitR(bits),o={ver:r.get(4)};if(o.ver!==1)return null;o.bank=r.get(20);o.best=r.get(10);o.perks={stock:r.get(2),joker:r.get(1),coin:r.get(2),lamp:r.get(1),heart:r.get(2)};o.unlocked=J_UNL.filter(()=>r.get(1));o.cls=J_CLS[r.get(2)];o.dex={};J_MON.forEach(k=>{const n=r.get(8);if(n)o.dex[k]=n;});o.seen={};J_MON.forEach(k=>{if(r.get(1))o.seen[k]=1;});
  if(r.get(1)){const day=new Date(J_EPOCH+r.get(14)*864e5);const run={dkey:`${day.getUTCFullYear()}-${day.getUTCMonth()+1}-${day.getUTCDate()}`,floor:r.get(10),hearts:r.get(4),gold:r.get(20),jokers:r.get(2),relics:J_REL.filter(()=>r.get(1))};run.cls=J_CLS[r.get(2)];o.run=run;}return o;}
const jumonCheck=b=>{const o=jumonRead(b);return !!o&&o.perks.stock<=3&&o.perks.coin<=2&&o.perks.heart<=2&&(!o.run||(o.run.floor>=1&&o.run.hearts>=1));};
function jumonApply(b){const o=jumonRead(b);Object.assign(M,{bank:o.bank,best:o.best,perks:Object.fromEntries(Object.entries(o.perks).filter(([,v])=>v)),unlocked:o.unlocked,cls:o.cls,dex:o.dex,seen:o.seen});saveM();
  if(o.run)localStorage.setItem(RUNKEY,JSON.stringify({R:Object.assign({ch:null,log:[],maxChain:0,trip:[]},o.run),F:null}));else localStorage.removeItem(RUNKEY);}
