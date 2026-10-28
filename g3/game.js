// 1分バトル：動くだけ・攻撃は自動・レベルアップで技を3つから1つ選ぶ。日記を書くと技が増える
const $ = s => document.querySelector(s);
const cv = $('#cv'), cx = cv.getContext('2d');
let W = 0, H = 0;
function fit() { const r = cv.getBoundingClientRect(), d = devicePixelRatio || 1; W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0); }
addEventListener('resize', fit);

// いつもの技
const SK = {
  shot: { name: '一撃', max: 5, desc: l => l === 1 ? 'いちばん近い敵に、自動で打つ' : '打つ間隔が短く、弾が増える' },
  orbit: { name: '回る本', max: 4, desc: l => `まわりを本が${l + 1}冊まわって当たる` },
  aura: { name: '気合い', max: 4, desc: l => `近くの敵にずっとダメージ（範囲${l}）` },
  boom: { name: '爆発', max: 4, desc: l => `数秒ごとに敵のところで爆発（威力${l}）` },
  speed: { name: '足が速い', max: 3, desc: () => '移動が速くなる' },
  hp: { name: '体力', max: 3, desc: () => '最大体力＋3・全回復' },
  magnet: { name: '磁石', max: 3, desc: () => '経験の玉を遠くから吸いよせる' },
};
// 日記から生まれる技（何をした日か で決まる）
const DT = {
  work: { name: '夜の集中', desc: 'すべての攻撃が1.5倍' }, move: { name: '疾風', desc: '足がとても速くなる' },
  rest: { name: '回復の香り', desc: '3秒ごとに体力1回復' }, cook: { name: 'おふくろの味', desc: '体力＋5・3秒ごとに1回復' },
  meet: { name: '仲間', desc: 'いっしょに戦う仲間があらわれる' }, learn: { name: '知恵の書', desc: '回る本が2冊増える' },
  early: { name: '朝の一撃', desc: '打つ間隔がぐっと短くなる' }, out: { name: '遠くまで', desc: '弾が敵を3体つらぬく' },
  make: { name: '手作りの爆弾', desc: '爆発が大きく、よく起きる' },
};
const TAGN = { work: '仕事', move: '運動', rest: '休んだ', cook: '料理', meet: '人に会った', learn: '学び', early: '早起き', out: 'お出かけ', make: '創作' };
const md = n => { const x = new Date(); x.setDate(x.getDate() - n); return `${x.getMonth() + 1}/${x.getDate()}`; };
const DKEY = 'g3_diary';
let DIARY = JSON.parse(localStorage.getItem(DKEY) || 'null') || [
  { id: 'd1', tag: 'cook', text: '母にカレーを作った', date: md(3) },
  { id: 'd2', tag: 'work', text: '残業。資料が終わらない', date: md(2) },
  { id: 'd3', tag: 'meet', text: '同期とランチ', date: md(1) },
];
const saveD = () => localStorage.setItem(DKEY, JSON.stringify(DIARY));

let G, keys = {}, joy = null, paused = true, last = 0;
function newGame() {
  G = { t: 0, lv: 1, xp: 0, kills: 0, sk: { shot: 1 }, ds: [], hero: { x: W / 2, y: H / 2, hp: 20, max: 20, inv: 0 },
    en: [], bu: [], gems: [], fx: [], spawn: 0, cd: { shot: 0, aura: 0, boom: 0, heal: 0, ally: 0 }, ang: 0, boss: false, over: false, ally: null };
  renderHud();
}
const has = id => G.ds.some(d => DT[d.tag] && d.tag === id);
const mul = () => has('work') ? 1.5 : 1;
const need = () => 3 + G.lv * 2;

function spawn() {
  const side = Math.random() * 4 | 0, p = side === 0 ? [Math.random() * W, -20] : side === 1 ? [W + 20, Math.random() * H] : side === 2 ? [Math.random() * W, H + 20] : [-20, Math.random() * H];
  const t = G.t, r = Math.random();
  const ty = t > 20 && r < 0.18 ? { g: '重', hp: 6 + t / 8, spd: 32, r: 16 } : t > 8 && r < 0.45 ? { g: '焦', hp: 1 + t / 25, spd: 72, r: 11 } : { g: '怠', hp: 1.5 + t / 18, spd: 42, r: 13 };
  G.en.push({ x: p[0], y: p[1], ...ty, oT: 0 });
}
function nearest(x, y) { let b = null, d = 1e9; for (const e of G.en) { const q = (e.x - x) ** 2 + (e.y - y) ** 2; if (q < d) { d = q; b = e; } } return b; }
function hurt(e, dmg) {
  dmg *= mul(); e.hp -= dmg; G.fx.push({ k: 'n', x: e.x, y: e.y - e.r, v: Math.round(dmg * 10) / 10, t: 0.6 });
  if (e.hp <= 0 && !e.dead) { e.dead = true; G.kills++; G.gems.push({ x: e.x, y: e.y, v: e.boss ? 12 : 1 }); if (e.boss) G.bossDown = true; }
}

