# 🌟 Grok Usage Watch – Rate Limit Tracker

🔎 Real-time display of your remaining Grok usage

📘 [View in Traditional Chinese / 繁體中文](./README.zh-TW.md)

---

## 📌 Introduction

**Grok Usage Watch** is a lightweight browser extension that displays your remaining Grok usage directly on Grok.com.

It features a clean, draggable floating window that keeps your usage always visible.

---

## ✨ Key Features

* Real-time usage tracking
* Works with both free and paid Grok accounts
* Draggable, floating overlay UI
* Drag the corner grip to resize the panel
* Collapse to a compact indicator when you want it out of the way
* Light/Dark mode toggle

---

## 📊 What You See

Grok meters free and paid accounts in completely different ways, so the panel shows
whichever one applies to your account.

| Account | Panel shows |
|---|---|
| Free | Remaining Fast queries |
| Paid plan | Weekly usage pool — how much is used, when it resets, and a breakdown by product such as Chat and Imagine |

---

## 📸 Screenshots

![Grok Usage Watch screenshot](assets/screenshot.png)

---

![Grok Usage Watch screenshot2](assets/screenshot2.png)

---

## 🛠 Installation

Install directly from the Chrome Web Store: [Click here](https://chrome.google.com/webstore/detail/bmpboaihdkpkjehbceegdmndkonlpdge)

---

## 🧩 Project Files

* `manifest.json`: Permissions and extension setup
* `content.js`: Injected script that fetches and displays usage data
* `background.js`: Opens Grok.com when the extension icon is clicked

---

## 🔒 Privacy & Permissions

* `"host_permissions": ["https://grok.com/*"]`  

Everything runs locally in your browser. No data is collected, stored, or shared.

---

## ⚠️ Important Note

This extension depends on Grok's current internal API. If xAI makes changes to the website, this extension may stop working and be temporarily or indefinitely removed from the store.

---

## 📜 Changelog

* This project was previously released as “Grok Rate Checker” (up to version 1.5).
* Now relaunched as Grok Usage Watch, starting from version 1.0.2.
* Version numbers will follow Chrome Web Store releases going forward.  

Please see [CHANGELOG](./CHANGELOG.md) for the full update history.

---

## 👨‍💻 Author

* Created by Joshua Wang
* Designed for heavy Grok users, from developers and researchers to data analysts and enthusiasts who want a smooth, transparent experience.

---

## 📬 Feedback

Got suggestions or ideas?  
Feel free to [open an issue](https://github.com/JoshuaWang2211/grok-usage-watch/issues).

---

## 📜 License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.