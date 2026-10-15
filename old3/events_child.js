// 子ども〜十代の出来事（0〜18歳）
// w(s)=その年に起こる確率 / t(s)=文 / fx(s)=変化 / kind: big(節目)・sad(つらい)・good(うれしい)
const pick = (s, arr) => arr[Math.floor(s.rnd() * arr.length)];

const EV_CHILD = [
  { id: 'firstword', once: 1, w: s => s.age === 1 ? 0.9 : 0, t: s => `はじめて「${pick(s, ['まんま', 'かあちゃん', 'ばあば', 'わんわん'])}」と言った。家じゅうが笑った。`, kind: 'good', fx: s => s.bond += 4 },
  { id: 'walk', once: 1, w: s => s.age === 1 ? 0.8 : 0, t: s => s.rural ? '縁側から庭へ、はじめて自分の足で歩いた。' : '路地で、はじめて自分の足で歩いた。', kind: 'good' },
  { id: 'measles', once: 1, w: s => s.age >= 1 && s.age <= 6 ? (s.year < 1965 ? 0.18 : 0.06) : 0, t: s => 'はしかで高い熱が続いた。母が寝ずに額を冷やしてくれた。', kind: 'sad', fx: s => { s.health -= 6; s.bond += 3; } },
  { id: 'sibling', w: s => s.age >= 1 && s.age <= 10 && s.sibsYounger < s.sibsPlanned ? 0.3 : 0, t: s => `${s.sibsYounger === 0 ? 'はじめての' : 'また'}${pick(s, ['弟', '妹'])}が生まれた。`, kind: 'good', fx: s => { s.sibsYounger++; s.bond += 3; } },
  { id: 'sibdeath', once: 1, w: s => s.sibsYounger > 0 && s.age <= 10 ? tbl(STAT.infantDeath, s.year) / 1000 * 1.2 : 0, t: s => '生まれたばかりのきょうだいが亡くなった。小さな棺を、家族みんなで見送った。', kind: 'sad', fx: s => { s.sibsYounger--; s.happy -= 12; } },
  { id: 'chores', once: 1, w: s => s.rural && s.age >= 5 && s.age <= 9 ? 0.4 : 0, t: s => s.fatherJob === '漁業' ? '浜で網の手入れを手伝うようになった。' : s.fatherJob === '農業' ? '田植えの時期は学校を休んで手伝った。泥の冷たさを足が覚えた。' : '水くみと薪割りが毎朝の仕事になった。', fx: s => s.health += 2 },
  { id: 'errand', once: 1, w: s => !s.rural && s.age >= 5 && s.age <= 8 ? 0.4 : 0, t: s => '小銭をにぎって、豆腐屋までお使いに行った。', kind: 'good' },
  { id: 'school', once: 1, w: s => s.age === 6 ? 1 : 0, t: s => s.year < 1955 ? '小学校に入った。教科書は兄姉のおさがりだった。' : s.year < 1970 ? '小学校に入った。一クラス50人を超える教室だった。' : '小学校に入った。ランドセルが背中より大きかった。', kind: 'big', fx: s => s.learn += 5 },
  { id: 'lunch', once: 1, w: s => s.age >= 6 && s.age <= 8 && s.year < 1965 ? 0.6 : 0, t: s => '給食の脱脂粉乳。鼻をつまんで飲んだ。', },
  { id: 'kamishibai', once: 1, w: s => s.age >= 4 && s.age <= 9 && s.year < 1960 ? 0.5 : 0, t: s => '紙芝居のおじさんが来ると、水あめ目当てに駆けだした。', kind: 'good', fx: s => s.happy += 3 },
  { id: 'tvcome', once: 1, w: s => s.age >= 2 && s.hasTv && !s.tvSeen ? 1 : 0, t: s => s.year < 1962 ? 'うちにテレビが来た。近所の子が見せてもらいに集まった。' : 'うちにもテレビが来た。', kind: 'good', fx: s => { s.tvSeen = 1; s.happy += 4; } },
  { id: 'tvneighbor', once: 1, w: s => s.age >= 4 && s.age <= 12 && !s.hasTv && s.year >= 1955 ? 0.5 : 0, t: s => 'テレビのある家に上がらせてもらって、正座してプロレスを見た。' },
  { id: 'friend', once: 1, w: s => s.age >= 7 && s.age <= 11 ? 0.35 : 0, t: s => `${pick(s, ['同じ組の', '隣の家の', '帰り道が同じ'])}子と仲良くなった。毎日日が暮れるまで遊んだ。`, kind: 'good', fx: s => { s.bond += 6; s.happy += 4; } },
  { id: 'fight', once: 1, w: s => s.age >= 8 && s.age <= 12 ? 0.2 : 0, t: s => 'きょうだいとけんかして、父にひどく叱られた。', fx: s => s.happy -= 2 },
  { id: 'injury', once: 1, w: s => s.age >= 5 && s.age <= 12 ? 0.1 : 0, t: s => s.rural ? '木登りから落ちて腕を折った。' : '自転車で転んで、ひざに大きな傷が残った。', kind: 'sad', fx: s => s.health -= 3 },
  { id: 'poor', once: 1, w: s => s.wealth <= 2 && s.age >= 6 && s.age <= 13 ? 0.3 : 0, t: s => '給食費を持っていけない月があった。先生に名前を呼ばれるのがつらかった。', kind: 'sad', fx: s => s.happy -= 6 },
  { id: 'trip', once: 1, w: s => s.age === 11 || s.age === 12 ? 0.6 : 0, t: s => s.year < 1965 ? '修学旅行で、生まれてはじめて汽車に乗った。' : '修学旅行で京都と奈良へ行った。', kind: 'good', fx: s => s.happy += 5 },
  { id: 'study', once: 1, w: s => s.age >= 10 && s.age <= 14 ? 0.2 : 0, t: s => '算数のテストで100点を取った。父が珍しくほめてくれた。', kind: 'good', fx: s => s.learn += 8 },
  { id: 'gpdeath', once: 1, w: s => s.grand && s.age >= 4 && s.age <= 16 ? 0.12 : 0, t: s => '同居していた祖母が亡くなった。家の中が急に広くなった気がした。', kind: 'sad', fx: s => { s.grand = 0; s.happy -= 5; } },
  { id: 'jhs', once: 1, w: s => s.age === 12 ? 1 : 0, t: s => '中学校に入った。詰め襟とセーラー服の列に並んだ。', kind: 'big' },
  { id: 'club', once: 1, w: s => s.age >= 12 && s.age <= 14 ? 0.5 : 0, t: s => `${pick(s, ['バレー部', '卓球部', '吹奏楽部', '陸上部', 'ソフトボール部'])}に入った。`, kind: 'good', fx: s => { s.health += 3; s.bond += 3; } },
  { id: 'crush', once: 1, w: s => s.age >= 13 && s.age <= 17 ? 0.25 : 0, t: s => '好きな人ができた。目が合うだけで一日が明るかった。', kind: 'good', fx: s => s.happy += 4 },
  { id: 'radio', once: 1, w: s => s.age >= 13 && s.age <= 18 && s.year >= 1965 && s.year < 1985 ? 0.3 : 0, t: s => '深夜ラジオを布団の中で聴いた。', kind: 'good' },
  { id: 'idol', once: 1, w: s => s.age >= 12 && s.age <= 18 && s.year >= 1970 ? 0.3 : 0, t: s => `${s.year < 1977 ? '天地真理' : s.year < 1981 ? 'ピンク・レディー' : '松田聖子'}の歌をレコードがすり切れるほど聴いた。`, kind: 'good' },
  { id: 'gs', once: 1, w: s => s.age >= 13 && s.age <= 19 && s.year >= 1966 && s.year <= 1970 ? 0.4 : 0, t: s => 'グループサウンズに夢中になった。', kind: 'good' },
];
