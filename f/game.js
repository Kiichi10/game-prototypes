// 日々のカード（おもちゃ版） — 1回3分。束＝あなたの日々。3連戦で「三日坊主」を倒す
const $ = q => document.querySelector(q);
// 難しさの設定（2026-10-25 自動テストで調整）
const TUNE = window.TUNE || { hp: [30, 40, 62], basicAtk: 3, basicDef: 2, playerHp: 40 };
const ENEMIES = [
  { name: '月曜日の憂うつ', glyph: '憂', hp: TUNE.hp[0], moves: [{ t: 'atk', v: 7 }, { t: 'def', v: 6, then: 5 }, { t: 'atk', v: 10 }] },
  { name: '散らかった部屋', glyph: '散', hp: TUNE.hp[1], moves: [{ t: 'atk', v: 5, hits: 2 }, { t: 'def', v: 10 }, { t: 'atk', v: 12 }] },
  { name: '三日坊主', glyph: '飽', hp: TUNE.hp[2], boss: true, moves: [{ t: 'atk', v: 12 }, { t: 'spc', v: 1, then: 6 }, { t: 'atk', v: 7, hits: 2 }, { t: 'def', v: 12, then: 6 }] },
];
const SPARK = 0.12; // 閃きの確率
let run, B;

// ---------- 束（デッキ）の準備 ----------
const written = () => { try { return JSON.parse(localStorage.getItem('hibi_written')) || []; } catch (e) { return []; } };
function baseDays() { const s = sampleDiary(); const w = written(); return { recent: w.concat(s.recent).slice(0, 8), old: s.old }; }
function newRun() {
  const d = baseDays();
  // 日記のカード＋基本のカード（ふだんの力＝攻撃、ふんばる＝守り）
  const basics = [...Array(TUNE.basicAtk)].map(() => basicCard('ふだんの力', 'atk', { dmg: 6 })).concat([...Array(TUNE.basicDef)].map(() => basicCard('ふんばる', 'def', { block: 6 })));
  run = { deck: d.recent.map(makeCard).concat(basics), old: d.old, hp: TUNE.playerHp, max: TUNE.playerHp, floor: 0, sparks: 0, turns: 0 };
}

// ---------- 戦闘 ----------
function startBattle() {
  const E = ENEMIES[run.floor];
  B = { E, hp: E.hp, block: 0, step: 0, draw: shuffle(run.deck.slice()), hand: [], disc: [], energy: 3, myBlock: 0, str: 0, allies: [], drain: 0, busy: false, over: false, gone: [] };
  show('battle'); newTurn();
}
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function drawN(n) { for (let i = 0; i < n; i++) { if (!B.draw.length) { if (!B.disc.length) return; B.draw = shuffle(B.disc); B.disc = []; } B.hand.push(B.draw.pop()); } }
function newTurn() { run.turns++; B.myBlock = 0; B.energy = Math.max(0, 3 - B.drain); B.drain = 0; drawN(5); render(); }
const intent = () => B.E.moves[B.step % B.E.moves.length];

