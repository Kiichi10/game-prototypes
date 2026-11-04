'use strict';
const SAVE_PREFIX='itembox_',SAVE_MAGIC='ITEMBOX1:';
// ===== 設定：言語・ホーム画面に追加・セーブの書き出しと読み込み =====
function exportSave(){const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(SAVE_PREFIX)&&k!==LKEY)o[k]=localStorage.getItem(k);}return SAVE_MAGIC+btoa(unescape(encodeURIComponent(JSON.stringify(o))));}
function importSave(txt){const fail=m=>alert(tr(m));let t=(txt||'').replace(/[\s​-‍﻿]/g,'');if(!t)return fail('貼り付ける文字列が空です。');
  const i=t.lastIndexOf(SAVE_MAGIC);if(i<0){if(/(MEKURI|ITEMBOX)1:/.test(t))return fail('これは別のゲームのセーブです。');return fail(`文字列の先頭（${SAVE_MAGIC}）が欠けています。「コピーする」で全部をコピーしてください。`);}
  let o;try{o=JSON.parse(decodeURIComponent(escape(atob(t.slice(i+SAVE_MAGIC.length)))));}catch(e){return fail('文字列の途中か最後が欠けています。「コピーする」で全部をコピーしてください。');}
  if(!o||typeof o!=='object')return fail('このゲームのセーブではありません。');for(const k in o){if(!k.startsWith(SAVE_PREFIX)||typeof o[k]!=='string'||o[k].includes('<'))return fail('このゲームのセーブではありません。');}
  if(!confirm(tr('読み込むと、今のセーブは上書きされます。よろしいですか？')))return;
  const old=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(SAVE_PREFIX)&&k!==LKEY)old.push(k);}old.forEach(k=>localStorage.removeItem(k));for(const k in o)localStorage.setItem(k,o[k]);location.reload();}
let installEv=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEv=e;});
function openSettings(){$('saveOut').value=exportSave();$('saveIn').value='';$('homeHelp').hidden=true;const sa=window.matchMedia&&matchMedia('(display-mode: standalone)').matches;$('homeBox').hidden=!!sa;document.querySelectorAll('.langb').forEach(b=>b.classList.toggle('on',b.dataset.l===LANG));$('setSheet').hidden=false;}
function copyText(t,done){if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done,()=>prompt('',t));else prompt('',t);}
function shareLink(text,url){if(navigator.share){navigator.share({text,url}).catch(()=>{});return;}copyText(text+'\n'+url,()=>toast('コピーした'));}
const b64u={enc:s=>btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''),dec:s=>decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/'))))};
$('setBtn').onclick=()=>{ac();openSettings();};$('setClose').onclick=()=>{$('setSheet').hidden=true;};document.querySelectorAll('.langb').forEach(b=>b.onclick=()=>{if(b.dataset.l!==LANG)setLang(b.dataset.l);});
$('saveCopy').onclick=()=>copyText($('saveOut').value,()=>toast('コピーした'));$('saveLoad').onclick=async()=>{let t=$('saveIn').value;if(!t.trim()&&navigator.clipboard&&navigator.clipboard.readText){try{t=await navigator.clipboard.readText();$('saveIn').value=t;}catch(e){}}importSave(t);};$('saveOut').onclick=()=>$('saveOut').select();$('setWord').onclick=()=>{openWord();};
$('homeBtn').onclick=()=>{if(installEv){installEv.prompt();installEv=null;}else $('homeHelp').hidden=false;};
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('sw.js').catch(()=>{});

// ===== 挑戦状：タイムアタックの走りをURLに入れる（サーバー不要） =====
function encodeGhost(track){const out=[];let pd=0;for(let i=0;i<track.length;i+=6){const d=track[i],x=track[i+1],dd=Math.max(0,Math.min(255,d-pd));pd+=dd;out.push(dd,Math.max(0,Math.min(255,Math.round((x-RL)/RW*255))));}return btoa(String.fromCharCode(...out)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function expandGhost(ch){resize();const bin=atob(ch.g.replace(/-/g,'+').replace(/_/g,'/'));const S=[];let d=0;for(let i=0;i+1<bin.length;i+=2){d+=bin.charCodeAt(i);S.push([d,RL+bin.charCodeAt(i+1)/255*RW]);}const out=[];for(let i=0;i<S.length;i++){const a=S[i],b=S[i+1]||a;for(let k=0;k<3;k++){if(!S[i+1]&&k)break;out.push(a[0]+(b[0]-a[0])*k/3,a[1]+(b[1]-a[1])*k/3);}}return out;}
function makeChallenge(){const c=myCar(),o={v:1,i:cidx(),k:CUP.cls,t:Math.round(P.fin/60*100),b:c.body,ti:c.tire,a:c.acc,c:SV.color,g:encodeGhost(P.track)};shareLink(tr('この走りに勝てるか？')+' '+tr(COURSES[cidx()].n),location.origin+location.pathname+'#c='+b64u.enc(JSON.stringify(o)));}
function parseChallenge(h){const m=/^#c=([A-Za-z0-9_-]{1,12000})$/.exec(h||'');if(!m)return null;let o;try{o=JSON.parse(b64u.dec(m[1]));}catch(e){return null;}if(!o||o.v!==1)return null;
  const I=(v,lo,hi)=>Number.isInteger(v)&&v>=lo&&v<=hi,H=(t,k)=>Object.prototype.hasOwnProperty.call(t,k);if(!I(o.i,0,COURSES.length-1)||!I(o.k,0,2)||!I(o.t,100,100000)||!I(o.c,0,COLORS.length-1)||!H(CARP.body,o.b)||!H(CARP.tire,o.ti)||!H(CARP.acc,o.a)||typeof o.g!=='string'||!/^[A-Za-z0-9_-]{2,8000}$/.test(o.g))return null;
  try{atob(o.g.replace(/-/g,'+').replace(/_/g,'/'));}catch(e){return null;}return {i:o.i,k:o.k,t:o.t,c:o.c,g:o.g,car:{body:o.b,tire:o.ti,acc:o.a}};}
function showChallenge(ch){const co=COURSES[ch.i];$('chP').textContent=`${co.ic} ${co.n}　${CLASSES[ch.k].n}　${(ch.t/100).toFixed(2)}秒`;const pv=$('chCar'),x=pv.getContext('2d');x.imageSmoothingEnabled=false;x.clearRect(0,0,pv.width,pv.height);x.drawImage(makeCar(COLORS[ch.c][0],'#fff8e8',ch.car),0,0,pv.width,pv.height);
  $('chGo').onclick=()=>{ac();$('chSheet').hidden=true;$('title').hidden=true;newTA(ch.i,ch);};$('chNo').onclick=()=>{$('chSheet').hidden=true;};$('chSheet').hidden=false;}
(()=>{const ch=parseChallenge(location.hash);if(location.hash)history.replaceState(null,'',location.pathname+location.search);if(ch)showChallenge(ch);})();
