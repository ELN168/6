# 順記燒臘館 官方點餐網站（含 LINE 登入 + 手機 OTP 驗證）

## 功能說明

顧客在點餐前必須完成：
1. **LINE 帳號登入**（取得顯示名稱）
2. **手機號碼驗證**（簡訊 OTP）

驗證後：
- 訂單表單自動填入 LINE 顯示名稱
- 電話號碼自動填入並鎖定（已驗證，不可更改）
- 登入狀態保留 7 天（可在 `AUTH_REMEMBER_DAYS` 設定）

---

## 快速設定步驟

### 第一步：申請 LINE LIFF（免費，約 10 分鐘）

1. 登入 [LINE Developers Console](https://developers.line.biz)
2. 點「Log in with LINE account」→ 登入你的 LINE 帳號
3. 點右上角「Create a new provider」→ 填入店名（例：`順記燒臘館`）→ 建立
4. 點「Create a new channel」→ 選「**LINE Login**」
   - Channel name：`順記燒臘館`
   - Channel description：點餐系統
   - App type：`Web app`
   - Email：填入你的 email
   → 點「Create」→ 勾選同意 → 確認
5. 進入剛建立的 Channel → 點「**LIFF**」標籤 → 點「**Add**」
   - LIFF app name：`點餐`
   - **Size：`Full`**（必須選 Full）
   - **Endpoint URL：填入你的 GitHub Pages 網址**
     - 格式：`https://你的帳號.github.io/倉庫名稱/`
     - 例：`https://shunji.github.io/web/`（結尾要有斜線 `/`）
   - Scope：勾選 `profile` 和 `openid`
   - 其他保持預設 → 點「Add」
6. 複製顯示的 **LIFF ID**（格式：`1234567890-AbCdEfGh`）

---

### 第二步：申請 Firebase（免費，約 10 分鐘）

> 若不需要真正驗證手機號碼（只收號碼不發簡訊），可跳過此步驟。

1. 登入 [Firebase Console](https://console.firebase.google.com)
2. 點「**新增專案**」→ 填入名稱（例：`shunji-auth`）→ 不需要 Google Analytics → 建立專案
3. 點「**在您的應用程式中加入 Firebase**」→ 選「**Web（< >）**」
   - App nickname：`web` → **不勾** Firebase Hosting → 點「Register app」
   - 複製顯示的 **firebaseConfig** 物件（從 `{` 到 `}` 整段複製）
4. 到左側選單「**Build → Authentication**」→ 點「開始使用」
5. 點「**Sign-in method**」標籤 → 點「**電話**」→ 啟用 → 儲存
6. 點「**Settings（齒輪）**」→ 點「**Authorized domains**」→ 點「**Add domain**」
   - 填入你的 GitHub Pages 網域（例：`shunji.github.io`）→ 儲存

---

### 第三步：填入設定到 index.html

打開 `index.html`，搜尋（Ctrl+F）`AUTH_LIFF_ID`，找到以下設定區段：

```javascript
var AUTH_LIFF_ID = '';
var AUTH_FB_CFG  = null;
```

填入你的設定：

```javascript
var AUTH_LIFF_ID = '1234567890-AbCdEfGh';   // ← 填入你的 LIFF ID

var AUTH_FB_CFG = {                           // ← 取消 // 並貼入 Firebase 設定
  apiKey:            "AIzaSyXXXXXXXXXXXXXXX",
  authDomain:        "shunji-auth.firebaseapp.com",
  projectId:         "shunji-auth",
  storageBucket:     "shunji-auth.appspot.com",
  messagingSenderId: "000000000000",
  appId:             "1:000000000000:web:xxxxxxxxxxxx"
};
```

---

### 第四步：部署到 GitHub Pages

1. 把 `index.html`、`assets/`、`.nojekyll` 推到你的 GitHub 倉庫
2. GitHub 設定頁 → Pages → 確認 Branch 為 `main` 且已啟用

---

## 各種模式說明

| AUTH_LIFF_ID | AUTH_FB_CFG | 效果 |
|:---:|:---:|---|
| ✅ 已填 | ✅ 已填 | **完整模式**：LINE 登入 + 簡訊 OTP 驗證 |
| ✅ 已填 | ❌ 未填 | LINE 登入 + 手機號碼收集（不發簡訊）|
| ❌ 未填 | ✅ 已填 | 手機 OTP 驗證（無 LINE 登入）|
| ❌ 未填 | ❌ 未填 | Demo 模式：只收手機號碼（不驗證）|

---

## 常見問題

**Q：LINE 登入後一直在「驗證中」轉圈？**
A：Endpoint URL 與你實際的 GitHub Pages 網址不符。請確認：
- LIFF 設定的 URL 結尾有 `/`
- 大小寫完全一致

**Q：Firebase 簡訊發不出去？**
A：
1. 確認已在 Firebase Console → Authentication → Settings → 加入授權網域
2. 免費方案限制：台灣號碼每日有配額，超過需啟用計費（每月 10,000 通免費）

**Q：想修改登入保留天數？**
A：改 `index.html` 裡的 `var AUTH_REMEMBER_DAYS = 7;`（0 = 每次開瀏覽器重新驗證）

---

## 訂購專線
03-264-0001

桃園市中壢區南園二路 12 號｜週一至週五 11:00–13:30・16:00–19:00
