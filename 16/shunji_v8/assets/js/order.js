(function () {
  'use strict';

  var CFG    = window.SHUNJI_CONFIG;
  var SHOP   = CFG.SHOP;
  var MENU   = window.SHUNJI_MENU;
  var ADDONS = MENU.addons;
  var $ = UI.$, $$ = UI.$$, esc = UI.esc, money = UI.money;

  var params    = new URLSearchParams(location.search);
  var qsTable   = params.get('table') || '';
  var checkout  = { mode: qsTable ? 'dinein' : 'dinein', table: qsTable, pickup: 'asap', phone: '', note: '' };

  UI.devBanner();

  /* ============================================================
     1. 畫菜單
     ============================================================ */
  function renderTabs() {
    $('#tabs').innerHTML = MENU.categories.map(function (c, i) {
      return '<button class="tab" role="tab" data-cat="' + c.id + '" aria-selected="' +
             (i === 0 ? 'true' : 'false') + '">' + esc(c.name) + '</button>';
    }).join('');

    $$('.tab').forEach(function (t) {
      t.addEventListener('click', function () {
        var sec = document.getElementById('cat-' + t.dataset.cat);
        if (sec) window.scrollTo({ top: sec.offsetTop - 104, behavior: 'smooth' });
      });
    });
  }

  function renderMenu() {
    $('#menu').innerHTML = MENU.categories.map(function (c) {
      var rows = MENU.items.filter(function (i) { return i.cat === c.id; }).map(function (i) {
        return (
          '<div class="dish" data-id="' + i.id + '" role="button" tabindex="0">' +
            UI.tile(i, 'sm') +
            '<div>' +
              '<p class="dish__name">' + esc(i.name) +
                (i.hot ? '<span class="dish__hot">人氣</span>' : '') +
              '</p>' +
              (i.desc ? '<p class="dish__desc">' + esc(i.desc) + '</p>' : '') +
              '<p class="dish__price">' + money(i.price) + '</p>' +
            '</div>' +
            '<button class="dish__add" type="button" data-add="' + i.id + '" aria-label="加入 ' + esc(i.name) + '">' +
              '+<span class="dish__count" data-count="' + i.id + '" hidden></span>' +
            '</button>' +
          '</div>'
        );
      }).join('');

      return '<section class="cat" id="cat-' + c.id + '">' +
               '<h2 class="cat__title">' + esc(c.name) + '</h2>' +
               '<div class="dishes">' + rows + '</div>' +
             '</section>';
    }).join('');

    $('#menu').addEventListener('click', function (e) {
      var add = e.target.closest('[data-add]');
      if (add) { e.stopPropagation(); quickAdd(add.dataset.add); return; }
      var row = e.target.closest('.dish');
      if (row) openDish(row.dataset.id);
    });
  }

  function refreshCounts() {
    $$('[data-count]').forEach(function (b) {
      var n = Store.qtyOf(b.dataset.count);
      b.hidden = n === 0;
      b.textContent = n;
    });
  }

  /* 捲動時同步頁籤 */
  function watchScroll() {
    var secs = MENU.categories.map(function (c) { return document.getElementById('cat-' + c.id); });
    window.addEventListener('scroll', function () {
      var y = window.scrollY + 150, cur = MENU.categories[0].id;
      secs.forEach(function (s, i) { if (s && s.offsetTop <= y) cur = MENU.categories[i].id; });
      $$('.tab').forEach(function (t) {
        t.setAttribute('aria-selected', t.dataset.cat === cur ? 'true' : 'false');
      });
    }, { passive: true });
  }

  /* ============================================================
     2. 加入訂單 —— 這裡是 LINE 驗證的入口
     ============================================================ */
  function quickAdd(id) {
    UI.needLine().then(function (ok) {
      if (!ok) { UI.toast('要先用 LINE 驗證才能點餐', 'bad'); return; }
      Store.add(id, {});
      var it = Store.findItem(id);
      UI.toast('已加入 ' + it.name);
    });
  }

  function openDish(id) {
    var it = Store.findItem(id);
    if (!it) return;
    var list = (it.addons || []).map(function (a) { return ADDONS[a]; }).filter(Boolean);
    var qty = 1;

    UI.sheet(
      '<h2 class="sheet__title">' + esc(it.name) + '</h2>' +
      '<p class="sheet__sub">' + esc(it.desc || '') + '</p>' +
      (list.length ? '<p class="field__label">加點</p>' + list.map(function (a) {
        return '<label class="opt"><input type="checkbox" value="' + a.id + '">' +
               '<span>' + esc(a.name) + '</span>' +
               '<span class="opt__price">' + (a.price ? '+ ' + a.price : '免費') + '</span></label>';
      }).join('') : '') +
      '<div class="field">' +
        '<label class="field__label" for="dnote">備註</label>' +
        '<textarea class="textarea" id="dnote" placeholder="例：不要蔥、醬汁另外放"></textarea>' +
      '</div>' +
      '<div class="field" style="display:flex;align-items:center;justify-content:space-between">' +
        '<span class="field__label" style="margin:0">數量</span>' +
        '<div class="qty">' +
          '<button class="qty__btn" type="button" id="qm" aria-label="減少">−</button>' +
          '<span class="qty__n" id="qn">1</span>' +
          '<button class="qty__btn" type="button" id="qp" aria-label="增加">+</button>' +
        '</div>' +
      '</div>' +
      '<button class="btn" type="button" id="dadd">加入訂單 · <span id="dsum"></span></button>',

      function (root, close) {
        function sum() {
          var extra = 0;
          $$('input:checked', root).forEach(function (c) { extra += ADDONS[c.value].price; });
          $('#dsum', root).textContent = money((it.price + extra) * qty);
        }
        sum();

        $('#qm', root).addEventListener('click', function () {
          qty = Math.max(1, qty - 1); $('#qn', root).textContent = qty; sum();
        });
        $('#qp', root).addEventListener('click', function () {
          qty = Math.min(20, qty + 1); $('#qn', root).textContent = qty; sum();
        });
        $$('input[type=checkbox]', root).forEach(function (c) { c.addEventListener('change', sum); });

        $('#dadd', root).addEventListener('click', function () {
          var picked = $$('input:checked', root).map(function (c) { return c.value; });
          var note   = $('#dnote', root).value.trim();
          close();
          UI.needLine().then(function (ok) {
            if (!ok) { UI.toast('要先用 LINE 驗證才能點餐', 'bad'); return; }
            Store.add(it.id, { addons: picked, note: note, qty: qty });
            UI.toast('已加入 ' + it.name);
          });
        });
      }
    );
  }

  /* ============================================================
     3. 購物車
     ============================================================ */
  function openCart() {
    if (!Store.lines.length) { UI.toast('還沒有選餐點'); return; }

    UI.sheet(
      '<h2 class="sheet__title">訂單內容</h2>' +
      '<div id="clines"></div>' +
      '<div class="tot"><span>合計</span><span class="tot__v" id="ctot"></span></div>' +
      '<button class="btn" type="button" id="cgo" style="margin-top:14px">去結帳</button>' +
      '<button class="gate__later" type="button" id="cclr">清空訂單</button>',

      function (root, close) {
        function draw() {
          if (!Store.lines.length) { close(); return; }
          $('#clines', root).innerHTML = Store.lines.map(function (l) {
            var extra = l.addons.map(function (a) { return a.name; }).join('、');
            var meta = [extra, l.note].filter(Boolean).join('｜');
            return '<div class="cline">' +
                     '<div><div class="cline__name">' + esc(l.name) + '</div>' +
                     (meta ? '<div class="cline__meta">' + esc(meta) + '</div>' : '') + '</div>' +
                     '<div class="cline__q">' +
                       '<button type="button" data-m="' + esc(l.key) + '">−</button>' +
                       '<span>' + l.qty + '</span>' +
                       '<button type="button" data-p="' + esc(l.key) + '">+</button>' +
                     '</div>' +
                     '<div class="cline__sum">' + UI.num(l.unit * l.qty) + '</div>' +
                   '</div>';
          }).join('');
          $('#ctot', root).textContent = money(Store.total());
        }
        draw();

        $('#clines', root).addEventListener('click', function (e) {
          var m = e.target.dataset.m, p = e.target.dataset.p;
          if (m) Store.bump(m, -1);
          if (p) Store.bump(p, 1);
          if (m || p) draw();
        });

        $('#cclr', root).addEventListener('click', function () {
          if (confirm('要清空訂單嗎？')) { Store.clear(); close(); }
        });

        $('#cgo', root).addEventListener('click', function () { close(); openCheckout(); });
      }
    );
  }

  /* ============================================================
     4. 結帳 —— 一定要有 LINE 身分
     ============================================================ */
  function openCheckout() {
    if (!Store.lines.length) { UI.toast('還沒有選餐點'); return; }

    UI.needLine().then(function (ok) {
      if (!ok) { UI.toast('要先用 LINE 驗證才能送單', 'bad'); return; }
      var u = LineAuth.user;

      var pic = u.pictureUrl
        ? '<img class="who__pic" src="' + esc(u.pictureUrl) + '" alt="">'
        : '<span class="who__pic">' + esc(u.displayName.slice(0, 1)) + '</span>';

      UI.sheet(
        '<h2 class="sheet__title">確認訂單</h2>' +

        '<div class="who">' + pic +
          '<div><div class="who__name">' + esc(u.displayName) + '</div>' +
          '<div class="who__tag">LINE 驗證通過</div></div>' +
        '</div>' +

        '<div class="field">' +
          '<span class="field__label">用餐方式</span>' +
          '<div class="seg">' +
            '<button type="button" data-mode="dinein"  aria-pressed="true">內用</button>' +
            '<button type="button" data-mode="takeout" aria-pressed="false">外帶</button>' +
          '</div>' +
        '</div>' +

        '<div class="field" id="fDinein">' +
          '<label class="field__label" for="fTable">桌號</label>' +
          '<input class="input" id="fTable" inputmode="numeric" placeholder="例：5" value="' + esc(qsTable) + '">' +
        '</div>' +

        '<div class="field" id="fTakeout" hidden>' +
          '<label class="field__label" for="fPickup">取餐時間</label>' +
          '<select class="select" id="fPickup">' +
            '<option value="asap">盡快（約 15 分鐘）</option>' +
            '<option value="20">20 分鐘後</option>' +
            '<option value="30">30 分鐘後</option>' +
            '<option value="45">45 分鐘後</option>' +
          '</select>' +
          '<label class="field__label" for="fPhone" style="margin-top:14px">手機（選填）</label>' +
          '<input class="input" id="fPhone" type="tel" inputmode="tel" placeholder="09xx-xxx-xxx">' +
        '</div>' +

        '<div class="field">' +
          '<label class="field__label" for="fNote">給廚房的話（選填）</label>' +
          '<textarea class="textarea" id="fNote" placeholder="例：一起出餐"></textarea>' +
        '</div>' +

        '<div class="tot"><span>合計</span><span class="tot__v">' + money(Store.total()) + '</span></div>' +
        '<button class="btn" type="button" id="submitBtn" style="margin-top:12px">送出訂單</button>' +
        '<p class="field__hint" style="text-align:center">送出後訂單直接進廚房，無法自行取消。</p>',

        function (root, close) {
          $$('[data-mode]', root).forEach(function (b) {
            b.addEventListener('click', function () {
              checkout.mode = b.dataset.mode;
              $$('[data-mode]', root).forEach(function (x) {
                x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
              });
              $('#fDinein', root).hidden  = checkout.mode !== 'dinein';
              $('#fTakeout', root).hidden = checkout.mode !== 'takeout';
            });
          });

          $('#submitBtn', root).addEventListener('click', function () {
            var btn = this;
            checkout.table  = $('#fTable', root).value.trim();
            checkout.pickup = $('#fPickup', root).value;
            checkout.phone  = $('#fPhone', root).value.trim();
            checkout.note   = $('#fNote', root).value.trim();

            if (checkout.mode === 'dinein' && !checkout.table) {
              UI.toast('請填桌號', 'bad');
              $('#fTable', root).focus();
              return;
            }

            btn.disabled = true;
            btn.textContent = '送出中…';

            submit().then(function (order) {
              close();
              renderSuccess(order);
            }).catch(function (err) {
              btn.disabled = false;
              btn.textContent = '送出訂單';
              UI.toast(err.message || '訂單沒有送出，請再試一次', 'bad');
            });
          });
        }
      );
    });
  }

  /* ============================================================
     5. 送出
     ============================================================ */
  function buildOrder() {
    var u = LineAuth.user;
    return {
      orderNo:   Store.orderNo(),
      createdAt: new Date().toISOString(),
      shop:      SHOP.name,
      mode:      checkout.mode,                                   // dinein | takeout
      table:     checkout.mode === 'dinein'  ? checkout.table  : '',
      pickup:    checkout.mode === 'takeout' ? checkout.pickup : '',
      phone:     checkout.phone,
      note:      checkout.note,
      items:     Store.lines.map(function (l) {
        return { name: l.name, qty: l.qty, unit: l.unit, addons: l.addons.map(function (a) { return a.name; }), note: l.note };
      }),
      total:     Store.total(),
      user:      { userId: u.userId, displayName: u.displayName, pictureUrl: u.pictureUrl || '' },
      idToken:   LineAuth.state.idToken || null,                  // 後端要用這個驗身分
      verified:  LineAuth.state.mode === 'real'
    };
  }

  function orderText(o) {
    var lines = o.items.map(function (i) {
      var s = '・' + i.name + ' ×' + i.qty + '  ' + i.unit * i.qty;
      if (i.addons.length) s += '\n   加點：' + i.addons.join('、');
      if (i.note) s += '\n   備註：' + i.note;
      return s;
    }).join('\n');

    var where = o.mode === 'dinein'
      ? '內用・桌號 ' + o.table
      : '外帶・' + (o.pickup === 'asap' ? '盡快' : o.pickup + ' 分鐘後');

    return '【' + o.shop + ' 訂單】\n' +
           '編號 ' + o.orderNo + '\n' +
           where + '\n' +
           '——————————\n' + lines + '\n' +
           '——————————\n' +
           '合計 ' + money(o.total) + '\n' +
           '訂購人：' + o.user.displayName +
           (o.note ? '\n備註：' + o.note : '');
  }

  function submit() {
    var o   = buildOrder();
    var url = String(CFG.ORDER_WEBHOOK_URL || '').trim();

    var send = url
      ? fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // 避開 CORS 預檢，Google Apps Script 才收得到
          body:    JSON.stringify(o)
        }).then(function (r) {
          if (!r.ok) throw new Error('店家系統沒有收到訂單（' + r.status + '）');
          return r.text();
        }).then(function () { o.sent = true; return o; })
      : Promise.resolve(Object.assign(o, { sent: false }));

    return send.then(function (order) {
      Store.saveOrder(order);
      Store.clear();
      if (CFG.SEND_LINE_MESSAGE_ON_SUBMIT) {
        LineAuth.sendOrderToChat(orderText(order));   // 在 LINE 內開啟時，順手丟一份到聊天室
      }
      return order;
    });
  }

  /* ============================================================
     6. 食券
     ============================================================ */
  function renderSuccess(o) {
    document.querySelector('.stickytop').style.display = 'none';
    $('#cbar').classList.remove('checkoutbar--on');
    window.scrollTo(0, 0);

    var where = o.mode === 'dinein'
      ? '內用・桌號 ' + esc(o.table)
      : '外帶・' + (o.pickup === 'asap' ? '盡快取餐' : o.pickup + ' 分鐘後取餐');

    var d = new Date(o.createdAt);
    var stamp = String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0') +
                ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');

    var pic = o.user.pictureUrl
      ? '<img class="stamp__pic" src="' + esc(o.user.pictureUrl) + '" alt="">'
      : '<span class="stamp__pic">' + esc(o.user.displayName.slice(0, 1)) + '</span>';

    var rows = o.items.map(function (i) {
      var sub = [i.addons.join('、'), i.note].filter(Boolean).join('｜');
      return '<div class="ticket__line">' +
               '<span>' + esc(i.name) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span>' +
               '<span class="ticket__q">×' + i.qty + '</span>' +
               '<span class="ticket__p">' + UI.num(i.unit * i.qty) + '</span>' +
             '</div>';
    }).join('');

    $('#menu').innerHTML =
      '<div style="padding-top:26px">' +
        '<p class="eyebrow">Order placed</p>' +
        '<h2 class="sec__title" style="margin-bottom:18px">訂單已送出</h2>' +

        '<div class="ticket">' +
          '<p class="ticket__kind">' + esc(SHOP.nameEn) + '</p>' +
          '<p class="ticket__label">食　券</p>' +
          '<p class="ticket__no">' + esc(o.orderNo) + '</p>' +
          '<p class="ticket__mode">' + where + '</p>' +
          '<div class="ticket__rule"></div>' +
          rows +
          '<div class="ticket__total"><span>合計</span><b>' + money(o.total) + '</b></div>' +
          '<div class="ticket__tear"></div>' +
          '<div class="stamp">' +
            '<div class="stamp__ring">' + pic + '<span class="stamp__check">✓</span></div>' +
            '<div>' +
              '<div class="stamp__name">' + esc(o.user.displayName) + '</div>' +
              '<div class="stamp__meta">LINE 驗證 · ' + stamp + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        (o.sent
          ? '<p class="notice">廚房已經收到。取餐時報編號 <b>' + esc(o.orderNo) + '</b>。</p>'
          : '<p class="notice">目前沒有設定收單網址（<b>ORDER_WEBHOOK_URL</b>），這張單只存在這支手機裡，店家還收不到。設定方式看 README。</p>') +

        '<div id="friendBox"></div>' +

        '<button class="btn" type="button" onclick="location.href=\'order.html\'">再點一份</button>' +
        '<button class="btn btn--ghost" type="button" id="doneBtn" style="margin-top:10px">完成</button>' +
      '</div>';

    $('#doneBtn').addEventListener('click', function () {
      if (!LineAuth.closeWindow()) location.href = 'index.html';
    });

    /* 還沒加官方帳號好友 → 提醒一下 */
    var oa = String(CFG.OA_ADD_FRIEND_URL || '').trim();
    if (oa) {
      LineAuth.isFriend().then(function (yes) {
        if (yes) return;
        $('#friendBox').innerHTML =
          '<p class="notice">加入 ' + esc(SHOP.name) +
          ' 官方帳號，餐點好了會用 LINE 通知你。<br>' +
          '<a href="' + esc(oa) + '" target="_blank" rel="noopener"><b>加入好友</b></a></p>';
      });
    }
  }

  /* ============================================================
     7. 啟動
     ============================================================ */
  renderTabs();
  renderMenu();
  watchScroll();

  Store.onChange(function () {
    refreshCounts();
    $('#cbarCount').textContent = Store.count();
    $('#cbarTotal').textContent = money(Store.total());
    $('#cbar').classList.toggle('checkoutbar--on', Store.count() > 0);
  });

  $('#cbarView').addEventListener('click', openCart);
  $('#cbarNext').addEventListener('click', openCheckout);

  LineAuth.onChange(function () { UI.renderIdentity('#identity'); });

  LineAuth.init().then(function (s) {
    UI.renderIdentity('#identity');
    /* 一進點餐頁就請客人用 LINE 驗證 */
    if (!s.loggedIn && CFG.AUTO_PROMPT_LOGIN) {
      setTimeout(function () { UI.needLine(); }, 500);
    }
  });

  /* 從首頁推薦點進來的 #ramen 之類，捲到該分類 */
  if (location.hash) {
    setTimeout(function () {
      var sec = document.getElementById('cat-' + location.hash.slice(1));
      if (sec) window.scrollTo({ top: sec.offsetTop - 104, behavior: 'smooth' });
    }, 250);
  }
})();
