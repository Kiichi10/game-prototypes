// 母の時代を生きる — 一生の進行
const NOW_Y = 2026;
NAMES.f.push([1985, ['愛', '彩', '舞', '美穂', '麻衣', '絵美']], [1995, ['美咲', '葵', '彩花', '萌', '七海', '沙織']], [2005, ['陽菜', '美羽', '結衣', 'さくら', '葵', '凛']]);
NAMES.m.push([1985, ['大輔', '拓也', '翔太', '健太', '和也', '亮']], [1995, ['翔太', '拓海', '大樹', '健太', '海斗', '蓮']], [2005, ['蓮', '大翔', '颯太', '陽向', '悠真', '湊']]);

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function nameFor(sex, year, rnd) { let list = NAMES[sex][0][1]; for (const [y, l] of NAMES[sex]) if (year >= y) list = l; return list[Math.floor(rnd() * list.length)]; }
function weighted(rnd, arr) { const tot = arr.reduce((a, x) => a + x[1], 0); let r = rnd() * tot; for (const x of arr) { r -= x[1]; if (r <= 0) return x[0]; } return arr[0][0]; }
const clamp = v => Math.max(0, Math.min(100, v));

function newLife(by, sex, seed) {
  const rnd = rng(seed);
  const rural = rnd() * 100 < tbl(STAT.rural, by);
  const [pref, area] = PLACES[rural ? 'rural' : 'urban'][Math.floor(rnd() * PLACES[rural ? 'rural' : 'urban'].length)];
  const wealth = rural ? weighted(rnd, [[1, 3], [2, 4], [3, 3], [4, 1]]) : weighted(rnd, [[1, 2], [2, 3], [3, 3], [4, 2], [5, 1]]);
  const motherAge = 21 + Math.floor(rnd() * 11);
  const s = {
    rnd, seed, sex, by, year: by, age: 0, surname: SURNAMES[Math.floor(rnd() * SURNAMES.length)], given: nameFor(sex, by, rnd),
    rural, pref, area, placeName: pref, fatherJob: weighted(rnd, FATHER_JOB[rural ? 'rural' : 'urban']), wealth,
    sibsOlder: Math.floor(rnd() * (by < 1950 ? 4 : by < 1960 ? 3 : 2)), sibsYounger: 0,
    sibsPlanned: by < 1950 ? Math.floor(rnd() * 4) : by < 1960 ? Math.floor(rnd() * 3) : (rnd() < 0.45 ? 1 : 0),
    grand: rnd() < (rural ? 0.7 : 0.3), motherAge, fatherAge: motherAge + 2 + Math.floor(rnd() * 4), fatherAlive: 1, motherAlive: 1,
    health: 80 + Math.floor(rnd() * 15), happy: 62, learn: 10, bond: 60, flags: {}, kids: [], home: '実家', leftHome: 0,
    working: 0, yearsWorked: 0, job: null, married: 0, marriedYears: 0, hasTv: 0, hasCar: 0, refusals: 0, log: [],
  };
  s.rnd2 = rnd() * (1.25 - wealth * 0.1);
  s.neverMarry = rnd() * 100 < tbl(sex === 'f' ? STAT.neverMarryF : STAT.neverMarryM, by);
  s.marryAge = Math.max(18, Math.round(tbl(sex === 'f' ? STAT.marryAgeF : STAT.marryAgeM, by + 24) + (rnd() - 0.5) * 6));
  return s;
}
const fullName = s => s.surname + ' ' + s.given;
const birthMonth = s => 1 + Math.floor(rng(s.seed + 1)() * 12);

// 死亡率: 生命表の形（ゴンペルツ）を、生まれた時代の平均寿命の差だけ年齢をずらして使う
function qx(sex, age, year) {
  if (age === 0) return tbl(STAT.infantDeath, year) / 1000;
  if (age < 5) return tbl(STAT.infantDeath, year) / 1000 * 0.12;
  const L = tbl(sex === 'f' ? STAT.lifeF : STAT.lifeM, year), L0 = sex === 'f' ? 87.7 : 81.6;
  const a = age + (L0 - L) * 0.55;
  const g = sex === 'f' ? Math.exp(-11.6 + 0.105 * a) : Math.exp(-10.6 + 0.096 * a);
  return Math.min(0.6, Math.max(0.0004, g));
}
function cohortSurvival(sex, by) { let p = 1; for (let y = by; y < NOW_Y; y++) p *= 1 - qx(sex, y - by, y); return p; }

