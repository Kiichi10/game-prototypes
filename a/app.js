// あなたの感覚は何年生まれ？ — 本体
const $ = q => document.querySelector(q);
const N = 10, NOW = 2026, X_MIN = 1950, X_MAX = 2010;
let set = [], picks = [], result = null;

const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const show = id => { document.querySelectorAll('.screen').forEach(e => e.hidden = e.id !== id); window.scrollTo(0, 0); };
function wareki(y) {
  if (y >= 2019) return `令和${y === 2019 ? '元' : y - 2018}年`;
  if (y >= 1989) return `平成${y === 1989 ? '元' : y - 1988}年`;
  if (y >= 1926) return `昭和${y - 1925}年`;
  return `大正${y - 1911}年`;
}
const eraWord = y => y < 1965 ? '昭和前半' : y < 1989 ? '昭和後半' : y < 2005 ? '平成前半' : '平成後半〜';

function start() {
  set = shuffle(QUESTIONS).slice(0, N); picks = [];
  show('s-q'); ask();
}
function ask() {
  const i = picks.length, Q = set[i];
  $('#dots').innerHTML = set.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('');
  $('#qbox').innerHTML = `<div class="slide"><div class="qn">Q${i + 1} / ${N}</div><div class="qt mincho">${Q.q}</div>` +
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
function typeOf(y) { return TYPES.find(t => y <= t[0]); }
function render() {
  const y = result.y, T = typeOf(y);
  $('#resY').textContent = y; $('#resWa').textContent = `（${wareki(y)}）`;
  $('#resType').textContent = T[1]; $('#resDesc').textContent = T[2];
  const sel = $('#realSel');
  sel.innerHTML = '<option value="">選んでください（任意）</option>' + Array.from({ length: 2015 - 1935 + 1 }, (_, k) => 2015 - k).map(v => `<option value="${v}">${v}年（${wareki(v)}）</option>`).join('');
  sel.onchange = () => { result.real = sel.value ? +sel.value : null; gapText(); bar(); card(); };
  result.real = null; $('#gap').innerHTML = '';
  const s = result.sd;
  $('#spread').textContent = s < 7 ? 'どの質問でも同じ時代の答えを選んでいます。筋金入りの「' + T[1] + '」です。' :
    s < 13 ? 'だいたい同じ時代ですが、ところどころ別の世代の顔がのぞきます。' : '答えが時代をまたいでいます。昭和と令和を行き来する、器用な感覚の持ち主です。';
  $('#ans').innerHTML = set.map((Q, i) => `<li><b>${picks[i][0]}</b><span>${eraWord(picks[i][1])}</span></li>`).join('');
  bar(); card(); show('s-res');
}
function gapText() {
  const r = result.real; if (!r) { $('#gap').innerHTML = ''; return; }
  const d = r - result.y; // プラス = 感覚の方が年上
  const msg = Math.abs(d) <= 2 ? '実年齢とほぼ同じ。<span class="r">年相応</span>の感覚です。'
    : d > 0 ? `実年齢より<span class="r">${d}歳 年上</span>の感覚です。` : `実年齢より<span class="r">${-d}歳 若い</span>感覚です。`;
  const tail = Math.abs(d) <= 2 ? '' : d > 0 ? (d >= 15 ? '<br>落ち着きが、もはや親世代。' : '<br>ちょっと渋めの感覚かもしれません。') : (-d >= 15 ? '<br>職場で一番話が通じるのは、たぶん新人です。' : '<br>新しいものへの抵抗が少ないタイプです。');
  $('#gap').innerHTML = msg + tail;
}
const xp = y => Math.max(0, Math.min(100, (y - X_MIN) / (X_MAX - X_MIN) * 100));
function bar() {
  const b = $('#bar'); b.querySelectorAll('.pt,.me,.real').forEach(e => e.remove());
  result.ys.forEach(y => b.insertAdjacentHTML('beforeend', `<div class="pt" style="left:${xp(y)}%"></div>`));
  b.insertAdjacentHTML('beforeend', `<div class="me" style="left:${xp(result.y)}%"></div>`);
  if (result.real) b.insertAdjacentHTML('beforeend', `<div class="real" style="left:${xp(result.real)}%"></div>`);
}
function shareText() {
  const T = typeOf(result.y), r = result.real, d = r ? r - result.y : 0;
  return `私の感覚は「${result.y}年生まれ（${wareki(result.y)}）」でした。タイプは「${T[1]}」` + (r && Math.abs(d) > 2 ? `。実年齢より${Math.abs(d)}歳${d > 0 ? '年上' : '若い'}感覚らしい。` : '。') + '\n#感覚は何年生まれ';
}
function card() {
  const c = $('#card').getContext('2d'), T = typeOf(result.y);
  c.fillStyle = '#f6f1e7'; c.fillRect(0, 0, 1200, 630);
  c.fillStyle = '#1f1b16'; c.font = '600 34px "Hiragino Mincho ProN", serif'; c.fillText('私の感覚は', 80, 120);
  c.font = '600 190px "Hiragino Mincho ProN", serif'; c.fillText(result.y, 70, 310);
  const w = c.measureText(result.y).width; c.font = '600 48px "Hiragino Mincho ProN", serif'; c.fillText('年生まれ', 90 + w, 310);
  c.fillStyle = '#7a7167'; c.font = '30px "Hiragino Sans", sans-serif'; c.fillText(`（${wareki(result.y)}）`, 84, 365);
  c.fillStyle = '#d9452b'; roundRect(c, 80, 400, c.measureText(T[1]).width * 1.15 + 60, 64, 32); c.fill();
  c.fillStyle = '#fff'; c.font = 'bold 34px "Hiragino Sans", sans-serif'; c.fillText(T[1], 108, 444);
  if (result.real) {
    const d = result.real - result.y; c.fillStyle = '#1f1b16'; c.font = 'bold 34px "Hiragino Sans", sans-serif';
    c.fillText(Math.abs(d) <= 2 ? '実年齢とほぼ同じ感覚' : `実年齢より ${Math.abs(d)}歳 ${d > 0 ? '年上' : '若い'} 感覚`, 80, 530);
  }
  c.fillStyle = '#7a7167'; c.font = '24px "Hiragino Sans", sans-serif'; c.fillText('あなたの感覚は、何年生まれ？', 80, 590);
  c.strokeStyle = '#1f1b16'; c.lineWidth = 6; c.strokeRect(20, 20, 1160, 590);
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

$('#startBtn').onclick = start;
$('#againBtn').onclick = start;
$('#saveBtn').onclick = () => { const a = document.createElement('a'); a.download = `感覚は${result.y}年生まれ.png`; a.href = $('#card').toDataURL('image/png'); a.click(); };
$('#shareBtn').onclick = () => window.open('https://x.com/intent/tweet?text=' + encodeURIComponent(shareText()), '_blank');
