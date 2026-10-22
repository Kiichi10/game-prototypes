// 方向性C：日記から生まれる生き物 — 暮らし方で体の作りが変わる（ドット絵・左右対称を基本に）
function drawCreature(cv, D, seed, sprite = false) { // sprite=true：背景と文字なし（地図の上に置く用）
  const c = cv.getContext('2d'), W = cv.width, H = cv.height, r = rng(seed), N = 44, S = Math.max(1, Math.floor(Math.min(W, sprite ? H : H - 90) / N));
  const R = t => tagRate(D, t), mood = D.reduce((s, e) => s + e.mood, 0) / D.length;
  // 色の系統：いちばん多くしたことで決め、気分で少しずらす（人によって色がはっきり分かれるように）
  const BASE = { work: 215, cook: 28, rest: 95, out: 140, make: 275, meet: 335, move: 5, learn: 48, early: 160 };
  const top = Object.keys(BASE).sort((a, b) => R(b) - R(a))[0];
  const hue = (BASE[top] + (mood - 3.5) * 12 + 360) % 360;
  const col = (l, sat = 55) => `hsl(${hue},${sat}%,${l}%)`;
  const g = Array.from({ length: N }, () => Array(N).fill(null)), set = (x, y, v) => { if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = v; };
  const mir = (x, y, v) => { set(x, y, v); set(N - 1 - x, y, v); };
  const cx = N / 2 - .5, cy = 22;
  // 体：料理・休みで丸く大きく、仕事で角ばる
  const rx = 7 + R('cook') * 6 + R('rest') * 4, ry = 6 + R('rest') * 4 + R('cook') * 2, p = 2 + R('work') * 6;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = Math.abs(x - cx) / rx, dy = Math.abs(y - cy) / ry, fluff = R('rest') > .3 ? (r() - .5) * .25 : 0;
    if (Math.pow(dx, p) + Math.pow(dy, p) <= 1 + fluff) set(x, y, 'b');
  }
  // 脚：運動が多いほど長い
  const legLen = 2 + Math.round(R('move') * 12), legX = Math.round(cx - rx * .45), by = Math.round(cy + ry);
  for (let i = 0; i < legLen; i++) { mir(legX, by + i, 'd'); mir(legX + 1, by + i, 'd'); }
  mir(legX - 1, by + legLen, 'd'); mir(legX, by + legLen, 'd'); mir(legX + 1, by + legLen, 'd');
  // 翼：出かけることが多いと生える
  if (R('out') > .35) { const ws = Math.round(R('out') * 10); for (let i = 0; i < ws; i++) for (let j = 0; j <= i; j++) mir(Math.round(cx - rx) - 1 - j, Math.round(cy - 2) - (ws - i) + Math.floor(j / 2), 'w'); }
  // 角：学びが多いほど本数が増える
  const horns = Math.round(R('learn') * 6); for (let k = 0; k < horns; k++) { const hx = Math.round(cx - 1 - k * 2.2); for (let i = 0; i < 3 + (k % 2); i++) mir(hx - Math.floor(i / 2), Math.round(cy - ry) - i, 'h'); }
  // アンテナ：仕事が多いと付く
  if (R('work') > .5) { for (let i = 0; i < 6; i++) set(Math.round(cx), Math.round(cy - ry) - i - 1, 'd'); set(Math.round(cx), Math.round(cy - ry) - 7, 'a'); }
  // しっぽ：創作が多いと伸びる（しま模様）
  if (R('make') > .2) { const tl = Math.round(R('make') * 16); for (let i = 0; i < tl; i++) { set(Math.round(cx + rx) + i, Math.round(cy + 2 - Math.sin(i / 3) * 3), i % 3 ? 'b' : 'd'); set(Math.round(cx + rx) + i, Math.round(cy + 3 - Math.sin(i / 3) * 3), i % 3 ? 'b' : 'd'); } }
  // 模様：人に会うことが多いほど増える
  const spots = Math.round(R('meet') * 9); for (let k = 0; k < spots; k++) { const sx = Math.round(cx - rx * .7 + r() * rx * .6), sy = Math.round(cy - ry * .2 + r() * ry * .8); if (g[sy] && g[sy][sx] === 'b') { mir(sx, sy, 's'); mir(sx + 1, sy, 's'); } }
  // 目：早起きが多いと大きく光る
  const ey = Math.round(cy - ry * .25), ex = Math.round(cx - rx * .38), big = R('early') > .3;
  mir(ex, ey, 'e'); mir(ex, ey + 1, 'e'); if (big) { mir(ex + 1, ey, 'e'); mir(ex + 1, ey + 1, 'e'); mir(ex + 1, ey, 'l'); }
  set(Math.round(cx), ey + 3, 'm'); set(Math.round(cx) - 1, ey + 3, 'm');
  // 描く：背景・輪郭・色
  if (!sprite) { c.fillStyle = `hsl(${hue},30%,95%)`; c.fillRect(0, 0, W, H); }
  const pal = { b: col(62), d: col(36), w: col(78, 40), h: '#f2e3b3', a: '#e2483d', s: col(78), e: '#1d1b22', l: '#ffffff', m: '#1d1b22' };
  const ox = Math.floor((W - N * S) / 2), oy = sprite ? 0 : 34;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (g[y][x]) continue; const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => g[y + b] && g[y + b][x + a] && !'eml'.includes(g[y + b][x + a])); if (nb) { c.fillStyle = col(22, 40); c.fillRect(ox + x * S, oy + y * S, S, S); } }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const v = g[y][x]; if (!v) continue; c.fillStyle = pal[v]; c.fillRect(ox + x * S, oy + y * S, S, S); }
  c.fillStyle = 'rgba(0,0,0,.08)'; c.beginPath(); c.ellipse(W / 2, oy + (by + legLen + 2) * S, rx * S * .9, 5, 0, 0, 7); c.fill();
  if (sprite) return;
  // 名前と特徴
  const name = wordFreq(D)[0][0] + 'の子';
  c.fillStyle = '#2a2730'; c.font = '700 18px "Hiragino Mincho ProN", serif'; c.textAlign = 'center'; c.fillText(name, W / 2, H - 46);
  const feats = [['move', '脚'], ['out', '翼'], ['learn', '角'], ['meet', '模様'], ['make', 'しっぽ'], ['work', 'アンテナ']].filter(([t]) => R(t) > .3).map(([, n]) => n);
  c.font = '11px sans-serif'; c.fillStyle = '#6b6672'; c.fillText(feats.length ? feats.join('・') + 'が育った' : 'まるくて、のんびり', W / 2, H - 26);
  c.textAlign = 'left'; c.font = '600 15px "Hiragino Mincho ProN", serif'; c.fillStyle = '#2a2730'; c.fillText(`${D.length}日分の日記から生まれた`, 16, 26);
}

// 地図に置く用：透明な背景に生き物だけを描いたキャンバスを返す
function creatureSprite(D, seed, px = 2) {
  const cv = document.createElement('canvas'); cv.width = 44 * px; cv.height = 44 * px + 50 * 0; drawCreature(cv, D, seed, true); return cv;
}
