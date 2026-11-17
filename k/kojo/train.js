// でんしゃ こうじょう — でんしゃの え（よこむき・みぎへ はしる）
// すがた(0〜3): ふつうの でんしゃ → とっきゅう → はやい とっきゅう → しんかんせん。いろ(0〜4)は ぶひんごと
(function () {
  'use strict';
  const c = K.ctx, sh = K.shade, T = {}; window.KJT = T;
  // じっさいの てつどうがいしゃの いろの くみあわせに ならない よう、しろい しゃたいの おびは 2しょくの ぼかしに する
  T.COLS = ['#d8483c', '#2f7fc4', '#2f9a66', '#f08a2a', '#8a5ad0'];
  const COL2 = ['#f0b53a', '#35c6c0', '#b6d84a', '#e8508a', '#3fb0e8'];
  const TOP = -84, BOT = -14, REAR = -150;
  // かおの かたち: [うえの まえはし, さきっぽx, さきっぽy, したの まえはし]
  const NOSE = [[104, 112, -50, 112], [92, 136, -34, 132], [78, 192, -30, 178], [58, 250, -25, 226]];
  const line = (x0, y0, x1, y1) => { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
  const poly = (pts, fill, stroke, lw) => {
    c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 2; c.stroke(); }
  };
  // tail=うしろの すがた(2,3 は ながれる かたち)
  function bodyPath(f, tail) {
    const n = NOSE[f];
    c.beginPath();
    c.moveTo(REAR + (tail >= 2 ? 20 : 12), TOP);
    c.lineTo(n[0], TOP);
    if (f === 0) { c.quadraticCurveTo(n[1], TOP, n[1], TOP + 12); c.lineTo(n[3], BOT); }
    else { c.quadraticCurveTo((n[0] + n[1]) / 2 + 10, TOP + 2, n[1], n[2]); c.quadraticCurveTo(n[1] + 2, BOT - 4, n[3], BOT); }
    if (tail >= 2) { const L = tail === 3 ? 96 : 50; c.lineTo(REAR - L * 0.8, BOT); c.quadraticCurveTo(REAR - L - 2, BOT - 4, REAR - L, -28); c.quadraticCurveTo(REAR - L * 0.45, TOP + 2, REAR + 20, TOP); }
    else { c.lineTo(REAR, BOT); c.lineTo(REAR, TOP + 12); c.quadraticCurveTo(REAR, TOP, REAR + 12, TOP); }
    c.closePath();
  }
  function paintBody(b, f, tail, ac, ac2, t) {
    const main = ['#aab3c2', ac, '#f3ead2', '#f7f9fc'][b];
    const g = c.createLinearGradient(0, TOP, 0, BOT); g.addColorStop(0, sh(main, 0.3)); g.addColorStop(0.5, main); g.addColorStop(1, sh(main, b === 3 ? -0.16 : -0.34));
    bodyPath(f, tail); c.fillStyle = g; c.fill();
    c.save(); bodyPath(f, tail); c.clip();
    if (b === 0) { c.fillStyle = ac; c.fillRect(-300, -40, 700, 7); }
    if (b === 1) { c.fillStyle = '#ffffff'; c.fillRect(-300, -43, 700, 11); c.fillStyle = sh(ac, 0.5); c.fillRect(-300, -27, 700, 4); }
    if (b === 2) { c.fillStyle = ac; c.fillRect(-300, -44, 700, 40); c.fillStyle = '#d9a520'; c.fillRect(-300, -47, 700, 4); }
    if (b === 3) {
      const gb = c.createLinearGradient(-250, 0, 260, 0); gb.addColorStop(0, ac2); gb.addColorStop(1, ac);
      c.fillStyle = gb; c.fillRect(-300, -41, 700, 13); c.fillStyle = '#d9a520'; c.fillRect(-300, -26, 700, 3);
      const sx = ((t * 0.45) % 1) * 700 - 300; c.globalAlpha = 0.55; poly([[sx, TOP], [sx + 30, TOP], [sx, BOT], [sx - 30, BOT]], '#ffffff'); c.globalAlpha = 1;
    }
    c.restore();
    return main;
  }
  function windows(b, f) {
    const g = c.createLinearGradient(0, -74, 0, -46); g.addColorStop(0, '#22344f'); g.addColorStop(1, '#4f7fb0');
    if (b === 3) { for (let i = 0; i < 9; i++) K.rr(-136 + i * 23, -70, 17, 19, 5, g, '#8a95a8', 1.5); }
    else {
      if (b >= 1) K.rr(-136, -75, 206, 29, 6, '#141c2b');
      for (let i = 0; i < 4; i++) K.rr(-132 + i * 51, -72, 43, 23, 4, g, b >= 1 ? null : '#39445a', 1.5);
      c.fillStyle = 'rgba(255,255,255,0.28)'; for (let i = 0; i < 4; i++) c.fillRect(-128 + i * 51, -70, 14, 5);
    }
    const n = NOSE[f];                                                             // まえの まど
    if (f === 0) K.rr(82, -74, 24, 28, 4, g, '#141c2b', 2);
    else if (f === 3) poly([[n[0] + 6, -79], [n[0] + 34, -76], [n[0] + 78, -60], [n[0] + 30, -60]], g, '#141c2b', 2);
    else poly([[n[0] - 8, -76], [n[0] + 12, -75], [n[0] + (n[1] - n[0]) * 0.55, -52], [n[0] - 8, -52]], g, '#141c2b', 2);
  }
  function faceTrim(f, ac, ac2) {
    const n = NOSE[f];
    if (f === 1) { c.strokeStyle = ac; c.lineWidth = 5; line(n[0] + 6, -46, n[1] - 4, -40); }
    if (f === 2) poly([[n[1] - 44, n[2] - 4], [n[1] + 2, n[2] + 1], [n[1] - 30, BOT - 2], [n[0] + 20, BOT - 2]], ac, sh(ac, -0.5), 1.5);
    if (f === 3) { const g = c.createLinearGradient(n[0], 0, n[1], 0); g.addColorStop(0, ac2); g.addColorStop(1, ac); poly([[n[0] + 4, -41], [n[1] - 30, -34], [n[1] + 1, n[2] + 1], [n[1] - 26, BOT - 3], [n[0] + 4, -28]], g, sh(ac, -0.45), 1.5); }
  }
  function back(r, ac, t, sp) {
    if (r === 0) { K.rr(REAR - 10, -34, 12, 12, 2, '#59647a', '#2b313b', 1.5); return; }
    if (r === 1) { K.rr(REAR - 8, -40, 10, 22, 3, '#59647a', '#2b313b', 1.5); K.circle(REAR + 9, -66, 5, '#ff5a4a', '#7a1d16', 1.5); K.circle(REAR + 9, -30, 5, ac, sh(ac, -0.5), 1.5); return; }
    const L = r === 3 ? 96 : 50;
    K.circle(REAR - L + 12, -30, 5, '#ff5a4a', '#7a1d16', 1.5);
    poly([[REAR - L * 0.55, -66], [REAR - L * 0.2, -75], [REAR - 4, -75], [REAR - 4, -60]], '#2a3d5c', '#141c2b', 2);
    if (r === 3) for (let i = 0; i < 3; i++) { const q = (t * 1.5 + i / 3) % 1; c.save(); c.globalAlpha = (1 - q) * 0.5 * sp; c.strokeStyle = '#ffffff'; c.lineWidth = 3; line(REAR - L - 10 - q * 90, -64 + i * 20, REAR - L - 50 - q * 120, -64 + i * 20); c.restore(); }
  }
  function roof(r, ac) {
    K.rr(-20, TOP - 9, 58, 10, 3, '#c9d2e0', '#6b7384', 1.5);                      // れいぼうの はこ
    c.strokeStyle = '#4a5468'; c.lineWidth = 3;
    if (r === 0) { line(-78, TOP, -62, TOP - 16); line(-62, TOP - 16, -78, TOP - 30); line(-96, TOP - 30, -60, TOP - 30); return; }
    line(-70, TOP - (r >= 2 ? 6 : 0), -98, TOP - 26); line(-112, TOP - 26, -84, TOP - 26);       // うでが 1ぽんの パンタグラフ
    if (r === 1) K.rr(-78, TOP - 6, 20, 7, 2, ac, sh(ac, -0.5), 1.5);
    if (r >= 2) { poly([[-66, TOP], [-44, TOP - 13], [-8, TOP - 13], [6, TOP]], r === 3 ? '#eef2f7' : ac, r === 3 ? '#8a95a8' : sh(ac, -0.5), 2); poly([[-128, TOP], [-116, TOP - 11], [-98, TOP]], r === 3 ? '#eef2f7' : ac, r === 3 ? '#8a95a8' : sh(ac, -0.5), 2); }
    if (r === 3) { poly([[52, TOP], [66, TOP - 20], [84, TOP]], ac, sh(ac, -0.5), 2); c.fillStyle = ac; c.fillRect(-60, TOP - 5, 60, 3); }
  }
  const WR = [11, 13, 15, 14];
  function wheel(x, r, ac, rot, t) {
    const R = WR[r], y = -R, hub = r === 0 ? '#aab3c2' : ac;
    K.circle(x, y, R, '#23282f', '#0f1318', 2); K.circle(x, y, R * 0.68, hub, sh(hub, -0.45), 1.5);
    c.strokeStyle = sh(hub, -0.5); c.lineWidth = 2;
    const n = r === 0 ? 3 : 5; for (let i = 0; i < n; i++) { const a = rot + i * Math.PI * 2 / n; line(x, y, x + Math.cos(a) * R * 0.6, y + Math.sin(a) * R * 0.6); }
    K.circle(x, y, R * 0.2, '#2b313b');
    if (r === 2) { c.save(); c.globalAlpha = 0.3 + 0.2 * Math.sin(t * 9 + x); K.circle(x, y, R * 1.3, null, sh(ac, 0.5), 3.5); c.restore(); }
  }
  // こわれた（ゆるんだ）ところ: ばんそうこう と けむり
  const SPOT = { face: f => [NOSE[f][1] - 46, -52], body: () => [-20, -52], wheel: () => [-92, -16], roof: () => [-40, -92], back: () => [REAR + 16, -50], light: f => [NOSE[f][1] - 22, -34] };
  function hurt(x, y, t, i) {
    for (let k = 0; k < 3; k++) { const q = (t * 0.7 + k / 3 + i * 0.4) % 1; c.save(); c.globalAlpha = (1 - q) * 0.6; K.circle(x - q * 34, y - 14 - q * 60, 9 + q * 14, '#6b7384'); c.restore(); }
    c.save(); c.translate(x, y); for (const a of [0.6, -0.6]) { c.save(); c.rotate(a); K.rr(-20, -6, 40, 12, 5, '#f6dcae', '#8a6a3a', 2); c.restore(); } c.restore();
  }
  // (x,y)= からだの まんなかの せんろの たかさ。lk={face,body,wheel,roof,back,light}（すがた 0〜3）
  // o.cols={slot: いろ 0〜4} / o.pal=あいての いろ / o.broken=[slot] / o.flash / o.speed / o.dist
  T.draw = function (x, y, k, lk, t, o) {
    o = o || {}; const sp = o.speed == null ? 0.5 : o.speed, f = lk.face, n = NOSE[f], rot = (o.dist || t * 6) * 0.9, cs = o.cols || {};
    const col = s => o.pal ? o.pal.stripe : T.COLS[cs[s] == null ? 1 : cs[s]], col2 = s => o.pal ? o.pal.stripe : COL2[cs[s] == null ? 1 : cs[s]];
    const tail = lk.back, br = o.broken || [];
    c.save(); c.translate(x, y + Math.sin(t * 17) * 0.8 * sp); if (br.length) c.rotate(Math.sin(t * 5) * 0.012); c.scale(k, k); c.lineJoin = 'round';
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(20, 3, 200, 7, 0, 0, 7); c.fill();
    if (lk.light >= 2) { const g = c.createRadialGradient(10, 0, 10, 10, 0, 200); g.addColorStop(0, lk.light === 3 ? 'rgba(170,230,255,0.85)' : 'rgba(110,230,255,0.55)'); g.addColorStop(1, 'rgba(110,230,255,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(10, 0, 200, 13, 0, 0, 7); c.fill(); }
    back(tail, col('back'), t, sp);
    let main;
    if (o.pal) { const g = c.createLinearGradient(0, TOP, 0, BOT); g.addColorStop(0, sh(o.pal.main, 0.3)); g.addColorStop(1, sh(o.pal.main, -0.35)); bodyPath(f, tail); c.fillStyle = g; c.fill(); c.save(); bodyPath(f, tail); c.clip(); c.fillStyle = o.pal.stripe; c.fillRect(-300, -40, 700, 7); c.restore(); main = o.pal.main; }
    else main = paintBody(lk.body, f, tail, col('body'), col2('body'), t);
    windows(o.pal ? 1 : lk.body, f); faceTrim(f, col('face'), col2('face'));
    bodyPath(f, tail); c.strokeStyle = sh(main, lk.body === 3 && !o.pal ? -0.45 : -0.62); c.lineWidth = 3; c.stroke();
    c.strokeStyle = sh(main, -0.4); c.lineWidth = 1.5; for (const dx of [-82, 22]) { line(dx, -44, dx, BOT); line(dx + 22, -44, dx + 22, BOT); }
    roof(lk.roof, col('roof'));
    const x0 = tail >= 2 ? REAR - (tail === 3 ? 70 : 34) : REAR + 4;
    K.rr(x0, BOT, n[3] - x0 - 10, 9, 3, '#2b313b');
    for (const wx of [-112, -72, 38, 78]) wheel(wx, lk.wheel, col('wheel'), rot, t);
    if (lk.wheel === 3) { const wc = col('wheel'); for (const bx of [-134, 16]) { K.rr(bx, -22, 84, 17, 6, '#eef2f7', '#8a95a8', 2); c.fillStyle = wc; c.fillRect(bx + 6, -12, 72, 3); } c.save(); c.globalAlpha = 0.5 + 0.3 * Math.sin(t * 8); c.fillStyle = '#9fe6ff'; c.fillRect(-140, -3, 250, 3); c.restore(); }
    const hx = n[1] - (f === 0 ? 2 : f === 3 ? 34 : 12), hy = f === 0 ? -30 : n[2] + (f === 3 ? -8 : 4);     // まえの あかり
    if (lk.light >= 1) { const L = [0, 130, 190, 250][lk.light], gb = c.createLinearGradient(hx, 0, hx + L, 0); gb.addColorStop(0, lk.light === 3 ? 'rgba(235,248,255,0.85)' : 'rgba(255,244,170,0.75)'); gb.addColorStop(1, 'rgba(255,244,170,0)'); poly([[hx, hy - 4], [hx + L, hy - 34], [hx + L, hy + 30], [hx, hy + 4]], gb); }
    K.circle(hx, hy, lk.light ? 7 : 5, lk.light === 3 ? '#ffffff' : lk.light ? '#fff6c8' : '#ffe27a', '#7a5410', 1.5);
    if (lk.light === 3) { K.circle(hx - 16, hy - 5, 5, '#ffffff', '#7a5410', 1.5); for (let i = 0; i < 5; i++) { const q = (t * 0.9 + i / 5) % 1; c.save(); c.globalAlpha = 1 - q; K.star(REAR - 60 - q * 150, -30 - 40 * Math.sin(i * 2.1 + q * 4), 5, '#bfeaff'); c.restore(); } }
    br.forEach((s, i) => { const p = SPOT[s](f); hurt(p[0], p[1], t, i); });
    if (o.flash > 0) { c.save(); c.globalAlpha = Math.min(1, o.flash) * 0.8; bodyPath(f, tail); c.fillStyle = '#ffffff'; c.fill(); c.restore(); }
    c.restore();
  };
  // ぶひんの ふだに かく え（その ぶひんの あたりを おおきく）
  const FOCUS = { face: r => [(NOSE[r][0] + NOSE[r][1]) / 2 - 8, -50, 130 + (NOSE[r][1] - NOSE[r][0]) * 0.9], body: () => [-30, -48, 250], wheel: () => [-92, -18, 110], roof: () => [-60, -100, 190], back: r => [REAR - [0, 0, 20, 40][r], -48, 130 + [0, 0, 40, 80][r]], light: r => [NOSE[0][1] + 30 + r * 16, -30, 150 + r * 30] };
  T.icon = function (slot, rank, cx, cy, w, h, t, col) {
    const lk = { face: 0, body: 0, wheel: 0, roof: 0, back: 0, light: 0 }; lk[slot] = rank;
    const [fx, fy, span] = FOCUS[slot](rank), k = w / span;
    c.save(); c.beginPath(); c.rect(cx - w / 2, cy - h / 2, w, h); c.clip();
    T.draw(cx - fx * k, cy - fy * k, k, lk, t, { speed: 0.3, cols: { [slot]: col == null ? 1 : col } });
    c.restore();
  };
})();
