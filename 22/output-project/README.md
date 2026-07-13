# 訂單一鍵貼進 LINE 社群

零依賴、單檔、丟上 GitHub Pages 就會動。

---

## 這包裡面有什麼

| 檔案 | 幹嘛用的 |
|---|---|
| **`order.html`** | 訂單完成頁，**整頁拿去用最快**。已含全部按鈕與降級邏輯。 |
| **`shunji-share.js`** | 模組本體。訂單 → 收據 PNG → 系統分享 → LINE → 社群。 |
| **`check.html`** | **先開這個。** 用手機開，30 秒測出這條路走不走得通。 |
| `snippet.html` | 不想換頁面的話，這是貼進你「現有」完成頁的最小片段。 |
| `preview/` | 產出來的訂單圖長怎樣，先看一眼。 |

---

## 30 秒上手

```bash
# 1. 整個資料夾丟進你的 repo
# 2. push 到 GitHub Pages
# 3. 手機開 https://wsad952701-beep.github.io/shunji-share/check.html
```

`check.html` 的**圖片分享 ✓** 亮綠燈 → 主線通，把 `order.html` 接上去就收工。

---

## 為什麼選「圖片」

| 想法 | 可不可行 |
|---|---|
| 伺服器用 bot 自動推播進社群 | ✗ **社群（OpenChat）不支援 Messaging API 機器人**，只有一般「群組」才行 |
| 網頁直接把文字塞進社群輸入框 | ✗ 瀏覽器沒這種權限，做不到 |
| **系統分享面板 → LINE → 選社群 → 送出** | ✓ **唯一能一鍵做到的路** |

圖片當主力，因為：社群一定收得到圖、資訊完整不怕貼歪、在訊息洪流裡一眼認得出來。
文字版全程都在剪貼簿裡，走不通就退回去，不會卡死。

---

## 接你自己的訂單

`order.html` 會**依序**找訂單，找到就用：

**(1) 全域變數**
```html
<script>window.SHUNJI_ORDER = { ... };</script>
<script src="./shunji-share.js"></script>
```

**(2) sessionStorage（最推薦）** — 結帳頁按「送出」時：
```js
sessionStorage.setItem('shunji_order', JSON.stringify(order));
location.href = 'order.html';
```

**(3) 網址參數**
```js
const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(order))))
              .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
location.href = 'order.html?o=' + b64;
```

**(4) 都沒有** → 顯示示範訂單，畫面上會標紅字提醒。

### 訂單格式

```js
{
  code : 'SJ0713-2678',
  mode : '外送',                 // 外送 / 自取 / 內用
  when : '7/13（一）12:00',
  items: [{ name:'碳燒原隻燒鵝腿飯', qty:2, price:440 }],
  total: 440,
  note : '不要香菜',              // 選填
  customer: {                    // 選填，外送建議填，會印在圖上
    name   : '王小明',
    phone  : '0912-345-678',
    address: '新北市板橋區文化路一段188巷12弄5號7樓之3'
  }
}
```

---

## ⚠️ 唯一的地雷

iOS Safari 規定 `navigator.share()` 必須在**使用者手勢的同一拍**內呼叫。
按鈕按下去之後才 `await` 產圖，手勢授權就過期了 → 直接噴 `NotAllowedError`。

```js
// ✗ 壞的 —— 十個人有九個這樣寫，然後在 iPhone 上失敗
btn.onclick = async () => {
  const file = await makeImage();       // 手勢授權在這行死掉
  await navigator.share({ files:[file] });
};

// ✓ 好的 —— 本模組的做法
ShunjiShare.setOrder(order);            // 訂單一來就在背景把圖畫好放著
btn.onclick = () => ShunjiShare.share();// 按下去是同步呼叫，授權還在
```

**所以：`setOrder()` 要早，`share()` 的 handler 不可以是 `async`。**
（使用者手速快到圖還沒好也不會壞，會自動退回文字分享。）

---

## 自動降級順序

1. `navigator.share({ files:[PNG] })` — iOS / Android 主線
2. `navigator.share({ text })` — 沒有檔案分享能力時
3. `https://line.me/R/share?text=…` — 沒有 Web Share 時（LINE 內建瀏覽器特別好用）
4. 全程都會順手把文字複製到剪貼簿，最壞情況使用者仍可長按貼上

---

## API

```js
ShunjiShare.config({ brand, brandSub, communityUrl, filename, footer })
ShunjiShare.setOrder(order)   // 餵訂單，並立刻開始在背景產圖
ShunjiShare.share()           // Promise<'image'|'text'|'line-url'|'cancel'>
ShunjiShare.ready()           // Promise，圖產好時 resolve
ShunjiShare.imageUrl()        // dataURL，拿來做預覽縮圖
ShunjiShare.text()            // 純文字版訂單
ShunjiShare.copy()            // 只複製文字
ShunjiShare.saveImage()       // 下載 PNG
ShunjiShare.openCommunity()   // 複製文字 + 跳去社群（舊流程備援）
ShunjiShare.hasCommunity()    // 有沒有設定社群連結
ShunjiShare.caps()            // { shareFile, shareText, inLine, imageReady }
```

---

## 改樣式

改 `shunji-share.js` 最上面的 `CFG`（品牌、檔名、頁尾字）和 `C`（配色）。
收據圖下緣的鋸齒撕票口在 `receiptPath()` 的 `TEETH` / `DEPTH`。

---

## 還有一步只有真機能驗

LINE 的傳送對象清單裡會不會列出「社群」，取決於 LINE 的版本，這點沒辦法從程式碼保證。

用 `check.html` 實測一次。萬一真的沒列出來，備援路徑仍然穩：
**儲存圖片 → 進社群 → 相簿選最新一張 → 送出**。社群收圖片是 100% 沒問題的。
