'use strict';
const SAVE_PREFIX='mekuri_',SAVE_MAGIC='MEKURI1:';
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

// ===== 挑戦状：同じ日のダンジョンで勝負する（URLの#に記録を入れる・サーバー不要） =====
const LOGC={'🌟':'c','🪜':'s','👹':'k','💀':'x'},LOGE={c:'🌟',s:'🪜',k:'👹',x:'💀'};
function makeChallenge(){const o={v:1,d:R.dkey||DKEY,f:R.floor,g:R.gold,m:R.maxChain,l:R.log.map(e=>LOGC[e]||'x').join(''),c:R.cls};shareLink(tr('この記録に挑め！めくって降りる地下'),location.origin+location.pathname+'#c='+b64u.enc(JSON.stringify(o)));}
function parseChallenge(h){const m=/^#c=([A-Za-z0-9_-]{1,2000})$/.exec(h||'');if(!m)return null;let o;try{o=JSON.parse(b64u.dec(m[1]));}catch(e){return null;}if(!o||o.v!==1)return null;
  const I=(v,mx)=>Number.isInteger(v)&&v>=0&&v<=mx;if(typeof o.d!=='string'||!/^\d{4}-\d{1,2}-\d{1,2}$/.test(o.d)||!I(o.f,999)||o.f<1||!I(o.g,1e8)||!I(o.m,9999)||typeof o.l!=='string'||!/^[csxk]{0,400}$/.test(o.l)||!Object.prototype.hasOwnProperty.call(CLS,o.c))return null;
  return {d:o.d,f:o.f,g:o.g,m:o.m,l:o.l,c:o.c};}
function showChallenge(ch){$('chP').textContent=`地下${ch.f}階 💰${ch.g} 最大${ch.m}連鎖 ${ch.l.split('').map(x=>LOGE[x]).join('')}`;$('chD').textContent=ch.d;$('chGo').onclick=()=>{if(loadRun()&&!confirm(tr('今の探検は消えます。よろしいですか？')))return;clearRun();ac();$('chSheet').hidden=true;$('title').hidden=true;newRun(ch);};$('chNo').onclick=()=>{$('chSheet').hidden=true;};$('chSheet').hidden=false;}
(()=>{const ch=parseChallenge(location.hash);if(location.hash)history.replaceState(null,'',location.pathname+location.search);if(ch)showChallenge(ch);})();
