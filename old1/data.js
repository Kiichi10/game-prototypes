// 選ばなかった方の私 — データ
// ★数値はすべて試作用の概算。公開前に出典と照合すること（SOURCE_TODO 参照）。

const SOURCE_TODO = [
  '年収カーブ: 厚労省 賃金構造基本統計調査（年齢階級・学歴・性別）',
  '地域差: 同調査 都道府県別（東京/全国）',
  '企業規模差: 同調査 企業規模別',
  '50歳時未婚率: 国勢調査2020（男28%・女18%前後）',
  '初婚年齢: 人口動態統計（男31歳・女30歳前後）',
];

const FORKS = [
  { id: 'edu', q: '高校を出たあと', age: 18, opts: [['univ', '大学に進んだ'], ['work', '働きはじめた']] },
  { id: 'city', q: '若いころの住まい', age: 18, opts: [['local', '地元に残った'], ['tokyo', '東京に出た']] },
  { id: 'firm', q: '最初の勤め先', age: 22, opts: [['big', '大きな会社'], ['small', '中小企業'], ['gov', '公務員']] },
  { id: 'change', q: '30代の仕事', age: 32, opts: [['stay', '同じ所に残った'], ['move', '転職した']] },
  { id: 'marry', q: '結婚', age: 30, opts: [['yes', '結婚した'], ['no', 'していない']] },
  { id: 'kids', q: '子ども', age: 32, opts: [['yes', 'いる'], ['no', 'いない']] },
];

// 年収カーブ（万円・概算）: [年齢, 年収]
const WAGE = {
  m_univ: [[22, 290], [30, 450], [40, 590], [50, 700], [55, 720], [60, 480], [65, 220]],
  m_work: [[18, 240], [30, 390], [40, 470], [50, 520], [55, 520], [60, 380], [65, 190]],
  f_univ: [[22, 280], [30, 390], [40, 450], [50, 480], [55, 470], [60, 340], [65, 160]],
  f_work: [[18, 220], [30, 300], [40, 320], [50, 330], [55, 330], [60, 260], [65, 140]],
};
const MULT = { tokyo: 1.15, local: 1.0, big: 1.25, small: 0.9, gov: 1.05 };

// 時代の出来事（暦年で両方の人生に起こる）
const ERA = [
  { y: 1991, t: 'バブルがはじけた。まわりの大人の顔つきが変わった。' },
  { y: 1995, t: '阪神・淡路大震災。テレビの前から動けなかった。' },
  { y: 1997, t: '山一證券が潰れた。「大きな会社でも潰れる」と知った。' },
  { y: 2008, t: 'リーマン・ショック。職場の空気が重くなった。' },
  { y: 2011, t: '東日本大震災。大事な人に電話をかけた。' },
  { y: 2020, t: 'コロナで世界が止まった。人に会えない一年だった。' },
  { y: 2024, t: '何もかも値上がりした。スーパーで値札を見る癖がついた。' },
];

