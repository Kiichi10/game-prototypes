// 思い出のお菓子・おもちゃ（試作用72件）
// ★発売年・特徴は試作用の見立て（未照合）。外れた時に遊ぶ人が教えてくれる仕組みで直していく前提。
// [名前, 登場した年, 特徴（?付き=どちらとも言える）, 一言]
const OMOIDE = [
  // ── お菓子 ──
  ['うまい棒', 1979, 'food salty bag dagashi still chara stick corn', '10円で買えた国民的駄菓子'],
  ['ビックリマンチョコ', 1977, 'food choco bag omake collect chara boom still anime ?biscuit', 'シール目当てでお菓子を捨てる子が社会問題に'],
  ['よっちゃんイカ', 1965, 'food ?salty bag dagashi still fish', '酢漬けのイカ。当たり付き'],
  ['ねるねるねるね', 1986, 'food ?candy ?bag build ?chara still ?boom', '「ねればねるほど色が変わって」'],
  ['カール', 1968, 'food salty bag ?still chara corn', 'カールおじさんの「それにつけてもおやつはカール」'],
  ['ポテトチップス（カルビー）', 1975, 'food salty bag still', '袋を開けると止まらない'],
  ['きのこの山', 1975, 'food choco box still biscuit nature mushroom', 'きのこ派・たけのこ派の論争は今も続く'],
  ['たけのこの里', 1979, 'food choco box still biscuit nature', 'きのこの山の弟分'],
  ['コアラのマーチ', 1984, 'food choco box chara still biscuit', 'まゆげコアラを探した'],
  ['ポッキー', 1966, 'food choco box still stick biscuit', '11月11日はポッキーの日'],
  ['プリッツ', 1963, 'food salty box still stick biscuit', 'ポッキーより先に生まれた'],
  ['チョコボール', 1967, 'food choco box omake chara still round', '金のエンゼルで「おもちゃのカンヅメ」'],
  ['ガリガリ君', 1981, 'food ice chara still ?dagashi omake stick', '当たり棒が出るともう1本'],
  ['パピコ', 1974, 'food ice ?choco still', '2本に分けて半分こ'],
  ['ホームランバー', 1960, 'food ice ?dagashi omake still stick', '当たりが出たらもう1本'],
  ['雪見だいふく', 1981, 'food ice box still round', '2個入りのアイス大福'],
  ['ピノ', 1976, 'food ice choco box still ?round', '星形やハート形が出ると幸運'],
  ['ハイチュウ', 1975, 'food candy still', '噛むほどやわらかいソフトキャンディ'],
  ['チロルチョコ', 1962, 'food choco dagashi still', '10円玉で買えた四角いチョコ'],
  ['ブラックサンダー', 1994, 'food choco bag ?dagashi still ?biscuit', '若い女性にバカ売れ'],
  ['ベビースターラーメン', 1959, 'food salty bag dagashi chara still', 'ラーメンのかけらをおやつに'],
  ['都こんぶ', 1931, 'food ?salty box dagashi still fish', '酢昆布。赤い箱'],
  ['ココアシガレット', 1951, 'food candy box dagashi still stick', 'タバコの真似をして食べた'],
  ['モロッコヨーグル', 1961, 'food ?candy dagashi still', '小さなカップを木のさじで'],
  ['フエラムネ', 1973, 'food candy omake dagashi still round', '吹くと音が鳴るラムネ。おもちゃ付き'],
  ['蒲焼さん太郎', 1985, 'food salty bag dagashi chara still fish', '魚のすり身の駄菓子'],
  ['キャベツ太郎', 1982, 'food salty bag dagashi chara still corn nature round', 'キャベツは入っていない'],
  ['ブタメン', 1992, 'food salty dagashi chara still', '駄菓子屋でお湯を入れてもらった'],
  ['マーブルチョコ', 1961, 'food choco box still round', '筒に入った色とりどりのチョコ'],
  ['アポロチョコ', 1969, 'food choco box still twotone', 'いちごとチョコの二層'],
  ['ミルキー', 1951, 'food candy box chara still', 'ペコちゃんの「ミルキーはママの味」'],
  ['じゃがりこ', 1995, 'food salty box still stick', 'カップに入ったスティック'],
  ['とんがりコーン', 1978, 'food salty box still corn', '指にはめて食べた'],
  ['ハッピーターン', 1976, 'food ?salty bag still', '魔法の粉（ハッピーパウダー）'],
  ['おっとっと', 1982, 'food salty box chara still fish', '海の生き物の形'],
  ['たべっ子どうぶつ', 1978, 'food box chara still biscuit', '動物の英語名が書いてある'],
  ['カントリーマアム', 1984, 'food ?choco bag still biscuit', 'レンジで温めるとおいしい'],
  ['果汁グミ', 1988, 'food candy bag still', '果汁100%のグミ'],
  ['ポケモンパン', 1998, 'food bag omake collect chara anime boom still', 'デコキャラシール集め'],
  ['チョコエッグ', 1999, 'food choco omake collect boom ?still', '中から動物フィギュア'],
  // ── おもちゃ・遊び ──
  ['ファミコン', 1983, 'toy elec screen ?battle boom', 'カセットにフーフー息を吹きかけた'],
  ['スーパーファミコン', 1990, 'toy elec screen battle boom', 'マリオカートで対戦'],
  ['ゲームボーイ', 1989, 'toy elec screen ?battle boom portable', '通信ケーブルでポケモン交換'],
  ['プレイステーション', 1994, 'toy elec screen ?battle boom', 'CDで遊ぶゲーム機'],
  ['たまごっち', 1996, 'toy elec screen chara boom ?girls portable', '学校に持ち込んで没収された'],
  ['ミニ四駆', 1982, 'toy elec build battle boom ?outdoor anime', 'コースで友だちと競争'],
  ['ベイブレード', 1999, 'toy spin battle boom anime', '「3、2、1、ゴーシュート！」'],
  ['ベーゴマ', 1920, 'toy spin battle outdoor', 'ひもを巻いて回す'],
  ['けん玉', 1919, 'toy ?spin ?outdoor portable', '「もしかめ」で何回続くか'],
  ['メンコ', 1900, 'toy battle collect outdoor ?chara', '地面に叩きつけてひっくり返す'],
  ['ルービックキューブ', 1980, 'toy boom', '6面そろえられた？'],
  ['リカちゃん人形', 1967, 'toy girls chara ?collect', '着せ替え人形'],
  ['シルバニアファミリー', 1985, 'toy girls chara collect', '動物の家族とおうち'],
  ['ポケモンカード', 1996, 'toy collect battle chara anime boom portable', 'キラカードを交換した'],
  ['遊戯王カード', 1999, 'toy collect battle anime boom portable', '「デュエル！」'],
  ['ハイパーヨーヨー', 1997, 'toy spin boom portable', '「犬の散歩」の技'],
  ['ビーダマン', 1993, 'toy battle anime ?build', 'ビー玉を撃ち出す'],
  ['黒ひげ危機一発', 1975, 'toy battle chara', '剣を刺して黒ひげが飛んだら負け'],
  ['人生ゲーム', 1968, 'toy battle', 'ルーレットを回して人生を進む'],
  ['ガンプラ', 1980, 'toy build collect anime boom', 'ガンダムのプラモデル'],
  ['キン消し', 1983, 'toy collect battle anime boom', 'キン肉マンの消しゴム人形'],
  ['超合金', 1974, 'toy collect anime', '重たい金属のロボット'],
  ['スーパーボール', 1965, 'toy outdoor dagashi portable', 'とんでもなく弾むゴムボール'],
  ['竹とんぼ', 1700, 'toy spin outdoor ?build', '手でこすって飛ばす'],
  ['フラフープ', 1958, 'toy ?spin outdoor boom', '腰で回す輪'],
  ['ダッコちゃん', 1960, 'toy boom chara', '腕にしがみつくビニール人形'],
  ['プリクラ', 1995, 'toy elec girls collect boom ?portable', '手帳にびっしり貼った'],
  ['ラジコン', 1970, 'toy elec outdoor ?battle ?build', 'リモコンで走らせる車'],
  ['練り消し', 1980, 'toy ?dagashi ?build portable', '消しゴムのカスを練って作った'],
  ['ゾイド', 1983, 'toy build elec collect anime', '電池で動く動物型メカ'],
  ['ヨーヨー', 1933, 'toy spin portable', '昔ながらのヨーヨー'],
  ['お手玉', 1700, 'toy ?spin girls portable', '小豆の入った布袋を投げて受ける'],
];

