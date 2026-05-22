import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import webExtension from 'vite-plugin-web-extension'
import tailwindcss from '@tailwindcss/vite'
import baseManifest from './manifests/manifest.base.json'
import chromeManifest from './manifests/manifest.chrome.json'
import firefoxManifest from './manifests/manifest.firefox.json'

type ManifestObj = Record<string, unknown>

function deepMerge(base: ManifestObj, override: ManifestObj): ManifestObj {
  const result = { ...base }
  for (const key of Object.keys(override)) {
    const b = result[key]
    const o = override[key]
    if (
      b !== null && o !== null &&
      typeof b === 'object' && typeof o === 'object' &&
      !Array.isArray(b) && !Array.isArray(o)
    ) {
      result[key] = deepMerge(b as ManifestObj, o as ManifestObj)
    } else {
      result[key] = o
    }
  }
  return result
}

export default defineConfig(() => {
  const browser = process.env.BROWSER ?? 'chrome'
  const override = browser === 'firefox' ? firefoxManifest : chromeManifest
  const manifest = deepMerge(baseManifest as ManifestObj, override as ManifestObj)

  return {
    plugins: [
      react(),
      tailwindcss(),
      webExtension({
        manifest: () => manifest as object,
        browser,
        additionalInputs: ['blocked.html'],
      }),
    ],
    build: {
      outDir: `dist/${browser}`,
    },
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        port: 5173,
      },
    },
  }
})
