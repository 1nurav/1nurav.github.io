import { defineConfig } from 'astro/config';

// Deployed to https://1nurav.github.io — repo name is <user>.github.io,
// so the site lives at the domain root and needs no `base`.
export default defineConfig({
  site: 'https://1nurav.github.io',
  // A font subset was being inlined as base64 into the stylesheet, which is
  // render-blocking: bytes that delay first paint to save one cached request.
  // 0 keeps every asset external.
  vite: { build: { assetsInlineLimit: 0 } },
});
