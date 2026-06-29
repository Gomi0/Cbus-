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

/* ─── Logical properties → physical fallbacks ──────────────────────────────
   Chrome 50 doesn't support CSS logical properties (Chrome 87+):
   padding-inline, padding-block, margin-inline, margin-block, inset
 ─────────────────────────────────────────────────────────────────────────── */

function fixLogicalProperties(css) {
  // padding-inline: X  →  padding-left: X; padding-right: X
  css = css.replace(/padding-inline\s*:\s*([^;{}]+)/g, (_, v) => {
    v = v.trim()
    return `padding-left:${v};padding-right:${v}`
  })
  // padding-block: X  →  padding-top: X; padding-bottom: X
  css = css.replace(/padding-block\s*:\s*([^;{}]+)/g, (_, v) => {
    v = v.trim()
    return `padding-top:${v};padding-bottom:${v}`
  })
  // margin-inline: X  →  margin-left: X; margin-right: X
  css = css.replace(/margin-inline\s*:\s*([^;{}]+)/g, (_, v) => {
    v = v.trim()
    return `margin-left:${v};margin-right:${v}`
  })
  // margin-block: X  →  margin-top: X; margin-bottom: X
  css = css.replace(/margin-block\s*:\s*([^;{}]+)/g, (_, v) => {
    v = v.trim()
    return `margin-top:${v};margin-bottom:${v}`
  })
  // inset: X  →  top: X; right: X; bottom: X; left: X
  css = css.replace(/\binset\s*:\s*([^;{}]+)/g, (_, v) => {
    v = v.trim()
    return `top:${v};right:${v};bottom:${v};left:${v}`
  })
  return css
}

/* ─── flex gap → margin fallback ───────────────────────────────────────────
   Chrome 50 doesn't support gap in flex containers (Chrome 84+ only).
   We add >*+* margin rules as fallback alongside the gap property.
 ─────────────────────────────────────────────────────────────────────────── */

function addFlexGapFallbacks(css) {
  const additions = []

  // .gap-X { gap: V } → .gap-X > * + * { margin-left: V; margin-top: V }
  // margin-left covers flex-row (most common), margin-top covers flex-col
  const gapRe = /\.(gap-[\w.\\]+)\{gap:([^}]+)\}/g
  let m
  while ((m = gapRe.exec(css)) !== null) {
    const cls = m[1], val = m[2].trim()
    additions.push(`.${cls}>*+*{margin-left:${val};margin-top:${val}}`)
  }

  // .gap-x-X { column-gap: V } → margin-left fallback only
  const gapXRe = /\.(gap-x-[\w.\\]+)\{column-gap:([^}]+)\}/g
  while ((m = gapXRe.exec(css)) !== null) {
    const cls = m[1], val = m[2].trim()
    additions.push(`.${cls}>*+*{margin-left:${val}}`)
  }

  // .gap-y-X { row-gap: V } → margin-top fallback only
  const gapYRe = /\.(gap-y-[\w.\\]+)\{row-gap:([^}]+)\}/g
  while ((m = gapYRe.exec(css)) !== null) {
    const cls = m[1], val = m[2].trim()
    additions.push(`.${cls}>*+*{margin-top:${val}}`)
  }

  // For flex-col containers, reset the margin-left added above
  // flex-col + gap-X: override to margin-left:0, keep margin-top
  // We do this by adding a rule that targets flex-col+gap-X combos
  // Since utilities are separate classes, we combine them here
  const gapVals = {}
  const gapRe2 = /\.(gap-[\w.\\]+)\{gap:([^}]+)\}/g
  while ((m = gapRe2.exec(css)) !== null) {
    gapVals[m[1]] = m[2].trim()
  }
  for (const [cls, val] of Object.entries(gapVals)) {
    // When flex-col is on the same element as gap-X, margin-left should be 0
    additions.push(`.flex-col.${cls}>*+*,.flex-col >.${cls}>*+*{margin-left:0}`)
    additions.push(`.flex-col.${cls}>*+*{margin-top:${val}}`)
  }

  return css + additions.join('')
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
        css = fixLogicalProperties(css)                                 // logical → physical
        css = addFlexGapFallbacks(css)                                  // flex gap → margins
        asset.source = css
      }
    },
  }
}

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    chrome50CssPlugin(),
    legacy({
      targets: ['chrome >= 50'],
      modernPolyfills: true,
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    }),
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor'
          }
          if (id.includes('node_modules/react-router-dom')) {
            return 'router'
          }
        },
      },
    },
  },
})
