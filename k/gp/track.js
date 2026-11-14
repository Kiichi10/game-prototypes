// でんしゃ グランプリ — コースの かたち（けいさんだけ。えは かかない。node でも うごく）
// くかんを つないで ひとまわりの わ（サーキット）を つくる。
(function (root) {
  'use strict';
  const TRK = {};
  const RAD = Math.PI / 180;
  TRK.HALF = 42;        // コースの はんぶんの はば
  TRK.LANE = 18;        // レーンの あいだ
  TRK.KY = 0.6;         // ななめ うえから みる（おくゆきを つぶす）
  TRK.KZ = 0.8;         // たかさ
  TRK.BASE_R = 70;      // ふつうの カーブの まるさ

  const smooth = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };

  // たかさ（のぼり・ジャンプ・でこぼこ）。u は くかんの なかの いち（0〜1）
  TRK.height = function (kind, u, len) {
    if (kind === 'slope') {
      const H = 16;
      return { z: u < 0.6 ? H * smooth(u / 0.6) : H * (1 - smooth((u - 0.6) / 0.4)), gap: false, air: 0 };
    }
    if (kind === 'jump') {
      if (u < 0.28) return { z: 9 * (u / 0.28), gap: false, air: 0 };
      if (u < 0.6) {
        const s = (u - 0.28) / 0.32;
        return { z: 0, gap: true, air: 9 + (5 - 9) * s + 9 * 4 * s * (1 - s) };
      }
      return { z: 5 * (1 - (u - 0.6) / 0.4), gap: false, air: 0 };
    }
    if (kind === 'bump') {
      const n = Math.max(2, Math.round(len / 30));
      return { z: 3.4 * (1 - Math.cos(Math.PI * 2 * n * u)) / 2, gap: false, air: 0 };
    }
    return { z: 0, gap: false, air: 0 };
  };

  // コースを しあげる: カーブの ながさを きめ、fit の まっすぐの ながさを といて わを とじる
  TRK.finalize = function (course) {
    const segs = course.segs;
    for (const s of segs) {
      if (s.k === 'curve') {
        s.r = s.r || TRK.BASE_R;
        s.len = Math.round(s.r * Math.abs(s.ang) * RAD * 10) / 10;
        s.tight = Math.round(TRK.BASE_R / s.r * 100) / 100;
      }
    }
    const fits = segs.filter(s => s.fit);
    const run = () => {
      let x = 0, y = 0, a = 0;
      const dirs = [];
      for (const s of segs) {
        if (s.k === 'curve') {
          const sg = s.ang > 0 ? 1 : -1, r = s.r, phi = Math.abs(s.ang) * RAD;
          const cx = x + sg * r * Math.sin(a), cy = y - sg * r * Math.cos(a);
          a -= sg * phi;
          x = cx - sg * r * Math.sin(a); y = cy + sg * r * Math.cos(a);
        } else {
          if (s.fit) dirs.push([Math.cos(a), Math.sin(a)]);
          const L = s.fit ? (s._L || 0) : s.len;
          x += Math.cos(a) * L; y += Math.sin(a) * L;
        }
      }
      return { x, y, a, dirs };
    };
    if (fits.length === 2) {
      fits[0]._L = 0; fits[1]._L = 0;
      const e = run(), [u1, u2] = e.dirs;
      const det = u1[0] * u2[1] - u1[1] * u2[0];
      if (Math.abs(det) < 1e-6) throw new Error(course.id + ': fit の むきが おなじ');
      const L1 = (-e.x * u2[1] + e.y * u2[0]) / det;
      const L2 = (-u1[0] * e.y + u1[1] * e.x) / det;
      if (L1 < 20 || L2 < 20) throw new Error(course.id + ': fit が みじかすぎる ' + L1 + ' ' + L2);
      fits[0]._L = L1; fits[1]._L = L2;
      fits[0].len = Math.round(L1 * 10) / 10; fits[1].len = Math.round(L2 * 10) / 10;
      fits[0]._L = fits[0].len; fits[1]._L = fits[1].len;
    }
    if (fits.length === 1) {
      fits[0]._L = 0;
      const e = run(), u = e.dirs[0];
      const L = -(e.x * u[0] + e.y * u[1]);
      if (L < 20) throw new Error(course.id + ': fit が みじかすぎる ' + L);
      fits[0].len = Math.round(L * 10) / 10; fits[0]._L = fits[0].len;
    }
    const e = run();
    course.closeErr = Math.hypot(e.x, e.y);
    course.turn = Math.round(e.a / RAD);
    course.lapLen = segs.reduce((q, s) => q + s.len, 0);
    return course;
  };

  // えを かく ための てん（まんなかの せん）を ならべる
  TRK.build = function (course, step) {
    step = step || 3;
    const pts = [];
    const segStart = [];
    let x = 0, y = 0, a = 0, d = 0;
    course.segs.forEach((s, si) => {
      segStart.push(d);
      const n = Math.max(2, Math.ceil(s.len / step)), ds = s.len / n;
      let cx = 0, cy = 0, sg = 0, a0 = a;
      if (s.k === 'curve') { sg = s.ang > 0 ? 1 : -1; cx = x + sg * s.r * Math.sin(a); cy = y - sg * s.r * Math.cos(a); }
      const x0 = x, y0 = y;
      for (let i = 0; i < n; i++) {
        const u = i / n;
        let px, py, pa;
        if (s.k === 'curve') {
          pa = a0 - sg * (u * Math.abs(s.ang) * RAD);
          px = cx - sg * s.r * Math.sin(pa); py = cy + sg * s.r * Math.cos(pa);
        } else { pa = a0; px = x0 + Math.cos(a0) * s.len * u; py = y0 + Math.sin(a0) * s.len * u; }
        const h = TRK.height(s.k, u, s.len);
        pts.push({ x: px, y: py, a: pa, z: h.z, gap: h.gap, air: h.air, seg: si, u, d: d + ds * i, k: s.k });
      }
      if (s.k === 'curve') {
        a = a0 - sg * Math.abs(s.ang) * RAD;
        x = cx - sg * s.r * Math.sin(a); y = cy + sg * s.r * Math.cos(a);
      } else { x = x0 + Math.cos(a0) * s.len; y = y0 + Math.sin(a0) * s.len; }
      d += s.len;
    });
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (const p of pts) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
    return { pts, segStart, len: d, course, box: { minX, maxX, minY, maxY } };
  };

  // きょり d の ばしょ（わを まわるので d は なんしゅうめ でも よい）
  TRK.at = function (trk, d) {
    const L = trk.len;
    d = ((d % L) + L) % L;
    const pts = trk.pts;
    let lo = 0, hi = pts.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (pts[m].d <= d) lo = m; else hi = m - 1; }
    const p = pts[lo], q = pts[(lo + 1) % pts.length];
    const qd = lo + 1 < pts.length ? q.d : L;
    const k = Math.max(0, Math.min(1, (d - p.d) / Math.max(1e-6, qd - p.d)));
    let da = q.a - p.a;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    const seg = trk.course.segs[p.seg];
    const u = (d - trk.segStart[p.seg]) / seg.len;
    const h = TRK.height(seg.k, u, seg.len);
    return { x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k, a: p.a + da * k, z: h.z, gap: h.gap, air: h.air, seg: p.seg, u, k: seg.k };
  };

  // ななめ うえから みた がめんの いち
  TRK.proj = function (x, y, z) { return { X: x, Y: y * TRK.KY - (z || 0) * TRK.KZ }; };

  if (typeof module !== 'undefined' && module.exports) module.exports = TRK;
  root.TRK = TRK;
})(typeof window !== 'undefined' ? window : globalThis);
