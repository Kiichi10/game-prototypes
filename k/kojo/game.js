// でんしゃ こうじょう — タイトル・こうじょうの がめん・ぶひんを くらべる
(function () {
  'use strict';
  const c = K.ctx, W = K.W, H = K.H, L = window.KJ, T = window.KJT, S = window.KJS, tx = S.t;
  const KEY = 'kidtrain_kojo', G = {}; window.KJG = G;
  G.V = {
    start: 'きかいを おして ぶひんを つくろう', up: 'つよく なるよ。つけてみよう', down: 'いまの ほうが つよいね。うる を おそう',
    legend: 'でんせつの ぶひんだ', great: 'すごい ぶひんだ', ready: 'あいてより つよく なった。レースを おそう',
    nobox: 'はこが ないよ。レースを すると もらえるよ', go: 'よーい どん', win: 'かった！ やったね',
    lose: 'あと すこし。ぶひんを つくって つよく しよう', clear: 'シールを もらったよ。つぎの くにへ すすもう',
    fac: 'こうじょうが つよく なった。いい ぶひんが でやすいよ', rule: 'じどうの きまりが つかえるよ',
    ruleHelp: 'もし つよく なるなら つける。きまりを つくると じどうで やってくれるよ', poor: 'おかねが たりないよ。ぶひんを うると ふえるよ',
  };
  G.S = L.load(localStorage.getItem(KEY));
  G.save = () => { try { localStorage.setItem(KEY, JSON.stringify(G.S)); } catch (e) { } };
  G.mode = 'title'; G.cap = null; G.pop = null; G.race = null; G.result = null; G.rules = false;
  G.dist = 0; G.press = 0; G.flash = 0; G.zoom = 0; G.floats = []; G.fly = []; G.hintT = 0;
  G.pshow = L.power(G.S); G.cshow = G.S.coins; G.bump = 0;
  G.looks = () => { const o = {}; for (const s of L.SLOTS) o[s.id] = G.S.parts[s.id].rank; return o; };
  G.busy = () => !!(G.cap || G.pop || G.race || G.result || G.rules || G.press > 0);
  const TX = 430, INK = '#1d2a44', SUB = '#5a6880', AMB = '#a85f00', UPC = '#1f8a3a', DNC = '#c9382c', CREAM = '#f4efe2';
  G.COL = { INK, SUB, AMB, UPC, DNC };
  const RIVAL_PAL = { main: '#4a4f5c', stripe: '#d8483c' }, RIVAL_RANK = [0, 1, 1, 2, 2, 3];
  const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  // あいてが どれだけ まえに いるか（つよく なるほど おいつく）
  G.gap = () => Math.max(-300, Math.min(560, (L.target(G.S) / Math.max(1, G.pshow) - 1) * 1100));
  G.drawRival = function (x, sp, stage) {
    const r = RIVAL_RANK[L.world(stage)];
    T.draw(x, S.RAIL1 + 2, 0.8, { face: r, body: 0, wheel: r, roof: r, back: r, light: Math.min(r, 1) }, G.t + 3, { speed: sp, dist: G.dist * 0.05, pal: RIVAL_PAL });
  };
  G.drawTrain = function (x, sp) { T.draw(x, S.RAIL2 + 2, 1.25, G.looks(), G.t, { speed: sp, dist: G.dist * 0.05, flash: G.flash }); };
  const chime = (rank, up) => { const f = [523, 659, 784, 1047]; for (let i = 0; i <= rank + (up ? 1 : 0); i++) K.tone(f[Math.min(3, i)] * (up ? 1 : 0.75), i * 0.08, 0.22, 'triangle', 0.16); };
  function coinsFly(n, x, y) { for (let i = 0; i < Math.min(8, n + 2); i++) G.fly.push({ x, y, t: -i * 0.05, a: Math.random() * 6.3 }); }

  // ---- きかいを おす → カプセル → くらべる ----
  G.tapMachine = function () {
    if (G.busy()) return;
    if (G.S.boxes <= 0) { K.sfx.oops(); K.say(G.V.nobox); G.hintT = 99; return; }
    G.S.boxes--; G.press = 1; K.sfx.door && K.sfx.door();
  };
  function born() {
    const cur = { ...G.S.parts }, p = L.make(G.S), d = p.pow - cur[p.slot].pow;
    G.cap = { p, d, t: 0, len: 0.55 + p.rank * 0.22 }; G.save();
    K.tone(220, 0, G.cap.len, 'sawtooth', 0.05, 660 + p.rank * 220);
  }
  function open() {
    const { p, d } = G.cap; G.cap = null;
    G.pop = { p, d, t: 0, auto: L.auto(G.S, p) };
    K.sparkle(W / 2, 330, 18 + p.rank * 10, L.RANKS[p.rank].col); chime(p.rank, d > 0);
    if (p.rank === 3) { K.sfx.fanfare(); K.confetti(70); K.say(G.V.legend); }
    else if (p.rank === 2) K.say(G.V.great);
    else { const k = d > 0 ? 'up' : 'down'; if (!G.pop.auto && (G.S.seen[k] || 0) < 2) { G.S.seen[k] = (G.S.seen[k] || 0) + 1; K.say(G.V[k]); } }
  }
  G.decide = function (act) {
    const pp = G.pop; if (!pp) return; const before = L.power(G.S);
    if (act === 'equip') {
      const got = L.equip(G.S, pp.p), d = L.power(G.S) - before;
      G.flash = 1; G.zoom = 1; G.bump = 1; K.sfx.good(); chime(pp.p.rank, true); K.sparkle(TX + 40, 260, 30, L.RANKS[pp.p.rank].col);
      G.floats.push({ text: (d >= 0 ? '+' : '') + d, col: d >= 0 ? '#8dff9a' : '#ffb0a0', t: 0 }); coinsFly(got, 920, 535);
    } else { coinsFly(L.sell(G.S, pp.p), 360, 535); K.sfx.pop(); K.tone(988, 0, 0.1, 'square', 0.08); K.tone(1319, 0.08, 0.18, 'square', 0.08); }
    G.pop = null; G.save();
    if (L.power(G.S) >= L.target(G.S) && G.S.seen.ready !== G.S.stage) { G.S.seen.ready = G.S.stage; K.say(G.V.ready); G.save(); }
  };
  G.upFactory = function () {
    if (G.busy()) return;
    if (L.upFactory(G.S)) { K.sfx.fanfare(); K.confetti(40); K.say(G.V.fac); G.save(); } else { K.sfx.oops(); K.say(G.V.poor); }
  };

  // ---- え ----
  function hud() {
    const st = G.race ? G.race.stage : G.S.stage, w = L.world(st);
    S.plate(440, 12, 400, 64); tx(L.WORLDS[w], 600, 45, 36, INK, 'center');
    for (let i = 0; i < 3; i++) K.circle(764 + i * 28, 44, 10, i < L.step(st) ? '#f0b53a' : '#d9d0bc', '#8a7f68', 2);
    S.plate(1040, 12, 224, 64); S.coin(1078, 44, 21); tx(String(Math.round(G.cshow)), 1246, 46, 40, AMB, 'right');
    const me = Math.round(G.pshow), need = G.race ? G.race.res.need : L.target(G.S), ok = L.power(G.S) >= need && !G.race;
    S.plate(230, 84, 820, 66);
    tx('じぶん', 250, 118, 32, SUB, 'left'); tx(String(me), 520, 119, 46 + 10 * G.bump, ok ? UPC : INK, 'right');
    K.rr(540, 103, 220, 28, 14, '#d9d0bc', '#8a7f68', 2);
    const q = Math.min(1, me / need); if (q > 0.06) K.rr(543, 106, 214 * q, 22, 11, q >= 1 ? '#3fbf5a' : '#f0a53a');
    tx('あいて', 780, 118, 32, SUB, 'left'); tx(String(need), 1034, 119, 46, DNC, 'right');
  }
  function slotCard(i) {
    const s = L.SLOTS[i], p = G.S.parts[s.id], x = 16 + (i % 3) * 184, y = 410 + Math.floor(i / 3) * 152, col = L.RANKS[p.rank].col;
    S.plate(x, y, 176, 144, { edge: col, lw: 5 });
    K.rr(x + 8, y + 8, 160, 86, 6, '#c5d6ea'); T.icon(s.id, p.rank, x + 88, y + 51, 160, 86, G.t);
    K.rr(x + 8, y + 8, 22 + p.rank * 20, 24, 5, 'rgba(255,255,255,0.85)'); for (let k = 0; k <= p.rank; k++) K.star(x + 20 + k * 20, y + 20, 9, K.shade(col, -0.2));
    tx(String(p.pow), x + 88, y + 121, 42, INK, 'center');
  }
  function panel() {
    c.fillStyle = CREAM; c.fillRect(0, 400, W, H - 400); c.fillStyle = '#a89c84'; c.fillRect(0, 398, W, 4);
    for (let i = 0; i < 6; i++) slotCard(i);
    const idle = !G.busy(), can = L.power(G.S) >= L.target(G.S);
    S.machine(690, 540, G.t, G.press, idle && G.S.boxes > 0 && !can);
    for (let i = 0; i <= G.S.factory; i++) K.star(690 - G.S.factory * 13 + i * 26, 653, 10, '#f0b53a');
    const bx = G.race ? G.race.boxes : G.S.boxes; S.box(632, 698, 32); tx('はこ ' + bx, 658, 700, 36, bx > 0 ? INK : DNC, 'left');
    if (idle) S.hit(566, 402, 248, 318, G.tapMachine);
    if (idle) {
      if (can) { c.save(); c.globalAlpha = 0.6 + 0.4 * Math.sin(G.t * 7); K.rr(828, 404, 440, 144, 20, null, '#ffb020', 8); c.restore(); }
      K.button(836, 412, 424, 128, 'レース！', '#e2562f', () => G.startRace(), { size: 64 });
      const fc = L.FCOST[G.S.factory], max = fc == null, afford = L.canUp(G.S);
      K.button(836, 556, 424, 74, max ? 'こうじょう さいこう！' : '', max ? '#7a8496' : afford ? '#2f9a55' : '#7a8496', () => { if (!max) G.upFactory(); }, { size: 32 });
      if (!max) { tx('こうじょうを つよく', 846, 595, 30, '#fff', 'left'); S.coin(1158, 593, 17); tx(String(fc), 1180, 595, 32, '#fff', 'left'); }
      if (G.ruleGlow) { c.save(); c.globalAlpha = 0.6 + 0.4 * Math.sin(G.t * 7); K.rr(828, 636, 440, 82, 18, null, '#ffb020', 7); c.restore(); }
      if (G.S.stage >= L.RULE_STAGE || G.S.seen.rule) K.button(836, 644, 424, 66, 'じどうの きまり', '#6b5bb5', () => G.openRules(), { size: 34 });
    }
    if (G.race) tx(G.race.t < 0.9 ? 'よーい…' : 'がんばれ！', 1048, 556, 72, G.race.t < 0.9 ? INK : '#e2562f', 'center');
  }
  function card(x, y, label, p, hi) {
    const r = L.RANKS[p.rank]; S.plate(x, y, 360, 330, { edge: r.col, lw: hi ? 7 : 3 });
    tx(label, x + 180, y + 32, 34, SUB, 'center');
    K.rr(x + 20, y + 58, 320, 140, 8, '#c5d6ea'); T.icon(p.slot, p.rank, x + 180, y + 128, 320, 140, G.t);
    K.rr(x + 20, y + 210, 176, 46, 10, r.col); tx(r.name, x + 108, y + 234, 32, p.rank === 3 ? '#3a2a00' : '#fff', 'center');
    tx(L.SLOTS.find(s => s.id === p.slot).name, x + 340, y + 234, 34, INK, 'right');
    tx('ちから', x + 24, y + 294, 32, SUB, 'left'); tx(String(p.pow), x + 338, y + 290, 62, INK, 'right');
  }
  function capsule() {
    const cp = G.cap, e = sm(cp.t / 0.3), col = L.RANKS[cp.p.rank].col;
    c.fillStyle = `rgba(8,12,22,${0.6 * e})`; c.fillRect(0, 0, W, H);
    S.capsule(690 + (W / 2 - 690) * e, 560 + (330 - 560) * e, 0.8 + 1.5 * e + 0.5 * sm((cp.t - cp.len + 0.2) / 0.2), col, G.t, cp.p.rank >= 2);
  }
  function popup() {
    const pp = G.pop, p = pp.p, old = G.S.parts[p.slot], e = Math.min(1, pp.t / 0.25), up = pp.d > 0;
    c.fillStyle = 'rgba(8,12,22,0.6)'; c.fillRect(0, 0, W, H);
    c.save(); c.translate(W / 2, 350); c.scale(0.75 + 0.25 * e, 0.75 + 0.25 * e); c.translate(-W / 2, -350);
    S.plate(150, 30, 980, 660, { r: 22 });
    tx('あたらしい ぶひん！', W / 2, 78, 48, INK, 'center');
    card(180, 116, 'いまの', old, false); card(740, 116, 'あたらしい', p, true);
    const col = up ? UPC : DNC, by = Math.sin(G.t * 6) * 6;
    c.fillStyle = col; c.beginPath(); if (up) { c.moveTo(640, 170 - by); c.lineTo(700, 245 - by); c.lineTo(580, 245 - by); } else { c.moveTo(640, 250 + by); c.lineTo(700, 175 + by); c.lineTo(580, 175 + by); } c.closePath(); c.fill();
    tx((pp.d > 0 ? '+' : '') + pp.d, 640, 310, 64, col, 'center'); tx(up ? 'つよく' : pp.d === 0 ? 'おなじ' : 'よわく', 640, 372, 36, col, 'center'); if (pp.d !== 0) tx('なる', 640, 414, 36, col, 'center');
    c.restore();
    if (pp.auto) {
      K.rr(360, 484, 560, 120, 18, '#6b5bb5', '#3d2a66', 3); tx('きまりで ' + (pp.auto === 'equip' ? 'つけるよ' : 'うるよ'), W / 2, 545, 46, '#fff', 'center');
      if (pp.t > 0.9) G.decide(pp.auto);
    } else if (pp.t > 0.25) {
      const px = up ? 740 : 180; c.save(); c.globalAlpha = 0.6 + 0.4 * Math.sin(G.t * 7); K.rr(px - 9, 465, 378, 148, 24, null, '#ffb020', 8); c.restore();
      K.button(180, 474, 360, 130, '', '#c9453a', () => G.decide('sell'), { size: 56 }); tx('うる', 300, 541, 56, '#fff', 'center'); S.coin(430, 539, 20); tx('+' + L.sellOf(p), 456, 541, 38, '#fff', 'left');
      K.button(740, 474, 360, 130, 'つける', '#2f9a55', () => G.decide('equip'), { size: 56 });
      if (G.S.made <= 2) S.finger(px + 290, 612, G.t);
    }
  }
  function effects(dt) {
    G.floats = G.floats.filter(f => (f.t += dt) < 1.3);
    for (const f of G.floats) { c.save(); c.globalAlpha = Math.min(1, (1.3 - f.t) * 3); tx(f.text, TX + 40, 215 - f.t * 40, 76 + 30 * Math.max(0, 0.25 - f.t), f.col, 'center', '#141a26'); c.restore(); }
    G.fly = G.fly.filter(f => (f.t += dt) < 0.7);
    for (const f of G.fly) { if (f.t < 0) continue; const e = sm(f.t / 0.7), mx = f.x + Math.cos(f.a) * 90, my = f.y + Math.sin(f.a) * 90 - 80; S.coin((1 - e) * (1 - e) * f.x + 2 * e * (1 - e) * mx + e * e * 1078, (1 - e) * (1 - e) * f.y + 2 * e * (1 - e) * my + e * e * 44, 15); }
  }
  const main = {
    update(dt, t) {
      G.t = t; G.hintT += dt; G.flash = Math.max(0, G.flash - dt * 2.5); G.zoom = Math.max(0, G.zoom - dt * 1.3); G.bump = Math.max(0, G.bump - dt * 2.5);
      G.pshow += (L.power(G.S) - G.pshow) * Math.min(1, dt * 6);
      const ct = G.race ? G.race.coins : G.S.coins; G.cshow += (ct - G.cshow) * Math.min(1, dt * 7); if (Math.abs(ct - G.cshow) < 0.5) G.cshow = ct;
      if (G.press > 0) { G.press -= dt * 2.4; if (G.press <= 0) { G.press = 0; born(); } }
      if (G.cap && (G.cap.t += dt) > G.cap.len) open();
      if (G.pop) G.pop.t += dt;
      if (G.race) G.raceUpdate(dt); else { G.dist += dt * (300 + 500 * G.zoom); K.runSound(dt, 0.8); }
    },
    draw(t, dt) {
      S.flip();
      const st = G.race ? G.race.stage : G.S.stage, z = 1 + 0.22 * Math.sin(Math.min(1, G.zoom) * Math.PI);
      c.save(); c.translate(TX + 60, 300); c.scale(z, z); c.translate(-TX - 60, -300);
      S.bg(L.world(st), G.dist, t);
      if (G.race) G.raceDraw(dt); else { G.drawRival(TX - 40 + G.gap(), 0.5, st); if (G.zoom > 0) S.speedLines(t, G.zoom); G.drawTrain(TX, 0.5 + 0.5 * G.zoom); }
      c.restore();
      panel(); hud(); effects(dt);
      if (!G.busy()) {
        K.homeButton();
        if (G.S.made === 0 && G.S.boxes > 0) S.finger(770, 560, t);
        else if ((L.power(G.S) >= L.target(G.S) && G.hintT > 6) || (G.S.boxes <= 0 && G.hintT > 3)) S.finger(1190, 520, t);
      }
      if (G.cap) capsule();
      if (G.pop) popup();
      if (G.rules) G.rulesDraw();
      if (G.result) G.resultDraw(dt);
    },
  };
  G.start = function () { G.mode = 'main'; K.scene = main; G.hintT = 0; if (G.S.made === 0) K.say(G.V.start); };
  K.scene = {
    update(dt, t) { G.t = t; G.dist += dt * 420; },
    draw(t) {
      S.flip(); S.bg(0, G.dist, t);
      const r = Math.floor(t / 1.6) % 4; T.draw(TX + 60, S.RAIL2 + 2, 1.25, { face: r, body: r, wheel: r, roof: r, back: r, light: r }, t, { speed: 0.8, dist: G.dist * 0.05 });
      c.fillStyle = CREAM; c.fillRect(0, 400, W, H - 400); c.fillStyle = '#a89c84'; c.fillRect(0, 398, W, 4);
      tx('でんしゃ こうじょう', W / 2, 472, 84, '#c9453a', 'center');
      tx('ぶひんを つくって どんどん つよく しよう', W / 2, 548, 36, INK, 'center');
      K.button(W / 2 - 200, 592, 400, 108, G.S.made ? 'つづきから' : 'はじめる', '#e2562f', G.start, { size: 52 });
      K.homeButton();
    },
  };
})();
