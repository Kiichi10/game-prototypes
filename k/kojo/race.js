// でんしゃ こうじょう — レース・けっか・じどうの きまり
(function () {
  'use strict';
  const c = K.ctx, W = K.W, H = K.H, L = window.KJ, T = window.KJT, S = window.KJS, G = window.KJG, tx = S.t;
  const { INK, SUB, AMB, UPC, DNC } = G.COL;
  const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

  const V = 1200;                                        // けしきが ながれる はやさ（1びょうに なんてん）
  G.startRace = function () {
    if (G.busy() || G.hurt()) return;
    const stage = G.S.stage, coins = G.S.coins, boxes = G.S.boxes, gap0 = G.gap(), res = L.race(G.S); G.save();
    G.race = { t: 0, res, stage, coins, boxes, gap0, plan: res.plan, len: res.plan.len, done: false, pass: -1 };
    G.say(G.V.go); K.sfx.whistle();
  };
  G.raceUpdate = function (dt) {
    const R = G.race; R.t += dt;
    const v = R.t < 0.9 ? 0.2 : 1; G.dist += dt * (300 + 900 * v); K.runSound(dt, 0.8 + v * 1.6);
    if (R.pass < 0 && R.res.win && R.t > 1.2 && lead(R) < 0) { R.pass = R.t; G.zoom = 0.7; for (let i = 0; i < 3; i++) K.tone([659, 784, 1047][i], i * 0.07, 0.2, 'triangle', 0.16); }
    if (R.t > R.len && !R.done) { R.done = true; finish(R); }
  };
  function finish(R) {
    const res = R.res; let sticker = null;
    if (res.win) { K.sfx.fanfare(); K.confetti(res.clear ? 140 : 70); if (res.clear) sticker = K.addSticker('でんしゃ こうじょう'); G.say(res.clear ? G.V.clear : G.V.win); }
    else { K.sfx.good(); G.say(G.V.lose); }
    G.result = { res, sticker, t: 0 }; G.race = null; G.pshow = L.power(G.S);
  }
  // あいてが どれだけ まえに いるか。てんかいは レースごとに ちがう
  function lead(R) {
    const u = Math.max(0, (R.t - 0.9) / (R.len - 1.3)), s = Math.max(40, Math.min(160, R.gap0)), E = R.res.win ? -460 : 480, kd = R.plan.kind;
    if (kd === 'fast') return s + (E * 1.4 - s) * sm(u / 0.55);                            // ぶっちぎり
    if (kd === 'seesaw') { const a = s + 170 * sm(u / 0.3); return a + (E - a) * sm((u - 0.42) / 0.5); }   // はなされてから おいぬく
    if (kd === 'close') { const b = s * (1 - sm(u / 0.25)) + 55 * Math.sin(u * 11) + 30; return b + (E - b) * sm((u - 0.74) / 0.24); }   // さいごまで ならぶ
    return s + (E - s) * sm((u - 0.22) / 0.62);
  }
  // じぶんは てまえの せんろ・あいては おくの せんろ（ぶつからない）
  G.raceDraw = function () {
    const R = G.race, go = R.t > 0.9, u = R.t - 0.9, w = L.world(R.stage);
    for (const [kind, a, b] of R.plan.feats) { const xL = W - (R.t - a * R.len) * V; S.feature(kind, w, xL, xL + (b - a) * R.len * V, G.dist, G.t); }
    const gate = W + 500 - sm((R.t - (R.len - 1.6)) / 1.5) * (W + 900);
    if (R.t > R.len - 1.7) flag(gate, S.RAIL1 - 96, 0.8);
    G.drawRival(lead(R), go ? 1 : 0.2, R.stage);
    if (go) S.speedLines(G.t, 0.7);
    G.drawTrain(go ? 30 * sm(u / 2) : 0, go ? 1 : 0.2);
    if (R.t > R.len - 1.7) flag(gate + 40, S.RAIL2 - 130, 1.1);
    const inTun = R.plan.feats.some(([kind, fa, fb]) => { const xL = W - (R.t - fa * R.len) * V; return kind === 'tunnel' && xL < W * 0.7 && xL + (fb - fa) * R.len * V > W * 0.3; });
    if (R.plan.weather && !inTun) S.weather(R.plan.weather, G.t);
    if (R.t > 0.9 && R.t < 1.9) tx('どん！', W / 2, 200, 120, '#ffd23f', 'center', '#141a26');
    if (R.pass > 0 && R.t - R.pass < 1) tx('ぬいた！', W / 2, 250, 96 + 30 * Math.max(0, 0.2 - (R.t - R.pass)), '#8dff9a', 'center', '#141a26');
  };
  function flag(x, y, k) {
    K.rr(x - 5 * k, y, 10 * k, 150 * k, 3, '#e8ecf3', '#59647a', 2);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { c.fillStyle = (i + j) % 2 ? '#141a26' : '#ffffff'; c.fillRect(x + 5 * k + i * 16 * k, y + 4 * k + j * 16 * k, 16 * k, 16 * k); }
  }
  G.resultDraw = function (dt) {
    const R = G.result, res = R.res, e = sm((R.t += dt) / 0.35);
    c.fillStyle = `rgba(8,12,22,${0.62 * e})`; c.fillRect(0, 0, W, H);
    S.plate(250, 60, 780, 600, { r: 24, edge: res.win ? '#f0b53a' : '#a89c84', lw: 6 });
    tx(res.win ? 'かった！' : 'あと すこし！', W / 2, 140, 88, res.win ? '#e2562f' : INK, 'center');
    if (res.win) {
      S.coin(450, 270, 38); tx('+' + L.WINCOIN, 502, 273, 64, AMB, 'left');
      S.box(740, 270, 70); tx('+' + L.WINBOX, 792, 273, 64, INK, 'left');
      if (R.sticker) { K.circle(W / 2 - 220, 410, 66, '#ffffff', '#c3cedd', 3); K.drawSticker(R.sticker.s, W / 2 - 220, 410, 50); tx('シールを もらったよ', W / 2 - 136, 390, 38, INK, 'left'); tx('つぎは ' + L.WORLDS[L.world(G.S.stage)], W / 2 - 136, 440, 34, SUB, 'left'); }
      else tx('はこを もらったよ', W / 2, 400, 40, INK, 'center');
    } else {
      S.box(580, 262, 70); tx('+' + L.LOSEBOX, 632, 265, 64, INK, 'left');
      tx('ぶひんを つくって', W / 2, 364, 40, INK, 'center'); tx('つよく しよう', W / 2, 416, 40, INK, 'center');
    }
    if (R.t > 0.8) K.button(W / 2 - 210, 520, 420, 112, res.win ? 'つぎへ' : 'わかった', res.win ? '#2f9a55' : '#2f7fc4', closeResult, { size: 54 });
  };
  function closeResult() {
    G.result = null; G.hintT = 0; G.pshow = L.power(G.S);
    if (G.hurt()) G.say(G.V.broke);
    else if (G.S.stage >= L.RULE_STAGE && !G.S.seen.rule) { G.S.seen.rule = 1; G.save(); G.say(G.V.rule); G.ruleGlow = 1; }
    else if (!G.S.seen.evoHint && G.S.coins >= 2) { G.S.seen.evoHint = 1; G.save(); G.say(G.V.evoHint); G.evoHint = 1; }
  }

  // ---- しゅうり（まけると ぶひんが 2つ ゆるむ。たたいて なおす） ----
  G.fix = function (slot) {
    if (G.busy()) return; const r = L.hit(G.S, slot); if (!r) return;
    const i = L.SLOTS.findIndex(s => s.id === slot); G.shake[slot] = 1; G.save();
    K.tone(190, 0, 0.09, 'square', 0.16); K.tone(1400, 0, 0.05, 'triangle', 0.12); K.sparkle(16 + (i % 3) * 184 + 88, 410 + Math.floor(i / 3) * 152 + 60, 12, '#ffd23f');
    if (r.fixed) K.sfx.good();
    if (r.all) { K.confetti(50); G.say(G.V.fixed); G.flash = 1; G.hintT = 0; }
  };

  // ---- かいぞう（すきな ぶひんを そのまま つよく する。3かいごとに すがたが しんか） ----
  G.openDetail = function (slot) { if (G.busy() || G.hurt()) return; G.detail = { slot, pop: 0 }; G.evoHint = 0; K.sfx.pop(); };
  function evolve() {
    const D = G.detail, r = L.evolve(G.S, D.slot);
    if (!r) { K.sfx.oops(); G.say(G.V.poor); G.cue.coin = 1; return; }
    D.pop = 1; G.bump = 1; G.save(); K.sparkle(390, 225, 26, L.RANKS[r.rank].col);
    for (let i = 0; i < 3 + r.rank; i++) K.tone([523, 659, 784, 1047, 1319, 1568][i], i * 0.07, 0.2, 'triangle', 0.15);
    if (r.up) { K.sfx.fanfare(); K.confetti(90); G.flash = 1; G.say(r.rank === 3 ? G.V.shin1 : G.V.form); }
    else if ((G.S.seen.evo || 0) < 2) { G.S.seen.evo = (G.S.seen.evo || 0) + 1; G.say(G.V.evo); }
    G.checkShin();
  }
  G.detailDraw = function () {
    const D = G.detail, p = G.S.parts[D.slot], r = L.RANKS[p.rank], cost = L.evoCost(G.S, D.slot), ok = G.S.coins >= cost, left = L.evoLeft(p);
    D.pop = Math.max(0, D.pop - 0.04);
    c.fillStyle = 'rgba(8,12,22,0.62)'; c.fillRect(0, 0, W, H);
    S.plate(130, 30, 1020, 660, { r: 24, edge: r.col, lw: 6 });
    tx(L.SLOTS.find(s => s.id === D.slot).name + 'を かいぞう', W / 2, 84, 50, INK, 'center');
    const cq = G.cue.coin, cx = Math.sin(cq * 40) * 10 * cq; S.coin(1010 + cx, 82, 20 + 6 * cq); tx(String(G.S.coins), 1040 + cx, 84, 40 + 8 * cq, cq > 0 ? DNC : AMB, 'left');
    const z = 1 + 0.12 * D.pop;
    K.rr(170, 126, 440, 200, 10, '#c5d6ea', r.col, 5); T.icon(D.slot, p.rank, 390, 226, 430 * z, 190 * z, G.t, p.col);
    K.rr(170, 340, 196, 50, 10, r.col); tx(r.name, 268, 366, 30, p.rank === 3 ? '#3a2a00' : '#fff', 'center');
    tx('ちから', 380, 368, 30, SUB, 'left'); tx(String(p.pow), 610, 364, 60 + 14 * D.pop, INK, 'right');
    if (p.rank < 3) {
      tx('つぎの すがた', 890, 146, 34, SUB, 'center');
      K.rr(700, 172, 380, 154, 10, '#c5d6ea', L.RANKS[p.rank + 1].col, 4); T.icon(D.slot, p.rank + 1, 890, 249, 372, 146, G.t, p.col);
      c.fillStyle = INK; c.beginPath(); c.moveTo(626, 200); c.lineTo(682, 240); c.lineTo(626, 280); c.closePath(); c.fill();
      tx('あと', 760, 366, 34, INK, 'center'); for (let i = 0; i < L.EVO_PER; i++) K.circle(830 + i * 44, 364, 16, i < L.EVO_PER - left ? '#3fbf5a' : '#ffffff', '#3b4660', 3); tx(left + 'かい', 1020, 366, 38, INK, 'center');
    } else { K.star(890, 230, 60 + 6 * Math.sin(G.t * 5), '#f0b53a'); tx('さいごの すがた！', 890, 340, 40, AMB, 'center'); }
    K.button(170, 440, 580, 150, '', ok ? '#2f9a55' : '#7a8496', evolve, { size: 60 });
    tx('かいぞう', 380, 517, 62, '#fff', 'center'); S.coin(590, 515, 26); tx(String(cost), 626, 517, 50, '#fff', 'left');
    if (ok) { c.save(); c.globalAlpha = 0.5 + 0.4 * Math.sin(G.t * 7); K.rr(161, 431, 598, 168, 24, null, '#ffb020', 8); c.restore(); }
    else tx('おかねが たりないよ', 460, 632, 34, DNC, 'center');
    K.button(800, 440, 310, 150, 'もどる', '#55637c', () => { G.detail = null; }, { size: 50 });
  };

  // ---- ずかん（でた ぶひんが うまって いく） ----
  G.openDex = function () { if (G.busy()) return; G.dex = { tab: 0 }; K.sfx.pop(); };
  G.dexDraw = function () {
    const D = G.dex, slot = L.SLOTS[D.tab].id;
    c.fillStyle = 'rgba(8,12,22,0.62)'; c.fillRect(0, 0, W, H);
    S.plate(30, 14, 1220, 692, { r: 22, edge: '#3f7fb5', lw: 6 });
    tx('ずかん', 150, 58, 48, INK, 'center'); tx(L.dexCount(G.S) + ' / ' + L.DEXMAX, 420, 60, 42, AMB, 'center');
    K.button(1060, 24, 170, 66, 'もどる', '#55637c', () => { G.dex = null; }, { size: 34 });
    for (let i = 0; i < 6; i++) K.button(50 + i * 198, 104, 188, 62, L.SLOTS[i].name, i === D.tab ? '#3f7fb5' : '#8a95a8', () => { D.tab = i; }, { size: 32 });
    for (let r = 0; r < 4; r++) {
      const y = 182 + r * 128, rk = L.RANKS[r];
      for (let k = 0; k <= r; k++) K.star(66 + (k % 2) * 30, y + 44 + Math.floor(k / 2) * 30, 12, K.shade(rk.col, -0.15));
      for (let q = 0; q < 5; q++) {
        const x = 140 + q * 218, has = G.S.dex[slot + '-' + r + '-' + q];
        K.rr(x, y, 208, 118, 10, has ? '#c5d6ea' : '#d9d0bc', has ? rk.col : '#a89c84', has ? 5 : 2);
        if (has) T.icon(slot, r, x + 104, y + 59, 198, 108, G.t, q); else tx('？', x + 104, y + 62, 56, '#a89c84', 'center');
      }
    }
  };

  // ---- じどうの きまり（もし 〜 なら 〜） ----
  const IFN = { up: 'つよく なる', down: 'よわく なる' }, THN = { equip: 'つける', sell: 'うる' };
  G.openRules = function () { if (G.busy()) return; G.rules = true; G.ruleGlow = 0; if (!G.S.seen.ruleHelp) { G.S.seen.ruleHelp = 1; G.say(G.V.ruleHelp); } };
  function cycleIf(i) {
    const r = G.S.rules[i];
    if (!r) G.S.rules[i] = { if: 'up', then: 'equip' }; else if (r.if === 'up') G.S.rules[i] = { if: 'down', then: 'sell' }; else G.S.rules[i] = null;
    G.save();
  }
  function cycleThen(i) { const r = G.S.rules[i]; if (r) { r.then = r.then === 'equip' ? 'sell' : 'equip'; G.save(); } }
  G.rulesDraw = function () {
    c.fillStyle = 'rgba(8,12,22,0.62)'; c.fillRect(0, 0, W, H);
    S.plate(100, 40, 1080, 640, { r: 24, edge: '#6b5bb5', lw: 6 });
    tx('じどうの きまり', W / 2, 96, 54, '#5a48a8', 'center');
    tx('きまりの とおりに じどうで うごくよ', W / 2, 156, 34, SUB, 'center');
    for (let i = 0; i < 2; i++) {
      const y = 200 + i * 160, r = G.S.rules[i];
      K.rr(130, y, 1020, 138, 16, '#e6ddc8', '#a89c84', 2);
      tx('もし', 210, y + 70, 46, INK, 'center');
      K.button(290, y + 16, 360, 106, r ? IFN[r.if] : 'なし', r ? (r.if === 'up' ? '#2f9a55' : '#c9453a') : '#7a8496', () => cycleIf(i), { size: 44 });
      if (r) { tx('なら', 724, y + 70, 46, INK, 'center'); K.button(800, y + 16, 320, 106, THN[r.then], r.then === 'equip' ? '#2f7fc4' : '#c98a10', () => cycleThen(i), { size: 46 }); }
      else tx('おすと つくれるよ', 900, y + 70, 36, SUB, 'center');
    }
    K.button(W / 2 - 210, 548, 420, 104, 'できた', '#6b5bb5', () => { G.rules = false; }, { size: 52 });
  };
})();
