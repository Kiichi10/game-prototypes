// 日記で育つ町 — 記録と画面
const $ = q => document.querySelector(q);
const KEY = 'machi_v1', MOODS = ['😣', '🙁', '😐', '🙂', '😄'], W = ['日', '月', '火', '水', '木', '金', '土'];
let db = load(), sel = { tags: new Set(), mood: 3 }, editing = false, mon = new Date(), frame = 0;

function load() { try { return JSON.parse(localStorage.getItem(KEY)) || { e: {} }; } catch (e) { return { e: {} }; } }
function save() { localStorage.setItem(KEY, JSON.stringify(db)); }
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const jp = s => { const d = parse(s); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${W[d.getDay()]}）`; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const TODAY = () => ymd(new Date());

// ---------- 町の状態 ----------
function townState() {
  const keys = Object.keys(db.e).sort(), counts = {};
  keys.forEach(k => db.e[k].tags.forEach(t => counts[t] = (counts[t] || 0) + 1));
  let streak = 0, d = new Date(); if (!db.e[ymd(d)]) d = addDays(d, -1);
  while (db.e[ymd(d)]) { streak++; d = addDays(d, -1); }
  let weeds = 0;
  if (keys.length) { const first = parse(keys[0]); for (let i = 1; i <= 14; i++) { const x = addDays(new Date(), -i); if (x >= first && !db.e[ymd(x)]) weeds++; } }
  return { counts, days: keys.length, streak, weeds: Math.min(20, weeds * 2) };
}
function buildingName(k, n) { const lv = levelOf(n); return lv ? TAGS.find(t => t[0] === k)[2][lv - 1] : '空き地'; }

// ---------- 記録する日（今日／書き忘れた日） ----------
let cur = null; // 書いている日（null＝今日）
const curDay = () => cur || TODAY();
function renderToday() {
  const t = curDay(), e = db.e[t], box = $('#todayCard'), isToday = t === TODAY();
  const y = ymd(addDays(new Date(), -1));
  const nav = `<div class="daynav"><button class="ghost" id="prevD">‹ 前の日</button><b>${isToday ? '今日' : jp(t)}</b><button class="ghost" id="nextD" ${isToday ? 'disabled' : ''}>次の日 ›</button></div>`
    + (isToday && !db.e[y] && Object.keys(db.e).length ? `<div class="hint">昨日の分がまだです。<button class="linkb" id="goY">昨日を書く</button></div>` : '');
  const wire = () => {
    $('#prevD').onclick = () => { cur = ymd(addDays(parse(t), -1)); editing = false; sel = { tags: new Set(), mood: 3 }; renderToday(); };
    $('#nextD').onclick = () => { const n = ymd(addDays(parse(t), 1)); cur = n >= TODAY() ? null : n; editing = false; sel = { tags: new Set(), mood: 3 }; renderToday(); };
    const g = $('#goY'); if (g) g.onclick = () => { cur = y; editing = false; renderToday(); };
  };
  if (e && !editing) {
    box.innerHTML = nav + `<div class="date">${jp(t)}${e.sample ? '（サンプル）' : ''}</div><div class="entry"><p>${MOODS[e.mood - 1]} ${esc(e.text)}</p>
      <div class="tags">${e.tags.map(k => `<span>${TAGS.find(x => x[0] === k)[1]}</span>`).join('')}</div></div>
      <button class="ghost" id="editBtn" style="margin-top:10px">書き直す</button>`;
    wire();
    $('#editBtn').onclick = () => { editing = true; sel = { tags: new Set(e.tags), mood: e.mood }; renderToday(); $('#txt').value = e.sample ? '' : e.text; };
    return;
  }
  box.innerHTML = nav + `<div class="date">${jp(t)}</div><h3 style="margin:6px 0 10px">${isToday ? '今日は' : 'この日は'}、なにをしましたか？</h3>
    <textarea id="txt" maxlength="200" placeholder="1行でかまいません。例：母と電話した。夜はカレー。"></textarea>
    <div class="chips">${TAGS.map(([k, n]) => `<button class="chip ${sel.tags.has(k) ? 'on' : ''}" data-k="${k}">${n}</button>`).join('')}</div>
    <div class="date">${isToday ? '今日' : 'この日'}の気分</div>
    <div class="moods">${MOODS.map((m, i) => `<button class="mood ${sel.mood === i + 1 ? 'on' : ''}" data-m="${i + 1}">${m}</button>`).join('')}</div>
    <button class="cta" id="saveBtn">町に記録する</button>`;
  wire();
  box.querySelectorAll('.chip').forEach(b => b.onclick = () => { const k = b.dataset.k; sel.tags.has(k) ? sel.tags.delete(k) : sel.tags.add(k); b.classList.toggle('on'); });
  box.querySelectorAll('.mood').forEach(b => b.onclick = () => { sel.mood = +b.dataset.m; box.querySelectorAll('.mood').forEach(x => x.classList.toggle('on', x === b)); });
  $('#saveBtn').onclick = saveToday;
}
function saveToday() {
  const text = $('#txt').value.trim(), t = curDay();
  if (!text && !sel.tags.size) { $('#txt').focus(); return; }
  const before = townState().counts, prev = db.e[t] && !db.e[t].sample ? db.e[t] : null;
  db.e[t] = { text: text || '（ひとことなし）', tags: [...sel.tags], mood: sel.mood, at: Date.now() }; // 本物の記録（sample印なし）
  save(); editing = false;
  const after = townState().counts, msgs = [];
  if (!prev) TAGS.forEach(([k]) => { const a = levelOf(before[k] || 0), b = levelOf(after[k] || 0); if (b > a) msgs.push(a === 0 ? `町に「${buildingName(k, after[k])}」ができました。` : `「${TAGS.find(x => x[0] === k)[2][a - 1]}」が「${buildingName(k, after[k])}」に育ちました。`); });
  $('#toast').innerHTML = `<div class="toast">${msgs.length ? msgs.join('<br>') : prev ? `${t === TODAY() ? '今日' : jp(t)}の記録を書き直しました。` : '記録しました。町の人がひとり増えました。'}</div>`;
  sel = { tags: new Set(), mood: 3 }; cur = null; refresh();
}
// ---------- あの日のあなた ----------
function renderBacks() {
  const now = new Date(), list = [['1年前の今日', addDays(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), 0)], ['半年前の今日', addDays(now, -182)], ['1か月前の今日', addDays(now, -30)], ['1週間前の今日', addDays(now, -7)]];
  const html = list.filter(([, d]) => db.e[ymd(d)]).map(([w, d]) => `<div class="back"><div class="when">${w}・${jp(ymd(d))}</div><p>${MOODS[db.e[ymd(d)].mood - 1]} ${esc(db.e[ymd(d)].text)}</p></div>`).join('');
  $('#backCard').hidden = !html; $('#backs').innerHTML = html;
}
function renderBuildings(st) {
  $('#blds').innerHTML = TAGS.map(([k, n]) => {
    const c = st.counts[k] || 0, lv = levelOf(c), next = LEVEL_AT[lv] || LEVEL_AT[3], prevT = lv ? LEVEL_AT[lv - 1] : 0;
    const pct = lv === 4 ? 100 : Math.round((c - prevT) / (next - prevT) * 100);
    return `<li><b>${buildingName(k, c)}</b><div><div class="bar"><i style="width:${pct}%"></i></div><div class="small">${n}${lv < 4 ? `・あと${next - c}回で次へ` : '・最大'}</div></div><span class="n">${c}回</span></li>`;
  }).join('');
}
// ---------- 記録をさかのぼる ----------
function renderCal() {
  const y = mon.getFullYear(), m = mon.getMonth(), first = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate();
  $('#monTitle').textContent = `${y}年${m + 1}月`;
  const col = mood => ['#f3b7a8', '#f6d2a2', '#e9e4c9', '#cfe5b5', '#a8d98c'][mood - 1];
  let h = W.map(w => `<div class="w">${w}</div>`).join('') + '<div class="blank"></div>'.repeat(first);
  for (let d = 1; d <= dim; d++) { const k = ymd(new Date(y, m, d)), e = db.e[k]; h += `<div data-k="${k}" class="${e ? 'has' : ''} ${k === TODAY() ? 'today' : ''}" style="${e ? `background:${col(e.mood)}` : ''}">${d}</div>`; }
  $('#cal').innerHTML = h; $('#dayView').innerHTML = '';
  $('#cal').querySelectorAll('[data-k]').forEach(c => c.onclick = () => { const e = db.e[c.dataset.k];
    const future = c.dataset.k > TODAY();
    $('#dayView').innerHTML = `<div class="back"><div class="when">${jp(c.dataset.k)}</div><p>${e ? MOODS[e.mood - 1] + ' ' + esc(e.text) : 'この日の記録はありません。'}</p>${future ? '' : `<button class="ghost" id="writeDay">${e ? 'この日を書き直す' : 'この日を書く'}</button>`}</div>`;
    const w = $('#writeDay'); if (w) w.onclick = () => { cur = c.dataset.k === TODAY() ? null : c.dataset.k; editing = !!e; if (e) sel = { tags: new Set(e.tags), mood: e.mood }; document.querySelector('.tabs button[data-t="town"]').click(); renderToday(); if (e && !e.sample) $('#txt').value = e.text; window.scrollTo(0, $('#todayCard').offsetTop - 10); }; });
}
function search() {
  const q = $('#q').value.trim(); if (!q) { $('#hits').innerHTML = ''; return; }
  const ks = Object.keys(db.e).filter(k => db.e[k].text.includes(q)).sort().reverse();
  $('#hits').innerHTML = `<p class="small">${ks.length}件</p>` + ks.slice(0, 50).map(k => `<div class="hit"><div class="d">${jp(k)}</div><p>${esc(db.e[k].text).split(esc(q)).join(`<mark>${esc(q)}</mark>`)}</p></div>`).join('');
}
// ---------- サンプル・保存 ----------
const SAMPLE = [['朝から会議が三つ。帰りにジムで30分走った。', ['work', 'move']], ['母と電話した。夜はカレー。', ['meet', 'cook']], ['一日中だらだら。昼寝しすぎた。', ['rest']], ['英語の本を20ページ読んだ。', ['learn']],
  ['6時に起きて散歩。パン屋の焼きたてを買った。', ['early', 'move']], ['友だちと焼肉。久しぶりに笑った。', ['meet']], ['動画の編集を夜中まで。', ['make', 'work']], ['電車で海まで行った。', ['out', 'rest']],
  ['資料作りで残業。', ['work']], ['作り置きを5品。', ['cook']], ['美術館で絵を見た。', ['out', 'learn']], ['早起きして、朝ヨガ。', ['early', 'move']], ['同僚とランチ。転職の話を聞いた。', ['meet', 'work']], ['絵を描いた。', ['make']]];
function loadSample() {
  for (let i = 1; i <= 380; i++) { if (Math.random() < 0.22) continue; const d = ymd(addDays(new Date(), -i)); if (db.e[d]) continue; const [t, g] = SAMPLE[Math.floor(Math.random() * SAMPLE.length)]; db.e[d] = { text: t, tags: g, mood: 1 + Math.floor(Math.random() * 5), sample: 1 }; }
  save(); refresh();
}
$('#sampleBtn').onclick = loadSample;
$('#clearSampleBtn').onclick = () => { Object.keys(db.e).forEach(k => db.e[k].sample && delete db.e[k]); save(); refresh(); };
// ---------- 控えの保存（iPhoneは共有シートから「ファイルに保存」→ iCloud Drive を選べる） ----------
async function backup() {
  const name = `日記で育つ町_${TODAY()}.json`, blob = new Blob([JSON.stringify(db, null, 1)], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: name });
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); }
    localStorage.setItem('machi_backup_at', String(Date.now())); renderNotices();
  } catch (e) { /* 共有シートを閉じただけ */ }
}
$('#exportBtn').onclick = backup;
const realCount = () => Object.values(db.e).filter(e => !e.sample).length;
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function renderNotices() {
  // ホーム画面に追加していない時の案内（閉じたら出さない）
  const ic = $('#installCard');
  ic.hidden = standalone() || localStorage.getItem('machi_install_hide') === '1';
  ic.innerHTML = '<h3>ホーム画面に追加してください</h3><p class="small" style="font-size:13px">iPhoneのSafariは、7日間開かなかったサイトの保存データを消すことがあります。ホーム画面に追加すると、アプリのように開けて、記録が消えにくくなります。<br><b>Safariの共有ボタン（□↑）→「ホーム画面に追加」</b></p><button class="ghost" id="icHide">追加した・閉じる</button>';
  const h = $('#icHide'); if (h) h.onclick = () => { localStorage.setItem('machi_install_hide', '1'); renderNotices(); };
  // 本物の記録が5日分以上あって、控えを7日以上保存していない時
  const last = +(localStorage.getItem('machi_backup_at') || 0), days = Math.floor((Date.now() - last) / 864e5);
  const bc = $('#backupCard'); bc.hidden = !(realCount() >= 5 && days >= 7);
  bc.innerHTML = `<h3>控えを保存しましょう</h3><p class="small" style="font-size:13px">${last ? `前回の控えから${days}日たちました。` : 'まだ控えを保存していません。'}記録はこの端末の中にしかありません。「ファイルに保存」→ iCloud Drive を選ぶのがおすすめです。</p><button class="cta" id="bkNow" style="margin-top:6px">控えを保存する</button>`;
  const k = $('#bkNow'); if (k) k.onclick = backup;
}
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
$('#importBtn').onclick = () => $('#file').click();
$('#file').onchange = async e => { try { const d = JSON.parse(await e.target.files[0].text()); if (d && d.e) { Object.assign(db.e, d.e); save(); refresh(); alert('読み込みました。'); } } catch (err) { alert('読み込めませんでした。'); } };
$('#prevM').onclick = () => { mon = new Date(mon.getFullYear(), mon.getMonth() - 1, 1); renderCal(); };
$('#nextM').onclick = () => { mon = new Date(mon.getFullYear(), mon.getMonth() + 1, 1); renderCal(); };
$('#q').oninput = search;
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  $('#tab-town').hidden = b.dataset.t !== 'town'; $('#tab-log').hidden = b.dataset.t !== 'log'; if (b.dataset.t === 'log') renderCal();
});
function refresh() {
  const st = townState();
  $('#pop').textContent = st.days * 3 + (st.counts.meet || 0) * 2; $('#days').textContent = st.days; $('#streak').textContent = st.streak;
  renderToday(); renderBacks(); renderBuildings(st); renderCal(); search(); renderNotices();
}
function loop() { frame++; drawTown($('#town').getContext('2d'), townState.cache || townState(), frame); requestAnimationFrame(loop); }
const _ts = townState; townState = () => (townState.cache = _ts());
refresh(); loop();
