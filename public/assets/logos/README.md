# Company logos

Employer marks for the experience timeline. Each is referenced from `logo` on an
`experience` entry in `src/data/site.js`. The field is optional: omit it and the
row degrades to the company name alone, so a missing file is never a broken
image.

## Provenance

Every file came from the company's own site, unmodified. Retrieved 25 Jul 2026.

| File | Source |
| --- | --- |
| `navex.svg` | `cdn.navex.com/.../NAVEX__Logo_FF4500-RGB.svg`, the `logo` in navex.com's schema.org metadata |
| `speakup.svg` | `cdn.prod.website-files.com/.../SpeakUp_horizontal_green_black.svg`, from speakup.com |
| `globallogic.png` | `globallogic.com/wp-content/uploads/2024/07/Logo.png`, the `logo` in their schema.org metadata |
| `peopleintouch.png` | `peopleintouch.com/wp-content/uploads/2020/01/cropped-PIT-logo-icon-square-192x192.png`, via the Wayback Machine |

People Intouch BV rebranded to SpeakUp, and its domain no longer resolves. Every
archived snapshot of it already carries SpeakUp branding, so the icon above is
the only People Intouch mark still retrievable from their own site. The full
`people intouch` wordmark exists but was not recoverable from any public source.
Drop it in here as `peopleintouch.svg` and update the path in `site.js` if you
want the wordmark instead of the glyph.

## Constraints

SVG preferred, transparent PNG at 2x is fine. Transparency is required: the
timeline applies `filter: brightness(0) invert(1)`, which turns every opaque
pixel flat white, so a logo on a solid background becomes a solid white block.

Colour does not matter for the same reason. Four brand palettes would fight each
other and the accent, so they are all flattened to one white set.

Aspect ratio does not need to match. Height is capped and width is auto, which is
why a square glyph and a 4.4:1 wordmark can sit in the same column.
