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
  K.bg = '#bfe7ff';
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const sw = window.innerWidth, sh = window.innerHeight;
    cv.width = sw * dpr; cv.height = sh * dpr;
    cv.style.width = sw + 'px'; cv.style.height = sh + 'px';
    scale = Math.min(sw / W, sh / H);
    ox = (sw - W * scale) / 2; oy = (sh - H * scale) / 2;
  }
  window.addEventListener('resize', resize); resize();
  document.body.style.cssText = 'margin:0;overflow:hidden;background:#1d2a44;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none';

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
    const dy = pressed ? 4 : 0;
    K.rr(x, y + 6, w, h, Math.min(28, h / 2), shade(color, -0.35));
    K.rr(x, y + dy, w, h, Math.min(28, h / 2), color);
    K.rr(x + 8, y + dy + 6, w - 16, h * 0.32, Math.min(20, h / 3), 'rgba(255,255,255,0.25)');
    K.text(label, x + w / 2, y + h / 2 + dy + 2, opt.size || Math.min(44, h * 0.42), opt.textColor || '#fff', 'center', 'rgba(0,0,0,0.25)');
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
  K.text = function (s, x, y, size, color, align, outline) {
    ctx.font = `bold ${size}px ${K.FONT}`;
    ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    if (outline !== null) { ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.22; ctx.strokeStyle = outline || 'rgba(255,255,255,0.95)'; ctx.strokeText(s, x, y); }
    ctx.fillStyle = color || '#333'; ctx.fillText(s, x, y);
  };
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
    return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }
  K.shade = shade;

  // ---------- 電車の絵（おもちゃ風・オリジナル。実在の会社の色やロゴは使わない） ----------
  // 横から見た電車。kind: 'local'（ふつう）/ 'bullet'（はやい）/ 'steam'（きかんしゃ）
  K.trainSide = function (x, y, o = {}) {
    const s = o.scale || 1, color = o.color || '#e94b4b', stripe = o.stripe || '#ffd23f', cars = o.cars || 2, kind = o.kind || 'local';
    const carW = 230 * s, carH = 110 * s, gap = 10 * s;
    ctx.save(); ctx.translate(x, y);
    if (o.flip) ctx.scale(-1, 1);
    const bob = o.bob || 0;
    for (let i = 0; i < cars; i++) {
      const cx = -i * (carW + gap);
      const head = i === 0;
      // 車輪
      for (const wx of [0.2, 0.38, 0.62, 0.8]) {
        K.circle(cx + carW * wx - carW, carH * 0.02, 17 * s, '#3b3f4a');
        K.circle(cx + carW * wx - carW, carH * 0.02, 7 * s, '#9aa3b5');
      }
      ctx.save(); ctx.translate(0, bob * (i % 2 ? -1 : 1));
      const bx = cx - carW, by = -carH;
      if (head && kind === 'bullet') {
        ctx.beginPath();
        ctx.moveTo(bx, by + 18 * s); ctx.lineTo(bx + carW * 0.55, by);
        ctx.quadraticCurveTo(bx + carW * 1.25, by + carH * 0.25, bx + carW + 30 * s, by + carH);
        ctx.lineTo(bx, by + carH); ctx.closePath();
        ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = shade(color, -0.4); ctx.lineWidth = 5 * s; ctx.stroke();
        ctx.fillStyle = stripe; ctx.fillRect(bx, by + carH * 0.62, carW * 1.02, carH * 0.12);
        K.rr(bx + carW * 0.66, by + carH * 0.16, carW * 0.26, carH * 0.22, 16 * s, '#2b3a55');
      } else if (head && kind === 'steam') {
        K.rr(bx + carW * 0.08, by + carH * 0.3, carW * 0.92, carH * 0.7, 18 * s, '#2f3542', shade('#2f3542', -0.5), 5 * s);
        K.rr(bx, by, carW * 0.42, carH, 14 * s, color, shade(color, -0.4), 5 * s);
        K.rr(bx + carW * 0.07, by + carH * 0.18, carW * 0.26, carH * 0.3, 10 * s, '#cfefff');
        K.rr(bx + carW * 0.72, by - carH * 0.12, carW * 0.12, carH * 0.45, 8 * s, '#2f3542');
        K.circle(bx + carW * 0.97, by + carH * 0.62, 14 * s, '#ffd23f');
        ctx.fillStyle = stripe; ctx.fillRect(bx + carW * 0.42, by + carH * 0.86, carW * 0.58, carH * 0.08);
      } else {
        K.rr(bx, by, carW, carH, 22 * s, color, shade(color, -0.4), 5 * s);
        ctx.fillStyle = stripe; ctx.fillRect(bx + 4 * s, by + carH * 0.62, carW - 8 * s, carH * 0.13);
        const nWin = head ? 3 : 4;
        for (let k = 0; k < nWin; k++) K.rr(bx + carW * (0.08 + k * 0.215), by + carH * 0.16, carW * 0.16, carH * 0.32, 10 * s, '#cfefff', '#5b6b85', 3 * s);
        if (head) { K.rr(bx + carW * 0.78, by + carH * 0.12, carW * 0.18, carH * 0.4, 12 * s, '#2b3a55'); K.circle(bx + carW * 0.93, by + carH * 0.8, 9 * s, '#fff8b0'); }
        else K.rr(bx + carW * 0.86, by + carH * 0.12, carW * 0.1, carH * 0.8, 6 * s, shade(color, -0.2));
      }
      ctx.restore();
      // 連結器
      if (i < cars - 1) { ctx.fillStyle = '#555'; ctx.fillRect(cx - carW - gap - 2, -carH * 0.25, gap + 4, 8 * s); }
    }
    ctx.restore();
    return cars * (carW + gap);
  };

  // 上から見た電車。x,y は先頭の中心。angle はラジアン（0 で右向き）
  K.trainTop = function (x, y, angle, o = {}) {
    const s = o.scale || 1, color = o.color || '#e94b4b', stripe = o.stripe || '#ffd23f';
    const L = 86 * s, Wd = 46 * s;
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; K.rr(-L + 4, -Wd / 2 + 6, L, Wd, 16 * s, 'rgba(0,0,0,0.18)');
    ctx.beginPath(); ctx.moveTo(-L, -Wd / 2); ctx.lineTo(-L * 0.25, -Wd / 2); ctx.quadraticCurveTo(L * 0.05, -Wd / 2, L * 0.05, 0); ctx.quadraticCurveTo(L * 0.05, Wd / 2, -L * 0.25, Wd / 2); ctx.lineTo(-L, Wd / 2); ctx.closePath();
    ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = shade(color, -0.4); ctx.lineWidth = 4 * s; ctx.stroke();
    ctx.fillStyle = stripe; ctx.fillRect(-L + 6 * s, -4 * s, L * 0.8, 8 * s);
    K.rr(-L * 0.3, -Wd * 0.32, L * 0.18, Wd * 0.64, 6 * s, '#2b3a55');
    ctx.restore();
  };

  // 乗客（まるい子ども向けキャラ）。color で行き先の色を表す
  K.person = function (x, y, o = {}) {
    const s = o.scale || 1, color = o.color || '#4b8bf5', skin = o.skin || '#ffd9b8';
    const hop = o.hop || 0;
    ctx.save(); ctx.translate(x, y - hop);
    K.rr(-22 * s, -46 * s, 44 * s, 50 * s, 18 * s, color, shade(color, -0.4), 3 * s);
    K.circle(0, -68 * s, 26 * s, skin, '#8a5a3c', 3 * s);
    ctx.fillStyle = o.hair || '#5a3a22'; ctx.beginPath(); ctx.arc(0, -72 * s, 26 * s, Math.PI, 0); ctx.fill();
    K.circle(-9 * s, -66 * s, 3.5 * s, '#333'); K.circle(9 * s, -66 * s, 3.5 * s, '#333');
    ctx.strokeStyle = '#333'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.arc(0, -60 * s, 7 * s, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    if (o.hat) { K.rr(-24 * s, -100 * s, 48 * s, 16 * s, 6 * s, o.hat); K.rr(-28 * s, -88 * s, 56 * s, 7 * s, 3 * s, shade(o.hat, -0.3)); }
    ctx.restore();
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
    if (!vbuf[file]) vbuf[file] = fetch(voiceBase + file).then(r => r.arrayBuffer()).then(b => new Promise((ok, ng) => ac.decodeAudioData(b, ok, ng))).catch(() => { delete vbuf[file]; return null; });
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
        ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
        K.rr(140, 120, 1000, 300, 40, '#fff', color, 10);
        K.text(title, W / 2, 230, 92, color, 'center', '#fff');
        K.text(sub, W / 2, 330, 38, '#555', 'center', null);
        K.trainSide(W / 2 + 340 + ((t * 120) % 1600) - 800, 620, { color, cars: 3, scale: 0.9, bob: Math.sin(t * 20) * 1.5 });
        ctx.fillStyle = '#8a6a4a'; ctx.fillRect(0, 640, W, 14);
        K.button(W / 2 - 200, 450, 400, 110, 'はじめる', color, () => onStart());
      }
    };
  };

  K.homeButton = function () { K.button(16, 16, 120, 64, 'もどる', '#8a94a8', () => { location.href = '../'; }, { size: 28 }); };

  // ---------- ごほうび画面 ----------
  K.reward = function (game, msg, onAgain) {
    const st = K.addSticker(game);
    K.sfx.fanfare(); K.confetti(120); K.say(msg + '。シールを もらったよ');
    let t0 = 0;
    K.scene = {
      update(dt) { t0 += dt; },
      draw() {
        ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.fillRect(0, 0, W, H);
        K.text(msg, W / 2, 150, 72, '#e94b4b', 'center', '#fff');
        const sc = Math.min(1, t0 * 3) * (1 + Math.sin(t0 * 6) * 0.05);
        K.circle(W / 2, 330, 120 * sc, '#fff7c7', '#ffd23f', 10);
        ctx.font = `${130 * sc}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(st.s, W / 2, 338);
        K.text(`シール ${st.count}まいめ`, W / 2, 500, 40, '#555', 'center', null);
        if (t0 > 1.2) K.button(W / 2 - 200, 560, 400, 110, 'もういっかい', '#3ec46d', () => onAgain());
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
