// 判定エンジン：答えるたびに「生まれ年の確率分布」を更新し、次に一番絞り込める質問を選ぶ
// 各選択肢の y（その答えを選びがちな生まれ年）を中心に、年ごとの「その答えを選ぶ確率」を正規分布で近似する。
// ★実データが集まったら likelihood() を「実際にその答えを選んだ人の生まれ年の分布」に差し替える（段階4）。
const ENGINE = {
  Y0: 1940, Y1: 2012, SIGMA: 9, MIN_Q: 10, MAX_Q: 14, STOP_WIDTH: 8, // 最低10問。80%区間が8年以内に収まったら止める（2026-10-18 シミュレーションで選定）
  years() { const a = []; for (let y = this.Y0; y <= this.Y1; y++) a.push(y); return a; },
};

// 判定の更新に使う重み：「この答えを選ぶ人の生まれ年は y を中心に広がる」(年ごとに4択で割らない)。
// ※年ごとに4択で割る形にすると、一番古い答えは「古いほど選ぶ」単調な形になり、判定が範囲の端(1940年)へ
//   引っ張られる（2026-10-18 実測: 言葉だけ2002年・他1952〜56年の人が総合1945年になった）。
function likelihood(Q, k) {
  const out = [];
  for (let y = ENGINE.Y0; y <= ENGINE.Y1; y++) out.push(Math.exp(-((y - Q.a[k][1]) ** 2) / (2 * ENGINE.SIGMA ** 2)) + 0.002);
  return out;
}
// その年の人が選択肢kを選ぶ確率（4択で合計1）。次の質問選びの見込み計算とシミュレーションに使う
function answerProb(Q, k) {
  const out = [];
  for (let y = ENGINE.Y0; y <= ENGINE.Y1; y++) {
    const w = Q.a.map(a => Math.exp(-((y - a[1]) ** 2) / (2 * ENGINE.SIGMA ** 2)) + 0.02);
    out.push(w[k] / w.reduce((s, v) => s + v, 0));
  }
  return out;
}
const normalize = p => { const s = p.reduce((a, b) => a + b, 0); return p.map(v => v / s); };
const post = (prior, Q, k) => { const L = likelihood(Q, k); return normalize(prior.map((v, i) => v * L[i])); };
function stats(p) {
  const ys = ENGINE.years();
  const mean = p.reduce((s, v, i) => s + v * ys[i], 0);
  const sd = Math.sqrt(p.reduce((s, v, i) => s + v * (ys[i] - mean) ** 2, 0));
  let c = 0, lo = ys[0], hi = ys[ys.length - 1];
  for (let i = 0; i < p.length; i++) { c += p[i]; if (c >= 0.1) { lo = ys[i]; break; } }
  c = 0; for (let i = p.length - 1; i >= 0; i--) { c += p[i]; if (c >= 0.1) { hi = ys[i]; break; } }
  // 予想の中心から±4年に入る確率＝「確信度」
  const m = Math.round(mean), conf = p.reduce((s, v, i) => s + (Math.abs(ys[i] - m) <= 4 ? v : 0), 0);
  return { mean, sd, lo, hi, conf };
}
// 次の質問：答えた後の分布のばらつき（分散）が平均して一番小さくなる質問。分野は偏らないようにする
function pickNext(prior, pool, asked) {
  const catCount = {}; asked.forEach(a => catCount[a.Q.c] = (catCount[a.Q.c] || 0) + 1);
  const lastCat = asked.length ? asked[asked.length - 1].Q.c : null;
  const scored = pool.map(Q => {
    let exp = 0;
    for (let k = 0; k < Q.a.length; k++) {
      const A = answerProb(Q, k), pk = prior.reduce((s, v, i) => s + v * A[i], 0);
      exp += pk * stats(post(prior, Q, k)).sd ** 2;
    }
    const penalty = (catCount[Q.c] || 0) * 6 + (Q.c === lastCat ? 25 : 0); // 同じ分野ばかり・連続を避ける
    return { Q, score: exp + penalty };
  }).sort((a, b) => a.score - b.score);
  const top = scored.slice(0, 3); // 上位3問からランダム：毎回同じ順番にしない
  return top[Math.floor(Math.random() * top.length)].Q;
}
function shouldStop(p, n) {
  if (n >= ENGINE.MAX_Q) return true;
  if (n < ENGINE.MIN_Q) return false;
  const s = stats(p); return s.hi - s.lo <= ENGINE.STOP_WIDTH;
}
// 分野ごとの感覚の年：その分野の答えだけで分布を作る
function categoryYears(asked) {
  const res = {};
  for (const c of ['talk', 'words', 'fun', 'life']) {
    const xs = asked.filter(a => a.Q.c === c); if (!xs.length) continue;
    let p = normalize(ENGINE.years().map(() => 1)); xs.forEach(a => p = post(p, a.Q, a.k));
    res[c] = { y: Math.round(stats(p).mean), n: xs.length };
  }
  return res;
}
