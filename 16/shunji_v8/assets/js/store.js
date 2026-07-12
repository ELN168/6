/* ============================================================
   Store — 購物車與訂單（存在客人自己的手機上）
   ============================================================ */

window.Store = (function () {
  'use strict';

  var CART_K   = 'shunji.cart';
  var ORDERS_K = 'shunji.orders';
  var subs     = [];

  var MENU   = window.SHUNJI_MENU || { items: [], addons: {} };
  var ADDONS = MENU.addons || {};

  function read(k, fallback) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function write(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  }

  var cart = read(CART_K, []);

  function emit() {
    write(CART_K, cart);
    subs.forEach(function (fn) { try { fn(cart); } catch (e) {} });
  }

  function findItem(id) {
    for (var i = 0; i < MENU.items.length; i++) {
      if (MENU.items[i].id === id) return MENU.items[i];
    }
    return null;
  }

  /* 同一道菜 + 同樣加料 + 同樣備註 = 同一行，數量相加 */
  function lineKey(itemId, addonIds, note) {
    return [itemId, (addonIds || []).slice().sort().join('|'), (note || '').trim()].join('::');
  }

  function unitPrice(itemId, addonIds) {
    var it = findItem(itemId);
    if (!it) return 0;
    var sum = it.price;
    (addonIds || []).forEach(function (a) { if (ADDONS[a]) sum += ADDONS[a].price; });
    return sum;
  }

  function add(itemId, opts) {
    opts = opts || {};
    var addonIds = opts.addons || [];
    var note     = opts.note || '';
    var qty      = opts.qty || 1;
    var key      = lineKey(itemId, addonIds, note);

    for (var i = 0; i < cart.length; i++) {
      if (cart[i].key === key) { cart[i].qty += qty; emit(); return cart[i]; }
    }
    var it = findItem(itemId);
    if (!it) return null;

    var line = {
      key:    key,
      itemId: itemId,
      name:   it.name,
      addons: addonIds.map(function (a) {
        return { id: a, name: ADDONS[a].name, price: ADDONS[a].price };
      }),
      note:  note,
      qty:   qty,
      unit:  unitPrice(itemId, addonIds)
    };
    cart.push(line);
    emit();
    return line;
  }

  function setQty(key, qty) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].key === key) {
        if (qty <= 0) cart.splice(i, 1);
        else cart[i].qty = qty;
        emit();
        return;
      }
    }
  }

  function bump(key, delta) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].key === key) { setQty(key, cart[i].qty + delta); return; }
    }
  }

  function clear() { cart = []; emit(); }

  function count() {
    return cart.reduce(function (n, l) { return n + l.qty; }, 0);
  }
  function total() {
    return cart.reduce(function (n, l) { return n + l.unit * l.qty; }, 0);
  }
  function qtyOf(itemId) {
    return cart.reduce(function (n, l) { return l.itemId === itemId ? n + l.qty : n; }, 0);
  }

  /* ---------- 訂單 ---------- */
  function orderNo() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    var chars = 'ACDEFGHJKLMNPQRTUVWXY3479';
    var tail = '';
    for (var i = 0; i < 4; i++) tail += chars[Math.floor(Math.random() * chars.length)];
    return mm + dd + '-' + tail;
  }

  function saveOrder(order) {
    var all = read(ORDERS_K, []);
    all.unshift(order);
    write(ORDERS_K, all.slice(0, 30));
  }

  function orders(userId) {
    var all = read(ORDERS_K, []);
    if (!userId) return all;
    return all.filter(function (o) { return o.user && o.user.userId === userId; });
  }

  return {
    add: add, setQty: setQty, bump: bump, clear: clear,
    count: count, total: total, qtyOf: qtyOf,
    findItem: findItem, unitPrice: unitPrice,
    orderNo: orderNo, saveOrder: saveOrder, orders: orders,
    get lines() { return cart; },
    onChange: function (fn) { subs.push(fn); fn(cart); }
  };
})();