// ---------- 1年すすめる ----------
function stepYear(s) {
  const out = [];
  const say = (t, kind = '') => out.push({ t, kind, age: s.age });
  s.age = s.year - s.by;
  if (s.age === 0) say(`${s.by}年${birthMonth(s)}月、${s.pref}の${s.area}で、${s.sibsOlder ? `${s.sibsOlder + 1}人目の子` : 'はじめての子'}として生まれた。父は${s.fatherJob}${s.grand ? '、祖父母も一緒に暮らしている' : ''}。`, 'big');
  const w = WORLD[s.year]; if (w && s.age >= 0) say(w(s.age).replace('{tv}', s.hasTv ? '家のテレビで見た' : s.year >= 1953 ? '近所の家のテレビで見せてもらった' : 'ラジオで聴いた'), 'world');
  if (!s.hasTv && s.rnd2 < tbl(STAT.tv, s.year) / 100) s.hasTv = 1;
  // 学校を出る
  if (s.job === '学生' && s.age - 18 >= s.studyYears) {
    s.job = '事務'; s.working = 1; s.home = s.home === '下宿' ? 'アパート' : s.home;
    say(`${s.studyYears === 2 ? '短大' : '大学'}を卒業して、${pick(s, ['商社', '銀行', '電機メーカー', '保険会社', '役所'])}に勤めはじめた。`, 'big');
  }
  // 子どもが生まれる
  if (s.married && s.kids.length < s.kidsPlanned && s.year >= s.nextKidYear && s.age < 43) {
    const ks = s.rnd() < 0.5 ? 'f' : 'm', n = nameFor(ks, s.year, s.rnd);
    if (s.rnd() < tbl(STAT.infantDeath, s.year) / 1000) {
      say(`子どもが生まれたが、${n}と名づけたその子は、一年を待たずに亡くなった。`, 'sad'); s.happy -= 18; s.kidsPlanned--;
    } else {
      s.kids.push({ n, sex: ks, y: s.year });
      if (s.kids.length === 1) s.firstKidAge = s.age;
      say(`${['はじめての子', '二人目の子', '三人目の子', '四人目の子'][s.kids.length - 1]}、${n}が生まれた。`, 'big'); s.happy += 10; s.bond += 8;
    }
    s.nextKidYear = s.year + 2 + Math.floor(s.rnd() * 2);
  }
  // 出来事
  const pool = (s.age < 16 ? EV_CHILD : s.age < 19 ? EV_CHILD.concat(EV_ADULT) : EV_ADULT).slice().sort(() => s.rnd() - 0.5);
  let n = 0;
  for (const e of pool) {
    if (n >= 2) break;
    if (e.once && s.flags[e.id]) continue;
    if (s.rnd() < e.w(s)) { const t = e.t(s); if (e.fx) e.fx(s); s.flags[e.id] = 1; say(t, e.kind || ''); n++; }
  }
  // 体と心
  if (s.working) s.yearsWorked++;
  if (s.married) s.marriedYears++;
  if (s.job === '学生' || (s.age >= 6 && s.age < 15)) s.learn += 3;
  s.health -= s.age > 60 ? 1.6 : s.age > 40 ? 0.7 : 0.1;
  s.happy += (62 - s.happy) * 0.1; s.bond += (60 - s.bond) * 0.05;
  ['health', 'happy', 'learn', 'bond'].forEach(k => s[k] = clamp(s[k]));
  // 死
  let q = qx(s.sex, s.age, s.year); if (s.health < 20) q *= 1.3; // 体を壊している人は少しだけ死にやすい（生命表の平均を崩さない程度）
  if (s.rnd() < q) { s.dead = 1; say(deathText(s), 'sad big'); }
  s.log.push(...out);
  return out;
}
function deathText(s) {
  if (s.age === 0) return `生まれて${1 + Math.floor(s.rnd() * 10)}か月で、息を引き取った。この年、日本では生まれた赤ちゃんの${(tbl(STAT.infantDeath, s.year) / 10).toFixed(1)}%が1歳を迎えられなかった。`;
  if (s.age < 15) return `${pick(s, ['肺炎', '疫痢', '事故'])}で、短い一生を終えた。`;
  if (s.age < 60) return `${pick(s, ['病気', '事故', 'がん'])}で、${s.age}歳の若さで亡くなった。`;
  return `${s.age}歳。${s.married ? `${s.spouseCall}` : s.kids.length ? '子どもたち' : '親しい人たち'}に見守られて、静かに息を引き取った。`;
}

