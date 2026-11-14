// でんしゃ グランプリ — ぶひん・コース・はしりの けいさん
// ミニ四駆と おなじで「はやさ」と「まがれるか」が とれあい（トレードオフ）に なる。
// ここは えを かかない。けいさんだけ。node でも ブラウザでも うごく。
(function (root) {
  'use strict';
  const TRK = root.TRK || (typeof require !== 'undefined' ? require('./track.js') : null);
  const GP = {};

  // ---------- ぶひん ----------
  // spd=はやさ acc=かそく grip=ふんばり stb=あんてい w=おもさ（％。100で ふつう）
  // tip は ガレージで みせる ひとこと
  const PARTS = {
    motor: [
      { id: 'm1', name: 'ふつう', spd: 100, acc: 100, w: 10, lv: 0, tip: 'くせが ない' },
      { id: 'm2', name: 'はやい', spd: 116, acc: 96, w: 11, lv: 1, tip: 'まっすぐが はやい' },
      { id: 'm3', name: 'ちからもち', spd: 106, acc: 130, climb: 1.4, w: 13, lv: 1, tip: 'さかを ぐいぐい のぼる' },
      { id: 'm4', name: 'ばくそく', spd: 134, acc: 80, w: 15, lv: 2, tip: 'とにかく はやい。おもい' },
    ],
    gear: [
      { id: 'g1', name: 'ふつう', spd: 100, acc: 100, w: 4, lv: 0, tip: 'くせが ない' },
      { id: 'g2', name: 'かそく', spd: 95, acc: 132, w: 4, lv: 1, tip: 'すぐ はやく なる' },
      { id: 'g3', name: 'こうそく', spd: 113, acc: 76, w: 4, lv: 2, tip: 'のびるけど でだしが おそい' },
    ],
    tire: [
      { id: 't1', name: 'ふつう', grip: 100, spd: 100, w: 5, lv: 0, tip: 'くせが ない' },
      { id: 't2', name: 'ふとい', grip: 124, spd: 95, w: 7, lv: 1, tip: 'カーブで ふんばる' },
      { id: 't3', name: 'ちいさい', grip: 82, spd: 108, acc: 112, w: 4, lv: 1, tip: 'かるくて はやい。すべる' },
      { id: 't4', name: 'じしゃく', grip: 152, spd: 89, w: 9, lv: 2, tip: 'せんろに くっつく' },
    ],
    wing: [
      { id: 'w1', name: 'なし', stb: 100, w: 0, lv: 0, tip: 'かるい' },
      { id: 'w2', name: 'はね', stb: 124, spd: 98, w: 3, lv: 1, tip: 'ジャンプで ぐらつかない' },
      { id: 'w3', name: 'おおばね', stb: 150, spd: 95, w: 6, lv: 2, tip: 'とても あんてい。おそく なる' },
    ],
    battery: [
      { id: 'b1', name: '1こ', dash: 1, w: 3, lv: 0, tip: 'ダッシュ 1かい' },
      { id: 'b2', name: '2こ', dash: 2, w: 6, lv: 1, tip: 'ダッシュ 2かい。おもい' },
      { id: 'b3', name: '3こ', dash: 3, w: 9, lv: 2, tip: 'ダッシュ 3かい。もっと おもい' },
    ],
    gadget: [
      { id: 'x0', name: 'なし', w: 0, lv: 0, tip: 'かるい' },
      { id: 'x1', name: 'ばね', spring: 1.26, w: 2, lv: 1, tip: 'ジャンプと でこぼこに つよい' },
      { id: 'x2', name: 'ロケット', boost: 1.62, w: 5, lv: 2, tip: 'ダッシュが すごく はやい' },
      { id: 'x3', name: 'ふうせん', stb: 86, w: -9, lv: 1, tip: 'ふわっと かるい。ぐらつく' },
    ],
  };
  GP.PARTS = PARTS;
  GP.SLOTS = ['motor', 'gear', 'tire', 'wing', 'battery', 'gadget'];
  GP.SLOTNAME = { motor: 'モーター', gear: 'はぐるま', tire: 'タイヤ', wing: 'はね', battery: 'でんち', gadget: 'ひみつ どうぐ' };
  GP.BASEBUILD = { motor: 'm1', gear: 'g1', tire: 't1', wing: 'w1', battery: 'b1', gadget: 'x0' };

  function find(slot, id) { return PARTS[slot].find(p => p.id === id) || PARTS[slot][0]; }
  GP.find = find;
  GP.slotOf = function (id) { for (const sl of GP.SLOTS) if (PARTS[sl].some(p => p.id === id)) return sl; return null; };

  // くみあわせた せいのう（コースの くせ も かける: こおり＝すべる / うちゅう＝ふわふわ）
  GP.stats = function (build, course) {
    const s = { spd: 100, acc: 100, grip: 100, stb: 100, w: 0, dash: 0, boost: 1.34, spring: 1, climb: 1 };
    for (const slot of GP.SLOTS) {
      const p = find(slot, build[slot]);
      s.spd *= (p.spd || 100) / 100;
      s.acc *= (p.acc || 100) / 100;
      s.grip *= (p.grip || 100) / 100;
      s.stb *= (p.stb || 100) / 100;
      s.w += p.w || 0;
      s.dash += p.dash || 0;
      if (p.boost) s.boost = p.boost;
      if (p.spring) s.spring = p.spring;
      if (p.climb) s.climb = p.climb;
    }
    if (course) { s.grip *= course.grip || 1; s.stb *= course.stb || 1; }
    // おもいと かそくが にぶり、のぼりで つらい
    const wk = Math.max(0.5, 1 - (s.w - 22) * 0.019);
    s.acc *= wk;
    s.hill = wk * s.climb;
    s.slopeV = Math.round(Math.min(s.spd, (30 + s.spd * 0.45) * s.hill) * 10) / 10;   // さかを のぼる はやさ
    for (const k of ['spd', 'acc', 'grip', 'stb']) s[k] = Math.round(s[k] * 10) / 10;
    return s;
  };

  // ---------- コース ----------
  // k: straight まっすぐ / curve カーブ / slope さか / jump ジャンプ / bump でこぼこ
  // curve は ang（＋で ひだりまわり）と r（ちいさいほど きつい）。fit:true の くかんは わが とじる ながさに じどうで なる
  // rivals の t は ゴールの じかん（_tools/gp_balance.js で きめる）。gold は きんの タイム
  const RV = [{ name: 'あおぞら ごう', color: '#2f7fc4' }, { name: 'ひまわり ごう', color: '#e0a21c' }, { name: 'すみれ ごう', color: '#7a62c9' }];
  const B = (m, g, t, w, b, x) => ({ motor: m, gear: g, tire: t, wing: w, battery: b, gadget: x || 'x0' });
  const rivals = (...a) => a.map((r, i) => Object.assign({ build: r[0], prog: r[1] || {} }, RV[i]));
  GP.COURSES = [
    {
      id: 'c1', name: 'はらっぱ', theme: 'grass', laps: 2, hint: 'ひろい コース。はやさが きく',
      reward: ['m2'], goldReward: ['t2'],
      rivals: rivals([B('m1', 'g1', 't1', 'w1', 'b1')], [B('m1', 'g2', 't1', 'w1', 'b1')], [B('m1', 'g1', 't1', 'w1', 'b1')]),
      segs: [
        { k: 'straight', len: 260 }, { k: 'curve', ang: 180, r: 120 },
        { k: 'straight', len: 260 }, { k: 'curve', ang: 180, r: 120 },
      ],
    },
    {
      id: 'c2', name: 'まちなか', theme: 'town', laps: 2, hint: 'きつい カーブと でこぼこ。ゆっくりが きく',
      reward: ['t4'], goldReward: ['b2'], unlockRule: true,
      rivals: rivals([B('m2', 'g1', 't1', 'w1', 'b1'), { segs: { 0: 'dash' }, rules: [{ kind: 'curve', act: 'brake' }] }],
        [B('m1', 'g2', 't2', 'w1', 'b1'), { segs: { 4: 'dash', 5: 'brake' } }],
        [B('m2', 'g2', 't1', 'w1', 'b1'), { rules: [{ kind: 'curve', act: 'brake' }] }]),
      segs: [
        { k: 'straight', len: 230 }, { k: 'curve', ang: 90, r: 70 },
        { k: 'bump', len: 130 }, { k: 'curve', ang: 90, r: 56 },
        { k: 'straight', len: 200, fit: true }, { k: 'curve', ang: 90, r: 70 },
        { k: 'bump', len: 130, fit: true }, { k: 'curve', ang: 90, r: 56 },
      ],
    },
    {
      id: 'c3', name: 'こおりの くに', theme: 'ice', laps: 2, grip: 0.84, hint: 'つるつる すべる。ふんばりが きく',
      reward: ['m3', 'w2'], goldReward: ['x3'],
      rivals: rivals([B('m2', 'g1', 't4', 'w1', 'b1'), { segs: { 0: 'dash', 1: 'brake' } }],
        [B('m2', 'g2', 't2', 'w1', 'b1'), { rules: [{ kind: 'curve', act: 'brake' }] }],
        [B('m1', 'g1', 't2', 'w1', 'b1'), {}]),
      segs: [
        { k: 'straight', len: 240 }, { k: 'curve', ang: 120, r: 60 },
        { k: 'bump', len: 110 }, { k: 'straight', len: 130 }, { k: 'curve', ang: 120, r: 60 },
        { k: 'straight', len: 240, fit: true }, { k: 'curve', ang: 120, r: 60 },
      ],
    },
    {
      id: 'c4', name: 'やまごえ', theme: 'mount', laps: 2, hint: 'さかと ジャンプ。のぼる ちからと あんていが きく',
      reward: ['x1'], goldReward: ['g3'],
      rivals: rivals([B('m3', 'g1', 't1', 'w2', 'b1'), { segs: { 1: 'dash' } }],
        [B('m3', 'g2', 't2', 'w2', 'b1'), { segs: { 0: 'dash' } }],
        [B('m2', 'g2', 't1', 'w2', 'b1'), { rules: [{ kind: 'curve', act: 'brake' }] }]),
      segs: [
        { k: 'straight', len: 110 }, { k: 'slope', len: 220 }, { k: 'curve', ang: 180, r: 70 },
        { k: 'jump', len: 120 }, { k: 'slope', len: 210, fit: true }, { k: 'curve', ang: 180, r: 70 },
      ],
    },
    {
      id: 'c5', name: 'さばくの くねくね', theme: 'sand', laps: 2, hint: 'きつい カーブが つづく。さくせんが きく',
      reward: ['x2'], goldReward: ['b3'],
      rivals: rivals([B('m3', 'g1', 't4', 'w2', 'b1', 'x1'), { segs: { 0: 'dash', 1: 'brake' } }],
        [B('m2', 'g2', 't4', 'w2', 'b1'), { segs: { 7: 'dash' }, rules: [{ kind: 'jump', act: 'brake' }] }],
        [B('m2', 'g2', 't2', 'w2', 'b1', 'x1'), { rules: [{ kind: 'curve', act: 'brake' }] }]),
      segs: [
        { k: 'straight', len: 260 }, { k: 'curve', ang: 180, r: 60 }, { k: 'curve', ang: -180, r: 60 },
        { k: 'curve', ang: 180, r: 60 }, { k: 'jump', len: 110 }, { k: 'straight', len: 150, fit: true },
        { k: 'curve', ang: 90, r: 70 }, { k: 'straight', len: 200, fit: true }, { k: 'curve', ang: 90, r: 70 },
      ],
    },
    {
      id: 'c6', name: 'うちゅう', theme: 'space', laps: 2, stb: 0.88, hint: 'ふわふわ うく。ぜんぶ ある さいごの コース', final: true,
      reward: ['m4', 'w3'], goldReward: [],
      rivals: rivals([B('m3', 'g1', 't4', 'w2', 'b1', 'x2'), { segs: { 0: 'dash', 1: 'brake' } }],
        [B('m2', 'g2', 't4', 'w2', 'b1', 'x1'), { segs: { 2: 'dash' }, rules: [{ kind: 'curve', act: 'brake' }] }],
        [B('m3', 'g2', 't2', 'w2', 'b1', 'x1'), { rules: [{ kind: 'curve', act: 'brake' }] }]),
      segs: [
        { k: 'straight', len: 260 }, { k: 'curve', ang: 90, r: 70 },
        { k: 'slope', len: 170 }, { k: 'curve', ang: 90, r: 60 },
        { k: 'jump', len: 120 }, { k: 'bump', len: 130, fit: true }, { k: 'curve', ang: 90, r: 70 },
        { k: 'straight', len: 170, fit: true }, { k: 'curve', ang: 90, r: 60 },
      ],
    },
  ];
  if (TRK) GP.COURSES.forEach(c => TRK.finalize(c));
  // はじめに もっている ぶひん
  GP.STARTPARTS = ['m1', 'g1', 'g2', 't1', 't3', 'w1', 'b1', 'x0'];

  // その くかんを ぶじに とおれる はやさ
  GP.safeSpeed = function (seg, s) {
    if (seg.k === 'curve') return 50 + s.grip * 0.5 / seg.tight;
    if (seg.k === 'bump') return (54 + s.stb * 0.5) * (s.spring > 1 ? 1.12 : 1);
    if (seg.k === 'jump') return (50 + s.stb * 0.5) * s.spring;
    return 1e9;                                   // まっすぐと さかは いくらでも
  };
  GP.risky = k => k === 'curve' || k === 'bump' || k === 'jump';

  // ---------- さくせん（プログラム）を くかんごとの めいれいに なおす ----------
  // prog = { segs: {くかんばんごう: 'dash'|'brake'}, rules: [{kind:'curve', act:'brake'}] }
  // ①くかんに じかに おいた めいれいが さき ②なければ「もし〜なら」の きまり ③ダッシュは でんちの かずまで
  GP.resolve = function (course, prog, dashMax) {
    prog = prog || {};
    if (!prog.segs && !prog.rules) prog = { segs: prog };
    const direct = prog.segs || {}, rules = prog.rules || [];
    const out = course.segs.map(() => null);
    let left = dashMax;
    course.segs.forEach((s, i) => {
      if (direct[i] === 'brake') out[i] = 'brake';
      else if (direct[i] === 'dash' && left > 0) { out[i] = 'dash'; left--; }
    });
    course.segs.forEach((s, i) => {
      if (direct[i]) return;
      const r = rules.find(q => q && q.kind === s.k && q.act);
      if (!r) return;
      if (r.act === 'brake') out[i] = 'brake';
      else if (r.act === 'dash' && left > 0) { out[i] = 'dash'; left--; }
    });
    return out;
  };

  // ---------- はしらせる（けっかを さきに ぜんぶ けいさんする） ----------
  GP.simulate = function (build, course, prog, opt) {
    opt = opt || {};
    const s = GP.stats(build, course);
    const cmds = GP.resolve(course, prog, s.dash);
    const dt = 1 / 60, laps = course.laps || 1, BRAKE = 0.9;
    let v = 0, t = 0, dist = 0, frame = 0;
    const log = [], events = [], segInfo = [];
    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
    for (let lap = 0; lap < laps; lap++) {
      if (lap > 0) events.push({ type: 'lap', t, lap });
      for (let i = 0; i < course.segs.length; i++) {
        const seg = course.segs[i], cmd = cmds[i];
        const safe = GP.safeSpeed(seg, s), risky = GP.risky(seg.k);
        const top = seg.k === 'slope' ? s.slopeV : s.spd;      // この くかんで だせる はやさ
        const dash = cmd === 'dash', brake = cmd === 'brake';
        const vIn = v, tIn = t;
        let over = false, ratio = 1, vmax;
        if (dash) events.push({ type: 'dash', t, lap, seg: i, good: !risky });
        if (brake && risky) {
          // ゆっくり: この くかんを しんちょうに とおる（ふくらまないが、すこし おそい）
          v = Math.min(v, safe * BRAKE); vmax = Math.min(s.spd, safe * BRAKE);
          events.push({ type: 'brake', t, lap, seg: i });
        } else if (brake) {
          vmax = top * 0.8;                       // まっすぐや さかで ゆっくりは ただの そん
          events.push({ type: 'brake', t, lap, seg: i, waste: true });
        } else {
          if (risky && v > safe * 1.03) { over = true; ratio = v / safe; }
          if (risky && dash) { over = true; ratio = Math.max(ratio, 1.22); }
          if (over) {
            // はやすぎた → そとへ ふくらんで、その くかんの あいだ おそく なる
            const cap = safe * clamp(0.82 - (ratio - 1) * 1.2, 0.42, 0.82) * (seg.k === 'curve' ? 1 : 0.85);
            v = Math.min(v, cap); vmax = cap;
            events.push({ type: 'over', t, lap, seg: i, ratio: Math.round(ratio * 100) / 100, cause: dash ? 'dash' : 'fast' });
          } else if (dash) vmax = top * s.boost;
          else vmax = Math.min(top, safe);
        }
        const k = s.acc * 0.00028 * 60;
        let x = 0, guard = 0;
        while (x < seg.len && guard++ < 20000) {
          v += (vmax - v) * k * dt * (v > vmax ? 1.6 : 1);
          if (v < 8) v = 8;
          x += v * dt; dist += v * dt; t += dt;
          if (!opt.fast && (frame++ % 2) === 0) log.push({ t, d: dist, v });
        }
        if (!opt.fast) segInfo.push({ lap, seg: i, k: seg.k, cmd, t: tIn, vIn: Math.round(vIn), vOut: Math.round(v), safe: Math.round(safe), over, dash });
      }
    }
    if (!opt.fast) log.push({ t, d: dist, v });
    // あいての つよさ（pace）: じかんを のばす／ちぢめる
    const pace = opt.pace || 1;
    if (pace !== 1) {
      t *= pace;
      for (const e of log) { e.t *= pace; e.v /= pace; }
      for (const e of events) e.t *= pace;
      for (const e of segInfo) e.t *= pace;
    }
    return { time: Math.round(t * 100) / 100, stats: s, cmds, events, segInfo, log, total: dist };
  };
  GP.courseLen = function (course) { return course.segs.reduce((a, b) => a + b.len, 0) * (course.laps || 1); };

  // ---------- あいての じかんと きんの タイム（_tools/gp_balance.js の しらべで きめた あたい） ----------
  GP.TUNE = {
    c1: { gold: 23.6, rival: [25.4, 26.0, 27.0] },
    c2: { gold: 23.3, rival: [24.4, 25.6, 26.9] },
    c3: { gold: 21.8, rival: [23.3, 24.5, 25.8] },
    c4: { gold: 22.1, rival: [23.4, 24.6, 25.8] },
    c5: { gold: 30.0, rival: [31.2, 32.8, 34.5] },
    c6: { gold: 25.9, rival: [26.4, 27.6, 29.0] },
  };
  GP.applyTune = function () {
    GP.COURSES.forEach(c => {
      const tn = GP.TUNE[c.id]; if (!tn) return;
      c.gold = tn.gold;
      c.rivals.forEach((r, i) => { r.t = tn.rival[i]; r.pace = r.t / GP.simulate(r.build, c, r.prog, { fast: true }).time; });
    });
  };
  GP.applyTune();
  // ease: なんども まけたら あいてが すこし ゆっくりに なる（てだすけ）
  GP.runRival = (course, i, ease) => GP.simulate(course.rivals[i].build, course, course.rivals[i].prog, { pace: (course.rivals[i].pace || 1) * (1 + (ease || 0)) });

  if (typeof module !== 'undefined' && module.exports) module.exports = GP;
  root.GP = GP;
})(typeof window !== 'undefined' ? window : globalThis);
