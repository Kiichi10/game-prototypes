// 日記で育つ町 — 町のドット絵（256x144）
const TW = 256, TH = 144, GY = 108;
const TAGS = [
  // [キー, 表示名, 建物の名前（レベル1〜4）]
  ['work', '仕事', ['小さな事務所', '雑居ビル', 'オフィスビル', '高層ビル']],
  ['move', '運動', ['空き地の鉄棒', '小さな公園', '運動公園', 'スタジアム']],
  ['meet', '人に会った', ['屋台', '喫茶店', 'カフェ', 'にぎわう広場']],
  ['learn', '学び', ['掲示板', '小さな図書室', '図書館', '大学']],
  ['cook', '料理', ['かまど', '定食屋', 'レストラン', '市場']],
  ['out', 'お出かけ', ['バス停', '小さな駅', '駅', 'ターミナル駅']],
  ['rest', '休んだ', ['若木', '並木', '森', '神社の森']],
  ['early', '早起き', ['朝市', 'パン屋', 'ベーカリー', '朝のマルシェ']],
  ['make', '創作', ['画材屋', 'アトリエ', 'ギャラリー', '美術館']],
];
const LEVEL_AT = [1, 5, 15, 30]; // 何回でレベルが上がるか
const levelOf = n => LEVEL_AT.filter(t => n >= t).length;

const P = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const hsh = n => { n = Math.sin(n * 91.7) * 43758.5; return n - Math.floor(n); };

