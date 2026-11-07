// せんろチェンジレース（よこスクロール）
// 3本のせんろ。ぶんきてん（ポイント）で どのせんろに はいるかを えらぶ。
(function () {
  'use strict';
  const W = K.W, H = K.H, ctx = K.ctx;
  const LY = [215, 365, 515];          // せんろの たかさ
  const BAND = 68;
  const PX = 420;                      // じぶんの でんしゃの がめん x
  const SEG = 1100, NSW = 18, SWH = 150; // ポイントの かんかく・かず・はば
  const FIN = NSW * SEG + 1000;        // ゴールの えき
  const BASE = 250, SLOW = 135, BOOST = 140;
  const ZS = 210, ZE = 890;            // くかんの はじまり・おわり（セグメント内）
  const MINGAP = 200, GAP = 240;
  const GAME = 'せんろチェンジレース';

  let R = null;

  // ---------- コースを つくる ----------
  function buildCourse() {
    const segs = [];
    segs[0] = { types: ['plain', 'plain', 'plain'], river: false };
    let prevStar = 0;
    for (let k = 1; k < NSW; k++) {
      let types;
      if (k === 1) types = ['star', 'plain', 'sheep'];
      else {
        let st;
        do { st = Math.floor(Math.random() * 3); } while (st === prevStar && Math.random() < 0.75);
        const rest = [0, 1, 2].filter(i => i !== st);
        const sh = rest[Math.floor(Math.random() * 2)];
        types = [];
        for (let i = 0; i < 3; i++) types[i] = i === st ? 'star' : i === sh ? 'sheep' : (Math.random() < 0.5 ? 'tunnel' : 'plain');
        prevStar = st;
      }
      const river = k % 3 === 0 && !types.includes('tunnel');
      segs[k] = { types, river };
    }
    segs[NSW] = { types: ['plain', 'plain', 'plain'], river: false };
    const stars = [];
    for (let k = 1; k < NSW; k++) segs[k].types.forEach((ty, l) => {
      if (ty === 'star') for (let j = 0; j < 4; j++) stars.push({ id: stars.length, x: k * SEG + 250 + j * 160, lane: l, taken: false });
    });
    return { segs, stars };
  }
  function zoneAt(x, lane) {
    const k = Math.floor(x / SEG);
    if (k < 1 || k >= NSW) return 'plain';
    const loc = x - k * SEG;
    if (loc < ZS || loc > ZE) return 'plain';
    return R.segs[k].types[lane];
  }

  // ---------- でんしゃ ----------
  function makeTrain(lane, color, stripe, isP) {
    return { x: 0, lane, target: lane, v: 0, trans: null, done: 0, boost: 0, yieldT: 0, pushT: 0, color, stripe, isP, got: new Set(), finished: false, sheepRun: 0 };
  }
  function yAt(t, x) {
    if (!t.trans) return LY[t.lane];
    const p = Math.max(0, Math.min(1, (x - (t.trans.S - SWH)) / (2 * SWH)));
    const e = p * p * (3 - 2 * p);
    return LY[t.trans.from] + (LY[t.trans.to] - LY[t.trans.from]) * e;
  }
  function occupiedLanes(o, k) {
    // o が ポイント k で つかう（かもしれない）せんろ
    if (o.done >= k) { if (o.trans) return range(o.trans.from, o.trans.to); return [o.lane]; }
    return range(o.lane, o.target);
  }
  function range(a, b) { const r = []; for (let i = Math.min(a, b); i <= Math.max(a, b); i++) r.push(i); return r; }

  function aiChoose(t, k) {
    const seg = R.segs[k];
    const val = { star: 3, plain: 2, tunnel: 2, sheep: 0.3 };
    let best = t.lane, bs = -99;
    const smart = Math.random() > 0.4;
    for (let l = 0; l < 3; l++) {
      let s = smart ? val[seg.types[l]] + Math.random() * 1.6 : Math.random() * 3;
      if (Math.abs(l - t.lane) === 2) s -= 0.4;
      const sweep = range(t.lane, l);
      for (const o of R.trains) {
        if (o === t || Math.abs(o.x - t.x) > GAP + 80) continue;
        if (occupiedLanes(o, k).some(q => sweep.includes(q))) s -= 10;
      }
      if (s > bs) { bs = s; best = l; }
    }
    t.target = best;
  }

  function onPlayerSwitch(p) {
    const sweep = range(p.trans.from, p.trans.to);
    for (const r of R.trains) {
      if (r === p || Math.abs(r.x - p.x) > 300) continue;
      const lanes = r.trans ? range(r.trans.from, r.trans.to) : [r.lane];
      if (lanes.some(q => sweep.includes(q))) { if (r.x < p.x) r.yieldT = 1.8; else r.pushT = 1.8; }
    }
  }

  function choose(i) {
    if (!R || (R.phase !== 'run' && R.phase !== 'tut')) return;
    const P = R.P;
    if (P.target !== i) K.sfx.clack();
    P.target = i;
    if (R.phase === 'tut') {
      R.phase = 'run'; R.tutDone = true;
      const z = R.segs[1].types[i];
      if (z === 'star') say('そう！ ほしの せんろだ！ ほしを とると はやく なるよ', 'ほしを とると はやく なるよ');
      else say('いいね！ その せんろで いこう', 'その せんろで いこう！');
    }
  }

  function say(speech, banner) { K.say(speech); R.msg = banner || speech; R.msgT = 4; }

  // ---------- レース ----------
  function startRace() {
    const c = buildCourse();
    const P = makeTrain(1, '#e94b4b', '#ffd23f', true);
    R = {
      segs: c.segs, stars: c.stars, P,
      trains: [makeTrain(0, '#9b6bff', '#ffffff', false), P, makeTrain(2, '#ff9a3c', '#ffffff', false)],
      phase: 'count', t: 0, msg: '', msgT: 0, tutDone: false, tutT: 0, order: [], firstStar: false, firstSheep: false, helpT: 0, helpLane: -1, endT: 0,
    };
    say('しんごうを みてね', 'しんごうを みてね');
    K.tone(660, 0, 0.25, 'sine', 0.2);
    K.handlers.down = p => {
      if (p.x < 160) return;
      for (let i = 0; i < 3; i++) if (Math.abs(p.y - LY[i]) < BAND + 8) { K.sfx.pop(); choose(i); }
    };
    K.scene = { update, draw };
  }

  function update(dt) {
    R.t += dt; R.msgT -= dt; if (R.helpT > 0) R.helpT -= dt;
    if (R.phase === 'count') {
      const prev = R.t - dt;
      if (prev < 1 && R.t >= 1) K.tone(660, 0, 0.25, 'sine', 0.2);
      if (prev < 2 && R.t >= 2) { K.sfx.whistle(); say('しゅっぱつ しんこう！'); }
      if (R.t >= 2.6) R.phase = 'run';
      return;
    }
    if (R.phase === 'tut') {
      R.tutT += dt;
      if (R.tutT > 8) { R.tutT = 0; say('やじるしを おして せんろを えらぼう'); }
      return;
    }
    if (R.phase === 'result') { R.endT += dt; if (R.endT > 4) finishGame(); return; }

    const P = R.P;
    // さいしょの ぶんきてんの まえで とまって おしえる
    if (!R.tutDone && P.x >= SEG - SWH - 300) {
      R.phase = 'tut'; R.tutT = 0;
      say('やじるしを おして せんろを えらぼう'); return;
    }
    for (const t of R.trains) moveTrain(t, dt);
    separate();
    K.runSound(dt, P.v / 230);

    // じぶんが ゴール
    if (P.finished && R.phase === 'run') {
      R.phase = 'goal'; R.goalT = 0;
    }
    if (R.phase === 'goal') {
      R.goalT += dt;
      if (R.goalT > 1.6) toResult();
    }
  }

  function moveTrain(t, dt) {
    let tgt = BASE;
    if (!t.isP) {
      const gap = t.x - R.P.x;
      tgt *= 0.97 * (gap > 400 ? 0.86 : gap < -400 ? 1.3 : 1);
    }
    if (t.boost > 0) { t.boost -= dt; tgt += BOOST; }
    const z = t.trans ? 'plain' : zoneAt(t.x, t.lane);
    if (z === 'sheep') tgt = Math.min(tgt, SLOW);
    if (t.yieldT > 0) { t.yieldT -= dt; tgt *= 0.5; }
    if (t.pushT > 0) { t.pushT -= dt; tgt += 130; }
    if (R.phase === 'count' || R.phase === 'tut') tgt = 0;
    if (t.x >= FIN) tgt = t.isP ? Math.max(0, (FIN + 260 - t.x) * 1.2) : BASE;
    t.v += (tgt - t.v) * Math.min(1, dt * (z === 'sheep' ? 4 : 2.5));
    t.x += t.v * dt;

    // ポイント
    const k = Math.round(t.x / SEG), S = k * SEG;
    if (k >= 1 && k <= NSW && !t.trans && t.done < k && t.x >= S - SWH) {
      t.done = k;
      if (!t.isP) aiChoose(t, k);
      if (t.target !== t.lane) {
        t.trans = { from: t.lane, to: t.target, S };
        t.lane = t.target;
        if (t.isP) onPlayerSwitch(t);
      }
    }
    if (t.trans && t.x > t.trans.S + SWH + 220) t.trans = null;

    // ほし
    for (const s of R.stars) {
      if (s.lane !== t.lane || t.trans || t.got.has(s.id) || Math.abs(s.x - t.x) > 40) continue;
      t.got.add(s.id); t.boost = Math.min(3.2, Math.max(t.boost, 0) + 1.6);
      if (t.isP) {
        s.taken = true; K.sfx.star(); K.sparkle(s.x - camX(), LY[s.lane], 12, '#ffd23f');
        if (!R.firstStar) { R.firstStar = true; say('ほしを とった！ はやく なったよ'); }
      }
    }
    // ひつじ（じぶん）
    if (t.isP) {
      const k2 = Math.floor(t.x / SEG);
      if (z === 'sheep' && t.sheepSeg !== k2) {
        t.sheepSeg = k2; t.sheepRun = (t.lastSheepSeg === k2 - 1) ? t.sheepRun + 1 : 1; t.lastSheepSeg = k2;
        if (!R.firstSheep) { R.firstSheep = true; say('ひつじさんが いるから ゆっくり はしろうね', 'ひつじさんが いるから ゆっくり'); }
        else if (t.sheepRun >= 2 && k2 + 1 < NSW) {
          R.helpLane = R.segs[k2 + 1].types.indexOf('star'); R.helpT = 5;
          say('つぎは ほしの せんろを えらんでみよう', 'つぎは ほしの せんろを えらんでみよう');
        }
      }
    }
    if (t.x >= FIN && !t.finished) { t.finished = true; R.order.push(t); if (t.isP) { K.sfx.dingdong(); } }
  }

  // おなじ せんろでは あいだを あける（ぶつからない）
  function separate() {
    const T = R.trains;
    for (let i = 0; i < T.length; i++) for (let j = 0; j < T.length; j++) {
      if (i === j) continue;
      const a = T[i], b = T[j]; // b が まえ
      if (b.x <= a.x) continue;
      const dx = b.x - a.x;
      if (Math.abs(yAt(a, a.x) - yAt(b, b.x)) > 100 && Math.abs(yAt(a, a.x - 140) - yAt(b, b.x - 140)) > 100) continue;
      if (dx < GAP) a.v = Math.min(a.v, b.v * (dx / GAP));
      if (dx < MINGAP) a.x = b.x - MINGAP;
    }
  }

  function camX() { return R.P.x - PX; }

  // ---------- けっか ----------
  function ranking() {
    const rest = R.trains.filter(t => !R.order.includes(t)).sort((a, b) => b.x - a.x);
    return R.order.concat(rest);
  }
  function toResult() {
    R.phase = 'result'; R.endT = 0; R.final = ranking();
    R.rank = R.final.indexOf(R.P) + 1;
    K.sfx.fanfare();
    if (R.rank === 1) { K.confetti(160); K.say('ゴール！ いちばんだ！ すごい すごい！'); }
    else K.say('ゴール！ ' + ['', '', 'にばん', 'さんばん'][R.rank] + 'だよ！ よく がんばったね');
  }
  function finishGame() {
    const msg = R.rank === 1 ? 'いちばん！ チャンピオンだ！' : R.rank === 2 ? '2ばん！ よく がんばったね' : '3ばん！ さいごまで はしれたね';
    R.phase = 'reward'; K.handlers.down = null;
    K.reward(GAME, msg, startRace);
  }

  // ---------- えがく ----------
  function draw(time) {
    const cx = camX();
    // くさはら
    ctx.fillStyle = '#9ad672'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(0, LY[i] - BAND, W, BAND * 2); }
    // はな
    for (let k = Math.floor(cx / 160) - 1; k < (cx + W) / 160 + 1; k++) {
      const hx = k * 160 - cx + ((k * 73) % 60), hy = [140, 290, 440, 590][((k % 4) + 4) % 4];
      K.circle(hx, hy, 5, ['#fff', '#ffe066', '#ff9ad5'][((k % 3) + 3) % 3]);
    }

    const k0 = Math.max(0, Math.floor(cx / SEG) - 1), k1 = Math.floor((cx + W) / SEG) + 1;
    // かわ・てっきょう
    for (let k = k0; k <= k1 && k <= NSW; k++) {
      if (!R.segs[k] || !R.segs[k].river) continue;
      const rx = k * SEG + 560 - cx;
      ctx.fillStyle = '#5ab8f0'; ctx.fillRect(rx - 70, 130, 140, 470);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 4;
      for (let y = 150; y < 600; y += 46) { ctx.beginPath(); ctx.moveTo(rx - 40, y + Math.sin(time * 3 + y) * 4); ctx.quadraticCurveTo(rx - 15, y - 10, rx + 10, y + Math.sin(time * 3 + y) * 4); ctx.stroke(); }
      for (let l = 0; l < 3; l++) {
        K.rr(rx - 90, LY[l] - 44, 180, 88, 8, '#b88a5a', '#7a5432', 4);
        ctx.strokeStyle = '#d33'; ctx.lineWidth = 6;
        for (const sy of [-44, 44]) { ctx.beginPath(); ctx.moveTo(rx - 90, LY[l] + sy); ctx.lineTo(rx + 90, LY[l] + sy); ctx.stroke(); }
      }
    }
    // くかん（ひつじ・トンネルの じめん）
    for (let k = Math.max(1, k0); k <= k1 && k < NSW; k++) {
      R.segs[k].types.forEach((ty, l) => {
        const x1 = k * SEG + ZS - cx, x2 = k * SEG + ZE - cx;
        if (ty === 'sheep') { K.rr(x1, LY[l] - BAND + 4, x2 - x1, BAND * 2 - 8, 20, 'rgba(255,240,150,0.75)'); }
        if (ty === 'tunnel') { K.rr(x1 - 10, LY[l] - BAND + 2, x2 - x1 + 20, BAND * 2 - 4, 40, '#5d9a46', '#467a34', 5); ctx.fillStyle = '#3d3d4a'; ctx.fillRect(x1, LY[l] - 36, x2 - x1, 72); }
      });
    }
    // せんろ
    for (let l = 0; l < 3; l++) drawRail(cx - 60, cx + W + 60, l, cx);
    // ポイント
    for (let k = Math.max(1, k0); k <= k1 && k <= NSW; k++) drawSwitch(k * SEG, cx);
    // トンネルの いりぐち
    for (let k = Math.max(1, k0); k <= k1 && k < NSW; k++) R.segs[k].types.forEach((ty, l) => {
      if (ty !== 'tunnel') return;
      for (const xx of [k * SEG + ZS - cx, k * SEG + ZE - cx]) { K.rr(xx - 14, LY[l] - 46, 28, 92, 10, '#9b9488', '#6d675e', 4); }
    });
    // ゴールの えき
    drawStation(FIN - cx);
    // スタートの せん
    for (let y = 140; y < 590; y += 30) { ctx.fillStyle = (y / 30) % 2 ? '#fff' : '#333'; ctx.fillRect(-cx - 8 + 30, y, 16, 30); }

    // えらんだ みち（やじるし）
    drawRoute(time, cx);
    // ほし
    for (const s of R.stars) { if (s.taken) continue; const sx = s.x - cx; if (sx < -40 || sx > W + 40) continue; K.star(sx, LY[s.lane] + Math.sin(time * 4 + s.id) * 5, 30 + Math.sin(time * 6 + s.id) * 3, '#ffd23f'); }
    // ひつじ と かんばん
    for (let k = Math.max(1, k0); k <= k1 && k < NSW; k++) R.segs[k].types.forEach((ty, l) => {
      if (ty !== 'sheep') return;
      const x1 = k * SEG + ZS - cx;
      drawSign(x1 + 30, LY[l] - 40);
      for (let j = 0; j < 3; j++) {
        const sx = x1 + 170 + j * 200 + ((time * 18) % 60);
        drawSheep(sx, LY[l] - 48 + (j % 2) * 96, time + j);
      }
    });
    // でんしゃ
    const order = R.trains.slice().sort((a, b) => (a.isP ? 1 : 0) - (b.isP ? 1 : 0));
    for (const t of order) drawTrain(t, cx, time);
    // まえの らいばる（がめんの そと）
    for (const t of R.trains) {
      if (t.isP) continue; const sx = t.x - cx;
      if (sx > W + 20) { const y = yAt(t, t.x); ctx.beginPath(); ctx.moveTo(W - 8, y); ctx.lineTo(W - 44, y - 26); ctx.lineTo(W - 44, y + 26); ctx.closePath(); ctx.fillStyle = t.color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke(); }
    }

    drawButtons(time);
    drawHUD(time);
    // した の メッセージ
    K.rr(170, 604, 1094, 104, 28, 'rgba(255,255,255,0.92)', '#e94b4b', 5);
    if (R.msgT > 0 && R.msg) K.text(R.msg, 717, 657, 40, '#2b3a55', 'center', null);
    else if (R.phase === 'run') K.text('ほしの せんろは はやいよ', 717, 657, 36, '#8a94a8', 'center', null);

    if (R.phase === 'count') drawSignal();
    if (R.phase === 'tut') drawTutorial(time);
    if (R.phase === 'goal' && R.goalT < 1.6) K.text('ゴール！', W / 2, 330, 120, '#e94b4b', 'center', '#fff');
    if (R.phase === 'result') drawResult(time);
    K.homeButton();
  }

  function drawRail(xa, xb, l, cx) {
    const y = LY[l];
    ctx.fillStyle = '#8a6a4a';
    for (let x = Math.floor(xa / 40) * 40; x < xb; x += 40) ctx.fillRect(x - cx - 7, y - 30, 14, 60);
    ctx.fillStyle = '#7d8696';
    ctx.fillRect(0, y - 20, W, 6); ctx.fillRect(0, y + 14, W, 6);
  }
  function smoothPath(xs, ya, yb, cx, off) {
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) { const p = i / 20, e = p * p * (3 - 2 * p); const x = xs - SWH + p * 2 * SWH - cx, y = ya + (yb - ya) * e + off; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  }
  function drawSwitch(S, cx) {
    if (S - SWH - cx > W + 20 || S + SWH - cx < -20) return;
    for (const [a, b] of [[0, 1], [1, 0], [1, 2], [2, 1]]) for (const off of [-17, 17]) { smoothPath(S, LY[a], LY[b], cx, off); ctx.strokeStyle = '#7d8696'; ctx.lineWidth = 5; ctx.stroke(); }
    // ポイントの めじるし
    const sx = S - SWH - cx;
    K.rr(sx - 6, 132, 12, 34, 4, '#555'); K.circle(sx, 132, 12, '#ffd23f', '#555', 3);
  }
  function drawRoute(time, cx) {
    const P = R.P; if (R.phase === 'result' || R.phase === 'goal') return;
    const k = P.done + 1; if (k > NSW) return;
    const S = k * SEG;
    const ya = LY[P.lane], yb = LY[P.target];
    const a = 0.75 + Math.sin(time * 6) * 0.2;
    ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const pts = [];
    const xStart = Math.max(P.x + 40, S - SWH - 200);
    for (let x = xStart; x <= S + SWH + 170; x += 10) {
      let y; if (x < S - SWH) y = ya; else if (x > S + SWH) y = yb; else { const p = (x - (S - SWH)) / (2 * SWH), e = p * p * (3 - 2 * p); y = ya + (yb - ya) * e; }
      pts.push([x - cx, y]);
    }
    if (pts.length < 2) { ctx.restore(); return; }
    for (const [lw, col] of [[34, '#7a4b00'], [24, '#ffd23f']]) {
      ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
    }
    const [ex, ey] = pts[pts.length - 1];
    ctx.beginPath(); ctx.moveTo(ex + 46, ey); ctx.lineTo(ex - 6, ey - 36); ctx.lineTo(ex - 6, ey + 36); ctx.closePath();
    ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.strokeStyle = '#7a4b00'; ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();
  }
  function drawSign(x, y) {
    K.rr(x - 4, y, 8, 40, 3, '#6b5a48');
    ctx.save(); ctx.translate(x, y - 6); ctx.rotate(Math.PI / 4); K.rr(-30, -30, 60, 60, 8, '#ffd23f', '#333', 4); ctx.restore();
    K.text('ゆっくり', x + 4, y - 64, 30, '#7a4b00', 'center', '#fff');
  }
  function drawSheep(x, y, t) {
    const b = Math.abs(Math.sin(t * 5)) * 3;
    ctx.save(); ctx.translate(x, y - b);
    ctx.fillStyle = '#4a4a4a'; for (const lx of [-14, -5, 6, 14]) ctx.fillRect(lx - 2, 8, 5, 12 + (lx % 2 ? b : -b));
    for (const [px, py, r] of [[-14, 0, 14], [0, -6, 16], [14, 0, 14], [0, 6, 14], [-6, -2, 14], [8, -2, 14]]) K.circle(px, py, r, '#ffffff', null);
    K.circle(0, 0, 22, null, 'rgba(0,0,0,0.12)', 2);
    K.rr(18, -14, 20, 22, 10, '#4a4a4a');
    K.circle(30, -6, 3, '#fff');
    ctx.restore();
  }
  function drawStation(sx) {
    if (sx < -500 || sx > W + 50) return;
    for (const y of [140, 290, 440, 590]) { K.rr(sx - 20, y - 22, 420, 44, 8, '#d9d4c7', '#a39c8b', 4); ctx.fillStyle = '#ffd23f'; ctx.fillRect(sx - 20, y + (y < 300 ? 14 : -18), 420, 5); }
    K.rr(sx + 120, 70, 210, 64, 14, '#fff', '#2b3a55', 5);
    K.text('ゴールえき', sx + 225, 103, 34, '#2b3a55', 'center', null);
    for (let y = 140; y < 590; y += 25) for (let c = 0; c < 2; c++) { ctx.fillStyle = ((y / 25 + c) % 2) ? '#fff' : '#222'; ctx.fillRect(sx + c * 13 - 13, y, 13, 25); }
  }
  function drawTrain(t, cx, time) {
    const sx = t.x - cx; if (sx < -260 || sx > W + 120) return;
    const y = yAt(t, t.x);
    const ang = Math.atan2(yAt(t, t.x + 6) - yAt(t, t.x - 6), 12);
    // うしろの しゃりょう
    const bx = t.x - 140, by = yAt(t, bx), ba = Math.atan2(yAt(t, bx + 6) - yAt(t, bx - 6), 12);
    ctx.save(); ctx.translate(bx - cx, by); ctx.rotate(ba);
    K.rr(-40, -19, 84, 46, 14, 'rgba(0,0,0,0.18)');
    K.rr(-44, -23, 88, 46, 14, t.color, K.shade(t.color, -0.4), 4);
    ctx.fillStyle = t.stripe; ctx.fillRect(-38, -4, 76, 8);
    ctx.restore();
    ctx.fillStyle = '#555'; ctx.fillRect(sx - 98, y - 4, 12, 8);
    K.trainTop(sx, y, ang, { color: t.color, stripe: t.stripe });
    if (t.boost > 0 && t.isP) for (let i = 0; i < 3; i++) K.star(sx - 200 - i * 26 + Math.sin(time * 20 + i) * 4, y + (i - 1) * 18, 9, '#ffd23f');
    if (t.isP) {
      K.rr(sx - 120, y - 92, 96, 50, 18, '#fff', '#e94b4b', 4);
      ctx.beginPath(); ctx.moveTo(sx - 82, y - 44); ctx.lineTo(sx - 62, y - 44); ctx.lineTo(sx - 72, y - 30); ctx.closePath(); ctx.fillStyle = '#e94b4b'; ctx.fill();
      K.text('きみ', sx - 72, y - 66, 30, '#e94b4b', 'center', null);
    }
  }
  function drawArrowGlyph(x, y, ang, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(-34, -11); ctx.lineTo(6, -11); ctx.lineTo(6, -28); ctx.lineTo(38, 0); ctx.lineTo(6, 28); ctx.lineTo(6, 11); ctx.lineTo(-34, 11); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
  }
  function drawButtons(time) {
    const P = R.P;
    for (let i = 0; i < 3; i++) {
      const sel = P.target === i;
      const bx = 18, by = LY[i] - 64, s = 128;
      if (sel) K.rr(bx - 8, by - 8, s + 16, s + 16, 34, null, '#ffffff', 6);
      K.button(bx, by, s, s, '', sel ? '#ff9f1c' : '#5b8def', () => choose(i));
      const d = i - P.lane;
      drawArrowGlyph(bx + s / 2, by + s / 2 + (K.pointer.down && Math.abs(K.pointer.y - LY[i]) < 64 && K.pointer.x < 150 ? 4 : 0), Math.atan2(d * 0.8, 1), '#fff');
    }
    if (R.helpT > 0 && R.helpLane >= 0 && R.phase === 'run') drawHand(time, R.helpLane);
  }
  function drawHand(time, lane) {
    const x = 196 + Math.sin(time * 6) * 16, y = LY[lane];
    K.circle(82, y, 74 + Math.sin(time * 6) * 6, null, 'rgba(255,255,255,0.9)', 6);
    ctx.font = '84px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👈', x, y);
  }
  function drawHUD() {
    const x0 = 180, x1 = 1020, y = 50;
    K.rr(x0 - 10, y - 26, x1 - x0 + 70, 52, 26, 'rgba(255,255,255,0.85)');
    K.rr(x0, y - 6, x1 - x0, 12, 6, '#c8ccd6');
    K.text('えき', x1 + 30, y + 1, 28, '#2b3a55', 'center', null);
    const sorted = R.trains.slice().sort((a, b) => (a.isP ? 1 : 0) - (b.isP ? 1 : 0));
    for (const t of sorted) {
      const p = Math.max(0, Math.min(1, t.x / FIN));
      K.circle(x0 + p * (x1 - x0), y, t.isP ? 18 : 14, t.color, t.isP ? '#fff' : null, 4);
    }
    if (R.phase === 'count') return;
    const rank = ranking().indexOf(R.P) + 1;
    K.rr(1110, 18, 156, 64, 20, '#fff', '#e94b4b', 4);
    K.text(rank + 'ばん', 1188, 51, 38, '#e94b4b', 'center', null);
  }
  function drawSignal() {
    const x = W / 2, y = 330;
    K.rr(x - 190, y - 80, 380, 160, 40, '#2b2f3a', '#111', 6);
    const on = R.t < 1 ? 0 : R.t < 2 ? 1 : 2;
    const cols = ['#ff4b4b', '#ffd23f', '#2fd6a0'];
    for (let i = 0; i < 3; i++) K.circle(x - 115 + i * 115, y, 50, i === on ? cols[i] : '#555c6b', '#111', 4);
    const word = ['あか', 'きいろ', 'あお'][on];
    K.text(on === 2 ? 'しゅっぱつ しんこう！' : word, x, y + 130, on === 2 ? 56 : 48, on === 2 ? '#e94b4b' : '#2b3a55', 'center', '#fff');
  }
  function drawTutorial(time) {
    // ほしを ひかって みせる
    const s0 = R.stars.find(s => s.lane === 0 && !s.taken);
    if (s0) { const sx = s0.x - camX(); K.circle(sx, LY[0], 52 + Math.sin(time * 6) * 8, null, '#fff', 6); }
    drawHand(time, 0);
  }
  function drawResult(time) {
    ctx.fillStyle = 'rgba(255,255,255,0.86)'; ctx.fillRect(0, 0, W, H);
    const top = R.rank === 1 ? 'いちばん！ すごい！' : R.rank === 2 ? '2ばん！ がんばったね' : '3ばん！ よく はしったね';
    K.text(top, W / 2, 110, 72, '#e94b4b', 'center', '#fff');
    const pos = [[W / 2, 420, 200], [W / 2 - 300, 470, 150], [W / 2 + 300, 500, 120]];
    R.final.forEach((t, i) => {
      const [x, y, h] = pos[i];
      K.rr(x - 120, y, 240, h + 40, 16, ['#ffd23f', '#d6dbe4', '#e8b38a'][i], '#7a6a4a', 4);
      K.text(String(i + 1), x, y + 60, 64, '#fff', 'center', 'rgba(0,0,0,0.3)');
      K.trainTop(x + 70, y - 50 + Math.sin(time * 4 + i) * 4, 0, { color: t.color, stripe: t.stripe, scale: 1.3 });
      if (t.isP) { K.rr(x - 60, y - 160, 120, 56, 20, '#fff', '#e94b4b', 4); K.text('きみ', x, y - 132, 34, '#e94b4b', 'center', null); }
      if (i === 0 && t.isP) { const cx = x - 10, cy = y - 200; ctx.beginPath(); ctx.moveTo(cx - 40, cy + 20); ctx.lineTo(cx - 40, cy - 20); ctx.lineTo(cx - 20, cy); ctx.lineTo(cx, cy - 26); ctx.lineTo(cx + 20, cy); ctx.lineTo(cx + 40, cy - 20); ctx.lineTo(cx + 40, cy + 20); ctx.closePath(); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 4; ctx.stroke(); }
    });
  }

  // ---------- タイトル ----------
  function toTitle() {
    K.title('せんろチェンジレース', 'ほしの せんろを えらんで はやく はしろう', '#e94b4b', startRace);
    const d = K.scene.draw; K.scene.draw = (t, dt) => { d(t, dt); K.homeButton(); };
  }
  window.RACE = { get R() { return R; }, choose };
  toTitle();
})();
