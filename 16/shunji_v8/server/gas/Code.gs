/* ============================================================
   順吉 — 免伺服器收單（Google Apps Script）
   訂單寫進 Google 試算表 + 用 LINE 推播通知店家
   ------------------------------------------------------------
   1. 開一個新的 Google 試算表，網址中間那串就是 SHEET_ID
   2. 擴充功能 → Apps Script → 貼上這整份
   3. 填下面三個常數
   4. 部署 → 新增部署作業 → 類型「網頁應用程式」
      執行身分：我
      誰可以存取：「任何人」   ← 一定要選這個
   5. 複製網址，貼到 assets/js/config.js 的 ORDER_WEBHOOK_URL
   ============================================================ */

const SHEET_ID  = '請填入試算表 ID';
const LINE_TOKEN = '';   // 選填：Messaging API channel access token（要通知店家才需要）
const SHOP_TO    = '';   // 選填：店家的 LINE userId 或 群組 ID
const LOGIN_CHANNEL_ID = '';  // 選填：LINE Login channel ID，填了才會驗證客人的身分

function doPost(e) {
  try {
    const order = JSON.parse(e.postData.contents);

    // 驗證客人真的是那個 LINE 帳號（強烈建議做）
    if (LOGIN_CHANNEL_ID && order.idToken) {
      const v = verifyIdToken(order.idToken);
      if (!v || v.sub !== order.user.userId) {
        return json({ ok: false, error: 'LINE 身分驗證失敗' });
      }
      order.user.displayName = v.name || order.user.displayName;
    }

    appendRow(order);
    notifyShop(order);

    return json({ ok: true, orderNo: order.orderNo });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json({ ok: true, service: 'shunji-orders' });
}

/* ---------- 驗證 LINE ID Token ---------- */
function verifyIdToken(idToken) {
  const res = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'post',
    payload: { id_token: idToken, client_id: LOGIN_CHANNEL_ID },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) return null;
  return JSON.parse(res.getContentText());   // { sub, name, picture, ... }
}

/* ---------- 寫進試算表 ---------- */
function appendRow(o) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName('訂單');
  if (!sh) {
    sh = ss.insertSheet('訂單');
    sh.appendRow(['時間', '編號', '方式', '桌號/取餐', '客人', 'LINE userId', '餐點', '備註', '電話', '金額', '已驗證']);
    sh.setFrozenRows(1);
  }

  const items = o.items.map(function (i) {
    let s = i.name + ' x' + i.qty;
    if (i.addons && i.addons.length) s += '(' + i.addons.join('、') + ')';
    if (i.note) s += '[' + i.note + ']';
    return s;
  }).join('\n');

  sh.appendRow([
    new Date(o.createdAt),
    o.orderNo,
    o.mode === 'dinein' ? '內用' : '外帶',
    o.mode === 'dinein' ? o.table : o.pickup,
    o.user.displayName,
    o.user.userId,
    items,
    o.note || '',
    o.phone || '',
    o.total,
    o.verified ? 'Y' : 'N'
  ]);
}

/* ---------- 推播給店家 ---------- */
function notifyShop(o) {
  if (!LINE_TOKEN || !SHOP_TO) return;

  const lines = o.items.map(function (i) {
    let s = '・' + i.name + ' ×' + i.qty;
    if (i.addons && i.addons.length) s += '（' + i.addons.join('、') + '）';
    if (i.note) s += '\n  ' + i.note;
    return s;
  }).join('\n');

  const where = o.mode === 'dinein'
    ? '內用・桌號 ' + o.table
    : '外帶・' + (o.pickup === 'asap' ? '盡快' : o.pickup + ' 分鐘後');

  const text =
    '🔔 新訂單 ' + o.orderNo + '\n' +
    where + '\n' +
    '——————————\n' + lines + '\n' +
    '——————————\n' +
    '合計 NT$ ' + o.total + '\n' +
    '訂購人：' + o.user.displayName +
    (o.note ? '\n備註：' + o.note : '') +
    (o.phone ? '\n電話：' + o.phone : '');

  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + LINE_TOKEN },
    payload: JSON.stringify({ to: SHOP_TO, messages: [{ type: 'text', text: text }] }),
    muteHttpExceptions: true
  });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
