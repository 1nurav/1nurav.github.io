// All runtime behaviour for the site. One rAF loop, one observer, no libraries.

const PALETTE = ['#d6ff3f', '#ff5d3a', '#5cc8ff', '#f5f5f0'];
const LERP_CURSOR = 0.14;
const LERP_AURA = 0.045;
const MAGNET_REACH = 420;

const $ = (sel) => document.querySelector(sel);

/* Real zone abbreviation (IST, CEST, PDT) where the browser has one for the
   visitor. Chrome only returns it under a matching locale, so try a few. */
function zoneLabel() {
  let tz = '';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch (e) {}

  const hints = {
    Asia: 'en-IN', Europe: 'en-GB', Australia: 'en-AU',
    America: 'en-US', Africa: 'en-ZA', Pacific: 'en-NZ',
  };
  const candidates = [navigator.language, hints[tz.split('/')[0]], 'en-GB', 'en-US'].filter(Boolean);

  for (const loc of candidates) {
    try {
      const parts = new Intl.DateTimeFormat(loc, {
        timeZone: tz || undefined,
        timeZoneName: 'short',
      }).formatToParts(new Date());
      const val = (parts.find((p) => p.type === 'timeZoneName') || {}).value || '';
      if (val && !/^(GMT|UTC)/i.test(val)) return val;
    } catch (e) {}
  }
  if (tz) return tz.split('/').pop().replace(/_/g, ' ');
  const off = -new Date().getTimezoneOffset() / 60;
  return 'utc' + (off >= 0 ? '+' : '') + off;
}

function startClock() {
  const clock = $('[data-clock]');
  const zone = $('[data-zone]');
  if (zone) zone.textContent = zoneLabel();
  if (!clock) return;
  const tick = () => {
    clock.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
  };
  tick();
  setInterval(tick, 1000);
}