function update(dt) {
  const h = G.hero; G.t += dt;
  if (G.t >= 60) return end(true);
  // 移動
  let mx = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0), my = (keys.ArrowDown || keys.s ? 1 : 0) - (keys.ArrowUp || keys.w ? 1 : 0);
  if (joy && joy.dx * joy.dx + joy.dy * joy.dy > 64) { const l = Math.hypot(joy.dx, joy.dy); mx = joy.dx / l; my = joy.dy / l; }
  const ml = Math.hypot(mx, my) || 1, sp = 120 * (1 + 0.15 * (G.sk.speed || 0)) * (has('move') ? 1.4 : 1);
  h.x = Math.max(12, Math.min(W - 12, h.x + mx / ml * sp * dt)); h.y = Math.max(12, Math.min(H - 12, h.y + my / ml * sp * dt));
  // 敵の出現（45秒でボス）
  G.spawn -= dt; if (G.spawn <= 0) { spawn(); G.spawn = Math.max(0.28, 1.1 - G.t * 0.014); }
  if (G.t >= 45 && !G.boss) { G.boss = true; G.en.push({ x: W / 2, y: -30, g: '飽', hp: 50, max: 50, spd: 38, r: 28, boss: true, oT: 0 }); G.fx.push({ k: 'b', t: 1.6, txt: 'ボス　三日坊主' }); }
  for (const e of G.en) {
    const a = Math.atan2(h.y - e.y, h.x - e.x); e.x += Math.cos(a) * e.spd * dt; e.y += Math.sin(a) * e.spd * dt; e.oT -= dt;
    if (Math.hypot(h.x - e.x, h.y - e.y) < e.r + 11 && h.inv <= 0) { h.hp -= e.boss ? 2 : 1; h.inv = 0.8; G.fx.push({ k: 'hit', t: 0.25 }); if (h.hp <= 0) return end(false); }
  }
  h.inv -= dt;
  // 一撃
  const sl = G.sk.shot || 0;
  if (sl && (G.cd.shot -= dt) <= 0) {
    const tg = nearest(h.x, h.y);
    if (tg) { const n = 1 + (sl >> 1), base = Math.atan2(tg.y - h.y, tg.x - h.x); for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * 0.18; G.bu.push({ x: h.x, y: h.y, vx: Math.cos(a) * 330, vy: Math.sin(a) * 330, dmg: 1, pierce: has('out') ? 3 : 0, life: 1.4, hit: new Set() }); } }
    G.cd.shot = 0.75 * Math.pow(0.85, sl - 1) * (has('early') ? 0.6 : 1);
  }
  // 仲間
  if (has('meet')) {
    if (!G.ally) G.ally = { x: h.x, y: h.y };
    G.ally.x += (h.x - 26 - G.ally.x) * 4 * dt; G.ally.y += (h.y - 18 - G.ally.y) * 4 * dt;
    if ((G.cd.ally -= dt) <= 0) { const tg = nearest(G.ally.x, G.ally.y); if (tg) { const a = Math.atan2(tg.y - G.ally.y, tg.x - G.ally.x); G.bu.push({ x: G.ally.x, y: G.ally.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, dmg: 1, pierce: 0, life: 1.4, hit: new Set(), ally: true }); } G.cd.ally = 0.8; }
  }
  for (const b of G.bu) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    for (const e of G.en) if (!e.dead && !b.hit.has(e) && Math.hypot(b.x - e.x, b.y - e.y) < e.r + 4) { hurt(e, b.dmg); b.hit.add(e); if (b.pierce-- <= 0) { b.life = 0; break; } }
  }
  // 回る本
  const on = G.sk.orbit ? G.sk.orbit + 1 + (has('learn') ? 2 : 0) : (has('learn') ? 2 : 0);
  G.ang += dt * 3.2; G.orbN = on;
  for (let i = 0; i < on; i++) { const a = G.ang + i * Math.PI * 2 / on, ox = h.x + Math.cos(a) * 54, oy = h.y + Math.sin(a) * 54; for (const e of G.en) if (!e.dead && e.oT <= 0 && Math.hypot(ox - e.x, oy - e.y) < e.r + 8) { hurt(e, 1.2); e.oT = 0.35; } }
  // 気合い
  if (G.sk.aura && (G.cd.aura -= dt) <= 0) { const R = 40 + G.sk.aura * 14; for (const e of G.en) if (Math.hypot(h.x - e.x, h.y - e.y) < R + e.r) hurt(e, 0.6); G.cd.aura = 0.5; }
  // 爆発
  const bl = (G.sk.boom || 0) + (has('make') ? 2 : 0);
  if (bl && (G.cd.boom -= dt) <= 0) { const e0 = G.en[Math.random() * G.en.length | 0]; if (e0) { const R = 46 + bl * 8; G.fx.push({ k: 'boom', x: e0.x, y: e0.y, r: R, t: 0.35 }); for (const e of G.en) if (Math.hypot(e0.x - e.x, e0.y - e.y) < R) hurt(e, 1.5 * bl); } G.cd.boom = Math.max(1, 3 - bl * 0.4); }
  // 回復
  if ((has('rest') || has('cook')) && (G.cd.heal -= dt) <= 0) { if (h.hp < h.max) { h.hp++; G.fx.push({ k: 'n', x: h.x, y: h.y - 20, v: '+1', t: 0.6, c: '#5fd39a' }); } G.cd.heal = 3; }
  // 経験の玉
  const mag = 75 + (G.sk.magnet || 0) * 45;
  for (const g of G.gems) { const d = Math.hypot(h.x - g.x, h.y - g.y); if (d < mag) { g.x += (h.x - g.x) * 9 * dt; g.y += (h.y - g.y) * 9 * dt; } if (d < 14) { g.got = true; G.xp += g.v; } }
  G.en = G.en.filter(e => !e.dead); G.bu = G.bu.filter(b => b.life > 0 && b.x > -30 && b.x < W + 30 && b.y > -30 && b.y < H + 30); G.gems = G.gems.filter(g => !g.got);
  for (const f of G.fx) f.t -= dt; G.fx = G.fx.filter(f => f.t > 0);
  if (G.xp >= need()) { G.xp -= need(); G.lv++; levelUp(); }
  renderHud();
}

