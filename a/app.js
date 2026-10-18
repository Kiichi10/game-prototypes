// あなたの感覚は何年生まれ？ — 本体（日本語・英語）
const $ = q => document.querySelector(q);
const N = 10, X_MIN = 1950, X_MAX = 2010;
let lang = pickLang(), L = STR[lang], P = PACK[lang];
let set = [], picks = [], result = null;

const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const show = id => { document.querySelectorAll('.screen').forEach(e => e.hidden = e.id !== id); window.scrollTo(0, 0); };

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
  set = shuffle(P.q).slice(0, N); picks = [];
  show('s-q'); ask();
}
function ask() {
  const i = picks.length, Q = set[i];
  $('#dots').innerHTML = set.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('');
  $('#qbox').innerHTML = `<div class="slide"><div class="qn">${L.qn(i + 1, N)}</div><div class="qt mincho">${Q.q}</div>` +
    shuffle(Q.a.map((a, k) => [a, k])).map(([a, k]) => `<button class="opt" data-k="${k}">${a[0]}</button>`).join('') + '</div>';
  document.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    b.classList.add('pick'); picks.push(Q.a[+b.dataset.k]);
    setTimeout(() => picks.length < N ? ask() : calc(), 180);
  });
}
function calc() {
  const ys = picks.map(p => p[1]);
  const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
  const sd = Math.sqrt(ys.reduce((a, b) => a + (b - mean) ** 2, 0) / ys.length);
  result = { y: Math.round(mean), sd, ys };
  show('s-calc');
  let t = 0; const iv = setInterval(() => { $('#calcY').textContent = 1950 + Math.floor(Math.random() * 60); if (++t > 16) { clearInterval(iv); render(); } }, 70);
}
const typeOf = y => P.t.find(t => y <= t[0]);
function render() {
  const y = result.y, T = typeOf(y);
  $('#resY').textContent = y; $('#resWa').textContent = L.sub(y);
  $('#resType').textContent = T[1]; $('#resDesc').textContent = T[2];
  const sel = $('#realSel');
  sel.innerHTML = `<option value="">${L.realPh}</option>` + Array.from({ length: 2015 - 1935 + 1 }, (_, k) => 2015 - k).map(v => `<option value="${v}">${L.realOpt(v)}</option>`).join('');
  sel.onchange = () => { result.real = sel.value ? +sel.value : null; gapText(); bar(); card(); };
  result.real = null; $('#gap').innerHTML = '';
  $('#spread').textContent = L.spread(result.sd, T[1]);
  $('#ans').innerHTML = set.map((Q, i) => `<li><b>${picks[i][0]}</b><span>${L.era(picks[i][1])}</span></li>`).join('');
  bar(); card(); show('s-res');
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
  c.fillStyle = '#1f1b16'; c.font = `600 34px ${serif}`; c.fillText(L.cardPre, 80, 120);
  c.font = `600 190px ${serif}`; c.fillText(result.y, 70, 310);
  const w = c.measureText(result.y).width; c.font = `600 48px ${serif}`; c.fillText(L.unit, 90 + w, 310);
  c.fillStyle = '#7a7167'; c.font = `30px ${sans}`; c.fillText(L.sub(result.y), 84, 365);
  c.font = `bold 34px ${sans}`; const tw = c.measureText(T[1]).width;
  c.fillStyle = '#d9452b'; roundRect(c, 80, 400, tw + 56, 64, 32); c.fill();
  c.fillStyle = '#fff'; c.fillText(T[1], 108, 444);
  if (result.real) { c.fillStyle = '#1f1b16'; c.font = `bold 34px ${sans}`; c.fillText(L.cardGap(result.real - result.y), 80, 530); }
  c.fillStyle = '#7a7167'; c.font = `24px ${sans}`; c.fillText(L.htmlTitle, 80, 590);
  c.strokeStyle = '#1f1b16'; c.lineWidth = 6; c.strokeRect(20, 20, 1160, 590);
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

$('#startBtn').onclick = start;
$('#againBtn').onclick = start;
$('#langBtn').onclick = () => { lang = lang === 'ja' ? 'en' : 'ja'; try { localStorage.setItem('instinct_lang', lang); } catch (e) { } applyLang(); };
$('#saveBtn').onclick = () => { const a = document.createElement('a'); a.download = L.file(result.y); a.href = $('#card').toDataURL('image/png'); a.click(); };
$('#shareBtn').onclick = () => window.open('https://x.com/intent/tweet?text=' + encodeURIComponent(L.shareText(result.y, typeOf(result.y)[1], result.real ? result.real - result.y : null)), '_blank');
applyLang();
