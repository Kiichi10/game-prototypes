// でんしゃ こうじょう — けしき・きかい・いた・おす ところ
(function () {
  'use strict';
  const c = K.ctx, sh = K.shade, W = K.W, S = {}; window.KJS = S;
  S.GY = 204; S.RAIL1 = 244; S.RAIL2 = 352; S.SCENE_H = 400;
  const WD = [
    { sky: ['#5e9fd8', '#cfe9f5'], far: '#7fb58a', gnd: '#7aa55f', gnd2: '#6a954f', kind: 'tree' },
    { sky: ['#6f8fc4', '#e6d9c8'], far: '#8793b0', gnd: '#9aa3ae', gnd2: '#858e9a', kind: 'bldg' },
    { sky: ['#8fc4e8', '#f2fbff'], far: '#b9dcef', gnd: '#e9f5fb', gnd2: '#cfe6f2', kind: 'ice' },
    { sky: ['#e58a5a', '#ffe2b0'], far: '#8a6a7a', gnd: '#8f9a6a', gnd2: '#7a8558', kind: 'mount' },
    { sky: ['#f0b06a', '#ffeecb'], far: '#d9a26a', gnd: '#e6c48a', gnd2: '#d4b074', kind: 'cactus' },
    { sky: ['#0d1230', '#3a2a66'], far: '#2a2350', gnd: '#4a4078', gnd2: '#3d3466', kind: 'space' },
  ];
  const rnd = i => { const x = Math.sin(i * 127.1 + 3.3) * 43758.5; return x - Math.floor(x); };
  function thing(kind, x, y, i) {
    const r = rnd(i), s = 0.8 + r * 0.6;
    const m3 = ((i % 3) + 3) % 3;
    if (kind === 'tree') { K.rr(x - 5, y - 30 * s, 10, 30 * s, 2, '#7a5a3a'); K.circle(x, y - 46 * s, 26 * s, '#4f9a5a'); K.circle(x - 14 * s, y - 34 * s, 18 * s, '#5aa866'); K.circle(x + 13 * s, y - 36 * s, 17 * s, '#449050'); }
    if (kind === 'bldg') { const h = 70 + r * 90, w = 62 + rnd(i + 9) * 40, col = ['#c9b79a', '#a9b6c9', '#d9c3b0'][m3]; K.rr(x - w / 2, y - h, w, h, 3, col, sh(col, -0.35), 2); c.fillStyle = '#5f7fa8'; for (let yy = y - h + 12; yy < y - 14; yy += 24) for (let xx = x - w / 2 + 9; xx < x + w / 2 - 14; xx += 20) c.fillRect(xx, yy, 11, 13); }
    if (kind === 'ice') { c.beginPath(); c.moveTo(x - 30 * s, y); c.lineTo(x - 8 * s, y - 80 * s); c.lineTo(x + 6 * s, y - 50 * s); c.lineTo(x + 18 * s, y - 66 * s); c.lineTo(x + 34 * s, y); c.closePath(); c.fillStyle = '#a9dcf2'; c.fill(); c.strokeStyle = '#7fbfe0'; c.lineWidth = 2; c.stroke(); }
    if (kind === 'mount') { c.beginPath(); c.moveTo(x - 90 * s, y); c.lineTo(x, y - 120 * s); c.lineTo(x + 90 * s, y); c.closePath(); c.fillStyle = '#6f7a5a'; c.fill(); c.beginPath(); c.moveTo(x - 22 * s, y - 90 * s); c.lineTo(x, y - 120 * s); c.lineTo(x + 22 * s, y - 90 * s); c.lineTo(x + 6 * s, y - 98 * s); c.lineTo(x - 8 * s, y - 88 * s); c.closePath(); c.fillStyle = '#f6f2ea'; c.fill(); }
    if (kind === 'cactus') { K.rr(x - 8 * s, y - 64 * s, 16 * s, 64 * s, 8 * s, '#5a9a5a', '#3f7a44', 2); K.rr(x - 26 * s, y - 44 * s, 12 * s, 26 * s, 6 * s, '#5a9a5a', '#3f7a44', 2); K.rr(x + 14 * s, y - 52 * s, 12 * s, 24 * s, 6 * s, '#5a9a5a', '#3f7a44', 2); }
    if (kind === 'space') { const col = ['#e88a6a', '#8ad0e8', '#e8d08a'][m3]; K.circle(x, y - 110 - r * 50, 22 * s, col, sh(col, -0.4), 2); if (Math.abs(i) % 2) { c.strokeStyle = '#fff3c4'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y - 110 - r * 50, 36 * s, 8 * s, -0.3, 0, 7); c.stroke(); } }
  }
  function rail(y, off, k) {
    c.fillStyle = '#8f8576'; c.fillRect(0, y - 3 * k, W, 22 * k);
    c.fillStyle = '#655846'; const st = 38 * k; for (let x = -((off % st) + st) % st; x < W; x += st) c.fillRect(x + 6 * k, y, 20 * k, 15 * k);
    c.fillStyle = '#c3cad6'; c.fillRect(0, y - 3 * k, W, 4 * k); c.fillStyle = '#6b7384'; c.fillRect(0, y + 13 * k, W, 4 * k);
  }
  // world=0〜5, dist=すすんだ きょり
  S.bg = function (world, dist, t) {
    const d = WD[world], g = c.createLinearGradient(0, 0, 0, S.GY); g.addColorStop(0, d.sky[0]); g.addColorStop(1, d.sky[1]);
    c.fillStyle = g; c.fillRect(0, 0, W, S.SCENE_H);
    if (d.kind === 'space') { c.fillStyle = '#ffffff'; for (let i = 0; i < 60; i++) { const x = ((rnd(i) * 1400 - dist * 0.02) % 1400 + 1400) % 1400 - 60; c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i)); c.fillRect(x, rnd(i + 50) * 190, 3, 3); } c.globalAlpha = 1; }
    else { c.fillStyle = 'rgba(255,255,255,0.65)'; for (let i = 0; i < 4; i++) { const x = ((i * 380 - dist * 0.03 + t * 6) % 1600 + 1600) % 1600 - 160, y = 40 + (i % 2) * 44; c.beginPath(); c.ellipse(x, y, 66, 18, 0, 0, 7); c.ellipse(x + 34, y - 11, 42, 16, 0, 0, 7); c.fill(); } }
    c.fillStyle = d.far; c.beginPath(); c.moveTo(0, S.GY);
    for (let x = 0; x <= W; x += 40) { const u = x + dist * 0.08; c.lineTo(x, S.GY - 46 - Math.sin(u * 0.006) * 26 - Math.sin(u * 0.017) * 12); }
    c.lineTo(W, S.GY); c.closePath(); c.fill();
    const sp = 250, o = dist * 0.35, i0 = Math.floor(o / sp);
    for (let i = i0 - 1; i < i0 + 7; i++) thing(d.kind, i * sp - o + rnd(i + 3) * 90, S.GY + 4, i);
    c.fillStyle = d.gnd; c.fillRect(0, S.GY, W, S.SCENE_H - S.GY);
    c.fillStyle = d.gnd2; for (let i = 0; i < 9; i++) { const x = ((i * 170 - dist * 0.8) % 1530 + 1530) % 1530 - 120; c.beginPath(); c.ellipse(x, 296 + (i % 3) * 8, 46, 6, 0, 0, 7); c.fill(); }
    rail(S.RAIL1, dist * 0.8, 0.8); rail(S.RAIL2, dist, 1.1);
  };
  S.speedLines = function (t, a) {
    c.save(); c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const q = (t * (2.2 + rnd(i)) + rnd(i + 7)) % 1, y = 70 + rnd(i + 20) * 300, x = W - q * (W + 300); c.globalAlpha = a * (0.25 + 0.5 * rnd(i + 2)); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 130 + rnd(i) * 120, y); c.stroke(); }
    c.restore();
  };
  // くらい きんぞくの いた
  S.plate = function (x, y, w, h, o) {
    o = o || {}; const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, o.top || '#fffdf7'); g.addColorStop(1, o.bot || '#f1e9d8');
    K.rr(x, y + 4, w, h, o.r || 12, 'rgba(0,0,0,0.28)'); K.rr(x, y, w, h, o.r || 12, g, o.edge || '#a89c84', o.lw || 2.5);
  };
  // もじ（ふちどり なし。けしきの うえに かく ときだけ stroke を わたす）
  S.t = (s, x, y, size, color, align, stroke) => K.text(s, x, y, size, color, align, stroke || null);
  // ぶひんが はいった はこ（あける まえの どきどき）。リボンの いろ＝ぶひんの よさ
  S.capsule = function (x, y, k, col, t, rays) {
    c.save(); c.translate(x, y);
    if (rays) { c.save(); c.rotate(t * 1.4); c.globalAlpha = 0.5; c.fillStyle = col; for (let i = 0; i < 10; i++) { c.rotate(Math.PI / 5); c.beginPath(); c.moveTo(0, 0); c.lineTo(-22 * k, -150 * k); c.lineTo(22 * k, -150 * k); c.closePath(); c.fill(); } c.restore(); }
    c.rotate(Math.sin(t * 34) * 0.08); c.scale(k, k);
    K.rr(-46, -34, 92, 80, 8, '#d9a866', '#7a5a2a', 4); K.rr(-52, -50, 104, 26, 7, '#e8c088', '#7a5a2a', 4);
    c.fillStyle = col; c.fillRect(-11, -50, 22, 96); c.fillRect(-46, -2, 92, 16);
    c.strokeStyle = sh(col, -0.45); c.lineWidth = 2.5; c.strokeRect(-11, -50, 22, 96);
    for (const d of [-1, 1]) { c.beginPath(); c.ellipse(d * 17, -60, 17, 10, d * 0.5, 0, 7); c.fillStyle = col; c.fill(); c.stroke(); }
    K.circle(0, -56, 8, sh(col, 0.3), sh(col, -0.45), 2.5);
    c.restore();
  };
  S.coin = function (x, y, r) { K.circle(x, y, r, '#f0b53a', '#8a5a00', Math.max(1.5, r * 0.12)); K.circle(x, y, r * 0.66, '#ffd76a'); K.star(x, y, r * 0.42, '#c98a10'); };
  S.box = function (x, y, s) { K.rr(x - s / 2, y - s / 2, s, s, s * 0.12, '#c99a5a', '#7a5a2a', 2); c.fillStyle = '#e8c88a'; c.fillRect(x - s * 0.09, y - s / 2, s * 0.18, s); c.fillStyle = '#7a5a2a'; c.fillRect(x - s / 2, y - s * 0.5, s, 2); };
  // ぶひんを つくる きかい。press=おした あとの うごき(1→0)
  S.machine = function (x, y, t, press, glow) {
    const dn = Math.sin(Math.min(1, press) * Math.PI) * 26;
    K.rr(x - 112, y + 96, 224, 34, 8, '#3b4660', '#1d2433', 3);                       // どだい
    K.rr(x - 96, y - 120, 30, 220, 6, '#e2562f', '#7a2a12', 3); K.rr(x + 66, y - 120, 30, 220, 6, '#e2562f', '#7a2a12', 3);
    K.rr(x - 112, y - 140, 224, 40, 10, '#f07a3a', '#7a2a12', 3);
    for (let i = 0; i < 5; i++) K.circle(x - 80 + i * 40, y - 120, 7, (Math.floor(t * 4) + i) % 5 === 0 || press > 0 ? '#ffe27a' : '#8a5a2a', '#5a2a10', 1.5);
    K.rr(x - 20, y - 100, 40, 46 + dn, 4, '#aab3c2', '#4a5468', 2);                     // おす ぼう
    K.rr(x - 62, y - 56 + dn, 124, 34, 6, '#6b7384', '#2b313b', 3);
    K.rr(x - 70, y + 62, 140, 36, 6, '#55637c', '#2b313b', 3);
    if (glow) { c.save(); c.globalAlpha = 0.35 + 0.3 * Math.sin(t * 6); K.rr(x - 120, y - 148, 240, 286, 14, null, '#ffe27a', 6); c.restore(); }
    S.box(x, y + 34 - (press > 0.5 ? 0 : 0), 54 - dn * 0.5);
    if (press > 0.3 && press < 0.7) for (let i = 0; i < 6; i++) { const a = i * 1.05 + t; K.star(x + Math.cos(a) * 70, y + 30 + Math.sin(a) * 40, 9, '#ffd23f'); }
  };
  // かなづち（しゅうりの しるし）
  S.wrench = function (x, y, k, rot) {
    c.save(); c.translate(x, y + 14 * k); c.rotate(rot); c.scale(k, k);
    K.rr(-5, -34, 10, 50, 4, '#b9824a', '#5a3a1a', 2.5);
    K.rr(-22, -48, 44, 20, 5, '#aab3c2', '#3b4660', 3); K.rr(-26, -45, 8, 14, 2, '#6b7384', '#3b4660', 2);
    c.restore();
  };
  S.finger = function (x, y, t) {
    const b = Math.abs(Math.sin(t * 4)) * 16; c.save(); c.translate(x, y + b);
    K.rr(-13, -44, 26, 52, 13, '#ffe1c2', '#8a5a3a', 3); K.rr(-28, -4, 56, 46, 16, '#ffe1c2', '#8a5a3a', 3); c.restore();
  };
  // おす ところ（ボタンいがい）
  let hits = [], next = [];
  S.hit = (x, y, w, h, fn) => next.push({ x, y, w, h, fn });
  S.flip = () => { hits = next; next = []; };
  K.handlers.down = p => { for (let i = hits.length - 1; i >= 0; i--) { const b = hits[i]; if (p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h) { b.fn(p); return; } } };
})();
