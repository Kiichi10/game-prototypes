// 案内役（ブラウン管テレビ）を描いて、表情を切り替える
function tvHTML() {
  return '<div class="tv" id="tv"><div class="ant"></div><div class="body"></div><div class="scr"><div class="eye e1"></div><div class="eye e2"></div><div class="mouth"></div><div class="drop"></div></div><div class="knob k1"></div><div class="knob k2"></div><div class="leg l1"></div><div class="leg l2"></div></div>';
}
function tvMood(m) { const t = document.getElementById('tv'); if (t) t.className = 'tv ' + (m || ''); }
