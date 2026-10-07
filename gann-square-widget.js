/*!
 * gann-core.js — 江恩矩阵图 / Square of 9 计算内核
 * 纯计算，无 DOM、无网络依赖。浏览器 / Node / 微信小程序 通用。
 *
 * 浏览器: <script src="gann-core.js"></script>  -> window.GannSQ9
 * Node:   const GannSQ9 = require('./gann-core.js')
 * 小程序: const GannSQ9 = require('../../utils/gann-core.js')
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GannSQ9 = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var CYCLES = [
    [7, '短周期'], [14, '半月'], [21, '短周期'], [30, '整月'], [45, '1/8 年'],
    [49, '7x7'], [60, '两月'], [90, '1/4 年'], [120, '四个月'], [144, '12x12'],
    [180, '半年'], [270, '3/4 年'], [360, '整年']
  ];
  var ANGLES = [45, 90, 135, 180, 225, 270, 315, 360];
  var ANGLE_NAMES = ['1/8 圈', '1/4 圈', '3/8 圈', '半圈', '5/8 圈', '3/4 圈', '7/8 圈', '整圈'];

  function round2(v) { return Math.round(v * 100) / 100; }
  function sqrtLevel(s, off) { var r = s + off; return r > 0 ? r * r : NaN; }

  /**
   * 八档支撑阻力。公式 (sqrt(P) +- n*inc)^2
   * @param {number} price 基准价（现价或成本价）
   * @param {number} inc   每 45 度增量，默认 0.125
   * @returns {Array} [{angle, angleName, level, up, upPct, down, downPct}]
   */
  function levels(price, inc) {
    price = Number(price); inc = Number(inc || 0.125);
    if (!isFinite(price) || price <= 0 || !isFinite(inc) || inc <= 0) return [];
    var s = Math.sqrt(price), out = [], i, up, dn;
    for (i = 1; i <= 8; i++) {
      up = sqrtLevel(s, inc * i);
      dn = sqrtLevel(s, -inc * i);
      out.push({
        angle: ANGLES[i - 1],
        angleName: ANGLE_NAMES[i - 1],
        level: i,
        up: round2(up),
        upPct: round2((up - price) / price * 100),
        down: round2(dn),
        downPct: round2((dn - price) / price * 100)
      });
    }
    return out;
  }

  /** 单档价位: step=1 是 45 度, step=2 是 90 度, 以此类推; 负数取下方 */
  function levelAt(price, step, inc) {
    inc = Number(inc || 0.125);
    var s = Math.sqrt(Number(price));
    return round2(sqrtLevel(s, inc * Number(step)));
  }

  /** 涨跌停链: n 个板 */
  function limitChain(price, board, n) {
    price = Number(price); board = Number(board == null ? 0.10 : board); n = n || 3;
    var up = [], dn = [], u = price, d = price, i;
    for (i = 0; i < n; i++) { u = round2(u * (1 + board)); d = round2(d * (1 - board)); up.push(u); dn.push(d); }
    return { up: up, down: dn };
  }

  /**
   * 交易计划: 触发档位 k -> 触发=inc*k, 止损=inc*(k-1), 目标=inc*(k+1..k+3)
   */
  function plan(price, inc, trig, board) {
    price = Number(price); inc = Number(inc || 0.125); trig = Math.max(1, Number(trig || 2));
    if (!isFinite(price) || price <= 0) return null;
    var s = Math.sqrt(price);
    function build(sign) {
      var entry = sqrtLevel(s, sign * inc * trig);
      var stop = sqrtLevel(s, sign * inc * (trig - 1));
      var targets = [];
      for (var t = 1; t <= 3; t++) targets.push(round2(sqrtLevel(s, sign * inc * (trig + t))));
      var risk = Math.abs(entry - stop);
      var rr = targets.map(function (v) {
        return risk > 0 ? Math.round(Math.abs(v - entry) / risk * 10) / 10 : 0;
      });
      return {
        entry: round2(entry), stop: round2(stop),
        stopPct: round2((stop - price) / price * 100),
        entryPct: round2((entry - price) / price * 100),
        targets: targets, rr: rr
      };
    }
    var r = { up: build(1), down: build(-1), price: round2(price) };
    if (board) r.limits = limitChain(price, board, 3);
    return r;
  }

  /**
   * 螺旋矩阵。Number 从中心 1 开始, 逆时针外扩。
   */
  function spiral(N) {
    N = Math.max(3, Math.min(31, N | 0 || 13));
    var c = (N - 1) / 2, map = {}, row = c, col = c, k = 1, total = N * N;
    map[row + ',' + col] = 1;
    var dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    var leg = 1, di = 0, t, s2, d;
    while (k < total) {
      for (t = 0; t < 2 && k < total; t++) {
        d = dirs[di % 4];
        for (s2 = 0; s2 < leg && k < total; s2++) {
          row += d[0]; col += d[1]; k++;
          if (row >= 0 && row < N && col >= 0 && col < N) map[row + ',' + col] = k;
        }
        di++;
      }
      leg++;
    }
    var cells = [];
    for (var r = 0; r < N; r++) {
      for (var c2 = 0; c2 < N; c2++) {
        var kk = map[r + ',' + c2];
        if (!kk) continue;
        var dx = c2 - c, dy = c - r;
        var ring = Math.max(Math.abs(dx), Math.abs(dy));
        var ang = ring === 0 ? 0 : Math.round(((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360);
        cells.push({
          r: r, c: c2, k: kk, ring: ring, angle: ang,
          isCross: ring > 0 && (dx === 0 || dy === 0),
          isDiag: ring > 0 && Math.abs(dx) === Math.abs(dy)
        });
      }
    }
    return { size: N, center: c, cells: cells };
  }

  /** 依据目标价定位最近格子并给出该格所在环/角度 */
  function locate(price, N, centerValue, step) {
    N = N || 13; centerValue = Number(centerValue == null ? 1 : centerValue); step = Number(step || 1);
    var sp = spiral(N), best = null;
    price = Number(price);
    for (var i = 0; i < sp.cells.length; i++) {
      var cell = sp.cells[i], v = centerValue + (cell.k - 1) * step;
      var diff = Math.abs(v - price);
      if (!best || diff < best.diff) best = { diff: diff, value: round2(v), ring: cell.ring, angle: cell.angle, k: cell.k };
    }
    return best;
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }

  /** 时间窗 */
  function timeline(start, cycles) {
    var base = start instanceof Date ? start : new Date(String(start).replace(/-/g, '/'));
    if (isNaN(base.getTime())) return [];
    var list = cycles || CYCLES, out = [];
    for (var i = 0; i < list.length; i++) {
      var days = list[i][0], label = list[i][1];
      var d = new Date(base.getTime() + days * 86400000);
      out.push({
        days: days, label: label, date: fmt(d),
        tradingDays: Math.round(days * 5 / 7),
        weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
      });
    }
    return out;
  }

  return {
    version: '1.0.0',
    ANGLES: ANGLES,
    CYCLES: CYCLES,
    levels: levels,
    levelAt: levelAt,
    limitChain: limitChain,
    plan: plan,
    spiral: spiral,
    locate: locate,
    timeline: timeline,
    round2: round2
  };
});

