// 書いて進む冒険：1日書く → 勇者が1日ぶん進み、必ず何かを持ち帰る
const $ = s => document.querySelector(s);
const KEY = 'g2_state';
const RVAL = { N: 1, R: 2, SR: 4, SSR: 7 };
const fresh = () => ({ day: 0, lv: 1, exp: 0, hp: 30, max: 30, atk: 5, bag: [], allies: [], spells: [], streak: 0, bossFail: 0 });
let S = JSON.parse(localStorage.getItem(KEY) || 'null') || fresh();
let busy = false, skip = null;
const save = () => localStorage.setItem(KEY, JSON.stringify(S));
const power = () => S.atk + S.bag.reduce((a, b) => a + RVAL[b.r], 0) + S.allies.length * 3;
const areaOf = d => AREAS[Math.floor(d / DAYS_PER_AREA) % AREAS.length];
const md = () => { const x = new Date(); x.setDate(x.getDate() + S.day - 1); return `${x.getMonth() + 1}/${x.getDate()}`; };
const pick = a => a[Math.floor(Math.random() * a.length)];

function render() {
  const a = areaOf(S.day), k = S.day % DAYS_PER_AREA;
  $('#area').innerHTML = `<b>${a.name}</b>　ボスまであと${DAYS_PER_AREA - k}日`;
  $('#day').textContent = `冒険 ${S.day}日目`;
  $('#road').innerHTML = [...Array(DAYS_PER_AREA)].map((_, i) => `<i class="${i < k ? 'done' : ''} ${i === DAYS_PER_AREA - 1 ? 'boss' : ''}"></i>`).join('');
  $('#lv').textContent = S.lv;
  $('#stat').textContent = `力 ${power()}・持ち物 ${S.bag.length}・呪文 ${S.spells.length}`;
  $('#hpb').style.width = (S.hp / S.max * 100) + '%';
  $('#expb').style.width = (S.exp / (S.lv * 10) * 100) + '%';
  $('#allies').innerHTML = S.allies.map(x => `<span class="ally">${x.name}（${x.job}）</span>`).join('');
}

// 1場面を見せて、タップか時間で次へ
function scene(html, ms = 2200) {
  $('#stage').innerHTML = html + '<div class="tap">タップで次へ</div>';
  return new Promise(res => { const t = setTimeout(res, ms); skip = () => { clearTimeout(t); res(); }; });
}
const wait = ms => new Promise(r => setTimeout(r, ms));
function floatAt(txt, color) { const f = document.createElement('div'); f.className = 'float'; f.style.color = color; f.style.left = (40 + Math.random() * 20) + '%'; f.style.top = '30%'; f.textContent = txt; $('#stage').appendChild(f); setTimeout(() => f.remove(), 800); }

function roll(mood, bonus = 0) {
  const luck = Math.random() * 100 - (mood === 3 ? 8 : 0) - Math.min(S.streak, 7) * 1.5 - bonus;
  return luck < 3 ? 'SSR' : luck < 14 ? 'SR' : luck < 42 ? 'R' : 'N';
}
function gainExp(n) {
  S.exp += n; const ups = [];
  while (S.exp >= S.lv * 10) { S.exp -= S.lv * 10; S.lv++; S.max += 5; S.hp = S.max; S.atk += 1; ups.push(S.lv); if (SPELL_ON_LV[S.lv]) S.spells.push({ name: SPELL_ON_LV[S.lv], d: md(), src: 'レベルアップ' }); }
  return ups;
}

async function battle(foe, boss) {
  const hits = boss ? 4 : 3;
  $('#stage').innerHTML = `<div class="ev">${boss ? 'ボス戦' : '戦い'}</div><div class="glyph mincho" id="fg">${foe[0]}</div><h2 class="mincho">${foe[1]}</h2><div class="foehp"><i id="fh" style="width:100%"></i></div>`;
  await wait(600);
  const need = boss ? 6 + Math.floor(S.day / DAYS_PER_AREA) * 25 : 0;
  const win = power() >= need;
  for (let i = 1; i <= hits; i++) {
    const fg = $('#fg'); fg.classList.remove('shake'); void fg.offsetWidth; fg.classList.add('shake');
    floatAt(`-${power() + Math.floor(Math.random() * 4)}`, '#fff');
    $('#fh').style.width = (win ? 100 - i / hits * 100 : 100 - i / hits * 55) + '%';
    if (S.allies[i - 1]) { await wait(250); floatAt(`${S.allies[i - 1].name}の一撃`, '#ffd9a3'); }
    await wait(450);
  }
  S.hp = Math.max(1, S.hp - (boss ? 8 : 3));
  return win;
}