function play(id) {
  if (B.busy || B.over) return;
  const c = B.hand.find(x => x.id === id); if (!c) return;
  if (c.cost > B.energy) { nudge('行動力が足りません'); return; }
  B.energy -= c.cost; c.used++;
  const el = document.querySelector(`.hand .card[data-id="${id}"]`); if (el) el.classList.add('playing');
  const f = c.fx;
  if (f.dmg) { for (let h = 0; h < (f.hits || 1); h++) hitEnemy(f.dmg + B.str, c, h * 120); }
  if (f.block) { B.myBlock += f.block; pop($('#me'), `守り+${f.block}`, 'var(--blue)'); }
  if (f.heal) { const h = Math.min(f.heal, run.max - run.hp); run.hp += h; pop($('#me'), `+${f.heal}`, 'var(--green)'); }
  if (f.ally) { B.allies.push({ name: c.name, p: f.ally }); pop($('#me'), `仲間：${c.name}`, '#ffd9a3'); }
  if (f.energy) B.energy += f.energy;
  if (f.str) { B.str += f.str; pop($('#me'), c.sad ? `糧+${f.str}` : `力+${f.str}`, 'var(--gold)'); }
  // しんどい日・早起きのカードは、使うとこの戦いの間は消える（0コストで引き続けて無限に強くなる抜け道を防ぐ・2026-10-25 100回中24回止まった）
  B.hand = B.hand.filter(x => x !== c); if (c.sad || c.fx.energy) B.gone.push(c); else B.disc.push(c); // 行動力が増えるカードもすべて消える（学び＋早起きの合わせ技でも無限に引けた）
  if (f.draw) drawN(f.draw);
  // 閃き：たまにカードが強くなる（この冒険の間ずっと）
  if (Math.random() < SPARK) {
    c.up++; run.sparks++;
    const k = ['dmg', 'block', 'heal', 'ally'].find(x => c.fx[x]) || 'str'; c.fx[k] = (c.fx[k] || 0) + (k === 'ally' || k === 'str' ? 1 : 2);
    banner(`閃いた！「${c.name}」`);
  }
  setTimeout(() => { if (B.hp <= 0) return win(); render(); }, 260);
}
function hitEnemy(n, c, delay) {
  setTimeout(() => {
    const blocked = Math.min(B.block, n); B.block -= blocked; const d = n - blocked; B.hp = Math.max(0, B.hp - d); c.dealt += d;
    pop($('#enemy'), blocked && !d ? '防がれた' : `-${d}`, 'var(--red)'); shake($('#glyph'));
    renderBars();
  }, delay);
}
function endTurn() {
  if (B.busy || B.over) return; B.busy = true;
  B.disc.push(...B.hand); B.hand = []; render();
  let t = 0;
  B.allies.forEach(a => { setTimeout(() => { if (B.hp <= 0) return; hitEnemy(a.p, { dealt: 0 }, 0); pop($('#allies'), `${a.name}の加勢`, '#ffd9a3'); }, t); t += 320; });
  setTimeout(() => {
    if (B.hp <= 0) { B.busy = false; return win(); }
    const m = intent(); B.block = 0;
    if (m.t === 'atk') for (let h = 0; h < (m.hits || 1); h++) setTimeout(() => hitMe(m.v), h * 260);
    if (m.t === 'def') { B.block = m.v; pop($('#enemy'), `守り+${m.v}`, 'var(--blue)'); if (m.then) setTimeout(() => hitMe(m.then), 300); }
    if (m.t === 'spc') { B.drain = m.v; banner('やる気を奪われた…'); if (m.then) setTimeout(() => hitMe(m.then), 500); }
    B.step++;
    setTimeout(() => { B.busy = false; if (run.hp <= 0) return lose(); newTurn(); }, 700 + (m.hits || 1) * 260);
  }, t + 200);
}
function hitMe(n) {
  const blocked = Math.min(B.myBlock, n); B.myBlock -= blocked; const d = n - blocked; run.hp = Math.max(0, run.hp - d);
  pop($('#me'), blocked && !d ? '守った！' : `-${d}`, blocked && !d ? 'var(--blue)' : 'var(--red)');
  if (d) { shake($('#me')); const f = document.createElement('div'); f.className = 'flash'; document.body.appendChild(f); setTimeout(() => f.remove(), 320); }
  renderBars();
}