// ---------- 節目の選択 ----------
function pendingChoice(s) {
  if (s.dead) return null;
  if (s.age === 15 && !s.flags.c15) {
    const r = Math.round(tbl(STAT.highSchool, s.year));
    return { id: 'c15', text: `中学校を卒業する春が来た。${s.wealth <= 2 ? '家の暮らしは楽ではない。' : ''}`, st: `この年、同い年の${r}%が高校に進みました。`,
      opts: [{ l: '高校に進む', pct: r, fx: () => { s.edu = 'hs'; s.learn += 8; return '高校に進んだ。'; } },
             { l: s.rural ? '集団就職で都会へ出る' : '中学を出て働く', pct: 100 - r, fx: () => work(s, s.rural, s.sex === 'f' ? pick(s, ['工場', '店員']) : pick(s, ['工場', '工場', '店員']), '中学を出て') }] };
  }
  if (s.age === 18 && s.edu === 'hs' && !s.flags.c18) {
    const u = Math.round(tbl(s.sex === 'f' ? STAT.univF : STAT.univM, s.year));
    const opts = [{ l: s.sex === 'f' && s.year < 1985 ? '短大か大学に進む' : '大学に進む', pct: u, fx: () => {
      s.job = '学生'; s.studyYears = s.sex === 'f' && s.year < 1985 && s.rnd() < 0.65 ? 2 : 4;
      if (s.rural || s.rnd() < 0.3) { s.leftHome = 1; s.rural = false; s.home = '下宿'; }
      return `${s.studyYears === 2 ? '短大' : '大学'}に進んだ。${s.leftHome ? '家を出て、下宿暮らしが始まった。' : ''}`; } }];
    if (s.rural) opts.push({ l: '都会で就職する', pct: Math.round((100 - u) * 0.45), fx: () => work(s, true, s.sex === 'f' ? '事務' : pick(s, ['工場', '事務']), '高校を出て') },
                           { l: '地元で就職する', pct: Math.round((100 - u) * 0.55), fx: () => work(s, false, pick(s, ['事務', '工場', '店員']), '高校を出て') });
    else opts.push({ l: '就職する', pct: 100 - u, fx: () => work(s, false, pick(s, ['事務', '事務', '工場', '店員']), '高校を出て') });
    return { id: 'c18', text: '高校の卒業が近づいた。', st: `この年、${s.sex === 'f' ? '女子' : '男子'}の${u}%が大学・短大に進みました。`, opts };
  }
  if (!s.married && !s.neverMarry && !s.flags.wed && s.refusals < 3 && s.age >= s.marryAge && s.age < 45) {
    if (!s.offer) {
      const os = s.sex === 'f' ? 'm' : 'f', gap = s.sex === 'f' ? 1 + Math.floor(s.rnd() * 4) : -(1 + Math.floor(s.rnd() * 3));
      s.offer = { miai: s.rnd() * 100 < tbl(STAT.miai, s.year), name: SURNAMES[Math.floor(s.rnd() * SURNAMES.length)] + nameFor(os, s.by - gap, s.rnd), gap, job: pick(s, ['会社員', '公務員', '職人', '農家の長男', '商店の跡取り', '教師']) };
    }
    const o = s.offer, mp = Math.round(tbl(STAT.miai, s.year)), ma = tbl(s.sex === 'f' ? STAT.marryAgeF : STAT.marryAgeM, s.year).toFixed(1);
    return { id: 'wed', text: o.miai ? `お見合いの話が来た。相手は${o.job}の${o.name}さん、${s.age + o.gap}歳。` : `${o.name}さんと付き合って${1 + Math.floor(s.rnd() * 3)}年。結婚しようという話になった。`,
      st: `この年、${s.sex === 'f' ? '女性' : '男性'}の平均初婚年齢は${ma}歳。結婚した夫婦の約${mp}%がお見合いでした。`,
      opts: [{ l: '結婚する', fx: () => marry(s) }, { l: 'まだ結婚しない', fx: () => { s.refusals++; s.marryAge = s.age + 2 + Math.floor(s.rnd() * 3); s.offer = null; return s.refusals >= 3 ? 'ひとりで生きていくのも悪くない、と思うようになった。' : '今はまだ、と返事をした。'; } }] };
  }
  if (s.sex === 'f' && s.working && s.kids.length === 1 && !s.flags.cwork) {
    const k = Math.round(tbl(STAT.keepWorkAfterBirth, s.year));
    return { id: 'cwork', text: `${s.kids[0].n}が生まれた。職場にどう戻るか、決めなければならない。`, st: `このころ、はじめての子を産んだ後も働き続けた女性は約${k}%でした。`,
      opts: [{ l: '仕事を続ける', pct: k, fx: () => { s.happy -= 2; return s.withInlaws || s.grand ? '仕事に戻った。子どもは祖母に預けた。' : '仕事に戻った。保育園の送り迎えで毎日走った。'; } },
             { l: '仕事を辞めて家庭に入る', pct: 100 - k, fx: () => { s.working = 0; return '会社を辞めた。送別会で、もらった花束が重かった。'; } }] };
  }
  return null;
}
function work(s, toCity, job, how) {
  s.working = 1; s.job = job;
  if (toCity) { s.leftHome = 1; s.rural = false; s.home = '寮'; s.sentHome = s.wealth <= 3; }
  const where = { 工場: '工場', 店員: '住み込みの店', 事務: '会社' }[job];
  return toCity ? `${how}、${s.year < 1975 && how === '中学を出て' ? '集団就職の列車に乗って' : '列車に乗って'}都会の${where}へ働きに出た。駅で母が見えなくなるまで手を振っていた。` : `${how}、地元の${where}で働きはじめた。`;
}
function marry(s) {
  const o = s.offer; s.married = 1; s.flags.wed = 1; s.spouseGap = o.gap; s.spouseName = o.name; s.spouseCall = s.sex === 'f' ? '夫' : '妻';
  s.withInlaws = s.sex === 'f' && s.rnd() < (s.year < 1965 ? 0.45 : s.year < 1985 ? 0.3 : 0.15);
  s.leftHome = 1; s.home = s.withInlaws ? '実家' : 'アパート';
  s.kidsPlanned = Math.max(0, Math.min(4, Math.round(tbl(STAT.kidsPerCouple, s.year) + (s.rnd() - 0.5) * 1.6)));
  s.nextKidYear = s.year + 1 + Math.floor(s.rnd() * 2);
  s.happy += 10; s.bond += 8;
  let t = `${o.name}さんと結婚した。${o.miai ? 'お見合いから半年後の式だった。' : ''}${s.withInlaws ? '夫の実家で、義理の両親と一緒に暮らすことになった。' : ''}`;
  if (s.sex === 'f' && s.working && s.year < 1986 && s.rnd() < 0.55) { s.working = 0; t += '会社は「寿退社」した。'; }
  return t;
}
function autoPick(c) { // 統計の割合どおりに選ぶ（割合がない時は最初の選択肢）
  if (!c.opts[0].pct) return c.opts[0];
  let r = Math.random() * c.opts.reduce((a, o) => a + o.pct, 0);
  for (const o of c.opts) { r -= o.pct; if (r <= 0) return o; } return c.opts[0];
}
function whereText(s) {
  const home = { 実家: s.flags.wed ? (s.withInlaws ? '夫の実家' : '自宅') : '実家', 寮: '会社の寮', 下宿: '下宿', アパート: 'アパート', 団地: '団地', 持ち家: '自分の家' }[s.home];
  const home_kids = s.kids.filter(k => s.year - k.y < 22).length; // 22歳を過ぎた子は家を出たことにする
  const fam = s.married ? (home_kids ? `${s.spouseCall}と子ども${home_kids}人と` : `${s.spouseCall}とふたりで`) : home_kids ? `子ども${home_kids}人と` : s.leftHome ? 'ひとりで' : '家族と';
  return `${s.leftHome && !s.rural ? '都会' : s.pref}・${home}・${fam}暮らしている`;
}