async function adventure(e) {
  busy = true; $('#btns').hidden = true;
  S.day++; S.streak = e.written ? S.streak + 1 : S.streak;
  const a = areaOf(S.day - 1), bossDay = S.day % DAYS_PER_AREA === 0;
  const got = [];
  await scene(`<div class="ev">冒険 ${S.day}日目 · ${a.name}</div><h2 class="mincho">「${e.text}」</h2><p>今日の日記を胸に、出発した。</p>`, 1800);
  // 書いた内容ごとに1つずつ出来事
  const tags = e.tags.length ? e.tags : ['rest'];
  for (const t of tags) {
    if (t === 'meet') {
      const p = PEOPLE.find(([w]) => e.text.includes(w) && !S.allies.some(x => x.name === PEOPLE.find(q => q[0] === w)[1]));
      const s = p ? { name: p[1], job: p[2] } : (() => { const q = STRANGERS.find(x => !S.allies.some(y => y.name === x[0])) || pick(STRANGERS); return { name: q[0], job: q[1] }; })();
      if (!S.allies.some(x => x.name === s.name)) { S.allies.push(s); got.push(`仲間：${s.name}`); render(); }
      await scene(`<div class="ev">人に会った日</div><div class="glyph">🤝</div><div class="loot SR"><div class="rar">仲間が加わった</div><b>${s.name}（${s.job}）</b><small>${md()} の日記から</small></div>`);
      continue;
    }
    const L = LOOT[t]; if (!L) continue;
    await scene(`<div class="ev">${TAGS[t]}の日</div><h2 class="mincho">${L.ev}</h2><div class="chest">🎁</div><p>何かを見つけた…</p>`, 1300);
    const r = roll(e.mood), name = pick(L[r]);
    const item = { name, kind: L.kind, r, d: md(), src: e.text };
    (L.kind === '呪文' ? S.spells : S.bag).push(item); got.push(`${L.kind}：${name}`); render();
    await scene(`<div class="ev">${TAGS[t]}の日</div><div class="loot ${r}"><div class="rar">${r}　${L.kind}</div><b>${name}</b><small>${md()}「${e.text.slice(0, 14)}」から</small></div>`);
  }
  if (e.mood === 1) {
    S.bag.push({ name: 'くじけない心', kind: 'お守り', r: 'R', d: md(), src: e.text }); got.push('お守り：くじけない心');
    await scene(`<div class="ev">しんどい日</div><h2 class="mincho">それでも、一歩進んだ。</h2><div class="loot R"><div class="rar">R　お守り</div><b>くじけない心</b><small>しんどかった日にだけ手に入る</small></div>`);
  }
  // 戦い（4日目はボス）
  const foe = bossDay ? a.boss : pick(a.foes);
  const win = await battle(foe, bossDay);
  let ups = [];
  if (win) {
    ups = gainExp(bossDay ? 30 : 10 + Math.floor(S.day / DAYS_PER_AREA) * 4);
    if (bossDay) {
      const r = roll(e.mood, 30); const name = `${a.boss[1]}を倒した証`;
      S.bag.push({ name, kind: '証', r, d: md(), src: e.text }); got.push(`証：${name}`); S.bossFail = 0;
      await scene(`<div class="ev">ボスを倒した！</div><div class="glyph mincho">${a.boss[0]}</div><div class="loot ${r}"><div class="rar">${r}　ボスの証</div><b>${name}</b><small>${a.name}を突破した</small></div>`, 2600);
    } else await scene(`<div class="ev">勝った</div><div class="glyph mincho" style="opacity:.3">${foe[0]}</div><h2 class="mincho">${foe[1]}をたおした</h2>`, 1200);
  } else {
    S.day--; S.bossFail++; // ボスに負けたら次の日も同じボス
    await scene(`<div class="ev">ボス戦</div><div class="glyph mincho">${foe[0]}</div><h2 class="mincho">${foe[1]}は、まだ強すぎた…</h2><p>力 ${power()}。あと少し。<br>明日、装備と仲間を増やしてもう一度。</p>`, 2800);
  }
  render();
  for (const l of ups) await scene(`<div class="banner">レベルアップ！</div><h2>Lv ${l}</h2>${SPELL_ON_LV[l] ? `<div class="loot SR"><div class="rar">新しい呪文</div><b>${SPELL_ON_LV[l]}</b></div>` : '<p>体力と力が上がった</p>'}`, 1800);
  const na = areaOf(S.day), left = DAYS_PER_AREA - S.day % DAYS_PER_AREA;
  save(); render();
  $('#stage').innerHTML = `<div class="ev">今日の冒険おわり</div><h2 class="mincho">${got.length}つ持ち帰った</h2><p>${got.join('<br>') || '—'}</p>
    <p style="margin-top:10px;color:var(--ink)">次は <b>${na.name}</b>${left === DAYS_PER_AREA ? '' : `　ボスまであと${left}日`}<br><span class="small">明日書けば、また何かを持ち帰る。</span></p>`;
  skip = null; busy = false; $('#btns').hidden = false;
}