function drawTown(c, st, frame) {
  const hr = new Date().getHours();
  const night = hr < 5 || hr >= 19, dusk = hr >= 17 && hr < 19;
  const sky = night ? ['#141b33', '#2a3358'] : dusk ? ['#4a3b6b', '#e69a6b'] : ['#7fc4f0', '#cdeaf7'];
  for (let y = 0; y < GY; y++) { c.fillStyle = mixc(sky[0], sky[1], y / GY); c.fillRect(0, y, TW, 1); }
  if (night) { for (let i = 0; i < 30; i++) if ((frame + i * 11) % 80 > 3) P(c, hsh(i) * TW, hsh(i + 7) * 60, 1, 1, '#fff'); }
  else { for (let i = 0; i < 3; i++) cloud(c, (hsh(i) * TW + frame * 0.05 * (i + 1)) % (TW + 40) - 20, 12 + i * 14); }
  // 遠くの山
  for (let x = 0; x < TW; x++) { const h = 16 + Math.sin(x / 23) * 6 + Math.sin(x / 9) * 2; P(c, x, GY - h, 1, h, night ? '#1d2a3a' : '#8fb59a'); }
  // 地面と道
  P(c, 0, GY, TW, TH - GY, night ? '#2b3a2b' : '#7fae5a');
  P(c, 0, GY + 14, TW, 14, night ? '#3a3a44' : '#6b6b73');
  for (let x = 4; x < TW; x += 18) P(c, x, GY + 20, 9, 2, '#e8e2c8');
  // 建物
  TAGS.forEach(([k], i) => {
    const x = 4 + i * 28, lv = levelOf(st.counts[k] || 0);
    if (lv === 0) { emptyLot(c, x, night); return; }
    BUILD[k](c, x, lv, night, frame);
  });
  // 雑草（さぼった日）
  for (let i = 0; i < st.weeds; i++) { const x = 6 + hsh(i + 3) * (TW - 12), y = GY + 2 + hsh(i + 9) * 9; weed(c, x, y); }
  // 住人（記録の日数に応じて歩いている）
  const people = Math.min(14, Math.floor(st.days / 4));
  for (let i = 0; i < people; i++) {
    const sp = 0.15 + hsh(i) * 0.25, dir = i % 2 ? 1 : -1;
    const x = ((hsh(i + 1) * TW + dir * frame * sp) % TW + TW) % TW;
    walker(c, x, GY + 9 + (i % 3) * 2, i, frame);
  }
  // 連続7日以上でちょうちん
  if (st.streak >= 7) for (let x = 6; x < TW; x += 14) { P(c, x, 6, 1, 1, '#333'); P(c, x - 1, 7, 3, 4, (Math.floor(frame / 15) + x) % 3 ? '#e85a4f' : '#f6c453'); }
}
function mixc(a, b, k) { const p = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); }
function cloud(c, x, y) { P(c, x, y, 16, 4, '#fff'); P(c, x + 4, y - 3, 9, 4, '#fff'); }
function emptyLot(c, x, n) { P(c, x + 2, GY - 1, 24, 2, n ? '#4a3d2e' : '#a88b62'); P(c, x + 11, GY - 9, 1, 8, '#7a5a3a'); P(c, x + 7, GY - 12, 10, 5, n ? '#ccc' : '#fff'); P(c, x + 8, GY - 10, 8, 1, '#aaa'); }
function weed(c, x, y) { P(c, x, y, 1, 3, '#3f7a2a'); P(c, x - 1, y + 1, 1, 2, '#4f8f35'); P(c, x + 1, y, 1, 3, '#4f8f35'); }
function walker(c, x, y, i, f) {
  const cols = ['#e85a4f', '#3d7be0', '#f6c453', '#7a5ad8', '#3fb7a3'];
  P(c, x, y - 7, 3, 3, '#f1c9a5'); P(c, x, y - 7, 3, 1, '#333'); P(c, x, y - 4, 3, 3, cols[i % 5]);
  const s = Math.floor(f / 8 + i) % 2; P(c, x + (s ? 0 : 2), y - 1, 1, 1, '#333');
}
function windows(c, x, y, w, h, n, step = 4) {
  for (let yy = y + 2; yy < y + h - 2; yy += step) for (let xx = x + 2; xx < x + w - 2; xx += 4) P(c, xx, yy, 2, 2, n || hsh(xx * yy) > 0.5 ? '#f6d77a' : '#9fc4e0');
}
function shop(c, x, w, h, wall, roof, n) { P(c, x, GY - h, w, h, wall); P(c, x - 1, GY - h - 2, w + 2, 3, roof); P(c, x + w / 2 - 2, GY - 6, 4, 6, '#5a3a2a'); }
const BUILD = {
  work(c, x, lv, n) { const h = [14, 26, 40, 60][lv - 1], w = [16, 20, 22, 22][lv - 1]; P(c, x + 3, GY - h, w, h, ['#c9c2b5', '#a9b3bf', '#8fa3b8', '#6f8aa8'][lv - 1]); windows(c, x + 3, GY - h, w, h, n); if (lv === 4) P(c, x + 13, GY - h - 6, 1, 6, '#e85a4f'); },
  move(c, x, lv, n) { P(c, x + 1, GY - 2, 26, 2, '#5c9e45'); if (lv >= 1) { P(c, x + 4, GY - 8, 1, 8, '#888'); P(c, x + 10, GY - 8, 1, 8, '#888'); P(c, x + 4, GY - 8, 7, 1, '#888'); }
    if (lv >= 2) tree(c, x + 18, 1); if (lv >= 3) { P(c, x + 13, GY - 9, 6, 1, '#e85a4f'); P(c, x + 18, GY - 9, 1, 9, '#e85a4f'); }
    if (lv >= 4) { P(c, x, GY - 26, 28, 4, '#d8d0c0'); P(c, x, GY - 22, 2, 20, '#d8d0c0'); P(c, x + 26, GY - 22, 2, 20, '#d8d0c0'); P(c, x + 6, GY - 32, 1, 6, '#ccc'); P(c, x + 6, GY - 33, 3, 2, '#fff8a8'); } },
  meet(c, x, lv, n) { const h = [8, 14, 20, 20][lv - 1]; shop(c, x + 4, 20, h, '#f3e3c3', '#c24a3a', n);
    for (let i = 0; i < 5; i++) P(c, x + 4 + i * 4, GY - h, 2, 3, i % 2 ? '#fff' : '#e85a4f'); windows(c, x + 4, GY - h + 3, 20, h - 8, n, 5);
    if (lv >= 3) { P(c, x + 1, GY - 4, 3, 1, '#7a5a3a'); P(c, x + 24, GY - 4, 3, 1, '#7a5a3a'); }
    if (lv >= 4) for (let i = 0; i < 4; i++) P(c, x + 2 + i * 7, GY - 30, 2, 2, ['#e85a4f', '#f6c453', '#3d7be0', '#3fb7a3'][i]); },
  learn(c, x, lv, n) { if (lv === 1) { P(c, x + 8, GY - 12, 12, 8, '#7a5a3a'); P(c, x + 9, GY - 11, 10, 6, '#f2efe2'); P(c, x + 10, GY - 4, 1, 4, '#5a3a2a'); P(c, x + 17, GY - 4, 1, 4, '#5a3a2a'); return; }
    const h = [0, 16, 24, 34][lv - 1]; P(c, x + 2, GY - h, 24, h, '#e8e0d0'); P(c, x, GY - h - 3, 28, 3, '#6a5a8a');
    for (let i = 0; i < 4; i++) P(c, x + 5 + i * 6, GY - h + 4, 2, h - 4, '#cfc6b4'); if (lv >= 3) { P(c, x + 6, GY - h - 7, 16, 4, '#6a5a8a'); } if (lv === 4) P(c, x + 13, GY - h - 12, 2, 5, '#f6c453'); },
  cook(c, x, lv, n, f) { const h = [6, 14, 18, 22][lv - 1]; shop(c, x + 3, 22, h, '#e9dcc0', '#3a3a44', n);
    if (lv >= 2) { P(c, x + 8, GY - h + 1, 12, 5, '#2d4a8a'); P(c, x + 13, GY - h + 1, 1, 5, '#fff'); }
    P(c, x + 21, GY - h - 7, 3, 5, '#7a6a5a'); for (let i = 0; i < 3; i++) P(c, x + 22 + Math.sin((f + i * 20) / 10) * 2, GY - h - 10 - i * 3 - (f / 6 % 3), 2, 2, '#e8e8e8');
    if (lv >= 4) for (let i = 0; i < 3; i++) P(c, x + 2 + i * 9, GY - 5, 7, 3, ['#e85a4f', '#f6c453', '#7fae5a'][i]); },
  out(c, x, lv, n, f) { if (lv === 1) { P(c, x + 12, GY - 12, 1, 12, '#888'); P(c, x + 9, GY - 15, 7, 4, '#3d7be0'); return; }
    const h = [0, 12, 18, 26][lv - 1]; P(c, x + 1, GY - h, 26, h, '#d8cbb0'); P(c, x - 1, GY - h - 3, 30, 3, '#7a4a3a');
    P(c, x + 11, GY - h + 2, 6, 6, '#fff'); P(c, x + 14, GY - h + 3, 1, 3, '#333'); P(c, x + 14, GY - h + 5, 2, 1, '#333');
    if (lv >= 3) { const tx = ((f * 0.8) % 340) - 60; P(c, tx, GY - 4, 40, 4, '#e8e2d0'); P(c, tx, GY - 4, 40, 1, '#3fb7a3'); } },
  rest(c, x, lv) { const n = [1, 2, 4, 6][lv - 1]; for (let i = 0; i < n; i++) tree(c, x + 2 + (i % 3) * 8, lv >= 3 ? 1.3 : 1, i >= 3 ? -6 : 0); if (lv === 4) { P(c, x + 9, GY - 12, 10, 2, '#c24a3a'); P(c, x + 10, GY - 10, 1, 10, '#c24a3a'); P(c, x + 17, GY - 10, 1, 10, '#c24a3a'); } },
  early(c, x, lv, n) { const h = [6, 12, 16, 18][lv - 1]; if (lv === 1) { for (let i = 0; i < 3; i++) { P(c, x + 3 + i * 8, GY - 6, 7, 1, '#7a5a3a'); P(c, x + 4 + i * 8, GY - 8, 5, 2, ['#e8a85a', '#e85a4f', '#7fae5a'][i]); } return; }
    shop(c, x + 4, 20, h, '#f6e7c8', '#b5733a', n); P(c, x + 9, GY - h + 2, 10, 4, '#b5733a'); P(c, x + 11, GY - h + 3, 6, 2, '#f6d77a');
    if (lv >= 3) { P(c, x + 1, GY - 3, 3, 3, '#e8a85a'); P(c, x + 24, GY - 3, 3, 3, '#e8a85a'); } },
  make(c, x, lv, n) { const h = [10, 16, 22, 30][lv - 1]; P(c, x + 3, GY - h, 22, h, '#fbf7ef');
    for (let i = 0; i < 4; i++) P(c, x + 5 + i * 5, GY - h + 3, 3, 3, ['#e85a4f', '#3d7be0', '#f6c453', '#3fb7a3'][i]);
    P(c, x + 1, GY - h - 3, 26, 3, '#2d2a26'); P(c, x + 12, GY - 6, 4, 6, '#5a3a2a'); if (lv === 4) { P(c, x + 7, GY - h - 9, 14, 6, '#e8e0d0'); P(c, x + 6, GY - h - 10, 16, 1, '#2d2a26'); } },
};
function tree(c, x, s = 1, dy = 0) { const h = Math.round(10 * s); P(c, x + 3, GY - h + dy, 2, h, '#6a4a2a'); P(c, x, GY - h - 6 * s + dy, 8, 7 * s, '#3f8a46'); P(c, x + 1, GY - h - 8 * s + dy, 6, 3, '#4f9f55'); }
