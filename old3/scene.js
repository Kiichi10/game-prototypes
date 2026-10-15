// ドット絵の場面（192x108 を拡大表示）
const SW = 192, SH = 108, GROUND = 84;
const SKY = [['#2b2440', '#7a5a7a'], ['#1d2d4a', '#3f6a8a'], ['#2a1f2e', '#8a4f3a'], ['#141a26', '#3a4558']]; // 春夏秋冬の夕暮れ
const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };

function hash(n) { n = Math.sin(n * 127.1) * 43758.5453; return n - Math.floor(n); }

function drawScene(c, s, t, frame) {
  const season = Math.min(3, Math.floor(t * 4));
  // 空
  const [top, bot] = SKY[season];
  for (let y = 0; y < GROUND; y++) {
    const k = y / GROUND; c.fillStyle = mix(top, bot, k); c.fillRect(0, y, SW, 1);
  }
  for (let i = 0; i < 26; i++) { const x = hash(i) * SW, y = hash(i + 50) * 40; if ((frame + i * 7) % 90 > 4) R(c, x, y, 1, 1, '#d8d8ff'); }
  R(c, 160, 10, 6, 6, '#f4e7b8'); R(c, 162, 10, 4, 1, mix(top, bot, 0.1)); // 月
  if (s.rural) farRural(c, season); else farUrban(c, s.year);
  ground(c, s, season);
  tree(c, 168, GROUND, season);
  house(c, s);
  people(c, s, frame);
  particles(c, season, frame);
}

function mix(a, b, k) {
  const p = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)); const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
}
function farRural(c, season) {
  const col = season === 3 ? '#5a6577' : '#2c3a3a';
  for (let x = 0; x < SW; x++) {
    const h = 18 + Math.sin(x / 17) * 8 + Math.sin(x / 7 + 2) * 3;
    R(c, x, GROUND - h, 1, h, col);
    if (season === 3 && h > 22) R(c, x, GROUND - h, 1, 2, '#e8eef5');
  }
}
function farUrban(c, year) {
  const maxH = year < 1958 ? 12 : year < 1970 ? 26 : year < 1985 ? 40 : 54;
  let x = 0, i = 0;
  while (x < SW) {
    const w = 8 + Math.floor(hash(i) * 14), h = 6 + Math.floor(hash(i + 9) * maxH);
    R(c, x, GROUND - h, w - 1, h, '#232a36');
    for (let wy = GROUND - h + 2; wy < GROUND - 3; wy += 4) for (let wx = x + 2; wx < x + w - 3; wx += 3)
      if (hash(wx * 3 + wy) > 0.55) R(c, wx, wy, 1, 2, '#e8c66a');
    if (year >= 1958 && i === 3) { R(c, x + w / 2, GROUND - h - 30, 1, 30, '#c9483a'); R(c, x + w / 2 - 2, GROUND - h - 14, 5, 1, '#c9483a'); } // 東京タワー的な鉄塔
    x += w; i++;
  }
}
function ground(c, s, season) {
  if (s.rural) {
    const field = ['#3d6b6a', '#3f7a3a', '#b08a2e', '#dfe6ee'][season];
    R(c, 0, GROUND, SW, SH - GROUND, field);
    for (let y = GROUND + 3; y < SH; y += 4) R(c, 0, y, SW, 1, season === 3 ? '#c4ccd6' : '#2c4a2a');
    R(c, 0, GROUND + 9, SW, 5, '#6b5a45'); // あぜ道
  } else {
    R(c, 0, GROUND, SW, SH - GROUND, '#3a3d44');
    R(c, 0, GROUND, SW, 3, '#6a6d74');
    for (let x = 4; x < SW; x += 16) R(c, x, GROUND + 15, 8, 1, '#d8d8d8');
    if (s.year < 1964) R(c, 0, GROUND + 3, SW, SH - GROUND - 3, '#5a4c3e'); // 未舗装
  }
}
function tree(c, x, y, season) {
  R(c, x, y - 18, 3, 18, '#4a3326');
  const leaf = ['#f2b6c8', '#3f8a46', '#d07a2e', null][season];
  if (!leaf) { R(c, x - 5, y - 20, 13, 1, '#4a3326'); return; }
  for (let i = 0; i < 40; i++) R(c, x - 8 + hash(i) * 19, y - 30 + hash(i + 3) * 14, 2, 2, leaf);
}
function house(c, s) {
  const x = 8, y = GROUND, home = s.home;
  if (home === '団地') {
    R(c, x, y - 46, 58, 46, '#b9b3a6');
    for (let fy = 0; fy < 5; fy++) for (let fx = 0; fx < 6; fx++) R(c, x + 3 + fx * 9, y - 43 + fy * 9, 6, 5, hash(fx + fy * 7) > 0.35 ? '#f0cf74' : '#4a4f5a');
    R(c, x, y - 47, 58, 2, '#8f8a80');
  } else if (home === '寮' || home === '下宿') {
    R(c, x, y - 26, 50, 26, '#8a6b4e'); R(c, x - 2, y - 28, 54, 3, '#4a3a33');
    for (let fx = 0; fx < 6; fx++) { R(c, x + 3 + fx * 8, y - 22, 5, 5, '#f0cf74'); R(c, x + 3 + fx * 8, y - 12, 5, 5, hash(fx) > 0.4 ? '#f0cf74' : '#3a3a40'); }
  } else if (home === '持ち家') {
    R(c, x + 4, y - 26, 40, 26, '#d8d0c0'); tri(c, x + 1, y - 26, 46, 12, '#6a3a3a');
    R(c, x + 9, y - 21, 7, 6, '#f0cf74'); R(c, x + 30, y - 21, 7, 6, '#f0cf74'); R(c, x + 9, y - 11, 7, 6, '#f0cf74'); R(c, x + 21, y - 11, 6, 11, '#5a3a2a');
  } else if (!s.rural || s.year >= 1975) { // 町の家・長屋
    R(c, x, y - 18, 52, 18, '#6e5a48'); tri(c, x - 2, y - 18, 56, 8, '#3a3d4a');
    for (let fx = 0; fx < 3; fx++) { R(c, x + 4 + fx * 17, y - 13, 7, 5, '#f0cf74'); R(c, x + 12 + fx * 17, y - 10, 4, 10, '#4a3a2a'); }
  } else { // 農家（かやぶき）
    R(c, x + 4, y - 16, 44, 16, '#7a6248'); tri(c, x - 2, y - 16, 56, 16, '#a08a5a');
    R(c, x + 10, y - 12, 9, 7, '#f0cf74'); R(c, x + 28, y - 12, 12, 12, '#3a2a20');
  }
  if (s.hasTv) { const ax = x + 30, ay = home === '団地' ? y - 47 : y - 30; R(c, ax, ay - 8, 1, 8, '#9aa'); R(c, ax - 4, ay - 8, 9, 1, '#9aa'); R(c, ax - 3, ay - 6, 7, 1, '#9aa'); }
  if (s.hasCar) { const cx = 66; R(c, cx, y - 6, 18, 5, '#c0392b'); R(c, cx + 4, y - 10, 9, 4, '#c0392b'); R(c, cx + 5, y - 9, 7, 2, '#9fd3f0'); R(c, cx + 2, y - 2, 3, 2, '#111'); R(c, cx + 13, y - 2, 3, 2, '#111'); }
}
function tri(c, x, y, w, h, col) { for (let i = 0; i < h; i++) R(c, x + (w / 2) * (i / h), y - i - 1, Math.max(1, Math.round(w - w * (i / h))), 1, col); }

