/* Client-side game log localization (English server log → Japanese display) */
(function (global) {
  'use strict';

  var namePairs = null;

  var SKILL_BRACKETS = {
    'On Enter': '登場時',
    'On Leave': '退場時',
    'Live Start': 'ライブ開始',
    'Live Success': 'ライブ成功',
    'Activated': '起動',
    'Always': '常時',
    'Automatic': '自動',
    'Auto': '自動',
    'Once per turn': 'ターン1回',
    'Center': 'センター',
    'Yell': 'エール',
  };

  var SLOT_JA = { left: '左', center: 'センター', right: '右' };

  /** Regex rules applied after card-name swap (order matters). */
  var PHRASE_RULES = [
    [/^=== LIVE Phase ===$/, '=== ライブフェイズ ==='],
    [/^=== Performance Phase ===$/, '=== パフォーマンスフェイズ ==='],
    [/^=== Live Show ===$/, '=== ライブショー ==='],
    [/^=== Live Win\/Loss Check ===$/, '=== ライブ勝敗判定 ==='],
    [/^=== Turn (\d+) begins ===$/, '=== ターン$1 開始 ==='],
    [/^--- Turn (\d+) ---$/, '--- ターン $1 ---'],
    [/^Game started! Coin flip — winner chooses who goes first\.$/, 'ゲーム開始！コイントス — 勝者が先攻を選びます。'],
    [/^Preparation: each player drew 6 cards and placed 3 Energy in storage\.$/, '準備：各プレイヤーは6枚引き、エネルギー3枚を置きました。'],
    [/^Preparation — Mulligan: you may replace any number of opening hand cards once\.$/, '準備 — マリガン：初手を任意枚数、1回だけ入れ替えできます。'],
    [/^LIVE Phase: place 0–3 cards \(Live or Member\) face-down in Live storage \(draw 1 per card placed\), then end LIVE Phase\.$/, 'ライブフェイズ：ライブ置き場に0〜3枚（ライブまたはメンバー）を裏向きで置き（1枚につき1枚ドロー）、ライブフェイズを終了。'],
    [/^Both players reveal Live storage simultaneously\.$/, '両プレイヤーが同時にライブ置き場を公開。'],
    [/^No Lives played this turn\.$/, 'このターンはライブなし。'],
    [/^Remaining Live storage sent to Waiting Room\.$/, '残りのライブ置き場のカードを控え室へ。'],
    [/^Neither player had cards in hand to put into the Waiting Room\.$/, '手札を控え室に置けるカードがどちらもありませんでした。'],
    [/^Neither player could draw \(deck empty\)\.$/, 'どちらもドローできませんでした（デッキが空）。'],
    [/^CPU deck: (.+)$/, 'CPUデッキ：$1'],
    [/ — End Main Phase\.$/, ' — メインフェイズ終了。'],
    [/ completed mulligan\.$/, ' マリガン完了。'],
    [/ resigned\. (.+) wins!$/, ' リタイア。$1 の勝利！'],
    [/ WINS with 3 successful Lives!$/, ' ライブ3回成功で勝利！'],
    [/ used Baton Touch! Cost reduced to (\d+)\.$/, ' バトンタッチ！コストが$1に減少。'],
    [/ used second Baton Touch! Cost reduced to (\d+)\.$/, ' 2枚目のバトンタッチ！コストが$1に減少。'],
    [/ overplayed onto (.+)\.$/, ' $1の上に上書きプレイ。'],
    [/ played (.+) to (left|center|right) area\.$/, function (_m, card, slot) {
      return ' ' + card + 'を' + (SLOT_JA[slot] || slot) + 'エリアにプレイ。';
    }],
    [/ — Draw Phase: could not draw \(deck and Waiting Room empty\)\.$/, ' — ドローフェイズ：ドロー不可（デッキと控え室が空）。'],
    [/ — Draw Phase\.$/, ' — ドローフェイズ。'],
    [/ — Active Phase: Energy and Members refreshed\.$/, ' — アクティブフェイズ：エネルギーとメンバーをアクティブに。'],
    [/ — Energy Phase: storage full \((\d+)\/(\d+)\), no Energy added\.$/, ' — エネルギーフェイズ：置き場満杯（$1/$2）、エネルギー追加なし。'],
    [/ — Energy Phase: no cards left in Energy deck\.$/, ' — エネルギーフェイズ：エネルギーデッキにカードなし。'],
    [/ — Energy Phase: placed 1 Energy in storage \((\d+)\/(\d+)\)\.$/, ' — エネルギーフェイズ：エネルギー1枚を置き場に（$1/$2）。'],
    [/ — \[([^\]]+)\] drew (\d+) \(Active → Wait\)\.$/, ' — [$1] $2枚ドロー（アクティブ→ウェイト）。'],
    [/ — \[([^\]]+)\] optional skill skipped\.$/, ' — [$1] スキルをスキップ。'],
    [/ — \[([^\]]+)\] activated\.$/, ' — [$1] 起動。'],
    [/ — \[([^\]]+)\] Live Start skipped\.$/, ' — [$1] ライブ開始スキップ。'],
    [/ — \[([^\]]+)\] Live Success skipped\.$/, ' — [$1] ライブ成功スキップ。'],
    [/put 1 Energy from Energy deck into Wait\./, 'エネルギーデッキからエネルギー1枚をウェイトに。'],
    [/could not put Energy into Wait \(Energy deck empty\)\./, 'エネルギーをウェイトに置けません（エネルギーデッキが空）。'],
    [/added (\d+) Member cards? from Waiting Room to hand\./, '控え室からメンバーカード$1枚を手札に加えた。'],
    [/no Member card in Waiting Room to add to hand\./, '控え室に手札へ加えるメンバーカードがない。'],
    [/Live SUCCESS/, 'ライブ成功'],
    [/Live FAIL/, 'ライブ失敗'],
    [/Live failed/, 'ライブ失敗'],
    [/Live succeeded/, 'ライブ成功'],
    [/ is activating a skill \(([^)]+)\)…$/, ' がスキルを発動中（$1）…'],
    [/ is activating a skill…$/, ' がスキルを発動中…'],
    [/^🪙 Coin flip: (.+) won and chose to go first!$/, '🪙 コイントス：$1 の勝ち — 自分が先攻！'],
    [/^🪙 Coin flip: (.+) won and chose (.+) to go first!$/, '🪙 コイントス：$1 の勝ち — $2 が先攻！'],
    [/^🎉 (.+) WINS with 3 successful Lives!$/, '🎉 $1 ライブ3回成功で勝利！'],
    [/^(.+)'s turn — Main Phase \(Active · Energy · Draw complete\)\.$/, '$1のターン — メインフェイズ（アクティブ・エネルギー・ドロー完了）。'],
    [/^(.+) turn — Main Phase \(Active · Energy · Draw complete\)\.$/, '$1のターン — メインフェイズ（アクティブ・エネルギー・ドロー完了）。'],
    [/^(.+) turn — Main Phase…$/, '$1のターン — メインフェイズ…'],
    [/Both players put (\d+) cards? into the Waiting Room\.$/, '両プレイヤーが手札$1枚を控え室に置きました。'],
    [/Both players drew \(([^)]+)\)\.$/, '両プレイヤーがドロー（$1）。'],
    [/Both players' Stage Members gain \+(\d+) Blade\.?$/, '両プレイヤーのステージのメンバー全員が刃+$1。'],
    [/put (\d+) opponent Stage Member\(s\) into Wait\.?$/, '相手ステージのメンバー$1体をウェイトに。'],
    [/Waiting Room/g, '控え室'],
    [/Live storage/g, 'ライブ置き場'],
    [/Success Live card storage/g, '成功ライブ置き場'],
    [/Success Live/g, '成功ライブ'],
    [/Energy deck/g, 'エネルギーデッキ'],
    [/Main Deck/g, 'メインデッキ'],
    [/Stage Member/g, 'ステージのメンバー'],
    [/Baton Touch/g, 'バトンタッチ'],
  ];

  function clearLogNameCache() {
    namePairs = null;
  }

  function buildNamePairs(catalog) {
    if (!catalog) return [];
    var pairs = [];
    var seen = Object.create(null);
    Object.keys(catalog).forEach(function (no) {
      var c = catalog[no];
      if (!c) return;
      var en = String(c.name_en || '').trim();
      var jp = String(c.name || '').trim();
      if (!en || !jp || en === jp) return;
      var key = en.toLowerCase();
      if (seen[key]) return;
      seen[key] = 1;
      pairs.push([en, jp]);
    });
    pairs.sort(function (a, b) { return b[0].length - a[0].length; });
    return pairs;
  }

  function getNamePairs(catalog) {
    if (!namePairs) namePairs = buildNamePairs(catalog);
    return namePairs;
  }

  function replaceCardNames(msg, catalog) {
    if (!msg) return msg;
    getNamePairs(catalog).forEach(function (pair) {
      if (msg.indexOf(pair[0]) === -1) return;
      msg = msg.split(pair[0]).join(pair[1]);
    });
    return msg;
  }

  function replaceSkillBrackets(msg) {
    return msg.replace(/\[([^\]]+)\]/g, function (full, inner) {
      var trimmed = inner.trim();
      if (SKILL_BRACKETS[trimmed]) return '[' + SKILL_BRACKETS[trimmed] + ']';
      return full;
    });
  }

  function applyPhraseRules(msg) {
    var out = msg;
    PHRASE_RULES.forEach(function (rule) {
      var re = rule[0];
      var rep = rule[1];
      if (typeof rep === 'function') {
        out = out.replace(re, rep);
      } else {
        out = out.replace(re, rep);
      }
    });
    return out;
  }

  function localizeLogMessage(msg, catalog) {
    if (!msg) return msg;
    var i18n = global.LLTCG_I18N;
    if (!i18n || i18n.getLocale() !== 'ja') return msg;
    catalog = catalog || (global.G && global.G.allCards);
    var out = replaceCardNames(String(msg), catalog);
    out = replaceSkillBrackets(out);
    out = applyPhraseRules(out);
    return out;
  }

  global.LLTCG_LOG_I18N = {
    clearLogNameCache: clearLogNameCache,
    localizeLogMessage: localizeLogMessage,
  };
})(typeof window !== 'undefined' ? window : globalThis);
