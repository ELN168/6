/* ================================================
   順記燒臘館 · 設定檔
   只需要修改下面這兩行！
   ================================================

   LIFF_ID 取得方式：
   1. 打開 https://developers.line.biz → LINE 登入
   2. Providers → Create → 輸入店名
   3. Create a new channel → LINE Login → App type 勾 Web app
   4. 點 LIFF 標籤 → Add
      Size：Full
      Endpoint URL：你的網址（例 https://wsad952701-beep.github.io/123/13/）
      Scope：勾 profile 和 openid
   5. 複製 LIFF ID（格式：1234567890-AbCdEfGh）

   COMMUNITY_URL 取得方式：
   LINE → 你的社群 → 右上角設定 → 邀請 → 複製邀請連結
   ================================================ */

var LIFF_ID = '';
/* 改成：var LIFF_ID = '1234567890-AbCdEfGh'; */

var COMMUNITY_URL = 'https://line.me/ti/g2/GAhXwcx8SMs8nLxe-e7G0QSFVxCCYJmAx8rlMA?utm_source=invitation&utm_medium=QR_code&utm_campaign=default';
/* 如需更換社群連結，把上面引號裡的網址替換掉 */

var REMEMBER_DAYS = 14;
