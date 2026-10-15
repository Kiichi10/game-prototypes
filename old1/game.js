// 選ばなかった方の私 — 本体
const NOW = 2026;
const $ = s => document.querySelector(s);
const answers = {}, flips = new Set();
let speed = 3, timer = null, played = null, seedBase = Date.now();

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const nowAge = () => NOW - +$('#birthYear').value;
const visibleForks = () => FORKS.filter(f => f.age <= nowAge());

// ---------- 入力画面 ----------
function buildIntro() {
  const sel = $('#birthYear');
  for (let y = 1960; y <= 2006; y++) sel.add(new Option(y + '年', y));
  sel.value = 1985;
  sel.onchange = renderForks;
  renderForks();
}
function renderForks() {
  const box = $('#forks'); box.innerHTML = '';
  for (const f of FORKS) if (f.age > nowAge()) { delete answers[f.id]; flips.delete(f.id); }
  for (const f of visibleForks()) {
    const d = document.createElement('div'); d.className = 'fork';
    d.innerHTML = `<div class="q">${f.q}</div><div class="opts"></div>`;
    for (const [v, label] of f.opts) {
      const b = document.createElement('button'); b.textContent = label;
      if (answers[f.id] === v) b.classList.add('on');
      b.onclick = () => { answers[f.id] = v; renderForks(); };
      d.querySelector('.opts').appendChild(b);
    }
    const fl = document.createElement('button'); fl.className = 'flip'; fl.textContent = 'もしも';
    fl.disabled = !answers[f.id] || (!flips.has(f.id) && flips.size >= 3);
    if (flips.has(f.id)) fl.classList.add('on');
    fl.onclick = () => { flips.has(f.id) ? flips.delete(f.id) : flips.add(f.id); renderForks(); };
    d.appendChild(fl); box.appendChild(d);
  }
  const ok = visibleForks().every(f => answers[f.id]) && flips.size >= 1;
  $('#startBtn').disabled = !ok;
}
function flipOf(f, v) { const o = f.opts.map(x => x[0]); return o.length === 2 ? o[1 - o.indexOf(v)] : (v === 'big' ? 'small' : 'big'); }

