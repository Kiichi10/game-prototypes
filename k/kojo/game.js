// でんしゃ こうじょう — タイトル・こうじょうの がめん・ぶひんを くらべる
(function () {
  'use strict';
  const c = K.ctx, W = K.W, H = K.H, L = window.KJ, T = window.KJT, S = window.KJS;
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
  G.mode = 'title'; G.pop = null; G.race = null; G.result = null; G.rules = false;
  G.dist = 0; G.press = 0; G.flash = 0; G.floats = []; G.pshow = L.power(G.S); G.hintT = 0;
  G.looks = () => { const o = {}; for (const s of L.SLOTS) o[s.id] = G.S.parts[s.id].rank; return o; };
  G.busy = () => !!(G.pop || G.race || G.result || G.rules || G.press > 0);
  const TX = 430, GOLD = '#f0b53a', INK = '#e8ecf3', SUB = '#9fb0c9';
  const float = (text, col) => G.floats.push({ text, col, t: 0 });

  // ---- きかいを おす → ぶひんが できる ----
  G.tapMachine = function () {
    if (G.busy()) return;
    if (G.S.boxes <= 0) { K.sfx.oops(); K.say(G.V.nobox); G.hintT = 0; return; }
    G.S.boxes--; G.press = 1; K.sfx.door && K.sfx.door();
  };
  function born() {
    const p = L.make(G.S); G.S.made++;
    G.pop = { p, t: 0, auto: L.auto(G.S, p), d: L.diff(G.S, p) }; G.save();
    if (p.rank === 3) { K.sfx.fanfare(); K.confetti(60); K.say(G.V.legend); }
    else if (p.rank === 2) { K.sfx.star(); K.say(G.V.great); }
    else {
      K.sfx.star(); const k = G.pop.d > 0 ? 'up' : 'down';
      if (!G.pop.auto && (G.S.seen[k] || 0) < 2) { G.S.seen[k] = (G.S.seen[k] || 0) + 1; K.say(G.V[k]); }
    }
  }
  G.decide = function (act) {
    const pp = G.pop; if (!pp) return; const before = L.power(G.S);
    if (act === 'equip') {
      const got = L.equip(G.S, pp.p), d = L.power(G.S) - before; G.flash = 1; K.sfx.good(); K.sparkle(TX, 250, 26, L.RANKS[pp.p.rank].col);
      float((d >= 0 ? '+' : '') + d, d >= 0 ? '#7fe08a' : '#ff8a7a'); G.coinPop = got;
    } else { G.coinPop = L.sell(G.S, pp.p); K.sfx.pop(); }
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
    S.plate(450, 14, 380, 62); K.text(L.WORLDS[w], 590, 46, 32, INK, 'center');
    for (let i = 0; i < 3; i++) K.circle(742 + i * 30, 45, 10, i < L.step(st) ? GOLD : '#141a26', '#8fa3c0', 2);
    S.plate(1056, 14, 208, 62); S.coin(1092, 45, 19); K.text(String(G.race ? G.race.coins : G.S.coins), 1244, 47, 36, GOLD, 'right');
    const me = Math.round(G.pshow), need = G.race ? G.race.res.need : L.target(G.S), ok = L.power(G.S) >= need && !G.race;
    S.plate(250, 86, 780, 60);
    K.text('じぶん', 268, 117, 28, SUB, 'left'); K.text(String(me), 512, 118, 40, ok ? '#7fe08a' : INK, 'right');
    K.rr(530, 104, 220, 24, 12, '#141a26', '#55637c', 2);
    const q = Math.min(1, me / need); if (q > 0.04) K.rr(533, 107, 214 * q, 18, 9, q >= 1 ? '#7fe08a' : GOLD);
    K.text('あいて', 768, 117, 28, SUB, 'left'); K.text(String(need), 1012, 118, 40, '#ff9a8a', 'right');
  }
  function slotCard(i) {
    const s = L.SLOTS[i], p = G.S.parts[s.id], x = 16 + (i % 3) * 184, y = 410 + Math.floor(i / 3) * 152, col = L.RANKS[p.rank].col;
    S.plate(x, y, 176, 144, { edge: col, lw: 4 });
    K.rr(x + 8, y + 36, 160, 70, 6, '#43557a'); T.icon(s.id, p.rank, x + 88, y + 71, 160, 70, G.t);
    K.text(s.name, x + 12, y + 20, 28, INK, 'left'); K.text(String(p.pow), x + 164, y + 126, 32, GOLD, 'right');
    for (let k = 0; k <= p.rank; k++) K.star(x + 22 + k * 22, y + 125, 9, col);
  }
  function panel() {
    const g = c.createLinearGradient(0, 400, 0, H); g.addColorStop(0, '#263146'); g.addColorStop(1, '#161c29');
    c.fillStyle = g; c.fillRect(0, 400, W, H - 400); c.fillStyle = '#55637c'; c.fillRect(0, 398, W, 4);
    for (let i = 0; i < 6; i++) slotCard(i);
    const idle = !G.busy(), can = L.power(G.S) >= L.target(G.S);
    S.machine(690, 546, G.t, G.press, idle && G.S.boxes > 0 && !can);
    for (let i = 0; i <= G.S.factory; i++) K.star(690 - G.S.factory * 13 + i * 26, 660, 10, GOLD);
    S.box(640, 700, 28); K.text('はこ ' + (G.race ? G.race.boxes : G.S.boxes), 664, 702, 30, G.S.boxes > 0 ? INK : '#ff9a8a', 'left');
    if (idle) S.hit(566, 402, 248, 318, G.tapMachine);
    if (idle) {
      if (can) { c.save(); c.globalAlpha = 0.5 + 0.4 * Math.sin(G.t * 7); K.rr(828, 404, 440, 144, 20, null, '#ffe27a', 7); c.restore(); }
      K.button(836, 412, 424, 128, 'レース！', '#e2562f', () => G.startRace(), { size: 60 });
      const fc = L.FCOST[G.S.factory], max = fc == null;
      K.button(836, 556, 424, 72, max ? 'こうじょう さいこう！' : '', max ? '#55637c' : L.canUp(G.S) ? '#3f9f66' : '#4a5a52', () => { if (!max) G.upFactory(); }, { size: 30 });
      if (!max) { K.text('こうじょうを つよく', 856, 594, 30, '#fff', 'left'); S.coin(1160, 592, 16); K.text(String(fc), 1184, 594, 30, L.canUp(G.S) ? '#fff' : '#ffb0a0', 'left'); }
      if (G.ruleGlow) { c.save(); c.globalAlpha = 0.5 + 0.4 * Math.sin(G.t * 7); K.rr(828, 634, 440, 82, 18, null, '#ffe27a', 6); c.restore(); }
      if (G.S.stage >= L.RULE_STAGE || G.S.seen.rule) K.button(836, 642, 424, 66, 'じどうの きまり', '#6b5bb5', () => G.openRules(), { size: 32 });
      else { S.plate(836, 642, 424, 66); K.text('？', 1048, 676, 34, '#55637c', 'center'); }
    }
    if (G.race) K.text(G.race.t < 0.9 ? 'よーい…' : 'がんばれ！', 1048, 556, 64, G.race.t < 0.9 ? INK : GOLD, 'center');
  }
  function card(x, y, label, p, hi) {
    const r = L.RANKS[p.rank]; S.plate(x, y, 340, 320, { edge: r.col, lw: hi ? 6 : 3, top: '#3a4763' });
    K.text(label, x + 170, y + 30, 30, SUB, 'center');
    K.rr(x + 20, y + 54, 300, 130, 8, '#43557a'); T.icon(p.slot, p.rank, x + 170, y + 119, 300, 130, G.t);
    K.rr(x + 20, y + 196, 150, 40, 8, r.col); K.text(r.name, x + 95, y + 217, 28, p.rank === 3 ? '#3a2a00' : '#fff', 'center');
    K.text(L.SLOTS.find(s => s.id === p.slot).name, x + 320, y + 217, 30, INK, 'right');
    K.text('ちから', x + 24, y + 278, 28, SUB, 'left'); K.text(String(p.pow), x + 318, y + 276, 52, GOLD, 'right');
  }
  function popup() {
    const pp = G.pop, p = pp.p, old = G.S.parts[p.slot], e = Math.min(1, pp.t / 0.3), up = pp.d > 0;
    c.fillStyle = `rgba(8,12,22,${0.72 * e})`; c.fillRect(0, 0, W, H);
    c.save(); c.translate(W / 2, 350); c.scale(0.7 + 0.3 * e, 0.7 + 0.3 * e); c.translate(-W / 2, -350);
    S.plate(170, 50, 940, 610, { r: 20, top: '#2c3850', bot: '#1a2130' });
    K.text('あたらしい ぶひん！', W / 2, 96, 44, L.RANKS[p.rank].col, 'center');
    card(200, 130, 'いまの', old, false); card(740, 130, 'あたらしい', p, true);
    const col = up ? '#7fe08a' : '#ff8a7a';
    c.fillStyle = col; c.beginPath(); if (up) { c.moveTo(640, 220); c.lineTo(690, 280); c.lineTo(590, 280); } else { c.moveTo(640, 290); c.lineTo(690, 230); c.lineTo(590, 230); } c.closePath(); c.fill();
    K.text((pp.d > 0 ? '+' : '') + pp.d, 640, 330, 50, col, 'center'); K.text(up ? 'つよく なる' : pp.d === 0 ? 'おなじ' : 'よわく なる', 640, 385, 28, col, 'center');
    c.restore();
    if (pp.auto) {
      K.rr(390, 480, 500, 110, 16, '#6b5bb5', '#3d2a66', 3); K.text('きまりで ' + (pp.auto === 'equip' ? 'つけるよ' : 'うるよ'), W / 2, 536, 40, '#fff', 'center');
      if (pp.t > 0.9) G.decide(pp.auto);
    } else if (pp.t > 0.3) {
      const pulse = (x) => { c.save(); c.globalAlpha = 0.5 + 0.4 * Math.sin(G.t * 7); K.rr(x - 8, 472, 356, 126, 22, null, '#ffe27a', 6); c.restore(); };
      pulse(up ? 740 : 200);
      K.button(200, 480, 340, 110, 'うる', '#c9453a', () => G.decide('sell'), { size: 48 }); S.coin(470, 535, 16); K.text('+' + L.sellOf(p), 492, 537, 28, '#fff', 'left');
      K.button(740, 480, 340, 110, 'つける', '#3f9f66', () => G.decide('equip'), { size: 48 });
      if (G.S.made <= 2) S.finger((up ? 740 : 200) + 250, 600, G.t);
    }
  }
  G.drawTrain = function (x, sp) { T.draw(x, S.RAIL2 + 2, 1.25, G.looks(), G.t, { speed: sp, dist: G.dist * 0.05, flash: G.flash }); };
  function floats(dt) {
    G.floats = G.floats.filter(f => (f.t += dt) < 1.2);
    for (const f of G.floats) { c.save(); c.globalAlpha = Math.min(1, (1.2 - f.t) * 3); K.text(f.text, TX + 40, 210 - f.t * 46, 64, f.col, 'center', '#141a26'); c.restore(); }
  }
  const main = {
    update(dt, t) {
      G.t = t; G.hintT += dt; G.flash = Math.max(0, G.flash - dt * 2.5);
      G.pshow += (L.power(G.S) - G.pshow) * Math.min(1, dt * 8);
      if (G.press > 0) { G.press -= dt * 2.2; if (G.press <= 0) { G.press = 0; born(); } }
      if (G.pop) G.pop.t += dt;
      if (G.race) G.raceUpdate(dt); else { G.dist += dt * 300; K.runSound(dt, 0.8); }
    },
    draw(t, dt) {
      S.flip();
      const st = G.race ? G.race.stage : G.S.stage;
      S.bg(L.world(st), G.dist, t);
      if (G.race) G.raceDraw(dt); else G.drawTrain(TX, 0.5);
      floats(dt); hud(); panel();
      if (!G.busy()) {
        K.homeButton();
        if (G.S.made === 0 && G.S.boxes > 0) S.finger(760, 560, t);
        else if (L.power(G.S) >= L.target(G.S) && G.hintT > 6) S.finger(1180, 520, t);
      }
      if (G.pop) popup();
      if (G.rules) G.rulesDraw();
      if (G.result) G.resultDraw(dt);
    },
  };
  G.start = function () { G.mode = 'main'; K.scene = main; G.hintT = 0; if (G.S.made === 0) K.say(G.V.start); };
  const demo = [0, 1, 2, 3];
  K.scene = {
    update(dt, t) { G.t = t; G.dist += dt * 420; },
    draw(t) {
      S.flip(); S.bg(0, G.dist, t);
      const r = demo[Math.floor(t / 1.6) % 4]; T.draw(TX + 60, S.RAIL2 + 2, 1.25, { face: r, body: r, wheel: r, roof: r, back: r, light: r }, t, { speed: 0.8, dist: G.dist * 0.05 });
      const g = c.createLinearGradient(0, 400, 0, H); g.addColorStop(0, '#263146'); g.addColorStop(1, '#161c29'); c.fillStyle = g; c.fillRect(0, 400, W, H - 400); c.fillStyle = '#55637c'; c.fillRect(0, 398, W, 4);
      K.text('でんしゃ こうじょう', W / 2, 470, 78, GOLD, 'center', '#141a26');
      K.text('ぶひんを つくって どんどん つよく しよう', W / 2, 546, 34, INK, 'center');
      K.button(W / 2 - 200, 592, 400, 104, G.S.made ? 'つづきから' : 'はじめる', '#e2562f', G.start, { size: 48 });
      K.homeButton();
    },
  };
})();
