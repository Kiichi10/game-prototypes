// でんしゃ グランプリ — がめんの ぶひん（はいけい・いた・しるし・コースの ちず）
(function () {
  'use strict';
  const W = K.W, H = K.H, c = K.ctx, TRK = window.TRK, KY = TRK.KY, KZ = TRK.KZ;
  const D = {}; window.GPD = D;
  D.SEGNAME = { straight: 'まっすぐ', curve: 'カーブ', slope: 'さか', jump: 'ジャンプ', bump: 'でこぼこ' };
  D.SEGCOL = { straight: '#7f93b2', curve: '#d8483c', slope: '#c98a3c', jump: '#d9a520', bump: '#7a62c9' };
  D.CMDNAME = { dash: 'ダッシュ', brake: 'ゆっくり' };
  D.CMDCOL = { dash: '#e2562f', brake: '#2f7fc4' };
  // せいのうの なまえと いろ（ぶひんの やじるしも この いろ）
  D.STAT = [['spd', 'はやさ', '#e2562f'], ['acc', 'かそく', '#e0a21c'], ['grip', 'ふんばり', '#3f9f66'], ['stb', 'あんてい', '#2f7fc4'], ['hill', 'のぼり', '#8a62c9']];
  D.INK = '#e8ecf3'; D.SUB = '#8fa3c0'; D.GOLD = '#f0b53a';

  function rrPath(x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }
  D.rrPath = rrPath;

  // ---------- はいけい（くらい こうじょう） ----------
  let bgCv = null;
  function makeBg() {
    bgCv = document.createElement('canvas'); bgCv.width = W; bgCv.height = H;
    const g = bgCv.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#1d2638'); gr.addColorStop(0.6, '#151c2a'); gr.addColorStop(1, '#0e131d');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // かべの いた
    for (let x = 0; x < W; x += 160) {
      g.fillStyle = (x / 160) % 2 ? 'rgba(255,255,255,0.022)' : 'rgba(0,0,0,0.05)'; g.fillRect(x, 0, 160, 440);
      g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x, 0, 2, 440);
      for (const y of [16, 424]) { g.beginPath(); g.arc(x + 14, y, 3, 0, 7); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fill(); }
    }
    // ゆか
    const fl = g.createLinearGradient(0, 440, 0, H);
    fl.addColorStop(0, '#263044'); fl.addColorStop(1, '#111722');
    g.fillStyle = fl; g.fillRect(0, 440, W, H - 440);
    g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1.5;
    for (let i = -14; i <= 14; i++) { g.beginPath(); g.moveTo(W / 2 + i * 62, 440); g.lineTo(W / 2 + i * 200, H); g.stroke(); }
    for (let j = 1; j < 6; j++) { const y = 440 + Math.pow(j / 6, 1.7) * 280; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    // きいろと くろの しま
    g.fillStyle = '#c99a2a'; g.fillRect(0, 436, W, 9);
    g.fillStyle = '#1a1f2a';
    for (let x = -10; x < W; x += 36) { g.beginPath(); g.moveTo(x, 445); g.lineTo(x + 9, 436); g.lineTo(x + 27, 436); g.lineTo(x + 18, 445); g.fill(); }
    // うえからの あかり
    for (const x of [250, 640, 1030]) {
      const rg = g.createRadialGradient(x, -40, 10, x, 200, 520);
      rg.addColorStop(0, 'rgba(255,236,196,0.20)'); rg.addColorStop(1, 'rgba(255,236,196,0)');
      g.fillStyle = rg; g.beginPath(); g.moveTo(x - 40, 0); g.lineTo(x + 40, 0); g.lineTo(x + 330, H); g.lineTo(x - 330, H); g.fill();
    }
    const vg = g.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 820);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  D.bg = function () { if (!bgCv) makeBg(); c.drawImage(bgCv, 0, 0, W, H); };

  // きんぞくの いた
  D.plate = function (x, y, w, h, r, on) {
    K.rr(x, y + 4, w, h, r, 'rgba(0,0,0,0.35)');
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, on ? '#42527a' : '#2d384d'); g.addColorStop(1, on ? '#2a3554' : '#1d2534');
    K.rr(x, y, w, h, r, g, on ? D.GOLD : '#44526c', on ? 3 : 2);
    K.rr(x + 3, y + 3, w - 6, Math.min(h * 0.4, 24), Math.max(2, r - 3), 'rgba(255,255,255,0.055)');
  };
  // みえない ボタン（えの うえを おせる ように する）
  D.hit = function (x, y, w, h, fn) {
    const a = c.globalAlpha; c.globalAlpha = 0;
    K.button(x, y, w, h, '', '#000000', fn);
    c.globalAlpha = a;
  };
  // ふだ（まるい かどの なまえふだ）
  D.tag = function (text, x, y, size, bg, fg, padX) {
    c.font = `bold ${size}px ${K.FONT}`;
    const w = c.measureText(text).width + (padX || size * 0.9), h = size * 1.5;
    K.rr(x - w / 2, y - h / 2, w, h, Math.min(12, h / 2), bg, 'rgba(0,0,0,0.25)', 2);
    K.text(text, x, y + 1, size, fg || '#ffffff', 'center', null);
    return w;
  };
  D.stars = function (x, y, n, max, r) {
    for (let i = 0; i < max; i++) K.star(x + i * r * 2.35, y, r, i < n ? D.GOLD : '#3b465c');
  };
  // せつめいの おび（LED ふう。ながい ぶんは 2ぎょうに わけて かく）
  D.msg = function (x, y, w, h, text, color, size) {
    K.rr(x, y, w, h, 8, '#101724', '#3d4a63', 2);
    K.text(text, x + w / 2, y + h / 2 + 1, size || 30, color || '#ffd9a0', 'center', null);
  };

  // ---------- くかんの しるし ----------
  D.segIcon = function (k, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round';
    const col = D.SEGCOL[k];
    if (k === 'straight') {
      c.strokeStyle = '#6b7890'; c.lineWidth = 3;
      for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 9, -11); c.lineTo(i * 9, 11); c.stroke(); }
      c.strokeStyle = '#d5deec'; c.lineWidth = 3.4;
      for (const yy of [-7, 7]) { c.beginPath(); c.moveTo(-22, yy); c.lineTo(22, yy); c.stroke(); }
    } else if (k === 'curve') {
      c.strokeStyle = '#d5deec'; c.lineWidth = 11; c.lineCap = 'butt';
      c.beginPath(); c.arc(-14, 16, 26, -Math.PI / 2, 0); c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = 4;
      c.beginPath(); c.arc(-14, 16, 33.5, -Math.PI / 2, 0); c.stroke();
      c.strokeStyle = col; c.setLineDash([6, 6]);
      c.beginPath(); c.arc(-14, 16, 33.5, -Math.PI / 2, 0); c.stroke(); c.setLineDash([]);
    } else if (k === 'slope') {
      c.beginPath(); c.moveTo(-22, 14); c.lineTo(22, 14); c.lineTo(22, -13); c.closePath(); c.fillStyle = col; c.fill();
      c.strokeStyle = '#ffffff'; c.lineWidth = 3.4;
      c.beginPath(); c.moveTo(-6, 9); c.lineTo(12, -2); c.moveTo(4, -3.5); c.lineTo(12, -2); c.lineTo(9, 5); c.stroke();
    } else if (k === 'jump') {
      c.fillStyle = col;
      c.beginPath(); c.moveTo(-23, 14); c.lineTo(-7, 14); c.lineTo(-7, 0); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(8, 14); c.lineTo(23, 14); c.lineTo(8, 6); c.closePath(); c.fill();
      c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.setLineDash([1, 7]);
      c.beginPath(); c.moveTo(-8, -5); c.quadraticCurveTo(2, -22, 13, 0); c.stroke(); c.setLineDash([]);
    } else if (k === 'bump') {
      c.strokeStyle = col; c.lineWidth = 6;
      c.beginPath();
      for (let i = 0; i <= 44; i += 2) { const px = -22 + i, py = 3 - Math.sin(i / 44 * Math.PI * 3) * 9; i ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-22, 14); c.lineTo(22, 14); c.stroke();
    }
    c.restore();
  };

  // ---------- めいれいの しるし（ダッシュ＝ほのお ／ ゆっくり＝かめ） ----------
  D.cmdIcon = function (cmd, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round';
    if (cmd === 'dash') {
      for (let i = 0; i < 3; i++) {
        c.strokeStyle = ['#ffe08a', '#ffad42', '#ff6a2b'][i]; c.lineWidth = 7;
        const px = 10 - i * 13;
        c.beginPath(); c.moveTo(px - 6, -11); c.lineTo(px + 6, 0); c.lineTo(px - 6, 11); c.stroke();
      }
    } else if (cmd === 'brake') {
      c.fillStyle = '#7fbf8f';
      for (const px of [-11, 9]) K.rr(px - 4, 5, 8, 9, 3, '#7fbf8f');
      K.circle(19, 1, 6.5, '#8fcf9f'); K.circle(21, -1, 1.5, '#1d2a44');
      c.beginPath(); c.moveTo(-19, 8); c.quadraticCurveTo(-18, -15, 0, -15); c.quadraticCurveTo(16, -15, 15, 8); c.closePath();
      c.fillStyle = '#3f8f66'; c.fill(); c.strokeStyle = '#2a6447'; c.lineWidth = 2; c.stroke();
      c.strokeStyle = '#2a6447'; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(-9, -12); c.lineTo(-6, 7); c.moveTo(5, -13); c.lineTo(5, 7); c.moveTo(-17, -2); c.lineTo(14, -3); c.stroke();
    }
    c.restore();
  };
  // めいれいの ふだ（カードの なかや レースの おびで つかう）
  D.cmdChip = function (cmd, x, y, w, h, o) {
    o = o || {};
    if (!cmd) {
      c.save(); c.setLineDash([7, 7]); K.rr(x, y, w, h, 10, 'rgba(0,0,0,0.25)', '#56647e', 2.5); c.restore();
      return;
    }
    const col = D.CMDCOL[cmd];
    c.save(); if (o.soft) c.globalAlpha = 0.6;
    K.rr(x, y + 3, w, h, 10, K.shade(col, -0.5));
    K.rr(x, y, w, h, 10, col, K.shade(col, 0.35), 2.5);
    c.restore();
    if (o.icon !== false && h >= 64) { D.cmdIcon(cmd, x + w / 2, y + h * 0.34, Math.min(1.15, h / 76)); K.text(D.CMDNAME[cmd], x + w / 2, y + h * 0.77, o.size || 28, '#ffffff', 'center', null); }
    else if (o.iconOnly) D.cmdIcon(cmd, x + w / 2, y + h / 2, Math.min(1.1, h / 40));
    else K.text(D.CMDNAME[cmd], x + w / 2, y + h / 2 + 1, o.size || 28, '#ffffff', 'center', null);
  };

  // ---------- コースの ちず（ちいさい え。うえに しるしを かける ように いちを かえす） ----------
  const thumbs = {}; let lastMake = 0;
  function thumb(course) {
    if (thumbs[course.id]) return thumbs[course.id];
    if (performance.now() - lastMake < 60) return null;       // 1こまに 1まいずつ つくる
    const r = window.GPS.render(course, 1.5);
    lastMake = performance.now();
    return (thumbs[course.id] = r);
  }
  D.courseMap = function (course, x, y, w, h, o) {
    o = o || {};
    const r = thumb(course);
    if (!r) { K.rr(x, y, w, h, o.r || 0, '#1a2231'); return null; }
    const b = r.trk.box, HALF = TRK.HALF, pad = o.pad == null ? 14 : o.pad;
    const tx0 = b.minX - HALF - pad, tx1 = b.maxX + HALF + pad;
    const ty0 = (b.minY - HALF) * KY - 18 - pad, ty1 = (b.maxY + HALF) * KY + pad;
    const k = Math.min(w / (tx1 - tx0), h / (ty1 - ty0));
    const sx0 = (tx0 + tx1) / 2 - w / k / 2, sy0 = (ty0 + ty1) / 2 - h / k / 2;
    c.save(); rrPath(x, y, w, h, o.r || 0); c.clip();
    c.fillStyle = r.th.g2; c.fillRect(x, y, w, h);
    c.drawImage(r.cv, x + (r.X0 - sx0) * k, y + (r.Y0 - sy0) * k, (r.X1 - r.X0) * k, (r.Y1 - r.Y0) * k);
    c.restore();
    const pt = (wx, wy, wz) => [x + (wx - sx0) * k, y + (wy * KY - (wz || 0) * KZ - sy0) * k];
    return {
      k, trk: r.trk, pt,
      // コースの きょり d の ところ（off は まんなかからの ずれ）
      at(d, off) {
        const p = TRK.at(r.trk, d), nx = Math.sin(p.a), ny = -Math.cos(p.a);
        return pt(p.x + nx * (off || 0), p.y + ny * (off || 0), p.gap ? p.air : p.z);
      },
      // くかん i の まんなか
      mid(i) { const s = course.segs[i]; return this.at(r.trk.segStart[i] + s.len / 2, 0); },
    };
  };
  // ちずの うえで くかんを いろの せんで なぞる
  D.segStroke = function (m, course, i, col, lw, off) {
    const s = course.segs[i], d0 = m.trk.segStart[i], n = Math.max(4, Math.ceil(s.len / 12));
    c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    for (let j = 0; j <= n; j++) { const p = m.at(d0 + s.len * (0.04 + 0.92 * j / n), off || 0); j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
    c.stroke(); c.restore();
  };

  // ゆびの おてほん（ここを おしてね）
  D.finger = function (x, y, t) {
    const k = (t * 1.1) % 1, press = k > 0.45 && k < 0.75;
    const dy = press ? 0 : 16 * Math.abs(Math.sin(k * Math.PI));
    c.save(); c.translate(x, y + dy);
    if (press) { c.strokeStyle = 'rgba(255,224,138,0.9)'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 20 + (k - 0.45) * 60, 0, 7); c.stroke(); }
    c.rotate(-0.35);
    K.rr(-12, 0, 24, 58, 12, '#f6d9b8', '#a87f5c', 3);
    K.rr(-22, 40, 48, 44, 14, '#f6d9b8', '#a87f5c', 3);
    K.rr(-9, 3, 18, 14, 7, 'rgba(255,255,255,0.55)');
    c.restore();
  };
})();