// 人。age で背丈、色は服
function person(c, x, age, sex, cloth, me, bob) {
  const y = GROUND + 1 + (bob ? -1 : 0);
  const skin = '#f1c9a5', hair = age >= 62 ? '#c8c8c8' : '#1d1b1b';
  if (age < 1) { R(c, x, y - 4, 4, 3, '#f6f0e6'); R(c, x + 1, y - 5, 2, 2, skin); return; }
  const h = age < 4 ? 8 : age < 8 ? 10 : age < 13 ? 12 : age < 17 ? 14 : 15;
  const bent = age >= 75 ? 1 : 0;
  R(c, x + 1 + bent, y - h, 4, 4, skin); R(c, x + 1 + bent, y - h, 4, 1, hair);
  if (sex === 'f') { R(c, x + bent, y - h, 1, age < 62 ? 5 : 3, hair); R(c, x + 5 + bent, y - h, 1, age < 62 ? 5 : 3, hair); }
  R(c, x + 2 + bent, y - h + 2, 1, 1, '#222'); R(c, x + 4 + bent, y - h + 2, 1, 1, '#222');
  const bodyH = h - 7; R(c, x + 1, y - h + 4, 4, bodyH, cloth);
  if (sex === 'f' && age >= 4) R(c, x, y - h + 4 + bodyH - 2, 6, 2, cloth);
  R(c, x + 1, y - 3, 1, 3, '#2a2a33'); R(c, x + 4, y - 3, 1, 3, '#2a2a33');
  if (me) { R(c, x + 2 + bent, y - h - 4, 2, 2, '#e26a8d'); }
}
function people(c, s, frame) {
  let x = 72 + (s.hasCar ? 20 : 0);
  const b = i => Math.floor(frame / 20 + i) % 4 === 0;
  const fam = [];
  if (!s.leftHome && s.fatherAlive) fam.push([s.age + s.fatherAge, 'm', '#4a5a7a']);
  if (!s.leftHome && s.motherAlive) fam.push([s.age + s.motherAge, 'f', '#8a6a5a']);
  fam.push([s.age, s.sex, s.sex === 'f' ? '#e26a8d' : '#3f7fbf', 1]);
  if (s.married) fam.push([s.age + s.spouseGap, s.sex === 'f' ? 'm' : 'f', '#6a7a5a']);
  for (const k of s.kids) { const a = s.year - k.y; if (a >= 0 && a < 22) fam.push([a, k.sex, '#c9a24a']); }
  if (s.grandkids) fam.push([1, 'f', '#c9a24a']);
  if (!s.leftHome) for (let i = 0; i < s.sibsYounger; i++) { const a = s.age - 2 - i * 2; if (a >= 0) fam.push([a, i % 2 ? 'm' : 'f', '#7a8a9a']); }
  fam.slice(0, 9).forEach((p, i) => { person(c, x, p[0], p[1], p[2], p[3], b(i)); x += p[0] < 1 ? 6 : 9; });
}
function particles(c, season, frame) {
  if (season === 0) for (let i = 0; i < 14; i++) { const x = (hash(i) * SW + frame * 0.4 + i * 9) % SW, y = (hash(i + 4) * SH + frame * 0.3) % GROUND; R(c, x, y, 1, 1, '#f6c6d6'); }
  if (season === 3) for (let i = 0; i < 40; i++) { const x = (hash(i) * SW + Math.sin(frame / 20 + i) * 2) % SW, y = (hash(i + 4) * SH + frame * 0.5) % SH; R(c, x, y, 1, 1, '#ffffff'); }
}
