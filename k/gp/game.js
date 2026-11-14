// でんしゃ グランプリ — がめん（タイトル・コースえらび・かいぞう・さくせん）と もちもの
// ①コースを えらぶ → ②かいぞう（ぶひんを くみかえる）→ ③さくせん（くかんに めいれいを おく）→ ④レース（race.js）
(function () {
  'use strict';
  const W = K.W, H = K.H, c = K.ctx, D = window.GPD, T = window.GPT, V = window.GPV, TRK = window.TRK;
  const GAME = 'でんしゃ グランプリ', SAVE = 'kidtrain_gp', VER = 2;
  const COLORS = ['#c9453a', '#2f6fa8', '#3f8f66', '#d79a26', '#6b5bb5'];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // ---------- もちもの（この たんまつの なかだけに のこす） ----------
  let S = {
    v: VER, owned: GP.STARTPARTS.slice(), build: Object.assign({}, GP.BASEBUILD), color: 0,
    done: [], gold: [], best: {}, star: {}, tries: {}, rule: false, fresh: [], prog: {}, seen: {},
  };
  function load() {
    try {
      const o = JSON.parse(localStorage.getItem(SAVE) || 'null');
      if (o && o.v === VER) S = Object.assign(S, o);
      else if (o && typeof o.color === 'number') S.color = o.color;   // まえの かたちの きろくは いろだけ ひきつぐ（コースが かわった ため）
    } catch (e) {}
    for (const id of GP.STARTPARTS) if (!S.owned.includes(id)) S.owned.push(id);
    for (const sl of GP.SLOTS) {
      const id = S.build[sl];
      if (!id || !S.owned.includes(id) || GP.find(sl, id).id !== id) S.build[sl] = GP.BASEBUILD[sl];
    }
  }
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) {} }
  const myColor = () => COLORS[S.color % COLORS.length];

  // ---------- いまの がめん ----------
  let screen = 'title', ci = 0, course = GP.COURSES[0];
  const lastOver = {};          // まえの レースで ふくらんだ くかん（コースごと）
  function say(s) { K.say(s); }
  const unlocked = i => i === 0 || S.done.includes(GP.COURSES[i - 1].id);
  function prog() {
    const p = S.prog[course.id] || (S.prog[course.id] = { segs: {}, rule: null });
    if (!p.segs) p.segs = {};
    return p;
  }
  // けいさんに わたす かたち
  function progFor() {
    const p = prog();
    return { segs: p.segs, rules: S.rule && p.rule && p.rule.kind ? [p.rule] : [] };
  }

  function lock(x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.strokeStyle = '#aab3c2'; c.lineWidth = 6; c.beginPath(); c.arc(0, -8, 11, Math.PI, 0); c.stroke();
    K.rr(-17, -8, 34, 28, 6, '#aab3c2', '#59647a', 2); K.circle(0, 5, 4.5, '#3a4252');
    c.restore();
  }
  function tri(x, y, r, up, col) {
    c.beginPath();
    if (up) { c.moveTo(x, y - r); c.lineTo(x + r, y + r * 0.8); c.lineTo(x - r, y + r * 0.8); }
    else { c.moveTo(x, y + r); c.lineTo(x + r, y - r * 0.8); c.lineTo(x - r, y - r * 0.8); }
    c.closePath(); c.fillStyle = col; c.fill();
  }
  // うえの おび（もどる・せつめい・コースの なまえ）
  function topBar(back, msg, col) {
    K.button(16, 16, 128, 62, 'もどる', '#55637c', back, { size: 29 });
    D.msg(160, 16, 760, 62, msg, col, 28);
    D.plate(936, 16, 328, 62, 10);
    K.text(course.name, 1100, 48, 30, D.INK, 'center', null);
  }

  // ================= タイトル =================
  function toTitle() {
    screen = 'title'; K.handlers.down = null; V.clearFx();
    const co = GP.COURSES[0], cam = { X: 0, Y: 0, zoom: 2.3 };
    let sc = null;
    const cars = [{ build: S.build, color: myColor(), off: -27, gap: 0, me: false }]
      .concat(co.rivals.map((r, i) => ({ build: r.build, color: r.color, off: [27, 9, -9][i], gap: [-64, 30, -30][i] })));
    K.scene = {
      update() {},
      draw(t, dt) {
        if (!sc) sc = V.scene(co);
        const d0 = 200 + t * 58;
        cars[0].build = S.build; cars[0].color = myColor();
        for (const r of cars) { r.d = d0 + r.gap; r.v = 58; }
        const p = TRK.at(sc.trk, d0 - 14), X = p.x + Math.cos(p.a) * 30, Y = (p.y + Math.sin(p.a) * 30) * TRK.KY - 14;
        const k = cam.X === 0 && cam.Y === 0 ? 1 : Math.min(1, dt * 2.2);
        cam.X += (X - cam.X) * k; cam.Y += (Y - cam.Y) * k;
        V.begin(sc, cam); V.trains(sc, cars, t, dt); V.fx(dt); V.end();
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, 'rgba(10,16,28,0.78)'); g.addColorStop(0.42, 'rgba(10,16,28,0.12)'); g.addColorStop(0.62, 'rgba(10,16,28,0.1)'); g.addColorStop(1, 'rgba(10,16,28,0.8)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        K.text(GAME, W / 2, 150, 86, '#ffffff', 'center', '#16203a');
        K.text('かいぞうして レースに かとう', W / 2, 232, 36, '#ffe08a', 'center', '#16203a');
        K.button(440, 500, 400, 100, 'はじめる', '#d8483c', () => { K.sfx.good(); toCourse(); }, { size: 46 });
        K.homeButton();
      },
    };
  }

  // ================= コースえらび =================
  function toCourse() {
    screen = 'course'; K.handlers.down = null;
    let said = false;
    K.scene = {
      update() {},
      draw(t) {
        D.bg();
        if (!said) { said = true; say('コースを えらんでね'); }
        K.button(16, 16, 128, 62, 'もどる', '#55637c', toTitle, { size: 29 });
        K.text('コースを えらぼう', W / 2, 50, 44, D.INK, 'center', null);
        K.star(1090, 48, 20, D.GOLD);
        K.text(String(Object.values(S.star).reduce((a, b) => a + b, 0)), 1124, 50, 36, D.GOLD, 'left', null);
        GP.COURSES.forEach((co, i) => {
          const x = 50 + (i % 3) * 400, y = 100 + Math.floor(i / 3) * 300, w = 380, h = 280, open = unlocked(i);
          const next = open && !S.done.includes(co.id);
          D.plate(x, y, w, h, 14, next);
          D.courseMap(co, x + 10, y + 10, w - 20, 170, { r: 10 });
          K.rr(x + 18, y + 18, 44, 44, 10, 'rgba(16,23,36,0.85)');
          K.text(String(i + 1), x + 40, y + 41, 32, '#ffffff', 'center', null);
          K.text(co.name, x + 20, y + 212, 36, D.INK, 'left', null);
          if (open) {
            D.stars(x + 34, y + 252, S.star[co.id] || 0, 3, 13);
            if (S.best[co.id]) K.text('きろく ' + S.best[co.id].toFixed(1), x + w - 18, y + 252, 28, '#ffd9a0', 'right', null);
            else if (next) D.tag('あたらしい', x + w - 96, y + 252, 28, '#d8483c', '#ffffff');
          } else {
            K.rr(x, y, w, h, 14, 'rgba(10,14,22,0.66)');
            lock(x + w / 2, y + 96, 2.1);
          }
          D.hit(x, y, w, h, () => {
            if (!unlocked(i)) { K.sfx.oops(); say('まえの コースで 1いに なると あくよ'); return; }
            K.sfx.good(); ci = i; course = co; toGarage();
          });
        });
      },
    };
  }

  // ================= かいぞう =================
  const TAB = { motor: 'モーター', gear: 'はぐるま', tire: 'タイヤ', wing: 'はね', battery: 'でんち', gadget: 'ひみつ' };
  const BAR = { spd: [75, 165], acc: [30, 200], grip: [60, 160], stb: [70, 155], hill: [40, 165] };
  const statVal = (s, k) => k === 'hill' ? s.hill * 100 : s[k];
  // この ぶひんに かえると なにが かわるか（おおきい じゅんに 2つ）
  function diffs(slot, id) {
    const a = GP.stats(S.build, course), b = GP.stats(Object.assign({}, S.build, { [slot]: id }), course), out = [];
    for (const [k, name, col] of D.STAT) { const d = statVal(b, k) - statVal(a, k); if (Math.abs(d) >= 2) out.push({ name, col, d }); }
    if (b.dash !== a.dash) out.push({ name: 'ダッシュ', col: '#ff8a5c', d: (b.dash - a.dash) * 40 });
    if (b.boost !== a.boost) out.push({ name: 'ダッシュ', col: '#ff8a5c', d: (b.boost - a.boost) * 150 });
    if (b.spring !== a.spring) out.push({ name: 'ジャンプ', col: '#e8b83a', d: (b.spring - a.spring) * 150 });
    out.sort((x, y) => Math.abs(y.d) - Math.abs(x.d));
    return out.slice(0, 2);
  }
  function cellIcon(x, y, w, h, on) {
    K.rr(x + w * 0.3, y - 5, w * 0.4, 7, 2, on ? '#c9d2e0' : '#4a566c');
    K.rr(x, y, w, h, 5, on ? '#3f9f66' : '#2a3446', on ? '#1d5a37' : '#4a566c', 2.5);
    if (on) K.rr(x + 4, y + 4, w * 0.3, h - 8, 3, 'rgba(255,255,255,0.3)');
  }

  function toGarage() {
    screen = 'garage'; K.handlers.down = null;
    let slot = 'motor', msg = null, chT = -9, prev = null, said = false;
    K.scene = {
      update() {},
      draw(t) {
        D.bg();
        if (!said) { said = true; say(course.hint); }
        topBar(toCourse, msg || course.hint, msg ? '#a8e6b4' : '#ffd9a0');
        const st = GP.stats(S.build, course);
        T.side(330, 340, S.build, myColor(), 0.92, t, { hi: slot, run: 0.25 });
        // せいのうの ぼう
        D.STAT.forEach(([k, name, col], i) => {
          const y = 388 + i * 44, v = statVal(st, k), f = clamp((v - BAR[k][0]) / (BAR[k][1] - BAR[k][0]), 0.05, 1);
          K.text(name, 24, y + 23, 28, D.INK, 'left', null);
          K.rr(170, y + 8, 392, 30, 8, '#101724', '#3d4a63', 2);
          K.rr(174, y + 12, 384 * f, 22, 5, col);
          K.rr(174, y + 12, 384 * f, 8, 4, 'rgba(255,255,255,0.22)');
          c.fillStyle = 'rgba(16,23,36,0.55)';
          for (let j = 1; j < 8; j++) c.fillRect(174 + j * 48, y + 12, 2, 22);
          if (prev && t - chT < 3) {
            const d = v - statVal(prev, k);
            if (Math.abs(d) >= 2) tri(600, y + 23, 14, d > 0, d > 0 ? '#6fd391' : '#ff8a6b');
          }
        });
        // いろ
        COLORS.forEach((col, i) => {
          const x = 24 + i * 104;
          K.button(x, 630, 96, 66, '', col, () => { S.color = i; save(); });
          if (S.color % COLORS.length === i) K.rr(x - 4, 626, 104, 74, 14, null, '#ffffff', 4);
        });
        // ぶひんの しゅるい
        GP.SLOTS.forEach((sl, i) => {
          const x = 656 + (i % 3) * 204, y = 96 + Math.floor(i / 3) * 92, on = sl === slot;
          D.plate(x, y, 196, 84, 10, on);
          T.part(sl, S.build[sl], x + 40, y + 42, 0.62, t);
          K.text(TAB[sl], x + 78, y + 43, 28, on ? '#ffffff' : '#b9c5d8', 'left', null);
          if (S.fresh.some(id => GP.slotOf(id) === sl)) K.circle(x + 182, y + 14, 9, '#d8483c', '#ffffff', 2.5);
          D.hit(x, y, 196, 84, () => { slot = sl; msg = null; say(GP.SLOTNAME[sl]); });
        });
        // ぶひん
        GP.PARTS[slot].forEach((p, i) => {
          const x = 656 + (i % 2) * 308, y = 290 + Math.floor(i / 2) * 160, own = S.owned.includes(p.id), on = S.build[slot] === p.id;
          D.plate(x, y, 296, 150, 12, on);
          T.part(slot, p.id, x + 54, y + 80, 1.05, t);
          K.text(p.name, x + 104, y + 38, 34, D.INK, 'left', null);
          if (!own) {
            K.rr(x, y, 296, 150, 12, 'rgba(10,14,22,0.62)');
            lock(x + 190, y + 98, 1.3);
          } else if (on) {
            K.circle(x + 120, y + 100, 15, '#3f9f66');
            c.strokeStyle = '#ffffff'; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round';
            c.beginPath(); c.moveTo(x + 112, y + 100); c.lineTo(x + 118, y + 107); c.lineTo(x + 129, y + 93); c.stroke(); c.lineCap = 'butt';
            K.text('つけてる', x + 144, y + 101, 28, D.GOLD, 'left', null);
          } else {
            diffs(slot, p.id).forEach((d, j) => {
              const yy = y + 66 + j * 40;
              K.rr(x + 100, yy, 186, 36, 8, 'rgba(8,12,20,0.5)');
              tri(x + 118, yy + 18, 10, d.d > 0, d.d > 0 ? '#6fd391' : '#ff8a6b');
              K.text(d.name, x + 136, yy + 19, 28, d.col, 'left', null);
            });
          }
          if (own && S.fresh.includes(p.id)) D.tag('あたらしい', x + 214, y + 2, 28, '#d8483c', '#ffffff');
          D.hit(x, y, 296, 150, () => {
            if (!own) { K.sfx.oops(); msg = 'レースで 1いに なると もらえるよ'; say('レースで 1いに なると もらえるよ'); return; }
            S.fresh = S.fresh.filter(id => id !== p.id);
            if (!on) { prev = GP.stats(S.build, course); chT = t; S.build[slot] = p.id; K.sfx.good(); K.sparkle(330, 250, 14, '#ffd23f'); }
            msg = p.name + '： ' + p.tip; say(p.tip); save();
          });
        });
        // ダッシュの かず と つぎへ
        D.plate(656, 620, 284, 84, 10);
        K.text('ダッシュ', 674, 663, 28, '#ff8a5c', 'left', null);
        for (let i = 0; i < 3; i++) cellIcon(806 + i * 42, 640, 30, 46, i < st.dash);
        K.button(960, 620, 304, 84, 'さくせんへ', '#3f9f66', () => { K.sfx.good(); toPlan(); }, { size: 38 });
      },
    };
  }

  // ================= さくせん =================
  // くかんごとに めいれいを おく（じゅんばん）。2しゅう おなじ さくせんを くりかえす。「もし〜なら」の きまりも つかえる
  function toPlan() {
    screen = 'plan';
    const p = prog(), st = GP.stats(S.build, course), N = course.segs.length;
    const kinds = [null].concat(['curve', 'bump', 'jump', 'slope', 'straight'].filter(k => course.segs.some(s => s.k === k)));
    let msg = null, said = false, map = null;
    let n = 0;                                                  // でんちより おおい ダッシュは はずす
    for (const i of Object.keys(p.segs)) if (p.segs[i] === 'dash' && ++n > st.dash) delete p.segs[i];
    const tell = s => { msg = s; say(s); };
    function tapSeg(i) {
      const s = course.segs[i], cur = p.segs[i], risky = GP.risky(s.k);
      const used = Object.values(p.segs).filter(v => v === 'dash').length;
      S.seen.plan = true;
      if (!cur && used < st.dash) {
        p.segs[i] = 'dash'; K.sfx.star();
        if (risky) tell('ここで ダッシュは ふくらむ かも'); else tell('ダッシュ！ ここで ぐんと はやく なる');
      } else if (cur !== 'brake') {
        p.segs[i] = 'brake'; K.sfx.pop();
        if (!cur) tell('ダッシュは でんちの かずだけ つかえるよ');
        else if (risky) tell('ゆっくり。ふくらまずに とおれる'); else tell('ここで ゆっくりは もったいない かも');
      } else { delete p.segs[i]; tell('めいれい なし。そのまま はしる'); }
      save();
    }
    K.handlers.down = pt => {
      if (!map || pt.x < 16 || pt.x > 776 || pt.y < 92 || pt.y > 496) return;
      let best = -1, bd = 60;
      for (let i = 0; i < N; i++) { const m = map.mid(i), d = Math.hypot(m[0] - pt.x, m[1] - pt.y); if (d < bd) { bd = d; best = i; } }
      if (best >= 0) { K.sfx.pop(); tapSeg(best); }
    };
    K.scene = {
      update() {},
      draw(t) {
        D.bg();
        if (!said) { said = true; say(S.seen.plan ? 'カードを おすと めいれいが かわるよ' : 'まっすぐの カードを おして ダッシュを おこう'); }
        topBar(toGarage, msg || (S.seen.plan ? 'カードを おすと めいれいが かわるよ' : 'まっすぐの カードを おして ダッシュを おこう'), msg ? '#a8e6b4' : '#ffd9a0');
        const cmds = GP.resolve(course, progFor(), st.dash), over = lastOver[course.id] || [];
        // コースの ちず
        K.rr(12, 88, 768, 412, 14, '#0c121d');
        map = D.courseMap(course, 16, 92, 760, 404, { r: 12 });
        if (map) course.segs.forEach((s, i) => {
          if (cmds[i]) { c.globalAlpha = 0.85; D.segStroke(map, course, i, D.CMDCOL[cmds[i]], 13); c.globalAlpha = 1; }
          const m = map.mid(i);
          K.circle(m[0], m[1], 21, '#101724', cmds[i] ? D.CMDCOL[cmds[i]] : '#c9d2e0', 3.5);
          K.text(String(i + 1), m[0], m[1] + 1, 28, '#ffffff', 'center', null);
          if (over.includes(i) && !cmds[i]) { K.circle(m[0] + 22, m[1] - 22, 13, '#ff8a3c', '#ffffff', 2); K.rr(m[0] + 20, m[1] - 30, 4, 10, 2, '#ffffff'); K.circle(m[0] + 22, m[1] - 15.5, 2.3, '#ffffff'); }
        });
        // みぎの いた
        D.plate(792, 92, 472, 404, 12);
        K.text('ダッシュ', 812, 140, 30, '#ff8a5c', 'left', null);
        const usedAll = cmds.filter(v => v === 'dash').length;
        for (let i = 0; i < st.dash; i++) cellIcon(966 + i * 58, 114, 40, 54, i >= usedAll);
        if (S.rule) {
          const r = p.rule || (p.rule = { kind: null, act: 'brake' });
          K.text('もし', 812, 242, 30, D.INK, 'left', null);
          D.plate(878, 196, 150, 90, 10, !!r.kind);
          if (r.kind) { D.segIcon(r.kind, 953, 226, 0.8); K.text(D.SEGNAME[r.kind], 953, 266, 28, '#ffffff', 'center', null); }
          else K.text('えらぶ', 953, 242, 28, D.SUB, 'center', null);
          D.hit(878, 196, 150, 90, () => {
            r.kind = kinds[(kinds.indexOf(r.kind) + 1) % kinds.length];
            if (r.kind) tell('もし ' + D.SEGNAME[r.kind] + ' なら'); else tell('きまり なし');
            save();
          });
          K.text('なら', 1036, 242, 30, D.INK, 'left', null);
          D.cmdChip(r.act, 1104, 196, 146, 90, { soft: !r.kind });
          D.hit(1104, 196, 146, 90, () => { r.act = r.act === 'brake' ? 'dash' : 'brake'; tell(D.CMDNAME[r.act]); save(); });
        } else {
          D.cmdChip(null, 812, 196, 432, 90);
          lock(850, 244, 1.1); K.text('もし なら の きまり', 884, 242, 28, D.SUB, 'left', null);
          D.hit(812, 196, 432, 90, () => { K.sfx.oops(); tell('きまりは まちなかで かつと つかえるよ'); });
        }
        // くりかえし
        c.strokeStyle = '#8fd0ff'; c.lineWidth = 5; c.lineCap = 'round';
        c.beginPath(); c.arc(838, 340, 16, -0.4 + t * 1.5, 4.4 + t * 1.5); c.stroke(); c.lineCap = 'butt';
        K.text('2しゅう くりかえす', 868, 341, 28, '#8fd0ff', 'left', null);
        K.button(812, 388, 432, 96, 'しゅっぱつ！', '#d8483c', () => { save(); if (window.GPSTART) window.GPSTART(); }, { size: 46 });
        // くかんの カード
        const gap = 8, cw = Math.min(190, (1248 - gap * (N - 1)) / N), x0 = 16 + (1248 - cw * N - gap * (N - 1)) / 2;
        let fx = -1;
        course.segs.forEach((s, i) => {
          const x = x0 + i * (cw + gap), y = 508, bad = over.includes(i) && !cmds[i];
          D.plate(x, y, cw, 192, 10, !!p.segs[i]);
          if (bad) K.rr(x, y, cw, 192, 10, null, '#ff8a3c', 3.5);
          K.circle(x + 22, y + 22, 16, '#101724', D.SEGCOL[s.k], 2.5);
          K.text(String(i + 1), x + 22, y + 23, 28, '#ffffff', 'center', null);
          D.segIcon(s.k, x + cw / 2 + 14, y + 36, 0.95);
          K.text(D.SEGNAME[s.k], x + cw / 2, y + 82, 28, D.INK, 'center', null);
          D.cmdChip(cmds[i], x + 6, y + 104, cw - 12, 80, { soft: !!cmds[i] && !p.segs[i] });
          D.hit(x, y, cw, 192, () => tapSeg(i));
          if (fx < 0 && s.k === 'straight') fx = x + cw / 2;
        });
        if (!S.seen.plan && fx >= 0) D.finger(fx, 650, t);
      },
    };
  }

  window.GPG = {
    get screen() { return screen; }, get S() { return S; }, get course() { return course; }, get ci() { return ci; },
    get cmds() { return GP.resolve(course, progFor(), GP.stats(S.build, course).dash); },
    lastOver, COLORS, toTitle, toCourse, toGarage, toPlan, save, myColor, say, progFor, unlocked,
    setScreen(s) { screen = s; }, setCourse(i) { ci = i; course = GP.COURSES[i]; },
  };
  load();
  toTitle();
})();
