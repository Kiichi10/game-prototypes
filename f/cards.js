// 日記の1日 → カード1枚
// 一番目のタグで種類が決まり、二番目のタグがおまけの効果を足す。気分4〜5は金カード（強い）、1〜2は「糧」カード
const TAGS = {
  work: { n: '仕事', kind: 'atk', base: { dmg: 6 } },
  move: { n: '運動', kind: 'atk', base: { dmg: 3, hits: 2 } },
  rest: { n: '休んだ', kind: 'heal', base: { heal: 5 } },
  cook: { n: '料理', kind: 'def', base: { block: 7 } },
  meet: { n: '人に会った', kind: 'ally', base: { ally: 2 }, cost: 2 },
  learn: { n: '学び', kind: 'draw', base: { draw: 2 } },
  early: { n: '早起き', kind: 'nrg', base: { energy: 1 }, cost: 0 },
  out: { n: 'お出かけ', kind: 'atk', base: { dmg: 4, draw: 1 } },
  make: { n: '創作', kind: 'atk', base: { dmg: 2, str: 1 } },
};
const BONUS = { work: { dmg: 3 }, move: { dmg: 2 }, rest: { heal: 3 }, cook: { block: 4 }, meet: { ally: 1 }, learn: { draw: 1 }, early: { energy: 1 }, out: { draw: 1 }, make: { str: 1 } };
const W = ['日', '月', '火', '水', '木', '金', '土'];
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dlabel = k => { const [y, m, d] = k.split('-').map(Number), x = new Date(y, m - 1, d); return `${m}/${d}（${W[x.getDay()]}）`; };
let UID = 1;

function makeCard(day) {
  const t = day.tags.length ? day.tags : ['rest'];
  const fx = {}; let kind, cost;
  if (day.mood <= 2) { // しんどかった日：軽い。使うたびに、その戦いの間ずっと強くなる
    kind = 'sad'; cost = 0; fx.str = 1; fx.draw = 1;
  } else {
    const main = TAGS[t[0]] || TAGS.rest; kind = main.kind; cost = main.cost ?? 1;
    Object.assign(fx, main.base);
    if (t[1] && BONUS[t[1]]) { for (const [k, v] of Object.entries(BONUS[t[1]])) fx[k] = (fx[k] || 0) + v; kind = 'mix'; if (cost < 2 && Object.keys(fx).length >= 3) cost = cost + 1; }
    if (day.mood >= 4) for (const k of ['dmg', 'block', 'heal', 'ally']) if (fx[k]) fx[k] += k === 'ally' ? 1 : 3; // いい日は強い
  }
  const name = (day.text.split(/[。、\s]/).find(s => s.length >= 2) || day.text || 'ふつうの日').slice(0, 9);
  return { id: UID++, day: day.k, name, kind, cost, fx, gold: day.mood >= 4, sad: day.mood <= 2, up: 0, used: 0, dealt: 0, tags: t };
}
function basicCard(name, kind, fx) { return { id: UID++, day: null, basic: true, name, kind, cost: 1, fx, gold: false, sad: false, up: 0, used: 0, dealt: 0, tags: [] }; }
function fxText(c) {
  const f = c.fx, s = [];
  if (f.dmg) s.push(`${f.dmg}ダメージ${f.hits > 1 ? `×${f.hits}` : ''}`);
  if (f.block) s.push(`守り${f.block}`);
  if (f.heal) s.push(`${f.heal}回復`);
  if (f.ally) s.push(`仲間（毎ターン${f.ally}）`);
  if (f.draw) s.push(`${f.draw}枚引く`);
  if (f.energy) s.push(`行動力＋${f.energy}`);
  if (f.str) s.push(c.sad ? `糧＋${f.str}（この戦いの攻撃＋）` : `力＋${f.str}`);
  if (c.sad || c.fx.energy) s.push('使うと消える');
  return s.join('・');
}
const KIND_N = { atk: '攻撃', def: '守り', heal: '回復', ally: '仲間', draw: '学び', nrg: '早起き', sad: 'しんどい日', mix: '合わせ技' };
function cardHTML(c, mini = false) {
  return `<div class="card ${mini ? 'mini' : ''} ${c.gold ? 'gold' : ''} ${c.sad ? 'sad' : ''} ${c.up ? 'up' : ''}" data-id="${c.id}">
    <div class="cost">${c.cost}</div><div class="date"><span>${c.basic ? 'いつもの' : dlabel(c.day)}</span></div>
    <div class="name">${c.name}</div><span class="kind k-${c.kind}">${KIND_N[c.kind]}</span><div class="fx">${fxText(c)}</div></div>`;
}

// お試し用の日記（直近7日＝最初の束、昔の10日＝「思い出す」で加えられる）
function sampleDiary() {
  const d = n => { const x = new Date(); x.setDate(x.getDate() - n); return ymd(x); };
  const recent = [
    [1, '残業。資料が終わらない', ['work'], 3], [2, '母とカレー', ['meet', 'cook'], 5], [3, '朝ジョギング', ['move', 'early'], 4],
    [4, '会議続きでぐったり', ['work'], 2], [5, '本を読んだ', ['learn'], 3], [6, '一日中寝てた', ['rest'], 3], [7, '同期と飲み', ['meet', 'work'], 4],
  ];
  const old = [
    [20, '海まで歩いた', ['out', 'move'], 5], [24, '弁当を作った', ['cook'], 3], [29, '英語の勉強', ['learn', 'early'], 4], [33, '絵を描いた', ['make'], 4],
    [40, '友だちの結婚式', ['meet', 'out'], 5], [46, '風邪で寝込んだ', ['rest'], 1], [52, '早起きして散歩', ['early', 'move'], 4], [61, '上司に怒られた', ['work'], 1],
    [75, '温泉に行った', ['out', 'rest'], 5], [90, '引っ越しの片付け', ['work', 'make'], 3],
  ];
  const f = ([n, text, tags, mood]) => ({ k: d(n), text, tags, mood });
  return { recent: recent.map(f), old: old.map(f) };
}
