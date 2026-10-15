// 母の時代を生きる — 画面
const $ = q => document.querySelector(q);
let who = 'f', S = null, speed = 2, paused = false, frame = 0, yearT = 0, queue = [], waiting = null, lastTs = 0;
const YEAR_MS = 5000;

function show(id) { document.querySelectorAll('.screen').forEach(e => e.hidden = e.id !== id); window.scrollTo(0, 0); }

// ---------- タイトル ----------
function setYear(y) {
  $('#yrRange').value = y; $('#yrNum').textContent = y;
  $('#yrLine').textContent = `この年、日本では約${Math.round(tbl(STAT.births, y))}万人の赤ちゃんが生まれました。そのひとりになります。`;
}
$('#yrRange').oninput = e => setYear(+e.target.value);
document.querySelectorAll('.who button').forEach(b => b.onclick = () => { who = b.dataset.who; document.querySelectorAll('.who button').forEach(x => x.classList.toggle('on', x === b)); });
setYear(1945 + Math.floor(Math.random() * 28));

$('#bornBtn').onclick = () => born(+$('#yrRange').value);
function born(y) {
  S = newLife(y, who, Date.now() % 1e9);
  const L = tbl(who === 'f' ? STAT.lifeF : STAT.lifeM, y);
  $('#certNo').textContent = `No. ${S.pref.slice(0, 2)}-${y}-${String(S.seed).slice(-6)}`;
  $('#certName').textContent = fullName(S);
  $('#certLead').textContent = `${y}年${birthMonth(S)}月、${S.pref}の${S.area}で、${who === 'f' ? '女の子' : '男の子'}として生まれました。${S.sibsOlder ? `上に${S.sibsOlder}人のきょうだいがいます。` : '第一子です。'}`;
  const dots = '●'.repeat(S.wealth) + '○'.repeat(5 - S.wealth);
  const rows = [['生まれた所', `${S.pref}（${S.rural ? '農村・町' : '都市'}）`], ['家の暮らし向き', `${dots} 5段階中${S.wealth}`],
    ['父の仕事', S.fatherJob], ['母', `${S.motherAge}歳・${S.rural ? '家事と野良仕事' : pick(S, ['家事', '家事と内職', '家業の手伝い'])}`],
    ['一緒に暮らす人', `両親${S.sibsOlder ? '・きょうだい' : ''}${S.grand ? '・祖父母' : ''}`], ['この年の平均寿命', `${L.toFixed(1)}歳`],
    ['1歳までに亡くなる確率', `${(tbl(STAT.infantDeath, y) / 10).toFixed(1)}%`], ['高校に進む子（この子が15歳の年）', `${Math.round(tbl(STAT.highSchool, y + 15))}%`]];
  $('#certDl').innerHTML = rows.map(r => `<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('');
  show('cert');
}

// ---------- 人生 ----------
$('#lifeBtn').onclick = () => { $('#log').innerHTML = ''; queue = []; waiting = null; yearT = 0; paused = false; $('#pauseBtn').textContent = '❚❚'; show('life'); nextYear(); requestAnimationFrame(loop); };
document.querySelectorAll('.ctrl button[data-sp]').forEach(b => b.onclick = () => { speed = +b.dataset.sp; document.querySelectorAll('.ctrl button[data-sp]').forEach(x => x.classList.toggle('on', x === b)); });
$('#pauseBtn').onclick = () => { paused = !paused; $('#pauseBtn').textContent = paused ? '▶' : '❚❚'; };

function nextYear() {
  if (S.dead || S.year > NOW_Y) return finish();
  const lines = stepYear(S);
  queue = lines.map((l, i) => ({ ...l, at: (i + 0.3) / (lines.length + 0.5) }));
  $('#ageNum').textContent = S.age; $('#yrTxt').textContent = `${S.year}年 · ${fullName(S)}`;
  $('#progBar').style.width = Math.min(100, S.age / (NOW_Y - S.by) * 100) + '%';
  $('#where').textContent = whereText(S);
  meters();
}
function loop(ts) {
  if ($('#life').hidden) return;
  const dt = Math.min(100, ts - (lastTs || ts)); lastTs = ts; frame++;
  if (!paused && !waiting) {
    yearT += dt * speed / YEAR_MS;
    while (queue.length && queue[0].at <= yearT) addLog(queue.shift());
    if (yearT >= 1) {
      queue.forEach(addLog); queue = [];
      const c = pendingChoice(S);
      if (c) ask(c); else { S.year++; yearT = 0; nextYear(); }
    }
  }
  drawScene($('#scene').getContext('2d'), S, waiting ? 0.99 : Math.min(0.999, yearT), frame);
  requestAnimationFrame(loop);
}
function addLog(l) {
  const li = document.createElement('li'); li.className = l.kind;
  li.innerHTML = `<span class="a">${l.kind === 'world' ? S.by + l.age : l.age + '歳'}</span><span>${l.t}</span>`;
  $('#log').prepend(li);
}
function meters() {
  const m = [['健康', S.health, '#5fbf8a'], ['幸せ', S.happy, '#e9c46a'], ['学び', S.learn, '#5fb3bf'], ['つながり', S.bond, '#e26a8d']];
  $('#meters').innerHTML = m.map(([k, v, c]) => `<div class="meter"><div class="k">${k}</div><div class="v">${Math.round(v)}</div><div class="b"><i style="width:${v}%;background:${c}"></i></div></div>`).join('');
}
function ask(c) {
  waiting = c; const box = $('#choice'); box.hidden = false;
  box.innerHTML = `<p>${c.text}</p><p class="st">${c.st}</p>` + c.opts.map((o, i) => `<button data-i="${i}">${o.l}${o.pct != null ? `<span class="pct">${o.pct}%が選んだ道</span>` : ''}</button>`).join('') + '<button class="auto" data-i="auto">おまかせ（統計どおりに選ぶ）</button>';
  box.querySelectorAll('button').forEach(b => b.onclick = () => {
    const o = b.dataset.i === 'auto' ? autoPick(c) : c.opts[+b.dataset.i];
    S.flags[c.id] = S.flags[c.id] || (c.id !== 'wed' || o === c.opts[0] ? 1 : 0);
    const t = o.fx(); const l = { t, kind: 'big', age: S.age }; S.log.push(l); addLog(l);
    box.hidden = true; waiting = null; meters(); $('#where').textContent = whereText(S);
    const again = pendingChoice(S); if (again) ask(again); else { window.scrollTo({ top: 0, behavior: 'smooth' }); S.year++; yearT = 0; nextYear(); }
  });
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ---------- 終わり ----------
function finish() {
  show('end');
  const sw = who === 'f' ? '女の子' : '男の子', surv = Math.round(cohortSurvival(who, S.by) * 100);
  $('#endKicker').textContent = `${S.by}年生まれ · ${S.pref}の${S.area}`;
  $('#endTitle').textContent = S.dead ? `${fullName(S)}は、${S.age}歳で亡くなりました。` : `${fullName(S)}は今、${NOW_Y - S.by}歳。`;
  $('#endLead').textContent = `${S.by}年に生まれた${sw}のうち、${NOW_Y}年の今日まで生きているのは約${surv}%です。` + (S.dead ? '' : `${S.kids.length ? `子ども${S.kids.length}人を育て、` : ''}${whereText(S)}。`);
  $('#askTitle').textContent = `あなたのお${who === 'f' ? '母' : '父'}さんも、この時代を生きてきました。今度、聞いてみてください。`;
  $('#askList').innerHTML = questions().map(q => `<li>${q}</li>`).join('');
  const keep = S.log.filter(l => /big|sad|good/.test(l.kind));
  $('#endLog').innerHTML = keep.map(l => `<li class="${l.kind}"><span class="a">${l.age}歳</span><span>${l.t}</span></li>`).join('');
  drawCard(surv);
}
function questions() {
  const b = S.by, q = [];
  if (b <= 1959) q.push('1964年の東京オリンピック、どこで、誰と見た？');
  if (b <= 1957) q.push('家にはじめてテレビが来た日のこと、覚えてる？');
  if (b >= 1945 && b <= 1962) q.push('大阪万博には行った？　何を見た？');
  if (b <= 1966) q.push('オイルショックのとき、トイレットペーパーは買えた？');
  if (b >= 1955 && b <= 1972) q.push('バブルのころは、どんな暮らしをしてた？');
  q.push('中学や高校の同級生は、卒業してどんな道に進んだ？');
  q.push(`お${who === 'f' ? '父' : '母'}さんとは、お見合い？恋愛？　どこで出会ったの？`);
  q.push('子どものころ、いちばんのごちそうは何だった？');
  const pickN = q.sort(() => Math.random() - 0.5).slice(0, 2);
  pickN.push('私が生まれた日のこと、覚えてる？');
  return pickN;
}
function drawCard(surv) {
  const c = $('#card').getContext('2d');
  c.fillStyle = '#0f1316'; c.fillRect(0, 0, 1200, 630);
  const off = document.createElement('canvas'); off.width = 192; off.height = 108;
  drawScene(off.getContext('2d'), S, 0.15, 30);
  c.imageSmoothingEnabled = false; c.drawImage(off, 0, 0, 576, 324);
  c.fillStyle = '#e26a8d'; c.fillRect(0, 324, 576, 6);
  c.fillStyle = '#9aa29f'; c.font = '26px "Hiragino Sans", sans-serif';
  c.fillText(`${S.by}年生まれ · ${S.pref}`, 630, 90);
  c.fillStyle = '#eceae6'; c.font = '58px "Hiragino Mincho ProN", serif';
  c.fillText(fullName(S), 630, 170);
  c.font = '30px "Hiragino Sans", sans-serif'; c.fillStyle = '#c9c6bf';
  wrapText(c, S.dead ? `${S.age}歳で亡くなりました。` : `今、${NOW_Y - S.by}歳。${S.kids.length ? `子ども${S.kids.length}人。` : ''}`, 630, 240, 520, 46);
  wrapText(c, `同じ年に生まれた${who === 'f' ? '女の子' : '男の子'}の${surv}%が、今日を生きています。`, 630, 300, 520, 46);
  const big = S.log.filter(l => l.kind.includes('big')).slice(-3);
  c.font = '24px "Hiragino Sans", sans-serif'; c.fillStyle = '#e9c46a';
  big.forEach((l, i) => c.fillText(`${l.age}歳  ${l.t.slice(0, 40)}${l.t.length > 40 ? '…' : ''}`, 40, 420 + i * 46));
  c.fillStyle = '#e26a8d'; c.font = '28px "Hiragino Mincho ProN", serif'; c.fillText('母の時代を生きる', 40, 600);
}
function wrapText(c, text, x, y, w, lh) { let line = ''; for (const ch of text) { if (c.measureText(line + ch).width > w) { c.fillText(line, x, y); line = ch; y += lh; } else line += ch; } c.fillText(line, x, y); }
$('#saveBtn').onclick = () => { const a = document.createElement('a'); a.download = `${fullName(S)}.png`; a.href = $('#card').toDataURL('image/png'); a.click(); };
$('#againBtn').onclick = () => born(S.by);
$('#topBtn').onclick = () => show('title');
