// 方向性A：冒険の地図 — 1日ごとに道が延び、暮らし方で島の形が変わる
function drawMap(cv, D, seed) {
  const c = cv.getContext('2d'), W = cv.width, H = cv.height, r = rng(seed);
  c.fillStyle = '#f2e8d5'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 1400; i++) { c.fillStyle = `rgba(120,90,50,${r() * .05})`; c.fillRect(r() * W, r() * H, 2, 2); } // 紙のしみ
  // 歩く：出かける日は遠くまっすぐ、休む日はぐるっと回る、仕事の日は職場と行き来する
  let x = 0, y = 0, h = r() * Math.PI * 2; const pts = [{ x, y, e: null }], office = { x: 40, y: -20 };
  D.forEach(e => {
    const has = t => e.tags.includes(t);
    let step = 5 + (has('out') ? 16 : 0) + (has('move') ? 6 : 0) - (has('rest') ? 2 : 0);
    if (has('work') && !has('out')) { h = Math.atan2(office.y - y, office.x - x) + (r() - .5) * .8; step = Math.min(step, 9); }
    else if (has('rest')) h += .7 + r() * .4;
    else h += (r() - .5) * (has('out') ? .5 : 1.4);
    x += Math.cos(h) * step; y += Math.sin(h) * step; pts.push({ x, y, e });
  });
  // 画面に収める
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y), pad = 54;
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
  const s = Math.min((W - pad * 2) / Math.max(60, maxx - minx), (H - pad * 2 - 40) / Math.max(60, maxy - miny));
  const P = p => [W / 2 + (p.x - (minx + maxx) / 2) * s, 20 + H / 2 + (p.y - (miny + maxy) / 2) * s];
  // 島：歩いた場所のまわりが陸になる（気分が良い日ほど陸が広い）
  const blobs = pts.map(p => [...P(p), (p.e ? 10 + p.e.mood * 4 : 16) * Math.max(.6, Math.min(1.3, s))]);
  c.fillStyle = '#3d3226'; blobs.forEach(([bx, by, br]) => { c.beginPath(); c.arc(bx, by, br + 2.5, 0, 7); c.fill(); });
  c.fillStyle = '#efe0bf'; blobs.forEach(([bx, by, br]) => { c.beginPath(); c.arc(bx, by, br, 0, 7); c.fill(); });
  // 海の波線
  c.strokeStyle = 'rgba(61,50,38,.35)'; c.lineWidth = 1;
  for (let i = 0; i < 40; i++) { const wx = r() * W, wy = r() * H; if (blobs.some(([bx, by, br]) => Math.hypot(wx - bx, wy - by) < br + 14)) continue; c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + 4, wy - 3, wx + 8, wy); c.quadraticCurveTo(wx + 12, wy + 3, wx + 16, wy); c.stroke(); }
  // 道：手描きのような揺れる点線
  c.strokeStyle = '#8a2f22'; c.lineWidth = 1.6; c.setLineDash([4, 3]); c.beginPath();
  pts.forEach((p, i) => { const [px, py] = P(p); const jx = px + (r() - .5) * 1.5, jy = py + (r() - .5) * 1.5; i ? c.lineTo(jx, jy) : c.moveTo(jx, jy); }); c.stroke(); c.setLineDash([]);
  // 目印：その日にしたことの記号
  const ink = '#3d3226';
  pts.forEach((p, i) => { if (!p.e || i % 3) return; const [px, py] = P(p), t = p.e.tags;
    c.strokeStyle = ink; c.fillStyle = ink; c.lineWidth = 1.2;
    if (t.includes('out') || t.includes('move')) { c.beginPath(); c.moveTo(px - 6, py + 4); c.lineTo(px, py - 6); c.lineTo(px + 6, py + 4); c.stroke(); }
    else if (t.includes('cook') || t.includes('rest')) { c.strokeRect(px - 4, py - 3, 8, 7); c.beginPath(); c.moveTo(px - 5, py - 3); c.lineTo(px, py - 8); c.lineTo(px + 5, py - 3); c.stroke(); }
    else if (t.includes('work')) { c.strokeRect(px - 3, py - 8, 6, 12); c.fillRect(px - 1, py - 6, 2, 2); }
    else if (t.includes('make') || t.includes('learn')) { c.beginPath(); c.arc(px, py, 3.5, 0, 7); c.stroke(); }
  });
  // 地名：よく書く言葉が、その言葉が一番出た場所の名前になる
  const suf = { out: '岬', move: '峠', work: '街', cook: '村', rest: 'の森', meet: '広場', make: '工房', learn: '塔', early: '丘' };
  c.font = '600 12px "Hiragino Mincho ProN", serif'; c.textAlign = 'center';
  const placed = []; // 近すぎる地名は出さない
  wordFreq(D).slice(0, 6).forEach(([w]) => {
    const hit = pts.filter(p => p.e && p.e.words.includes(w)); const p = hit[Math.floor(hit.length / 2)]; if (!p) return;
    const tag = p.e.tags[0] || 'rest', [px, py] = P(p), name = w + (suf[tag] || '');
    if (placed.some(([qx, qy]) => Math.abs(qx - px) < 70 && Math.abs(qy - py) < 20)) return; placed.push([px, py]);
    c.fillStyle = 'rgba(242,232,213,.85)'; const tw = c.measureText(name).width; c.fillRect(px - tw / 2 - 3, py - 22, tw + 6, 15);
    c.fillStyle = ink; c.fillText(name, px, py - 10);
  });
  // 今日の位置・方位・題
  const [lx, ly] = P(pts[pts.length - 1]); c.fillStyle = '#c0392b'; c.beginPath(); c.arc(lx, ly, 4, 0, 7); c.fill();
  c.strokeStyle = ink; c.lineWidth = 1; c.beginPath(); c.moveTo(W - 30, 30); c.lineTo(W - 30, 56); c.moveTo(W - 42, 43); c.lineTo(W - 18, 43); c.stroke();
  c.font = '10px serif'; c.fillStyle = ink; c.fillText('N', W - 30, 26);
  c.font = '600 15px "Hiragino Mincho ProN", serif'; c.textAlign = 'left'; c.fillText(`${D.length}日分の地図`, 16, 26);
  c.strokeStyle = 'rgba(61,50,38,.6)'; c.strokeRect(6, 6, W - 12, H - 12);
}
