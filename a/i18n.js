// 画面の文言（日本語・英語）
function wareki(y) {
  if (y >= 2019) return `令和${y === 2019 ? '元' : y - 2018}年`;
  if (y >= 1989) return `平成${y === 1989 ? '元' : y - 1988}年`;
  if (y >= 1926) return `昭和${y - 1925}年`;
  return `大正${y - 1911}年`;
}
const decade = y => { const d = Math.floor(y / 10) * 10, p = y % 10; return `the ${p <= 3 ? 'early' : p <= 6 ? 'mid' : 'late'} '${String(d).slice(2)}s`; };

const STR = {
  ja: {
    htmlTitle: 'あなたの感覚は、何年生まれ？', other: 'English', tag: '10問・約1分',
    h1: 'あなたの感覚は、<br><span class="r">何年生まれ</span>？',
    lead: '電話のかけ方、返事の打ち方、暑い日にまず手に取るもの。<br>ふだんの何気ない答えから、あなたの「感覚の生まれ年」を当てます。実年齢は、最後に答え合わせします。',
    strip: ['昭和', '平成', '令和'], start: 'はじめる', calc: 'あなたの感覚を判定しています…',
    pre: 'あなたの感覚は', unit: '年生まれ', sub: y => `（${wareki(y)}）`,
    realH: '答え合わせ：本当は何年生まれ？', realPh: '選んでください（任意）', realOpt: v => `${v}年（${wareki(v)}）`,
    spreadH: '答えのばらつき', share: 'Xで結果を投稿', save: '画像を保存', again: '別の10問で', ansH: 'あなたの答え',
    note: '※判定は、それぞれの答えを選びがちな世代の目安から計算した遊びです。統計にもとづくものではありません。',
    qn: (i, n) => `Q${i} / ${n}`,
    era: y => y < 1965 ? '昭和前半' : y < 1989 ? '昭和後半' : y < 2005 ? '平成前半' : '平成後半〜',
    spread: (s, name) => s < 7 ? `どの質問でも同じ時代の答えを選んでいます。筋金入りの「${name}」です。` : s < 13 ? 'だいたい同じ時代ですが、ところどころ別の世代の顔がのぞきます。' : '答えが時代をまたいでいます。昭和と令和を行き来する、器用な感覚の持ち主です。',
    gap: d => Math.abs(d) <= 2 ? '実年齢とほぼ同じ。<span class="r">年相応</span>の感覚です。' : d > 0 ? `実年齢より<span class="r">${d}歳 年上</span>の感覚です。` : `実年齢より<span class="r">${-d}歳 若い</span>感覚です。`,
    gapTail: d => Math.abs(d) <= 2 ? '' : d > 0 ? (d >= 15 ? '<br>落ち着きが、もはや親世代。' : '<br>ちょっと渋めの感覚かもしれません。') : (-d >= 15 ? '<br>職場で一番話が通じるのは、たぶん新人です。' : '<br>新しいものへの抵抗が少ないタイプです。'),
    shareText: (y, name, d) => `私の感覚は「${y}年生まれ（${wareki(y)}）」でした。タイプは「${name}」` + (d != null && Math.abs(d) > 2 ? `。実年齢より${Math.abs(d)}歳${d > 0 ? '年上' : '若い'}感覚らしい。` : '。') + '\n#感覚は何年生まれ',
    cardPre: '私の感覚は', cardGap: d => Math.abs(d) <= 2 ? '実年齢とほぼ同じ感覚' : `実年齢より ${Math.abs(d)}歳 ${d > 0 ? '年上' : '若い'} 感覚`,
    file: y => `感覚は${y}年生まれ.png`,
    serif: '"Hiragino Mincho ProN", "Yu Mincho", serif', sans: '"Hiragino Sans", sans-serif',
  },
  en: {
    htmlTitle: 'What year were your instincts born?', other: '日本語', tag: '10 questions · 1 minute',
    h1: 'What year were<br>your <span class="r">instincts</span> born?',
    lead: 'How you make a call. How you laugh in a text. What you do when you\'re lost.<br>From small everyday answers, we\'ll guess the year your instincts were born. Your real age comes last.',
    strip: ['Boomer', 'Millennial', 'Gen Z'], start: 'Start', calc: 'Reading your instincts…',
    pre: 'Your instincts were born in', unit: '', sub: y => `(${decade(y)})`,
    realH: 'Reality check: when were you actually born?', realPh: 'Choose a year (optional)', realOpt: v => `${v}`,
    spreadH: 'How spread out your answers were', share: 'Post your result on X', save: 'Save image', again: '10 new questions', ansH: 'Your answers',
    note: 'Just for fun. Each answer is scored by the generation that tends to pick it. This is not based on survey data.',
    qn: (i, n) => `Q${i} of ${n}`,
    era: y => `'${String(Math.floor(y / 10) * 10).slice(2)}s vibe`,
    spread: (s, name) => s < 7 ? `Every answer came from the same era. You are ${name} to the core.` : s < 13 ? 'Mostly one era, with a few answers from another generation.' : 'Your answers jump across decades. You move between eras with ease.',
    gap: d => Math.abs(d) <= 2 ? 'Right on target. Your instincts <span class="r">match your age</span>.' : d > 0 ? `Your instincts are <span class="r">${d} years older</span> than you.` : `Your instincts are <span class="r">${-d} years younger</span> than you.`,
    gapTail: d => Math.abs(d) <= 2 ? '' : d > 0 ? (d >= 15 ? '<br>You\'re basically your parents now.' : '<br>A little old-school, in a good way.') : (-d >= 15 ? '<br>The interns probably get you best.' : '<br>New things don\'t scare you.'),
    shareText: (y, name, d) => `My instincts were born in ${y}. I'm a "${name}"` + (d != null && Math.abs(d) > 2 ? `, ${Math.abs(d)} years ${d > 0 ? 'older' : 'younger'} than my real age.` : '.') + '\n#InstinctYear',
    cardPre: 'My instincts were born in', cardGap: d => Math.abs(d) <= 2 ? 'Same as my real age' : `${Math.abs(d)} years ${d > 0 ? 'older' : 'younger'} than my real age`,
    file: y => `instincts-born-${y}.png`,
    serif: 'Georgia, "Times New Roman", serif', sans: '-apple-system, "Helvetica Neue", Arial, sans-serif',
  },
};
// 言語の決定：?lang= > 保存した選択 > ブラウザの言語
function pickLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q && STR[q]) return q;
  try { const s = localStorage.getItem('instinct_lang'); if (s && STR[s]) return s; } catch (e) { }
  return (navigator.language || 'en').toLowerCase().startsWith('ja') ? 'ja' : 'en';
}
