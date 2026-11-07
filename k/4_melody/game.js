// ④ はっしゃ メロディ — ベルを ならして えきの メロディを ひく（曲はすべてオリジナル）
(function () {
  'use strict';
  const W = K.W, H = K.H, c = K.ctx;
  const BELL = { x: 1080, y: 600, r: 100 };
  const LANE_Y = 600, TRACK_Y = 405, STOP_X = 1190;
  const WIN = 0.25; // はんていは あまく ±0.25びょう
  const CARS = 4, TS = 1.0;   // りょうすうを へらして でんしゃを おおきく（まどの おきゃくさんが みえるように）
  const CARW = 230 * TS, CARH = 110 * TS, CGAP = 10 * TS;
  const DOORK = 1;            // ドアを つける まどの ばんごう（ドアの いちは 5_shasho と そろえる）

  // オリジナル曲（MIDI番号と はく数）。明るく短い チャイム風。
  const STAGES = [
    { name: 'はなの えき', color: '#ff8ad8', beat: 0.75, travel: 2.4,
      song: [[76,1],[79,1],[81,1],[79,1],[76,1],[74,1],[76,1],[72,2]] },
    { name: 'うみの えき', color: '#4b8bf5', beat: 0.6, travel: 2.1,
      song: [[72,1],[76,1],[79,1],[76,1],[77,1],[81,1],[79,2],[77,1],[76,1],[74,1],[79,1],[72,2]].slice(0, 12) },
    { name: 'ほしの えき', color: '#ffb000', beat: 0.45, travel: 1.8,
      song: [[79,1],[84,1],[83,1],[79,1],[81,1],[79,1],[76,1],[79,1],[77,1],[81,1],[84,1],[81,1],[79,1],[83,1],[86,1],[84,2]] },
  ];
  const NOTE_COLS = ['#ff5a5a', '#3ec46d', '#4b8bf5', '#b06bff', '#ff9f1c'];

  let stageIdx = 0, phase = 'arrive', pt = 0; // pt = その場面の けいか時間
  let totalHits = 0;                          // 3えき ぜんぶで ひけた かず
  let notes = [], songStart = 0, lead = 0, hits = 0, demoDone = false, isDemo = false;
  let trainX = -300, bellPress = 0, msg = '', faces = 0, floaters = [];

  const now = () => performance.now() / 1000;
  const songTime = () => now() - songStart - lead;
  const st = () => STAGES[stageIdx];

  function makeNotes(stage, count) {
    const out = []; let t = 0;
    stage.song.slice(0, count || stage.song.length).forEach(([m, b], i) => {
      out.push({ t, m, hit: false, soft: false, shape: i % 2 ? 'circle' : 'star', col: NOTE_COLS[i % NOTE_COLS.length] });
      t += b * stage.beat;
    });
    return out;
  }
  function startSong(demo) {
    isDemo = demo; notes = makeNotes(st(), demo ? 4 : 0);
    lead = st().travel; songStart = now(); hits = 0;
    phase = demo ? 'demo' : 'play'; pt = 0;
  }
  function setPhase(p) { phase = p; pt = 0; }

  function go(i) {
    if (i === 0) totalHits = 0;
    stageIdx = i; trainX = -300; faces = 0; floaters = [];
    setPhase('arrive');
  }

  // ---------- 入力: どこを おしても ベルを ならせる（6さい向け） ----------
  K.handlers.down = p => {
    if (phase !== 'play') { if (phase === 'demo' || phase === 'intro') ringBell(true); return; }
    const s = songTime();
    let best = null, bd = 9;
    for (const n of notes) { if (n.hit) continue; const d = Math.abs(n.t - s); if (d < bd) { bd = d; best = n; } }
    if (best && bd <= WIN) {
      best.hit = true; hits++;
      K.bell(K.note(best.m), 0, 0.7, 0.3);
      bellPress = 1; K.sparkle(BELL.x, BELL.y - 40, 12, best.col);
      floaters.push({ x: BELL.x, y: BELL.y - 130, t: 0, s: bd < 0.1 ? 'すごい！' : 'いいね！' });
    } else ringBell(true);
  };
  function ringBell(quiet) { bellPress = 1; K.bell(K.note(84), 0, 0.25, quiet ? 0.05 : 0.2); }

  // ---------- 絵 ----------
  function drawBg(t) {
    const g = c.createLinearGradient(0, 0, 0, TRACK_Y);
    g.addColorStop(0, '#9ed8ff'); g.addColorStop(1, '#dff3ff');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // くも
    for (let i = 0; i < 4; i++) {
      const x = ((i * 380 + t * 18) % 1600) - 200, y = 70 + (i % 2) * 70;
      K.circle(x, y, 34, '#fff'); K.circle(x + 40, y - 12, 42, '#fff'); K.circle(x + 84, y, 32, '#fff');
    }
    // とおくの やま
    c.fillStyle = '#a8dca0'; c.beginPath(); c.moveTo(0, 300);
    for (let x = 0; x <= W; x += 80) c.lineTo(x, 270 - Math.sin(x * 0.01) * 40 - Math.sin(x * 0.023) * 20);
    c.lineTo(W, 330); c.lineTo(0, 330); c.fill();
    // せんろ
    c.fillStyle = '#8a6a4a'; c.fillRect(0, TRACK_Y - 6, W, 10);
  }
  function drawPlatform() {
    c.fillStyle = '#d9d2c4'; c.fillRect(0, TRACK_Y + 2, W, H - TRACK_Y);
    c.fillStyle = '#bfb6a5'; c.fillRect(0, TRACK_Y + 2, W, 12);
    c.fillStyle = '#ffd23f'; c.fillRect(0, TRACK_Y + 26, W, 14); // きいろい せん
      }
  // まどの ばしょ（ドアの まどは のぞく）
  function windowCenters(x0) {
    const out = [];
    for (let i = CARS - 1; i >= 0; i--) {
      const bx = -i * (CARW + CGAP) - CARW, by = -CARH, n = i === 0 ? 3 : 4;
      for (let k = 0; k < n; k++) {
        if (k === DOORK) continue;
        out.push({ x: x0 + bx + CARW * (0.16 + k * 0.215), y: TRACK_Y + by + CARH * 0.32 });
      }
    }
    return out;
  }
  const WINMAX = windowCenters(0).length;
  // ドア（まどの ところに ぴったり あわせる）
  function drawDoors(x0, open) {
    for (let i = 0; i < CARS; i++) {
      const cx = x0 - i * (CARW + CGAP) - CARW * (1 - (0.16 + DOORK * 0.215));
      const dw = CARW * 0.22, dh = CARH * 0.84, y0 = TRACK_Y - CARH * 0.9;
      K.rr(cx - dw / 2 - 3, y0 - 3, dw + 6, dh + 6, 6, K.shade(st().color, -0.45));
      K.rr(cx - dw / 2, y0, dw, dh, 4, '#3a4560');
      const pw = dw / 2 * (1 - open);
      if (pw > 1) {
        const panel = K.shade(st().color, 0.12), edge = K.shade(st().color, -0.4);
        K.rr(cx - dw / 2, y0, pw, dh, 3, panel, edge, 2);
        K.rr(cx + dw / 2 - pw, y0, pw, dh, 3, panel, edge, 2);
        if (pw > 12) {
          c.globalAlpha = 0.55;
          K.rr(cx - dw / 2 + 4, y0 + 10, pw - 8, dh * 0.38, 3, '#cfefff');
          K.rr(cx + dw / 2 - pw + 4, y0 + 10, pw - 8, dh * 0.38, 3, '#cfefff');
          c.globalAlpha = 1;
        }
      }
    }
  }
  // ドアの あきぐあい（0=しまる / 1=あく）
  function doorOpen() {
    if (phase === 'arrive') return 0;
    if (phase === 'door') return Math.max(0, 1 - Math.max(0, pt - 1.2) / 0.6);
    if (phase === 'depart') return 0;
    return 1;
  }
  const SKINS = ['#ffd9b8', '#f1c27d', '#e0ac69', '#ffe3cc'];
  const HAIRS = ['#5a3a22', '#2b2b2b', '#c47a2c', '#7a4a2a'];
  function drawFaces(t) {
    const ws = windowCenters(trainX);
    for (let i = 0; i < Math.min(faces, ws.length); i++) {
      const w = ws[i], r = 14, wave = Math.sin(t * 8 + i) * 0.5;   // まどの ふちが みえる 大きさ
      K.circle(w.x, w.y + 4, r, SKINS[i % 4], '#8a5a3c', 2.5);
      c.fillStyle = HAIRS[i % 4]; c.beginPath(); c.arc(w.x, w.y + 2, r, Math.PI, 0); c.fill();
      K.circle(w.x - 4.5, w.y + 6, 2.2, '#333'); K.circle(w.x + 4.5, w.y + 6, 2.2, '#333');
      c.strokeStyle = '#333'; c.lineWidth = 2; c.beginPath(); c.arc(w.x, w.y + 8, 3.5, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
      // てを ふる
      c.save(); c.translate(w.x + 13, w.y + 10); c.rotate(-0.6 + wave);
      c.strokeStyle = SKINS[i % 4]; c.lineWidth = 6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -19); c.stroke(); K.circle(0, -21, 6, SKINS[i % 4]);
      c.restore();
    }
  }
  function drawBellIcon(x, y, s, col) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.beginPath(); c.moveTo(-40, 30); c.quadraticCurveTo(-36, -42, 0, -46); c.quadraticCurveTo(36, -42, 40, 30);
    c.lineTo(50, 40); c.lineTo(-50, 40); c.closePath();
    c.fillStyle = col; c.fill(); c.strokeStyle = K.shade(col, -0.45); c.lineWidth = 5; c.stroke();
    K.circle(0, 48, 11, K.shade(col, -0.35)); K.circle(0, -52, 8, K.shade(col, -0.35));
    K.rr(-26, -26, 12, 40, 6, 'rgba(255,255,255,0.45)');
    c.restore();
  }
  function noteNear() {
    if (phase !== 'play' && phase !== 'demo') return false;
    const s = songTime();
    return notes.some(n => !n.hit && Math.abs(n.t - s) <= WIN);
  }
  function drawBell(t) {
    const glow = noteNear();
    if (glow) { K.circle(BELL.x, BELL.y, BELL.r + 34 + Math.sin(t * 20) * 5, 'rgba(255,240,120,0.75)'); }
    const p = bellPress, dy = p * 8;
    K.circle(BELL.x, BELL.y + 10, BELL.r, '#b07a00');
    K.circle(BELL.x, BELL.y + dy, BELL.r, glow ? '#fff3a0' : '#ffe066', '#c98f00', 8);
    K.circle(BELL.x, BELL.y + dy, BELL.r - 22, null, 'rgba(201,143,0,0.6)', 6); // わ
    drawBellIcon(BELL.x + Math.sin(t * 40) * p * 8, BELL.y + dy - 4, 0.95, '#ffb000');
  }
  function drawNote(n, x) {
    const r = 42;
    if (n.shape === 'star') { K.star(x, LANE_Y, r + 8, n.col); K.star(x, LANE_Y, r * 0.45, '#fff'); }
    else { K.circle(x, LANE_Y, r, n.col, K.shade(n.col, -0.4), 5); K.circle(x - 10, LANE_Y - 10, 10, 'rgba(255,255,255,0.7)'); }
  }
  function drawLane() {
    K.rr(-20, LANE_Y - 56, BELL.x + 20, 112, 56, 'rgba(255,255,255,0.55)');
    const s = songTime(), sp = (BELL.x + 40) / st().travel;
    for (const n of notes) {
      if (n.hit) continue;
      const x = BELL.x - (n.t - s) * sp;
      if (x < -60) continue;
      c.save(); if (x > BELL.x + 10) c.globalAlpha = Math.max(0, 1 - (x - BELL.x) / 140);
      drawNote(n, Math.min(x, BELL.x + 150)); c.restore();
    }
  }
  function drawProgress() {
    if (!notes.length || isDemo) return;
    const n = notes.length, gap = 46, x0 = W / 2 - (n - 1) * gap / 2;
    K.rr(x0 - 36, 128, (n - 1) * gap + 72, 56, 28, 'rgba(255,255,255,0.75)');
    const s = songTime();
    notes.forEach((nt, i) => {
      const done = nt.hit, passed = s > nt.t + WIN;
      K.star(x0 + i * gap, 156, 17, done ? '#ffd23f' : passed ? '#c9c9c9' : '#eeeeee');
    });
  }
  function drawSign() {
    K.rr(W / 2 - 230, 26, 460, 86, 22, '#fff', st().color, 8);
    K.text(st().name, W / 2, 70, 52, '#2b3a55', 'center', null);
    K.text(`${stageIdx + 1}/${STAGES.length}`, W / 2 + 290, 70, 36, '#2b3a55', 'center');
    // ここまでに ひけた かず
    K.rr(150, 24, 206, 62, 26, 'rgba(255,255,255,0.85)', '#ffb000', 4);
    K.star(188, 55, 22, '#ffd23f');
    K.text(totalHits + hits + 'こ', 285, 57, 38, '#7a4b00', 'center', null);
  }
  function drawHand(t) { // おてほんの ゆび（ひかった時に ベルを おす）
    const near = bellPress > 0.3 || noteNear(), d = near ? 0 : 30;
    const tx = BELL.x + 20 + d, ty = BELL.y + 20 + d;
    c.save(); c.translate(tx, ty); c.rotate(-0.6); c.globalAlpha = 0.95;
    K.rr(-15, 0, 30, 80, 15, '#ffd9b8', '#8a5a3c', 3);
    K.rr(-30, 60, 70, 70, 26, '#ffd9b8', '#8a5a3c', 3);
    c.restore();
  }

  // ---------- 場面の すすみ ----------
  const scene = {
    update(dt, t) {
      pt += dt; bellPress = Math.max(0, bellPress - dt * 5);
      floaters.forEach(f => { f.t += dt; f.y -= dt * 60; }); floaters = floaters.filter(f => f.t < 0.8);
      if (phase === 'arrive') {
        const k = Math.min(1, pt / 2.6), e = 1 - Math.pow(1 - k, 3);
        trainX = -300 + (STOP_X + 300) * e; K.runSound(dt, 3 * (1 - k));
        if (k >= 1) { setPhase('intro'); K.sfx.dingdong(); K.say(st().name + 'に つきました'); }
      } else if (phase === 'intro') {
        if (pt > 2.2) {
          if (!demoDone) { demoDone = true; K.say('ほしが ベルに かさなって ひかったら おしてね'); startSong(true); }
          else { K.say('ひかったら おしてね'); startSong(false); }
        }
      } else if (phase === 'demo' || phase === 'play') {
        const s = songTime();
        for (const n of notes) {
          if (n.hit || n.soft || s < n.t) continue;
          if (isDemo) { n.hit = true; K.bell(K.note(n.m), 0, 0.7, 0.3); bellPress = 1; K.sparkle(BELL.x, BELL.y - 40, 10, n.col); }
          else { n.soft = true; K.bell(K.note(n.m), 0, 0.4, 0.05); } // ミスしても とまらない。ちいさく なるだけ
        }
        const last = notes[notes.length - 1].t;
        if (s > last + WIN + 0.5) {
          if (isDemo) { setPhase('demoend'); K.say('こんどは きみの ばん'); }
          else {
            setPhase('board'); faces = 0;
            const total = notes.length;
            msg = hits >= total ? 'ぜんぶ ひけたね！' : hits >= total / 2 ? 'じょうずだね！' : 'すてきな おとだね！';
            K.say(msg + ' おきゃくさんが のるよ');
          }
        }
      } else if (phase === 'demoend') {
        if (pt > 1.8) startSong(false);
      } else if (phase === 'board') {
        const want = Math.min(WINMAX, Math.max(1, hits));
        if (pt > 1.0 && faces < want && pt > 1.0 + faces * 0.18) { faces++; K.sfx.pop(); }
        if (faces >= want && pt > 1.4 + want * 0.18 + 1.2) { setPhase('door'); K.say('ドアが しまります'); }
      } else if (phase === 'door') {
        if (pt > 1.2 && pt - dt <= 1.2) K.sfx.door();
        if (pt > 2.4) { setPhase('depart'); K.sfx.whistle(); }
      } else if (phase === 'depart') {
        const v = Math.min(900, 40 + pt * pt * 260);
        trainX += v * dt; K.runSound(dt, v / 120);
        if (trainX > W + 1100) {
          totalHits += hits; hits = 0;
          if (stageIdx < STAGES.length - 1) { K.say('つぎの えきへ しゅっぱつ'); go(stageIdx + 1); }
          else K.reward('はっしゃ メロディ', 'メロディ ぜんぶ ひけたね', () => { demoDone = true; go(0); K.scene = scene; });
        }
      }
    },
    draw(t) {
      drawBg(t);
      K.trainSide(trainX, TRACK_Y, { color: st().color, stripe: '#ffffff', cars: CARS, scale: TS, bob: phase === 'arrive' || phase === 'depart' ? Math.sin(t * 25) * 1.2 : 0 });
      drawDoors(trainX, doorOpen());
      drawFaces(t);
      drawPlatform();
      K.person(170, 538, { color: '#2b3a55', hat: '#2b3a55', scale: 1.1, hop: phase === 'depart' ? Math.abs(Math.sin(t * 6)) * 8 : 0 });
      drawSign();
      drawProgress();
      if (phase === 'demo' || phase === 'play') drawLane();
      drawBell(t);
      if (phase === 'demo' || phase === 'demoend') drawHand(t);
      // ことば
      let line = '';
      if (phase === 'intro') line = st().name + 'に つきました';
      else if (phase === 'demo') line = 'おてほん：ひかったら おしてね';
      else if (phase === 'demoend') line = 'こんどは きみの ばん！';
      else if (phase === 'play') line = 'ひかったら おしてね';
      else if (phase === 'board') line = msg;
      else if (phase === 'door') line = 'ドアが しまります';
      else if (phase === 'depart') line = 'しゅっぱつ しんこう！';
      if (line) K.text(line, phase === 'play' || phase === 'demo' ? 560 : W / 2, 482, 46, '#2b3a55', 'center', '#fff');
      if (phase === 'board' || phase === 'door') K.text(`おきゃくさん ${faces}にん`, W / 2, 540, 36, '#e94b4b', 'center', '#fff');
      floaters.forEach(f => { c.save(); c.globalAlpha = 1 - f.t / 0.8; K.text(f.s, f.x, f.y, 40, '#e94b4b', 'center', '#fff'); c.restore(); });
      K.homeButton();
    }
  };

  // テスト用（じょうたいを みるだけ）
  window.MELODY = { get phase() { return phase; }, get stage() { return stageIdx; }, get hits() { return hits; },
    next() { const s = songTime(); const n = notes.find(n => !n.hit && n.t + WIN > s); return n ? n.t - s : null; } };

  K.title('はっしゃ メロディ', 'ベルを ならして えきの メロディを ひこう', '#ff8ad8', () => { go(0); K.scene = scene; });
})();
