// でんしゃ こうじょう — でんしゃの え（よこむき・みぎへ はしる）。ぶひんの よさ(0〜3)で すがたが かわる
(function () {
  'use strict';
  const c = K.ctx, sh = K.shade, T = {}; window.KJT = T;
  const PAL = [
    { main: '#8f9bb0', stripe: '#e8ecf3' }, { main: '#2f7fc4', stripe: '#ffffff' },
    { main: '#7a52c8', stripe: '#ffd23f' }, { main: '#f0b53a', stripe: '#d8483c' },
  ];
  const TOP = -84, BOT = -14, REAR = -150;
  // かおの かたち: [うえの まえはし, さきっぽx, さきっぽy, したの まえはし]
  const NOSE = [[104, 112, -50, 112], [92, 136, -34, 132], [78, 192, -30, 178], [70, 240, -27, 220]];
  T.frontX = r => NOSE[r][1];
  const line = (x0, y0, x1, y1) => { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
  const poly = (pts, fill, stroke, lw) => {
    c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 2; c.stroke(); }
  };
  function bodyPath(f) {
    const n = NOSE[f];
    c.beginPath(); c.moveTo(REAR + 12, TOP); c.lineTo(n[0], TOP);
    if (f === 0) { c.quadraticCurveTo(n[1], TOP, n[1], TOP + 12); c.lineTo(n[3], BOT); }
    else { c.quadraticCurveTo((n[0] + n[1]) / 2 + 10, TOP + 2, n[1], n[2]); c.quadraticCurveTo(n[1] + 2, BOT - 4, n[3], BOT); }
    c.lineTo(REAR, BOT); c.lineTo(REAR, TOP + 12); c.quadraticCurveTo(REAR, TOP, REAR + 12, TOP); c.closePath();
  }
  function flame(x, y, len, w, cols, t) {
    for (let i = 0; i < cols.length; i++) {
      const l = len * (1 - i * 0.26) * (0.86 + 0.14 * Math.sin(t * 31 + i * 2)), ww = w * (1 - i * 0.24);
      c.beginPath(); c.moveTo(x, y - ww); c.quadraticCurveTo(x - l * 0.5, y - ww * 1.1, x - l, y); c.quadraticCurveTo(x - l * 0.5, y + ww * 1.1, x, y + ww); c.closePath();
      c.fillStyle = cols[i]; c.fill();
    }
  }
  function back(r, t, sp) {
    if (r === 0) { K.rr(REAR - 10, -34, 12, 12, 2, '#59647a', '#2b313b', 1.5); return; }
    if (r === 1) {
      K.rr(REAR - 26, -40, 30, 16, 5, '#aab3c2', '#4a5468', 2); K.rr(REAR - 32, -42, 8, 20, 3, '#6b7384', '#2b313b', 1.5);
      c.save(); for (let i = 0; i < 3; i++) { const q = (t * 1.6 + i / 3) % 1; c.globalAlpha = (1 - q) * 0.5; K.circle(REAR - 38 - q * 46, -34 - q * 20, 6 + q * 9, '#ffffff'); } c.restore(); return;
    }
    if (r === 2) {
      for (const y of [-64, -34]) { flame(REAR - 30, y, 46 + sp * 50, 8, ['#ff8a2a', '#ffd23f', '#fff6c8'], t + y); K.rr(REAR - 34, y - 11, 42, 22, 7, '#9a6ad8', '#3d2a66', 2); K.rr(REAR - 38, y - 13, 9, 26, 3, '#59647a', '#2b313b', 1.5); }
      return;
    }
    const hue = (t * 160) % 360;
    flame(REAR - 46, -50, 96 + sp * 80, 21, [`hsl(${hue},95%,60%)`, `hsl(${(hue + 60) % 360},95%,64%)`, '#ffd23f', '#ffffff'], t);
    poly([[REAR + 6, -78], [REAR - 34, -70], [REAR - 52, -76], [REAR - 52, -24], [REAR - 34, -30], [REAR + 6, -22]], '#f0b53a', '#7a5410', 2.5);
    K.rr(REAR - 30, -66, 10, 32, 3, '#fff3c4'); poly([[REAR - 8, -78], [REAR - 34, -108], [REAR - 46, -108], [REAR - 30, -74]], '#d8483c', '#6b1d16', 2);
  }
  function roof(r, t) {
    K.rr(-20, TOP - 9, 58, 10, 3, '#c9d2e0', '#6b7384', 1.5);                      // れいぼうの はこ
    if (r === 0) { c.strokeStyle = '#4a5468'; c.lineWidth = 3; line(-78, TOP, -62, TOP - 16); line(-62, TOP - 16, -78, TOP - 30); line(-96, TOP - 30, -60, TOP - 30); return; }
    const wing = (x, y, w, col, plate) => {
      c.strokeStyle = '#59647a'; c.lineWidth = 5; line(x - w * 0.25, TOP, x - w * 0.3, y + 4); line(x + w * 0.2, TOP, x + w * 0.15, y + 4);
      poly([[x - w / 2, y - 4], [x + w / 2 - 12, y - 9], [x + w / 2, y + 2], [x - w / 2, y + 5]], col, sh(col, -0.55), 2);
      if (plate) { K.rr(x - w / 2 - 5, y - 16, 9, 26, 3, plate, sh(plate, -0.5), 1.5); }
    };
    if (r === 1) wing(-100, TOP - 22, 70, '#3f8fd8');
    if (r === 2) { wing(-96, TOP - 32, 96, '#9a6ad8', '#ffd23f'); wing(-86, TOP - 14, 66, '#c9b2f0'); }
    if (r === 3) {
      wing(-92, TOP - 46, 124, '#f0b53a', '#d8483c'); wing(-84, TOP - 22, 84, '#fff3c4', '#d8483c');
      c.strokeStyle = '#8a95a8'; c.lineWidth = 3; line(54, TOP - 9, 60, TOP - 44);
      K.star(60, TOP - 50, 13 + 2 * Math.sin(t * 6), '#ffd23f');
    }
  }
  const WR = [11, 13, 15, 16], WCOL = ['#aab3c2', '#3f8fd8', '#9a6ad8', '#f0b53a'];
  function wheel(x, r, rot, t) {
    const R = WR[r], y = -R, hub = WCOL[r];
    if (r >= 2) { c.save(); c.globalAlpha = 0.35 + 0.2 * Math.sin(t * 9 + x); K.circle(x, y, R * 1.35, null, r === 3 ? '#ffe9a3' : '#cdb4ff', 4); c.restore(); }
    K.circle(x, y, R, '#23282f', '#0f1318', 2); K.circle(x, y, R * 0.68, hub, sh(hub, -0.45), 1.5);
    c.strokeStyle = sh(hub, -0.5); c.lineWidth = 2;
    const n = r === 0 ? 3 : 5; for (let i = 0; i < n; i++) { const a = rot + i * Math.PI * 2 / n; line(x, y, x + Math.cos(a) * R * 0.6, y + Math.sin(a) * R * 0.6); }
    K.circle(x, y, R * 0.2, r === 3 ? '#fff3c4' : '#2b313b');
    if (r === 3) for (let i = 0; i < 2; i++) { const q = (t * 3 + i * 0.5 + x * 0.01) % 1; c.save(); c.globalAlpha = 1 - q; K.star(x - 10 - q * 38, -3 - q * 14, 5, '#ffd23f'); c.restore(); }
  }
  function stripe(b, f, t, pal) {
    c.save(); bodyPath(f); c.clip();
    if (b === 0) { c.fillStyle = pal.stripe; c.fillRect(REAR, -40, 420, 6); }
    if (b === 1) { c.fillStyle = pal.stripe; c.fillRect(REAR, -42, 420, 10); c.fillStyle = '#9fd0ff'; c.fillRect(REAR, -28, 420, 4); }
    if (b === 2) { const p = [[REAR, -40]]; for (let i = 0; i < 9; i++) p.push([REAR + 30 + i * 44, i % 2 ? -42 : -26]); p.push([280, -34], [280, -22]); for (let i = 8; i >= 0; i--) p.push([REAR + 22 + i * 44, i % 2 ? -32 : -17]); p.push([REAR, -30]); poly(p, pal.stripe, '#8a5a00', 1.5); }
    if (b === 3) {
      for (let i = 0; i < 5; i++) { const x0 = 150 - i * 62; poly([[x0 + 60, -16], [x0 + 30, -44 - (i % 2) * 8], [x0 + 16, -28], [x0 - 8, -50], [x0 - 20, -16]], i % 2 ? '#ff8a2a' : pal.stripe); }
      const sx = ((t * 0.5) % 1) * 560 - 220; c.globalAlpha = 0.5; poly([[sx, TOP], [sx + 34, TOP], [sx + 4, BOT], [sx - 30, BOT]], '#ffffff'); c.globalAlpha = 1;
    }
    c.restore();
  }
  function windows(b, f) {
    const g = c.createLinearGradient(0, -74, 0, -46); g.addColorStop(0, '#22344f'); g.addColorStop(1, '#4f7fb0');
    if (b >= 1) K.rr(-136, -75, 206, 29, 6, '#141c2b');
    for (let i = 0; i < 4; i++) K.rr(-132 + i * 51, -72, 43, 23, 4, g, b >= 1 ? null : '#39445a', 1.5);
    c.fillStyle = 'rgba(255,255,255,0.28)'; for (let i = 0; i < 4; i++) c.fillRect(-128 + i * 51, -70, 14, 5);
    const n = NOSE[f];                                                             // まえの まど
    if (f === 0) K.rr(82, -74, 24, 28, 4, g, '#141c2b', 2);
    else poly([[n[0] - 8, -76], [n[0] + 12, -75], [n[0] + (n[1] - n[0]) * 0.55, -52], [n[0] - 8, -52]], g, '#141c2b', 2);
  }
  // (x,y)= からだの まんなかの せんろの たかさ。lk={face,body,wheel,roof,back,light}
  T.draw = function (x, y, k, lk, t, o) {
    o = o || {}; const sp = o.speed == null ? 0.5 : o.speed, f = lk.face, pal = o.pal || PAL[lk.body], n = NOSE[f], rot = (o.dist || t * 6) * 0.9;
    c.save(); c.translate(x, y + Math.sin(t * 17) * 0.8 * sp); c.scale(k, k); c.lineJoin = 'round';
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(20, 3, 190, 7, 0, 0, 7); c.fill();
    if (lk.light >= 2) { const g = c.createRadialGradient(10, 0, 10, 10, 0, 190); g.addColorStop(0, lk.light === 3 ? 'rgba(255,220,120,0.75)' : 'rgba(110,230,255,0.6)'); g.addColorStop(1, 'rgba(110,230,255,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(10, 0, 190, 13, 0, 0, 7); c.fill(); }
    if (lk.light === 3) { c.save(); c.shadowColor = `hsl(${(t * 120) % 360},95%,65%)`; c.shadowBlur = 34; bodyPath(f); c.fillStyle = pal.main; c.fill(); c.restore(); }
    back(lk.back, t, sp);
    const g = c.createLinearGradient(0, TOP, 0, BOT); g.addColorStop(0, sh(pal.main, 0.32)); g.addColorStop(0.45, pal.main); g.addColorStop(1, sh(pal.main, -0.38));
    bodyPath(f); c.fillStyle = g; c.fill();
    stripe(lk.body, f, t, pal); windows(lk.body, f);
    bodyPath(f); c.strokeStyle = sh(pal.main, -0.62); c.lineWidth = 3; c.stroke();
    if (f === 3) { poly([[n[1] - 46, n[2] - 2], [n[1] + 6, n[2] + 1], [n[1] - 40, BOT - 2]], '#fff3c4', '#7a5410', 2); poly([[96, TOP + 1], [120, TOP - 24], [142, TOP + 12]], '#d8483c', '#6b1d16', 2); }
    if (f === 2) poly([[n[1] - 30, n[2] - 3], [n[1] + 3, n[2] + 1], [n[1] - 26, BOT - 2]], '#ffd23f', '#8a5a00', 1.5);
    c.strokeStyle = sh(pal.main, -0.5); c.lineWidth = 1.5; for (const dx of [-82, 22]) { line(dx, -44, dx, BOT); line(dx + 22, -44, dx + 22, BOT); }
    roof(lk.roof, t);
    K.rr(REAR + 4, BOT, n[3] - REAR - 14, 9, 3, '#2b313b');
    for (const wx of [-112, -72, 38, 78]) wheel(wx, lk.wheel, rot, t);
    const hx = n[1] - (f === 0 ? 2 : 12), hy = f === 0 ? -30 : n[2] + 4;                 // まえの あかり
    if (lk.light >= 1) { const L = lk.light === 1 ? 130 : 190, gb = c.createLinearGradient(hx, 0, hx + L, 0); gb.addColorStop(0, 'rgba(255,244,170,0.75)'); gb.addColorStop(1, 'rgba(255,244,170,0)'); poly([[hx, hy - 4], [hx + L, hy - 34], [hx + L, hy + 30], [hx, hy + 4]], gb); }
    K.circle(hx, hy, lk.light ? 7 : 5, lk.light ? '#fff6c8' : '#ffe27a', '#7a5410', 1.5);
    if (lk.light === 3) for (let i = 0; i < 6; i++) { const q = (t * 0.9 + i / 6) % 1; c.save(); c.globalAlpha = 1 - q; K.star(REAR - q * 150, -30 - 46 * Math.sin(i * 2.1 + q * 4), 6, `hsl(${(i * 60 + t * 120) % 360},95%,70%)`); c.restore(); }
    if (o.flash > 0) { c.save(); c.globalAlpha = Math.min(1, o.flash) * 0.8; bodyPath(f); c.fillStyle = '#ffffff'; c.fill(); c.restore(); }
    c.restore();
  };
  // ぶひんの ふだに かく え（その ぶひんの あたりを おおきく）
  const FOCUS = { face: r => [(NOSE[r][0] + NOSE[r][1]) / 2 - 8, -50, 130 + (NOSE[r][1] - NOSE[r][0]) * 0.9], body: () => [-30, -48, 250], wheel: () => [-92, -18, 100], roof: r => [-80, -108 - r * 6, 170 + r * 14], back: r => [REAR - 22 - r * 12, -50, 120 + r * 34], light: r => [NOSE[0][1] + 30 + r * 16, -30, 150 + r * 30] };
  T.icon = function (slot, rank, cx, cy, w, h, t) {
    const lk = { face: 0, body: 0, wheel: 0, roof: 0, back: 0, light: 0 }; lk[slot] = rank;
    const [fx, fy, span] = FOCUS[slot](rank), k = w / span;
    c.save(); c.beginPath(); c.rect(cx - w / 2, cy - h / 2, w, h); c.clip();
    T.draw(cx - fx * k, cy - fy * k, k, lk, t, { speed: 0.3 });
    c.restore();
  };
})();