/* ==========================================================================
 * gann-square-widget.js — 江恩矩阵图网页组件（Web Component）
 * 依赖上面的 GannSQ9 内核（同文件内已包含）。
 * 用法： <script src="gann-square-widget.js"></script>
 *        <gann-square price="5.69" inc="0.125" trig="2" board="0.10" start="2026-09-17"></gann-square>
 * ========================================================================== */
(function () {
  'use strict';
  var G = window.GannSQ9;
  if (!G || !window.customElements) return;

  var STYLE = [
    ':host{--gs-bg:#ffffff;--gs-fg:#1f2328;--gs-muted:#6b7280;--gs-dim:#9ca3af;--gs-border:#e5e7eb;--gs-line:#f0f1f3;--gs-cell:#f6f7f9;--gs-cross:#fde8d4;--gs-diag:#e2f3e4;--gs-focus:#dbeafe;--gs-focus-bd:#2563eb;--gs-up:#d92b2b;--gs-dn:#1a9e5c;display:block;font-family:inherit;color:var(--gs-fg)}',
    ':host([theme="dark"]){--gs-bg:#16181d;--gs-fg:#e8eaed;--gs-muted:#9aa0a6;--gs-dim:#80868b;--gs-border:#2c3038;--gs-line:#24272e;--gs-cell:#1d2026;--gs-cross:#4a3320;--gs-diag:#1e3a2a;--gs-focus:#1c3357;--gs-focus-bd:#6ea8ff}',
    '*{box-sizing:border-box}',
    '.wrap{background:var(--gs-bg);border:1px solid var(--gs-border);border-radius:12px;padding:14px;container-type:inline-size}',
    '.head{display:flex;flex-wrap:wrap;gap:8px 12px;justify-content:space-between;align-items:center;margin-bottom:10px}',
    '.readout{font-size:13px;color:var(--gs-muted);min-width:0}',
    '.seg{display:inline-flex;border:1px solid var(--gs-border);border-radius:8px;overflow:hidden}',
    '.seg button{border:0;background:transparent;color:var(--gs-muted);font:inherit;font-size:12px;padding:4px 10px;cursor:pointer}',
    '.seg button[aria-pressed="true"]{background:var(--gs-fg);color:var(--gs-bg)}',
    '.grid{display:grid;gap:1px;background:var(--gs-border);border:1px solid var(--gs-border);border-radius:6px;overflow:hidden}',
    '.cell{aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;background:var(--gs-cell);font-size:11px;line-height:1;color:var(--gs-fg);overflow:hidden}',
    '@supports (font-size:1cqw){.cell{font-size:clamp(7px,2.6cqw,15px)}}',
    '.cell.is-cross{background:var(--gs-cross)}',
    '.cell.is-diag{background:var(--gs-diag)}',
    '.cell.is-focus{background:var(--gs-focus);box-shadow:inset 0 0 0 2px var(--gs-focus-bd);font-weight:600}',
    '.cell.blank{color:transparent}',
    '.tabs{display:flex;gap:18px;margin:14px 0 6px;font-size:13px;color:var(--gs-muted)}',
    '.tabs button{border:0;background:none;font:inherit;color:inherit;padding:0 0 4px;cursor:pointer;border-bottom:2px solid transparent}',
    '.tabs button[aria-selected="true"]{color:var(--gs-fg);font-weight:600;border-bottom-color:var(--gs-fg)}',
    '.tbl{display:table;width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}',
    '.tr{display:table-row}',
    '.tr>span{display:table-cell;padding:6px 4px;border-bottom:1px solid var(--gs-line);white-space:nowrap}',
    '.tr:first-child>span{color:var(--gs-dim);font-size:12px}',
    '.tr>span:first-child{color:var(--gs-muted);width:22%}',
    '.up{color:var(--gs-up)}.dn{color:var(--gs-dn)}',
    '.num{text-align:right}',
    '.note{margin-top:10px;font-size:12px;color:var(--gs-dim);line-height:1.6}',
    '.scroll{overflow-x:auto}',
    '@media (max-width:420px){.tr>span{font-size:12px;padding:5px 2px}}'
  ].join('\n');

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var TEMPLATE = '<style>' + STYLE + '</style>' +
    '<div class="wrap">' +
      '<div class="head"><div class="readout" part="readout"></div>' +
        '<div class="seg" role="group" aria-label="数值显示">' +
          '<button type="button" data-mode="axis">仅轴位</button>' +
          '<button type="button" data-mode="all">全部数值</button>' +
        '</div></div>' +
      '<div class="grid" role="img" aria-label="江恩九宫格矩阵图"></div>' +
      '<div class="tabs" role="tablist">' +
        '<button type="button" role="tab" data-tab="0">支撑阻力</button>' +
        '<button type="button" role="tab" data-tab="1">交易计划</button>' +
        '<button type="button" role="tab" data-tab="2">时间窗</button>' +
      '</div>' +
      '<div class="scroll"><div class="panel" role="tabpanel"></div></div>' +
      '<div class="note">技术分析参考，不构成投资建议；A 股 T+1 且受涨跌停限制。</div>' +
    '</div>';

  function fmt(v, d) { return isFinite(v) ? v.toFixed(d == null ? 2 : d) : '—'; }
  function sgn(v) { return v >= 0 ? '+' : ''; }

  var GannSquare = function () {
    return Reflect.construct(HTMLElement, [], GannSquare.ctor || GannSquare);
  };

  function define() {
    var Ctor = function () {
      var self = Reflect.construct(HTMLElement, [], Ctor);
      self.attachShadow({ mode: 'open' });
      self.shadowRoot.innerHTML = TEMPLATE;
      self._tab = 0;
      self._mode = self.getAttribute('mode') === 'all' ? 'all' : 'axis';
      self.$grid = self.shadowRoot.querySelector('.grid');
      self.$readout = self.shadowRoot.querySelector('.readout');
      self.$panel = self.shadowRoot.querySelector('.panel');
      self.shadowRoot.querySelectorAll('[data-mode]').forEach(function (b) {
        b.addEventListener('click', function () { self._mode = b.getAttribute('data-mode'); self._render(); });
      });
      self.shadowRoot.querySelectorAll('[data-tab]').forEach(function (b) {
        b.addEventListener('click', function () { self._tab = Number(b.getAttribute('data-tab')); self._render(); });
      });
      return self;
    };
    Ctor.prototype = Object.create(HTMLElement.prototype);
    Ctor.prototype.constructor = Ctor;
    Object.setPrototypeOf(Ctor, HTMLElement);

    Ctor.observedAttributes = ['price', 'inc', 'trig', 'board', 'center', 'step', 'size', 'start', 'mode', 'tab'];

    Ctor.prototype.connectedCallback = function () { this._render(); };
    Ctor.prototype.attributeChangedCallback = function () { if (this.$grid) this._render(); };

    Ctor.prototype._cfg = function () {
      function n(name, dflt) {
        var v = parseFloat(this.getAttribute(name));
        return isFinite(v) ? v : dflt;
      }
      return {
        price: n.call(this, 'price', 0),
        inc: n.call(this, 'inc', 0.125),
        trig: n.call(this, 'trig', 2),
        board: n.call(this, 'board', 0.10),
        center: n.call(this, 'center', 1),
        step: n.call(this, 'step', 1),
        size: Math.round(n.call(this, 'size', 13)),
        start: this.getAttribute('start') || '',
        priceDigits: Math.max(0, Math.min(4, Math.round(n.call(this, 'digits', this.getAttribute('digits') == null ? 2 : 2))))
      };
    };

    Ctor.prototype.setPrice = function (p) { this.setAttribute('price', String(p)); };
    Ctor.prototype.update = function (o) {
      for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) this.setAttribute(k, String(o[k]));
    };

    Ctor.prototype._render = function () {
      var c = this._cfg();
      var N = Math.max(3, Math.min(31, c.size || 13));
      var d = c.priceDigits;

      this.shadowRoot.querySelectorAll('[data-mode]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-mode') === this._mode ? 'true' : 'false');
      }, this);
      this.shadowRoot.querySelectorAll('[data-tab]').forEach(function (b) {
        b.setAttribute('aria-selected', Number(b.getAttribute('data-tab')) === this._tab ? 'true' : 'false');
      }, this);

      var sp = G.spiral(N);
      var focus = isFinite(c.price) && c.price > 0 ? G.locate(c.price, N, c.center, c.step) : null;

      // grid
      var html = '';
      sp.cells.forEach(function (cell) {
        var v = c.center + (cell.k - 1) * c.step;
        var vHtml = Number.isInteger(v) ? String(v) : String(Math.round(v * 10000) / 10000);
        var show = this._mode === 'all' || cell.isCross || cell.isDiag;
        var cls = 'cell';
        if (cell.isCross) cls += ' is-cross';
        if (cell.isDiag) cls += ' is-diag';
        if (focus && cell.k === focus.k) cls += ' is-focus';
        if (!show) cls += ' blank';
        html += '<div class="' + cls + '">' + vHtml + '</div>';
      }, this);
      this.$grid.style.gridTemplateColumns = 'repeat(' + N + ',1fr)';
      this.$grid.innerHTML = html;
      this.$grid.setAttribute('aria-label', '江恩九宫格矩阵图 ' + N + '×' + N + '，中心 ' + c.center + '，步长 ' + c.step);

      // readout
      this.$readout.textContent = focus
        ? ('基准 ' + fmt(c.price, d) + ' → 最近格 ' + fmt(focus.value, d) + '（第 ' + focus.ring + ' 环 · ' + focus.angle + '°）')
        : '请设置 price 属性';

      // panel
      if (this._tab === 0) this.$panel.innerHTML = this._levelsHtml(c, d);
      else if (this._tab === 1) this.$panel.innerHTML = this._planHtml(c, d);
      else this.$panel.innerHTML = this._timeHtml(c);
    };

    Ctor.prototype._levelsHtml = function (c, d) {
      var rows = G.levels(c.price, c.inc);
      if (!rows.length) return '<div class="tr"><span>请设置有效的 price 属性</span></div>';
      var h = '<div class="tbl"><div class="tr"><span>角度</span><span class="num">上方阻力</span><span class="num">涨幅</span><span class="num">下方支撑</span><span class="num">跌幅</span></div>';
      rows.forEach(function (r) {
        h += '<div class="tr"><span>' + r.angle + '°</span>' +
             '<span class="num up">' + fmt(r.up, d) + '</span>' +
             '<span class="num">' + sgn(r.upPct) + r.upPct.toFixed(2) + '%</span>' +
             '<span class="num dn">' + fmt(r.down, d) + '</span>' +
             '<span class="num">' + r.downPct.toFixed(2) + '%</span></div>';
      });
      h += '</div>';
      if (c.board) {
        var lim = G.limitChain(c.price, c.board, 3);
        h += '<div class="note">涨停链 ' + lim.up.map(function (v) { return fmt(v, d); }).join(' · ') +
             '　跌停链 ' + lim.down.map(function (v) { return fmt(v, d); }).join(' · ') + '</div>';
      }
      return h;
    };

    Ctor.prototype._planHtml = function (c, d) {
      var p = G.plan(c.price, c.inc, c.trig, c.board);
      if (!p) return '<div class="tr"><span>请设置有效的 price 属性</span></div>';
      var keys = ['upEntry', 'upStop', 'upT1', 'upT2', 'upT3'];
      var rows = [
        ['触发价', fmt(p.up.entry, d), fmt(p.down.entry, d)],
        ['止损', fmt(p.up.stop, d), fmt(p.down.stop, d)],
        ['目标 1', fmt(p.up.targets[0], d), fmt(p.down.targets[0], d)],
        ['目标 2', fmt(p.up.targets[1], d), fmt(p.down.targets[1], d)],
        ['目标 3', fmt(p.up.targets[2], d), fmt(p.down.targets[2], d)]
      ];
      var h = '<div class="tbl"><div class="tr"><span>项目</span><span class="num">向上突破</span><span class="num">向下破位</span></div>';
      rows.forEach(function (r) {
        h += '<div class="tr"><span>' + r[0] + '</span><span class="num">' + r[1] + '</span><span class="num">' + r[2] + '</span></div>';
      });
      h += '</div>';
      h += '<div class="note">盈亏比 ' + p.up.rr[0] + ' : ' + p.up.rr[1] + ' : ' + p.up.rr[2] +
           '　（触发 ' + c.trig + ' 档，止损回撤 1 档，目标顺推 3 档）</div>';
      return h;
    };

    Ctor.prototype._timeHtml = function (c) {
      var rows = G.timeline(c.start);
      if (!rows.length) return '<div class="tr"><span>请设置 start 属性，如 start="2026-09-17"</span></div>';
      var h = '<div class="tbl"><div class="tr"><span>周期</span><span class="num">日历日</span><span class="num">交易日</span><span class="num">日期</span></div>';
      rows.forEach(function (r) {
        h += '<div class="tr"><span>' + r.label + '</span><span class="num">' + r.days + '</span>' +
             '<span class="num">' + r.tradingDays + '</span><span class="num">' + r.date + '</span></div>';
      });
      h += '</div><div class="note">起算日 ' + c.start + '，交易日按 5/7 估算（未剔除法定节假日）</div>';
      return h;
    };

    if (!window.customElements.get('gann-square')) window.customElements.define('gann-square', Ctor);
    return Ctor;
  }

  define();
})();