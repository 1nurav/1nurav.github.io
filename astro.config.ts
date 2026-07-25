import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Deployed to https://1nurav.github.io — repo name is <user>.github.io,
// so the site lives at the domain root and needs no `base`.
export default defineConfig({
  site: 'https://1nurav.github.io',
  // Build-time only: emits sitemap-index.xml for crawlers and ships no client JS,
  // so it costs a visitor nothing.
  integrations: [sitemap()],
  // A font subset was being inlined as base64 into the stylesheet, which is
  // render-blocking: bytes that delay first paint to save one cached request.
  // 0 keeps every asset external.
  vite: { build: { assetsInlineLimit: 0 } },
});
