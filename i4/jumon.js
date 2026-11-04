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

const J_BODY=['std','light','tank','arrow','kuro'],J_TIRE=['std','slick','snow','big'],J_ACC=['none','wing','muffler','magnet','antenna'],J_ALL=[...J_BODY.map(k=>'body.'+k),...J_TIRE.map(k=>'tire.'+k),...J_ACC.map(k=>'acc.'+k)];
function jumonMake(){const w=new BitW(),c=myCar(),p=SV.parts||{},t=SV.trophies||[];w.put(1,4).put(SV.coins,20).put(p.engine,2).put(p.tire,2).put(p.luck,2).put(SV.color,3);COLORS.forEach((_,i)=>w.put((SV.colors||[]).includes(i)?1:0,1));
  w.put(J_BODY.indexOf(c.body),3).put(J_TIRE.indexOf(c.tire),2).put(J_ACC.indexOf(c.acc),3);J_ALL.forEach(k=>w.put(c.own.includes(k)?1:0,1));w.put(UNLOCK.filter(k=>SV.have.includes(k)).length,4);['🥇','🥈','🥉'].forEach(m=>w.put(t.filter(x=>x===m).length,8));w.put(SV.clsOpen||1,2).put(SV.clsSel,2).put(SV.cupSel,1).put(SV.cup2seen?1:0,1);
  const r=SV.run;w.put(r?1:0,1);if(r){w.put(r.cup,1).put(r.race,2).put(r.cls,2).put(r.showResult?1:0,1);r.pts.forEach(x=>w.put(x,8));for(let i=0;i<4;i++)w.put(r.marks[i]||0,3);}return jEncode(w.b);}
function jumonRead(bits){const r=new BitR(bits),o={};if(r.get(4)!==1)return null;o.coins=r.get(20);o.parts={engine:r.get(2),tire:r.get(2),luck:r.get(2)};o.color=r.get(3);o.colors=COLORS.map((_,i)=>i).filter(()=>r.get(1));o.car={body:J_BODY[r.get(3)],tire:J_TIRE[r.get(2)],acc:J_ACC[r.get(3)]};o.car.own=J_ALL.filter(()=>r.get(1));o.unl=r.get(4);o.trophies=[];['🥇','🥈','🥉'].forEach(m=>{const n=r.get(8);for(let i=0;i<n;i++)o.trophies.push(m);});o.clsOpen=r.get(2);o.clsSel=r.get(2);o.cupSel=r.get(1);o.cup2seen=r.get(1);
  if(r.get(1)){const run={cup:r.get(1),race:r.get(2),cls:r.get(2)};if(r.get(1))run.showResult=true;run.pts=[0,0,0,0].map(()=>r.get(8));run.marks=[0,0,0,0].map(()=>r.get(3)).filter(Boolean);o.run=run;}return o;}
const jumonCheck=b=>{const o=jumonRead(b);return !!o&&!!o.car.body&&!!o.car.tire&&!!o.car.acc&&o.color<COLORS.length&&o.unl<=UNLOCK.length&&o.clsOpen>=1&&o.clsOpen<=3&&o.clsSel<=2&&(!o.run||o.run.cls<=2);};
function jumonApply(b){const o=jumonRead(b);Object.assign(SV,{coins:o.coins,parts:o.parts,color:o.color,colors:o.colors.length?o.colors:[0],car:o.car,trophies:o.trophies,clsOpen:o.clsOpen,clsSel:o.clsSel,cupSel:o.cupSel,have:[...START,...UNLOCK.slice(0,o.unl)]});if(o.cup2seen)SV.cup2seen=1;if(o.run)SV.run=o.run;else delete SV.run;saveSV();}
