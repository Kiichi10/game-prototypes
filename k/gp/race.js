// でんしゃ グランプリ — レースと けっか
(function () {
  'use strict';
  const W = K.W, H = K.H, c = K.ctx, D = window.GPD, G = window.GPG;
  const LANEY = [236, 330, 424, 518];
  const PX = 300;                       // じぶんの でんしゃの がめん上の いち

  let R = null;

  function distAt(sim, t) {
    const log = sim.res.log;
    if (!log.length) return 0;
    if (t <= log[0].t) return log[0].d * (t / Math.max(0.0001, log[0].t));
    let lo = 0, hi = log.length - 1;
    if (t >= log[hi].t) return log[hi].d;
    while (lo + 1 < hi) { const m = (lo + hi) >> 1; if (log[m].t <= t) lo = m; else hi = m; }
    const a = log[lo], b = log[hi], k = (t - a.t) / Math.max(0.0001, b.t - a.t);
    return a.d + (b.d - a.d) * k;
  }
  function speedAt(sim, t) {
    const log = sim.res.log;
    if (!log.length) return 0;
    let lo = 0, hi = log.length - 1;
    if (t >= log[hi].t) return 0;
    while (lo + 1 < hi) { const m = (lo + hi) >> 1; if (log[m].t <= t) lo = m; else hi = m; }
    return log[lo].v;
  }

  window.GPSTART = function () {
    const S = G.S, course = G.course, cmds = G.cmds;
    const me = { name: 'きみ', color: G.myColor(), build: S.build, you: true, res: GP.simulate(S.build, course, cmds) };
    const rivals = course.rivals.map(r => ({ name: r.name, color: r.color, build: r.build, res: GP.simulate(r.build, course, {}) }));
    const sims = [me, ...rivals];
    // くかんの はじまりの きょり
    let d = 0; const segD = course.segs.map(s => { const a = d; d += s.len; return { a, b: d, k: s.k }; });
    R = { t: 0, sims, me, len: GP.courseLen(course), segD, course, done: false, pops: [], shownEv: new Set(), countdown: 3 };
    G.setRace(R);
    G.setScreen('race');
    K.handlers.down = null;
    K.sfx.dingdong();
    K.scene = scene;
  };

  function finishOrder() {
    return R.sims.slice().sort((a, b) => a.res.time - b.res.time);
  }

  const scene = {
    update(dt) {
      if (R.countdown > 0) { R.countdown -= dt; return; }
      if (!R.done) {
        R.t += dt;
        const last = R.me.res.time;   // じぶんが ゴールしたら おわり
        // ふくらんだ・ダッシュの しらせ
        for (const s of R.sims) {
          for (const ev of s.res.events) {
            const key = s.name + ev.type + ev.seg;
            if (R.shownEv.has(key)) continue;
            const evT = evTime(s, ev);
            if (R.t >= evT) {
              R.shownEv.add(key);
              if (s.you) {
                R.pops.push({ text: ev.type === 'over' ? 'ふくらんだ！' : 'ダッシュ！', col: ev.type === 'over' ? '#ff9a6b' : '#ffd9a0', life: 1.6 });
                if (ev.type === 'over') K.sfx.oops(); else K.sfx.star();
              }
            }
          }
        }
        if (R.t > last + 1.1) { R.done = true; setTimeout(toResult, 300); }
      }
      for (const p of R.pops) p.life -= dt;
      R.pops = R.pops.filter(p => p.life > 0);
    },
    draw(t) { drawRace(t); }
  };
  function evTime(s, ev) {
    // そのイベントが おきた だいたいの じかん（きょりから さがす）
    const log = s.res.log;
    for (const l of log) if (l.d >= ev.at) return l.t;
    return 0;
  }

  function drawRace(t) {
    const camD = distAt(R.me, R.t) - PX;
    // そら
    const g = c.createLinearGradient(0, 0, 0, 220);
    g.addColorStop(0, '#13203a'); g.addColorStop(1, '#2d4a6d');
    c.fillStyle = g; c.fillRect(0, 0, W, 220);
    // とおくの やま
    c.fillStyle = '#1d3350';
    c.beginPath(); c.moveTo(0, 220);
    for (let x = 0; x <= W; x += 40) c.lineTo(x, 170 - Math.sin((x + camD * 0.08) * 0.004) * 36);
    c.lineTo(W, 220); c.closePath(); c.fill();
    c.fillStyle = '#16263d'; c.fillRect(0, 214, W, 10);
    // じめん
    c.fillStyle = '#121a26'; c.fillRect(0, 220, W, H - 220);

    // レーン
    R.sims.forEach((s, i) => {
      const y = LANEY[i];
      // くかんの いろおび
      for (const sg of R.segD) {
        const x0 = sg.a - camD, x1 = sg.b - camD;
        if (x1 < -40 || x0 > W + 40) continue;
        c.fillStyle = D.SEGCOL[sg.k] + (i === 0 ? '55' : '33');
        c.fillRect(x0, y - 34, x1 - x0, 68);
        c.fillStyle = D.SEGCOL[sg.k]; c.fillRect(x0, y - 34, 3, 68);
        if (i === 0 && x1 - x0 > 110) {
          K.text(D.SEGNAME[sg.k], (Math.max(x0, 0) + Math.min(x1, W)) / 2, y - 54, 21, '#cdd9e8', 'center', null);
        }
      }
      // せんろ
      c.fillStyle = '#8d8373'; c.fillRect(0, y + 22, W, 7);
      c.fillStyle = '#5f6878'; c.fillRect(0, y + 20, W, 3);
      c.fillStyle = '#6f5f4a';
      for (let x = -((camD) % 34); x < W; x += 34) c.fillRect(x, y + 22, 12, 7);
      // ゴール
      const gx = R.len - camD;
      if (gx > -20 && gx < W + 20) {
        for (let r = 0; r < 6; r++) for (let q = 0; q < 2; q++) {
          c.fillStyle = ((r + q) % 2) ? '#f0ead8' : '#1b2029';
          c.fillRect(gx + q * 9 - 9, y - 34 + r * 11, 9, 11);
        }
      }
    });

    // でんしゃ
    R.sims.forEach((s, i) => {
      const d = distAt(s, R.t), x = d - camD, y = LANEY[i];
      if (x < -200 || x > W + 200) { drawOffscreen(s, i, x); return; }
      const v = speedAt(s, R.t);
      // スピードせん
      if (v > 90) {
        c.strokeStyle = 'rgba(200,225,255,' + Math.min(0.5, (v - 90) / 160) + ')'; c.lineWidth = 2;
        for (let k = 0; k < 5; k++) {
          const sx2 = x - 70 - k * 46 - ((t * 700) % 40), sy2 = y - 18 + k * 9;
          c.beginPath(); c.moveTo(sx2, sy2); c.lineTo(sx2 - 34, sy2); c.stroke();
        }
      }
      D.train(x, y - 2, s.build, s.color, 0.52, t);
      if (s.you) {
        K.rr(x - 34, y - 104, 68, 28, 8, '#f0ead8', '#1b2029', 2);
        K.text('きみ', x, y - 90, 20, '#1b2029', 'center', null);
        c.fillStyle = '#f0ead8'; c.beginPath(); c.moveTo(x - 7, y - 76); c.lineTo(x + 7, y - 76); c.lineTo(x, y - 66); c.closePath(); c.fill();
      }
    });

    drawHud(t);
    if (R.countdown > 0) drawCountdown();
  }
  function drawOffscreen(s, i, x) {
    const y = LANEY[i], side = x < 0 ? 16 : W - 16;
    K.circle(side, y, 13, s.color, '#0d1117', 2);
    c.fillStyle = '#e6ecf5';
    c.beginPath();
    if (x < 0) { c.moveTo(side - 10, y); c.lineTo(side + 4, y - 7); c.lineTo(side + 4, y + 7); }
    else { c.moveTo(side + 10, y); c.lineTo(side - 4, y - 7); c.lineTo(side - 4, y + 7); }
    c.closePath(); c.fill();
  }
  function drawHud(t) {
    // うえ: じかんと じゅんい
    K.panel(W / 2 - 150, 8, 300, 56);
    K.lcd(W / 2 - 138, 14, 276, 44, R.t.toFixed(2) + ' びょう', '#ffd9a0', 32);
    const sorted = R.sims.slice().sort((a, b) => distAt(b, R.t) - distAt(a, R.t));
    const rank = sorted.findIndex(s => s.you) + 1;
    K.panel(W - 150, 8, 142, 56);
    K.lcd(W - 138, 14, 118, 44, rank + ' い', rank === 1 ? '#9ad7a0' : '#ffb454', 32);

    // した: うんてんだいの おび
    K.panel(0, 596, W, 124);
    // すすみぐあい
    const x0 = 44, x1 = 700, by = 650;
    K.text('ゴールまで', 44, 622, 20, '#8fa3c0', 'left', null);
    c.fillStyle = '#121a28'; c.fillRect(x0, by, x1 - x0, 10);
    c.fillStyle = '#3a4557'; c.fillRect(x1 - 4, by - 8, 4, 26);
    R.sims.forEach(s => {
      const p = Math.max(0, Math.min(1, distAt(s, R.t) / R.len));
      K.circle(x0 + p * (x1 - x0), by + 5, s.you ? 11 : 7, s.color, s.you ? '#e6ecf5' : '#0d1117', 2);
    });
    // そくど
    const v = speedAt(R.me, R.t);
    K.gauge(800, 658, 46, Math.min(1, v / 210), 'そくど');
    // つぎの くかん
    const d = distAt(R.me, R.t);
    let cur = R.segD.length - 1;
    for (let i = 0; i < R.segD.length; i++) if (d >= R.segD[i].a && d < R.segD[i].b) cur = i;
    const nx = R.segD[Math.min(R.segD.length - 1, cur + 1)];
    K.text('いま', 890, 624, 20, '#8fa3c0', 'left', null);
    K.rr(930, 608, 150, 40, 8, D.SEGCOL[R.segD[cur].k]);
    K.text(D.SEGNAME[R.segD[cur].k], 1005, 628, 24, '#fff', 'center', null);
    K.text('つぎ', 890, 678, 20, '#8fa3c0', 'left', null);
    K.rr(930, 662, 150, 40, 8, D.SEGCOL[nx.k]);
    K.text(D.SEGNAME[nx.k], 1005, 682, 24, '#fff', 'center', null);
    D.segIcon(R.segD[cur].k, 1120, 628, 1.3);
    D.segIcon(nx.k, 1120, 682, 1.3);

    // しらせ
    R.pops.forEach((p) => {
      c.save(); c.globalAlpha = Math.min(1, p.life * 1.6);
      K.text(p.text, W / 2, 150 - (1.6 - p.life) * 30, 54, p.col, 'center', '#1b2029');
      c.restore();
    });
    K.homeButton();
  }
  function drawCountdown() {
    c.fillStyle = 'rgba(10,14,20,0.55)'; c.fillRect(0, 0, W, H);
    const n = Math.ceil(R.countdown);
    const k = 1 - (R.countdown - Math.floor(R.countdown));
    c.save(); c.translate(W / 2, H / 2); c.scale(1 + k * 0.5, 1 + k * 0.5); c.globalAlpha = Math.min(1, (1 - k) * 2.2 + 0.3);
    K.text(n > 0 ? String(n) : 'スタート！', 0, 0, 120, '#ffd9a0', 'center', null);
    c.restore();
  }

  // ================= けっか =================
  function toResult() {
    const order = finishOrder();
    const rank = order.findIndex(s => s.you) + 1;
    const S = G.S, course = G.course;
    const prev = S.best[course.id];
    const mine = R.me.res.time;
    const isBest = !prev || mine < prev;
    if (isBest) S.best[course.id] = mine;
    let gained = null;
    if (rank === 1 && !S.done.includes(course.id)) {
      S.done.push(course.id);
      if (course.reward && !S.owned.includes(course.reward)) { S.owned.push(course.reward); gained = course.reward; }
    }
    G.save();
    G.setScreen('result');
    if (rank === 1) { K.sfx.fanfare(); K.confetti(90); G.say('1い！ やったね'); }
    else G.say('ざんねん。ぶひんを かえて もういちど やってみよう');
    let at = 0;
    K.handlers.down = null;
    K.scene = {
      update(dt) { at += dt; },
      draw(t) {
        D.garageBg(t);
        K.text(rank === 1 ? '1い！' : rank + 'い', W / 2, 86, 64, rank === 1 ? '#ffd9a0' : '#e8ecf3', 'center', null);
        K.text(course.name, W / 2, 140, 24, '#8fa3c0', 'center', null);
        order.forEach((s, i) => {
          const y = 182 + i * 72;
          D.plate(300, y, 680, 62, 10, s.you);
          K.circle(336, y + 31, 15, s.color, '#0d1117', 2);
          K.text((i + 1) + 'い', 376, y + 31, 26, '#8fa3c0', 'left', null);
          K.text(s.name, 440, y + 31, 26, s.you ? '#ffd9a0' : '#e6ecf5', 'left', null);
          K.text(s.res.time.toFixed(2) + ' びょう', 950, y + 31, 28, '#e6ecf5', 'right', null);
        });
        if (isBest) K.text('ベストタイム こうしん！', W / 2, 478, 26, '#9ad7a0', 'center', null);
        const fails = R.me.res.events.filter(e => e.type === 'over').length;
        if (fails) K.text('ふくらんだ ' + fails + 'かい … ふんばりを あげるか、ブレーキを おこう', W / 2, 512, 23, '#ff9a6b', 'center', null);
        if (gained && at > 0.6) {
          const sc = Math.min(1, (at - 0.6) * 3);
          K.rr(W / 2 - 230, 540, 460, 86, 12, '#1d2736', '#e8a23c', 3);
          D.part(slotOf(gained), gained, W / 2 - 170, 583, sc);
          K.text('あたらしい ぶひん！', W / 2 - 110, 568, 22, '#e8a23c', 'left', null);
          K.text(GP.find(slotOf(gained), gained).name, W / 2 - 110, 600, 25, '#e6ecf5', 'left', null);
        } else {
          K.button(300, 556, 300, 86, 'もういちど', '#3f8f66', () => window.GPSTART(), { size: 34 });
          K.button(660, 556, 300, 86, 'ガレージへ', '#c9453a', () => G.toGarage(), { size: 34 });
        }
        if (gained && at > 2.4) {
          K.button(W / 2 - 150, 650, 300, 62, 'つぎへ', '#3f8f66', () => G.toCourse(), { size: 30 });
        }
        K.homeButton();
      }
    };
  }
  function slotOf(id) {
    for (const sl of GP.SLOTS) if (GP.PARTS[sl].some(p => p.id === id)) return sl;
    return 'motor';
  }
})();
