// でんしゃ こうじょう — けいさん（えを かかない。node でも うごく）
(function (root) {
  'use strict';
  const L = {};
  L.SLOTS = [
    { id: 'face', name: 'かお' }, { id: 'body', name: 'からだ' }, { id: 'wheel', name: 'しゃりん' },
    { id: 'roof', name: 'やね' }, { id: 'back', name: 'うしろ' }, { id: 'light', name: 'ひかり' },
  ];
  L.RANKS = [
    { name: 'ふつう', col: '#9aa5b8', mul: 1, sell: 1 }, { name: 'いい', col: '#3f8fd8', mul: 1.5, sell: 2 },
    { name: 'すごい', col: '#9a6ad8', mul: 2.2, sell: 4 }, { name: 'でんせつ', col: '#f0b53a', mul: 3.2, sell: 8 },
  ];
  L.WORLDS = ['はらっぱ', 'まちなか', 'こおりの くに', 'やまごえ', 'さばく', 'うちゅう'];
  // こうじょうの つよさ ごとの「でやすさ」（ふつう・いい・すごい・でんせつ）
  L.ODDS = [[70, 25, 5, 0], [58, 30, 10, 2], [45, 34, 16, 5], [34, 34, 22, 10], [24, 32, 28, 16], [15, 30, 33, 22]];
  L.FCOST = [15, 35, 70, 120, 200];           // こうじょうを つよく する コイン
  L.WINCOIN = 5; L.WINBOX = 6; L.LOSEBOX = 5; L.STARTBOX = 12; L.MAXEASE = 0.2;
  L.RULE_STAGE = 4;                             // この ばんごうに ついたら「きまり」が つかえる（はらっぱを ぬけたら）

  L.base = lv => 10 * Math.pow(1.22, lv - 1);
  L.hard = stage => Math.min(1.75, 1.15 + 0.05 * (stage - 1));   // あとの あいてほど いい ぶひんが いる
  L.rival = stage => Math.round(6 * L.base(stage) * L.hard(stage));
  L.world = stage => Math.floor((stage - 1) / 3) % L.WORLDS.length;
  L.lap = stage => Math.floor((stage - 1) / 18);
  L.step = stage => (stage - 1) % 3;           // その くにの なんばんめ（0〜2）

  L.fresh = () => {
    const parts = {};
    for (const s of L.SLOTS) parts[s.id] = { slot: s.id, rank: 0, lv: 1, pow: 10 };
    return { v: 1, parts, stage: 1, coins: 0, boxes: L.STARTBOX, factory: 0, rules: [null, null], losses: 0, made: 0, miss: 0, seen: {} };
  };
  L.power = S => L.SLOTS.reduce((a, s) => a + S.parts[s.id].pow, 0);
  L.target = S => Math.round(L.rival(S.stage) * (1 - Math.min(L.MAXEASE, S.losses * 0.04)));

  // あたらしい ぶひんを 1つ つくる（よわい ところが でやすい）
  L.make = (S, rnd) => {
    rnd = rnd || Math.random;
    const order = L.SLOTS.map(s => s.id).sort((a, b) => S.parts[a].pow - S.parts[b].pow);
    const slot = rnd() < 0.55 ? order[Math.floor(rnd() * 2)] : order[Math.floor(rnd() * order.length)];
    const odds = L.ODDS[S.factory]; let r = rnd() * 100, rank = 0;
    for (let i = 0; i < 4; i++) { if (r < odds[i]) { rank = i; break; } r -= odds[i]; }
    if (S.made === 0) rank = 1;                 // はじめの 1こは かならず いいもの
    let pow = Math.max(1, Math.round(L.base(S.stage) * L.RANKS[rank].mul * (0.9 + rnd() * 0.25)));
    let sl = slot;
    // はずれが 2かい つづいたら、つぎは かならず つよく なる
    if ((S.miss || 0) >= 2) { sl = order[0]; pow = Math.max(pow, S.parts[sl].pow + Math.max(1, Math.round(L.base(S.stage) * 0.2))); }
    const p = { slot: sl, rank, lv: S.stage, pow };
    S.made++; S.miss = p.pow > S.parts[sl].pow ? 0 : (S.miss || 0) + 1;
    return p;
  };
  L.diff = (S, p) => p.pow - S.parts[p.slot].pow;
  L.sellOf = p => L.RANKS[p.rank].sell;
  // きまり: {if:'up'|'down', then:'equip'|'sell'}。あてはまる さいしょの きまりの めいれいを かえす
  L.auto = (S, p) => {
    const d = L.diff(S, p);
    for (const r of S.rules) if (r && ((r.if === 'up' && d > 0) || (r.if === 'down' && d <= 0))) return r.then;
    return null;
  };
  // つける（ふるい ほうは うれる）／ うる
  L.equip = (S, p) => { const old = S.parts[p.slot]; S.parts[p.slot] = p; S.coins += L.sellOf(old); return L.sellOf(old); };
  L.sell = (S, p) => { S.coins += L.sellOf(p); return L.sellOf(p); };
  L.canUp = S => S.factory < L.FCOST.length && S.coins >= L.FCOST[S.factory];
  L.upFactory = S => { if (!L.canUp(S)) return false; S.coins -= L.FCOST[S.factory]; S.factory++; return true; };
  // レース。かてば つぎへ
  L.race = S => {
    const me = L.power(S), need = L.target(S), win = me >= need;
    const res = { win, me, need, stage: S.stage, world: L.world(S.stage), clear: false };
    if (win) { res.clear = L.step(S.stage) === 2; S.stage++; S.losses = 0; S.coins += L.WINCOIN; S.boxes += L.WINBOX; }
    else { S.losses++; S.boxes += L.LOSEBOX; }
    return res;
  };
  // むかしの きろくを なおす
  L.load = raw => {
    const S = L.fresh();
    try {
      const o = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!o || o.v !== 1) return S;
      for (const s of L.SLOTS) { const p = o.parts && o.parts[s.id]; if (p && p.pow > 0 && L.RANKS[p.rank]) S.parts[s.id] = { slot: s.id, rank: p.rank, lv: p.lv || 1, pow: p.pow }; }
      for (const k of ['stage', 'coins', 'boxes', 'factory', 'losses', 'made', 'miss']) if (Number.isFinite(o[k]) && o[k] >= 0) S[k] = Math.floor(o[k]);
      S.stage = Math.max(1, S.stage); S.factory = Math.min(L.FCOST.length, S.factory);
      if (Array.isArray(o.rules)) S.rules = [0, 1].map(i => { const r = o.rules[i]; return r && ['up', 'down'].includes(r.if) && ['equip', 'sell'].includes(r.then) ? { if: r.if, then: r.then } : null; });
      S.seen = o.seen && typeof o.seen === 'object' ? o.seen : {};
      if (S.boxes < 1) S.boxes = 1;
    } catch (e) { }
    return S;
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  root.KJ = L;
})(typeof window !== 'undefined' ? window : globalThis);
