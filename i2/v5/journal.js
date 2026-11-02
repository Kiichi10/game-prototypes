'use strict';
// ===== 探検記：1回の探検を1枚の地図にする =====
const JKEY='mekuri_journal';
const loadJ=()=>{try{return JSON.parse(localStorage.getItem(JKEY))||[];}catch(e){return [];}};
function epithet(j){const fl=j.floors,sum=k=>fl.reduce((a,f)=>a+(f[k]||0),0),mon=sum('mon'),chest=sum('chest'),clears=fl.filter(f=>f.end==='clear').length,deep=j.deep;
  // 遊び方ごとの点数を比べて、いちばん目立つものを称号にする
  const c=[[mon/Math.max(1,deep)*3,'魔物狩り'],[j.maxChain/6,'連鎖使い'],[chest/Math.max(1,deep)*2.4,'宝さがし'],[clears/Math.max(1,deep)*3,'根こそぎ'],[j.gold/Math.max(1,deep)/28,'金の亡者'],[deep/5,'深淵行き']].sort((a,b)=>b[0]-a[0]);
  if(c[0][0]<.8)return '駆け出しの探検家';return c[0][1]+'の探検家';}
function saveJournal(){const j={id:Date.now(),date:DKEY,deep:R.floor,gold:R.gold,maxChain:R.maxChain,relics:R.relics.slice(),floors:R.trip,why:R.why||'lost'};j.title=epithet(j);
  const L=loadJ();L.unshift(j);localStorage.setItem(JKEY,JSON.stringify(L.slice(0,20)));return j;}
function journalCanvas(j){const W=720,HEAD=190,BAND=104,FOOT=60,c=document.createElement('canvas');c.width=W;c.height=HEAD+BAND*j.floors.length+FOOT;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
  const put=(n,cx,cy,sc=2)=>{const s=sprCanvas(n);const w=s.w*sc,h=s.h*sc;x.drawImage(s.c,Math.round(cx-w/2),Math.round(cy-h/2),w,h);return w;};
  const text=(s,tx,ty,sz,col,al='left')=>{x.font=`${sz}px DotGothic16`;x.textAlign=al;x.fillStyle='#000';x.fillText(s,tx+2,ty+2);x.fillStyle=col;x.fillText(s,tx,ty);};
  x.fillStyle='#120e0a';x.fillRect(0,0,W,c.height);
  text('めくって降りる地下　探検記',W/2,50,26,'#c8a860','center');text(j.title,W/2,104,44,'#ffcf5a','center');
  const [yy,mm,dd]=j.date.split('-');text(`${yy}年${mm}月${dd}日　到達 地下${j.deep}階　最大${j.maxChain}連鎖`,W/2,146,22,'#f2e6c8','center');
  let rx=W/2-(j.relics.length*30)/2+15;j.relics.slice(0,14).forEach(k=>{put(EMO[RELICS[k].ic],rx,172,1.5);rx+=30;});
  const zc=[['#2c241c','#17120d'],['#16283a','#0a1420'],['#34140e','#1a0805']],tl=['#ffcf5a','#8ad8f0','#ff9a5a'];
  const px=i=>70+(i/6)*190;let prev=null;
  j.floors.forEach((f,i)=>{const y=HEAD+i*BAND,z=zoneOf(f.f);x.fillStyle=zc[z][0];x.fillRect(0,y,W,BAND);x.fillStyle=zc[z][1];
    for(let r=0;r<BAND;r+=26){x.fillRect(0,y+r,W,2);for(let q=(r/26)%2*40;q<W;q+=80)x.fillRect(q,y+r,2,26);}
    x.fillStyle='rgba(0,0,0,.34)';x.fillRect(0,y,W,BAND);x.fillStyle='#000';x.fillRect(0,y+BAND-3,W,3);
    text(`B${f.f}`,14,y+BAND/2+9,24,tl[z]);
    const nx=px(f.col),ny=y+BAND/2;
    if(prev){x.fillStyle='#f2e6c8';const dx=nx-prev.x,dy=ny-prev.y,n=Math.ceil(Math.hypot(dx,dy)/12);for(let k=1;k<n;k++){x.fillRect(Math.round(prev.x+dx*k/n)-2,Math.round(prev.y+dy*k/n)-2,5,5);}}
    prev={x:nx,y:ny};
    // 階の終わり方
    const last=i===j.floors.length-1,mon=['goblin','wisp','demon'][z];
    if(f.end==='clear')put('star',nx,ny,3);else if(f.end==='stairs')put('stairs',nx,ny,3);else if(f.end==='dead')put(mon,nx,ny,3);else put('skull',nx,ny,3);
    if(last)put('hero',nx+46,ny,3);
    // その階で手に入れた物
    let ix=320;const row=(n,sc=2)=>{const w=put(n,ix,ny-16,sc);ix+=w+6;};
    for(let m=0;m<Math.min(f.mon,4);m++)row(mon);if(f.mon>4)text(`×${f.mon}`,ix,ny-8,20,'#fff');
    for(let m=0;m<Math.min(f.chest,3);m++)row('chest');
    (f.relics||[]).slice(0,4).forEach(k=>row(EMO[RELICS[k].ic]));
    put('coin',330,ny+24,1.5);text(`${f.gold}`,346,ny+32,22,'#ffcf5a');
    text(`${f.chain}連鎖`,430,ny+32,20,f.chain>=10?'#ff9a5a':'#c8b890');
    if(f.hurt)for(let h=0;h<Math.min(f.hurt,3);h++)put('heart0',540+h*24,ny+24,2);
    if(f.end==='dead')text('ここで力尽きた',W-20,ny+32,20,'#ff8a7a','right');else if(f.end==='lost')text(`階段まで届かず`,W-20,ny+32,20,'#c8a860','right');else if(f.end==='clear')text('全部取った',W-20,ny+32,20,'#ffcf5a','right');
  });
  text('kiichi10.github.io/game-prototypes/i2/',W/2,c.height-22,20,'#7a6a4a','center');return c;}
function openJournal(j,back){return document.fonts.load('20px DotGothic16').then(()=>{const c=journalCanvas(j);$('jImg').src=c.toDataURL('image/png');$('jDl').onclick=()=>{const a=document.createElement('a');a.download=`探検記_地下${j.deep}階.png`;a.href=$('jImg').src;a.click();};$('jBack').onclick=()=>{$('jSheet').hidden=true;};$('jSheet').hidden=false;});}
function openJournalList(){const L=loadJ(),box=$('jList');box.innerHTML=L.length?'':'<p>まだ探検記がありません。<br>力尽きると、ここに残ります。</p>';
  L.forEach(j=>{const b=document.createElement('button');b.className='pick';const[,m,d]=j.date.split('-');b.innerHTML=`<b>${j.title}<span class="cost">地下${j.deep}階</span></b>${m}/${d}　${j.floors.map(f=>({clear:'🌟',stairs:'🪜',dead:'👹',lost:'💀'}[f.end])).join('')}`;b.onclick=()=>openJournal(j);box.appendChild(b);});
  $('jListSheet').hidden=false;}
