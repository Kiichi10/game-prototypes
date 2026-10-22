// 暮らし方の違う3人の架空の日記（約90日分）。同じ仕組みで描いて、形が人によって変わるかを確かめる
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const PERSONAS = [
  { id: 'work', name: '仕事中心の都会の人', seed: 11, skip: 0.12, mood: [2, 4],
    tags: { work: .85, meet: .3, out: .08, rest: .15, cook: .05, move: .1, learn: .2, make: .02, early: .3 },
    words: ['会議', '資料', '残業', '上司', 'ラーメン', '電車', '締切', 'コーヒー', '出張', '同期'] },
  { id: 'home', name: '家族と家で過ごす人', seed: 22, skip: 0.05, mood: [3, 5],
    tags: { work: .2, meet: .5, out: .12, rest: .5, cook: .65, move: .15, learn: .1, make: .2, early: .4 },
    words: ['娘', '母', 'カレー', '洗濯', '公園', '昼寝', '弁当', '夕飯', '絵本', 'お風呂'] },
  { id: 'trip', name: '旅と趣味の人', seed: 33, skip: 0.2, mood: [2, 5],
    tags: { work: .25, meet: .35, out: .7, rest: .2, cook: .1, move: .45, learn: .3, make: .5, early: .25 },
    words: ['海', '写真', '山', '自転車', '京都', 'カメラ', '温泉', '星', '古本', '島'] },
];
// 1日分：{ day, tags:[], mood, words:[] }
function diary(P, days = 90) {
  const r = rng(P.seed), out = [];
  for (let d = 0; d < days; d++) {
    if (r() < P.skip) continue;
    const tags = Object.entries(P.tags).filter(([, p]) => r() < p).map(([t]) => t);
    const words = []; const k = 1 + Math.floor(r() * 2);
    for (let i = 0; i < k; i++) { // よく書く言葉ほど出やすい（先頭ほど重い）
      const idx = Math.floor(Math.pow(r(), 1.8) * P.words.length); words.push(P.words[idx]);
    }
    out.push({ day: d, tags, words, mood: P.mood[0] + Math.floor(r() * (P.mood[1] - P.mood[0] + 1)) });
  }
  return out;
}
const count = (D, f) => D.reduce((s, e) => s + (f(e) ? 1 : 0), 0);
function wordFreq(D) { const c = {}; D.forEach(e => e.words.forEach(w => c[w] = (c[w] || 0) + 1)); return Object.entries(c).sort((a, b) => b[1] - a[1]); }
function tagRate(D, t) { return count(D, e => e.tags.includes(t)) / Math.max(1, D.length); }