// ---------- 画面 ----------
function show(id) { ['title', 'battle'].forEach(s => $('#' + s).hidden = s !== id); }
function renderBars() {
  $('#ehp').style.width = (B.hp / B.E.hp * 100) + '%'; $('#ehpn').innerHTML = `${B.hp} / ${B.E.hp}${B.block ? `<span class="shieldtag">守り${B.block}</span>` : ''}`;
  $('#mhp').style.width = (run.hp / run.max * 100) + '%'; $('#mhpn').innerHTML = `${run.hp} / ${run.max}${B.myBlock ? `<span class="shieldtag">守り${B.myBlock}</span>` : ''}`;
}
function render() {
  const m = intent();
  $('#floor').textContent = `試練 ${run.floor + 1} / 3`; $('#turn').textContent = `束 ${run.deck.length}枚・閃き ${run.sparks}`;
  $('#glyph').textContent = B.E.glyph; $('#ename').textContent = B.E.name;
  $('#intent').className = 'intent ' + m.t;
  $('#intent').textContent = m.t === 'atk' ? `次：攻撃 ${m.v}${m.hits ? '×' + m.hits : ''}` : m.t === 'def' ? `次：守り ${m.v}${m.then ? `＋攻撃 ${m.then}` : ''}` : `次：やる気を奪う（行動力−${m.v}）＋攻撃 ${m.then}`;
  $('#allies').innerHTML = B.allies.map(a => `<span class="ally">${a.name}　毎ターン${a.p}</span>`).join('');
  $('#nrg').innerHTML = Array.from({ length: Math.max(3, B.energy) }, (_, i) => `<i class="${i < B.energy ? '' : 'off'}"></i>`).join('');
  $('#str').textContent = B.str ? `力＋${B.str}` : '';
  $('#hand').innerHTML = B.hand.map(c => cardHTML(c).replace('class="card', `class="card ${c.cost > B.energy ? 'dim' : ''}`)).join('');
  $('#hand').querySelectorAll('.card').forEach(el => el.onclick = () => play(+el.dataset.id));
  $('#pile').textContent = `山 ${B.draw.length}・捨 ${B.disc.length}`;
  renderBars();
}
function pop(anchor, text, color) {
  const r = anchor.getBoundingClientRect(), f = document.createElement('div'); f.className = 'float'; f.textContent = text; f.style.color = color;
  f.style.left = (r.left + r.width / 2 - 40 + (Math.random() * 40 - 20)) + 'px'; f.style.top = (r.top + window.scrollY + r.height / 3) + 'px'; f.style.position = 'absolute';
  document.body.appendChild(f); setTimeout(() => f.remove(), 950);
}
function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
function banner(t) { const b = document.createElement('div'); b.className = 'banner'; b.textContent = t; document.body.appendChild(b); setTimeout(() => b.remove(), 1150); }
function nudge(t) { const b = document.createElement('div'); b.className = 'banner'; b.style.background = '#3a3c4c'; b.style.fontSize = '18px'; b.textContent = t; document.body.appendChild(b); setTimeout(() => b.remove(), 900); }
function sheet(html) { const s = document.createElement('div'); s.className = 'sheet'; s.innerHTML = html; document.body.appendChild(s); return s; }

// ---------- 勝ち・負け・ご褒美 ----------
function win() {
  if (B.over) return; B.over = true; // 続けて出したカードで「倒した」が2回走るのを防ぐ（2026-10-25 ご褒美画面が2枚重なった）
  if (B.E.boss) return finish(true);
  banner(`${B.E.name}を越えた！`);
  setTimeout(() => {
    const s = sheet(`<h2>ご褒美をひとつ</h2><p>次の試練：${ENEMIES[run.floor + 1].name}</p>
      <button class="choice" data-c="heal"><b>ひと休み</b><small>体力を12回復（今 ${run.hp}/${run.max}）</small></button>
      <button class="choice" data-c="old"><b>昔の日を思い出す</b><small>昔の日記から1枚、束に加える</small></button>
      <button class="choice" data-c="up"><b>1枚を鍛える</b><small>束の1枚を選んで強くする</small></button>`);
    s.querySelectorAll('.choice').forEach(b => b.onclick = () => { s.remove(); reward(b.dataset.c); });
  }, 1000);
}
function reward(c) {
  const next = () => { run.floor++; startBattle(); };
  if (c === 'heal') { run.hp = Math.min(run.max, run.hp + 12); return next(); }
  if (c === 'old') {
    const pick = shuffle(run.old.slice()).slice(0, 3).map(makeCard);
    const s = sheet(`<h2>どの日を思い出す？</h2><p>選んだ日が、束に加わります。</p><div class="row">${pick.map(x => cardHTML(x)).join('')}</div>`);
    s.querySelectorAll('.card').forEach(el => el.onclick = () => { const x = pick.find(p => p.id === +el.dataset.id); run.deck.push(x); run.old = run.old.filter(o => o.k !== x.day); s.remove(); banner(`「${x.name}」を思い出した`); setTimeout(next, 900); });
    return;
  }
  const s = sheet(`<h2>どの日を鍛える？</h2><p>数字が大きくなります。</p><div class="row">${run.deck.map(x => cardHTML(x)).join('')}</div>`);
  s.querySelectorAll('.card').forEach(el => el.onclick = () => { const x = run.deck.find(p => p.id === +el.dataset.id); const k = ['dmg', 'block', 'heal', 'ally', 'draw', 'energy', 'str'].find(q => x.fx[q]); x.fx[k] += (k === 'dmg' || k === 'block' || k === 'heal') ? 3 : 1; x.up++; s.remove(); banner(`「${x.name}」が強くなった`); setTimeout(next, 900); });
}
function finish(ok) {
  const best = run.deck.filter(c => !c.basic).sort((a, b) => b.dealt - a.dealt)[0] || run.deck[0];
  const msg = ok ? `三日坊主を倒した！` : `${B.E.name}に負けた…`;
  const share = `日々のカードで${ok ? '三日坊主を倒した' : '力尽きた'}。いちばん活躍したのは「${best.name}」（${best.dealt}ダメージ）。閃き${run.sparks}回。`;
  const s = sheet(`<h2>${msg}</h2><p>${run.turns}ターン・閃き${run.sparks}回</p>
    <p>いちばん活躍した日</p><div class="row">${cardHTML(best)}</div><p>${dlabel(best.day)}の「${best.name}」が、${best.dealt}ダメージを与えました。</p>
    <button class="btn gold" id="again">もう一度</button><button class="btn ghost" id="share">Xで投稿</button><button class="btn ghost" id="home">はじめに戻る</button>`);
  s.querySelector('#again').onclick = () => { s.remove(); newRun(); startBattle(); };
  s.querySelector('#home').onclick = () => { s.remove(); title(); };
  s.querySelector('#share').onclick = () => window.open('https://x.com/intent/tweet?text=' + encodeURIComponent(share + '\n#日々のカード'), '_blank');
}
function lose() { if (B.over) return; B.over = true; finish(false); }