// ---------- 人生のシミュレーション ----------
function wageAt(key, age) {
  const c = WAGE[key]; if (age <= c[0][0]) return c[0][1];
  for (let i = 1; i < c.length; i++) if (age <= c[i][0]) {
    const [a0, w0] = c[i - 1], [a1, w1] = c[i]; return w0 + (w1 - w0) * (age - a0) / (a1 - a0);
  }
  return c[c.length - 1][1];
}
function fill(t, s) {
  return t.replace('{school}', s.city === 'tokyo' ? '東京の私立大学' : (s.rnd() < 0.5 ? '地元の国立大学' : '県内の大学'))
    .replace('{updown}', s.mult >= s.multBefore ? '少し上がった' : '少し下がった')
    .replace('{partner}', '大切な人')
    .replace('{carePlace}', s.city === 'local' ? '実家が近く、仕事帰りに通って世話をした。' : '新幹線で何度も実家に帰った。')
    .replace('{retire}', s.firm === 'gov' ? '定年を迎えた。最後の日に花束をもらった。' : '定年を迎えた。再雇用で働き続けることにした。');
}
function simulate(choice, seed) {
  const sex = $('#sex').value, by = +$('#birthYear').value, end = nowAge();
  const rnd = rng(seed);
  const s = {
    rnd, sex, by, edu: choice.edu || 'work', city: choice.city || 'local', firm: choice.firm || 'small',
    change: choice.change || 'stay', mult: 1, multBefore: 1, cash: 0, joy: 50, health: 90,
    married: false, divorced: false, kids: 0, home: '実家', leave: 0, flags: {}, yearsWorked: 0,
  };
  s.jobAge = s.edu === 'univ' ? 22 : 18;
  // 未回答（まだその年齢でない）分かれ道は統計の確率で決める
  s.wantMarry = choice.marry ? choice.marry === 'yes' : rnd() < (sex === 'm' ? 0.72 : 0.82);
  s.wantKids = choice.kids ? choice.kids === 'yes' : rnd() < 0.7;
  if (choice.marry === 'no') s.wantKids = false; // 結婚しない道では子どもは持たない設定（試作の単純化）
  s.marryAge = Math.min(end, 26 + Math.floor(rnd() * 8));
  s.kidGoal = 1 + (rnd() < 0.55 ? 1 : 0) + (rnd() < 0.15 ? 1 : 0);
  if (s.city === 'tokyo') s.home = '賃貸';
  const years = [];
  for (let age = 18; age <= end; age++) {
    s.age = age; s.year = by + age;
    s.working = age >= s.jobAge && age < 65;
    if (s.working) s.yearsWorked++;
    const log = [];
    const era = ERA.find(e => e.y === s.year); if (era) log.push({ t: era.t, kind: 'era' });
    const pool = EVENTS.slice().sort(() => rnd() - 0.5);
    for (const e of pool) {
      if (log.filter(x => x.kind !== 'era').length >= 2) break;
      if (e.once && s.flags[e.once]) continue;
      if (rnd() < e.p(s)) {
        s.multBefore = s.mult;
        if (e.fx) e.fx(s);
        if (e.once) s.flags[e.once] = true;
        if (e.t.includes('子どもが生まれた')) { s.lastKidAge = age; if (!s.firstKidAge) s.firstKidAge = age; }
        log.push({ t: fill(e.t, s), kind: e.kind || '' });
      }
    }
    // お金と体
    let inc = 0;
    if (age >= s.jobAge) {
      inc = wageAt(sex + '_' + s.edu, age) * MULT[s.city] * (age < 65 ? MULT[s.firm] : 1) * s.mult;
      if (s.leave > 0) { inc *= 0.5; s.leave--; }
    }
    if (s.married && s.home === '実家') s.home = '賃貸';
    if (s.city === 'local' && !s.married && age >= 27 && s.home === '実家' && rnd() < 0.15) s.home = '賃貸';
    s.income = Math.round(inc);
    s.cash += Math.round(inc * 0.12 - s.kids * 12 - (s.home === '持ち家' ? 30 : 0));
    s.health = Math.max(5, Math.min(100, s.health - (age > 50 ? 1.2 : 0.3)));
    s.joy = Math.max(0, Math.min(100, s.joy + (55 - s.joy) * 0.12 + (rnd() - 0.5) * 4)); // 出来事の喜怒哀楽は時間とともに平均へ戻る
    years.push({ age, year: s.year, log, snap: snapshot(s) });
  }
  return { years, final: snapshot(s), s };
}
function snapshot(s) {
  const fam = s.married ? (s.kids ? `配偶者と子ども${s.kids}人` : '配偶者とふたり') : (s.divorced ? (s.kids ? `離婚・子ども${s.kids}人` : '離婚して一人') : (s.home === '実家' ? '親と同居' : '一人暮らし'));
  return { income: s.income || 0, cash: s.cash, home: s.home, fam, health: Math.round(s.health), joy: Math.round(s.joy), city: s.city, kids: s.kids, married: s.married };
}

// ---------- 再生 ----------
const man = v => v >= 10000 ? (v / 10000).toFixed(1) + '億円' : Math.round(v) + '万円';
function statHtml(n) {
  return `<span>年収 <b>${man(n.income)}</b></span><span>貯金 <b>${man(n.cash)}</b></span>
  <span>住まい <b>${n.home}</b></span><span>家族 <b>${n.fam}</b></span>
  <span>健康 <b>${n.health}</b></span><span>満足 <b>${n.joy}</b></span>`;
}
function start() {
  const A = {}, B = {};
  for (const f of visibleForks()) { A[f.id] = answers[f.id]; B[f.id] = flips.has(f.id) ? flipOf(f, answers[f.id]) : answers[f.id]; }
  const seed = seedBase++;
  played = { a: simulate(A, seed), b: simulate(B, seed + 7919), A, B };
  $('#intro').hidden = true; $('#result').hidden = true; $('#play').hidden = false; $('.bar').hidden = false;
  $('#logA').innerHTML = ''; $('#logB').innerHTML = '';
  let i = 0;
  const step = () => {
    const ya = played.a.years[i], yb = played.b.years[i];
    if (!ya) return finish();
    $('#ageNum').textContent = ya.age; $('#yearNum').textContent = ya.year + '年';
    $('#statA').innerHTML = statHtml(ya.snap); $('#statB').innerHTML = statHtml(yb.snap);
    push('#logA', ya); push('#logB', yb);
    i++; timer = setTimeout(step, 1500 / speed);
  };
  step();
}
function push(sel, y) {
  const ol = $(sel);
  for (const e of y.log) {
    const li = document.createElement('li'); li.className = e.kind;
    li.innerHTML = `<span class="a">${y.age}歳</span>${e.t}`; ol.prepend(li);
  }
}

