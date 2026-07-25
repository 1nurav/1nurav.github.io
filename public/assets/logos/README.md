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

## Files are stored dark-background ready

The timeline applies no filter, so whatever is in these files is what renders.
Brand colour is preserved, but these marks are drawn for white pages, and two of
them were invisible on `--bg` (`#08080a`). Measured against it, by share of ink
below a 3:1 contrast ratio:

| | before | after |
| --- | --- | --- |
| `navex.svg` | 0% | 0%, untouched |
| `peopleintouch.png` | 0% | 0%, untouched |
| `speakup.svg` | 64% | 0% |
| `globallogic.png` | 100% | 0% |

Navex keeps its `#FF4500` and PeopleInTouch its blue, both unmodified.

**`speakup.svg`** declares exactly one colour, `#00b68d` on the mark, via a
`.cls-1` class. Its wordmark had no fill at all and so fell back to SVG's default
black. A `fill="#f1f1ec"` on the root now covers those paths, while the mark
stays green because a class rule outranks an inherited presentation attribute.
The brand colour is untouched; only the neutral text moved.

**`globallogic.png`** is monochrome, a single navy across 100% of its ink, so it
carries no hue to preserve. Its RGB is recoloured to `#f1f1ec` with alpha left
alone, which keeps the anti-aliased edges clean. This is the same reversed
treatment the company uses on dark backgrounds; neither they nor SpeakUp publish
a reversed file, so these were produced here.

## Adding or replacing a mark

SVG preferred, transparent PNG at 2x is fine. Transparency is required.

Check it against `#08080a` before committing. If it is dark, either find the
company's official reversed variant or lift only its neutral ink, leaving any
accent hue alone.

Aspect ratio does not need to match. Height is capped and width is auto, which is
why a square glyph and a 4.4:1 wordmark can sit in the same column.
