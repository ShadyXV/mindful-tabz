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
The project is built with **React**, **TypeScript**, and **Vite**, using a clean architecture to separate logic from UI.

### `/src`
- **`App.tsx`**: The main entry point for the extension popup.
- **`dashboard.tsx`**: The full-page dashboard for management and deep analytics.
- **`background.ts`**: The extension's service worker that handles time tracking and tab blocking logic.
- **`blocked.tsx`**: The custom "Time's Up" page shown when a limit is reached.

### `/src/lib`
- **`StorageEngine.ts`**: The core data layer. It manages all interactions with `chrome.storage.local`, including state persistence and event subscriptions.
- **`FocusTracker.ts`**: Responsible for the precision tracking of active tabs. It calculates time spent and triggers blocking when limits are exceeded.
- **`DomainNormalizer.ts`**: Ensures consistency across URLs (e.g., stripping subdomains or protocols).

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Load into Chrome/Edge:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder.

## 📈 Roadmap & Contributions
Mindful Tabz is an evolving project. I add more features as I use it more. Contributions are welcome! Whether it's a bug fix, a new feature, or improving the UI, feel free to open a PR.
