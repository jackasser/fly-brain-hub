#!/usr/bin/env node
// Render public/og.png (1200x630) for link previews (X, Slack, Discord).
// Uses the fly hero SVG straight out of the built home page, so the art never drifts.
// Usage: npm run build && node scripts/make-og.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = fileURLToPath(new URL('..', import.meta.url));
const home = readFileSync(`${root}/dist/index.html`, 'utf8');
const svg = /<svg class="fly-hero[\s\S]*?<\/svg>/.exec(home)?.[0];
if (!svg) throw new Error('fly hero svg not found in dist/index.html; run npm run build first');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;width:1200px;height:630px;overflow:hidden}
  body{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Hiragino Sans","Noto Sans JP",sans-serif;
       background:linear-gradient(135deg,#f7f6f2 0%,#e4f3f0 100%);color:#1c1b18;display:grid;grid-template-columns:1fr 440px;align-items:center;padding:0 64px;box-sizing:border-box}
  h1{font-size:64px;line-height:1.08;letter-spacing:-0.02em;margin:0 0 20px}
  p{font-size:26px;line-height:1.4;color:#5a574f;margin:0 0 28px;max-width:20em}
  .pill{display:inline-block;background:#0f766e;color:#fff;font-weight:600;font-size:22px;padding:8px 18px;border-radius:999px}
  .url{font-size:22px;color:#625e56;margin-left:14px}
  .art svg{width:440px;height:auto;filter:drop-shadow(0 12px 24px rgb(0 0 0 / .15))}
</style></head><body>
  <div><h1>Fly Brain Hub</h1><p>Every project built on the fruit-fly brain: datasets, simulations, bodies, tools and the "fly brain can play X" demos.</p>
  <span class="pill">EN / 日本語</span><span class="url">fly-brain-hub.vercel.app</span></div>
  <div class="art">${svg}</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
writeFileSync(`${root}/public/og.png`, png);
console.log(`wrote public/og.png (${png.length} bytes)`);
