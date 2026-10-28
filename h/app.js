// ことば帖 — 紙片を重ねると、AIが新しい言葉を作る。全員で共有し、最初に作った人は「世界初」
const API = 'https://word-craft-api.omoide-games.workers.dev';
const $ = s => document.querySelector(s);
const KEY = 'kotoba_v1';
const BASE = [['朝', '🌅'], ['夜', '🌙'], ['雨', '🌧️'], ['仕事', '💼'], ['家', '🏠'], ['人', '🧑']];
const ymd = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

let ST = JSON.parse(localStorage.getItem(KEY) || 'null');
if (!ST) ST = { pid: Math.random().toString(36).slice(2, 12), inv: BASE.map(([n, e]) => ({ n, e, src: 'base' })), desk: [], cache: {}, days: {}, started: false };
const save = () => localStorage.setItem(KEY, JSON.stringify(ST));
const has = n => ST.inv.find(x => x.n === n);
let tab = 'all', uid = 1;

// ---------- トレイ ----------
function slipHTML(x, extra = '') { return `<span class="slip ${x.wf ? 'wf' : ''} ${x.day === ymd() && x.src === 'diary' ? 'today' : ''} ${extra}" data-n="${esc(x.n)}"><span class="e">${x.e}</span>${esc(x.n)}</span>`; }
function renderTray(fresh) {
  const q = $('#q').value.trim();
  let list = ST.inv.slice().reverse();
  if (tab === 'today') list = list.filter(x => x.day === ymd());
  if (tab === 'wf') list = list.filter(x => x.wf);
  if (q) list = list.filter(x => x.n.includes(q));
  $('#slips').innerHTML = list.length ? list.map(x => slipHTML(x, x.n === fresh ? 'new' : '')).join('') : `<span style="color:var(--sub);font-size:13px;padding:6px">${tab === 'today' ? '今日の日記を書くと、ここに素材が入ります' : tab === 'wf' ? 'まだ世界初の発見はありません' : 'ありません'}</span>`;
  $('#nAll').textContent = ST.inv.length; $('#nWf').textContent = ST.inv.filter(x => x.wf).length;
}
$('#tabs').onclick = e => { const b = e.target.closest('button'); if (!b) return; tab = b.dataset.t; document.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('on', x === b)); renderTray(); };
$('#q').oninput = () => renderTray();
$('#slips').onclick = e => { const s = e.target.closest('.slip'); if (!s) return; SND.pick(); placeOnDesk(s.dataset.n); };

// ---------- 机 ----------
const desk = $('#desk');
function freeSpot() {
  const W = desk.clientWidth, H = desk.clientHeight;
  for (let i = 0; i < 40; i++) {
    const x = 50 + Math.random() * (W - 100), y = 34 + Math.random() * (H - 80);
    if (ST.desk.every(d => Math.abs(d.x - x) > 80 || Math.abs(d.y - y) > 40)) return [x, y];
  }
  return [W / 2 + (Math.random() - .5) * 60, H / 2 + (Math.random() - .5) * 60];
}
function placeOnDesk(n, x, y, born) {
  const it = has(n); if (!it) return;
  if (x == null) [x, y] = freeSpot();
  const d = { id: uid++, n, x, y, r: (Math.random() * 6 - 3).toFixed(1) };
  ST.desk.push(d); save(); drawSlip(d, born); hint();
}
function drawSlip(d, born) {
  const it = has(d.n) || { n: d.n, e: '✨' };
  const w = document.createElement('div'); w.innerHTML = slipHTML(it, born ? 'born' : ''); const el = w.firstChild;
  el.dataset.id = d.id; el.style.left = d.x + 'px'; el.style.top = d.y + 'px'; el.style.setProperty('--r', d.r + 'deg');
  desk.appendChild(el); bindDrag(el, d);
  if (born) setTimeout(() => el.classList.remove('born'), 600);
}
function removeDesk(d) { ST.desk = ST.desk.filter(x => x !== d); const el = desk.querySelector(`.slip[data-id="${d.id}"]`); if (el) el.remove(); save(); hint(); }
function hint() { $('#deskhint').style.display = ST.desk.length ? 'none' : ''; }
$('#sweep').onclick = () => { ST.desk.slice().forEach(removeDesk); SND.drop(); };

