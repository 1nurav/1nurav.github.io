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

/* mailto is unreliable — plenty of visitors have no mail client wired up, so the
   big address copies instead. The href stays a real mailto, so right-click,
   middle-click and the no-JS path all still behave. */
function startCopyEmail() {
  const link = $('[data-copy-email]');
  const note = $('[data-copy-note]');
  if (!link) return;
  const original = note ? note.textContent : '';
  let timer;

  const confirm = () => {
    if (!note) return;
    note.textContent = 'copied. go write something nice';
    note.classList.add('copied');
    clearTimeout(timer);
    timer = setTimeout(() => {
      note.textContent = original;
      note.classList.remove('copied');
    }, 2200);
  };

  // execCommand fallback for insecure origins, where navigator.clipboard is absent.
  const legacy = (addr) => {
    const ta = document.createElement('textarea');
    ta.value = addr;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch (err) {}
    ta.remove();
    confirm();
  };

  link.addEventListener('click', (e) => {
    e.preventDefault();
    const addr = link.getAttribute('data-copy-email');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(addr).then(confirm, () => legacy(addr));
    } else {
      legacy(addr);
    }
  });
}

/* Sector timing. Three sectors, because a lap has three: each is a third of the
   scrollable range, so the strip is a real position readout rather than four
   arbitrary section widths. Leaving a sector sets it, and the quickest sector of
   the visit goes purple. That is the one piece of F1 grammar a fan needs no
   explanation for, and it degrades to an ordinary progress bar for everyone else.
   Timing starts on first scroll, not on load, so leaving the tab parked on the
   hero does not bank a fake 40-second sector one. */
const SECTORS = 3;

function startSectorTiming() {
  const track = $('[data-sectors]');
  if (!track) return null;

  const cells = Array.from(track.querySelectorAll('.sector')).map((el) => ({
    el,
    fill: el.querySelector('.sector-fill'),
    pb: 0,          // best time this visit for this sector
    lastWasPb: false,
    set: false,
  }));
  if (!cells.length) return null;

  let maxScroll = 0;
  let current = -1;
  let enteredAt = 0;
  let best = -1;
  let started = false;

  const layout = () => {
    maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  };

  /* Re-sorted on every completed sector, which is what makes the strip feel live:
     purple moves to whichever sector is currently quickest, and a sector you
     re-read faster than before flips from yellow to green. */
  const recolour = () => {
    let bestIdx = -1;
    let bestTime = Infinity;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].set && cells[i].pb < bestTime) {
        bestTime = cells[i].pb;
        bestIdx = i;
      }
    }
    best = bestIdx;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      c.el.classList.remove('t-slow', 't-pb', 't-best');
      if (!c.set) continue;
      if (i === bestIdx) c.el.classList.add('t-best');
      else c.el.classList.add(c.lastWasPb ? 't-pb' : 't-slow');
    }
  };

  const update = () => {
    // A page shorter than the viewport has no sectors to time; show it complete.
    const p = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 1;
    const scaled = p * SECTORS;

    for (let i = 0; i < SECTORS; i++) {
      cells[i].fill.style.width = Math.max(0, Math.min(1, scaled - i)) * 100 + '%';
    }

    const idx = Math.min(SECTORS - 1, Math.floor(scaled));
    if (idx !== current) {
      if (current > -1 && started) {
        const c = cells[current];
        const t = performance.now() - enteredAt;
        // Only credit a sector actually read, not one flown past while dragging
        // the scrollbar, which would set an unbeatable 80ms best every time.
        if (t > 400) {
          // First run through a sector is a personal best by definition.
          c.lastWasPb = c.pb === 0 || t < c.pb;
          if (c.lastWasPb) c.pb = t;
          c.set = true;
          recolour();
        }
      }
      current = idx;
      enteredAt = performance.now();
    }
  };

  const begin = () => {
    if (started) return;
    started = true;
    enteredAt = performance.now();
  };

  layout();
  update();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); update(); });
  return { update, layout, begin };
}

function startMotion() {
  const ring = $('[data-cursor-ring]');
  const dot = $('[data-cursor-dot]');
  const aura = $('[data-aura]');
  const sectors = startSectorTiming();

  /* The cursor ring, dot and aura are pointer-device flourishes. The timing strip
     is not: it is the page's progress indicator, and gating the whole loop behind
     (hover: hover) is why phones previously had no progress bar at all. */
  const pointerFx = window.matchMedia('(hover: hover)').matches;
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
    if (sectors) sectors.layout();
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

    if (pointerFx) {
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
    }

    if (sectors) sectors.update();

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
      !pointerFx ||
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

  if (pointerFx) {
    window.addEventListener(
      'mousemove',
      (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        wake();
      },
      { passive: true }
    );
  }
  window.addEventListener(
    'scroll',
    () => {
      if (sectors) sectors.begin();
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
  // Not motion, so it runs regardless of the reduced-motion preference.
  startCopyEmail();
  // Skipped when reduced, so nothing is ever left hidden waiting on a reveal.
  if (!reduced) startReveals();
  // Always run: the loop owns the timing strip, and decides internally whether
  // the cursor flourishes apply. Reduced motion still opts out of the lot.
  if (!reduced) startMotion();
}
