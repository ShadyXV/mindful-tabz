# Mindful Tabz: Focus & Time Manager

Mindful Tabz is an open-source browser extension designed for digital well-being. It helps you track your screen time, set daily limits for specific domains, and organize them into groups to maintain focus.

## 🛡️ Privacy First: Your Data is Your Own
Mindful Tabz is built on the philosophy that **your data belongs to you**. 
- **No External Servers:** Your browsing habits and limits are stored locally on your machine using `chrome.storage.local`.
- **Open Source:** Build and use your own version. Auditable, transparent, and private by design.
- **Offline First:** Works entirely without an internet connection.

## 🚀 Key Features
- **Site Blocking:** Set daily and session-based time limits for distracting websites.
- **Resource Groups:** Group domains (e.g., "Social Media") and set a collective time quota.
- **Real-time Analytics:** Track exactly where your time goes with live-updating charts.
- **Beautiful UI:** A modern, dark-themed interface built with React and Tailwind CSS.

## 🏗️ Code Structure

The project uses React, TypeScript, Vite, and Tailwind CSS v4, with a layered architecture:

```
src/
├── types/           # Shared TypeScript interfaces (Site, Group, etc.)
├── browser/api.ts   # Single re-export of webextension-polyfill (use instead of chrome.*)
├── lib/             # Core business logic — StorageEngine, FocusTracker, DomainNormalizer
├── hooks/           # useStorageState, useSites, useGroups
├── components/      # Shared UI atoms — ProgressBar, TabNav, AddSiteForm, SiteCard, GroupCard
├── screens/
│   ├── popup/       # Popup views: ScreenTimeView, SitesView, GroupsView
│   ├── dashboard/   # Dashboard views: StatsView, BlockListView, GroupsView, SettingsView
│   └── blocked/     # BlockedScreen
├── App.tsx          # Thin wrapper → PopupRoot
├── dashboard.tsx    # Entry point → DashboardRoot
├── blocked.tsx      # Entry point → BlockedScreen
└── background.ts    # Service worker — tab tracking, alarms, blocking
```

`manifests/` holds browser-specific manifest overrides merged at build time.

## 🛠️ Development

### Prerequisites
- Node.js v18+
- npm

### Install dependencies
```bash
npm install
```

### Dev server (Chrome, with hot reload)
```bash
npm run dev
```

Then load the extension in Chrome:
1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `dist/chrome` folder
4. After code changes, click the reload icon on the extension card

### Dev server (Firefox)
```bash
npm run dev:firefox
```

## 📦 Building for browsers

### Chrome / Chromium
```bash
npm run build:chrome
# Output: dist/chrome/
```

Load in Chrome: `chrome://extensions/` → Developer mode → Load unpacked → `dist/chrome/`

### Firefox
```bash
npm run build:firefox
# Output: dist/firefox/
```

Load in Firefox: `about:debugging` → This Firefox → Load Temporary Add-on → select `dist/firefox/manifest.json`

To package a signed `.zip` for Firefox Add-ons (AMO):
```bash
npm run package:firefox
# Output: dist/packages/
```

### Safari
Safari requires Xcode and macOS:
```bash
npm run build:safari
```

This builds the extension and runs Apple's `safari-web-extension-converter` to generate an Xcode project in `safari-xcode/`. Open that project in Xcode to build and sign for the App Store.

### All browsers (Chrome + Firefox)
```bash
npm run build:all
```

## 🌐 Multi-browser architecture

All browser API calls go through `src/browser/api.ts` (a re-export of `webextension-polyfill`), which normalizes `browser.*` across Chrome, Firefox, and Safari — never use `chrome.*` directly.

Browser-specific manifest fields live in:
- `manifests/manifest.base.json` — shared fields
- `manifests/manifest.chrome.json` — Chrome overrides (`service_worker`)
- `manifests/manifest.firefox.json` — Firefox overrides (`scripts` array, `browser_specific_settings.gecko`)

`vite.config.ts` merges base + browser override at build time based on the `BROWSER` env var.

## 📈 Roadmap & Contributions

Mindful Tabz is an evolving project. Contributions are welcome — bug fixes, new features, or UI improvements. Feel free to open a PR.
