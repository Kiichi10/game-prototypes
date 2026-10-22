// 方向性A改：よく行く場所＝町、町と町を道でつなぐ地図。今日いる町に生き物が立つ
function drawMap2(cv, D, seed) {
  const c = cv.getContext('2d'), W = cv.width, H = cv.height, r = rng(seed);
  // 1) 歩く（暮らし方で歩き方が変わる：前の版と同じ考え方）
  let x = 0, y = 0, h = r() * Math.PI * 2; const pts = [], office = { x: 40, y: -20 };
  D.forEach(e => {
    const has = t => e.tags.includes(t);
    let step = 5 + (has('out') ? 16 : 0) + (has('move') ? 6 : 0) - (has('rest') ? 2 : 0);
    if (has('work') && !has('out')) { h = Math.atan2(office.y - y, office.x - x) + (r() - .5) * .8; step = Math.min(step, 9); }
    else if (has('rest')) h += .7 + r() * .4; else h += (r() - .5) * (has('out') ? .5 : 1.4);
    x += Math.cos(h) * step; y += Math.sin(h) * step; pts.push({ x, y, e });
  });
  // 2) 近い日をまとめて「町」にする
  const G = 16, cells = {};
  pts.forEach(p => { const k = Math.round(p.x / G) + ',' + Math.round(p.y / G); (cells[k] ||= []).push(p); p.k = k; });
  const towns = Object.entries(cells).map(([k, ps]) => {
    const tags = {}, words = {}; ps.forEach(p => { p.e.tags.forEach(t => tags[t] = (tags[t] || 0) + 1); p.e.words.forEach(w => words[w] = (words[w] || 0) + 1); });
    const top = o => Object.entries(o).sort((a, b) => b[1] - a[1])[0];
    const ws = Object.entries(words).sort((a, b) => b[1] - a[1]).map(x => x[0]);
    return { k, n: ps.length, x: ps.reduce((s, p) => s + p.x, 0) / ps.length, y: ps.reduce((s, p) => s + p.y, 0) / ps.length, tag: (top(tags) || ['rest'])[0], words: ws };
  });
  const T = Object.fromEntries(towns.map(t => [t.k, t]));
  // 3) 町と町の行き来（道の太さ＝回数）
  const edges = {}; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1].k, b = pts[i].k; if (a === b) continue; const k = a < b ? a + '|' + b : b + '|' + a; edges[k] = (edges[k] || 0) + 1; }
  // 4) 画面に収める（上下に文字と操作の場所を空ける）
  const top = 64, bottom = H - 70, pad = 70; // 陸が町のまわりに広がる分、余白を広めに
  const xs = towns.map(t => t.x), ys = towns.map(t => t.y), minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
  const s = Math.min((W - pad * 2) / Math.max(40, maxx - minx), (bottom - top - pad * 2) / Math.max(40, maxy - miny));
  const P = t => [W / 2 + (t.x - (minx + maxx) / 2) * s, (top + bottom) / 2 + (t.y - (miny + maxy) / 2) * s];
  towns.forEach(t => [t.px, t.py] = P(t));
  // 5) 陸地：町のまわりに滑らかに広がる（よく行く町ほど広い）
  const R2 = 2, FW = Math.ceil(W / R2), FH = Math.ceil(H / R2), f = new Float32Array(FW * FH), sig = Math.max(16, Math.min(30, s * 9));
  towns.forEach(t => { const w = .55 + .45 * Math.log2(1 + t.n), x0 = Math.max(0, Math.floor((t.px - sig * 3) / R2)), x1 = Math.min(FW - 1, Math.ceil((t.px + sig * 3) / R2)), y0 = Math.max(0, Math.floor((t.py - sig * 3) / R2)), y1 = Math.min(FH - 1, Math.ceil((t.py + sig * 3) / R2));
    for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) { const dx = i * R2 - t.px, dy = j * R2 - t.py; f[j * FW + i] += w * Math.exp(-(dx * dx + dy * dy) / (2 * sig * sig)); } });
  const img = c.createImageData(W, H), TH = .5, at = (i, j) => f[Math.min(FH - 1, j) * FW + Math.min(FW - 1, i)];
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const i = px / R2 | 0, j = py / R2 | 0, v = at(i, j), o = (py * W + px) * 4;
    let col;
    const edge = (lv) => v >= lv && (at(i + 1, j) < lv || at(i, j + 1) < lv || at(i - 1 < 0 ? 0 : i - 1, j) < lv || at(i, j - 1 < 0 ? 0 : j - 1) < lv);
    if (v < TH) { const n = (r() * 6) | 0; col = v > .32 ? [222 - n, 215 - n, 196 - n] : [231 - n, 226 - n, 211 - n]; } // 海（岸に近いほど少し濃い）
    else if (edge(TH)) col = [70, 56, 40]; // 海岸線
    else if (edge(1.15) || edge(1.9)) col = [176, 150, 108]; // 等高線
    else { const k = Math.min(1, (v - TH) / 1.6), n = (r() * 5) | 0; col = [242 - k * 22 - n, 230 - k * 30 - n, 200 - k * 48 - n]; } // 陸（内陸ほど濃い）
    img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  // 6) 道：よく通るほど太い。直近7日は赤い点線
  const curve = (a, b, wd, color, dash) => { const mx = (a.px + b.px) / 2, my = (a.py + b.py) / 2, nx = -(b.py - a.py) * .12, ny = (b.px - a.px) * .12;
    c.strokeStyle = color; c.lineWidth = wd; c.setLineDash(dash || []); c.lineCap = 'round'; c.beginPath(); c.moveTo(a.px, a.py); c.quadraticCurveTo(mx + nx, my + ny, b.px, b.py); c.stroke(); c.setLineDash([]); };
  Object.entries(edges).sort((a, b) => a[1] - b[1]).forEach(([k, n]) => { const [a, b] = k.split('|').map(q => T[q]); const wd = 1.2 + Math.log2(n) * 1.3; curve(a, b, wd + 2.4, 'rgba(250,244,228,.9)'); curve(a, b, wd, '#8a6a45'); });
  const last = pts.slice(-8).map(p => T[p.k]); for (let i = 1; i < last.length; i++) if (last[i] !== last[i - 1]) curve(last[i - 1], last[i], 2, '#c0392b', [5, 4]);
  // 7) 町の記号：その町でいちばん多くしたこと
  const ink = '#3d3226';
  const icon = (t) => { const z = 6 + Math.min(6, Math.log2(1 + t.n) * 2.2), X = t.px, Y = t.py; c.lineWidth = 1.4; c.strokeStyle = ink;
    const roof = (cx, cy, w, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(cx - w, cy); c.lineTo(cx, cy - w * .9); c.lineTo(cx + w, cy); c.closePath(); c.fill(); c.stroke(); };
    if (t.tag === 'work') { [[-z * .7, z * 1.4], [z * .3, z * 2]].forEach(([dx, hh]) => { c.fillStyle = '#d9d2c3'; c.fillRect(X + dx, Y - hh, z * .9, hh); c.strokeRect(X + dx, Y - hh, z * .9, hh); }); }
    else if (t.tag === 'out' || t.tag === 'move') { c.fillStyle = '#b9a07a'; c.beginPath(); c.moveTo(X - z * 1.4, Y); c.lineTo(X - z * .2, Y - z * 1.8); c.lineTo(X + z * .6, Y - z * .6); c.lineTo(X + z * 1.3, Y - z * 1.3); c.lineTo(X + z * 2, Y); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(X - z * .55, Y - z * 1.35); c.lineTo(X - z * .2, Y - z * 1.8); c.lineTo(X + z * .15, Y - z * 1.35); c.fill(); }
    else if (t.tag === 'rest') { [[-z * .6, 0], [z * .5, -z * .3]].forEach(([dx, dy]) => { c.fillStyle = '#7f9a5e'; c.beginPath(); c.arc(X + dx, Y - z + dy, z * .75, 0, 7); c.fill(); c.stroke(); c.fillStyle = ink; c.fillRect(X + dx - 1, Y - z * .3 + dy, 2, z * .4); }); }
    else if (t.tag === 'learn') { c.fillStyle = '#e7dcc6'; c.fillRect(X - z * .45, Y - z * 2, z * .9, z * 2); c.strokeRect(X - z * .45, Y - z * 2, z * .9, z * 2); roof(X, Y - z * 2, z * .6, '#a5543f'); }
    else if (t.tag === 'make') { c.fillStyle = '#e7dcc6'; c.fillRect(X - z, Y - z, z * 2, z); c.strokeRect(X - z, Y - z, z * 2, z); c.beginPath(); c.moveTo(X + z * .6, Y - z); c.lineTo(X + z * .6, Y - z * 2.2); c.stroke(); c.fillStyle = '#c0392b'; c.beginPath(); c.moveTo(X + z * .6, Y - z * 2.2); c.lineTo(X + z * 1.5, Y - z * 1.9); c.lineTo(X + z * .6, Y - z * 1.6); c.fill(); }
    else if (t.tag === 'meet') { c.fillStyle = '#d9cdb4'; c.beginPath(); c.ellipse(X, Y - z * .35, z * 1.2, z * .55, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#7fb3c9'; c.beginPath(); c.ellipse(X, Y - z * .4, z * .85, z * .32, 0, 0, 7); c.fill(); c.strokeStyle = '#7fb3c9'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(X, Y - z * .5); c.quadraticCurveTo(X - z * .5, Y - z * 1.6, X - z * .7, Y - z * .7); c.moveTo(X, Y - z * .5); c.quadraticCurveTo(X + z * .5, Y - z * 1.6, X + z * .7, Y - z * .7); c.stroke(); c.strokeStyle = ink; }
    else { c.fillStyle = '#efe6d2'; c.fillRect(X - z * .8, Y - z, z * 1.6, z); c.strokeRect(X - z * .8, Y - z, z * 1.6, z); roof(X, Y - z, z, '#a5543f'); if (t.tag === 'cook') { c.fillStyle = 'rgba(90,80,70,.3)'; c.beginPath(); c.arc(X + z * .5, Y - z * 2.1, 2.5, 0, 7); c.arc(X + z * .9, Y - z * 2.6, 3.2, 0, 7); c.fill(); } }
  };
  const big = towns.slice().sort((a, b) => b.n - a.n);
  big.slice(0, 14).forEach(icon);
  // 8) 地名：大きい町から、重ならないように
  const suf = { out: '岬', move: '峠', work: '街', cook: '村', rest: 'の森', meet: '広場', make: '工房', learn: '塔', early: '丘' };
  const placed = []; c.font = '700 12.5px "Hiragino Mincho ProN", serif'; c.textAlign = 'center';
  const now0 = T[pts[pts.length - 1].k], used = new Set(); placed.push([now0.px, now0.py - 40, 60]); // 生き物の場所には地名を置かない
  big.slice(0, 9).forEach(t => { const w = t.words.find(x => !used.has(x)); if (!w) return; const name = w + (suf[t.tag] || ''), tw = c.measureText(name).width, lx = t.px, ly = t.py + 16;
    if (placed.some(([qx, qy, qw]) => Math.abs(qx - lx) < (qw + tw) / 2 + 6 && Math.abs(qy - ly) < (qw === 60 ? 46 : 18))) return; placed.push([lx, ly, tw]); used.add(w);
    c.fillStyle = 'rgba(255,250,238,.92)'; c.beginPath(); c.roundRect(lx - tw / 2 - 6, ly - 12, tw + 12, 17, 8); c.fill(); c.strokeStyle = 'rgba(61,50,38,.35)'; c.lineWidth = 1; c.stroke();
    c.fillStyle = ink; c.fillText(name, lx, ly + 1); });
  // 9) 今日いる町に、あなたの生き物
  const now = T[pts[pts.length - 1].k], sp = creatureSprite(D, seed, 2);
  c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(now.px, now.py - 2, 16, 4, 0, 0, 7); c.fill();
  c.imageSmoothingEnabled = false; c.drawImage(sp, now.px - sp.width / 2, now.py - sp.height + 6);
  c.fillStyle = '#c0392b'; c.font = '700 10px sans-serif'; c.fillText('今日はここ', now.px, now.py - sp.height + 2);
  // 10) 題と枠
  c.fillStyle = ink; c.textAlign = 'left'; c.font = '700 16px "Hiragino Mincho ProN", serif'; c.fillText(`${wordFreq(D)[0][0]}の子の地図`, 18, 32);
  c.font = '11px sans-serif'; c.fillStyle = '#7a6a55'; c.fillText(`${D.length}日 · 町 ${towns.length} · 道 ${Object.keys(edges).length}本`, 18, 50);
  c.strokeStyle = 'rgba(61,50,38,.5)'; c.lineWidth = 1; c.strokeRect(6.5, 6.5, W - 13, H - 13);
}