function bindDrag(el, d) {
  let ox, oy, target = null, moved = false;
  el.addEventListener('pointerdown', e => {
    if (el.classList.contains('busy')) return;
    e.preventDefault(); el.setPointerCapture(e.pointerId); el.classList.add('drag'); SND.pick();
    const r = desk.getBoundingClientRect(); ox = e.clientX - r.left - d.x; oy = e.clientY - r.top - d.y; moved = false;
  });
  el.addEventListener('pointermove', e => {
    if (!el.classList.contains('drag')) return;
    const r = desk.getBoundingClientRect(); d.x = e.clientX - r.left - ox; d.y = e.clientY - r.top - oy; moved = true;
    el.style.left = d.x + 'px'; el.style.top = d.y + 'px';
    const t = ST.desk.find(o => o !== d && Math.abs(o.x - d.x) < 55 && Math.abs(o.y - d.y) < 26);
    if (t !== target) { desk.querySelectorAll('.target').forEach(x => x.classList.remove('target')); target = t; if (t) desk.querySelector(`.slip[data-id="${t.id}"]`)?.classList.add('target'); }
  });
  const up = () => {
    if (!el.classList.contains('drag')) return;
    el.classList.remove('drag'); desk.querySelectorAll('.target').forEach(x => x.classList.remove('target'));
    if (target) { combine(d, target); target = null; return; }
    if (d.y < -10 || d.y > desk.clientHeight + 10) { removeDesk(d); SND.drop(); return; } // 机の外へ出したら片付け
    if (moved) SND.drop(); save();
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
}

// ---------- 混ぜる ----------
async function combine(d1, d2) {
  const e1 = desk.querySelector(`.slip[data-id="${d1.id}"]`), e2 = desk.querySelector(`.slip[data-id="${d2.id}"]`);
  e1.classList.add('busy'); e2.classList.add('busy'); SND.mix();
  const mx = (d1.x + d2.x) / 2, my = (d1.y + d2.y) / 2;
  const th = document.createElement('div'); th.className = 'thinking'; th.textContent = '🌀'; th.style.left = mx + 'px'; th.style.top = my + 'px'; desk.appendChild(th);
  const [a, b] = [d1.n, d2.n].sort(); const key = a + '+' + b;
  let r = ST.cache[key];
  if (!r) {
    try {
      const res = await fetch(API + '/api/combine', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ a, b, pid: ST.pid }) });
      r = await res.json();
      if (!r.error) ST.cache[key] = { name: r.name, emoji: r.emoji, desc: r.desc };
    } catch { r = { error: 'net' }; }
  }
  th.remove(); e1.classList.remove('busy'); e2.classList.remove('busy');
  if (r.error) { toast(r.error === 'limit' ? '今日はここまで（使いすぎ防止）' : '通信できませんでした'); return; }
  if (!r.name) { SND.fail(); toast('何も起きなかった…'); d1.x -= 30; d2.x += 30; [[e1, d1], [e2, d2]].forEach(([el, d]) => { el.style.left = d.x + 'px'; }); save(); return; }
  removeDesk(d1); removeDesk(d2); splash(mx, my);
  const mine = has(r.name);
  if (!mine) ST.inv.push({ n: r.name, e: r.emoji, d: r.desc, from: [a, b], day: ymd(), src: 'mix', wf: !!r.world_first });
  placeOnDesk(r.name, mx, my, true); save(); renderTray(r.name);
  if (mine) { SND.old(); return; }
  if (r.world_first) { reveal(r, a, b, true); return; }
  SND.found(); toast(`新発見：${r.emoji} ${r.name}`);
}
function splash(x, y) {
  for (let i = 0; i < 14; i++) {
    const p = document.createElement('div'); p.className = 'ink'; const s = 3 + Math.random() * 7, a = Math.random() * 6.28, v = 30 + Math.random() * 50;
    p.style.cssText = `width:${s}px;height:${s}px;left:${x}px;top:${y}px;--dx:${Math.cos(a) * v}px;--dy:${Math.sin(a) * v}px`;
    desk.appendChild(p); setTimeout(() => p.remove(), 650);
  }
}
function toast(t) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; $('#app').appendChild(el); setTimeout(() => el.remove(), 2200); }