// ---------- 結果 ----------
function finish() {
  clearTimeout(timer);
  const a = played.a.final, b = played.b.final, age = nowAge();
  $('#result').hidden = false; $('.bar').hidden = true; window.scrollTo(0, 0);
  $('#resTitle').textContent = `${age}歳の、もう一人の私`;
  const place = b.city === 'tokyo' ? '東京' : '地元';
  const diff = b.income - a.income;
  const incTxt = Math.abs(diff) < 30 ? 'いまのあなたとほとんど同じ' : `いまのあなたより${man(Math.abs(diff))}${diff > 0 ? '多い' : '少ない'}`;
  const changed = FORKS.filter(f => flips.has(f.id)).map(f => `「${SAY[f.id][played.B[f.id]]}」`).join('');
  const biggest = [
    ['お金', Math.abs(b.cash - a.cash) / 1000],
    ['家族', (a.fam !== b.fam ? 1 : 0) + Math.abs(a.kids - b.kids) * 0.4],
    ['満足', Math.abs(b.joy - a.joy) / 25],
    ['健康', Math.abs(b.health - a.health) / 25],
  ].sort((x, y) => y[1] - x[1])[0][0];
  played.line = `${changed}人生を選んだあなたは今、${place}で${b.fam}。年収は${incTxt}。いちばん違ったのは「${biggest}」でした。`;
  $('#resLine').textContent = played.line;
  const rows = [['住んでいる所', a.city === 'tokyo' ? '東京' : '地元', place], ['年収', man(a.income), man(b.income)], ['貯金', man(a.cash), man(b.cash)],
    ['住まい', a.home, b.home], ['家族', a.fam, b.fam], ['健康', a.health, b.health], ['満足', a.joy, b.joy]];
  $('#resTable').innerHTML = '<tr><th></th><th>選んだ道の私</th><th>選ばなかった方の私</th></tr>' +
    rows.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('');
  drawCard(age);
}
function drawCard(age) {
  const c = $('#card').getContext('2d');
  c.fillStyle = '#101418'; c.fillRect(0, 0, 1200, 630);
  c.fillStyle = '#e26a8d'; c.fillRect(0, 0, 1200, 10);
  c.fillStyle = '#e9ecef'; c.font = '600 64px "Hiragino Mincho ProN", serif';
  c.fillText(`${age}歳の、もう一人の私`, 70, 140);
  c.font = '34px "Hiragino Sans", sans-serif'; c.fillStyle = '#cfd5da';
  wrap(c, played.line, 70, 230, 1060, 54);
  const A = played.a.final, B = played.b.final;
  c.font = '26px "Hiragino Sans", sans-serif';
  [['年収', man(A.income), man(B.income)], ['家族', A.fam, B.fam], ['住む所', A.city === 'tokyo' ? '東京' : '地元', B.city === 'tokyo' ? '東京' : '地元']].forEach((r, i) => {
    const y = 420 + i * 44; c.fillStyle = '#9aa3ab'; c.fillText(r[0], 70, y);
    c.fillStyle = '#e26a8d'; c.fillText('選んだ道 ' + r[1], 200, y); c.fillStyle = '#6ab7e2'; c.fillText('もう一人 ' + r[2], 640, y);
  });
  c.fillStyle = '#6ab7e2'; c.font = '24px "Hiragino Sans", sans-serif';
  c.fillText('選ばなかった方の私', 70, 590);
}
function wrap(c, text, x, y, w, lh) {
  let line = '';
  for (const ch of text) { if (c.measureText(line + ch).width > w) { c.fillText(line, x, y); line = ch; y += lh; } else line += ch; }
  c.fillText(line, x, y);
}

// ---------- ボタン ----------
$('#startBtn').onclick = start;
document.querySelectorAll('.speed button[data-sp]').forEach(b => b.onclick = () => {
  speed = +b.dataset.sp; document.querySelectorAll('.speed button[data-sp]').forEach(x => x.classList.toggle('on', x === b));
});
$('#skipBtn').onclick = () => { clearTimeout(timer); $('#logA').innerHTML = ''; $('#logB').innerHTML = ''; played.a.years.forEach(y => push('#logA', y)); played.b.years.forEach(y => push('#logB', y)); finish(); };
$('#againBtn').onclick = start;
$('#resetBtn').onclick = () => { $('#result').hidden = true; $('#play').hidden = true; $('#intro').hidden = false; };
$('#saveBtn').onclick = () => { const a = document.createElement('a'); a.download = 'もう一人の私.png'; a.href = $('#card').toDataURL('image/png'); a.click(); };
buildIntro();
