# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OneTabs is a Chrome browser extension that saves and manages browser tabs and tab groups. It's built with Vue 3, Vite, Tailwind CSS, and PrimeVue, following the Chrome Manifest V3 specification.

## Development Commands

```bash
# Start development server (runs on port 5173)
npm run dev

# Build the extension for Chrome
npm run build

# Preview production build
npm run preview
```

## Project Architecture

### Chrome Extension Structure

This is a **Chrome Manifest V3 extension** that consists of:

1. **Background Service Worker** (`src/assets/background.js`)
   - Listens for extension icon clicks and messages
   - Implements the core tab-saving logic via `saveTabs()` function
   - Handles tab groups, ungrouped tabs, and pinned groups
   - Automatically creates or refreshes the OneTab interface page
   - Closes saved tabs after storing them

2. **Extension UI** (Vue 3 SPA)
   - Entry point: `index.html` → `src/main.js` → `src/App.vue`
   - Main view: `src/views/TabGroups.vue` (displays saved tab groups)
   - Uses Vue Router with hash-based routing for extension compatibility

3. **Build Process** (custom Vite plugin in `vite.config.js`)
   - Custom `chromeExtensionPlugins()` plugin handles extension-specific files
   - Automatically generates icons (16x16, 48x48, 128x128) from `src/assets/logo.png` using Sharp
   - Copies `manifest.json` and `background.js` to dist folder
   - Creates default favicon for tabs

### State Management

Uses **Pinia** for state management with two main stores:

- **`tabsStore`** (`src/stores/tabsStore.js`): Manages individual tabs and tab groups
- **`groupsStore`** (`src/stores/groupsStore.js`): Manages group-level operations

Both stores interact with Chrome storage via utility functions.

### Storage Architecture

**Critical**: The codebase has two storage systems with different data structures:

1. **Pinia Store Storage** (used by stores):
   - Key: `onetabs_data` / `onetabs_groups`
   - Structure: `{ tabs: [], tabGroups: [] }`

2. **Background Script Storage** (used by `background.js`):
   - Key: `tabGroups` (note: different key!)
   - Structure: Array of group objects with properties:
     - `date`: timestamp
     - `type`: 'ungrouped' or 'grouped'
     - `title`: group name
     - `tabs`: array of tab objects
     - `groupInfo`: Chrome tab group metadata (for grouped type)
     - `isPinned`: boolean for pinned groups

**Storage Utilities** (`src/utils/chrome-storage.js`):
- Provides abstraction over Chrome storage API
- Falls back to localStorage in non-extension environment
- Two storage types: `local` (large capacity) and `sync` (cross-device, limited)
- Contains hardcoded mock data in `getTabGroups()` function (lines 213-1325)

### UI Framework

- **Tailwind CSS 4.x**: Utility-first styling with `tailwindcss-primeui` plugin
- **PrimeVue 4.x**: Component library with Aura theme preset
- Auto-imports PrimeVue components via `unplugin-vue-components`

### Path Aliasing

The project uses `@` alias for `src/` directory in imports:
```js
import foo from '@/utils/bar'  // resolves to src/utils/bar
```

## Key Implementation Details

### Tab Saving Flow

1. User clicks extension icon → `background.js` receives click event
2. `saveTabs()` function executes:
   - Queries all tabs in current window
   - Separates tabs by group (grouped vs ungrouped)
   - Separates existing saved groups by pin status
   - Creates new group objects for current tabs
   - Saves to `chrome.storage.local` with key `tabGroups`
   - Opens or refreshes OneTab interface
   - Closes all saved tabs except OneTab page

3. OneTab UI loads:
   - Reads from `chrome.storage.local.tabGroups`
   - Displays saved groups with restore functionality

### Environment Detection

The extension supports both Chrome extension and web browser environments:
- `isExtensionEnvironment()` checks for Chrome extension APIs
- Storage functions automatically fall back to localStorage when not in extension
- This allows development and preview in regular browser

## Important Notes

- The manifest version is synchronized across `package.json` (0.0.4) and `src/assets/manifest.json`
- Logo source must exist at `src/assets/logo.png` for icon generation to work
- The extension requires permissions: `tabs`, `storage`, `tabGroups`
- Settings view (`views/Settings.vue`) exists but is currently disabled in router
- There's mock/test data hardcoded in `chrome-storage.js` line 213 that should be replaced with actual storage retrieval in production
