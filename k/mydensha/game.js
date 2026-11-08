// ぼくの でんしゃ — くみたてて、めいれいを おいて、はしらせる
// ・へやの ゆかに ひろがる おもちゃの レイアウト（コースは できあがっている）
// ・ポイントは タップで むきを かえる／めいれいの ふだを せんろに おく（プログラム）
// ・はしっている あいだは レバーで じぶんでも うんてんできる
(function () {
  'use strict';
  const W = K.W, H = K.H, c = K.ctx, T = window.TRACK;
  const TILE = T.TILE, OX = 68, OY = 56;          // ばんめんの ひだりうえ
  const GAME = 'ぼくの でんしゃ';
  const sx = x => OX + x * TILE + TILE / 2;        // マス → がめんの 中心
  const sy = y => OY + y * TILE + TILE / 2;

  // ---------- ステージ ----------
  const STAGES = [
    {
      name: 'ぱんだえきへ いこう',
      hint: 'ポイントを タップして、ぱんだえきへ いく みちを つくろう',
      main: { path: ring(1, 1, 11, 4), closed: true },
      branches: [{ from: [6, 4], path: [[6, 5], [7, 5], [8, 5], [9, 5]] }],
      marks: [
        { x: 2, y: 1, type: 'garage', out: 0 },
        { x: 9, y: 5, type: 'station', name: 'ぱんだえき', animal: 'panda', col: '#3f8f66' },
      ],
      goal: { station: 'ぱんだえき' },
      cards: [],
    },
    {
      name: 'おきゃくさんを のせよう',
      hint: 'くまえきで とまる ふだを おいて、よにん のせて ぱんだえきへ いこう',
      main: { path: ring(1, 1, 11, 4), closed: true },
      branches: [{ from: [6, 4], path: [[6, 5], [7, 5], [8, 5], [9, 5]] }],
      marks: [
        { x: 2, y: 1, type: 'garage', out: 0 },
        { x: 8, y: 1, type: 'station', name: 'くまえき', animal: 'kuma', col: '#a8763f', wait: 4 },
        { x: 9, y: 5, type: 'station', name: 'ぱんだえき', animal: 'panda', col: '#3f8f66' },
      ],
      goal: { station: 'ぱんだえき', deliver: 4 },
      cards: ['stop'],
    },
    {
      name: 'ふたつの えきを まわろう',
      hint: 'うさぎえきと くまえきで のせて、ぱんだえきへ とどけよう',
      main: { path: ring(1, 1, 11, 4), closed: true },
      branches: [
        { from: [6, 4], path: [[6, 5], [7, 5], [8, 5], [9, 5]] },
        { from: [4, 1], path: [[4, 0], [5, 0], [6, 0]] },
      ],
      marks: [
        { x: 2, y: 1, type: 'garage', out: 0 },
        { x: 6, y: 0, type: 'station', name: 'うさぎえき', animal: 'usagi', col: '#c86a8e', wait: 3 },
        { x: 3, y: 4, type: 'station', name: 'くまえき', animal: 'kuma', col: '#a8763f', wait: 3 },
        { x: 9, y: 5, type: 'station', name: 'ぱんだえき', animal: 'panda', col: '#3f8f66' },
      ],
      goal: { station: 'ぱんだえき', deliver: 6 },
      cards: ['stop', 'slow'],
    },
  ];
  // しかくい わっか（ひだりうえ x1,y1 から みぎした x2,y2）
  function ring(x1, y1, x2, y2) {
    const p = [];
    for (let x = x1; x <= x2; x++) p.push([x, y1]);
    for (let y = y1 + 1; y <= y2; y++) p.push([x2, y]);
    for (let x = x2 - 1; x >= x1; x--) p.push([x, y2]);
    for (let y = y2 - 1; y > y1; y--) p.push([x1, y]);
    return p;
  }

  // ---------- じょうたい ----------
  let st = null;        // いまの ステージ
  let cells = null;     // Map: 'x,y' → セル
  let tr = null;        // でんしゃ
  let mode = 'plan';    // plan（ならべる）/ run（はしる）/ clear
  let msg = '', msgT = 0;
  let trackCv = null;   // せんろの え（1かいだけ えがく）

  // くみたて（ミニ四駆の セッティングの ように、はしりに ひびく）
  const BUILD = { cars: 2, motor: 0, color: { head: '#c9453a', car: '#c9453a' } };
  const MOTORS = [{ name: 'ふつう', v: 150 }, { name: 'はやい', v: 215 }];

  function say(s, keep) { K.say(s); msg = s; msgT = keep || 4; }

  // ---------- ステージを はじめる ----------
  function startStage(i) {
    st = STAGES[i];
    cells = T.build(st.main.path, st.branches, st.marks);
    if (st.main.closed) {
      const a = st.main.path[0], b = st.main.path[st.main.path.length - 1];
      link(a, b);
    }
    // ポイントの はじめの むき（まっすぐ）
    for (const cell of cells.values()) { if (cell.wait != null) cell.wait0 = cell.wait; }
    for (const cell of cells.values()) if (cell.type === 'switch') { cell.branchOn = false; if (cell.branch == null) T.splitSwitch(cell); }
    resetTrain();
    mode = 'plan';
    trackCv = null;
    say(st.hint);
    K.scene = scene;
  }
  function link(a, b) {
    const ca = cells.get(T.key(a[0], a[1])), cb = cells.get(T.key(b[0], b[1]));
    if (!ca || !cb) return;
    const dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]);
    for (let d = 0; d < 4; d++) {
      if (T.DX[d] === dx && T.DY[d] === dy) {
        if (!ca.dirs.includes(d)) ca.dirs.push(d);
        if (!cb.dirs.includes(T.opp(d))) cb.dirs.push(T.opp(d));
      }
    }
    if (ca.dirs.length >= 3) { if (ca.type === 'rail') ca.type = 'switch'; T.splitSwitch(ca); }
    if (cb.dirs.length >= 3) { if (cb.type === 'rail') cb.type = 'switch'; T.splitSwitch(cb); }
  }
  function garage() { for (const cell of cells.values()) if (cell.type === 'garage') return cell; return null; }

  function resetTrain() {
    const g = garage();
    const start = g || cells.values().next().value;
    // しゃこから でる むき（ステージで きめる。なければ さいしょの へり）
    const out = start.out != null && start.dirs.includes(start.out) ? start.out : start.dirs[0];
    tr = { cx: start.x, cy: start.y, eIn: T.opp(out), eOut: out, u: 0.5, v: 0, want: 1, stopT: 0, riders: 0, time: 0, toldNeed: false, done: false, visited: {}, trail: [] };
    tr.path = T.pathIn(tr.eIn, tr.eOut);
    // はじめは うしろむきに ならべる（でる むきの はんたいがわに しゃりょうを おく）
    const h0 = T.at(tr.path, tr.u), back = T.opp(out);
    for (let i = 0; i < 120; i++) {
      tr.trail.push({
        x: sx(tr.cx) + h0.x + T.DX[back] * i * TRAIL_STEP,
        y: sy(tr.cy) + h0.y + T.DY[back] * i * TRAIL_STEP,
        ang: h0.ang,
      });
    }
  }

  // ---------- はしる ----------
  function exitsOf(cell, eIn) { return cell.dirs.filter(d => d !== eIn); }
  function chooseExit(cell, eIn) {
    const outs = exitsOf(cell, eIn);
    if (outs.length === 0) return null;
    if (outs.length === 1) return outs[0];
    const straight = T.opp(eIn);
    // ポイントが「わかれみち」に なっていれば そちらへ
    if (cell.branchOn && cell.branch != null && cell.branch !== eIn && outs.includes(cell.branch)) return cell.branch;
    return outs.includes(straight) ? straight : outs[0];
  }
  function step(dt) {
    tr.time += dt;
    // ふだで とまった あとは、じどうで また はしりだす
    if (tr.stopT > 0) {
      tr.stopT -= dt; tr.v *= 0.82;
      if (tr.stopT <= 0 && tr.want === 0) { tr.want = 1; K.sfx.whistle(); }
      return;
    }
    const target = MOTORS[BUILD.motor].v * tr.want * (1 - (BUILD.cars - 2) * 0.06);
    tr.v += (target - tr.v) * Math.min(1, dt * 2.2);
    if (tr.v < 1 && tr.want === 0) tr.v = 0;
    tr.u += (tr.v * dt) / tr.path.len;
    while (tr.u >= 1) {
      tr.u -= 1;
      const nx = tr.cx + T.DX[tr.eOut], ny = tr.cy + T.DY[tr.eOut];
      const next = cells.get(T.key(nx, ny));
      if (!next) { tr.u = 1; tr.v = 0; tr.want = 0; return; }
      const eIn = T.opp(tr.eOut);
      const eOut = chooseExit(next, eIn);
      tr.cx = nx; tr.cy = ny; tr.eIn = eIn;
      if (eOut == null) {
        // いきどまり → まんなかで とまって おりかえす（でんしゃらしい うごき）
        tr.eOut = eIn; tr.path = T.pathIn(eIn, eIn); tr.u = 0.5; tr.v = 0;
        tr.stopT = Math.max(tr.stopT, 2.0); tr.want = 0;
        enterCell(next);
        if (!next.type || next.type !== 'station') say('いきどまり。ここで おりかえすよ');
        return;
      }
      tr.eOut = eOut;
      tr.path = T.pathIn(eIn, eOut);
      enterCell(next);
    }
  }
  function capacity() { return BUILD.cars * 2; }   // 1りょうに 2にん
  function enterCell(cell) {
    tr.visited[T.key(cell.x, cell.y)] = true;
    if (cell.card === 'stop' && tr.time - (cell.usedAt == null ? -99 : cell.usedAt) > 8) { cell.usedAt = tr.time; tr.stopT = 2.4; tr.want = 0; K.sfx.door(); }
    if (cell.card === 'slow') tr.want = 0.5;
    if (cell.card === 'fast') tr.want = 1.4;
    if (cell.type === 'station') reachStation(cell);
  }
  function reachStation(cell) {
    if (mode !== 'run') return;
    const stopping = tr.stopT > 0.2;
    // おきゃくさんは「とまる」ふだを おいた ときだけ のれる
    if (stopping && cell.wait > 0) {
      const room = capacity() - tr.riders;
      const n = Math.min(room, cell.wait);
      if (n > 0) {
        cell.wait -= n; tr.riders += n;
        K.sfx.good(); K.sparkle(sx(cell.x), sy(cell.y) - 40, 14, '#e8c04a');
        if (cell.wait > 0) say('まだ まってる ひとが いるよ。もっと ながく つなごう');
        else say('のったよ！');
      } else if (room <= 0) {
        say('いっぱいだ。くみたてで ながく しよう');
      }
    }
    if (st.goal.station && cell.name === st.goal.station) {
      const need = st.goal.deliver || 0;
      if (tr.riders >= need) {
        tr.stopT = Math.max(tr.stopT, 2.0); tr.want = 0;
        setTimeout(() => { if (mode === 'run') clearStage(); }, 700);
      } else if (need > 0 && !tr.toldNeed) {
        tr.toldNeed = true;
        say('あと すこし のせてから こよう');
      }
    }
  }
  function clearStage() {
    mode = 'clear';
    K.sfx.fanfare(); K.confetti(60);
    say(st.goal.deliver ? 'ぜんいん とどけられた！' : 'ぱんだえきに とうちゃく！');
  }

  function nextStage() {
    const i = STAGES.indexOf(st);
    if (i + 1 < STAGES.length) startStage(i + 1);
    else {
      K.reward(GAME, 'でんしゃの めいじんだね', () => startStage(0));
    }
  }
  function run() {
    if (mode !== 'plan') return;
    for (const cell of cells.values()) { cell.usedAt = null; if (cell.wait0 != null) cell.wait = cell.wait0; }
    resetTrain();
    mode = 'run'; tr.want = 1;
    K.sfx.whistle();
    msg = ''; msgT = 0;
  }
  function backToPlan() {
    mode = 'plan'; resetTrain(); msg = ''; msgT = 0;
  }

  // ---------- さわる ----------
  function cellAt(p) {
    const gx = Math.floor((p.x - OX) / TILE), gy = Math.floor((p.y - OY) / TILE);
    return cells.get(T.key(gx, gy));
  }
  K.handlers.down = p => {
    if (K.scene !== scene || mode !== 'plan') return;
    // したの たなから ふだを つまむ
    const cs = trayCards();
    for (let i = 0; i < cs.length; i++) {
      const r = trayRect(i);
      if (p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h) {
        drag = { type: cs[i], x: p.x, y: p.y }; K.sfx.pop(); return;
      }
    }
    const cell = cellAt(p);
    if (!cell) return;
    if (cell.card) { cell.card = null; K.sfx.oops(); return; }   // おいた ふだは タップで とる
    if (cell.type === 'switch') { cell.branchOn = !cell.branchOn; K.sfx.clack(); }
  };
  K.handlers.move = p => { if (drag) { drag.x = p.x; drag.y = p.y; } };
  K.handlers.up = p => {
    if (!drag) return;
    const cell = cellAt(p);
    if (cell && p.y < 580) { cell.card = drag.type; K.sfx.star(); }
    drag = null;
  };

  // ---------- くみたて（ミニ四駆の ような セッティング） ----------
  const COLORS = [
    { head: '#c9453a', car: '#c9453a', name: 'あか' },
    { head: '#2f6fa8', car: '#2f6fa8', name: 'あお' },
    { head: '#3f8f66', car: '#3f8f66', name: 'みどり' },
    { head: '#d79a26', car: '#d79a26', name: 'きいろ' },
  ];
  function drawBuild(t) {
    c.fillStyle = 'rgba(20,27,43,0.82)'; c.fillRect(0, 0, W, H);
    K.rr(120, 54, 1040, 612, 20, '#f2f5f9', K.C.panelEdge, 3);
    K.text('くみたて', W / 2, 100, 46, K.C.ink, 'center', null);
    // いまの へんせい（みほん）
    const bw = BUILD.cars * 76, bx = W / 2 - bw / 2 + 38, by = 182;
    for (let i = BUILD.cars - 1; i >= 0; i--) {
      const x = bx + i * 76;
      K.rr(x - 34, by - 22, 68, 44, 8, i === 0 ? BUILD.color.head : BUILD.color.car, '#2b3038', 3);
      K.rr(x - 29, by - 22, 58, 12, 5, '#6f7889');
      c.fillStyle = '#e8c04a'; c.fillRect(x - 29, by + 5, 58, 6);
      if (i === 0) { K.rr(x + 14, by - 14, 15, 15, 3, '#243246'); K.circle(x + 28, by + 13, 4, '#fff3c4'); }
      else { K.rr(x - 18, by - 12, 13, 10, 2, '#9fc3dc'); K.rr(x + 2, by - 12, 13, 10, 2, '#9fc3dc'); }
    }
    // なんりょう
    K.text('なんりょう つなぐ？', 180, 266, 26, K.C.sub, 'left', null);
    for (let i = 2; i <= 5; i++) {
      const on = BUILD.cars === i;
      K.button(180 + (i - 2) * 112, 290, 96, 68, i + 'りょう', on ? K.C.orange : '#aab4c4', () => { BUILD.cars = i; K.sfx.pop(); }, { size: 26 });
    }
    K.text('ながいほど たくさん のれる', 660, 312, 23, K.C.sub, 'left', null);
    K.text('でも すこし おそくなる', 660, 344, 23, K.C.sub, 'left', null);
    // モーター
    K.text('モーター', 180, 408, 26, K.C.sub, 'left', null);
    MOTORS.forEach((m, i) => {
      const on = BUILD.motor === i;
      K.button(180 + i * 150, 432, 132, 68, m.name, on ? K.C.orange : '#aab4c4', () => { BUILD.motor = i; K.sfx.pop(); }, { size: 28 });
    });
    K.text('はやいと きもちいい', 660, 454, 23, K.C.sub, 'left', null);
    K.text('でも ポイントの はんだんが いそがしい', 660, 486, 23, K.C.sub, 'left', null);
    // いろ
    K.text('いろ', 180, 548, 26, K.C.sub, 'left', null);
    COLORS.forEach((col, i) => {
      const x = 180 + i * 90, on = BUILD.color.head === col.head;
      K.rr(x, 570, 74, 58, 8, col.head, on ? K.C.orange : '#2b3038', on ? 5 : 2);
      const sv = c.globalAlpha; c.globalAlpha = 0;
      K.button(x, 570, 74, 58, '', '#fff', () => { BUILD.color = col; K.sfx.pop(); });
      c.globalAlpha = sv;
    });
    K.button(880, 560, 220, 80, 'できた', K.C.green, () => { mode = 'plan'; K.sfx.good(); }, { size: 38 });
  }


  // ---------- えがく ----------
  function drawFloor() {
    // へやの ゆか（木の いた）
    c.fillStyle = '#b89368'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(0,0,0,0.10)'; c.lineWidth = 2;
    for (let y = 0; y < H; y += 74) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.strokeStyle = 'rgba(0,0,0,0.07)';
    for (let i = 0; i < 26; i++) {
      const x = ((i * 213) % W), y = Math.floor(i / 4) * 74;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 74); c.stroke();
    }
    c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(0, 0, W, 180);
    // へやの もの（ラグ・つみき・ぬいぐるみ）
    c.save();
    c.fillStyle = 'rgba(180,120,130,0.30)';
    c.beginPath(); c.ellipse(640, 330, 300, 118, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 8;
    c.beginPath(); c.ellipse(640, 330, 268, 96, 0, 0, 7); c.stroke();
    c.restore();
    const blocks = [[430, 286, '#c9453a'], [470, 286, '#2f6fa8'], [450, 254, '#d79a26'],
                    [790, 352, '#3f8f66'], [830, 352, '#6b5bb5']];
    for (const [x, y, col] of blocks) {
      K.rr(x - 18, y - 18, 36, 36, 5, col, K.shade(col, -0.35), 2);
      K.rr(x - 13, y - 13, 26, 10, 3, 'rgba(255,255,255,0.22)');
    }
    // ぬいぐるみの くま
    K.circle(600, 300, 13, '#a8763f'); K.circle(628, 300, 13, '#a8763f');
    K.circle(614, 316, 24, '#b9834a', '#8a6132', 3);
    c.fillStyle = '#2b2b2b'; c.fillRect(606, 312, 4, 4); c.fillRect(618, 312, 4, 4);
    c.beginPath(); c.ellipse(614, 324, 9, 6, 0, 0, 7); c.fillStyle = '#e0c49c'; c.fill();
  }
  // せんろの え（かわらないので 1まいの えに して おく）
  function buildTrackCanvas() {
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const old = K.ctx;
    drawTrackTo(g);
    return cv;
  }
  function drawTrackTo(g) {
    for (const cell of cells.values()) {
      const paths = tilePaths(cell);
      for (const pp of paths) drawRail(g, cell, pp, true);
    }
    for (const cell of cells.values()) {
      const paths = tilePaths(cell);
      for (const pp of paths) drawRail(g, cell, pp, false);
    }
  }
  // そのマスで えがく みち（ポイントは 2ほん えがく）
  function tilePaths(cell) {
    const d = cell.dirs;
    if (d.length <= 1) return [T.pathIn(d[0], d[0])];
    const out = [];
    if (d.length === 2) out.push(T.pathIn(d[0], d[1]));
    else {
      // ポイント: ほんせんと しせん（はいる へりを 1つめと みなす）
      for (let i = 1; i < d.length; i++) out.push(T.pathIn(d[0], d[i]));
      if (d.length >= 3) out.push(T.pathIn(d[1], d[2]));
    }
    return out;
  }
  function drawRail(g, cell, p, base) {
    const cx = sx(cell.x), cy = sy(cell.y);
    const N = p.kind === 'line' ? 2 : 10;
    const pts = [];
    for (let i = 0; i <= N; i++) { const q = T.at(p, i / N); pts.push([cx + q.x, cy + q.y]); }
    g.lineCap = 'butt'; g.lineJoin = 'round';
    if (base) {
      // プラスチックの どだい
      g.strokeStyle = '#3f6ea8'; g.lineWidth = 58;
      g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke();
      g.strokeStyle = '#4e82c0'; g.lineWidth = 50;
      g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke();
      return;
    }
    // まくらぎ
    g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 5;
    for (let i = 0; i <= 6; i++) {
      const q = T.at(p, i / 6), a = q.ang + Math.PI / 2;
      g.beginPath();
      g.moveTo(cx + q.x + Math.cos(a) * 22, cy + q.y + Math.sin(a) * 22);
      g.lineTo(cx + q.x - Math.cos(a) * 22, cy + q.y - Math.sin(a) * 22);
      g.stroke();
    }
    // レール（2ほん）
    for (const off of [-17, 17]) {
      g.strokeStyle = '#c8ccd4'; g.lineWidth = 6;
      g.beginPath();
      for (let i = 0; i <= N; i++) {
        const q = T.at(p, i / N), a = q.ang + Math.PI / 2;
        const x = cx + q.x + Math.cos(a) * off, y = cy + q.y + Math.sin(a) * off;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    }
  }

  // ---------- え: えき・しゃこ・ポイント ----------
  function drawMarks(t) {
    for (const cell of cells.values()) {
      const x = sx(cell.x), y = sy(cell.y);
      if (cell.type === 'garage') {
        K.rr(x - 40, y - 46, 80, 40, 6, '#8a5a3c', '#6b452c', 3);
        c.fillStyle = '#6b452c'; c.beginPath(); c.moveTo(x - 46, y - 46); c.lineTo(x, y - 70); c.lineTo(x + 46, y - 46); c.closePath(); c.fill();
        K.text('しゃこ', x, y - 26, 18, '#f0ead8', 'center', null);
      }
      if (cell.type === 'station') {
        // うえの はしの えきは、ホームと かんばんを さかさに おく
        const up = cell.y === 0 ? -1 : 1;
        K.rr(x - 46, y + 22 * up - (up < 0 ? 18 : 0), 92, 18, 4, '#d7d2c8', '#a39d90', 2);
        const n = cell.wait || 0;
        for (let i = 0; i < Math.min(n, 4); i++) {
          K.person(x - 30 + i * 20, y + (up > 0 ? 26 : -20), { color: ['#2f6fa8', '#c9453a', '#3f8f66', '#6b5bb5'][i % 4], scale: 0.3, hop: Math.abs(Math.sin(t * 3 + i)) * 3 });
        }
        if (n > 4) K.text('+' + (n - 4), x + 54, y + 16 * up, 18, '#f0ead8', 'center', K.C.ink);
        const sgy = up > 0 ? y - 80 : y + 38;
        K.rr(x - 46, sgy, 92, 42, 5, '#f7f4ea', '#b7ac97', 3);
        c.fillStyle = cell.col; c.fillRect(x - 46, sgy + 36, 92, 6);
        K.text(cell.name.replace('えき', ''), x, sgy + 20, 22, K.C.ink, 'center', null);
      }
      if (cell.type === 'switch') drawPoint(cell, x, y, t);
    }
  }
  // ポイント: えらんでいる みちを ひからせる（どっちに いくか ひとめで わかる）
  function drawPoint(cell, x, y, t) {
    const from = cell.trunk[0];
    const to = cell.branchOn ? cell.branch : cell.trunk[1];
    const p = T.pathIn(from, to);
    c.save();
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(255,196,92,0.95)'; c.lineWidth = 12;
    c.setLineDash([14, 10]); c.lineDashOffset = -t * 36;
    c.beginPath();
    for (let i = 0; i <= 12; i++) { const q = T.at(p, i / 12); i ? c.lineTo(x + q.x, y + q.y) : c.moveTo(x + q.x, y + q.y); }
    c.stroke();
    c.setLineDash([]);
    c.restore();
    // きりかえの つまみ
    const k = T.edgePt(cell.branch);
    K.circle(x + k.x * 0.42, y + k.y * 0.42, 15, cell.branchOn ? K.C.orange : '#e9edf3', '#2b3038', 3);
    if (mode === 'plan') {
      const r = 30 + Math.sin(t * 5) * 3;
      K.circle(x, y, r, null, 'rgba(255,255,255,0.75)', 3);
    }
  }

  // ---------- え: でんしゃ ----------
  // せんとうが とおった あとを おぼえておき、うしろの しゃりょうは その上に ならべる
  const TRAIL_STEP = 4;
  function headPos() {
    const q = T.at(tr.path, Math.max(0, Math.min(1, tr.u)));
    return { x: sx(tr.cx) + q.x, y: sy(tr.cy) + q.y, ang: q.ang };
  }
  // ★ trail[0] は「さいごに きろくした ところ」。ここを まいかい うわがきすると
  //    きょりが たまらず、うしろの しゃりょうが ついてこない（2026-11-09 の ふぐあい）
  function pushTrail() {
    const h = headPos();
    const last = tr.trail[0];
    if (!last) { tr.trail.unshift(h); return; }
    const d = Math.hypot(h.x - last.x, h.y - last.y);
    if (d < TRAIL_STEP) return;
    // はやく うごいた ときも あいだを うめて、しゃりょうの かんかくを そろえる
    const n = Math.min(24, Math.floor(d / TRAIL_STEP));
    for (let i = 1; i <= n; i++) {
      const k = (i * TRAIL_STEP) / d;
      tr.trail.unshift({ x: last.x + (h.x - last.x) * k, y: last.y + (h.y - last.y) * k, ang: h.ang });
    }
    if (tr.trail.length > 500) tr.trail.length = 500;
  }
  function trainPos(back) {
    if (back <= 0) return headPos();
    const i = Math.round(back / TRAIL_STEP);
    return tr.trail[Math.min(i, tr.trail.length - 1)] || headPos();
  }
  function drawTrain(t) {
    const col = BUILD.color;
    for (let i = BUILD.cars - 1; i >= 0; i--) {
      const q = trainPos(i * 52);
      c.save(); c.translate(q.x, q.y); c.rotate(q.ang);
      const isHead = i === 0;
      K.rr(-24, -17, 48, 34, 7, 'rgba(0,0,0,0.18)');
      K.rr(-26, -19, 52, 34, 7, i === 0 ? col.head : col.car, '#2b3038', 2.5);
      K.rr(-22, -19, 44, 9, 4, '#6f7889');
      c.fillStyle = '#e8c04a'; c.fillRect(-22, 2, 44, 5);
      if (isHead) { K.rr(12, -12, 12, 12, 3, '#243246'); K.circle(22, 10, 3.5, '#fff3c4'); }
      else { K.rr(-14, -9, 10, 8, 2, '#9fc3dc'); K.rr(2, -9, 10, 8, 2, '#9fc3dc'); }
      c.restore();
    }
  }

  // ---------- がめん ----------
  const scene = {
    update(dt) {
      if (msgT > 0) msgT -= dt;
      if (mode === 'run') { step(dt); pushTrail(); }
    },
    draw(t) {
      drawFloor();
      if (!trackCv) trackCv = buildTrackCanvas();
      c.drawImage(trackCv, 0, 0);
      drawMarks(t);
      drawPlacedCards();
      drawTrain(t);
      drawUI(t);
      if (drag) drawCard(drag.type, drag.x - 46, drag.y - 56, 92, 92);
      if (mode === 'build') drawBuild(t);
      K.homeButton();
    }
  };

  // ---------- めいれいの ふだ（プログラム） ----------
  const CARDS = {
    stop: { name: 'とまる', col: '#c9453a' },
    slow: { name: 'ゆっくり', col: '#2f6fa8' },
    fast: { name: 'はやく', col: '#3f8f66' },
  };
  let drag = null;       // いま つまんでいる ふだ
  const TRAY_Y = 606;
  function trayCards() { return (st.cards || []).slice(0, 4); }
  function trayRect(i) { return { x: 24 + i * 104, y: TRAY_Y, w: 92, h: 92 }; }
  function drawCard(type, x, y, w, h, small) {
    const cd = CARDS[type];
    K.rr(x, y + 4, w, h, 10, 'rgba(0,0,0,0.25)');
    K.rr(x, y, w, h, 10, '#f7f4ea', cd.col, 4);
    c.fillStyle = cd.col; c.fillRect(x, y + h - 10, w, 10);
    const cx2 = x + w / 2, cy2 = y + h / 2 - 6;
    if (type === 'stop') { K.circle(cx2, cy2, w * 0.2, cd.col); K.rr(cx2 - w * 0.13, cy2 - w * 0.04, w * 0.26, w * 0.08, 2, '#fff'); }
    if (type === 'slow') { c.fillStyle = cd.col; c.beginPath(); c.moveTo(cx2 - w * 0.18, cy2 - w * 0.16); c.lineTo(cx2 + w * 0.16, cy2); c.lineTo(cx2 - w * 0.18, cy2 + w * 0.16); c.closePath(); c.fill(); }
    if (type === 'fast') { c.fillStyle = cd.col; for (const o of [-w * 0.16, w * 0.04]) { c.beginPath(); c.moveTo(cx2 + o, cy2 - w * 0.16); c.lineTo(cx2 + o + w * 0.16, cy2); c.lineTo(cx2 + o, cy2 + w * 0.16); c.closePath(); c.fill(); } }
    if (!small) K.text(cd.name, cx2, y + h - 22, 19, K.C.ink, 'center', null);
  }
  function drawPlacedCards() {
    for (const cell of cells.values()) {
      if (!cell.card) continue;
      drawCard(cell.card, sx(cell.x) - 24, sy(cell.y) - 54, 48, 48, true);
    }
  }

  function drawUI(t) {
    // うえの おびと めあて
    K.panel(150, 6, 980, 44);
    K.lcd(160, 12, 960, 32, mode === 'clear' ? 'とうちゃく！' : (msgT > 0 && msg ? msg : st.hint), '#ffd9a0', 24);
    K.gauge(1210, 36, 30, mode === 'run' ? Math.min(1, tr.v / 240) : 0, null);
    // のせている にんずう と のせられる かず
    if (st.goal.deliver) {
      K.panel(16, 6, 118, 44);
      K.lcd(24, 12, 102, 32, tr.riders + ' / ' + capacity(), tr.riders >= capacity() ? '#ff9a6b' : '#9ad7a0', 22);
    }
    // したの そうさ
    K.panel(0, 596, W, 124);
    if (mode === 'plan') {
      trayCards().forEach((type, i) => { const r = trayRect(i); drawCard(type, r.x, r.y, r.w, r.h); });
      if (trayCards().length) K.text('ふだを せんろに おくと、そこで めいれいを まもるよ', 300, 586, 21, '#dfe6ef', 'left', null);
      K.button(880, 614, 170, 80, 'くみたて', K.C.purple, () => { K.sfx.pop(); mode = 'build'; }, { size: 34 });
      K.button(1066, 614, 190, 80, 'はしる', K.C.green, run, { size: 40 });
    } else if (mode === 'run') {
      K.button(120, 614, 210, 82, 'ゆっくり', K.C.blue, () => { tr.want = 0.5; }, { size: 34 });
      K.button(348, 614, 210, 82, 'ふつう', K.C.green, () => { tr.want = 1; }, { size: 34 });
      K.button(576, 614, 210, 82, 'とまる', K.C.red, () => { tr.want = 0; }, { size: 34 });
      K.button(950, 614, 220, 82, 'やりなおす', K.C.sub, backToPlan, { size: 30 });
    } else if (mode === 'clear') {
      K.button(W / 2 - 150, 614, 300, 82, 'つぎへ', K.C.green, nextStage, { size: 40 });
    }
  }

  // ---------- タイトル ----------
  function toTitle() {
    K.scene = {
      update() {},
      draw(t) {
        K.skyBg(t);
        K.rr(150, 104, 980, 240, 20, 'rgba(255,255,255,0.93)', K.C.panelEdge, 3);
        c.fillStyle = K.C.blue; c.fillRect(150, 104, 980, 8);
        K.text(GAME, W / 2, 190, 78, K.C.blue, 'center', null);
        K.text('ポイントを かえて、じぶんの でんしゃを はしらせよう', W / 2, 286, 32, K.C.sub, 'center', null);
        K.trainSide(W / 2 + 340 + ((t * 120) % 1600) - 800, 640, { color: K.C.blue, cars: 3, scale: 0.9, bob: Math.sin(t * 20) * 1.2 });
        K.railBed(660);
        K.button(W / 2 - 190, 394, 380, 104, 'はじめる', K.C.blue, () => startStage(0));
        K.homeButton();
      }
    };
  }
  window.MYD = { get mode() { return mode; }, get tr() { return tr; }, get cells() { return cells; }, startStage, run };
  toTitle();
})();