// ---------- はじめ・今日を書く ----------
function title() {
  newRun(); show('title');
  $('#preview').innerHTML = run.deck.map(c => cardHTML(c, true)).join('');
  $('#deckInfo').textContent = `あなたの束：日記${run.deck.filter(c => !c.basic).length}枚＋いつものカード${run.deck.filter(c => c.basic).length}枚`;
}
function writeSheet() {
  const sel = new Set(); let mood = 3;
  const T = Object.entries(TAGS);
  const s = sheet(`<h2>今日を書く</h2><p>1行と、したことを2つまで。今日のカードが1枚生まれます。</p>
    <input type="text" id="wtx" maxlength="30" placeholder="例：母と電話した">
    <div class="chips">${T.map(([k, v]) => `<button class="chip" data-k="${k}">${v.n}</button>`).join('')}</div>
    <div class="moods">${['😣', '🙁', '😐', '🙂', '😄'].map((m, i) => `<button class="mood ${i === 2 ? 'on' : ''}" data-m="${i + 1}">${m}</button>`).join('')}</div>
    <div class="row" id="wprev"></div>
    <button class="btn gold" id="wok">カードにする</button><button class="btn ghost" id="wcancel">やめる</button>`);
  const prev = () => { const day = { k: ymd(new Date()), text: s.querySelector('#wtx').value || '今日', tags: [...sel], mood }; s.querySelector('#wprev').innerHTML = cardHTML(makeCard(day)); return day; };
  s.querySelectorAll('.chip').forEach(b => b.onclick = () => { const k = b.dataset.k; if (sel.has(k)) sel.delete(k); else if (sel.size < 2) sel.add(k); s.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', sel.has(x.dataset.k))); prev(); });
  s.querySelectorAll('.mood').forEach(b => b.onclick = () => { mood = +b.dataset.m; s.querySelectorAll('.mood').forEach(x => x.classList.toggle('on', x === b)); prev(); });
  s.querySelector('#wtx').oninput = prev; prev();
  s.querySelector('#wcancel').onclick = () => s.remove();
  s.querySelector('#wok').onclick = () => { const day = prev(); if (!day.tags.length) { nudge('したことを1つ選んでください'); return; }
    const w = written().filter(x => x.k !== day.k); w.unshift(day); localStorage.setItem('hibi_written', JSON.stringify(w.slice(0, 30))); s.remove(); banner('今日のカードが生まれた'); title(); };
}
$('#go').onclick = () => startBattle();
$('#write').onclick = writeSheet;
$('#end').onclick = endTurn;
title();
