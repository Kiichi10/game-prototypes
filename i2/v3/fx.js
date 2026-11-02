'use strict';
// ===== 演出：カードの移動・火花・揺れ・場面転換・初回案内・BGM =====
function cloneAt(el){const r=el.getBoundingClientRect();const cl=el.cloneNode(true);cl.classList.remove('ok','deal','flip');
  cl.style.cssText=`position:fixed;inset:auto;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;z-index:8;margin:0;animation:none;transition:none;pointer-events:none`;
  document.body.appendChild(cl);return {cl,r};}
// el の位置から捨て札へ飛ばす（描画後に呼ぶ）
function flyToWaste(c0,onEnd){const wEl=$('waste').firstChild;if(!wEl){c0.cl.remove();return;}const wr=wEl.getBoundingClientRect();wEl.style.visibility='hidden';
  const dx=wr.left-c0.r.left,dy=wr.top-c0.r.top,sc=wr.width/c0.r.width;
  const a=c0.cl.animate([{transform:'none'},{transform:`translate(${dx*.5}px,${dy*.5-30}px) scale(${(1+sc)/2*1.08}) rotate(-6deg)`,offset:.55},{transform:`translate(${dx}px,${dy}px) scale(${sc})`}],{duration:210,easing:'ease-out'});
  a.onfinish=()=>{c0.cl.remove();wEl.style.visibility='';onEnd&&onEnd(wr);};}
function sparks(rect,n,big){const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
  for(let i=0;i<n;i++){const s=document.createElement('div');s.className='spark';const a=Math.random()*6.283,d=30+Math.random()*(big?110:60),sz=big?7:5;
    s.style.cssText=`left:${cx}px;top:${cy}px;width:${sz}px;height:${sz}px;background:${['#ffcf5a','#fff3c0','#ff9a3a'][i%3]}`;document.body.appendChild(s);
    s.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:`translate(calc(-50% + ${Math.cos(a)*d}px),calc(-50% + ${Math.sin(a)*d}px)) scale(.2)`,opacity:0}],{duration:420+Math.random()*250,easing:'cubic-bezier(.2,.8,.3,1)'}).onfinish=()=>s.remove();}}
function shake(px){$('app').animate([{transform:`translate(${px}px,0)`},{transform:`translate(${-px}px,${px/2}px)`},{transform:`translate(${px/2}px,0)`},{transform:'none'}],{duration:260});}
// 階段を降りる場面転換
function descend(floor,zoneName,newZone,mid){const d=$('descend');$('descendT').textContent=`地下 ${floor} 階`;$('descendZ').textContent=newZone?`― ${zoneName} ―`:'';
  d.hidden=false;d.animate([{opacity:0},{opacity:1}],{duration:260,fill:'forwards'}).onfinish=()=>{mid();setTimeout(()=>{d.animate([{opacity:1},{opacity:0}],{duration:320,fill:'forwards'}).onfinish=()=>{d.hidden=true;};},newZone?900:420);};}
// 初回案内（吹き出し）
let hintStep=localStorage.getItem('mekuri_tut')||'0';
function hint(el,text){const h=$('hint');if(!el){h.hidden=true;return;}const r=el.getBoundingClientRect(),ar=$('app').getBoundingClientRect();
  h.textContent=text;h.hidden=false;h.style.left=Math.max(8,Math.min(ar.width-228,r.left-ar.left+r.width/2-110))+'px';h.style.top=(r.top-ar.top-58)+'px';}
function tutorial(){if(hintStep==='done'||!F||F.ended){hint(null);return;}
  const pl=playable();
  if(hintStep==='0'&&pl.length){const el=$('board').children[pl[0]].lastChild;hint(el,'光っているカードを取る（右下と数字が1つちがう）');return;}
  if(hintStep!=='done'&&!pl.length&&F.stock.length){hint($('stock'),'取れるカードが無い時は、山札をめくる');return;}
  hint(null);}
function tutDone(step){if(hintStep==='done')return;if(step==='take'&&hintStep==='0')hintStep='1';if(step==='draw'&&hintStep==='1')hintStep='done';localStorage.setItem('mekuri_tut',hintStep);}

// ===== BGM（地域ごとに曲が変わる・合成音） =====
const SONGS=[
  {ms:240,ch:[[0,3,7],[-4,0,3],[-2,2,5],[-5,-2,2]]},   // 石の回廊：Am F G Em
  {ms:290,ch:[[5,8,12],[1,5,8],[3,7,10],[0,3,7]]},     // 水の洞：Dm Bb C Am（ゆっくり）
  {ms:200,ch:[[7,10,14],[3,7,10],[5,9,12],[2,6,9]]},   // 溶岩の底：Em C D B（速い）
];
const BGM={on:localStorage.getItem('mekuri_bgm')!=='0',zone:0,step:0,timer:null};
function bgmStart(zone){BGM.zone=zone;if(BGM.timer)clearInterval(BGM.timer);BGM.step=0;if(!BGM.on)return;
  const S=SONGS[zone];BGM.timer=setInterval(()=>{if(!AC||!BGM.on)return;const st=BGM.step++,chord=S.ch[Math.floor(st/8)%4],root=110;
    const n=chord[[0,1,2,1][st%4]]+(st%8<4?12:24);tone(root*Math.pow(2,n/12),S.ms/1000*.9,'triangle',.022);
    if(st%4===0)tone(root*Math.pow(2,(chord[0]-12)/12),S.ms/1000*3.5,'square',.018);
    if(zone===2&&st%2===1)tone(80,.05,'square',.012);},S.ms);}
function bgmToggle(){BGM.on=!BGM.on;localStorage.setItem('mekuri_bgm',BGM.on?'1':'0');$('bgmBtn').textContent=BGM.on?'🔊':'🔇';if(BGM.on){ac();bgmStart(BGM.zone);}else if(BGM.timer)clearInterval(BGM.timer);}