// 質問（日本語）。食べ物にだけ聞く質問は、おもちゃには「関係なし(null)」を返す
const OQ = [
  ['food', '食べ物ですか？'],
  ['toy', 'おもちゃや遊び道具ですか？'],
  ['choco', 'チョコレートが使われていますか？', 'food'],
  ['salty', 'しょっぱい味ですか？', 'food'],
  ['ice', 'アイスですか？', 'food'],
  ['candy', 'アメ・ガム・グミ・ラムネのように、なめたり噛んだりするお菓子ですか？', 'food'],
  ['bag', '袋に入って売られていますか？', 'food'],
  ['box', '箱やカップに入って売られていますか？', 'food'],
  ['dagashi', '駄菓子屋で、数十円で買えましたか？'],
  ['omake', 'おまけ（シール・おもちゃ・当たりなど）が付いていますか？', 'food'],
  ['chara', 'キャラクターや動物の絵・形が入っていますか？'],
  ['still', '今もお店で普通に売っていますか？', 'food'],
  ['elec', '電池や電気で動きますか？', 'toy'],
  ['screen', '画面がついていますか？', 'toy'],
  ['collect', '集めて楽しむものですか？'],
  ['spin', '回したり、投げたり、飛ばしたりして遊びますか？', 'toy'],
  ['outdoor', '外で遊ぶことが多いですか？', 'toy'],
  ['girls', '主に女の子に人気がありましたか？', 'toy'],
  ['battle', '友だちと対戦したり、勝ち負けを競ったりしますか？', 'toy'],
  ['build', '組み立てたり、自分で作ったりしますか？'],
  ['anime', 'テレビアニメや漫画と関係がありますか？'],
  ['boom', '社会現象になるほどの大ブームがありましたか？'],
  ['stick', '細長い棒の形ですか？'],
  ['corn', 'とうもろこし（コーン）からできていますか？', 'food'],
  ['fish', 'イカ・魚・海藻など、海のものの味や形ですか？', 'food'],
  ['biscuit', 'ビスケットやクッキーの部分がありますか？', 'food'],
  ['round', '丸い粒やボールのような形ですか？'],
  ['nature', '野菜やきのこなど、植物の名前や形が入っていますか？', 'food'],
  ['mushroom', 'きのこの形ですか？', 'food'],
  ['twotone', '2色・2層になっていますか？', 'food'],
  ['portable', 'ポケットに入れて持ち歩けますか？', 'toy'],
  ['y1985', '1985年より前からありますか？', null, 1985],
  ['y1910', '江戸・明治からある、昔ながらのものですか？', null, 1910],
  ['y1970', '1970年より前からありますか？', null, 1970],
  ['y1980', '1980年より前からありますか？', null, 1980],
  ['y1990', '1990年以降に出てきたものですか？', null, -1990],
];

// 文字列の特徴を、エンジン用の候補と質問に変換する
function omoideCands(extra = []) {
  return OMOIDE.concat(extra).map(([name, year, tags, note], id) => {
    const t = {};
    String(tags).split(/\s+/).filter(Boolean).forEach(s => s[0] === '?' ? t[s.slice(1)] = 0.5 : t[s] = 1);
    return { id, name, year, t, note, kind: t.food ? 'food' : 'toy', w: 1 };
  });
}
function omoideQuestions(exactYear = false) { // exactYear: 境目の年もはっきり答える（毎日のお題用）
  return OQ.map(([id, text, only, yr]) => ({
    id, text, f: c => {
      if (only && c.kind !== only) return null;
      if (yr) {
        if (c.year == null) return null;
        const b = Math.abs(yr), before = c.year < b, near = !exactYear && Math.abs(c.year - b) <= 2;
        if (near) return 0.5;
        return yr > 0 ? (before ? 1 : 0) : (before ? 0 : 1);
      }
      return c.t[id] ?? 0;
    },
  }));
}
