// でんしゃ グランプリ — でんしゃの え（よこから みた おおきい え）と ぶひんの え
(function () {
  'use strict';
  const c = K.ctx, sh = K.shade;
  const T = {}; window.GPT = T;
  // ぶひんの いろ（レースの えでも つかう）
  T.PCOL = {
    m1: '#8d96a8', m2: '#d8483c', m3: '#8a62c9', m4: '#f0b53a', g1: '#8d96a8', g2: '#e0a21c', g3: '#2f7fc4',
    t1: '#aab3c2', t2: '#7fbf8f', t3: '#e0a865', t4: '#35b6d8', w1: '#5a6880', w2: '#e8ecf3', w3: '#f0b53a',
    b1: '#3f9f66', b2: '#3f9f66', b3: '#3f9f66', x0: '#5a6880', x1: '#e0a21c', x2: '#d8483c', x3: '#e86a9a',
  };
  const line = (x0, y0, x1, y1) => { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };

  function cog(x, y, r, n, rot, col) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = i * Math.PI / n, rr = i % 2 ? r : r * 0.76, w = Math.PI / n * 0.3;
      c.lineTo(Math.cos(a - w) * rr, Math.sin(a - w) * rr); c.lineTo(Math.cos(a + w) * rr, Math.sin(a + w) * rr);
    }
    c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = sh(col, -0.5); c.lineWidth = Math.max(1, r * 0.08); c.stroke();
    K.circle(0, 0, r * 0.5, sh(col, -0.22)); K.circle(0, 0, r * 0.2, '#1d2433');
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; K.circle(Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36, r * 0.07, '#1d2433'); }
    c.restore();
  }
  // しゃりん（タイヤの しゅるいで みためが かわる）
  const WR = { t1: 15, t2: 18, t3: 11.5, t4: 15 };
  function wheel(x, y, id, rot, k) {
    const r = (WR[id] || 15) * k, hub = T.PCOL[id] || T.PCOL.t1;
    if (id === 't4') { c.save(); c.globalAlpha = 0.3 + 0.2 * Math.sin(rot * 1.3); K.circle(x, y, r * 1.28, null, '#7fe6ff', 3.4 * k); c.restore(); }
    K.circle(x, y, r, '#23282f', '#0f1318', 2 * k);
    if (id === 't2') {
      c.strokeStyle = '#4b535f'; c.lineWidth = 2.6 * k;
      for (let i = 0; i < 12; i++) { const a = rot + i * Math.PI / 6; line(x + Math.cos(a) * r * 0.74, y + Math.sin(a) * r * 0.74, x + Math.cos(a) * r * 0.98, y + Math.sin(a) * r * 0.98); }
    }
    K.circle(x, y, r * (id === 't2' ? 0.56 : 0.66), hub, sh(hub, -0.45), 1.5 * k);
    c.strokeStyle = sh(hub, -0.5); c.lineWidth = 2 * k;
    for (let i = 0; i < 5; i++) { const a = rot + i * Math.PI * 2 / 5; line(x, y, x + Math.cos(a) * r * 0.52, y + Math.sin(a) * r * 0.52); }
    K.circle(x, y, r * 0.2, '#2b313b');
  }
  const MW = { m1: 44, m2: 48, m3: 58, m4: 58 }, MH = { m1: 28, m2: 30, m3: 40, m4: 34 };
  function motor(x, y, id, t, k) {
    const col = T.PCOL[id], w = MW[id] * k, h = MH[id] * k;
    K.rr(x + w / 2 - 2, y - 3 * k, 13 * k, 6 * k, 2, '#c9d2e0', '#6b7384', 1);
    const g = c.createLinearGradient(0, y - h / 2, 0, y + h / 2);
    g.addColorStop(0, sh(col, 0.4)); g.addColorStop(0.5, col); g.addColorStop(1, sh(col, -0.5));
    if (id === 'm4') for (let i = 0; i < 4; i++) K.rr(x - w / 2 + (11 + i * 10) * k, y - h / 2 - 6 * k, 6 * k, 8 * k, 1.5, sh(col, -0.25));
    K.rr(x - w / 2, y - h / 2, w, h, 6 * k, g, sh(col, -0.6), 2);
    c.save(); c.beginPath(); c.rect(x - w / 2 + 9 * k, y - h / 2 + 2, w - 18 * k, h - 4); c.clip();
    c.strokeStyle = 'rgba(255,255,255,0.32)'; c.lineWidth = 2.2 * k;
    const ph = (t * 46 * k) % (8 * k);
    for (let px = x - w / 2 - 12 * k + ph; px < x + w / 2; px += 8 * k) line(px, y + h / 2, px + 6 * k, y - h / 2);
    c.restore();
    K.rr(x - w / 2, y - h / 2, 8 * k, h, 4 * k, sh(col, -0.4)); K.rr(x + w / 2 - 8 * k, y - h / 2, 8 * k, h, 4 * k, sh(col, -0.4));
    if (id === 'm3') for (const q of [-1, 1]) for (const p of [-1, 1]) K.circle(x + p * (w / 2 - 4 * k), y + q * h * 0.28, 2 * k, '#e8ecf3');
  }
  const GR = { g1: [9, 14, 8, 12], g2: [7, 20, 6, 17], g3: [14, 10, 12, 8] };
  function gears(x, y, id, t, k) {
    const [r1, r2, n1, n2] = GR[id], d = (r1 + r2) * 0.9 * k, x1 = x - d * r2 / (r1 + r2), x2 = x + d * r1 / (r1 + r2);
    cog(x2, y, r2 * k, n2, -t * 4 * n1 / n2 + Math.PI / n2, T.PCOL[id]);
    cog(x1, y, r1 * k, n1, t * 4, '#c9d2e0');
  }
  function slab(cx, cy, hw, k, col) {
    c.beginPath(); c.moveTo(cx - hw, cy - 3 * k); c.quadraticCurveTo(cx - hw * 0.4, cy - 9 * k, cx + hw * 0.6, cy - 3 * k);
    c.lineTo(cx + hw, cy + 2 * k); c.lineTo(cx - hw, cy + 3 * k); c.closePath();
    const g = c.createLinearGradient(0, cy - 8 * k, 0, cy + 3 * k); g.addColorStop(0, sh(col, 0.3)); g.addColorStop(1, sh(col, -0.3));
    c.fillStyle = g; c.fill(); c.strokeStyle = sh(col, -0.55); c.lineWidth = 1.6 * k; c.stroke();
  }
  // はね。(x,y) は つけねの いち
  function wing(x, y, id, k) {
    const big = id === 'w3', col = T.PCOL[id], top = (big ? 34 : 22) * k;
    c.strokeStyle = '#59647a'; c.lineWidth = 4.5 * k; c.lineCap = 'round';
    for (const px of [-13, 13]) line(x + px * k, y, x + (px - 5) * k, y - top + 2 * k);
    c.lineCap = 'butt';
    if (big) slab(x - 2 * k, y - 16 * k, 28 * k, k, sh(col, -0.15));
    slab(x - 5 * k, y - top, (big ? 44 : 34) * k, k, col);
    if (big) for (const px of [-48, 38]) K.rr(x + px * k, y - top - 9 * k, 5 * k, 16 * k, 2, '#d8483c', '#8e2f27', 1);
  }
  function cell(x, y, w, h) {
    const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#2f8a55'); g.addColorStop(0.45, '#6fd391'); g.addColorStop(1, '#2a7a4b');
    K.rr(x, y, w, h, Math.min(w, h) * 0.2, g, '#1d5a37', 1.5);
    if (h > w) { K.rr(x + w * 0.3, y - h * 0.09, w * 0.4, h * 0.11, 1.5, '#d9c06a'); K.rr(x, y + h * 0.16, w, h * 0.16, 0, '#e8ecf3'); }
    else { K.rr(x + w, y + h * 0.3, w * 0.1, h * 0.4, 1.5, '#d9c06a'); K.rr(x + w * 0.16, y, w * 0.16, h, 0, '#e8ecf3'); }
  }
  function spring(x, y0, y1, k) {
    c.strokeStyle = '#f2c230'; c.lineWidth = 3 * k; c.lineJoin = 'round'; c.beginPath(); c.moveTo(x, y0);
    for (let i = 1; i <= 5; i++) c.lineTo(x + (i % 2 ? 6 : -6) * k * (i === 5 ? 0 : 1), y0 + (y1 - y0) * i / 5);
    c.stroke();
  }
  // ロケット（ひだりへ ふきだす）。(x,y) は どうたいの まんなか
  function rocket(x, y, k, t, fire) {
    const f = (fire ? 34 : 13) * k * (0.8 + 0.2 * Math.sin(t * 40));
    for (const [len, w, col] of [[f, 9, '#ff7a2b'], [f * 0.6, 5.5, '#ffe08a']]) {
      c.beginPath(); c.moveTo(x - 22 * k, y - w * k); c.lineTo(x - 22 * k - len, y); c.lineTo(x - 22 * k, y + w * k); c.closePath(); c.fillStyle = col; c.fill();
    }
    c.beginPath(); c.moveTo(x - 16 * k, y - 7 * k); c.lineTo(x - 25 * k, y - 11 * k); c.lineTo(x - 25 * k, y + 11 * k); c.lineTo(x - 16 * k, y + 7 * k); c.closePath(); c.fillStyle = '#59647a'; c.fill();
    const g = c.createLinearGradient(0, y - 12 * k, 0, y + 12 * k); g.addColorStop(0, '#f08a7f'); g.addColorStop(0.5, '#d8483c'); g.addColorStop(1, '#8e2f27');
    c.beginPath(); c.moveTo(x - 17 * k, y - 11 * k); c.lineTo(x + 10 * k, y - 11 * k); c.quadraticCurveTo(x + 27 * k, y - 7 * k, x + 30 * k, y);
    c.quadraticCurveTo(x + 27 * k, y + 7 * k, x + 10 * k, y + 11 * k); c.lineTo(x - 17 * k, y + 11 * k); c.closePath();
    c.fillStyle = g; c.fill(); c.strokeStyle = '#6f231d'; c.lineWidth = 1.6 * k; c.stroke();
    K.rr(x - 6 * k, y - 11 * k, 6 * k, 22 * k, 0, '#f3ead2'); K.circle(x + 12 * k, y, 4.5 * k, '#9fd3ee', '#44505f', 1.2 * k);
  }
  function balloon(x, y, k, t) {
    const g = c.createRadialGradient(x - 8 * k, y - 10 * k, 2, x, y, 30 * k); g.addColorStop(0, '#ffc2d8'); g.addColorStop(0.5, '#e86a9a'); g.addColorStop(1, '#b0406c');
    c.beginPath(); c.ellipse(x, y, 23 * k, 28 * k, 0, 0, 7); c.fillStyle = g; c.fill(); c.strokeStyle = '#8e3257'; c.lineWidth = 1.6 * k; c.stroke();
    c.beginPath(); c.moveTo(x - 5 * k, y + 27 * k); c.lineTo(x + 5 * k, y + 27 * k); c.lineTo(x, y + 34 * k); c.closePath(); c.fillStyle = '#b0406c'; c.fill();
    c.beginPath(); c.ellipse(x - 9 * k, y - 12 * k, 5 * k, 9 * k, -0.5, 0, 7); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fill();
  }

  // ---------- ぶひんの え（±36 の わくに おさまる） ----------
  T.part = function (slot, id, x, y, s, t) {
    t = t || 0;
    c.save(); c.translate(x, y); c.scale(s, s);
    if (id === 'w1' || id === 'x0') {
      c.setLineDash([7, 7]); K.circle(0, 0, 24, null, '#6b7a94', 3.5); c.setLineDash([]);
      c.strokeStyle = '#6b7a94'; c.lineWidth = 4; line(-9, 0, 9, 0);
    } else if (slot === 'motor') motor(-5, 0, id, t, 1.05);
    else if (slot === 'gear') gears(0, 0, id, t, 1.5);
    else if (slot === 'tire') { wheel(0, 2, id, t * 2, 1.85); if (id === 't4') { K.rr(-13, -34, 10, 11, 2, '#d8483c'); K.rr(3, -34, 10, 11, 2, '#2f7fc4'); } }
    else if (slot === 'wing') wing(4, 22, id, id === 'w3' ? 0.74 : 0.9);
    else if (slot === 'battery') { const n = +id[1]; for (let i = 0; i < n; i++) cell((i - n / 2) * 21 + 1.5, -19, 18, 42); }
    else if (id === 'x1') { K.rr(-18, -27, 36, 7, 3, '#8d96a8'); K.rr(-18, 20, 36, 7, 3, '#8d96a8'); spring(0, -20, 20, 2.1); }
    else if (id === 'x2') { c.rotate(-0.5); rocket(0, 0, 1.05, t, false); }
    else if (id === 'x3') { c.strokeStyle = '#c9d2e0'; c.lineWidth = 1.6; line(0, 8, 3, 34); balloon(0, -9, 0.9, t); }
    c.restore();
  };

  // ---------- よこから みた でんしゃ（2りょう・みぎむき）。(x,y) は レールの うえ・まんなか ----------
  // o.hi = ひからせる ばしょ（スロットの なまえ） / o.run = はしって いる（0〜1） / o.fire = ダッシュちゅう
  const YB = -32, YT = -114;
  function shell(x0, x1, col, head) {
    const g = c.createLinearGradient(0, YT, 0, YB);
    g.addColorStop(0, sh(col, 0.28)); g.addColorStop(0.4, col); g.addColorStop(1, sh(col, -0.38));
    c.beginPath();
    if (head) {
      c.moveTo(x0 + 10, YT); c.lineTo(x1 - 96, YT); c.bezierCurveTo(x1 - 44, YT, x1 - 8, YT + 36, x1, YB - 20);
      c.quadraticCurveTo(x1 + 2, YB, x1 - 14, YB); c.lineTo(x0 + 8, YB); c.quadraticCurveTo(x0, YB, x0, YB - 8); c.lineTo(x0, YT + 10); c.quadraticCurveTo(x0, YT, x0 + 10, YT);
    } else c.roundRect(x0, YT, x1 - x0, YB - YT, 10);
    c.closePath(); c.fillStyle = g; c.fill(); c.strokeStyle = sh(col, -0.58); c.lineWidth = 3; c.stroke();
    c.save(); c.clip();
    c.fillStyle = '#f3ead2'; c.fillRect(x0, -62, x1 - x0, 9);
    c.fillStyle = sh(col, -0.3); c.fillRect(x0, -50, x1 - x0, 3);
    c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(x0, YB - 9, x1 - x0, 9);
    c.fillStyle = 'rgba(255,255,255,0.16)'; c.fillRect(x0, YT + 3, x1 - x0, 5);
    c.restore();
  }
  function glass(x, y, w, h) {
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#bfe0f2'); g.addColorStop(1, '#6f9fc0');
    K.rr(x, y, w, h, 5, g, '#33415a', 2.5);
    c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.moveTo(x + 5, y + 3); c.lineTo(x + w * 0.45, y + 3); c.lineTo(x + w * 0.2, y + h - 3); c.lineTo(x + 5, y + h - 3); c.fill();
  }
  function bogie(bx, id, rot, sp) {
    K.rr(bx - 42, -24, 84, 14, 5, '#3a4252', '#262d3a', 2);
    if (sp) for (const px of [-22, 0, 22]) spring(bx + px, YB + 1, -23, 1); else K.rr(bx - 9, YB, 18, 9, 2, '#59647a');
    for (const px of [-22, 22]) wheel(bx + px, -(WR[id] || 15), id, rot, 1);
  }
  T.side = function (x, y, build, color, s, t, o) {
    o = o || {};
    const run = o.run || 0, rot = t * 9 * run, sp = build.gadget === 'x1';
    c.save(); c.translate(x, y); c.scale(s, s);
    if (o.stand !== false) {
      K.rr(-335, 6, 670, 20, 5, '#3c4659', '#262d3a', 2);
      c.fillStyle = '#c99a2a'; c.fillRect(-335, 20, 670, 6);
      c.fillStyle = '#1a1f2a'; for (let px = -335; px < 330; px += 30) { c.beginPath(); c.moveTo(px, 26); c.lineTo(px + 8, 20); c.lineTo(px + 22, 20); c.lineTo(px + 14, 26); c.fill(); }
      c.fillStyle = '#6b5a48'; for (let px = -320; px < 320; px += 34) c.fillRect(px, 3, 20, 6);
      K.rr(-335, 0, 670, 5, 2, '#c3ccd9', '#6b7384', 1);
    }
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(0, 3, 285, 7, 0, 0, 7); c.fill();
    c.translate(0, Math.sin(t * 22) * 1.1 * run);
    if (build.gadget === 'x2') rocket(-262, -72, 1.25, t, o.fire);
    // あしまわり
    for (const bx of [-212, -70, 60, 176]) bogie(bx, build.tire, rot, sp);
    const n = +build.battery[1] || 1;
    K.rr(-141 - 50, YB - 1, 100, 24, 5, '#262d3a', '#151a23', 2);
    for (let i = 0; i < n; i++) cell(-141 + (i - n / 2) * 30 + 2, YB + 3, 24, 15);
    K.rr(-13, -100, 16, 64, 3, '#3a4252');
    // しゃたい
    shell(-272, -10, color, false); shell(0, 272, color, true);
    for (let i = 0; i < 4; i++) glass(-256 + i * 60, -102, 46, 32);
    c.beginPath(); c.moveTo(172, -103); c.lineTo(205, -103); c.quadraticCurveTo(232, -98, 248, -72); c.lineTo(172, -72); c.closePath();
    c.fillStyle = '#22304a'; c.fill(); c.strokeStyle = '#131b2b'; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.moveTo(178, -98); c.lineTo(200, -98); c.lineTo(186, -77); c.lineTo(178, -77); c.fill();
    c.save(); c.globalAlpha = 0.35; K.circle(262, -46, 15, '#fff3c4'); c.restore(); K.circle(262, -46, 6.5, '#fff8dc', '#b9a74e', 1.5);
    K.rr(268, -30, 12, 8, 2, '#59647a');
    // やね
    K.rr(-264, YT - 6, 246, 9, 4, '#59647a', '#3d4658', 1.5); K.rr(8, YT - 6, 176, 9, 4, '#59647a', '#3d4658', 1.5);
    for (const px of [-196, -110, 30]) K.rr(px, YT - 15, 50, 11, 3, '#8a93a4', '#59647a', 1.5);
    c.strokeStyle = '#8d96a8'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(108, YT - 6); c.lineTo(124, YT - 24); c.lineTo(146, YT - 12); c.lineTo(160, YT - 28); c.stroke(); c.lineCap = 'butt';
    K.rr(142, YT - 31, 36, 4, 2, '#6b7384');
    if (build.wing !== 'w1') wing(-236, YT - 5, build.wing, 1);
    if (build.gadget === 'x3') {
      const bx = -150 + Math.sin(t * 1.7) * 7 - run * 14;
      c.strokeStyle = '#d8dfea'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-140, YT - 6); c.quadraticCurveTo(-140, YT - 30, bx, YT - 44); c.stroke();
      balloon(bx, YT - 76, 1, t);
    }
    // なかが みえる まど（モーターと はぐるま）
    K.rr(18, -104, 136, 60, 9, '#111826', '#e8ecf3', 3);
    c.save(); c.beginPath(); c.rect(21, -101, 130, 54); c.clip();
    c.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 6; i++) c.fillRect(21 + i * 24, -101, 2, 54);
    motor(62, -74, build.motor, t * (0.4 + run), 1);
    gears(119, -74, build.gear, t * (0.4 + run), 1.02);
    c.restore();
    // ひからせる ところ
    if (o.hi) {
      const g = build.gadget;
      const A = { motor: [62, -74, 40], gear: [119, -74, 34], tire: [60, -16, 50], wing: [-240, YT - 24, 50], battery: [-141, -20, 58],
        gadget: g === 'x1' ? [-212, -26, 50] : g === 'x3' ? [-150, YT - 76, 44] : [-276, -72, 44] }[o.hi];
      if (A) {
        c.save(); c.globalAlpha = 0.65 + 0.35 * Math.sin(t * 6);
        c.setLineDash([10, 8]); c.lineDashOffset = -t * 30; K.circle(A[0], A[1], A[2] + 5, null, '#ffd23f', 5); c.restore();
      }
    }
    c.restore();
  };
})();
