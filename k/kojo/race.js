// でんしゃ こうじょう — レース・けっか・じどうの きまり
(function () {
  'use strict';
  const c = K.ctx, W = K.W, H = K.H, L = window.KJ, S = window.KJS, G = window.KJG, tx = S.t;
  const TX = 430, LEN = 6.2, { INK, SUB, AMB, UPC, DNC } = G.COL;
  const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

  G.startRace = function () {
    if (G.busy()) return;
    const stage = G.S.stage, coins = G.S.coins, boxes = G.S.boxes, gap0 = G.gap(), res = L.race(G.S); G.save();
    G.race = { t: 0, res, stage, coins, boxes, gap0, done: false };
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
    G.result = { res, sticker, t: 0 }; G.race = null; G.pshow = L.power(G.S);
  }
  // じぶんは てまえの せんろ・あいては おくの せんろ（ぶつからない）
  G.raceDraw = function () {
    const R = G.race, go = R.t > 0.9, u = R.t - 0.9;
    const start = Math.max(40, Math.min(160, R.gap0)), lead = start + ((R.res.win ? -440 : 470) - start) * sm((u - 1.2) / 3.2);
    const gate = W + 500 - sm((R.t - 4.6) / 1.5) * (W + 900);
    if (R.t > 4.5) flag(gate, S.RAIL1 - 96, 0.8);
    G.drawRival(TX - 40 + lead, go ? 1 : 0.2, R.stage);
    if (go) S.speedLines(G.t, 0.8);
    G.drawTrain(TX + (go ? 30 * sm(u / 2) : 0), go ? 1 : 0.2);
    if (R.t > 4.5) flag(gate + 40, S.RAIL2 - 130, 1.1);
    if (R.t > 0.9 && R.t < 1.9) tx('どん！', W / 2, 200, 120, '#ffd23f', 'center', '#141a26');
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
