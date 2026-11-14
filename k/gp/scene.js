// でんしゃ グランプリ — コースの え（ななめ うえから みた サーキット）
// うごかない ぶぶん（じめん・けしき・コース）は さきに 1まいの えに かいて おく。
(function () {
  'use strict';
  const TRK = window.TRK, KY = TRK.KY, KZ = TRK.KZ, HALF = TRK.HALF;
  const SC = {}; window.GPS = SC;
  const shade = (hex, k) => K.shade(hex, k);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const hash = s => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return h; };
  const P = (x, y, z) => [x, y * KY - (z || 0) * KZ];

  // コースごとの いろ
  const TH = SC.TH = {
    grass: { g1: '#86bf68', g2: '#5f9f4c', bed: '#ece3c8', bed2: '#d6c9a4', wallA: '#d8483c', wallB: '#f6f2e6', rail: '#9aa5b5', tie: '#7a5d44', skirt: '#b9a47c', pit: '#4d86b8' },
    town: { g1: '#a4adb8', g2: '#8a94a1', bed: '#e4e8ee', bed2: '#c6cdd8', wallA: '#2f6fa8', wallB: '#f6f2e6', rail: '#8c97a7', tie: '#5b6473', skirt: '#9aa3b0', pit: '#4d86b8' },
    ice: { g1: '#e6f2f8', g2: '#bcd8ea', bed: '#aee0f2', bed2: '#8ccbe5', wallA: '#3f7fc8', wallB: '#ffffff', rail: '#7f9fbe', tie: '#5d8fb5', skirt: '#7fb4d2', pit: '#2f6fae' },
    mount: { g1: '#93ab63', g2: '#6d8a4d', bed: '#e6cfa6', bed2: '#cdb086', wallA: '#c96a28', wallB: '#f6ecd4', rail: '#96989c', tie: '#6b4f3a', skirt: '#a98660', pit: '#3d7fb0' },
    sand: { g1: '#ecd197', g2: '#d5b06c', bed: '#f4ebd6', bed2: '#dccdaa', wallA: '#3f8f66', wallB: '#fbf4de', rail: '#96989c', tie: '#8a6a48', skirt: '#c9ab78', pit: '#3f8fb5' },
    space: { g1: '#1c2247', g2: '#0d1028', bed: '#343f7c', bed2: '#28316a', wallA: '#ff5fb0', wallB: '#5fe0ff', rail: '#c6d0ff', tie: '#5562ad', skirt: '#1d2450', pit: '#070919' },
  };

  function poly(g, pts, fill, stroke, lw) {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 0.5; g.stroke(); }
  }
  function ell(g, x, y, rx, ry, fill, a) {
    g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (a != null) g.globalAlpha = a;
    g.fillStyle = fill; g.fill(); g.globalAlpha = 1;
  }

  // ---------- じめん ----------
  function drawGround(g, th, theme, X0, Y0, X1, Y1, R, detail) {
    const gr = g.createLinearGradient(0, Y0, 0, Y1);
    gr.addColorStop(0, th.g1); gr.addColorStop(1, th.g2);
    g.fillStyle = gr; g.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    const W = X1 - X0, H = Y1 - Y0, rx = () => X0 + R() * W, ry = () => Y0 + R() * H;
    if (theme === 'grass' || theme === 'mount') {
      // しばかりの しま
      g.save(); g.globalAlpha = 0.06; g.fillStyle = '#ffffff';
      for (let x = X0 - H; x < X1; x += 64) { g.beginPath(); g.moveTo(x, Y1); g.lineTo(x + 32, Y1); g.lineTo(x + 32 + H * 0.6, Y0); g.lineTo(x + H * 0.6, Y0); g.fill(); }
      g.restore();
      for (let i = 0; i < 46; i++) ell(g, rx(), ry(), 26 + R() * 50, 10 + R() * 18, i % 2 ? '#3f7a35' : '#b5dc8a', 0.10);
      if (detail) {
        g.strokeStyle = 'rgba(40,90,40,0.35)'; g.lineWidth = 0.6;
        for (let i = 0; i < 520; i++) { const x = rx(), y = ry(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.8, y - 2.2); g.moveTo(x + 1.4, y); g.lineTo(x + 2.4, y - 1.8); g.stroke(); }
        const fc = theme === 'grass' ? ['#ffffff', '#ffe27a', '#ffb3c8'] : ['#ffffff', '#d8c8f0'];
        for (let i = 0; i < 150; i++) ell(g, rx(), ry(), 0.9, 0.7, fc[i % fc.length], 0.9);
      }
    } else if (theme === 'town') {
      // どうろ と しきいし
      g.fillStyle = 'rgba(255,255,255,0.10)';
      for (let i = 0; i < 30; i++) g.fillRect(rx(), ry(), 40 + R() * 80, 14 + R() * 30);
      g.fillStyle = '#5c6572';
      for (let y = Math.ceil(Y0 / 150) * 150 + 40; y < Y1; y += 150) g.fillRect(X0, y, W, 17);
      for (let x = Math.ceil(X0 / 240) * 240 + 60; x < X1; x += 240) g.fillRect(x, Y0, 26, H);
      g.strokeStyle = '#e9edf2'; g.lineWidth = 1; g.setLineDash([7, 7]);
      for (let y = Math.ceil(Y0 / 150) * 150 + 40; y < Y1; y += 150) { g.beginPath(); g.moveTo(X0, y + 8.5); g.lineTo(X1, y + 8.5); g.stroke(); }
      for (let x = Math.ceil(X0 / 240) * 240 + 60; x < X1; x += 240) { g.beginPath(); g.moveTo(x + 13, Y0); g.lineTo(x + 13, Y1); g.stroke(); }
      g.setLineDash([]);
    } else if (theme === 'ice') {
      for (let i = 0; i < 40; i++) ell(g, rx(), ry(), 30 + R() * 70, 10 + R() * 22, '#ffffff', 0.35);
      for (let i = 0; i < 14; i++) ell(g, rx(), ry(), 36 + R() * 50, 12 + R() * 14, '#8fc3e6', 0.28);
      if (detail) {
        g.strokeStyle = 'rgba(90,150,200,0.45)'; g.lineWidth = 0.5;
        for (let i = 0; i < 60; i++) { let x = rx(), y = ry(); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (R() - 0.5) * 26; y += (R() - 0.5) * 10; g.lineTo(x, y); } g.stroke(); }
        for (let i = 0; i < 160; i++) ell(g, rx(), ry(), 0.7, 0.7, '#ffffff', 0.9);
      }
    } else if (theme === 'sand') {
      g.lineWidth = 1.1;
      for (let i = 0; i < 70; i++) {
        const x = rx(), y = ry(), w = 50 + R() * 90;
        g.strokeStyle = i % 2 ? 'rgba(255,244,210,0.5)' : 'rgba(160,120,60,0.22)';
        g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + w * 0.3, y - 5, x + w * 0.6, y + 5, x + w, y); g.stroke();
      }
      for (let i = 0; i < 30; i++) ell(g, rx(), ry(), 30 + R() * 60, 9 + R() * 16, '#fff0c4', 0.22);
    } else if (theme === 'space') {
      for (let i = 0; i < 9; i++) {
        const x = rx(), y = ry(), r = 80 + R() * 120, c = ['#6b4bd0', '#2a8fb5', '#b0408f'][i % 3];
        const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, c); rg.addColorStop(1, 'rgba(0,0,0,0)');
        g.globalAlpha = 0.22; g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); g.globalAlpha = 1;
      }
      for (let i = 0; i < (detail ? 520 : 160); i++) ell(g, rx(), ry(), 0.4 + R() * 0.7, 0.4 + R() * 0.7, ['#ffffff', '#bfd4ff', '#ffe9b0'][i % 3], 0.35 + R() * 0.65);
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 0.4;
      for (let i = 0; i < 24; i++) { const x = rx(), y = ry(); g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + 3, y); g.moveTo(x, y - 3); g.lineTo(x, y + 3); g.stroke(); }
    }
  }

  // ---------- けしきの もの ----------
  const OBJ = {
    tree(g, x, y, s, R) {
      ell(g, x + 3 * s, y + 1, 9 * s, 3.4 * s, '#1f3b22', 0.28);
      g.fillStyle = '#6b4a30'; g.fillRect(x - 1.2 * s, y - 7 * s, 2.4 * s, 7 * s);
      const c = ['#3f8a45', '#4c9a4e', '#35803f'][Math.floor(R() * 3)];
      ell(g, x, y - 12 * s, 8.5 * s, 7.5 * s, shade(c, -0.18));
      ell(g, x - 1 * s, y - 13.5 * s, 7.4 * s, 6.3 * s, c);
      ell(g, x - 2.6 * s, y - 15.5 * s, 4 * s, 3.2 * s, shade(c, 0.22), 0.9);
    },
    pine(g, x, y, s, R, snow) {
      ell(g, x + 3 * s, y + 1, 7 * s, 2.6 * s, '#1f3b22', 0.26);
      g.fillStyle = '#5d4030'; g.fillRect(x - 1 * s, y - 4 * s, 2 * s, 4 * s);
      const c = snow ? '#3f7a66' : '#2f6f45';
      for (let i = 0; i < 3; i++) {
        const w = (8 - i * 2) * s, by = y - (3 + i * 6) * s, ty = by - 9 * s;
        poly(g, [[x - w, by], [x + w, by], [x, ty]], shade(c, -0.1 + i * 0.07));
        poly(g, [[x - w, by], [x, by], [x, ty]], 'rgba(255,255,255,0.10)');
        if (snow) poly(g, [[x - w * 0.55, by - 4 * s], [x + w * 0.55, by - 4 * s], [x, ty]], '#ffffff');
      }
    },
    rock(g, x, y, s, R, col) {
      col = col || '#8b8f96';
      ell(g, x + 2 * s, y + 0.6, 7 * s, 2.4 * s, '#000000', 0.2);
      poly(g, [[x - 6 * s, y], [x - 4 * s, y - 5 * s], [x + 1 * s, y - 7 * s], [x + 6 * s, y - 3 * s], [x + 6.5 * s, y]], shade(col, -0.2));
      poly(g, [[x - 6 * s, y], [x - 4 * s, y - 5 * s], [x + 1 * s, y - 7 * s], [x + 0.5 * s, y - 2 * s], [x - 2 * s, y]], col);
      poly(g, [[x - 4 * s, y - 5 * s], [x + 1 * s, y - 7 * s], [x + 0.5 * s, y - 4.4 * s]], shade(col, 0.3));
    },
    house(g, x, y, s, R) {
      const w = (15 + R() * 13) * s, h = (16 + R() * 22) * s, d = 9 * s;
      const col = ['#d9a273', '#9fb4c8', '#c8b9a0', '#b98f86', '#8fb5a3', '#c9c3d6'][Math.floor(R() * 6)];
      ell(g, x + 4 * s, y + 1, w * 0.62, 3.6 * s, '#000000', 0.22);
      g.fillStyle = shade(col, -0.12); g.fillRect(x - w / 2, y - h, w, h);                      // まえの かべ
      g.fillStyle = shade(col, 0.2); g.fillRect(x - w / 2, y - h - d * KY, w, d * KY);         // やね
      g.fillStyle = shade(col, -0.34); g.fillRect(x - w / 2, y - h, w, 1.2);
      const cols = Math.max(2, Math.floor(w / 6)), rows = Math.max(2, Math.floor(h / 7.5));
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        g.fillStyle = R() < 0.25 ? '#ffe9a6' : '#4f6f93';
        g.fillRect(x - w / 2 + 2 + c * ((w - 4) / cols), y - h + 3.4 + r * ((h - 4) / rows), (w - 4) / cols - 1.6, (h - 4) / rows - 2.8);
      }
    },
    cactus(g, x, y, s) {
      ell(g, x + 2 * s, y + 0.5, 5 * s, 1.8 * s, '#000000', 0.2);
      g.strokeStyle = '#3e8a56'; g.lineCap = 'round'; g.lineWidth = 3.4 * s;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 13 * s); g.stroke();
      g.lineWidth = 2.4 * s;
      g.beginPath(); g.moveTo(x, y - 6 * s); g.lineTo(x - 4.4 * s, y - 6 * s); g.lineTo(x - 4.4 * s, y - 10 * s); g.moveTo(x, y - 8 * s); g.lineTo(x + 4.2 * s, y - 8 * s); g.lineTo(x + 4.2 * s, y - 12 * s); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 0.8 * s;
      g.beginPath(); g.moveTo(x - 0.8 * s, y - 1); g.lineTo(x - 0.8 * s, y - 12.5 * s); g.stroke(); g.lineCap = 'butt';
    },
    pyramid(g, x, y, s) {
      ell(g, x + 8 * s, y + 1, 26 * s, 6 * s, '#000000', 0.16);
      poly(g, [[x - 24 * s, y], [x, y - 30 * s], [x + 6 * s, y + 4 * s]], '#e2bd74');
      poly(g, [[x + 6 * s, y + 4 * s], [x, y - 30 * s], [x + 26 * s, y - 2 * s]], '#b98f4c');
      g.strokeStyle = 'rgba(120,80,30,0.3)'; g.lineWidth = 0.5;
      for (let i = 1; i < 6; i++) { const k = i / 6; g.beginPath(); g.moveTo(x - 24 * s * (1 - k), y - 30 * s * k); g.lineTo(x + 6 * s * (1 - k), y + 4 * s - 34 * s * k); g.stroke(); }
    },
    mountain(g, x, y, s, R, snow) {
      const w = 60 * s, h = 62 * s, c = snow === 2 ? '#9fb6cc' : '#7c8a78';
      poly(g, [[x - w, y], [x - 6 * s, y - h], [x + 10 * s, y]], c);
      poly(g, [[x + 10 * s, y], [x - 6 * s, y - h], [x + w, y]], shade(c, -0.22));
      poly(g, [[x - 6 * s, y - h], [x - 20 * s, y - h * 0.68], [x - 12 * s, y - h * 0.72], [x - 6 * s, y - h * 0.62], [x + 2 * s, y - h * 0.72], [x + 8 * s, y - h * 0.7]], '#ffffff');
    },
    snowman(g, x, y, s) {
      ell(g, x + 2 * s, y + 0.5, 5 * s, 1.8 * s, '#3f6f96', 0.25);
      ell(g, x, y - 3.4 * s, 4.2 * s, 3.8 * s, '#ffffff'); ell(g, x, y - 9 * s, 3 * s, 2.8 * s, '#ffffff');
      ell(g, x - 1.2 * s, y - 4 * s, 2.4 * s, 2 * s, '#e3eef6', 0.6);
      g.fillStyle = '#c9453a'; g.fillRect(x - 3 * s, y - 7.2 * s, 6 * s, 1.3 * s);
      g.fillStyle = '#2b3442'; g.fillRect(x - 2.2 * s, y - 13.6 * s, 4.4 * s, 2.6 * s); g.fillRect(x - 3.2 * s, y - 11.4 * s, 6.4 * s, 0.9 * s);
    },
    crystal(g, x, y, s) {
      ell(g, x + 1.5 * s, y + 0.5, 5 * s, 1.6 * s, '#3f6f96', 0.22);
      poly(g, [[x - 3 * s, y], [x - 1.5 * s, y - 11 * s], [x + 1.4 * s, y - 9 * s], [x + 2.6 * s, y]], '#8fd0ee');
      poly(g, [[x - 3 * s, y], [x - 1.5 * s, y - 11 * s], [x - 0.4 * s, y]], '#d6f1fb');
      poly(g, [[x + 2 * s, y], [x + 4 * s, y - 6.5 * s], [x + 6 * s, y]], '#6fb9de');
    },
    planet(g, x, y, s, R) {
      const r = (16 + R() * 20) * s, c = ['#e08a4a', '#5fb0d8', '#b97fd6', '#e0c05a'][Math.floor(R() * 4)];
      const rg = g.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
      rg.addColorStop(0, shade(c, 0.35)); rg.addColorStop(0.7, c); rg.addColorStop(1, shade(c, -0.55));
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = rg; g.fill();
      g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip();
      g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = r * 0.16;
      for (let i = -1; i <= 1; i++) { g.beginPath(); g.ellipse(x, y + i * r * 0.5, r * 1.2, r * 0.22, -0.2, 0, Math.PI * 2); g.stroke(); }
      g.restore();
      if (R() < 0.6) { g.strokeStyle = 'rgba(255,240,200,0.75)'; g.lineWidth = 1.6 * s; g.beginPath(); g.ellipse(x, y, r * 1.7, r * 0.42, -0.3, Math.PI * 0.05, Math.PI * 0.95); g.stroke(); }
    },
    asteroid(g, x, y, s, R) { OBJ.rock(g, x, y, s * (0.8 + R()), R, '#6c6f8f'); },
    crater(g, x, y, s) {
      ell(g, x, y, 13 * s, 5 * s, '#3b4380', 0.55); ell(g, x, y + 0.9 * s, 10.5 * s, 3.6 * s, '#141834', 0.8);
      g.strokeStyle = 'rgba(160,180,255,0.4)'; g.lineWidth = 0.6; g.beginPath(); g.ellipse(x, y, 13 * s, 5 * s, 0, Math.PI, Math.PI * 2); g.stroke();
    },
    lamp(g, x, y, s) {
      g.strokeStyle = '#4c5665'; g.lineWidth = 0.9 * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 13 * s); g.lineTo(x + 3 * s, y - 13 * s); g.stroke();
      ell(g, x + 3.4 * s, y - 12.4 * s, 1.6 * s, 1 * s, '#ffe9a6'); ell(g, x + 3.4 * s, y - 11 * s, 5 * s, 3 * s, '#ffe9a6', 0.16);
    },
    pond(g, x, y, s, R, col) {
      ell(g, x, y, 34 * s, 13 * s, shade(col, -0.25)); ell(g, x, y - 1, 32 * s, 11.6 * s, col);
      ell(g, x - 8 * s, y - 4 * s, 14 * s, 3.4 * s, '#ffffff', 0.22);
      g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 0.6;
      for (let i = 0; i < 4; i++) { const px = x - 14 * s + i * 9 * s, py = y + (i % 2 ? 3 : -1) * s; g.beginPath(); g.moveTo(px, py); g.lineTo(px + 6 * s, py); g.stroke(); }
    },
    stand(g, x, y, s) {
      // かんきゃくせき（まえが こちらを むく）
      const w = 110 * s, h = 17 * s, d = 15 * s;
      ell(g, x + 4, y + 1.5, w * 0.54, 4, '#000000', 0.2);
      g.fillStyle = '#4a5568'; g.fillRect(x - w / 2, y - h * 0.4, w, h * 0.4);
      for (let r = 0; r < 4; r++) {
        const yy = y - h * 0.4 - r * (d * KY / 4 + h * 0.15);
        g.fillStyle = r % 2 ? '#c3ccd9' : '#dfe5ee'; g.fillRect(x - w / 2, yy - d * KY / 4 - h * 0.15, w, d * KY / 4 + h * 0.15);
        for (let i = 0; i < 28; i++) {
          const px = x - w / 2 + 2.5 + i * (w - 5) / 27 + (r % 2) * 1.6;
          g.fillStyle = ['#c9453a', '#2f6fa8', '#d79a26', '#3f8f66', '#6b5bb5', '#f6f2e6'][(i * 7 + r * 3) % 6];
          g.fillRect(px - 1.1, yy - 4.2, 2.2, 2.8);
          g.fillStyle = '#f0c9a0'; g.fillRect(px - 0.8, yy - 5.8, 1.6, 1.6);
        }
      }
      const top = y - h * 0.4 - 4 * (d * KY / 4 + h * 0.15);
      g.fillStyle = '#c9453a'; g.fillRect(x - w / 2 - 1.5, top - 5, w + 3, 5);
      g.fillStyle = '#f6f2e6'; for (let i = 0; i < 11; i++) g.fillRect(x - w / 2 + i * w / 11, top - 5, w / 22, 5);
      g.fillStyle = '#3a4352'; g.fillRect(x - w / 2 - 1.5, top - 5, 1.6, y - top + 5); g.fillRect(x + w / 2 - 0.1, top - 5, 1.6, y - top + 5);
    },
  };

  // コースに かさならない ばしょか（x,y は じめんの いち・hw は はんぶんの はば・h は たかさ）
  function makeClear(trk) {
    const pts = trk.pts;
    return (x, y, hw, h) => {
      const up = h * KZ / KY;
      for (let i = 0; i < pts.length; i += 2) {
        const p = pts[i], dx = Math.abs(p.x - x), dy = y - p.y;
        if (dx < HALF + hw + 7 && dy > -(HALF + 34) && dy < HALF + 9 + up) return false;
      }
      return true;
    };
  }

  function drawScenery(g, theme, th, trk, X0, Y0, X1, Y1, R, detail) {
    const clear = makeClear(trk), list = [];
    const b = trk.box, wy0 = Y0 / KY, wy1 = Y1 / KY;
    const put = (kind, n, hw, h, sFn, extra) => {
      for (let i = 0, tries = 0; i < n && tries < n * 14; tries++) {
        const x = X0 + R() * (X1 - X0), y = wy0 + 30 + R() * (wy1 - wy0 - 30), s = sFn();
        if (!clear(x, y, hw * s, h * s)) continue;
        if (list.some(o => Math.abs(o.x - x) < (hw * s + o.hw) * 0.9 && Math.abs(o.y - y) < 16)) continue;
        list.push({ kind, x, y, s, hw: hw * s, extra }); i++;
      }
    };
    // かんきゃくせき（スタートの むこうがわ）
    if (clear(130, -HALF - 44, 58, 17)) list.push({ kind: 'stand', x: 130, y: -HALF - 44, s: 1, hw: 58 });
    // まんなかの いけ
    const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2;
    const pondCol = { grass: '#5f9fd0', town: '#5f9fd0', ice: '#7fbfe6', mount: '#4f8fc0', sand: '#3fa0b8', space: null }[theme];
    if (pondCol) for (const [ox, oy] of [[0, 0], [-60, 10], [60, -10], [0, 40], [0, -40], [-110, 0], [110, 0]]) {
      if (clear(cx + ox, cy + oy, 36, 0) && !list.some(o => Math.abs(o.x - cx - ox) < 100 && Math.abs(o.y - cy - oy) < 40)) { list.push({ kind: 'pond', x: cx + ox, y: cy + oy, s: 1, hw: 34, extra: pondCol }); break; }
    }
    const far = b.minY - HALF - 60;      // コースより むこう（とおく）
    if (theme === 'grass') { put('tree', 60, 8, 20, () => 0.9 + R() * 0.7); put('rock', 8, 6, 6, () => 0.6 + R() * 0.5); }
    if (theme === 'town') { put('house', 46, 13, 36, () => 0.9 + R() * 0.4); put('tree', 22, 8, 20, () => 0.8 + R() * 0.4); put('lamp', 14, 3, 13, () => 1); }
    if (theme === 'ice') { put('pine', 40, 8, 22, () => 0.9 + R() * 0.7, 1); put('crystal', 22, 6, 11, () => 0.8 + R() * 0.9); put('snowman', 5, 4, 13, () => 1); }
    if (theme === 'mount') {
      for (let i = 0; i < 6; i++) list.push({ kind: 'mountain', x: X0 + (i + 0.3 + R() * 0.4) * (X1 - X0) / 6, y: far - 20 - R() * 50, s: 0.8 + R() * 0.6, hw: 0, extra: 1 });
      put('pine', 70, 8, 22, () => 0.9 + R() * 0.8); put('rock', 26, 6, 6, () => 0.7 + R() * 1.0);
    }
    if (theme === 'sand') {
      for (let i = 0; i < 3; i++) list.push({ kind: 'pyramid', x: X0 + (i + 0.3 + R() * 0.4) * (X1 - X0) / 3, y: far - 20 - R() * 40, s: 1 + R() * 0.7, hw: 0 });
      put('cactus', 34, 5, 13, () => 0.8 + R() * 0.7); put('rock', 22, 6, 6, () => 0.6 + R() * 0.8, '#b08a5a');
    }
    if (theme === 'space') { put('planet', 7, 40, 40, () => 0.6 + R() * 0.8); put('crater', 16, 13, 0, () => 0.7 + R() * 0.8); put('asteroid', 30, 7, 7, () => 0.7 + R() * 0.6); }
    list.sort((a, c) => a.y - c.y);
    for (const o of list) {
      const X = o.x, Y = o.y * KY + (o.kind === 'planet' ? -40 * o.s : 0);
      if (o.kind === 'pond') OBJ.pond(g, X, Y, o.s, R, o.extra);
      else if (o.kind === 'rock') OBJ.rock(g, X, Y, o.s, R, o.extra);
      else OBJ[o.kind](g, X, Y, o.s, R, o.extra);
    }
  }

  // ---------- コース ----------
  const LANES = SC.LANES = [27, 9, -9, -27];           // まんなかからの ずれ（ひだりが ＋）
  function drawTrack(g, trk, th, theme, detail) {
    const pts = trk.pts, n = pts.length;
    const E = pts.map(p => { const nx = Math.sin(p.a), ny = -Math.cos(p.a); return { nx, ny, L: [p.x + nx * HALF, p.y + ny * HALF], R: [p.x - nx * HALF, p.y - ny * HALF] }; });
    const quads = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, pa = pts[i], pb = pts[j];
      if (pa.gap) continue;
      quads.push({ i, j, y: (pa.y + pb.y) / 2, za: pa.z, zb: pb.gap ? pa.z : (j === 0 || pb.seg !== pa.seg ? (pa.z < 1.2 ? 0 : pa.z) : pb.z) });
    }
    quads.sort((a, b) => a.y - b.y);
    const Q = (e, side, z) => P(e[side][0], e[side][1], z);
    // かげ
    g.fillStyle = theme === 'space' ? 'rgba(95,224,255,0.10)' : 'rgba(0,0,0,0.20)';
    for (const q of quads) {
      const a = E[q.i], b = E[q.j], sx = 2.5 + q.za * 0.5, sy = 3 + q.za * 0.45;
      g.beginPath(); g.moveTo(a.L[0] + sx, a.L[1] * KY + sy); g.lineTo(b.L[0] + sx, b.L[1] * KY + sy); g.lineTo(b.R[0] + sx, b.R[1] * KY + sy); g.lineTo(a.R[0] + sx, a.R[1] * KY + sy); g.fill();
    }
    // ジャンプの した（みず／たに）
    for (let i = 0; i < n; i++) {
      if (!pts[i].gap) continue;
      const a = E[i], b = E[(i + 1) % n];
      poly(g, [P(a.L[0], a.L[1]), P(b.L[0], b.L[1]), P(b.R[0], b.R[1]), P(a.R[0], a.R[1])], th.pit, th.pit, 0.6);
    }
    if (theme !== 'space') {
      g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 0.7;
      for (let i = 0; i < n; i++) if (pts[i].gap && i % 3 === 0) { const p = pts[i], o = ((i * 37) % 50) - 25; g.beginPath(); g.moveTo(p.x + E[i].nx * o - 3, (p.y + E[i].ny * o) * KY); g.lineTo(p.x + E[i].nx * o + 3, (p.y + E[i].ny * o) * KY); g.stroke(); }
    }
    // どだい と ゆか
    for (const q of quads) {
      const a = E[q.i], b = E[q.j], pa = pts[q.i];
      if (q.za > 0.15 || q.zb > 0.15) {
        for (const side of ['L', 'R']) {
          const ny = side === 'L' ? a.ny : -a.ny;
          if (ny <= 0.04) continue;
          poly(g, [Q(a, side, q.za), Q(b, side, q.zb), Q(b, side, 0), Q(a, side, 0)], shade(th.skirt, -0.1 - 0.25 * (1 - ny)), shade(th.skirt, -0.3), 0.3);
        }
      }
      let col = Math.floor(pa.d / 21) % 2 ? th.bed : shade(th.bed, -0.035);
      if (pa.k === 'bump') col = shade(th.bed2, clamp((q.zb - q.za) * 0.22, -0.2, 0.25));
      else if (pa.k === 'slope') col = shade(th.bed, clamp((q.zb - q.za) * 0.5 - 0.04, -0.18, 0.12));
      else if (pa.k === 'jump') col = (pa.u > 0.17 && pa.u < 0.28) || (pa.u >= 0.6 && pa.u < 0.69) ? (Math.floor(pa.d / 3.4) % 2 ? '#f2c230' : '#2b2f38') : shade(th.bed, pa.u < 0.28 ? 0.08 : -0.1);
      poly(g, [Q(a, 'L', q.za), Q(b, 'L', q.zb), Q(b, 'R', q.zb), Q(a, 'R', q.za)], col, col, 0.5);
    }
    // スタートの しま
    for (let i = 0; i < 2; i++) for (let j = 0; j < 8; j++) {
      const x0 = -1 + i * 4, y0 = -HALF + j * (HALF / 4);
      poly(g, [P(x0, y0), P(x0 + 4, y0), P(x0 + 4, y0 + HALF / 4), P(x0, y0 + HALF / 4)], (i + j) % 2 ? '#ffffff' : '#20242c');
    }
    // のぼりの やじるし
    if (detail) {
      g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.4; g.lineJoin = 'round';
      let last = -1;
      for (let i = 0; i < n; i++) {
        const p = pts[i]; if (p.k !== 'slope' || p.u > 0.56) continue;
        const k = Math.floor(p.d / 24); if (k === last) continue; last = k;
        const fx = Math.cos(p.a), fy = Math.sin(p.a), e = E[i];
        for (const o of [20, -20]) {
          const a = P(p.x - fx * 4 + e.nx * (o + 7), p.y - fy * 4 + e.ny * (o + 7), p.z), m = P(p.x + fx * 4 + e.nx * o, p.y + fy * 4 + e.ny * o, p.z + 0.3), c2 = P(p.x - fx * 4 + e.nx * (o - 7), p.y - fy * 4 + e.ny * (o - 7), p.z);
          g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(m[0], m[1]); g.lineTo(c2[0], c2[1]); g.stroke();
        }
      }
    }
    // まくらぎ と レール
    const runs = [];                               // きれめ（ジャンプ）で わける
    let cur = null;
    for (let i = 0; i <= n; i++) { const p = pts[i % n]; if (p.gap) { cur = null; continue; } if (!cur) { cur = []; runs.push(cur); } cur.push(i % n); }
    for (const off of LANES) {
      if (detail) {
        g.strokeStyle = th.tie; g.lineWidth = 1.7; let last = -1;
        for (let i = 0; i < n; i++) {
          const p = pts[i]; if (p.gap) continue;
          const k = Math.floor(p.d / 6.5); if (k === last) continue; last = k;
          const e = E[i], a = P(p.x + e.nx * (off - 4.8), p.y + e.ny * (off - 4.8), p.z + 0.1), b = P(p.x + e.nx * (off + 4.8), p.y + e.ny * (off + 4.8), p.z + 0.1);
          g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
        }
      }
      for (const r of [off - 3.2, off + 3.2]) for (const pass of [0, 1]) {
        g.strokeStyle = pass ? th.rail : shade(th.rail, -0.5); g.lineWidth = pass ? 0.75 : 1.5;
        for (const run of runs) {
          g.beginPath();
          run.forEach((i, k) => { const p = pts[i], e = E[i], q = P(p.x + e.nx * r, p.y + e.ny * r, p.z + (pass ? 0.75 : 0.3)); k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); });
          g.stroke();
        }
      }
    }
    // かべ（カーブは あかしろの しま）
    const HW = 3.6;
    for (const q of quads) {
      const a = E[q.i], b = E[q.j], pa = pts[q.i];
      const stripe = pa.k === 'curve' ? (Math.floor(pa.d / 9) % 2 ? th.wallA : th.wallB) : (theme === 'space' ? (Math.floor(pa.d / 30) % 2 ? th.wallA : th.wallB) : shade(th.bed2, -0.08));
      for (const side of ['L', 'R']) {
        const ny = side === 'L' ? a.ny : -a.ny;
        const col = shade(stripe, ny > 0 ? -0.14 : 0.04);
        poly(g, [Q(a, side, q.za), Q(b, side, q.zb), Q(b, side, q.zb + HW), Q(a, side, q.za + HW)], col, col, 0.4);
        const t0 = Q(a, side, q.za + HW), t1 = Q(b, side, q.zb + HW);
        g.strokeStyle = theme === 'space' ? stripe : 'rgba(255,255,255,0.55)'; g.lineWidth = theme === 'space' ? 1.1 : 0.55;
        g.beginPath(); g.moveTo(t0[0], t0[1]); g.lineTo(t1[0], t1[1]); g.stroke();
      }
    }
  }

  // ---------- 1まいの えに する ----------
  const cache = {};
  SC.render = function (course, ps, opt) {
    opt = opt || {};
    const key = course.id + '@' + ps + (opt.tight ? 't' : '');
    if (cache[key]) return cache[key];
    const th = TH[course.theme] || TH.grass;
    const trk = TRK.build(course, 3), b = trk.box;
    const MX = opt.tight ? 26 : 250, MT = opt.tight ? 40 : 170, MB = opt.tight ? 22 : 130;
    const X0 = b.minX - HALF - MX, X1 = b.maxX + HALF + MX;
    const Y0 = (b.minY - HALF) * KY - MT, Y1 = (b.maxY + HALF) * KY + MB;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((X1 - X0) * ps); cv.height = Math.ceil((Y1 - Y0) * ps);
    const g = cv.getContext('2d');
    g.setTransform(ps, 0, 0, ps, -X0 * ps, -Y0 * ps);
    const detail = ps >= 1.3;
    drawGround(g, th, course.theme, X0, Y0, X1, Y1, rng(hash(course.id)), detail);
    drawScenery(g, course.theme, th, trk, X0, Y0, X1, Y1, rng(hash(course.id) + 5), detail);
    drawTrack(g, trk, th, course.theme, detail);
    // おおきい えは 1まいだけ のこす（メモリを つかいすぎない）
    if (ps >= 2) for (const k in cache) if (cache[k].ps >= 2) delete cache[k];
    return (cache[key] = { cv, ps, X0, Y0, X1, Y1, trk, th, course });
  };
  // えの うえの いち（projected）を かえす
  SC.P = P;
})();