function writeSheet() {
  const d = document.createElement('div'); d.className = 'sheet';
  let tags = [], mood = 2;
  d.innerHTML = `<h2 class="mincho">今日はどんな日？</h2><textarea placeholder="例：同期とランチ。資料はなんとか出せた"></textarea>
    <div class="small">何をした日？（2つまで）</div><div class="chips" id="tg">${Object.entries(TAGS).map(([k, v]) => `<button class="chip" data-k="${k}">${v}</button>`).join('')}</div>
    <div class="small">気分は？</div><div class="chips" id="md"><button class="chip" data-m="1">しんどい</button><button class="chip on" data-m="2">ふつう</button><button class="chip" data-m="3">いい日</button></div>
    <button class="btn">冒険に出る</button><button class="btn ghost">やめる</button>`;
  d.querySelector('#tg').onclick = ev => { const c = ev.target.closest('.chip'); if (!c) return; const k = c.dataset.k; tags = tags.includes(k) ? tags.filter(x => x !== k) : tags.concat(k).slice(-2); d.querySelectorAll('#tg .chip').forEach(x => x.classList.toggle('on', tags.includes(x.dataset.k))); };
  d.querySelector('#md').onclick = ev => { const c = ev.target.closest('.chip'); if (!c) return; mood = +c.dataset.m; d.querySelectorAll('#md .chip').forEach(x => x.classList.toggle('on', x === c)); };
  const [go, no] = d.querySelectorAll('.btn');
  no.onclick = () => d.remove();
  go.onclick = () => { const text = d.querySelector('textarea').value.trim() || 'ふつうの一日'; d.remove(); adventure({ text: text.slice(0, 40), tags, mood, written: true }); };
  document.body.appendChild(d);
}

function bagSheet() {
  const d = document.createElement('div'); d.className = 'sheet';
  const li = (arr) => arr.length ? arr.slice().reverse().map(x => `<div class="it"><span><b style="color:${{ N: '#ccc', R: '#5aa9ff', SR: '#b48cff', SSR: '#f6c453' }[x.r] || '#ccc'}">${x.r || ''}</b> ${x.name}</span><small>${x.d}<br>${x.src.slice(0, 12)}</small></div>`).join('') : '<div class="small">まだない</div>';
  d.innerHTML = `<h2 class="mincho">持ち物</h2><div class="small">呪文</div><div class="list">${li(S.spells)}</div><div class="small">装備・道具</div><div class="list">${li(S.bag)}</div>
    <button class="btn">閉じる</button><button class="btn ghost">最初からやり直す</button>`;
  const [c, r] = d.querySelectorAll('.btn');
  c.onclick = () => d.remove();
  r.onclick = () => { if (confirm('最初からやり直しますか？')) { S = fresh(); save(); d.remove(); render(); intro(); } };
  document.body.appendChild(d);
}

function intro() {
  $('#stage').innerHTML = S.day ? `<div class="ev">冒険 ${S.day}日目まで進んだ</div><h2 class="mincho">今日も書く？</h2><p>書いた日の内容で、勇者が持ち帰る物が変わります。</p>`
    : `<div class="ev">おもちゃ版 · 絵はまだありません</div><h2 class="mincho">書いた日数だけ、<br>勇者が進む。</h2><p>1日1行書くと、勇者が1日ぶん冒険して<br>必ず何かを持ち帰ります。<br>仕事の日は武器、学んだ日は呪文、<br>人に会った日はその人が仲間に。</p>`;
}

$('#stage').onclick = () => skip && skip();
$('#write').onclick = () => !busy && writeSheet();
$('#sample').onclick = () => { if (busy) return; const s = SAMPLES[S.day % SAMPLES.length]; adventure({ text: s[0], tags: s[1], mood: s[2], written: true }); };
$('#bag').onclick = () => !busy && bagSheet();
render(); intro();
