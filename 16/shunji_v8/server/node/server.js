/* ============================================================
   順吉 — 自架收單伺服器（Node 18+）
   ------------------------------------------------------------
   重點：前端傳來的 displayName / userId 都不能直接相信。
        一定要拿 idToken 去問 LINE，才知道客人是誰。
   ------------------------------------------------------------
   npm install && npm start   → http://localhost:3000
   ============================================================ */

import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE      = path.join(__dirname, '..', '..');
const DB        = path.join(__dirname, 'orders.json');

const LOGIN_CHANNEL_ID = process.env.LINE_LOGIN_CHANNEL_ID || '';
const MSG_TOKEN        = process.env.LINE_MESSAGING_TOKEN  || '';
const SHOP_TO          = process.env.SHOP_LINE_TO          || '';
const PORT             = process.env.PORT || 3000;

const app = express();
app.use(express.text({ type: '*/*', limit: '256kb' }));   // 前端用 text/plain 送，避開 CORS 預檢

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/* ---------- 向 LINE 確認 ID Token ---------- */
async function verifyIdToken(idToken) {
  if (!LOGIN_CHANNEL_ID || !idToken) return null;
  const r = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ id_token: idToken, client_id: LOGIN_CHANNEL_ID })
  });
  if (!r.ok) return null;
  return r.json();   // { sub, name, picture, aud, exp, ... }
}

/* ---------- 推播通知店家 ---------- */
async function notifyShop(order) {
  if (!MSG_TOKEN || !SHOP_TO) return;

  const lines = order.items.map(i => {
    let s = `・${i.name} ×${i.qty}`;
    if (i.addons?.length) s += `（${i.addons.join('、')}）`;
    if (i.note) s += `\n  ${i.note}`;
    return s;
  }).join('\n');

  const where = order.mode === 'dinein'
    ? `內用・桌號 ${order.table}`
    : `外帶・${order.pickup === 'asap' ? '盡快' : order.pickup + ' 分鐘後'}`;

  const text =
    `🔔 新訂單 ${order.orderNo}\n${where}\n` +
    `——————————\n${lines}\n——————————\n` +
    `合計 NT$ ${order.total}\n訂購人：${order.user.displayName}` +
    (order.note  ? `\n備註：${order.note}`  : '') +
    (order.phone ? `\n電話：${order.phone}` : '');

  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MSG_TOKEN}` },
    body: JSON.stringify({ to: SHOP_TO, messages: [{ type: 'text', text }] })
  }).catch(() => {});
}

/* ---------- 收單 ---------- */
app.post('/api/orders', async (req, res) => {
  let order;
  try { order = JSON.parse(req.body); }
  catch { return res.status(400).json({ ok: false, error: '訂單格式不正確' }); }

  if (!order.items?.length) {
    return res.status(400).json({ ok: false, error: '訂單是空的' });
  }

  /* 身分驗證：設了 channel id 就一定要驗過才收單 */
  if (LOGIN_CHANNEL_ID) {
    const claims = await verifyIdToken(order.idToken);
    if (!claims || claims.sub !== order.user?.userId) {
      return res.status(401).json({ ok: false, error: 'LINE 身分驗證失敗' });
    }
    order.user.displayName = claims.name || order.user.displayName;
    order.user.pictureUrl  = claims.picture || order.user.pictureUrl;
    order.verified = true;
  }

  /* 金額後端自己再算一次，不要相信前端 */
  order.total = order.items.reduce((n, i) => n + Number(i.unit) * Number(i.qty), 0);

  delete order.idToken;   // 不要存

  const all = JSON.parse(await fs.readFile(DB, 'utf8').catch(() => '[]'));
  all.unshift({ ...order, receivedAt: new Date().toISOString() });
  await fs.writeFile(DB, JSON.stringify(all, null, 2));

  notifyShop(order);

  res.json({ ok: true, orderNo: order.orderNo });
});

/* ---------- 店家看單（正式上線請加密碼保護）---------- */
app.get('/api/orders', async (req, res) => {
  const all = JSON.parse(await fs.readFile(DB, 'utf8').catch(() => '[]'));
  res.json(all);
});

/* ---------- 順便把網站也一起 serve ---------- */
app.use(express.static(SITE));

app.listen(PORT, () => {
  console.log(`順吉 → http://localhost:${PORT}`);
  if (!LOGIN_CHANNEL_ID) console.log('提醒：沒設 LINE_LOGIN_CHANNEL_ID，訂單不會驗證身分。');
});
