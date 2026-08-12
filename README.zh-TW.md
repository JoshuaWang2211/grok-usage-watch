# 🌟 Grok Usage Watch – Rate Limit Tracker

🔎 即時顯示 Grok 使用量

⭐ 獲 Chrome Web Store 列為精選商品 · 1,000+ Chrome Web Store 使用者

📘 [View in English](./README.md)

---

## 📌 功能介紹

**Grok Usage Watch** 是一款輕量級的瀏覽器擴充功能，能在 Grok.com 網站上即時顯示你的剩餘使用資源。 

透過簡潔、可拖曳的懸浮視窗，讓你隨時掌握使用狀況。

---

## ✨ 功能特色

* 即時用量追蹤
* 支援 Grok 免費與付費帳號
* 可拖曳的懸浮式介面
* 拖曳右下角握把即可縮放面板
* 不需要時可收合成精簡指示器
* 支援深色／淺色模式切換

---

## 📊 顯示內容

Grok 對免費與付費帳號採用完全不同的計量方式，面板會依你的帳號自動顯示對應的那一種。

| 帳號類型 | 面板顯示 |
|---|---|
| 免費 | Fast 模式的剩餘次數 |
| 付費方案 | 每週用量池 —— 已使用比例、重設時間，以及 Chat、Imagine 等各產品的用量細分 |

---

## 📸 截圖預覽

![Grok Usage Watch screenshot](assets/screenshot.jpg)

---

![Grok Usage Watch screenshot2](assets/screenshot2.jpg)

---

## 🛠 安裝方式

從 Chrome Web Store 安裝： [點此安裝](https://chrome.google.com/webstore/detail/bmpboaihdkpkjehbceegdmndkonlpdge)

---

## 🧩 專案檔案說明

* `manifest.json`：擴充功能設定與權限定義
* `content.js`：注入頁面的腳本，負責即時抓取並顯示剩餘額度
* `background.js`：點擊工具列圖示可直接開啟 grok.com

---

## 🔐 權限需求

* `"host_permissions": ["https://grok.com/*"]`

所有資料皆僅儲存在本地瀏覽器，不會上傳或分享。

---

## ⚠️ 使用須知

* 本擴充功能依賴 Grok 目前的內部 API。若 xAI 變更網站，本擴充功能可能停止運作，並暫時或無限期從商店下架。

---

## 📜 版本說明

* 此專案先前以「Grok Rate Checker」發佈，版本號最高至 **1.5**。
* 現在重新以 **Grok Usage Watch** 名稱上架，並以 **1.0.2** 為起始版本號。
* 未來版本號將依 Chrome Web Store 釋出進度遞增。

[更新紀錄](./CHANGELOG.md)

---

## 👨‍💻 作者資訊

* 作者：Joshua Wang
* 本工具專為 Grok 重度使用者打造，無論你是開發者、研究員、資料分析師，或是每天頻繁使用 Grok 的一般用戶，都能享受到透明、流暢的使用體驗。

---

## 📬 聯絡方式

有建議或想法嗎？  
歡迎 [提交 issue](https://github.com/JoshuaWang2211/grok-usage-watch/issues)

---

## 📜 授權條款

本專案採用 MIT 授權條款。詳情請參見 [LICENSE](./LICENSE)。