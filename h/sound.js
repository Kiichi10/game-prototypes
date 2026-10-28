// 効果音（ファイルを使わず、その場で合成）
const SND = (() => {
  let ac = null, on = true;
  const ctx = () => (ac ||= new (window.AudioContext || window.webkitAudioContext)());
  function noise(dur, freq, q, vol) {
    const c = ctx(), n = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = n; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol;
    s.connect(f).connect(g).connect(c.destination); s.start();
  }
  function tone(freq, dur, vol, type = 'sine', delay = 0, slide = 0) {
    const c = ctx(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  return {
    toggle: () => (on = !on),
    pick: () => on && noise(0.08, 3000, 1.2, 0.25),               // 紙をつまむ
    drop: () => on && noise(0.12, 1400, 0.8, 0.3),                // 紙を置く
    mix: () => on && (noise(0.35, 900, 0.6, 0.35), tone(220, 0.3, 0.05, 'triangle', 0, 1.5)), // 混ぜる
    found: () => on && [523, 659, 784].forEach((f, i) => tone(f, 0.35, 0.12, 'sine', i * 0.07)), // 新発見
    old: () => on && tone(440, 0.15, 0.08, 'sine'),               // もう持っている
    fail: () => on && tone(200, 0.25, 0.1, 'triangle', 0, 0.7),   // 何も起きない
    stamp: () => on && (tone(90, 0.25, 0.5, 'sine', 0.25, 0.5), setTimeout(() => noise(0.15, 500, 0.7, 0.6), 250)), // 判子
    fanfare: () => on && [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.7 : 0.18, 0.13, 'triangle', 0.5 + i * 0.11)),
  };
})();
