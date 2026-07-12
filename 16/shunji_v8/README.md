# 順吉 SHUNJI — LINE 驗證線上訂餐 v8

客人的流程長這樣：

```
點網址  →  首頁（隨便看，不用登入）
          ↓ 按「立即訂餐」
        點餐頁  →  跳出「用 LINE 確認身分」
                    ↓ 客人按同意
                  網頁拿到他的 LINE 名稱＋大頭貼
                    ↓
                  可以加入訂單、送出
                    ↓
                  食券（訂單編號＋LINE 驗證章）
```

沒驗證 LINE，加不了餐點，也送不出單。

---

## 一、先跑起來看看（0 分鐘）

把資料夾裡的 `index.html` 用瀏覽器打開就好。

因為 `config.js` 的 `LIFF_ID` 還沒填，網站會進入**測試模式**：登入是假的，會隨機給你一個假的 LINE 名字，但整個流程（驗證 → 點餐 → 送單 → 食券）都跑得完。畫面上會有一條黃色提示條告訴你現在是測試模式。

---

## 二、接上真的 LINE（約 10 分鐘）

### 1. 開一個 LINE Login channel

到 [LINE Developers Console](https://developers.line.biz/console/)：

1. 建立 **Provider**（隨便取名，例如「順吉」）
2. 在 Provider 底下 **Create a new channel** → 選 **LINE Login**
3. App type 勾 **Web app**

### 2. 建立 LIFF

進入剛剛那個 channel → **LIFF** 分頁 → **Add**：

| 欄位 | 填什麼 |
|---|---|
| LIFF app name | 順吉訂餐 |
| Size | **Full** |
| Endpoint URL | `https://你的網域/`（必須是 **https**，見下面第三節） |
| Scopes | 勾 **profile**、**openid**；想把訂單丟進聊天室再勾 **chat_message.write** |
| Bot link feature | 有官方帳號就選 On |

建好之後會拿到一組 **LIFF ID**，長得像 `2006123456-AbCdEfGh`。

### 3. 貼進設定檔

打開 `assets/js/config.js`：

```js
LIFF_ID: '2006123456-AbCdEfGh',   // ← 貼在這裡
```

### 4. ⚠️ 把 channel 發布出去

LINE Login channel 預設是 **Developing** 狀態，這時候**只有你自己（測試人員）登得進去**，客人會失敗。

到 channel 首頁把狀態切成 **Published**。這一步最多人漏掉。

---

## 三、上線（一定要 HTTPS）

LINE 不接受 `http://`，也不接受直接開檔案。挑一個：

| 方法 | 怎麼做 |
|---|---|
| **Netlify**（最快） | 把整個資料夾拖到 <https://app.netlify.com/drop>，馬上拿到 https 網址 |
| **Vercel** | `npx vercel --prod` |
| **GitHub Pages** | 推上 repo → Settings → Pages |
| **自己的主機** | 把檔案丟進去，記得裝 SSL 憑證 |

拿到網址後，**回 LIFF 設定把 Endpoint URL 改成同一個網址**，不然登入會被擋。

本機想測真的 LINE，可以用 `ngrok http 3000` 開一條臨時 https 通道。

---

## 四、訂單要送到店家（不然只會存在客人手機裡）

沒設定的話，客人送單後會看到食券，但廚房收不到。兩種做法選一個，把網址填進 `config.js` 的 `ORDER_WEBHOOK_URL`。

### 做法 A：Google 試算表（免費、不用伺服器）

1. 開一個新的 Google 試算表，網址中間那串就是 SHEET_ID
2. **擴充功能 → Apps Script**，把 `server/gas/Code.gs` 整份貼進去
3. 填上檔案最上面的常數
4. **部署 → 新增部署作業 → 網頁應用程式**
   - 執行身分：**我**
   - 誰可以存取：**任何人** ← 一定要選這個，不然收不到
5. 複製部署網址，貼到 `config.js`

訂單會一列一列寫進試算表，也能同時用 LINE 推播通知你。

### 做法 B：自己架 Node

```bash
cd server/node
cp .env.example .env      # 填上 channel id / token
npm install
npm start                 # → http://localhost:3000
```

`config.js` 填 `ORDER_WEBHOOK_URL: 'https://你的網域/api/orders'`。

---

## 五、安全性（重要）

前端傳來的 `displayName`、`userId` 都是**可以被偽造的**，不要拿來當作身分證明。

真正的做法是：前端把 `idToken` 一起送出，後端拿去問 LINE。這兩份後端程式都已經做好了，你只要填上 **LINE Login channel ID**：

- `server/node/.env` → `LINE_LOGIN_CHANNEL_ID`
- `server/gas/Code.gs` → `LOGIN_CHANNEL_ID`

填了之後，驗不過的訂單會直接被拒絕。金額後端也會自己重算一次。

---

## 六、換成你自己的店

| 想改什麼 | 改哪裡 |
|---|---|
| 店名、地址、電話、營業時間 | `assets/js/config.js` 的 `SHOP` |
| 菜單、價格、加點、分類 | `assets/js/menu-data.js` |
| 餐點照片 | 圖片丟 `assets/img/`，在菜單那道菜加 `img: 'assets/img/xxx.jpg'` |
| 顏色、字體 | `assets/css/style.css` 最上面的 `:root` |
| 首頁推薦哪幾道 | 菜單裡加 `hot: true` |

沒放照片也不會開天窗，系統會自動畫一張漢字牌。

---

## 七、桌邊 QR code

在 QR code 網址後面加桌號：

```
https://你的網域/?table=5
```

客人掃了之後，桌號會自動帶進結帳頁。

---

## 八、卡住的時候

| 症狀 | 原因 |
|---|---|
| 一直轉圈／登入沒反應 | Endpoint URL 跟現在的網址不一樣 |
| 客人登入失敗，只有你可以 | channel 還是 Developing，沒 Published |
| `LIFF ID 不正確` | 複製到的是 channel ID 不是 LIFF ID |
| 訂單送不出去 | `ORDER_WEBHOOK_URL` 沒填，或 Apps Script 沒設「任何人」可存取 |
| 訂單沒進聊天室 | 只有在 **LINE App 內**開啟才有效，而且要勾 `chat_message.write` |
| 出現黃色測試條 | `LIFF_ID` 還沒填 |

---

## 檔案結構

```
index.html            首頁（公開）
order.html            點餐 ＋ LINE 驗證 ＋ 結帳 ＋ 食券
orders.html           我的訂單

assets/js/config.js       ← 你主要要改的
assets/js/menu-data.js    ← 菜單
assets/js/liff-auth.js    LINE 驗證
assets/js/store.js        購物車
assets/js/ui.js           驗證閘門、共用元件
assets/js/order.js        點餐流程
assets/css/style.css      樣式

server/gas/Code.gs        免伺服器收單
server/node/              自架收單
```
