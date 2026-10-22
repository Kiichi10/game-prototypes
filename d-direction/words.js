// 方向性B：言葉で建つ町 — よく書く言葉が縦書き看板のビルになる。書いた回数が多いほど高い
function drawWords(cv, D, seed) {
  const c = cv.getContext('2d'), W = cv.width, H = cv.height, r = rng(seed), ink = '#22201c', paper = '#f4efe4', accent = '#d6452f';
  const mood = D.reduce((s, e) => s + e.mood, 0) / D.length; // 気分が良いほど空が明るい
  const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, mood > 3.6 ? '#f7e9cf' : '#e6e1d6'); sky.addColorStop(1, paper);
  c.fillStyle = sky; c.fillRect(0, 0, W, H);
  c.fillStyle = mood > 3.6 ? accent : '#9c958a'; c.beginPath(); c.arc(W - 70, 78, 22, 0, 7); c.fill(); // 太陽／月
  const ground = H - 70, F = wordFreq(D).slice(0, 8), maxF = F[0][1];
  // 高いビルを真ん中に寄せる並び
  const order = []; F.forEach((f, i) => i % 2 ? order.push(f) : order.unshift(f));
  const widths = order.map(([w]) => 34 + (w.length > 3 ? 4 : 0)), gap = 4, total = widths.reduce((a, b) => a + b + gap, -gap);
  let x = (W - total) / 2;
  const rate = t => tagRate(D, t);
  order.forEach(([w, n], i) => {
    const bw = widths[i], bh = 70 + (n / maxF) * (ground - 150);
    const y = ground - bh;
    c.fillStyle = ink; c.fillRect(x, y, bw, bh);
    // 窓：気分の良い日の割合だけ灯る
    for (let wy = y + 8; wy < ground - 10; wy += 9) for (let wx = x + 4; wx < x + bw - 4; wx += 7) {
      c.fillStyle = r() < (mood - 1) / 5 ? '#f3c969' : '#3a3630'; c.fillRect(wx, wy, 3, 4);
    }
    // 縦書きの看板＝その言葉そのもの
    const ch = [...w], fs = Math.min(20, (bh - 24) / ch.length);
    c.fillStyle = paper; c.fillRect(x + bw / 2 - fs / 2 - 3, y + 6, fs + 6, fs * ch.length + 8);
    c.fillStyle = ink; c.font = `700 ${fs}px "Hiragino Mincho ProN", serif`; c.textAlign = 'center'; c.textBaseline = 'top';
    ch.forEach((k, j) => c.fillText(k === 'ー' ? '｜' : k, x + bw / 2, y + 10 + j * fs));
    // 屋上：暮らしの特徴
    const cx = x + bw / 2;
    if (rate('cook') > .3 && i % 2 === 0) { c.fillStyle = ink; c.fillRect(x + bw - 10, y - 12, 6, 12); c.fillStyle = 'rgba(80,70,60,.25)'; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x + bw - 7 + k * 4, y - 18 - k * 7, 4 + k, 0, 7); c.fill(); } }
    if (rate('out') > .3 && i % 2 === 1) { c.strokeStyle = ink; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx, y); c.lineTo(cx, y - 22); c.stroke(); c.fillStyle = accent; c.beginPath(); c.moveTo(cx, y - 22); c.lineTo(cx + 13, y - 18); c.lineTo(cx, y - 14); c.fill(); }
    if (rate('rest') > .3 && i % 3 === 0) { c.fillStyle = '#5f7a4e'; c.beginPath(); c.arc(cx - 6, y - 6, 7, 0, 7); c.arc(cx + 5, y - 8, 8, 0, 7); c.fill(); }
    if (rate('work') > .5 && i % 2 === 1) { c.strokeStyle = ink; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx, y); c.lineTo(cx, y - 30); c.stroke(); c.fillStyle = accent; c.beginPath(); c.arc(cx, y - 31, 2.5, 0, 7); c.fill(); }
    // 回数
    c.fillStyle = '#7b736a'; c.font = '10px sans-serif'; c.textBaseline = 'alphabetic'; c.fillText(n + '回', cx, ground + 14);
    x += bw + gap;
  });
  c.fillStyle = ink; c.fillRect(0, ground, W, 2);
  c.fillStyle = ink; c.font = '600 15px "Hiragino Mincho ProN", serif'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillText(`${D.length}日分の言葉で建った町`, 16, 28);
  c.font = '11px sans-serif'; c.fillStyle = '#7b736a'; c.fillText('いちばん高いビル：' + F[0][0], 16, H - 24);
  c.strokeStyle = 'rgba(34,32,28,.5)'; c.strokeRect(6, 6, W - 12, H - 12);
}
