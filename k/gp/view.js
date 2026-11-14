// でんしゃ グランプリ — レースの え（カメラ・コース・たちあがった でんしゃ・けむり）
(function () {
  'use strict';
  const W = K.W, H = K.H, c = K.ctx, sh = K.shade, TRK = window.TRK, KY = TRK.KY, KZ = TRK.KZ;
  const V = {}; window.GPV = V;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const HL = 10.5, HWD = 5.2, Z0 = 0.5, Z1 = 9.6, GAPC = 24;
  V.HL = HL; V.GAPC = GAPC;

  // ---------- コースの え と カメラ ----------
  V.scene = function (course) {
    const b = TRK.build(course, 6).box;
    const w = b.maxX - b.minX + 584, h = (b.maxY - b.minY + 84) * KY + 300;
    const ps = Math.max(1.5, Math.min(3.5, 4090 / w, 4090 / h, Math.sqrt(9.5e6 / (w * h))));
    return window.GPS.render(course, Math.floor(ps * 4) / 4);
  };
  V.zmin = sc => Math.max(W / (sc.X1 - sc.X0), H / (sc.Y1 - sc.Y0));
  // コース ぜんたいが みえる おおきさ と まんなか
  V.fit = function (sc) {
    const b = sc.trk.box;
    const z = Math.min(W / (b.maxX - b.minX + 84 + 110), H / ((b.maxY - b.minY + 84) * KY + 190));
    return { X: (b.minX + b.maxX) / 2, Y: (b.minY + b.maxY) / 2 * KY - 6, zoom: Math.max(V.zmin(sc), z) };
  };
  V.clampCam = function (sc, cam) {
    cam.zoom = Math.max(cam.zoom, V.zmin(sc));
    const hw = W / 2 / cam.zoom, hh = H / 2 / cam.zoom;
    cam.X = clamp(cam.X, sc.X0 + hw, sc.X1 - hw); cam.Y = clamp(cam.Y, sc.Y0 + hh, sc.Y1 - hh);
  };
  V.begin = function (sc, cam) {
    V.clampCam(sc, cam);
    c.save(); c.translate(W / 2, H / 2); c.scale(cam.zoom, cam.zoom); c.translate(-cam.X, -cam.Y);
    const hw = W / 2 / cam.zoom + 2, hh = H / 2 / cam.zoom + 2, ps = sc.ps;
    const x0 = Math.max(sc.X0, cam.X - hw), y0 = Math.max(sc.Y0, cam.Y - hh), x1 = Math.min(sc.X1, cam.X + hw), y1 = Math.min(sc.Y1, cam.Y + hh);
    c.drawImage(sc.cv, (x0 - sc.X0) * ps, (y0 - sc.Y0) * ps, (x1 - x0) * ps, (y1 - y0) * ps, x0, y0, x1 - x0, y1 - y0);
    V.dust = sc.th.bed2;
  };
  V.end = function () { c.restore(); };
  V.screen = (cam, X, Y) => [(X - cam.X) * cam.zoom + W / 2, (Y - cam.Y) * cam.zoom + H / 2];

  // ---------- でんしゃ 1りょうの いち ----------
  function pose(trk, d, off, yaw) {
    const p = TRK.at(trk, d), f = TRK.at(trk, d + HL), r = TRK.at(trk, d - HL);
    const zc = p.gap ? p.air : p.z, zf = f.gap ? f.air : f.z, zr = r.gap ? r.air : r.z;
    const a = Math.atan2(f.y - r.y, f.x - r.x) + (yaw || 0);
    return {
      x: p.x + Math.sin(p.a) * off, y: p.y - Math.cos(p.a) * off, z: zc, zg: p.gap ? 0 : p.z, air: p.gap ? p.air : 0,
      sl: (zf - zr) / (HL * 2), fx: Math.cos(a), fy: Math.sin(a), k: p.k,
    };
  }
  // くるまの なかの いち（u=まえ・v=ひだり・h=たかさ）→ えの うえの いち
  const PT = (q, u, v, h) => [q.x + u * q.fx + v * q.fy, (q.y + u * q.fy - v * q.fx) * KY - (q.z + u * q.sl + h) * KZ];
  const PG = (q, u, v) => [q.x + u * q.fx + v * q.fy, (q.y + u * q.fy - v * q.fx) * KY - (q.zg + (q.air ? 0 : u * q.sl)) * KZ];
  function path(pts) { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); }
  function tq(q, u0, u1, v0, v1, h, fill, stroke, lw) {
    path([PT(q, u0, v0, h), PT(q, u1, v0, h), PT(q, u1, v1, h), PT(q, u0, v1, h)]);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 0.3; c.stroke(); }
  }
  const mix = (A, B, t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
  function band(q, A, B, t0, t1, h0, h1, fill) {
    const a = mix(A, B, t0), b = mix(A, B, t1);
    path([PT(q, a[0], a[1], h0), PT(q, b[0], b[1], h0), PT(q, b[0], b[1], h1), PT(q, a[0], a[1], h1)]);
    c.fillStyle = fill; c.fill();
  }
  function seg(a, b, col, lw, cap) { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = cap || 'butt'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.lineCap = 'butt'; }

  const LEAD = [[-HL, HWD], [HL - 6, HWD], [HL, HWD * 0.45], [HL, -HWD * 0.45], [HL - 6, -HWD], [-HL, -HWD]];
  const REAR = [[-HL, HWD], [HL, HWD], [HL, -HWD], [-HL, -HWD]];

  function car(q, lead, tr, t) {
    const b = tr.build, col = tr.color, shape = lead ? LEAD : REAR, n = shape.length, PC = window.GPT.PCOL;
    const ub = b.tire === 't2' ? 2.8 : b.tire === 't3' ? 1.7 : 2.2;
    // かげ
    const so = 1.5 + q.air * 0.4;
    path(shape.map(s => { const p = PG(q, s[0] * 1.04, s[1] * 1.15); return [p[0] + so, p[1] + so * 0.8]; }));
    c.fillStyle = 'rgba(0,0,0,0.28)'; c.fill();
    if (b.tire === 't4') { path(shape.map(s => PG(q, s[0] * 1.1, s[1] * 1.5))); c.fillStyle = `rgba(127,230,255,${0.3 + 0.15 * Math.sin(t * 9)})`; c.fill(); }
    if (!lead) seg(PT(q, HL, 0, 2.6), PT(q, HL + 3.4, 0, 2.6), '#262c38', 2.2);        // れんけつ
    // よこの めん（こちらを むいた めんだけ）
    for (let i = 0; i < n; i++) {
      const A = shape[i], B = shape[(i + 1) % n];
      let lu = B[1] - A[1], lv = A[0] - B[0];
      if (lu * (A[0] + B[0]) + lv * (A[1] + B[1]) < 0) { lu = -lu; lv = -lv; }
      const ln = Math.hypot(lu, lv); lu /= ln; lv /= ln;
      const wx = lu * q.fx + lv * q.fy, wy = lu * q.fy - lv * q.fx;
      if (wy < 0.03) continue;
      const cf = sh(col, -0.3 + 0.17 * wy - 0.07 * wx);
      band(q, A, B, 0, 1, Z0, Z1, cf); c.strokeStyle = cf; c.lineWidth = 0.25; c.stroke();
      band(q, A, B, 0, 1, Z0, ub, '#262c38');
      if (Math.abs(B[0] - A[0]) > 8) {
        band(q, A, B, 0, 1, 3.5, 4.4, '#f3ead2');
        band(q, A, B, 0.07, 0.93, 5.5, 8.4, '#22304a');
        band(q, A, B, 0.07, 0.93, 7.5, 8.4, 'rgba(160,210,240,0.28)');
        for (let k = 1; k < 4; k++) { const m = mix(A, B, 0.07 + 0.86 * k / 4); seg(PT(q, m[0], m[1], 5.5), PT(q, m[0], m[1], 8.4), cf, 0.55); }
        if (b.gadget === 'x1') for (const tt of [0.16, 0.38, 0.62, 0.84]) { const m = mix(A, B, tt), p = PT(q, m[0], m[1], 1.3); K.circle(p[0], p[1], 0.75, '#f2c230'); }
      } else if (lead && lu > 0.3) {
        band(q, A, B, 0.1, 0.9, 5.3, 8.6, '#1b2740');
        if (lu > 0.9) for (const tt of [0.2, 0.8]) { const m = mix(A, B, tt), p = PT(q, m[0], m[1], 3.2); K.circle(p[0], p[1], tr.dash ? 1.3 : 0.9, '#fff6c8'); }
      } else if (!lead && lu < -0.9) {
        for (const tt of [0.2, 0.8]) { const m = mix(A, B, tt), p = PT(q, m[0], m[1], 3.2); K.circle(p[0], p[1], tr.brake ? 1.3 : 0.8, tr.brake ? '#ff5a4a' : '#b8362c'); }
      }
    }
    // やね
    path(shape.map(s => PT(q, s[0], s[1], Z1))); c.fillStyle = sh(col, 0.2); c.fill(); c.strokeStyle = sh(col, -0.5); c.lineWidth = 0.3; c.stroke();
    tq(q, -HL + 0.8, lead ? HL - 8 : HL - 0.8, -1.5, 1.5, Z1 + 0.02, '#f3ead2');                     // やねの せん
    if (!lead && b.gadget !== 'x2') tq(q, -5.4, 0.6, -2.6, 2.6, Z1 + 0.7, '#8a95a8', '#4a5468', 0.25);
    if (lead) {
      path([PT(q, HL - 7.6, HWD * 0.8, Z1), PT(q, HL - 0.9, HWD * 0.36, Z1), PT(q, HL - 0.9, -HWD * 0.36, Z1), PT(q, HL - 7.6, -HWD * 0.8, Z1)]);
      c.fillStyle = '#1b2740'; c.fill();
      seg(PT(q, HL - 6.6, HWD * 0.5, Z1), PT(q, HL - 2, HWD * 0.24, Z1), 'rgba(190,225,245,0.55)', 0.7, 'round');
      const mc = PC[b.motor];                                   // モーターの はこ
      tq(q, -4.6, 1.2, -2.7, 2.7, Z1 + 0.05, sh(mc, -0.55)); tq(q, -4.6, 1.2, -2.7, 2.7, Z1 + 1.4, mc, sh(mc, -0.5), 0.3);
      if (b.motor === 'm4') for (const v of [-1.5, 1.5]) seg(PT(q, -8, v, Z1 + 0.6), PT(q, -5, v, Z1 + 1.2), '#c9d2e0', 1, 'round');
      if (b.motor === 'm3') tq(q, -3.4, 0, -1.5, 1.5, Z1 + 1.45, '#e8ecf3');
    } else {
      const nb = +b.battery[1] || 1;                            // でんち
      for (let i = 0; i < nb; i++) { const v = (i - (nb - 1) / 2) * 3; tq(q, 5.2, 8.6, v - 1.1, v + 1.1, Z1 + 0.05, '#1d5a37'); tq(q, 5.2, 8.6, v - 1.1, v + 1.1, Z1 + 0.9, '#6fd391', '#1d5a37', 0.25); }
      if (b.gadget === 'x2') {                                  // ロケット
        const h = Z1 + 1.9;
        if (tr.dash) { const L = 7 + 3 * Math.sin(t * 50); seg(PT(q, -5.6, 0, h), PT(q, -5.6 - L, 0, h), '#ff7a2b', 2.8, 'round'); seg(PT(q, -5.6, 0, h), PT(q, -5.6 - L * 0.6, 0, h), '#ffe08a', 1.4, 'round'); }
        seg(PT(q, -5.4, 0, h), PT(q, -4, 0, h), '#59647a', 2.8);
        seg(PT(q, -3.8, 0, h), PT(q, 3, 0, h), '#6f231d', 4.2, 'round'); seg(PT(q, -3.8, 0, h), PT(q, 3, 0, h), '#d8483c', 3.2, 'round');
        seg(PT(q, -1.4, 0, h), PT(q, -0.2, 0, h), '#f3ead2', 3.2);
      }
      if (b.wing !== 'w1') {                                    // はね
        const big = b.wing === 'w3', hg = Z1 + (big ? 4.8 : 3.2), wv = HWD + (big ? 3.4 : 1.8), u0 = -HL + 0.4, u1 = -HL + (big ? 6 : 4.4);
        for (const v of [-3.4, 3.4]) seg(PT(q, u0 + 2.2, v, Z1), PT(q, u0 + 2, v, hg), '#59647a', 0.9);
        tq(q, u0, u1, -wv, wv, hg - 0.5, sh(PC[b.wing], -0.45));
        tq(q, u0, u1, -wv, wv, hg, PC[b.wing], sh(PC[b.wing], -0.5), 0.3);
        if (big) for (const v of [-wv, wv]) seg(PT(q, u0, v, hg + 0.2), PT(q, u1, v, hg + 0.2), '#d8483c', 1.3);
      }
      if (b.gadget === 'x3') {                                  // ふうせん
        const lean = Math.min(4, (tr.v || 0) * 0.04), p0 = PT(q, 1, 0, Z1), p1 = PT(q, 1 - lean, 0, Z1 + 11 + Math.sin(t * 3 + tr.off) * 0.7);
        seg(p0, [p1[0], p1[1] + 4], '#e8ecf3', 0.3);
        const g = c.createRadialGradient(p1[0] - 1.4, p1[1] - 1.6, 0.4, p1[0], p1[1], 4.8);
        g.addColorStop(0, '#ffc2d8'); g.addColorStop(0.55, '#e86a9a'); g.addColorStop(1, '#b0406c');
        c.beginPath(); c.ellipse(p1[0], p1[1], 3.9, 4.6, 0, 0, 7); c.fillStyle = g; c.fill();
      }
    }
  }

  // ---------- けむり・ひばな・ほのお ----------
  const parts = [];
  V.clearFx = () => { parts.length = 0; };
  function emit(tr, q1, q2, dt) {
    const R = Math.random;
    if (tr.dash && R() < dt * 70) {
      const p = PT(q2, -HL - 0.6, (R() - 0.5) * 5, 3);
      parts.push({ X: p[0], Y: p[1], vx: -q2.fx * 28 + (R() - 0.5) * 10, vy: -q2.fy * KY * 28 + (R() - 0.5) * 8, life: 0.36, max: 0.36, kind: 'flame' });
    }
    if (tr.over > 0.25) {
      if (R() < dt * 45) { const q = R() < 0.5 ? q1 : q2, p = PT(q, (R() - 0.5) * 16, R() < 0.5 ? HWD : -HWD, 0.6); parts.push({ X: p[0], Y: p[1], vx: (R() - 0.5) * 8, vy: -3 - R() * 5, life: 0.7, max: 0.7, kind: 'dust' }); }
      if (R() < dt * 26) { const p = PT(q1, (R() - 0.5) * 14, R() < 0.5 ? HWD : -HWD, 0.8); parts.push({ X: p[0], Y: p[1], vx: (R() - 0.5) * 50, vy: -14 - R() * 26, life: 0.28, max: 0.28, kind: 'spark' }); }
    }
    if (tr.brake && R() < dt * 14) { const p = PT(q2, -HL, (R() - 0.5) * 8, 0.6); parts.push({ X: p[0], Y: p[1], vx: (R() - 0.5) * 4, vy: -2 - R() * 3, life: 0.5, max: 0.5, kind: 'dust' }); }
  }
  V.fx = function (dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.X += p.vx * dt; p.Y += p.vy * dt; if (p.kind === 'spark') p.vy += 90 * dt;
      const k = p.life / p.max;
      if (p.kind === 'flame') { c.globalAlpha = k; K.circle(p.X, p.Y, 0.6 + 2.1 * k, k > 0.55 ? '#ffe08a' : '#ff7a2b'); }
      else if (p.kind === 'dust') { c.globalAlpha = 0.5 * k; K.circle(p.X, p.Y, 1.2 + (1 - k) * 3.6, V.dust || '#cccccc'); }
      else { c.globalAlpha = k; K.circle(p.X, p.Y, 0.65, '#fff1a8'); }
    }
    c.globalAlpha = 1;
  };

  // ---------- でんしゃを ならべて かく ----------
  // list: [{d, off, offAt(d), build, color, dash, brake, over(0〜1), v, me}]。d は せんとうの はな
  V.trains = function (sc, list, t, dt) {
    const items = [];
    for (const tr of list) {
      const yaw = (tr.over || 0) * 0.11 * Math.sin(t * 26 + tr.off);
      const d1 = tr.d - HL, d2 = d1 - GAPC;
      const q1 = pose(sc.trk, d1, tr.offAt ? tr.offAt(d1) : tr.off, yaw), q2 = pose(sc.trk, d2, tr.offAt ? tr.offAt(d2) : tr.off, -yaw * 0.8);
      tr.q = q1; tr.top = PT(q1, 0, 0, Z1);
      items.push({ q: q1, lead: true, tr }, { q: q2, lead: false, tr });
      if (dt) emit(tr, q1, q2, dt);
    }
    items.sort((a, b) => a.q.y - b.q.y);
    for (const it of items) car(it.q, it.lead, it.tr, t);
    for (const tr of list) if (tr.me) {                         // じぶんの しるし
      const p = PT(tr.q, 0, 0, Z1 + 8.5 + Math.sin(t * 6) * 1.2);
      path([[p[0] - 3.6, p[1] - 5], [p[0] + 3.6, p[1] - 5], [p[0], p[1]]]);
      c.fillStyle = '#ffd23f'; c.fill(); c.strokeStyle = '#7a5a10'; c.lineWidth = 0.7; c.lineJoin = 'round'; c.stroke();
    }
  };

  // はやさの せん（がめんに かさねる）
  V.speedLines = function (t, amt, ang) {
    if (amt <= 0.02) return;
    c.save(); c.translate(W / 2, H / 2); c.rotate(ang); c.strokeStyle = '#ffffff'; c.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const ph = (t * (1.7 + (i % 5) * 0.3) + i * 0.37) % 1, y = ((i * 97) % 680) - 340;
      if (Math.abs(y) < 80) continue;
      const x = 780 - ph * 1560, len = 90 + (i % 4) * 50;
      c.globalAlpha = 0.3 * amt * Math.sin(ph * Math.PI); c.lineWidth = 3 + (i % 3);
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y); c.stroke();
    }
    c.restore();
  };
})();
