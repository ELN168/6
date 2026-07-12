/* ============================================================
   LineAuth — 把 LIFF 包成三個動作：init / login / getUser
   ------------------------------------------------------------
   真實模式：填了 LIFF_ID → 走 LINE 官方登入
   測試模式：LIFF_ID 留空 → 用假帳號，方便你在電腦上先跑流程
   ============================================================ */

window.LineAuth = (function () {
  'use strict';

  var CFG    = window.SHUNJI_CONFIG || {};
  var MOCK_K = 'shunji.mock.user';

  var state = {
    ready:    false,
    mode:     'real',   // 'real' | 'mock'
    loggedIn: false,
    inClient: false,    // 是否在 LINE App 內開啟
    profile:  null,     // { userId, displayName, pictureUrl, statusMessage }
    idToken:  null,
    error:    null
  };

  var subs = [];
  function emit() { subs.forEach(function (fn) { try { fn(state); } catch (e) {} }); }

  /* ---------- 初始化 ---------- */
  function init() {
    if (state.ready) return Promise.resolve(state);

    var liffId = String(CFG.LIFF_ID || '').trim();

    /* 沒填 LIFF_ID → 測試模式 */
    if (!liffId) {
      if (!CFG.DEV_MOCK_LOGIN) {
        state.error = '尚未設定 LIFF_ID。請打開 assets/js/config.js 填入。';
        state.ready = true; emit();
        return Promise.resolve(state);
      }
      state.mode  = 'mock';
      state.ready = true;
      try {
        var saved = localStorage.getItem(MOCK_K);
        if (saved) { state.profile = JSON.parse(saved); state.loggedIn = true; }
      } catch (e) {}
      emit();
      return Promise.resolve(state);
    }

    /* 真實模式 */
    if (typeof liff === 'undefined') {
      state.error = 'LIFF SDK 沒有載入。請確認網頁能連到 static.line-scdn.net。';
      state.ready = true; emit();
      return Promise.resolve(state);
    }

    return liff.init({ liffId: liffId })
      .then(function () {
        state.mode     = 'real';
        state.inClient = liff.isInClient();
        state.loggedIn = liff.isLoggedIn();
        if (!state.loggedIn) { state.ready = true; emit(); return state; }
        return liff.getProfile().then(function (p) {
          state.profile = p;
          try { state.idToken = liff.getIDToken(); } catch (e) { state.idToken = null; }
          state.ready = true; emit();
          return state;
        });
      })
      .catch(function (err) {
        state.error = translateError(err);
        state.ready = true;
        emit();
        return state;
      });
  }

  /* ---------- 登入（會離開頁面再導回來）---------- */
  function login() {
    if (state.mode === 'mock') return mockLogin();
    if (state.error) return Promise.resolve(state);
    if (liff.isLoggedIn()) return init();
    liff.login({ redirectUri: window.location.href });
    return new Promise(function () {});   // 頁面即將跳走
  }

  function logout() {
    if (state.mode === 'mock') {
      try { localStorage.removeItem(MOCK_K); } catch (e) {}
    } else if (typeof liff !== 'undefined' && liff.isLoggedIn()) {
      liff.logout();
    }
    state.loggedIn = false;
    state.profile  = null;
    state.idToken  = null;
    emit();
    window.location.reload();
  }

  /* ---------- 測試模式的假登入 ---------- */
  function mockLogin() {
    var names = ['王小明', '陳怡君', '林大衛', '張雅婷', '黃冠廷'];
    var name  = names[Math.floor(Math.random() * names.length)];
    var p = {
      userId:        'Umock' + Math.random().toString(36).slice(2, 12),
      displayName:   name,
      pictureUrl:    '',
      statusMessage: '測試帳號'
    };
    return new Promise(function (resolve) {
      setTimeout(function () {           // 假裝跳去 LINE 授權再回來
        state.profile  = p;
        state.loggedIn = true;
        try { localStorage.setItem(MOCK_K, JSON.stringify(p)); } catch (e) {}
        emit();
        resolve(state);
      }, 900);
    });
  }

  /* ---------- 是否已加官方帳號好友 ---------- */
  function isFriend() {
    if (state.mode !== 'real' || typeof liff === 'undefined' || !state.loggedIn) {
      return Promise.resolve(true);
    }
    return liff.getFriendship()
      .then(function (r) { return !!r.friendFlag; })
      .catch(function () { return true; });
  }

  /* ---------- 把訂單摘要送進 LINE 聊天室（只有在 LINE App 內開啟才行）---------- */
  function sendOrderToChat(text) {
    if (state.mode !== 'real' || typeof liff === 'undefined') return Promise.resolve(false);
    if (!liff.isInClient()) return Promise.resolve(false);

    var ctx = null;
    try { ctx = liff.getContext(); } catch (e) {}
    if (!ctx || ctx.type === 'none' || ctx.type === 'external') return Promise.resolve(false);

    return liff.sendMessages([{ type: 'text', text: text }])
      .then(function () { return true; })
      .catch(function () { return false; });   // 沒開 chat_message.write 權限就靜靜略過
  }

  function closeWindow() {
    if (state.mode === 'real' && typeof liff !== 'undefined' && liff.isInClient()) {
      liff.closeWindow();
      return true;
    }
    return false;
  }

  /* ---------- 錯誤訊息翻譯 ---------- */
  function translateError(err) {
    var code = (err && (err.code || err.name)) || '';
    var msg  = (err && err.message) || String(err);

    if (/INVALID_ARGUMENT|400/.test(code + msg)) {
      return 'LIFF ID 不正確。請回 LINE Developers 主控台複製一次。';
    }
    if (/INVALID_CONFIG|FORBIDDEN|403/.test(code + msg)) {
      return '這個網址不在 LIFF 的 Endpoint URL 範圍內。請把 Endpoint URL 改成目前的網域。';
    }
    if (/UNAUTHORIZED|401/.test(code + msg)) {
      return 'LINE 登入沒有完成。請重新登入一次。';
    }
    return 'LINE 驗證失敗：' + msg;
  }

  /* ---------- 對外 ---------- */
  return {
    init:            init,
    login:           login,
    logout:          logout,
    isFriend:        isFriend,
    sendOrderToChat: sendOrderToChat,
    closeWindow:     closeWindow,
    onChange:        function (fn) { subs.push(fn); if (state.ready) fn(state); },
    get state()      { return state; },
    get user()       { return state.profile; },
    get isLoggedIn() { return state.loggedIn; }
  };
})();
