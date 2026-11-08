// 子ども向け電車ゲーム 共通部品（5本で共用）
// 画面は 1280x720 の仮想座標。タッチ優先・ひらがな表示＋読み上げ・失敗で責めない。
(function () {
  'use strict';
  const W = 1280, H = 720;
  const K = {};
  window.K = K;
  K.W = W; K.H = H;
  K.FONT = '"Hiragino Maru Gothic ProN","Hiragino Sans","Rounded Mplus 1c","Noto Sans JP",sans-serif';

  // ---------- 画面 ----------
  const cv = document.createElement('canvas');
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  K.ctx = ctx;
  let scale = 1, ox = 0, oy = 0, dpr = 1;
  K.bg = '#a9c8dd';
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const sw = window.innerWidth, sh = window.innerHeight;
    cv.width = sw * dpr; cv.height = sh * dpr;
    cv.style.width = sw + 'px'; cv.style.height = sh + 'px';
    scale = Math.min(sw / W, sh / H);
    ox = (sw - W * scale) / 2; oy = (sh - H * scale) / 2;
  }
  window.addEventListener('resize', resize); resize();
  document.body.style.cssText = 'margin:0;overflow:hidden;background:#141b2b;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none';

  // ---------- いろ（6さい向けだが、あかるすぎない おちついた いろ） ----------
  K.C = {
    ink: '#1d2a44', sub: '#5a6880', line: '#2b3a55',
    panel: '#f2f5f9', panelEdge: '#c3cedd',
    red: '#c9453a', blue: '#2f6fa8', green: '#3f8f66', yellow: '#d79a26',
    orange: '#c96a28', purple: '#6b5bb5', pink: '#c86a8e',
    sky1: '#5e8cb5', sky2: '#a9c8dd', grass: '#7aa55f', dark: '#243246',
  };

  // ---------- 入力（仮想座標に変換して渡す） ----------
  K.handlers = {};
  K.pointer = { x: 0, y: 0, down: false };
  function toV(e) { return { x: (e.clientX - ox) / scale, y: (e.clientY - oy) / scale, id: e.pointerId }; }
  cv.addEventListener('pointerdown', e => { e.preventDefault(); K.unlock(); const p = toV(e); K.pointer = { ...p, down: true }; tapButtons(p) || (K.handlers.down && K.handlers.down(p)); });
  cv.addEventListener('pointermove', e => { const p = toV(e); K.pointer.x = p.x; K.pointer.y = p.y; K.handlers.move && K.handlers.move(p); });
  window.addEventListener('pointerup', e => { const p = toV(e); K.pointer.down = false; K.handlers.up && K.handlers.up(p); });
  window.addEventListener('pointercancel', e => { K.pointer.down = false; K.handlers.up && K.handlers.up(toV(e)); });

  // その場で描いて、押されたら反応するボタン（毎フレーム登録し直す）
  let buttons = [], nextButtons = [];
  K.button = function (x, y, w, h, label, color, onTap, opt = {}) {
    nextButtons.push({ x, y, w, h, onTap });
    const pressed = K.pointer.down && K.pointer.x > x && K.pointer.x < x + w && K.pointer.y > y && K.pointer.y < y + h;
    const dy = pressed ? 3 : 0, r = Math.min(opt.r || 16, h / 2);
    K.rr(x, y + 5, w, h, r, shade(color, -0.45));
    K.rr(x, y + dy, w, h, r, color, shade(color, -0.3), 2);
    K.rr(x + 6, y + dy + 4, w - 12, h * 0.3, Math.max(6, r - 6), 'rgba(255,255,255,0.16)');
    K.text(label, x + w / 2, y + h / 2 + dy + 2, opt.size || Math.min(40, h * 0.4), opt.textColor || '#fff', 'center', null);
  };
  function tapButtons(p) {
    for (let i = buttons.length - 1; i >= 0; i--) {
      const b = buttons[i];
      if (p.x > b.x - 10 && p.x < b.x + b.w + 10 && p.y > b.y - 10 && p.y < b.y + b.h + 10) { K.sfx.pop(); b.onTap(p); return true; }
    }
    return false;
  }

  // ---------- 描画の基本 ----------
  K.rr = function (x, y, w, h, r, fill, stroke, lw) {
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 4; ctx.stroke(); }
  };
  K.circle = function (x, y, r, fill, stroke, lw) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 4; ctx.stroke(); }
  };
  // outline は「よみやすさの ための ふち」。おちついた 見た目に するため ほそめ。
  K.text = function (s, x, y, size, color, align, outline) {
    ctx.font = `bold ${size}px ${K.FONT}`;
    ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    if (outline !== null) { ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.15; ctx.strokeStyle = outline || 'rgba(255,255,255,0.8)'; ctx.strokeText(s, x, y); }
    ctx.fillStyle = color || K.C.ink; ctx.fillText(s, x, y);
  };
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
    return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }
  K.shade = shade;

  // ---------- 電車の絵（おもちゃ風・オリジナル。実在の会社の色やロゴは使わない） ----------
  // 横から見た電車。kind: 'local'（ふつう）/ 'bullet'（はやい）/ 'steam'（きかんしゃ）
  // 横から見た電車。屋根・クーラー・パンタグラフ・方向幕・前照灯・台車まで描く（模型寄り）
  // o.dest に行き先を書くと 方向幕に 出る。o.plain:true で かんたんな絵（とおくの電車など）
  K.trainSide = function (x, y, o = {}) {
    const s = o.scale || 1, color = o.color || '#c9453a', stripe = o.stripe || '#e8c04a', cars = o.cars || 2, kind = o.kind || 'local';
    const carW = 230 * s, carH = 110 * s, gap = 10 * s;
    const dk = shade(color, -0.42), lt = shade(color, 0.18);
    ctx.save(); ctx.translate(x, y);
    if (o.flip) ctx.scale(-1, 1);
    const bob = o.bob || 0;
    for (let i = cars - 1; i >= 0; i--) {
      const cx = -i * (carW + gap);
      const head = i === 0;
      const bx = cx - carW, by = -carH;
      // --- 台車（ボギー）---
      for (const tx of [0.26, 0.74]) {
        const px = bx + carW * tx;
        K.rr(px - 34 * s, -carH * 0.1, 68 * s, 22 * s, 6 * s, '#39404e');
        for (const wx of [-19, 19]) {
          K.circle(px + wx * s, carH * 0.03, 16 * s, '#2f353f', '#1d222a', 2 * s);
          K.circle(px + wx * s, carH * 0.03, 8 * s, '#8d96a8');
          K.circle(px + wx * s, carH * 0.03, 3 * s, '#5a6272');
        }
      }
      // レールに のる 足まわりの かげ
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(bx + 10 * s, carH * 0.14, carW - 20 * s, 5 * s);
      ctx.save(); ctx.translate(0, bob * (i % 2 ? -1 : 1));
      if (head && kind === 'bullet') {
        ctx.beginPath();
        ctx.moveTo(bx, by + 16 * s); ctx.lineTo(bx + carW * 0.5, by + 4 * s);
        ctx.quadraticCurveTo(bx + carW * 1.22, by + carH * 0.26, bx + carW + 26 * s, by + carH * 0.98);
        ctx.lineTo(bx, by + carH * 0.98); ctx.closePath();
        ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = dk; ctx.lineWidth = 3 * s; ctx.stroke();
        // 帯（2本）
        ctx.fillStyle = stripe; ctx.fillRect(bx, by + carH * 0.58, carW * 1.04, carH * 0.1);
        ctx.fillStyle = shade(stripe, -0.25); ctx.fillRect(bx, by + carH * 0.70, carW * 1.02, carH * 0.03);
        // うんてんしつ の まど
        ctx.save();
        ctx.beginPath(); ctx.moveTo(bx + carW * 0.64, by + carH * 0.16); ctx.lineTo(bx + carW * 0.93, by + carH * 0.3);
        ctx.lineTo(bx + carW * 0.93, by + carH * 0.46); ctx.lineTo(bx + carW * 0.64, by + carH * 0.42); ctx.closePath();
        ctx.fillStyle = '#243246'; ctx.fill(); ctx.restore();
        drawWindows(bx, by, carW, carH, s, 2, 0.1, 0.2);
        K.circle(bx + carW * 1.0, by + carH * 0.82, 7 * s, '#fff3c4', '#b9a74e', 1.5 * s);
      } else if (head && kind === 'steam') {
        // ボイラー
        K.rr(bx + carW * 0.26, by + carH * 0.26, carW * 0.74, carH * 0.6, 14 * s, '#363c47', '#22262e', 3 * s);
        K.rr(bx + carW * 0.26, by + carH * 0.36, carW * 0.74, carH * 0.06, 3 * s, '#4c535f');
        // うんてんしつ
        K.rr(bx, by, carW * 0.34, carH * 0.86, 8 * s, color, dk, 3 * s);
        K.rr(bx + carW * 0.05, by + carH * 0.14, carW * 0.22, carH * 0.28, 5 * s, '#9fc3dc', '#44505f', 2 * s);
        // えんとつ と ドーム
        K.rr(bx + carW * 0.82, by - carH * 0.16, carW * 0.13, carH * 0.44, 4 * s, '#2b3038');
        K.rr(bx + carW * 0.80, by - carH * 0.2, carW * 0.17, carH * 0.08, 4 * s, '#2b3038');
        K.circle(bx + carW * 0.58, by + carH * 0.2, 10 * s, '#4c535f');
        K.circle(bx + carW * 0.99, by + carH * 0.6, 9 * s, '#fff3c4', '#b9a74e', 1.5 * s);
        ctx.fillStyle = stripe; ctx.fillRect(bx + carW * 0.26, by + carH * 0.82, carW * 0.74, carH * 0.05);
      } else {
        // --- ふつうの しゃりょう ---
        K.rr(bx, by + carH * 0.06, carW, carH * 0.92, 10 * s, color, dk, 3 * s);
        // やね
        K.rr(bx + 3 * s, by, carW - 6 * s, carH * 0.14, 7 * s, '#6f7889', '#555d6c', 2 * s);
        // クーラーキセ
        for (const rx of [0.22, 0.52, 0.78]) K.rr(bx + carW * rx - 18 * s, by - 5 * s, 36 * s, 12 * s, 3 * s, '#8a93a4', '#6b7384', 1.5 * s);
        // パンタグラフ（2両に1つ）
        if (!o.plain && kind === 'local' && i % 2 === 1) drawPanto(bx + carW * 0.3, by - 4 * s, s);
        // 帯（こしの ライン）
        ctx.fillStyle = stripe; ctx.fillRect(bx + 3 * s, by + carH * 0.58, carW - 6 * s, carH * 0.1);
        ctx.fillStyle = shade(color, -0.15); ctx.fillRect(bx + 3 * s, by + carH * 0.86, carW - 6 * s, carH * 0.04);
        drawWindows(bx, by, carW, carH, s, head ? 3 : 4, head ? 0.08 : 0.07, 0.215);
        if (head) {
          // 方向幕 と 前照灯
          K.rr(bx + carW * 0.74, by + carH * 0.2, carW * 0.2, carH * 0.17, 3 * s, '#eef2f7', '#5b6b85', 2 * s);
          if (o.dest) K.text(o.dest, bx + carW * 0.84, by + carH * 0.29, Math.max(9, 13 * s), '#2b3a55', 'center', null);
          K.rr(bx + carW * 0.72, by + carH * 0.42, carW * 0.24, carH * 0.2, 4 * s, '#243246');
          K.circle(bx + carW * 0.79, by + carH * 0.8, 7 * s, '#fff3c4', '#b9a74e', 1.5 * s);
          K.circle(bx + carW * 0.92, by + carH * 0.8, 7 * s, '#fff3c4', '#b9a74e', 1.5 * s);
          ctx.fillStyle = '#39404e'; ctx.fillRect(bx + carW * 0.97, by + carH * 0.66, carW * 0.06, carH * 0.1);
        }
      }
      ctx.restore();
      // 連結部（ほろ）
      if (i < cars - 1) {
        const jx = cx - gap - 2 * s;
        K.rr(jx - 2 * s, -carH * 0.84, gap + 8 * s, carH * 0.62, 3 * s, '#4a5262');
        ctx.strokeStyle = '#39404e'; ctx.lineWidth = 1.5 * s;
        for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.moveTo(jx + q * 5 * s, -carH * 0.84); ctx.lineTo(jx + q * 5 * s, -carH * 0.22); ctx.stroke(); }
      }
    }
    ctx.restore();
    return cars * (carW + gap);
  };
  function drawWindows(bx, by, carW, carH, s, n, x0, step) {
    for (let k = 0; k < n; k++) {
      const wx = bx + carW * (x0 + k * step);
      K.rr(wx, by + carH * 0.2, carW * 0.16, carH * 0.3, 4 * s, '#9fc3dc', '#44505f', 2 * s);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(wx + carW * 0.01, by + carH * 0.22, carW * 0.14, carH * 0.07);
      ctx.fillStyle = '#44505f'; ctx.fillRect(wx + carW * 0.077, by + carH * 0.2, 1.5 * s, carH * 0.3);
    }
  }
  function drawPanto(x, y, s) {
    ctx.strokeStyle = '#5b6372'; ctx.lineWidth = 2.5 * s; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 16 * s, y); ctx.lineTo(x - 2 * s, y - 16 * s);
    ctx.lineTo(x + 18 * s, y - 6 * s); ctx.lineTo(x + 34 * s, y - 18 * s);
    ctx.stroke();
    ctx.fillStyle = '#4a5262'; ctx.fillRect(x - 10 * s, y - 20 * s, 48 * s, 3 * s);
    ctx.lineCap = 'butt';
  }

  // 上から見た電車。x,y は先頭の中心。angle はラジアン（0 で右向き）
  K.trainTop = function (x, y, angle, o = {}) {
    const s = o.scale || 1, color = o.color || '#c9453a', stripe = o.stripe || '#e8c04a';
    const L = 86 * s, Wd = 46 * s;
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; K.rr(-L + 5, -Wd / 2 + 7, L, Wd, 12 * s, 'rgba(0,0,0,0.16)');
    ctx.beginPath(); ctx.moveTo(-L, -Wd / 2); ctx.lineTo(-L * 0.22, -Wd / 2); ctx.quadraticCurveTo(L * 0.06, -Wd / 2, L * 0.06, 0); ctx.quadraticCurveTo(L * 0.06, Wd / 2, -L * 0.22, Wd / 2); ctx.lineTo(-L, Wd / 2); ctx.closePath();
    ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = shade(color, -0.42); ctx.lineWidth = 3 * s; ctx.stroke();
    // やねの まんなかの みち と クーラー
    ctx.fillStyle = shade(color, -0.2); ctx.fillRect(-L + 6 * s, -Wd * 0.3, L * 0.78, Wd * 0.6);
    for (const rx of [0.18, 0.46, 0.72]) K.rr(-L + L * rx * 1.05, -Wd * 0.2, 14 * s, Wd * 0.4, 3 * s, '#8a93a4');
    ctx.fillStyle = stripe; ctx.fillRect(-L + 5 * s, -3 * s, L * 0.82, 6 * s);
    // パンタグラフ
    ctx.strokeStyle = '#5b6372'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(-L * 0.62, -Wd * 0.3); ctx.lineTo(-L * 0.52, Wd * 0.3); ctx.stroke();
    // うんてんしつ の まど
    K.rr(-L * 0.24, -Wd * 0.3, L * 0.2, Wd * 0.6, 5 * s, '#243246');
    ctx.restore();
  };

  // 乗客（まるい子ども向けキャラ）。color で行き先の色を表す
  // 乗客（にこにこ顔は ひかえめ。かたち と もちもので 見わける）
  // o.bag / o.scarf / o.hat / o.long(コート) で ちがいを つける
  K.person = function (x, y, o = {}) {
    const s = o.scale || 1, color = o.color || '#2f6fa8', skin = o.skin || '#e8c49f';
    const hop = o.hop || 0;
    ctx.save(); ctx.translate(x, y - hop);
    // かげ
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(0, 2 * s, 20 * s, 5 * s, 0, 0, 7); ctx.fill();
    // からだ（かたが ある ふく）
    const bh = o.long ? 56 : 48;
    ctx.beginPath();
    ctx.moveTo(-15 * s, -bh * s); ctx.quadraticCurveTo(-21 * s, -bh * s, -21 * s, -(bh - 12) * s);
    ctx.lineTo(-19 * s, 0); ctx.lineTo(19 * s, 0); ctx.lineTo(21 * s, -(bh - 12) * s);
    ctx.quadraticCurveTo(21 * s, -bh * s, 15 * s, -bh * s); ctx.closePath();
    ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = shade(color, -0.35); ctx.lineWidth = 2 * s; ctx.stroke();
    if (o.scarf) { K.rr(-15 * s, -(bh + 4) * s, 30 * s, 9 * s, 4 * s, o.scarf); }
    // くび と かお
    ctx.fillStyle = skin; ctx.fillRect(-5 * s, -(bh + 6) * s, 10 * s, 8 * s);
    K.circle(0, -(bh + 22) * s, 18 * s, skin, shade(skin, -0.35), 2 * s);
    ctx.fillStyle = o.hair || '#4a3524';
    ctx.beginPath(); ctx.arc(0, -(bh + 25) * s, 18 * s, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
    ctx.fillRect(-18 * s, -(bh + 26) * s, 36 * s, 6 * s);
    // め（ちいさめ・くちは かかない）
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(-7 * s, -(bh + 22) * s, 3 * s, 3.5 * s);
    ctx.fillRect(4 * s, -(bh + 22) * s, 3 * s, 3.5 * s);
    if (o.hat) {
      K.rr(-17 * s, -(bh + 44) * s, 34 * s, 14 * s, 4 * s, o.hat, shade(o.hat, -0.3), 1.5 * s);
      K.rr(-22 * s, -(bh + 32) * s, 44 * s, 6 * s, 3 * s, shade(o.hat, -0.25));
    }
    if (o.bag) {
      K.rr(16 * s, -(bh - 14) * s, 18 * s, 16 * s, 3 * s, o.bag, shade(o.bag, -0.35), 1.5 * s);
      ctx.strokeStyle = shade(o.bag, -0.35); ctx.lineWidth = 2 * s;
      ctx.beginPath(); ctx.arc(25 * s, -(bh - 14) * s, 6 * s, Math.PI, 0); ctx.stroke();
    }
    ctx.restore();
  };

  // ---------- 計器パネル風の 部品（運転台っぽい 見た目） ----------
  // わく（くろ基調のパネル）
  K.panel = function (x, y, w, h, label) {
    K.rr(x, y + 4, w, h, 12, 'rgba(0,0,0,0.25)');
    K.rr(x, y, w, h, 12, '#273144', '#3d4a63', 2);
    K.rr(x + 3, y + 3, w - 6, h * 0.34, 9, 'rgba(255,255,255,0.05)');
    if (label) K.text(label, x + 12, y + 15, 16, '#8fa3c0', 'left', null);
  };
  // LED風の 文字ひょうじ
  K.lcd = function (x, y, w, h, text, color, size) {
    K.rr(x, y, w, h, 6, '#121a28', '#3d4a63', 2);
    // ながい 文は はみ出さないように すこし ちぢめる（きりすてない）
    let s = size || h * 0.6;
    ctx.font = `bold ${s}px ${K.FONT}`;
    const tw = ctx.measureText(String(text)).width;
    if (tw > w - 16) s = Math.max(14, s * (w - 16) / tw);
    ctx.save(); ctx.globalAlpha = 0.25;
    K.text(text, x + w / 2, y + h / 2 + 1, s, color || '#ffb454', 'center', null);
    ctx.restore();
    K.text(text, x + w / 2, y + h / 2, s, color || '#ffb454', 'center', null);
  };
  // メーター（0〜1）
  K.gauge = function (x, y, r, v, label, color) {
    K.circle(x, y, r, '#1b2334', '#3d4a63', 3);
    K.circle(x, y, r * 0.9, null, 'rgba(255,255,255,0.06)', 2);
    const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
    ctx.strokeStyle = '#3d4a63'; ctx.lineWidth = r * 0.12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r * 0.72, a0, a1); ctx.stroke();
    ctx.strokeStyle = color || '#ffb454';
    ctx.beginPath(); ctx.arc(x, y, r * 0.72, a0, a0 + (a1 - a0) * Math.max(0, Math.min(1, v))); ctx.stroke();
    ctx.lineCap = 'butt';
    const a = a0 + (a1 - a0) * Math.max(0, Math.min(1, v));
    ctx.strokeStyle = '#e6ecf5'; ctx.lineWidth = r * 0.08;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6); ctx.stroke();
    K.circle(x, y, r * 0.14, '#8fa3c0');
    if (label) K.text(label, x, y + r * 0.46, r * 0.3, '#8fa3c0', 'center', null);
  };

  // ---------- 音（すべてプログラムで合成） ----------
  let ac = null, master = null;
  K.unlock = function () {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC(); master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
      K.ac = ac; K.master = master;
    }
    if (ac.state === 'suspended') ac.resume();
    if (K.preloadVoices) K.preloadVoices();
    if (!K._spoke && window.speechSynthesis) { K._spoke = true; const u = new SpeechSynthesisUtterance(''); speechSynthesis.speak(u); }
  };
  function tone(f, t0, dur, type, vol, f2) {
    if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, ac.currentTime + t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, ac.currentTime + t0 + dur);
    g.gain.setValueAtTime(0, ac.currentTime + t0);
    g.gain.linearRampToValueAtTime(vol || 0.2, ac.currentTime + t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t0 + dur);
    o.connect(g); g.connect(master); o.start(ac.currentTime + t0); o.stop(ac.currentTime + t0 + dur + 0.05);
  }
  function noise(t0, dur, vol, freq) {
    if (!ac) return;
    const len = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource(); src.buffer = buf;
    const flt = ac.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = freq || 1200;
    const g = ac.createGain(); g.gain.value = vol || 0.3;
    src.connect(flt); flt.connect(g); g.connect(master); src.start(ac.currentTime + t0);
  }
  K.tone = tone; K.noise = noise;
  // 鉄琴っぽい音（メロディ用）
  K.bell = function (f, t0 = 0, dur = 0.6, vol = 0.22) { tone(f, t0, dur, 'sine', vol); tone(f * 2, t0, dur * 0.5, 'sine', vol * 0.35); tone(f * 3.01, t0, dur * 0.25, 'triangle', vol * 0.12); };
  K.note = n => 440 * Math.pow(2, (n - 69) / 12);
  K.sfx = {
    pop: () => tone(880, 0, 0.08, 'sine', 0.2, 1320),
    star: () => { tone(1047, 0, 0.1, 'square', 0.1); tone(1568, 0.07, 0.18, 'square', 0.1); },
    good: () => { K.bell(K.note(76), 0, 0.3); K.bell(K.note(79), 0.1, 0.3); K.bell(K.note(84), 0.2, 0.5); },
    oops: () => tone(330, 0, 0.25, 'triangle', 0.2, 220),
    fanfare: () => [72, 76, 79, 84, 79, 84].forEach((n, i) => K.bell(K.note(n), i * 0.13, i === 5 ? 0.9 : 0.25, 0.25)),
    whistle: () => { tone(2300, 0, 0.18, 'sine', 0.15); tone(2300, 0.22, 0.5, 'sine', 0.15); noise(0, 0.7, 0.05, 2400); },
    horn: () => { tone(330, 0, 0.6, 'sawtooth', 0.08); tone(415, 0, 0.6, 'sawtooth', 0.06); },
    dingdong: () => { K.bell(K.note(76), 0, 0.7, 0.25); K.bell(K.note(72), 0.45, 0.9, 0.25); },
    door: () => { noise(0, 0.5, 0.25, 600); tone(1200, 0, 0.12, 'square', 0.06); tone(1200, 0.18, 0.12, 'square', 0.06); },
    clack: () => { noise(0, 0.06, 0.25, 500); noise(0.13, 0.06, 0.2, 450); },
  };
  // ガタンゴトン（走行中ずっと）
  let runT = 0;
  K.runSound = function (dt, speed) { if (speed <= 0) return; runT -= dt * speed; if (runT <= 0) { runT = 1; K.sfx.clack(); } };

  // ---------- 読み上げ（字が読めなくても遊べるように） ----------
  let jaVoice = null;
  function pickVoice() {
    const vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    jaVoice = vs.find(v => v.lang === 'ja-JP' && /Kyoko|O-ren|Google/.test(v.name)) || vs.find(v => v.lang && v.lang.startsWith('ja')) || null;
  }
  if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  // Irodori で事前に作った声（common/voice/）があればそれを流す。無い文はブラウザの声で読む
  const voiceBase = (document.currentScript && document.currentScript.src || '').replace(/common\.js.*$/, '') + 'voice/';
  (function () { const s = document.createElement('script'); s.src = voiceBase + 'manifest.js'; s.onerror = () => {}; document.head.appendChild(s); })();
  const vbuf = {}; let vsrc = null, vtoken = 0;
  function loadVoice(file) {
    if (!vbuf[file]) vbuf[file] = fetch(voiceBase + file).then(r => r.arrayBuffer()).then(b => new Promise((ok, ng) => { const pr = ac.decodeAudioData(b, ok, ng); if (pr && pr.catch) pr.catch(() => {}); })).catch(() => { delete vbuf[file]; return null; });
    return vbuf[file];
  }
  K.preloadVoices = function () {
    if (!ac || !window.K_VOICE || K._preloaded) return;
    K._preloaded = true;
    const files = Object.values(window.K_VOICE); let i = 0;
    const next = () => { if (i < files.length) loadVoice(files[i++]).then(next); };
    next(); next(); next();
  };
  K.say = function (text, rate = 1.0) {
    const file = window.K_VOICE && window.K_VOICE[String(text).trim()];
    if (file && ac) {
      const my = ++vtoken;
      if (vsrc) { try { vsrc.stop(); } catch (e) {} vsrc = null; }
      if (window.speechSynthesis) speechSynthesis.cancel();
      K.preloadVoices();
      loadVoice(file).then(buf => {
        if (my !== vtoken) return;
        if (!buf) return sayBrowser(text, rate);
        const src = ac.createBufferSource(), g = ac.createGain();
        g.gain.value = 1.6; src.buffer = buf; src.connect(g); g.connect(master); src.start(); vsrc = src;
      });
      return;
    }
    sayBrowser(text, rate);
  };
  function sayBrowser(text, rate) {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP'; u.rate = rate; u.pitch = 1.1; if (jaVoice) u.voice = jaVoice;
    speechSynthesis.speak(u);
  };

  // ---------- 紙ふぶき・きらきら ----------
  const parts = [];
  K.confetti = function (n = 80) {
    const cols = ['#ff5a5a', '#ffd23f', '#3ec46d', '#4b8bf5', '#b06bff', '#ff8ad8'];
    for (let i = 0; i < n; i++) parts.push({ x: Math.random() * W, y: -20 - Math.random() * 200, vx: (Math.random() - 0.5) * 120, vy: 120 + Math.random() * 160, r: Math.random() * 6, c: cols[i % cols.length], life: 4, kind: 'c' });
  };
  K.sparkle = function (x, y, n = 14, color = '#ffd23f') {
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, sp = 120 + Math.random() * 220; parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 0, c: color, life: 0.7, kind: 's' }); }
  };
  function drawParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 6;
      if (p.kind === 'c') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-8, -5, 16, 10); ctx.restore(); }
      else { p.vx *= 0.92; p.vy *= 0.92; K.star(p.x, p.y, 10 * Math.min(1, p.life * 2), p.c); }
    }
  }
  K.star = function (x, y, r, color) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; ctx.stroke();
  };

  // ---------- シール（絵文字ではなく じぶんで えがく＝おちついた 見た目） ----------
  // 記録は これまでどおり 絵文字キーで のこす（まえの シールも そのまま 出る）
  K.drawSticker = function (key, x, y, r) {
    const C = K.C;
    ctx.save(); ctx.translate(x, y); ctx.scale(r / 50, r / 50);
    K.circle(0, 0, 46, '#ffffff', '#d8cfbc', 3);
    K.circle(0, 0, 40, null, 'rgba(0,0,0,0.05)', 2);
    const F = {
      '🚃': () => { K.rr(-30, -20, 60, 40, 8, C.green, shade(C.green, -0.4), 3); K.rr(-24, -13, 14, 13, 3, '#9fc3dc'); K.rr(-6, -13, 14, 13, 3, '#9fc3dc'); K.rr(12, -13, 14, 13, 3, '#9fc3dc'); ctx.fillStyle = '#e8c04a'; ctx.fillRect(-30, 6, 60, 6); K.circle(-16, 22, 7, '#39404e'); K.circle(16, 22, 7, '#39404e'); },
      '🚄': () => { ctx.beginPath(); ctx.moveTo(-32, -16); ctx.lineTo(8, -20); ctx.quadraticCurveTo(34, -10, 34, 16); ctx.lineTo(-32, 16); ctx.closePath(); ctx.fillStyle = C.blue; ctx.fill(); ctx.strokeStyle = shade(C.blue, -0.4); ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#eef2f7'; ctx.fillRect(-32, 2, 64, 6); K.rr(4, -12, 18, 12, 4, '#243246'); K.circle(-14, 22, 6, '#39404e'); K.circle(18, 22, 6, '#39404e'); },
      '🚂': () => { K.rr(-6, -10, 36, 26, 6, '#3a4150', '#22262e', 3); K.rr(-32, -22, 24, 38, 5, C.red, shade(C.red, -0.4), 3); K.rr(22, -30, 10, 22, 3, '#2b3038'); K.circle(-22, 22, 8, '#39404e'); K.circle(6, 24, 6, '#39404e'); K.circle(22, 24, 6, '#39404e'); },
      '🚉': () => { ctx.fillStyle = C.red; ctx.beginPath(); ctx.moveTo(-36, -8); ctx.lineTo(0, -28); ctx.lineTo(36, -8); ctx.closePath(); ctx.fill(); K.rr(-28, -8, 56, 32, 4, '#e3d9c6', '#b7ac97', 2); K.rr(-10, 4, 20, 20, 3, C.blue); ctx.fillStyle = '#b7ac97'; ctx.fillRect(-28, 24, 56, 5); },
      '🚦': () => { K.rr(-15, -34, 30, 62, 8, '#2b3038', '#1a1d23', 3); K.circle(0, -20, 8, C.red); K.circle(0, -2, 8, C.yellow); K.circle(0, 16, 8, C.green); },
      '🌈': () => { const cs = [C.red, C.orange, C.yellow, C.green, C.blue, C.purple]; cs.forEach((cc, i) => { ctx.strokeStyle = cc; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 22, 36 - i * 6, Math.PI, 0); ctx.stroke(); }); },
      '⭐': () => { K.star(0, 0, 34, C.yellow); },
      '🍙': () => { ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(32, 20, 26, 24); ctx.lineTo(-26, 24); ctx.quadraticCurveTo(-32, 20, 0, -30); ctx.closePath(); ctx.fillStyle = '#f4f1e6'; ctx.fill(); ctx.strokeStyle = '#a79e8c'; ctx.lineWidth = 3; ctx.stroke(); K.rr(-12, 2, 24, 22, 3, '#3a4a3c'); },
      '🐶': () => { K.circle(0, 2, 26, '#c08a52', '#8e6334', 3); K.rr(-30, -18, 14, 26, 6, '#8e6334'); K.rr(16, -18, 14, 26, 6, '#8e6334'); K.circle(-9, -2, 3.5, '#2b2b2b'); K.circle(9, -2, 3.5, '#2b2b2b'); K.circle(0, 10, 6, '#2b2b2b'); },
      '🐱': () => { K.circle(0, 2, 26, '#d8a24a', '#a97c2e', 3); ctx.fillStyle = '#d8a24a'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 10, -20); ctx.lineTo(sx * 26, -34); ctx.lineTo(sx * 24, -12); ctx.closePath(); ctx.fill(); } K.circle(-9, -2, 3.5, '#2b2b2b'); K.circle(9, -2, 3.5, '#2b2b2b'); ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 2; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 12, 8); ctx.lineTo(sx * 30, 4); ctx.stroke(); } },
      '🐰': () => { K.circle(0, 6, 24, '#efe9e2', '#c9c0b5', 3); for (const sx of [-1, 1]) { ctx.save(); ctx.translate(sx * 11, -22); ctx.rotate(sx * 0.18); ctx.beginPath(); ctx.ellipse(0, 0, 8, 20, 0, 0, 7); ctx.fillStyle = '#efe9e2'; ctx.fill(); ctx.strokeStyle = '#c9c0b5'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); } K.circle(-8, 2, 3.5, '#2b2b2b'); K.circle(8, 2, 3.5, '#2b2b2b'); K.circle(0, 12, 4, '#c88f9a'); },
      '🐻': () => { K.circle(-20, -18, 11, '#9a6b3e'); K.circle(20, -18, 11, '#9a6b3e'); K.circle(0, 2, 26, '#9a6b3e', '#6f4b28', 3); ctx.beginPath(); ctx.ellipse(0, 10, 13, 10, 0, 0, 7); ctx.fillStyle = '#e0c49c'; ctx.fill(); K.circle(-9, -4, 3.5, '#2b2b2b'); K.circle(9, -4, 3.5, '#2b2b2b'); K.circle(0, 7, 5, '#2b2b2b'); },
      '🌻': () => { ctx.fillStyle = C.yellow; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; ctx.save(); ctx.translate(Math.cos(a) * 20, Math.sin(a) * 20 - 4); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, 0, 13, 7, 0, 0, 7); ctx.fill(); ctx.restore(); } K.circle(0, -4, 14, '#7a5230'); ctx.strokeStyle = '#4e7a3c'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, 32); ctx.stroke(); },
      '🍓': () => { ctx.beginPath(); ctx.moveTo(0, 30); ctx.quadraticCurveTo(-28, 8, -22, -8); ctx.quadraticCurveTo(-12, -20, 0, -14); ctx.quadraticCurveTo(12, -20, 22, -8); ctx.quadraticCurveTo(28, 8, 0, 30); ctx.closePath(); ctx.fillStyle = C.red; ctx.fill(); ctx.strokeStyle = shade(C.red, -0.35); ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#4e7a3c'; ctx.beginPath(); ctx.moveTo(-14, -14); ctx.lineTo(0, -26); ctx.lineTo(14, -14); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#f6e3b0'; for (const p of [[-8, 0], [6, -2], [0, 12], [-12, 10], [12, 8]]) K.circle(p[0], p[1], 2.5, '#f6e3b0'); },
      '🎈': () => { ctx.beginPath(); ctx.ellipse(0, -6, 22, 26, 0, 0, 7); ctx.fillStyle = C.pink; ctx.fill(); ctx.strokeStyle = shade(C.pink, -0.35); ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(-8, -14, 6, 9, -0.4, 0, 7); ctx.fill(); ctx.strokeStyle = '#8a8070'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 20); ctx.quadraticCurveTo(8, 28, 2, 36); ctx.stroke(); },
      '🏆': () => { K.rr(-18, -28, 36, 28, 6, C.yellow, shade(C.yellow, -0.35), 3); ctx.strokeStyle = shade(C.yellow, -0.3); ctx.lineWidth = 4; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * 22, -20, 9, -1.2, 1.2, sx < 0); ctx.stroke(); } ctx.fillStyle = shade(C.yellow, -0.2); ctx.fillRect(-6, 0, 12, 12); K.rr(-18, 12, 36, 10, 3, shade(C.yellow, -0.3)); },
    };
    (F[key] || F['⭐'])();
    ctx.restore();
  };

  // ---------- シール帳（遊ぶたびに1枚もらえる・端末の中だけに保存） ----------
  K.STICKERS = ['🚃', '🚄', '🚂', '🚉', '🚦', '🌈', '⭐', '🍙', '🐶', '🐱', '🐰', '🐻', '🌻', '🍓', '🎈', '🏆'];
  K.addSticker = function (game) {
    const key = 'kidtrain_stickers';
    const all = JSON.parse(localStorage.getItem(key) || '[]');
    const s = K.STICKERS[Math.floor(Math.random() * K.STICKERS.length)];
    all.push({ s, game, t: Date.now() }); localStorage.setItem(key, JSON.stringify(all.slice(-200)));
    return { s, count: all.length };
  };

  // ---------- タイトル画面 ----------
  K.title = function (title, sub, color, onStart) {
    K.scene = {
      update() {},
      draw(t) {
        K.skyBg(t);
        K.rr(150, 110, 980, 250, 20, 'rgba(255,255,255,0.93)', K.C.panelEdge, 3);
        ctx.fillStyle = color; ctx.fillRect(150, 110, 980, 8);
        K.text(title, W / 2, 205, 80, color, 'center', null);
        K.text(sub, W / 2, 300, 34, K.C.sub, 'center', null);
        K.trainSide(W / 2 + 340 + ((t * 120) % 1600) - 800, 640, { color, cars: 3, scale: 0.9, bob: Math.sin(t * 20) * 1.2 });
        K.railBed(660);
        K.button(W / 2 - 190, 420, 380, 100, 'はじめる', color, () => onStart());
      }
    };
  };
  // そらと とおくの けしき（6本で そろえる）
  K.skyBg = function (t) {
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.8);
    g.addColorStop(0, K.C.sky1); g.addColorStop(1, K.C.sky2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 380 + t * 10) % 1700) - 200, cy = 90 + (i % 2) * 54;
      ctx.beginPath(); ctx.ellipse(cx, cy, 70, 20, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 36, cy - 12, 44, 18, 0, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#6b8f74';
    ctx.beginPath(); ctx.moveTo(0, 460);
    for (let x = 0; x <= W; x += 60) ctx.lineTo(x, 430 + Math.sin(x * 0.006) * 28 + Math.sin(x * 0.019) * 10);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = K.C.grass; ctx.fillRect(0, 520, W, H - 520);
  };
  // せんろの どだい（まくらぎ と レール）
  K.railBed = function (y, from, to) {
    const x0 = from == null ? 0 : from, x1 = to == null ? W : to;
    ctx.fillStyle = '#9a8e7c'; ctx.fillRect(x0, y - 4, x1 - x0, 26);
    ctx.fillStyle = '#6f5f4a';
    for (let x = Math.floor(x0 / 40) * 40; x < x1; x += 40) ctx.fillRect(x + 6, y, 22, 16);
    ctx.fillStyle = '#7d8696'; ctx.fillRect(x0, y - 4, x1 - x0, 5);
    ctx.fillStyle = '#5f6878'; ctx.fillRect(x0, y + 14, x1 - x0, 5);
  };

  K.homeButton = function () { K.button(16, 16, 128, 62, 'もどる', '#55637c', () => { location.href = '../'; }, { size: 29 }); };

  // ---------- ごほうび画面 ----------
  K.reward = function (game, msg, onAgain) {
    const st = K.addSticker(game);
    K.sfx.fanfare(); K.confetti(120); K.say(msg + '。シールを もらったよ');
    let t0 = 0;
    K.scene = {
      update(dt) { t0 += dt; },
      draw() {
        ctx.fillStyle = 'rgba(244,247,251,0.92)'; ctx.fillRect(0, 0, W, H);
        K.rr(240, 70, 800, 100, 16, '#ffffff', K.C.panelEdge, 3);
        K.text(msg, W / 2, 120, 56, K.C.red, 'center', null);
        const sc = Math.min(1, t0 * 3) * (1 + Math.sin(t0 * 6) * 0.04);
        K.circle(W / 2, 330, 112 * sc, '#ffffff', K.C.panelEdge, 3);
        K.drawSticker(st.s, W / 2, 330, 86 * sc);
        K.text(`シール ${st.count}まいめ`, W / 2, 486, 34, K.C.sub, 'center', null);
        if (t0 > 1.2) K.button(W / 2 - 190, 546, 380, 100, 'もういっかい', K.C.green, () => onAgain());
      }
    };
  };

  // ---------- メインループ ----------
  K.scene = null;
  let last = performance.now(), time = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#1d2a44'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    buttons = nextButtons; nextButtons = [];
    if (K.scene) { K.scene.update && K.scene.update(dt, time); K.scene.draw && K.scene.draw(time, dt); }
    drawParts(dt);
    ctx.restore();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
