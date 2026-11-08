// でんしゃ グランプリ — ぶひん・コース・はしりの けいさん
// ミニ四駆と おなじで「はやさ」と「まがれるか」が とれあい（トレードオフ）に なる。
// ここは えを かかない。けいさんだけ。node でも ブラウザでも うごく。
(function (root) {
  'use strict';
  const GP = {};

  // ---------- ぶひん ----------
  // spd=さいこうそく acc=かそく grip=ふんばり stb=あんてい w=おもさ（どれも ％。100で ふつう）
  const PARTS = {
    motor: [
      { id: 'm1', name: 'ふつう モーター', spd: 100, acc: 100, w: 10, lv: 0 },
      { id: 'm2', name: 'はやい モーター', spd: 118, acc: 96, w: 11, lv: 1 },
      { id: 'm3', name: 'ばくそく モーター', spd: 136, acc: 78, w: 15, lv: 2 },
    ],
    gear: [
      { id: 'g1', name: 'ふつう はぐるま', spd: 100, acc: 100, w: 4, lv: 0 },
      { id: 'g2', name: 'かそく はぐるま', spd: 93, acc: 126, w: 4, lv: 1 },
      { id: 'g3', name: 'こうそく はぐるま', spd: 115, acc: 74, w: 4, lv: 2 },
    ],
    tire: [
      { id: 't1', name: 'ふつう タイヤ', grip: 100, spd: 100, w: 5, lv: 0 },
      { id: 't2', name: 'ふとい タイヤ', grip: 126, spd: 95, w: 7, lv: 1 },
      { id: 't3', name: 'ちいさい タイヤ', grip: 79, spd: 109, acc: 112, w: 4, lv: 2 },
    ],
    wing: [
      { id: 'w1', name: 'なし', stb: 100, w: 0, lv: 0 },
      { id: 'w2', name: 'はね', stb: 124, spd: 97, w: 3, lv: 1 },
      { id: 'w3', name: 'おもり', stb: 142, spd: 92, acc: 95, w: 9, lv: 2 },
    ],
    battery: [
      { id: 'b1', name: 'でんち 1こ', dash: 1, w: 3, lv: 0 },
      { id: 'b2', name: 'でんち 2こ', dash: 2, w: 6, lv: 1 },
      { id: 'b3', name: 'でんち 3こ', dash: 3, w: 9, lv: 2 },
    ],
  };
  GP.PARTS = PARTS;
  GP.SLOTS = ['motor', 'gear', 'tire', 'wing', 'battery'];
  GP.SLOTNAME = { motor: 'モーター', gear: 'はぐるま', tire: 'タイヤ', wing: 'はね', battery: 'でんち' };

  function find(slot, id) { return PARTS[slot].find(p => p.id === id) || PARTS[slot][0]; }
  GP.find = find;

  // くみあわせた せいのう
  GP.stats = function (build) {
    const s = { spd: 100, acc: 100, grip: 100, stb: 100, w: 0, dash: 0 };
    for (const slot of GP.SLOTS) {
      const p = find(slot, build[slot]);
      s.spd *= (p.spd || 100) / 100;
      s.acc *= (p.acc || 100) / 100;
      s.grip *= (p.grip || 100) / 100;
      s.stb *= (p.stb || 100) / 100;
      s.w += p.w || 0;
      s.dash += p.dash || 0;
    }
    // おもいと かそくが にぶり、のぼりで つらい
    const wk = 1 - (s.w - 22) * 0.019;   // おもいと のぼりが つらい
    s.acc *= wk;
    s.hill = wk;
    for (const k of ['spd', 'acc', 'grip', 'stb']) s[k] = Math.round(s[k] * 10) / 10;
    return s;
  };

  // ---------- コース ----------
  // kind: straight まっすぐ / curve カーブ / slope のぼり / jump ジャンプ / wave うねうね
  GP.COURSES = [
    {
      id: 'c1', name: 'みどりの サーキット', hint: 'まっすぐが ながい。はやさが きく',
      reward: 'm2',
      rivals: [
        { name: 'あおい でんしゃ', color: '#2f6fa8', build: { motor: 'm1', gear: 'g1', tire: 't1', wing: 'w2', battery: 'b1' } },
        { name: 'きいろい でんしゃ', color: '#d79a26', build: { motor: 'm1', gear: 'g1', tire: 't2', wing: 'w1', battery: 'b1' } },
        { name: 'むらさきの でんしゃ', color: '#6b5bb5', build: { motor: 'm1', gear: 'g2', tire: 't1', wing: 'w3', battery: 'b1' } },
      ],
      segs: [
        { k: 'straight', len: 460 }, { k: 'curve', len: 240, tight: 0.85 },
        { k: 'straight', len: 420 }, { k: 'slope', len: 280 },
        { k: 'straight', len: 360 }, { k: 'curve', len: 240, tight: 0.9 },
        { k: 'straight', len: 420 },
      ],
    },
    {
      id: 'c2', name: 'まがりくねり サーキット', hint: 'カーブと うねうねだらけ。ふんばりが きく',
      reward: 't2',
      rivals: [
        { name: 'あおい でんしゃ', color: '#2f6fa8', build: { motor: 'm2', gear: 'g1', tire: 't1', wing: 'w2', battery: 'b1' } },
        { name: 'きいろい でんしゃ', color: '#d79a26', build: { motor: 'm1', gear: 'g2', tire: 't2', wing: 'w1', battery: 'b1' } },
        { name: 'むらさきの でんしゃ', color: '#6b5bb5', build: { motor: 'm2', gear: 'g3', tire: 't1', wing: 'w1', battery: 'b1' } },
      ],
      segs: [
        { k: 'straight', len: 280 }, { k: 'curve', len: 230, tight: 1.15 },
        { k: 'wave', len: 300 }, { k: 'curve', len: 230, tight: 1.25 },
        { k: 'straight', len: 300 }, { k: 'wave', len: 280 },
        { k: 'curve', len: 230, tight: 1.1 }, { k: 'straight', len: 300 },
      ],
    },
    {
      id: 'c3', name: 'やまの サーキット', hint: 'のぼりと ジャンプ。かるさと あんていが きく',
      reward: 'w2',
      rivals: [
        { name: 'あおい でんしゃ', color: '#2f6fa8', build: { motor: 'm2', gear: 'g2', tire: 't1', wing: 'w2', battery: 'b1' } },
        { name: 'きいろい でんしゃ', color: '#d79a26', build: { motor: 'm2', gear: 'g1', tire: 't2', wing: 'w2', battery: 'b2' } },
        { name: 'むらさきの でんしゃ', color: '#6b5bb5', build: { motor: 'm3', gear: 'g1', tire: 't1', wing: 'w1', battery: 'b1' } },
      ],
      segs: [
        { k: 'straight', len: 260 }, { k: 'slope', len: 340 },
        { k: 'jump', len: 220 }, { k: 'curve', len: 230, tight: 1.05 },
        { k: 'slope', len: 300 }, { k: 'jump', len: 220 },
        { k: 'wave', len: 240 }, { k: 'straight', len: 240 },
      ],
    },
    {
      id: 'c4', name: 'さいごの サーキット', hint: 'ぜんぶ ある。さくせんが きく',
      reward: 'm3',
      rivals: [
        { name: 'あおい でんしゃ', color: '#2f6fa8', build: { motor: 'm2', gear: 'g2', tire: 't2', wing: 'w2', battery: 'b2' } },
        { name: 'きいろい でんしゃ', color: '#d79a26', build: { motor: 'm3', gear: 'g1', tire: 't2', wing: 'w2', battery: 'b1' } },
        { name: 'むらさきの でんしゃ', color: '#6b5bb5', build: { motor: 'm2', gear: 'g3', tire: 't2', wing: 'w3', battery: 'b2' } },
      ],
      segs: [
        { k: 'straight', len: 420 }, { k: 'curve', len: 230, tight: 1.1 },
        { k: 'slope', len: 300 }, { k: 'jump', len: 220 },
        { k: 'straight', len: 380 }, { k: 'wave', len: 260 },
        { k: 'curve', len: 230, tight: 1.2 }, { k: 'straight', len: 360 },
      ],
    },
  ];
  // はじめに もっている ぶひん
  GP.STARTPARTS = ['m1', 'g1', 't1', 'w1', 'b1', 'g2'];

  // その くかんを ぶじに とおれる はやさ
  GP.safeSpeed = function (seg, s) {
    if (seg.k === 'curve') return 62 + s.grip * 0.52 / seg.tight;
    if (seg.k === 'wave') return 66 + s.stb * 0.50;
    if (seg.k === 'jump') return 62 + s.stb * 0.52;
    if (seg.k === 'slope') return (52 + s.spd * 0.40) * s.hill;
    return 1e9;                                   // まっすぐは いくらでも
  };

  // ---------- はしらせる（けっかを さきに ぜんぶ けいさんする） ----------
  // cmds: { 0:'dash', 2:'brake', ... } くかんばんごう → めいれい
  GP.simulate = function (build, course, cmds) {
    const s = GP.stats(build);
    cmds = cmds || {};
    const dt = 1 / 60;
    let v = 0, t = 0, dist = 0;
    const log = [];            // えを うごかす ための きろく（3フレームに1つ）
    const events = [];
    const segInfo = [];
    let dashLeft = s.dash, frame = 0;
    course.segs.forEach((seg, i) => {
      const cmd = cmds[i];
      const dash = cmd === 'dash' && dashLeft > 0;
      if (dash) { dashLeft--; events.push({ seg: i, type: 'dash', at: dist }); }
      const safe = GP.safeSpeed(seg, s);
      if (cmd === 'brake') v = Math.min(v, safe * 0.92);
      let failed = false;
      // ① はいる ときに はやすぎた
      if (seg.k !== 'slope' && v > safe * 1.02) {
        const ratio = v / safe;
        t += (0.5 + (ratio - 1) * 3.0) * (seg.k === 'jump' ? 1.4 : 1);
        v = safe * 0.60; failed = true;
        events.push({ seg: i, type: 'over', at: dist, ratio: Math.round(ratio * 100) / 100 });
      }
      // ② カーブ・うねり・ジャンプで ダッシュした → ふくらむ
      if (dash && seg.k !== 'straight' && seg.k !== 'slope' && !failed) {
        t += 1.2; v = safe * 0.60; failed = true;
        events.push({ seg: i, type: 'over', at: dist, cause: 'dash' });
      }
      const vmax = dash && (seg.k === 'straight' || seg.k === 'slope')
        ? s.spd * 1.34 : Math.min(s.spd, safe);
      const vIn = v;
      let x = 0, guard = 0;
      while (x < seg.len && guard++ < 9000) {
        const a = (vmax - v) * s.acc * 0.00052 * (seg.k === 'slope' ? 0.34 : 1);
        v += a * 60 * dt;
        if (v > vmax) v = vmax;
        x += v * dt; dist += v * dt; t += dt;
        if ((frame++ % 3) === 0) log.push({ t: Math.round(t * 100) / 100, d: Math.round(dist), v: Math.round(v), seg: i });
      }
      segInfo.push({ k: seg.k, vIn: Math.round(vIn), vOut: Math.round(v), safe: Math.round(safe), failed, dash });
    });
    return { time: Math.round(t * 100) / 100, stats: s, events, segInfo, log, total: Math.round(dist) };
  };
  GP.courseLen = function (course) { return course.segs.reduce((a, b) => a + b.len, 0); };

  if (typeof module !== 'undefined' && module.exports) module.exports = GP;
  root.GP = GP;
})(typeof window !== 'undefined' ? window : globalThis);
