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

  window.addEventListener(
    'mousemove',
    (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    },
    { passive: true }
  );

  const move = (el, x, y) => {
    if (el) el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
  };

  const frame = () => {
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

    if (bar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    }

    letters.forEach((el) => {
      const r = el.getBoundingClientRect();
      const dx = mouse.x - (r.left + r.width / 2);
      const dy = mouse.y - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy);
      const k = dist < MAGNET_REACH ? Math.pow(1 - dist / MAGNET_REACH, 2) : 0;
      const tx = -dx * 0.1 * k;
      const ty = -dy * 0.16 * k;
      el.style.transform =
        'translate3d(' + tx + 'px,' + ty + 'px,0) rotate(' + tx * 0.03 + 'deg)';
    });

    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
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
