/*!
 * gann-nodes.js — 「节点矩阵」时间维度内核（日数螺旋 · Square of 9 time）
 * 纯计算，无 DOM / 无网络。与 gann-square-widget.js（价格维度）互补。
 * 浏览器: <script src="gann-nodes.js"></script> -> window.GannNodes
 * Node:   const GannNodes = require('./gann-nodes.js')
 *
 * 原理：1 居中，逆时针方形螺旋；数字=交易日计数。
 *       落在 8 条放射线（上下左右 4 轴 = 90° + 4 对角 = 45°）上的日数 = 节点。
 * 口径来源：抖音「歌神小易」公开视频/评论（节点 77/81/86/91/96 自洽验证）。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GannNodes = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  // 第 n 个交易日在螺旋中的坐标（1 在原点，逆时针）
  function pos(n) {
    n = Number(n);
    if (!isFinite(n) || n < 1) return null;
    if (n === 1) return { x: 0, y: 0, ring: 0 };
    var r = Math.ceil((Math.sqrt(n) - 1) / 2);
    var start = (2 * r - 1) * (2 * r - 1) + 1;
    var x = -r, y = r - 1, d = n - start, k, i;
    if (d === 0) return { x: x, y: y, ring: r };
    var moves = [[0, -1, 2 * r - 1], [1, 0, 2 * r], [0, 1, 2 * r], [-1, 0, 2 * r]];
    for (k = 0; k < moves.length; k++) {
      for (i = 0; i < moves[k][2]; i++) {
        x += moves[k][0]; y += moves[k][1]; d--;
        if (d === 0) return { x: x, y: y, ring: r };
      }
    }
    return null;
  }

  // 节点判定 + 角度分类
  function info(n) {
    var p = pos(n);
    if (!p) return null;
    var axis = (p.x === 0 || p.y === 0);
    var diag = (Math.abs(p.x) === Math.abs(p.y));
    if (!axis && !diag) return null;               // 非节点
    var deg;
    if (axis && p.x === 0) deg = p.y < 0 ? 0 : 180;        // 上=0° 下=180°
    else if (axis && p.y === 0) deg = p.x > 0 ? 90 : 270;  // 右=90° 左=270°
    else if (p.x < 0 && p.y < 0) deg = 45;
    else if (p.x > 0 && p.y < 0) deg = 135;
    else if (p.x > 0 && p.y > 0) deg = 225;
    else deg = 315;
    return { n: n, x: p.x, y: p.y, ring: p.ring, deg: deg, kind: axis ? '轴(90°)' : '对角(45°)' };
  }

  function isNode(n) { return !!info(n); }

  // 列出 <= N 的全部节点（可给下限）
  function nodes(N, from) {
    N = Number(N) || 169; from = Number(from) || 1;
    var out = [], i;
    for (i = Math.max(1, from); i <= N; i++) { var v = info(i); if (v) out.push(v); }
    return out;
  }

  // 从任意交易日起算，给出第 1..N 个交易日的节点日期
  // dates: 交易日序列（YYYY-MM-DD 数组，index 0 = 第 1 个交易日）
  function upcoming(dates, N) {
    N = Number(N) || (dates ? dates.length : 0);
    var out = [], i, v;
    for (i = 1; i <= Math.min(N, dates.length); i++) {
      v = info(i);
      if (v) out.push({ day: i, date: dates[i - 1], deg: v.deg, kind: v.kind });
    }
    return out;
  }

  return { pos: pos, info: info, isNode: isNode, nodes: nodes, upcoming: upcoming };
});
