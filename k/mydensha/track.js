// ぼくの でんしゃ — せんろ（おもちゃの レールを つないだ ばん）の しくみ
// レールは マス目に おく。1マス = TILE。みちすじを [x,y] の ならびで かくと、
// となりの マスとの むきから「どの へりと どの へりが つながっているか」を じどうで きめる。
(function () {
  'use strict';
  const T = {};
  window.TRACK = T;

  const TILE = 88;
  T.TILE = TILE;
  // むき: 0=みぎ 1=した 2=ひだり 3=うえ
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
  T.DX = DX; T.DY = DY;
  const opp = d => (d + 2) % 4;
  T.opp = opp;
  const key = (x, y) => x + ',' + y;
  T.key = key;

  // へりの 中心（マスの 中心から みた ずれ）
  function edgePt(d) { return { x: DX[d] * TILE / 2, y: DY[d] * TILE / 2 }; }
  T.edgePt = edgePt;

  // みちすじ（[x,y] の ならび）から レールの つながりを つくる
  // branches: [{ from: [x,y], path: [[x,y], ...] }]  from は 本線上の マス
  T.build = function (main, branches, marks) {
    const cells = new Map();
    const add = (x, y, d) => {
      const k = key(x, y);
      if (!cells.has(k)) cells.set(k, { x, y, dirs: [], type: 'rail' });
      const c = cells.get(k);
      if (!c.dirs.includes(d)) c.dirs.push(d);
      return c;
    };
    function layPath(path, startCell) {
      for (let i = 0; i < path.length; i++) {
        const [x, y] = path[i];
        const prev = i === 0 ? startCell : path[i - 1];
        const next = path[i + 1];
        if (prev) { const d = dirBetween([x, y], prev); add(x, y, d); add(prev[0], prev[1], opp(d)); }
        if (next) { const d = dirBetween([x, y], next); add(x, y, d); }
        if (!prev && !next) add(x, y, 0);
      }
    }
    function dirBetween(a, b) {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      for (let d = 0; d < 4; d++) if (DX[d] === Math.sign(dx) && DY[d] === Math.sign(dy) && (dx === 0 || dy === 0)) return d;
      return 0;
    }
    layPath(main, null);
    (branches || []).forEach(b => layPath(b.path, b.from));
    // ポイント（へりが 3つ いじょう）に しるしを つける
    for (const c of cells.values()) if (c.dirs.length >= 3) { c.type = 'switch'; T.splitSwitch(c); }
    // えき・しゃこ・ふみきり などの しるし
    (marks || []).forEach(m => {
      const c = cells.get(key(m.x, m.y));
      if (c) { c.type = m.type; c.name = m.name; c.col = m.col; c.animal = m.animal; if (m.wait != null) c.wait = m.wait; if (m.out != null) c.out = m.out; }
    });
    return cells;
  };

  // ポイントの「まっすぐ（ほんせん）」と「わかれみち（しせん）」を わける
  T.splitSwitch = function (cell) {
    for (const a of cell.dirs) {
      if (cell.dirs.includes(opp(a))) {
        cell.trunk = [a, opp(a)];
        cell.branch = cell.dirs.find(d => d !== a && d !== opp(a));
        return;
      }
    }
    cell.trunk = [cell.dirs[0], cell.dirs[1]];
    cell.branch = cell.dirs[2];
  };

  // マスの 中で「どの へりから どの へりへ」すすむ みちの かたちを かえす
  // enter / exit は へりの むき（マスの 中心から みた むき）
  T.pathIn = function (enter, exit) {
    const a = edgePt(enter), b = edgePt(exit);
    if (enter === exit) {                    // いきどまり（まんなかまで いって おりかえす）
      return { kind: 'stub', a, len: TILE };
    }
    if (opp(enter) === exit) {               // まっすぐ
      return { kind: 'line', a, b, len: TILE };
    }
    // カーブ（4ぶんの1の えん）
    const c = { x: a.x + b.x, y: a.y + b.y };
    const r = TILE / 2;
    let a0 = Math.atan2(a.y - c.y, a.x - c.x), a1 = Math.atan2(b.y - c.y, b.x - c.x);
    let d = a1 - a0;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return { kind: 'arc', c, r, a0, d, len: Math.abs(d) * r };
  };

  // みちの うえの いち（0〜1）と むき
  T.at = function (p, u) {
    if (p.kind === 'stub') {
      // へり → まんなか → へり（おりかえし）
      const inAng = Math.atan2(-p.a.y, -p.a.x);
      if (u <= 0.5) {
        const k = u * 2;
        return { x: p.a.x * (1 - k), y: p.a.y * (1 - k), ang: inAng };
      }
      const k = (u - 0.5) * 2;
      return { x: p.a.x * k, y: p.a.y * k, ang: inAng + Math.PI };
    }
    if (p.kind === 'line') {
      return { x: p.a.x + (p.b.x - p.a.x) * u, y: p.a.y + (p.b.y - p.a.y) * u,
               ang: Math.atan2(p.b.y - p.a.y, p.b.x - p.a.x) };
    }
    const a = p.a0 + p.d * u;
    return { x: p.c.x + Math.cos(a) * p.r, y: p.c.y + Math.sin(a) * p.r,
             ang: a + (p.d > 0 ? Math.PI / 2 : -Math.PI / 2) };
  };
})();
