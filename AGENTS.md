# Mindful Tabz — Codex Guide

## Project overview

Browser extension for screen time management and site blocking. Built with React 19, TypeScript, Tailwind CSS v4, Vite, and `vite-plugin-web-extension`. Supports Chrome, Firefox, and Safari from a single codebase.

## Build commands

```bash
npm run build:chrome     # → dist/chrome/
npm run build:firefox    # → dist/firefox/
npm run build:all        # Chrome + Firefox
npm run build:safari     # requires Xcode (macOS only)
npm run dev              # Vite dev server for Chrome
npm run dev:firefox      # Vite dev server for Firefox
npx tsc -b               # type-check only (no emit)
```

After `build:chrome`, load `dist/chrome/` as an unpacked extension in `chrome://extensions/`.

## Architecture

```
src/
├── types/index.ts       — all domain interfaces (Site, Group, ScreenTimeEntry, etc.)
├── browser/api.ts       — re-exports webextension-polyfill; use instead of chrome.*
├── lib/                 — StorageEngine, FocusTracker, DomainNormalizer (pure logic, no UI)
├── hooks/               — useStorageState, useSites, useGroups
├── components/          — shared UI: ProgressBar, TabNav, AddSiteForm, SiteCard, GroupCard
├── screens/popup/       — ScreenTimeView, SitesView, GroupsView, PopupRoot
├── screens/dashboard/   — StatsView, BlockListView, GroupsView, SettingsView, DashboardRoot
├── screens/blocked/     — BlockedScreen
├── App.tsx              — thin wrapper → PopupRoot
├── dashboard.tsx        — entry → DashboardRoot
├── blocked.tsx          — entry → BlockedScreen
└── background.ts        — service worker (tab tracking, alarms, blocking logic)

manifests/
├── manifest.base.json   — shared manifest fields
├── manifest.chrome.json — Chrome: service_worker background
└── manifest.firefox.json — Firefox: scripts array, gecko id
```

## Key conventions

**Browser APIs** — Always import from `src/browser/api.ts`, never use `chrome.*` directly:
```typescript
import browser from '../browser/api'
await browser.storage.local.get(['sites'])
```

**New UI components** — Add to `src/components/`. Components that render differently between popup and dashboard accept `variant?: 'popup' | 'dashboard'`.

**New screens/tabs** — Add a new `*View.tsx` in `src/screens/popup/` or `src/screens/dashboard/`, wire it up in the respective `index.tsx`, and add its tab entry to the `TABS` const.

**Types** — Add new domain interfaces to `src/types/index.ts`, not to lib files.

**State** — Components get storage state via `useStorageState()`. Mutations go through `useSites()` or `useGroups()` hooks (thin wrappers over `storageEngine`). Don't call `storageEngine` directly from components — call it from hooks or screen-level index files.

**Multi-browser manifests** — Add browser-specific keys only to the appropriate `manifests/manifest.{browser}.json`. Shared keys go in `manifest.base.json`. `vite.config.ts` deep-merges them at build time.

## TypeScript config

Strict mode is on: `noUnusedLocals`, `noUnusedParameters`. Every import and parameter must be used. Run `npx tsc -b` to verify before committing.

## Data flow

```
Tab event (chrome.tabs.on*) 
  → background.ts 
  → FocusTracker.handleTick() 
  → StorageEngine.recordActivity() 
  → browser.storage.local (persisted)
  → storage.onChanged event
  → useStorageState() subscription
  → React re-render
```

Blocking redirects the active tab to `blocked.html?site=<domain>&reason=daily|session|group`.
