(function () {
  'use strict';

  var $ = UI.$, esc = UI.esc, money = UI.money;
  UI.devBanner();

  function fmt(iso) {
    var d = new Date(iso);
    return String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0') +
           ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function draw() {
    var s = LineAuth.state;
    UI.renderIdentity('#identity');

    if (!s.loggedIn) {
      $('#list').innerHTML =
        '<div class="empty">用 LINE 驗證後，才看得到你的訂單記錄。</div>' +
        '<button class="btn btn--line" type="button" id="go">使用 LINE 登入</button>';
      $('#go').addEventListener('click', function () {
        UI.needLine().then(function (ok) { if (ok) draw(); });
      });
      return;
    }

    var list = Store.orders(s.profile.userId);
    if (!list.length) {
      $('#list').innerHTML =
        '<div class="empty">還沒有訂單記錄。</div>' +
        '<button class="btn" type="button" onclick="location.href=\'order.html\'">去點餐</button>';
      return;
    }

    $('#list').innerHTML = list.map(function (o) {
      var items = o.items.map(function (i) { return i.name + ' ×' + i.qty; }).join('、');
      var where = o.mode === 'dinein' ? '內用・桌 ' + esc(o.table) : '外帶';
      return '<div class="stub">' +
               '<div class="stub__top">' +
                 '<span class="stub__no">' + esc(o.orderNo) + '</span>' +
                 '<span class="stub__date">' + fmt(o.createdAt) + '</span>' +
               '</div>' +
               '<p class="stub__items">' + esc(items) + '</p>' +
               '<div class="stub__bot"><span>' + where + '</span>' +
               '<span class="stub__sum">' + money(o.total) + '</span></div>' +
             '</div>';
    }).join('') +
    '<button class="btn" type="button" style="margin-top:16px" onclick="location.href=\'order.html\'">再點一份</button>';
  }

  LineAuth.init().then(draw);
})();