function draw() {
  cx.clearRect(0, 0, W, H);
  const h = G.hero;
  if (G.sk.aura) { cx.beginPath(); cx.arc(h.x, h.y, 40 + G.sk.aura * 14, 0, 7); cx.fillStyle = 'rgba(246,196,83,.07)'; cx.fill(); cx.strokeStyle = 'rgba(246,196,83,.25)'; cx.stroke(); }
  for (const g of G.gems) { cx.fillStyle = g.v > 1 ? '#f6c453' : '#5aa9ff'; cx.beginPath(); cx.moveTo(g.x, g.y - 6); cx.lineTo(g.x + 5, g.y); cx.lineTo(g.x, g.y + 6); cx.lineTo(g.x - 5, g.y); cx.fill(); }
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for (const e of G.en) {
    cx.beginPath(); cx.arc(e.x, e.y, e.r, 0, 7); cx.fillStyle = e.boss ? '#7a1f2b' : '#4a2230'; cx.fill(); cx.strokeStyle = e.boss ? '#ff6b5a' : '#a3485a'; cx.lineWidth = 2; cx.stroke();
    cx.fillStyle = '#ffe9e4'; cx.font = `700 ${e.r * 1.15}px "Hiragino Mincho ProN",serif`; cx.fillText(e.g, e.x, e.y + 1);
    if (e.boss) { cx.fillStyle = '#000'; cx.fillRect(e.x - 30, e.y - e.r - 12, 60, 5); cx.fillStyle = '#ff6b5a'; cx.fillRect(e.x - 30, e.y - e.r - 12, 60 * Math.max(0, e.hp / e.max), 5); }
  }
  for (const b of G.bu) { cx.fillStyle = b.ally ? '#ffd9a3' : '#fff3c4'; cx.beginPath(); cx.arc(b.x, b.y, 3.5, 0, 7); cx.fill(); }
  for (let i = 0; i < (G.orbN || 0); i++) { const a = G.ang + i * Math.PI * 2 / G.orbN; cx.save(); cx.translate(h.x + Math.cos(a) * 54, h.y + Math.sin(a) * 54); cx.rotate(a); cx.fillStyle = '#7a9cff'; cx.fillRect(-6, -8, 12, 16); cx.fillStyle = '#fff'; cx.fillRect(-4, -6, 2, 12); cx.restore(); }
  if (G.ally) { cx.beginPath(); cx.arc(G.ally.x, G.ally.y, 8, 0, 7); cx.fillStyle = '#ffd9a3'; cx.fill(); }
  cx.beginPath(); cx.arc(h.x, h.y, 11, 0, 7); cx.fillStyle = h.inv > 0 && (G.t * 20 | 0) % 2 ? '#ff6b5a' : '#f3eee3'; cx.fill(); cx.strokeStyle = '#f6c453'; cx.lineWidth = 3; cx.stroke();
  cx.fillStyle = '#000'; cx.fillRect(h.x - 16, h.y + 16, 32, 4); cx.fillStyle = '#5fd39a'; cx.fillRect(h.x - 16, h.y + 16, 32 * h.hp / h.max, 4);
  for (const f of G.fx) {
    if (f.k === 'n') { cx.globalAlpha = Math.min(1, f.t * 2); cx.fillStyle = f.c || '#fff'; cx.font = '800 13px sans-serif'; cx.fillText(f.v, f.x, f.y - (0.6 - f.t) * 30); cx.globalAlpha = 1; }
    if (f.k === 'boom') { cx.beginPath(); cx.arc(f.x, f.y, f.r * (1 - f.t), 0, 7); cx.fillStyle = `rgba(255,140,80,${f.t * 1.5})`; cx.fill(); }
    if (f.k === 'hit') { cx.fillStyle = `rgba(255,60,60,${f.t})`; cx.fillRect(0, 0, W, H); }
    if (f.k === 'b') { cx.fillStyle = '#ff6b5a'; cx.font = '800 24px "Hiragino Mincho ProN",serif'; cx.fillText(f.txt, W / 2, H * 0.3); }
  }
  if (joy) { cx.beginPath(); cx.arc(joy.ox, joy.oy, 36, 0, 7); cx.strokeStyle = 'rgba(255,255,255,.15)'; cx.lineWidth = 2; cx.stroke(); cx.beginPath(); cx.arc(joy.ox + Math.max(-36, Math.min(36, joy.dx)), joy.oy + Math.max(-36, Math.min(36, joy.dy)), 14, 0, 7); cx.fillStyle = 'rgba(255,255,255,.2)'; cx.fill(); }
}

