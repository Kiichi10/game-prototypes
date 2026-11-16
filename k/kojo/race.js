// でんしゃ こうじょう — レース・けっか・じどうの きまり
(function () {
  'use strict';
  const c = K.ctx, W = K.W, H = K.H, L = window.KJ, T = window.KJT, S = window.KJS, G = window.KJG;
  const TX = 430, GOLD = '#f0b53a', INK = '#e8ecf3', SUB = '#9fb0c9', LEN = 6.2;
  const RIVAL_PAL = { main: '#4a4f5c', stripe: '#d8483c' }, RIVAL_RANK = [0, 1, 1, 2, 2, 3];
  const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

  G.startRace = function () {
    if (G.busy()) return;
    const stage = G.S.stage, coins = G.S.coins, boxes = G.S.boxes, res = L.race(G.S); G.save();
    G.race = { t: 0, res, stage, coins, boxes, done: false };
    K.say(G.V.go); K.sfx.whistle();
  };
  G.raceUpdate = function (dt) {
    const R = G.race; R.t += dt;
    const v = R.t < 0.9 ? 0.2 : 1; G.dist += dt * (300 + 900 * v); K.runSound(dt, 0.8 + v * 1.6);
    if (R.t > LEN && !R.done) { R.done = true; finish(R); }
  };
  function finish(R) {
    const res = R.res; let sticker = null;
    if (res.win) { K.sfx.fanfare(); K.confetti(res.clear ? 140 : 70); if (res.clear) sticker = K.addSticker('でんしゃ こうじょう'); K.say(res.clear ? G.V.clear : G.V.win); }
    else { K.sfx.good(); K.say(G.V.lose); }
    G.result = { res, sticker, t: 0 }; G.race = null;
  }
  // じぶんは てまえの せんろ・あいては おくの せんろ（ぶつからない）
  G.raceDraw = function () {
    const R = G.race, r = RIVAL_RANK[L.world(R.stage)], go = R.t > 0.9, u = R.t - 0.9;
    const lead = 70 * sm(u / 1.3) + (R.res.win ? -1 : 1) * sm((u - 1.6) / 3) * 400;
    const gate = W + 500 - sm((R.t - 4.6) / 1.5) * (W + 900);
    if (R.t > 4.5) flag(gate, S.RAIL1 - 96, 0.8);
    T.draw(TX - 40 + lead, S.RAIL1 + 2, 0.92, { face: r, body: 0, wheel: r, roof: r, back: r, light: Math.min(r, 1) }, G.t + 3, { speed: go ? 1 : 0.2, dist: G.dist * 0.05, pal: RIVAL_PAL });
    if (go) S.speedLines(G.t, 0.8);
    G.drawTrain(TX + (go ? 30 * sm(u / 2) : 0), go ? 1 : 0.2);
    if (R.t > 4.5) flag(gate + 40, S.RAIL2 - 130, 1.1);
    if (R.t < 0.9) K.text('よーい…', W / 2, 190, 84, '#fff', 'center', '#141a26');
    else if (R.t < 1.9) K.text('どん！', W / 2, 190, 110, GOLD, 'center', '#141a26');
  };
  function flag(x, y, k) {
    K.rr(x - 5 * k, y, 10 * k, 150 * k, 3, '#e8ecf3', '#59647a', 2);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { c.fillStyle = (i + j) % 2 ? '#141a26' : '#ffffff'; c.fillRect(x + 5 * k + i * 16 * k, y + 4 * k + j * 16 * k, 16 * k, 16 * k); }
  }
  G.resultDraw = function (dt) {
    const R = G.result, res = R.res, e = sm((R.t += dt) / 0.35);
    c.fillStyle = `rgba(8,12,22,${0.7 * e})`; c.fillRect(0, 0, W, H);
    S.plate(270, 80, 740, 560, { r: 22, top: '#2c3850', bot: '#1a2130', edge: res.win ? GOLD : '#55637c', lw: 4 });
    K.text(res.win ? 'かった！' : 'あと すこし！', W / 2, 150, 76, res.win ? GOLD : INK, 'center');
    if (res.win) {
      S.coin(480, 270, 34); K.text('+' + L.WINCOIN, 526, 273, 52, GOLD, 'left');
      S.box(730, 270, 62); K.text('+' + L.WINBOX, 776, 273, 52, INK, 'left');
      if (R.sticker) { K.circle(W / 2 - 190, 400, 62, '#ffffff', '#c3cedd', 3); K.drawSticker(R.sticker.s, W / 2 - 190, 400, 46); K.text('シールを もらったよ', W / 2 - 110, 384, 34, INK, 'left'); K.text('つぎは ' + L.WORLDS[L.world(G.S.stage)], W / 2 - 110, 430, 30, SUB, 'left'); }
      else K.text('はこを もらったよ。もっと つよく しよう', W / 2, 400, 32, SUB, 'center');
    } else {
      S.box(590, 270, 62); K.text('+' + L.LOSEBOX, 636, 273, 52, INK, 'left');
      K.text('ぶひんを つくって つよく しよう', W / 2, 380, 34, INK, 'center');
      K.text('じぶん ' + res.me + '  あいて ' + res.need, W / 2, 436, 30, SUB, 'center');
    }
    if (R.t > 0.8) K.button(W / 2 - 200, 510, 400, 104, res.win ? 'つぎへ' : 'わかった', res.win ? '#3f9f66' : '#2f7fc4', closeResult, { size: 48 });
  };
  function closeResult() {
    G.result = null; G.hintT = 0; G.pshow = L.power(G.S);
    if (G.S.stage >= L.RULE_STAGE && !G.S.seen.rule) { G.S.seen.rule = 1; G.save(); K.say(G.V.rule); G.ruleGlow = 1; }
  }

  // ---- じどうの きまり（もし 〜 なら 〜） ----
  const IFN = { up: 'つよく なる', down: 'よわく なる' }, THN = { equip: 'つける', sell: 'うる' };
  G.openRules = function () { if (G.busy()) return; G.rules = true; G.ruleGlow = 0; if (!G.S.seen.ruleHelp) { G.S.seen.ruleHelp = 1; K.say(G.V.ruleHelp); } };
  function cycleIf(i) {
    const r = G.S.rules[i];
    if (!r) G.S.rules[i] = { if: 'up', then: 'equip' }; else if (r.if === 'up') G.S.rules[i] = { if: 'down', then: 'sell' }; else G.S.rules[i] = null;
    G.save();
  }
  function cycleThen(i) { const r = G.S.rules[i]; if (r) { r.then = r.then === 'equip' ? 'sell' : 'equip'; G.save(); } }
  G.rulesDraw = function () {
    c.fillStyle = 'rgba(8,12,22,0.75)'; c.fillRect(0, 0, W, H);
    S.plate(120, 60, 1040, 600, { r: 22, top: '#2c3850', bot: '#1a2130', edge: '#8a7ad8', lw: 4 });
    K.text('じどうの きまり', W / 2, 112, 48, '#c9b8ff', 'center');
    K.text('ぶひんが できた とき、きまりの とおりに じどうで うごくよ', W / 2, 166, 28, SUB, 'center');
    for (let i = 0; i < 2; i++) {
      const y = 220 + i * 150, r = G.S.rules[i];
      K.rr(150, y, 980, 126, 14, '#141a26', '#3a4763', 2);
      K.text('もし', 220, y + 65, 40, INK, 'center');
      K.button(290, y + 14, 340, 98, r ? IFN[r.if] : 'なし', r ? (r.if === 'up' ? '#3f9f66' : '#c9453a') : '#55637c', () => cycleIf(i), { size: 38 });
      if (r) { K.text('なら', 700, y + 65, 40, INK, 'center'); K.button(770, y + 14, 330, 98, THN[r.then], r.then === 'equip' ? '#2f7fc4' : '#d79a26', () => cycleThen(i), { size: 40 }); }
      else K.text('おすと きまりを つくれるよ', 880, y + 65, 28, '#6b7a94', 'center');
    }
    K.button(W / 2 - 200, 540, 400, 96, 'できた', '#6b5bb5', () => { G.rules = false; }, { size: 46 });
  };
})();
