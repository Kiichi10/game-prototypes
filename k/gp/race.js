// でんしゃ グランプリ — レースと けっか
// はしりは さきに ぜんぶ けいさんして（GP.simulate）、その きろくを コースの うえで さいせいする
(function () {
  'use strict';
  const W = K.W, H = K.H, c = K.ctx, D = window.GPD, T = window.GPT, V = window.GPV, G = window.GPG, TRK = window.TRK, KY = TRK.KY, KZ = TRK.KZ;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k;
  const RC = ['#f0b53a', '#d5deec', '#d99a62', '#8fa3c0'];      // じゅんいの いろ
  let R = null, RES = null;

  // ---------- はしる 1だい ----------
  function mkRun(o, course, trk) {
    const N = course.segs.length, L = trk.len;
    o.k = L * course.laps / o.res.total; o.si = 0; o.off = o.lane; o.d = 0; o.v = 0; o.ov = {};
    for (const e of o.res.events) if (e.type === 'over') o.ov[e.lap * N + e.seg] = e.ratio;
    // せんろの まんなかからの ずれ（はやすぎた くかんでは そとへ ふくらむ）
    o.offAt = d => {
      if (d <= 0) return o.lane;
      const lap = Math.floor(d / L), dl = d - lap * L;
      let i = N - 1; while (i > 0 && trk.segStart[i] > dl) i--;
      const r = o.ov[lap * N + i]; if (!r) return o.lane;
      const s = course.segs[i], u = clamp((dl - trk.segStart[i]) / s.len, 0, 1), mag = clamp((r - 1) * 4, 0.45, 1) * Math.sin(Math.PI * u);
      if (s.k === 'curve') return o.lane + (s.ang > 0 ? -1 : 1) * mag * (o.me ? (s.ang > 0 ? 9 : 4) : 3);
      return o.lane + Math.sin(u * Math.PI * 5) * mag * (o.me ? 3 : 1.5);
    };
    return o;
  }
  // じこく t の ようす
  function step(o, t) {
    const log = o.res.log, n = log.length, end = log[n - 1], info = o.res.segInfo;
    let d, v;
    if (t <= 0) { d = 0; v = 0; }
    else if (t >= end.t) { const ta = t - end.t; d = end.d + end.v * (1 - Math.exp(-1.2 * ta)) / 1.2; v = end.v * Math.exp(-1.2 * ta); }
    else {
      let lo = 0, hi = n - 1;
      while (lo + 1 < hi) { const m = (lo + hi) >> 1; if (log[m].t <= t) lo = m; else hi = m; }
      const a = log[lo], b = log[hi];
      if (t < a.t) { d = a.d * t / a.t; v = a.v; }
      else { const k = (t - a.t) / Math.max(1e-4, b.t - a.t); d = a.d + (b.d - a.d) * k; v = a.v + (b.v - a.v) * k; }
    }
    o.d = d * o.k; o.v = v; o.fin = t >= end.t;
    while (o.si + 1 < info.length && info[o.si + 1].t <= t) o.si++;
    const cur = info[o.si], nx = info[o.si + 1], t1 = nx ? nx.t : end.t, live = t > 0 && !o.fin;
    o.seg = cur.seg; o.lap = cur.lap;
    o.dash = live && cur.cmd === 'dash' && !cur.over;
    o.brake = live && cur.cmd === 'brake';
    o.over = live && cur.over ? clamp((t - cur.t) / 0.25, 0, 1) * clamp((t1 - t) / 0.25, 0, 1) : 0;
  }
  function aim(d) { const p = TRK.at(R.trk, d); return [p.x, p.y * KY - (p.gap ? p.air : p.z) * KZ + 3]; }
  function pop(text, col) { R.pop = { text, col, t: 0 }; }

  // ================= レース =================
  window.GPSTART = function () {
    const S = G.S, course = G.course, sc = V.scene(course), trk = sc.trk;
    const ease = clamp(((S.tries[course.id] || 0) - 1) * 0.015, 0, 0.09);      // なんども まけたら あいてが すこし ゆっくりに
    const me = mkRun({ me: true, name: 'きみ', color: G.myColor(), build: S.build, lane: -27, res: GP.simulate(S.build, course, G.progFor()) }, course, trk);
    const runs = [me].concat(course.rivals.map((r, i) => mkRun({ name: r.name, color: r.color, build: r.build, lane: [27, 9, -9][i], res: GP.runRival(course, i, ease) }, course, trk)));
    const fit = V.fit(sc);
    R = {
      course, sc, trk, me, runs, fit, N: course.segs.length, t: 0, phase: 'intro', pt: 0, lamp: 0, speed: 1, ei: 0,
      pop: null, banner: null, done: false, ft: 0, cam: { X: fit.X, Y: fit.Y, zoom: fit.zoom },
    };
    for (const o of runs) step(o, 0);
    G.setScreen('race'); K.handlers.down = null; V.clearFx();
    K.sfx.dingdong();
    K.scene = { update, draw };
  };

  function update(dt) {
    if (!R) return;
    R.pt += dt;
    const me = R.me, cam = R.cam;
    if (R.pop) { R.pop.t += dt; if (R.pop.t > 1.3) R.pop = null; }
    if (R.banner) { R.banner.t += dt; if (R.banner.t > 1.8) R.banner = null; }
    if (R.phase === 'intro') {
      const k = clamp(R.pt / 2.2, 0, 1), e = k * k * (3 - 2 * k), a = aim(-12);
      cam.X = lerp(R.fit.X, a[0], e); cam.Y = lerp(R.fit.Y, a[1], e); cam.zoom = lerp(R.fit.zoom, 3.3, e);
      if (R.pt >= 2.5) { R.phase = 'count'; R.pt = 0; R.lamp = 0; }
    } else if (R.phase === 'count') {
      const n = Math.min(3, 1 + Math.floor(R.pt / 0.75));
      if (n !== R.lamp) {
        R.lamp = n;
        if (n < 3) K.tone(520, 0, 0.16, 'square', 0.07);
        else { K.tone(1040, 0, 0.5, 'square', 0.08); R.phase = 'run'; R.pt = 0; }
      }
    } else if (R.phase === 'run') {
      const sd = dt * R.speed; R.t += sd;
      for (const o of R.runs) step(o, R.t);
      const ev = me.res.events;
      while (R.ei < ev.length && ev[R.ei].t <= R.t) {
        const e = ev[R.ei++], k = e.seg != null ? R.course.segs[e.seg].k : '';
        if (e.type === 'lap') { R.banner = { text: 'あと 1しゅう', t: 0 }; K.sfx.dingdong(); G.say('あと いっしゅう'); }
        else if (e.type === 'dash' && e.good) { pop('ダッシュ！', '#e2562f'); K.tone(300, 0, 0.5, 'sawtooth', 0.06, 900); }
        else if (e.type === 'over') { pop(k === 'curve' ? 'ふくらんだ！' : 'ぐらついた！', '#c9762a'); K.tone(700, 0, 0.35, 'triangle', 0.06, 380); }
        else if (e.type === 'brake' && !e.waste) pop('ゆっくり', '#2f7fc4');
      }
      if (!me.fin) K.runSound(sd, me.v / 55);
      const a = aim(me.d - 14 + clamp(me.v * 0.2, 0, 26)), kp = Math.min(1, dt * 5);
      cam.X += (a[0] - cam.X) * kp; cam.Y += (a[1] - cam.Y) * kp;
      cam.zoom += ((me.fin ? 3.7 : me.dash ? 2.95 : 3.3) - cam.zoom) * Math.min(1, dt * 2.5);
      if (me.fin) {
        if (!R.done) { R.done = true; R.ft = 0; K.sfx.whistle(); }
        R.ft += dt;
        if (R.ft > 2.1) finish();
      }
    }
  }

  function draw(t, dt) {
    if (!R) return;
    const me = R.me, cam = R.cam, course = R.course, run = R.phase === 'run';
    V.begin(R.sc, cam); V.trains(R.sc, R.runs, t, run ? dt * R.speed : 0); V.fx(dt); V.end();
    if (me.dash && me.q) V.speedLines(t, 1, Math.atan2(me.q.fy * KY, me.q.fx));
    // ---- うえ: やめる・じゅんい・なんしゅうめ・じかん・ちず ----
    K.button(16, 16, 128, 62, 'やめる', '#55637c', () => { R = null; G.toPlan(); }, { size: 29 });
    const key = o => o.fin ? 1e6 - o.res.time : o.d;
    const rank = 1 + R.runs.filter(o => !o.me && key(o) > key(me)).length;
    D.plate(160, 16, 132, 62, 10); K.text(rank + 'い', 226, 48, 42, RC[rank - 1], 'center', null);
    D.plate(304, 16, 200, 62, 10); K.text((Math.min(course.laps - 1, me.lap || 0) + 1) + 'しゅうめ', 404, 48, 32, D.INK, 'center', null);
    K.lcd(1050, 16, 214, 62, Math.min(R.t, me.res.time).toFixed(1), '#ffb454', 40);
    D.plate(1050, 90, 214, 136, 10);
    const m = D.courseMap(course, 1056, 96, 202, 124, { r: 8, pad: 6 });
    if (m) for (let i = R.runs.length - 1; i >= 0; i--) { const o = R.runs[i], p = m.at(o.d, o.lane); K.circle(p[0], p[1], o.me ? 9 : 6.5, o.color, '#ffffff', o.me ? 3 : 2); }
    // ---- した: めいれいの おび・はやさ・はやおくり ----
    const N = R.N, gap = 6, cw = Math.min(110, (872 - gap * (N - 1)) / N), x0 = 204 + (872 - cw * N - gap * (N - 1)) / 2;
    K.rr(x0 - 10, 612, cw * N + gap * (N - 1) + 20, 100, 12, 'rgba(12,18,29,0.72)');
    course.segs.forEach((s, i) => {
      const on = R.phase !== 'intro' && !me.fin && me.seg === i, x = x0 + i * (cw + gap), y = on ? 614 : 620, cmd = me.res.cmds[i];
      D.plate(x, y, cw, 86, 8, on);
      D.segIcon(s.k, x + cw / 2, y + (cmd ? 26 : 43), cmd ? 0.62 : 0.8);
      if (cmd) D.cmdChip(cmd, x + 7, y + 48, cw - 14, 32, { icon: false, iconOnly: true, soft: !on });
    });
    K.gauge(1198, 640, 62, me.v / 190, '', me.dash ? '#ff7a2b' : '#ffb454');
    K.button(16, 626, 172, 78, R.speed > 1 ? 'ふつう' : 'はやおくり', '#55637c', () => { R.speed = R.speed > 1 ? 1 : 2.5; }, { size: 28 });
    // ---- しんごう ----
    if (R.phase === 'count' || (run && R.pt < 0.9)) {
      K.rr(520, 96, 240, 92, 16, '#151c2a', '#44526c', 3);
      for (let i = 0; i < 3; i++) {
        const go = run, lit = go || i < R.lamp, col = go ? '#4fd27a' : lit ? '#e2483c' : '#3a2f33';
        if (lit) { c.globalAlpha = 0.3; K.circle(580 + i * 60, 142, 34, col); c.globalAlpha = 1; }
        K.circle(580 + i * 60, 142, 25, col, '#0c1119', 3);
      }
    }
    // ---- ふきだし・しらせ ----
    if (R.pop && me.top) {
      const s = V.screen(cam, me.top[0], me.top[1]), k = Math.min(1, R.pop.t / 0.18);
      c.globalAlpha = clamp((1.3 - R.pop.t) / 0.3, 0, 1);
      D.tag(R.pop.text, clamp(s[0], 150, W - 150), Math.max(R.banner ? 236 : 120, s[1] - 84 - 26 * k), 40, R.pop.col, '#ffffff');
      c.globalAlpha = 1;
    }
    if (R.done) K.text('ゴール！', W / 2, 200, 112, '#ffd23f', 'center', '#16203a');
    else if (R.banner) K.text(R.banner.text, W / 2, 150, 72, '#ffffff', 'center', '#16203a');
  }

  // ================= けっか =================
  function finish() {
    const S = G.S, co = R.course, me = R.me, time = me.res.time;
    const order = R.runs.slice().sort((a, b) => a.res.time - b.res.time || (a.me ? -1 : 1));
    const rank = order.indexOf(me) + 1, first = rank === 1, gold = first && time <= co.gold;
    const old = S.best[co.id], newBest = !old || time < old;
    if (newBest) S.best[co.id] = time;
    const star = 1 + (first ? 1 : 0) + (gold ? 1 : 0), got = [];
    S.star[co.id] = Math.max(S.star[co.id] || 0, star);
    const give = ids => (ids || []).forEach(id => { if (!S.owned.includes(id)) { S.owned.push(id); S.fresh.push(id); got.push(id); } });
    let ruleNew = false, sticker = null;
    if (first) {
      if (!S.done.includes(co.id)) S.done.push(co.id);
      give(co.reward);
      if (co.unlockRule && !S.rule) { S.rule = true; ruleNew = true; }
      S.tries[co.id] = 0;
      sticker = K.addSticker('でんしゃ グランプリ');
    } else S.tries[co.id] = (S.tries[co.id] || 0) + 1;
    if (gold) { if (!S.gold.includes(co.id)) S.gold.push(co.id); give(co.goldReward); }
    // つぎに ためすと よい こと
    const ov = me.res.events.filter(e => e.type === 'over'), cmds = me.res.cmds;
    G.lastOver[co.id] = [...new Set(ov.map(e => e.seg))];
    let hint = null;
    if (!gold) {
      const byDash = ov.find(e => e.cause === 'dash'), fast = ov.find(e => e.cause === 'fast');
      if (byDash) hint = 'ダッシュは まっすぐか さかに おこう';
      else if (fast) hint = { curve: 'カーブで ふくらんだよ。ゆっくりを おいて みよう', jump: 'ジャンプで ぐらついたよ。ゆっくりを おいて みよう', bump: 'でこぼこで ぐらついたよ。ゆっくりを おいて みよう' }[co.segs[fast.seg].k];
      else if (!cmds.includes('dash')) hint = 'まっすぐに ダッシュを おいて みよう';
      else if (me.res.events.some(e => e.type === 'brake' && e.waste)) hint = 'ゆっくりは カーブで つかおう';
      else hint = first ? 'ぶひんを かえて きんの タイムを ねらおう' : 'ぶひんを かえて みよう';
    }
    G.save();
    RES = { rank, first, gold, time, best: S.best[co.id], newBest: newBest && !!old, star, got, ruleNew, sticker, hint, order };
    showResult();
  }

  function showResult() {
    const res = RES, S = G.S, co = R.course, sc = R.sc, runs = R.runs, cam = { X: R.fit.X, Y: R.fit.Y, zoom: R.fit.zoom };
    const ci = G.ci, hasNext = res.first && ci + 1 < GP.COURSES.length;
    const lines = res.hint ? res.hint.split('。') : [];
    // まだ もらって いない ごほうび
    const want = co.reward.filter(id => !S.owned.includes(id)), wantGold = (co.goldReward || []).filter(id => !S.owned.includes(id));
    let rt = 0, said2 = false;
    G.setScreen('result'); K.handlers.down = null;
    if (res.first) { K.sfx.fanfare(); K.confetti(res.gold ? 140 : 90); } else K.sfx.good();
    if (res.gold) G.say('きんの タイムだ！ すごい');
    else if (res.rank === 1) G.say('1い！ やったね');
    else if (res.rank === 2) G.say('にい。あと すこしだったね');
    else if (res.rank === 3) G.say('さんい。つぎは かてるよ');
    else G.say('よんい。ぶひんを かえて みよう');
    const item = (x, id, t, dim) => {
      const sl = GP.slotOf(id), p = GP.find(sl, id);
      K.rr(x - 62, 352, 124, 84, 10, 'rgba(8,12,20,0.5)', dim ? '#44526c' : D.GOLD, 2.5);
      T.part(sl, id, x, 394, 0.92, t);
      if (dim) { K.rr(x - 62, 352, 124, 84, 10, 'rgba(10,14,22,0.5)'); }
      K.text(p.name, x, 456, 28, dim ? D.SUB : D.INK, 'center', null);
    };
    K.scene = {
      update(dt) {
        rt += dt;
        if (!said2 && rt > 2.8) {
          said2 = true;
          if (res.got.length) G.say('あたらしい ぶひんを もらったよ');
          else if (res.ruleNew) G.say('もし なら の きまりが つかえるよ');
          else if (res.hint) G.say(res.hint);
        }
      },
      draw(t) {
        V.begin(sc, cam); V.trains(sc, runs, t, 0); V.end();
        c.fillStyle = 'rgba(10,14,22,0.74)'; c.fillRect(0, 0, W, H);
        // ---- ひだり: じゅんい・ほし・じかん ----
        D.plate(40, 40, 560, 640, 14);
        const pk = Math.min(1, rt / 0.35), sz = 132 * (1.5 - 0.5 * pk);
        K.text(res.rank + 'い', 320, 128, sz, RC[res.rank - 1], 'center', '#101724');
        ['ゴール', '1い', 'きん'].forEach((s, i) => {
          const x = 200 + i * 120, on = i < res.star && rt > 0.5 + i * 0.3;
          K.star(x, 244, on ? 36 + 6 * Math.max(0, 1 - (rt - 0.5 - i * 0.3) * 4) : 36, on ? D.GOLD : '#3b465c');
          K.text(s, x, 304, 28, i < res.star ? '#ffd9a0' : D.SUB, 'center', null);
        });
        K.text('じかん', 76, 378, 30, D.SUB, 'left', null);
        K.text(res.time.toFixed(1), 196, 374, 62, D.INK, 'left', null);
        if (res.newBest) D.tag('しんきろく', 470, 376, 30, '#d8483c', '#ffffff');
        else K.text('きろく ' + res.best.toFixed(1), 572, 378, 28, '#ffd9a0', 'right', null);
        K.star(92, 436, 14, D.GOLD);
        K.text('きんの タイム ' + co.gold.toFixed(1), 116, 438, 28, D.GOLD, 'left', null);
        K.rr(60, 474, 520, 186, 12, '#101724', '#3d4a63', 2);
        if (res.sticker) {
          K.drawSticker(res.sticker.s, 150, 567, 66);
          K.text('シールを', 250, 544, 32, D.INK, 'left', null); K.text('もらったよ', 250, 590, 32, D.INK, 'left', null);
        } else lines.forEach((s, i) => K.text(s, 320, 567 + (i - (lines.length - 1) / 2) * 50, 30, '#ffd9a0', 'center', null));
        // ---- みぎ: じゅんばん・もらった ぶひん ----
        D.plate(640, 40, 600, 440, 14);
        res.order.forEach((o, i) => {
          const y = 56 + i * 62;
          if (o.me) K.rr(652, y, 576, 56, 10, 'rgba(240,181,58,0.16)', D.GOLD, 2.5);
          K.text(String(i + 1), 682, y + 29, 36, RC[i], 'center', null);
          K.rr(712, y + 12, 60, 32, 8, o.color, K.shade(o.color, -0.5), 2.5); K.rr(748, y + 17, 18, 12, 3, '#1b2740');
          K.text(o.name, 790, y + 29, 30, o.me ? D.GOLD : D.INK, 'left', null);
          K.text(o.res.time.toFixed(1), 1212, y + 29, 30, o.me ? D.GOLD : D.INK, 'right', null);
        });
        if (res.got.length || res.ruleNew) {
          K.text('あたらしい ぶひん', 664, 328, 28, '#ffd9a0', 'left', null);
          res.got.forEach((id, j) => item(730 + j * 140, id, t, false));
          if (res.ruleNew) { const x = 730 + res.got.length * 140; D.cmdChip('brake', x - 62, 352, 124, 84); K.text('きまり', x, 456, 28, D.INK, 'center', null); }
        } else if (want.length) {
          K.text('1いに なると もらえる', 664, 328, 28, D.SUB, 'left', null);
          want.forEach((id, j) => item(730 + j * 140, id, t, true));
        } else if (wantGold.length) {
          K.text('きんの タイムで もらえる', 664, 328, 28, D.SUB, 'left', null);
          wantGold.forEach((id, j) => item(730 + j * 140, id, t, true));
        }
        // ---- ボタン ----
        if (hasNext) K.button(640, 500, 600, 88, 'つぎの コースへ', '#d8483c', () => { K.sfx.good(); G.setCourse(ci + 1); R = null; G.toGarage(); }, { size: 40 });
        else K.button(640, 500, 600, 88, 'コースを えらぶ', '#55637c', () => { R = null; G.toCourse(); }, { size: 38 });
        K.button(640, 604, 290, 80, 'もういちど', res.first ? '#55637c' : '#d8483c', () => { R = null; G.toPlan(); }, { size: 36 });
        K.button(950, 604, 290, 80, 'かいぞう', '#3f9f66', () => { R = null; G.toGarage(); }, { size: 36 });
      },
    };
  }
  window.GPRACE = { get R() { return R; }, get result() { return RES; } };
})();
