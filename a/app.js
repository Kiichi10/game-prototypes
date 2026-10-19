// あなたの感覚は何年生まれ？ — 本体（日本語・英語／答えに応じて次の質問を選ぶ）
const $ = q => document.querySelector(q);
const X_MIN = 1950, X_MAX = 2010;
let lang = pickLang(), L = STR[lang], P = PACK[lang];
let prior = null, asked = [], pool = [], result = null;
// ── データ送信（Cloudflare）。API が空のあいだは何も送らない ──
const QS = new URLSearchParams(location.search);
// 本番の窓口（2026-10-19 公開）。?api=off で送信しない。?api=URL で別の窓口。
const API = QS.get('api') === 'off' ? '' : (QS.get('api') || 'https://instinct-year-api.omoide-games.workers.dev');
const VER = QS.get('test') ? 'TEST' : 'a2', STAT_MIN = +(QS.get('statmin') || 30); // ?test=1 の記録は後で消せる印を付ける
let playId = null, STATS = null;
// 質問の文面から作る固定ID（文面を変えたら別の質問として扱う）
const qid = Q => { let h = 0x811c9dc5; for (const ch of Q.q) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
const apiPost1 = (path, body) => fetch(API + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).then(r => r.json()).catch(() => null);
// 失敗したら1.5秒待って1回だけ送り直す（2026-10-19 公開直後に一時的なサーバーエラーが続いたため）
const apiPost = (path, body) => !API ? Promise.resolve(null) : apiPost1(path, body).then(r => r && r.ok ? r : new Promise(ok => setTimeout(ok, 1500)).then(() => apiPost1(path, body)));
function loadStats() { if (!API) return; fetch(`${API}/api/stats?lang=${lang}`).then(r => r.json()).then(d => { STATS = d; }).catch(() => { }); }
// この答えを選んだ人の、一番多い生まれ年代と割合（STAT_MIN人以上いる時だけ）
function realEra(a) {
  const o = STATS && STATS.s && STATS.s[qid(a.Q)] && STATS.s[qid(a.Q)][a.k]; if (!o) return null;
  const tot = Object.values(o).reduce((x, y) => x + y, 0); if (tot < STAT_MIN) return null;
  const [dec, n] = Object.entries(o).sort((x, y) => y[1] - x[1])[0]; return L.realEra(+dec, Math.round(n / tot * 100), tot);
}

const show = id => { document.querySelectorAll('.screen').forEach(e => e.hidden = e.id !== id); window.scrollTo(0, 0); };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function applyLang() {
  L = STR[lang]; P = PACK[lang];
  document.documentElement.lang = lang; document.title = L.htmlTitle;
  document.documentElement.style.setProperty('--serif', L.serif); document.documentElement.style.setProperty('--sans', L.sans);
  document.querySelectorAll('[data-t]').forEach(e => e.textContent = L[e.dataset.t]);
  document.querySelectorAll('[data-h]').forEach(e => e.innerHTML = L[e.dataset.h]);
  $('#strip').innerHTML = L.strip.map(s => `<span>${s}</span>`).join('');
  $('#langBtn').textContent = L.other;
}
function start() {
  prior = normalize(ENGINE.years().map(() => 1)); asked = []; pool = shuffle(P.q); playId = null; loadStats();
  show('s-q'); ask();
}
function ask() {
  const Q = pickNext(prior, pool, asked); pool = pool.filter(x => x !== Q);
  liveMeter();
  $('#qbox').innerHTML = `<div class="slide"><div class="qn">${L.qnA(asked.length + 1)}</div><div class="qt mincho">${Q.q}</div>` +
    shuffle(Q.a.map((a, k) => [a, k])).map(([a, k]) => `<button class="opt" data-k="${k}">${a[0]}</button>`).join('') + '</div>';
  document.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    if (b.classList.contains('pick')) return;
    b.classList.add('pick'); const k = +b.dataset.k;
    asked.push({ Q, k }); prior = post(prior, Q, k);
    setTimeout(() => shouldStop(prior, asked.length) || !pool.length ? calc() : ask(), 180);
  });
}
// 答えるたびに更新される「予想の分布」
function liveMeter() {
  const c = $('#liveC').getContext('2d'), W = 1000, H = 150, ys = ENGINE.years(), mx = Math.max(...prior);
  c.clearRect(0, 0, W, H);
  c.strokeStyle = '#e2d9c8'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, H - 22); c.lineTo(W, H - 22); c.stroke();
  c.fillStyle = '#7a7167'; c.font = '22px sans-serif';
  [1950, 1970, 1990, 2010].forEach(y => c.fillText(y, Math.min(W - 52, (y - ENGINE.Y0) / (ENGINE.Y1 - ENGINE.Y0) * W - 24), H - 2));
  c.beginPath(); c.moveTo(0, H - 22);
  prior.forEach((v, i) => c.lineTo(i / (ys.length - 1) * W, H - 22 - (v / mx) * (H - 40)));
  c.lineTo(W, H - 22); c.closePath(); c.fillStyle = asked.length ? 'rgba(217,69,43,.22)' : 'rgba(31,27,22,.08)'; c.fill();
  c.strokeStyle = asked.length ? '#d9452b' : '#bdb3a4'; c.lineWidth = 3; c.stroke();
  const s = stats(prior);
  $('#liveT').innerHTML = asked.length ? L.liveT(Math.round(s.mean), Math.round(s.conf * 100)) : L.liveFirst;
}
function calc() {
  const s = stats(prior);
  result = { y: Math.round(s.mean), lo: s.lo, hi: s.hi, sd: s.sd, ys: asked.map(a => a.Q.a[a.k][1]), cats: categoryYears(asked) };
  show('s-calc');
  let t = 0; const iv = setInterval(() => { $('#calcY').textContent = 1950 + Math.floor(Math.random() * 60); if (++t > 16) { clearInterval(iv); render(); } }, 70);
}
const typeOf = y => P.t.find(t => y <= t[0]);
function render() {
  const y = result.y, T = typeOf(y);
  $('#resY').textContent = y; $('#resWa').textContent = L.sub(y);
  $('#resType').textContent = T[1]; $('#resDesc').textContent = T[2];
  $('#range').textContent = L.range(result.lo, result.hi);
  profile();
  const sel = $('#realSel');
  sel.innerHTML = `<option value="">${L.realPh}</option>` + Array.from({ length: 2015 - 1935 + 1 }, (_, k) => 2015 - k).map(v => `<option value="${v}">${L.realOpt(v)}</option>`).join('');
  sel.onchange = () => { result.real = sel.value ? +sel.value : null; gapText(); bar(); card(); if (playId && result.real) apiPost('/api/real', { id: playId, real: result.real }); };
  result.real = null; $('#gap').innerHTML = '';
  const m = result.ys.reduce((x, v) => x + v, 0) / result.ys.length; // 答えた年そのもののばらつき
  $('#spread').textContent = L.spread(Math.sqrt(result.ys.reduce((x, v) => x + (v - m) ** 2, 0) / result.ys.length), T[1]);
  $('#ans').innerHTML = asked.map(a => `<li><b>${a.Q.a[a.k][0]}</b><span>${realEra(a) || L.era(a.Q.a[a.k][1])}</span></li>`).join('');
  apiPost('/api/play', { lang, ver: VER, est: result.y, ans: asked.map(a => [qid(a.Q), a.k]) }).then(r => { if (r && r.ok) playId = r.id; });
  bar(); card(); show('s-res');
}
const catList = () => Object.entries(result.cats).map(([c, v]) => [L.cats[c], v.y]);
function profile() {
  const cs = Object.entries(result.cats);
  $('#prof').innerHTML = cs.map(([c, v]) => `<div class="prow"><span>${L.cats[c]}</span><div class="ptrack"><i style="left:${xp(v.y)}%"></i></div><b>${v.y}</b></div>`).join('');
  if (cs.length >= 2) {
    const sorted = cs.slice().sort((a, b) => b[1].y - a[1].y), hi = sorted[0], lo = sorted[sorted.length - 1];
    $('#profNote').textContent = L.profNote(L.cats[hi[0]], hi[1].y, L.cats[lo[0]], lo[1].y);
  } else $('#profNote').textContent = '';
}
function gapText() {
  const r = result.real; if (!r) { $('#gap').innerHTML = ''; return; }
  const d = r - result.y; // プラス = 感覚の方が年上
  $('#gap').innerHTML = L.gap(d) + L.gapTail(d);
}
const xp = y => Math.max(0, Math.min(100, (y - X_MIN) / (X_MAX - X_MIN) * 100));
function bar() {
  const b = $('#bar'); b.querySelectorAll('.pt,.me,.real').forEach(e => e.remove());
  result.ys.forEach(y => b.insertAdjacentHTML('beforeend', `<div class="pt" style="left:${xp(y)}%"></div>`));
  b.insertAdjacentHTML('beforeend', `<div class="me" style="left:${xp(result.y)}%"></div>`);
  if (result.real) b.insertAdjacentHTML('beforeend', `<div class="real" style="left:${xp(result.real)}%"></div>`);
}
function card() {
  const c = $('#card').getContext('2d'), T = typeOf(result.y), serif = L.serif, sans = L.sans;
  c.fillStyle = '#f6f1e7'; c.fillRect(0, 0, 1200, 630);
  c.fillStyle = '#1f1b16'; c.font = `600 32px ${serif}`; c.fillText(L.cardPre, 70, 110);
  c.font = `600 170px ${serif}`; c.fillText(result.y, 60, 290);
  const w = c.measureText(result.y).width; c.font = `600 42px ${serif}`; c.fillText(L.unit, 76 + w, 290);
  c.fillStyle = '#7a7167'; c.font = `28px ${sans}`; c.fillText(L.sub(result.y), 74, 340);
  c.font = `bold 32px ${sans}`; const tw = c.measureText(T[1]).width;
  c.fillStyle = '#d9452b'; roundRect(c, 70, 372, tw + 56, 60, 30); c.fill();
  c.fillStyle = '#fff'; c.fillText(T[1], 98, 413);
  if (result.real) { c.fillStyle = '#1f1b16'; c.font = `bold 30px ${sans}`; c.fillText(L.cardGap(result.real - result.y), 70, 500); }
  // 右側：分野ごとの感覚
  const cs = catList(), x0 = 740;
  c.fillStyle = '#7a7167'; c.font = `24px ${sans}`; c.fillText(L.profH, x0, 120);
  cs.forEach(([n, y], i) => {
    const yy = 175 + i * 82; c.fillStyle = '#1f1b16'; c.font = `26px ${sans}`; c.fillText(n, x0, yy);
    c.font = `600 44px ${serif}`; c.fillText(y, x0 + 250, yy + 6);
    c.fillStyle = '#e2d9c8'; c.fillRect(x0, yy + 20, 360, 6); c.fillStyle = '#d9452b'; c.beginPath(); c.arc(x0 + xp(y) / 100 * 360, yy + 23, 10, 0, 7); c.fill();
  });
  c.fillStyle = '#7a7167'; c.font = `22px ${sans}`; c.fillText(L.htmlTitle, 70, 588);
  c.strokeStyle = '#1f1b16'; c.lineWidth = 6; c.strokeRect(20, 20, 1160, 590);
  c.fillStyle = '#e2d9c8'; c.fillRect(700, 70, 2, 470);
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

$('#startBtn').onclick = start;
$('#againBtn').onclick = start;
$('#langBtn').onclick = () => { lang = lang === 'ja' ? 'en' : 'ja'; try { localStorage.setItem('instinct_lang', lang); } catch (e) { } applyLang(); };
$('#saveBtn').onclick = () => { const a = document.createElement('a'); a.download = L.file(result.y); a.href = $('#card').toDataURL('image/png'); a.click(); };
$('#shareBtn').onclick = () => window.open('https://x.com/intent/tweet?text=' + encodeURIComponent(L.shareText(result.y, typeOf(result.y)[1], result.real ? result.real - result.y : null).replace('\n', L.shareCats(catList()) + '\n')), '_blank');
applyLang();
