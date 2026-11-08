// でんしゃ グランプリ — ぶひんで かいぞうして、サーキットで レースする
// ①ガレージ（くみたて）→ ②さくせん（くかんに ダッシュ／ブレーキを おく）→ ③レース → ④けっか
(function () {
  'use strict';
  const W = K.W, H = K.H, c = K.ctx, D = window.GPD;
  const GAME = 'でんしゃ グランプリ';
  const SAVE = 'kidtrain_gp';

  // ---------- もちもの ----------
  const COLORS = ['#c9453a', '#2f6fa8', '#3f8f66', '#d79a26', '#6b5bb5'];
  let S = { owned: GP.STARTPARTS.slice(), build: { motor: 'm1', gear: 'g1', tire: 't1', wing: 'w1', battery: 'b1' }, color: 0, done: [], best: {} };
  function load() {
    try {
      const o = JSON.parse(localStorage.getItem(SAVE) || 'null');
      if (o && o.build) S = Object.assign(S, o);
    } catch (e) {}
    for (const id of GP.STARTPARTS) if (!S.owned.includes(id)) S.owned.push(id);
  }
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) {} }
  const myColor = () => COLORS[S.color % COLORS.length];

  // ---------- いまの がめん ----------
  let screen = 'title';
  let course = GP.COURSES[0];
  let slot = 'motor';          // ガレージで えらんでいる ところ
  let cmds = {};               // さくせん
  let race = null;             // レースの じょうたい
  let result = null;

  function say(s) { K.say(s); }

  // ================= タイトル =================
  function toTitle() {
    screen = 'title';
    K.handlers.down = null;
    K.scene = {
      update() {},
      draw(t) {
        D.garageBg(t);
        K.text(GAME, W / 2, 150, 76, '#e8ecf3', 'center', null);
        K.text('ぶひんで かいぞうして、サーキットで きそおう', W / 2, 218, 30, '#8fa3c0', 'center', null);
        D.train(W / 2, 390, S.build, myColor(), 1.5, t);
        K.button(W / 2 - 190, 500, 380, 96, 'はじめる', '#c9453a', () => { K.sfx.good(); toCourse(); });
        K.homeButton();
      }
    };
  }

  // ================= コースえらび =================
  function toCourse() {
    screen = 'course';
    K.handlers.down = null;
    K.scene = {
      update() {},
      draw(t) {
        D.garageBg(t);
        K.text('コースを えらぶ', W / 2, 74, 46, '#e8ecf3', 'center', null);
        GP.COURSES.forEach((co, i) => {
          const locked = i > 0 && !S.done.includes(GP.COURSES[i - 1].id);
          const x = 40 + i * 305, y = 130, w = 285, h = 420;
          D.plate(x, y, w, h, 14, course.id === co.id);
          // コースの かたち
          c.save(); c.translate(x + w / 2, y + 120);
          co.segs.forEach((sg, j) => {
            const a = j / co.segs.length * Math.PI * 2 - Math.PI / 2;
            D.segIcon(sg.k, Math.cos(a) * 74, Math.sin(a) * 74, 1.05);
          });
          c.restore();
          K.text(co.name.replace(' サーキット', ''), x + w / 2, y + 250, 30, '#e8ecf3', 'center', null);
          K.text(co.hint, x + w / 2, y + 292, 19, '#8fa3c0', 'center', null);
          const b = S.best[co.id];
          K.lcd(x + 26, y + 318, w - 52, 38, b ? 'ベスト ' + b.toFixed(2) : 'はじめて', b ? '#9ad7a0' : '#6e7b8f', 24);
          if (locked) {
            K.rr(x, y, w, h, 14, 'rgba(10,14,20,0.74)');
            K.text('まえの コースで 1いを とると あく', x + w / 2, y + h / 2, 22, '#8fa3c0', 'center', null);
          } else {
            K.button(x + 26, y + 366, w - 52, 42, 'これに する', course.id === co.id ? '#c9453a' : '#4a5568',
              () => { course = co; cmds = {}; K.sfx.pop(); }, { size: 24 });
          }
        });
        K.button(W - 300, 586, 260, 92, 'ガレージへ', '#3f8f66', toGarage, { size: 38 });
        K.button(40, 586, 200, 92, 'もどる', '#4a5568', toTitle, { size: 32 });
        K.homeButton();
      }
    };
  }

  // ================= ガレージ =================
  function statBars(x, y, w) {
    const s = GP.stats(S.build);
    const rows = [['はやさ', s.spd, '#c9453a'], ['かそく', s.acc, '#d79a26'],
                  ['ふんばり', s.grip, '#3f8f66'], ['あんてい', s.stb, '#2f6fa8']];
    rows.forEach(([n, v, col], i) => {
      const yy = y + i * 50;
      K.text(n, x, yy + 14, 23, '#8fa3c0', 'left', null);
      K.rr(x + 104, yy + 2, w - 104, 24, 6, '#121a28', '#3a4557', 2);
      const p = Math.max(0.03, Math.min(1, (v - 50) / 130));
      K.rr(x + 106, yy + 4, (w - 108) * p, 20, 5, col);
      K.text(Math.round(v) + '', x + w - 10, yy + 14, 21, '#e6ecf5', 'right', null);
    });
    const yy = y + 4 * 50;
    K.text('おもさ', x, yy + 14, 23, '#8fa3c0', 'left', null);
    K.text(s.w + '', x + w - 10, yy + 14, 21, '#e6ecf5', 'right', null);
    K.text('ダッシュ ' + s.dash + 'かい', x, yy + 48, 22, '#e8a23c', 'left', null);
  }
  function toGarage() {
    if (screen !== 'garage') say('ぶひんを かえると はやさが かわるよ');
    screen = 'garage';
    K.handlers.down = null;
    K.scene = {
      update() {},
      draw(t) {
        D.garageBg(t);
        K.text('ガレージ', 176, 52, 40, '#e8ecf3', 'left', null);
        K.text(course.name, W - 40, 52, 26, '#8fa3c0', 'right', null);
        D.train(700, 206, S.build, myColor(), 1.3, t);
        // いろ
        K.text('いろ', 1000, 108, 21, '#8fa3c0', 'left', null);
        COLORS.forEach((col, i) => {
          const x = 1000 + i * 52, on = S.color === i;
          K.rr(x, 124, 44, 44, 8, col, on ? '#e8a23c' : '#2a3342', on ? 4 : 2);
          const sv = c.globalAlpha; c.globalAlpha = 0;
          K.button(x, 124, 44, 44, '', '#fff', () => { S.color = i; save(); K.sfx.pop(); });
          c.globalAlpha = sv;
        });
        statBars(1000, 200, 250);
        // スロット（ひだり）
        GP.SLOTS.forEach((sl, i) => {
          const x = 30, y = 104 + i * 82, w = 330, h = 72, on = slot === sl;
          D.plate(x, y, w, h, 10, on);
          D.part(sl, S.build[sl], x + 44, y + h / 2, 0.8);
          K.text(GP.SLOTNAME[sl], x + 84, y + 23, 21, '#8fa3c0', 'left', null);
          K.text(shortName(sl, S.build[sl]), x + 84, y + 50, 25, '#e6ecf5', 'left', null);
          const sv = c.globalAlpha; c.globalAlpha = 0;
          K.button(x, y, w, h, '', '#fff', () => { slot = sl; K.sfx.pop(); });
          c.globalAlpha = sv;
        });
        // えらべる ぶひん（したの まんなか）
        K.text(GP.SLOTNAME[slot] + ' を えらぶ', 390, 392, 26, '#e8ecf3', 'left', null);
        GP.PARTS[slot].forEach((p, i) => {
          const have = S.owned.includes(p.id), on = S.build[slot] === p.id;
          const x = 390 + i * 190, y = 412, w = 176, h = 146;
          D.plate(x, y, w, h, 12, on);
          D.part(slot, p.id, x + w / 2, y + 50, have ? 1 : 0.78);
          if (!have) K.rr(x, y, w, h, 12, 'rgba(10,14,20,0.74)');
          K.text(have ? shortName(slot, p.id) : 'まだ ない', x + w / 2, y + 110, have ? 24 : 20, have ? '#e6ecf5' : '#6e7b8f', 'center', null);
          if (have) {
            const sv = c.globalAlpha; c.globalAlpha = 0;
            K.button(x, y, w, h, '', '#fff', () => { S.build[slot] = p.id; save(); K.sfx.pop(); });
            c.globalAlpha = sv;
          }
        });
        K.button(30, 590, 200, 90, 'もどる', '#4a5568', toCourse, { size: 32 });
        K.button(W - 320, 590, 290, 90, 'さくせん へ', '#c9453a', toPlan, { size: 38 });
        K.homeButton();
      }
    };
  }
  function shortName(sl, id) {
    const n = GP.find(sl, id).name.replace(GP.SLOTNAME[sl], '').trim();
    return n || 'ふつう';
  }

  // ================= さくせん =================
  function segRect(i) {
    const n = course.segs.length, w = Math.min(138, (W - 120) / n), x0 = W / 2 - (n * (w + 8)) / 2;
    return { x: x0 + i * (w + 8), y: 250, w, h: 200 };
  }
  function toPlan() {
    if (screen !== 'plan') say('ダッシュは まっすぐに おくと はやいよ');
    screen = 'plan';
    let pick = 'dash';
    K.handlers.down = p => {
      if (screen !== 'plan') return;
      for (let i = 0; i < course.segs.length; i++) {
        const r = segRect(i);
        if (p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h) {
          if (cmds[i] === pick) delete cmds[i]; else cmds[i] = pick;
          K.sfx.pop();
          return;
        }
      }
    };
    K.scene = {
      update() {},
      draw(t) {
        D.garageBg(t);
        K.text('さくせん', 176, 52, 40, '#e8ecf3', 'left', null);
        K.text(course.name + '　' + course.hint, W - 40, 54, 24, '#8fa3c0', 'right', null);
        const dashMax = GP.stats(S.build).dash;
        const used = Object.values(cmds).filter(v => v === 'dash').length;
        K.lcd(W / 2 - 300, 110, 600, 48, 'くかんを おして「' + (pick === 'dash' ? 'ダッシュ' : 'ブレーキ') + '」を おく', '#ffd9a0', 28);
        K.text('ダッシュは まっすぐで つかうと はやい。カーブで つかうと ふくらむ', W / 2, 192, 24, '#8fa3c0', 'center', null);
        K.text('ブレーキは カーブの まえに おくと ふくらまない', W / 2, 224, 24, '#8fa3c0', 'center', null);
        course.segs.forEach((sg, i) => {
          const r = segRect(i), cmd = cmds[i];
          D.plate(r.x, r.y, r.w, r.h, 12, !!cmd);
          c.fillStyle = D.SEGCOL[sg.k]; c.fillRect(r.x, r.y, r.w, 8);
          D.segIcon(sg.k, r.x + r.w / 2, r.y + 54, 1.5);
          K.text(D.SEGNAME[sg.k], r.x + r.w / 2, r.y + 102, 22, '#e6ecf5', 'center', null);
          if (cmd === 'dash') { K.rr(r.x + 14, r.y + 128, r.w - 28, 52, 8, '#c9453a', '#8e2f27', 2); K.text('ダッシュ', r.x + r.w / 2, r.y + 154, 22, '#fff', 'center', null); }
          if (cmd === 'brake') { K.rr(r.x + 14, r.y + 128, r.w - 28, 52, 8, '#2f6fa8', '#1f4a72', 2); K.text('ブレーキ', r.x + r.w / 2, r.y + 154, 22, '#fff', 'center', null); }
        });
        // えらぶ
        K.button(300, 486, 280, 80, 'ダッシュ', pick === 'dash' ? '#c9453a' : '#4a5568', () => { pick = 'dash'; K.sfx.pop(); }, { size: 32 });
        K.button(620, 486, 280, 80, 'ブレーキ', pick === 'brake' ? '#2f6fa8' : '#4a5568', () => { pick = 'brake'; K.sfx.pop(); }, { size: 32 });
        K.lcd(300, 578, 600, 44, 'でんち ' + used + ' / ' + dashMax + ' つかう', used > dashMax ? '#ff9a6b' : '#9ad7a0', 26);
        K.button(40, 586, 200, 92, 'ガレージ', '#4a5568', toGarage, { size: 30 });
        K.button(W - 320, 586, 280, 92, 'スタート！', '#3f8f66', startRace, { size: 40 });
        K.homeButton();
      }
    };
  }

  window.GPG = {
    get screen() { return screen; }, get S() { return S; }, get cmds() { return cmds; },
    get course() { return course; }, get race() { return race; }, get result() { return result; },
    toTitle, toCourse, toGarage, toPlan,
    setScreen(s) { screen = s; }, setRace(r) { race = r; }, setResult(r) { result = r; },
    save, myColor, say, setCourse(i) { course = GP.COURSES[i]; cmds = {}; },
  };

  load();
  toTitle();
  // レースの ぶぶんは race.js が いれる
  window.GPSTART = null;
  function startRace() { if (window.GPSTART) window.GPSTART(); }
})();
