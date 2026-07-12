/* ============================================================
   UI — 共用元件：身分晶片、LINE 驗證閘門、Toast
   ============================================================ */

window.UI = (function () {
  'use strict';

  var CFG = window.SHUNJI_CONFIG || {};
  var CUR = (CFG.SHOP && CFG.SHOP.currency) || 'NT$';

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return CUR + ' ' + Number(n).toLocaleString('en-US'); }
  function num(n)   { return Number(n).toLocaleString('en-US'); }

  /* ---------- 餐點圖 ---------- */
  function tile(item, size) {
    var cls = 'tile tile--' + item.cat + (size ? ' tile--' + size : '');
    if (item.img) {
      return '<div class="' + cls + '" style="background-image:url(' + esc(item.img) + ')"></div>';
    }
    return '<div class="' + cls + '"><span class="tile__glyph">' + esc(item.glyph || item.name[0]) + '</span></div>';
  }

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg, kind) {
    var t = $('#toast');
    if (!t) { t = el('div', 'toast'); t.id = 'toast'; document.body.appendChild(t); }
    t.className = 'toast toast--show' + (kind ? ' toast--' + kind : '');
    t.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'toast'; }, 2600);
  }

  /* ---------- 頁首身分晶片 ---------- */
  function renderIdentity(mountSel) {
    var mount = $(mountSel);
    if (!mount) return;
    var s = window.LineAuth.state;

    if (!s.ready) { mount.innerHTML = '<span class="chip chip--ghost">連線中…</span>'; return; }

    if (!s.loggedIn) {
      mount.innerHTML = '<span class="chip chip--ghost">尚未驗證</span>';
      return;
    }

    var p   = s.profile;
    var pic = p.pictureUrl
      ? '<img class="chip__pic" src="' + esc(p.pictureUrl) + '" alt="">'
      : '<span class="chip__pic chip__pic--letter">' + esc(p.displayName.slice(0, 1)) + '</span>';

    mount.innerHTML =
      '<button class="chip chip--user" id="chipUser" type="button">' +
        pic +
        '<span class="chip__name">' + esc(p.displayName) + '</span>' +
        '<span class="chip__check" aria-label="已驗證">✓</span>' +
      '</button>';

    var b = $('#chipUser');
    if (b) b.addEventListener('click', function () {
      if (confirm('要登出 LINE 驗證嗎？購物車會保留。')) window.LineAuth.logout();
    });
  }

  /* ============================================================
     LINE 驗證閘門
     needLine().then(ok => ...) ；ok=true 代表已驗證，可以繼續
     ============================================================ */
  var gateEl = null;
  var gateResolve = null;

  function buildGate() {
    if (gateEl) return gateEl;

    var shopName = (CFG.SHOP && CFG.SHOP.name) || '本店';
    var wrap = el('div', 'gate');
    wrap.id = 'gate';
    wrap.innerHTML =
      '<div class="gate__backdrop" data-close="1"></div>' +
      '<div class="gate__sheet" role="dialog" aria-modal="true" aria-labelledby="gateTitle">' +
        '<div class="gate__grip"></div>' +

        '<div class="gate__mark">' +
          '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3C8.8 3 3 7.6 3 13.3c0 5.1 4.6 9.4 10.8 10.2.4.1 1 .3 1.1.6.1.3.1.7 0 1l-.2 1.1c-.1.3-.3 1.3 1.1.7 1.4-.6 7.6-4.5 10.4-7.7 1.9-2.1 2.8-4.2 2.8-6.9C29 7.6 23.2 3 16 3z"/></svg>' +
        '</div>' +

        '<h2 class="gate__title" id="gateTitle">用 LINE 確認身分，才能送出訂單</h2>' +
        '<p class="gate__body">' + esc(shopName) + '需要知道這張單是誰點的。按下按鈕後 LINE 會問你要不要同意；同意後我們只會拿到你的<strong>名稱</strong>與<strong>大頭貼</strong>。</p>' +

        '<ul class="gate__facts">' +
          '<li><span class="gate__yes">會拿到</span>LINE 顯示名稱、大頭貼</li>' +
          '<li><span class="gate__no">不會拿到</span>聊天記錄、好友名單、電話</li>' +
        '</ul>' +

        '<button class="btn btn--line" id="gateLogin" type="button">' +
          '<svg class="btn__line-icon" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3C8.8 3 3 7.6 3 13.3c0 5.1 4.6 9.4 10.8 10.2.4.1 1 .3 1.1.6.1.3.1.7 0 1l-.2 1.1c-.1.3-.3 1.3 1.1.7 1.4-.6 7.6-4.5 10.4-7.7 1.9-2.1 2.8-4.2 2.8-6.9C29 7.6 23.2 3 16 3z"/></svg>' +
          '<span>使用 LINE 登入</span>' +
        '</button>' +

        '<button class="gate__later" id="gateLater" type="button">先看看菜單</button>' +

        '<p class="gate__err" id="gateErr" hidden></p>' +
      '</div>';

    document.body.appendChild(wrap);

    wrap.addEventListener('click', function (e) {
      if (e.target.dataset.close) closeGate(false);
    });

    $('#gateLater').addEventListener('click', function () { closeGate(false); });

    $('#gateLogin').addEventListener('click', function () {
      var btn = this;
      btn.disabled = true;
      btn.classList.add('is-busy');
      btn.querySelector('span').textContent = '前往 LINE…';

      window.LineAuth.login().then(function (s) {
        btn.disabled = false;
        btn.classList.remove('is-busy');
        btn.querySelector('span').textContent = '使用 LINE 登入';
        if (s && s.loggedIn) {
          closeGate(true);
          toast('已用 LINE 完成驗證');
        } else if (s && s.error) {
          var err = $('#gateErr');
          err.hidden = false;
          err.textContent = s.error;
        }
      });
    });

    gateEl = wrap;
    return wrap;
  }

  function openGate() {
    buildGate();
    var s = window.LineAuth.state;
    var err = $('#gateErr');
    if (s.error) { err.hidden = false; err.textContent = s.error; }
    else { err.hidden = true; }

    document.body.classList.add('is-locked');
    requestAnimationFrame(function () { gateEl.classList.add('gate--open'); });
  }

  function closeGate(ok) {
    if (!gateEl) return;
    gateEl.classList.remove('gate--open');
    document.body.classList.remove('is-locked');
    if (gateResolve) { gateResolve(!!ok); gateResolve = null; }
  }

  /* 需要驗證才能做的事，都先過這一關 */
  function needLine() {
    return window.LineAuth.init().then(function (s) {
      if (s.loggedIn) return true;
      return new Promise(function (resolve) {
        gateResolve = resolve;
        openGate();
      });
    });
  }

  /* ---------- 通用 bottom sheet ---------- */
  function sheet(html, onMount) {
    var s = el('div', 'sheet');
    s.innerHTML =
      '<div class="sheet__backdrop" data-close="1"></div>' +
      '<div class="sheet__panel" role="dialog" aria-modal="true">' +
        '<div class="sheet__grip"></div>' + html +
      '</div>';
    document.body.appendChild(s);
    document.body.classList.add('is-locked');
    requestAnimationFrame(function () { s.classList.add('sheet--open'); });

    function close() {
      s.classList.remove('sheet--open');
      document.body.classList.remove('is-locked');
      setTimeout(function () { s.remove(); }, 260);
    }
    s.addEventListener('click', function (e) { if (e.target.dataset.close) close(); });
    if (onMount) onMount(s, close);
    return close;
  }

  /* ---------- 測試模式提示條 ---------- */
  function devBanner() {
    if (String(CFG.LIFF_ID || '').trim()) return;
    var b = el('div', 'devbar',
      '測試模式：<b>config.js</b> 還沒填 LIFF_ID，登入是假的。填上去就會走真正的 LINE 驗證。');
    document.body.insertBefore(b, document.body.firstChild);
    document.body.classList.add('has-devbar');
  }

  return {
    $: $, $$: $$, el: el, esc: esc, money: money, num: num,
    tile: tile, toast: toast, sheet: sheet,
    renderIdentity: renderIdentity, needLine: needLine, devBanner: devBanner
  };
})();
