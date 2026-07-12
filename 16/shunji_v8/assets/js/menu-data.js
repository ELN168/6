/* ============================================================
   菜單資料 — 改這裡就換整份菜單
   img: 有照片就填 'assets/img/oyako.jpg'，沒填會自動畫出字牌
   ============================================================ */

window.SHUNJI_MENU = {

  categories: [
    { id: 'don',   name: '丼飯' },
    { id: 'teisho', name: '定食' },
    { id: 'ramen', name: '拉麵' },
    { id: 'side',  name: '小鉢' },
    { id: 'drink', name: '飲品' }
  ],

  /* 可加點的配料，用 id 掛到餐點上 */
  addons: {
    egg:    { id: 'egg',    name: '溫泉蛋',   price: 30 },
    rice:   { id: 'rice',   name: '白飯加大', price: 20 },
    nori:   { id: 'nori',   name: '海苔絲',   price: 15 },
    chashu: { id: 'chashu', name: '加叉燒',   price: 60 },
    noodle: { id: 'noodle', name: '加麵',     price: 30 },
    spicy:  { id: 'spicy',  name: '辣味噌',   price: 20 },
    ice:    { id: 'ice',    name: '去冰',     price: 0 }
  },

  items: [
    /* --- 丼飯 --- */
    { id: 'd1', cat: 'don', glyph: '親', name: '親子丼',
      desc: '土雞腿肉與半熟蛋，柴魚醬汁收汁', price: 180,
      addons: ['egg', 'rice', 'nori'], hot: true },

    { id: 'd2', cat: 'don', glyph: '鮭', name: '炙燒鮭魚親子丼',
      desc: '厚切鮭魚炙燒，鋪上北海道鮭魚卵', price: 280,
      addons: ['rice', 'nori'], hot: true },

    { id: 'd3', cat: 'don', glyph: '豚', name: '薑燒豚肉丼',
      desc: '梅花豬薄片，生薑醬油快炒', price: 190,
      addons: ['egg', 'rice'] },

    { id: 'd4', cat: 'don', glyph: '天', name: '天婦羅丼',
      desc: '大草蝦兩尾、時蔬三品，現炸酥脆', price: 240,
      addons: ['rice'] },

    /* --- 定食 --- */
    { id: 't1', cat: 'teisho', glyph: '鯖', name: '炭烤鯖魚定食',
      desc: '挪威薄鹽鯖魚，附白飯、味噌湯、兩小菜', price: 260,
      addons: ['rice'], hot: true },

    { id: 't2', cat: 'teisho', glyph: '唐', name: '唐揚雞定食',
      desc: '雞腿肉醃一夜，兩次油炸，附檸檬', price: 230,
      addons: ['rice', 'egg'] },

    { id: 't3', cat: 'teisho', glyph: '豬', name: '味噌豬排定食',
      desc: '厚切里肌，八丁味噌醬', price: 280,
      addons: ['rice'] },

    { id: 't4', cat: 'teisho', glyph: '燒', name: '燒鳥雞腿定食',
      desc: '備長炭直火，鹽味或醬燒', price: 250,
      addons: ['rice', 'egg'] },

    /* --- 拉麵 --- */
    { id: 'r1', cat: 'ramen', glyph: '醬', name: '醬油拉麵',
      desc: '雞白湯基底，細直麵', price: 200,
      addons: ['chashu', 'egg', 'noodle', 'nori'] },

    { id: 'r2', cat: 'ramen', glyph: '味', name: '味噌拉麵',
      desc: '三種味噌調和，中粗捲麵', price: 220,
      addons: ['chashu', 'egg', 'noodle', 'spicy'], hot: true },

    { id: 'r3', cat: 'ramen', glyph: '豚', name: '豚骨拉麵',
      desc: '大骨熬 12 小時，濃厚系', price: 230,
      addons: ['chashu', 'egg', 'noodle'] },

    { id: 'r4', cat: 'ramen', glyph: '沾', name: '沾麵',
      desc: '粗麵冷水締，濃魚介沾汁', price: 240,
      addons: ['chashu', 'egg', 'noodle'] },

    /* --- 小鉢 --- */
    { id: 's1', cat: 'side', glyph: '玉', name: '明太子玉子燒', desc: '現煎，四片', price: 90 },
    { id: 's2', cat: 'side', glyph: '唐', name: '唐揚雞（5 塊）', desc: '單點小份', price: 110 },
    { id: 's3', cat: 'side', glyph: '溫', name: '溫泉蛋', desc: '', price: 30 },
    { id: 's4', cat: 'side', glyph: '汁', name: '味噌湯', desc: '豆腐、海帶芽', price: 40 },
    { id: 's5', cat: 'side', glyph: '菜', name: '高麗菜沙拉', desc: '胡麻醬', price: 60 },
    { id: 's6', cat: 'side', glyph: '飯', name: '白飯', desc: '', price: 25 },

    /* --- 飲品 --- */
    { id: 'b1', cat: 'drink', glyph: '烏', name: '冰烏龍茶', desc: '無糖', price: 40, addons: ['ice'] },
    { id: 'b2', cat: 'drink', glyph: '玄', name: '玄米茶（熱）', desc: '', price: 45 },
    { id: 'b3', cat: 'drink', glyph: '彈', name: '彈珠汽水', desc: '玻璃瓶裝', price: 60 },
    { id: 'b4', cat: 'drink', glyph: '柚', name: '柚子氣泡水', desc: '手工柚子醬', price: 70, addons: ['ice'] }
  ]
};
