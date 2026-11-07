// えきいんさん ごっこ
// でんしゃが くる → おなじ いろの ひとを のせる → ドアしめます → ふえ → しゅっぱつ（3ぼん）
(function () {
  'use strict';
  const ctx = K.ctx, W = K.W, H = K.H;
  const COLS = [
    { c: '#e94b4b', s: '#ffffff', n: 'あかい' },
    { c: '#4b8bf5', s: '#ffffff', n: 'あおい' },
    { c: '#3ec46d', s: '#ffffff', n: 'みどりの' },
    { c: '#ffd23f', s: '#2b3a55', n: 'きいろい' },
  ];
  const KINDS = ['local', 'bullet', 'steam'];
  const TY = 455, STOPX = 1235, PY = 655, PS = 1.3;
  const SLOTS = [350, 510, 670, 830, 990, 1150];
  const STAFF = { x: 110, y: 708, s: 1.5 };
  const NUM = ['', 'ひとり', 'ふたり', 'さんにん', 'よにん', 'ごにん'];
  const TSCALE = 1.08, CAR = 230 * TSCALE, CARH = 110 * TSCALE, GAP = 10 * TSCALE;

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const lerp = (a, b, p) => a + (b - a) * p;

  let G = null;
  window.__G = () => G; // かくにん用

  function newGame() {
    G = { order: shuffle([0, 1, 2, 3]).slice(0, 3), ti: -1, people: [], pops: [], train: null, wave: 0, whistleT: 0, kind: 0 };
    K.scene = scene;
    nextTrain();
  }

  function nextTrain() {
    G.ti++;
    if (G.ti >= 3) { K.reward('えきいんさん ごっこ', 'えきいんさん じょうず！', () => newGame()); return; }
    const ci = G.order[G.ti], nci = G.order[G.ti + 1];
    const kind = KINDS[G.ti];
    const doors = [];
    for (let i = 0; i < 3; i++) {
      if (i === 0 && kind === 'steam') continue;
      doors.push({ off: -i * (CAR + GAP) - CAR * (i === 0 && kind === 'bullet' ? 0.42 : 0.5), riders: 0 });
    }
    G.train = { ci, kind, x: -60, v: 0, state: 'arrive', st: 0, open: 0, doors, hasRunner: G.ti > 0, runnerSpawned: false, allT: -1, idle: 0, hint: null };
    // あたらしい おきゃくさん
    const plan = G.ti === 0 ? [ci, ci, ci, nci] : G.ti === 1 ? [ci, ci, nci] : [ci, ci];
    shuffle(plan);
    const used = new Set(G.people.filter(p => p.state !== 'gone').map(p => p.slot));
    const free = shuffle(SLOTS.map((_, i) => i).filter(i => !used.has(i)));
    plan.forEach((col, k) => {
      const slot = free[k];
      G.people.push({ col, slot, x: W + 80 + k * 150, tx: SLOTS[slot], y: PY, state: 'walk', t: 0, shake: 0, bubble: 0, hop: 0, runner: false, hair: ['#5a3a22', '#2b2b2b', '#a0522d', '#d9a441'][(Math.random() * 4) | 0] });
    });
    G.people = G.people.filter(p => p.state !== 'gone');
    K.sfx.horn();
    if (G.ti > 0) K.say('つぎの でんしゃが くるよ');
  }

  function doorX(d) { return G.train.x + d.off; }
  function nearestDoor(x) {
    let best = null, bd = 1e9;
    for (const d of G.train.doors) { const dd = Math.abs(doorX(d) - x) + d.riders * 60; if (dd < bd) { bd = dd; best = d; } }
    return best;
  }
  function pop(text, x, y, color, size) { G.pops.push({ text, x, y, color: color || '#e94b4b', size: size || 64, life: 1.6 }); }
  function colName(ci) { return COLS[ci].n; }

  function boardPerson(p) {
    const d = nearestDoor(p.x);
    p.state = 'hop'; p.t = 0; p.sx = p.x; p.sy = p.y; p.door = d;
    K.sfx.pop();
  }

  function tapPerson(p) {
    const tr = G.train;
    tr.idle = 0; tr.hint = null;
    if (p.runner) {
      boardPerson(p);
      G.kind++;
      setTimeout(() => { K.sfx.good(); pop('やさしいね！', W / 2, 280, '#ff6fa5', 80); K.say('まってあげて、やさしいね！'); K.sparkle(p.door ? doorX(p.door) : W / 2, 400, 24, '#ff8ad8'); }, 350);
      return;
    }
    if (p.col === tr.ci) {
      boardPerson(p);
      const left = G.people.filter(q => q !== p && !q.runner && q.col === tr.ci && (q.state === 'wait' || q.state === 'walk')).length;
      setTimeout(() => {
        K.sfx.good();
        if (left > 0) K.say('のったね。あと ' + NUM[left]);
      }, 300);
    } else {
      p.shake = 0.6; p.bubble = 2.4;
      K.tone(620, 0, 0.12, 'sine', 0.12); K.tone(520, 0.12, 0.16, 'sine', 0.1);
      K.say('この ひとは、つぎの でんしゃだよ。' + colName(tr.ci) + ' ひとを さがしてね');
    }
  }

  K.handlers.down = pt => {
    if (!G || K.scene !== scene) return;
    const tr = G.train;
    if (tr.state !== 'board') return;
    let hit = null, hd = 1e9;
    for (const p of G.people) {
      if (p.state !== 'wait' && p.state !== 'walk' && p.state !== 'run') continue;
      const dx = Math.abs(pt.x - p.x), cy = p.y - 70 * PS;
      if (dx < 75 && pt.y > p.y - 150 * PS && pt.y < p.y + 30) { const d = dx + Math.abs(pt.y - cy) * 0.3; if (d < hd) { hd = d; hit = p; } }
    }
    if (hit) tapPerson(hit);
  };

  function pressDoor() {
    const tr = G.train;
    const r = G.people.find(p => p.runner && p.state !== 'gone' && p.state !== 'hop');
    if (r) {
      K.say('あっ、まって。のりたい ひとが はしってくるよ。のせてあげよう');
      pop('まってあげよう', W / 2, 280, '#ff8c2b', 60);
      tr.hint = r; return;
    }
    tr.state = 'closing'; tr.st = 0;
    K.sfx.door(); K.say('ドアが しまります');
  }
  function pressWhistle() {
    const tr = G.train;
    K.sfx.whistle(); G.whistleT = 1.2;
    pop('ピーッ！', 380, 600, '#2b6fd6', 60);
    tr.state = 'whistled'; tr.st = 0;
  }
  function pressGo() {
    const tr = G.train;
    tr.state = 'depart'; tr.st = 0; tr.v = 20;
    K.sfx.horn(); G.wave = 1;
    pop('しゅっぱつ しんこう！', W / 2, 280, '#e94b4b', 72);
    K.say('しゅっぱつ しんこう！ いってらっしゃーい');
  }

  // ---------------- update ----------------
  function update(dt, t) {
    const tr = G.train;
    if (!tr) return;
    tr.st += dt;
    G.whistleT = Math.max(0, G.whistleT - dt);
    if (tr.state === 'arrive') {
      const D = STOPX + 60, dur = 4.2, p = Math.min(1, tr.st / dur);
      tr.x = STOPX - D * (1 - p) * (1 - p);
      K.runSound(dt, 2 * D * (1 - p) / dur / 260);
      if (p >= 1) {
        tr.state = 'opening'; tr.st = 0; K.sfx.door();
        const n = colName(tr.ci);
        K.say(n + ' でんしゃが きたよ。' + n + ' ひとを、タッチして のせてあげてね');
      }
    } else if (tr.state === 'opening') {
      tr.open = Math.min(1, tr.st / 0.7);
      if (tr.open >= 1) { tr.state = 'board'; tr.st = 0; }
    } else if (tr.state === 'board') {
      tr.idle += dt;
      const need = G.people.filter(p => !p.runner && p.col === tr.ci && (p.state === 'wait' || p.state === 'walk'));
      const busy = G.people.some(p => p.state === 'hop');
      if (need.length > 0 && tr.idle > 8) {
        tr.idle = -2; tr.hint = need[0];
        K.say(colName(tr.ci) + ' ひとを タッチしてね');
      }
      if (need.length === 0 && !busy) {
        if (tr.allT < 0) {
          tr.allT = 0;
          if (tr.hasRunner && !tr.runnerSpawned) {
            tr.runnerSpawned = true;
            G.people.push({ col: tr.ci, slot: -1, x: -80, tx: SLOTS[0] - 40, y: PY, state: 'run', t: 0, shake: 0, bubble: 0, hop: 0, runner: true, hair: '#2b2b2b' });
            K.say('みんな のったね。あれ？ だれか はしってくるよ');
          } else {
            K.say('みんな のったね。ドア しめます を おしてね');
          }
        }
        tr.allT += dt;
        const r = G.people.find(p => p.runner && p.state !== 'gone');
        if (r && r.state === 'wait' && tr.idle > 9) { tr.idle = -2; tr.hint = r; K.say('はしってきた ひとを タッチして のせてあげよう'); }
      }
    } else if (tr.state === 'closing') {
      tr.open = Math.max(0, 1 - tr.st / 0.8);
      if (tr.open <= 0) { tr.state = 'whistle'; tr.st = 0; K.say('ふえを ふいて、あいずを しよう'); }
    } else if (tr.state === 'whistled') {
      if (tr.st > 1.0 && !tr.saidGo) { tr.saidGo = true; K.say('しゅっぱつ を おしてね'); }
    } else if (tr.state === 'depart') {
      tr.v += 300 * dt; tr.x += tr.v * dt;
      K.runSound(dt, tr.v / 260);
      if (tr.x - 3 * (CAR + GAP) > W + 40) { G.wave = 0; nextTrain(); return; }
    }

    // ひとの うごき
    for (const p of G.people) {
      p.t += dt; p.shake = Math.max(0, p.shake - dt); p.bubble = Math.max(0, p.bubble - dt);
      if (p.state === 'walk') {
        const dir = Math.sign(p.tx - p.x);
        p.x += dir * 260 * dt; p.hop = Math.abs(Math.sin(p.t * 9)) * 10;
        if ((p.tx - p.x) * dir <= 0) { p.x = p.tx; p.state = 'wait'; p.hop = 0; }
      } else if (p.state === 'run') {
        p.x += 340 * dt; p.hop = Math.abs(Math.sin(p.t * 13)) * 18;
        if (p.x >= p.tx) { p.x = p.tx; p.state = 'wait'; p.hop = 0; p.bubble = 99; }
      } else if (p.state === 'hop') {
        const q = Math.min(1, p.t / 0.6), dx = doorX(p.door), dy = TY - 6;
        p.x = lerp(p.sx, dx, q); p.y = lerp(p.sy, dy, q) - Math.sin(Math.PI * q) * 150; p.hop = 0;
        if (q >= 1) { p.state = 'gone'; p.door.riders++; K.sparkle(dx, TY - 60, 12, COLS[p.col].c); }
      } else if (p.state === 'wait') {
        p.hop = G.wave ? Math.abs(Math.sin(p.t * 8)) * 16 : 0;
      }
    }
    for (const q of G.pops) q.life -= dt;
    G.pops = G.pops.filter(q => q.life > 0);
  }

  // ---------------- draw ----------------
  function drawBg(t) {
    const g = ctx.createLinearGradient(0, 0, 0, TY);
    g.addColorStop(0, '#8fd3ff'); g.addColorStop(1, '#d6f1ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, TY + 20);
    // くも
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 380 + t * 12) % 1600) - 160, cy = 230 + (i % 2) * 40;
      K.circle(cx, cy, 34, 'rgba(255,255,255,0.9)'); K.circle(cx + 40, cy - 12, 42, 'rgba(255,255,255,0.9)'); K.circle(cx + 84, cy, 32, 'rgba(255,255,255,0.9)');
    }
    // とおくの やま
    ctx.fillStyle = '#9fd89a';
    ctx.beginPath(); ctx.moveTo(0, 400);
    for (let x = 0; x <= W; x += 80) ctx.lineTo(x, 360 + Math.sin(x * 0.006) * 30 + Math.sin(x * 0.017) * 12);
    ctx.lineTo(W, TY); ctx.lineTo(0, TY); ctx.closePath(); ctx.fill();
    // せんろ
    ctx.fillStyle = '#9c8f80'; ctx.fillRect(0, TY + 6, W, 18);
    ctx.fillStyle = '#6d6d78'; ctx.fillRect(0, TY + 14, W, 6);
  }
  function drawPlatform() {
    ctx.fillStyle = '#cfc2a6'; ctx.fillRect(0, 480, W, H - 480);
    ctx.fillStyle = '#b6a888'; ctx.fillRect(0, 480, W, 10);
    // てんじブロック（きいろい せん）
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(0, 512, W, 16);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let x = 0; x < W; x += 40) ctx.fillRect(x, 512, 2, 16);
    // ゆかの もよう
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 2;
    for (let x = 0; x < W; x += 160) { ctx.beginPath(); ctx.moveTo(x, 530); ctx.lineTo(x - 40, H); ctx.stroke(); }
  }
  function drawTrain(t) {
    const tr = G.train; if (!tr) return;
    const col = COLS[tr.ci];
    const moving = tr.state === 'arrive' || tr.state === 'depart';
    K.trainSide(tr.x, TY, { color: col.c, stripe: col.s, cars: 3, kind: tr.kind, scale: TSCALE, bob: moving ? Math.sin(t * 22) * 1.5 : 0 });
    // ドア
    for (const d of tr.doors) {
      const cx = doorX(d), dw = CAR * 0.24, dh = CARH * 0.78, y0 = TY - CARH * 0.86;
      K.rr(cx - dw / 2 - 3, y0 - 3, dw + 6, dh + 6, 6, K.shade(col.c, -0.45));
      K.rr(cx - dw / 2, y0, dw, dh, 4, '#3a4560');
      const pw = dw / 2 * (1 - tr.open);
      const panel = K.shade(col.c, 0.12), edge = K.shade(col.c, -0.4);
      if (pw > 1) {
        K.rr(cx - dw / 2, y0, pw, dh, 3, panel, edge, 2);
        K.rr(cx + dw / 2 - pw, y0, pw, dh, 3, panel, edge, 2);
        if (pw > 12) {
          ctx.globalAlpha = 0.55;
          K.rr(cx - dw / 2 + 4, y0 + 10, pw - 8, dh * 0.38, 3, '#cfefff');
          K.rr(cx + dw / 2 - pw + 4, y0 + 10, pw - 8, dh * 0.38, 3, '#cfefff');
          ctx.globalAlpha = 1;
        }
      }
      // なかの ひと
      for (let k = 0; k < Math.min(2, d.riders); k++) {
        const fx = cx + (k ? 13 : -10), fy = y0 + 30 + k * 4;
        K.circle(fx, fy, 13, '#ffd9b8', '#8a5a3c', 2);
        ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.arc(fx, fy - 2, 13, Math.PI, 0); ctx.fill();
        if (G.wave) { // てを ふる
          const a = Math.sin(t * 10) * 0.5;
          K.circle(fx + 14 + Math.sin(a) * 8, fy - 14 - Math.cos(a) * 4, 6, '#ffd9b8', '#8a5a3c', 2);
        }
      }
    }
  }
  function drawStaff(t) {
    const s = STAFF.s, x = STAFF.x, y = STAFF.y;
    // うで（うしろ）
    const sx = x + 24 * s, sy = y - 38 * s;
    let ang = 1.15;
    if (G.wave) ang = -1.1 + Math.sin(t * 9) * 0.5;
    else if (G.whistleT > 0) ang = -1.5;
    const ex = sx + Math.cos(ang) * 40 * s, ey = sy + Math.sin(ang) * 40 * s;
    ctx.strokeStyle = '#2b3a55'; ctx.lineWidth = 14 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    K.person(x, y, { color: '#2b3a55', hat: '#2b3a55', scale: s, hair: '#3a2a1a' });
    K.circle(ex, ey, 9 * s, '#ffd9b8', '#8a5a3c', 2);
    // ぼうしの マーク
    K.star(x, y - 92 * s, 8 * s, '#ffd23f');
    // むねの バッジ
    K.circle(x - 10 * s, y - 32 * s, 6 * s, '#ffd23f');
    if (G.whistleT > 0) {
      K.rr(x + 6 * s, y - 64 * s, 18 * s, 10 * s, 4, '#ffd23f', '#a07a00', 2);
      for (let i = 0; i < 3; i++) { ctx.strokeStyle = '#2b6fd6'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x + 30 * s, y - 60 * s, 14 + i * 12 + (t * 40 % 12), -0.6, 0.6); ctx.stroke(); }
    }
    // あなたが えきいんさん
    K.rr(18, 410, 250, 100, 22, '#fff', '#2b3a55', 5);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(110, 507); ctx.lineTo(132, 507); ctx.lineTo(112, 536); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2b3a55'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(108, 510); ctx.lineTo(112, 536); ctx.lineTo(134, 510); ctx.stroke();
    K.text('あなたが', 143, 440, 30, '#2b3a55', 'center', null);
    K.text('えきいんさん', 143, 482, 34, '#e94b4b', 'center', null);
  }
  function drawPeople(t) {
    const tr = G.train;
    for (const p of G.people) {
      if (p.state === 'gone') continue;
      const sh = p.shake > 0 ? Math.sin(p.shake * 40) * 8 : 0;
      const sc = p.state === 'hop' ? PS * (1 - 0.3 * Math.min(1, p.t / 0.6)) : PS;
      K.person(p.x + sh, p.y, { color: COLS[p.col].c, scale: sc, hop: p.hop, hair: p.hair });
      if (p.runner && p.state === 'run') { // あせ
        K.circle(p.x - 40, p.y - 120 - p.hop, 6, '#8fd3ff'); K.circle(p.x - 52, p.y - 100 - p.hop, 5, '#8fd3ff');
      }
      const hint = tr && tr.hint === p && p.state !== 'hop';
      if (hint) {
        const by = p.y - 200 - Math.abs(Math.sin(t * 6)) * 18;
        ctx.fillStyle = '#ff8c2b'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(p.x - 26, by - 30); ctx.lineTo(p.x + 26, by - 30); ctx.lineTo(p.x, by + 4); ctx.closePath(); ctx.stroke(); ctx.fill();
        K.circle(p.x, p.y - 70 * PS, 78, null, 'rgba(255,140,43,' + (0.5 + 0.4 * Math.sin(t * 8)) + ')', 6);
      }
      if (p.bubble > 0 && p.state === 'wait') {
        const txt = p.runner ? 'まって〜！' : 'つぎの でんしゃだよ';
        const bw = p.runner ? 220 : 330, bx = Math.max(285, Math.min(W - bw - 16, p.x - bw / 2)), byy = p.y - 250 - (hint ? 40 : 0);
        K.rr(bx, byy, bw, 64, 22, '#fff', '#2b3a55', 4);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(p.x - 12, byy + 62); ctx.lineTo(p.x + 12, byy + 62); ctx.lineTo(p.x, byy + 84); ctx.closePath(); ctx.fill();
        K.text(txt, bx + bw / 2, byy + 33, 30, p.runner ? '#e94b4b' : '#2b3a55', 'center', null);
      }
    }
  }
  function drawHud(t) {
    const tr = G.train; if (!tr) return;
    const col = COLS[tr.ci];
    // いきさきの かんばん
    K.rr(160, 16, 560, 152, 26, '#fff', col.c === '#ffd23f' ? '#d4a800' : col.c, 8);
    K.circle(222, 66, 34, col.c, K.shade(col.c, -0.4), 4);
    K.text(col.n + ' でんしゃ', 272, 68, 46, '#2b3a55', 'left', null);
    const guide = {
      arrive: 'でんしゃが くるよ', opening: 'ドアが ひらくよ',
      board: tr.allT >= 0 ? (G.people.some(p => p.runner && p.state !== 'gone') ? 'はしってくる ひとを まとう' : 'ドアを しめよう') : 'おなじ いろの ひとを タッチ',
      closing: 'ドアが しまります', whistle: 'ふえを ふこう', whistled: 'しゅっぱつ！ を おそう', depart: 'いってらっしゃい',
    }[tr.state];
    K.text(guide, 440, 132, 32, '#555', 'center', null);
    // なんぼんめ
    for (let i = 0; i < 3; i++) {
      const cx = 1120 + i * 62, cy = 42, c = COLS[G.order[i]].c;
      if (i < G.ti) { K.circle(cx, cy, 24, c, K.shade(c, -0.4), 3); K.star(cx, cy, 14, '#fff'); }
      else K.circle(cx, cy, i === G.ti ? 24 : 18, i === G.ti ? c : '#ffffff', K.shade(c, -0.3), 4);
    }
    // ボタン
    const bx = 780, by = 86, bw = 440, bh = 140;
    if (tr.state === 'board' && tr.allT > 0.8) K.button(bx, by, bw, bh, 'ドア しめます', '#ff8c2b', pressDoor, { size: 50 });
    else if (tr.state === 'whistle') {
      K.button(bx, by, bw, bh, 'ふえ', '#2b6fd6', pressWhistle, { size: 64 });
      // ふえの え
      const wx = bx + 120, wy = by + bh / 2 + 2;
      K.rr(wx - 40, wy - 18, 60, 36, 14, '#ffd23f', '#a07a00', 3); K.rr(wx + 14, wy - 12, 30, 16, 5, '#ffd23f', '#a07a00', 3);
      K.circle(wx - 16, wy, 8, '#a07a00');
      const sc = 1 + Math.sin(t * 6) * 0.04;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(bx - 10 * sc, by - 10 * sc, bw + 20 * sc, bh + 20 * sc, 34); ctx.stroke();
    } else if (tr.state === 'whistled' && tr.st > 0.9) K.button(bx, by, bw, bh, 'しゅっぱつ！', '#e94b4b', pressGo, { size: 58 });
  }
  function drawPops() {
    for (const q of G.pops) {
      ctx.globalAlpha = Math.min(1, q.life * 2);
      K.text(q.text, q.x, q.y - (1.6 - q.life) * 40, q.size, q.color, 'center', '#fff');
      ctx.globalAlpha = 1;
    }
  }

  const scene = {
    update(dt, t) { update(dt, t); },
    draw(t) {
      drawBg(t);
      drawTrain(t);
      drawPlatform();
      drawPeople(t);
      drawStaff(t);
      drawHud(t);
      drawPops();
      K.homeButton();
    }
  };

  K.title('えきいんさん ごっこ', 'おなじ いろの ひとを でんしゃに のせよう', '#2b6fd6', () => {
    K.say('きょうは あなたが えきいんさん。おなじ いろの ひとを、でんしゃに のせてあげよう');
    newGame();
  });
})();
