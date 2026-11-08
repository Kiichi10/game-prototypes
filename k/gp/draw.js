// でんしゃ グランプリ — えを かく どうぐ（金ぞくの つや・ぶひんの え・コースの え）
(function () {
  'use strict';
  const D = {};
  window.GPD = D;
  const c = K.ctx;

  // ---------- した じ ----------
  D.garageBg = function (t) {
    const g = c.createLinearGradient(0, 0, 0, K.H);
    g.addColorStop(0, '#10161f'); g.addColorStop(0.55, '#19212e'); g.addColorStop(1, '#0c1119');
    c.fillStyle = g; c.fillRect(0, 0, K.W, K.H);
    // ゆかの ます目（おくゆき）
    c.save(); c.strokeStyle = 'rgba(120,160,210,0.10)'; c.lineWidth = 2;
    for (let i = -14; i <= 14; i++) {
      c.beginPath(); c.moveTo(K.W / 2 + i * 26, 300); c.lineTo(K.W / 2 + i * 190, K.H + 40); c.stroke();
    }
    for (let i = 0; i < 9; i++) {
      const y = 300 + Math.pow(i / 8, 1.9) * 430;
      c.beginPath(); c.moveTo(0, y); c.lineTo(K.W, y); c.stroke();
    }
    c.restore();
    // スポットライト
    const s = c.createRadialGradient(K.W / 2, 150, 20, K.W / 2, 260, 520);
    s.addColorStop(0, 'rgba(180,215,255,0.17)'); s.addColorStop(1, 'rgba(180,215,255,0)');
    c.fillStyle = s; c.fillRect(0, 0, K.W, K.H);
  };

  // 金ぞくっぽい いた
  D.plate = function (x, y, w, h, r, on) {
    const g = c.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, on ? '#3d4e68' : '#2a3342');
    g.addColorStop(0.5, on ? '#32415a' : '#222a36');
    g.addColorStop(1, on ? '#273349' : '#1b222c');
    K.rr(x, y + 3, w, h, r, 'rgba(0,0,0,0.35)');
    K.rr(x, y, w, h, r, g, on ? '#e8a23c' : '#3a4557', on ? 3 : 2);
    K.rr(x + 3, y + 3, w - 6, Math.max(6, h * 0.3), Math.max(4, r - 3), 'rgba(255,255,255,0.07)');
  };

  // ---------- ぶひんの え ----------
  D.part = function (slot, id, x, y, sc) {
    sc = sc || 1;
    c.save(); c.translate(x, y); c.scale(sc, sc);
    const lv = (GP.find(slot, id).lv) || 0;
    const metal = ['#8d97a8', '#c9a227', '#d8d8de'][lv];
    const dark = ['#5c6573', '#8e6f17', '#9a9aa2'][lv];
    if (slot === 'motor') {
      K.rr(-26, -16, 44, 32, 7, metal, dark, 2.5);
      K.rr(-26, -16, 44, 10, 5, 'rgba(255,255,255,0.22)');
      K.rr(18, -8, 10, 16, 3, '#444c59');
      K.rr(-32, -7, 7, 14, 3, '#c0554a');
      for (let i = 0; i < 3; i++) c.fillRect(-18 + i * 12, -16, 3, 32), c.fillStyle = 'rgba(0,0,0,0.18)';
    } else if (slot === 'gear') {
      const R = 19;
      c.fillStyle = metal; c.strokeStyle = dark; c.lineWidth = 2;
      c.beginPath();
      for (let i = 0; i < 24; i++) {
        const a = i / 24 * Math.PI * 2, rr = (i % 2 ? R : R * 0.78);
        c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      c.closePath(); c.fill(); c.stroke();
      K.circle(0, 0, 7, '#232a35');
    } else if (slot === 'tire') {
      K.circle(0, 0, 21, '#20252d', '#11151b', 2);
      K.circle(0, 0, 12, metal, dark, 2);
      K.circle(0, 0, 4, '#11151b');
      c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 3;
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a) * 15, Math.sin(a) * 15); c.lineTo(Math.cos(a) * 20, Math.sin(a) * 20); c.stroke(); }
    } else if (slot === 'wing') {
      c.fillStyle = metal; c.strokeStyle = dark; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-26, 8); c.lineTo(-14, -10); c.lineTo(20, -10); c.lineTo(28, 8); c.closePath(); c.fill(); c.stroke();
      K.rr(-6, 6, 12, 10, 3, dark);
    } else if (slot === 'battery') {
      const n = GP.find(slot, id).dash || 1;
      for (let i = 0; i < n; i++) {
        const bx = -20 + i * 17;
        K.rr(bx, -14, 13, 28, 3, '#c9a227', '#8e6f17', 2);
        K.rr(bx + 4, -18, 5, 5, 1, '#8d97a8');
        c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(bx, -4, 13, 5);
      }
    }
    c.restore();
  };

  // ---------- でんしゃ（よこから。ぶひんが みためにも でる） ----------
  D.train = function (x, y, build, col, sc, t) {
    sc = sc || 1;
    const wing = build.wing !== 'w1', bigTire = build.tire === 't2', smallTire = build.tire === 't3';
    c.save(); c.translate(x, y); c.scale(sc, sc);
    // かげ
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(0, 34, 86, 10, 0, 0, 7); c.fill();
    // しゃりん
    const tr = bigTire ? 17 : smallTire ? 11 : 14;
    for (const wx of [-52, -18, 20, 54]) {
      K.circle(wx, 26 - tr + 14, tr, '#1b2029', '#0d1117', 2);
      K.circle(wx, 26 - tr + 14, tr * 0.5, '#8d97a8', '#5c6573', 1.5);
    }
    // しゃたい
    const g = c.createLinearGradient(0, -44, 0, 28);
    g.addColorStop(0, K.shade(col, 0.3)); g.addColorStop(0.45, col); g.addColorStop(1, K.shade(col, -0.35));
    c.beginPath();
    c.moveTo(-76, -40); c.lineTo(44, -44);
    c.quadraticCurveTo(84, -40, 88, 4); c.lineTo(88, 24); c.lineTo(-76, 24); c.closePath();
    c.fillStyle = g; c.fill(); c.strokeStyle = K.shade(col, -0.5); c.lineWidth = 2.5; c.stroke();
    // つや
    c.save(); c.globalAlpha = 0.5;
    c.beginPath(); c.moveTo(-72, -34); c.lineTo(40, -38); c.quadraticCurveTo(72, -34, 76, -20); c.lineTo(-72, -16); c.closePath();
    const sh = c.createLinearGradient(0, -40, 0, -14); sh.addColorStop(0, 'rgba(255,255,255,0.45)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = sh; c.fill(); c.restore();
    // おび
    c.fillStyle = '#e8c04a'; c.fillRect(-74, 2, 160, 7);
    // まど
    for (let i = 0; i < 3; i++) K.rr(-62 + i * 34, -30, 26, 22, 4, '#9fc3dc', '#44505f', 2);
    K.rr(44, -32, 30, 24, 5, '#243246', '#11161f', 2);
    K.circle(80, 14, 5, '#fff3c4');
    // はね
    if (wing) {
      c.fillStyle = '#8d97a8'; c.strokeStyle = '#5c6573'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-84, -46); c.lineTo(-58, -58); c.lineTo(-30, -58); c.lineTo(-40, -44); c.closePath(); c.fill(); c.stroke();
    }
    c.restore();
  };

  // ---------- コースの くかんの え ----------
  D.SEGNAME = { straight: 'まっすぐ', curve: 'カーブ', slope: 'のぼり', jump: 'ジャンプ', wave: 'うねうね' };
  D.SEGCOL = { straight: '#3f8f66', curve: '#c9453a', slope: '#2f6fa8', jump: '#6b5bb5', wave: '#d79a26' };
  D.segIcon = function (kind, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.strokeStyle = '#e6ecf5'; c.lineWidth = 3.4; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    if (kind === 'straight') { c.moveTo(-13, 0); c.lineTo(13, 0); }
    else if (kind === 'curve') { c.moveTo(-13, 8); c.quadraticCurveTo(2, 8, 8, -8); }
    else if (kind === 'slope') { c.moveTo(-13, 9); c.lineTo(2, -8); c.lineTo(13, -8); }
    else if (kind === 'jump') { c.moveTo(-13, 8); c.lineTo(-4, 8); c.moveTo(4, 8); c.lineTo(13, 8); c.moveTo(-8, 2); c.quadraticCurveTo(0, -14, 8, 2); }
    else { c.moveTo(-13, 2); c.quadraticCurveTo(-7, -9, -1, 2); c.quadraticCurveTo(5, 11, 11, 0); }
    c.stroke();
    c.restore();
  };
})();
