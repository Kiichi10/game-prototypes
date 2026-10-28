// 言葉の合成：2つ選ぶ → 組み合わせ表にあれば新発見
const $ = s => document.querySelector(s);
const KEY = 'g1_have';
const MAP = {};
for (const [a, b, r] of R) { MAP[a + '+' + b] = r; MAP[b + '+' + a] = r; }
const TOTAL = Object.keys(EL).length;
const LOCK_HINT = { 友だち: '人に会った日に書くと', 海: '海に行った日に書くと', 電車: '電車に乗った日に書くと' };
const TITLES = { 15: '見習いの錬金術師', 30: '町の錬金術師', 45: '王国の錬金術師', 60: '伝説の錬金術師' };
let have = JSON.parse(localStorage.getItem(KEY) || 'null') || BASE.slice();
let sel = [], fresh = new Set();
const save = () => localStorage.setItem(KEY, JSON.stringify(have));

function render() {
  $('#cnt').textContent = `${have.length} / ${TOTAL}`;
  $('#prog').style.width = (have.length / TOTAL * 100) + '%';
  $('#grid').innerHTML = have.map(n => `<button class="chip ${RARE.has(n) ? 'rare' : ''} ${sel.includes(n) ? 'sel' : ''} ${fresh.has(n) ? 'new' : ''}" data-n="${n}"><span>${EL[n]}</span>${n}</button>`).join('');
  const locked = Object.keys(LOCK_HINT).filter(n => !have.includes(n));
  $('#locked').innerHTML = locked.length ? locked.map(n => `<span class="chip lock">？ <small>${LOCK_HINT[n]}</small></span>`).join('') : '<span style="font-size:12px;color:var(--sub)">ぜんぶ手に入れた</span>';
  [0, 1].forEach(i => { const n = sel[i], s = $('#s' + i); s.className = 'slot' + (n ? ' f' : ''); s.innerHTML = n ? `<div><span class="e">${EL[n]}</span>${n}</div>` : (i ? 'ふたつ目' : 'ひとつ目'); });
  fresh.clear();
}

function pick(n) {
  if (sel.length === 2) sel = [];
  if (sel[0] === n && sel.length === 1) { sel = []; render(); return; }
  sel.push(n); render();
  if (sel.length === 2) setTimeout(combine, 250);
}

function combine() {
  const [a, b] = sel, r = MAP[a + '+' + b];
  if (!r) {
    $('#pot').classList.remove('shake'); void $('#pot').offsetWidth; $('#pot').classList.add('shake');
    const hint = R.find(([x, y, z]) => (x === a || y === a) && !have.includes(z) && have.includes(x === a ? y : x));
    $('#msg').innerHTML = hint ? `何も起きなかった…　ヒント：${a} は <b>${EL[hint[0] === a ? hint[1] : hint[0]]}</b> と相性がいい` : '何も起きなかった…';
    sel = []; setTimeout(render, 600); return;
  }
  sel = [];
  if (have.includes(r)) { $('#msg').innerHTML = `${EL[r]} ${r}（もう持っている）`; render(); return; }
  have.push(r); fresh.add(r); save(); render();
  $('#msg').innerHTML = `${a} ＋ ${b} ＝ <b>${r}</b>`;
  reveal(r, `${a} ＋ ${b}`);
}

function reveal(r, how) {
  const t = TITLES[have.length];
  const d = document.createElement('div');
  d.className = 'reveal' + (RARE.has(r) ? ' rare' : '');
  d.innerHTML = `<div class="lab">${RARE.has(r) ? '★ 大発見 ★' : '新発見'}</div><div class="e">${EL[r]}</div><h2>${r}</h2>
    <p>${how}${FLAVOR[r] ? '<br>' + FLAVOR[r] : ''}${t ? `<br><b style="color:var(--gold)">称号「${t}」を手に入れた</b>` : ''}</p>
    <button class="btn" style="max-width:280px">続ける</button>`;
  d.querySelector('button').onclick = () => d.remove();
  document.body.appendChild(d);
}

function writeSheet() {
  const d = document.createElement('div');
  d.className = 'reveal';
  d.innerHTML = `<h2 style="font-size:24px">今日はどんな日？</h2><p>1行でいい。書いた言葉から素材が見つかります。</p>
    <textarea placeholder="例：同期と駅前でカレー。帰りは雨だった"></textarea><button class="btn">書いた</button><button class="btn ghost">やめる</button>`;
  const [ok, no] = d.querySelectorAll('button');
  no.onclick = () => d.remove();
  ok.onclick = () => {
    const text = d.querySelector('textarea').value;
    const found = Object.entries(DIARY_WORDS).filter(([, ws]) => ws.some(w => text.includes(w))).map(([k]) => k);
    const got = found.filter(k => !have.includes(k));
    got.forEach(k => { have.push(k); fresh.add(k); });
    save(); d.remove(); render();
    $('#msg').innerHTML = got.length ? `日記から新しい素材：<b>${got.map(k => EL[k] + k).join('・')}</b>` : (found.length ? `見つかった素材（${found.join('・')}）は、もう持っている` : '素材は見つからなかった（人・海・電車・雨・本…）');
  };
  document.body.appendChild(d); d.querySelector('textarea').focus();
}

$('#grid').onclick = e => { const c = e.target.closest('.chip'); if (c) pick(c.dataset.n); };
$('#write').onclick = writeSheet;
$('#reset').onclick = () => { if (confirm('最初からやり直しますか？')) { have = BASE.slice(); sel = []; save(); render(); } };
render();
