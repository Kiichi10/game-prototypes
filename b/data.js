// 昔と今、増えた？減った？ — 問題（2026-10-19 公的統計で照合済み。元データ: _調査/verified.json）
// オリンピック参加国数は出典本文を確認できなかったため除外。初任給・喫煙率・初婚年齢は昔の値を一次資料で確認できず除外。
const ITEMS = [
 {
  "label": "1年に生まれた赤ちゃん",
  "unit": "万人",
  "old": {
   "year": 1949,
   "value": 269.7
  },
  "new": {
   "year": 2024,
   "value": 68.6
  },
  "comment": "いちばん多かった1949年の、約4分の1。",
  "source_old": "厚生労働省「令和6年(2024)人口動態統計月報年計(概数)の概況」 付表 人口動態総覧の年次推移（1949年 2,696,638人）",
  "source_new": "厚生労働省「令和6年(2024)人口動態統計月報年計(概数)の概況」（2024年 686,061人）",
  "url_old": "https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/geppo/nengai24/dl/gaikyouR6.pdf",
  "url_new": "https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/geppo/nengai24/dl/gaikyouR6.pdf",
  "note": "日本における日本人のみ（外国人除く）。1949年は沖縄県を含まない。2024年は概数。",
  "confidence": "high"
 },
 {
  "label": "1年に亡くなった人",
  "unit": "万人",
  "old": {
   "year": 1966,
   "value": 67.0
  },
  "new": {
   "year": 2024,
   "value": 160.5
  },
  "comment": "今は、生まれる人の2倍以上が亡くなっています。",
  "source_old": "厚生労働省「令和6年(2024)人口動態統計月報年計(概数)の概況」 付表 人口動態総覧の年次推移（1966年 670,342人）",
  "source_new": "厚生労働省「令和6年(2024)人口動態統計月報年計(概数)の概況」（2024年 1,605,298人）",
  "url_old": "https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/geppo/nengai24/dl/gaikyouR6.pdf",
  "url_new": "https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/geppo/nengai24/dl/gaikyouR6.pdf",
  "note": "日本における日本人のみ。1966年は沖縄県を含まない。2024年は概数。",
  "confidence": "high"
 },
 {
  "label": "1年の結婚",
  "unit": "万組",
  "old": {
   "year": 1972,
   "value": 110.0
  },
  "new": {
   "year": 2024,
   "value": 48.5
  },
  "comment": "1972年が戦後のピークでした。",
  "source_old": "厚生労働省「令和6年(2024)人口動態統計月報年計(概数)の概況」 付表（1972年 1,099,984組）",
  "source_new": "厚生労働省「令和6年(2024)人口動態統計月報年計(概数)の概況」（2024年 485,063組）",
  "url_old": "https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/geppo/nengai24/dl/gaikyouR6.pdf",
  "url_new": "https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/geppo/nengai24/dl/gaikyouR6.pdf",
  "note": "婚姻件数。1972年は沖縄県を含まない（本土復帰前）。1972年が戦後のピーク。",
  "confidence": "high"
 },
 {
  "label": "1年の離婚",
  "unit": "万組",
  "old": {
   "year": 1970,
   "value": 9.6
  },
  "new": {
   "year": 2024,
   "value": 18.6
  },
  "comment": "結婚は半分以下に減ったのに、離婚は約2倍。",
  "source_old": "厚生労働省「令和6年(2024)人口動態統計月報年計(概数)の概況」 付表（1970年 95,937組）",
  "source_new": "厚生労働省「令和6年(2024)人口動態統計月報年計(概数)の概況」（2024年 185,895組）",
  "url_old": "https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/geppo/nengai24/dl/gaikyouR6.pdf",
  "url_new": "https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/geppo/nengai24/dl/gaikyouR6.pdf",
  "note": "離婚件数。1970年は沖縄県を含まない。",
  "confidence": "high"
 },
 {
  "label": "交通事故で亡くなった人",
  "unit": "人",
  "old": {
   "year": 1970,
   "value": 16765
  },
  "new": {
   "year": 2024,
   "value": 2663
  },
  "comment": "1970年は戦後最悪の年。今は約6分の1です。",
  "source_old": "内閣府「令和7年版 交通安全白書」第1章第1節（警察庁統計）",
  "source_new": "内閣府「令和7年版 交通安全白書」（警察庁統計）",
  "url_old": "https://www8.cao.go.jp/koutu/taisaku/r07kou_haku/zenbun/genkyo/h1/h1b1s1_1.html",
  "url_new": "https://www8.cao.go.jp/koutu/taisaku/r07kou_haku/zenbun/genkyo/h1/h1b1s1_1.html",
  "note": "24時間死者（事故後24時間以内に死亡）。1970年は戦後最悪、2024年はその6分の1以下。30日以内死者は別集計。",
  "confidence": "high"
 },
 {
  "label": "映画館に行った人（年間）",
  "unit": "億人",
  "old": {
   "year": 1958,
   "value": 11.27
  },
  "new": {
   "year": 2024,
   "value": 1.44
  },
  "comment": "1958年が戦後最多でした。",
  "source_old": "日本映画製作者連盟 過去データ一覧（1958年 入場者数1,127,452千人）",
  "source_new": "日本映画製作者連盟 過去データ一覧（2024年 入場人員144,441千人）",
  "url_old": "https://www.eiren.org/toukei/data.html",
  "url_new": "https://www.eiren.org/toukei/data.html",
  "note": "全国の映画館の年間入場人員。1958年が戦後最多。",
  "confidence": "high"
 },
 {
  "label": "日本に来た外国人旅行者（年間）",
  "unit": "万人",
  "old": {
   "year": 1970,
   "value": 85.4
  },
  "new": {
   "year": 2025,
   "value": 4268.3
  },
  "comment": "大阪万博の年の、約50倍。",
  "source_old": "日本政府観光局(JNTO)「年別 訪日外客数,出国日本人数の推移」（1970年 854,419人）",
  "source_new": "日本政府観光局(JNTO)同上（2025年 42,683,301人）",
  "url_old": "https://www.jnto.go.jp/statistics/data/_files/20260819_1615-8.pdf",
  "url_new": "https://www.jnto.go.jp/statistics/data/_files/20260819_1615-8.pdf",
  "note": "訪日外客数（観光客以外含む）。1970年は大阪万博の年。",
  "confidence": "high"
 },
 {
  "label": "はがき1枚の料金",
  "unit": "円",
  "old": {
   "year": 1966,
   "value": 7
  },
  "new": {
   "year": 2024,
   "value": 85
  },
  "comment": "約12倍になりました。",
  "source_old": "日本郵政「150周年」資料 郵便料金（封書・葉書）（1966年7月1日 葉書7円）",
  "source_new": "日本郵便「国内の料金表（手紙・はがき）」（2024年10月1日〜 85円）",
  "url_old": "https://www.japanpost.jp/150th/digest/pdf/08.pdf",
  "url_new": "https://www.post.japanpost.jp/send/domestic/charge/list/one_two.html",
  "note": "通常はがき。1966年7月1日に5円から7円へ。2024年10月1日に63円から85円へ。",
  "confidence": "high"
 },
 {
  "label": "女の人の平均寿命",
  "unit": "歳",
  "old": {
   "year": 1950,
   "value": 62.97
  },
  "new": {
   "year": 2024,
   "value": 87.13
  },
  "comment": "70年あまりで、24歳のびました。",
  "source_old": "厚生労働省「令和6年簡易生命表の概況」表2 平均寿命の年次推移（昭和25-27年 完全生命表）",
  "source_new": "厚生労働省「令和6年簡易生命表の概況」表2（令和6年）",
  "url_old": "https://www.mhlw.go.jp/toukei/saikin/hw/life/life24/dl/life24-15.pdf",
  "url_new": "https://www.mhlw.go.jp/toukei/saikin/hw/life/life24/dl/life24-15.pdf",
  "note": "昭和45年以前は沖縄県を除く。",
  "confidence": "high"
 },
 {
  "label": "高校に進む人の割合",
  "unit": "%",
  "old": {
   "year": 1950,
   "value": 42.5
  },
  "new": {
   "year": 2024,
   "value": 98.6
  },
  "comment": "1950年は、高校に進んだのは半分以下でした。",
  "source_old": "文部科学省 学校基本調査 年次統計「進学率」（昭和25年 高等学校等への進学率 通信制を除く 42.5%）",
  "source_new": "文部科学省 学校基本調査 年次統計「進学率」（令和6年 高等学校等への進学率 計 98.6%）",
  "url_old": "https://www.e-stat.go.jp/stat-search/files?tclass=000001015843&cycle=0&layout=datalist",
  "url_new": "https://www.e-stat.go.jp/stat-search/files?tclass=000001015843&cycle=0&layout=datalist",
  "note": "定義が少し違う：1950年は通信制課程を除く系列、2024年は通信制進学者を含む計。",
  "confidence": "medium"
 },
 {
  "label": "小学生の数",
  "unit": "万人",
  "old": {
   "year": 1958,
   "value": 1349.2
  },
  "new": {
   "year": 2024,
   "value": 594.2
  },
  "comment": "1958年が戦後最多。今は半分以下です。",
  "source_old": "文部科学省 学校基本調査 年次統計「在学者数」（1958年 小学校 13,492,087人）",
  "source_new": "文部科学省 学校基本調査 年次統計「在学者数」（2024年 小学校 5,941,733人）",
  "url_old": "https://www.e-stat.go.jp/stat-search/files?tclass=000001015843&cycle=0&layout=datalist",
  "url_new": "https://www.e-stat.go.jp/stat-search/files?tclass=000001015843&cycle=0&layout=datalist",
  "note": "小学校の在学者数（義務教育学校の前期課程は含まない）。1958年が戦後最多。",
  "confidence": "high"
 },
 {
  "label": "女の人が一生に産む子どもの数（平均）",
  "unit": "人",
  "old": {
   "year": 1947,
   "value": 4.54
  },
  "new": {
   "year": 2024,
   "value": 1.15
  },
  "comment": "1947年は4人以上でした。",
  "source_old": "厚生労働省「令和6年(2024)人口動態統計月報年計(概数)の概況」 付表 合計特殊出生率の年次推移（1947年 4.54）",
  "source_new": "厚生労働省「令和6年(2024)人口動態統計月報年計(概数)の概況」（2024年 1.15）",
  "url_old": "https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/geppo/nengai24/dl/gaikyouR6.pdf",
  "url_new": "https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/geppo/nengai24/dl/gaikyouR6.pdf",
  "note": "1947年は沖縄県を含まない。2024年は日本人の概数。",
  "confidence": "high"
 },
 {
  "label": "100歳以上の人",
  "unit": "人",
  "old": {
   "year": 1963,
   "value": 153
  },
  "new": {
   "year": 2025,
   "value": 99763
  },
  "comment": "1963年は153人。今は約650倍です。",
  "source_old": "厚生労働省 報道発表 百歳以上高齢者表彰（令和7年9月12日）の参考資料（昭和38年 153人）",
  "source_new": "同上（令和7年9月 99,763人）",
  "url_old": "https://www.mhlw.go.jp/content/12304250/001562410.pdf",
  "url_new": "https://www.mhlw.go.jp/content/12304250/001562410.pdf",
  "note": "住民基本台帳に基づく9月時点。1963年は老人福祉法が制定された年で、調査の開始年。",
  "confidence": "high"
 },
 {
  "label": "警察が把握した犯罪（刑法犯）",
  "unit": "万件",
  "old": {
   "year": 2002,
   "value": 285.4
  },
  "new": {
   "year": 2024,
   "value": 73.8
  },
  "comment": "2002年が戦後最多。今は約4分の1です。",
  "source_old": "法務省 令和7年版犯罪白書 第1編第1章第1節（平成14年 2,853,739件）",
  "source_new": "法務省 令和7年版犯罪白書 第1編第1章第1節（令和6年 737,679件）",
  "url_old": "https://hakusyo1.moj.go.jp/jp/72/nfm/n72_2_1_1_1_1.html",
  "url_new": "https://hakusyo1.moj.go.jp/jp/72/nfm/n72_2_1_1_1_0.html",
  "note": "刑法犯の認知件数（自動車運転過失致死傷等を除く）。2002年が戦後最多。",
  "confidence": "high"
 },
 {
  "label": "日本の総人口",
  "unit": "万人",
  "old": {
   "year": 1967,
   "value": 10019.6
  },
  "new": {
   "year": 2024,
   "value": 12380.2
  },
  "comment": "1967年に、はじめて1億人を超えました。",
  "source_old": "総務省統計局「人口推計（2024年10月1日現在）」長期時系列表（1967年 100,196千人）",
  "source_new": "総務省統計局「人口推計（2024年10月1日現在）」（123,802千人）",
  "url_old": "https://www.stat.go.jp/data/jinsui/2024np/pdf/2024np.pdf",
  "url_new": "https://www.stat.go.jp/data/jinsui/2024np/pdf/2024np.pdf",
  "note": "1967年は10月1日現在で初めて1億人を超えた年（沖縄県を含まない）。2024年は在日外国人を含む総人口。",
  "confidence": "high"
 },
 {
  "label": "新聞の発行部数",
  "unit": "万部",
  "old": {
   "year": 1997,
   "value": 5376.5
  },
  "new": {
   "year": 2025,
   "value": 2486.8
  },
  "comment": "1997年が過去最多。今は半分以下です。",
  "source_old": "日本新聞協会「新聞の発行部数と世帯数の推移」（1997年10月 53,765,074部）",
  "source_new": "日本新聞協会 同上（2025年10月 24,868,122部）",
  "url_old": "https://www.pressnet.or.jp/data/circulation/circulation01.php",
  "url_new": "https://www.pressnet.or.jp/data/circulation/circulation01.php",
  "note": "一般紙+スポーツ紙の合計（朝夕刊セットは1部と数える）。1997年が過去最多。",
  "confidence": "high"
 },
 {
  "label": "海外旅行に出かけた日本人（年間）",
  "unit": "万人",
  "old": {
   "year": 1964,
   "value": 12.8
  },
  "new": {
   "year": 2025,
   "value": 1473.2
  },
  "comment": "海外旅行が自由になった1964年は、12.8万人でした。",
  "source_old": "日本政府観光局(JNTO)「年別 訪日外客数,出国日本人数の推移」（1964年 127,749人）",
  "source_new": "日本政府観光局(JNTO) 同上（2025年 14,731,615人）",
  "url_old": "https://www.jnto.go.jp/statistics/data/_files/20260819_1615-8.pdf",
  "url_new": "https://www.jnto.go.jp/statistics/data/_files/20260819_1615-8.pdf",
  "note": "出国日本人数。1964年は海外観光渡航が自由化された年。",
  "confidence": "high"
 },
 {
  "label": "大学に進む人の割合",
  "unit": "%",
  "old": {
   "year": 1970,
   "value": 17.1
  },
  "new": {
   "year": 2024,
   "value": 58.6
  },
  "comment": "1970年は6人に1人。今は半分以上です。",
  "source_old": "文部科学省 学校基本調査 年次統計「進学率」（1970年 大学(学部)への進学率 過年度高卒者等を含む）",
  "source_new": "文部科学省 学校基本調査 年次統計「進学率」（2024年 同）",
  "url_old": "https://www.e-stat.go.jp/stat-search/files?tclass=000001015843&cycle=0&layout=datalist",
  "url_new": "https://www.e-stat.go.jp/stat-search/files?tclass=000001015843&cycle=0&layout=datalist",
  "note": "大学学部入学者(過年度高卒者等を含む)÷3年前の中学校等卒業者。短大を含めない。",
  "confidence": "high"
 },
 {
  "label": "夫が会社員・妻が専業主婦の世帯",
  "unit": "万世帯",
  "old": {
   "year": 1980,
   "value": 1114
  },
  "new": {
   "year": 2025,
   "value": 476
  },
  "comment": "1980年は、専業主婦の世帯が共働きの約2倍でした。",
  "source_old": "労働政策研究・研修機構(JILPT)「図12 専業主婦世帯と共働き世帯」（総務省 労働力調査特別調査）",
  "source_new": "JILPT 同上（総務省 労働力調査 詳細集計 2025年）",
  "url_old": "https://www.jil.go.jp/kokunai/statistics/timeseries/html/g0212.html",
  "url_new": "https://www.jil.go.jp/kokunai/statistics/timeseries/html/g0212.html",
  "note": "夫が非農林業雇用者で妻が非就業者の世帯。1980年と2025年では調査が異なる（特別調査→詳細集計）ので厳密には連続しない。",
  "confidence": "medium"
 },
 {
  "label": "夫婦ともに働く世帯（共働き）",
  "unit": "万世帯",
  "old": {
   "year": 1980,
   "value": 614
  },
  "new": {
   "year": 2025,
   "value": 1333
  },
  "comment": "今は、共働きが専業主婦の世帯の約3倍です。",
  "source_old": "JILPT「図12 専業主婦世帯と共働き世帯」（総務省 労働力調査特別調査）",
  "source_new": "JILPT 同上（総務省 労働力調査 詳細集計 2025年）",
  "url_old": "https://www.jil.go.jp/kokunai/statistics/timeseries/html/g0212.html",
  "url_new": "https://www.jil.go.jp/kokunai/statistics/timeseries/html/g0212.html",
  "note": "夫婦ともに非農林業雇用者の世帯。",
  "confidence": "medium"
 },
 {
  "label": "1人が1年に食べるお米の量",
  "unit": "kg",
  "old": {
   "year": 1965,
   "value": 111.7
  },
  "new": {
   "year": 2024,
   "value": 53.3
  },
  "comment": "半分以下になりました。",
  "source_old": "農林水産省「食料自給率に関する統計」食料需給表 消費量の推移（昭和40年度 米 111.7kg）",
  "source_new": "農林水産省 同上（令和6年度 米 53.3kg）",
  "url_old": "https://www.maff.go.jp/j/tokei/sihyo/data/02.html",
  "url_new": "https://www.maff.go.jp/j/tokei/sihyo/data/02.html",
  "note": "国民1人1年当たり供給純食料（年度）。",
  "confidence": "high"
 },
 {
  "label": "小学校の数",
  "unit": "校",
  "old": {
   "year": 1958,
   "value": 26964
  },
  "new": {
   "year": 2024,
   "value": 18822
  },
  "comment": "1958年から、約8,000校減りました。",
  "source_old": "文部科学省 学校基本調査 年次統計「学校数」（1958年 小学校 26,964校）",
  "source_new": "文部科学省 学校基本調査 年次統計「学校数」（2024年 小学校 18,822校）",
  "url_old": "https://www.e-stat.go.jp/stat-search/files?tclass=000001015843&cycle=0&layout=datalist",
  "url_new": "https://www.e-stat.go.jp/stat-search/files?tclass=000001015843&cycle=0&layout=datalist",
  "note": "小学校（義務教育学校は別）。1958年が戦後最多。",
  "confidence": "high"
 },
 {
  "label": "最低賃金（時給・全国平均）",
  "unit": "円",
  "old": {
   "year": 2007,
   "value": 687
  },
  "new": {
   "year": 2025,
   "value": 1121
  },
  "comment": "2007年から約1.6倍です。",
  "source_old": "厚生労働省「地域別最低賃金の全国加重平均額と引上げ率の推移」（平成19年度 687円）",
  "source_new": "厚生労働省 最低賃金に関する基礎資料（令和7年度 1,121円）",
  "url_old": "https://www.mhlw.go.jp/file/04-Houdouhappyou-11201250-Roudoukijunkyoku-Roudoujoukenseisakuka/17072716.pdf",
  "url_new": "https://www.mhlw.go.jp/content/11201250/001662736.pdf",
  "note": "適用労働者数による全国加重平均。",
  "confidence": "high"
 },
 {
  "label": "紅白歌合戦の視聴率（関東）",
  "unit": "%",
  "old": {
   "year": 1984,
   "value": 78.1
  },
  "new": {
   "year": 2024,
   "value": 32.7
  },
  "comment": "1984年は、約8割の家庭が見ていました。",
  "source_old": "ビデオリサーチ「音楽高世帯視聴率番組 スペシャル」第35回NHK紅白歌合戦 1984年12月31日21:00〜（78.1%）",
  "source_new": "ビデオリサーチ「2024年 年間高個人視聴率番組30（関東地区）」第75回NHK紅白歌合戦 21:00〜（世帯32.7%）",
  "url_old": "https://www.videor.co.jp/tvrating/past_tvrating/music/01/post-14.html",
  "url_new": "https://www.videor.co.jp/tvrating/past_tvrating/top30/202430.html",
  "note": "関東地区の番組平均世帯視聴率。",
  "confidence": "high"
 },
 {
  "label": "65歳以上の人の割合",
  "unit": "%",
  "old": {
   "year": 1950,
   "value": 4.9
  },
  "new": {
   "year": 2024,
   "value": 29.3
  },
  "comment": "1950年は20人に1人。今は3.4人に1人です。",
  "source_old": "総務省統計局「人口推計（2024年10月1日現在）」表4 年齢3区分別人口の推移（1950年 国勢調査）",
  "source_new": "総務省統計局「人口推計（2024年10月1日現在）」表4。",
  "url_old": "https://www.stat.go.jp/data/jinsui/2024np/pdf/2024np.pdf",
  "url_new": "https://www.stat.go.jp/data/jinsui/2024np/pdf/2024np.pdf",
  "note": "総人口に占める割合。1950年は国勢調査（沖縄県を含まない）。",
  "confidence": "high"
 },
 {
  "label": "15歳未満の子どもの割合",
  "unit": "%",
  "old": {
   "year": 1950,
   "value": 35.4
  },
  "new": {
   "year": 2024,
   "value": 11.2
  },
  "comment": "1950年は3人に1人が子ども。今は9人に1人です。",
  "source_old": "総務省統計局「人口推計（2024年10月1日現在）」表4（1950年 国勢調査）",
  "source_new": "総務省統計局「人口推計（2024年10月1日現在）」表4。",
  "url_old": "https://www.stat.go.jp/data/jinsui/2024np/pdf/2024np.pdf",
  "url_new": "https://www.stat.go.jp/data/jinsui/2024np/pdf/2024np.pdf",
  "note": "総人口に占める割合。1950年は国勢調査（沖縄県を含まない）。",
  "confidence": "high"
 },
 {
  "label": "携帯電話の契約数",
  "unit": "万件",
  "old": {
   "year": 1995,
   "value": 1020.4
  },
  "new": {
   "year": 2024,
   "value": 22979.5
  },
  "comment": "今は、日本の人口より多い約2.3億件です。",
  "source_old": "総務省 情報通信統計データベース「携帯電話・PHSの加入契約数の推移」（平成7年度末 10,204,023）",
  "source_new": "総務省 情報通信統計データベース 同上（令和6年度末 229,794,999）",
  "url_old": "https://www.soumu.go.jp/johotsusintokei/field/tsuushin02.html",
  "url_new": "https://www.soumu.go.jp/johotsusintokei/field/tsuushin02.html",
  "note": "携帯電話のみ(PHS除く)。年度末＝翌年3月末。1995年度末は1996年3月末、2024年度末は2025年3月末。",
  "confidence": "high"
 },
 {
  "label": "固定電話の契約数",
  "unit": "万件",
  "old": {
   "year": 1996,
   "value": 6152.6
  },
  "new": {
   "year": 2024,
   "value": 1101.7
  },
  "comment": "約6分の1になりました。",
  "source_old": "総務省 情報通信統計データベース「加入電話及びISDNの加入数」（平成8年度末 加入電話 6,152.6万）",
  "source_new": "総務省 同上（令和6年度末 加入電話 1,101.7万）",
  "url_old": "https://www.soumu.go.jp/johotsusintokei/field/tsuushin02.html",
  "url_new": "https://www.soumu.go.jp/johotsusintokei/field/tsuushin02.html",
  "note": "アナログ加入電話の全体契約数(ISDN除く)。年度末＝翌年3月末。",
  "confidence": "high"
 },
 {
  "label": "CDの生産金額",
  "unit": "億円",
  "old": {
   "year": 1998,
   "value": 5879
  },
  "new": {
   "year": 2024,
   "value": 1402
  },
  "comment": "約4分の1になりました。",
  "source_old": "日本レコード協会「日本のレコード産業2025」CD生産金額（1998年 8cm+12cm 合計587,878百万円）",
  "source_new": "日本レコード協会「日本のレコード産業2025」（2024年 CD 140,238百万円）",
  "url_old": "https://adm.riaj.or.jp/sites/default/files/2025-05/%E6%97%A5%E6%9C%AC%E3%81%AE%E3%83%AC%E3%82%B3%E3%83%BC%E3%83%88%E3%82%99%E7%94%A3%E6%A5%AD2025%E5%B9%B4%E7%89%88.pdf",
  "url_new": "https://adm.riaj.or.jp/sites/default/files/2025-05/%E6%97%A5%E6%9C%AC%E3%81%AE%E3%83%AC%E3%82%B3%E3%83%BC%E3%83%88%E3%82%99%E7%94%A3%E6%A5%AD2025%E5%B9%B4%E7%89%88.pdf",
  "note": "生産金額(出荷ベース)。1998年は表の8cmシングルと12cmアルバムの合計（原表に「CD計」行は無い）。",
  "confidence": "medium"
 },
 {
  "label": "食料自給率（カロリーベース）",
  "unit": "%",
  "old": {
   "year": 1965,
   "value": 73
  },
  "new": {
   "year": 2024,
   "value": 38
  },
  "comment": "約半分になりました。",
  "source_old": "農林水産省「食料自給率に関する統計」食料需給表（昭和40年度 73%）",
  "source_new": "農林水産省 同上（令和6年度 38%。令和5年度も38%）",
  "url_old": "https://www.maff.go.jp/j/tokei/sihyo/data/02.html",
  "url_new": "https://www.maff.go.jp/j/tokei/sihyo/data/02.html",
  "note": "年度。",
  "confidence": "high"
 }
];
