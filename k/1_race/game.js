// せんろチェンジレース（よこスクロール）
// 3本のせんろ。ぶんきてん（ポイント）で どのせんろに はいるかを えらぶ。
(function () {
  'use strict';
  const W = K.W, H = K.H, ctx = K.ctx;
  const LY = [215, 365, 515];          // せんろの たかさ
  const BAND = 68;
  const PX = 420;                      // じぶんの でんしゃの がめん x
  const SEG = 900, NSW = 18, SWH = 150; // くかんの ながさ・かず・ポイントの はば
  const SWSTEP = 2;                    // ポイントは 2くかんに 1かい（さきを よんで えらぶ）
  const FIN = NSW * SEG + 1000;        // ゴールの えき
  const BASE = 250, SLOW = 135, BOOST = 140;
  const SPURT = 3;                     // ゴールまえ 3くかんは ラストスパート
  const ZS = 170, ZE = 730;            // くかんの はじまり・おわり（セグメント内）
  const isSwitch = k => k >= 1 && k <= NSW && k % SWSTEP === 1;
  function nextSwitch(t) { let k = (t.done || 0) + 1; while (k <= NSW && !isSwitch(k)) k++; return Math.min(k, NSW); }
  const MINGAP = 200, GAP = 240;
  const GAME = 'せんろチェンジレース';

  // えらべる でんしゃ（みため だけ。はやさは ぜんぶ おなじ＝どれを えらんでも そん しない）
  const TRAINS = [
    { key: 'local', name: 'ふつうでんしゃ', color: K.C.red, stripe: K.C.yellow },
    { key: 'bullet', name: 'とっきゅう', color: K.C.blue, stripe: '#ffffff' },
    { key: 'steam', name: 'きかんしゃ', color: '#3a4150', stripe: K.C.yellow },
  ];
  // えらべる コース（けしき と ゴールの えきめい が かわる）
  const COURSES = [
    { key: 'field', name: 'くさはら', goal: 'ゴールえき', ground: '#7aa55f', band: 'rgba(255,255,255,0.12)', slow: 'rgba(255,240,150,0.78)' },
    { key: 'sea', name: 'うみべ', goal: 'うみえき', ground: '#d9c9a0', band: 'rgba(255,255,255,0.2)', slow: 'rgba(120,228,172,0.72)' },
    { key: 'night', name: 'よるのまち', goal: 'ほしえき', ground: '#2b3550', band: 'rgba(255,255,255,0.1)', slow: 'rgba(255,238,140,0.6)' },
  ];
  const PICKKEY = 'kidtrain_race_pick';
  let pick = { train: 0, course: 0 };
  try { const o = JSON.parse(localStorage.getItem(PICKKEY) || '{}'); if (o && typeof o.train === 'number') pick = { train: o.train % 3, course: o.course % 3 }; } catch (e) {}
  function savePick() { try { localStorage.setItem(PICKKEY, JSON.stringify(pick)); } catch (e) {} }
  const myTrain = () => TRAINS[pick.train];
  const myCourse = () => COURSES[pick.course];

  let R = null;

  // ---------- コースを つくる ----------
  // ポイントで えらぶと 2くかん ぶん きまる。
  // 「つぎは ほしだけど そのつぎは ひつじ」のような 組みあわせを わざと つくり、
  // 2つ先まで みないと そんを する ようにしてある（かんがえる あそび）
  const PATTERNS = [
    [['star', 'sheep'], ['plain', 'star'], ['sheep', 'plain']],
    [['star', 'star'], ['plain', 'sheep'], ['sheep', 'tunnel']],
    [['sheep', 'star'], ['star', 'plain'], ['tunnel', 'sheep']],
    [['tunnel', 'star'], ['star', 'sheep'], ['sheep', 'plain']],
    [['star', 'plain'], ['sheep', 'star'], ['plain', 'sheep']],
  ];
  function buildCourse() {
    const segs = [];
    for (let k = 0; k <= NSW; k++) segs[k] = { types: ['plain', 'plain', 'plain'], river: false };
    for (let k = 1; k <= NSW; k += SWSTEP) {
      // さいしょの ポイントは やさしく（ほし／ふつう／ひつじ）
      const pat = k === 1 ? [['star', 'plain'], ['plain', 'plain'], ['sheep', 'plain']]
        : PATTERNS[(Math.random() * PATTERNS.length) | 0].slice();
      for (let i = pat.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pat[i], pat[j]] = [pat[j], pat[i]]; }
      for (let l = 0; l < 3; l++) {
        if (segs[k]) segs[k].types[l] = pat[l][0];
        if (segs[k + 1] && k + 1 <= NSW) segs[k + 1].types[l] = pat[l][1];
      }
    }
    segs[NSW] = { types: ['plain', 'plain', 'plain'], river: false };
    for (let k = 1; k < NSW; k++) segs[k].river = (k % 4 === 2) && !segs[k].types.includes('tunnel');
    const stars = [];
    for (let k = 1; k < NSW; k++) segs[k].types.forEach((ty, l) => {
      if (ty === 'star') for (let j = 0; j < 4; j++) stars.push({ id: stars.length, x: k * SEG + 220 + j * 140, lane: l, taken: false });
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
    return { x: 0, lane, target: lane, v: 0, trans: null, done: 0, boost: 0, yieldT: 0, pushT: 0, color, stripe, isP, got: new Set(), finished: false, sheepRun: 0, cars: 1 };
  }
  // ほしを 3こ あつめるごとに しゃりょうが 1りょう ふえる（さいだい 4りょう）
  function carsOf(t) { return Math.min(3, 1 + Math.floor(t.got.size / 3)); }
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
    // ライバルも ほしを ねらう（1いが かんたんすぎないように）。
    // むらさき＝よく ほしを とる / オレンジ＝ときどき。どちらかには かてるように ちがえてある
    const smart = Math.random() < (t.wise || 0.6);
    for (let l = 0; l < 3; l++) {
      let s = smart ? val[seg.types[l]] + Math.random() * 1.6 : Math.random() * 3;
      if (Math.abs(l - t.lane) === 2) s -= 0.4;
      // まえを はしる でんしゃが いる せんろは ほしが のこっていない → ねうちが さがる
      if (smart && seg.types[l] === 'star') {
        for (const o of R.trains) if (o !== t && o.x > t.x && o.x - t.x < 700 && (o.trans ? o.trans.to : o.lane) === l) s -= 2.2;
      }
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
  function startRun() {
    if (R.phase !== 'ready') return;
    R.phase = 'run'; K.sfx.whistle(); say('しゅっぱつ しんこう！');
  }

  // ---------- レース ----------
  function startRace() {
    const c = buildCourse();
    const P = makeTrain(1, myTrain().color, myTrain().stripe, true);
    // むらさきは よく ほしを とる（ちゃんと えらばないと かてない）・オレンジは ときどき
    const rvA = makeTrain(0, K.C.purple, '#ffffff', false); rvA.wise = 0.7; rvA.edge = 1.0;
    const rvB = makeTrain(2, K.C.orange, '#ffffff', false); rvB.wise = 0.4; rvB.edge = 0.95;
    R = {
      segs: c.segs, stars: c.stars, P,
      trains: [rvA, P, rvB],
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
      if (prev < 2 && R.t >= 2) { K.sfx.dingdong(); say('あおに なったら しゅっぱつ を おしてね'); }
      if (R.t >= 2.6) { R.phase = 'ready'; R.readyT = 0; }
      return;
    }
    // あおを みて じぶんで しゅっぱつ させる（うんてんしの だんどり）
    if (R.phase === 'ready') {
      R.readyT += dt;
      if (R.readyT > 5) startRun();
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
    if (t.boost > 0) { t.boost -= dt; tgt += BOOST; }
    if (!t.isP) {
      // むらさきは ほぼ おなじ はやさ＝ちゃんと えらばないと かてない。オレンジ(0.92)は すこし おそい
      tgt *= t.edge || 1;
      // はなれすぎない（さきに いきすぎたら ゆっくり・おくれたら いそぐ）＝さいごまで きわどい レースに
      const gap = t.x - R.P.x;
      tgt *= gap > 1400 ? 0.78 : gap > 700 ? 0.9 : gap < -700 ? 1.12 : 1;
    }
    const z = t.trans ? 'plain' : zoneAt(t.x, t.lane);
    if (z === 'sheep') tgt = Math.min(tgt, SLOW);
    if (t.yieldT > 0) { t.yieldT -= dt; tgt *= 0.5; }
    if (t.pushT > 0) { t.pushT -= dt; tgt += 130; }
    if (R.phase === 'count' || R.phase === 'ready' || R.phase === 'tut') tgt = 0;
    if (t.x > FIN - SPURT * SEG) tgt *= 1.22;   // ゴールまえは みんな はやくなる
    if (t.x >= FIN) tgt = t.isP ? Math.max(0, (FIN + 260 - t.x) * 1.2) : BASE;
    t.v += (tgt - t.v) * Math.min(1, dt * (z === 'sheep' ? 4 : 2.5));
    t.x += t.v * dt;

    // ポイント（2くかんに 1かいだけ）
    const k = Math.round(t.x / SEG), S = k * SEG;
    if (isSwitch(k) && !t.trans && t.done < k && t.x >= S - SWH) {
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
      const grew = carsOf(t) > t.cars;
      if (grew) t.cars = carsOf(t);
      if (t.isP) {
        s.taken = true; K.sfx.star(); K.sparkle(s.x - camX(), LY[s.lane], 12, K.C.yellow);
        if (!R.firstStar) { R.firstStar = true; say('ほしを とった！ はやく なったよ'); }
        else if (grew) { K.sfx.good(); say('しゃりょうが ふえたよ！'); }
      }
    }
    // ひつじ（じぶん）
    if (t.isP) {
      const k2 = Math.floor(t.x / SEG);
      if (z === 'sheep' && t.sheepSeg !== k2) {
        t.sheepSeg = k2; t.sheepRun = (t.lastSheepSeg === k2 - 1) ? t.sheepRun + 1 : 1; t.lastSheepSeg = k2;
        if (!R.firstSheep) { R.firstSheep = true; say('ひつじさんが いるから ゆっくり はしろうね', 'ひつじさんが いるから ゆっくり'); }
        else if (t.sheepRun >= 2 && k2 + 1 < NSW) {
          R.helpLane = R.segs[nextSwitch(t)].types.indexOf('star'); R.helpT = 5;
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
    drawCourseBg(time, cx);

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
        if (ty === 'sheep') { K.rr(x1, LY[l] - BAND + 4, x2 - x1, BAND * 2 - 8, 20, myCourse().slow); }
        if (ty === 'tunnel') { K.rr(x1 - 10, LY[l] - BAND + 2, x2 - x1 + 20, BAND * 2 - 4, 30, '#5f8a52', '#48693f', 4); ctx.fillStyle = '#243246'; ctx.fillRect(x1, LY[l] - 34, x2 - x1, 68); }
      });
    }
    // せんろ
    for (let l = 0; l < 3; l++) drawRail(cx - 60, cx + W + 60, l, cx);
    // ポイント
    for (let k = Math.max(1, k0); k <= k1 && k <= NSW; k++) if (isSwitch(k)) drawSwitch(k * SEG, cx);
    // トンネルの いりぐち
    for (let k = Math.max(1, k0); k <= k1 && k < NSW; k++) R.segs[k].types.forEach((ty, l) => {
      if (ty !== 'tunnel') return;
      for (const xx of [k * SEG + ZS - cx, k * SEG + ZE - cx]) { K.rr(xx - 12, LY[l] - 44, 24, 88, 6, '#9a9286', '#6d675e', 3); }
    });
    // ゴールの えき
    drawStation(FIN - cx);
    // スタートの せん
    for (let y = 140; y < 590; y += 30) { ctx.fillStyle = (y / 30) % 2 ? '#fff' : '#333'; ctx.fillRect(-cx - 8 + 30, y, 16, 30); }

    // えらんだ みち（やじるし）
    drawRoute(time, cx);
    // ほし
    for (const s of R.stars) { if (s.taken) continue; const sx = s.x - cx; if (sx < -40 || sx > W + 40) continue; K.star(sx, LY[s.lane] + Math.sin(time * 4 + s.id) * 5, 30 + Math.sin(time * 6 + s.id) * 3, K.C.yellow); }
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
    // した の メッセージ（うんてんだいの ひょうじ）
    K.panel(150, 596, 980, 76);
    if (R.msgT > 0 && R.msg) K.lcd(162, 606, 956, 56, R.msg, '#ffd9a0', 34);
    else if (R.phase === 'run') {
      const spurt = R.P.x > FIN - SPURT * SEG;
      K.lcd(162, 606, 956, 56, spurt ? 'ラストスパート！' : 'ほしの せんろは はやいよ', spurt ? '#ff9a6b' : '#8fa3c0', 34);
    } else K.lcd(162, 606, 956, 56, '', '#8fa3c0', 34);

    if (R.phase === 'ready') K.button(W / 2 - 170, 430, 340, 104, 'しゅっぱつ', K.C.green, startRun);
    if (R.phase === 'count' || R.phase === 'ready') drawSignal();
    if (R.phase === 'tut') drawTutorial(time);
    if (R.phase === 'goal' && R.goalT < 1.6) K.text('ゴール！', W / 2, 330, 120, K.C.red, 'center', '#fff');
    if (R.phase === 'result') drawResult(time);
    K.homeButton();
  }

  // ---------- コースの けしき ----------
  function drawCourseBg(time, cx) {
    const C = myCourse();
    ctx.fillStyle = C.ground; ctx.fillRect(0, 0, W, H);
    if (C.key === 'sea') {
      // うえのほうが うみ
      ctx.fillStyle = '#4fb8e8'; ctx.fillRect(0, 0, W, 132);
      ctx.fillStyle = '#7fd4f5'; ctx.fillRect(0, 108, W, 24);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let k = Math.floor(cx / 120) - 1; k < (cx + W) / 120 + 1; k++) {
        const wx = k * 120 - cx * 0.4, wy = 40 + ((k * 37) % 60);
        ctx.beginPath(); ctx.moveTo(wx, wy + Math.sin(time * 2 + k) * 3);
        ctx.quadraticCurveTo(wx + 16, wy - 8, wx + 32, wy + Math.sin(time * 2 + k) * 3); ctx.stroke();
      }
      // すなはまの かい と ひとで
      for (let k = Math.floor(cx / 170) - 1; k < (cx + W) / 170 + 1; k++) {
        const hx = k * 170 - cx + ((k * 61) % 70), hy = [160, 300, 450, 600][((k % 4) + 4) % 4];
        if (((k % 3) + 3) % 3 === 0) K.star(hx, hy, 11, '#ff9a6b');
        else { K.circle(hx, hy, 8, '#fff2d8', '#e2c9a3', 2); ctx.strokeStyle = '#e2c9a3'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx - 6, hy + 4); ctx.lineTo(hx + 6, hy - 5); ctx.stroke(); }
      }
    } else if (C.key === 'night') {
      // よぞら と まちの あかり
      ctx.fillStyle = '#1e2a52'; ctx.fillRect(0, 0, W, 140);
      for (let k = Math.floor(cx / 90) - 1; k < (cx + W) / 90 + 1; k++) {
        const sx2 = k * 90 - cx * 0.25 + ((k * 53) % 40), sy = 20 + ((k * 29) % 90);
        const tw = 0.6 + 0.4 * Math.sin(time * 3 + k);
        ctx.globalAlpha = tw; K.star(sx2, sy, 6, '#fff7c7'); ctx.globalAlpha = 1;
      }
      K.circle(1150, 52, 34, '#fff3b0'); K.circle(1136, 44, 30, '#1e2a52');
      // たてもの
      for (let k = Math.floor(cx / 150) - 1; k < (cx + W) / 150 + 1; k++) {
        const bx = k * 150 - cx * 0.6, bw = 90 + ((k * 37) % 40), bh = 50 + ((k * 73) % 60);
        K.rr(bx, 140 - bh, bw, bh, 6, '#2b3a66');
        for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) {
          if (((k + r * 3 + q * 7) % 4) === 0) continue;
          ctx.fillStyle = '#ffe88a'; ctx.fillRect(bx + 12 + q * 24, 140 - bh + 12 + r * 18, 12, 10);
        }
      }
      // あかり（がいとう）
      for (let k = Math.floor(cx / 260) - 1; k < (cx + W) / 260 + 1; k++) {
        const lx = k * 260 - cx + 40;
        ctx.fillStyle = '#596a9c'; ctx.fillRect(lx - 3, 150, 6, 30);
        K.circle(lx, 150, 10, 'rgba(255,230,140,0.9)');
      }
    } else {
      // はな
      for (let k = Math.floor(cx / 160) - 1; k < (cx + W) / 160 + 1; k++) {
        const hx = k * 160 - cx + ((k * 73) % 60), hy = [140, 290, 440, 590][((k % 4) + 4) % 4];
        K.circle(hx, hy, 5, ['#fff', '#ffe066', '#ff9ad5'][((k % 3) + 3) % 3]);
      }
    }
    for (let i = 0; i < 3; i++) { ctx.fillStyle = C.band; ctx.fillRect(0, LY[i] - BAND, W, BAND * 2); }
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
    // となりの せんろへの みちだけ（おなじ みちを 2かい ひかない＝ごちゃつかない）
    for (const [a, b] of [[0, 1], [1, 2]]) for (const off of [-17, 17]) { smoothPath(S, LY[a], LY[b], cx, off); ctx.strokeStyle = '#7d8696'; ctx.lineWidth = 4; ctx.stroke(); }
    // ポイントの めじるし
    const sx = S - SWH - cx;
    K.rr(sx - 6, 132, 12, 34, 4, K.C.sub); K.circle(sx, 132, 12, K.C.yellow, K.C.sub, 3);
  }
  function drawRoute(time, cx) {
    const P = R.P; if (R.phase === 'result' || R.phase === 'goal') return;
    const k = nextSwitch(P); if (k > NSW) return;
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
    // えらんだ みちは ほそい ひかる せんで しめす（せんろを かくさない）
    ctx.setLineDash([18, 12]); ctx.lineDashOffset = -time * 40;
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.strokeStyle = 'rgba(255,214,120,0.95)'; ctx.lineWidth = 7; ctx.stroke();
    ctx.setLineDash([]);
    const [ex, ey] = pts[pts.length - 1];
    ctx.beginPath(); ctx.moveTo(ex + 26, ey); ctx.lineTo(ex - 6, ey - 18); ctx.lineTo(ex - 6, ey + 18); ctx.closePath();
    ctx.fillStyle = '#ffd678'; ctx.fill();
    ctx.restore();
  }
  function drawSign(x, y) {
    K.rr(x - 4, y, 8, 40, 3, '#6b5a48');
    ctx.save(); ctx.translate(x, y - 6); ctx.rotate(Math.PI / 4); K.rr(-30, -30, 60, 60, 8, K.C.yellow, '#333', 4); ctx.restore();
    K.text('ゆっくり', x + 4, y - 64, 30, '#6b5220', 'center', '#fff');
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
    for (const y of [140, 290, 440, 590]) { K.rr(sx - 20, y - 22, 420, 44, 8, '#d9d4c7', '#a39c8b', 4); ctx.fillStyle = K.C.yellow; ctx.fillRect(sx - 20, y + (y < 300 ? 14 : -18), 420, 5); }
    K.rr(sx + 120, 70, 210, 64, 14, '#fff', K.C.ink, 5);
    K.text(myCourse().goal, sx + 225, 103, 34, K.C.ink, 'center', null);
    for (let y = 140; y < 590; y += 25) for (let c = 0; c < 2; c++) { ctx.fillStyle = ((y / 25 + c) % 2) ? '#fff' : '#222'; ctx.fillRect(sx + c * 13 - 13, y, 13, 25); }
  }
  function drawTrain(t, cx, time) {
    const sx = t.x - cx; if (sx < -480 || sx > W + 120) return;
    const y = yAt(t, t.x);
    const ang = Math.atan2(yAt(t, t.x + 6) - yAt(t, t.x - 6), 12);
    // うしろの しゃりょう（ほしを あつめると ふえる）
    for (let i = t.cars - 1; i >= 0; i--) {
      const bx = t.x - 140 - i * 96, by = yAt(t, bx), ba = Math.atan2(yAt(t, bx + 6) - yAt(t, bx - 6), 12);
      ctx.save(); ctx.translate(bx - cx, by); ctx.rotate(ba);
      const kind = t.isP ? myTrain().key : 'local';
      const cc = kind === 'steam' ? '#8a5a3c' : t.color;
      K.rr(-40, -19, 84, 46, 14, 'rgba(0,0,0,0.18)');
      K.rr(-44, -23, 88, 46, 14, cc, K.shade(cc, -0.4), 4);
      ctx.fillStyle = t.stripe; ctx.fillRect(-38, -4, 76, 8);
      ctx.restore();
      // れんけつき
      const jx = bx + 48, jy = yAt(t, jx);
      ctx.fillStyle = K.C.sub; ctx.fillRect(jx - cx - 6, jy - 4, 12, 8);
    }
    drawHeadTop(sx, y, ang, t, time);
    if (t.boost > 0 && t.isP) { const tx = sx - 190 - (t.cars - 1) * 96; for (let i = 0; i < 3; i++) K.star(tx - i * 26 + Math.sin(time * 20 + i) * 4, y + (i - 1) * 18, 9, K.C.yellow); }
    if (t.isP) {
      K.rr(sx - 120, y - 92, 96, 50, 18, '#fff', t.color, 4);
      ctx.beginPath(); ctx.moveTo(sx - 82, y - 44); ctx.lineTo(sx - 62, y - 44); ctx.lineTo(sx - 72, y - 30); ctx.closePath(); ctx.fillStyle = t.color; ctx.fill();
      K.text('きみ', sx - 72, y - 66, 30, t.color, 'center', null);
    }
  }
  // うえから みた せんとうしゃりょう（えらんだ しゅるいで かたちが かわる）
  function drawHeadTop(x, y, ang, t, time, scale) {
    const kind = t.isP ? myTrain().key : 'local';
    const s = scale || 1;
    if (kind === 'local') { K.trainTop(x, y, ang, { color: t.color, stripe: t.stripe, scale: s }); return; }
    const L = 86 * s, Wd = 46 * s, color = t.color, stripe = t.stripe;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    K.rr(-L + 4, -Wd / 2 + 6, L, Wd, 16 * s, 'rgba(0,0,0,0.18)');
    if (kind === 'bullet') {
      ctx.beginPath();
      ctx.moveTo(-L, -Wd / 2); ctx.lineTo(-L * 0.1, -Wd / 2);
      ctx.quadraticCurveTo(L * 0.46, -Wd * 0.30, L * 0.40, 0);
      ctx.quadraticCurveTo(L * 0.46, Wd * 0.30, -L * 0.1, Wd / 2);
      ctx.lineTo(-L, Wd / 2); ctx.closePath();
      ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = K.shade(color, -0.4); ctx.lineWidth = 4 * s; ctx.stroke();
      ctx.fillStyle = stripe; ctx.fillRect(-L + 6 * s, -5 * s, L * 0.95, 10 * s);
      K.rr(-L * 0.34, -Wd * 0.3, L * 0.2, Wd * 0.6, 6 * s, K.C.ink);
    } else {
      // きかんしゃ（えんとつ と けむり）
      K.rr(-L, -Wd / 2, L * 0.98, Wd, 12 * s, color, K.shade(color, -0.45), 4 * s);
      K.rr(-L * 0.98, -Wd * 0.34, L * 0.3, Wd * 0.68, 8 * s, K.C.red);   // うんてんしつ（あかくて めだつ）
      ctx.fillStyle = stripe; ctx.fillRect(-L + 6 * s, -4 * s, L * 0.9, 8 * s);
      K.circle(L * 0.02, 0, 13 * s, '#2f3542', '#1b1f28', 3 * s);           // えんとつ
      K.circle(L * 0.02, 0, 6 * s, '#5a6172');
    }
    ctx.restore();
    if (kind === 'steam') {
      for (let i = 0; i < 4; i++) {
        const p = ((time * 1.6 + i * 0.25) % 1);
        ctx.globalAlpha = 0.5 * (1 - p);
        K.circle(x - Math.cos(ang) * 10 - p * 120, y - 16 - p * 46 + Math.sin(i) * 4, (10 + p * 26) * s, '#ffffff');
        ctx.globalAlpha = 1;
      }
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
      K.button(bx, by, s, s, '', sel ? K.C.orange : '#4a6c96', () => choose(i));
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
  // ---------- 計器パネル（うんてんだいっぽい HUD） ----------
  function zoneIcon(ty, x, y, r) {
    if (ty === 'star') { K.star(x, y, r, K.C.yellow); return; }
    if (ty === 'sheep') { K.circle(x, y - 1, r * 0.8, '#efe9e2', '#c9c0b5', 2); K.rr(x + r * 0.5, y - r * 0.7, r * 0.6, r * 0.7, 3, '#5b5b5b'); return; }
    if (ty === 'tunnel') { ctx.fillStyle = '#6b8f74'; ctx.beginPath(); ctx.arc(x, y + r * 0.6, r, Math.PI, 0); ctx.fill(); K.circle(x, y + r * 0.45, r * 0.45, '#243246'); return; }
    K.rr(x - r * 0.8, y - 2, r * 1.6, 4, 2, '#8fa3c0');
  }
  function drawHUD() {
    // じょうぶの パネル
    K.panel(150, 10, 980, 84);
    // すすみぐあい
    const x0 = 186, x1 = 836, y = 70;
    K.rr(x0, y - 5, x1 - x0, 10, 5, '#121a28', '#3d4a63', 2);
    const sorted = R.trains.slice().sort((a, b) => (a.isP ? 1 : 0) - (b.isP ? 1 : 0));
    for (const t of sorted) {
      const p = Math.max(0, Math.min(1, t.x / FIN));
      K.circle(x0 + p * (x1 - x0), y, t.isP ? 11 : 8, t.color, t.isP ? '#e6ecf5' : null, 2);
    }
    K.text('えき', x1 + 26, y, 20, '#8fa3c0', 'center', null);
    K.text('つぎの わかれみち', 186, 32, 20, '#8fa3c0', 'left', null);
    // 「つぎ」と「そのつぎ」の くかんを さきに 見せる（えらぶ まえに かんがえる）
    const nk = nextSwitch(R.P);
    for (let col = 0; col < 2; col++) {
      const k = nk + col, seg = R.segs[k];
      const bx = 880 + col * 122;
      K.rr(bx, 18, 112, 68, 8, '#1b2334', '#3d4a63', 2);
      K.text(col ? 'そのつぎ' : 'つぎ', bx + 56, 12, 17, '#8fa3c0', 'center', null);
      for (let l = 0; l < 3; l++) {
        const iy = 32 + l * 20;
        if (seg && k >= 1 && k < NSW) zoneIcon(seg.types[l], bx + 56, iy, 9);
        else zoneIcon('plain', bx + 56, iy, 9);
        if (R.P.target === l) { K.rr(bx + 4, iy - 10, 104, 20, 5, null, K.C.orange, 2); }
      }
    }
    if (R.phase === 'count' || R.phase === 'ready') return;
    // じゅんい と ほし と そくどけい
    K.panel(1148, 10, 120, 84);
    K.lcd(1158, 22, 100, 28, ranking().indexOf(R.P) + 1 + ' ばん', '#ffb454', 22);
    K.lcd(1158, 56, 100, 28, '★ ' + R.P.got.size, '#9ad7a0', 22);
    K.gauge(72, 640, 54, Math.min(1, R.P.v / 420), 'そくど');
  }
  function drawSignal() {
    const x = W / 2, y = 268;
    // ほんものっぽい たてがたの しんごう
    K.rr(x - 44, y - 118, 88, 236, 14, '#2b3038', '#1a1d23', 3);
    K.rr(x - 54, y - 128, 108, 18, 6, '#39404e');
    const on = R.t < 1 ? 0 : R.t < 2 ? 1 : 2;
    const cols = ['#d6453c', '#d79a26', '#3fae7a'];
    for (let i = 0; i < 3; i++) {
      const cy = y - 72 + i * 72;
      if (i === on) { ctx.save(); ctx.globalAlpha = 0.35; K.circle(x, cy, 44, cols[i]); ctx.restore(); }
      K.circle(x, cy, 28, i === on ? cols[i] : '#434a57', '#1a1d23', 3);
      if (i === on) K.circle(x - 8, cy - 8, 8, 'rgba(255,255,255,0.45)');
    }
    const word = ['とまれ', 'きを つけて', 'すすめ'][on];
    K.lcd(x - 150, y + 130, 300, 46, word, on === 2 ? '#9ad7a0' : '#ffb454', 30);
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
    K.text(top, W / 2, 96, 72, K.C.red, 'center', '#fff');
    // あつめた ほし（かんむりと かさならない ひだりに おく）
    K.rr(40, 160, 300, 66, 24, '#fff7c7', K.C.yellow, 5);
    K.star(90, 193, 24, K.C.yellow);
    K.text('ほし ' + R.P.got.size + 'こ', 220, 195, 40, '#6b5220', 'center', null);
    const pos = [[W / 2, 420, 200], [W / 2 - 300, 470, 150], [W / 2 + 300, 500, 120]];
    R.final.forEach((t, i) => {
      const [x, y, h] = pos[i];
      K.rr(x - 120, y, 240, h + 40, 16, [K.C.yellow, '#d6dbe4', '#e8b38a'][i], '#7a6a4a', 4);
      K.text(String(i + 1), x, y + 60, 64, '#fff', 'center', 'rgba(0,0,0,0.3)');
      drawHeadTop(x + 70, y - 50 + Math.sin(time * 4 + i) * 4, 0, t, time, 1.3);
      if (t.isP) { K.rr(x - 60, y - 160, 120, 56, 20, '#fff', K.C.red, 4); K.text('きみ', x, y - 132, 34, K.C.red, 'center', null); }
      if (i === 0 && t.isP) { const cx = x - 10, cy = y - 200; ctx.beginPath(); ctx.moveTo(cx - 40, cy + 20); ctx.lineTo(cx - 40, cy - 20); ctx.lineTo(cx - 20, cy); ctx.lineTo(cx, cy - 26); ctx.lineTo(cx + 20, cy); ctx.lineTo(cx + 40, cy - 20); ctx.lineTo(cx + 40, cy + 20); ctx.closePath(); ctx.fillStyle = K.C.yellow; ctx.fill(); ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 4; ctx.stroke(); }
    });
  }

  // ---------- でんしゃと コースを えらぶ ----------
  function drawMiniTrain(x, y, i, time) {
    const T = TRAINS[i], fake = { color: T.color, stripe: T.stripe, isP: true };
    const keep = pick.train; pick.train = i;          // みほんを かくあいだ だけ きりかえる
    drawHeadTop(x + 34, y, 0, fake, time, 1.25);
    pick.train = keep;
    ctx.save(); ctx.translate(x - 70, y);
    K.rr(-40, -19, 84, 46, 14, 'rgba(0,0,0,0.15)');
    K.rr(-44, -23, 88, 46, 14, T.key === 'steam' ? '#8a5a3c' : T.color, K.shade(T.key === 'steam' ? '#8a5a3c' : T.color, -0.4), 4);
    ctx.fillStyle = T.stripe; ctx.fillRect(-38, -4, 76, 8);
    ctx.restore();
  }
  function drawMiniCourse(x, y, w, h, i) {
    const C = COURSES[i];
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = C.ground; ctx.fillRect(x, y, w, h);
    if (C.key === 'sea') {
      ctx.fillStyle = '#4fb8e8'; ctx.fillRect(x, y, w, h * 0.42);
      for (let k = 0; k < 3; k++) K.circle(x + 30 + k * 48, y + h * 0.72, 7, '#fff2d8', '#e2c9a3', 2);
    } else if (C.key === 'night') {
      ctx.fillStyle = '#1e2a52'; ctx.fillRect(x, y, w, h * 0.46);
      for (let k = 0; k < 4; k++) K.star(x + 24 + k * 42, y + 16 + (k % 2) * 14, 7, '#fff7c7');
      for (let k = 0; k < 3; k++) K.rr(x + 20 + k * 54, y + h * 0.46 - 26 - (k % 2) * 10, 40, 30 + (k % 2) * 10, 4, '#2b3a66');
    } else {
      for (let k = 0; k < 6; k++) K.circle(x + 22 + k * 28, y + 26 + (k % 3) * 30, 5, ['#fff', '#ffe066', '#ff9ad5'][k % 3]);
    }
    // せんろ
    for (let l = 0; l < 2; l++) {
      const ry = y + h * (0.62 + l * 0.22);
      ctx.fillStyle = '#8a6a4a'; for (let xx = x + 6; xx < x + w; xx += 18) ctx.fillRect(xx, ry - 9, 7, 18);
      ctx.fillStyle = '#7d8696'; ctx.fillRect(x, ry - 6, w, 3); ctx.fillRect(x, ry + 4, w, 3);
    }
    ctx.restore();
    K.rr(x, y, w, h, 18, null, '#ffffff', 3);
  }
  function toSetup() {
    K.handlers.down = null;
    K.scene = {
      update() {},
      draw(time) {
        ctx.fillStyle = '#bfe7ff'; ctx.fillRect(0, 0, W, H);
        K.text('どの でんしゃで はしる？', 640, 52, 44, K.C.red, 'center', '#fff');
        for (let i = 0; i < 3; i++) {
          const x = 40 + i * 400, y = 86, w = 360, h = 150;
          const on = pick.train === i;
          K.rr(x - 6, y - 6, w + 12, h + 12, 30, on ? K.C.yellow : null, on ? K.C.orange : null, 6);
          K.rr(x, y, w, h, 26, '#ffffff', on ? K.C.orange : '#c8d2e0', on ? 7 : 4);
          drawMiniTrain(x + 190, y + 66, i, time);
          K.text(TRAINS[i].name, x + w / 2, y + 124, 32, on ? K.C.red : K.C.sub, 'center', null);
        }
        K.text('どこを はしる？', 640, 282, 44, '#2b6fd6', 'center', '#fff');
        for (let i = 0; i < 3; i++) {
          const x = 40 + i * 400, y = 316, w = 360, h = 150;
          const on = pick.course === i;
          K.rr(x - 6, y - 6, w + 12, h + 12, 30, on ? K.C.yellow : null, on ? K.C.orange : null, 6);
          K.rr(x, y, w, h, 26, '#ffffff', on ? K.C.orange : '#c8d2e0', on ? 7 : 4);
          drawMiniCourse(x + 14, y + 12, w - 28, h - 58, i);
          K.text(COURSES[i].name, x + w / 2, y + 122, 32, on ? '#2b6fd6' : K.C.sub, 'center', null);
        }
        // おす ところ（ボタンは うしろに おいて みた目を じゃましない）
        for (let i = 0; i < 3; i++) {
          hitBox(40 + i * 400, 86, 360, 150, () => { if (pick.train !== i) { pick.train = i; savePick(); K.sfx.pop(); K.say(TRAINS[i].name + 'で はしろう'); } });
          hitBox(40 + i * 400, 316, 360, 150, () => { if (pick.course !== i) { pick.course = i; savePick(); K.sfx.pop(); K.say(COURSES[i].name + 'を はしろう'); } });
        }
        K.button(440, 494, 400, 110, 'はじめる', '#3ec46d', () => { K.sfx.good(); startRace(); });
        K.button(16, 16, 120, 64, 'もどる', K.C.sub, toTitle, { size: 28 });
      }
    };
    K.say('でんしゃと コースを えらんでね');
  }
  // 見た目は じぶんで かいて、おす ところだけ ようい する
  function hitBox(x, y, w, h, onTap) {
    const sv = ctx.globalAlpha; ctx.globalAlpha = 0;
    K.button(x, y, w, h, '', '#ffffff', onTap);
    ctx.globalAlpha = sv;
  }

  // ---------- タイトル ----------
  function toTitle() {
    K.title('せんろチェンジレース', 'ほしの せんろを えらんで はやく はしろう', K.C.red, toSetup);
    const d = K.scene.draw; K.scene.draw = (t, dt) => { d(t, dt); K.homeButton(); };
  }
  window.RACE = { get R() { return R; }, choose, toSetup, get pick() { return pick; } };
  toTitle();
})();