// 毎年の出来事。p(s)=その年に起こる確率、fx(s)=状態変化。kind: big/sad/なし
const EVENTS = [
  { t: '{school}に合格した。', kind: 'big', once: 'admit', p: s => s.age === 18 && s.edu === 'univ' ? 1 : 0 },
  { t: '初めての給料で、親にごはんをおごった。', once: 'pay1', p: s => s.working && s.yearsWorked === 1 ? 0.8 : 0 },
  { t: '東京の家賃の高さに驚いた。部屋は6畳だった。', once: 'rent', p: s => s.city === 'tokyo' && s.age <= 23 ? 0.7 : 0 },
  { t: '地元の友だちと、毎週同じ店で飲んだ。', once: 'local1', p: s => s.city === 'local' && s.age >= 20 && s.age <= 28 ? 0.25 : 0 },
  { t: 'サークルで一生の友だちができた。', once: 'club', p: s => s.edu === 'univ' && s.age >= 19 && s.age <= 21 ? 0.4 : 0, fx: s => s.joy += 5 },
  { t: '就職先が決まった。', kind: 'big', once: 'job', p: s => s.age === s.jobAge - 1 ? 1 : 0 },
  { t: '就職氷河期。50社に落ちた。', kind: 'sad', once: 'ice', p: s => s.age === s.jobAge - 1 && s.year >= 1994 && s.year <= 2004 ? 0.8 : 0, fx: s => { s.mult *= 0.92; s.joy -= 5; } },
  { t: '昇進した。', kind: 'big', p: s => s.working && s.age >= 30 && s.age <= 50 ? (s.firm === 'big' ? 0.09 : 0.06) : 0, fx: s => { s.mult *= 1.06; s.joy += 3; } },
  { t: '会社の業績が悪くなり、ボーナスが出なかった。', kind: 'sad', p: s => s.working && s.firm === 'small' ? 0.05 : 0, fx: s => s.cash -= 40 },
  { t: '会社が倒産した。次の仕事を探した。', kind: 'sad', p: s => s.working && s.firm === 'small' && s.age < 60 ? 0.012 : 0, fx: s => { s.mult *= 0.85; s.cash -= 80; s.joy -= 8; } },
  { t: '希望退職を募られた。残ると決めた。', kind: 'sad', p: s => s.working && s.firm === 'big' && s.age >= 45 && s.age < 58 ? 0.03 : 0 },
  { t: '転勤の辞令が出た。知らない町で暮らしはじめた。', p: s => s.working && (s.firm === 'big' || s.firm === 'gov') && s.age >= 25 && s.age < 55 ? 0.04 : 0 },
  { t: '転職した。給料は{updown}。', kind: 'big', once: 'chg', p: s => s.change === 'move' && s.age === 32 ? 1 : 0, fx: s => { s.mult *= s.rnd() < 0.6 ? 1.1 : 0.92; } },
  { t: '{partner}と出会った。', once: 'meet', p: s => s.wantMarry && !s.married && s.age >= 24 && s.age < s.marryAge ? 0.35 : 0, fx: s => s.joy += 6 },
  { t: '結婚した。', kind: 'big', once: 'wed', p: s => s.wantMarry && !s.married && s.age >= s.marryAge ? 1 : 0, fx: s => { s.married = true; s.joy += 10; s.cash -= 120; } },
  { t: '友だちの結婚式で、ひとりで帰り道を歩いた。', p: s => !s.married && s.age >= 27 && s.age <= 40 ? 0.12 : 0 },
  { t: '一人の休日を、思いきり好きに使った。', p: s => !s.married && s.age >= 25 ? 0.1 : 0, fx: s => s.joy += 3 },
  { t: '子どもが生まれた。名前を三日考えた。', kind: 'big', p: s => s.wantKids && s.married && s.kids < s.kidGoal && s.age >= s.marryAge + 1 && s.age < 42 ? 0.45 : 0, fx: s => { s.kids++; s.joy += 12; if (s.sex === 'f') s.leave = 3; } },
  { t: '子どもの夜泣きで、ほとんど眠れなかった。', p: s => s.kids > 0 && s.age - s.lastKidAge <= 1 ? 0.5 : 0, fx: s => s.health -= 2 },
  { t: '子どもが小学校に入った。ランドセルが大きく見えた。', kind: 'big', p: s => s.kids > 0 && s.age - s.firstKidAge === 6 ? 1 : 0 },
  { t: '子どもの塾代が家計にのしかかった。', p: s => s.kids > 0 && s.age - s.firstKidAge >= 12 && s.age - s.firstKidAge <= 18 ? 0.25 : 0, fx: s => s.cash -= 50 },
  { t: '家を買った。三十五年のローンを組んだ。', kind: 'big', once: 'house', p: s => s.married && s.age >= 32 && s.age <= 45 && s.cash > 300 ? 0.15 : 0, fx: s => { s.home = '持ち家'; s.cash -= 400; } },
  { t: '健康診断で、数値の悪いところが見つかった。', kind: 'sad', p: s => s.age >= 40 ? 0.06 : 0, fx: s => s.health -= 8 },
  { t: '入院した。仕事を一か月休んだ。', kind: 'sad', p: s => s.age >= 35 ? 0.015 + (s.age - 35) * 0.001 : 0, fx: s => { s.health -= 12; s.cash -= 30; } },
  { t: '毎朝走るようになった。', once: 'run', p: s => s.age >= 30 && s.health < 85 ? 0.04 : 0, fx: s => s.health += 10 },
  { t: '親が倒れた。{carePlace}', kind: 'sad', once: 'care', p: s => s.age >= 45 && s.age <= 65 ? 0.05 : 0, fx: s => { s.joy -= 6; s.cash -= 60; } },
  { t: '離婚した。', kind: 'sad', once: 'div', p: s => s.married && s.age < 60 ? 0.009 : 0, fx: s => { s.married = false; s.divorced = true; s.joy -= 12; s.cash -= 100; } },
  { t: 'ずっと行きたかった国へ旅をした。', p: s => s.cash > 200 && s.age >= 25 ? 0.05 : 0, fx: s => { s.joy += 5; s.cash -= 40; } },
  { t: '同窓会で、昔の友だちが別人みたいになっていた。', p: s => s.age >= 30 && s.age % 10 === 0 ? 0.5 : 0 },
  { t: '{retire}', kind: 'big', once: 'ret', p: s => s.age === 60 ? 1 : 0 },
];

// 結果文で使う言い方
const SAY = {
  edu: { univ: '大学に進んだ', work: '高校を出て働いた' },
  city: { local: '地元に残った', tokyo: '東京に出た' },
  firm: { big: '大きな会社に入った', small: '中小企業に入った', gov: '公務員になった' },
  change: { stay: '同じ職場に残った', move: '30代で転職した' },
  marry: { yes: '結婚した', no: '結婚しなかった' },
  kids: { yes: '子どもを持った', no: '子どもを持たなかった' },
};
