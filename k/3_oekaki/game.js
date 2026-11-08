// ③ せんろ おえかき — ゆびで せんろを かくと でんしゃが はしる
(function () {
  'use strict';
  const W = K.W, H = K.H, c = K.ctx;
  const STEP = 8;               // せんろの点の間かく（一定）
  const GAME = 'せんろ おえかき';
  const COLOR = K.C.green;

  // ---------- ステージ ----------
  // water: ellipse / river(折れ線＋はば)、mountains: ellipse、items: star / guest / fruit
  const STAGES = [
    {
      intro: 'えきから ゆびで なぞって せんろを かこう',
      start: { x: 170, y: 420 }, goal: { x: 1110, y: 420 },
      water: [{ type: 'ellipse', x: 640, y: 430, rx: 130, ry: 95 }],
      mountains: [],
      items: [
        { k: 'star', x: 400, y: 330 }, { k: 'star', x: 640, y: 430 }, { k: 'star', x: 880, y: 330 },
        { k: 'guest', x: 640, y: 230, col: K.C.pink },
      ],
      demo: [[170, 420], [300, 360], [420, 330], [540, 400], [640, 430], [760, 400], [880, 330], [1000, 360], [1110, 420]],
    },
    {
      intro: 'こんどは かわと やまが あるよ。えきから ゴールまで せんろを かこう',
      start: { x: 160, y: 560 }, goal: { x: 1110, y: 250 },
      water: [{ type: 'river', w: 100, pts: [[600, 90], [560, 260], [500, 420], [520, 560], [470, 740]] }],
      mountains: [{ x: 860, y: 470, rx: 150, ry: 115 }],
      items: [
        { k: 'star', x: 330, y: 470 }, { k: 'star', x: 520, y: 360 }, { k: 'star', x: 700, y: 260 }, { k: 'star', x: 1060, y: 470 },
        { k: 'guest', x: 300, y: 300, col: K.C.blue }, { k: 'guest', x: 1000, y: 620, col: K.C.orange },
        { k: 'fruit', x: 700, y: 600, f: 0 }, { k: 'fruit', x: 880, y: 200, f: 1 },
      ],
    },
    {
      intro: 'かわを わたって ゴールまで いこう',
      start: { x: 150, y: 230 }, goal: { x: 1120, y: 590 },
      water: [
        { type: 'ellipse', x: 350, y: 520, rx: 140, ry: 90 },
        { type: 'river', w: 90, pts: [[760, 90], [700, 250], [790, 420], [720, 560], [760, 740]] },
      ],
      mountains: [{ x: 1000, y: 300, rx: 140, ry: 105 }, { x: 470, y: 250, rx: 100, ry: 80 }],
      items: [
        { k: 'star', x: 300, y: 350 }, { k: 'star', x: 350, y: 520 }, { k: 'star', x: 600, y: 430 }, { k: 'star', x: 740, y: 330 },
        { k: 'star', x: 880, y: 560 }, { k: 'star', x: 1150, y: 400 },
        { k: 'guest', x: 160, y: 620, col: K.C.purple }, { k: 'guest', x: 620, y: 160, col: K.C.red }, { k: 'guest', x: 960, y: 470, col: K.C.blue },
        { k: 'fruit', x: 560, y: 620, f: 2 }, { k: 'fruit', x: 880, y: 150, f: 0 }, { k: 'fruit', x: 1170, y: 220, f: 1 },
      ],
    },
    {
      intro: 'みずうみと やまを こえて いこう',
      start: { x: 180, y: 620 }, goal: { x: 1110, y: 170 },
      water: [
        { type: 'ellipse', x: 620, y: 440, rx: 180, ry: 115 },
        { type: 'river', w: 86, pts: [[1000, 90], [960, 260], [1010, 430], [960, 600], [1000, 740]] },
      ],
      mountains: [{ x: 360, y: 300, rx: 120, ry: 95 }, { x: 830, y: 630, rx: 125, ry: 90 }],
      items: [
        { k: 'star', x: 260, y: 520 }, { k: 'star', x: 450, y: 480 }, { k: 'star', x: 620, y: 440 },
        { k: 'star', x: 780, y: 330 }, { k: 'star', x: 940, y: 240 }, { k: 'star', x: 1150, y: 520 },
        { k: 'guest', x: 180, y: 240, col: K.C.pink }, { k: 'guest', x: 620, y: 180, col: K.C.green }, { k: 'guest', x: 840, y: 630, col: K.C.orange },
        { k: 'fruit', x: 420, y: 650, f: 1 }, { k: 'fruit', x: 1170, y: 330, f: 2 },
      ],
    },
    {
      intro: 'さいごの ステージだよ。いっぱい あつめて ゴールまで いこう',
      start: { x: 150, y: 390 }, goal: { x: 1140, y: 390 },
      water: [
        { type: 'river', w: 92, pts: [[430, 90], [470, 260], [420, 430], [470, 600], [430, 740]] },
        { type: 'river', w: 92, pts: [[860, 90], [820, 260], [870, 430], [820, 600], [860, 740]] },
      ],
      mountains: [{ x: 645, y: 150, rx: 150, ry: 95 }, { x: 645, y: 640, rx: 150, ry: 95 }],
      items: [
        { k: 'star', x: 280, y: 250 }, { k: 'star', x: 280, y: 560 }, { k: 'star', x: 450, y: 390 },
        { k: 'star', x: 645, y: 390 }, { k: 'star', x: 845, y: 390 }, { k: 'star', x: 1020, y: 250 }, { k: 'star', x: 1020, y: 560 },
        { k: 'guest', x: 180, y: 620, col: K.C.blue }, { k: 'guest', x: 645, y: 250, col: K.C.red },
        { k: 'guest', x: 645, y: 540, col: K.C.purple }, { k: 'guest', x: 1150, y: 170, col: K.C.green },
        { k: 'fruit', x: 180, y: 180, f: 0 }, { k: 'fruit', x: 1150, y: 620, f: 2 }, { k: 'fruit', x: 450, y: 650, f: 1 },
      ],
    },
  ];

  // ---------- 状態 ----------
  let st = null;       // ステージ
  let stageNo = 0;
  let pts = [];        // せんろ {x,y,k:'g'|'b'|'t'}
  let sm = null;       // なめらか用
  let mode = 'idle';   // intro / idle / drawing / running / arrived
  let done = false;    // ゴールまで描けた
  let trainS = 0, runV = 0, runT = 0;
  let items = [], flyers = [];
  let got = { star: 0, guest: 0, fruit: 0 };
  let total = { star: 0, guest: 0, fruit: 0 };   // 3ステージの ごうけい
  let railSaid = false;
  let saidB = false, saidT = false, lastHint = -9, tm = 0, modeT = 0, idleT = 0;
  let demoT = 0, showDemo = false;
  let pulse = null;    // {x,y} ここから描いてね
  let banner = null;   // {text, t}
  let wasIn = 'g';

  function say(s) { K.say(s); }
  function inEllipse(e, x, y, pad) { const dx = (x - e.x) / (e.rx + pad), dy = (y - e.y) / (e.ry + pad); return dx * dx + dy * dy <= 1; }
  function distSeg(px, py, ax, ay, bx, by) {
    const vx = bx - ax, vy = by - ay, l = vx * vx + vy * vy;
    let t = l ? ((px - ax) * vx + (py - ay) * vy) / l : 0; t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - ax - vx * t, py - ay - vy * t);
  }
  function inWater(x, y) {
    for (const w of st.water) {
      if (w.type === 'ellipse' && inEllipse(w, x, y, 6)) return true;
      if (w.type === 'river') for (let i = 0; i < w.pts.length - 1; i++) if (distSeg(x, y, w.pts[i][0], w.pts[i][1], w.pts[i + 1][0], w.pts[i + 1][1]) < w.w / 2 + 6) return true;
    }
    return false;
  }
  function inMountain(x, y) { return st.mountains.some(m => inEllipse(m, x, y, -6)); }
  function kindAt(x, y) { return inMountain(x, y) ? 't' : inWater(x, y) ? 'b' : 'g'; }
  function trackLen() { return Math.max(0, (pts.length - 1) * STEP); }
  function runEnd() { return Math.max(0, trackLen() - 34); }   // あたまが せんろの はしで とまるように
  function endPt() { return pts.length ? pts[pts.length - 1] : st.start; }

  // s（きょり）の位置と向き。はみ出したら まっすぐ のばす
  function posAt(s) {
    if (pts.length < 2) {
      const a = Math.atan2(st.goal.y - st.start.y, st.goal.x - st.start.x);
      return { x: st.start.x + Math.cos(a) * s, y: st.start.y + Math.sin(a) * s, a };
    }
    const L = trackLen();
    if (s <= 0) { const a = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x); return { x: pts[0].x + Math.cos(a) * s, y: pts[0].y + Math.sin(a) * s, a }; }
    if (s >= L) { const n = pts.length, a = Math.atan2(pts[n - 1].y - pts[n - 2].y, pts[n - 1].x - pts[n - 2].x); return { x: pts[n - 1].x + Math.cos(a) * (s - L), y: pts[n - 1].y + Math.sin(a) * (s - L), a }; }
    const i = Math.floor(s / STEP), f = s / STEP - i, p = pts[i], q = pts[i + 1];
    // 向きは少し先と後ろで取って なめらかに
    const p0 = pts[Math.max(0, i - 2)], p1 = pts[Math.min(pts.length - 1, i + 3)];
    return { x: p.x + (q.x - p.x) * f, y: p.y + (q.y - p.y) * f, a: Math.atan2(p1.y - p0.y, p1.x - p0.x) };
  }
  function kindAtS(s) { const i = Math.round(s / STEP); return pts[Math.max(0, Math.min(pts.length - 1, i))]?.k || 'g'; }

  // ---------- ステージ開始 ----------
  function startStage(n) {
    stageNo = n; st = STAGES[n];
    if (n === 0) total = { star: 0, guest: 0, fruit: 0 };
    pts = []; sm = null; done = false; trainS = 0; runV = 0;
    items = st.items.map(o => ({ ...o, taken: false, ph: Math.random() * 6 }));
    flyers = []; got = { star: 0, guest: 0, fruit: 0 };
    saidB = false; saidT = false; railSaid = false; banner = null; pulse = null; wasIn = 'g';
    mode = 'idle'; modeT = 0; idleT = 0;
    showDemo = !!st.demo; demoT = 0;
    say(st.intro);
    K.scene = scene;
  }

  // ---------- じゆうに かく（ゴールなし・はしりながら かきたせる） ----------
  function randomFreeStage() {
    const r = (a, b) => a + Math.random() * (b - a);
    const s = {
      free: true, intro: 'すきなだけ せんろを かいて あそぼう',
      start: { x: 170, y: 360 }, goal: { x: -9999, y: -9999 },
      water: [
        { type: 'ellipse', x: r(420, 820), y: r(330, 560), rx: r(110, 165), ry: r(80, 110) },
        { type: 'river', w: 88, pts: [[r(900, 1050), 90], [r(880, 1020), 260], [r(900, 1050), 430], [r(880, 1020), 600], [r(900, 1050), 740]] },
      ],
      mountains: [{ x: r(380, 620), y: r(140, 230), rx: r(100, 140), ry: r(80, 100) },
                  { x: r(700, 980), y: r(560, 650), rx: r(100, 140), ry: r(80, 100) }],
      items: [],
    };
    for (let i = 0; i < 14; i++) s.items.push(freeItem(s));
    return s;
  }
  function freeItem(s) {
    const r = (a, b) => a + Math.random() * (b - a);
    const k = Math.random() < 0.55 ? 'star' : Math.random() < 0.6 ? 'guest' : 'fruit';
    const cols = [K.C.pink, K.C.blue, K.C.green, K.C.orange, K.C.purple, K.C.red];
    let x = 0, y = 0;
    for (let i = 0; i < 30; i++) {
      x = r(120, 1200); y = r(150, 660);
      const far = !s.items.some(o => Math.hypot(o.x - x, o.y - y) < 120);
      if (far) break;
    }
    return { k, x, y, col: cols[(Math.random() * cols.length) | 0], f: (Math.random() * 3) | 0, taken: false, ph: Math.random() * 6 };
  }
  function startFree() {
    stageNo = -1; st = randomFreeStage();
    pts = []; sm = null; done = false; trainS = 0; runV = 0;
    items = st.items.map(o => ({ ...o }));
    flyers = []; got = { star: 0, guest: 0, fruit: 0 }; total = { star: 0, guest: 0, fruit: 0 };
    saidB = false; saidT = false; banner = null; pulse = null; wasIn = 'g';
    mode = 'idle'; modeT = 0; idleT = 0; showDemo = false;
    say(st.intro);
    K.scene = scene;
  }
  const isFree = () => !!(st && st.free);
  function erase() {
    pts = []; sm = null; done = false; trainS = 0; runV = 0;
    items.forEach(it => it.taken = false); got = { star: 0, guest: 0, fruit: 0 }; flyers = [];
    mode = 'idle'; modeT = 0; idleT = 0; banner = null; pulse = null; wasIn = 'g'; railSaid = false;
    say('けしたよ。えきから もういちど かいてね');
  }

  // ---------- 入力 ----------
  K.handlers.down = p => {
    if (K.scene !== scene) return;
    if (mode === 'arrived') return;
    if (mode === 'running' && !isFree()) return;   // じゆうモードは はしっていても かきたせる
    showDemo = false;
    const from = endPt();
    const near = Math.hypot(p.x - from.x, p.y - from.y) < (pts.length ? 110 : 120);
    if (done) { hint(); return; }
    if (!near) { hint(); return; }
    if (!pts.length) pts.push({ x: st.start.x, y: st.start.y, k: 'g' });
    sm = { x: from.x, y: from.y };
    mode = 'drawing'; modeT = 0; pulse = null;
    K.sfx.pop();
    addRaw(p);
  };
  K.handlers.move = p => { if (K.scene === scene && mode === 'drawing') addRaw(p); };
  K.handlers.up = () => {
    if (K.scene !== scene || mode !== 'drawing') return;
    if (trackLen() < 24 && trainS === 0) { pts = []; mode = 'idle'; hint(); return; }
    if (runEnd() - trainS < 10) { mode = 'idle'; return; }
    mode = 'running'; runT = 0; K.sfx.whistle();
  };
  function hint() {
    const from = endPt();
    pulse = { x: from.x, y: from.y, t: 0 };
    if (tm - lastHint > 3) {
      lastHint = tm;
      if (done) say('でんしゃが はしるのを みててね');
      else say(pts.length ? 'せんろの さきっぽから つづきを かいてね' : 'ひかっている えきから なぞってね');
    }
  }
  function addRaw(p) {
    if (done) return;
    const x = Math.max(30, Math.min(W - 30, p.x)), y = Math.max(110, Math.min(H - 25, p.y));
    sm.x += (x - sm.x) * 0.45; sm.y += (y - sm.y) * 0.45;
    let last = pts[pts.length - 1];
    let guard = 0;
    while (Math.hypot(sm.x - last.x, sm.y - last.y) >= STEP && guard++ < 60 && pts.length < 2500) {
      const a = Math.atan2(sm.y - last.y, sm.x - last.x);
      const nx = last.x + Math.cos(a) * STEP, ny = last.y + Math.sin(a) * STEP;
      const k = kindAt(nx, ny);
      if (k !== last.k) onKindChange(last.k, k, nx, ny);
      last = { x: nx, y: ny, k };
      pts.push(last);
      // じゆうモードは、でんしゃが とおりすぎた うしろの せんろを 片づけて かるくする
      if (isFree() && pts.length > 1400) {
        const cut = pts.length - 1400;
        if (cut * STEP < trainS - 300) { pts.splice(0, cut); trainS -= cut * STEP; }
      }
      if (pts.length % 6 === 0) K.tone(500 + Math.random() * 120, 0, 0.03, 'triangle', 0.05);
      if (Math.hypot(nx - st.goal.x, ny - st.goal.y) < 70) { snapGoal(); return; }
      // レールは かぎりが ある（どこを とおるか かんがえる）
      if (!isFree() && trackLen() >= railMax()) { railOut(); return; }
    }
  }
  // つかえる レールの ながさ（えきから ゴールまでの まっすぐの 2.2ばい）
  function railMax() {
    if (!st || isFree()) return 1e9;
    if (st._rail == null) st._rail = Math.round(Math.hypot(st.goal.x - st.start.x, st.goal.y - st.start.y) * 2.2);
    return st._rail;
  }
  function railLeft() { return Math.max(0, railMax() - trackLen()); }
  function railOut() {
    if (railSaid) return;
    railSaid = true;
    K.sfx.oops();
    banner = { text: 'レールが なくなった', t: 0 };
    say('レールが なくなったよ。けすボタンで もういちど かけるよ');
  }
  function snapGoal() {
    let last = pts[pts.length - 1], guard = 0;
    while (Math.hypot(st.goal.x - last.x, st.goal.y - last.y) >= STEP && guard++ < 30) {
      const a = Math.atan2(st.goal.y - last.y, st.goal.x - last.x);
      last = { x: last.x + Math.cos(a) * STEP, y: last.y + Math.sin(a) * STEP, k: 'g' }; pts.push(last);
    }
    done = true; K.sfx.good(); K.sparkle(st.goal.x, st.goal.y, 18, K.C.yellow);
    // 指をはなすのを待たずに出発
    mode = 'running'; runT = 0; K.sfx.whistle();
    say('ゴールまで つながった！ しゅっぱつ！');
  }
  function onKindChange(a, b, x, y) {
    if (b === 'b') {
      K.sfx.clack(); K.bell(K.note(84), 0, 0.2, 0.15); K.sparkle(x, y, 10, '#ffffff');
      if (!saidB) { saidB = true; say('みずの うえは てっきょうに なったよ'); banner = { text: 'てっきょう！', t: 0 }; }
    } else if (b === 't') {
      K.tone(160, 0, 0.25, 'sine', 0.25, 90); K.sparkle(x, y, 10, '#c8a26b');
      if (!saidT) { saidT = true; say('やまは トンネルに なったよ'); banner = { text: 'トンネル！', t: 0 }; }
    }
  }

  // ---------- あつめる ----------
  const HUD = { star: { x: 450, y: 50 }, guest: { x: 640, y: 50 }, fruit: { x: 830, y: 50 } };
  function collect(it) {
    it.taken = true;
    flyers.push({ it, x: it.x, y: it.y, t: 0 });
    K.sparkle(it.x, it.y, 16, it.k === 'star' ? K.C.yellow : it.k === 'guest' ? K.C.pink : '#ff7a3d');
    if (it.k === 'star') K.sfx.star();
    else if (it.k === 'guest') { K.sfx.door(); K.bell(K.note(79), 0.1, 0.3); say('のせて くれて ありがとう'); }
    else { K.bell(K.note(76), 0, 0.2); K.bell(K.note(83), 0.08, 0.3); }
  }

  // ---------- 描画部品 ----------
  const FRUITS = [
    (x, y, s) => { K.circle(x, y, 20 * s, '#e8413c', '#a3231f', 3); c.fillStyle = K.C.green; c.beginPath(); c.ellipse(x + 7 * s, y - 20 * s, 9 * s, 5 * s, -0.5, 0, 7); c.fill(); K.circle(x - 7 * s, y - 6 * s, 5 * s, 'rgba(255,255,255,0.5)'); },
    (x, y, s) => { K.circle(x, y, 20 * s, K.C.orange, '#c46d00', 3); K.circle(x, y - 19 * s, 4 * s, K.C.green); K.circle(x - 7 * s, y - 6 * s, 5 * s, 'rgba(255,255,255,0.5)'); },
    (x, y, s) => { for (const [dx, dy] of [[-10, -10], [10, -10], [0, -10], [-6, 2], [6, 2], [0, 13]]) K.circle(x + dx * s, y + dy * s, 9 * s, '#8e44c9', '#5d2490', 2); K.rr(x - 2 * s, y - 28 * s, 4 * s, 10 * s, 2, '#6b4a2a'); },
  ];
  // まつ ひと（にこにこ顔は ひかえめに）
  function drawFace(x, y, s, col, hop) {
    y -= hop;
    K.circle(x, y, 28 * s, '#e8c49f', '#b08f6a', 2.5 * s);
    c.fillStyle = col; c.beginPath(); c.arc(x, y - 3 * s, 29 * s, Math.PI * 1.02, Math.PI * 1.98); c.fill();
    c.fillRect(x - 29 * s, y - 6 * s, 58 * s, 5 * s);
    c.fillStyle = '#2b2b2b';
    c.fillRect(x - 11 * s, y + 1 * s, 5 * s, 5 * s); c.fillRect(x + 6 * s, y + 1 * s, 5 * s, 5 * s);
  }
  function drawItem(it, x, y, s, t) {
    if (it.k === 'star') K.star(x, y + Math.sin(t * 3 + it.ph) * 3, 26 * s, K.C.yellow);
    else if (it.k === 'guest') {
      if (s >= 1) { K.rr(x - 44, y + 18, 88, 22, 8, '#c9ced8', K.C.sub, 3); }
      drawFace(x, y, s, it.col, s >= 1 ? Math.abs(Math.sin(t * 4 + it.ph)) * 6 : 0);
    } else FRUITS[it.f](x, y + Math.sin(t * 2.5 + it.ph) * 2, s);
  }
  function drawField(t) {
    c.fillStyle = '#7aa55f'; c.fillRect(0, 0, W, H);
    // くさの もよう
    c.fillStyle = '#6c9553';
    for (let i = 0; i < 70; i++) { const x = (i * 197) % W, y = (i * 113) % H; c.beginPath(); c.ellipse(x, y, 14, 7, 0, 0, 7); c.fill(); }
    // 花
    for (let i = 0; i < 26; i++) { const x = (i * 271 + 50) % W, y = (i * 157 + 130) % (H - 120) + 110; if (inWater(x, y) || inMountain(x, y)) continue; K.circle(x, y, 5, i % 2 ? '#fff' : '#ffe066'); }
    // みず
    for (const w of st.water) {
      if (w.type === 'ellipse') {
        c.fillStyle = '#4a86ad'; c.beginPath(); c.ellipse(w.x, w.y, w.rx + 8, w.ry + 8, 0, 0, 7); c.fill();
        c.fillStyle = '#6fa6c8'; c.beginPath(); c.ellipse(w.x, w.y, w.rx, w.ry, 0, 0, 7); c.fill();
      } else {
        c.lineCap = 'round'; c.lineJoin = 'round';
        for (const [lw, col] of [[w.w + 16, '#4a86ad'], [w.w, '#6fa6c8']]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); w.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
      }
    }
    // みずの きらきら（なみ）
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 3; c.lineCap = 'round';
    for (let i = 0; i < 40; i++) {
      const x = (i * 131 + t * 12) % W, y = (i * 89) % H;
      if (!inWater(x, y) || !inWater(x + 20, y)) continue;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 10, y - 5, x + 20, y); c.stroke();
    }
  }
  function drawMountain(m) {
    c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(m.x + 10, m.y + 14, m.rx, m.ry, 0, 0, 7); c.fill();
    const layers = ['#4f8a3c', '#62a14a', '#79b85a', '#a08560'];
    layers.forEach((col, i) => { const k = 1 - i * 0.22; c.fillStyle = col; c.beginPath(); c.ellipse(m.x - i * 6, m.y - i * 10, m.rx * k, m.ry * k, 0, 0, 7); c.fill(); });
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(m.x - 24, m.y - 36, m.rx * 0.2, m.ry * 0.18, 0, 0, 7); c.fill();
  }
  function strokeRun(pred, lw, col, off) {
    c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); let on = false;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      let x = p.x, y = p.y;
      if (off) { const q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)], a = Math.atan2(q.y - o.y, q.x - o.x); x += -Math.sin(a) * off; y += Math.cos(a) * off; }
      if (pred(p)) { if (!on) { c.moveTo(x, y); on = true; } else c.lineTo(x, y); } else on = false;
    }
    c.stroke();
  }
  function drawTrack() {
    if (pts.length < 2) return;
    const isB = p => p.k === 'b', all = () => true;
    // てっきょう
    strokeRun(isB, 58, '#7a4f2a');
    strokeRun(isB, 48, '#c99a5b');
    for (let i = 0; i < pts.length; i += 5) {
      if (pts[i].k !== 'b') continue;
      const q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)], a = Math.atan2(q.y - o.y, q.x - o.x);
      for (const sd of [-1, 1]) K.circle(pts[i].x - Math.sin(a) * 27 * sd, pts[i].y + Math.cos(a) * 27 * sd, 5, '#5a3a1e');
    }
    strokeRun(isB, 4, '#5a3a1e', 27); strokeRun(isB, 4, '#5a3a1e', -27);
    // じゃり
    strokeRun(p => p.k !== 'b', 36, 'rgba(160,140,110,0.75)');
    // まくらぎ
    c.strokeStyle = '#7a5532'; c.lineWidth = 7; c.lineCap = 'butt';
    for (let i = 1; i < pts.length - 1; i += 2) {
      const a = Math.atan2(pts[i + 1].y - pts[i - 1].y, pts[i + 1].x - pts[i - 1].x), nx = -Math.sin(a) * 17, ny = Math.cos(a) * 17;
      c.beginPath(); c.moveTo(pts[i].x - nx, pts[i].y - ny); c.lineTo(pts[i].x + nx, pts[i].y + ny); c.stroke();
    }
    // レール
    for (const off of [-10, 10]) { strokeRun(all, 5, '#5f6672', off); strokeRun(all, 1.8, '#e5e7eb', off); }
  }
  function drawTunnelParts(t) {
    if (pts.length < 2) return;
    // やまの したの せんろ（うすく てんてん）
    c.save(); c.setLineDash([10, 12]); c.lineDashOffset = -t * 30;
    strokeRun(p => p.k === 't', 6, 'rgba(255,255,255,0.65)');
    c.restore();
    // トンネルの いりぐち
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      if ((a.k === 't') === (b.k === 't')) continue;
      const out = b.k === 't' ? a : b, inn = b.k === 't' ? b : a;
      const ang = Math.atan2(inn.y - out.y, inn.x - out.x);
      c.save(); c.translate(out.x, out.y); c.rotate(ang);
      c.fillStyle = '#8a8f99'; c.beginPath(); c.ellipse(4, 0, 14, 34, 0, 0, 7); c.fill();
      c.fillStyle = '#2a2a33'; c.beginPath(); c.ellipse(6, 0, 9, 25, 0, 0, 7); c.fill();
      c.restore();
    }
  }
  function drawStation(p, label, isGoal, t) {
    K.rr(p.x - 60, p.y - 44, 120, 88, 16, '#d9dde5', K.C.sub, 4);
  }
  function drawRoof(p, label, isGoal, t) {
    K.rr(p.x - 66, p.y - 74, 132, 30, 12, isGoal ? K.C.red : K.C.blue, K.shade(isGoal ? K.C.red : K.C.blue, -0.3), 3);
    K.text(label, p.x, p.y - 60, 30, '#fff', 'center', 'rgba(0,0,0,0.3)');
    if (isGoal) {
      // はた
      const fx = p.x + 52, fy = p.y + 10;
      c.fillStyle = K.C.sub; c.fillRect(fx, fy - 70, 5, 70);
      for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) { c.fillStyle = (r + q) % 2 ? '#222' : '#fff'; c.fillRect(fx + 5 + q * 10, fy - 70 + r * 10 + Math.sin(t * 5 + q) * 2, 10, 10); }
    }
  }
  function drawCar(x, y, a, col) {
    c.save(); c.translate(x, y); c.rotate(a);
    K.rr(-28 + 4, -21 + 6, 56, 42, 12, 'rgba(0,0,0,0.18)');
    K.rr(-28, -21, 56, 42, 12, col, K.shade(col, -0.4), 4);
    c.fillStyle = K.C.yellow; c.fillRect(-24, -4, 48, 8);
    K.rr(-20, -14, 12, 8, 3, '#cfefff'); K.rr(4, -14, 12, 8, 3, '#cfefff');
    c.restore();
  }
  function guestCount() { return items.filter(o => o.taken && o.k === 'guest').length; }
  function drawTrain() {
    const col = K.C.red;
    // おきゃくさんを のせるほど でんしゃが ながくなる（さいだい 5りょう）
    const ncar = Math.min(5, 2 + guestCount());
    for (let i = ncar - 1; i >= 0; i--) { const q = posAt(trainS - 66 - i * 64); drawCar(q.x, q.y, q.a, col); }
    const h = posAt(trainS);
    K.trainTop(h.x + Math.cos(h.a) * 30, h.y + Math.sin(h.a) * 30, h.a, { color: col, stripe: K.C.yellow, scale: 0.8 });
    // のっている おきゃくさん（まどに かお）
    let n = 0;
    for (const it of items) if (it.taken && it.k === 'guest') {
      const q = posAt(trainS - 66 - Math.min(ncar - 1, n >> 1) * 64);
      const off = (n % 2) ? 11 : -11;
      K.circle(q.x + Math.cos(q.a) * off, q.y + Math.sin(q.a) * off, 9, '#ffd9b8', it.col, 3); n++;
    }
  }
  function drawHand(x, y, press) {
    c.save(); c.translate(x, y); c.globalAlpha = 0.95;
    const s = press ? 0.9 : 1;
    c.scale(s, s);
    K.rr(-6, 0, 22, 56, 11, '#fff', K.C.sub, 3);       // ゆび
    K.rr(-14, 34, 54, 54, 20, '#fff', K.C.sub, 3);     // て
    K.rr(14, 30, 18, 30, 9, '#fff', K.C.sub, 3);
    K.circle(5, 4, 8, 'rgba(255,170,170,0.6)');
    c.restore();
  }
  function demoPos(u) {
    const d = st.demo, seg = d.length - 1, f = Math.min(seg - 0.001, u * seg), i = Math.floor(f), k = f - i;
    // なめらか（カトマル・ロム）
    const p0 = d[Math.max(0, i - 1)], p1 = d[i], p2 = d[i + 1], p3 = d[Math.min(seg, i + 2)];
    const cr = (a, b, cc, dd) => 0.5 * ((2 * b) + (-a + cc) * k + (2 * a - 5 * b + 4 * cc - dd) * k * k + (-a + 3 * b - 3 * cc + dd) * k * k * k);
    return { x: cr(p0[0], p1[0], p2[0], p3[0]), y: cr(p0[1], p1[1], p2[1], p3[1]) };
  }
  function drawHUD() {
    K.panel(350, 10, 580, 80);
    K.star(HUD.star.x - 30, 51, 20, K.C.yellow); K.text('' + got.star, HUD.star.x + 18, 53, 36, '#e6ecf5', 'center', null);
    drawFace(HUD.guest.x - 30, 51, 0.55, K.C.pink, 0); K.text('' + got.guest, HUD.guest.x + 18, 53, 36, '#e6ecf5', 'center', null);
    FRUITS[0](HUD.fruit.x - 30, 53, 0.85); K.text('' + got.fruit, HUD.fruit.x + 18, 53, 36, '#e6ecf5', 'center', null);
    K.panel(150, 10, 184, 80);
    K.lcd(160, 20, 164, 28, isFree() ? 'じゆう' : 'ステージ ' + (stageNo + 1), '#9ad7a0', 22);
    // のこりの レール（どこを とおるか かんがえる）
    if (!isFree()) {
      const r = railLeft() / railMax();
      // ちいさな せんろの えで「レールの のこり」を しめす
      c.fillStyle = '#8fa3c0'; c.fillRect(162, 60, 18, 3); c.fillRect(162, 70, 18, 3);
      for (let q = 0; q < 3; q++) c.fillRect(163 + q * 6, 58, 3, 17);
      K.rr(188, 56, 136, 22, 6, '#121a28', '#3d4a63', 2);
      K.rr(190, 58, 132 * Math.max(0, r), 18, 5, r > 0.35 ? '#9ad7a0' : r > 0.12 ? '#ffb454' : '#ff6b5e');
    } else K.lcd(160, 56, 164, 24, 'レール むせいげん', '#8fa3c0', 17);
  }

  // ---------- メイン画面 ----------
  const scene = {
    update(dt, t) {
      tm = t; modeT += dt;
      if (mode === 'idle') {
        idleT += dt;
        if (idleT > 9 && !showDemo) { idleT = 0; hint(); }
      } else idleT = 0;
      if (showDemo) demoT += dt;
      if (pulse) pulse.t += dt;
      if (banner) { banner.t += dt; if (banner.t > 1.8) banner = null; }
      if (mode === 'arrived') arrT += dt;
      if (mode === 'running' || (isFree() && mode === 'drawing' && trainS < runEnd())) {
        runT += dt;
        const L = runEnd(), left = L - trainS;
        const target = 250 * Math.max(0.3, Math.min(1, left / 140));
        runV += (target - runV) * Math.min(1, dt * 3);
        trainS = Math.min(L, trainS + runV * dt);
        const k = kindAtS(trainS);
        K.runSound(dt, runV / 90);
        if (k === 'b' && Math.random() < dt * 4) K.tone(700, 0, 0.04, 'triangle', 0.04);
        if (k !== wasIn) {
          if (k === 't') K.sfx.horn();
          if (wasIn === 't') { const h = posAt(trainS); K.sparkle(h.x, h.y, 12, '#ffffff'); K.bell(K.note(88), 0, 0.25, 0.15); }
          wasIn = k;
        }
        const h = posAt(trainS + 30);
        for (const it of items) if (!it.taken && Math.hypot(it.x - h.x, it.y - h.y) < 62) collect(it);
        if (trainS >= L - 0.5) {
          runV = 0;
          if (done) { arrive(); }
          else if (mode === 'running') { mode = 'idle'; modeT = 0; pulse = { x: endPt().x, y: endPt().y, t: 0 }; K.sfx.door(); say('せんろが おわったよ。さきっぽから つづきを かいてね'); }
        }
      }
      for (let i = flyers.length - 1; i >= 0; i--) {
        const f = flyers[i]; f.t += dt;
        if (f.t >= 0.7) {
          got[f.it.k]++; K.sfx.pop(); flyers.splice(i, 1);
          if (isFree()) items.push(freeItem(st));   // とった ぶん また わいてくる
        }
      }
    },
    draw(t) {
      drawField(t);
      drawStation(st.start, 'えき', false, t);
      if (!isFree()) drawStation(st.goal, 'ゴール', true, t);
      drawTrack();
      for (const it of items) if (!it.taken) drawItem(it, it.x, it.y, 1, t);
      drawTrain();
      for (const m of st.mountains) drawMountain(m);
      drawTunnelParts(t);
      drawRoof(st.start, 'えき', false, t);
      if (!isFree()) drawRoof(st.goal, 'ゴール', true, t);
      // ここから かいてね
      if (mode === 'idle' && !done) {
        const p = endPt(), r = 46 + Math.sin(t * 5) * 8;
        c.save(); c.globalAlpha = 0.85; K.circle(p.x, p.y, r, null, '#ffffff', 7); K.circle(p.x, p.y, r + 12, null, 'rgba(255,210,63,0.9)', 5); c.restore();
        if (pulse && pulse.t < 2.5 && !showDemo) drawHand(p.x + 6 + Math.sin(pulse.t * 8) * 6, p.y + 6, false);
      }
      // おてほん
      if (showDemo) {
        const cyc = 4.2, u = (demoT % cyc) / 3.2;
        c.save(); c.setLineDash([4, 16]); c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 10;
        c.beginPath(); const end = Math.min(1, u);
        for (let k = 0; k <= 60 * end; k++) { const q = demoPos(k / 60); k ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y); }
        c.stroke(); c.restore();
        const q = demoPos(Math.min(1, u));
        drawHand(q.x, q.y, u < 1);
      }
      // ながれる あつめもの
      for (const f of flyers) {
        const k = Math.min(1, f.t / 0.7), e = 1 - Math.pow(1 - k, 3), to = HUD[f.it.k];
        const x = f.x + (to.x - 30 - f.x) * e, y = f.y + (51 - f.y) * e - Math.sin(k * Math.PI) * 120;
        drawItem(f.it, x, y, 1 - k * 0.4, t);
      }
      drawHUD();
      if (banner) {
        const k = Math.min(1, banner.t * 5), sc = 0.6 + 0.4 * k;
        c.save(); c.translate(W / 2, 170); c.scale(sc, sc); c.globalAlpha = banner.t > 1.4 ? (1.8 - banner.t) / 0.4 : 1;
        K.text(banner.text, 0, 0, 64, K.C.orange, 'center', '#fff'); c.restore();
      }
      K.homeButton();
      if (mode !== 'arrived') K.button(W - 176, 12, 160, 90, 'けす', K.C.orange, erase, { size: 40 });
      // じゆうモードは いつでも おしまいに できる（5こ あつめたら ごほうび）
      if (isFree() && mode !== 'arrived') {
        const n = got.star + got.guest + got.fruit;
        if (n >= 5) K.button(W - 176, 116, 160, 90, 'おしまい', K.C.green, freeFinish, { size: 32 });
      }
      if (mode === 'arrived') drawArrived(t);
    }
  };

  function freeFinish() {
    mode = 'arrived';
    K.reward(GAME, 'たくさん あつめたね', startFree);
    const rs = K.scene;   // ごほうびの うしろに のはらを みせる
    K.scene = { update: rs.update, draw(t, dt) { drawField(t); drawTrack(); drawTrain(); for (const m of st.mountains) drawMountain(m); rs.draw(t, dt); } };
  }

  // ---------- とうちゃく ----------
  let arrT = 0;
  // あつめた かずで ほし 1〜3つ（0こは ない＝がんばりを みとめる）
  function medals() {
    const r = items.length ? items.filter(o => o.taken).length / items.length : 0;
    return r > 0.99 ? 3 : r >= 0.5 ? 2 : 1;
  }
  function arrive() {
    mode = 'arrived'; arrT = 0;
    K.sfx.dingdong(); setTimeout(() => K.sfx.fanfare(), 900);
    K.confetti(60);
    total.star += items.filter(o => o.taken && o.k === 'star').length;
    total.guest += guestCount();
    total.fruit += items.filter(o => o.taken && o.k === 'fruit').length;
    const n = items.filter(o => o.taken && o.k === 'star').length;
    if (medals() === 3) say('ぜんぶ あつめたね！ すごい！');
    else say('ゴールに とうちゃく！ ほしを ' + n + 'こ あつめたよ');
  }
  function drawArrived(t) {
    if (arrT < 1.4) return;
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(0, 0, W, H);
    K.rr(210, 104, 860, 356, 40, '#fff', K.C.red, 8);
    K.text('とうちゃく！', W / 2, 168, 72, K.C.red, 'center', '#fff');
    // ほし 1〜3つの ひょうか
    const md = medals();
    for (let i = 0; i < 3; i++) {
      const on = i < md, sc = on ? 1 + Math.sin(t * 5 + i) * 0.04 : 1;
      K.star(W / 2 - 130 + i * 130, 262, 50 * sc, on ? K.C.yellow : '#e3e5ea');
    }
    if (md === 3) K.text('ぜんぶ あつめた！', W / 2, 336, 38, K.C.orange, 'center', '#fff');
    const ns = items.filter(o => o.taken && o.k === 'star').length, ng = guestCount(), nf = items.filter(o => o.taken && o.k === 'fruit').length;
    K.star(440, 410, 28, K.C.yellow); K.text('' + ns, 498, 412, 44, K.C.sub, 'center', null);
    drawFace(620, 410, 0.7, K.C.pink, 0); K.text('' + ng, 678, 412, 44, K.C.sub, 'center', null);
    FRUITS[0](800, 412, 1.0); K.text('' + nf, 858, 412, 44, K.C.sub, 'center', null);
    const last = stageNo === STAGES.length - 1;
    K.text(`ぜんぶで ほし ${total.star}こ・おきゃくさん ${total.guest}にん`, W / 2, 486, 32, '#35684a', 'center', '#fff');
    if (last) K.button(W / 2 - 200, 530, 400, 110, 'ごほうび', COLOR, toReward);
    else if (stageNo >= 1) {
      // 2ステージめから あとは、つづけても おしまいに しても いい
      K.button(170, 530, 380, 110, 'ごほうび', K.C.yellow, toReward, { size: 44 });
      K.button(730, 530, 380, 110, 'つぎへ', COLOR, () => startStage(stageNo + 1), { size: 44 });
    }
    else K.button(W / 2 - 200, 530, 400, 110, 'つぎへ', COLOR, () => startStage(stageNo + 1));
  }
  function toReward() {
    K.reward(GAME, 'せんろ かきの めいじんだね', () => startStage(0));
    const rs = K.scene;   // ごほうびの うしろに のはらを みせる
    K.scene = { update: rs.update, draw(t, dt) { drawField(t); drawTrack(); drawTrain(); for (const m of st.mountains) drawMountain(m); rs.draw(t, dt); } };
  }

  // ---------- タイトル（2つの あそびかた） ----------
  function toTitle() {
    K.scene = {
      update() {},
      draw(t) {
        K.skyBg(t);
        K.rr(150, 104, 980, 240, 20, 'rgba(255,255,255,0.93)', K.C.panelEdge, 3);
        c.fillStyle = COLOR; c.fillRect(150, 104, 980, 8);
        K.text('せんろ おえかき', W / 2, 190, 78, COLOR, 'center', null);
        K.text('ゆびで せんろを かくと でんしゃが はしるよ', W / 2, 286, 32, K.C.sub, 'center', null);
        K.trainSide(W / 2 + 340 + ((t * 120) % 1600) - 800, 640, { color: COLOR, cars: 3, scale: 0.9, bob: Math.sin(t * 20) * 1.2 });
        K.railBed(660);
        K.button(170, 394, 430, 104, 'ステージ', COLOR, () => startStage(0), { size: 44 });
        K.button(680, 394, 430, 104, 'じゆうに かく', K.C.orange, startFree, { size: 40 });
        K.homeButton();
      }
    };
  }
  toTitle();
})();