function startReveals() {
  const items = Array.from(document.querySelectorAll('[data-reveal]'));
  if (!items.length) return;

  // Only hide what is still below the fold, so above-the-fold content never flashes.
  items.forEach((el) => {
    if (el.getBoundingClientRect().top > window.innerHeight * 0.92) el.classList.add('is-hidden');
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.remove('is-hidden');
        io.unobserve(e.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px' }
  );
  items.forEach((el) => io.observe(el));
}

function startAccentCycling() {
  let i = 0;
  const cycle = () => {
    i = (i + 1) % PALETTE.length;
    document.documentElement.style.setProperty('--acc', PALETTE[i]);
    const egg = $('[data-egg]');
    if (egg) egg.textContent = 'nice. keep going';
  };
  const trigger = $('[data-accent-toggle]');
  if (trigger) trigger.addEventListener('click', cycle);
  window.addEventListener('keydown', (e) => {
    // Bare "v" only. Without this, Cmd/Ctrl+V recolours the site on every paste.
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'v' || e.key === 'V') cycle();
  });
}

function startPointerMotion() {
  const ring = $('[data-cursor-ring]');
  const dot = $('[data-cursor-dot]');
  const aura = $('[data-aura]');
  const bar = $('[data-progress]');
  const letters = Array.from(document.querySelectorAll('[data-kin]'));

  const mouse = { x: -999, y: -999 };
  const ringPos = { x: -999, y: -999 };
  const auraPos = { x: -999, y: -999 };

  /* Geometry is measured once and cached rather than read per frame. Two reasons.
     getBoundingClientRect() and scrollHeight both force a synchronous layout, so
     reading them for every letter on every frame meant ~10 layout flushes at
     60fps forever. And the rect of a transformed element reports the *moved* box,
     so the magnet was feeding its own displacement back into its input: it
     settled near an 11% pull where the constant asks for 10%, with a distorted
     falloff curve. Caching resting centres in document space fixes both. */
  let bases = [];
  let lettersBottom = 0;
  let maxScroll = 0;
  let pulled = false;
  const lastTf = new Array(letters.length).fill('');

  const measure = () => {
    // Clear transforms first so we capture resting positions, not pulled ones.
    letters.forEach((el) => {
      el.style.transform = '';
    });
    const sx = window.scrollX;
    const sy = window.scrollY;
    bases = letters.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 + sx, y: r.top + r.height / 2 + sy };
    });
    lettersBottom = bases.reduce((m, b) => Math.max(m, b.y), 0) + MAGNET_REACH;
    maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    lastTf.fill('');
    pulled = false;
  };

  const move = (el, x, y) => {
    if (el) el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
  };

  /* The loop parks itself once everything has caught up, and any input wakes it.
     Someone who has stopped moving the pointer to actually read the page should
     cost nothing, rather than 60 wasted frames a second until the tab closes. */
  let running = false;
  let nudged = false;

  const wake = () => {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  };

  const frame = () => {
    const scrolledOrResized = nudged;
    nudged = false;

    ringPos.x += (mouse.x - ringPos.x) * LERP_CURSOR;
    ringPos.y += (mouse.y - ringPos.y) * LERP_CURSOR;
    auraPos.x += (mouse.x - auraPos.x) * LERP_AURA;
    auraPos.y += (mouse.y - auraPos.y) * LERP_AURA;

    const visible = mouse.x > -900 ? '1' : '0';
    move(ring, ringPos.x, ringPos.y);
    move(dot, mouse.x, mouse.y);
    move(aura, auraPos.x, auraPos.y);
    if (ring) ring.style.opacity = visible;
    if (dot) dot.style.opacity = visible;

    if (bar) bar.style.width = (maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0) + '%';

    const sx = window.scrollX;
    const sy = window.scrollY;

    if (sy < lettersBottom) {
      for (let i = 0; i < letters.length; i++) {
        const b = bases[i];
        const dx = mouse.x - (b.x - sx);
        const dy = mouse.y - (b.y - sy);
        const dist = Math.hypot(dx, dy);
        const k = dist < MAGNET_REACH ? Math.pow(1 - dist / MAGNET_REACH, 2) : 0;
        const tx = -dx * 0.1 * k;
        const ty = -dy * 0.16 * k;
        const tf = 'translate3d(' + tx + 'px,' + ty + 'px,0) rotate(' + tx * 0.03 + 'deg)';
        // Skip the write when nothing moved, so idle letters cost no style work.
        if (tf !== lastTf[i]) {
          letters[i].style.transform = tf;
          lastTf[i] = tf;
        }
      }
      pulled = true;
    } else if (pulled) {
      // Released once on the way out rather than re-cleared every frame.
      letters.forEach((el) => {
        el.style.transform = '';
      });
      lastTf.fill('');
      pulled = false;
    }

    const settled =
      Math.abs(mouse.x - ringPos.x) < 0.25 &&
      Math.abs(mouse.y - ringPos.y) < 0.25 &&
      Math.abs(mouse.x - auraPos.x) < 0.25 &&
      Math.abs(mouse.y - auraPos.y) < 0.25;

    if (settled && !scrolledOrResized) {
      running = false;
      return;
    }
    requestAnimationFrame(frame);
  };

  window.addEventListener(
    'mousemove',
    (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      wake();
    },
    { passive: true }
  );
  window.addEventListener(
    'scroll',
    () => {
      nudged = true;
      wake();
    },
    { passive: true }
  );
  window.addEventListener('resize', () => {
    measure();
    nudged = true;
    wake();
  });

  measure();
  /* Webfonts land after first paint under font-display: swap, and the hero name
     is set in Syne, so the letters reflow when it swaps in. Without this the
     cached centres describe the fallback's metrics and the magnet pulls toward
     the wrong spot for the life of the page. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  wake();
}

export function init() {
  // The CSS reduced-motion block only flattens durations; the pointer loop is JS,
  // and it is the tracking cursor, the drifting aura, and the letters that lunge
  // at the mouse. Those are exactly what the setting is asking us to stop.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  startClock();
  startAccentCycling();
  // Skipped when reduced, so nothing is ever left hidden waiting on a reveal.
  if (!reduced) startReveals();
  if (!reduced && window.matchMedia('(hover: hover)').matches) startPointerMotion();
}
