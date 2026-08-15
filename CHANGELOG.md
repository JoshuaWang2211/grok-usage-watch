# 📜 Changelog – Grok Usage Watch

---

## v1.5.1 - 2026-08-14

* Fixed paid accounts briefly seeing the free-tier panel with frozen numbers whenever the subscription check hit a temporary network error. A failed check now keeps the last good paid view; free accounts still fall back to live free data exactly as before.
* Signing out is now detected from the subscription check itself, so the "Sign in to grok.com" prompt appears immediately — including for paid accounts, whose expired session previously left the old numbers frozen on screen.
* Fixed a short offline stretch wiping a paid panel — or the sign-in prompt — down to "Loading...". A refresh that got no answer at all now keeps what is on screen; an answered-but-empty result still updates honestly.
* Hardened the paid-usage parser against future API shape changes: a response whose known fields no longer decode is treated as a failure — keeping the last good numbers — instead of being displayed as a healthy 0% used. A genuine 0%, such as a fresh account or a just-reset week, still shows correctly.
* Removed the unused `host_permissions` entry from the manifest. The extension only talks to grok.com from inside the grok.com page itself, which needs no extra permission; the install prompt is unchanged.

---

## v1.5.0 - 2026-08-03

* Fixed the panel showing no usage: xAI replaced the quota API, so the fields the extension read were gone and it reported 0 even when the request succeeded.
* Added support for paid plans, which are metered by one weekly usage pool shared across every Grok product rather than by per-model query counts. The extension detects which system applies to your account automatically.
* Paid accounts now see their weekly pool: how much is used, when it resets, and a breakdown by product: Chat, Imagine, Voice and Grok Build.
* Free accounts now show the Fast quota only. The Expert and Heavy rows reported quota for modes a free account cannot select, which looked like headroom that was not really there.
* Removed the "Refill in" countdown. The API never reported when a quota resets, and a locally guessed estimate was wrong whenever the account had also been used in the Grok mobile app. Paid plans show a real reset time, which comes from the server.
* Removed Mini Mode, since collapsing the panel already produced the same compact view.
* Removed the model selection in Settings, along with the Progress Bars toggle. Progress bars are now always on.
* Added drag-to-resize: drag the corner grip instead of choosing from five fixed sizes.
* Added a Reset UI button that restores both position and size.
* Added 24-Hour Time and Hide Breakdown options for paid accounts.
* Added system light/dark theme detection on first run.
* Fixed "Reset Position" restoring a position that was not actually the default.
* Reduced the refresh interval from 5 seconds to once a minute, paused while the tab is hidden.
* Rewrote the store description in all supported languages.

---

## v1.4.0 - 2025-12-31

* Added Mini Mode: compact display for small screens, showing only essential quota info.
* Added optional Progress Bars with color-coded warnings (green > 30%, yellow 10-30%, red < 10%).
* Added "Progress Bars" toggle in Settings to switch between classic and visual modes.
* Renamed "Grok 4 Heavy" to "Heavy" throughout the UI.
* Updated default position for better visibility.
* Simplified short descriptions in all 52 languages (removed specific model version mentions).
* Updated long descriptions to clarify text conversation quota tracking (image/video generation not supported).

---

## v1.3.0 - 2025-08-18

* Added Reset Position button in Settings for easy panel repositioning.
* Improved Settings layout consistency and hover effects.
* Enhanced UI Scale slider interaction and visual feedback.
* Minor UI/UX refinements and bug fixes.
* Now fully localized in all languages officially supported by the Chrome Web Store.

---

## v1.2.0 - 2025-08-17

* Added UI scale options: users can now resize the interface (80%, 90%, 100%, 110%, 120%) to suit their preferences.
* Added language support for Arabic (ar), Hindi (hi), Bengali (bn), Urdu (ur), Hebrew (he), Ukrainian (uk), and Hong Kong Traditional Chinese (zh_HK).

---

## v1.1.0 - 2025-08-16

* Added Settings UI with a simple layout and toggle controls.
* Added dark/light color mode toggle.
* Panel position is now saved and restored across sessions.
* Ensured UI panel stays within the visible browser window at all times.
* Added panel collapse/expand feature with animated toggle.
* Added "About" section.

---

## v1.0.6 - 2025-08-12

* Added "Refill in" countdown to show time remaining until token refill when limit is reached.

---

## v1.0.5 - 2025-08-12

* Removed deprecated Think, DeepSearch, and DeeperSearch, in line with xAI's latest changes.
* Unified token display for all users (free and subscribed); now shows High/Low Effort Tokens.
* Added new languages: Italian (it), Dutch (nl), Turkish (tr), Polish (pl), Indonesian (id), Vietnamese (vi), Thai (th).

---

## v1.0.4 - 2025-07-31

* Added multi-language support for the Chrome Web Store listing using `_locales`.
* Supported display languages: de, en, es, fr, ja, ko, pt\_BR, ru, zh\_CN, zh\_TW.
* Minor UI/UX improvements.

---

## v1.0.3 - 2025-07-30

* Added `background.js`: Clicking the extension icon now opens [grok.com](https://grok.com) in a new tab.
* Updated icon visuals for better visibility.

---

## v1.0.2 - 2025-07-29

* Initial release of Grok Usage Watch.
* Real-time display of remaining Grok tokens and usage stats.
* Supports Grok 3 and Grok 4.
