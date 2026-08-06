import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'

// Stamps a unique cache version into the BUILT dist/sw.js at the end of every
// build (the public/sw.js source keeps a readable "v1" default). Each deploy
// therefore gets a fresh cache name and purges the previous generation.
function swCacheVersionPlugin() {
  return {
    name: 'dealroot-sw-cache-version',
    apply: 'build',
    closeBundle() {
      const srcPath = resolve(__dirname, 'public/sw.js')
      const outPath = resolve(__dirname, 'dist/sw.js')
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const src = readFileSync(srcPath, 'utf8')
      const updated = src.replace(
        /CACHE_VERSION = "v[0-9]+"/,
        `CACHE_VERSION = "v${stamp}"`
      )
      mkdirSync(dirname(outPath), { recursive: true })
      writeFileSync(outPath, updated)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), swCacheVersionPlugin()],
})
