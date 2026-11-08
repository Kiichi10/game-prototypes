// ⑥ シールちょう — あそんで もらった シールを ならべて みる（この たんまつの なかだけ）
// 3つの みかた: 「シール」ならび / 「ずかん」なんしゅるい あつめたか / 「ぺたぺた」すきな ところに はる
(function () {
  'use strict';
  const W = K.W, H = K.H, ctx = K.ctx;
  const KINDS = K.STICKERS;                 // 16しゅるい
  const COLS = 6, ROWS = 3, PER = COLS * ROWS;
  const CW = 150, X0 = 190, Y0 = 116;
  const BOARDKEY = 'kidtrain_board';
  // どの あそびで もらったか（ふちの いろ）
  const GC = {
    'せんろチェンジレース': K.C.red,
    'えきいんさん ごっこ': K.C.green,
    'せんろ おえかき': K.C.orange,
    'はっしゃ メロディ': K.C.blue,
    'ぼくが しゃしょうさん': K.C.purple,
  };

  let all = [], page = 0, pop = null, mode = 'list';
  let board = [], held = null, picked = -1, greeted = false, lastMode = '';

  function load() {
    try { all = JSON.parse(localStorage.getItem('kidtrain_stickers') || '[]'); } catch (e) { all = []; }
    all = all.slice().reverse();          // あたらしい シールが さいしょ
    try { board = JSON.parse(localStorage.getItem(BOARDKEY) || '[]'); } catch (e) { board = []; }
    if (!Array.isArray(board)) board = [];
  }
  function saveBoard() { try { localStorage.setItem(BOARDKEY, JSON.stringify(board.slice(-60))); } catch (e) {} }
  const pages = () => Math.max(1, Math.ceil(all.length / PER));
  function cell(i) { return { x: X0 + (i % COLS) * CW, y: Y0 + Math.floor(i / COLS) * CW }; }
  function haveCount(s) { return all.filter(o => o.s === s).length; }
  const kindsGot = () => KINDS.filter(s => haveCount(s) > 0).length;
  // ぺたぺたで つかえる シール（もっている しゅるいだけ）
  const trayKinds = () => KINDS.filter(s => haveCount(s) > 0);

  // ---------- さわる ----------
  const TRAY_Y = 548;
  K.handlers.down = p => {
    if (mode === 'list') {
      const list = all.slice(page * PER, page * PER + PER);
      for (let i = 0; i < list.length; i++) {
        const c = cell(i);
        if (p.x > c.x && p.x < c.x + CW - 10 && p.y > c.y && p.y < c.y + CW - 10) {
          pop = { i, t: 0 };
          K.sfx.star(); K.sparkle(c.x + CW / 2 - 5, c.y + CW / 2 - 5, 14, GC[list[i].game] || K.C.yellow);
          return;
        }
      }
      return;
    }
    if (mode === 'zukan') {
      const t = KINDS.findIndex((s, i) => { const c = zcell(i); return p.x > c.x && p.x < c.x + 140 && p.y > c.y && p.y < c.y + 140; });
      if (t >= 0) {
        K.sfx.pop();
        if (haveCount(KINDS[t])) K.sparkle(zcell(t).x + 70, zcell(t).y + 70, 12, K.C.yellow);
      }
      return;
    }
    // ぺたぺた
    if (p.y > TRAY_Y) {                       // したの たなから えらぶ
      const ks = trayKinds(), w = Math.min(120, (W - 120) / Math.max(1, ks.length));
      const i = Math.floor((p.x - 60) / w);
      if (i >= 0 && i < ks.length) { picked = i; K.sfx.pop(); }
      return;
    }
    for (let i = board.length - 1; i >= 0; i--) {   // はってある シールを つかむ
      const b = board[i];
      if (Math.abs(p.x - b.x) < 52 && Math.abs(p.y - b.y) < 52) {
        held = { i, dx: b.x - p.x, dy: b.y - p.y }; K.sfx.pop();
        board.push(board.splice(i, 1)[0]); held.i = board.length - 1;
        return;
      }
    }
    const ks = trayKinds();
    if (picked >= 0 && picked < ks.length) {        // あたらしく はる
      board.push({ s: ks[picked], x: p.x, y: p.y });
      held = { i: board.length - 1, dx: 0, dy: 0 };
      K.sfx.star(); K.sparkle(p.x, p.y, 14, K.C.yellow);
    }
  };
  K.handlers.move = p => {
    if (mode !== 'board' || !held) return;
    const b = board[held.i];
    b.x = Math.max(40, Math.min(W - 40, p.x + held.dx));
    b.y = Math.max(120, Math.min(H - 20, p.y + held.dy));
  };
  K.handlers.up = () => {
    if (mode !== 'board' || !held) return;
    const b = board[held.i];
    if (b.y > TRAY_Y) { board.splice(held.i, 1); K.sfx.oops(); }   // たなに もどすと はがせる
    held = null; saveBoard();
  };

  // ---------- えがく ----------
  function drawCard(s, x, y, scale, col, size) {
    ctx.save(); ctx.translate(x + (CW - 10) / 2, y + (CW - 10) / 2); ctx.scale(scale, scale);
    K.rr(-(CW - 10) / 2, -(CW - 10) / 2 + 6, CW - 10, CW - 10, 26, 'rgba(0,0,0,0.12)');
    K.rr(-(CW - 10) / 2, -(CW - 10) / 2, CW - 10, CW - 10, 26, '#fff', col, 6);
    K.drawSticker(s, 0, 2, (size || 78) * 0.62);
    ctx.restore();
  }
  function zcell(i) { return { x: 48 + (i % 8) * 148, y: 196 + Math.floor(i / 8) * 164 }; }
  function emoji(s, x, y, size) { K.drawSticker(s, x, y, size * 0.62); }
  function tabs() {
    const names = [['list', 'シール', K.C.pink], ['zukan', 'ずかん', K.C.blue], ['board', 'ぺたぺた', K.C.green]];
    names.forEach(([m, label, col], i) => {
      const x = 320 + i * 250, on = mode === m;
      if (on) K.rr(x - 6, 10, 236, 88, 30, null, K.C.yellow, 6);
      K.button(x, 16, 224, 76, label, on ? col : '#aab4c4', () => setMode(m), { size: 36 });
    });
  }
  function setMode(m) {
    if (mode === m) return;
    mode = m; picked = -1; held = null; K.sfx.pop();
    if (m === 'board') K.say('したの シールを えらんで、すきな ところに はってね');
    else if (m === 'zukan') K.say('まだ ない シールは はてなマーク だよ');
  }

  function drawList(t) {
    if (!all.length) {
      K.rr(240, 260, 800, 200, 40, '#fff', K.C.sub, 6);
      K.text('まだ シールが ないよ', W / 2, 330, 54, K.C.ink, 'center', null);
      K.text('あそんで シールを もらおう', W / 2, 408, 40, K.C.red, 'center', null);
      return;
    }
    const list = all.slice(page * PER, page * PER + PER);
    list.forEach((s, i) => {
      const c = cell(i);
      const up = pop && pop.i === i ? 1 + Math.sin(pop.t * 12) * 0.08 : 1;
      drawCard(s.s, c.x, c.y, up, GC[s.game] || K.C.sub);
    });
    K.star(560, 676, 18, K.C.yellow);
    K.text(all.length + 'まい', 640, 678, 34, K.C.ink, 'center', '#fff');
    if (pages() > 1) {
      K.text((page + 1) + ' / ' + pages(), 800, 678, 30, K.C.ink, 'center', '#fff');
      if (page > 0) K.button(60, 644, 180, 68, 'まえ', K.C.sub, () => { page--; K.sfx.pop(); }, { size: 32 });
      if (page < pages() - 1) K.button(1040, 644, 180, 68, 'つぎ', K.C.green, () => { page++; K.sfx.pop(); }, { size: 32 });
    }
  }
  function drawZukan(t) {
    const got = kindsGot();
    K.rr(360, 112, 560, 66, 26, '#fff', K.C.blue, 5);
    K.text(got + ' / ' + KINDS.length + ' しゅるい あつめた', 640, 146, 36, K.C.blue, 'center', null);
    KINDS.forEach((s, i) => {
      const c = zcell(i), n = haveCount(s);
      K.rr(c.x, c.y + 6, 140, 140, 24, 'rgba(0,0,0,0.1)');
      K.rr(c.x, c.y, 140, 140, 24, n ? '#fff' : '#e7ebf2', n ? K.C.yellow : '#c6ccd8', n ? 6 : 4);
      if (n) {
        emoji(s, c.x + 70, c.y + 66, 74);
        if (n > 1) { K.circle(c.x + 118, c.y + 26, 22, K.C.pink, '#fff', 3); K.text('' + n, c.x + 118, c.y + 28, 26, '#fff', 'center', null); }
      } else {
        K.text('?', c.x + 70, c.y + 70, 72, '#b9c2d0', 'center', null);
      }
    });
    K.text('あそぶと あたらしい シールが もらえるよ', 640, 540, 32, K.C.ink, 'center', '#fff');
  }
  function drawBoard(t) {
    // だいし
    K.rr(24, 108, W - 48, TRAY_Y - 124, 16, '#f7f4ea', '#cdc3ad', 3);
    ctx.save(); ctx.globalAlpha = 0.5;
    for (let x = 60; x < W - 60; x += 56) for (let y = 150; y < TRAY_Y - 40; y += 56) K.circle(x, y, 3, '#e6dcc2');
    ctx.restore();
    if (!board.length && picked < 0) K.text('したの シールを えらんでね', W / 2, 330, 40, '#b0a88f', 'center', null);
    board.forEach((b, i) => {
      const hold = held && held.i === i;
      ctx.save();
      if (hold) { ctx.globalAlpha = 0.9; ctx.translate(0, -6); }
      emoji(b.s, b.x, b.y, hold ? 92 : 80);
      ctx.restore();
    });
    // したの たな
    K.rr(0, TRAY_Y, W, H - TRAY_Y, 0, 'rgba(255,255,255,0.9)');
    ctx.fillStyle = '#e3d8bd'; ctx.fillRect(0, TRAY_Y, W, 5);
    const ks = trayKinds();
    if (!ks.length) { K.text('あそぶと シールが もらえるよ', W / 2, 630, 36, K.C.sub, 'center', null); return; }
    const w = Math.min(120, (W - 120) / ks.length);
    ks.forEach((s, i) => {
      const x = 60 + i * w + w / 2, on = picked === i;
      if (on) K.rr(x - w / 2 + 4, TRAY_Y + 14, w - 8, 128, 20, '#fff7c7', K.C.yellow, 5);
      emoji(s, x, TRAY_Y + 72, on ? 72 : 62);
      K.text('' + haveCount(s), x, TRAY_Y + 116, 24, K.C.sub, 'center', null);
    });
    K.text(picked >= 0 ? 'がめんを タッチすると はれるよ' : 'シールを えらんでね', W / 2, TRAY_Y + 150, 28, K.C.sub, 'center', '#fff');
  }

  K.scene = {
    update(dt) {
      // おとが だせるように なったら（はじめて さわった とき）よみあげる
      if (!greeted && K.ac) {
        greeted = true;
        K.say(all.length ? 'シールちょう だよ。さわると ぴかぴか するよ' : 'まだ シールが ないよ。あそんで シールを もらおう');
      }
      if (pop) { pop.t += dt; if (pop.t > 0.6) pop = null; }
    },
    draw(t) {
      ctx.fillStyle = '#a9c8dd'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3;
      for (let x = 60; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 104); ctx.lineTo(x, H - 10); ctx.stroke(); }
      if (mode === 'list') drawList(t);
      else if (mode === 'zukan') drawZukan(t);
      else drawBoard(t);
      tabs();
      K.homeButton();
    }
  };

  load();
})();