function reveal(r, a, b, wf) {
  const w = document.createElement('div'); w.className = 'stampwrap';
  w.innerHTML = `<div class="card"><div class="how">${esc(a)} ＋ ${esc(b)}</div><div class="big">${r.emoji}</div><h2>${esc(r.name)}</h2><div class="desc">${esc(r.desc || '')}</div>
    ${wf ? '<div class="hanko">世界<br>初</div><div style="font-size:13px;color:var(--red);margin:-6px 0 12px">この言葉を作ったのは、あなたが世界で最初です</div>' : ''}
    <div class="btns">${wf ? '<button id="sh">投稿する</button>' : ''}<button class="main" id="ok">続ける</button></div></div>`;
  $('#app').appendChild(w);
  if (wf) { SND.stamp(); SND.fanfare(); if (navigator.vibrate) setTimeout(() => navigator.vibrate(40), 250); }
  w.querySelector('#ok').onclick = () => w.remove();
  const sh = w.querySelector('#sh');
  if (sh) sh.onclick = () => window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(`「${a}」＋「${b}」＝「${r.name}」${r.emoji}\nこの言葉を、世界で最初に見つけた。\n#ことば帖\n${location.href.split('?')[0]}`), '_blank');
}

// ---------- 日記 ----------
function diary() {
  const w = document.createElement('div'); w.className = 'diary';
  w.innerHTML = `<div class="sheet"><h3>今日は、どんな日？</h3><p>1行でいい。書いた文から、素材になる言葉を3つ取り出します。</p>
    <textarea maxlength="120" placeholder="例：同期と駅前でカレー。帰りに雨に降られた">${esc(ST.days[ymd()] || '')}</textarea>
    <div class="row"><button id="no">あとで</button><button class="main" id="ok">書いた</button></div></div>`;
  $('#app').appendChild(w);
  w.querySelector('#no').onclick = () => w.remove();
  w.querySelector('#ok').onclick = async () => {
    const text = w.querySelector('textarea').value.trim(); if (!text) return;
    const ok = w.querySelector('#ok'); ok.textContent = '素材を探しています…'; ok.disabled = true;
    let items = [];
    try { const r = await (await fetch(API + '/api/extract', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, pid: ST.pid }) })).json(); items = r.items || []; } catch { }
    w.remove();
    if (!items.length) { toast('素材が見つかりませんでした'); return; }
    ST.days[ymd()] = text;
    const got = [];
    for (const it of items) { if (!has(it.name)) { ST.inv.push({ n: it.name, e: it.emoji, day: ymd(), src: 'diary' }); got.push(it); } }
    save(); renderTray();
    items.forEach((it, i) => setTimeout(() => { placeOnDesk(it.name, null, null, true); SND.drop(); }, 200 + i * 250));
    toast(got.length ? `日記から素材：${got.map(x => x.emoji + x.name).join('・')}` : 'その素材は、もう持っています');
  };
  setTimeout(() => w.querySelector('textarea').focus(), 300);
}
$('#write').onclick = diary;

// ---------- はじめて ----------
function title() {
  const t = document.createElement('div'); t.className = 'title';
  t.innerHTML = `<h1>ことば帖</h1><p>言葉の紙片を重ねると、<br>新しい言葉が生まれる。<br>あなたの日記の言葉も、素材になる。<br>誰も作ったことのない言葉を作ったら、<br><b style="color:var(--red)">世界初</b>の判子が押される。</p>
    <div class="ex"><span class="slip"><span class="e">🌧️</span>雨</span>＋<span class="slip"><span class="e">🌅</span>朝</span>→<span class="slip wf"><span class="e">🌈</span>虹</span></div>
    <button id="go">はじめる</button>`;
  document.body.appendChild(t);
  t.querySelector('#go').onclick = () => { t.remove(); ST.started = true; save(); ['朝', '雨', '仕事', '夜'].forEach((n, i) => setTimeout(() => { placeOnDesk(n, null, null, true); SND.drop(); }, i * 180)); };
}

ST.desk.forEach(d => drawSlip(d)); uid = Math.max(1, ...ST.desk.map(d => d.id + 1));
renderTray(); hint();
if (!ST.started) title();