function renderHud() {
  $('#lv').textContent = G.lv; $('#time').textContent = Math.max(0, Math.ceil(60 - G.t)); $('#kills').textContent = G.kills;
  $('#xpb').style.width = (G.xp / need() * 100) + '%';
  $('#skills').innerHTML = Object.entries(G.sk).map(([k, l]) => `<span class="sk">${SK[k].name} ${l}</span>`).join('') + G.ds.map(d => `<span class="sk d">${d.date} ${DT[d.tag].name}</span>`).join('');
}

function loop(ts) { const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts; if (!paused && !G.over) update(dt); if (G) draw(); requestAnimationFrame(loop); }

function sheet(html) { const d = document.createElement('div'); d.className = 'sheet'; d.innerHTML = html; $('.app').appendChild(d); return d; }

function levelUp() {
  paused = true; joy = null;
  const basic = Object.keys(SK).filter(k => (G.sk[k] || 0) < SK[k].max).sort(() => Math.random() - 0.5);
  const dia = DIARY.filter(d => !G.ds.includes(d) && !G.ds.some(x => x.tag === d.tag)).sort(() => Math.random() - 0.5);
  const opts = [];
  if (dia.length && Math.random() < 0.7) opts.push({ d: dia[0] });
  for (const k of basic) if (opts.length < 3) opts.push({ k });
  for (const d of dia.slice(1)) if (opts.length < 3) opts.push({ d });
  opts.sort(() => Math.random() - 0.5);
  const s = sheet(`<h2>レベルアップ！</h2><p>ひとつ選ぶ</p>` + opts.map((o, i) => o.d
    ? `<button class="card d" data-i="${i}"><span class="date">${o.d.date} の日記「${o.d.text}」から</span><b>${DT[o.d.tag].name}</b><small>${DT[o.d.tag].desc}</small></button>`
    : `<button class="card" data-i="${i}"><span class="lv">${G.sk[o.k] ? 'Lv' + (G.sk[o.k] + 1) : '新しい技'}</span><b>${SK[o.k].name}</b><small>${SK[o.k].desc((G.sk[o.k] || 0) + 1)}</small></button>`).join(''));
  s.onclick = e => {
    const c = e.target.closest('.card'); if (!c) return; const o = opts[+c.dataset.i];
    if (o.d) { G.ds.push(o.d); if (o.d.tag === 'cook') { G.hero.max += 5; G.hero.hp += 5; } }
    else { G.sk[o.k] = (G.sk[o.k] || 0) + 1; if (o.k === 'hp') { G.hero.max += 3; G.hero.hp = G.hero.max; } }
    s.remove(); renderHud(); paused = false;
  };
}

