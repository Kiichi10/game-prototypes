// アキネーター系 共通エンジン
// 候補（お菓子・日記の日・生まれ年など）の確率を、はい/いいえの答えで更新し、次に一番絞り込める質問を選ぶ。
// 質問 q.f(候補) は 0〜1（1=はい、0=いいえ、0.5=どちらとも）か null（不明）を返す。
const ANS = { yes: 1, py: 0.75, dk: null, pn: 0.25, no: 0 }; // はい / たぶんそう / わからない / たぶん違う / いいえ

class Aki {
  constructor(cands, questions, opt = {}) {
    this.c = cands; this.qs = questions; this.asked = []; this.excluded = new Set();
    this.noise = opt.noise ?? 0.9; // 答えと特徴が食い違った時に、どれだけ候補を落とすか（1未満にして記憶違いを許す）
    const w = cands.map(c => c.w || 1), s = w.reduce((a, b) => a + b, 0);
    this.p = w.map(v => v / s);
  }
  static lik(a, v, noise) { return a == null || v == null ? 1 : 1 - Math.abs(a - v) * noise; }
  answer(q, a) {
    this.asked.push({ q, a });
    this.p = this.p.map((p, i) => p * Aki.lik(a, q.f(this.c[i]), this.noise));
    this.norm();
  }
  exclude(i) { this.excluded.add(i); this.p[i] = 0; this.norm(); }
  norm() { const s = this.p.reduce((a, b) => a + b, 0) || 1; this.p = this.p.map(v => v / s); }
  ranked() { return this.p.map((p, i) => ({ i, p, c: this.c[i] })).filter(x => !this.excluded.has(x.i)).sort((a, b) => b.p - a.p); }
  entropy(p) { return -p.reduce((s, v) => s + (v > 0 ? v * Math.log2(v) : 0), 0); }
  // 「はい」と「いいえ」のどちらが返っても、残りの候補の散らばり（エントロピー）が一番小さくなる質問を選ぶ
  next(randTop = 1) {
    const used = new Set(this.asked.map(x => x.q.id));
    const scored = [];
    for (const q of this.qs) {
      if (used.has(q.id)) continue;
      const vs = this.c.map(q.f);
      const pyes = this.p.reduce((s, p, i) => s + p * (vs[i] == null ? 0.5 : vs[i]), 0);
      if (pyes < 0.02 || pyes > 0.98) continue; // 答えが分かりきっている質問は聞かない
      const after = a => { const x = this.p.map((p, i) => p * Aki.lik(a, vs[i], this.noise)); const s = x.reduce((u, v) => u + v, 0) || 1; return this.entropy(x.map(v => v / s)); };
      scored.push({ q, e: pyes * after(1) + (1 - pyes) * after(0) });
    }
    scored.sort((a, b) => a.e - b.e);
    const top = scored.slice(0, randTop);
    return top.length ? top[Math.floor(Math.random() * top.length)].q : null;
  }
}
if (typeof module !== 'undefined') module.exports = { Aki, ANS };
