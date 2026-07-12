(function () {
  'use strict';

  var CFG  = window.SHUNJI_CONFIG;
  var SHOP = CFG.SHOP;
  var MENU = window.SHUNJI_MENU;
  var $ = UI.$, esc = UI.esc;

  UI.devBanner();

  /* 店名 / 標語 */
  $('#shopEn').textContent   = SHOP.nameEn;
  $('#shopName').textContent = SHOP.name;
  $('#shopTag').textContent  = SHOP.tagline;
  document.title = SHOP.name + ' ' + SHOP.nameEn + '｜' + SHOP.tagline;

  $('#shopMeta').innerHTML =
    esc(SHOP.hours) + '<br>' +
    '<a href="' + esc(SHOP.mapUrl) + '" target="_blank" rel="noopener">' + esc(SHOP.address) + '</a>';

  /* 今日推薦 = 標了 hot 的菜 */
  var picks = MENU.items.filter(function (i) { return i.hot; });
  $('#picks').innerHTML = picks.map(function (i) {
    return '<a class="pick" href="order.html#' + esc(i.cat) + '">' +
             UI.tile(i) +
             '<p class="pick__name">' + esc(i.name) + '</p>' +
             '<p class="pick__price">' + UI.money(i.price) + '</p>' +
           '</a>';
  }).join('');

  /* 店家資訊 */
  $('#info').innerHTML = [
    ['營業時間', esc(SHOP.hours)],
    ['地址', '<a href="' + esc(SHOP.mapUrl) + '" target="_blank" rel="noopener">' + esc(SHOP.address) + '</a>'],
    ['電話', '<a href="tel:' + esc(SHOP.phone) + '">' + esc(SHOP.phone) + '</a>']
  ].map(function (r) {
    return '<div class="info__row"><span class="info__k">' + r[0] + '</span><span>' + r[1] + '</span></div>';
  }).join('');

  $('#footMeta').innerHTML = esc(SHOP.name) + ' ' + esc(SHOP.nameEn) + '<br>' + esc(SHOP.address);

  /* 桌邊 QR code：index.html?table=5 → 帶著桌號進點餐頁 */
  var table = new URLSearchParams(location.search).get('table');
  if (table) {
    $('#startBtn').href = 'order.html?table=' + encodeURIComponent(table);
    $('.cta__note').textContent = '桌號 ' + table + '・送出訂單前需要用 LINE 確認身分';
  }

  /* 背景先把 LIFF 準備好，等一下按進點餐頁時不用再等 */
  window.LineAuth.init();
})();
