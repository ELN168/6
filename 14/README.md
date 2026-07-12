# 順記燒臘館 · 設定說明

## 只需要改 config.js 這一個檔案！

---

## config.js 裡要填的兩個值

### 1. LIFF_ID（LINE 登入用）

手機或電腦打開 https://developers.line.biz → LINE 帳號登入

1. Providers → Create → 填「順記燒臘館」
2. Create a new channel → LINE Login
   → Channel name：順記燒臘館
   → App type：勾 Web app → Create
3. 點 LIFF 標籤 → Add
   → Size：Full（必選）
   → Endpoint URL：https://wsad952701-beep.github.io/123/13/
     （你的實際網址，結尾要有 /）
   → Scope：勾 profile 和 openid → Add
4. 複製 LIFF ID（格式：1234567890-AbCdEfGh）

### 2. COMMUNITY_URL（LINE 社群連結）

LINE → 你的社群 → 右上角「…」→ 邀請 → 複製邀請連結

---

## 如何編輯 config.js（手機 GitHub）

1. 打開 github.com/wsad952701-beep/123
2. 進 13 資料夾 → 點 config.js
3. 右上角點 ✏️
4. 找到並修改這兩行：

   var LIFF_ID = '你的LIFF_ID';
   var COMMUNITY_URL = '你的社群邀請連結';

5. Commit changes → Commit changes

---

## 登入後的完整流程

用戶打開網站 → 點「LINE 帳號登入」
→ 跳到 LINE 授權 → 同意
→ 跳回網站顯示「✓ 登入成功」
→ 1.8 秒後自動進入 LINE 社群畫面
→ 可以在社群裡直接點餐

---

## 常見問題

Q：點登入後沒有跳到 LINE
→ LIFF_ID 還沒填（仍是空的 ''）

Q：登入成功但沒有進社群
→ COMMUNITY_URL 是預設值，請換成你的社群邀請連結

Q：出現「LIFF 初始化失敗」
→ Endpoint URL 填錯，確認結尾有 /，且與實際網址完全一致
