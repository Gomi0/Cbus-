import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import legacy from '@vitejs/plugin-legacy'

/* ─── Chrome 50 CSS compatibility plugin ───────────────────────────────────
   Tailwind v4 outputs 3 CSS features that Chrome 50 doesn't support:
   1. @layer  (Chrome 99+) — Chrome 50 ignores the entire block → no styles at all
   2. @property (Chrome 85+) — CSS custom property type declarations
   3. color-mix() (Chrome 111+) — used for opacity variants

   Fix: unwrap @layer blocks, strip @property, fall back color-mix() to base color.
 ─────────────────────────────────────────────────────────────────────────── */

function unwrapLayers(css) {
  let out = '', i = 0
  while (i < css.length) {
    if (css.startsWith('@layer', i)) {
      let j = i + 6
      while (j < css.length && css[j] !== '{' && css[j] !== ';') j++
      if (j < css.length && css[j] === ';') {
        i = j + 1                              // @layer name; → remove entirely
      } else if (j < css.length && css[j] === '{') {
        let depth = 1, k = j + 1
        while (k < css.length && depth > 0) {
          if (css[k] === '{') depth++
          else if (css[k] === '}') depth--
          k++
        }
        out += css.slice(j + 1, k - 1)        // @layer name { … } → unwrap content
        i = k
      } else {
        out += css[i++]
      }
    } else {
      out += css[i++]
    }
  }
  return out
}

function fixColorMix(css) {
  let out = '', i = 0
  while (i < css.length) {
    if (css.startsWith('color-mix(', i)) {
      let depth = 1, j = i + 10
      while (j < css.length && depth > 0) {
        if (css[j] === '(') depth++
        else if (css[j] === ')') depth--
        j++
      }
      const inner = css.slice(i + 10, j - 1)  // content inside color-mix(…)
      const cs = inner.indexOf(',')            // skip color space (e.g. "in oklab")
      if (cs !== -1) {
        const rest = inner.slice(cs + 1).trim()
        // Find first argument: scan until comma at depth-0, then strip trailing percentage
        let k = 0, d = 0
        while (k < rest.length) {
          if (rest[k] === '(') d++
          else if (rest[k] === ')') d--
          else if (rest[k] === ',' && d === 0) break
          k++
        }
        out += rest.slice(0, k).trim().replace(/\s+[\d.]+%$/, '') || 'currentcolor'
      } else {
        out += 'currentcolor'
      }
      i = j
    } else {
      out += css[i++]
    }
  }
  return out
}

function chrome50CssPlugin() {
  return {
    name: 'chrome50-css-compat',
    apply: 'build',
    generateBundle(_, bundle) {
      for (const asset of Object.values(bundle)) {
        if (asset.type !== 'asset' || !asset.fileName.endsWith('.css')) continue
        let css = String(asset.source)
        css = css.replace(/@property\s+--[\w-]+\s*\{[^}]*\}/g, '')   // strip @property
        css = unwrapLayers(css)                                         // unwrap @layer
        css = fixColorMix(css)                                          // fallback color-mix()
        asset.source = css
      }
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    chrome50CssPlugin(),
    legacy({
      targets: ['chrome >= 50'],
      modernPolyfills: true,
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
  },
})
