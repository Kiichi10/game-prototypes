// ⑥ シールちょう — あそんで もらった シールを ならべて みる（この たんまつの なかだけ）
(function () {
  'use strict';
  const W = K.W, H = K.H, ctx = K.ctx;
  const COLS = 6, ROWS = 3, PER = COLS * ROWS;
  const CW = 160, X0 = 160, Y0 = 120;
  // どの あそびで もらったか（ふちの いろ）
  const GC = {
    'せんろチェンジレース': '#e94b4b',
    'えきいんさん ごっこ': '#3ec46d',
    'せんろ おえかき': '#ff9f1c',
    'はっしゃ メロディ': '#4b8bf5',
    'ぼくが しゃしょうさん': '#b06bff',
  };

  let all = [], page = 0, pop = null;
  function load() {
    try { all = JSON.parse(localStorage.getItem('kidtrain_stickers') || '[]'); } catch (e) { all = []; }
    all = all.slice().reverse();          // あたらしい シールが さいしょ
  }
  const pages = () => Math.max(1, Math.ceil(all.length / PER));
  function cell(i) { return { x: X0 + (i % COLS) * CW, y: Y0 + Math.floor(i / COLS) * CW }; }

  K.handlers.down = p => {
    const list = all.slice(page * PER, page * PER + PER);
    for (let i = 0; i < list.length; i++) {
      const c = cell(i);
      if (p.x > c.x && p.x < c.x + CW - 10 && p.y > c.y && p.y < c.y + CW - 10) {
        pop = { i, t: 0 };
        K.sfx.star(); K.sparkle(c.x + CW / 2 - 5, c.y + CW / 2 - 5, 14, GC[list[i].game] || '#ffd23f');
        return;
      }
    }
  };

  function drawCard(s, x, y, scale) {
    const col = GC[s.game] || '#8a94a8';
    ctx.save(); ctx.translate(x + (CW - 10) / 2, y + (CW - 10) / 2); ctx.scale(scale, scale);
    K.rr(-(CW - 10) / 2, -(CW - 10) / 2 + 6, CW - 10, CW - 10, 26, 'rgba(0,0,0,0.12)');
    K.rr(-(CW - 10) / 2, -(CW - 10) / 2, CW - 10, CW - 10, 26, '#fff', col, 6);
    ctx.font = '86px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s.s, 0, 6);
    ctx.restore();
  }

  let greeted = false;
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
      ctx.fillStyle = '#bfe7ff'; ctx.fillRect(0, 0, W, H);
      // ノートの もよう
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3;
      for (let x = 60; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 110); ctx.lineTo(x, H - 20); ctx.stroke(); }
      // だいめい
      K.rr(380, 16, 520, 86, 28, '#fff', '#ff8ad8', 6);
      K.text('シールちょう', 580, 60, 50, '#e94b4b', 'center', null);
      K.star(820, 44, 16, '#ffd23f');
      K.text(all.length + 'まい', 840, 62, 34, '#555', 'center', null);

      if (!all.length) {
        K.rr(240, 250, 800, 220, 40, '#fff', '#8a94a8', 6);
        K.text('まだ シールが ないよ', W / 2, 330, 54, '#2b3a55', 'center', null);
        K.text('あそんで シールを もらおう', W / 2, 410, 40, '#e94b4b', 'center', null);
        K.homeButton();
        return;
      }
      const list = all.slice(page * PER, page * PER + PER);
      list.forEach((s, i) => {
        const c = cell(i);
        const up = pop && pop.i === i ? 1 + Math.sin(pop.t * 12) * 0.08 : 1;
        drawCard(s, c.x, c.y, up);
      });
      if (pages() > 1) {
        K.text((page + 1) + ' / ' + pages(), W / 2, 672, 36, '#2b3a55', 'center', '#fff');
        if (page > 0) K.button(160, 638, 200, 70, 'まえ', '#8a94a8', () => { page--; K.sfx.pop(); }, { size: 32 });
        if (page < pages() - 1) K.button(920, 638, 200, 70, 'つぎ', '#3ec46d', () => { page++; K.sfx.pop(); }, { size: 32 });
      }
      K.homeButton();
    }
  };

  load();
})();