function end(win) {
  G.over = true; paused = true; joy = null;
  const used = G.ds.map(d => `${d.date}「${d.text}」→ ${DT[d.tag].name}`).join('<br>');
  const s = sheet(`<h2>${win ? '1分、生きのびた！' : 'やられた…'}</h2><p>${win ? (G.bossDown ? '三日坊主まで倒した！' : '三日坊主からは逃げきった') : `のこり ${Math.ceil(60 - G.t)} 秒だった`}<br>Lv ${G.lv}・倒した ${G.kills}</p>
    ${used ? `<div class="list">今回使った日記の技<br>${used}</div>` : ''}
    <div class="list">日記を書くと、次の戦いで選べる技が1つ増える（今 ${DIARY.length}つ）</div>
    <button class="btn" id="again">もう1回</button><button class="btn ghost" id="wr">今日の日記を書く</button>`);
  s.querySelector('#again').onclick = () => { s.remove(); start(); };
  s.querySelector('#wr').onclick = () => { s.remove(); writeSheet(); };
}

function writeSheet() {
  let tag = null;
  const s = sheet(`<h2>今日はどんな日？</h2><p>1行と、何をした日か。<br>それが次の戦いの技になる。</p><input type="text" placeholder="例：早起きして散歩した">
    <div class="chips">${Object.entries(TAGN).map(([k, v]) => `<button class="chip" data-k="${k}">${v}</button>`).join('')}</div>
    <button class="btn" id="ok">書いた</button><button class="btn ghost" id="no">やめる</button>`);
  s.querySelector('.chips').onclick = e => { const c = e.target.closest('.chip'); if (!c) return; tag = c.dataset.k; s.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === c)); };
  s.querySelector('#no').onclick = () => { s.remove(); title(); };
  s.querySelector('#ok').onclick = () => {
    if (!tag) { s.querySelector('p').innerHTML = '<b style="color:#ff6b5a">何をした日かを1つ選んでください</b>'; return; }
    const text = s.querySelector('input').value.trim() || TAGN[tag];
    DIARY = DIARY.filter(d => d.tag !== tag).concat({ id: 'd' + Date.now(), tag, text: text.slice(0, 16), date: md(0) }); saveD();
    s.remove();
    const t = sheet(`<h2>新しい技が生まれた</h2><button class="card d"><span class="date">${md(0)} の日記「${text.slice(0, 16)}」から</span><b>${DT[tag].name}</b><small>${DT[tag].desc}</small></button><p>次の戦いのレベルアップで出てきます</p><button class="btn">戦いへ</button>`);
    t.querySelector('.btn').onclick = () => { t.remove(); start(); };
  };
}

function title() {
  const s = sheet(`<p style="letter-spacing:.15em;font-size:12px">おもちゃ版 · 絵はまだありません</p><h2>1分だけ、<br>生きのびろ。</h2>
    <p>指でなぞって動くだけ。攻撃は自動。<br>レベルが上がるたびに、技を3つから1つ選ぶ。<br>金色の技は、<b style="color:#f6c453">あなたの日記から生まれた技</b>。</p>
    <div class="list">今の日記の技<br>${DIARY.map(d => `${d.date}「${d.text}」→ ${DT[d.tag].name}`).join('<br>')}</div>
    <button class="btn" id="go">はじめる</button><button class="btn ghost" id="wr">今日の日記を書く（技が増える）</button>`);
  s.querySelector('#go').onclick = () => { s.remove(); start(); };
  s.querySelector('#wr').onclick = () => { s.remove(); writeSheet(); };
}
function start() { fit(); newGame(); paused = false; }

cv.addEventListener('pointerdown', e => { const r = cv.getBoundingClientRect(); joy = { ox: e.clientX - r.left, oy: e.clientY - r.top, dx: 0, dy: 0 }; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => { if (!joy) return; const r = cv.getBoundingClientRect(); joy.dx = e.clientX - r.left - joy.ox; joy.dy = e.clientY - r.top - joy.oy; });
const up = () => { joy = null; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
addEventListener('keydown', e => keys[e.key] = true); addEventListener('keyup', e => keys[e.key] = false);
fit(); newGame(); title(); requestAnimationFrame(loop);
