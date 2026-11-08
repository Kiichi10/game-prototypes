// ⑤ ぼくが しゃしょうさん
// 子どもの声を「しゃないほうそう」ふうにして流す。録音は端末のメモリ内だけ（保存・送信なし）。
(function () {
  'use strict';
  const ctx = K.ctx, W = K.W, H = K.H;
  const GAME = 'ぼくが しゃしょうさん';
  const TRAIN = { color: K.C.purple, stripe: K.C.yellow, cars: 3, scale: 0.9 };
  const HEADX = 760, TRY = 560;               // 先頭の右下（画面）
  const CARW = 230 * 0.9, GAP = 10 * 0.9, CARH = 110 * 0.9;
  const CRUISE = 420;                          // 走る速さ
  const STATIONS = [
    { name: 'うさぎえき', animal: 'usagi', col: K.C.pink },
    { name: 'くまえき', animal: 'kuma', col: '#a8763f' },
    { name: 'ぞうえき', animal: 'zou', col: '#7fa7d9' },
    { name: 'ぱんだえき', animal: 'panda', col: K.C.green },
  ];
  const sampleText = s => `つぎは、${s.name}。${s.name} です。`;

  // ============ マイク（録音はメモリ内だけ） ============
  const mic = { state: 'none', stream: null, analyser: null, data: null, mime: '' };
  function pickMime() {
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return '';
    const list = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
    return list.find(m => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } }) || '';
  }
  // タップの中で呼ぶ（iPhone Safari 対策）
  function requestMic() {
    if (mic.state === 'ok' && mic.stream && mic.stream.getAudioTracks().some(t => t.readyState === 'live')) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) { micFail(); return; }
    mic.state = 'pending';
    let p;
    try { p = navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
    catch (e) { micFail(); return; }
    p.then(stream => {
      mic.stream = stream; mic.state = 'ok'; mic.mime = pickMime();
      try {
        const src = K.ac.createMediaStreamSource(stream);
        mic.analyser = K.ac.createAnalyser(); mic.analyser.fftSize = 512;
        mic.data = new Uint8Array(mic.analyser.fftSize);
        src.connect(mic.analyser);            // スピーカーにはつながない
      } catch (e) { mic.analyser = null; }
      stream.getAudioTracks().forEach(t => t.addEventListener('ended', () => { if (mic.state === 'ok') micFail(); }));
    }).catch(() => micFail());
  }
  function micFail() {
    const was = mic.state;
    mic.state = 'ng'; mic.stream = null; mic.analyser = null;
    if (was !== 'ng' && G && G.st === 'ask') { G.stT = 0; K.say('マイクが つかえないので、みほんを ながして、いっしょに いってみよう'); }
  }
  function releaseMic() {
    if (mic.stream) mic.stream.getTracks().forEach(t => t.stop());
    mic.stream = null; mic.analyser = null; if (mic.state === 'ok') mic.state = 'none';
  }
  // こえの 大きさ（0〜1）。いちばん 大きい ところではなく ならした 大きさ(RMS)で みる。
  // ピークだと ちかくで はなす 子どもの こえで すぐ いっぱいに なって、ぼうが うごかなく なるため
  function micLevel() {
    if (!mic.analyser) return 0;
    mic.analyser.getByteTimeDomainData(mic.data);
    let s = 0;
    for (let i = 0; i < mic.data.length; i++) { const v = (mic.data[i] - 128) / 128; s += v * v; }
    const rms = Math.sqrt(s / mic.data.length);
    return Math.min(1, rms * 5);
  }

  // ---- 録音 ----
  const rec = { r: null, chunks: [], t0: 0, toggle: false, held: false };
  function startRec() {
    if (mic.state !== 'ok' || !mic.stream) return false;
    if (window.speechSynthesis) speechSynthesis.cancel();
    try {
      rec.chunks = [];
      rec.r = mic.mime ? new MediaRecorder(mic.stream, { mimeType: mic.mime }) : new MediaRecorder(mic.stream);
      rec.r.ondataavailable = e => { if (e.data && e.data.size) rec.chunks.push(e.data); };
      rec.r.onstop = onRecStop;
      rec.r.start();
    } catch (e) { rec.r = null; micFail(); return false; }
    rec.t0 = performance.now(); rec.toggle = false; rec.held = true;
    return true;
  }
  function stopRec() {
    if (rec.r && rec.r.state !== 'inactive') { try { rec.r.stop(); } catch (e) { onRecStop(); } }
  }
  function onRecStop() {
    const r = rec.r; rec.r = null;
    const blob = new Blob(rec.chunks, { type: (r && r.mimeType) || mic.mime || 'audio/webm' });
    rec.chunks = [];
    setState('proc');
    const ab = blob.arrayBuffer ? blob.arrayBuffer() : new Response(blob).arrayBuffer();
    ab.then(buf => decode(buf)).then(audio => {
      gotVoice({ buf: audio });
    }).catch(() => {
      gotVoice(blob.size > 0 ? { blob } : null);   // デコードできない時はそのまま流す
    });
  }
  function decode(arr) {
    return new Promise((res, rej) => {
      try { const p = K.ac.decodeAudioData(arr, res, rej); if (p && p.then) p.then(res, rej); } catch (e) { rej(e); }
    });
  }

  // ---- しゃないほうそう ふうに再生 ----
  let fxIn = null;
  function makeImpulse(sec, decay) {
    const ac = K.ac, len = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }
  function getFx() {
    if (fxIn) return fxIn;
    const ac = K.ac;
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 380; hp.Q.value = 0.8;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; lp.Q.value = 0.9;
    const pk = ac.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 1700; pk.Q.value = 1.2; pk.gain.value = 7;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -24; comp.ratio.value = 6;
    const dry = ac.createGain(); dry.gain.value = 0.85;
    const conv = ac.createConvolver(); conv.buffer = makeImpulse(1.4, 2.6);
    const wet = ac.createGain(); wet.gain.value = 0.32;
    const dl = ac.createDelay(1); dl.delayTime.value = 0.13;
    const fb = ac.createGain(); fb.gain.value = 0.22;
    const out = ac.createGain(); out.gain.value = 1.3;
    hp.connect(lp); lp.connect(pk); pk.connect(comp);
    comp.connect(dry); dry.connect(out);
    comp.connect(conv); conv.connect(wet); wet.connect(out);
    comp.connect(dl); dl.connect(fb); fb.connect(dl); fb.connect(out);
    out.connect(ac.destination);
    fxIn = ac.createGain(); fxIn.connect(hp);
    return fxIn;
  }
  // こえの かえかた（ふつう / たかい / ロボット）
  const FX = [
    { key: 'normal', name: 'ふつう', say: 'ふつうの こえ', rate: 1.0 },
    { key: 'high', name: 'たかい', say: 'たかい こえ', rate: 1.32 },
    { key: 'robot', name: 'ロボット', say: 'ロボットの こえ', rate: 1.0, ring: 58 },
  ];
  const FXKEY = 'kidtrain_shasho_fx';
  let fxPick = 0;
  try { const n = parseInt(localStorage.getItem(FXKEY) || '0', 10); if (n >= 0 && n < FX.length) fxPick = n; } catch (e) {}
  function setFx(i) { fxPick = i; try { localStorage.setItem(FXKEY, String(i)); } catch (e) {} }
  // リングモジュレーション（ロボットの こえ）
  function ringNode() {
    const ac = K.ac, g = ac.createGain(); g.gain.value = 0;
    const lfo = ac.createOscillator(); lfo.frequency.value = FX[fxPick].ring;
    const amt = ac.createGain(); amt.gain.value = 1;
    lfo.connect(amt); amt.connect(g.gain); lfo.start();
    return g;
  }

  // when 秒後に声を流す。戻り値は声の長さ（秒）
  function playVoice(v, when) {
    if (!v) return 0;
    if (v.buf) {
      const ac = K.ac, src = ac.createBufferSource(); src.buffer = v.buf;
      const f = FX[fxPick];
      src.playbackRate.value = f.rate;
      let peak = 0; const d = v.buf.getChannelData(0);
      for (let i = 0; i < d.length; i += 4) peak = Math.max(peak, Math.abs(d[i]));
      const g = ac.createGain(); g.gain.value = Math.min(6, 0.8 / Math.max(0.02, peak)) * (f.ring ? 1.6 : 1);
      src.connect(g);
      if (f.ring) { const r = ringNode(); g.connect(r); r.connect(getFx()); }
      else g.connect(getFx());
      src.start(ac.currentTime + when);
      return v.buf.duration / f.rate;
    }
    // 予備: デコードできなかった時は効果なしでそのまま
    const url = URL.createObjectURL(v.blob), a = new Audio(url);
    a.onended = () => URL.revokeObjectURL(url);
    setTimeout(() => a.play().catch(() => {}), when * 1000);
    return 4;
  }
  window.SHASHO_DEBUG = { mic, rec, get G() { return G; } };

  // ============ 絵 ============
  function animal(kind, x, y, r) {
    const line = 'rgba(0,0,0,0.35)';
    if (kind === 'usagi') {
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(x + s * r * 0.35, y - r * 0.75); ctx.rotate(s * 0.15);
        ctx.beginPath(); ctx.ellipse(0, -r * 0.35, r * 0.2, r * 0.55, 0, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, -r * 0.33, r * 0.09, r * 0.4, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffb3d1'; ctx.fill();
        ctx.restore();
      }
      K.circle(x, y, r * 0.72, '#fff', line, 3);
    } else if (kind === 'kuma') {
      K.circle(x - r * 0.55, y - r * 0.55, r * 0.28, '#a86b35', line, 3); K.circle(x + r * 0.55, y - r * 0.55, r * 0.28, '#a86b35', line, 3);
      K.circle(x, y, r * 0.75, '#a86b35', line, 3);
      ctx.beginPath(); ctx.ellipse(x, y + r * 0.22, r * 0.3, r * 0.22, 0, 0, Math.PI * 2); ctx.fillStyle = '#f2d2a9'; ctx.fill();
    } else if (kind === 'zou') {
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * r * 0.62, y, r * 0.38, r * 0.5, 0, 0, Math.PI * 2); ctx.fillStyle = '#9fb3c8'; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 3; ctx.stroke(); }
      K.circle(x, y - r * 0.05, r * 0.62, '#b7c7d8', line, 3);
      ctx.strokeStyle = '#b7c7d8'; ctx.lineWidth = r * 0.22; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y + r * 0.1); ctx.quadraticCurveTo(x - r * 0.05, y + r * 0.75, x + r * 0.3, y + r * 0.7); ctx.stroke(); ctx.lineCap = 'butt';
    } else if (kind === 'panda') {
      K.circle(x - r * 0.55, y - r * 0.55, r * 0.26, '#222'); K.circle(x + r * 0.55, y - r * 0.55, r * 0.26, '#222');
      K.circle(x, y, r * 0.75, '#fff', line, 3);
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * r * 0.27, y - r * 0.08, r * 0.17, r * 0.22, s * 0.5, 0, Math.PI * 2); ctx.fillStyle = '#222'; ctx.fill(); }
    }
    // 目と口
    const ey = kind === 'zou' ? y - r * 0.15 : y - r * 0.1, ex = r * 0.26;
    K.circle(x - ex, ey, r * 0.08, kind === 'panda' ? '#fff' : '#333'); K.circle(x + ex, ey, r * 0.08, kind === 'panda' ? '#fff' : '#333');
    if (kind !== 'zou') { K.circle(x, y + r * 0.12, r * 0.08, '#333'); ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y + r * 0.2, r * 0.13, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); }
    K.circle(x - r * 0.42, y + r * 0.15, r * 0.1, 'rgba(255,120,150,0.45)'); K.circle(x + r * 0.42, y + r * 0.15, r * 0.1, 'rgba(255,120,150,0.45)');
  }
  function stationSign(s, x, y, w, h, big) {
    K.rr(x + 4, y + 6, w, h, 18, 'rgba(0,0,0,0.18)');
    K.rr(x, y, w, h, 18, '#fff', s.col, 6);
    K.rr(x, y + h - 18, w, 18, 0, s.col);
    animal(s.animal, x + h * 0.52, y + h * 0.5, h * 0.36);
    K.text(s.name, x + h + (w - h) / 2 - 6, y + h * 0.46, big || 44, K.C.ink, 'center', null);
  }
  function cloud(x, y, s) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; [[0, 0, 34], [36, -14, 40], [76, 0, 32], [38, 10, 34]].forEach(c => { ctx.beginPath(); ctx.arc(x + c[0] * s, y + c[1] * s, c[2] * s, 0, Math.PI * 2); ctx.fill(); }); }
  const wrap = (v, m) => ((v % m) + m) % m;
  function scenery(pos, t) {
    const g = ctx.createLinearGradient(0, 0, 0, TRY); g.addColorStop(0, '#79a8c8'); g.addColorStop(1, '#b9d3e4');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    K.circle(1160, 90, 46, '#ffe066'); 
    for (let i = 0; i < 4; i++) cloud(wrap(i * 420 - pos * 0.06, 1680) - 200, 70 + (i % 2) * 60, 0.9);
    // とおくの やま
    ctx.fillStyle = '#6b8f74';
    for (let i = -1; i < 6; i++) { const x = wrap(-pos * 0.15, 360) + i * 360; ctx.beginPath(); ctx.moveTo(x - 220, 470); ctx.quadraticCurveTo(x, 300 + (i % 2) * 50, x + 220, 470); ctx.fill(); }
    // き と いえ
    for (let i = -1; i < 8; i++) {
      const x = wrap(-pos * 0.4, 220) + i * 220, k = Math.abs((Math.floor((pos * 0.4) / 220) - i) % 3);
      if (k === 0) { K.rr(x - 40, 420, 80, 60, 6, '#ffe8c2'); ctx.fillStyle = '#e46a5a'; ctx.beginPath(); ctx.moveTo(x - 52, 424); ctx.lineTo(x, 380); ctx.lineTo(x + 52, 424); ctx.fill(); K.rr(x - 12, 442, 24, 38, 4, '#a0714a'); }
      else { ctx.fillStyle = '#8a5a3c'; ctx.fillRect(x - 6, 440, 12, 40); K.circle(x, 425, 32, k === 1 ? '#4fb35a' : '#63c46d'); }
    }
    ctx.fillStyle = '#7aa55f'; ctx.fillRect(0, 478, W, TRY - 478);
    // せんろ
    ctx.fillStyle = '#b9a58c'; ctx.fillRect(0, TRY + 12, W, 26);
    ctx.fillStyle = '#7a5a3a'; for (let x = -wrap(pos, 60); x < W; x += 60) ctx.fillRect(x, TRY + 16, 30, 18);
    ctx.fillStyle = '#6b6f7a'; ctx.fillRect(0, TRY + 14, W, 6);
    ctx.fillStyle = '#7aa55f'; ctx.fillRect(0, TRY + 38, W, H - TRY - 38);
    ctx.fillStyle = '#6c9553'; for (let x = -wrap(pos * 1.3, 90); x < W; x += 90) { ctx.beginPath(); ctx.arc(x, TRY + 80, 10, Math.PI, 0); ctx.fill(); }
  }
  // えき（せんろの おく：やね・かんばん）
  function stationBack(s, sx) {
    ctx.fillStyle = '#c9b8a0'; ctx.fillRect(sx - 760, 470, 960, 90);
    for (let x = sx - 720; x <= sx + 160; x += 220) { ctx.fillStyle = K.C.sub; ctx.fillRect(x, 260, 12, 300); }
    K.rr(sx - 780, 240, 1000, 30, 10, '#e46a5a', K.shade('#e46a5a', -0.3), 4);
    stationSign(s, sx - 560, 300, 420, 130, 52);
  }
  // えき（てまえの ホーム）
  function stationFront(sx) {
    K.rr(sx - 760, TRY + 30, 960, 140, 8, '#d7d2c8', '#a39d90', 4);
    ctx.fillStyle = K.C.yellow; ctx.fillRect(sx - 756, TRY + 46, 952, 10);
  }
  // ドアは まどの ところに ぴったり あわせる（2_ekiin・4_melody と おなじ いち）
  function doorXs() { const r = []; for (let i = 0; i < TRAIN.cars; i++) r.push(HEADX - i * (CARW + GAP) - CARW * 0.625); return r; }
  function doors(open) {
    for (const x of doorXs()) {
      const w = CARW * 0.22, y = TRY - CARH * 0.9, h = CARH * 0.84;
      K.rr(x - w / 2 - 3, y - 3, w + 6, h + 6, 6, K.shade(TRAIN.color, -0.45));
      K.rr(x - w / 2, y, w, h, 4, '#3a3550');
      const pw = (w / 2) * (1 - open);
      if (pw > 1) {
        const panel = K.shade(TRAIN.color, 0.12), edge = K.shade(TRAIN.color, -0.4);
        K.rr(x - w / 2, y, pw, h, 3, panel, edge, 2); K.rr(x + w / 2 - pw, y, pw, h, 3, panel, edge, 2);
        if (pw > 12) {
          ctx.globalAlpha = 0.55;
          K.rr(x - w / 2 + 4, y + 10, pw - 8, h * 0.38, 3, '#cfefff'); K.rr(x + w / 2 - pw + 4, y + 10, pw - 8, h * 0.38, 3, '#cfefff');
          ctx.globalAlpha = 1;
        }
      }
    }
  }
  function micButton(x, y, r, recording, lv, prog, t) {
    const pulse = recording ? 1 + lv * 0.12 : 1 + Math.sin(t * 4) * 0.04;
    const rr = r * pulse;
    K.circle(x, y + 7, rr, '#8e2f27');
    K.circle(x, y, rr, recording ? K.C.red : K.C.red, '#fff', 6);
    if (recording) { ctx.strokeStyle = K.C.yellow; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(x, y, rr + 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog); ctx.stroke(); }
    // マイクの え
    K.rr(x - 18, y - 52, 36, 62, 18, '#fff');
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, y - 8, 30, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 4, y + 22, 8, 18); ctx.fillRect(x - 20, y + 38, 40, 7);
  }
  function speaker(x, y, s, t, on) {
    K.rr(x - 30 * s, y - 22 * s, 26 * s, 44 * s, 6 * s, '#5b6b85');
    ctx.fillStyle = '#5b6b85'; ctx.beginPath(); ctx.moveTo(x - 8 * s, y - 22 * s); ctx.lineTo(x + 22 * s, y - 46 * s); ctx.lineTo(x + 22 * s, y + 46 * s); ctx.lineTo(x - 8 * s, y + 22 * s); ctx.fill();
    if (on) for (let i = 0; i < 3; i++) { const a = (Math.sin(t * 8 - i) + 1) / 2; ctx.strokeStyle = `rgba(233,75,75,${0.3 + a * 0.7})`; ctx.lineWidth = 6 * s; ctx.beginPath(); ctx.arc(x + 26 * s, y, (24 + i * 18) * s, -0.8, 0.8); ctx.stroke(); }
  }

  // ============ ゲーム ============
  let G = null;
  const PRAISE = ['じょうず！ ほんものの しゃしょうさん みたい', 'すてきな こえ！ みんなに きこえたよ', 'かっこいい！ おきゃくさんも にっこり', 'ばっちり！ よく いえたね'];
  const MICX = 1150, MICY = 600, MICR = 92;
  const SAMPLE = { x: 860, y: 560, w: 200, h: 100 };
  const SAMPLE_BIG = { x: 900, y: 540, w: 340, h: 130 };
  const FIN_GAP = 0.9;

  function newGame() {
    G = { st: 'cruise', stT: 0, idx: 0, pos: 0, speed: CRUISE, stationPos: 0, recs: [], people: [], praise: '', said: {}, playEnd: 0, fin: null, asking: 'next', doorRec: null };
  }
  function setState(s) { G.st = s; G.stT = 0; G.said = {}; }
  const cur = () => STATIONS[G.idx];

  const DOORTEXT = 'ドアが しまります。ごちゅうい ください。';
  // ろせんずを みて「つぎの えき」を じぶんで えらぶ（かんがえる ところ）
  function toPick() { setState('pick'); G.wrong = -1; K.say('ろせんずを みて、つぎの えきを えらんでね'); }
  function pickStation(i) {
    if (G.st !== 'pick') return;
    if (i === G.idx) {
      K.sfx.good(); K.sparkle(sxOfStation(i), 48, 18, K.C.yellow);
      G.st = 'picked'; G.stT = 0;
      setTimeout(() => { if (G && G.st === 'picked') toAsk(); }, 900);
      return;
    }
    G.wrong = i; K.sfx.oops();
    K.say('ちがうよ。つぎは ' + cur().name + 'だよ');
  }
  function askingDoor() { return G.asking === 'door'; }
  function toAsk() {
    G.asking = 'next'; setState('ask');
    K.say(mic.state === 'ng' ? `つぎは ${cur().name}。みほんを ながして、いっしょに いってみよう` : `つぎは ${cur().name}、って いってみよう`);
  }
  // さいしょの えきだけ、ドアの ほうそうも じぶんの こえで ろくおんする
  function toAskDoor() {
    G.asking = 'door'; setState('ask');
    K.say('こんどは、ドアが しまります、って いってみよう');
  }
  function gotVoice(v) {
    if (askingDoor()) G.doorRec = v; else G.recs[G.idx] = v;
    if (!v) { playSample(true); return; }
    K.sfx.dingdong();
    const d = playVoice(v, 1.5);
    setState('play'); G.playEnd = 1.5 + d + 1.0;
  }
  function playSample(proceed) {
    if (window.speechSynthesis) speechSynthesis.cancel();
    K.sfx.dingdong();
    const txt = askingDoor() ? DOORTEXT : sampleText(cur());
    setTimeout(() => K.say(txt), 1400);
    setState(proceed ? 'play' : 'sample'); G.playEnd = 1.4 + txt.length * 0.16 + 0.8;
  }
  function toPraise() {
    const wasDoor = askingDoor();
    const redo = mic.state === 'ok' && !!(wasDoor ? G.doorRec : G.recs[G.idx]);
    setState('praise'); G.canRedo = redo; G.praiseDoor = wasDoor;
    G.praise = redo ? PRAISE[(wasDoor ? 3 : G.idx) % PRAISE.length] : 'いっしょに いえたね！ じょうず！';
    K.sfx.good(); K.sparkle(MICX - 300, 200, 24); K.say(G.praise.replace('！', '。'));
  }
  function toArrive() { setState('arrive'); G.arrStart = G.pos; G.stationPos = G.pos + 1500; makeWaiting(); }
  function makeWaiting() {
    const xs = doorXs(), cols = ['#ff8a3d', K.C.blue, K.C.green, K.C.purple, K.C.yellow], hats = [null, K.C.ink, null, K.C.red];
    G.people = [];
    const nOn = 2, nOff = 1 + (G.idx % 2);
    for (let i = 0; i < nOn; i++) { const dx = xs[(i * 2 + G.idx) % xs.length]; G.people.push({ type: 'on', rel: dx - HEADX + (i % 2 ? 70 : -70), door: dx, color: cols[(i + G.idx) % 5], hat: hats[(i + G.idx) % 4], d: i * 0.4 }); }
    for (let i = 0; i < nOff; i++) { const dx = xs[(i + G.idx + 1) % xs.length]; G.people.push({ type: 'off', door: dx, dir: i % 2 ? 1 : -1, color: cols[(i + G.idx + 2) % 5], hat: hats[(i + 1) % 4], d: i * 0.5 }); }
  }

  function update(dt, t) {
    G.stT += dt;
    const st = G.st;
    if (st === 'arrive') {
      const u = Math.min(1, G.stT / 3.6), e = 1 - Math.pow(1 - u, 2.2);
      const np = G.arrStart + 1500 * e; G.speed = (np - G.pos) / Math.max(dt, 1e-3); G.pos = np;
      if (u >= 1) { G.speed = 0; setState('doors'); K.sfx.door(); K.say(`${cur().name} に つきました`); }
    } else if (st === 'doors') {
      G.speed = 0;
      // ドアが しまる まえに、じぶんの こえの ほうそうを ながす
      if (G.stT > 2.4 && !G.said.ann) {
        G.said.ann = 1;
        G.annLen = G.doorRec ? playVoice(G.doorRec, 0.4) + 0.6 : 0;
        if (G.doorRec) K.sfx.dingdong();
      }
      const dc = 3.7 + (G.annLen || 0);
      if (G.stT > dc && !G.said.close) { G.said.close = 1; K.sfx.door(); }
      if (G.stT > dc + 0.9) {
        if (G.idx >= STATIONS.length - 1) toFinale();
        else { setState('depart'); K.sfx.whistle(); }
      }
    } else if (st === 'depart') {
      if (G.stT > 0.7 && !G.said.go) { G.said.go = 1; K.sfx.horn(); }
      G.speed = G.stT < 0.8 ? 0 : Math.min(CRUISE, (G.stT - 0.8) * 260); G.pos += G.speed * dt;
      if (G.speed >= CRUISE) { G.idx++; setState('cruise'); }
    } else {
      G.speed = CRUISE; G.pos += G.speed * dt;
    }
    if (st === 'cruise' && G.stT > 2.6) toPick();
    if (st === 'pick' && G.stT > 16) toAsk();        // えらばなくても すすむ
    if (st === 'picked' && G.stT > 2.2) toAsk();     // ねんのため（とまらない）
    if (st === 'ask') {
      if (G.stT > 9 && !G.said.hint) { G.said.hint = 1; K.say(mic.state === 'ok' ? 'あかい ボタンを おしたまま、おはなし してね' : 'みほんの ボタンを おしてね'); }
    }
    if (st === 'rec') {
      const el = (performance.now() - rec.t0) / 1000;
      if (el >= 5) stopRec();
    }
    if ((st === 'play' || st === 'sample') && G.stT > G.playEnd) {
      if (st === 'play') toPraise(); else { setState('ask'); G.stT = 3; }
    }
    // じぶんの こえが とれた ときは、とりなおす じかんを すこし ながく とる
    if (st === 'praise' && G.stT > (G.canRedo ? 4.6 : 2.4)) {
      // さいしょの えきの あとで、ドアの ほうそうも ろくおんして もらう
      if (!G.praiseDoor && G.idx === 0 && !G.doorRec && mic.state === 'ok') toAskDoor();
      else toArrive();
    }
    if (st === 'proc' && G.stT > 4) gotVoice(null);   // 念のため（止まらない）
    if (st === 'finale') updateFinale();
    K.runSound(dt, G.speed / 300);
  }

  // ---- さいごの しゃないほうそう ----
  function toFinale() {
    setState('finale'); releaseMic();
    G.fin = { j: -1, next: 2.6, done: false };
    K.say('きょうの しゃないほうそう を きいてみよう');
  }
  function updateFinale() {
    const f = G.fin;
    if (f.done) { if (G.stT > f.next) K.reward(GAME, 'すてきな ほうそう だったね', again); return; }
    if (G.stT < f.next) return;
    f.j++;
    if (f.j >= STATIONS.length) { f.done = true; f.next = G.stT + 1.0; K.sfx.good(); return; }
    const s = STATIONS[f.j], v = G.recs[f.j];
    K.sfx.dingdong();
    let d;
    if (v) d = playVoice(v, 1.5); else { setTimeout(() => K.say(sampleText(s)), 1400); d = sampleText(s).length * 0.16; }
    f.next = G.stT + 1.5 + d + FIN_GAP;
  }
  function again() { newGame(); requestMic(); scene(); }

  // ---- 入力 ----
  function hitMic(p) { return Math.hypot(p.x - MICX, p.y - MICY) < MICR + 16; }
  const inR = (p, r) => p.x > r.x - 10 && p.x < r.x + r.w + 10 && p.y > r.y - 10 && p.y < r.y + r.h + 10;
  function onDown(p) {
    if (!G) return;
    if (G.st === 'ask' && mic.state === 'ok' && hitMic(p)) { if (startRec()) setState('rec'); return; }
    if (G.st === 'ask' && mic.state === 'pending' && hitMic(p)) { K.sfx.pop(); return; }
    if (G.st === 'rec' && rec.toggle && hitMic(p)) { stopRec(); }
  }
  function onUp() {
    if (!G || G.st !== 'rec' || !rec.held) return;
    rec.held = false;
    if (performance.now() - rec.t0 < 400) rec.toggle = true;   // ちょんと押しただけ → もう一度押すまで録る
    else stopRec();
  }

  // ---- 画面 ----
  const RX0 = 330, RX1 = 1000, RY = 48;
  function sxOfStation(i) { return i < 0 ? RX0 - 50 : RX0 + (RX1 - RX0) * i / (STATIONS.length - 1); }
  function routeBar() {
    const x0 = RX0, x1 = RX1, y = RY;
    const picking = G.st === 'pick' || G.st === 'picked';
    K.panel(x0 - 56, y - 36, x1 - x0 + 112, 76);
    ctx.fillStyle = '#4a5468'; ctx.fillRect(x0, y - 3, x1 - x0, 6);
    STATIONS.forEach((s, i) => {
      const x = sxOfStation(i), done = i < G.idx || (i === G.idx && (G.st === 'doors' || G.st === 'finale'));
      const wrong = G.wrong === i && picking;
      K.circle(x, y, picking ? 26 : 22, done ? K.C.yellow : '#f0ead8', wrong ? K.C.red : s.col, 4);
      animal(s.animal, x, y + 2, 16);
      if (picking) {
        // ここを おすと えらべる
        const sv = ctx.globalAlpha; ctx.globalAlpha = 0;
        K.button(x - 34, y - 34, 68, 68, '', '#ffffff', () => pickStation(i));
        ctx.globalAlpha = sv;
      }
    });
    const sxOf = sxOfStation;
    const prog = { cruise: 0.15, pick: 0.2, picked: 0.25, ask: 0.3, sample: 0.3, rec: 0.35, proc: 0.4, play: 0.45, praise: 0.55, arrive: 0.75 + 0.25 * Math.min(1, G.stT / 3.6), doors: 1, finale: 1, depart: 1 }[G.st];
    const mx = sxOf(G.idx - 1) + (sxOf(G.idx) - sxOf(G.idx - 1)) * (prog == null ? 0.5 : prog);
    K.rr(mx - 16, y - 46, 32, 20, 6, TRAIN.color, '#fff', 2);
  }
  function panel(t) {
    const st = G.st, s = cur();
    const px = 230, py = 104, pw = 900, ph = 170;
    if (st === 'ask' || st === 'sample') {
      const dr = askingDoor();
      K.rr(px, py, pw, ph, 30, 'rgba(255,255,255,0.95)', dr ? K.C.purple : s.col, 6);
      if (dr) {
        K.rr(px + 56, py + 28, 78, ph - 56, 10, '#e8ecf4', K.C.purple, 5);
        K.rr(px + 60, py + 40, 34, 46, 6, '#cfefff'); K.rr(px + 98, py + 40, 32, 46, 6, '#cfefff');
        K.text('ドアが しまります', px + 190, py + 58, 56, K.C.ink, 'left', null);
      } else {
        K.circle(px + 95, py + ph / 2, 66, '#fff7fb', s.col, 4); animal(s.animal, px + 95, py + ph / 2 + 4, 52);
        K.text(`つぎは ${s.name}`, px + 190, py + 58, 60, K.C.ink, 'left', null);
      }
      K.text(mic.state === 'ng' ? 'みほんを ながして いっしょに いおう' : '…って いってみよう', px + 196, py + 128, 38, K.C.red, 'left', null);
    } else if (st === 'rec') {
      K.rr(px, py, pw, ph, 30, 'rgba(255,255,255,0.95)', K.C.red, 6);
      const lv = micLevel();
      K.circle(px + 80, py + 58, 14 + Math.sin(t * 8) * 3, K.C.red);
      K.text('きいてるよ…', px + 110, py + 58, 52, K.C.red, 'left', null);
      for (let i = 0; i < 16; i++) { const h = 10 + lv * 70 * (0.5 + 0.5 * Math.abs(Math.sin(t * 13 + i * 1.7))); K.rr(px + 470 + i * 26, py + 60 - h / 2, 16, h, 6, i / 16 < lv * 1.2 ? '#ff6b6b' : '#ffd0d0'); }
      K.text(rec.toggle ? 'いいおわったら もういちど おしてね' : (askingDoor() ? 'ドアが しまります' : `つぎは ${s.name}`), px + pw / 2, py + 130, 38, K.C.ink, 'center', null);
    } else if (st === 'proc' || st === 'play') {
      K.rr(px, py, pw, ph, 30, 'rgba(255,255,255,0.95)', K.C.purple, 6);
      speaker(px + 110, py + ph / 2, 1.2, t, st === 'play');
      K.text(st === 'proc' ? 'ほうそう じゅんび ちゅう…' : 'しゃないほうそう ちゅう', px + 520, py + ph / 2, 52, K.C.purple, 'center', null);
    } else if (st === 'praise') {
      K.rr(px, py, pw, ph, 30, '#fff7c7', K.C.yellow, 8);
      const parts = G.praise.split(' ');
      K.text(parts[0], px + pw / 2, py + 56, 60, K.C.red, 'center', '#fff');
      K.text(parts.slice(1).join(' '), px + pw / 2, py + 126, 42, K.C.ink, 'center', null);
      K.star(px + 60, py + 50, 30, K.C.yellow); K.star(px + pw - 60, py + 50, 30, K.C.yellow);
    } else if (st === 'pick' || st === 'picked') {
      K.rr(px + 90, py, pw - 180, 100, 16, 'rgba(255,255,255,0.95)', K.C.blue, 4);
      K.text(st === 'picked' ? 'そう！ つぎは ' + s.name : 'つぎは どの えき？', px + pw / 2, py + 50, 46, K.C.ink, 'center', null);
      if (st === 'pick') K.text('うえの ろせんずから えらんでね', px + pw / 2, py + 128, 32, K.C.sub, 'center', '#fff');
    } else if (st === 'doors') {
      K.rr(px + 150, py, pw - 300, 90, 30, 'rgba(255,255,255,0.92)', s.col, 5);
      K.text(`${s.name} に つきました`, px + pw / 2, py + 46, 46, K.C.ink, 'center', null);
    }
  }
  function controls(t) {
    const st = G.st;
    if (st === 'ask' || st === 'sample') {
      if (mic.state === 'ng') {
        K.button(SAMPLE_BIG.x, SAMPLE_BIG.y, SAMPLE_BIG.w, SAMPLE_BIG.h, 'みほんを ながす', K.C.blue, () => { if (G.st === 'ask') playSample(true); }, { size: 40 });
      } else {
        micButton(MICX, MICY, MICR, false, 0, 0, t);
        if (mic.state === 'pending') K.text('じゅんび ちゅう', MICX, MICY - MICR - 30, 30, K.C.sub, 'center');
        else K.text('おしながら はなしてね', MICX + 60, MICY - MICR - 34, 32, K.C.red, 'right', '#fff');
        drawFxPicker(t);
        K.button(SAMPLE.x - 20, SAMPLE.y + 10, SAMPLE.w - 20, SAMPLE.h, 'みほん', K.C.blue, () => { if (G.st === 'ask') playSample(false); }, { size: 36 });
        if (G.st === 'ask' && G.stT > 14) K.button(640, 600, 180, 100, 'すすむ', K.C.green, () => { if (G.st === 'ask') playSample(true); }, { size: 36 });
      }
    } else if (st === 'rec') {
      const el = (performance.now() - rec.t0) / 1000;
      micButton(MICX, MICY, MICR, true, micLevel(), Math.min(1, el / 5), t);
    } else if (st === 'praise' && G.canRedo) {
      // いいなおしたい ときは もういちど（うまく いえなくても やりなおせる）
      K.button(930, 540, 280, 110, 'もういちど', K.C.orange, () => { if (G.st === 'praise') (G.praiseDoor ? toAskDoor() : toAsk()); }, { size: 42 });
    }
  }
  // こえを かえる えらびボタン
  function drawFxPicker(t) {
    K.rr(40, 530, 536, 156, 28, 'rgba(255,255,255,0.82)');
    K.text('こえを かえる', 60, 556, 28, K.C.ink, 'left', null);
    for (let i = 0; i < FX.length; i++) {
      const x = 56 + i * 172, y = 580, w = 156, h = 92, on = fxPick === i;
      if (on) K.rr(x - 6, y - 6, w + 12, h + 12, 26, null, K.C.yellow, 6);
      K.button(x, y, w, h, FX[i].name, on ? K.C.red : K.C.sub, () => {
        if (fxPick === i) return;
        setFx(i); K.sfx.pop();
        const last = G.recs[G.idx] || G.doorRec;
        if (last) playVoice(last, 0.1); else K.say(FX[i].say);
      }, { size: 32 });
    }
  }
  function drawFinale(t) {
    const f = G.fin;
    K.rr(80, 96, 1120, 330, 34, 'rgba(255,255,255,0.95)', K.C.purple, 6);
    K.text('きょうの しゃないほうそう', W / 2, 150, 54, K.C.purple, 'center', null);
    const cw = 240, gap = 22, x0 = W / 2 - (cw * 4 + gap * 3) / 2;
    STATIONS.forEach((s, i) => {
      const on = i === f.j && !f.done, x = x0 + i * (cw + gap), y = 200 - (on ? 8 + Math.sin(t * 10) * 4 : 0);
      K.rr(x, y, cw, 200, 22, on ? '#fff7c7' : '#f6f7fb', on ? K.C.yellow : s.col, on ? 9 : 4);
      animal(s.animal, x + cw / 2, y + 88, 46);
      K.text(s.name, x + cw / 2, y + 160, 34, K.C.ink, 'center', null);
      if (i < f.j || f.done) K.star(x + cw - 26, y + 26, 20, K.C.yellow);
      if (on) speaker(x + 32, y + 30, 0.45, t, true);
    });
  }
  function draw(t, dt) {
    scenery(G.pos, t);
    const sx = G.stationPos - G.pos + HEADX;
    const showSt = (G.st === 'arrive' || G.st === 'doors' || G.st === 'depart') && sx > -300 && sx < W + 800;
    const s = cur();
    if (showSt) stationBack(s, sx);
    const bob = G.speed > 0 ? Math.sin(t * 18) * 1.5 : 0;
    K.trainSide(HEADX, TRY, { ...TRAIN, bob });
    let open = 0;
    if (G.st === 'doors') { const dc = 3.7 + (G.annLen || 0); open = G.stT < 0.6 ? G.stT / 0.6 : G.stT < dc ? 1 : Math.max(0, 1 - (G.stT - dc) / 0.5); }
    doors(open);
    if (showSt) stationFront(sx);
    if (showSt) drawPeople(sx);
    if (G.st !== 'finale') { routeBar(); panel(t); controls(t); }
    else drawFinale(t);
    K.homeButton();
  }
  function drawPeople(sx) {
    const feet = TRY + 100, d = G.st === 'doors' ? G.stT : -1;
    for (const p of G.people) {
      let x, y = feet, a = 1, hop = 0;
      if (p.type === 'on') {
        x = sx + p.rel;
        if (d >= 0) {
          const u1 = Math.min(1, Math.max(0, (d - 1.7 - p.d) / 0.8)), u2 = Math.min(1, Math.max(0, (d - 2.5 - p.d) / 0.5));
          x = x + (p.door - x) * u1; y = feet - 70 * u2; a = 1 - u2; hop = Math.abs(Math.sin(u1 * Math.PI * 3)) * 8 * (u1 < 1 ? 1 : 0);
        }
      } else {
        if (d < 0.6 + p.d) continue;
        const u1 = Math.min(1, (d - 0.6 - p.d) / 0.4), u2 = Math.max(0, d - 1.0 - p.d);
        x = p.door + p.dir * u2 * 260; y = feet - 70 * (1 - u1); a = u1; hop = Math.abs(Math.sin(u2 * 9)) * 8;
      }
      if (a <= 0.01) continue;
      ctx.save(); ctx.globalAlpha = a; K.person(x, y, { color: p.color, hat: p.hat, hop, scale: 0.8 }); ctx.restore();
    }
  }

  function scene() {
    K.handlers.down = onDown; K.handlers.up = onUp; K.handlers.move = null;
    K.scene = { update, draw };
  }
  K.title(GAME, 'あかい マイクで しゃないほうそう を しよう', K.C.purple, () => { newGame(); requestMic(); scene(); });
})();
